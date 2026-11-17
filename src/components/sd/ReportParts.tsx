import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./sd.css";
import "./home-entry.css";

/**
 * Shared pieces of the personal report flow (public explainer /report and the signed-in shell /app/report).
 * UI only: nothing here uploads, stores or sends a file. The flow opens after the design phase.
 */

export const REPORT_STEPS = [
  { id: "upload", t: "העלאת קבצים", s: "קובץ מסלקה וקובץ הר הביטוח שהורדתם מהאתרים הרשמיים." },
  { id: "review", t: "סקירת הדוח", s: "הנתונים מסודרים בדוח מידע בעיצוב שילד, לקריאה ולשמירה." },
  { id: "join", t: "הצטרפות והסכמות", s: "אם תרצו להמשיך: הצטרפות לסוכנות ואישור הסכמות, כל אחת בנפרד." },
  { id: "sign", t: "חתימה על מינוי סוכן", s: "טופס מינוי סוכן לחתימה דיגיטלית, רק בהחלטה שלכם." },
  { id: "order", t: "הזמנת מידע", s: "בקשה למידע ממבטחים, דרך הסוכנות ובאישורכם." },
] as const;

export const REPORT_DISCLAIMER = "הדוח הוא דוח מידע ואינו מהווה ייעוץ או המלצה.";

export function ReportStepper({ active = 0, headingLevel: H = "h2" }: { active?: number; headingLevel?: "h2" | "h3" }) {
  return (
    <section aria-label="שלבי הפקת הדוח">
      <H className="sr-only">שלבי הפקת הדוח</H>
      <ol className="sd-home-stepper">
        {REPORT_STEPS.map((x, i) => (
          <li key={x.id} className={i === active ? "is-on" : ""} aria-current={i === active ? "step" : undefined}>
            <span className="sd-home-rnum" aria-hidden="true">{i + 1}</span>
            <b>{x.t}</b>
            <small>{x.s}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Visibly disabled drop zone. No input, no handlers: it cannot receive a file. */
export function ReportDropZone() {
  return (
    <div className="sd-home-drop" role="group" aria-disabled="true" aria-label="אזור העלאת קבצים, בקרוב">
      <img src="/art/icons/document.svg" alt="" width={52} height={52} />
      <b>העלאת קבצים תיפתח בקרוב</b>
      <p>כאן יעלו קובץ מסלקה וקובץ הר הביטוח. עד שהתהליך ייפתח, לא מעלים קבצים באתר.</p>
      <span className="sd-home-btn-off" aria-disabled="true">בחירת קבצים</span>
    </div>
  );
}

export function ReportNote({ children }: { children: ReactNode }) {
  return <p className="sd-home-note" role="note">{children}</p>;
}

/** Steps 3 to 5 as honest "coming soon" cards. */
export function ReportNextCards({ publicPage }: { publicPage?: boolean }) {
  return (
    <div className="sd-home-two">
      <div className="sd-home-card" id="join">
        <h3>הצטרפות והסכמות</h3>
        <p>ההצטרפות לסוכנות היא החלטה נפרדת מהדוח. כל הסכמה מוצגת בנפרד ואפשר לא לאשר אותה:</p>
        <ul>
          <li>הסכמה לעיבוד המידע שהועלה לצורך הפקת הדוח</li>
          <li>הסכמה למדיניות הפרטיות</li>
          <li>הסכמה ליצירת קשר מהצוות</li>
        </ul>
        {publicPage && <p><Link to="/privacy" className="sd-link">מדיניות הפרטיות</Link></p>}
      </div>
      <div className="sd-home-card" id="sign">
        <h3>חתימה על מינוי סוכן</h3>
        <p>מינוי סוכן הוא טופס שמסמיך את הסוכנות לפעול מול גופים פיננסיים בשמכם. החתימה הדיגיטלית תתאפשר רק לאחר שקראתם את הטופס ואישרתם.</p>
        <div className="sd-home-actions"><span className="sd-home-btn-off" aria-disabled="true">חתימה על מינוי, בקרוב</span></div>
      </div>
      <div className="sd-home-card" id="order">
        <h3>הזמנת מידע ממבטחים</h3>
        <p>בקשה לקבל מידע על המוצרים שלכם ישירות מהמבטחים, דרך הסוכנות. הבקשה נשלחת רק לאחר אישור שלכם.</p>
        <div className="sd-home-actions"><span className="sd-home-btn-off" aria-disabled="true">הזמנת מידע, בקרוב</span></div>
      </div>
      <div className="sd-home-card">
        <h3>מה הדוח כולל</h3>
        <p>סידור של המידע שבקבצים שהעליתם: מוצרים, גופים ונתונים שמופיעים בהם, במקום אחד ובצורה קריאה. הדוח אינו מחליף שיחה עם הצוות. {REPORT_DISCLAIMER}</p>
      </div>
    </div>
  );
}
