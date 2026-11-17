import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdProcess, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubClose, PubHead, PubHero } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Rights extraction in the kit design: hero with illustration, the four channels, plain-word steps, closing block.

const rights = [
  { title: "החזרי מס הכנסה", description: "בדיקת החזרי מס עבור 6 שנים אחורה" },
  { title: "קצבאות ביטוח לאומי", description: "מיצוי זכויות לקצבת נכות, זקנה, ילדים ועוד" },
  { title: "הטבות מס לעצמאים", description: "ניכויים והקלות מס לבעלי עסקים" },
  { title: "זכויות פנסיוניות", description: "איתור קופות אבודות וכספים שלא ידעתם עליהם" },
];

// Plain-word steps, with kit icons
const steps = [
  { icon: "checklist", t: "מלאו פרטים", p: "כמה שאלות קצרות. שתי דקות, לא יותר." },
  { icon: "search", t: "נבדוק עבורכם", p: "סריקה של כל הזכויות המגיעות לכם מהמדינה, מביטוח לאומי ומרשויות המס." },
  { icon: "handshake", t: "קבלו דוח", p: "רשימת זכויות מסודרת והמלצות לפעולה. בלי אותיות קטנות." },
];

const arrow = <BrandIcon name="arrow-left" size={18} />;

const RightsExtraction = () => {
  useSdFont();
  const topic = PUB_TOPICS.rights;
  const [p1, p2, p3] = topic.palette;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "מיצוי זכויות" }]}
          eyebrow="בדיקת זכאות"
          title="כסף שמגיע לכם. באמת."
          lead="החזרי מס, קצבאות וקופות שנשכחו. נבדוק מה מגיע לכם מהמדינה, ונדאג שתקבלו את זה."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <Link to="/contact" className="sd-btn">בדיקת זכאות{arrow}</Link>
              <button type="button" className="sd-link" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </>
          }
        >
          <div className="sd-brief">
            <b>בדיקת זכאות</b>
            <p>הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו.</p>
          </div>
        </PubHero>

        <SdBand tone="cream" id="check">
          <div className="sd-wrap">
            <PubHead title="מה בודקים" lede="ארבעה ערוצים שבהם רוב הישראלים משאירים כסף על השולחן." />
            <div className="sd-pub-pillars">
              {rights.map((right, i) => (
                <div key={right.title} className="sd-pub-pillar sd-reveal">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <div>
                    <h3>{right.title}</h3>
                    <p>{right.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p2} id="process">
          <SdProcess art={topic.art2} steps={steps} />
          <div className="sd-wrap mt-10">
            <button type="button" className="sd-link" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}>
              לא בטוחים אם זה רלוונטי אליכם? שאלו את היועץ הדיגיטלי
            </button>
          </div>
        </SdBand>

        <PubClose
          title="נבדוק מה מגיע לכם"
          text="הבדיקה ללא עלות וללא התחייבות. אם אין כלום, לפחות תדעו."
          art={p3 === "butter" ? "10-financial-planning" : "01-hero"}
          primary={{ text: "בדיקת זכאות", to: "/contact" }}
          secondary={{ text: "בדיקת תיק 360", to: "/#portfolio-review" }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default RightsExtraction;
