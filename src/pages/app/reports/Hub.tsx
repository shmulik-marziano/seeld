// /app/reports: three entry options (Har Habituach file, Maslaka file, information order: coming soon), how-to guides, demo report.
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SdPic } from "@/components/sd/primitives";
import { GUIDES, type Guide } from "@/reports/guides";
import { assembleReportData } from "@/reports/parsers";
import type { ParseResult } from "@/reports/parsers/types";
import { Uploader, type UploadKind } from "./Uploader";
import { setUploadedReport } from "./store";

function GuideBlock({ guide }: { guide: Guide }) {
  return (
    <details className="rpx-guide">
      <summary>{guide.title}</summary>
      <div className="rpx-guide-body">
        <div className="rpx-guide-art" aria-hidden="true"><SdPic name={guide.art} sizes="260px" /></div>
        <div>
          <p className="rpx-quiet">הקובץ שצריך: {guide.fileLabel}</p>
          <ol className="rpx-steps">
            {guide.steps.map((s) => (
              <li key={s.title}>
                <b>{s.title}</b>
                <span>{s.text}</span>
                {s.todoVerify && <em className="rpx-verify">הצעד טרם אומת מול האתר הרשמי</em>}
              </li>
            ))}
          </ol>
          <ul className="rpx-notes">{guide.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          <p className="rpx-sources"><b>מקורות:</b> {guide.sources.map((s, i) => <span key={s.url}>{i > 0 ? " · " : ""}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}</p>
        </div>
      </div>
    </details>
  );
}

export default function Hub() {
  const nav = useNavigate();
  const [har, setHar] = useState<ParseResult | null>(null);
  const [mas, setMas] = useState<ParseResult | null>(null);
  const onHar = useCallback((r: ParseResult | null) => setHar(r), []);
  const onMas = useCallback((r: ParseResult | null) => setMas(r), []);
  const ready = !!(har || mas);

  const open = () => {
    setUploadedReport(assembleReportData({ har, maslaka: mas }));
    nav(`/app/reports/view?src=upload&mode=${har && mas ? "unified" : har ? "insurance" : "financial"}`);
  };

  const card = (kind: UploadKind, title: string, text: string, guide: Guide, onParsed: (r: ParseResult | null) => void, tone: string) => (
    <section className={`rpx-card rpx-tone-${tone}`} aria-labelledby={`rpx-${kind}`}>
      <h2 id={`rpx-${kind}`} className="rpx-h2"><span className="rpx-num" aria-hidden="true">{kind === "har" ? 1 : 2}</span>{title}</h2>
      <p>{text}</p>
      <GuideBlock guide={guide} />
      <Uploader kind={kind} onParsed={onParsed} />
    </section>
  );

  return (
    <div className="sd rpx-hub" dir="rtl">
      <header className="rpx-head">
        <div>
          <span className="sd-eyebrow">דוח אישי</span>
          <h1 className="rpx-h1">הפקת דוח מידע אישי</h1>
          <p className="rpx-lead">מעלים קובץ אחד או שניים, והמערכת מסדרת את המידע בדוח בעיצוב שילד: דוח ביטוח, דוח פיננסי או דוח מאוחד, לפי מה שהועלה. הדוח הוא דוח מידע, ואינו ייעוץ או המלצה.</p>
          <p className="rpx-privacy" role="note">העיבוד מתבצע במכשיר שלכם, ושום דבר לא נשלח לשום מקום.</p>
        </div>
        <div className="rpx-head-art" aria-hidden="true"><SdPic name="10-financial-planning" sizes="(min-width:900px) 380px, 80vw" priority /></div>
      </header>

      <div className="rpx-grid">
        {card("har", "קובץ הר הביטוח", "מתוכו נבנה דוח הביטוח: הפוליסות, החברות והפרמיות.", GUIDES[0], onHar, "sky")}
        {card("maslaka", "קובץ המסלקה", "מתוכו נבנה הדוח הפיננסי: פנסיה, גמל, השתלמות, דמי ניהול ומסלולים.", GUIDES[1], onMas, "sage")}
        <section className="rpx-card rpx-tone-butter is-soon" aria-labelledby="rpx-order" aria-disabled="true">
          <h2 id="rpx-order" className="rpx-h2"><span className="rpx-num" aria-hidden="true">3</span>הזמנת מידע והמתנה ליצירת הדוח <span className="rpx-soon">בקרוב</span></h2>
          <p>מי שאין לו את הקבצים: אנחנו נבקש את המידע עבורו ונחזור כשהדוח מוכן. התהליך בהכנה ועדיין לא פתוח.</p>
          <span className="rpx-btn is-off" aria-disabled="true">בקרוב</span>
        </section>
      </div>

      <div className="rpx-actions">
        <button type="button" className="rpx-btn rpx-btn-main" disabled={!ready} onClick={open}>הצגת הדוח מהקבצים שהועלו</button>
        <button type="button" className="rpx-btn" onClick={() => nav("/app/reports/view?mode=unified")}>צפייה בדוח לדוגמה</button>
      </div>
      {!ready && <p className="rpx-quiet">הדוח לדוגמה מציג נתונים בדויים בלבד.</p>}
    </div>
  );
}
