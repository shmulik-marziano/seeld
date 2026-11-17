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
import { useActiveSection } from "@/components/inst/useActiveSection";
import "./sd.css";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&display=swap";

/** Illustration of the kit (public/art/<name>-768.webp and -1536.webp) and the stage tint for the page's topic. */
export type SdArt = { name: string; tint: string; contactName?: string };

const hebrewDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
};

const Pic = ({ name, sizes, priority }: { name: string; sizes: string; priority?: boolean }) => (
  <img
    src={`/art/${name}-768.webp`}
    srcSet={`/art/${name}-768.webp 768w, /art/${name}-1536.webp 1536w`}
    sizes={sizes}
    width={768}
    height={512}
    alt=""
    decoding="async"
    loading={priority ? "eager" : "lazy"}
    {...(priority ? { fetchPriority: "high" as const } : {})}
  />
);

/**
 * Kit version of the insurance page: cream/navy/gold, pencil illustration in the hero, trust strip,
 * numbered key points, coverage as a real table, 3-step process, plain FAQ, navy contact block.
 * Same props as InsurancePageTemplate plus `art`. All content is real DOM (prerender carries it).
 */
export default function InsurancePageSd(props: InsurancePageProps & { art: SdArt }) {
  const {
    art,
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
    { id: "process", label: "איך זה עובד" },
    hasFaq && { id: "faq", label: "שאלות נפוצות" },
    { id: enrollmentFormId, label: "יצירת קשר" },
  ].filter(Boolean) as { id: string; label: string }[];
  const active = useActiveSection(sections.map((s) => s.id));

  const arrow = <BrandIcon name="arrow-left" size={18} />;
  const secondaryLink = secondary.href.startsWith("/") ? (
    <Link to={secondary.href} className="sd-link">{secondary.text}{arrow}</Link>
  ) : (
    <a href={secondary.href} className="sd-link">{secondary.text}{arrow}</a>
  );

  const trust = [
    { icon: "shield", t: "סוכן ברישיון 138666", s: "שמוליק מרציאנו" },
    { icon: "search", t: "השוואה בין החברות", s: "בכל חברות הביטוח בשוק" },
    { icon: "handshake", t: "פגישה ראשונה ללא עלות", s: "ואינה מחייבת" },
    { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={{ ["--tint" as string]: art.tint }}>
      <Header />

      <main>
        {/* HERO */}
        <section className="sd-hero">
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <nav aria-label="פירורי לחם" className="sd-crumbs mb-6">
                <Link to="/">דף הבית</Link>
                <BrandIcon name="arrow-left" size={12} />
                <Link to="/insurances">כל הביטוחים</Link>
                <BrandIcon name="arrow-left" size={12} />
                <span aria-current="page" className="font-bold" style={{ color: "var(--ink)" }}>{breadcrumbLabel}</span>
              </nav>
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
              <Pic name={art.name} sizes="(min-width:1024px) 520px, 90vw" priority />
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
                  <img src={`/art/icons/${x.icon}.svg`} alt="" width={40} height={40} loading="lazy" />
                  <div><b>{x.t}</b><span>{x.s}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* BODY */}
        <div className="sd-wrap sd-body">
          <nav className="sd-index" aria-label="תוכן העמוד">
            <b>בעמוד זה</b>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.label}</a>
            ))}
          </nav>

          <div className="min-w-0">
            {hasPoints && (
              <section id="overview" className="sd-section scroll-mt-28">
                <h2 className="sd-h2">עיקרי הדברים</h2>
                <div className="sd-points">
                  {keyPoints!.map((kp, i) => (
                    <div key={kp.title} className="sd-point">
                      <em>{String(i + 1).padStart(2, "0")}</em>
                      <h3 className="sd-h3">{kp.title}</h3>
                      <p>{kp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {extraContentAfterKeyPoints && <div className="mt-12">{extraContentAfterKeyPoints}</div>}

            {hasGuide && (
              <section id="guide" className="sd-section scroll-mt-28">
                {articles!.map((a, i) => (
                  <article key={a.title} className={i > 0 ? "mt-14" : ""}>
                    <h2 className="sd-h2" style={{ marginBottom: 20 }}>{a.title}</h2>
                    <div className="space-y-5">
                      {a.paragraphs.map((p, j) => <p key={j} className="sd-text">{p}</p>)}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {hasCoverage && (
              <section id="coverage" className="sd-section scroll-mt-28">
                <h2 className="sd-h2" style={{ marginBottom: coverageSubtitle ? 8 : 28 }}>{coverageTitle}</h2>
                {coverageSubtitle && <p className="sd-small mb-6" style={{ fontSize: 16 }}>{coverageSubtitle}</p>}
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
              </section>
            )}

            <section id="process" className="sd-section scroll-mt-28">
              <h2 className="sd-h2">איך זה עובד</h2>
              <ol className="sd-steps">
                {[
                  { icon: "checklist", t: "משאירים פרטים", p: "ממלאים טופס קצר או מתקשרים. מספרים לנו מה יש היום ומה חשוב לכם." },
                  { icon: "search", t: "אנחנו משווים", p: "בודקים את הכיסויים והמחירים בין החברות בשוק ומציגים לכם את ההבדלים בצורה ברורה." },
                  { icon: "handshake", t: "מחליטים יחד", p: "הפגישה הראשונה ללא עלות ואינה מחייבת. ההחלטה תמיד שלכם." },
                ].map((s, i) => (
                  <li key={s.t} className="sd-step">
                    <small>{String(i + 1).padStart(2, "0")}</small>
                    <img src={`/art/icons/${s.icon}.svg`} alt="" width={52} height={52} loading="lazy" />
                    <h3 className="sd-h3 mt-4">{s.t}</h3>
                    <p>{s.p}</p>
                  </li>
                ))}
              </ol>
            </section>

            {hasFaq && (
              <section id="faq" className="sd-section scroll-mt-28">
                <h2 className="sd-h2">שאלות נפוצות</h2>
                <div className="sd-faq">
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
        <section id={enrollmentFormId} className="sd-contact scroll-mt-20">
          <div className="sd-wrap sd-contact-grid">
            <div>
              <h2 className="sd-h2">נשמח להכיר את התיק שלכם</h2>
              <p className="sd-text mt-4">
                משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. הפגישה הראשונה ללא עלות ואינה מחייבת.
              </p>
              <div className="sd-reach mt-6">
                <a href="tel:0523097444" dir="ltr" style={{ justifyContent: "flex-end" }}>052-309-7444</a>
                <a href="mailto:info@seeld.co.il" dir="ltr" style={{ justifyContent: "flex-end" }}>info@seeld.co.il</a>
              </div>
              <div className="sd-contact-art" aria-hidden="true">
                <Pic name={art.contactName ?? "11-claims-service"} sizes="360px" />
              </div>
              <p className="sd-small mt-8">{REGULATORY_LINE}</p>
            </div>
            <div className="sd-form">
              <InsuranceEnrollmentForm insuranceType={insuranceType} title={enrollmentTitle} description={enrollmentDescription} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
