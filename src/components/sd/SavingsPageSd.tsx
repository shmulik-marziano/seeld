import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanyLogos from "@/components/CompanyLogos";
import AnswerSummary from "@/components/AnswerSummary";
import PensionAnalysisForm from "@/components/PensionAnalysisForm";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FigureText } from "@/components/InsurancePageTemplate";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import { answerSummaries, ANSWER_REVIEWED } from "@/data/answerSummaries";
import { stories } from "@/data/stories";
import { SdArtLayer, SdBand, SdContact, SdCrumbs, SdIcon, SdPic, SdProcess, SdProgress, SdStageSpot, SdStory, SdSubnav, tintStyle, useSdFont } from "./primitives";
import { SdSpot } from "./SdSpot";
import { spotAt } from "./spots";
import { topicFor, type ArtName, type Topic } from "./topics";
import "./sd.css";
import "./SavingsPageSd.css";

const hebrewDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
};

export type SavingsPageProps = {
  breadcrumbLabel: string;
  heroTitle: string;
  heroDescription: ReactNode;
  heroCTAText: string;
  /** label of the "types / how it works" section (subnav + hero link) */
  typesLabel: string;
  typesTitle: string;
  typesSubtitle?: string;
  types: { title: string; description: string; features: string[] }[];
  /** short benefit strip shown before the guide (optional) */
  benefitsTitle?: string;
  benefits?: { title: string; desc: string }[];
  /** extra content after the type cards: tables and notes */
  afterTypes?: ReactNode;
  articles: { title: string; paragraphs: string[] }[];
  bottomLine: string;
  faqItems: { q: string; a: string }[];
  closingTitle: string;
  closingText: string;
  form: { focusArea: "pension" | "savings" | "investment" | "retirement" | "general"; title: string; description: string };
};

/** Illustrations the savings pages may borrow for their secondary slots. */
const ART_POOL: ArtName[] = [
  "10-financial-planning", "02-family-protection", "05-retirement", "04-investments-growth",
  "12-childrens-savings", "06-home-mortgage", "03-health-insurance", "01-hero", "11-claims-service",
];

/** Three more illustrations for the guide aside, the process band and the closing block. Never repeats the hero or story art, nor each other. */
function sparesFor(topic: Topic, path: string) {
  // explicit per-topic choice (topics.ts) wins over the rotating pool
  if (topic.art3 && topic.art4 && topic.art5) return { aside: topic.art3, process: topic.art4, close: topic.art5 };
  const used = new Set<ArtName>([topic.art, topic.art2]);
  let h = 0;
  for (const c of path) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rest = ART_POOL.filter((a) => !used.has(a) && a !== "11-claims-service");
  const rot = rest.map((_, i) => rest[(i + h) % rest.length]);
  const close: ArtName = used.has("11-claims-service") ? rot[2] : "11-claims-service";
  const [aside, process] = rot.filter((a) => a !== close);
  return { aside, process, close };
}

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

/** Small data table for the savings pages (figures stay LTR + tabular). */
export function SavingsTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="sd-table-wrap sd-sav-table">
      <table className="sd-table">
        <thead>
          <tr><th scope="col">{head[0]}</th><th scope="col">{head[1]}</th></tr>
        </thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th scope="row">{a}</th>
              <td><span dir="ltr" className="tabular-nums whitespace-nowrap">{b}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Highlighted "worth noting" line. */
export const SavingsNote = ({ label = "שימו לב", children }: { label?: string; children: ReactNode }) => (
  <div className="sd-sav-note">
    <b>{label}</b>
    <p>{children}</p>
  </div>
);

/**
 * Savings and pension product page in the kit design (copy of the InsurancePageSd structure, savings content model):
 * hero with illustration, trust strip, sticky nav, emotional story band, benefits, guide, product types,
 * process, FAQ and the navy closing block that holds the analysis form.
 */
export default function SavingsPageSd(props: SavingsPageProps) {
  const {
    breadcrumbLabel, heroTitle, heroDescription, heroCTAText, typesLabel, typesTitle, typesSubtitle, types,
    benefitsTitle, benefits, afterTypes, articles, bottomLine, faqItems, closingTitle, closingText, form,
  } = props;
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const topic = topicFor(path);
  const story = stories[path];
  const [p1, p2, p3] = topic.palette;
  const spare = sparesFor(topic, path);
  useFaqJsonLd(faqItems);
  useSdFont();

  const hasBenefits = !!benefits?.length;
  const reviewed = answerSummaries[path] ? hebrewDate(ANSWER_REVIEWED) : null;

  const sections = [
    story && { id: "moment", label: "מה עומד מולכם" },
    hasBenefits && { id: "overview", label: "עיקרי הדברים" },
    { id: "guide", label: "המדריך" },
    { id: "product-types", label: typesLabel },
    { id: "process", label: "איך זה עובד" },
    { id: "faq", label: "שאלות נפוצות" },
    { id: "analysis-form", label: "יצירת קשר" },
  ].filter(Boolean) as { id: string; label: string }[];

  const arrow = <BrandIcon name="arrow-left" size={18} />;

  const trust = [
    { icon: "search", t: "השוואה בין הגופים", s: "דמי ניהול ומסלולי השקעה" },
    { icon: "handshake", t: "שיחת היכרות", s: "בלי התחייבות מצידכם" },
    { icon: "shield", t: "צוות מקצועי", s: "ליווי לאורך הדרך" },
    { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
  ];

  const steps = [
    { icon: "checklist", t: "משאירים פרטים", p: "ממלאים טופס קצר או מתקשרים. מספרים לנו מה יש היום ומה חשוב לכם." },
    { icon: "search", t: "אנחנו בודקים", p: "עוברים על דמי הניהול, המסלולים וההפקדות ומציגים את התמונה בצורה ברורה." },
    { icon: "handshake", t: "מחליטים יחד", p: "שיחת היכרות בלי התחייבות מצידכם. ההחלטה נשארת שלכם." },
  ];

  return (
    <div className="sd sd-sav-page min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <SdProgress />

      <main>
        {/* HERO */}
        <section className="sd-hero">
          <SdArtLayer name={topic.art2} className="sd-hero-art" />
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: "חיסכון ופנסיה", to: "/savings" }, { label: breadcrumbLabel }]} />
              <span className="sd-eyebrow">חיסכון ופנסיה</span>
              <h1 className="sd-h1 mt-5">{heroTitle}</h1>
              <div className="sd-brief">
                <b>בקצרה</b>
                <AnswerSummary className="m-0 text-[18px] leading-[1.75]" />
              </div>
              <p className="sd-text mt-6" style={{ color: "var(--muted)" }}>{heroDescription}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#analysis-form" className="sd-btn">{heroCTAText}{arrow}</a>
                <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
                <a href="#product-types" className="sd-link">{typesLabel}{arrow}</a>
              </div>
              <button type="button" className="sd-sav-chat" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>

            <div className="sd-stage" aria-hidden="true">
              <SdPic name={topic.art} sizes="(min-width:1024px) 520px, 90vw" priority />
              <SdStageSpot art={topic.art} />
              {reviewed && <span className="sd-stage-tag"><i />מידע כללי, לא ייעוץ אישי</span>}
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="sd-trust" aria-label="למה לבחור בנו">
          <div className="sd-wrap">
            <ul>
              {trust.map((x) => (
                <li key={x.t}>
                  <SdIcon name={x.icon} />
                  <div><b>{x.t}</b><span>{x.s}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <SdSubnav sections={sections} />

        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        {hasBenefits && (
          <SdBand tone="cream" id="overview">
            <div className="sd-wrap">
              <div className="sd-band-head"><h2 className="sd-h2">{benefitsTitle}</h2></div>
              <div className="sd-points sd-sav-benefits">
                {benefits!.map((b, i) => (
                  <div key={b.title} className="sd-point sd-reveal">
                    <SdSpot name={spotAt(topic.art, i)} size={64} className="sd-point-spot" />
                    <em>{String(i + 1).padStart(2, "0")}</em>
                    <h3 className="sd-h3">{b.title}</h3>
                    <p><FigureText text={b.desc} /></p>
                  </div>
                ))}
              </div>
            </div>
          </SdBand>
        )}

        <SdBand tone="white" id="guide">
          <div className="sd-wrap sd-guide-grid">
            <div className="min-w-0">
              {articles.map((a, i) => (
                <article key={a.title} className={i > 0 ? "mt-14" : ""}>
                  <h2 className="sd-h2" style={{ marginBottom: 20 }}>{a.title}</h2>
                  <div className="space-y-5">
                    {a.paragraphs.map((p, j) => <p key={j} className="sd-text"><FigureText text={p} /></p>)}
                  </div>
                </article>
              ))}
              <div className="sd-sav-bottom">
                <b>בשורה התחתונה</b>
                <p><FigureText text={bottomLine} /></p>
              </div>
            </div>
            <aside className="sd-aside hidden lg:block" aria-hidden="true" style={{ ["--band" as string]: `var(--tint)` }}>
              <SdPic name={spare.aside} sizes="300px" />
              {story && <p>{story.caption}</p>}
            </aside>
          </div>
        </SdBand>

        <SdBand tone={p2} id="product-types">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">{typesTitle}</h2>
              {typesSubtitle && <p className="sd-lead">{typesSubtitle}</p>}
            </div>
            <div className="sd-sav-types">
              {types.map((t) => (
                <div key={t.title} className="sd-sav-type sd-reveal">
                  <h3 className="sd-h3">{t.title}</h3>
                  <p><FigureText text={t.description} /></p>
                  <ul>
                    {t.features.map((f) => <li key={f}><FigureText text={f} /></li>)}
                  </ul>
                </div>
              ))}
            </div>
            {afterTypes && <div className="sd-sav-after">{afterTypes}</div>}
          </div>
        </SdBand>

        <SdBand tone={p3} id="process">
          <SdProcess art={spare.process} steps={steps} />
        </SdBand>

        <SdBand tone="cream" id="faq">
          <div className="sd-wrap-narrow">
            <div className="sd-band-head"><h2 className="sd-h2">שאלות נפוצות</h2></div>
            <div className="sd-faq">
              {faqItems.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary><FigureText text={f.q} /></summary>
                  <div><FigureText text={f.a} /></div>
                </details>
              ))}
            </div>
          </div>
        </SdBand>

        <section className="sd-sav-logos" style={{ borderTop: "1px solid var(--line)" }}>
          <CompanyLogos variant="grid" />
        </section>

        <SdContact id="analysis-form" title={closingTitle} text={closingText} art={spare.close}>
          <PensionAnalysisForm focusArea={form.focusArea} title={form.title} description={form.description} />
          <div className="sd-sav-links">
            <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
            <Link to="/contact" className="sd-link">תיאום פגישה{arrow}</Link>
          </div>
        </SdContact>
      </main>

      <Footer />
    </div>
  );
}
