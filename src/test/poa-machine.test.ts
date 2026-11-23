import { describe, it, expect } from "vitest";
import { POA_KINDS, type PoaKind } from "@/lib/poa/config";
import { errorKindOf, nextOf, PoaApiError, type ConsentRes, type PoaModules, type PoaNext, type StartRes } from "@/lib/poa/api";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { backOf, initialState, openKinds, progress, Q_KEYS, reduce, resolveNext, shouldWarn, steps, type Details, type PoaEvent, type PoaState } from "@/lib/poa/machine";

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
const DETAILS: Details = {
  first: "ישראל", last: "ישראלי", id: fakeId(), birth: "1980-02-01", issue: "2015-03-15", street: "הרצל 1", city: "תל אביב", zip: "6473912",
  phone: "0501234567", email: "", terms: true, marketing: false,
};
/** one ANSWER per question, in order (the component validates before dispatching) */
const answers = (): PoaEvent[] => Q_KEYS.map((k) => ({
  type: "ANSWER", patch: k === "consent" ? { terms: DETAILS.terms, marketing: DETAILS.marketing } : { [k]: DETAILS[k] },
}));
const toReview = (): PoaEvent[] => [{ type: "START" }, ...answers()];

describe("poa machine: transitions", () => {
  it("walks s0 → q (11 questions) → s2a → approve (three approvals in order) → s7", () => {
    let s = run([{ type: "START" }]);
    expect(s.screen).toBe("q"); expect(s.q).toBe(0);
    s = run(answers().slice(0, 3), s);
    expect(s.screen).toBe("q"); expect(s.q).toBe(3);
    expect(s.details.first).toBe("ישראל"); expect(s.details.id).toBe(DETAILS.id);
    s = run(answers().slice(3), s);
    expect(s.screen).toBe("s2a");
    expect(s.details).toEqual(DETAILS);
    s = reduce(s, { type: "STARTED", res: startRes() });
    expect(s.screen).toBe("approve");
    expect(s.started).toBe(true);
    s = reduce(s, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) });
    expect(s.screen).toBe("approve");
    s = reduce(s, { type: "CONSENTED", res: consentRes("harbit", mods({ maslaka: { performed: true }, harbit: { performed: true } })) });
    expect(s.screen).toBe("approve");
    s = reduce(s, { type: "CONSENTED", res: consentRes("policies", mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } })) });
    expect(s.screen).toBe("s7");
    expect(Object.keys(s.done)).toEqual(["maslaka", "harbit", "policies"]);
    expect(s.done.policies?.method).toBe("signature");
  });

  it("ignores events that do not belong to the current screen", () => {
    expect(reduce(initialState(), { type: "ANSWER", patch: { first: "x" } }).screen).toBe("s0");
    expect(reduce(initialState(), { type: "EDIT" }).screen).toBe("s0");
    expect(reduce(initialState(), { type: "FORWARD" }).screen).toBe("s0");
  });

  it("EDIT before the start call goes back to the first question keeping the details", () => {
    const s = run([...toReview(), { type: "EDIT" }]);
    expect(s.screen).toBe("q"); expect(s.q).toBe(0);
    expect(s.details).toEqual(DETAILS);
  });

  it("EDIT after the start call starts again (no edit on the old session)", () => {
    const s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "BACK" }]);
    expect(s.screen).toBe("s2a");
    const r = reduce(s, { type: "EDIT" });
    expect(r).toEqual(initialState());
  });

  it("s2a after the start call has no way back and FORWARD resumes the approve screen", () => {
    const m = mods({ maslaka: { performed: true } });
    let s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "CONSENTED", res: consentRes("maslaka", m) }, { type: "BACK" }]);
    expect(s.screen).toBe("s2a");
    expect(backOf(s)).toBeNull();
    s = reduce(s, { type: "FORWARD" });
    expect(s.screen).toBe("approve");
    expect(s.modules?.maslaka.performed).toBe(true); // the approve screen shows it as done, asks for the other two
  });

  it("BACK steps s2a → last question → … → first question → s0 before the start call", () => {
    let s = run(toReview());
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("q"); expect(s.q).toBe(Q_KEYS.length - 1);
    for (let i = Q_KEYS.length - 2; i >= 0; i--) { s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("q"); expect(s.q).toBe(i); }
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s0");
    s = reduce(s, { type: "BACK" }); expect(s.screen).toBe("s0");
    expect(s.details).toEqual(DETAILS); // answers survive going back
  });
});

describe("poa machine: skipping", () => {
  it.each<[string, PoaModules, PoaNext, string]>([
    ["disabled maslaka", mods({ maslaka: { enabled: false } }), "harbit", "approve"],
    ["server next points at a performed module", mods({ maslaka: { performed: true } }), "maslaka", "approve"],
    ["server next points at a disabled module", mods({ harbit: { enabled: false } }), "harbit", "approve"],
    ["all performed", mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } }), "policies", "s7"],
    ["done", mods(), "done", "s7"],
  ])("%s", (_n, m, next, screen) => expect(resolveNext(m, next)).toBe(screen));

  it("the approve screen lists only enabled, not yet performed documents; BACK from it is s2a", () => {
    const m = mods({ maslaka: { performed: true }, harbit: { enabled: false } });
    const s = run([...toReview(), { type: "STARTED", res: startRes(m, "policies") }]);
    expect(s.screen).toBe("approve");
    expect(openKinds(m)).toEqual(["policies"]);
    expect(reduce(s, { type: "BACK" }).screen).toBe("s2a");
    expect(openKinds(mods({ harbit: { enabled: false } }))).toEqual(["maslaka", "policies"]);
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

  it("M never changes once shown: questions, review, the one approve screen", () => {
    const m = mods({ policies: { enabled: false } });
    let s = run([...toReview(), { type: "STARTED", res: startRes(m) }]);
    expect(progress(s)).toEqual({ n: 3, m: 3 });
    s = reduce(s, { type: "BACK" });
    expect(progress(s)).toEqual({ n: 2, m: 3 });
  });

  it("the approve step is there as long as one document is still open at the start call", () => {
    const m = mods({ maslaka: { performed: true }, policies: { enabled: false } });
    const s = run([...toReview(), { type: "STARTED", res: startRes(m) }]);
    expect(steps(s)).toEqual(["q", "s2a", "approve"]);
    expect(progress(s)).toEqual({ n: 3, m: 3 });
    const all = mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } });
    const d = run([...toReview(), { type: "STARTED", res: startRes(all) }]);
    expect(d.screen).toBe("s7");
    expect(steps(d)).toEqual(["q", "s2a"]);
  });

  it("an approval during the sequence keeps the approve step and its count", () => {
    const s = run([...toReview(), { type: "STARTED", res: startRes() }, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) }]);
    expect(s.screen).toBe("approve");
    expect(progress(s)).toEqual({ n: 3, m: 3 });
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
    expect(reduce(s, { type: "TICK", now: at(59) }).screen).toBe("approve");
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

  it("CONSENTED off the approve screen (back on the review) is ignored", () => {
    const s = reduce(started(), { type: "BACK" });
    expect(s.screen).toBe("s2a");
    expect(reduce(s, { type: "CONSENTED", res: consentRes("harbit", mods({ harbit: { performed: true } })) })).toBe(s);
  });

  it("a late CONSENTED on a retryable error keeps the approve screen as the retry target, with the approval recorded", () => {
    const e = reduce(started(), { type: "FAIL", code: "unavailable" });
    const s = reduce(e, { type: "CONSENTED", res: consentRes("maslaka", mods({ maslaka: { performed: true } })) });
    expect(s.resumeTo).toBe("approve");
    expect(s.modules?.maslaka.performed).toBe(true);
    const r = reduce(s, { type: "RETRY" });
    expect(r.screen).toBe("approve");
    // the last approval arriving late ends the flow when retried
    const all = mods({ maslaka: { performed: true }, harbit: { performed: true }, policies: { performed: true } });
    const e2 = reduce(reduce(started(), { type: "FAIL", code: "unavailable" }), { type: "CONSENTED", res: consentRes("policies", all) });
    expect(e2.resumeTo).toBe("s7");
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
    expect(r.details).toEqual(DETAILS);
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
