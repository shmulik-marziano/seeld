// Questionnaire logic: conditions, visibility, flow (incl. screening -> follow-up modules), per-question validation, progress.
// Pure functions. The runner UI and the unit tests both use these.
import { isUnknown, UNKNOWN, UNKNOWN_OPTION } from "./types";
import type { AnswerValue, Answers, Condition, Question, Questionnaire, RepeatEntry, Section, SubField } from "./types";
import {
  ageFromBirth, bankCodeFromPick, checkChildAfterParent, checkSpouseNotClient, digitsOnly, validateFullName, MSG, parseDate, parseNumberInput, validateAccountNumber, validateBankCode,
  validateBirthDate, validateBranch, validateDate, validateEmail, validateHeight, validateIsraeliId, validateIsraeliPhone, validateNumber, validatePassport,
  validatePersonName, validateText, validateWeight, validateZip,
} from "./validators";
import type { VResult } from "./validators";
import { limitFor } from "./limits.config";

export const YES = "כן";
export const NO = "לא";

// ---------------------------------------------------------------- answers
export function isBlankAnswer(v: AnswerValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (isUnknown(v)) return false;
  if (typeof v === "object") return Object.values(v).every((x) => isBlankAnswer(x as AnswerValue));
  return false;
}
export const isAnswered = (v: AnswerValue) => !isBlankAnswer(v);

// ---------------------------------------------------------------- conditions
export function conditionMet(c: Condition | null | undefined, answers: Answers): boolean {
  if (!c) return true;
  const a = answers[c.id];
  const values = Array.isArray(c.value) ? c.value : [c.value];
  if (Array.isArray(a)) return (a as unknown[]).some((x) => typeof x === "string" && values.includes(x));
  if (typeof a === "string") return values.includes(a);
  return false;
}
/** Condition inside one repeat entry: refers to a sibling field. */
export function subConditionMet(f: SubField, entry: RepeatEntry): boolean {
  if (!f.when) return true;
  const a = entry[f.when.id];
  const values = Array.isArray(f.when.value) ? f.when.value : [f.when.value];
  return typeof a === "string" && values.includes(a);
}

// ---------------------------------------------------------------- flow
export type StepPhase = "general" | "screening" | "module";
export interface FlowStep {
  key: string;
  q: Question;
  sectionId: string;
  sectionTitle: string;
  phase: StepPhase;
}
export interface ModuleInfo {
  sectionId: string;
  title: string;
  open: boolean;
  /** gate questions of this module and the answer given */
  gates: { key: string; label: string; answer: "yes" | "no" | "unanswered" }[];
  /** the gates answered yes: the reason this follow-up opened */
  reasons: { key: string; label: string }[];
}
export interface ScreeningStatus {
  status: "all_clear" | "follow_up" | "incomplete";
  modules: ModuleInfo[];
  openedModules: string[];
}
export interface Flow {
  steps: FlowStep[];
  visible: Set<string>;
  screening: ScreeningStatus | null;
}
export const SCREENING_SECTION_ID = "__screening";

function gateAnswer(_q: Question, a: AnswerValue): "yes" | "no" | "unanswered" {
  // screening gates are yes/no only: anything else counts as not answered
  if (a === YES) return "yes";
  if (a === NO) return "no";
  return "unanswered";
}

export function questionIndex(def: Questionnaire): Map<string, Question> {
  const m = new Map<string, Question>();
  for (const s of def.sections) for (const q of s.questions) m.set(q.key, q);
  return m;
}

export function computeFlow(def: Questionnaire, answers: Answers): Flow {
  const index = questionIndex(def);
  const gateKeys = new Set((def.screening?.gates ?? []).map((g) => g.key));
  const memo = new Map<string, boolean>();
  const visibleByWhen = (q: Question): boolean => {
    const hit = memo.get(q.key);
    if (hit !== undefined) return hit;
    memo.set(q.key, false); // cycle guard
    let v = true;
    if (q.when) {
      const parent = index.get(q.when.id);
      v = (!parent || visibleByWhen(parent)) && conditionMet(q.when, answers);
    }
    memo.set(q.key, v);
    return v;
  };

  // modules
  let screening: ScreeningStatus | null = null;
  const openSections = new Set<string>();
  if (def.screening) {
    const modules: ModuleInfo[] = [];
    for (const s of def.sections.filter((x) => x.module)) {
      const gates = s.questions.filter((q) => gateKeys.has(q.key) && visibleByWhen(q));
      const info: ModuleInfo = {
        sectionId: s.id,
        title: s.title,
        open: false,
        gates: gates.map((q) => ({ key: q.key, label: q.label, answer: gateAnswer(q, answers[q.key]) })),
        reasons: [],
      };
      info.reasons = info.gates.filter((g) => g.answer === "yes").map((g) => ({ key: g.key, label: g.label }));
      info.open = info.reasons.length > 0;
      if (info.open) openSections.add(s.id);
      modules.push(info);
    }
    const allGates = modules.flatMap((m) => m.gates);
    const anyYes = allGates.some((g) => g.answer === "yes");
    const allNo = allGates.length > 0 && allGates.every((g) => g.answer === "no");
    screening = {
      status: anyYes ? "follow_up" : allNo ? "all_clear" : "incomplete",
      modules,
      openedModules: modules.filter((m) => m.open).map((m) => m.sectionId),
    };
  }

  const steps: FlowStep[] = [];
  const visible = new Set<string>();
  const push = (q: Question, s: Section, phase: StepPhase, titleOverride?: string, idOverride?: string) => {
    steps.push({ key: q.key, q, sectionId: idOverride ?? s.id, sectionTitle: titleOverride ?? s.title, phase });
    visible.add(q.key);
  };
  const modules = def.sections.filter((s) => s.module);
  for (const s of def.sections) {
    if (s.module) continue;
    for (const q of s.questions) if (visibleByWhen(q)) push(q, s, "general");
  }
  if (def.screening) {
    for (const s of modules) for (const q of s.questions) if (gateKeys.has(q.key) && visibleByWhen(q)) push(q, s, "screening", def.screening.title, SCREENING_SECTION_ID);
    for (const s of modules) {
      if (!openSections.has(s.id)) continue;
      for (const q of s.questions) if (!gateKeys.has(q.key) && visibleByWhen(q)) push(q, s, "module");
    }
  }
  return { steps, visible, screening };
}

/** Derived payload field for the health questionnaire (and any questionnaire with screening). */
export function screeningPayload(def: Questionnaire, answers: Answers, answeredAt: string) {
  const f = computeFlow(def, answers);
  if (!f.screening) return null;
  return {
    status: f.screening.status,
    answeredAt,
    version: def.version,
    openedModules: f.screening.modules.filter((m) => m.open).map((m) => m.sectionId),
  };
}

// ---------------------------------------------------------------- validation
export interface QValidation {
  ok: boolean;
  message?: string;
  warning?: string;
  /** repeat groups: entry index -> field id -> message */
  entryErrors?: Record<number, Record<string, string>>;
  /** normalised value for storing (strings keep what the user typed unless a normal form exists) */
  value?: AnswerValue;
}
const pass = (value?: AnswerValue, warning?: string): QValidation => ({ ok: true, value, warning });
const fail = (message: string): QValidation => ({ ok: false, message });
const fromV = (r: VResult<string | number>, store?: (v: string | number) => AnswerValue): QValidation =>
  r.ok ? pass(store ? store(r.value as string | number) : (r.value as AnswerValue), r.warning) : fail(r.message ?? MSG.generic);

export interface ValidateContext {
  answers: Answers;
  now?: Date;
}

function numberOptsFor(q: { min?: number | null; max?: number | null; integer?: boolean; kind?: string; key: string }, now: Date) {
  let max = q.max ?? null;
  if (q.kind === "year") max = Math.max(max ?? 0, now.getFullYear());
  let min = q.min ?? null;
  let integer = !!q.integer;
  if (q.kind === "year" || q.kind === "integer") integer = true;
  if (q.kind === "percent") { if (min === null) min = 0; if (max === null) max = 100; }
  if (q.kind === "amount" && min === null) min = 0;
  let warnAbove: number | null = null;
  if (q.kind === "amount") warnAbove = /annual|שנתי/.test(q.key) ? limitFor("annualIncomeWarnAbove") : /income|salary/.test(q.key) ? limitFor("monthlyIncomeWarnAbove") : limitFor("depositWarnAbove");
  return { min, max, integer, warnAbove };
}

/** Validates ONE value of a simple (non-repeat) field described by the shared shape of Question and SubField. */
function validateSimple(
  spec: {
    key: string; type: string; format: string | null; required: boolean; options: readonly string[] | null; min: number | null; max: number | null;
    integer: boolean; maxLength: number | null; allowUnknown: boolean; allowFuture?: boolean; futureOnly?: boolean; notBefore?: string; birth?: boolean; numberKind?: string;
  },
  v: AnswerValue,
  now: Date,
): QValidation {
  if (isUnknown(v)) return spec.allowUnknown || spec.options?.includes(UNKNOWN_OPTION) ? pass(v) : fail(MSG.required);
  if (isBlankAnswer(v)) return spec.required ? fail(MSG.required) : pass(v);
  switch (spec.type) {
    case "choice": {
      if (typeof v !== "string" || !spec.options?.includes(v)) return fail("אפשר לבחור אחת מהאפשרויות");
      return pass(v);
    }
    case "multi": {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      if (!arr.length) return spec.required ? fail("כדאי לבחור לפחות אפשרות אחת") : pass(v);
      if (arr.some((x) => !spec.options?.includes(x))) return fail("אפשר לבחור מהאפשרויות שמופיעות");
      return pass(v);
    }
    case "consent":
      return v === (spec.options?.[0] ?? "אישור") ? pass(v) : spec.required ? fail("כדי להמשיך צריך לסמן את האישור") : pass(v);
    case "number": {
      const o = numberOptsFor({ min: spec.min, max: spec.max, integer: spec.integer, kind: spec.numberKind, key: spec.key }, now);
      if (spec.numberKind === "height") return fromV(validateHeight(v), (n) => String(n));
      if (spec.numberKind === "weight") return fromV(validateWeight(v), (n) => String(n));
      return fromV(validateNumber(v, o), (n) => String(n));
    }
    case "date": {
      if (spec.birth) return fromV(validateBirthDate(String(v), now));
      return fromV(validateDate(String(v), { allowFuture: spec.allowFuture, futureOnly: spec.futureOnly, now, notBefore: spec.notBefore }));
    }
    case "long":
    case "text": {
      const s = String(v);
      switch (spec.format) {
        case "israeli-id": return fromV(validateIsraeliId(s));
        case "phone": return fromV(validateIsraeliPhone(s));
        case "email": return fromV(validateEmail(s));
        case "passport": return fromV(validatePassport(s));
        case "person-name": return fromV(validatePersonName(s, { max: spec.maxLength ?? 50 }));
        case "digits": return digitsOnly(s) ? pass(digitsOnly(s)) : fail(MSG.generic);
        case "full-name": return fromV(validateFullName(s));
        case "bank-account": return fromV(validateAccountNumber(s));
        case "branch-code": return fromV(validateBranch(s, {}));
        case "bank-pick": return bankCodeFromPick(s) ? pass(s) : fail("כדאי לבחור את הבנק מהרשימה");
      }
      if (/postal_code|zip/.test(spec.key)) return fromV(validateZip(s));
      return fromV(validateText(s, { max: spec.maxLength, required: spec.required }));
    }
    default:
      return pass(v);
  }
}

const SUB_BANK: Record<string, (s: string, e: RepeatEntry) => VResult> = {
  bank_number: (s) => validateBankCode(s),
  branch: (s, e) => validateBranch(s, { bank: typeof e.bank_number === "string" ? e.bank_number : undefined }),
  account: (s) => validateAccountNumber(s),
  holder: (s) => validatePersonName(s),
  co_holder: (s) => validatePersonName(s),
};

export function validateQuestion(q: Question, v: AnswerValue, ctx: ValidateContext): QValidation {
  const now = ctx.now ?? new Date();
  if (q.type === "repeat") return validateRepeat(q, v, ctx);
  const notBefore = q.meta.afterKey && typeof ctx.answers[q.meta.afterKey] === "string" ? (ctx.answers[q.meta.afterKey] as string) : undefined;
  return validateSimple(
    {
      key: q.key, type: q.type, format: q.format, required: q.required, options: q.options, min: q.min_val, max: q.max_val, integer: q.integer_only,
      maxLength: q.max_length, allowUnknown: q.allow_unknown, allowFuture: q.meta.allowFuture, futureOnly: q.meta.futureOnly, notBefore,
      birth: q.meta.dateRole === "birth", numberKind: q.meta.numberKind,
    },
    v,
    now,
  );
}

export function entriesOf(v: AnswerValue): RepeatEntry[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x): x is RepeatEntry => typeof x === "object" && x !== null && !Array.isArray(x)) : [];
}

function validateRepeat(q: Question, v: AnswerValue, ctx: ValidateContext): QValidation {
  const now = ctx.now ?? new Date();
  if (isUnknown(v)) return q.allow_unknown ? pass(v) : fail(MSG.required);
  const entries = entriesOf(v);
  const min = q.meta.minEntries ?? (q.required ? 1 : 0);
  if (entries.length < min && q.required) return fail(entries.length === 0 ? "כדאי להוסיף לפחות פריט אחד" : `כדאי להוסיף עוד ${min - entries.length}`);
  const entryErrors: Record<number, Record<string, string>> = {};
  let warning: string | undefined;
  const clientId = typeof ctx.answers.identity_document === "string" ? ctx.answers.identity_document : "";
  const clientBirth = typeof ctx.answers.birth === "string" ? ctx.answers.birth : "";
  entries.forEach((e, i) => {
    const errs: Record<string, string> = {};
    for (const f of q.fields ?? []) {
      if (!subConditionMet(f, e)) continue;
      const val = e[f.id] as AnswerValue;
      let r: QValidation;
      const special = q.key === "bank_account" ? SUB_BANK[f.id] : undefined;
      if (special && !isBlankAnswer(val) && !isUnknown(val)) {
        const sr = special(String(val), e);
        r = sr.ok ? pass(sr.value, sr.warning) : fail(sr.message ?? MSG.generic);
      } else {
        r = validateSimple(
          {
            key: f.id, type: f.type, format: f.format ?? null, required: !!f.required, options: f.options ?? null, min: f.min ?? null, max: f.max ?? null,
            integer: !!f.integer, maxLength: f.maxLength ?? null, allowUnknown: !!f.allowUnknown, allowFuture: f.allowFuture, birth: f.id === "birth" && f.type === "date",
            numberKind: f.integer ? "integer" : undefined,
          },
          val,
          now,
        );
      }
      if (!r.ok) errs[f.id] = r.message ?? MSG.generic;
      else if (r.warning) warning = r.warning;
    }
    // cross checks
    if (q.key === "spouse") {
      const sid = e.id_number;
      if (typeof sid === "string" && sid && !errs.id_number) {
        const c = checkSpouseNotClient(clientId, sid);
        if (!c.ok) errs.id_number = c.message!;
      }
    }
    if (q.key === "children" || q.key === "spouse") {
      const b = e.birth;
      if (q.key === "children" && typeof b === "string" && b && clientBirth && !errs.birth) {
        const c = checkChildAfterParent(clientBirth, b);
        if (!c.ok) errs.birth = c.message!;
      }
    }
    if (Object.keys(errs).length) entryErrors[i] = errs;
  });
  if (Object.keys(entryErrors).length) return { ok: false, message: "בחלק מהשורות יש פרטים שכדאי לבדוק", entryErrors };
  return pass(v, warning);
}

export function validateAll(def: Questionnaire, answers: Answers, now?: Date): { errors: Record<string, QValidation>; firstKey: string | null; flow: Flow } {
  const flow = computeFlow(def, answers);
  const errors: Record<string, QValidation> = {};
  let firstKey: string | null = null;
  for (const st of flow.steps) {
    const r = validateQuestion(st.q, answers[st.key], { answers, now });
    if (!r.ok) {
      errors[st.key] = r;
      if (!firstKey) firstKey = st.key;
    }
  }
  return { errors, firstKey, flow };
}

// ---------------------------------------------------------------- progress
export interface Progress {
  answered: number;
  total: number;
  sections: { id: string; title: string; answered: number; total: number; current: boolean }[];
}
export function computeProgress(flow: Flow, answers: Answers, currentKey: string | null): Progress {
  const secs: Progress["sections"] = [];
  let answered = 0;
  const cur = flow.steps.find((s) => s.key === currentKey);
  for (const st of flow.steps) {
    let s = secs.find((x) => x.id === st.sectionId);
    if (!s) { s = { id: st.sectionId, title: st.sectionTitle, answered: 0, total: 0, current: cur?.sectionId === st.sectionId }; secs.push(s); }
    s.total++;
    if (isAnswered(answers[st.key])) { s.answered++; answered++; }
  }
  return { answered, total: flow.steps.length, sections: secs };
}

/** Rough duration estimate in minutes from the questionnaire definition (typical path: gated detail 30%, screening follow-up detail 4%). */
export function estimateMinutes(def: Questionnaire): number {
  const weight: Record<string, number> = { choice: 6, multi: 10, consent: 5, text: 12, number: 10, date: 12, long: 40, repeat: 60, file: 30 };
  let sec = 0;
  for (const s of def.sections) for (const q of s.questions) sec += (weight[q.type] ?? 10) * (s.module && !q.meta.gate ? 0.04 : q.when ? 0.3 : 1);
  return Math.max(1, Math.round(sec / 60));
}

// ---------------------------------------------------------------- repeat helpers
export function emptyEntry(q: Question): RepeatEntry {
  const e: RepeatEntry = {};
  for (const f of q.fields ?? []) e[f.id] = f.type === "multi" ? [] : "";
  return e;
}
export function addEntry(v: AnswerValue, q: Question): RepeatEntry[] {
  const list = entriesOf(v);
  if (q.meta.maxEntries && list.length >= q.meta.maxEntries) return list;
  return [...list, emptyEntry(q)];
}
export function removeEntry(v: AnswerValue, index: number): RepeatEntry[] {
  return entriesOf(v).filter((_, i) => i !== index);
}
/** Entry count that follows a numeric answer (children_count). */
export function desiredEntryCount(q: Question, answers: Answers): number | null {
  if (!q.meta.countFrom) return null;
  const n = parseNumberInput(answers[q.meta.countFrom]);
  return Number.isInteger(n) && n >= 0 && n <= 30 ? n : null;
}
/** Short chip text for a filled entry. */
export function entrySummary(q: Question, e: RepeatEntry): string {
  const parts: string[] = [];
  for (const f of q.fields ?? []) {
    const v = e[f.id];
    if (typeof v === "string" && v.trim() && f.type !== "long" && parts.length < 2) parts.push(f.format === "israeli-id" ? "ת״ז ••" + v.slice(-3) : v);
  }
  if (q.key === "children" && typeof e.birth === "string") {
    const a = ageFromBirth(e.birth);
    if (a !== null) parts.push(a < 18 ? "קטין/ה" : "בגיר/ה");
  }
  return parts.join(" · ") || "פריט חדש";
}
export { UNKNOWN, parseDate };
