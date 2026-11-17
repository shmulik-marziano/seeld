// Input renderers for every question type. Validation messages are shown by the runner (on blur / continue), never while typing.
import { useEffect, useRef, useState } from "react";
import type { AnswerValue, Answers, Question, RepeatEntry, SubField } from "../types";
import { isUnknown, UNKNOWN, UNKNOWN_OPTION } from "../types";
import { addEntry, desiredEntryCount, emptyEntry, entriesOf, entrySummary, removeEntry, subConditionMet } from "../logic";
import { computeBmi, formatDateHe, parseDate, parseNumberInput, toIso, fmtNum } from "../validators";
import { BankPicker, BranchNumberField, CityPicker, HealthFundPicker, StreetPicker } from "./pickers";
import { bankCodeFromPick } from "../validators";

export interface FieldProps {
  q: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  onBlur?: () => void;
  /** advance after a single-choice tap */
  onPickAdvance?: () => void;
  answers: Answers;
  inputId: string;
  describedBy?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  /** entry-level errors for repeat groups */
  entryErrors?: Record<number, Record<string, string>>;
  now?: Date;
}

/** A repeat sub-field presented as a question so the same renderer serves both. */
export function subToQuestion(f: SubField, parentKey: string): Question {
  return {
    key: `${parentKey}.${f.id}`, label: f.label, section: "", type: f.type, required: !!f.required, allow_unknown: !!f.allowUnknown, format: f.format ?? null, hint: null,
    options: f.options ?? null, when: null, fields: null, min_val: f.min ?? null, max_val: f.max ?? null, integer_only: !!f.integer, max_length: f.maxLength ?? null,
    origin: "qlio", confidence: null, version: 1,
    meta: { sectionId: "", allowFuture: f.allowFuture, numberKind: f.integer ? "integer" : undefined, dateRole: f.id === "birth" && f.type === "date" ? "birth" : undefined },
  };
}

const str = (v: AnswerValue) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const hasUnknownOption = (q: Question) => !!q.options?.includes(UNKNOWN_OPTION);

export function UnknownToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`sd-q-unknown ${on ? "is-on" : ""}`} aria-pressed={on} onClick={onToggle}>
      {on ? "סימנת 'לא יודע/ת'. לחיצה נוספת תחזיר לשדה" : "לא יודע/ת"}
    </button>
  );
}

function ChoiceField({ q, value, onChange, onPickAdvance, inputId }: FieldProps) {
  const opts = (q.options ?? []).filter((o) => o !== UNKNOWN_OPTION);
  const showUnknown = (hasUnknownOption(q) || q.allow_unknown) && !q.meta.gate; // screening gates are yes/no only
  const yesNo = opts.length === 2 && opts.includes("כן") && opts.includes("לא");
  const pick = (o: string) => { onChange(o); onPickAdvance?.(); };
  const unk = isUnknown(value) || value === UNKNOWN_OPTION;
  return (
    <div>
      <div role="radiogroup" aria-labelledby={`${inputId}-label`} className={`sd-q-choices ${yesNo ? "is-yesno" : opts.length > 4 ? "is-many" : ""}`}>
        {opts.map((o, i) => (
          <button key={o} id={i === 0 ? inputId : undefined} type="button" role="radio" aria-checked={value === o} className={`sd-q-choice ${value === o ? "is-on" : ""}`} onClick={() => pick(o)}>
            {o}
          </button>
        ))}
      </div>
      {showUnknown && (
        <UnknownToggle on={unk} onToggle={() => { if (unk) onChange(""); else { onChange(hasUnknownOption(q) ? UNKNOWN_OPTION : UNKNOWN); onPickAdvance?.(); } }} />
      )}
    </div>
  );
}

function MultiField({ q, value, onChange, inputId }: FieldProps) {
  const sel = Array.isArray(value) ? (value as string[]) : [];
  const opts = (q.options ?? []).filter((o) => o !== UNKNOWN_OPTION);
  const toggle = (o: string) => onChange(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
  const unk = isUnknown(value);
  return (
    <div>
      <div role="group" aria-labelledby={`${inputId}-label`} className="sd-q-choices is-multi">
        {opts.map((o, i) => (
          <label key={o} className={`sd-q-choice is-check ${sel.includes(o) ? "is-on" : ""}`}>
            <input id={i === 0 ? inputId : undefined} type="checkbox" checked={sel.includes(o)} onChange={() => toggle(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
      {q.allow_unknown && <UnknownToggle on={unk} onToggle={() => onChange(unk ? [] : UNKNOWN)} />}
    </div>
  );
}

function ConsentField({ q, value, onChange, inputId, onBlur }: FieldProps) {
  const label = q.options?.[0] ?? "אישור";
  return (
    <label className={`sd-q-choice is-check ${value === label ? "is-on" : ""}`}>
      <input id={inputId} type="checkbox" checked={value === label} onChange={(e) => { onChange(e.target.checked ? label : ""); onBlur?.(); }} />
      <span>{label}</span>
    </label>
  );
}

function adornment(q: Question): string | null {
  if (q.meta.unit) return q.meta.unit;
  return null;
}

function TextLike({ q, value, onChange, onBlur, inputId, describedBy, invalid, autoFocus }: FieldProps) {
  const unk = isUnknown(value);
  const v = unk ? "" : str(value);
  const long = q.type === "long";
  const nk = q.meta.numberKind;
  const mode: "numeric" | "decimal" | "tel" | "email" | "text" =
    q.type === "number" ? (nk === "integer" || nk === "year" || q.integer_only ? "numeric" : "decimal") : q.format === "israeli-id" || q.format === "digits" || q.format === "bank-account" || q.format === "branch-code" || /postal_code/.test(q.key) ? "numeric" : q.format === "phone" ? "tel" : q.format === "email" ? "email" : "text";
  const ltr = !!q.format && q.format !== "person-name" && q.format !== "full-name" || q.type === "number" || /postal_code/.test(q.key);
  const unit = adornment(q);
  const common = {
    id: inputId, "aria-describedby": describedBy, "aria-invalid": invalid || undefined, disabled: unk, autoFocus, onBlur,
    placeholder: q.format === "full-name" ? "שם פרטי ושם משפחה" : q.format === "bank-account" ? "4 עד 9 ספרות" : q.format === "israeli-id" ? "9 ספרות" : q.format === "phone" ? "052-1234567" : q.format === "email" ? "name@example.com" : q.type === "number" && nk === "height" ? "172" : q.type === "number" && nk === "weight" ? "68" : undefined,
  };
  return (
    <div>
      {long ? (
        <div>
          <textarea {...common} className="sd-q-input sd-q-textarea" rows={4} maxLength={undefined} value={v} onChange={(e) => onChange(e.target.value)} />
          {q.max_length && <small className={`sd-q-counter ${v.length > q.max_length ? "is-over" : ""}`}>{v.length}/{q.max_length}</small>}
        </div>
      ) : (
        <div className="sd-q-inputwrap">
          <input {...common} className="sd-q-input" type="text" inputMode={mode} dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: "right" } : undefined} autoComplete={q.format === "email" ? "email" : q.format === "phone" ? "tel" : "off"}
            value={v} onChange={(e) => onChange(e.target.value)} />
          {unit && <span className="sd-q-unit" aria-hidden="true">{unit}</span>}
        </div>
      )}
      {q.allow_unknown && <UnknownToggle on={unk} onToggle={() => onChange(unk ? "" : UNKNOWN)} />}
    </div>
  );
}

function DateField({ q, value, onChange, onBlur, inputId, describedBy, invalid, autoFocus }: FieldProps) {
  const unk = isUnknown(value);
  const raw = unk ? "" : str(value);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const [text, setText] = useState(iso ? formatDateHe(raw) : raw);
  useEffect(() => { setText(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? formatDateHe(raw) : raw); }, [raw]);
  return (
    <div>
      <input id={inputId} className="sd-q-input" type="text" inputMode="numeric" dir="ltr" style={{ textAlign: "right" }} placeholder="יום/חודש/שנה, למשל 07/05/1990" disabled={unk} autoFocus={autoFocus}
        aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete={q.meta.dateRole === "birth" ? "bday" : "off"} value={text}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
        onBlur={() => { const p = parseDate(text); if (p) { onChange(toIso(p)); setText(formatDateHe(toIso(p))); } onBlur?.(); }} />
      {q.allow_unknown && <UnknownToggle on={unk} onToggle={() => onChange(unk ? "" : UNKNOWN)} />}
    </div>
  );
}

// ---------------------------------------------------------------- simple input dispatcher (also used for repeat sub-fields)
export function SimpleInput(p: FieldProps) {
  const { q } = p;
  if (q.meta.widget === "city") return <CityPicker id={p.inputId} value={str(p.value)} onChange={p.onChange} onBlur={p.onBlur} describedBy={p.describedBy} invalid={p.invalid} />;
  if (q.meta.widget === "street") return <StreetPicker id={p.inputId} value={str(p.value)} onChange={p.onChange} onBlur={p.onBlur} describedBy={p.describedBy} invalid={p.invalid} cityName={str(p.answers.address_city)} />;
  if (q.meta.widget === "bank") return <BankPicker id={p.inputId} value={str(p.value)} onChange={p.onChange} onBlur={p.onBlur} describedBy={p.describedBy} invalid={p.invalid} />;
  if (q.meta.widget === "branch") return <BranchNumberField id={p.inputId} value={str(p.value)} bankCode={bankCodeFromPick(str(p.answers.dd_bank)) ?? ""} onChange={p.onChange} onBlur={p.onBlur} describedBy={p.describedBy} invalid={p.invalid} />;
  if (q.meta.widget === "healthfund") return <HealthFundPicker id={p.inputId} value={str(p.value)} onChange={(v) => { p.onChange(v); p.onPickAdvance?.(); }} extra={(q.options ?? []).filter((o) => !["כללית", "מכבי", "מאוחדת", "לאומית"].includes(o) && o !== UNKNOWN_OPTION)} />;
  switch (q.type) {
    case "choice": return <ChoiceField {...p} />;
    case "multi": return <MultiField {...p} />;
    case "consent": return <ConsentField {...p} />;
    case "date": return <DateField {...p} />;
    case "repeat": return <RepeatField {...p} />;
    case "file": return <p className="sd-q-assist">העלאת קבצים תיפתח בקרוב.</p>;
    default: return <TextLike {...p} />;
  }
}

// ---------------------------------------------------------------- repeat groups
function RepeatEntryForm({ q, entry, index, errors, onChange, answers }: { q: Question; entry: RepeatEntry; index: number; errors?: Record<string, string>; onChange: (e: RepeatEntry) => void; answers: Answers }) {
  const set = (id: string, v: AnswerValue) => onChange({ ...entry, [id]: v });
  return (
    <div className="sd-q-entry-fields">
      {(q.fields ?? []).map((f) => {
        if (!subConditionMet(f, entry)) return null;
        const sq = subToQuestion(f, q.key);
        const id = `q-${q.key}-${index}-${f.id}`;
        const err = errors?.[f.id];
        const val = entry[f.id] as AnswerValue;
        return (
          <div key={f.id} className="sd-q-subfield">
            <label id={`${id}-label`} htmlFor={id} className="sd-q-sublabel">{f.label}{f.required ? "" : " (לא חובה)"}</label>
            <SimpleInput q={sq} value={val} onChange={(v) => set(f.id, v)} answers={answers} inputId={id} invalid={!!err} describedBy={err ? `${id}-err` : undefined} />
            {err && <p id={`${id}-err`} className="sd-q-error" role="alert">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}

function RepeatField({ q, value, onChange, answers, entryErrors, inputId }: FieldProps) {
  const entries = entriesOf(value);
  const single = !!q.meta.singleForm || q.meta.maxEntries === 1;
  const target = desiredEntryCount(q, answers);
  const [open, setOpen] = useState(0);
  const seeded = useRef(false);
  // single-form groups always have exactly one entry; count-driven groups follow the count answer
  useEffect(() => {
    if (seeded.current) return;
    if (single && entries.length === 0) { seeded.current = true; onChange([emptyEntry(q)]); }
    else if (target && entries.length === 0) { seeded.current = true; onChange(Array.from({ length: target }, () => emptyEntry(q))); }
  }, [single, target, entries.length, q, onChange]);
  useEffect(() => { // keep entry count in step with the "how many" answer without losing typed rows
    if (!target || entries.length === 0) return;
    if (entries.length < target) onChange([...entries, ...Array.from({ length: target - entries.length }, () => emptyEntry(q))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  const unk = isUnknown(value);
  if (unk) return <UnknownToggle on onToggle={() => onChange([])} />;
  const update = (i: number, e: RepeatEntry) => onChange(entries.map((x, j) => (j === i ? e : x)));
  if (single && entries[0]) {
    return <div id={inputId}><RepeatEntryForm q={q} entry={entries[0]} index={0} errors={entryErrors?.[0]} onChange={(e) => update(0, e)} answers={answers} /></div>;
  }
  const atMax = !!q.meta.maxEntries && entries.length >= q.meta.maxEntries;
  return (
    <div id={inputId} className="sd-q-repeat">
      <ul className="sd-q-entries">
        {entries.map((e, i) => {
          const isOpen = open === i;
          const hasErr = !!entryErrors?.[i];
          return (
            <li key={i} className={`sd-q-entry ${isOpen ? "is-open" : ""} ${hasErr ? "has-error" : ""}`}>
              <div className="sd-q-entry-head">
                <button type="button" className="sd-q-chipbtn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="sd-q-entry-no">{i + 1}</span>
                  <span>{entrySummary(q, e)}</span>
                  {hasErr && <span className="sd-q-chip is-warn">כדאי לבדוק</span>}
                </button>
                <button type="button" className="sd-q-linkbtn" onClick={() => { onChange(removeEntry(value, i)); setOpen(Math.max(0, i - 1)); }} aria-label={`מחיקת פריט ${i + 1}`}>מחיקה</button>
              </div>
              {isOpen && <RepeatEntryForm q={q} entry={e} index={i} errors={entryErrors?.[i]} onChange={(n) => update(i, n)} answers={answers} />}
            </li>
          );
        })}
      </ul>
      {!atMax && !(target && entries.length >= target) && (
        <button type="button" className="sd-q-add" onClick={() => { const next = addEntry(value, q); onChange(next); setOpen(next.length - 1); }}>
          + {entries.length ? "הוספת פריט נוסף" : "הוספת פריט"}
        </button>
      )}
      {q.allow_unknown && entries.length === 0 && <UnknownToggle on={false} onToggle={() => onChange(UNKNOWN)} />}
    </div>
  );
}

// ---------------------------------------------------------------- BMI note (height + weight, adult only, number only)
export function BmiNote({ answers, age }: { answers: Answers; age: number | null }) {
  const h = parseNumberInput(answers.height);
  const w = parseNumberInput(answers.weight);
  const r = h > 0 && w > 0 ? computeBmi(h, w, age) : null;
  if (!r) return null;
  return (
    <p className="sd-q-assist" role="status">
      {r.warning ? <span>{r.warning}</span> : <span>מדד מסת גוף מחושב: <b dir="ltr">{fmtNum(r.value)}</b>. זה רק מספר לשימוש הצוות, לא הערכה.</span>}
    </p>
  );
}
