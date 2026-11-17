// Dashboard-side viewer: a completed or partial questionnaire grouped by section, copy-ready for the agent's system.
// Per-field and per-section copy, "copy all", JSON and CSV export, a Surense-order view (by mapped target field when the bank has one), ID masking with reveal.
import { useMemo, useState } from "react";
import type { Answers, Questionnaire } from "../types";
import { buildView, copyText, downloadText, sectionToText, surenseOrder, toCsv, toJsonExport, toPlainText } from "../format";

export function ResponseViewer({ def, answers, title }: { def: Questionnaire; answers: Answers; title?: string }) {
  const [reveal, setReveal] = useState(false);
  const [mode, setMode] = useState<"sections" | "surense">("sections");
  const [flash, setFlash] = useState("");
  const view = useMemo(() => buildView(def, answers, { maskIds: !reveal }), [def, answers, reveal]);
  const exportView = useMemo(() => buildView(def, answers, { maskIds: false }), [def, answers]);
  const ordered = useMemo(() => surenseOrder(view), [view]);
  const say = (m: string) => { setFlash(m); window.setTimeout(() => setFlash(""), 1800); };
  const copy = async (text: string, what: string) => say((await copyText(text)) ? `${what} הועתק` : "ההעתקה נחסמה בדפדפן, אפשר לסמן ולהעתיק ידנית");
  const plain = (key: string) => exportView.flatMap((s) => s.rows).find((r) => r.key === key)?.text ?? "";
  const total = view.reduce((a, s) => a + s.rows.length, 0);

  return (
    <section className="sd-q-viewer" aria-label={title ?? `תוצאות: ${def.title}`}>
      <div className="sd-q-viewer-top">
        <div>
          <h2>{title ?? def.title}</h2>
          <p className="sd-q-fine">{total} תשובות · גרסה {def.version}</p>
        </div>
        <div className="sd-q-viewer-actions">
          <label className="sd-q-switch"><input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> הצגת מספרי זהות</label>
          <button type="button" className="sd-q-btn" onClick={() => copy(toPlainText(def, exportView), "הכול")}>העתק הכול</button>
          <button type="button" className="sd-q-btn is-quiet" onClick={() => downloadText(`${def.key}.json`, "application/json", toJsonExport(def, exportView))}>JSON</button>
          <button type="button" className="sd-q-btn is-quiet" onClick={() => downloadText(`${def.key}.csv`, "text/csv", toCsv(exportView), true)}>CSV</button>
        </div>
      </div>
      <div className="sd-q-tabs" role="tablist" aria-label="תצוגה">
        <button type="button" role="tab" aria-selected={mode === "sections"} className={mode === "sections" ? "is-on" : ""} onClick={() => setMode("sections")}>לפי פרקים</button>
        <button type="button" role="tab" aria-selected={mode === "surense"} className={mode === "surense" ? "is-on" : ""} onClick={() => setMode("surense")}>מוכן להעתקה לשורנס</button>
      </div>
      <p className="sd-q-live" role="status" aria-live="polite">{flash}</p>
      {total === 0 && <p className="sd-q-p">עדיין אין תשובות להצגה.</p>}
      {mode === "surense" && (
        <>
          {ordered.mapped.length === 0 && <p className="sd-q-note">בבנק השאלות עדיין אין מיפוי לשדות שורנס, ולכן התצוגה מסודרת לפי פרקים. אפשר להוסיף מיפוי בשדה meta.surenseField.</p>}
          {ordered.mapped.length > 0 && <RowList title="לפי שדה יעד" rows={ordered.mapped.map((r) => ({ ...r, label: `${r.surenseField} · ${r.label}` }))} onCopy={(k, w) => copy(plain(k), w)} />}
        </>
      )}
      {(mode === "sections" || ordered.mapped.length === 0) && view.map((s) => (
        <RowList key={s.id} title={s.title} rows={s.rows} onCopy={(k, w) => copy(plain(k), w)} onCopySection={() => copy(sectionToText({ ...s, rows: exportView.find((x) => x.id === s.id)?.rows ?? s.rows }), s.title)} />
      ))}
    </section>
  );
}

function RowList({ title, rows, onCopy, onCopySection }: { title: string; rows: { key: string; label: string; text: string; raw: unknown; sectionTitle: string }[]; onCopy: (key: string, what: string) => void; onCopySection?: () => void }) {
  return (
    <div className="sd-q-rv-sec">
      <div className="sd-q-rv-head">
        <h3>{title}</h3>
        {onCopySection && <button type="button" className="sd-q-linkbtn" onClick={onCopySection}>העתק</button>}
      </div>
      <dl>
        {rows.map((r) => (
          <div key={r.key} className="sd-q-rv-row">
            <dt>{r.label}</dt>
            <dd style={{ whiteSpace: "pre-line" }}>{r.text}</dd>
            <button type="button" className="sd-q-linkbtn" onClick={() => onCopy(r.key, "הערך")} aria-label={`העתקת הערך: ${r.label}`}>העתק</button>
          </div>
        ))}
      </dl>
    </div>
  );
}
