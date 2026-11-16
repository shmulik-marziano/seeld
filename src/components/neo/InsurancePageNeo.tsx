import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CSSProperties } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanyLogos from "@/components/CompanyLogos";
import AnswerSummary from "@/components/AnswerSummary";
import InsuranceEnrollmentForm from "@/components/InsuranceEnrollmentForm";
import { Illustration, type IllustrationName } from "@/components/brand/Illustration";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FigureText, type InsurancePageProps } from "@/components/InsurancePageTemplate";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import { useActiveSection } from "./useActiveSection";
import { themeFor } from "./themes";
import "./neo.css";

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700;900&display=swap";
const LETTERS = ["א", "ב", "ג", "ד", "ה", "ו"];
const ORDINALS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

/** Gold diamond divider. */
const Rule = () => (
  <div className="neo-rule" aria-hidden="true">
    <i />
  </div>
);

/** Chapter heading: "פרק שני" / title / divider. */
const Chapter = ({ n, title, sub }: { n: number; title: string; sub?: string }) => (
  <div className="neo-chapter">
    <span className="neo-eyebrow">פרק {ORDINALS[n] ?? n + 1}</span>
    <h2 className="neo-h2 mt-4">{title}</h2>
    <Rule />
    {sub && <p className="neo-text mx-auto max-w-xl" style={{ color: "var(--muted)" }}>{sub}</p>}
  </div>
);

/**
 * Neo-minimal version of the insurance page template, in the SEELD-BOOKS print language
 * (pastel chapter grounds, navy ink, gold hairlines, arch frame, serif display type).
 * Same props as InsurancePageTemplate, so any of the 16 insurance pages can switch by swapping the
 * component. All content is real DOM (no tabs, nothing hidden until scroll), so the prerendered
 * HTML carries every section.
 */
export default function InsurancePageNeo(props: InsurancePageProps) {
  const {
    heroCategory,
    heroTitle,
    heroDescription,
    heroCTAText = "קבלו הצעה מותאמת",
    heroCTAHref = "#contact-form",
    heroSecondaryCTA,
    illustration,
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

  // Display serif, loaded only by pages that use this design.
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const art: IllustrationName | null = illustration === undefined ? "02-family-protection" : illustration;
  const secondary = heroSecondaryCTA ?? { text: "בדיקת תיק 360", href: "/portfolio-review" };
  const hasGuide = !!articles?.length;
  const hasCoverage = !!coverageCategories?.length || !!coverageTypes?.length;
  const hasFaq = faqItems.length > 0;

  const sections = [
    hasGuide && { id: "guide", label: "המדריך" },
    hasCoverage && { id: "coverage", label: "הכיסויים" },
    hasFaq && { id: "faq", label: "שאלות נפוצות" },
    { id: enrollmentFormId, label: "קבלת הצעה" },
  ].filter(Boolean) as { id: string; label: string }[];
  const active = useActiveSection(sections.map((s) => s.id));

  let chapter = -1;
  const next = () => ++chapter;

  return (
    <div className="neo min-h-screen" dir="rtl" style={themeFor(pathname) as CSSProperties}>
      <Header />

      <main>
        {/* HERO: gold hairline frame, arch-framed illustration */}
        <div className="neo-frame">
          <section className="neo-wrap" style={{ paddingBlock: "clamp(48px, 7vw, 104px)" }}>
            <nav aria-label="פירורי לחם" className="mb-10 flex items-center justify-center gap-2 text-[14px]" style={{ color: "var(--muted)" }}>
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={12} />
              <Link to="/insurances" className="hover:underline underline-offset-4">כל הביטוחים</Link>
              <BrandIcon name="arrow-left" size={12} />
              <span aria-current="page" className="font-bold" style={{ color: "var(--ink)" }}>{breadcrumbLabel}</span>
            </nav>

            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className={art ? "lg:col-span-7" : "lg:col-span-12 text-center"}>
                <span className="neo-eyebrow">{heroCategory}</span>
                <h1 className="neo-h1 mt-5">{heroTitle}</h1>
                <div className="neo-rule" style={{ justifyContent: art ? "flex-start" : "center" }} aria-hidden="true"><i /></div>
                <AnswerSummary className="neo-lead" />
                <p className="neo-text mt-5" style={{ color: "var(--muted)" }}>{heroDescription}</p>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <a href={heroCTAHref} className="neo-btn neo-btn--solid">{heroCTAText}</a>
                  {secondary.href.startsWith("/") ? (
                    <Link to={secondary.href} className="neo-link">{secondary.text}<BrandIcon name="arrow-left" size={18} /></Link>
                  ) : (
                    <a href={secondary.href} className="neo-link">{secondary.text}<BrandIcon name="arrow-left" size={18} /></a>
                  )}
                </div>
              </div>
              {art && (
                <div className="mx-auto w-full max-w-[420px] lg:col-span-5">
                  <div className="neo-arch">
                    <div>
                      <Illustration name={art} priority sizes="(min-width: 1024px) 420px, 90vw" className="w-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* IN-PAGE NAV */}
        <div className="neo-nav">
          <div className="neo-wrap">
            <ul aria-label="ניווט בעמוד">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* KEY POINTS on butter ground */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="neo-ground neo-ground--cream" style={{ paddingBlock: "clamp(48px, 6vw, 88px)" }}>
            <div className="neo-wrap">
              <div className="neo-facts">
                {keyPoints.map((kp, i) => (
                  <div key={kp.title} className="neo-fact">
                    <div className="neo-badge"><span aria-hidden="true">{LETTERS[i]}</span><b>{kp.title}</b></div>
                    <p>{kp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {extraContentAfterKeyPoints}

        {/* GUIDE: paper ground */}
        {hasGuide && (
          <section id="guide" className="neo-ground neo-ground--paper scroll-mt-32">
            <div className="neo-wrap">
              {articles!.map((a, i) => (
                <article key={a.title} className="neo-narrow" style={i > 0 ? { marginTop: "clamp(64px, 8vw, 112px)" } : undefined}>
                  <Chapter n={next()} title={a.title} />
                  <div className="space-y-6">
                    {a.paragraphs.map((p, j) => <p key={j} className="neo-text">{p}</p>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* COVERAGE: sage ground */}
        {hasCoverage && (
          <section id="coverage" className="neo-ground neo-ground--a scroll-mt-32">
            <div className="neo-wrap">
              <Chapter n={next()} title={coverageTitle} sub={coverageSubtitle} />
              <div className="neo-narrow" style={{ maxWidth: 920 }}>
                {coverageCategories?.map((cat) => (
                  <div key={cat.category} className="neo-cat">
                    <h3>{cat.category}</h3>
                    {cat.items.map((it) => (
                      <div key={it.title} className="neo-row">
                        <h4><FigureText text={it.title} /></h4>
                        <p><FigureText text={it.description} /></p>
                      </div>
                    ))}
                  </div>
                ))}
                {coverageTypes?.map((c) => (
                  <div key={c.title} className="neo-cat">
                    <h3>{c.title}</h3>
                    {c.items.map((it, k) =>
                      typeof it === "string" ? (
                        <div key={k} className="neo-row"><h4><FigureText text={it} /></h4></div>
                      ) : (
                        <div key={k} className="neo-row">
                          <h4><FigureText text={it.title} /></h4>
                          <p><FigureText text={it.description} /></p>
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ: sky ground */}
        {hasFaq && (
          <section id="faq" className="neo-ground neo-ground--b scroll-mt-32">
            <div className="neo-wrap">
              <Chapter n={next()} title="שאלות נפוצות" />
              <div className="neo-narrow neo-faq">
                {faqItems.map((f, i) => (
                  <details key={f.q} open={i === 0}>
                    <summary>{f.q}</summary>
                    <div>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{ background: "var(--paper)" }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* CLOSING BAND: navy ink, gold frame */}
        <section id={enrollmentFormId} className="neo-band scroll-mt-24">
          <div className="neo-band-inner">
            <div className="neo-wrap">
              <div className="grid items-center gap-14 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <span className="neo-eyebrow">הצעד הבא</span>
                  <h2 className="neo-h2 mt-4">רוצים הצעה מותאמת?</h2>
                  <div className="neo-rule" style={{ justifyContent: "flex-start" }} aria-hidden="true"><i /></div>
                  <p className="max-w-md text-[19px] leading-[1.8]">
                    משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. הפגישה הראשונה ללא עלות.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Link to="/portfolio-review" className="neo-btn neo-btn--onDark">בדיקת תיק 360</Link>
                    <Link to="/contact" className="neo-link" style={{ color: "var(--paper)" }}>
                      תיאום פגישה
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <InsuranceEnrollmentForm insuranceType={insuranceType} title={enrollmentTitle} description={enrollmentDescription} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
