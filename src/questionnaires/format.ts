// Formatters for the ResponseViewer: clean Hebrew plain text, CSV, JSON, masking. Pure and unit tested.
import { isUnknown, UNKNOWN_OPTION } from "./types";
import type { AnswerValue, Answers, Question, Questionnaire, RepeatEntry, SubField } from "./types";
import { computeFlow, entriesOf, isAnswered } from "./logic";
import { fmtMoney, fmtNum, formatDateHe, formatPhone, parseNumberInput } from "./validators";

export function maskId(id: string): string {
  const d = id.replace(/\D/g, "");
  if (d.length <= 3) return "•".repeat(d.length);
  return "•".repeat(d.length - 3) + d.slice(-3);
}

interface Shape { key: string; type: string; format: string | null; label: string; unit?: string; numberKind?: string }
const shapeOfQ = (q: Question): Shape => ({ key: q.key, type: q.type, format: q.format, label: q.label, unit: q.meta.unit, numberKind: q.meta.numberKind });
const shapeOfF = (f: SubField): Shape => ({ key: f.id, type: f.type, format: f.format ?? null, label: f.label, numberKind: f.integer ? "integer" : undefined });

export interface FormatOpts { maskIds?: boolean }

function formatScalar(s: Shape, v: AnswerValue, o: FormatOpts): string {
  if (isUnknown(v)) return UNKNOWN_OPTION;
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return (v as unknown[]).map(String).join(", ");
  const str = String(v);
  if (!str.trim()) return "";
  if (s.type === "date") return formatDateHe(str);
  if (s.format === "phone") return formatPhone(str);
  if (s.format === "israeli-id") return o.maskIds ? maskId(str) : str;
  if (s.type === "number") {
    const n = parseNumberInput(str);
    if (!Number.isFinite(n)) return str;
    if (s.numberKind === "year" || s.key.endsWith("_year")) return String(n);
    if (s.unit === "₪" || s.numberKind === "amount") return fmtMoney(n);
    if (s.unit === "%" || s.numberKind === "percent") return `${fmtNum(n)}%`;
    return s.unit ? `${fmtNum(n)} ${s.unit}` : fmtNum(n);
  }
  return str;
}

export function formatValue(q: Question, v: AnswerValue, o: FormatOpts = {}): string {
  if (q.type === "repeat") {
    if (isUnknown(v)) return UNKNOWN_OPTION;
    const entries = entriesOf(v);
    return entries.map((e, i) => `${i + 1}. ${formatEntry(q, e, o)}`).join("\n");
  }
  return formatScalar(shapeOfQ(q), v, o);
}
export function formatEntry(q: Question, e: RepeatEntry, o: FormatOpts = {}): string {
  const parts: string[] = [];
  for (const f of q.fields ?? []) {
    const t = formatScalar(shapeOfF(f), e[f.id], o);
    if (t) parts.push(`${f.label}: ${t}`);
  }
  return parts.join(", ");
}

export interface ViewRow { key: string; label: string; text: string; raw: AnswerValue; surenseField?: string; sectionTitle: string }
export interface ViewSection { id: string; title: string; rows: ViewRow[] }

/** Visible, answered fields grouped by section (screening gates keep their own section titles). */
export function buildView(def: Questionnaire, answers: Answers, o: FormatOpts & { includeUnanswered?: boolean } = {}): ViewSection[] {
  const flow = computeFlow(def, answers);
  const out: ViewSection[] = [];
  const bySection = new Map<string, ViewSection>();
  const sectionOf = new Map(def.sections.map((s) => [s.id, s]));
  for (const st of flow.steps) {
    const v = answers[st.key];
    if (!o.includeUnanswered && !isAnswered(v)) continue;
    // group by the question's own section so follow-up modules read under their body-system title
    const real = sectionOf.get(st.q.meta.sectionId);
    const id = real?.id ?? st.sectionId;
    let sec = bySection.get(id);
    if (!sec) { sec = { id, title: real?.title ?? st.sectionTitle, rows: [] }; bySection.set(id, sec); out.push(sec); }
    sec.rows.push({ key: st.key, label: st.q.label, text: formatValue(st.q, v, o) || "(לא נענה)", raw: v, surenseField: st.q.meta.surenseField, sectionTitle: sec.title });
  }
  return out;
}

export const rowText = (r: ViewRow) => `${r.label}: ${r.text.includes("\n") ? "\n" + r.text : r.text}`;
export function sectionToText(s: ViewSection): string {
  return [s.title, ...s.rows.map(rowText)].join("\n");
}
export function toPlainText(def: Questionnaire, sections: ViewSection[]): string {
  return [def.title, "", ...sections.map(sectionToText).flatMap((t) => [t, ""])].join("\n").trimEnd() + "\n";
}

/** Rows ordered by target field when the bank has a mapping (meta.surenseField), unmapped rows after, in section order. */
export function surenseOrder(sections: ViewSection[]): { mapped: ViewRow[]; unmapped: ViewRow[] } {
  const all = sections.flatMap((s) => s.rows);
  const mapped = all.filter((r) => r.surenseField).sort((a, b) => a.surenseField!.localeCompare(b.surenseField!));
  return { mapped, unmapped: all.filter((r) => !r.surenseField) };
}

const csvCell = (v: string) => {
  let s = v;
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // spreadsheet formula injection guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(sections: ViewSection[]): string {
  const lines = ["פרק,מפתח,שאלה,תשובה"];
  for (const s of sections) for (const r of s.rows) lines.push([s.title, r.key, r.label, r.text].map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}
export function toJsonExport(def: Questionnaire, sections: ViewSection[], now = new Date()): string {
  const fields: Record<string, { label: string; value: AnswerValue; text: string; section: string }> = {};
  for (const s of sections) for (const r of s.rows) fields[r.key] = { label: r.label, value: r.raw, text: r.text, section: s.title };
  return JSON.stringify({ questionnaire: { key: def.key, version: def.version, title: def.title }, exportedAt: now.toISOString(), fields }, null, 2);
}

// ---------------------------------------------------------------- clipboard / download helpers (browser)
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}
export function downloadText(filename: string, mime: string, text: string, bom = false) {
  const blob = new Blob([bom ? "﻿" + text : text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
