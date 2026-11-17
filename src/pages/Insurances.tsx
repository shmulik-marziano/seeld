import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GENERAL_INSURANCE, LIFE_HEALTH, type ProductLink } from "@/data/productDirectory";
import { stories } from "@/data/stories";
import { SdBand, SdPic, SdStory, SdSubnav } from "@/components/sd/primitives";
import { PASTELS, TOPICS, topicFor } from "@/components/sd/topics";
import { Arrow, PubCta, PubHero, PubPage } from "@/components/sd/pubParts";

// Insurance hub (kit design): hero, emotional moment, then one illustrated card per insurance line
// (all 16 keep their link), grouped as life and health, and general insurance.

const PATH = "/insurances";
const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

function Cards({ items }: { items: ProductLink[] }) {
  return (
    <div className="sd-pub-cards">
      {items.map((item) => {
        const t = TOPICS[item.href];
        return (
          <Link
            key={item.href}
            to={item.href}
            className="sd-pub-card"
            style={{ ["--card-tint" as string]: PASTELS[t?.palette[0] ?? "sage"].bg }}
          >
            <div className="sd-pub-card-art" aria-hidden="true">
              <SdPic name={t?.art ?? "01-hero"} sizes="(min-width:480px) 190px, 90vw" />
            </div>
            <div className="sd-pub-card-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="sd-pub-card-go">לעמוד התחום<BrandIcon name="arrow-left" size={16} /></span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function Insurances() {
  const topic = topicFor(PATH);
  const [p1, p2, p3] = topic.palette;
  const story = stories[PATH];
  const sections = [
    ...(story ? [{ id: "moment", label: "מה עומד מולכם" }] : []),
    { id: "life", label: "חיים ובריאות" },
    { id: "general", label: "ביטוח כללי" },
    { id: "help", label: "לא בטוחים?" },
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "כל הביטוחים" }]}
        eyebrow="כל תחומי הביטוח"
        title="כל הביטוחים במקום אחד"
        lead="שישה עשר תחומי ביטוח, מול כל החברות בישראל. בוחרים תחום, ואנחנו מסדרים את התמונה המלאה: מה יש, מה חסר ומה כפול."
        art={topic.art}
        actions={
          <>
            <a href="#insurance-index" className="sd-btn">לרשימת התחומים<Arrow /></a>
            <Link to="/portfolio-review" className="sd-link">בדיקת תיק 360<Arrow /></Link>
          </>
        }
      />

      <SdSubnav sections={sections} />

      {story && (
        <SdBand tone={p1} id="moment">
          <SdStory story={story} art={topic.art2} />
        </SdBand>
      )}

      <div id="insurance-index" className="scroll-mt-28">
        <SdBand tone="cream" id="life">
          <div className="sd-wrap">
            <div className="sd-pub-hubhead">
              <h2 className="sd-h2">ביטוחי חיים ובריאות</h2>
              <p>ההגנה על המשפחה, על ההכנסה ועל הבית.</p>
            </div>
            <Cards items={LIFE_HEALTH} />
          </div>
        </SdBand>

        <SdBand tone={p2} id="general">
          <div className="sd-wrap">
            <div className="sd-pub-hubhead">
              <h2 className="sd-h2">ביטוח כללי</h2>
              <p>רכב, דירה, עסק, נסיעות ושאר הכיסויים.</p>
            </div>
            <Cards items={GENERAL_INSURANCE} />
          </div>
        </SdBand>
      </div>

      <SdBand tone={p3} id="help">
        <div className="sd-wrap sd-pub-split is-wide-copy">
          <div>
            <span className="sd-eyebrow">לא בטוחים מה חסר לכם?</span>
            <h2 className="sd-h2 mt-4">לא חייבים לבחור לבד</h2>
            <p className="sd-lead mt-5">נבדוק מה יש לכם, מה כפול ומה חסר, ונחזור אליכם עם תמונה מסודרת. ללא עלות וללא התחייבות.</p>
            <div className="sd-pub-actions">
              <Link to="/portfolio-review" className="sd-btn">בדיקת תיק 360<Arrow /></Link>
              <button type="button" className="sd-link sd-pub-linkbtn" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
          <div className="sd-pub-art" aria-hidden="true">
            <SdPic name="11-claims-service" sizes="(min-width:1024px) 420px, 90vw" />
          </div>
        </div>
      </SdBand>

      <PubCta
        title="נשמח לעזור לסדר את זה"
        text="שיחה ראשונה ללא עלות וללא התחייבות. מספרים לנו על המצב, ואנחנו חוזרים עם השוואה ברורה."
        art="12-childrens-savings"
        primary={{ label: "תיאום פגישה", to: "/contact" }}
        secondary={{ label: "שאלות נפוצות", to: "/faq" }}
      />
    </PubPage>
  );
}
