import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  MessageSquareText,
  TrendingDown,
  ShieldCheck,
  Wallet,
  LineChart,
  Zap,
  Lock,
} from "lucide-react";
import { V2Shell } from "../components/V2Shell";
import { GlassCard, GradientText, En, Ring, Eyebrow, Reveal, AnimatedNumber } from "../components/primitives";
import { ProjectionChart } from "../components/ProjectionChart";
import { buildReport, DEFAULT_PROFILE, shekels, shekelsCompact } from "../lib/finance";

const sample = buildReport(DEFAULT_PROFILE);

const FEATURES = [
  { n: "01", icon: FileText, title: "דוח פיננסי ממותג", en: "your report.", desc: "תמונת מצב מלאה — צבירה, פנסיה, דמי ניהול וכיסוי. כתובת ציבורית שאפשר לשתף, ו-PDF להורדה." },
  { n: "02", icon: ShieldCheck, title: "סריקת כיסוי ביטוחי", en: "gap scan.", desc: "מנוע שמזהה פערים בכיסוי לפי הפרופיל המשפחתי והפיננסי — ומסביר כל אחד מהם." },
  { n: "03", icon: TrendingDown, title: "סורק דמי ניהול", en: "fee drain.", desc: "כמה דמי ניהול גבוהים עולים לך עד הפרישה — ובכמה אפשר לשפר. במונחי ₪ אמיתיים." },
  { n: "04", icon: MessageSquareText, title: "יועץ AI — אריק", en: "24/7.", desc: "שיחה חכמה בעברית על פנסיה, ביטוח, חיסכון ומיצוי זכויות. תשובות מיידיות, כל שעה." },
];

const STEPS = [
  { n: "01", icon: Wallet, title: "מזין את הנתונים", desc: "כמה שדות פשוטים — גיל, הכנסה, צבירה, דמי ניהול וכיסוי." },
  { n: "02", icon: LineChart, title: "מקבל תמונה חיה", desc: "דשבורד שמתעדכן בזמן אמת: צבירה, קצבה, פערים והזדמנויות." },
  { n: "03", icon: Zap, title: "מנתח ומוריד", desc: "ניתוח חכם של אריק (AI) ודוח PDF ממותג — מוכן לשיתוף." },
];

export default function Landing() {
  return (
    <V2Shell>
      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 pt-14 sm:pt-20 pb-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Eyebrow>פלטפורמת הבינה הפיננסית · SeelD</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="v2-display mt-6 text-[2.8rem] leading-[0.98] sm:text-6xl lg:text-[4.7rem] font-extrabold text-[#18181a]"
          >
            העתיד הפיננסי שלך,
            <br />
            <GradientText>
              <En>analyzed</En> תוך שניות.
            </GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-[#3a3a3c]"
          >
            בלי טפסים, בלי המתנה. הזן את הנתונים שלך וקבל <En>clarity</En> על הפנסיה, דמי הניהול
            והביטוח שלך — בדוח חי אחד, עם בינה מלאכותית. חינם, וללא הרשמה.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link to="/v2/studio" className="v2-btn-primary group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold">
              בנה את הדוח שלי
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link to="/v2/advisor" className="v2-btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold">
              <MessageSquareText className="h-4 w-4" />
              דבר עם אריק
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-[#76746e]"
          >
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> ללא שמירת נתונים</span>
            <span>· ללא הרשמה</span>
            <span>· מוכן תוך דקה</span>
          </motion.div>
        </div>

        {/* Sample report — editorial mono */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard className="p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#18181a12] pb-4">
              <div>
                <p className="v2-index text-[11px]">דוח לדוגמה · SAMPLE</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#18181a]">תמונת מצב פנסיונית</p>
              </div>
              <span className="text-[11px] font-medium text-[#2f7d5b]">● חי</span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] text-[#76746e]">צבירה צפויה בפרישה</p>
                <p className="v2-display tnum text-4xl font-extrabold text-[#18181a]">{shekelsCompact(sample.balanceAtRetirement)}</p>
                <p className="mt-1 text-[12px] text-[#3a3a3c]">
                  קצבה: <span className="font-semibold text-[#18181a]">{shekels(sample.monthlyPension)}</span>/חודש
                </p>
              </div>
              <Ring value={sample.readinessScore} size={88} stroke={7}>
                <span className="v2-display tnum text-xl font-extrabold text-[#18181a]">{sample.readinessScore}</span>
                <span className="text-[8px] text-[#a8a6a0]">מוכנות</span>
              </Ring>
            </div>

            <div className="mt-4 h-32">
              <ProjectionChart series={sample.series} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#18181a12] pt-4">
              <div>
                <p className="text-[11px] text-[#76746e]">אובדן מדמי ניהול</p>
                <p className="tnum text-[15px] font-bold text-[#b4453a]">{shekelsCompact(sample.lostToFees)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#76746e]">פערי כיסוי</p>
                <p className="tnum text-[15px] font-bold text-[#b07a16]">{sample.coverageGaps.length} פערים</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* ── Stat strip (QUWEB-style inline metrics) ── */}
      <section className="border-y border-[#18181a12] bg-[#f4f3ef]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-x-reverse divide-[#18181a12] px-5 sm:grid-cols-4 sm:px-8">
          {[
            { v: "₪0", l: "עלות לדוח" },
            { v: "12", l: "חברות בהשוואה" },
            { v: "1 דק׳", l: "עד דוח חי" },
            { v: "∞", l: "תרחישים" },
          ].map((s) => (
            <div key={s.l} className="px-4 py-7 text-center">
              <p className="v2-display tnum text-2xl font-extrabold text-[#18181a]">{s.v}</p>
              <p className="mt-1 text-[12px] text-[#76746e]">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features — numbered, editorial ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-20">
        <Reveal>
          <p className="v2-index text-[12px]">01 · מה מקבלים</p>
          <h2 className="v2-display mt-3 text-3xl sm:text-5xl font-extrabold text-[#18181a]">
            לא עוד אקסל בוואטסאפ. <En>a real toolkit.</En>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.n} delay={i * 0.06}>
              <Link to={f.icon === MessageSquareText ? "/v2/advisor" : "/v2/studio"} className="group block">
                <div className="flex items-start gap-5 border-t border-[#18181a14] pt-6">
                  <span className="v2-index text-[15px] pt-1">{f.n}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <f.icon className="h-[18px] w-[18px] text-[#18181a]" />
                      <h3 className="text-[18px] font-bold text-[#18181a]">
                        {f.title} <En>{f.en}</En>
                      </h3>
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#76746e]">{f.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#18181a] opacity-0 transition-opacity group-hover:opacity-100">
                      כניסה <ArrowLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-[#18181a12] bg-[#f4f3ef]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-20">
          <Reveal>
            <p className="v2-index text-[12px]">02 · איך זה עובד</p>
            <h2 className="v2-display mt-3 text-3xl sm:text-5xl font-extrabold text-[#18181a]">
              מהזנה עד דוח — <En>same session.</En>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="border-t border-[#18181a1f] pt-6">
                  <div className="flex items-center justify-between">
                    <span className="v2-display text-5xl font-extrabold text-[#dedcd4]">{s.n}</span>
                    <s.icon className="h-6 w-6 text-[#18181a]" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#18181a]">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#76746e]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing metrics ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { v: 12, suffix: "", label: "חברות מובילות בהשוואה" },
            { v: 48, suffix: " שעות", label: "לדוח מקצועי מלא" },
            { v: 100, suffix: "%", label: "ללא עלות לפגישה ראשונה" },
            { v: 0, suffix: "", label: "טפסים להזנה ידנית", zero: true },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="v2-display tnum text-4xl font-extrabold text-[#18181a]">
                {s.zero ? "0" : <AnimatedNumber value={s.v} format={(n) => Math.round(n).toString()} />}
                {s.suffix}
              </p>
              <p className="mt-1 text-[12.5px] text-[#76746e]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA — high-contrast block, QUWEB style ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-8">
        <Reveal>
          <div className="rounded-[28px] bg-[#18181a] px-8 py-16 text-center sm:px-16 sm:py-20">
            <p className="v2-index text-[12px] text-[#7a7872]">03 · מוכן?</p>
            <h2 className="v2-display mx-auto mt-4 max-w-2xl text-3xl sm:text-5xl font-extrabold leading-[1.05] text-white">
              הדוח הפיננסי הראשון שלך — <span className="v2-en text-[#cfcdc6]">today.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/60">לוקח פחות מדקה. בלי הרשמה, בלי התחייבות.</p>
            <Link
              to="/v2/studio"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#18181a] transition-transform hover:scale-[1.04]"
            >
              בנה דוח עכשיו <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </V2Shell>
  );
}
