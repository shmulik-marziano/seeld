// Hub: the four core questionnaires, a separate group of drafts for approval, the meeting mode and the "send to client" sheet.
import { useState } from "react";
import { Link } from "react-router-dom";
import index from "@/data/questionnaires.index.json";
import { defaultStore } from "../adapters";
import { SendSheet } from "./SendSheet";
import { SdSpot } from "@/components/sd/SdSpot";
import { NOT_SENT_NOTICE } from "../copy";
import { CORE_KEYS, EXTRA_KEYS } from "../registry";
import "../questionnaires.css";

interface Row { key: string; title: string; description: string; status: "live" | "draft-for-approval"; group: "core" | "extra"; sections: number; questions: number; minutes: number; drafts: number; hasScreening: boolean; sensitive: boolean }
const SPOT: Record<string, "key-brass" | "passport" | "family-figures" | "heart-pink" | "scales" | "tea-hourglass" | "shield-navy" | "briefcase" | "compass" | "magnifier" | "olive-sapling" | "suitcase"> = {
  "direct-debit": "key-brass", personal: "passport", "personal-extended": "family-figures", health: "heart-pink", "needs-assessment": "scales", "retirement-planning": "tea-hourglass",
  "insurance-need": "shield-navy", "occupation-income": "briefcase", "hazardous-activities": "compass", "accidents-disability": "magnifier", "savings-join": "olive-sapling", "travel-trip": "suitcase",
};

function statusOf(key: string): { label: string; tone: "idle" | "progress" } {
  if (key === "health") return { label: "לא נשמר מראש", tone: "idle" };
  const snap = defaultStore.load(key);
  const n = snap ? Object.keys(snap.answers).length : 0;
  return n > 0 ? { label: `בתהליך · ${n} תשובות`, tone: "progress" } : { label: "לא התחיל", tone: "idle" };
}

export default function Hub() {
  const rows = index as Row[];
  const [send, setSend] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const group = (g: "core" | "extra") => (g === "core" ? CORE_KEYS : EXTRA_KEYS).map((k) => rows.find((r) => r.key === k)).filter(Boolean) as Row[];
  const card = (r: Row) => {
    const st = statusOf(r.key);
    return (
      <li key={r.key} className="sd-q-hubcard">
        <SdSpot name={SPOT[r.key] ?? "pen"} size={56} className="sd-q-hubspot" />
        <div className="sd-q-hubbody">
          <h3>{r.title}{r.status !== "live" && <span className="sd-q-chip">טיוטה</span>}{r.sensitive && <span className="sd-q-chip is-warn">מידע בריאותי</span>}</h3>
          <p>{r.description}</p>
          <p className="sd-q-hubmeta">
            <span>{r.hasScreening ? "שאלון סינון" : `${r.questions} שאלות`}</span><span>כ־{r.minutes} דקות</span><span className={`sd-q-status is-${st.tone}`}>{st.label}</span>
            {r.drafts > 0 && <span>{r.drafts} שאלות טיוטה</span>}
          </p>
          <div className="sd-q-hubactions">
            <Link className="sd-q-btn" to={`/app/questionnaires/${r.key}`}>{st.tone === "progress" ? "המשך מילוי" : "התחלה"}</Link>
            <button type="button" className="sd-q-btn is-quiet" onClick={() => { setSend(r.key); setOpen(true); }}>שליחה ללקוח</button>
            {!r.sensitive && <Link className="sd-q-linkbtn" to={`/app/questionnaires/${r.key}/results`}>תוצאות</Link>}
          </div>
        </div>
      </li>
    );
  };
  return (
    <div className="sd-q sd-q-hub" dir="rtl">
      <header className="sd-q-top">
        <p className="sd-q-eyebrow">שדרת השאלונים</p>
        <h1 className="sd-q-title">שאלונים</h1>
        <p className="sd-q-p">ממלאים יחד עם הלקוח, שולחים לו קישור, או רושמים במפגש. כל שאלה נבדקת בזמן המילוי, והסקירה בסוף מראה הכול.</p>
        <p className="sd-q-note" role="note">{NOT_SENT_NOTICE}</p>
        <div className="sd-q-hubtop-actions">
          <Link to={"/app/questionnaires/meeting"} className="sd-q-btn is-quiet">מצב מפגש</Link>
          <button type="button" className="sd-q-btn is-quiet" onClick={() => { setSend(null); setOpen(true); }}>שליחת שאלון ללקוח</button>
        </div>
      </header>
      <main className="sd-q-main sd-q-hubmain">
        <h2 className="sd-q-h2">ארבעת השאלונים</h2>
        <ul className="sd-q-hubgrid">{group("core").map(card)}</ul>
        <h2 className="sd-q-h2">שאלונים נוספים</h2>
        <p className="sd-q-p">שאלונים לפי נושא, שנבנו מתוך בנק השאלות. שאלון הנסיעות עדיין בטיוטה.</p>
        <ul className="sd-q-hubgrid">{group("extra").map(card)}</ul>
      </main>
      <SendSheet open={open} onClose={() => setOpen(false)} presetKey={send ?? undefined} />
    </div>
  );
}
