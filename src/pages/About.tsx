import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Illustration } from "@/components/brand/Illustration";
import { BrandDots, OliveBranch } from "@/components/brand/Elements";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, SAGE_ON_GREEN } from "@/lib/brand";

// Brand page: ivory canvas, one journey illustration in the opening, deep green band at the end.

const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-10 sm:mb-14">
    <BrandDots className="mb-4" />
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
      {title}
    </h2>
    {lede && (
      <p className="mt-4 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

const values: { title: string; description: string; icon: BrandIconName }[] = [
  { title: "שקיפות", description: "תראו את כל התנאים, העמלות ודמי הניהול לפני שמחליטים. בלי הפתעות, בלי אותיות קטנות.", icon: "search" },
  { title: "מקצועיות", description: "סוכן ביטוח פנסיוני ברישיון, מעודכן ברגולציה ובשינויים בשוק. הידע הזה עובד בשבילכם.", icon: "shield" },
  { title: "אמינות", description: "האינטרס שלכם קודם. אם משהו לא מתאים, נגיד את זה ישירות.", icon: "check" },
  { title: "נגישות", description: "ביטוח ופנסיה לא צריכים להיות מסובכים. מסבירים בשפה ברורה, עונים על כל שאלה.", icon: "message" },
];

const About = () => {
  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — who we are, beside the journey illustration */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 320, height: 320, top: -150, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">מי אנחנו</span>
            </nav>

            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.05fr_1fr] items-center">
              <div>
                <BrandDots className="mb-5" />
                <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  הבית שמאחורי התיק שלכם
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  סוכנות ביטוח, חיסכון ופנסיה מבית עמיתים הון. עצמאית, בפיקוח, ובצד שלכם.
                  ממפים את התיק, מבינים את האפשרויות ומלווים את הביצוע.
                </p>
                <p className="mt-6 text-[15px]" style={{ color: MUTED }}>
                  בפיקוח רשות שוק ההון · ע.מ{" "}
                  <span dir="ltr" className="tabular-nums whitespace-nowrap">305275653</span>
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/contact" className="btn-primary sm:min-w-[200px]">תיאום פגישה</Link>
                  <Link to="/#portfolio-review" className="btn-secondary sm:min-w-[200px]">בדיקת תיק 360</Link>
                </div>
              </div>

              <Illustration
                name="01-journey"
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="shadow-[0_16px_40px_-24px_rgba(0,61,48,0.35)]"
              />
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="הסיפור" />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24 items-start">
                <div className="space-y-5 leading-[1.8] text-[17px]" style={{ color: BODY }}>
                  <p>
                    שילד קמה מתוך אמונה שייעוץ פיננסי טוב צריך להיות נגיש לכולם. לא רק למי שמבין את השפה המקצועית.
                  </p>
                  <p>
                    שמוליק מרציאנו, סוכן ביטוח פנסיוני ברישיון, עובד מול כל חברות הביטוח וקרנות הפנסיה בשוק.
                    כל לקוח מקבל בדיקה מלאה של מה שיש לו, השוואה בין האפשרויות והמלצה כנה. בלי לחץ.
                  </p>
                  <p>
                    המטרה: שתבינו בדיוק מה יש לכם, למה אתם משלמים, ומה כדאי לשנות. בלי מילים מסובכות, בלי אותיות קטנות.
                  </p>
                </div>
                <div className="dna-quote gold">
                  <div className="dna-ql">העיקרון</div>
                  <div className="dna-qt">
                    להעמיד את הלקוח מעל כל שיקול אחר. זו לא אמירה שיווקית, זו התשתית המשפטית והעסקית שלנו.
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FACTS + REGISTRY */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="פרטי הסוכנות" />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-24">
                <ul className="border-t" style={{ borderColor: LINE }}>
                  {[
                    { label: "ע.מ", value: "305275653", ltr: true },
                    { label: "רישיון סוכן ביטוח", value: "ברישיון רשות שוק ההון", ltr: false },
                    { label: "מבית", value: "עמיתים הון", ltr: false },
                    { label: "משרדים", value: "רעננה · ירושלים", ltr: false },
                  ].map((item) => (
                    <li key={item.label} className="flex items-baseline justify-between gap-4 py-[15px] border-b" style={{ borderColor: LINE }}>
                      <span className="text-[14px]" style={{ color: MUTED }}>{item.label}</span>
                      <span className="text-[16px] font-bold tabular-nums whitespace-nowrap" style={{ color: GREEN }} dir={item.ltr ? "ltr" : undefined}>
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-4">
                  {[
                    "עובדים מול חברות הביטוח ובתי ההשקעות בישראל, ללא תלות בחברה אחת.",
                    "השיחה הראשונה ללא עלות וללא התחייבות.",
                    "אזור אישי ללקוח: הפוליסות, החיסכון והמסמכים במקום אחד.",
                  ].map((text) => (
                    <li key={text} className="dna-pill-item text-[16px]">
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead
                title="מה אנחנו עושים"
                lede="ניהול פיננסי נכון מתחיל בהבנה של מה שיש לכם."
              />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <ul className="max-w-3xl">
                {[
                  "בדיקת כל הפוליסות והמוצרים הפנסיוניים שלכם, מול כל החברות בשוק",
                  "השוואת מחירים, כיסויים ודמי ניהול. שתדעו שאתם לא משלמים מיותר",
                  "מעקב שוטף: חידושים, שינויים במשפחה, עדכוני רגולציה. אנחנו בתמונה",
                  "זיהוי כפל ביטוחי, כיסויים חסרים ודמי ניהול גבוהים, וטיפול מיידי",
                ].map((text) => (
                  <li key={text} className="dna-pill-item !py-4 border-b text-[17px] leading-[1.7]" style={{ borderColor: LINE }}>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>

        {/* VALUES */}
        <section className="relative border-t overflow-hidden" style={{ borderColor: LINE }}>
          <OliveBranch className="hidden lg:block absolute -bottom-8 left-8 w-36 opacity-70" />
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="הערכים" />
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {values.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 60}>
                  <div className="dna-concept h-full">
                    <BrandIcon name={item.icon} size={32} className="mb-4" style={{ color: GREEN }} />
                    <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>{item.title}</h3>
                    <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              רוצים לבדוק את המצב שלכם?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              שיחה ראשונה ללא עלות וללא התחייבות. מתחילים בבדיקת תיק 360, וממשיכים יחד.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="link-rule text-[15px] self-center !text-[#FAF7EF] !border-[#FAF7EF]/40 hover:!border-[#FAF7EF]"
              >
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
