import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { SdArtLayer, SdBand, SdPic, SdSubnav, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHead, PubHero } from "@/components/sd/pub";
import type { Topic } from "@/components/sd/topics";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import RiskQuiz from "@/components/risk/RiskQuiz";
import RiskLeadForm from "@/components/risk/RiskLeadForm";
import { RISK_LEVELS, type RiskLevel } from "@/lib/riskProfile";
import { RISK_COPY, RISK_FAQ, RISK_LEVEL_COPY } from "@/data/riskProfile";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";
import "@/components/risk/risk.css";

// Investor risk-level characterisation (/savings/risk-profile): four questions on temperament only,
// a low / medium / high level computed in the browser, the investment policy of the matching track
// family, matching tracks from the returns board, the age-dependent default tracks as a separate note,
// and a soft lead form. The result is a characterisation, not a recommendation. Spec: docs/product/RISK-PROFILE.md.

const TOPIC: Topic = { art: "04-investments-growth", art2: "10-financial-planning", art5: "34-object-umbrella", palette: ["sky", "butter", "sage"] };

const SECTIONS = [
  { id: "quiz", label: "השאלון" },
  { id: "levels", label: "שלוש הרמות" },
  { id: "faq", label: "שאלות נפוצות" },
  { id: "form", label: "שיחת היכרות" },
];

const arrow = <BrandIcon name="arrow-left" size={18} />;

export default function RiskProfile() {
  useSdFont();
  useFaqJsonLd(RISK_FAQ);
  const [p1, p2] = TOPIC.palette;
  const [level, setLevel] = useState<RiskLevel | null>(null);

  return (
    <div className="sd sd-rk-page min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "חיסכון ופנסיה", to: "/savings" }, { label: "אפיון רמת סיכון" }]}
          eyebrow="כלי אפיון"
          title={RISK_COPY.title}
          lead={RISK_COPY.intro}
          art={TOPIC.art}
          tint={p1}
          actions={
            <>
              <a href="#quiz" className="sd-btn">להתחלת השאלון{arrow}</a>
              <a href="#faq" className="sd-link">שאלות נפוצות{arrow}</a>
            </>
          }
        />

        <SdSubnav sections={SECTIONS} />

        {/* the questionnaire, the result and the tracks */}
        <SdBand tone="cream" id="quiz" art={false} divider={false}>
          <div className="sd-rk-wrap">
            <RiskQuiz onResult={(r) => setLevel(r ? r.level : null)} />
            <aside className="sd-rk-disclaimer" aria-labelledby="rk-disc-h">
              <h2 id="rk-disc-h">הבהרה</h2>
              <p>{RISK_COPY.disclaimer}</p>
            </aside>
          </div>
        </SdBand>

        {/* the three levels at a glance */}
        <SdBand tone={p2} id="levels" art={TOPIC.art2}>
          <div className="sd-wrap">
            <PubHead title="שלוש רמות, שלוש משפחות מסלולים" lede="ההבדל העיקרי בין המשפחות הוא החלק מהכסף שמושקע במניות. כך נראה התמהיל האופייני בכל רמה." />
            <ul className="sd-rk-levels">
              {RISK_LEVELS.map((l) => (
                <li key={l} data-level={l} className={level === l ? "is-mine" : ""}>
                  <span className="sd-rk-levels-mark" aria-hidden="true"><i /><i /><i /></span>
                  <h3>{RISK_LEVEL_COPY[l].title}</h3>
                  {level === l && <small className="sd-rk-mine">האפיון שלכם</small>}
                  <p>{RISK_LEVEL_COPY[l].assetMix}</p>
                </li>
              ))}
            </ul>
            <p className="sd-rk-levels-foot">
              הנתונים המלאים של כל מסלול, כולל תשואות, סיכון וחשיפות, נמצאים <Link to="/return-tables" className="sd-link">בלוח התשואות</Link>, ומדריך המסלולים <Link to="/investment-tracks" className="sd-link">בעמוד מסלולי ההשקעה</Link>.
            </p>
          </div>
        </SdBand>

        {/* FAQ: all text is in the DOM for the prerender; the same items feed the FAQPage JSON-LD */}
        <SdBand tone="white" id="faq" art={false}>
          <div className="sd-wrap-narrow">
            <div className="sd-band-head"><h2 className="sd-h2">שאלות נפוצות</h2></div>
            <div className="sd-faq">
              {RISK_FAQ.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>{f.q}</summary>
                  <div><p>{f.a}</p></div>
                </details>
              ))}
            </div>
          </div>
        </SdBand>

        {/* soft lead capture */}
        <section id="form" className="sd-contact scroll-mt-20">
          <SdArtLayer name={TOPIC.art5 ?? TOPIC.art2} className="sd-band-art sd-contact-layer" />
          <div className="sd-wrap sd-contact-grid">
            <div>
              <h2 className="sd-h2">נבחן את האפיון מול התמונה המלאה</h2>
              <p className="sd-text mt-4">{RISK_COPY.cta}</p>
              <p className="sd-text mt-4">בשיחה מסתכלים יחד על המוצרים, המסלולים ודמי הניהול, ועל הגיל וטווח ההשקעה שהשאלון לא בודק.</p>
              <div className="sd-reach mt-6"><ContactIcons tone="light" /></div>
              <div className="sd-contact-art" aria-hidden="true"><SdPic name={TOPIC.art5 ?? TOPIC.art2} sizes="360px" /></div>
            </div>
            <div className="sd-form"><RiskLeadForm level={level} /></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
