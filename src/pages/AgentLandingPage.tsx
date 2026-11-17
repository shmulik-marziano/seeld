import { Link } from "react-router-dom";
import { PubPage, PubHero, PubCta, Arrow } from "@/components/sd/pubParts";
import { SdBand, SdIcon, SdPic } from "@/components/sd/primitives";
import "@/components/sd/client.css";

// /agents: landing for insurance agents and agencies. Colour bands, kit illustrations, calm copy.
// No invented figures: the page describes what the platform does, nothing it cannot back up.

const PAIN = [
  { icon: "hourglass", t: "רוב היום לא הולך על לקוחות", p: "מילוי טפסים, רדיפה אחרי חתימות, העתקה בין מערכות ובדיקת דברים שנשכחו. הזמן הזה שייך ללקוחות, לא לניירת." },
  { icon: "search", t: "המידע מפוזר בכמה מערכות", p: "מסלקה, הר הביטוח, אקסל, מיילים ווטסאפ. בכל פעם שצריך תמונה מלאה על לקוח, מרכיבים פאזל, וכשחתיכה חסרה, נוצר ליקוי." },
  { icon: "wallet", t: "כסף נשמט בלי שרואים", p: "בלי מעקב שיטתי, עמלות נשמטות, מינויים לא עוברים והפקדות לא מגיעות. קשה לדעת מה מגיע, וקשה יותר לרדוף." },
];

const PILLARS = [
  { icon: "client", t: "קליטה חכמה", p: "הלקוח מקבל קישור, ממלא מהנייד וחותם דיגיטלית, והנתונים כבר בפנים." },
  { icon: "checklist", t: "ניתוח והמלצה", p: "המערכת סורקת את התיק, מזהה פערים, כפילויות ודמי ניהול גבוהים, ומכינה המלצות מקצועיות לעיון ולהחלטה שלכם." },
  { icon: "briefcase", t: "ביצוע", p: "טפסים, מסמכים וחתימות זורמים מול החברות, וליקויים מטופלים ברגע שהם מגיעים." },
  { icon: "shield", t: "שימור ובקרה", p: "תזכורות, אירועי חיים, תביעות ומעקב עמלות, כדי שלא יישאר לקוח בלי מענה." },
];

const CHAIN = ["ליד", "קליטה", "נתונים", "ניתוח", "המלצה", "הצגה", "חיתום", "ביצוע", "מעקב", "שימור"];

const TOOLS = [
  "ניהול לידים ולקוחות", "סריקת מסמכים אוטומטית", "שליפה ממסלקה והר הביטוח", "ניתוח תיק מקצועי", "בניית המלצות",
  "הצגה ללקוח עם מעקב החלטות", "חתימות דיגיטליות והרשאות", "ניהול חיתום רפואי", "מילוי טפסים אוטומטי",
  "שיגור מסמכים לחברות ביטוח", "תיקון ליקויים", "מעקב ביצוע ופולו-אפ", "שימור לקוחות ואירועי חיים",
  "שירות שוטף ופניות", "ניהול תביעות", "מעקב עמלות", "ניהול מעסיקים", "בקרה רגולטורית",
  "תקשורת רב-ערוצית", "ניהול משימות ויומן", "מאגר ידע מקצועי",
];

const STEPS = [
  { icon: "key", t: "נרשמים", p: "פותחים חשבון, מעלים לוגו ומתחילים. בלי התקנות ובלי הדרכות ארוכות." },
  { icon: "handshake", t: "מחברים", p: "מייבאים את הלקוחות הקיימים ורואים תמונה מלאה של הסוכנות, במקום אחד." },
  { icon: "dashboard", t: "עובדים בשקט", p: "המערכת מטפלת בניירת, ואתם מטפלים בלקוחות." },
];

const SECURITY = [
  { t: "הצפנה", d: "הנתונים מוגנים בהצפנה בתעבורה ובאחסון" },
  { t: "הפרדה", d: "כל סוכנות רואה רק את הנתונים שלה" },
  { t: "תיעוד", d: "כל פעולה מתועדת לצורכי שקיפות ובקרה" },
];

export default function AgentLandingPage() {
  return (
    <PubPage tint="sky">
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "לסוכנים" }]}
        eyebrow="פורטל לסוכני ביטוח · BETA"
        title="הזמן שלכם שווה יותר מניירת"
        lead="SEELD היא פלטפורמת ניהול לסוכנות הביטוח: מקום אחד, כל הכלים, ופחות עבודה מיותרת בין הלקוח לבין ההחלטה."
        art="08-business-insurance"
        actions={
          <>
            <Link to="/app/auth" className="sd-btn">להתחיל בחינם<Arrow /></Link>
            <Link to="/app/auth" className="sd-link">כניסה למערכת<Arrow /></Link>
          </>
        }
      />

      <SdBand tone="sage">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <span className="sd-eyebrow">מה מכביד</span>
            <h2 className="sd-h2">עובדים כפול, וזה לא הולך לשום מקום</h2>
          </div>
          <ul className="sd-ca-agents-grid c3">
            {PAIN.map((x) => (
              <li key={x.t} className="sd-ca-feature sd-reveal">
                <SdIcon name={x.icon} size={52} />
                <h3 className="sd-h3 mt-3">{x.t}</h3>
                <p>{x.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </SdBand>

      <SdBand tone="butter">
        <div className="sd-wrap sd-story-grid">
          <div className="sd-story-art sd-reveal" aria-hidden="true"><SdPic name="10-financial-planning" sizes="(min-width:1024px) 480px, 90vw" /></div>
          <div>
            <span className="sd-eyebrow">איך נראה יום אחר</span>
            <h2 className="sd-h2 mt-4">מקום אחד שמכסה הכול</h2>
            <p className="sd-lead mt-5">
              נכנסים בבוקר ופותחים מסך אחד. המשימות של היום, הלקוחות שצריכים תשומת לב, המסמכים שממתינים והעמלות שנכנסו, הכול שם.
            </p>
            <p className="sd-lead mt-3">בלי לקפוץ בין מערכות, בלי לשכוח ובלי להקליד פעמיים.</p>
            <div className="sd-pub-actions">
              <Link to="/app/auth" className="sd-btn">להתחיל בחינם<Arrow /></Link>
            </div>
          </div>
        </div>
      </SdBand>

      <SdBand tone="sky">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <span className="sd-eyebrow">מה זה SEELD</span>
            <h2 className="sd-h2">מערכת עבודה לסוכנות הביטוח</h2>
            <p className="sd-text">מהרגע שליד חדש נכנס, דרך ניתוח התיק וההמלצה, ביצוע מול החברות ועד שימור הלקוח לאורך זמן. שרשרת שלמה, במקום אחד.</p>
          </div>
          <ul className="sd-ca-agents-grid c4">
            {PILLARS.map((x) => (
              <li key={x.t} className="sd-ca-feature sd-reveal">
                <SdIcon name={x.icon} size={52} />
                <h3 className="sd-h3 mt-3">{x.t}</h3>
                <p>{x.p}</p>
              </li>
            ))}
          </ul>
        </div>
      </SdBand>

      <SdBand tone="rose">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <h2 className="sd-h2">מליד חדש ועד שימור, הכול מכוסה</h2>
            <p className="sd-text">כל שלב בשרשרת מנוהל, ושום דבר לא נופל בין הכיסאות.</p>
          </div>
          <ol className="sd-ca-chain">
            {CHAIN.map((c, i) => (
              <li key={c}><i aria-hidden="true">{i + 1}</i>{c}</li>
            ))}
          </ol>
        </div>
      </SdBand>

      <SdBand tone="lavender">
        <div className="sd-wrap sd-ca-twocol">
          <div>
            <span className="sd-eyebrow">סוויטה שלמה</span>
            <h2 className="sd-h2 mt-4">לא עוד כלי בודד</h2>
            <p className="sd-text mt-4">
              רוב המערכות פותרות בעיה אחת. כאן הכלים המקצועיים עובדים יחד כמערכת אחת ומנהלים סוכנות ביטוח מקצה לקצה.
            </p>
          </div>
          <ul className="sd-pub-list">
            {TOOLS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </SdBand>

      <SdBand tone="sage">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <h2 className="sd-h2">שלושה צעדים, וזהו</h2>
          </div>
          <ol className="sd-ca-agents-grid c3">
            {STEPS.map((x, i) => (
              <li key={x.t} className="sd-ca-feature sd-reveal">
                <SdIcon name={x.icon} size={52} />
                <small className="sd-eyebrow" style={{ display: "flex" }}>{String(i + 1).padStart(2, "0")}</small>
                <h3 className="sd-h3 mt-2">{x.t}</h3>
                <p>{x.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </SdBand>

      <SdBand tone="butter">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <h2 className="sd-h2">נבנה בשבילכם</h2>
          </div>
          <div className="sd-ca-agents-grid c2">
            <div className="sd-ca-feature">
              <SdIcon name="briefcase" size={52} />
              <h3 className="sd-h3 mt-3">סוכנים עצמאיים</h3>
              <p>עובדים לבד? המערכת היא הצוות שלכם. היא לא שוכחת, לא צריכה חופש, ומאפשרת להתמקד במה שאתם הכי טובים בו.</p>
            </div>
            <div className="sd-ca-feature">
              <SdIcon name="dashboard" size={52} />
              <h3 className="sd-h3 mt-3">מנהלי סוכנויות</h3>
              <p>רואים מי עובד על מה, איפה יש עומס ואיפה הכסף. דוחות, מדדים ובקרה, בלי לשאול שאלות.</p>
            </div>
          </div>
        </div>
      </SdBand>

      <SdBand tone="cream">
        <div className="sd-wrap-narrow">
          <div className="sd-band-head">
            <span className="sd-eyebrow">אבטחה ואמון</span>
            <h2 className="sd-h2">אבטחת מידע בשלוש שכבות</h2>
            <p className="sd-text">
              השימוש בפלטפורמה כפוף ל<Link to="/terms" className="underline underline-offset-4">תנאי השימוש</Link> ול<Link to="/privacy" className="underline underline-offset-4">מדיניות הפרטיות</Link> שלנו.
            </p>
          </div>
          <ul className="sd-pub-list">
            {SECURITY.map((x) => (
              <li key={x.t}><span><b>{x.t}</b> · {x.d}</span></li>
            ))}
          </ul>
        </div>
      </SdBand>

      <PubCta
        title="מספיק עם הניירת"
        text="נשמח להראות איך זה עובד בסוכנות שלכם. ההקמה פשוטה, בעברית, ובלי התקנה."
        art="11-claims-service"
        primary={{ label: "להתחיל בחינם", to: "/app/auth" }}
        secondary={{ label: "יש שאלות? דברו איתנו", to: "/contact" }}
      />

      <section className="sd-band sd-band-white">
        <div className="sd-wrap-narrow" style={{ display: "grid", gap: 8 }}>
          <p className="sd-small">
            <b style={{ color: "var(--gold-d)" }}>BETA</b> · הפלטפורמה נמצאת בשלבי השקה ראשוניים. חלק מהכלים עדיין בפיתוח ויופעלו בהדרגה. ייתכנו שינויים בפונקציונליות, בממשק ובתנאי השימוש ללא הודעה מוקדמת.
          </p>
          <p className="sd-small">
            SEELD מספקת פלטפורמת ניהול עזר לסוכני ביטוח. האחריות המקצועית, הרגולטורית והמשפטית על כל פעולה, המלצה ועסקה מוטלת על הסוכן בלבד. השימוש בפלטפורמה אינו מהווה ייעוץ משפטי, פיננסי או ביטוחי מטעם SEELD.
          </p>
        </div>
      </section>
    </PubPage>
  );
}
