import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { articles, type Article } from "@/data/articles";
import { Link } from "react-router-dom";
import { OliveBranch } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN } from "@/lib/brand";

// Vehicle and home cover stay illustration-free (kit p.11): one vector element
// in the hero margin, then the two product doors, the guides and the central path.

// Article card: white tile, whole-tile link. Text first, no stock photo.
const ArticleTile = ({ article }: { article: Article }) => (
  <Link
    to={`/article/${article.id}`}
    className="group dna-concept dna-hover flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
  >
    <span className="text-[14px] font-bold" style={{ color: MUTED }}>{article.category}</span>
    <h3 className="mt-2 text-[18px] leading-snug" style={{ color: GREEN }}>{article.title}</h3>
    <p className="mt-2.5 text-[15px] leading-[1.7] line-clamp-3" style={{ color: BODY }}>{article.subtitle}</p>
    <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="text-[14px] tabular-nums" style={{ color: MUTED }}>
        {article.date} · {article.readTime}
      </span>
      <span className="link-rule text-[15px]">
        קראו עוד
        <BrandIcon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
      </span>
    </div>
  </Link>
);

const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-10 sm:mb-12">
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
      {title}
    </h2>
    {lede && <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>{lede}</p>}
  </div>
);

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const Travel = () => {
  const carHomeInsuranceArticles = articles.filter(article =>
    article.category.includes("ביטוח רכב") ||
    article.category.includes("ביטוח דירה")
  );

  const features: { title: string; description: string; href?: string }[] = [
    { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳, בהשוואה בין כל החברות", href: "/insurance/vehicle" },
    { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", href: "/insurance/home" },
    { title: "בלי פגישה", description: "משאירים פרטים בטופס, ואנחנו חוזרים אליכם עם הצעות להשוואה" },
    { title: "השוואת מחירים", description: "השוואה בין כל חברות הביטוח בשוק, עם המלצה מנומקת" },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      {/* HERO — ivory canvas, one vector element in the margin */}
      <section className="dna-page overflow-hidden">
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 180, height: 180, bottom: -100, left: "22%", backgroundColor: PASTEL_SAND, opacity: 0.7 }}
          />
        </div>
        <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
          <nav aria-label="ניווט משני" className="mb-8 sm:mb-12 flex items-center gap-2 text-[14px]" style={{ color: MUTED }}>
            <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
            <BrandIcon name="arrow-left" size={14} />
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">ביטוח בקליק</span>
          </nav>
          <div className="relative">
            <OliveBranch className="hidden lg:block absolute -top-6 left-0 w-40 opacity-80" />
            <div className="max-w-3xl">
              <h1 className="dna-display leading-[1.15]" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                ביטוח בקליק
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] leading-[1.7] max-w-2xl" style={{ color: MUTED }}>
                ביטוח רכב וביטוח דירה: הצעות מחיר בהשוואה בין כל החברות, בלי פגישה.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <Link to="/insurance/vehicle" className="btn-primary sm:min-w-[220px]">
                  להצעה לביטוח רכב
                </Link>
                <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                  בדיקת תיק 360
                </Link>
              </div>
              <button type="button" className="mt-6 link-rule text-[15px]" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* Why us */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="למה לבחור בשילד?" />
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {features.map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 60}>
                  <div className="h-full border-t pt-5" style={{ borderColor: LINE }}>
                    <h3 className="text-[19px] mb-2" style={{ color: GREEN }}>{feature.title}</h3>
                    <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>{feature.description}</p>
                    {feature.href && (
                      <Link to={feature.href} className="link-rule mt-4 text-[15px]">
                        לפרטי הביטוח
                        <BrandIcon name="arrow-left" size={18} />
                      </Link>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead
                title="מאמרים ומדריכים"
                lede="כל מה שצריך לדעת על ביטוח רכב וביטוח דירה"
              />
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {carHomeInsuranceArticles.map((article) => (
                <ArticleTile key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>

        {/* About the process */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="איך זה עובד" />
            </ScrollReveal>
            <div className="max-w-3xl space-y-5 text-[17px] leading-[1.8]" style={{ color: BODY }}>
              <p>
                ביטוח רכב ודירה לא מחייב פגישה. משאירים פרטים בטופס של הביטוח המתאים,
                ואנחנו חוזרים אליכם עם הצעות מחיר להשוואה.
              </p>
              <p>
                ההשוואה מול כל חברות הביטוח בשוק, ללא עלות וללא התחייבות.
                נחזור אליכם עם המלצה מנומקת, לא עם רשימת מחירים.
              </p>
            </div>
          </div>
        </section>

        {/* CLOSING — deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                מוכנים להתחיל?
              </h2>
              <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
                הצעת מחיר ללא עלות וללא התחייבות, בהשוואה בין כל החברות. אפשר גם לבדוק את כל התיק בבת אחת.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                  בדיקת תיק 360
                </Link>
                <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                  תיאום פגישה
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Travel;
