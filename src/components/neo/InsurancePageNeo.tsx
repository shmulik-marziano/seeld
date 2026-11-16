import { Link } from "react-router-dom";
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
import "./neo.css";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Neo-minimal version of the insurance page template. Same props as InsurancePageTemplate,
 * so any of the 16 insurance pages can switch by swapping the component. All content is real
 * DOM (no tabs, no hidden-until-scroll), so the prerendered HTML carries every section.
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
  } = props;

  useFaqJsonLd(faqItems);

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

  let n = 0;
  const num = () => pad(++n);

  return (
    <div className="neo min-h-screen" dir="rtl">
      <Header />

      <main>
        {/* HERO */}
        <section className="neo-wrap" style={{ paddingBlock: "clamp(56px, 9vw, 128px) clamp(48px, 7vw, 96px)" }}>
          <nav aria-label="פירורי לחם" className="mb-10 flex items-center gap-2 text-[14px]" style={{ color: "var(--neo-muted)" }}>
            <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
            <BrandIcon name="arrow-left" size={12} />
            <Link to="/insurances" className="hover:underline underline-offset-4">כל הביטוחים</Link>
            <BrandIcon name="arrow-left" size={12} />
            <span aria-current="page" className="font-bold" style={{ color: "var(--neo-ink)" }}>{breadcrumbLabel}</span>
          </nav>

          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className={art ? "lg:col-span-8" : "lg:col-span-12"}>
              <span className="neo-eyebrow">{heroCategory}</span>
              <h1 className="neo-h1 mt-6">{heroTitle}</h1>
              <AnswerSummary className="neo-lead mt-8" />
              <p className="neo-text mt-5" style={{ color: "var(--neo-muted)" }}>{heroDescription}</p>
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
              <div className="hidden lg:col-span-4 lg:block">
                <Illustration name={art} priority sizes="(min-width: 1024px) 380px, 0px" className="w-full" />
              </div>
            )}
          </div>

          {keyPoints && keyPoints.length > 0 && (
            <div className="neo-facts mt-16 sm:mt-24">
              {keyPoints.map((kp, i) => (
                <div key={kp.title} className="neo-fact">
                  <span className="neo-num">{pad(i + 1)}</span>
                  <h3>{kp.title}</h3>
                  <p>{kp.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

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

        {/* GUIDE */}
        {hasGuide && (
          <section id="guide" className="neo-section scroll-mt-32">
            <div className="neo-wrap">
              {articles!.map((a, i) => (
                <div key={a.title} className="neo-split" style={i > 0 ? { marginTop: "clamp(56px, 7vw, 96px)" } : undefined}>
                  <div className="neo-sticky">
                    <span className="neo-num">{num()}</span>
                    <h2 className="neo-h2 mt-3">{a.title}</h2>
                  </div>
                  <div className="space-y-6">
                    {a.paragraphs.map((p, j) => <p key={j} className="neo-text">{p}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COVERAGE */}
        {hasCoverage && (
          <section id="coverage" className="neo-section scroll-mt-32">
            <div className="neo-wrap neo-split">
              <div className="neo-sticky">
                <span className="neo-num">{num()}</span>
                <h2 className="neo-h2 mt-3">{coverageTitle}</h2>
                {coverageSubtitle && <p className="neo-text mt-4" style={{ color: "var(--neo-muted)" }}>{coverageSubtitle}</p>}
              </div>
              <div>
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

        {/* FAQ */}
        {hasFaq && (
          <section id="faq" className="neo-section scroll-mt-32">
            <div className="neo-wrap neo-split">
              <div className="neo-sticky">
                <span className="neo-num">{num()}</span>
                <h2 className="neo-h2 mt-3">שאלות נפוצות</h2>
              </div>
              <div className="neo-faq">
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

        <section className="neo-section" style={{ paddingBlock: 0 }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* CLOSING BAND */}
        <section id={enrollmentFormId} className="neo-band scroll-mt-24">
          <div className="neo-wrap" style={{ paddingBlock: "clamp(72px, 10vw, 144px)" }}>
            <div className="grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <h2 className="neo-h2">רוצים הצעה מותאמת?</h2>
                <p className="mt-6 max-w-md text-[19px] leading-[1.7]">
                  משאירים פרטים, ואנחנו חוזרים עם השוואה בין החברות בשוק. הפגישה הראשונה ללא עלות.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <Link to="/portfolio-review" className="neo-btn neo-btn--onDark">בדיקת תיק 360</Link>
                  <Link to="/contact" className="neo-link" style={{ color: "var(--neo-paper)" }}>
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
        </section>
      </main>

      <Footer />
    </div>
  );
}
