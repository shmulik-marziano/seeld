import { ContactIcons } from "@/components/sd/ContactIcons";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdIcon, SdPic, SdProcess } from "@/components/sd/primitives";
import { Arrow, PubCta, PubHero, PubPage } from "@/components/sd/pubParts";
import { PASTELS, type Pastel } from "@/components/sd/topics";
import "@/components/sd/sd-pub.css";

// "הצוות המקצועי" (route kept as /authors so the URL, ProfilePage schema and links stay valid).
// The team is presented without names: areas of expertise, how we work, direct contact.

const specialties: { icon: string; tone: Pastel; title: string; description: string }[] = [
  { icon: "shield", tone: "sky", title: "ביטוח כללי", description: "ביטוחי בריאות, חיים, רכב, דירה, עסק ונסיעות." },
  { icon: "hourglass", tone: "butter", title: "חיסכון ופנסיה", description: "קרנות פנסיה, קופות גמל, קרנות השתלמות והשקעות." },
  { icon: "lock", tone: "lavender", title: "ביטוח סיעודי", description: "תכנון כיסוי סיעודי מותאם למבוגרים ולמשפחות." },
  { icon: "handshake", tone: "rose", title: "תכנון פיננסי למשפחות", description: "ליווי כלכלי בכל שלבי החיים, מהחתונה ועד הפרישה." },
  { icon: "checklist", tone: "sage", title: "ביטוח עסקי", description: "פתרונות ביטוח לעסקים קטנים ולעסקים גדולים." },
  { icon: "search", tone: "sky", title: "מיצוי זכויות", description: "איתור כספים אבודים והחזרי מס." },
];

const steps = [
  { icon: "phone", t: "שיחה ראשונה", p: "מספרים לנו מה חשוב לכם. אנחנו מקשיבים לפני שמציעים. בלי התחייבות מצידכם." },
  { icon: "search", t: "בדיקה והשוואה", p: "הצוות בודק את התיק מול החברות בשוק ומסכם לכם בשפה פשוטה." },
  { icon: "shield", t: "ליווי לאורך הדרך", p: "אחרי שמחליטים אנחנו נשארים: חידושים, שינויים במשפחה ותביעות." },
];

export default function Authors() {
  return (
    <PubPage tint="sage">
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "הצוות המקצועי" }]}
        eyebrow="הצוות המקצועי"
        title="צוות סוכנים בתחומי הביטוח, הפנסיה והפיננסים"
        lead="ליווי מקצועי ואישי בתחומי הביטוח, הפנסיה והפיננסים. כל פנייה מגיעה לצוות שלם של סוכנים, ולא תלויה באדם אחד."
        art="02-family-protection"
        actions={
          <>
            <Link to="/contact" className="sd-btn">תיאום פגישה<Arrow /></Link>
            <Link to="/about" className="sd-link">עוד עלינו<Arrow /></Link>
          </>
        }
      />

      <SdBand tone="sky" id="specialties">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <span className="sd-eyebrow">תחומי התמחות</span>
            <h2 className="sd-h2">במה הצוות מתמחה</h2>
            <p className="sd-lead">שישה תחומים שבהם אנחנו מלווים משפחות ועסקים.</p>
          </div>
          <ul className="sd-pub-values">
            {specialties.map((s) => (
              <li key={s.title} className="sd-pub-value sd-reveal">
                <span className={`sd-pub-disc t-${s.tone}`} style={{ background: PASTELS[s.tone].bg }}><SdIcon name={s.icon} size={34} /></span>
                <div>
                  <h3 className="sd-h3">{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SdBand>

      <SdBand tone="cream" id="process">
        <SdProcess art="10-financial-planning" steps={steps} title="כך נראה הליווי" />
      </SdBand>

      <SdBand tone="butter" id="reach">
        <div className="sd-wrap sd-pub-split is-wide-copy">
          <div>
            <span className="sd-eyebrow">דרכי יצירת קשר</span>
            <h2 className="sd-h2 mt-4">מדברים עם הצוות, בדרך שנוחה לכם</h2>
            <p className="sd-lead mt-5">טלפון, הודעה או מייל. מי שזמין באותו רגע עונה, והפנייה שלכם נשארת בטיפול הצוות.</p>
            <div className="sd-pub-actions">
              <ContactIcons tone="dark" dept="general" />
            </div>
          </div>
          <div className="sd-pub-art" aria-hidden="true">
            <SdPic name="11-claims-service" sizes="(min-width:1024px) 440px, 90vw" />
          </div>
        </div>
      </SdBand>

      <PubCta
        title="רוצים להתחיל?"
        text="שיחת היכרות בלי התחייבות מצידכם. נכיר, נבדוק ונבנה יחד תוכנית שמתאימה לכם."
        art="12-childrens-savings"
        primary={{ label: "אפיון צרכים", to: "/portfolio-review" }}
        secondary={{ label: "תיאום פגישה", to: "/contact" }}
      />
    </PubPage>
  );
}
