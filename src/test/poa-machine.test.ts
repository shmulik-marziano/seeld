import { describe, it, expect } from "vitest";
import { POA_KINDS, type PoaKind } from "@/lib/poa/config";
import { errorKindOf, nextOf, PoaApiError, type ConsentRes, type PoaModules, type PoaNext, type StartRes } from "@/lib/poa/api";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { backOf, initialState, progress, reduce, resolveNext, shouldWarn, steps, type PoaEvent, type PoaState } from "@/lib/poa/machine";

const T0 = new Date("2026-01-10T10:00:00Z");
const mods = (over: Partial<Record<PoaKind, Partial<PoaModules[PoaKind]>>> = {}): PoaModules =>
  Object.fromEntries(POA_KINDS.map((k) => [k, { enabled: true, required: true, performed: false, ...over[k] }])) as PoaModules;
const startRes = (m: PoaModules = mods(), next: PoaNext = nextOf(m)): StartRes => ({
  session_token: "tok", expires_at: new Date(T0.getTime() + 60 * 60_000).toISOString(), modules: m, next,
});
const consentRes = (kind: PoaKind, m: PoaModules, next: PoaNext = nextOf(m)): ConsentRes => ({
  kind, method: kind === "policies" ? "signature" : "check", approved_at: T0.toISOString(), valid_until: null, modules: m, next,
});
const run = (events: PoaEvent[], s: PoaState = initialState()) => events.reduce(reduce, s);
const fakeId = () => { for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(`12345678${d}`)) return `12345678${d}`; throw new Error("no check digit"); };
const ID = { first: "ישראל", last: "ישראלי", id: fakeId() };
const CONTACT = { phone: "0501234567", email: "", terms: true, marketing: false };
const toReview = (): PoaEvent[] => [{ type: "START" }, { type: "IDENTITY", identity: ID }, { type: "CONTACT", contact: CONTACT }];

describe("poa machine: transitions", () => {
  it("walks s0 → s1 → s2 → s2a → maslaka → harbit → policies → s7", () => {
    let s = run(toReview());
    expect(s.screen).toBe("s2a");
    s = reduce(s, { type: "STARTED", res: startRes() });
    expect(s.screen).toBe("maslaka");
    expect(s.started).toBe(true);
    s = reduce(s, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) });
    expect(s.screen).toBe("harbit");
    s = reduce(s, { type: "CONSENTED", res: consentRes("harbit", mods({ maslaka: { performed: true }, harbit: { performed: true } })) });
    expect(s.screen).toBe("policies");
    s = reduce(s, { type: "CONSENTED", res: consentRes("policies", mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } })) });
    expect(s.screen).toBe("s7");
    expect(Object.keys(s.done)).toEqual(["maslaka", "harbit", "policies"]);
    expect(s.done.policies?.method).toBe("signature");
  });

  it("ignores events that do not belong to the current screen", () => {
    expect(reduce(initialState(), { type: "IDENTITY", identity: ID }).screen).toBe("s0");
    expect(reduce(initialState(), { type: "EDIT" }).screen).toBe("s0");
    expect(reduce(initialState(), { type: "FORWARD" }).screen).toBe("s0");
  });

  it("EDIT before the start call goes back to s1 keeping the details", () => {
    const s = run([...toReview(), { type: "EDIT" }]);
    expect(s.screen).toBe("s1");
    expect(s.identity).toEqual(ID);
  });

  it("EDIT after the start call starts again (no edit on the old session)", () => {
    const s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "BACK" }]);
    expect(s.screen).toBe("s2a");
    const r = reduce(s, { type: "EDIT" });
    expect(r).toEqual(initialState());
  });

  it("s2a after the start call has no way back and FORWARD resumes the first open module", () => {
    const m = mods({ maslaka: { performed: true } });
    let s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "CONSENTED", res: consentRes("maslaka", m) }, { type: "BACK" }]);
    expect(s.screen).toBe("s2a");
    expect(backOf(s)).toBeNull();
    s = reduce(s, { type: "FORWARD" });
    expect(s.screen).toBe("harbit");
  });

  it("BACK steps s2a → s2 → s1 → s0 before the start call", () => {
    let s = run(toReview());
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s2");
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s1");
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s0");
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s0");
  });
});

describe("poa machine: skipping", () => {
  it.each<[string, PoaModules, PoaNext, string]>([
    ["disabled maslaka", mods({ maslaka: { enabled: false } }), "harbit", "harbit"],
    ["server next points at a performed module", mods({ maslaka: { performed: true } }), "maslaka", "harbit"],
    ["server next points at a disabled module", mods({ harbit: { enabled: false } }), "harbit", "maslaka"],
    ["all performed", mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } }), "policies", "s7"],
    ["done", mods(), "done", "s7"],
  ])("%s", (_n, m, next, screen) => expect(resolveNext(m, next)).toBe(screen));

  it("back navigation skips disabled and performed modules", () => {
    const m = mods({ maslaka: { performed: true }, harbit: { enabled: false } });
    const s = run([...toReview(), { type: "STARTED", res: startRes(m, "policies") }]);
    expect(s.screen).toBe("policies");
    expect(reduce(s, { type: "BACK" }).screen).toBe("s2a");
    const m2 = mods({ harbit: { enabled: false } });
    const s2 = { ...run([...toReview(), { type: "STARTED", res: startRes(m2) }]), screen: "policies" as const };
    expect(reduce(s2, { type: "BACK" }).screen).toBe("maslaka");
  });
});

describe("poa machine: progress", () => {
  it("is null outside the indicator (s0, s7, error)", () => {
    expect(progress(initialState())).toBeNull();
    expect(progress({ ...initialState(), screen: "s7" })).toBeNull();
    expect(progress({ ...initialState(), screen: "error" })).toBeNull();
  });

  it("is not shown before the start call: M is unknown until the modules arrive (spec §2)", () => {
    expect(progress(run([{ type: "START" }]))).toBeNull();
    expect(progress(run(toReview()))).toBeNull();
  });

  it("M never changes once shown", () => {
    const m = mods({ policies: { enabled: false } });
    let s = run([...toReview(), { type: "STARTED", res: startRes(m) }]);
    expect(progress(s)).toEqual({ n: 4, m: 5 });
    s = reduce(s, { type: "BACK" });
    expect(progress(s)).toEqual({ n: 3, m: 5 });
  });

  it("derives M from the modules: disabled and already-performed modules drop out", () => {
    const m = mods({ maslaka: { performed: true }, policies: { enabled: false } });
    const s = run([...toReview(), { type: "STARTED", res: startRes(m) }]);
    expect(steps(s)).toEqual(["s1", "s2", "s2a", "harbit"]);
    expect(progress(s)).toEqual({ n: 4, m: 4 });
  });

  it("keeps a module performed during the flow in the count", () => {
    const s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) }]);
    expect(progress(s)).toEqual({ n: 5, m: 6 });
  });
});

describe("poa machine: expiry and warning", () => {
  const started = () => run([...toReview(), { type: "STARTED", res: startRes() }]);
  const at = (min: number) => new Date(T0.getTime() + min * 60_000);

  it("warns from 2 minutes before expires_at, until dismissed", () => {
    const s = started();
    expect(shouldWarn(s, at(57))).toBe(false);
    expect(shouldWarn(s, at(58))).toBe(true);
    expect(shouldWarn(s, at(59.5))).toBe(true);
    expect(shouldWarn(reduce(s, { type: "DISMISS_WARN" }), at(59))).toBe(false);
    expect(shouldWarn(s, at(60))).toBe(false);
  });

  it("never warns before the start call or on the summary", () => {
    expect(shouldWarn(run(toReview()), at(59))).toBe(false);
    expect(shouldWarn({ ...started(), screen: "s7" }, at(59))).toBe(false);
  });

  it("TICK past expires_at moves to the expired screen; RETRY there starts again", () => {
    const s = started();
    expect(reduce(s, { type: "TICK", now: at(59) }).screen).toBe("maslaka");
    const e = reduce(s, { type: "TICK", now: at(60) });
    expect(e.screen).toBe("error");
    expect(e.error).toBe("expired");
    expect(reduce(e, { type: "RETRY" })).toEqual(initialState());
  });

  it("a late CONSENTED after expiry keeps the error screen but records the approval", () => {
    const e = reduce(started(), { type: "TICK", now: at(60) });
    const s = reduce(e, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) });
    expect(s.screen).toBe("error");
    expect(s.error).toBe("expired");
    expect(s.done.maslaka).toBeTruthy();
  });

  it("a late STARTED never leaves the error screen", () => {
    const e = run([...toReview(), { type: "FAIL", code: "generic" }]);
    expect(reduce(e, { type: "STARTED", res: startRes() }).screen).toBe("error");
  });

  it("CONSENTED for another module than the current screen is ignored", () => {
    const s = started();
    expect(reduce(s, { type: "CONSENTED", res: consentRes("harbit", mods({ harbit: { performed: true } })) })).toBe(s);
  });

  it("a late CONSENTED on a retryable error moves the retry target on", () => {
    const e = reduce(started(), { type: "FAIL", code: "unavailable" });
    const s = reduce(e, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) });
    expect(s.resumeTo).toBe("harbit");
    expect(reduce(s, { type: "RETRY" }).screen).toBe("harbit");
  });

  it("the summary does not expire with the session", () => {
    const s = { ...started(), screen: "s7" as const };
    expect(reduce(s, { type: "TICK", now: at(90) }).screen).toBe("s7");
  });
});

describe("poa machine: errors", () => {
  it("FAIL keeps the screen to return to; RETRY returns there", () => {
    const s = run([...toReview(), { type: "FAIL", code: "unavailable" }]);
    expect(s.screen).toBe("error");
    expect(s.error).toBe("unavailable");
    const r = reduce(s, { type: "RETRY" });
    expect(r.screen).toBe("s2a");
    expect(r.error).toBeNull();
    expect(r.identity).toEqual(ID);
  });

  it("a second FAIL keeps the first screen to return to", () => {
    const s = run([...toReview(), { type: "FAIL", code: "generic" }, { type: "FAIL", code: "generic" }]);
    expect(s.resumeTo).toBe("s2a");
  });

  it("RESTART forgets everything", () => {
    expect(run([...toReview(), { type: "RESTART" }])).toEqual(initialState());
  });

  it.each<[unknown, string]>([
    [new PoaApiError("inactive"), "inactive"],
    [new PoaApiError("unavailable"), "unavailable"],
    [new PoaApiError("generic"), "generic"],
    [new PoaApiError("expired"), "expired"],
    [new PoaApiError("locked"), "locked"],
    [new PoaApiError("completed"), "completed"],
    [new TypeError("Failed to fetch"), "unavailable"],
    [new Error("boom"), "generic"],
    ["x", "generic"],
  ])("maps %s to %s", (e, kind) => expect(errorKindOf(e)).toBe(kind));
});
