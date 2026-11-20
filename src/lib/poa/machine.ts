// POA wizard state machine: pure, no React, no DOM, no network. The server (adapter) drives the next document
// through `next` and `modules`; this file only resolves it to a screen, skips disabled / performed modules both ways,
// derives "שלב N מתוך M" from the modules, and decides the time warning and expiry (spec §2, §3, ס8).
// Personal details live in this state only (component memory): nothing is written to any storage.
import { POA_KINDS, POA_LIMITS, type PoaKind } from "./config";
import { POA_COPY as C } from "./copy";
import { nextOf, type ConsentRes, type ErrorKind, type PoaModules, type PoaNext, type StartRes } from "./api";
import { ageFromBirth, isMobile, validateDate, validateEmail, validateIsraeliId, validateIsraeliPhone, validatePersonName } from "@/questionnaires/validators";

export type Screen = "s0" | "s1" | "s2" | "s2a" | PoaKind | "s7" | "error";

export interface Identity { first: string; last: string; id: string }
export interface Contact { phone: string; email: string; terms: boolean; marketing: boolean }
export interface DoneDoc { method: "check" | "signature"; approved_at: string; valid_until: string | null }

export interface PoaState {
  screen: Screen;
  identity: Identity;
  contact: Contact;
  /** the server answered the start call: details can no longer be edited without starting again (spec ס2א) */
  started: boolean;
  session: { token: string; expires_at: string } | null;
  modules: PoaModules | null;
  /** modules already performed when the start call answered: outside the progress indicator */
  preDone: PoaKind[];
  done: Partial<Record<PoaKind, DoneDoc>>;
  error: ErrorKind | null;
  /** where "נסו שוב" returns to */
  resumeTo: Screen | null;
  /** expires_at value whose 2-minute warning was dismissed with "ממשיכים" */
  warnDismissedFor: string | null;
}

export type PoaEvent =
  | { type: "START" }
  | { type: "IDENTITY"; identity: Identity }
  | { type: "CONTACT"; contact: Contact }
  | { type: "EDIT" }
  | { type: "STARTED"; res: StartRes }
  | { type: "CONSENTED"; res: ConsentRes }
  | { type: "BACK" }
  /** s2a after the start call (reached with BACK): on to the first open module, no second start call */
  | { type: "FORWARD" }
  | { type: "FAIL"; code: ErrorKind }
  | { type: "RETRY" }
  | { type: "RESTART" }
  | { type: "DISMISS_WARN" }
  | { type: "TICK"; now: Date };

export const initialState = (): PoaState => ({
  screen: "s0",
  identity: { first: "", last: "", id: "" },
  contact: { phone: "", email: "", terms: false, marketing: false },
  started: false,
  session: null,
  modules: null,
  preDone: [],
  done: {},
  error: null,
  resumeTo: null,
  warnDismissedFor: null,
});

const isKind = (s: Screen): s is PoaKind => (POA_KINDS as readonly string[]).includes(s);
const open = (m: PoaModules, k: PoaKind) => m[k].enabled && !m[k].performed;

/** Server `next` to a screen: "done" ends the flow; a disabled or performed module is skipped to the next open one. */
export function resolveNext(modules: PoaModules, next: PoaNext): Screen {
  if (next === "done") return "s7";
  if (open(modules, next)) return next;
  const n = nextOf(modules);
  return n === "done" ? "s7" : n;
}

/** Screen BACK goes to, or null when there is no way back. Disabled / performed modules are skipped. */
export function backOf(s: PoaState): Screen | null {
  switch (s.screen) {
    case "s1": return "s0";
    case "s2": return "s1";
    case "s2a": return s.started ? null : "s2";
    case "maslaka": case "harbit": case "policies": {
      const i = POA_KINDS.indexOf(s.screen);
      for (let j = i - 1; j >= 0; j--) if (s.modules && open(s.modules, POA_KINDS[j])) return POA_KINDS[j];
      return "s2a";
    }
    default: return null;
  }
}

export function reduce(s: PoaState, e: PoaEvent): PoaState {
  switch (e.type) {
    case "START": return s.screen === "s0" ? { ...s, screen: "s1" } : s;
    case "IDENTITY": return s.screen === "s1" ? { ...s, identity: e.identity, screen: "s2" } : s;
    case "CONTACT": return s.screen === "s2" ? { ...s, contact: e.contact, screen: "s2a" } : s;
    case "EDIT":
      if (s.screen !== "s2a") return s;
      // after the start call, changing details means starting again (spec ס2א)
      return s.started ? initialState() : { ...s, screen: "s1" };
    case "STARTED": {
      // a late answer never pulls the user off another screen (e.g. the error screen)
      if (s.screen !== "s2a" || s.started) return s;
      const { res } = e;
      const preDone = POA_KINDS.filter((k) => res.modules[k].enabled && res.modules[k].performed);
      return {
        ...s,
        started: true,
        session: { token: res.session_token, expires_at: res.expires_at },
        modules: res.modules,
        preDone,
        screen: resolveNext(res.modules, res.next),
      };
    }
    case "CONSENTED": {
      const { res } = e;
      const done = { ...s.done, [res.kind]: { method: res.method, approved_at: res.approved_at, valid_until: res.valid_until } };
      // a late answer on the error screen: keep the summary accurate, stay on the error screen
      if (s.screen === "error") {
        const resumeTo = s.resumeTo === res.kind ? resolveNext(res.modules, res.next) : s.resumeTo;
        return { ...s, modules: res.modules, done, resumeTo };
      }
      if (s.screen !== res.kind) return s;
      return { ...s, modules: res.modules, done, screen: resolveNext(res.modules, res.next) };
    }
    case "BACK": {
      const b = backOf(s);
      return b ? { ...s, screen: b } : s;
    }
    case "FORWARD":
      if (s.screen !== "s2a" || !s.started || !s.modules) return s;
      return { ...s, screen: resolveNext(s.modules, nextOf(s.modules)) };
    case "FAIL":
      return { ...s, error: e.code, resumeTo: s.screen === "error" ? s.resumeTo : s.screen, screen: "error" };
    case "RETRY":
      if (s.screen !== "error") return s;
      if (s.error === "expired" || !s.resumeTo) return initialState();
      return { ...s, screen: s.resumeTo, error: null, resumeTo: null };
    case "RESTART": return initialState();
    case "DISMISS_WARN": return s.session ? { ...s, warnDismissedFor: s.session.expires_at } : s;
    case "TICK":
      if (s.session && isActive(s) && msLeft(s, e.now) <= 0) return reduce(s, { type: "FAIL", code: "expired" });
      return s;
  }
}

/** Screens on which the session clock matters (the summary keeps its own 30-minute download window). */
const isActive = (s: PoaState) => s.screen === "s2a" || isKind(s.screen);

export const msLeft = (s: PoaState, now: Date) => (s.session ? new Date(s.session.expires_at).getTime() - now.getTime() : Infinity);

/** "להמשיך? התהליך יסתיים בעוד 2 דקות" from 2 minutes before expires_at, until dismissed (spec ס8). */
export function shouldWarn(s: PoaState, now: Date): boolean {
  if (!s.session || !isActive(s) || s.warnDismissedFor === s.session.expires_at) return false;
  const left = msLeft(s, now);
  return left > 0 && left <= POA_LIMITS.warnBeforeMinutes * 60_000;
}

/** Steps inside the indicator: s1, s2, s2a and every enabled module not already performed at start (s0, s7 outside). */
export function steps(s: PoaState): Screen[] {
  // before the start call the modules are unknown: the list assumes all three (only used once modules are known)
  const kinds = POA_KINDS.filter((k) => (s.modules ? s.modules[k].enabled : true) && !s.preDone.includes(k));
  return ["s1", "s2", "s2a", ...kinds];
}

/**
 * "שלב N מתוך M", or null. Until the start call answers, `modules` is unknown and M could still change, so the
 * indicator is not shown (spec §2: M is always exact). Showing it on s1–s2a needs the module config before s1
 * (owner decision).
 */
export function progress(s: PoaState): { n: number; m: number } | null {
  if (!s.modules) return null;
  const list = steps(s);
  const i = list.indexOf(s.screen);
  return i < 0 ? null : { n: i + 1, m: list.length };
}

// ───────── validation (spec strings first for blank fields, then the validator's own message)

type Errs<K extends string> = Partial<Record<K, string>>;
const blank = (v: string) => !v.trim();

export function validateIdentity(i: Identity): { errors: Errs<"first" | "last" | "id">; value?: Identity } {
  const errors: Errs<"first" | "last" | "id"> = {};
  const out: Identity = { first: "", last: "", id: "" };
  if (blank(i.first)) errors.first = C.s1.errFirst; else { const r = validatePersonName(i.first); if (r.ok) out.first = r.value!; else errors.first = r.message; }
  if (blank(i.last)) errors.last = C.s1.errLast; else { const r = validatePersonName(i.last); if (r.ok) out.last = r.value!; else errors.last = r.message; }
  if (blank(i.id)) errors.id = C.s1.errId; else { const r = validateIsraeliId(i.id); if (r.ok) out.id = r.value!; else errors.id = r.message; }
  return Object.keys(errors).length ? { errors } : { errors, value: out };
}

export function validateContact(c: Contact): { errors: Errs<"phone" | "email" | "terms">; value?: Contact } {
  const errors: Errs<"phone" | "email" | "terms"> = {};
  const out: Contact = { ...c, email: "" };
  const p = validateIsraeliPhone(c.phone);
  if (!p.ok || !isMobile(p.value!)) errors.phone = C.s2.errPhone; else out.phone = p.value!;
  if (!blank(c.email)) { const r = validateEmail(c.email); if (r.ok) out.email = r.value!; else errors.email = r.message; }
  if (!c.terms) errors.terms = C.s2.errTerms;
  return Object.keys(errors).length ? { errors } : { errors, value: out };
}

export function validateHarbit(d: { birth: string; issue: string; check: boolean }, now: Date = new Date()):
  { errors: Errs<"birth" | "issue" | "check">; value?: { birth_date: string; issue_date: string } } {
  const errors: Errs<"birth" | "issue" | "check"> = {};
  let birth = "", issue = "";
  if (blank(d.birth)) errors.birth = C.s5.errBirth;
  else {
    const r = dateOf(d.birth, now);
    if (typeof r !== "string") errors.birth = r.err;
    else {
      const age = ageFromBirth(r, now);
      if (age === null || age > POA_LIMITS.maxAge) errors.birth = C.s5.errDate;
      else if (age < POA_LIMITS.minAge) errors.birth = C.s5.errAge;
      else birth = r;
    }
  }
  if (blank(d.issue)) errors.issue = C.s5.errIssue;
  else { const r = dateOf(d.issue, now); if (typeof r === "string") issue = r; else errors.issue = r.err; }
  if (birth && issue && issue < birth) errors.issue = C.s5.errOrder; // ISO strings compare lexically
  if (!d.check) errors.check = C.s5.errCheck;
  return Object.keys(errors).length ? { errors } : { errors, value: { birth_date: birth, issue_date: issue } };
}

/** dd/mm/yyyy to ISO, or the ס5 copy string for the failure (every visible string lives in copy.ts). */
function dateOf(input: string, now: Date): string | { err: string } {
  const r = validateDate(input, { now });
  if (r.ok) return r.value!;
  return validateDate(input, { now, allowFuture: true }).ok ? { err: C.s5.errFuture } : { err: C.s5.errDate };
}

export const validateCheck = (checked: boolean): string | undefined => (checked ? undefined : C.s4.err);
export const validateSignature = (png: string | null): string | undefined => (png ? undefined : C.s6.err);
