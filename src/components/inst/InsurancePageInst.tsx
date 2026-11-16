import { useEffect } from "react";
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
import { REGULATORY_LINE } from "@/lib/brand";
import { useActiveSection } from "./useActiveSection";
import "./inst.css";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&display=swap";

const hebrewDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
};

/**
 * Institutional version of the insurance page: a structured publication (header + fact sheet,
 * fixed index, numbered sections, coverage as a real table, plain FAQ, credentials stated up front).
 * Same props as InsurancePageTemplate. Everything is real DOM, so the prerendered HTML carries it all.
 */
export default function InsurancePageInst(props: InsurancePageProps) {
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
  useFaqJsonLd(faqItems);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const secondary = heroSecondaryCTA ?? { text: "בדיקת תיק 360", href: "/portfolio-review" };
  const hasPoints = !!keyPoints?.length;
  const hasGuide = !!articles?.length;
  const hasCoverage = !!coverageCategories?.length || !!coverageTypes?.length;
  const hasFaq = faqItems.length > 0;
  const reviewed = answerSummaries[pathname.replace(/\/$/, "")] ? hebrewDate(ANSWER_REVIEWED) : null;

  const sections = [
    hasPoints && { id: "overview", label: "עיקרי הדברים" },
    hasGuide && { id: "guide", label: "המדריך" },
    hasCoverage && { id: "coverage", label: coverageTitle },
    hasFaq && { id: "faq", label: "שאלות נפוצות" },
    { id: enrollmentFormId, label: "יצירת קשר" },
  ].filter(Boolean) as { id: string; label: string }[];
  const active = useActiveSection(sections.map((s) => s.id));

  const secondaryLink = secondary.href.startsWith("/") ? (
    <Link to={secondary.href} className="inst-link">{secondary.text}<BrandIcon name="arrow-left" size={18} /></Link>
  ) : (
    <a href={secondary.href} className="inst-link">{secondary.text}<BrandIcon name="arrow-left" size={18} /></a>
  );

  return (
    <div className="inst min-h-screen" dir="rtl">
      <Header />

      <main>
        {/* PAGE HEADER */}
        <section className="inst-head">
          <div className="inst-wrap inst-head-grid">
            <div>
              <nav aria-label="פירורי לחם" className="inst-crumbs mb-6">
                <Link to="/">דף הבית</Link>
                <BrandIcon name="arrow-left" size={12} />
                <Link to="/insurances">כל הביטוחים</Link>
                <BrandIcon name="arrow-left" size={12} />
                <span aria-current="page" className="font-bold" style={{ color: "var(--ink)" }}>{breadcrumbLabel}</span>
              </nav>
              <span className="inst-kicker">{heroCategory}</span>
              <h1 className="inst-h1 mt-5">{heroTitle}</h1>
              <div className="inst-brief">
                <b>בקצרה</b>
                <AnswerSummary className="m-0 text-[19px] leading-[1.75]" />
              </div>
              <p className="inst-text mt-6" style={{ color: "var(--muted)" }}>{heroDescription}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href={heroCTAHref} className="inst-btn">{heroCTAText}</a>
                {secondaryLink}
              </div>
            </div>

            <aside className="inst-sheet" aria-label="פרטי השירות">
              <h2>פרטי השירות</h2>
              <dl>
                <div><dt>סוג השירות</dt><dd>{heroCategory}</dd></div>
                <div><dt>מי אנחנו</dt><dd>סוכנות ביטוח ופיננסים עצמאית</dd></div>
                <div><dt>רישיון</dt><dd>שמוליק מרציאנו, סוכן ברישיון 138666</dd></div>
                <div><dt>משרדים</dt><dd>רעננה וירושלים</dd></div>
                <div><dt>השוואה</dt><dd>בין חברות הביטוח בשוק</dd></div>
                <div><dt>פגישה ראשונה</dt><dd>ללא עלות</dd></div>
                {reviewed && <div><dt>תוכן נבדק</dt><dd>{reviewed}</dd></div>}
              </dl>
            </aside>
          </div>
        </section>

        {/* BODY */}
        <div className="inst-wrap inst-body">
          <nav className="inst-index" aria-label="תוכן העמוד">
            <b>בעמוד זה</b>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.label}</a>
            ))}
          </nav>

          <div className="min-w-0">
            {hasPoints && (
              <section id="overview" className="inst-section scroll-mt-28" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                <h2 className="inst-h2">עיקרי הדברים</h2>
                <div className="inst-points">
                  {keyPoints!.map((kp) => (
                    <div key={kp.title} className="inst-point">
                      <h3 className="inst-h3">{kp.title}</h3>
                      <p>{kp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {extraContentAfterKeyPoints && <div className="mt-12">{extraContentAfterKeyPoints}</div>}

            {hasGuide && (
              <section id="guide" className="inst-section scroll-mt-28">
                {articles!.map((a, i) => (
                  <article key={a.title} className={i > 0 ? "mt-14" : ""}>
                    <h2 className="inst-h2" style={{ marginBottom: 20 }}>{a.title}</h2>
                    <div className="space-y-5">
                      {a.paragraphs.map((p, j) => <p key={j} className="inst-text">{p}</p>)}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {hasCoverage && (
              <section id="coverage" className="inst-section scroll-mt-28">
                <h2 className="inst-h2" style={{ marginBottom: coverageSubtitle ? 8 : 28 }}>{coverageTitle}</h2>
                {coverageSubtitle && <p className="inst-small mb-6" style={{ fontSize: 16 }}>{coverageSubtitle}</p>}
                <table className="inst-table">
                  <thead>
                    <tr><th scope="col">הכיסוי</th><th scope="col">מה הוא כולל</th></tr>
                  </thead>
                  <tbody>
                    {coverageCategories?.flatMap((cat) => [
                      <tr key={`g-${cat.category}`} className="inst-group"><th colSpan={2} scope="colgroup">{cat.category}</th></tr>,
                      ...cat.items.map((it) => (
                        <tr key={`${cat.category}-${it.title}`}>
                          <th scope="row"><FigureText text={it.title} /></th>
                          <td><FigureText text={it.description} /></td>
                        </tr>
                      )),
                    ])}
                    {coverageTypes?.flatMap((c) => [
                      <tr key={`g-${c.title}`} className="inst-group"><th colSpan={2} scope="colgroup"><FigureText text={c.title} /></th></tr>,
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
              </section>
            )}

            {hasFaq && (
              <section id="faq" className="inst-section scroll-mt-28">
                <h2 className="inst-h2">שאלות נפוצות</h2>
                <div className="inst-faq">
                  {faqItems.map((f, i) => (
                    <details key={f.q} open={i === 0}>
                      <summary>{f.q}</summary>
                      <div>{f.a}</div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <section style={{ borderTop: "1px solid var(--line)" }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* CONTACT */}
        <section id={enrollmentFormId} className="inst-contact scroll-mt-20">
          <div className="inst-wrap inst-contact-grid">
            <div>
              <h2 className="inst-h2">נשמח להכיר את התיק שלכם</h2>
              <p className="inst-text mt-4">
                משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. הפגישה הראשונה ללא עלות ואינה מחייבת.
              </p>
              <div className="inst-reach mt-6">
                <a href="tel:0523097444" dir="ltr" style={{ justifyContent: "flex-end" }}>052-309-7444</a>
                <a href="mailto:info@seeld.co.il" dir="ltr" style={{ justifyContent: "flex-end" }}>info@seeld.co.il</a>
              </div>
              <p className="inst-small mt-8">{REGULATORY_LINE}</p>
            </div>
            <div className="inst-form">
              <InsuranceEnrollmentForm insuranceType={insuranceType} title={enrollmentTitle} description={enrollmentDescription} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
