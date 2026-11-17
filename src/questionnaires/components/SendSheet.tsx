// Agent-side "שליחת שאלון ללקוח" sheet: pick questionnaire, customer reference, expiry -> link + one-time code + share buttons.
// Mock only: nothing is sent anywhere. Share links are plain deep links built from the generic department contacts.
import { useEffect, useRef, useState } from "react";
import { CONTACTS, DEPT_LABEL } from "@/lib/contacts";
import type { ContactDept } from "@/lib/contacts";
import { requestsAdapter } from "../mocks";
import type { CreatedRequest } from "../adapters";
import { copyText } from "../format";
import index from "@/data/questionnaires.index.json";

type Item = { key: string; title: string; status: string };
export const SEND_EXPIRY: { days: 1 | 3 | 7 | 14 | 30; label: string }[] = [
  { days: 1, label: "יום" }, { days: 3, label: "3 ימים" }, { days: 7, label: "שבוע" }, { days: 14, label: "שבועיים" },
];

export function shareText(title: string, url: string, dept: ContactDept) {
  return `שלום, זה הצוות של שילד. הכנו לך שאלון קצר (${title}) למילוי בטלפון.\nהקישור: ${url}\nאת קוד הכניסה נמסור לך בנפרד.\nלשאלות: ${CONTACTS[dept].phone}`;
}

export function SendSheet({ open, onClose, presetKey }: { open: boolean; onClose: () => void; presetKey?: string }) {
  const items = (index as Item[]).filter((i) => i.key !== "health" || true);
  const [key, setKey] = useState(presetKey ?? "personal");
  const [ref, setRef] = useState("");
  const [days, setDays] = useState<1 | 3 | 7 | 14 | 30>(7);
  const [dept, setDept] = useState<ContactDept>("insurance");
  const [res, setRes] = useState<CreatedRequest | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const first = useRef<HTMLSelectElement>(null);
  useEffect(() => { if (open) { setRes(null); setErr(""); setCopied(""); if (presetKey) setKey(presetKey); setTimeout(() => first.current?.focus(), 30); } }, [open, presetKey]);
  useEffect(() => { if (!open) return; const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [open, onClose]);
  if (!open) return null;
  const title = items.find((i) => i.key === key)?.title ?? "";
  const create = async () => {
    if (!ref.trim()) { setErr("צריך להזין אסמכתה של הלקוח (קוד פנימי, לא שם)"); return; }
    setErr("");
    setRes(await requestsAdapter.create({ questionnaireKey: key, customerRef: ref, expiresInDays: days }));
  };
  const text = res ? shareText(title, res.url, dept) : "";
  const doCopy = async (what: string, t: string) => { setCopied((await copyText(t)) ? what : ""); };
  return (
    <div className="sd-q-sheet-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sd-q-sheet" role="dialog" aria-modal="true" aria-labelledby="q-send-h" dir="rtl">
        <h2 id="q-send-h">שליחת שאלון ללקוח</h2>
        <p className="sd-q-note" role="note">מצב הדגמה: הקישור והקוד נוצרים בזיכרון הדפדפן בלבד ואינם פעילים בשרת. שום הודעה לא נשלחת.</p>
        {!res ? (
          <>
            <div className="sd-q-subfield">
              <label className="sd-q-sublabel" htmlFor="q-send-key">איזה שאלון</label>
              <select id="q-send-key" ref={first} className="sd-q-input" value={key} onChange={(e) => setKey(e.target.value)}>
                {items.map((i) => <option key={i.key} value={i.key}>{i.title}{i.status !== "live" ? " (טיוטה)" : ""}</option>)}
              </select>
            </div>
            <div className="sd-q-subfield">
              <label className="sd-q-sublabel" htmlFor="q-send-ref">אסמכתה של הלקוח</label>
              <input id="q-send-ref" className="sd-q-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="קוד פנימי של הלקוח או התיק" aria-describedby="q-send-ref-h" />
              <small id="q-send-ref-h" className="sd-q-fine">לא שם ולא תעודת זהות. הקישור עצמו לא מכיל פרטים אישיים.</small>
            </div>
            <fieldset className="sd-q-subfield">
              <legend className="sd-q-sublabel">תוקף הקישור</legend>
              <div className="sd-q-choices is-many">
                {SEND_EXPIRY.map((e) => <button key={e.days} type="button" role="radio" aria-checked={days === e.days} className={`sd-q-choice ${days === e.days ? "is-on" : ""}`} onClick={() => setDays(e.days)}>{e.label}</button>)}
              </div>
            </fieldset>
            {err && <p className="sd-q-error" role="alert">{err}</p>}
            <div className="sd-q-confirm-actions">
              <button type="button" className="sd-q-btn" onClick={create}>יצירת קישור וקוד</button>
              <button type="button" className="sd-q-btn is-quiet" onClick={onClose}>סגירה</button>
            </div>
          </>
        ) : (
          <>
            <div className="sd-q-linkbox">
              <div><small>הקישור</small><code dir="ltr">{res.url}</code><button type="button" className="sd-q-linkbtn" onClick={() => doCopy("link", res.url)}>{copied === "link" ? "הועתק" : "העתקה"}</button></div>
              <div><small>קוד כניסה חד־פעמי</small><code dir="ltr" className="sd-q-code">{res.code}</code><button type="button" className="sd-q-linkbtn" onClick={() => doCopy("code", res.code)}>{copied === "code" ? "הועתק" : "העתקה"}</button></div>
              <small className="sd-q-fine">תוקף עד {new Date(res.request.expiresAt).toLocaleDateString("he-IL")}. את הקוד מוסרים בנפרד מהקישור. QR: ייתווסף אחרי אישור ספרייה (כרגע אין).</small>
            </div>
            <div className="sd-q-subfield">
              <label className="sd-q-sublabel" htmlFor="q-send-dept">הצוות שמופיע בהודעה</label>
              <select id="q-send-dept" className="sd-q-input" value={dept} onChange={(e) => setDept(e.target.value as ContactDept)}>
                {(Object.keys(DEPT_LABEL) as ContactDept[]).map((d) => <option key={d} value={d}>{DEPT_LABEL[d]}</option>)}
              </select>
            </div>
            <div className="sd-q-share">
              <a className="sd-q-btn is-quiet" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">וואטסאפ</a>
              <a className="sd-q-btn is-quiet" href={`sms:?&body=${encodeURIComponent(text)}`}>הודעת טקסט</a>
              <a className="sd-q-btn is-quiet" href={`mailto:?subject=${encodeURIComponent(`שאלון: ${title}`)}&body=${encodeURIComponent(text)}`}>דואר אלקטרוני</a>
              <button type="button" className="sd-q-btn is-quiet" onClick={() => doCopy("text", text)}>{copied === "text" ? "הועתק" : "העתקת ההודעה"}</button>
            </div>
            <pre className="sd-q-preview" dir="rtl">{text}</pre>
            <div className="sd-q-confirm-actions"><button type="button" className="sd-q-btn" onClick={onClose}>סיום</button><button type="button" className="sd-q-btn is-quiet" onClick={() => setRes(null)}>קישור נוסף</button></div>
          </>
        )}
      </div>
    </div>
  );
}
