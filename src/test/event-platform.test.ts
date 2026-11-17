import { describe, it, expect } from "vitest";
import { normalizeNationalId, hasValidCheckDigit, normalizeAndValidateNationalId } from "@/platform/identity";
import { SOURCE_RANK, rankOf, isSourceName, resolveFieldUpdate, isEmptyValue, decideOwnership } from "@/platform/sources";
import type { FieldOwnership, SourceRank, PrecedenceDecision } from "@/platform/sources";
import {
  decideFailure, decideOrdering, decideInbound, routeTargets, contentHash, canonicalJson, parseEnvelope, validateQueuePolicy,
  MAX_BATCH_SIZE, DEFAULT_VISIBILITY_TIMEOUT_SEC, DEFAULT_MAX_ATTEMPTS,
} from "@/platform/queue";
import type { RegistryEntry, QueuePolicy, CustomerQueueState } from "@/platform/queue";
import { parseSystemsMode, enabledDestinations, adaptersFor, createSalesforceAdapter, createSurenseAdapter, SALESFORCE_PROFILE, SURENSE_PROFILE } from "@/platform/systems";
import { assignAgent } from "@/platform/assignment";
import type { AssignmentRule, AgentCandidate } from "@/platform/assignment";

describe("national id normalisation", () => {
  it.each([
    ["000000018", "000000018"], // leading zeros kept
    ["18", "000000018"], // short input left padded
    ["00000018", "000000018"], // 8 digits
    ["123456782", "123456782"],
    ["123-456-782", "123456782"], // separators stripped
    [" 123 456 782 ", "123456782"],
  ])("normalises %s", (raw, id) => {
    expect(normalizeNationalId(raw)).toEqual({ ok: true, id });
    expect(normalizeAndValidateNationalId(raw)).toEqual({ ok: true, id });
  });
  it("rejects bad input", () => {
    expect(normalizeNationalId("")).toEqual({ ok: false, error: "empty" });
    expect(normalizeNationalId("12a456782")).toEqual({ ok: false, error: "not_digits" });
    expect(normalizeNationalId("1234567890")).toEqual({ ok: false, error: "too_long" });
  });
  it("rejects an invalid check digit", () => {
    expect(hasValidCheckDigit("123456789")).toBe(false);
    expect(normalizeAndValidateNationalId("123456789")).toEqual({ ok: false, error: "bad_check_digit" });
    expect(hasValidCheckDigit("123456782")).toBe(true);
  });
});

describe("source ranks", () => {
  it("has the five ranks, lower is more trusted", () => {
    expect(SOURCE_RANK).toEqual({ clearing_house: 1, har_habituach: 2, surense_agent_report: 3, pre_treatment_questionnaire: 4, manual_template: 5 });
    expect(rankOf("har_habituach")).toBe(2);
    expect(isSourceName("clearing_house")).toBe(true);
    expect(isSourceName("nope")).toBe(false);
  });
});

describe("field precedence matrix", () => {
  const ranks: SourceRank[] = [1, 2, 3, 4, 5];
  const matrix: Array<[SourceRank, SourceRank, PrecedenceDecision]> = [];
  for (const cur of ranks)
    for (const inc of ranks) matrix.push([cur, inc, inc < cur ? "apply_override" : inc > cur ? "keep_higher_rank" : "apply_newer_same_rank"]);

  it.each(matrix)("current rank %i, incoming rank %i -> %s", (cur, inc, expected) => {
    expect(resolveFieldUpdate({ value: "a", rank: cur, observedAt: 100 }, { value: "b", rank: inc, observedAt: 200 })).toBe(expected);
  });
  it("same rank, older observation is kept", () => {
    expect(resolveFieldUpdate({ value: "a", rank: 3, observedAt: 200 }, { value: "b", rank: 3, observedAt: 100 })).toBe("keep_newer_existing");
  });
  it("a questionnaire (4) fills an empty field but never overrides clearing house (1) or Har HaBituach (2)", () => {
    expect(resolveFieldUpdate(null, { value: "x", rank: 4, observedAt: 1 })).toBe("apply_new");
    expect(resolveFieldUpdate({ value: "", rank: 1, observedAt: 1 }, { value: "x", rank: 4, observedAt: 2 })).toBe("apply_fill_empty");
    expect(resolveFieldUpdate({ value: "v", rank: 1, observedAt: 1 }, { value: "x", rank: 4, observedAt: 2 })).toBe("keep_higher_rank");
    expect(resolveFieldUpdate({ value: "v", rank: 2, observedAt: 1 }, { value: "x", rank: 4, observedAt: 2 })).toBe("keep_higher_rank");
  });
  it("a later clearing house value overrides an earlier questionnaire value", () => {
    expect(resolveFieldUpdate({ value: "q", rank: 4, observedAt: 1 }, { value: "c", rank: 1, observedAt: 2 })).toBe("apply_override");
  });
  it("empty incoming never erases", () => {
    for (const v of [null, undefined, "", "   "]) expect(resolveFieldUpdate({ value: "a", rank: 5, observedAt: 1 }, { value: v, rank: 1, observedAt: 2 })).toBe("ignore_empty_incoming");
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });
});

describe("field ownership", () => {
  const f = (o: Partial<FieldOwnership>): FieldOwnership => ({
    fieldKey: "x.y", owner: "salesforce", replicateTo: [], multiSource: false, inputChannels: [], storePolicy: "source_of_truth", nonOwnerMode: "reject", ...o,
  });
  it.each([
    ["owner writes", f({}), "salesforce", "allow"],
    ["surense writes a salesforce field", f({}), "surense", "reject_not_owner"],
    ["salesforce writes a surense field", f({ owner: "surense" }), "salesforce", "reject_not_owner"],
    ["non owner in propose mode", f({ nonOwnerMode: "propose" }), "surense", "propose_not_owner"],
    ["portal allowed input channel", f({ inputChannels: ["portal"] }), "portal", "allow"],
    ["portal not an input channel", f({}), "portal", "reject_not_owner"],
    ["multi source: anyone, rank decides", f({ owner: "surense", multiSource: true }), "portal", "allow"],
    ["never stored (commission, regulatory)", f({ storePolicy: "never_store" }), "salesforce", "reject_never_store"],
    ["operational db only for its own fields", f({ owner: "operational_db" }), "surense", "reject_not_owner"],
  ])("%s", (_n, field, origin, expected) => {
    expect(decideOwnership(field, origin as never)).toBe(expected);
  });
  it("unknown field is rejected", () => expect(decideOwnership(undefined, "portal")).toBe("reject_unknown_field"));
});

describe("backoff and dead letter", () => {
  const p: QueuePolicy = { ...SALESFORCE_PROFILE.queue, backoffSec: [30, 300, 1800], maxAttempts: 3, lockedRetrySec: 60 };
  it("graduated backoff then dead letter on the third failure", () => {
    expect(decideFailure("unavailable", 1, p)).toEqual({ action: "retry", delaySec: 30 });
    expect(decideFailure("unavailable", 2, p)).toEqual({ action: "retry", delaySec: 300 });
    expect(decideFailure("unavailable", 3, p)).toEqual({ action: "dead_letter", reason: "max_attempts" });
  });
  it("record lock waits at least lockedRetrySec, retry-after is honoured", () => {
    expect(decideFailure("record_locked", 1, p)).toEqual({ action: "retry", delaySec: 60 });
    expect(decideFailure("rate_limited", 1, p, 120)).toEqual({ action: "retry", delaySec: 120 });
  });
  it("poison and permanent go straight to the dead-letter queue", () => {
    expect(decideFailure("poison", 1, p).action).toBe("dead_letter");
    expect(decideFailure("permanent", 1, p).action).toBe("dead_letter");
  });
  it("constants match the mandatory rules", () => {
    expect(MAX_BATCH_SIZE).toBe(20);
    expect(DEFAULT_VISIBILITY_TIMEOUT_SEC).toBe(60);
    expect(DEFAULT_MAX_ATTEMPTS).toBe(3);
  });
});

describe("per-customer ordering decision", () => {
  const st = (o: Partial<CustomerQueueState> = {}): CustomerQueueState => ({ lastCompletedSeq: 0, halted: false, leaseUntilMs: null, ...o });
  it.each([
    ["first message", st(), 1, "process"],
    ["next in line", st({ lastCompletedSeq: 4 }), 5, "process"],
    ["gap: predecessor missing or waiting for retry", st({ lastCompletedSeq: 4 }), 6, "not_ready"],
    ["already done", st({ lastCompletedSeq: 4 }), 4, "duplicate"],
    ["older than done", st({ lastCompletedSeq: 4 }), 2, "duplicate"],
    ["halted customer", st({ lastCompletedSeq: 4, halted: true }), 5, "halted"],
    ["leased by another worker", st({ lastCompletedSeq: 4, leaseUntilMs: 2000 }), 5, "locked"],
    ["expired lease", st({ lastCompletedSeq: 4, leaseUntilMs: 500 }), 5, "process"],
  ])("%s", (_n, state, seq, expected) => {
    expect(decideOrdering(state, seq as number, 1000)).toBe(expected);
  });
  it("no state row yet behaves as last=0", () => {
    expect(decideOrdering(null, 1, 0)).toBe("process");
    expect(decideOrdering(null, 2, 0)).toBe("not_ready");
  });
});

describe("loop prevention", () => {
  const C = "11111111-1111-1111-1111-111111111111";
  const H = "a".repeat(64);
  const owner = (o: string): "salesforce" | "surense" | "operational_db" => o as never;

  it("never routes back to the origin and honours disabled systems", () => {
    expect(routeTargets("portal", "salesforce", ["surense"], ["salesforce", "surense"]).sort()).toEqual(["salesforce", "surense"]);
    expect(routeTargets("salesforce", "salesforce", ["surense"], ["salesforce", "surense"])).toEqual(["surense"]);
    expect(routeTargets("portal", "salesforce", ["surense"], ["surense"])).toEqual(["surense"]);
    expect(routeTargets("surense", "surense", [], ["salesforce", "surense"])).toEqual([]);
    expect(routeTargets("portal", owner("operational_db"), [], ["salesforce", "surense"])).toEqual([]);
  });

  it("drops a duplicate event id", () => {
    const reg: RegistryEntry[] = [{ eventId: "e1", customerKey: C, originSystem: "portal", contentHash: H, sentTo: [] }];
    expect(decideInbound({ eventId: "e1", customerKey: C, originSystem: "portal", contentHash: H }, reg)).toEqual({ action: "drop", reason: "duplicate_event" });
  });

  it("echo: Salesforce reports back what we just sent it", () => {
    const reg: RegistryEntry[] = [{ eventId: "e1", customerKey: C, originSystem: "portal", contentHash: H, sentTo: ["salesforce", "surense"] }];
    expect(decideInbound({ eventId: "e2", customerKey: C, originSystem: "salesforce", contentHash: H }, reg)).toEqual({ action: "drop", reason: "echo" });
    // different customer or different content is not an echo
    expect(decideInbound({ eventId: "e3", customerKey: "22222222-2222-2222-2222-222222222222", originSystem: "salesforce", contentHash: H }, reg).action).toBe("accept");
    expect(decideInbound({ eventId: "e4", customerKey: C, originSystem: "salesforce", contentHash: "b".repeat(64) }, reg).action).toBe("accept");
  });

  it("three-way ping-pong dies: portal -> salesforce -> surense -> back", () => {
    const registry: RegistryEntry[] = [];
    const accept = (eventId: string, origin: RegistryEntry["originSystem"], hash: string, ownerSys: "salesforce" | "surense", replicate: Array<"salesforce" | "surense">) => {
      const d = decideInbound({ eventId, customerKey: C, originSystem: origin, contentHash: hash }, registry);
      if (d.action === "drop") return { d, targets: [] as string[] };
      const targets = routeTargets(origin, ownerSys, replicate, ["salesforce", "surense"]);
      registry.push({ eventId, customerKey: C, originSystem: origin, contentHash: hash, sentTo: targets as never });
      return { d, targets };
    };
    // 1. portal changes a salesforce-owned, surense-replicated field: goes to both systems
    expect(accept("e1", "portal", H, "salesforce", ["surense"]).targets.sort()).toEqual(["salesforce", "surense"]);
    // 2. Salesforce webhook reports the same change: echo, nothing enqueued
    expect(accept("e2", "salesforce", H, "salesforce", ["surense"])).toMatchObject({ d: { action: "drop", reason: "echo" }, targets: [] });
    // 3. Surense reports the same change: echo, nothing enqueued
    expect(accept("e3", "surense", H, "salesforce", ["surense"])).toMatchObject({ d: { action: "drop", reason: "echo" }, targets: [] });
    // 4. Surense normalises the value (new hash): not detected as an echo, but ownership rejects the non-owner write
    const normalised = accept("e4", "surense", "c".repeat(64), "salesforce", ["surense"]);
    expect(normalised.d.action).toBe("accept");
    const field: FieldOwnership = { fieldKey: "customer.phone", owner: "salesforce", replicateTo: ["surense"], multiSource: false, inputChannels: ["portal"], storePolicy: "source_of_truth", nonOwnerMode: "reject" };
    expect(decideOwnership(field, "surense")).toBe("reject_not_owner"); // the write is refused, so nothing is re-enqueued to Salesforce
    expect(registry.length).toBeLessThanOrEqual(3);
  });

  it("content hash is stable regardless of key order", async () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
    expect(await contentHash({ a: 1, b: 2 })).toBe(await contentHash({ b: 2, a: 1 }));
    expect(await contentHash({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
    expect(await contentHash({ a: 1 })).not.toBe(await contentHash({ a: 2 }));
    expect(await contentHash({ a: 1 }, "k1")).toMatch(/^[0-9a-f]{64}$/);
    expect(await contentHash({ a: 1 }, "k1")).not.toBe(await contentHash({ a: 1 }));
    expect(await contentHash({ a: 1 }, "k1")).not.toBe(await contentHash({ a: 1 }, "k2"));
  });
});

describe("envelope", () => {
  const good = {
    v: 1, eventId: "11111111-1111-4111-8111-111111111111", originSystem: "portal", contentHash: "a".repeat(64), destination: "salesforce",
    customerKey: "22222222-2222-2222-2222-222222222222", seq: 1, type: "lead.created", fieldKeys: ["lead.status"], enqueuedAt: "2026-11-17T00:00:00Z",
  };
  it("accepts a good envelope", () => expect(parseEnvelope(good).ok).toBe(true));
  it.each([
    [{ ...good, v: 2 }, "bad_version"],
    [{ ...good, eventId: "x" }, "bad_event_id"],
    [{ ...good, contentHash: "zz" }, "bad_content_hash"],
    [{ ...good, seq: 0 }, "bad_seq"],
    [{ ...good, destination: "surense", originSystem: "surense" }, "origin_equals_destination"],
    [{ ...good, type: "nope" }, "bad_type"],
    [null, "not_an_object"],
  ])("rejects %#", (raw, error) => expect(parseEnvelope(raw)).toEqual({ ok: false, error }));
});

describe("systems and queue policy", () => {
  it("defaults to unconfigured: nothing drains", () => {
    expect(parseSystemsMode(undefined)).toBe("unconfigured");
    expect(parseSystemsMode("garbage")).toBe("unconfigured");
    expect(enabledDestinations("unconfigured")).toEqual([]);
  });
  it("config switch: surense only, salesforce only, both in parallel", () => {
    expect(enabledDestinations(parseSystemsMode("surense_only"))).toEqual(["surense"]);
    expect(enabledDestinations(parseSystemsMode("salesforce_only"))).toEqual(["salesforce"]);
    expect(enabledDestinations(parseSystemsMode("both_parallel"))).toEqual(["salesforce", "surense"]);
    expect(Object.keys(adaptersFor("surense_only"))).toEqual(["surense"]);
    expect(Object.keys(adaptersFor("both_parallel")).sort()).toEqual(["salesforce", "surense"]);
  });
  it("each adapter has its own queue profile, the Surense queue is slower, both profiles validate", () => {
    expect(SURENSE_PROFILE.queue.batchSize).toBeLessThan(SALESFORCE_PROFILE.queue.batchSize);
    expect(SURENSE_PROFILE.queue.drainIntervalSec).toBeGreaterThan(SALESFORCE_PROFILE.queue.drainIntervalSec);
    expect(validateQueuePolicy(SALESFORCE_PROFILE.queue, SALESFORCE_PROFILE.minIntervalMs)).toEqual([]);
    expect(validateQueuePolicy(SURENSE_PROFILE.queue, SURENSE_PROFILE.minIntervalMs)).toEqual([]);
    expect(createSalesforceAdapter().profile.queue.visibilityTimeoutSec).toBe(60);
  });
  it("profiles are configurable and validated", () => {
    expect(validateQueuePolicy({ ...SALESFORCE_PROFILE.queue, batchSize: 21 })).toContain("batchSize must be 1..20");
    expect(validateQueuePolicy({ ...SURENSE_PROFILE.queue, batchSize: 20 }, 5000)).toHaveLength(1);
    const a = createSurenseAdapter({ queue: { ...SURENSE_PROFILE.queue, batchSize: 2 } });
    expect(a.profile.queue.batchSize).toBe(2);
    expect(a.profile.queue.maxAttempts).toBe(3);
  });
  it("placeholders call nothing and are not ready", async () => {
    const a = createSurenseAdapter();
    expect(a.capabilities.ready).toBe(false);
    expect(await a.getCustomer({ customerKey: "k", externalId: null, idempotencyKey: "i" })).toEqual({ ok: false, kind: "permanent", code: "not_implemented" });
    expect(createSalesforceAdapter().capabilities.createLead).toBe(true);
    expect(createSurenseAdapter().capabilities.createLead).toBe(false);
  });
});

describe("assignment", () => {
  const rules: AssignmentRule[] = [
    { priority: 10, lineOfBusiness: "insurance", requiredRole: "insurance_lead", sticky: true, strategy: "round_robin", loadCap: 2, enabled: true },
    { priority: 20, lineOfBusiness: "finance", requiredRole: "finance_lead", sticky: false, strategy: "least_loaded", loadCap: null, enabled: true },
  ];
  const ag = (id: string, roles: string[], load = 0, last: number | null = null, active = true): AgentCandidate => ({ agentId: id, roles, active, activeLoad: load, lastAssignedAtMs: last });
  it("manual override wins and is audited", () => {
    expect(assignAgent({ lineOfBusiness: "insurance", manualOverrideAgentId: "z", agents: [], rules })).toEqual({ agentId: "z", reason: "manual_override", audit: true });
  });
  it("sticky keeps the existing agent when still eligible, even above the cap", () => {
    const agents = [ag("a", ["insurance_lead"], 5), ag("b", ["insurance_lead"], 0)];
    expect(assignAgent({ lineOfBusiness: "insurance", existingAgentId: "a", agents, rules }).reason).toBe("sticky");
    expect(assignAgent({ lineOfBusiness: "insurance", existingAgentId: "a", agents: [ag("a", ["insurance_lead"], 1, null, false), ag("b", ["insurance_lead"])], rules }).agentId).toBe("b");
  });
  it("round robin picks the longest idle, respects role and cap", () => {
    const agents = [ag("a", ["insurance_lead"], 1, 500), ag("b", ["insurance_lead"], 1, 100), ag("c", ["finance_lead"], 0, null), ag("d", ["insurance_lead"], 2, null)];
    expect(assignAgent({ lineOfBusiness: "insurance", agents, rules })).toMatchObject({ agentId: "b", reason: "round_robin" });
  });
  it("least loaded for finance, no capacity falls back to the shared pool", () => {
    expect(assignAgent({ lineOfBusiness: "finance", agents: [ag("a", ["finance_lead"], 3), ag("b", ["finance_lead"], 1)], rules })).toMatchObject({ agentId: "b", reason: "least_loaded" });
    expect(assignAgent({ lineOfBusiness: "insurance", agents: [ag("a", ["insurance_lead"], 2)], rules })).toEqual({ agentId: null, reason: "no_capacity", audit: false });
    expect(assignAgent({ lineOfBusiness: "insurance", agents: [], rules: [] }).reason).toBe("no_rule");
  });
});
