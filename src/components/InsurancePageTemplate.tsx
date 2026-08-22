import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InsuranceEnrollmentForm, { type InsuranceType } from '@/components/InsuranceEnrollmentForm';
import CompanyLogos from '@/components/CompanyLogos';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  DISPLAY, LINE, MONO, NAVY, PASTEL_BLUE, PASTEL_MINT, TINT_GOLD, TURQ,
} from '@/lib/brand';
import { StatusPill } from '@/components/brand/Live';

// SEELD DNA v3 (STYLESEED.md is the lock): white canvas, navy/turquoise/gold,
// one pastel-circle backdrop per page, hairline #E7EDF1 separators.

// Repeating umbrella line-art — the protection-page craft gesture,
// navy ink at low opacity on the gold tint (canon: HeroSection).
const UMBRELLA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231D2D3D' stroke-width='2' stroke-linecap='round' opacity='0.14'%3E%3Cpath d='M14 26 C14 17 20 13 28 13 C36 13 42 17 42 26'/%3E%3Cpath d='M14 26 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0'/%3E%3Cpath d='M28 13 v-3'/%3E%3Cpath d='M28 26 v12 c0 4 6 4 6 1'/%3E%3C/g%3E%3C/svg%3E")`;

// Figures inside coverage copy (sums, percentages, 24/7, ranges) render in
// Geist Mono with tabular numerals, LTR-safe — the market-mono touch.
const FIGURE_RE = /(?:₪\s?)?\d(?:[\d,.:/\-–]*\d)?(?:\s?[%₪])?/g;

const FigureText = ({ text }: { text: string }) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE_RE)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    nodes.push(
      <span key={i} dir="ltr" className="tabular-nums whitespace-nowrap" style={{ fontFamily: MONO }}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last === 0) return <>{text}</>;
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
};

/* ─── Types (unchanged API — all 16 insurance pages pass these) ─── */
interface KeyPoint {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
}

interface CoverageItem {
  title: string;
  icon: LucideIcon;
  color?: string;
  items: (string | { title: string; description: string; icon: LucideIcon })[];
}

interface CoverageCategory {
  category: string;
  color: string;
  items: { title: string; description: string; icon: LucideIcon }[];
}

interface ArticleSection {
  title: string;
  paragraphs: string[];
}

interface FAQItem {
  q: string;
  a: string;
}

export interface InsurancePageProps {
  /* Hero */
  heroIcon: LucideIcon;
  heroIconColor: string;
  heroCategory: string;
  heroTitle: ReactNode;
  heroDescription: string;
  heroCTAText?: string;
  heroCTAHref?: string;
  heroSecondaryCTA?: { text: string; href: string };

  /* Breadcrumb */
  breadcrumbLabel: string;

  /* Key Points */
  keyPoints?: KeyPoint[];

  /* Coverage - flat list */
  coverageTypes?: CoverageItem[];
  /* Coverage - categorized */
  coverageCategories?: CoverageCategory[];
  coverageTitle?: string;
  coverageSubtitle?: string;
  coverageGridCols?: string;

  /* Article */
  articles?: ArticleSection[];

  /* FAQ */
  faqItems: FAQItem[];

  /* Companies */
  companies?: string[];

  /* Enrollment */
  insuranceType: InsuranceType;
  enrollmentTitle: string;
  enrollmentDescription: string;
  enrollmentFormId?: string;

  /* Extra content slots */
  extraContentAfterKeyPoints?: ReactNode;
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)' }}>
    {children}
  </h2>
);

const tabTriggerClass =
  'rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-base font-medium text-[#5a6a78] hover:bg-[#E1EAF1]/35 hover:text-[#1D2D3D] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

export default function InsurancePageTemplate(props: InsurancePageProps) {
  const {
    heroIcon: HeroIcon,
    heroCategory,
    heroTitle,
    heroDescription,
    heroCTAText = 'קבלו הצעה מותאמת',
    heroCTAHref = '#contact-form',
    heroSecondaryCTA,
    breadcrumbLabel,
    keyPoints,
    coverageTypes,
    coverageCategories,
    coverageTitle = 'סוגי הכיסויים',
    coverageSubtitle,
    articles,
    faqItems,
    insuranceType,
    enrollmentTitle,
    enrollmentDescription,
    enrollmentFormId = 'contact-form',
    extraContentAfterKeyPoints,
  } = props;

  const hasArticles = !!articles && articles.length > 0;
  const hasCoverage =
    (!!coverageTypes && coverageTypes.length > 0) ||
    (!!coverageCategories && coverageCategories.length > 0);
  const hasFaq = faqItems.length > 0;
  const defaultTab = hasArticles ? 'guide' : hasCoverage ? 'coverage' : 'faq';
  const tabCount = [hasArticles, hasCoverage, hasFaq].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* HERO — white DNA canvas, the page's single pastel-circle backdrop */}
      <section className="dna-page">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, bottom: -120, left: '30%', backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          {/* Breadcrumb + corner category tag */}
          <div className="mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[13px] text-[#5a6a78]">
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <Link to="/insurances" className="hover:text-[#1D2D3D] transition-colors">ביטוח</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">{breadcrumbLabel}</span>
            </nav>
            <span
              className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.2em] font-medium text-[#5a6a78]"
              style={{ fontFamily: MONO }}
            >
              <HeroIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {heroCategory}
            </span>
          </div>

          <h1 className="dna-display leading-[1.12] max-w-3xl" style={{ fontSize: 'clamp(34px, 5vw, 50px)' }}>
            {heroTitle}
          </h1>
          <p className="mt-6 text-base sm:text-[17px] text-[#5a6a78] max-w-2xl leading-[1.9] mb-9">
            {heroDescription}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={heroCTAHref}
              className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[52px]"
            >
              {heroCTAText}
            </a>
            {heroSecondaryCTA && (
              <a
                href={heroSecondaryCTA.href}
                className="group inline-flex items-center gap-2 text-base font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
              >
                {heroSecondaryCTA.text}
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 inline-flex rounded-full dna-hover"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על {breadcrumbLabel}? היועץ מחובר</StatusPill>
          </button>

          {/* Umbrella line-art strip — the protection-page craft gesture */}
          <div
            className="mt-12 h-16 rounded-lg"
            aria-hidden="true"
            style={{ backgroundColor: TINT_GOLD, backgroundImage: UMBRELLA_PATTERN, backgroundSize: '56px 56px' }}
          />
        </div>
      </section>

      <main>
        {/* ══════ KEY POINTS ══════ */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                {keyPoints.map((kp, idx) => (
                  <div key={idx}>
                    <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                    <h3 className="text-[19px] mb-2.5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                      {kp.title}
                    </h3>
                    <p className="text-[14.5px] text-[#3a4c5a] leading-[1.8]">{kp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ EXTRA CONTENT ══════ */}
        {extraContentAfterKeyPoints}

        {/* ══════ THE KNOWLEDGE — one tabbed section instead of three stacked ones ══════ */}
        {tabCount > 0 && (
          <section id="coverage" className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <Tabs defaultValue={defaultTab} dir="rtl">
                <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto scrollbar-hide">
                  {hasArticles && (
                    <TabsTrigger value="guide" className={tabTriggerClass}>
                      המדריך
                    </TabsTrigger>
                  )}
                  {hasCoverage && (
                    <TabsTrigger value="coverage" className={tabTriggerClass}>
                      הכיסויים
                    </TabsTrigger>
                  )}
                  {hasFaq && (
                    <TabsTrigger value="faq" className={tabTriggerClass}>
                      שאלות נפוצות
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* — Guide — */}
                {hasArticles && (
                  <TabsContent value="guide" className="mt-0">
                    <div className="max-w-3xl">
                      {articles!.map((article, idx) => (
                        <div key={idx} className={idx > 0 ? 'mt-14' : ''}>
                          <div className="mb-6">
                            <SectionTitle>{article.title}</SectionTitle>
                          </div>
                          <div className="space-y-4 text-[#3a4c5a] leading-[1.9] text-base">
                            {article.paragraphs.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* — Coverage — */}
                {hasCoverage && (
                  <TabsContent value="coverage" className="mt-0">
                    <div className="mb-10">
                      <SectionTitle>{coverageTitle}</SectionTitle>
                      {coverageSubtitle && (
                        <p className="text-[#5a6a78] mt-2 text-base leading-relaxed max-w-xl">{coverageSubtitle}</p>
                      )}
                    </div>

                    {coverageTypes && coverageTypes.length > 0 && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coverageTypes.map((coverage, idx) => (
                          <div key={idx} className="dna-concept">
                            <h3 className="text-[17px] mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                              <FigureText text={coverage.title} />
                            </h3>
                            <ul>
                              {coverage.items.map((item, itemIdx) => {
                                if (typeof item === 'string') {
                                  return (
                                    <li key={itemIdx} className="dna-pill-item !py-1.5 text-[14px]">
                                      <span><FigureText text={item} /></span>
                                    </li>
                                  );
                                }
                                return (
                                  <li key={itemIdx} className="dna-pill-item !py-1.5 text-[14px]">
                                    <span>
                                      <span className="font-medium text-[#1D2D3D]"><FigureText text={item.title} /></span>
                                      {item.description && <span className="text-[#3a4c5a]"> · <FigureText text={item.description} /></span>}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {coverageCategories && coverageCategories.length > 0 && (
                      <div className="space-y-12">
                        {coverageCategories.map((cat, catIdx) => (
                          <div key={catIdx}>
                            <h3 className="text-[19px] mb-5" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                              {cat.category}
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                              {cat.items.map((item, idx) => (
                                <div key={idx} className="dna-concept">
                                  <h4 className="text-base font-medium text-[#1D2D3D] mb-1.5"><FigureText text={item.title} /></h4>
                                  <p className="text-[#3a4c5a] text-[13.5px] leading-relaxed"><FigureText text={item.description} /></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* — FAQ — */}
                {hasFaq && (
                  <TabsContent value="faq" className="mt-0">
                    <div className="max-w-3xl">
                      <Accordion type="multiple">
                        {faqItems.map((item, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`faq-${idx}`}
                            className="border-b border-[#E7EDF1] rounded-none px-0"
                          >
                            <AccordionTrigger className="text-start text-base font-medium text-[#1D2D3D] hover:no-underline py-5 px-3 -mx-3 rounded-md hover:bg-[#E1EAF1]/35 transition-colors duration-150">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[#3a4c5a] leading-[1.85] pb-6 text-[14px]">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </section>
        )}

        {/* ══════ COMPANIES ══════ */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* ══════ CTA + FORM — institutional navy band ══════ */}
        <section id={enrollmentFormId} className="scroll-mt-24" style={{ backgroundColor: NAVY }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-10 text-center sm:text-right">
              <h2
                className="text-white leading-tight mb-3"
                style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(1.7rem, 3vw, 2.3rem)', letterSpacing: '-0.5px' }}
              >
                רוצים הצעה מותאמת?
              </h2>
              <p className="text-base leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,.65)' }}>
                מלאו את הפרטים ונחזור אליכם עם הצעה שמשווה בין כל החברות בשוק. בלי לחץ, בלי מרדף.
              </p>
            </div>
            <div className="max-w-2xl">
              <InsuranceEnrollmentForm
                insuranceType={insuranceType}
                title={enrollmentTitle}
                description={enrollmentDescription}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
