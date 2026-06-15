import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  FileText,
  MessageSquareText,
  TrendingDown,
  ShieldCheck,
  Wallet,
  Zap,
  LineChart,
  Lock,
} from "lucide-react";
import { V2Shell } from "../components/V2Shell";
import { GlassCard, GradientText, Ring, Eyebrow, Reveal, AnimatedNumber } from "../components/primitives";
import { ProjectionChart } from "../components/ProjectionChart";
import { buildReport, DEFAULT_PROFILE, shekels, shekelsCompact } from "../lib/finance";

const sample = buildReport(DEFAULT_PROFILE);

const TOOLS = [
  {
    to: "/v2/studio",
    icon: FileText,
    title: "סטודיו הדוחות",
    desc: "בנה דוח פיננסי אישי מלא — צבירה, פנסיה, דמי ניהול וכיסוי — והורד PDF.",
    tag: "הכלי הראשי",
  },
  {
    to: "/v2/advisor",
    icon: MessageSquareText,
    title: "אריק — יועץ AI",
    desc: "שיחה חכמה בעברית על פנסיה, ביטוח, חיסכון ומיצוי זכויות. 24/7.",
    tag: "בינה מלאכותית",
  },
  {
    to: "/v2/studio",
    icon: TrendingDown,
    title: "סורק דמי ניהול",
    desc: "גלה כמה דמי ניהול גבוהים עולים לך עד הפרישה — ובכמה אפשר לשפר.",
    tag: "חיסכון מיידי",
  },
  {
    to: "/v2/studio",
    icon: ShieldCheck,
    title: "סורק כיסוי ביטוחי",
    desc: "מנוע שמזהה פערים בכיסוי שלך לפי הפרופיל המשפחתי והפיננסי.",
    tag: "הגנה",
  },
];

const STEPS = [
  { n: "01", icon: Wallet, title: "הזן את הנתונים", desc: "כמה שדות פשוטים — גיל, הכנסה, צבירה, דמי ניהול וכיסוי." },
  { n: "02", icon: LineChart, title: "קבל תמונה חיה", desc: "דשבורד שמתעדכן בזמן אמת: צבירה, קצבה, פערים והזדמנויות." },
  { n: "03", icon: Zap, title: "נתח והורד", desc: "ניתוח חכם של אריק (AI) ודוח PDF ממותג — מוכן לשיתוף." },
];

export default function Landing() {
  return (
    <V2Shell>
      {/* ── Hero ── */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 pt-12 sm:pt-20 pb-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Eyebrow>
                <Sparkles className="h-3.5 w-3.5 text-[#f9a8d4]" />
                פלטפורמת הבינה הפיננסית של SeelD
              </Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="v2-display mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem] font-extrabold tracking-tight"
            >
              העתיד הפיננסי שלך,
              <br />
              <GradientText>מנותח תוך שניות.</GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-white/60"
            >
              בלי טפסים, בלי המתנה. הזן את הנתונים שלך וקבל דוח פיננסי חי עם בינה מלאכותית —
              צבירה לפרישה, אובדן מדמי ניהול, פערי ביטוח והמלצות אישיות. הכול חינם, וללא הרשמה.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/v2/studio"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-bold text-[#0a0a18] transition-transform hover:scale-[1.03]"
              >
                בנה את הדוח שלי
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link
                to="/v2/advisor"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <MessageSquareText className="h-4 w-4 text-[#f9a8d4]" />
                דבר עם אריק
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-7 flex items-center gap-2 text-[12.5px] text-white/40"
            >
              <Lock className="h-3.5 w-3.5" />
              הנתונים נשארים בדפדפן שלך · ללא שמירה · ללא הרשמה
            </motion.div>
          </div>

          {/* Floating sample report */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <GlassCard className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e0218a] to-[#7c3aed]">
                    <FileText className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <p className="text-[12px] text-white/45">דוח לדוגמה</p>
                    <p className="text-[13px] font-bold text-white">תמונת מצב פנסיונית</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> חי
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] text-white/45">צבירה צפויה בפרישה</p>
                  <p className="v2-display tnum text-3xl font-extrabold">{shekelsCompact(sample.balanceAtRetirement)}</p>
                  <p className="mt-1 text-[12px] text-white/50">
                    קצבה: <span className="font-semibold text-[#f9a8d4]">{shekels(sample.monthlyPension)}</span>/חודש
                  </p>
                </div>
                <Ring value={sample.readinessScore} size={92} stroke={9}>
                  <span className="v2-display tnum text-xl font-extrabold">{sample.readinessScore}</span>
                  <span className="text-[8px] text-white/45">מוכנות</span>
                </Ring>
              </div>

              <div className="mt-3 h-32">
                <ProjectionChart series={sample.series} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[11px] text-white/45">אובדן מדמי ניהול</p>
                  <p className="tnum text-[15px] font-bold text-rose-300">{shekelsCompact(sample.lostToFees)}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[11px] text-white/45">פערי כיסוי</p>
                  <p className="tnum text-[15px] font-bold text-amber-300">{sample.coverageGaps.length} פערים</p>
                </div>
              </div>
            </GlassCard>

            {/* floating chip */}
            <motion.div
              className="absolute -bottom-5 -left-4 hidden sm:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-[#0c0a1e]/80 px-3.5 py-2.5 backdrop-blur-md shadow-2xl">
                <Sparkles className="h-4 w-4 text-[#f9a8d4]" />
                <span className="text-[12px] font-semibold text-white">נותח ע״י אריק AI</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <Reveal>
          <h2 className="v2-display text-3xl sm:text-4xl font-extrabold">כלים שעובדים בשבילך</h2>
          <p className="mt-2 max-w-xl text-white/55">ארבעה מנועים חכמים, ממשק אחד. כל מה שלקוח צריך כדי להבין את התמונה — ולפעול.</p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.08}>
              <Link to={t.to}>
                <GlassCard hover className="group h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0218a]/80 to-[#7c3aed]/80">
                      <t.icon className="h-5 w-5 text-white" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/55">{t.tag}</span>
                  </div>
                  <h3 className="mt-4 text-[17px] font-bold text-white">{t.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{t.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#f9a8d4] opacity-0 transition-opacity group-hover:opacity-100">
                    כניסה <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </GlassCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <GlassCard className="h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="v2-display text-4xl font-extrabold text-white/10">{s.n}</span>
                  <s.icon className="h-6 w-6 text-[#f9a8d4]" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
        <GlassCard className="grid grid-cols-2 gap-6 p-8 sm:grid-cols-4">
          {[
            { v: 12, suffix: "", label: "חברות מובילות בהשוואה" },
            { v: 48, suffix: " שעות", label: "לדוח מקצועי מלא" },
            { v: 100, suffix: "%", label: "ללא עלות לפגישה ראשונה" },
            { v: 0, suffix: "", label: "טפסים להזנה ידנית", prefix: true },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="v2-display tnum text-4xl font-extrabold">
                <GradientText>
                  {s.prefix ? "0" : <AnimatedNumber value={s.v} format={(n) => Math.round(n).toString()} />}
                  {s.suffix}
                </GradientText>
              </p>
              <p className="mt-1 text-[12.5px] text-white/50">{s.label}</p>
            </div>
          ))}
        </GlassCard>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <Reveal>
          <GlassCard className="relative overflow-hidden p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#e0218a]/30 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="v2-display text-3xl sm:text-5xl font-extrabold">
                מוכן לראות את <GradientText>המספרים שלך?</GradientText>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/60">
                לוקח פחות מדקה. בלי הרשמה, בלי התחייבות — רק בהירות פיננסית.
              </p>
              <Link
                to="/v2/studio"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#0a0a18] transition-transform hover:scale-[1.04]"
              >
                בנה דוח עכשיו <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </GlassCard>
        </Reveal>
      </section>
    </V2Shell>
  );
}
