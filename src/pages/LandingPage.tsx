import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Users, Star, Zap, Shield, BarChart3, FileText,
  ArrowLeft, CheckCircle2, Send, Sparkles, Globe,
  Clock, TrendingUp, Heart, Brain, Cpu, Activity,
  Scan, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import dashboardMockup from '@/assets/landing-dashboard-mockup.png';
import illustrationHandshake from '@/assets/illustration-handshake.png';
import illustrationGrowth from '@/assets/illustration-growth.png';
import illustrationProtection from '@/assets/illustration-protection.png';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const features = [
  {
    icon: Users,
    title: 'ניהול לקוחות חכם',
    desc: 'כל המידע על הלקוח במקום אחד — פרטים אישיים, מוצרים, היסטוריה ומעקב.',
  },
  {
    icon: Sparkles,
    title: 'המלצות AI',
    desc: 'מנוע בינה מלאכותית שמנתח מוצרים ומייצר המלצות מקצועיות אוטומטית.',
  },
  {
    icon: Globe,
    title: 'פורטל לקוח דיגיטלי',
    desc: 'הלקוח מקבל לינק מאובטח, צופה בהמלצות ומקבל החלטות — הכל דיגיטלי.',
  },
  {
    icon: Zap,
    title: 'מעקב ביצוע',
    desc: 'תור ביצוע מסודר עם סטטוסים, תזכורות ומעקב אחר כל תהליך.',
  },
  {
    icon: BarChart3,
    title: 'דשבורד ותובנות',
    desc: 'נתונים בזמן אמת — הכנסות, המלצות פתוחות, שיעורי אישור ועוד.',
  },
  {
    icon: FileText,
    title: 'ניתוח קבצי מסלקה',
    desc: 'העלאת קבצי מסלקה ופירוק אוטומטי למוצרים ולקטגוריות.',
  },
];

const stats = [
  { value: '85%', label: 'שיעור אישור המלצות' },
  { value: '×3', label: 'יעילות בעבודה' },
  { value: '60%', label: 'חיסכון בזמן' },
  { value: '24/7', label: 'פורטל לקוח פעיל' },
];

const steps = [
  { num: '01', title: 'הוסף לקוח', desc: 'הזן פרטי לקוח או העלה קובץ מסלקה — המערכת תפרק את המוצרים אוטומטית.', icon: Users },
  { num: '02', title: 'קבל המלצות', desc: 'מנוע ה-AI מנתח את המצב הקיים ומייצר המלצות מותאמות אישית.', icon: Sparkles },
  { num: '03', title: 'שלח ללקוח', desc: 'הלקוח מקבל לינק מאובטח עם פורטל אישי לצפייה וקבלת החלטות.', icon: Send },
  { num: '04', title: 'עקוב ובצע', desc: 'מעקב אוטומטי אחרי כל החלטה, תזכורות פולו-אפ ותור ביצוע.', icon: TrendingUp },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden" dir="rtl" style={{ background: '#fdf8f0' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b" style={{ background: 'rgba(253,248,240,0.9)', borderColor: '#e8dcc8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SeeIDLogo size={34} />
            <span className="text-xl font-extrabold" style={{ color: '#2d3a2e' }}>SeeID</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-sm font-semibold" style={{ color: '#5a4a38' }}>
              התחברות
            </Button>
            <Button onClick={() => navigate('/auth')} className="rounded-xl gap-1.5 font-bold"
              style={{ background: 'linear-gradient(135deg, #2d5a3e, #4a8c5c)', color: '#fff' }}>
              <ArrowLeft className="h-4 w-4" />התחל עכשיו
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #2d5a3e 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" animate="visible" className="space-y-6">
              <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
                <SeeIDLogo size={52} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: '#e8f5e8', color: '#2d5a3e', border: '1px solid #b8deb8' }}>
                  <Sparkles className="h-3.5 w-3.5" />מנוע AI חכם לסוכני ביטוח
                </span>
              </motion.div>

              <motion.h1 custom={1} variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight" style={{ color: '#2d3a2e' }}>
                נהל את העסק שלך
                <br />
                <span style={{ color: 'hsl(160, 42%, 45%)' }}>כמו מקצוען</span>
              </motion.h1>

              <motion.p custom={2} variants={fadeUp}
                className="text-lg sm:text-xl leading-relaxed max-w-lg" style={{ color: '#6b5d4d' }}>
                SeeID הוא מנוע העבודה המתקדם לסוכני ביטוח ופיננסים — ניהול לקוחות, המלצות AI, פורטל לקוח דיגיטלי ומעקב ביצוע. הכל במקום אחד.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/auth')} size="lg"
                  className="rounded-xl gap-2 text-base font-bold h-12 px-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2d5a3e, #4a8c5c)', color: '#fff' }}>
                  <ArrowLeft className="h-5 w-5" />התחל בחינם
                </Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-xl gap-2 text-base font-semibold h-12 px-6"
                  style={{ borderColor: '#c4b89e', color: '#5a4a38' }}>
                  גלה עוד
                </Button>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
                {['הגדרה ב-2 דקות', 'תמיכה בעברית', 'מאובטח ומוגן'].map((t, i) => (
                  <span key={i} className="flex items-center gap-1 text-sm" style={{ color: '#8b7355' }}>
                    <CheckCircle2 className="h-4 w-4" style={{ color: '#4a8c5c' }} />{t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#e0d3be' }}>
                <img src={dashboardMockup} alt="SeeID דשבורד" className="w-full" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl opacity-50" style={{ background: 'linear-gradient(135deg, #4a8c5c, #2d5a3e)' }} />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-30" style={{ background: '#d4a574' }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8" style={{ background: 'linear-gradient(135deg, #2d3a2e, #3d5a3e)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: '#f5ede0', color: '#8b7355' }}>
              <Star className="h-3.5 w-3.5" />יכולות המערכת
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#2d3a2e' }}>
              הכל מה שסוכן ביטוח צריך
            </h2>
            <p className="text-lg mt-3 max-w-2xl mx-auto" style={{ color: '#8b7355' }}>
              פלטפורמה אחת שמחליפה עשרות כלים — ניהול, תקשורת, ניתוח ומעקב
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ background: '#fffbf5', borderColor: '#e8dcc8' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(74,140,92,0.1), rgba(74,140,92,0.05))' }}>
                  <f.icon className="h-6 w-6" style={{ color: '#4a8c5c' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#2d3a2e' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b7355' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24" style={{ background: '#f5ede0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: '#e8f5e8', color: '#2d5a3e' }}>
              <Clock className="h-3.5 w-3.5" />איך זה עובד
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold" style={{ color: '#2d3a2e' }}>
              4 שלבים פשוטים
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="relative">
                <div className="rounded-2xl p-6 border text-center" style={{ background: '#fffbf5', borderColor: '#e0d3be' }}>
                  <span className="text-3xl font-extrabold" style={{ color: '#e0d3be' }}>{s.num}</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto my-3"
                    style={{ background: 'linear-gradient(135deg, #2d5a3e, #4a8c5c)' }}>
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-1.5" style={{ color: '#2d3a2e' }}>{s.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#8b7355' }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Illustrations section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <img src={illustrationHandshake} alt="שותפות מקצועית" className="w-64 sm:w-80 mx-auto" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#2d3a2e' }}>
                חוויית לקוח שמייצרת אמון
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#6b5d4d' }}>
                הלקוחות שלך מקבלים פורטל מאובטח ומעוצב בו הם צופים במצב הביטוחי והפיננסי שלהם, קוראים את ההמלצות המקצועיות ומקבלים החלטות בלחיצת כפתור — ללא שיחות טלפון מיותרות.
              </p>
              <div className="space-y-2">
                {['פורטל מאובטח בגישת Mobile-first', 'אימות בת.ז — ללא סיסמאות', 'עדכון בזמן אמת לסוכן'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#3d3225' }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4a8c5c' }} />{item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Second illustration block */}
      <section className="py-16 sm:py-24" style={{ background: '#f5ede0' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-4 order-2 md:order-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#2d3a2e' }}>
                המלצות חכמות שמוכרות בשבילך
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#6b5d4d' }}>
                מנוע הבינה המלאכותית מנתח את כל המוצרים הקיימים של הלקוח, מזהה פערים, חוסרים והזדמנויות — ומייצר המלצה מקצועית מנומקת שמוכנה לשליחה.
              </p>
              <div className="space-y-2">
                {['ניתוח אוטומטי של כל המוצרים', 'נימוקים מקצועיים מובנים', 'בנק המלצות ונימוקים לשימוש חוזר'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#3d3225' }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#4a8c5c' }} />{item}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="order-1 md:order-2 flex gap-4 justify-center">
              <img src={illustrationGrowth} alt="צמיחה פיננסית" className="w-32 sm:w-40 self-end" />
              <img src={illustrationProtection} alt="הגנה ביטוחית" className="w-32 sm:w-40" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2d3a2e, #3d5a3e)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10 space-y-5">
              <SeeIDLogo size={56} className="mx-auto opacity-80" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                מוכן לשדרג את העסק שלך?
              </h2>
              <p className="text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
                הצטרף לסוכנים שכבר עובדים עם SeeID ומגדילים את היעילות, ההכנסות ושביעות הרצון של הלקוחות.
              </p>
              <Button onClick={() => navigate('/auth')} size="lg"
                className="rounded-xl gap-2 text-base font-bold h-12 px-8 shadow-lg"
                style={{ background: '#fff', color: '#2d5a3e' }}>
                <ArrowLeft className="h-5 w-5" />התחל בחינם עכשיו
              </Button>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>הגדרה ב-2 דקות · תמיכה מלאה בעברית</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: '#e8dcc8' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SeeIDLogo size={28} />
            <span className="text-sm font-bold" style={{ color: '#2d3a2e' }}>SeeID</span>
          </div>
          <p className="text-xs" style={{ color: '#a8977e' }}>© {new Date().getFullYear()} SeeID — תכנון פיננסי וביטוח. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
