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
import {
  BLUE, BODY, DISPLAY, GOLD, GOLD_TEXT, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH, TURQ, TURQ_TEXT,
} from "@/lib/brand";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold (STYLESEED.md)

// Light turquoise for small text on the navy band (6.88:1 on #1D2D3D, measured)
const TURQ_ON_NAVY = "#7fc2b5";

/* ─── Helpers ───────────────────────────────────────────────────── */

// Snap motion (STYLESEED): 0.15–0.25s, ease-out, single entrances only.
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" as const } },
};

// Shared DNA v3 CTA styles — institutional navy, rounded-lg
const ctaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-9 py-4 bg-[#1D2D3D] text-white text-base font-medium tracking-wide hover:bg-[#16222f] transition-colors min-h-[48px]";
const ctaGhost =
  "inline-flex items-center justify-center rounded-lg px-9 py-4 bg-white text-[#1D2D3D] text-base font-medium hover:bg-[#1D2D3D]/5 transition-colors min-h-[48px]";

// Section heading — starts its block, no eyebrow, no numerals (STYLESEED bans)
const SectionHead = ({ title, lede, center = true }: { title: string; lede?: string; center?: boolean }) => (
  <div className={`mb-12 sm:mb-16 ${center ? "text-center" : ""}`}>
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)" }}>
      {title}
    </h2>
    {lede && (
      <p className={`mt-4 text-base sm:text-lg leading-[1.8] max-w-2xl ${center ? "mx-auto" : ""}`} style={{ color: MUTED }}>
        {lede}
      </p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   AGENT LANDING PAGE — SEELD DNA v3: white canvas, pastel circles
   ═══════════════════════════════════════════════════════════════════ */

export default function AgentLandingPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* ══════════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════════ */}
      <section className="dna-page">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ hidden md:block"
            style={{ width: 300, height: 300, top: -120, right: -80, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 230, height: 230, bottom: -120, left: -90, backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
          />
        </div>

        {/* Animated dashed path — the page's drawn gesture (craft bar) */}
        <svg className="hidden lg:block absolute top-[5%] left-[0%] w-[500px] h-[600px]" viewBox="0 0 500 600" fill="none" aria-hidden="true">
          <motion.path
            d="M450,50 C380,50 300,130 320,230 C340,330 220,380 160,450 C130,490 140,540 200,560"
            stroke={NAVY} strokeWidth="2.5" strokeDasharray="10 8" strokeLinecap="round" fill="none" opacity="0.16"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
          />
          <motion.polygon points="195,552 205,568 215,554" fill={NAVY} opacity="0.16"
            initial={{ opacity: 0 }} animate={{ opacity: 0.16 }}
            transition={{ delay: 1.4, duration: 0.2 }}
          />
        </svg>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Right — Content */}
            <div className="space-y-8 lg:space-y-10">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white text-[13px] font-medium text-[#1D2D3D] border border-[#E7EDF1]">
                  <LiveDot size={6} />
                  SEELD · פורטל סוכני הביטוח
                  <span className="text-[11px] tracking-[0.12em] font-medium" style={{ fontFamily: MONO, color: GOLD_TEXT }}>BETA</span>
                </span>
              </motion.div>

              <motion.h1
                className="dna-display leading-[1.08]"
                style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
              >
                הזמן שלך
                <br />
                שווה יותר מניירת
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg md:text-xl leading-[1.8] max-w-lg"
                style={{ color: MUTED }}
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
                <Link to="/app/auth" className={ctaGhost} style={{ boxShadow: `inset 0 0 0 1.5px ${NAVY}` }}>
                  כניסה למערכת
                </Link>
              </motion.div>

              {/* Mobile accent dots */}
              <motion.div className="flex sm:hidden items-center gap-3 pt-2" aria-hidden="true"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.2 }}>
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: NAVY }} />
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: TURQ }} />
                <span className="w-6 h-6 rounded-full" style={{ backgroundColor: PASTEL_BLUE }} />
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: GOLD }} />
              </motion.div>
            </div>

            {/* Left — Circles composition (the page's brand-graphic signature) */}
            <motion.div className="hidden sm:flex relative items-center justify-center lg:justify-start" aria-hidden="true"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.2, ease: "easeOut" }}>
              <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[440px] lg:h-[440px]">
                <motion.div className="absolute top-[30%] right-[5%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: NAVY }}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.2, ease: "easeOut" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10 sm:w-14 sm:h-14">
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[28%] right-[32%] w-[75px] h-[75px] sm:w-[95px] sm:h-[95px] rounded-full"
                  style={{ backgroundColor: PASTEL_MINT }}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.38, duration: 0.2, ease: "easeOut" }} />
                <motion.div className="absolute top-[15%] right-[52%] w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: TURQ }}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.46, duration: 0.2, ease: "easeOut" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 sm:w-11 sm:h-11">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[22%] right-[75%] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: GOLD }}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.54, duration: 0.2, ease: "easeOut" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7 sm:w-9 sm:h-9">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[55%] right-[15%] w-[200px] sm:w-[280px] h-[60px] sm:h-[75px] rounded-full bg-white flex items-center px-4 border border-[#E1EAF1]"
                  style={{ boxShadow: "0 2px 12px rgba(29,45,61,0.05)" }}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.62, duration: 0.25, ease: "easeOut" }}>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" style={{ backgroundColor: NAVY }} />
                  <div className="flex-1 mx-3 h-[2px] rounded-full" style={{ backgroundColor: LINE }} />
                </motion.div>
                <span className="absolute top-[10%] right-[40%] w-4 h-4 rounded-full" style={{ backgroundColor: PASTEL_BLUE }} />
                <span className="absolute top-[75%] right-[60%] w-3 h-3 rounded-full" style={{ backgroundColor: TURQ, opacity: 0.5 }} />
                <span className="absolute top-[80%] right-[20%] w-3 h-3 rounded-full" style={{ backgroundColor: NAVY, opacity: 0.4 }} />
                <svg className="absolute top-[20%] right-[70%] w-[120px] h-[100px]" viewBox="0 0 120 100" fill="none">
                  <path d="M100,20 C70,10 40,50 20,80" stroke={NAVY} strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" opacity="0.2"/>
                  <polygon points="16,76 22,84 26,74" fill={NAVY} opacity="0.2"/>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Trust bar */}
          <motion.div className="mt-14 sm:mt-20 pt-8 border-t" style={{ borderColor: LINE }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.25 }}>
            <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
              {[
                { text: "הקמה תוך דקות, ללא התקנה", dot: TURQ },
                { text: "בעברית מלאה, מותאם לשוק הישראלי", dot: BLUE },
                { text: "מאובטח ועומד בדרישות הרגולציה", dot: GOLD },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: it.dot }} aria-hidden="true" />
                  <span className="text-sm font-medium" style={{ color: BODY }}>{it.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — הכאב
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead title="אתה עובד כפול, וזה לא הולך לשום מקום" />
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: Clock, color: NAVY,
                title: "רוב היום שלך לא הולך על לקוחות",
                desc: "אתה סוכן ביטוח, לא פקיד. אבל רוב השעות הולכות על מילוי טפסים, רדיפה אחרי חתימות, העתקה בין מערכות, ובדיקת דברים שמישהו שכח. הזמן הזה שייך ללקוחות שלך, לא לניירת.",
              },
              {
                Icon: Monitor, color: TURQ,
                title: "המידע שלך מפוזר בחמש מערכות",
                desc: "מסלקה במקום אחד. הר הביטוח במקום שני. שורנס, רואטו, אקסל, מיילים, וואטסאפ. כל פעם שאתה צריך תמונה מלאה על לקוח, אתה מרכיב פאזל. וכשחתיכה חסרה, חוזר ליקוי.",
              },
              {
                Icon: Wallet, color: GOLD,
                title: "אתה מפסיד כסף בלי לדעת",
                desc: "בלי מעקב שיטתי, עמלות נשמטות. מינויים לא עוברים. הפקדות לא מגיעות. אתה לא תמיד יודע מה מגיע לך, וגם אם אתה יודע, אין לך זמן לרדוף.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="dna-concept !p-6 sm:!p-8 h-full">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: color }} aria-hidden="true">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{title}</h3>
                <p className="text-sm leading-[1.8]" style={{ color: BODY }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — המהפך
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead title="מה אם היה מקום אחד שמכסה הכל?" />
            <div className="dna-quote text-right !py-8 !px-8">
              <p className="text-base sm:text-xl leading-[1.8]" style={{ color: BODY }}>
                נכנסים בבוקר. פותחים מסך אחד.
                <br />
                הכל שם: המשימות של היום, הלקוחות שצריכים תשומת לב,
                המסמכים שממתינים, העמלות שנכנסו.
                <br /><br />
                בלי לקפוץ בין מערכות. בלי לשכוח. בלי להקליד פעמיים.
                <br />
                <span className="font-semibold" style={{ color: NAVY }}>זה לא חלום. זה SEELD.</span>
              </p>
            </div>
            <div className="mt-10">
              <Link to="/app/auth" className={ctaPrimary}>
                התחל בחינם
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 4 — מה זה SEELD
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead
              title="מערכת ההפעלה של סוכן הביטוח"
              lede="SEELD מלווה אותך בכל רגע: מהרגע שליד חדש נכנס, דרך ניתוח התיק והמלצה מקצועית, ביצוע מול חברות ביטוח, ועד שימור הלקוח לאורך שנים. שרשרת שלמה. מקום אחד."
            />
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: DoorOpen, color: NAVY,
                title: "קליטה חכמה",
                desc: "הלקוח מקבל לינק, ממלא הכל מהנייד, חותם דיגיטלית, וכל הנתונים כבר בפנים. מה שלקח 45 דקות, לוקח 5.",
              },
              {
                Icon: Search, color: TURQ,
                title: "ניתוח והמלצה",
                desc: "המערכת סורקת את התיק, מזהה פערים, כפילויות ודמי ניהול גבוהים, ומגישה לך המלצות מקצועיות מוכנות. אתה בוחר מה להציג. היא מכינה הכל.",
              },
              {
                Icon: Zap, color: BLUE,
                title: "ביצוע בלחיצה",
                desc: "טפסים נמלאים לבד, מסמכים עפים לחברות, חתימות חוזרות חתומות, וליקויים מטופלים ברגע שהם מגיעים. לא עוד \"אני אטפל בזה מחר\".",
              },
              {
                Icon: Shield, color: GOLD,
                title: "שימור ובקרה",
                desc: "תזכורות חכמות, מעקב אירועי חיים, ניהול תביעות מא' עד ת', ומעקב עמלות שקל-בשקל. הלקוחות שלך מטופלים, גם כשאתה ישן.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="dna-concept !p-6 sm:!p-8 h-full">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: color }} aria-hidden="true">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{title}</h3>
                <p className="text-sm leading-[1.8]" style={{ color: BODY }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 5 — המספרים (navy band)
          ══════════════════════════════════ */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.h2 className="text-white leading-tight mb-16 text-center"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)", letterSpacing: "-0.5px" }}
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            מספרים, לא סיסמאות
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
                <div className="text-4xl sm:text-5xl md:text-6xl tabular-nums mb-3 text-white" dir="ltr"
                  style={{ fontFamily: MONO, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {item.isCount ? <CountUp to={89} /> : item.display}{item.suffix}
                </div>
                <p className="text-sm sm:text-base font-medium leading-snug" style={{ color: "rgba(255,255,255,.65)" }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-2.5" dir="ltr">
            <LiveDot size={6} color={TURQ_ON_NAVY} />
            <span
              className="text-[11px] tracking-[0.18em] font-medium"
              style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: TURQ_ON_NAVY }}
            >
              SEELD · AGENTS · LIVE
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 6 — השרשרת
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead title="מליד חדש ועד שימור, הכל רץ" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex items-center gap-0 min-w-max justify-center">
                {[
                  { label: "ליד" },
                  { label: "קליטה" },
                  { label: "נתונים" },
                  { label: "ניתוח" },
                  { label: "המלצה" },
                  { label: "הצגה" },
                  { label: "חיתום" },
                  { label: "ביצוע" },
                  { label: "מעקב" },
                  { label: "שימור" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-xs"
                        style={{ backgroundColor: NAVY }}>
                        {step.label.charAt(0)}
                      </div>
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center mx-1 mt-[-20px]" aria-hidden="true">
                        <div className="w-5 h-[2px]" style={{ backgroundColor: LINE }} />
                        <ArrowRight className="w-3 h-3 -mr-1" style={{ color: TURQ }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-sm sm:text-base mt-8 max-w-xl mx-auto leading-[1.8]" style={{ color: BODY }}>
              כל שלב בשרשרת מכוסה. כל תהליך מנוהל. שום דבר לא נופל בין הכיסאות.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 7 — יותר מ-20 כלים
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead
              title="סוויטה שלמה. לא עוד כלי בודד."
              lede="רוב המערכות פותרות בעיה אחת. SEELD פותרת את כולן. יותר מ-20 כלים מקצועיים שעובדים יחד כמערכת אחת, מכסים מאות תהליכי עבודה מקצה לקצה."
            />
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 border-t mb-10" style={{ borderColor: LINE }}
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
                className="flex items-center gap-3 py-[13px] border-b" style={{ borderColor: LINE }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: TURQ_TEXT }} aria-hidden="true" />
                <span className="text-sm font-medium" style={{ color: NAVY }}>{text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p className="text-center text-sm sm:text-base max-w-xl mx-auto leading-[1.8]" style={{ color: BODY }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            כל אחד מהם חזק בפני עצמו. ביחד, הם מערכת שלמה שמנהלת סוכנות ביטוח מא' עד ת'.
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 8 — איך זה עובד
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead title="שלושה צעדים. זהו." />
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              {
                title: "נרשמים",
                desc: "פותחים חשבון, מעלים לוגו, ומתחילים. בלי התקנות, בלי הדרכות של שבוע. המערכת מוכנה ברגע שאתה מוכן.",
              },
              {
                title: "מחברים",
                desc: "מייבאים את הלקוחות הקיימים, מחברים את הנתונים, ורואים תמונה מלאה של הסוכנות. הכל במקום אחד, סוף סוף.",
              },
              {
                title: "עובדים חכם",
                desc: "מהיום, המערכת מטפלת בניירת ואתה מטפל בלקוחות. כל יום שעובר אתה חוסך שעות. כל שבוע אתה רואה את ההבדל.",
              },
            ].map(({ title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className="h-[3px] w-9 rounded-full mb-5" style={{ backgroundColor: TURQ }} aria-hidden="true" />
                <h3 className="text-xl mb-3" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{title}</h3>
                <p className="text-sm leading-[1.8]" style={{ color: BODY }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 9 — למי זה
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <SectionHead title="בנינו את SEELD בשבילך" />
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
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
              <motion.div key={i} variants={fadeUp} className="dna-concept !p-8 sm:!p-10 h-full">
                <h3 className="text-xl mb-4" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{title}</h3>
                <p className="text-sm sm:text-base leading-[1.8]" style={{ color: BODY }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 10 — אבטחה ואמון
          ══════════════════════════════════ */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div className="text-center mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="dna-display leading-tight mb-4" style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)" }}>
              אבטחת מידע בשלוש שכבות
            </h2>
            <p className="text-sm max-w-xl mx-auto leading-[1.8]" style={{ color: MUTED }}>
              המערכת בנויה על תשתיות מאובטחות. השימוש בפלטפורמה כפוף
              ל<Link to="/terms" className="underline hover:text-[#1D2D3D]">תנאי השימוש</Link> ול<Link to="/privacy" className="underline hover:text-[#1D2D3D]">מדיניות הפרטיות</Link> שלנו.
            </p>
          </motion.div>
          <motion.div className="border-t" style={{ borderColor: LINE }}
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { title: "הצפנה מלאה",   desc: "הנתונים מוגנים בהצפנה בתעבורה ובאחסון" },
              { title: "הפרדה מוחלטת", desc: "כל סוכנות רואה רק את הנתונים שלה" },
              { title: "תיעוד מלא",    desc: "כל פעולה מתועדת לצורכי שקיפות ובקרה" },
            ].map(({ title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 py-5 border-b" style={{ borderColor: LINE }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: TURQ_TEXT }} aria-hidden="true" />
                <div>
                  <span className="font-semibold" style={{ color: NAVY }}>{title}</span>
                  <span style={{ color: BODY }}> · {desc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 11 — CTA סגירה (navy band)
          ══════════════════════════════════ */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}>
            <h2 className="text-white leading-tight mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.9rem, 3.6vw, 2.75rem)", letterSpacing: "-0.5px" }}>
              מספיק עם הניירת.
            </h2>
            <p className="text-sm sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,.65)" }}>
              הצטרף לסוכנים שעובדים חכם יותר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10">
              <Link to="/app/auth"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-9 py-4 bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[48px]">
                התחל בחינם
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-9 py-4 text-white text-base font-medium hover:bg-white/10 transition-colors min-h-[48px]"
                style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.85)" }}>
                יש לך שאלות? דבר איתנו
              </Link>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,.65)" }}>
              הקמה תוך דקות · ללא התקנה · מאובטח · בעברית
            </p>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center space-y-2">
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            <span className="font-medium tracking-[0.12em]" style={{ fontFamily: MONO, color: GOLD_TEXT }}>BETA</span> · הפלטפורמה נמצאת בשלבי השקה ראשוניים. חלק מהכלים עדיין בפיתוח ויופעלו בהדרגה. ייתכנו שינויים בפונקציונליות, בממשק ובתנאי השימוש ללא הודעה מוקדמת.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
            SEELD מספקת פלטפורמת ניהול עזר לסוכני ביטוח. האחריות המקצועית, הרגולטורית והמשפטית על כל פעולה, המלצה ועסקה מוטלת על הסוכן בלבד. השימוש בפלטפורמה אינו מהווה ייעוץ משפטי, פיננסי או ביטוחי מטעם SEELD.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
