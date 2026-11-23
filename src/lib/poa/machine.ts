// POA wizard state machine: pure, no React, no DOM, no network. The server (adapter) drives the next document
// through `next` and `modules`; this file only resolves it to a screen, derives "שלב N מתוך M" from the modules, and
// decides the time warning and expiry (spec §2, §3, ס8). Since 2026-11-23 (owner decision) every open document is
// approved on ONE screen, "approve": the component sends the approvals in order and the screen ends when `next` is done.
// ס1 is one question per screen (owner decision 2026-11-22): `q` is the index into Q_KEYS, every answer is validated
// before the next question opens. Personal details live in this state only (component memory): no storage.
import { POA_KINDS, POA_LIMITS, type PoaKind } from "./config";
import { POA_COPY as C } from "./copy";
import { type ConsentRes, type ErrorKind, type PoaModules, type PoaNext, type StartRes } from "./api";
import { ageFromBirth, isMobile, validateDate, validateEmail, validateIsraeliId, validateIsraeliPhone, validatePersonName, validateText, validateZip } from "@/questionnaires/validators";

export type Screen = "s0" | "q" | "s2a" | "approve" | "s7" | "error";

/** The questions of ס1, in order. E-mail is the one optional answer; `consent` is the terms (+ marketing) screen. */
export const Q_KEYS = ["first", "last", "id", "birth", "issue", "street", "city", "zip", "phone", "email", "consent"] as const;
export type QKey = (typeof Q_KEYS)[number];

export interface Details {
  first: string; last: string; id: string;
  /** ISO yyyy-mm-dd (the date picker's value) */
  birth: string; issue: string;
  /** street + house number, city, 7-digit zip (looked up from the first two when the server can) */
  street: string; city: string; zip: string;
  phone: string; email: string;
  terms: boolean; marketing: boolean;
}
export interface DoneDoc { method: "check" | "signature"; approved_at: string; valid_until: string | null }

export interface PoaState {
  screen: Screen;
  /** index into Q_KEYS while screen is "q" */
  q: number;
  details: Details;
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
  /** a validated answer to the current question (the component validates with validateAnswer first) */
  | { type: "ANSWER"; patch: Partial<Details> }
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

export const emptyDetails = (): Details => ({
  first: "", last: "", id: "", birth: "", issue: "", street: "", city: "", zip: "", phone: "", email: "", terms: false, marketing: false,
});

export const initialState = (): PoaState => ({
  screen: "s0",
  q: 0,
  details: emptyDetails(),
  started: false,
  session: null,
  modules: null,
  preDone: [],
  done: {},
  error: null,
  resumeTo: null,
  warnDismissedFor: null,
});

const open = (m: PoaModules, k: PoaKind) => m[k].enabled && !m[k].performed;
/** Enabled documents not yet approved, in display order: what the approve screen asks for. */
export const openKinds = (m: PoaModules): PoaKind[] => POA_KINDS.filter((k) => open(m, k));

/** Server `next` to a screen: "done" ends the flow; anything still open is approved on the one approve screen. */
export function resolveNext(modules: PoaModules, next: PoaNext): Screen {
  if (next === "done") return "s7";
  return openKinds(modules).length ? "approve" : "s7";
}

/** Screen BACK goes to, or null when there is no way back. On "q" with q > 0 it is the previous question. */
export function backOf(s: PoaState): Screen | null {
  switch (s.screen) {
    case "q": return s.q > 0 ? "q" : "s0";
    case "s2a": return s.started ? null : "q";
    case "approve": return "s2a";
    default: return null;
  }
}

export function reduce(s: PoaState, e: PoaEvent): PoaState {
  switch (e.type) {
    case "START": return s.screen === "s0" ? { ...s, screen: "q", q: 0 } : s;
    case "ANSWER": {
      if (s.screen !== "q") return s;
      const details = { ...s.details, ...e.patch };
      const last = s.q >= Q_KEYS.length - 1;
      return last ? { ...s, details, screen: "s2a" } : { ...s, details, q: s.q + 1 };
    }
    case "EDIT":
      if (s.screen !== "s2a") return s;
      // after the start call, changing details means starting again (spec ס2א)
      return s.started ? initialState() : { ...s, screen: "q", q: 0 };
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
        const resumeTo = s.resumeTo === "approve" ? resolveNext(res.modules, res.next) : s.resumeTo;
        return { ...s, modules: res.modules, done, resumeTo };
      }
      if (s.screen !== "approve") return s;
      // the approve screen stays until the server says the flow is done (the component sends the approvals in order)
      return { ...s, modules: res.modules, done, screen: resolveNext(res.modules, res.next) };
    }
    case "BACK": {
      const b = backOf(s);
      if (!b) return s;
      if (s.screen === "q" && b === "q") return { ...s, q: s.q - 1 };
      if (b === "q") return { ...s, screen: "q", q: Q_KEYS.length - 1 };
      return { ...s, screen: b };
    }
    case "FORWARD":
      if (s.screen !== "s2a" || !s.started || !s.modules) return s;
      return { ...s, screen: openKinds(s.modules).length ? "approve" : "s7" };
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
const isActive = (s: PoaState) => s.screen === "s2a" || s.screen === "approve";

export const msLeft = (s: PoaState, now: Date) => (s.session ? new Date(s.session.expires_at).getTime() - now.getTime() : Infinity);

/** "להמשיך? התהליך יסתיים בעוד 2 דקות" from 2 minutes before expires_at, until dismissed (spec ס8). */
export function shouldWarn(s: PoaState, now: Date): boolean {
  if (!s.session || !isActive(s) || s.warnDismissedFor === s.session.expires_at) return false;
  const left = msLeft(s, now);
  return left > 0 && left <= POA_LIMITS.warnBeforeMinutes * 60_000;
}

/** Steps inside the indicator: the questions (as one step), s2a and the one approve screen when anything is left to approve. */
export function steps(s: PoaState): Screen[] {
  // before the start call the modules are unknown: the list assumes all three (only used once modules are known)
  const any = POA_KINDS.some((k) => (s.modules ? s.modules[k].enabled : true) && !s.preDone.includes(k));
  return any ? ["q", "s2a", "approve"] : ["q", "s2a"];
}

/**
 * "שלב N מתוך M", or null. Until the start call answers, `modules` is unknown and M could still change, so the
 * indicator is not shown (spec §2: M is always exact). The questions have their own counter (ס1).
 */
export function progress(s: PoaState): { n: number; m: number } | null {
  if (!s.modules) return null;
  const list = steps(s);
  const i = list.indexOf(s.screen);
  return i < 0 ? null : { n: i + 1, m: list.length };
}

// ───────── validation (spec strings first for blank fields, then the validator's own message)

const blank = (v: string) => !v.trim();
const ADDRESS_MAX = 80;

/** ISO date or the ס1 copy string for the failure (every visible string lives in copy.ts). */
function dateOf(input: string, now: Date): string | { err: string } {
  const r = validateDate(input, { now });
  if (r.ok) return r.value!;
  return validateDate(input, { now, allowFuture: true }).ok ? { err: C.q.errFuture } : { err: C.q.errDate };
}

/**
 * Validate one answer against the details so far. Returns the error to show, or the normalised patch to dispatch.
 * `consent` validates the terms check (the marketing check is free).
 */
export function validateAnswer(key: QKey, d: Details, now: Date = new Date()): { err?: string; patch?: Partial<Details> } {
  switch (key) {
    case "first": case "last": {
      const v = d[key];
      if (blank(v)) return { err: C.q[key].err };
      const r = validatePersonName(v);
      return r.ok ? { patch: { [key]: r.value! } } : { err: r.message };
    }
    case "id": {
      if (blank(d.id)) return { err: C.q.id.err };
      const r = validateIsraeliId(d.id);
      return r.ok ? { patch: { id: r.value! } } : { err: r.message };
    }
    case "zip": {
      if (blank(d.zip)) return { err: C.q.zip.err };
      const r = validateZip(d.zip);
      return r.ok ? { patch: { zip: r.value! } } : { err: r.message };
    }
    case "birth": {
      if (blank(d.birth)) return { err: C.q.birth.err };
      const r = dateOf(d.birth, now);
      if (typeof r !== "string") return { err: r.err };
      const age = ageFromBirth(r, now);
      if (age === null || age > POA_LIMITS.maxAge) return { err: C.q.errDate };
      if (age < POA_LIMITS.minAge) return { err: C.q.errAge };
      return { patch: { birth: r } };
    }
    case "issue": {
      if (blank(d.issue)) return { err: C.q.issue.err };
      const r = dateOf(d.issue, now);
      if (typeof r !== "string") return { err: r.err };
      if (d.birth && r < d.birth) return { err: C.q.errOrder }; // ISO strings compare lexically
      return { patch: { issue: r } };
    }
    case "street": case "city": {
      const v = d[key];
      if (blank(v)) return { err: C.q[key].err };
      const r = validateText(v, { max: ADDRESS_MAX, min: 2 });
      return r.ok ? { patch: { [key]: r.value!.replace(/\s+/g, " ") } } : { err: r.message };
    }
    case "phone": {
      const p = validateIsraeliPhone(d.phone);
      if (!p.ok || !isMobile(p.value!)) return { err: C.q.phone.err };
      return { patch: { phone: p.value! } };
    }
    case "email": {
      if (blank(d.email)) return { patch: { email: "" } };
      const r = validateEmail(d.email);
      return r.ok ? { patch: { email: r.value! } } : { err: r.message };
    }
    case "consent":
      return d.terms ? { patch: { terms: true, marketing: d.marketing } } : { err: C.q.consent.err };
  }
}

/** Every answer valid (the review screen and the start call rely on it). */
export function validateDetails(d: Details, now: Date = new Date()): boolean {
  let acc = d;
  for (const k of Q_KEYS) {
    const r = validateAnswer(k, acc, now);
    if (r.err) return false;
    acc = { ...acc, ...r.patch };
  }
  return true;
}

export const validateCheck = (checked: boolean): string | undefined => (checked ? undefined : C.s4.err);
export const validateSignature = (png: string | null): string | undefined => (png ? undefined : C.s6.err);
