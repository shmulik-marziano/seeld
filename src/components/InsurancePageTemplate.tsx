import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InsuranceEnrollmentForm from '@/components/InsuranceEnrollmentForm';
import type { InsuranceType } from '@/components/InsuranceEnrollmentForm';
import CompanyLogos from '@/components/CompanyLogos';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import type { LucideIcon } from 'lucide-react';

/* ─── Types ─── */
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

const DEFAULT_COMPANIES = [
  'הראל', 'מנורה מבטחים', 'מגדל', 'כלל', 'איילון', 'הפניקס',
  'מיטב', 'מור', 'ילין לפידות', 'אנליסט', 'אינפיניטי',
  'אלטשולר שחם', 'פאספורטקארד', 'הכשרה',
];

export default function InsurancePageTemplate(props: InsurancePageProps) {
  const {
    heroIcon: HeroIcon,
    heroIconColor,
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
    coverageGridCols,
    articles,
    faqItems,
    companies = DEFAULT_COMPANIES,
    insuranceType,
    enrollmentTitle,
    enrollmentDescription,
    enrollmentFormId = 'contact-form',
    extraContentAfterKeyPoints,
  } = props;

  usePageMeta(breadcrumbLabel, heroDescription);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* ══════ HERO ══════ */}
      <section className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, hsl(168 42% 14%) 0%, hsl(152 42% 18%) 40%, hsl(160 38% 24%) 70%, hsl(145 30% 18%) 100%)',
        }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle, ${heroIconColor} 0%, transparent 70%)` }} />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, hsl(28 45% 60%) 0%, transparent 70%)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          {/* Dashed line */}
          <svg className="absolute bottom-10 left-0 w-full h-16 opacity-[0.06]" viewBox="0 0 800 50" fill="none">
            <path d="M0 35 Q200 5 400 28 T800 15" stroke="hsl(160,50%,65%)" strokeWidth="1.5" strokeDasharray="8 6" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: heroIconColor }}>
              <HeroIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/40">{heroCategory}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 leading-tight text-white">
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl leading-relaxed">
            {heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href={heroCTAHref}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-[#0a3d3d] font-bold text-base hover:bg-white/90 transition-all min-h-[48px] shadow-lg shadow-black/10">
              {heroCTAText}
            </a>
            {heroSecondaryCTA && (
              <a href={heroSecondaryCTA.href}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 hover:border-white/25 transition-all min-h-[48px]">
                {heroSecondaryCTA.text}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ══════ BREADCRUMB ══════ */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-400">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <Link to="/insurances" className="hover:text-[#0a3d3d] transition-colors">ביטוח</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">{breadcrumbLabel}</span>
        </nav>
      </div>

      <main>
        {/* ══════ KEY POINTS ══════ */}
        {keyPoints && keyPoints.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {keyPoints.map((kp, idx) => (
                  <div key={idx}
                    className={`bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group ${
                      keyPoints.length === 3 && idx === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: (kp.color || heroIconColor) + '18' }}>
                      <kp.icon className="w-6 h-6" style={{ color: kp.color || heroIconColor }} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">{kp.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">{kp.description}</p>
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
          <section className={`${keyPoints ? 'pb-12 sm:pb-16' : 'py-12 sm:py-16'}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                {articles.map((article, idx) => (
                  <div key={idx} className={idx > 0 ? 'mt-14' : ''}>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">{article.title}</h2>
                    <div className="space-y-4 text-gray-500 leading-relaxed text-base sm:text-lg">
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
          <section id="coverage" className="py-12 sm:py-16 bg-[#fafbfd]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">{coverageTitle}</h2>
              {coverageSubtitle && <p className="text-gray-400 mb-10 text-base sm:text-lg">{coverageSubtitle}</p>}
              <div className={`grid ${coverageGridCols || 'sm:grid-cols-2 lg:grid-cols-3'} gap-5 mt-8`}>
                {coverageTypes.map((coverage, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: (coverage.color || '#5ec6c6') + '18' }}>
                        <coverage.icon className="w-5 h-5" style={{ color: coverage.color || '#0a3d3d' }} />
                      </div>
                      <h3 className="text-lg font-bold text-[#0a3d3d]">{coverage.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {coverage.items.map((item, itemIdx) => {
                        if (typeof item === 'string') {
                          return (
                            <li key={itemIdx} className="text-gray-500 text-sm flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                              {item}
                            </li>
                          );
                        }
                        return (
                          <li key={itemIdx} className="text-gray-500 text-sm flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                            <div>
                              <span className="font-medium text-[#0a3d3d]">{item.title}</span>
                              {item.description && <span className="text-gray-400"> — {item.description}</span>}
                            </div>
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
          <section id="coverage" className="py-12 sm:py-16 bg-[#fafbfd]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-2">{coverageTitle}</h2>
              {coverageSubtitle && <p className="text-gray-400 mb-10 text-base sm:text-lg">{coverageSubtitle}</p>}
              <div className="space-y-10 mt-8">
                {coverageCategories.map((cat, catIdx) => (
                  <div key={catIdx}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <h3 className="text-xl font-bold text-[#0a3d3d]">{cat.category}</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {cat.items.map((item, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: cat.color + '18' }}>
                              <item.icon className="w-5 h-5" style={{ color: cat.color }} />
                            </div>
                            <h4 className="text-base font-bold text-[#0a3d3d]">{item.title}</h4>
                          </div>
                          <p className="text-gray-500 text-sm">{item.description}</p>
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
          <section className="py-12 sm:py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">שאלות נפוצות</h2>
                <Accordion type="multiple" className="space-y-3">
                  {faqItems.map((item, idx) => (
                    <AccordionItem
                      key={idx}
                      value={`faq-${idx}`}
                      className="bg-white border border-gray-100 rounded-2xl px-4 sm:px-6 overflow-hidden data-[state=open]:shadow-md data-[state=open]:border-gray-200 transition-all"
                    >
                      <AccordionTrigger className="text-right text-base font-semibold text-[#0a3d3d] hover:no-underline py-5">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-500 leading-relaxed pb-5 text-sm sm:text-base">
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
        <section id={enrollmentFormId} className="py-12 sm:py-16 scroll-mt-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl p-6 sm:p-12 text-center mb-10 relative overflow-hidden"
              style={{
                background: 'linear-gradient(165deg, hsl(168 42% 14%) 0%, hsl(152 42% 20%) 50%, hsl(160 38% 26%) 100%)',
              }}
            >
              {/* Ambient glows */}
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-[0.06]"
                style={{ background: `radial-gradient(circle, ${heroIconColor} 0%, transparent 70%)` }} />
              <div className="absolute bottom-[-15%] left-[-5%] w-[200px] h-[200px] rounded-full opacity-[0.04]"
                style={{ background: 'radial-gradient(circle, hsl(28 45% 60%) 0%, transparent 70%)' }} />
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white relative z-10">רוצים הצעת מחיר מותאמת?</h2>
              <p className="text-white/45 text-base sm:text-lg max-w-xl mx-auto relative z-10">
                מלאו את הפרטים ונחזור אליכם עם הצעה מותאמת אישית מחברות הביטוח המובילות
              </p>
            </div>
            <div className="max-w-2xl mx-auto">
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
