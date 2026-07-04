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
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { INK, BONE, PINE, BRONZE, SERIF } from '@/lib/brand';

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
    className="text-[#1a1a18] leading-tight"
    style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}
  >
    {children}
  </h2>
);

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

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      {/* ══════ HERO ══════ */}
      <section style={{ backgroundColor: BONE }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16">
          {/* Rule + breadcrumb */}
          <div className="border-t border-[#1a1a18]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#1a1a18]/40">
              <Link to="/" className="hover:text-[#1a1a18] transition-colors">דף הבית</Link>
              <span>←</span>
              <Link to="/insurances" className="hover:text-[#1a1a18] transition-colors">ביטוח</Link>
              <span>←</span>
              <span className="text-[#1a1a18]/70 font-medium">{breadcrumbLabel}</span>
            </nav>
            <span className="hidden sm:flex items-center gap-2 text-[11px] tracking-[0.2em] font-medium" style={{ color: BRONZE }}>
              <HeroIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {heroCategory}
            </span>
          </div>

          <h1
            className="text-[#1a1a18] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            {heroTitle}
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#1a1a18]/55 max-w-2xl leading-[1.9] mb-9">
            {heroDescription}
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={heroCTAHref}
              className="inline-flex items-center justify-center px-9 py-4 bg-[#1a1a18] text-[#f6f5f1] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
            >
              {heroCTAText}
            </a>
            {heroSecondaryCTA && (
              <a
                href={heroSecondaryCTA.href}
                className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#1a1a18] border-b border-[#1a1a18]/25 pb-0.5 hover:border-[#1a1a18] transition-colors"
              >
                {heroSecondaryCTA.text}
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </a>
            )}
          </div>
        </div>
      </section>

      <main>
        {/* ══════ KEY POINTS ══════ */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="bg-white">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                {keyPoints.map((kp, idx) => (
                  <div key={idx} className="border-t border-[#1a1a18]/15 pt-5">
                    <span className="text-[11px] tabular-nums tracking-[0.2em] block mb-4" style={{ color: BRONZE }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-lg text-[#1a1a18] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                      {kp.title}
                    </h3>
                    <p className="text-[13.5px] text-[#1a1a18]/50 leading-[1.8]">{kp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ EXTRA CONTENT ══════ */}
        {extraContentAfterKeyPoints}

        {/* ══════ ARTICLES ══════ */}
        {articles && articles.length > 0 && (
          <section className="bg-white">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-12 sm:pb-16 pt-2">
              <div className="max-w-3xl">
                {articles.map((article, idx) => (
                  <div key={idx} className={idx > 0 ? 'mt-14' : ''}>
                    <div className="border-t border-[#1a1a18]/15 pt-5 mb-6">
                      <SectionTitle>{article.title}</SectionTitle>
                    </div>
                    <div className="space-y-4 text-[#1a1a18]/60 leading-[1.9] text-[15px] sm:text-base">
                      {article.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ COVERAGE TYPES (flat) ══════ */}
        {coverageTypes && coverageTypes.length > 0 && (
          <section id="coverage" style={{ backgroundColor: BONE }}>
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
                <SectionTitle>{coverageTitle}</SectionTitle>
                {coverageSubtitle && (
                  <p className="text-[#1a1a18]/45 mt-2 text-[15px] leading-relaxed max-w-xl">{coverageSubtitle}</p>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                {coverageTypes.map((coverage, idx) => (
                  <div key={idx} className="border-t border-[#1a1a18]/10 pt-4">
                    <h3 className="text-base text-[#1a1a18] mb-3.5" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                      {coverage.title}
                    </h3>
                    <ul className="space-y-2">
                      {coverage.items.map((item, itemIdx) => {
                        if (typeof item === 'string') {
                          return (
                            <li key={itemIdx} className="text-[#1a1a18]/55 text-[13.5px] leading-relaxed flex gap-2.5">
                              <span style={{ color: BRONZE }}>—</span>
                              {item}
                            </li>
                          );
                        }
                        return (
                          <li key={itemIdx} className="text-[#1a1a18]/55 text-[13.5px] leading-relaxed flex gap-2.5">
                            <span style={{ color: BRONZE }}>—</span>
                            <span>
                              <span className="font-medium text-[#1a1a18]">{item.title}</span>
                              {item.description && <span className="text-[#1a1a18]/45"> · {item.description}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ COVERAGE CATEGORIES (grouped) ══════ */}
        {coverageCategories && coverageCategories.length > 0 && (
          <section id="coverage" style={{ backgroundColor: BONE }}>
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="border-t border-[#1a1a18]/20 pt-5 mb-10">
                <SectionTitle>{coverageTitle}</SectionTitle>
                {coverageSubtitle && (
                  <p className="text-[#1a1a18]/45 mt-2 text-[15px] leading-relaxed max-w-xl">{coverageSubtitle}</p>
                )}
              </div>
              <div className="space-y-12">
                {coverageCategories.map((cat, catIdx) => (
                  <div key={catIdx}>
                    <div className="text-[11px] tracking-[0.22em] font-medium mb-5" style={{ color: BRONZE }}>
                      {cat.category}
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
                      {cat.items.map((item, idx) => (
                        <div key={idx} className="border-t border-[#1a1a18]/10 pt-4">
                          <h4 className="text-[15px] font-medium text-[#1a1a18] mb-1.5">{item.title}</h4>
                          <p className="text-[#1a1a18]/50 text-[13px] leading-relaxed">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════ FAQ ══════ */}
        {faqItems.length > 0 && (
          <section className="bg-white">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
              <div className="max-w-3xl">
                <div className="border-t border-[#1a1a18]/20 pt-5 mb-8">
                  <SectionTitle>שאלות נפוצות</SectionTitle>
                </div>
                <Accordion type="multiple">
                  {faqItems.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`faq-${idx}`}
                      className="border-b border-[#1a1a18]/10 rounded-none px-0"
                    >
                      <AccordionTrigger className="text-start text-[15px] font-medium text-[#1a1a18] hover:no-underline py-5">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#1a1a18]/50 leading-[1.85] pb-6 text-[14px]">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}

        {/* ══════ COMPANIES ══════ */}
        <CompanyLogos variant="grid" />

        {/* ══════ CTA + FORM ══════ */}
        <section id={enrollmentFormId} className="scroll-mt-24" style={{ backgroundColor: PINE }}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="border-t border-white/20 pt-5 mb-10 text-center sm:text-right">
              <h2
                className="text-[#f6f5f1] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}
              >
                רוצים הצעה מותאמת?
              </h2>
              <p className="text-[#f6f5f1]/45 text-[15px] leading-relaxed max-w-xl">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות. בלי לחץ, בלי מרדף.
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
