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
import { Illustration, type IllustrationName } from '@/components/brand/Illustration';
import { LeafCanopy } from '@/components/brand/Elements';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN } from '@/lib/brand';

// Brand service page (kit p.05): one illustration beside the central explanation
// when the subject has one; otherwise a vector element keeps the page clean.

// Figures inside coverage copy (sums, percentages, 24/7, ranges) render
// tabular and LTR-safe.
const FIGURE_RE = /(?:₪\s?)?\d(?:[\d,.:/\-–]*\d)?(?:\s?[%₪])?/g;

const FigureText = ({ text }: { text: string }) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FIGURE_RE)) {
    const i = m.index ?? 0;
    if (i > last) nodes.push(text.slice(last, i));
    nodes.push(
      <span key={i} dir="ltr" className="tabular-nums whitespace-nowrap">
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
  /** Override the subject illustration; null = no illustration on this page. */
  illustration?: IllustrationName | null;

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

/** Kit mapping: 02-family-protection belongs to health, life and family cover.
 *  Property, vehicle, travel and business pages stay illustration-free on purpose. */
const SUBJECT_ILLUSTRATION: Partial<Record<InsuranceType, IllustrationName>> = {
  health: '02-family-protection',
  life: '02-family-protection',
  critical_illness: '02-family-protection',
  disability: '02-family-protection',
  nursing: '02-family-protection',
  dental: '02-family-protection',
  personal_accidents: '02-family-protection',
  partners_risk: '02-family-protection',
  mortgage: '02-family-protection',
};

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="dna-display leading-tight" style={{ fontSize: 'clamp(24px, 3vw, 30px)' }}>
    {children}
  </h2>
);

const tabTriggerClass =
  'rounded-none bg-transparent px-2.5 -mx-2.5 pb-4 text-[16px] font-bold text-[#476356] hover:text-[#003D30] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap';

export default function InsurancePageTemplate(props: InsurancePageProps) {
  const {
    heroIcon: HeroIcon,
    heroCategory,
    heroTitle,
    heroDescription,
    heroCTAText = 'קבלו הצעה מותאמת',
    heroCTAHref = '#contact-form',
    heroSecondaryCTA,
    illustration,
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

  const art: IllustrationName | null =
    illustration === undefined ? (SUBJECT_ILLUSTRATION[insuranceType] ?? null) : illustration;

  const hasArticles = !!articles && articles.length > 0;
  const hasCoverage =
    (!!coverageTypes && coverageTypes.length > 0) ||
    (!!coverageCategories && coverageCategories.length > 0);
  const hasFaq = faqItems.length > 0;
  const defaultTab = hasArticles ? 'guide' : hasCoverage ? 'coverage' : 'faq';
  const tabCount = [hasArticles, hasCoverage, hasFaq].filter(Boolean).length;

  const secondary = heroSecondaryCTA ?? { text: 'בדיקת תיק 360', href: '/contact' };
  const secondaryIsRoute = secondary.href.startsWith('/');

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      {/* HERO */}
      <section className="dna-page overflow-hidden">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 320, height: 320, top: -150, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
          />
        </div>
        <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
          {/* Breadcrumb */}
          <nav className="mb-6 sm:mb-10 flex items-center gap-2 text-[14px]" style={{ color: MUTED }} aria-label="ניווט משני">
            <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
            <BrandIcon name="arrow-left" size={14} />
            <Link to="/insurances" className="hover:underline underline-offset-4">ביטוח</Link>
            <BrandIcon name="arrow-left" size={14} />
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">{breadcrumbLabel}</span>
          </nav>

          <div className={`grid gap-10 lg:gap-16 items-center ${art ? 'lg:grid-cols-[1.05fr_1fr]' : ''}`}>
            <div className="relative">
              {!art && <LeafCanopy className="hidden lg:block absolute -top-6 -left-6 w-56 opacity-90" />}
              <div className="flex items-center gap-3 mb-4">
                <HeroIcon className="w-8 h-8" strokeWidth={1.75} style={{ color: GREEN }} aria-hidden="true" />
                <span className="text-[15px] font-bold" style={{ color: MUTED }}>{heroCategory}</span>
              </div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: 'clamp(32px, 4.4vw, 52px)' }}>
                {heroTitle}
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] mb-8" style={{ color: MUTED }}>
                {heroDescription}
              </p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <a href={heroCTAHref} className="btn-primary sm:min-w-[220px]">
                  {heroCTAText}
                </a>
                {secondaryIsRoute ? (
                  <Link to={secondary.href} className="btn-secondary sm:min-w-[200px]">{secondary.text}</Link>
                ) : (
                  <a href={secondary.href} className="btn-secondary sm:min-w-[200px]">{secondary.text}</a>
                )}
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('seeld:open-chat'))}
                className="mt-6 link-rule text-[15px]"
              >
                <BrandIcon name="message" size={18} />
                יש שאלה על {breadcrumbLabel}? שאלו את היועץ הדיגיטלי
              </button>
            </div>

            {art && (
              <Illustration
                name={art}
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="brand-hero-art shadow-[0_16px_40px_-24px_rgba(0,61,48,0.35)]"
              />
            )}
          </div>
        </div>
      </section>

      <main>
        {/* KEY POINTS */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="border-t bg-white" style={{ borderColor: LINE }}>
            <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
              {/* Key points as list cards (mock "מה כוללת הבדיקה?"): icon in a tinted disc, title, one paragraph */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {keyPoints.map((kp, idx) => {
                  const Icon = kp.icon;
                  const tint = [PASTEL_SAGE, PASTEL_SAND, PASTEL_MINT][idx % 3];
                  return (
                    <div key={idx} className="flex items-start gap-4 rounded-2xl bg-white border p-5" style={{ borderColor: LINE }}>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: tint }}>
                        <Icon className="w-6 h-6" strokeWidth={1.75} style={{ color: GREEN }} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[18px] mb-1.5" style={{ color: GREEN }}>
                          {kp.title}
                        </h3>
                        <p className="text-[15px] leading-[1.7]" style={{ color: BODY }}>{kp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* EXTRA CONTENT */}
        {extraContentAfterKeyPoints}

        {/* THE KNOWLEDGE — one tabbed section */}
        {tabCount > 0 && (
          <section id="coverage" className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <Tabs defaultValue={defaultTab} dir="rtl">
                <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b rounded-none overflow-x-auto scrollbar-hide" style={{ borderColor: LINE }}>
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

                {hasArticles && (
                  <TabsContent value="guide" className="mt-0">
                    <div className="max-w-3xl">
                      {articles!.map((article, idx) => (
                        <div key={idx} className={idx > 0 ? 'mt-14' : ''}>
                          <div className="mb-6">
                            <SectionTitle>{article.title}</SectionTitle>
                          </div>
                          <div className="space-y-4 leading-[1.8] text-[17px]" style={{ color: BODY }}>
                            {article.paragraphs.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {hasCoverage && (
                  <TabsContent value="coverage" className="mt-0">
                    <div className="mb-10">
                      <SectionTitle>{coverageTitle}</SectionTitle>
                      {coverageSubtitle && (
                        <p className="mt-2 text-[17px] leading-relaxed max-w-xl" style={{ color: MUTED }}>{coverageSubtitle}</p>
                      )}
                    </div>

                    {coverageTypes && coverageTypes.length > 0 && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coverageTypes.map((coverage, idx) => {
                          const Icon = coverage.icon;
                          return (
                            <div key={idx} className="dna-concept">
                              <div className="flex items-center gap-3 mb-3">
                                <Icon className="w-7 h-7 shrink-0" strokeWidth={1.75} style={{ color: GREEN }} aria-hidden="true" />
                                <h3 className="text-[18px]" style={{ color: GREEN }}>
                                  <FigureText text={coverage.title} />
                                </h3>
                              </div>
                              <ul>
                                {coverage.items.map((item, itemIdx) => {
                                  if (typeof item === 'string') {
                                    return (
                                      <li key={itemIdx} className="dna-pill-item !py-1.5 text-[15px]">
                                        <span><FigureText text={item} /></span>
                                      </li>
                                    );
                                  }
                                  return (
                                    <li key={itemIdx} className="dna-pill-item !py-1.5 text-[15px]">
                                      <span>
                                        <span className="font-bold" style={{ color: GREEN }}><FigureText text={item.title} /></span>
                                        {item.description && <span style={{ color: BODY }}> · <FigureText text={item.description} /></span>}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {coverageCategories && coverageCategories.length > 0 && (
                      <div className="space-y-12">
                        {coverageCategories.map((cat, catIdx) => (
                          <div key={catIdx}>
                            <h3 className="text-[20px] mb-5" style={{ color: GREEN }}>
                              {cat.category}
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                              {cat.items.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                  <div key={idx} className="dna-concept">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                      <Icon className="w-6 h-6 shrink-0" strokeWidth={1.75} style={{ color: GREEN }} aria-hidden="true" />
                                      <h4 className="text-[16px]" style={{ color: GREEN }}><FigureText text={item.title} /></h4>
                                    </div>
                                    <p className="text-[15px] leading-relaxed" style={{ color: BODY }}><FigureText text={item.description} /></p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {hasFaq && (
                  <TabsContent value="faq" className="mt-0">
                    <div className="max-w-3xl">
                      <Accordion type="multiple">
                        {faqItems.map((item, idx) => (
                          <AccordionItem
                            key={idx}
                            value={`faq-${idx}`}
                            className="border-b rounded-none px-0"
                            style={{ borderColor: LINE }}
                          >
                            <AccordionTrigger className="text-start text-[17px] font-bold hover:no-underline py-5 px-3 -mx-3 rounded-lg hover:bg-white transition-colors duration-150" style={{ color: GREEN }}>
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="leading-[1.75] pb-6 text-[16px]" style={{ color: BODY }}>
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

        {/* COMPANIES */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* CTA + FORM — deep green band */}
        <section id={enrollmentFormId} className="scroll-mt-24 dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="mb-10">
              <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: 'clamp(26px, 3vw, 34px)' }}>
                רוצים הצעה מותאמת?
              </h2>
              <p className="text-[17px] leading-relaxed max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                מלאו את הפרטים ונחזור אליכם עם הצעה שמשווה בין החברות בשוק. אפשר גם להתחיל בבדיקת תיק 360 מלאה.
              </p>
            </div>
            <div className="max-w-2xl">
              <InsuranceEnrollmentForm
                insuranceType={insuranceType}
                title={enrollmentTitle}
                description={enrollmentDescription}
              />
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[220px]">
                בדיקת תיק 360
              </Link>
              <Link to="/contact" className="link-rule text-[15px] self-center !text-[#FAF7EF] !border-[#FAF7EF]/40 hover:!border-[#FAF7EF]">
                תיאום פגישה
                <BrandIcon name="arrow-left" size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
