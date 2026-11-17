import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import { SdBand, SdPic, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHead, PubHero } from "@/components/sd/pub";
import { Arrow, RpClose, RpPageNav, RpRegLine } from "@/components/retire/parts";
import { DIFFERENTIATORS, RP, RP_CASE, RP_TOPIC, STEPS, STEPS_CLOSING } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";

// "How it works": the five steps in full, the three working principles, and what the client holds at the end.

const HEARD = [
  "כרטיס לכל קופה ולכל פוליסה, עם הנתונים הפרטניים שלה.",
  "תיקייה מסודרת לפגישת ההחלטות, והחלופות לכל החלטה.",
  "מסמך סיכום בכתב, עם מה שהוחלט ומי מטפל בכל צעד.",
];

export default function HowItWorks() {
  useSdFont();
  const t = RP_TOPIC;
  const [p1, p2] = ["lavender", "sage"] as const;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "תכנון פרישה", to: RP }, { label: "איך זה עובד" }]}
          eyebrow="התהליך"
          title="התהליך בחמישה שלבים"
          lead="זה התהליך האמיתי: מה קורה בכל שלב, מי עושה מה, ומתי מתקבלות ההחלטות."
          art={t.art2}
          tint={p1}
        >
          <div className="sd-brief sd-rp-summary">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        <RpPageNav />

        <SdBand tone="cream" id="steps" art="10-financial-planning">
          <div className="sd-wrap">
            <ol className="sd-rp-steps">
              {STEPS.map((s, i) => (
                <li key={s.t} className="sd-reveal">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.p}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="sd-rp-quote">{STEPS_CLOSING}</p>
          </div>
        </SdBand>

        <SdBand tone={p2} id="principles" art="31-team-desks">
          <div className="sd-wrap">
            <PubHead title="שלושה עקרונות שחוזרים בכל שלב" />
            <ul className="sd-rp-diff">
              {DIFFERENTIATORS.map((d) => (
                <li key={d.n} className="sd-reveal">
                  <em>{d.n}</em>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </SdBand>

        <SdBand tone="butter" id="outcome" art="27-post-retirement-bench">
          <div className="sd-wrap sd-pub-split">
            <div>
              <PubHead title="מה נשאר אצלכם בסוף" lede="התהליך נגמר במסמכים ולא בהבטחות. כך נראה מה שמקבלים:" />
              <ul className="sd-rp-next" style={{ maxWidth: "62ch" }}>
                {HEARD.map((h, i) => (
                  <li key={h} data-n={i + 1} style={{ color: "var(--text)" }}>{h}</li>
                ))}
              </ul>
              <p className="mt-8"><Link to={RP_CASE} className="sd-link">איך זה נראה בתיק אמיתי<Arrow /></Link></p>
            </div>
            <div className="sd-story-art" aria-hidden="true"><SdPic name="27-post-retirement-bench" sizes="(min-width:1024px) 480px, 92vw" /></div>
          </div>
        </SdBand>

        <RpClose
          title="מתחילים משיחת היכרות"
          text="בפגישה הראשונה שומעים מה מעסיק אתכם, ומציגים בכתב את מודל התגמול לפני שמתחילים."
          art={t.art5}
        />
        <RpRegLine />
      </main>
      <Footer />
    </div>
  );
}
