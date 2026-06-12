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
  ChevronDown,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

/* ─── Helpers ───────────────────────────────────────────────────── */

const useIsDesktop = () => {
  const [v, setV] = useState(false);
  useEffect(() => {
    const fn = () => setV(window.innerWidth >= 1024);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return v;
};

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ═══════════════════════════════════════════════════════════════════
   AGENT LANDING PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function AgentLandingPage() {
  usePageMeta("לסוכנים");
  const isDesktop = useIsDesktop();
  const n89 = useCountUp(89);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* ══════════════════════════════════
          SECTION 1 — HERO
          ══════════════════════════════════ */}
      <section className="relative min-h-[90vh] sm:min-h-[100vh] flex items-center overflow-hidden bg-[#f8f9fc]">
        {/* Animated dashed path — identical to HeroSection */}
        <svg className="hidden lg:block absolute top-[5%] left-[0%] w-[500px] h-[600px]" viewBox="0 0 500 600" fill="none" aria-hidden="true">
          <motion.path
            d="M450,50 C380,50 300,130 320,230 C340,330 220,380 160,450 C130,490 140,540 200,560"
            stroke="#0a3d3d" strokeWidth="2.5" strokeDasharray="10 8" strokeLinecap="round" fill="none" opacity="0.18"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.polygon points="195,552 205,568 215,554" fill="#0a3d3d" opacity="0.18"
            initial={{ opacity: 0 }} animate={{ opacity: 0.18 }}
            transition={{ delay: 3.5, duration: 0.3 }}
          />
        </svg>

        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Right — Content */}
            <div className="space-y-8 lg:space-y-10">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0a3d3d]/[0.06] border border-[#0a3d3d]/10 text-sm text-[#0a3d3d] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#5ec6c6] animate-pulse" />
                  SEELD — פורטל סוכני הביטוח
                  <span className="px-2 py-0.5 rounded-full bg-[#f4a261]/20 text-[#f4a261] text-xs font-bold">BETA</span>
                </span>
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight"
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <span className="text-[#0a3d3d]">הזמן שלך</span>
                <br />
                <span className="relative inline-block">
                  <span className="text-[#5ec6c6]">שווה יותר מניירת</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-[5px] bg-[#f4a261] rounded-full"
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.6 }} style={{ transformOrigin: "right" }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-[#0a3d3d]/45 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                SEELD היא פלטפורמת הניהול המלאה לסוכן הביטוח.
                <br />
                מקום אחד. כל הכלים. אפס ניירת מיותרת.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-start gap-4"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link to="/app/auth">
                  <Button className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-10 py-5 text-base font-bold shadow-xl shadow-[#0a3d3d]/10 min-h-[56px]">
                    התחל בחינם
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </Link>
                <Link to="/app/auth">
                  <Button variant="outline" className="border-[#0a3d3d]/15 text-[#0a3d3d] hover:bg-[#0a3d3d]/5 rounded-full px-10 py-5 text-base font-semibold min-h-[56px]">
                    כניסה למערכת
                  </Button>
                </Link>
              </motion.div>

              {/* Mobile accent dots */}
              <motion.div className="flex sm:hidden items-center gap-3 pt-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <span className="w-5 h-5 rounded-full bg-[#5ec6c6]" />
                <span className="w-4 h-4 rounded-full bg-[#e76f51]" />
                <span className="w-6 h-6 rounded-full bg-[#f4a261]" />
                <span className="w-4 h-4 rounded-full bg-[#90be6d]" />
              </motion.div>
            </div>

            {/* Left — Circles composition */}
            <motion.div className="hidden sm:flex relative items-center justify-center lg:justify-start"
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}>
              <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[480px] lg:h-[480px]">
                <motion.div className="absolute top-[30%] right-[5%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-[#5ec6c6] flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-10 h-10 sm:w-14 sm:h-14">
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[28%] right-[32%] w-[75px] h-[75px] sm:w-[95px] sm:h-[95px] rounded-full bg-[#e76f51]"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.65, type: "spring", stiffness: 200 }} />
                <motion.div className="absolute top-[15%] right-[52%] w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-full bg-[#f4a261] flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring", stiffness: 200 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8 sm:w-11 sm:h-11">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[22%] right-[75%] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full bg-[#90be6d] flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.95, type: "spring", stiffness: 200 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-7 h-7 sm:w-9 sm:h-9">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <motion.div className="absolute top-[55%] right-[15%] w-[200px] sm:w-[280px] h-[60px] sm:h-[75px] rounded-full border-2 border-[#0a3d3d]/15 flex items-center px-4"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#5ec6c6]" />
                  <div className="flex-1 mx-3 h-[2px] bg-[#0a3d3d]/10 rounded-full" />
                </motion.div>
                <motion.div className="absolute top-[10%] right-[40%] w-4 h-4 rounded-full bg-[#ffc929]" animate={{ y: [0,-6,0] }} transition={{ duration: 3, repeat: Infinity }} />
                <motion.div className="absolute top-[75%] right-[60%] w-3 h-3 rounded-full bg-[#e76f51]/60" animate={{ y: [0,5,0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
                <motion.div className="absolute top-[80%] right-[20%] w-3 h-3 rounded-full bg-[#5ec6c6]/50" animate={{ scale: [1,1.4,1] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
                <svg className="absolute top-[20%] right-[70%] w-[120px] h-[100px]" viewBox="0 0 120 100" fill="none">
                  <path d="M100,20 C70,10 40,50 20,80" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" opacity="0.2"/>
                  <polygon points="16,76 22,84 26,74" fill="#0a3d3d" opacity="0.2"/>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Trust bar */}
          <motion.div className="mt-16 sm:mt-24 pt-8 border-t border-[#0a3d3d]/[0.06]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
            <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
              {[
                { text: "הקמה תוך דקות, ללא התקנה", dot: "#5ec6c6" },
                { text: "בעברית מלאה, מותאם לשוק הישראלי", dot: "#f4a261" },
                { text: "מאובטח ועומד בדרישות הרגולציה", dot: "#90be6d" },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: it.dot }} />
                  <span className="text-sm text-[#0a3d3d]/45 font-medium">{it.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — הכאב
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white relative">
        <div className="absolute top-6 right-[5%] w-4 h-4 rounded-full bg-[#f4a261] hidden sm:block" />
        <div className="absolute bottom-10 left-[8%] w-3 h-3 rounded-full bg-[#90be6d] hidden sm:block" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#e76f51]/10 text-[#e76f51] text-sm font-bold mb-4">
              מוכר לך?
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3">
              אתה עובד כפול — <span className="text-[#5ec6c6]">וזה לא הולך לשום מקום</span>
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: Clock, color: "#5ec6c6",
                title: "רוב היום שלך לא הולך על לקוחות",
                desc: "אתה סוכן ביטוח, לא פקיד. אבל רוב השעות הולכות על מילוי טפסים, רדיפה אחרי חתימות, העתקה בין מערכות, ובדיקת דברים שמישהו שכח. הזמן הזה שייך ללקוחות שלך — לא לניירת.",
              },
              {
                Icon: Monitor, color: "#f4a261",
                title: "המידע שלך מפוזר בחמש מערכות",
                desc: "מסלקה במקום אחד. הר הביטוח במקום שני. שורנס, רואטו, אקסל, מיילים, וואטסאפ. כל פעם שאתה צריך תמונה מלאה על לקוח, אתה מרכיב פאזל. וכשחתיכה חסרה — חוזר ליקוי.",
              },
              {
                Icon: Wallet, color: "#e76f51",
                title: "אתה מפסיד כסף בלי לדעת",
                desc: "בלי מעקב שיטתי, עמלות נשמטות. מינויים לא עוברים. הפקדות לא מגיעות. אתה לא תמיד יודע מה מגיע לך — וגם אם אתה יודע, אין לך זמן לרדוף.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.25 }}
                className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-1.5 rounded-b-full" style={{ backgroundColor: color }} />
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-lg"
                  style={{ backgroundColor: color, boxShadow: `0 6px 18px ${color}30` }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0a3d3d] mb-3">{title}</h3>
                <p className="text-[#0a3d3d]/45 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — המהפך
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <motion.div animate={{ y: [0,-12,0] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-10 left-[6%] w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] rounded-full bg-[#5ec6c6] opacity-25" />
        <motion.div animate={{ y: [0,10,0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute bottom-16 right-[10%] w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full bg-[#e76f51] opacity-20" />

        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-10 sm:mb-14">
              מה אם היה <span className="text-[#5ec6c6]">מקום אחד שמכסה הכל?</span>
            </h2>
            <div className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-12 text-right shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1.5 rounded-b-full bg-[#5ec6c6]" />
              <p className="text-base sm:text-xl text-[#0a3d3d]/65 leading-relaxed font-medium">
                נכנסים בבוקר. פותחים מסך אחד.
                <br />
                הכל שם — המשימות של היום, הלקוחות שצריכים תשומת לב,
                המסמכים שממתינים, העמלות שנכנסו.
                <br /><br />
                בלי לקפוץ בין מערכות. בלי לשכוח. בלי להקליד פעמיים.
                <br />
                <span className="text-[#0a3d3d] font-bold">זה לא חלום. זה SEELD.</span>
              </p>
            </div>
            <div className="mt-10">
              <Link to="/app/auth">
                <Button className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-10 py-5 text-base font-bold shadow-xl shadow-[#0a3d3d]/10 min-h-[56px]">
                  התחל בחינם
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 4 — מה זה SEELD
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white relative">
        <div className="absolute top-4 right-[5%] w-3 h-3 rounded-full bg-[#5ec6c6] hidden sm:block" />
        <div className="absolute bottom-10 left-[8%] w-4 h-4 rounded-full bg-[#f4a261] hidden sm:block" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#0a3d3d]/[0.06] text-[#0a3d3d] text-sm font-bold mb-4">
              הפלטפורמה
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3">
              מערכת ההפעלה <span className="text-[#5ec6c6]">של סוכן הביטוח</span>
            </h2>
            <p className="text-[#0a3d3d]/45 text-base sm:text-lg max-w-2xl mx-auto">
              SEELD מלווה אותך בכל רגע — מהרגע שליד חדש נכנס, דרך ניתוח התיק והמלצה מקצועית, ביצוע מול חברות ביטוח, ועד שימור הלקוח לאורך שנים. שרשרת שלמה. מקום אחד.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              {
                Icon: DoorOpen, color: "#5ec6c6",
                title: "קליטה חכמה",
                desc: "הלקוח מקבל לינק, ממלא הכל מהנייד, חותם דיגיטלית — וכל הנתונים כבר בפנים. מה שלקח 45 דקות, לוקח 5.",
              },
              {
                Icon: Search, color: "#f4a261",
                title: "ניתוח והמלצה",
                desc: "המערכת סורקת את התיק, מזהה פערים, כפילויות ודמי ניהול גבוהים, ומגישה לך המלצות מקצועיות מוכנות. אתה בוחר מה להציג — היא מכינה הכל.",
              },
              {
                Icon: Zap, color: "#e76f51",
                title: "ביצוע בלחיצה",
                desc: "טפסים נמלאים לבד, מסמכים עפים לחברות, חתימות חוזרות חתומות, וליקויים מטופלים ברגע שהם מגיעים. לא עוד \"אני אטפל בזה מחר\".",
              },
              {
                Icon: Shield, color: "#90be6d",
                title: "שימור ובקרה",
                desc: "תזכורות חכמות, מעקב אירועי חיים, ניהול תביעות מא' עד ת', ומעקב עמלות שקל-בשקל. הלקוחות שלך מטופלים — גם כשאתה ישן.",
              },
            ].map(({ Icon, color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.25 }}
                className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-1.5 rounded-b-full" style={{ backgroundColor: color }} />
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-lg"
                  style={{ backgroundColor: color, boxShadow: `0 6px 18px ${color}30` }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0a3d3d] mb-3">{title}</h3>
                <p className="text-[#0a3d3d]/45 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 5 — המספרים
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <motion.div animate={{ y: [0,-12,0] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-10 right-[6%] w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] rounded-full bg-[#90be6d] opacity-30" />
        <div className="absolute bottom-20 left-[15%] hidden lg:block">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <path d="M10 70 C 30 10, 90 10, 110 40" stroke="#0a3d3d" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.1" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-16 text-center"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            מספרים, <span className="text-[#f4a261]">לא סיסמאות</span>
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
            {[
              { display: "5", suffix: " דקות", label: "קליטת לקוח חדש מקצה לקצה", color: "#5ec6c6", delay: 0 },
              { display: null, suffix: "%", label: "חיסכון בזמן עבודה ידנית",  color: "#f4a261", delay: 0.1, isCount: true },
              { display: "אפס", suffix: "",   label: "הקלדה ידנית כפולה",         color: "#e76f51", delay: 0.2 },
              { display: "24/7", suffix: "",  label: "עובדת גם כשאתה לא",         color: "#90be6d", delay: 0.3 },
            ].map((item, i) => (
              <motion.div key={i} ref={item.isCount ? n89.ref : undefined}
                className="text-center"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: item.delay }}>
                <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3" style={{ color: item.color }}>
                  {item.isCount ? n89.count : item.display}{item.suffix}
                </div>
                <p className="text-sm sm:text-base text-[#0a3d3d]/50 font-medium leading-snug">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 6 — השרשרת
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white relative">
        <div className="absolute top-4 right-[5%] w-3 h-3 rounded-full bg-[#5ec6c6] hidden sm:block" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#0a3d3d]/[0.06] text-[#0a3d3d] text-sm font-bold mb-4">
              תהליך מלא
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3">
              מליד חדש ועד שימור — <span className="text-[#5ec6c6]">הכל רץ</span>
            </h2>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex items-center gap-0 min-w-max justify-center">
                {[
                  { label: "ליד",    color: "#7C3AED" },
                  { label: "קליטה",  color: "#0891B2" },
                  { label: "נתונים", color: "#6366F1" },
                  { label: "ניתוח",  color: "#DC2626" },
                  { label: "המלצה",  color: "#F59E0B" },
                  { label: "הצגה",   color: "#8B5CF6" },
                  { label: "חיתום",  color: "#059669" },
                  { label: "ביצוע",  color: "#2563EB" },
                  { label: "מעקב",   color: "#EA580C" },
                  { label: "שימור",  color: "#DB2777" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md"
                        style={{ backgroundColor: step.color, boxShadow: `0 4px 14px ${step.color}40` }}>
                        {step.label.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-[#0a3d3d]/60">{step.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center mx-1 mt-[-20px]">
                        <div className="w-5 h-[2px] bg-[#0a3d3d]/10" />
                        <ArrowRight className="w-3 h-3 text-[#0a3d3d]/20 -mr-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[#0a3d3d]/45 text-sm sm:text-base mt-8 max-w-xl mx-auto">
              כל שלב בשרשרת מכוסה. כל תהליך מנוהל. שום דבר לא נופל בין הכיסאות.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 7 — יותר מ-20 כלים
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <motion.div animate={{ y: [0,-12,0] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-10 left-[6%] w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] rounded-full bg-[#f4a261] opacity-25" />
        <motion.div animate={{ y: [0,10,0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute bottom-16 right-[10%] w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full bg-[#5ec6c6] opacity-20" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3">
              סוויטה שלמה. <span className="text-[#5ec6c6]">לא עוד כלי בודד.</span>
            </h2>
            <p className="text-[#0a3d3d]/45 text-base sm:text-lg max-w-2xl mx-auto">
              רוב המערכות פותרות בעיה אחת. SEELD פותרת את כולן.
              יותר מ-20 כלים מקצועיים שעובדים יחד כמערכת אחת — מכסים מאות תהליכי עבודה מקצה לקצה.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10"
            initial="hidden" whileInView="visible"
            viewport={{ once: true }} variants={stagger}>
            {[
              { color: "#7C3AED", text: "ניהול לידים ולקוחות" },
              { color: "#0891B2", text: "סריקת מסמכים אוטומטית" },
              { color: "#6366F1", text: "שליפה ממסלקה והר הביטוח" },
              { color: "#DC2626", text: "ניתוח תיק מקצועי" },
              { color: "#F59E0B", text: "בניית המלצות" },
              { color: "#8B5CF6", text: "הצגה ללקוח עם מעקב החלטות" },
              { color: "#059669", text: "חתימות דיגיטליות והרשאות" },
              { color: "#0D9488", text: "ניהול חיתום רפואי" },
              { color: "#2563EB", text: "מילוי טפסים אוטומטי" },
              { color: "#7C3AED", text: "שיגור מסמכים לחברות ביטוח" },
              { color: "#EA580C", text: "תיקון ליקויים" },
              { color: "#E11D48", text: "מעקב ביצוע ופולו-אפ" },
              { color: "#DB2777", text: "שימור לקוחות ואירועי חיים" },
              { color: "#4F46E5", text: "שירות שוטף ופניות" },
              { color: "#0F766E", text: "ניהול תביעות" },
              { color: "#CA8A04", text: "מעקב עמלות" },
              { color: "#475569", text: "ניהול מעסיקים" },
              { color: "#16A34A", text: "בקרה רגולטורית" },
              { color: "#0EA5E9", text: "תקשורת רב-ערוצית" },
              { color: "#9333EA", text: "ניהול משימות ויומן" },
              { color: "#6366F1", text: "מאגר ידע מקצועי" },
            ].map(({ color, text }, i) => (
              <motion.div key={i} variants={fadeUp}
                className="flex items-center gap-3 bg-white border border-[#0a3d3d]/[0.06] rounded-xl px-4 py-3 hover:shadow-sm transition-all">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color }} />
                <span className="text-sm font-medium text-[#0a3d3d]/70">{text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p className="text-center text-[#0a3d3d]/45 text-sm sm:text-base max-w-xl mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            כל אחד מהם חזק בפני עצמו. ביחד — הם מערכת שלמה שמנהלת סוכנות ביטוח מא' עד ת'.
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 8 — איך זה עובד
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white relative">
        <div className="absolute top-4 right-[5%] w-3 h-3 rounded-full bg-[#90be6d] hidden sm:block" />

        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3">
              שלושה צעדים. <span className="text-[#5ec6c6]">זהו.</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="hidden sm:block absolute top-8 right-[calc(16.67%+24px)] left-[calc(16.67%+24px)] h-[2px] bg-[#0a3d3d]/10" />
            <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              {[
                {
                  num: "01", color: "#5ec6c6", title: "נרשמים",
                  desc: "פותחים חשבון, מעלים לוגו, ומתחילים. בלי התקנות, בלי הדרכות של שבוע. המערכת מוכנה ברגע שאתה מוכן.",
                },
                {
                  num: "02", color: "#f4a261", title: "מחברים",
                  desc: "מייבאים את הלקוחות הקיימים, מחברים את הנתונים, ורואים תמונה מלאה של הסוכנות. הכל במקום אחד — סוף סוף.",
                },
                {
                  num: "03", color: "#e76f51", title: "עובדים חכם",
                  desc: "מהיום — המערכת מטפלת בניירת ואתה מטפל בלקוחות. כל יום שעובר אתה חוסך שעות. כל שבוע אתה רואה את ההבדל.",
                },
              ].map(({ num, color, title, desc }, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-xl font-extrabold shadow-lg relative z-10 bg-white border-4"
                    style={{ borderColor: color, color }}>
                    {num}
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0a3d3d] mb-3">{title}</h3>
                  <p className="text-[#0a3d3d]/45 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 9 — למי זה
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-[#f8f9fc] relative overflow-hidden">
        <motion.div animate={{ y: [0,-12,0] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-10 left-[6%] w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] rounded-full bg-[#5ec6c6] opacity-25" />

        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3">
              בנינו את SEELD <span className="text-[#5ec6c6]">בשבילך</span>
            </h2>
          </motion.div>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              {
                color: "#5ec6c6", title: "סוכן עצמאי",
                desc: "עובד לבד? SEELD הוא הצוות שלך. המערכת לא הולכת הביתה, לא שוכחת דברים, ולא צריכה חופש. היא פשוט עובדת — כדי שאתה תוכל להתמקד במה שאתה הכי טוב בו.",
              },
              {
                color: "#f4a261", title: "מנהל סוכנות",
                desc: "מנהל צוות של 5? של 50? SEELD נותן לך שליטה מלאה. אתה רואה מי עובד על מה, איפה יש עומס, ואיפה הכסף. דוחות, מדדים, ובקרה — בלי לשאול שאלות.",
              },
            ].map(({ color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -6, scale: 1.02 }} transition={{ duration: 0.25 }}
                className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-8 sm:p-10 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1.5 rounded-b-full" style={{ backgroundColor: color }} />
                <h3 className="text-xl font-extrabold text-[#0a3d3d] mb-4">{title}</h3>
                <p className="text-[#0a3d3d]/55 text-sm sm:text-base leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 10 — אבטחה ואמון
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white relative">
        <div className="absolute bottom-20 left-[15%] hidden lg:block">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <path d="M10 70 C 30 10, 90 10, 110 40" stroke="#0a3d3d" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.1" />
          </svg>
        </div>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div className="text-center mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a3d3d] mb-3">
              אבטחת מידע <span className="text-[#5ec6c6]">ברמה הגבוהה ביותר</span>
            </h2>
            <p className="text-sm text-[#0a3d3d]/40 max-w-xl mx-auto">המערכת בנויה על תשתיות מאובטחות. השימוש בפלטפורמה כפוף ל<Link to="/terms" className="underline hover:text-[#5ec6c6]">תנאי השימוש</Link> ול<Link to="/privacy" className="underline hover:text-[#5ec6c6]">מדיניות הפרטיות</Link> שלנו.</p>
          </motion.div>
          <motion.div className="space-y-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { color: "#5ec6c6", title: "הצפנה מלאה",       desc: "הנתונים מוגנים בהצפנה בתעבורה ובאחסון" },
              { color: "#f4a261", title: "הפרדה מוחלטת",     desc: "כל סוכנות רואה רק את הנתונים שלה" },
              { color: "#90be6d", title: "תיעוד מלא",        desc: "כל פעולה מתועדת לצורכי שקיפות ובקרה" },
            ].map(({ color, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color }} />
                <div>
                  <span className="font-extrabold text-[#0a3d3d]">{title}</span>
                  <span className="text-[#0a3d3d]/50"> — {desc}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 12 — CTA סגירה
          ══════════════════════════════════ */}
      <section className="py-14 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            className="bg-[#0a3d3d] rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-[-40px] right-[-40px] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-full bg-[#5ec6c6] opacity-15" />
            <motion.div animate={{ y: [0,8,0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-[-30px] left-[-30px] w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full bg-[#f4a261] opacity-10" />
            <div className="absolute top-[50%] left-[10%] w-[20px] h-[20px] sm:w-[30px] sm:h-[30px] rounded-full bg-[#e76f51] opacity-20" />

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 relative">
              מספיק עם <span className="text-[#5ec6c6]">הניירת.</span>
            </h2>
            <p className="text-white/50 text-sm sm:text-lg mb-8 max-w-xl mx-auto relative">
              הצטרף לסוכנים שעובדים חכם יותר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center relative mb-10">
              <Link to="/app/auth"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#5ec6c6] text-[#0a3d3d] font-bold rounded-full hover:bg-[#4db5b5] transition-colors shadow-xl shadow-[#5ec6c6]/20 text-base min-h-[48px]">
                התחל עכשיו — חינם
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link to="/contact"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-colors text-base min-h-[48px]">
                יש לך שאלות? דבר איתנו
              </Link>
            </div>
            <p className="text-white/25 text-sm relative">
              הקמה תוך דקות · ללא התקנה · מאובטח · בעברית
            </p>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-[#f8f9fc] border-t border-[#0a3d3d]/[0.06] py-6 px-5 sm:px-8" dir="rtl">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="text-xs text-[#0a3d3d]/35 leading-relaxed">
            <span className="font-bold text-[#f4a261]">BETA</span> — הפלטפורמה נמצאת בשלבי השקה ראשוניים. חלק מהכלים עדיין בפיתוח ויופעלו בהדרגה. ייתכנו שינויים בפונקציונליות, בממשק ובתנאי השימוש ללא הודעה מוקדמת.
          </p>
          <p className="text-xs text-[#0a3d3d]/25 leading-relaxed">
            SEELD מספקת פלטפורמת ניהול עזר לסוכני ביטוח. האחריות המקצועית, הרגולטורית והמשפטית על כל פעולה, המלצה ועסקה מוטלת על הסוכן בלבד. השימוש בפלטפורמה אינו מהווה ייעוץ משפטי, פיננסי או ביטוחי מטעם SEELD.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
