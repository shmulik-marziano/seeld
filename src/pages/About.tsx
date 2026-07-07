import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import {
  BODY, DISPLAY, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH, TURQ,
} from "@/lib/brand";
import { CountUp, StatusPill } from "@/components/brand/Live";
import { DrawSpark } from "@/components/brand/Strokes";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// The heading starts its block — no eyebrow, no ornamental index (STYLESEED bans).
const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-12 sm:mb-16">
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)" }}>
      {title}
    </h2>
    {lede && (
      <p className="mt-4 text-base leading-[1.85] max-w-xl" style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* HERO — who we are + the counting families card */}
        <section className="dna-page">
          {/* Pastel circle backdrop — decorative, never behind small text */}
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 280, height: 280, top: -120, left: -90, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 220, height: 220, bottom: -110, right: -80, backgroundColor: PASTEL_PEACH, opacity: 0.5 }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20">
            <nav className="flex items-center gap-2 text-[13px] mb-10 sm:mb-14" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium" style={{ color: NAVY }}>אודות</span>
            </nav>

            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.6fr_1fr] items-start">
              <div>
                <h1
                  className="dna-display leading-[1.12] mb-6 max-w-3xl"
                  style={{ fontSize: "clamp(34px, 5vw, 50px)" }}
                >
                  הבית שמאחורי התיק שלכם
                </h1>
                <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
                  סוכנות ביטוח, חיסכון ופנסיה מבית עמיתים הון. עצמאית, מפוקחת, ובצד שלכם.
                </p>
                <p
                  className="mt-8 text-[12px] tracking-[0.16em] font-medium"
                  style={{ fontFamily: MONO, color: MUTED }}
                >
                  בפיקוח רשות שוק ההון · ע.מ <span dir="ltr" className="tabular-nums whitespace-nowrap">305275653</span>
                </p>
              </div>

              {/* The counting card — 600+ families (the page's live gesture) */}
              <div className="dna-concept !p-6 sm:!p-8 flex flex-col justify-between min-h-[200px]">
                <span
                  className="text-[11px] tracking-[0.2em] font-semibold"
                  style={{ fontFamily: MONO, color: MUTED }}
                  dir="ltr"
                >
                  SEELD · FAMILIES
                </span>
                <div>
                  <div
                    className="tabular-nums mt-6"
                    dir="ltr"
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 900,
                      color: TURQ,
                      fontSize: "clamp(3rem, 6vw, 4.6rem)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    <CountUp to={600} format={(v) => `${v}+`} />
                  </div>
                  <div className="mt-3 text-[13.5px] font-medium" style={{ color: BODY }}>
                    משפחות מלוות, ומספר אחד שממשיך לעלות
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="הסיפור" />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-24 items-start">
                <div className="space-y-5 leading-[1.9] text-base sm:text-[17px]" style={{ color: BODY }}>
                  <p>
                    SEELD קמה מתוך אמונה שייעוץ פיננסי טוב צריך להיות נגיש לכולם. לא רק למי שמבין את השפה המקצועית.
                  </p>
                  <p>
                    שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, עובד מול כל חברות הביטוח וקרנות הפנסיה בשוק.
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

        {/* NUMBERS + REGISTRY */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <ScrollReveal>
              <div className="flex items-end justify-between gap-6 mb-2">
                <span className="text-[11px] tracking-[0.14em]" style={{ fontFamily: MONO, color: MUTED }}>
                  SEELD · IN NUMBERS
                </span>
                <DrawSpark color={TURQ} className="w-40 sm:w-64" height={44} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 border-t border-b py-10 sm:py-14" style={{ borderColor: LINE }}>
                {[
                  { to: 12, format: (v: number) => `${v}+`, label: "חברות ביטוח ובתי השקעות" },
                  { to: 100, format: (v: number) => `${v}%`, label: "שקיפות מול הלקוח" },
                  { to: 24, format: (v: number) => `${v}/7`, label: "פורטל אישי זמין" },
                  { to: 0, format: (v: number) => `${v} ₪`, label: "עלות ייעוץ ראשוני" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-3">
                    <p
                      className="tabular-nums mb-2"
                      dir="ltr"
                      style={{
                        fontFamily: DISPLAY,
                        fontWeight: 900,
                        color: TURQ,
                        fontSize: "clamp(2.5rem, 4.5vw, 3.4rem)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                      }}
                    >
                      <CountUp to={stat.to} format={stat.format} />
                    </p>
                    <p className="text-[13px] tracking-[0.1em]" style={{ color: MUTED }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <div className="mt-2 max-w-3xl">
                {[
                  { label: "ע.מ", value: "305275653", ltr: true },
                  { label: "רישיון סוכן ביטוח", value: "מורשה רשות שוק ההון 2026", ltr: false },
                  { label: "מבית", value: "עמיתים הון", ltr: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between py-[15px] border-b" style={{ borderColor: LINE }}>
                    <span className="text-[13px]" style={{ color: MUTED }}>{item.label}</span>
                    <span className="text-base tabular-nums whitespace-nowrap" style={{ color: NAVY }} dir={item.ltr ? "ltr" : undefined}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
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
                  <li key={text} className="dna-pill-item !py-4 border-b text-base leading-[1.85]" style={{ borderColor: LINE }}>
                    {text}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </section>

        {/* VALUES */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <ScrollReveal>
              <SectionHead title="הערכים" />
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
              {[
                { title: "שקיפות", description: "תראו את כל התנאים, העמלות ודמי הניהול לפני שמחליטים. בלי הפתעות, בלי אותיות קטנות." },
                { title: "מקצועיות", description: "סוכן ביטוח פנסיוני מורשה, מעודכן ברגולציה ובשינויים בשוק. הידע הזה עובד בשבילכם." },
                { title: "אמינות", description: "האינטרס שלכם קודם. אם משהו לא מתאים, נגיד את זה ישירות." },
                { title: "נגישות", description: "ביטוח ופנסיה לא צריכים להיות מסובכים. מסבירים בשפה ברורה, עונים על כל שאלה." },
              ].map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 60}>
                  <div className="h-full">
                    <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                    <h3
                      className="text-[19px] mb-3"
                      style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.8]" style={{ color: BODY }}>{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — institutional navy band */}
        <section style={{ backgroundColor: NAVY }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <h2
              className="text-white leading-tight mb-3"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)",
                letterSpacing: "-0.5px",
              }}
            >
              רוצים לבדוק את המצב שלכם?
            </h2>
            <p className="text-base leading-[1.85] mb-9 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
              שיחה ראשונה על חשבוננו. בלי עלות, בלי התחייבות, בלי מרדף.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
              >
                צרו קשר
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="dna-hover rounded-full"
                aria-label="פתיחת שיחה עם יועץ SEELD"
              >
                <StatusPill>היועץ מחובר עכשיו · שאלו לפני שמתקשרים</StatusPill>
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
