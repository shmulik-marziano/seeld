import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  Clock,
  Monitor,
  Wallet,
  DoorOpen,
  Search,
  Zap,
  Shield,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { CountUp, LiveDot } from "@/components/brand/Live";
import { MONO, CARD_SHADOW, RING } from "@/lib/brand";

/* ─── Helpers ───────────────────────────────────────────────────── */

// Snap motion (STYLESEED): 0.15–0.25s, ease-out, single entrances only.
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

// Shared SEELD Mono CTA styles — ink rectangles, never pills
const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[48px]";
const ctaGhost =
  "inline-flex items-center justify-center rounded-md px-9 py-4 bg-white text-[#171717] text-base font-medium hover:bg-[#fafafa] transition-colors min-h-[48px]";

// Captions on the warm paper tiles stay at #5c5c5c minimum (AA on paper).
const PAPER_MUTED = "#5c5c5c";

// Mono eyebrow (section kicker) — sits on paper, so PAPER_MUTED
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block text-[11px] tracking-[0.18em] mb-4"
    style={{ fontFamily: MONO, color: PAPER_MUTED }}
  >
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════════════════
   AGENT LANDING PAGE — SEELD Bento: paper tiles on the ink canvas
   ═══════════════════════════════════════════════════════════════════ */

export default function AgentLandingPage() {
  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
      <Header />

      {/* ══════════════════════════════════
          SECTION 1 — HERO
          Paper tile with the greyscale circles composition,
          plus the orange tile carrying the mono "5 דקות" stat.
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2">
          {/* Paper tile */}
          <div className="bento-panel">
            {/* Animated dashed path — identical to HeroSection */}
            <svg className="hidden lg:block absolute top-[5%] left-[0%] w-[500px] h-[600px]" viewBox="0 0 500 600" fill="none" aria-hidden="true">
              <motion.path
                d="M450,50 C380,50 300,130 320,230 C340,330 220,380 160,450 C130,490 140,540 200,560"
                stroke="#171717" strokeWidth="2.5" strokeDasharray="10 8" strokeLinecap="round" fill="none" opacity="0.18"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
              />
              <motion.polygon points="195,552 205,568 215,554" fill="#171717" opacity="0.18"
                initial={{ opacity: 0 }} animate={{ opacity: 0.18 }}
                transition={{ delay: 1.4, duration: 0.2 }}
              />
            </svg>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                {/* Right — Content */}
                <div className="space-y-8 lg:space-y-10">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                    <span
                      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white text-[13px] font-medium text-[#171717]"
                      style={{ boxShadow: RING }}
                    >
                      <LiveDot size={6} />
                      SEELD · פורטל סוכני הביטוח
                      <span className="text-[11px] tracking-[0.12em] font-medium text-[#b45309]" style={{ fontFamily: MONO }}>BETA</span>
                    </span>
                  </motion.div>

                  <motion.h1
                    className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.6rem] font-semibold leading-[1.05] tracking-tight"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
                  >
                    <span className="text-[#171717]">הזמן שלך</span>
                    <br />
                    <span className="relative inline-block">
                      <span className="text-[#171717]">שווה יותר מניירת</span>
                      <motion.span
                        className="absolute -bottom-2 left-0 right-0 h-[3px] bg-[#171717]"
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        transition={{ delay: 0.45, duration: 0.25, ease: "easeOut" }} style={{ transformOrigin: "right" }}
                      />
                    </span>
                  </motion.h1>

                  <motion.p
                    className="text-base sm:text-lg md:text-xl text-[#4d4d4d] leading-[1.8] max-w-lg"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15, ease: "easeOut" }}
                  >
                    SEELD היא פלטפורמת הניהול המלאה לסוכן הביטוח.
                    <br />
                    מקום אחד. כל הכלים. אפס ניירת מיותרת.
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row items-start gap-4"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.25, ease: "easeOut" }}
                  >
                    <Link to="/app/auth" className={ctaPrimary}>
                      התחל בחינם
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <Link to="/app/auth" className={ctaGhost} style={{ boxShadow: RING }}>
                      כניסה למערכת
                    </Link>
                  </motion.div>

                  {/* Mobile accent dots */}
                  <motion.div className="flex sm:hidden items-center gap-3 pt-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.2 }}>
                    <span className="w-5 h-5 rounded-full bg-[#171717]" />
                    <span className="w-4 h-4 rounded-full bg-[#a3a3a3]" />
                    <span className="w-6 h-6 rounded-full bg-[#4d4d4d]" />
                    <span className="w-4 h-4 rounded-full bg-[#d4d4d4]" />
                  </motion.div>
                </div>

                {/* Left — Circles composition (the page's greyscale signature) */}
                <motion.div className="hidden sm:flex relative items-center justify-center lg:justify-start"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.2, ease: "easeOut" }}>
                  <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[440px] lg:h-[440px]">
                    <motion.div className="absolute top-[30%] right-[5%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-[#171717] flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.2, ease: "easeOut" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10 sm:w-14 sm:h-14">
                        <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                    <motion.div className="absolute top-[28%] right-[32%] w-[75px] h-[75px] sm:w-[95px] sm:h-[95px] rounded-full bg-[#d4d4d4]"
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.38, duration: 0.2, ease: "easeOut" }} />
                    <motion.div className="absolute top-[15%] right-[52%] w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-full bg-[#4d4d4d] flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.46, duration: 0.2, ease: "easeOut" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 sm:w-11 sm:h-11">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                    <motion.div className="absolute top-[22%] right-[75%] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full bg-[#6e6e6e] flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.54, duration: 0.2, ease: "easeOut" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7 sm:w-9 sm:h-9">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                    <motion.div className="absolute top-[55%] right-[15%] w-[200px] sm:w-[280px] h-[60px] sm:h-[75px] rounded-full bg-white flex items-center px-4"
                      style={{ boxShadow: RING }}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.62, duration: 0.25, ease: "easeOut" }}>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#171717]" />
                      <div className="flex-1 mx-3 h-[2px] bg-[#171717]/10 rounded-full" />
                    </motion.div>
                    <span className="absolute top-[10%] right-[40%] w-4 h-4 rounded-full bg-[#d4d4d4]" />
                    <span className="absolute top-[75%] right-[60%] w-3 h-3 rounded-full bg-[#171717]/30" />
                    <span className="absolute top-[80%] right-[20%] w-3 h-3 rounded-full bg-[#171717]/50" />
                    <svg className="absolute top-[20%] right-[70%] w-[120px] h-[100px]" viewBox="0 0 120 100" fill="none">
                      <path d="M100,20 C70,10 40,50 20,80" stroke="#171717" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" opacity="0.2"/>
                      <polygon points="16,76 22,84 26,74" fill="#171717" opacity="0.2"/>
                    </svg>
                  </div>
                </motion.div>
              </div>

              {/* Trust bar */}
              <motion.div className="mt-14 sm:mt-20 pt-8 border-t border-[#171717]/10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.25 }}>
                <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
                  {[
                    { text: "הקמה תוך דקות, ללא התקנה", dot: "#171717" },
                    { text: "בעברית מלאה, מותאם לשוק הישראלי", dot: "#4d4d4d" },
                    { text: "מאובטח ועומד בדרישות הרגולציה", dot: "#a3a3a3" },
                  ].map((it, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: it.dot }} />
                      <span className="text-sm text-[#5c5c5c] font-medium">{it.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Orange tile — the mono "5 דקות" stat */}
          <div className="bento-panel-orange">
            <motion.div
              className="relative z-10 h-full flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-end gap-4 px-6 py-6 sm:px-8 sm:py-8 lg:p-8"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.3, ease: "easeOut" }}
            >
              <span
                className="text-[11px] tracking-[0.2em] font-medium text-[#171717]/70 lg:absolute lg:top-8 lg:right-8"
                style={{ fontFamily: MONO }}
                dir="ltr"
              >
                ONBOARDING
              </span>
              <div className="text-left lg:text-right">
                <div
                  className="text-[#171717] tabular-nums leading-none"
                  dir="ltr"
                  style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(3rem, 6vw, 4.5rem)", letterSpacing: "-0.03em" }}
                >
                  5 דקות
                </div>
                <p className="mt-3 text-[13px] font-medium text-[#171717]/80 leading-snug max-w-[180px]">
                  קליטת לקוח חדש, מקצה לקצה. מה שלקח 45 דקות.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — הכאב
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <Eyebrow>מוכר לך?</Eyebrow>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#171717] mb-3">
              אתה עובד כפול, <span className="text-[#171717]">וזה לא הולך לשום מקום</span>
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: Clock, color: "#171717",
                title: "רוב היום שלך לא הולך על לקוחות",
                desc: "אתה סוכן ביטוח, לא פקיד. אבל רוב השעות הולכות על מילוי טפסים, רדיפה אחרי חתימות, העתקה בין מערכות, ובדיקת דברים שמישהו שכח. הזמן הזה שייך ללקוחות שלך, לא לניירת.",
              },
              {
                Icon: Monitor, color: "#171717",
                title: "המידע שלך מפוזר בחמש מערכות",
                desc: "מסלקה במקום אחד. הר הביטוח במקום שני. שורנס, רואטו, אקסל, מיילים, וואטסאפ. כל פעם שאתה צריך תמונה מלאה על לקוח, אתה מרכיב פאזל. וכשחתיכה חסרה, חוזר ליקוי.",
              },
              {
                Icon: Wallet, color: "#4d4d4d",
                title: "אתה מפסיד כסף בלי לדעת",
                desc: "בלי מעקב שיטתי, עמלות נשמטות. מינויים לא עוברים. הפקדות לא מגיעות. אתה לא תמיד יודע מה מגיע לך, וגם אם אתה יודע, אין לך זמן לרדוף.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-lg p-6 sm:p-8 transition-transform duration-200 hover:-translate-y-[1px]"
                style={{ boxShadow: CARD_SHADOW }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#171717] mb-3">{title}</h3>
                <p className="text-[#5c5c5c] text-sm leading-[1.8]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — המהפך
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#171717] mb-10 sm:mb-14 border-t border-[#171717]/15 pt-8">
              מה אם היה <span className="text-[#171717]">מקום אחד שמכסה הכל?</span>
            </h2>
            <div className="bg-white rounded-lg p-8 sm:p-12 text-right" style={{ boxShadow: CARD_SHADOW }}>
              <p className="text-base sm:text-xl text-[#4d4d4d] leading-[1.8]">
                נכנסים בבוקר. פותחים מסך אחד.
                <br />
                הכל שם: המשימות של היום, הלקוחות שצריכים תשומת לב,
                המסמכים שממתינים, העמלות שנכנסו.
                <br /><br />
                בלי לקפוץ בין מערכות. בלי לשכוח. בלי להקליד פעמיים.
                <br />
                <span className="text-[#171717] font-semibold">זה לא חלום. זה SEELD.</span>
              </p>
            </div>
            <div className="mt-10">
              <Link to="/app/auth" className={ctaPrimary}>
                התחל בחינם
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 4 — מה זה SEELD
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <Eyebrow>הפלטפורמה</Eyebrow>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#171717] mb-3">
              מערכת ההפעלה <span className="text-[#171717]">של סוכן הביטוח</span>
            </h2>
            <p className="text-[#4d4d4d] text-base sm:text-lg leading-[1.8] max-w-2xl mx-auto">
              SEELD מלווה אותך בכל רגע: מהרגע שליד חדש נכנס, דרך ניתוח התיק והמלצה מקצועית, ביצוע מול חברות ביטוח, ועד שימור הלקוח לאורך שנים. שרשרת שלמה. מקום אחד.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: DoorOpen, color: "#171717",
                title: "קליטה חכמה",
                desc: "הלקוח מקבל לינק, ממלא הכל מהנייד, חותם דיגיטלית, וכל הנתונים כבר בפנים. מה שלקח 45 דקות, לוקח 5.",
              },
              {
                Icon: Search, color: "#171717",
                title: "ניתוח והמלצה",
                desc: "המערכת סורקת את התיק, מזהה פערים, כפילויות ודמי ניהול גבוהים, ומגישה לך המלצות מקצועיות מוכנות. אתה בוחר מה להציג. היא מכינה הכל.",
              },
              {
                Icon: Zap, color: "#4d4d4d",
                title: "ביצוע בלחיצה",
                desc: "טפסים נמלאים לבד, מסמכים עפים לחברות, חתימות חוזרות חתומות, וליקויים מטופלים ברגע שהם מגיעים. לא עוד \"אני אטפל בזה מחר\".",
              },
              {
                Icon: Shield, color: "#6e6e6e",
                title: "שימור ובקרה",
                desc: "תזכורות חכמות, מעקב אירועי חיים, ניהול תביעות מא' עד ת', ומעקב עמלות שקל-בשקל. הלקוחות שלך מטופלים, גם כשאתה ישן.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-lg p-6 sm:p-8 transition-transform duration-200 hover:-translate-y-[1px]"
                style={{ boxShadow: CARD_SHADOW }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: color }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#171717] mb-3">{title}</h3>
                <p className="text-[#5c5c5c] text-sm leading-[1.8]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 5 — המספרים (ink tile)
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#fafafa] mb-16 text-center border-t border-white/20 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            מספרים, <span className="text-[#fafafa]/60">לא סיסמאות</span>
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
            {[
              { display: "5", suffix: " דקות", label: "קליטת לקוח חדש מקצה לקצה", delay: 0 },
              { display: null, suffix: "%", label: "חיסכון בזמן עבודה ידנית", delay: 0.05, isCount: true },
              { display: "אפס", suffix: "", label: "הקלדה ידנית כפולה", delay: 0.1 },
              { display: "24/7", suffix: "", label: "עובדת גם כשאתה לא", delay: 0.15 },
            ].map((item, i) => (
              <motion.div key={i}
                className="text-center"
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.25, delay: item.delay, ease: "easeOut" }}>
                <div className="text-4xl sm:text-5xl md:text-6xl tabular-nums mb-3 text-[#fafafa]" dir="ltr"
                  style={{ fontFamily: MONO, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {item.isCount ? <CountUp to={89} /> : item.display}{item.suffix}
                </div>
                <p className="text-sm sm:text-base text-[#fafafa]/60 font-medium leading-snug">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 6 — השרשרת
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <Eyebrow>תהליך מלא</Eyebrow>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171717] mb-3">
              מליד חדש ועד שימור, <span className="text-[#171717]">הכל רץ</span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex items-center gap-0 min-w-max justify-center">
                {[
                  { label: "ליד",    color: "#171717" },
                  { label: "קליטה",  color: "#4d4d4d" },
                  { label: "נתונים", color: "#5c5c5c" },
                  { label: "ניתוח",  color: "#171717" },
                  { label: "המלצה",  color: "#4d4d4d" },
                  { label: "הצגה",   color: "#5c5c5c" },
                  { label: "חיתום",  color: "#171717" },
                  { label: "ביצוע",  color: "#4d4d4d" },
                  { label: "מעקב",   color: "#5c5c5c" },
                  { label: "שימור",  color: "#171717" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-xs"
                        style={{ backgroundColor: step.color, boxShadow: RING }}>
                        {step.label.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-[#5c5c5c]">{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center mx-1 mt-[-20px]">
                        <div className="w-5 h-[2px] bg-[#171717]/10" />
                        <ArrowRight className="w-3 h-3 text-[#171717]/20 -mr-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[#5c5c5c] text-sm sm:text-base mt-8 max-w-xl mx-auto leading-[1.8]">
              כל שלב בשרשרת מכוסה. כל תהליך מנוהל. שום דבר לא נופל בין הכיסאות.
            </p>
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 7 — יותר מ-20 כלים
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#171717] mb-3">
              סוויטה שלמה. <span className="text-[#171717]">לא עוד כלי בודד.</span>
            </h2>
            <p className="text-[#4d4d4d] text-base sm:text-lg leading-[1.8] max-w-2xl mx-auto">
              רוב המערכות פותרות בעיה אחת. SEELD פותרת את כולן.
              יותר מ-20 כלים מקצועיים שעובדים יחד כמערכת אחת, מכסים מאות תהליכי עבודה מקצה לקצה.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 border-t border-[#171717]/10 mb-10"
            initial="hidden" whileInView="visible"
            viewport={{ once: true }} variants={stagger}>
            {[
              { text: "ניהול לידים ולקוחות" },
              { text: "סריקת מסמכים אוטומטית" },
              { text: "שליפה ממסלקה והר הביטוח" },
              { text: "ניתוח תיק מקצועי" },
              { text: "בניית המלצות" },
              { text: "הצגה ללקוח עם מעקב החלטות" },
              { text: "חתימות דיגיטליות והרשאות" },
              { text: "ניהול חיתום רפואי" },
              { text: "מילוי טפסים אוטומטי" },
              { text: "שיגור מסמכים לחברות ביטוח" },
              { text: "תיקון ליקויים" },
              { text: "מעקב ביצוע ופולו-אפ" },
              { text: "שימור לקוחות ואירועי חיים" },
              { text: "שירות שוטף ופניות" },
              { text: "ניהול תביעות" },
              { text: "מעקב עמלות" },
              { text: "ניהול מעסיקים" },
              { text: "בקרה רגולטורית" },
              { text: "תקשורת רב-ערוצית" },
              { text: "ניהול משימות ויומן" },
              { text: "מאגר ידע מקצועי" },
            ].map(({ text }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex items-center gap-3 py-[13px] border-b border-[#171717]/10">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#171717" }} />
                <span className="text-sm font-medium text-[#171717]">{text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p className="text-center text-[#5c5c5c] text-sm sm:text-base max-w-xl mx-auto leading-[1.8]"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            כל אחד מהם חזק בפני עצמו. ביחד, הם מערכת שלמה שמנהלת סוכנות ביטוח מא' עד ת'.
          </motion.p>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 8 — איך זה עובד
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171717] mb-3">
              שלושה צעדים. <span className="text-[#171717]">זהו.</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="hidden sm:block absolute top-8 right-[calc(16.67%+24px)] left-[calc(16.67%+24px)] h-[2px] bg-[#171717]/10" />
            <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              {[
                {
                  num: "01", color: "#171717", title: "נרשמים",
                  desc: "פותחים חשבון, מעלים לוגו, ומתחילים. בלי התקנות, בלי הדרכות של שבוע. המערכת מוכנה ברגע שאתה מוכן.",
                },
                {
                  num: "02", color: "#4d4d4d", title: "מחברים",
                  desc: "מייבאים את הלקוחות הקיימים, מחברים את הנתונים, ורואים תמונה מלאה של הסוכנות. הכל במקום אחד, סוף סוף.",
                },
                {
                  num: "03", color: "#6e6e6e", title: "עובדים חכם",
                  desc: "מהיום, המערכת מטפלת בניירת ואתה מטפל בלקוחות. כל יום שעובר אתה חוסך שעות. כל שבוע אתה רואה את ההבדל.",
                },
              ].map(({ num, color, title, desc }, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-lg tabular-nums relative z-10 bg-white"
                    dir="ltr"
                    style={{ boxShadow: RING, color, fontFamily: MONO, fontWeight: 500 }}>
                    {num}
                  </div>
                  <h3 className="text-xl font-semibold text-[#171717] mb-3">{title}</h3>
                  <p className="text-[#5c5c5c] text-sm leading-[1.8]">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 9 — למי זה
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-12 sm:mb-16 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171717] mb-3">
              בנינו את SEELD <span className="text-[#171717]">בשבילך</span>
            </h2>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              {
                title: "סוכן עצמאי",
                desc: "עובד לבד? SEELD הוא הצוות שלך. המערכת לא הולכת הביתה, לא שוכחת דברים, ולא צריכה חופש. היא פשוט עובדת, כדי שאתה תוכל להתמקד במה שאתה הכי טוב בו.",
              },
              {
                title: "מנהל סוכנות",
                desc: "מנהל צוות של 5? של 50? SEELD נותן לך שליטה מלאה. אתה רואה מי עובד על מה, איפה יש עומס, ואיפה הכסף. דוחות, מדדים, ובקרה, בלי לשאול שאלות.",
              },
            ].map(({ title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-lg p-8 sm:p-10 transition-transform duration-200 hover:-translate-y-[1px]"
                style={{ boxShadow: CARD_SHADOW }}>
                <h3 className="text-xl font-semibold text-[#171717] mb-4">{title}</h3>
                <p className="text-[#5c5c5c] text-sm sm:text-base leading-[1.8]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 10 — אבטחה ואמון
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
          <motion.div className="text-center mb-10 sm:mb-14 border-t border-[#171717]/15 pt-8"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#171717] mb-3">
              אבטחת מידע <span className="text-[#171717]">בשלוש שכבות</span>
            </h2>
            <p className="text-sm text-[#5c5c5c] max-w-xl mx-auto">המערכת בנויה על תשתיות מאובטחות. השימוש בפלטפורמה כפוף ל<Link to="/terms" className="underline hover:text-[#171717]">תנאי השימוש</Link> ול<Link to="/privacy" className="underline hover:text-[#171717]">מדיניות הפרטיות</Link> שלנו.</p>
          </motion.div>
          <motion.div className="border-t border-[#171717]/10"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { color: "#171717", title: "הצפנה מלאה",       desc: "הנתונים מוגנים בהצפנה בתעבורה ובאחסון" },
              { color: "#4d4d4d", title: "הפרדה מוחלטת",     desc: "כל סוכנות רואה רק את הנתונים שלה" },
              { color: "#6e6e6e", title: "תיעוד מלא",        desc: "כל פעולה מתועדת לצורכי שקיפות ובקרה" },
            ].map(({ color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 py-5 border-b border-[#171717]/10">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                <div>
                  <span className="font-semibold text-[#171717]">{title}</span>
                  <span className="text-[#5c5c5c]"> · {desc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div></div>
      </section>

      {/* ══════════════════════════════════
          SECTION 12 — CTA סגירה (ink tile)
          ══════════════════════════════════ */}
      <section className="px-2 pt-2">
        <div className="bento-panel-ink"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-white/60">
              מספיק עם <span className="text-white">הניירת.</span>
            </h2>
            <p className="text-white/50 text-sm sm:text-lg mb-8 max-w-xl mx-auto">
              הצטרף לסוכנים שעובדים חכם יותר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10">
              <Link to="/app/auth"
                className="inline-flex items-center justify-center gap-2 rounded-md px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[48px]">
                התחל בחינם
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-md px-9 py-4 text-[#fafafa] text-base font-medium border border-white/25 hover:border-white/60 transition-colors min-h-[48px]">
                יש לך שאלות? דבר איתנו
              </Link>
            </div>
            <p className="text-white/50 text-sm">
              הקמה תוך דקות · ללא התקנה · מאובטח · בעברית
            </p>
          </motion.div>
        </div></div>
      </section>

      {/* Disclaimer — quiet paper tile */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 text-center space-y-2 relative z-10">
          <p className="text-xs text-[#5c5c5c] leading-relaxed">
            <span className="font-medium text-[#b45309] tracking-[0.12em]" style={{ fontFamily: MONO }}>BETA</span> · הפלטפורמה נמצאת בשלבי השקה ראשוניים. חלק מהכלים עדיין בפיתוח ויופעלו בהדרגה. ייתכנו שינויים בפונקציונליות, בממשק ובתנאי השימוש ללא הודעה מוקדמת.
          </p>
          <p className="text-xs text-[#5c5c5c] leading-relaxed">
            SEELD מספקת פלטפורמת ניהול עזר לסוכני ביטוח. האחריות המקצועית, הרגולטורית והמשפטית על כל פעולה, המלצה ועסקה מוטלת על הסוכן בלבד. השימוש בפלטפורמה אינו מהווה ייעוץ משפטי, פיננסי או ביטוחי מטעם SEELD.
          </p>
        </div></div>
      </section>

      <Footer />
    </div>
  );
}
