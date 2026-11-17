import { describe, it, expect } from "vitest";
import { runBatch, type QueueDb, type QueueMessage, type ClaimDecision } from "../../supabase/functions/_shared/queueWorker.ts";
import { dispatchAlerts, type AlertDb, type PendingAlert, type AlertRecipient } from "../../supabase/functions/_shared/alerts.ts";
import { createLogger } from "../../supabase/functions/_shared/logger.ts";
import { decideOrdering, type CustomerQueueState } from "@/platform/queue/ordering.ts";
import type { AdapterResult, SystemAdapter } from "@/platform/systems/types.ts";
import { SURENSE_PROFILE } from "@/platform/systems/placeholders.ts";
import type { Destination } from "@/platform/queue/policy.ts";

const log = createLogger({}, { write: () => {} });
const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function msg(id: number, customer: string, seq: number, dest: Destination = "surense", type = "customer.upserted"): QueueMessage {
  return {
    msg_id: id, read_ct: 1,
    message: { v: 1, eventId: uuid(), originSystem: "portal", contentHash: "a".repeat(64), destination: dest, customerKey: customer, seq, type, fieldKeys: ["x.y"], enqueuedAt: "2026-11-17T00:00:00Z" },
  };
}

/** In-memory database that applies the SAME ordering rule as public.queue_claim (via decideOrdering). */
function fakeDb(batch: QueueMessage[]) {
  const states = new Map<string, CustomerQueueState & { failures: number; halted: boolean }>();
  const log: string[] = [];
  const st = (c: string) => {
    if (!states.has(c)) states.set(c, { lastCompletedSeq: 0, halted: false, leaseUntilMs: null, failures: 0 });
    return states.get(c)!;
  };
  const db: QueueDb = {
    readBatch: async () => batch,
    claim: async (_d, id, c, seq) => {
      const d = decideOrdering(st(c), seq, 0) as ClaimDecision;
      log.push(`claim:${c.slice(0, 1)}${seq}:${d}`);
      return d;
    },
    loadFields: async () => ({ "x.y": 1 }),
    getExternalId: async () => null,
    setExternalId: async () => {},
    complete: async (_d, _id, c, seq) => { st(c).lastCompletedSeq = seq; st(c).failures = 0; log.push(`complete:${c.slice(0, 1)}${seq}`); },
    recordFailure: async (_d, c) => ++st(c).failures,
    scheduleRetry: async (_d, _id, c, delay) => { log.push(`retry:${c.slice(0, 1)}:${delay}`); },
    release: async (_d, id) => { log.push(`release:${id}`); },
    deadLetter: async (_d, _id, c, _seq, _m, reason) => { if (c) st(c).halted = true; log.push(`dlq:${c?.slice(0, 1) ?? "-"}:${reason}`); },
  };
  return { db, states, log };
}

function adapter(result: (customer: string) => AdapterResult<{ externalId: string }>, ready = true): SystemAdapter {
  const call = async (ctx: { customerKey: string }) => result(ctx.customerKey);
  return {
    id: "surense",
    capabilities: { createLead: false, upsertCustomer: true, updateCase: true, getCustomer: true, externalIdUpsert: true, recordLocking: true, ready },
    profile: { ...SURENSE_PROFILE, minIntervalMs: 0 },
    createLead: call, upsertCustomer: call, updateCase: call as never, getCustomer: call as never,
  };
}

const run = (batch: QueueMessage[], a: SystemAdapter, extra: Partial<Parameters<typeof runBatch>[0]> = {}) => {
  const f = fakeDb(batch);
  let t = 0;
  const p = runBatch({ destination: "surense", adapter: a, policy: { ...SURENSE_PROFILE.queue }, db: f.db, log, workerId: "w1", now: () => t, sleep: async (ms) => { t += ms; }, ...extra });
  return { ...f, p };
};

describe("queue worker", () => {
  it("does not drain a queue whose adapter is not ready", async () => {
    const r = run([msg(1, A, 1)], adapter(() => ({ ok: true, data: { externalId: "x" } }), false));
    expect((await r.p).read).toBe(0);
  });

  it("processes in order and completes", async () => {
    const r = run([msg(1, A, 1), msg(2, A, 2)], adapter(() => ({ ok: true, data: { externalId: "x" } })));
    const s = await r.p;
    expect(s).toMatchObject({ read: 2, completed: 2 });
    expect(r.log.filter((l) => l.startsWith("complete"))).toEqual(["complete:a1", "complete:a2"]);
  });

  it("a customer waiting for a retry blocks only that customer's later messages", async () => {
    // A1 fails (record locked), A2 must wait; B1 and B2 are unaffected.
    const r = run(
      [msg(1, A, 1), msg(2, A, 2), msg(3, B, 1), msg(4, B, 2)],
      adapter((c) => (c === A ? { ok: false, kind: "record_locked", code: "locked" } : { ok: true, data: { externalId: "x" } })),
    );
    const s = await r.p;
    expect(s).toMatchObject({ completed: 2, retried: 1, skipped: 1 });
    expect(r.log).toContain("retry:a:300"); // lockedRetrySec of the surense profile (placeholder)
    expect(r.log).toContain("claim:a2:not_ready"); // A2 is NOT processed before A1 completed? A1 is still last=0 and leased: see below
  });

  it("an out-of-order message is requeued, never processed", async () => {
    const r = run([msg(1, A, 2)], adapter(() => ({ ok: true, data: { externalId: "x" } })));
    const s = await r.p;
    expect(s).toMatchObject({ completed: 0, skipped: 1 });
  });

  it("third failure goes to the dead-letter queue and halts only that customer", async () => {
    const f = fakeDb([msg(1, A, 1)]);
    const a = adapter(() => ({ ok: false, kind: "unavailable", code: "http_503" }));
    const policy = { ...SURENSE_PROFILE.queue };
    const mk = () => runBatch({ destination: "surense", adapter: a, policy, db: f.db, log, workerId: "w", now: () => 0, sleep: async () => {} });
    expect(await mk()).toMatchObject({ retried: 1 });
    expect(await mk()).toMatchObject({ retried: 1 });
    expect(await mk()).toMatchObject({ deadLettered: 1 });
    expect(f.log.filter((l) => l.startsWith("dlq"))).toEqual(["dlq:a:max_attempts"]);
    expect(f.states.get(A)!.halted).toBe(true);
  });

  it("a poison message is dead-lettered at once", async () => {
    const r = run([{ msg_id: 9, read_ct: 1, message: { nonsense: true } }], adapter(() => ({ ok: true, data: { externalId: "x" } })));
    expect(await r.p).toMatchObject({ deadLettered: 1 });
    expect(r.log).toContain("dlq:-:poison");
  });

  it("a message that crashed the worker max_attempts times is dead-lettered with its customer (SQL says 'poison')", async () => {
    const f = fakeDb([msg(1, A, 1)]);
    const db: QueueDb = { ...f.db, claim: async () => "poison" };
    const s = await runBatch({ destination: "surense", adapter: adapter(() => ({ ok: true, data: { externalId: "x" } })), policy: { ...SURENSE_PROFILE.queue }, db, log, workerId: "w", now: () => 0, sleep: async () => {} });
    expect(s).toMatchObject({ deadLettered: 1, completed: 0 });
    expect(f.log).toContain("dlq:a:poison");
  });

  it("an external id already linked to another customer is dead-lettered, not completed", async () => {
    const f = fakeDb([msg(1, A, 1)]);
    const db: QueueDb = { ...f.db, setExternalId: async () => "conflict" };
    const s = await runBatch({ destination: "surense", adapter: adapter(() => ({ ok: true, data: { externalId: "x" } })), policy: { ...SURENSE_PROFILE.queue }, db, log, workerId: "w", now: () => 0, sleep: async () => {} });
    expect(s).toMatchObject({ deadLettered: 1, completed: 0 });
    expect(f.log).toContain("dlq:a:permanent");
    expect(f.log.some((l) => l.startsWith("complete"))).toBe(false);
  });

  it("a message for the wrong destination is poison", async () => {
    const r = run([msg(1, A, 1, "salesforce")], adapter(() => ({ ok: true, data: { externalId: "x" } })));
    expect(await r.p).toMatchObject({ deadLettered: 1 });
  });

  it("stops at the time budget and releases the rest (edge function cut-off safety)", async () => {
    let t = 0;
    const f = fakeDb([msg(1, A, 1), msg(2, B, 1), msg(3, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", 1)]);
    const slow = adapter(() => { t += 40_000; return { ok: true, data: { externalId: "x" } }; }); // budget = 60 s * 0.6 = 36 s
    const s = await runBatch({ destination: "surense", adapter: slow, policy: { ...SURENSE_PROFILE.queue }, db: f.db, log, workerId: "w", now: () => t, sleep: async () => {} });
    expect(s).toMatchObject({ completed: 1, released: 2 });
  });
});

describe("alert dispatch", () => {
  const alert: PendingAlert = { id: 1, severity: "critical", kind: "dead_letter", summary: "s" };
  const mkDb = (recipients: AlertRecipient[]) => {
    const marks: string[] = [];
    const db: AlertDb = { claimPending: async () => [alert], recipients: async () => recipients, mark: async (_i, s) => void marks.push(s) };
    return { db, marks };
  };
  it("marks no_recipients while the owner has not supplied a list", async () => {
    const { db, marks } = mkDb([]);
    expect(await dispatchAlerts(db, { send: async () => {} }, log)).toMatchObject({ noRecipients: 1 });
    expect(marks).toEqual(["no_recipients"]);
  });
  it("sends to configured recipients and marks failure when every channel fails", async () => {
    const r: AlertRecipient[] = [{ name: "n", channel: "email", address: "a" }];
    const ok = mkDb(r);
    expect(await dispatchAlerts(ok.db, { send: async () => {} }, log)).toMatchObject({ sent: 1 });
    const bad = mkDb(r);
    expect(await dispatchAlerts(bad.db, { send: async () => { throw new Error("x"); } }, log)).toMatchObject({ failed: 1 });
    expect(bad.marks).toEqual(["failed"]);
  });
});
