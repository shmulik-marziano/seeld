import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { stories } from "@/data/stories";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdPic, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubClose, PubHead, PubHero, toneAt } from "@/components/sd/pub";
import { PASTELS, type ArtName } from "@/components/sd/topics";
import "@/components/sd/sd.css";

// Property, vehicle, business and travel cover in the kit design: hero with illustration, story band,
// four illustrated doors, how we compare, closing block.

// Figures inside coverage copy (24/7 and the like) render tabular and LTR-safe.
const FIGURE_RE = /\d(?:[\d,.:/\-–]*\d)?/g;

const FigureText = ({ text }: { text: string }) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE_RE)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    nodes.push(
      <span key={i} dir="ltr" className="tabular-nums whitespace-nowrap">
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last === 0) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
};

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));
const arrow = <BrandIcon name="arrow-left" size={18} />;

const Creativity = () => {
  useSdFont();
  const topic = PUB_TOPICS.creativity;
  const [p1, p2] = topic.palette;
  const story = stories["/creativity"];

  const insuranceTypes: { title: string; description: string; features: string[]; href: string; art: ArtName }[] = [
    { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳. השוואה בין כל החברות", features: ["ביטוח חובה", "ביטוח מקיף", "צד ג'", "נזקי גוף"], href: "/insurance/vehicle", art: "07-car-insurance" },
    { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", features: ["ביטוח מבנה", "ביטוח תכולה", "צד ג'", "נזקי טבע"], href: "/insurance/home", art: "06-home-mortgage" },
    { title: "ביטוח עסק", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק בכל גודל", features: ["אחריות מקצועית", "רכוש עסקי", "הפסד הכנסות", "חבות מעסיקים"], href: "/insurance/business", art: "08-business-insurance" },
    { title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", features: ["הוצאות רפואיות", "ביטול טיסה", "אובדן מזוודות", "חירום 24/7"], href: "/insurance/travel", art: "09-travel-insurance" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "ביטוח רכוש ורכב" }]}
          eyebrow="רכב, דירה, עסק ונסיעות"
          title="ביטוח רכוש ורכב"
          lead="רכב, דירה, עסק ונסיעות: השוואת הצעות מחיר מול כל החברות בשוק, ללא עלות."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <Link to="/contact" className="sd-btn">תיאום פגישה{arrow}</Link>
              <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
              <button type="button" className="sd-link" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </>
          }
        />

        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        <SdBand tone="cream" id="coverage">
          <div className="sd-wrap">
            <PubHead title="תחומי הכיסוי" lede="ארבעה תחומים, לכל אחד עמוד משלו עם הכיסויים, המדריך וטופס להצעה." />
            <div className="sd-pub-grid sd-pub-grid-2">
              {insuranceTypes.map((type, i) => (
                <Link
                  key={type.title}
                  to={type.href}
                  className="sd-pub-card sd-reveal group"
                  style={{ ["--band" as string]: PASTELS[toneAt(i + 1)].bg }}
                >
                  <div className="sd-pub-card-art" style={{ aspectRatio: "16 / 7" }} aria-hidden="true">
                    <SdPic name={type.art} sizes="(min-width:1024px) 400px, 90vw" />
                  </div>
                  <div className="sd-pub-card-body">
                    <h3>{type.title}</h3>
                    <p className="sd-pub-excerpt">{type.description}</p>
                    <ul className="sd-pub-tags">
                      {type.features.map((feature) => (
                        <li key={feature}><FigureText text={feature} /></li>
                      ))}
                    </ul>
                    <span className="sd-pub-card-cta"><span>לפרטי הביטוח</span>{arrow}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p2} id="compare">
          <div className="sd-wrap sd-pub-split">
            <div className="sd-pub-copy">
              <h2 className="sd-h2" style={{ marginBottom: 24 }}>איך משווים</h2>
              <p className="sd-text">
                משאירים פרטים בעמוד הביטוח המתאים, ואנחנו אוספים הצעות מכל חברות הביטוח שעובדות איתנו.
                ההשוואה מתייחסת לכיסוי, להשתתפות העצמית ולחריגים, לא רק למחיר.
              </p>
              <p className="sd-text">
                חוזרים אליכם עם המלצה מנומקת ומתועדת, ומטפלים בטפסים ובמעבר בין החברות. ללא עלות וללא התחייבות.
              </p>
            </div>
            <div className="sd-story-art sd-reveal" aria-hidden="true">
              <SdPic name="11-claims-service" sizes="(min-width:1024px) 440px, 90vw" />
            </div>
          </div>
        </SdBand>

        <PubClose
          title="רוצים להשוות הצעות מחיר?"
          text="השאירו פרטים והצוות שלנו יחזור אליכם עם הצעות להשוואה. אפשר גם לבדוק את כל התיק בבת אחת."
          art="01-hero"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Creativity;
