import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InsuranceEnrollmentForm from '@/components/InsuranceEnrollmentForm';
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
import { SERIF, CHIP_ORANGE } from '@/lib/brand';
import { StatusPill } from '@/components/brand/Live';
import { DrawUnderline } from '@/components/brand/Strokes';
import { ShieldFigure, UmbrellaFigure } from '@/components/brand/Figures';

// SEELD Bento: warm paper tiles on ink gutters. Captions on paper stay at
// #5c5c5c minimum (AA); #6e6e6e is reserved for white surfaces only.
const PAPER_MUTED = '#5c5c5c';

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
  insuranceType: string;
  enrollmentTitle: string;
  enrollmentDescription: string;
  enrollmentFormId?: string;

  /* Extra content slots */
  extraContentAfterKeyPoints?: ReactNode;
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2
    className="text-[#171717] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

const tabTriggerClass =
  'rounded-none bg-transparent px-0 pb-4 text-base font-medium text-[#5c5c5c] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

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

  // Bento play: the page's line figure peeks from the hero tile corner —
  // shield for the protection covers, umbrella for everything else.
  const protectionPage = ['סיעוד', 'אובדן כושר', 'מחלות קשות', 'תאונות', 'נכות'].some(
    (k) => breadcrumbLabel.includes(k) || insuranceType.includes(k),
  );
  const HeroFigure = protectionPage ? ShieldFigure : UmbrellaFigure;

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: '#0a0a0a' }}>
      <Header />

      {/* ══════ HERO — paper tile ══════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16 relative z-10">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/insurances" className="hover:text-[#171717] transition-colors">ביטוח</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">{breadcrumbLabel}</span>
            </nav>
            <span className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.2em] font-medium" style={{ color: PAPER_MUTED }}>
              <HeroIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {heroCategory}
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            {heroTitle}
          </h1>
          {/* Align the stroke to the reading start of the RTL heading (right edge) */}
          <DrawUnderline color={CHIP_ORANGE} className="mt-2 mb-6 flex justify-end" />
          <p className="text-base sm:text-[17px] text-[#5c5c5c] max-w-2xl leading-[1.9] mb-9">
            {heroDescription}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={heroCTAHref}
              className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              {heroCTAText}
            </a>
            {heroSecondaryCTA && (
              <a
                href={heroSecondaryCTA.href}
                className="group inline-flex items-center gap-2 text-base font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
              >
                {heroSecondaryCTA.text}
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
            className="mt-7 block transition-transform hover:-translate-y-[1px]"
            aria-label="פתיחת שיחה עם יועץ SEELD AI"
          >
            <StatusPill>יש שאלה על {breadcrumbLabel}? היועץ מחובר</StatusPill>
          </button>
        </div>
        <HeroFigure className="absolute -left-3 -bottom-4 w-16 h-16 opacity-70 rotate-12 pointer-events-none" />
        </div>
      </section>

      <main>
        {/* ══════ KEY POINTS — paper tile ══════ */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="px-2 pt-2">
            <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                {keyPoints.map((kp, idx) => (
                  <div key={idx} className="border-t border-[#171717]/15 pt-5">
                    <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      {kp.title}
                    </h3>
                    <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">{kp.description}</p>
                  </div>
                ))}
              </div>
            </div></div>
          </section>
        )}

        {/* ══════ EXTRA CONTENT ══════ */}
        {extraContentAfterKeyPoints}

        {/* ══════ THE KNOWLEDGE — one tabbed section instead of three stacked ones ══════ */}
        {tabCount > 0 && (
          <section id="coverage" className="px-2 pt-2">
            <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
              <Tabs defaultValue={defaultTab} dir="rtl">
                <TabsList className="flex w-full justify-start gap-8 sm:gap-10 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
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
                          <div className="border-t border-[#171717]/15 pt-5 mb-6">
                            <SectionTitle>{article.title}</SectionTitle>
                          </div>
                          <div className="space-y-4 text-[#4d4d4d] leading-[1.9] text-base">
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
                        <p className="text-[#5c5c5c] mt-2 text-base leading-relaxed max-w-xl">{coverageSubtitle}</p>
                      )}
                    </div>

                    {coverageTypes && coverageTypes.length > 0 && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                        {coverageTypes.map((coverage, idx) => (
                          <div key={idx} className="border-t border-[#171717]/10 pt-4">
                            <h3 className="text-base text-[#171717] mb-3.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                              {coverage.title}
                            </h3>
                            <ul className="space-y-2">
                              {coverage.items.map((item, itemIdx) => {
                                if (typeof item === 'string') {
                                  return (
                                    <li key={itemIdx} className="text-[#5c5c5c] text-[14px] leading-relaxed flex gap-2.5">
                                      <span style={{ color: PAPER_MUTED }}>—</span>
                                      {item}
                                    </li>
                                  );
                                }
                                return (
                                  <li key={itemIdx} className="text-[#5c5c5c] text-[14px] leading-relaxed flex gap-2.5">
                                    <span style={{ color: PAPER_MUTED }}>—</span>
                                    <span>
                                      <span className="font-medium text-[#171717]">{item.title}</span>
                                      {item.description && <span className="text-[#5c5c5c]"> · {item.description}</span>}
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
                            <div className="text-[11px] tracking-[0.22em] font-medium mb-5" style={{ color: PAPER_MUTED }}>
                              {cat.category}
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                              {cat.items.map((item, idx) => (
                                <div key={idx} className="border-t border-[#171717]/10 pt-4">
                                  <h4 className="text-base font-medium text-[#171717] mb-1.5">{item.title}</h4>
                                  <p className="text-[#5c5c5c] text-[13px] leading-relaxed">{item.description}</p>
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
                            className="border-b border-[#171717]/10 rounded-none px-0"
                          >
                            <AccordionTrigger className="text-start text-base font-medium text-[#171717] hover:no-underline py-5">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-[#5c5c5c] leading-[1.85] pb-6 text-[14px]">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div></div>
          </section>
        )}

        {/* ══════ COMPANIES — own tile ══════ */}
        <section className="px-2 pt-2">
          <div className="bento-panel">
            <CompanyLogos variant="grid" />
          </div>
        </section>

        {/* ══════ CTA + FORM — ink tile ══════ */}
        <section id={enrollmentFormId} className="px-2 pt-2 scroll-mt-24">
          <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5 mb-10 text-center sm:text-right">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים הצעה מותאמת?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-relaxed max-w-xl">
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
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
