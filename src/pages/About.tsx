import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { SERIF, MONO, CHIP_GREEN } from "@/lib/brand";
import { CountUp, StatusPill } from "@/components/brand/Live";
import { DrawSpark } from "@/components/brand/Strokes";

// SEELD Bento: warm paper panels on ink gutters (STYLESEED.md + index.css .bento-panel)
const PAPER_MUTED = "#5c5c5c"; // AA-safe caption grey on the warm paper

const SectionHead = ({ index, title, lede }: { index: string; title: string; lede?: string }) => (
  <div className="border-t border-[#171717]/20 pt-6 mb-10 sm:mb-12">
    <div className="flex items-baseline gap-6 sm:gap-10">
      <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: PAPER_MUTED, fontFamily: MONO }} dir="ltr">
        {index}
      </span>
      <div>
        <h2
          className="text-[#171717] leading-tight"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
        >
          {title}
        </h2>
        {lede && <p className="mt-3 text-base text-[#4d4d4d] leading-[1.85] max-w-xl">{lede}</p>}
      </div>
    </div>
  </div>
);

const About = () => {
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* HERO — bento row: who we are + the counting orange tile */}
      <section className="px-2 pt-2">
        <div className="grid gap-2 lg:grid-cols-[1.6fr_1fr]">
          {/* Main paper tile */}
          <div className="bento-panel p-6 sm:p-10">
            <div className="relative z-10">
              <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
                <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
                  <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                  <span>←</span>
                  <span className="text-[#171717]/70 font-medium">אודות</span>
                </nav>
                <span className="hidden sm:inline text-[11px] tracking-[0.22em] font-medium" style={{ color: PAPER_MUTED }}>
                  הבית
                </span>
              </div>

              <h1
                className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
              >
                הבית שמאחורי התיק שלכם
              </h1>
              <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9]">
                סוכנות ביטוח, חיסכון ופנסיה מבית עמיתים הון. עצמאית, מפוקחת, ובצד שלכם.
              </p>
              <p
                className="mt-8 text-[11px] tracking-[0.16em] font-medium"
                style={{ fontFamily: MONO, color: PAPER_MUTED }}
              >
                בפיקוח רשות שוק ההון · ע.מ <span dir="ltr" className="tabular-nums">305275653</span>
              </p>
            </div>
          </div>

          {/* The counting orange tile — 600+ families */}
          <div className="bento-panel-orange p-6 sm:p-8 flex flex-col justify-between min-h-[200px]">
            <span
              className="text-[10px] tracking-[0.2em] font-semibold text-[#171717]/80"
              style={{ fontFamily: MONO }}
              dir="ltr"
            >
              SEELD · FAMILIES
            </span>
            <div>
              <div
                className="text-[#171717] tabular-nums"
                dir="ltr"
                style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(3rem, 6vw, 4.6rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
              >
                <CountUp to={600} format={(v) => `${v}+`} />
              </div>
              <div className="mt-2 text-[13px] font-medium text-[#171717]">
                משפחות מלוות, ומספר אחד שממשיך לעלות
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* 01 — STORY */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="01" title="הסיפור" />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <div className="max-w-3xl space-y-5 text-[#4d4d4d] leading-[1.9] text-base sm:text-[17px]">
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
            </ScrollReveal>
          </div></div>
        </section>

        {/* 02 — NUMBERS + REGISTRY */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <div className="flex items-end justify-between gap-6 mb-2">
                <span className="text-[11px] tracking-[0.14em]" style={{ fontFamily: MONO, color: PAPER_MUTED }}>
                  SEELD · IN NUMBERS
                </span>
                <DrawSpark color={CHIP_GREEN} className="w-40 sm:w-64" height={44} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 border-t border-b border-[#171717]/15 py-10 sm:py-14">
                {[
                  { to: 12, format: (v: number) => `${v}+`, label: "חברות ביטוח ובתי השקעות" },
                  { to: 100, format: (v: number) => `${v}%`, label: "שקיפות מול הלקוח" },
                  { to: 24, format: (v: number) => `${v}/7`, label: "פורטל אישי זמין" },
                  { to: 0, format: (v: number) => `${v} ₪`, label: "עלות ייעוץ ראשוני" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center px-3">
                    <p
                      className="text-[#171717] tabular-nums mb-2"
                      dir="ltr"
                      style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", letterSpacing: "-0.02em" }}
                    >
                      <CountUp to={stat.to} format={stat.format} />
                    </p>
                    <p className="text-[12px] tracking-[0.12em]" style={{ color: PAPER_MUTED }}>{stat.label}</p>
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
                  <div key={item.label} className="flex items-baseline justify-between py-[15px] border-b border-[#171717]/10">
                    <span className="text-[13px] text-[#5c5c5c]">{item.label}</span>
                    <span className="text-base text-[#171717] tabular-nums" dir={item.ltr ? "ltr" : undefined}>{item.value}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div></div>
        </section>

        {/* 03 — WHAT WE DO */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead
                index="02"
                title="מה אנחנו עושים"
                lede="ניהול פיננסי נכון מתחיל בהבנה של מה שיש לכם."
              />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <ul className="max-w-3xl border-t border-[#171717]/15">
                {[
                  "בדיקת כל הפוליסות והמוצרים הפנסיוניים שלכם, מול כל החברות בשוק",
                  "השוואת מחירים, כיסויים ודמי ניהול. שתדעו שאתם לא משלמים מיותר",
                  "מעקב שוטף: חידושים, שינויים במשפחה, עדכוני רגולציה. אנחנו בתמונה",
                  "זיהוי כפל ביטוחי, כיסויים חסרים ודמי ניהול גבוהים, וטיפול מיידי",
                ].map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-baseline gap-5 py-4 border-b border-[#171717]/10 text-[#4d4d4d] text-base leading-[1.85]"
                  >
                    <span className="text-[11px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: PAPER_MUTED, fontFamily: MONO }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div></div>
        </section>

        {/* 04 — VALUES */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <ScrollReveal>
              <SectionHead index="03" title="הערכים" />
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
              {[
                { title: "שקיפות", description: "תראו את כל התנאים, העמלות ודמי הניהול לפני שמחליטים. בלי הפתעות, בלי אותיות קטנות." },
                { title: "מקצועיות", description: "סוכן ביטוח פנסיוני מורשה, מעודכן ברגולציה ובשינויים בשוק. הידע הזה עובד בשבילכם." },
                { title: "אמינות", description: "האינטרס שלכם קודם. אם משהו לא מתאים, נגיד את זה ישירות." },
                { title: "נגישות", description: "ביטוח ופנסיה לא צריכים להיות מסובכים. מסבירים בשפה ברורה, עונים על כל שאלה." },
              ].map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 60}>
                  <div className="border-t border-[#171717]/10 pt-5 h-full">
                    <h3 className="text-lg text-[#171717] mb-2.5" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      {item.title}
                    </h3>
                    <p className="text-[14px] text-[#4d4d4d] leading-[1.8]">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div></div>
        </section>

        {/* CTA — the one next action (ink tile) */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-6">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
              >
                רוצים לבדוק את המצב שלכם?
              </h2>
              <p className="text-[#fafafa]/55 text-base leading-[1.85] mb-8 max-w-xl">
                שיחה ראשונה על חשבוננו. בלי עלות, בלי התחייבות, בלי מרדף.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
                >
                  צרו קשר
                </Link>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                  className="bento-hover rounded-full"
                  aria-label="פתיחת שיחה עם יועץ SEELD"
                >
                  <StatusPill>היועץ מחובר עכשיו · שאלו לפני שמתקשרים</StatusPill>
                </button>
              </div>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
