import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanyLogos from "@/components/CompanyLogos";
import AnswerSummary from "@/components/AnswerSummary";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FigureText, type InsurancePageProps } from "@/components/InsurancePageTemplate";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import { answerSummaries, ANSWER_REVIEWED } from "@/data/answerSummaries";
import { stories } from "@/data/stories";
import { SdBand, SdContact, SdCrumbs, SdIcon, SdPic, SdProcess, SdStory, SdSubnav, tintStyle, useSdFont } from "./primitives";
import { art3Of, topicFor, type Topic } from "./topics";
import "./sd.css";

const hebrewDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
};

/**
 * Insurance product page in the kit design: hero with illustration, trust strip, sticky section nav,
 * rotating pastel bands (emotional story, coverage, process), plain FAQ, navy closing block.
 * Same props as InsurancePageTemplate; topic (illustrations + colours) comes from topics.ts by path,
 * the emotional story from data/stories.ts. Everything is real DOM, so the prerendered HTML carries it all.
 */
export default function InsurancePageSd(props: InsurancePageProps & { topic?: Topic }) {
  const {
    heroCategory,
    heroTitle,
    heroDescription,
    heroCTAText = "קבלו הצעה מותאמת",
    heroCTAHref = "#contact-form",
    heroSecondaryCTA,
    breadcrumbLabel,
    keyPoints,
    coverageCategories,
    coverageTypes,
    coverageTitle = "סוגי הכיסויים",
    coverageSubtitle,
    articles,
    faqItems,
    insuranceType,
    enrollmentTitle,
    enrollmentDescription,
    enrollmentFormId = "contact-form",
    extraContentAfterKeyPoints,
  } = props;
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "");
  const topic = props.topic ?? topicFor(path);
  const story = stories[path];
  const [p1, p2, p3] = topic.palette;
  useFaqJsonLd(faqItems);
  useSdFont();

  const secondary = heroSecondaryCTA ?? { text: "בדיקת תיק 360", href: "/portfolio-review" };
  const hasPoints = !!keyPoints?.length;
  const hasGuide = !!articles?.length;
  const hasCoverage = !!coverageCategories?.length || !!coverageTypes?.length;
  const hasFaq = faqItems.length > 0;
  const reviewed = answerSummaries[path] ? hebrewDate(ANSWER_REVIEWED) : null;

  const sections = [
    story && { id: "moment", label: "מה עומד מולכם" },
    hasPoints && { id: "overview", label: "עיקרי הדברים" },
    hasGuide && { id: "guide", label: "המדריך" },
    hasCoverage && { id: "coverage", label: coverageTitle },
    { id: "process", label: "איך זה עובד" },
    hasFaq && { id: "faq", label: "שאלות נפוצות" },
    { id: enrollmentFormId, label: "יצירת קשר" },
  ].filter(Boolean) as { id: string; label: string }[];

  const arrow = <BrandIcon name="arrow-left" size={18} />;
  const secondaryLink = secondary.href.startsWith("/") ? (
    <Link to={secondary.href} className="sd-link">{secondary.text}{arrow}</Link>
  ) : (
    <a href={secondary.href} className="sd-link">{secondary.text}{arrow}</a>
  );

  const trust = [
    { icon: "search", t: "השוואה בין החברות", s: "בכל חברות הביטוח בשוק" },
    { icon: "handshake", t: "פגישה ראשונה ללא עלות", s: "ואינה מחייבת" },
    { icon: "shield", t: "צוות סוכנים מקצועי", s: "ליווי מההצעה ועד התביעה" },
    { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        {/* HERO */}
        <section className="sd-hero">
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: "כל הביטוחים", to: "/insurances" }, { label: breadcrumbLabel }]} />
              <span className="sd-eyebrow">{heroCategory}</span>
              <h1 className="sd-h1 mt-5">{heroTitle}</h1>
              <div className="sd-brief">
                <b>בקצרה</b>
                <AnswerSummary className="m-0 text-[18px] leading-[1.75]" />
              </div>
              <p className="sd-text mt-6" style={{ color: "var(--muted)" }}>{heroDescription}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={heroCTAHref} className="sd-btn">{heroCTAText}{arrow}</a>
                {secondaryLink}
              </div>
            </div>

            <div className="sd-stage" aria-hidden="true">
              <SdPic name={topic.art} sizes="(min-width:1024px) 520px, 90vw" priority />
              {reviewed && <span className="sd-stage-tag"><i />תוכן נבדק {reviewed}</span>}
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

        {/* STORY: the emotional moment */}
        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        {hasPoints && (
          <SdBand tone="cream" id="overview">
            <div className="sd-wrap">
              <div className="sd-band-head"><h2 className="sd-h2">עיקרי הדברים</h2></div>
              <div className="sd-points">
                {keyPoints!.map((kp, i) => (
                  <div key={kp.title} className="sd-point sd-reveal">
                    <em>{String(i + 1).padStart(2, "0")}</em>
                    <h3 className="sd-h3">{kp.title}</h3>
                    <p>{kp.description}</p>
                  </div>
                ))}
              </div>
              {extraContentAfterKeyPoints && <div className="mt-12">{extraContentAfterKeyPoints}</div>}
            </div>
          </SdBand>
        )}

        {hasGuide && (
          <SdBand tone="white" id="guide">
            <div className="sd-wrap sd-guide-grid">
              <div className="min-w-0">
                {articles!.map((a, i) => (
                  <article key={a.title} className={i > 0 ? "mt-14" : ""}>
                    <h2 className="sd-h2" style={{ marginBottom: 20 }}>{a.title}</h2>
                    <div className="space-y-5">
                      {a.paragraphs.map((p, j) => <p key={j} className="sd-text">{p}</p>)}
                    </div>
                  </article>
                ))}
              </div>
              <aside className="sd-aside hidden lg:block" aria-hidden="true" style={{ ["--band" as string]: `var(--tint)` }}>
                <SdPic name={art3Of(topic)} sizes="300px" />
                {story && <p>{story.caption}</p>}
              </aside>
            </div>
          </SdBand>
        )}

        {hasCoverage && (
          <SdBand tone={p2} id="coverage">
            <div className="sd-wrap">
              <div className="sd-band-head">
                <h2 className="sd-h2">{coverageTitle}</h2>
                {coverageSubtitle && <p className="sd-lead">{coverageSubtitle}</p>}
              </div>
              <div className="sd-table-wrap">
                <table className="sd-table">
                  <thead>
                    <tr><th scope="col">הכיסוי</th><th scope="col">מה הוא כולל</th></tr>
                  </thead>
                  <tbody>
                    {coverageCategories?.flatMap((cat) => [
                      <tr key={`g-${cat.category}`} className="sd-group"><th colSpan={2} scope="colgroup">{cat.category}</th></tr>,
                      ...cat.items.map((it) => (
                        <tr key={`${cat.category}-${it.title}`}>
                          <th scope="row"><FigureText text={it.title} /></th>
                          <td><FigureText text={it.description} /></td>
                        </tr>
                      )),
                    ])}
                    {coverageTypes?.flatMap((c) => [
                      <tr key={`g-${c.title}`} className="sd-group"><th colSpan={2} scope="colgroup"><FigureText text={c.title} /></th></tr>,
                      ...c.items.map((it, k) =>
                        typeof it === "string" ? (
                          <tr key={`${c.title}-${k}`}><th scope="row" colSpan={2}><FigureText text={it} /></th></tr>
                        ) : (
                          <tr key={`${c.title}-${k}`}>
                            <th scope="row"><FigureText text={it.title} /></th>
                            <td><FigureText text={it.description} /></td>
                          </tr>
                        ),
                      ),
                    ])}
                  </tbody>
                </table>
              </div>
            </div>
          </SdBand>
        )}

        <SdBand tone={p3} id="process">
          <SdProcess art={topic.art} />
        </SdBand>

        {hasFaq && (
          <SdBand tone="cream" id="faq">
            <div className="sd-wrap-narrow">
              <div className="sd-band-head"><h2 className="sd-h2">שאלות נפוצות</h2></div>
              <div className="sd-faq">
                {faqItems.map((f, i) => (
                  <details key={f.q} open={i === 0}>
                    <summary>{f.q}</summary>
                    <div>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </SdBand>
        )}

        <section style={{ borderTop: "1px solid var(--line)" }}>
          <CompanyLogos variant="grid" />
        </section>

        <SdContact id={enrollmentFormId} art={art3Of(topic)}>
          <InsuranceEnrollmentForm insuranceType={insuranceType} title={enrollmentTitle} description={enrollmentDescription} />
        </SdContact>
      </main>

      <Footer />
    </div>
  );
}
