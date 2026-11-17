// Frame pieces: header strip, cover, personal letter, "what we found", disclaimer, footer.
import { ContactIcons } from "@/components/sd/ContactIcons";
import { SdPic } from "@/components/sd/primitives";
import { CONTACTS, GENERAL_MAILBOX } from "@/lib/contacts";
import { formatDate } from "../format";
import type { ReportMode } from "../types";
import { useReport } from "./context";

export const MODE_LABEL: Record<ReportMode, string> = { insurance: "דוח ביטוח", financial: "דוח פיננסי", unified: "דוח מאוחד" };
export const TEAM_LABEL = "צוות שילד";

const COVER_ART: Record<ReportMode, string> = { insurance: "02-family-protection", financial: "04-investments-growth", unified: "10-financial-planning" };

export function useAudience(): string {
  const { report } = useReport();
  const d = report.data;
  if (d.persons.length > 1 && d.familyLabel) return `${d.familyLabel}`;
  return d.persons[0]?.displayName ?? "";
}

export function HeaderStrip() {
  const { report } = useReport();
  const first = report.data.persons[0];
  const audience = useAudience();
  return (
    <div className="rp-strip">
      <img className="rp-logo" src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={110} height={46} />
      <dl>
        <div><dt>תאריך הדוח</dt><dd>{formatDate(report.data.asOfDate)}</dd></div>
        <div><dt>עבור</dt><dd>{audience}{report.data.persons.length === 1 && first ? <> · ת״ז <bdi dir="ltr">{first.idMasked}</bdi></> : null}</dd></div>
        <div><dt>הוכן על ידי</dt><dd>{TEAM_LABEL}</dd></div>
      </dl>
    </div>
  );
}

export function Cover() {
  const { report } = useReport();
  return (
    <section className="rp-cover" aria-labelledby="rp-cover-h">
      <div className="rp-cover-art" aria-hidden="true"><SdPic name={COVER_ART[report.mode]} sizes="(min-width:900px) 520px, 92vw" priority /></div>
      <div className="rp-cover-text">
        <span className="rp-eyebrow">{MODE_LABEL[report.mode]}</span>
        <h1 id="rp-cover-h" className="rp-h1">דוח מידע אישי</h1>
        <p className="rp-slogan">כל המידע שלכם, מסודר במקום אחד ובשפה פשוטה.</p>
        <p className="rp-quiet">נכון לתאריך {formatDate(report.data.asOfDate)}</p>
      </div>
    </section>
  );
}

export function Letter() {
  const { report } = useReport();
  const audience = useAudience();
  const dept = report.mode === "insurance" ? "insurance" : "general";
  return (
    <section className="rp-block rp-letter" aria-labelledby="rp-letter-h">
      <h2 id="rp-letter-h" className="rp-h2">מכתב פתיחה</h2>
      <p>שלום {audience},</p>
      <p>תודה שהעליתם אלינו את הקבצים. ריכזנו אותם לדוח אחד שמסדר את המידע שנמצא בהם: מה קיים, אצל מי, ובאילו נתונים שדווחו. זהו דוח מצב לפני כל טיפול, ובו אין שום שינוי במוצרים שלכם.</p>
      <p>הדוח מציג מידע בלבד. הוא אינו ייעוץ ואינו המלצה לפעולה כלשהי.</p>
      <p>חלק מהנתונים אינו מופיע בקבצים הציבוריים, למשל נתונים שנמצאים רק אצל המבטח. במקום כל נתון כזה תראו בלוק מסומן, עם הסבר ממה הוא מורכב ואיך אפשר להשלים אותו. מי שהחלק הזה חשוב לו, מוזמן לפנות אלינו.</p>
      <p className="rp-sign">{TEAM_LABEL}</p>
      <div className="rp-letter-contact rp-noprint"><span>לשאלות, אנחנו כאן:</span><ContactIcons dept={dept} tone="dark" /></div>
    </section>
  );
}

export function Found() {
  const { report } = useReport();
  const s = report.summary;
  const cov = report.coverage;
  const pct = cov.total ? Math.round((cov.shown / cov.total) * 100) : 0;
  const src = [report.data.sources.har ? "קובץ הר הביטוח" : null, report.data.sources.maslaka ? "קובץ המסלקה" : null].filter(Boolean).join(" ו");
  return (
    <section className="rp-block rp-found" aria-labelledby="rp-found-h">
      <h2 id="rp-found-h" className="rp-h2">מה מצאנו</h2>
      <ul className="rp-found-list">
        <li><b>{report.data.persons.length}</b><span>{report.data.persons.length === 1 ? "אדם בדוח" : "אנשים בדוח"}</span></li>
        {report.mode !== "insurance" && <li><b>{s.savingsCount}</b><span>מוצרי חיסכון</span></li>}
        {report.mode !== "financial" && <li><b>{s.insuranceCount}</b><span>פוליסות ביטוח</span></li>}
      </ul>
      <p>המקור: {src || "לא התקבל מידע"}. הנתונים נכונים לתאריך {formatDate(report.data.asOfDate)}.</p>
      {s.olderExtractionCount > 0 && <p className="rp-warn">{s.olderExtractionCount} מוצרים מופיעים לפי הפקה קודמת של המסלקה, ומסומנים ככאלה.</p>}
      {s.unclassifiedCount > 0 && <p className="rp-warn">{s.unclassifiedCount} מוצרים בסוג שאינו מוכר לנו, והם מוצגים "לא התקבל מידע".</p>}
      {s.unknownStatusCount > 0 && <p className="rp-warn">{s.unknownStatusCount} מוצרים בסטטוס שאינו מוכר לנו, והסטטוס מוצג "לא התקבל מידע".</p>}
      {s.notShownGroups.length > 0 && <p className="rp-quiet">נקראו מהקבצים אך עדיין לא מוצגים: {s.notShownGroups.join(", ")}.</p>}
      <div className="rp-coverage" role="group" aria-label="כמה מחלקי הדוח מוצגים">
        <p><b>{cov.shown} מתוך {cov.total} חלקי הדוח מוצגים</b></p>
        <div className="rp-meter" role="progressbar" aria-valuemin={0} aria-valuemax={cov.total} aria-valuenow={cov.shown} aria-label={`${cov.shown} מתוך ${cov.total} חלקי הדוח מוצגים`}><i style={{ inlineSize: `${pct}%` }} /></div>
        <p className="rp-quiet">החלקים שלא מוצגים מסומנים בדוח, עם הסבר מה חסר ואיך אפשר להשלים.</p>
      </div>
    </section>
  );
}

/** Short generic disclaimer. TODO-legal: the final wording needs legal review before launch; no regulatory claims are made here. */
export function Disclaimer() {
  return (
    <p className="rp-disclaimer">
      המידע בדוח נאסף מקבצים שהופקו ממקורות ציבוריים (הר הביטוח והמסלקה הפנסיונית) ומוצג כפי שהתקבל. הדוח הוא דוח מידע, אינו ייעוץ או המלצה, ואינו מחליף את מסמכי הפוליסה ואת הדוחות של הגופים המנהלים. ייתכנו אי-דיוקים ופערי זמן.
    </p>
  );
}

const DISCLAIMER_TEXT = "דוח מידע בלבד, אינו ייעוץ או המלצה. המידע נאסף ממקורות ציבוריים ומוצג כפי שהתקבל; ייתכנו אי-דיוקים ופערי זמן.";

/** Print footer: browsers cannot repeat a rich footer on every page, so the A4 version uses @page margin boxes (text only). */
function PrintFooterStyle() {
  const { report } = useReport();
  const c = CONTACTS[report.mode === "insurance" ? "insurance" : "general"];
  const css = `@media print { @page { @bottom-left { content: "${DISCLAIMER_TEXT}"; font: 6.5pt Rubik, sans-serif; color: #4F6176; width: 40%; text-align: right; vertical-align: middle; }
    @bottom-right { content: "${formatDate(report.data.asOfDate)}  ·  פנו אלינו: ${c.phone}  ·  ${GENERAL_MAILBOX}"; font: 7.5pt Rubik, sans-serif; color: #203957; width: 36%; text-align: left; vertical-align: middle; } } }`;
  return <style>{css}</style>;
}

export function Footer() {
  const { report } = useReport();
  const dept = report.mode === "insurance" ? "insurance" : "general";
  return (
    <div className="rp-footer" role="contentinfo">
      <PrintFooterStyle />
      <Disclaimer />
      <div className="rp-footer-row">
        <span className="rp-pageno" aria-hidden="true" />
        <span>{formatDate(report.data.asOfDate)}</span>
        <span className="rp-footer-contact">פנו אלינו <ContactIcons dept={dept} tone="dark" /></span>
      </div>
    </div>
  );
}
