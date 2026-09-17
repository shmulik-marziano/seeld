import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { HeroComposition } from "@/components/brand/HeroComposition";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { PortfolioReviewForm } from "@/components/PortfolioReviewForm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN, TINT_SAGE } from "@/lib/brand";

/**
 * בדיקת תיק 360 — the service page from the design mock: the opening with the
 * circles art and one action, "מה כוללת הבדיקה?" as three list cards,
 * "מה מכינים לפגישה?" as a tinted checklist, the lead form, three questions
 * and the green closing band. The central path of the site has a home now.
 */

const INCLUDED: { title: string; body: string; icon: BrandIconName; tint: string }[] = [
  { title: "מיפוי המוצרים הקיימים", body: "סוקרים את כל הביטוחים והחסכונות שברשותכם, ממקורות רשמיים: המסלקה הפנסיונית והר הביטוח.", icon: "document", tint: PASTEL_SAGE },
  { title: "בחינת הצרכים שלכם", body: "מנתחים את המצב הנוכחי מול הגיל, המשפחה וההכנסה, ומזהים פערים, כפילויות ודמי ניהול גבוהים.", icon: "chart", tint: PASTEL_SAND },
  { title: "מסמך החלטות והמשך טיפול", body: "מגבשים המלצות ברורות ומנומקות, ומייצרים תוכנית המשך שאפשר לעקוב אחריה באזור האישי.", icon: "message", tint: PASTEL_MINT },
];

const PREPARE = [
  { title: "מסמכים קיימים", body: "פוליסות, דוחות שנתיים ותלושי שכר אחרונים. אם אין, נשלוף בעצמנו עם ייפוי כוח." },
  { title: "שאלות שחשוב לכם לשאול", body: "נושאים שמטרידים אתכם או החלטות שמתלבטים בהן." },
  { title: "מטרות להמשך", body: "מה חשוב לכם להשיג: הגנה על המשפחה, חיסכון, פרישה." },
];

const FAQ = [
  { q: "כמה זה עולה?", a: "הבדיקה הראשונה ללא עלות וללא התחייבות. אם תחליטו להמשיך איתנו, התשלום לנו מגיע מחברות הביטוח ובתי ההשקעות, לא מכם." },
  { q: "כמה זמן זה לוקח?", a: "שליפת הנתונים אורכת כשבוע. הפגישה עצמה כשעה, במשרד, בזום או בטלפון. תוך ימים ספורים מקבלים את מסמך ההחלטות." },
  { q: "מה קורה אחרי הבדיקה?", a: "אתם מחליטים בקצב שלכם. אם בוחרים לפעול, אנחנו מטפלים בטפסים, בניודים ובחברות, ומעדכנים בכל שלב." },
];

const PortfolioReview = () => (
  <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
    <Header />

    <main>
      {/* OPENING */}
      <section className="dna-page overflow-hidden">
        <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-12 sm:pb-16">
          <nav className="mb-6 sm:mb-10 flex items-center gap-2 text-[14px]" style={{ color: MUTED }} aria-label="ניווט משני">
            <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
            <BrandIcon name="arrow-left" size={14} />
            <span className="font-bold" style={{ color: GREEN }} aria-current="page">בדיקת תיק 360</span>
          </nav>

          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-[1.05fr_1fr]">
            <div>
              <h1 className="dna-display leading-[1.15] max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                בדיקת תיק 360
              </h1>
              <p className="mt-5 text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                תמונה מסודרת של הביטוחים והחסכונות שלכם: מה יש, מה חסר, מה כפול ומה עולה יותר מדי.
                ללא עלות וללא התחייבות.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <a href="#review-form" className="btn-primary sm:min-w-[220px]">
                  להתחיל בבדיקה
                </a>
                <Link to="/#process" className="link-rule text-[16px] self-start sm:self-auto">
                  איך זה עובד
                  <BrandIcon name="arrow-left" size={18} />
                </Link>
              </div>
            </div>
            <HeroComposition cards={false} className="!max-w-[260px] sm:!max-w-[360px] lg:!max-w-[440px]" />
          </div>
        </div>
      </section>

      {/* WHAT IS INCLUDED */}
      <section className="border-t bg-white" style={{ borderColor: LINE }}>
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <h2 className="dna-display leading-tight mb-8 sm:mb-10" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              מה כוללת הבדיקה?
            </h2>
          </ScrollReveal>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {INCLUDED.map((item, i) => (
              <li key={item.title}>
                <ScrollReveal delay={i * 70} className="h-full">
                  <div className="flex h-full items-start gap-4 rounded-2xl border p-5" style={{ borderColor: LINE, backgroundColor: IVORY }}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: item.tint }}>
                      <BrandIcon name={item.icon} size={24} style={{ color: GREEN }} />
                    </span>
                    <div>
                      <h3 className="text-[18px] leading-tight" style={{ color: GREEN }}>{item.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-[1.65]" style={{ color: BODY }}>{item.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHAT TO PREPARE + FORM */}
      <section id="review-form" className="scroll-mt-24 border-t" style={{ borderColor: LINE }}>
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-start">
            <div>
              <ScrollReveal>
                <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
                  נתחיל?
                </h2>
                <p className="mt-4 mb-8 text-[17px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>
                  השאירו שם וטלפון. נחזור אליכם ביום העסקים הבא לתיאום, ומשם ממשיכים יחד.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <PortfolioReviewForm idPrefix="review" source="עמוד בדיקת תיק 360" />
              </ScrollReveal>
            </div>

            <ScrollReveal delay={120}>
              <div className="rounded-2xl p-6 sm:p-7" style={{ background: TINT_SAGE }}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                    <BrandIcon name="folder" size={22} style={{ color: GREEN }} />
                  </span>
                  <h2 className="text-[22px] leading-tight" style={{ color: GREEN }}>מה מכינים לפגישה?</h2>
                </div>
                <ul className="mt-5 space-y-4">
                  {PREPARE.map((p) => (
                    <li key={p.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
                        <BrandIcon name="check" size={14} style={{ color: GREEN }} />
                      </span>
                      <span>
                        <span className="block text-[16px] font-bold" style={{ color: GREEN }}>{p.title}</span>
                        <span className="block text-[14px] leading-[1.6]" style={{ color: MUTED }}>{p.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[14px]" style={{ color: MUTED }}>
                  אין לכם את כל זה? לא נורא. מתחילים ממה שיש, ואת השאר שולפים יחד.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* THREE QUESTIONS */}
      <section className="border-t bg-white" style={{ borderColor: LINE }}>
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <h2 className="dna-display leading-tight mb-8" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
              שלוש שאלות שכולם שואלים
            </h2>
          </ScrollReveal>
          <Accordion type="single" collapsible className="max-w-3xl">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q-${i}`} className="border-b" style={{ borderColor: LINE }}>
                <AccordionTrigger className="py-5 text-right text-[17px] font-bold hover:no-underline" style={{ color: GREEN }}>
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[16px] leading-[1.7]" style={{ color: BODY }}>
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-6">
            <Link to="/faq" className="link-rule text-[15px]">
              לכל השאלות הנפוצות
              <BrandIcon name="arrow-left" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="dna-navy-band">
        <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
          <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(28px, 3.2vw, 32px)" }}>
            תמיד יודעים מה השלב הבא
          </h2>
          <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
            ליווי רציף שמחזיק אתכם בדרך הנכונה. מהבדיקה הראשונה ועד המעקב השנתי.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#review-form" className="btn-on-green sm:min-w-[220px]">להתחיל בבדיקה</a>
            <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default PortfolioReview;
