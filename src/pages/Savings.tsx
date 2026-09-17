import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots } from "@/components/brand/Elements";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN } from "@/lib/brand";
import { FINANCE as savingsCategories } from "@/data/productDirectory";

// Brand hub page (kit p.05): the saving-and-growth art beside the headline and
// the action, then the full index of the 11 savings products. Every product
// keeps its link; the page closes on the central path (360 review / meeting).


const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const Savings = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — the subject art beside the headline */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 320, height: 320, top: -150, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 180, height: 180, bottom: -80, left: "36%", backgroundColor: PASTEL_SAND, opacity: 0.7 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
            <nav className="mb-8 sm:mb-12 flex items-center gap-2 text-[14px]" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">חיסכון ופנסיה</span>
            </nav>

            <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
              <div>
                <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  חיסכון ופנסיה
                </h1>
                <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  <span dir="ltr" className="tabular-nums whitespace-nowrap">11</span> מוצרי חיסכון ופנסיה, מקרן הפנסיה הראשונה ועד תכנון הפרישה.
                  בוחרים נושא, ואנחנו מסדרים את דמי הניהול, המסלולים וההפקדות בתמונה אחת.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                  <a href="#savings-index" className="btn-primary sm:min-w-[220px]">
                    לרשימת מוצרי החיסכון
                  </a>
                  <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">
                    בדיקת תיק 360
                  </Link>
                </div>
                <button type="button" className="mt-6 link-rule text-[15px]" onClick={openChat}>
                  <BrandIcon name="message" size={18} />
                  שאלו את היועץ הדיגיטלי
                </button>
              </div>

              <Illustration name="03-saving-growth" priority sizes="(min-width: 1024px) 560px, 100vw" />
            </div>
          </div>
        </section>

        {/* THE INDEX — hairline link list, every product keeps its link */}
        <section id="savings-index" className="scroll-mt-24 border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="mb-10 sm:mb-12">
                <BrandDots className="mb-4" />
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  כל מוצרי החיסכון והפנסיה
                </h2>
                <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>
                  לכל מוצר עמוד משלו: איך הוא עובד, מתי כדאי לבדוק, שאלות נפוצות וטופס לניתוח.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                {savingsCategories.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-center justify-between gap-6 py-[14px] px-3 -mx-3 rounded-lg border-b hover:bg-[#EEF2EC] transition-colors"
                    style={{ borderColor: LINE }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 min-w-0">
                      <h3 className="text-[16px] font-bold sm:whitespace-nowrap" style={{ color: GREEN }}>{item.title}</h3>
                      <p className="text-[14px] sm:truncate" style={{ color: MUTED }}>{item.description}</p>
                    </div>
                    <BrandIcon
                      name="arrow-left"
                      size={18}
                      className="shrink-0 transition-transform group-hover:-translate-x-1"
                      style={{ color: GREEN }}
                    />
                  </Link>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <p className="text-[16px]" style={{ color: BODY }}>לא יודעים מה מזה יש לכם?</p>
                <button type="button" className="link-rule text-[15px]" onClick={openChat}>
                  <BrandIcon name="message" size={18} />
                  שאלו את היועץ הדיגיטלי
                </button>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CLOSING — deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <BrandDots className="mb-4" />
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              רוצים ניתוח פנסיוני?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם, ונחזור אליכם עם תמונה מסודרת. ללא עלות וללא התחייבות.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                בדיקת תיק 360
              </Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                תיאום פגישה
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Savings;
