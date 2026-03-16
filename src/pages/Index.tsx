import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall,
  Shield, Users, Award, Home, Plane, Heart, Baby, Briefcase, Umbrella,
  Building2, HandCoins, TrendingUp, GraduationCap, UserCheck,
  Wallet, BarChart3, HelpCircle, Mail, MapPin, Phone,
  MessageCircle, ChevronLeft, Stethoscope, Key, Globe,
  Scale, Activity, Target, CalendarCheck, Loader2, Zap, Handshake
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// ── Data ──

const quickActions = [
  { icon: Landmark, label: "תכנון פנסיוני", href: "/savings/pension-funds" },
  { icon: HeartPulse, label: "ביטוח חיים ובריאות", href: "/insurance/health" },
  { icon: Home, label: "ביטוח רכוש", href: "/insurance/apartment" },
  { icon: PiggyBank, label: "חיסכון והשקעות", href: "/savings/gemel-investment" },
  { icon: Calculator, label: "מחשבונים", href: "/calculators" },
  { icon: PhoneCall, label: "צור קשר", href: "/contact" },
];

const whySeeld = [
  {
    icon: Users,
    title: "שירות אישי בגובה העיניים",
    description: "לא קול סנטר ולא צ׳אטבוט — אתם מדברים ישירות עם שמוליק. מענה אנושי, ליווי צמוד, יחס אישי.",
  },
  {
    icon: Handshake,
    title: "חלק מבית עמיתים הון",
    description: "סוכנות ביטוח ופיננסים מבוססת עם מוניטין ארוך שנים. אתם בידיים טובות.",
  },
  {
    icon: Scale,
    title: "עבודה עם כל החברות",
    description: "לא משווקים חברה אחת — אנחנו משווים את כל השוק ומוצאים את הפתרון הכי טוב עבורכם.",
  },
  {
    icon: Zap,
    title: "טכנולוגיה מתקדמת",
    description: "כלים דיגיטליים חכמים — מחשבונים, פורטל לקוחות, מעקב פוליסות — הכל זמין ונגיש.",
  },
];

const insuranceTypes = [
  { icon: Car, title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳", href: "/insurance/vehicle" },
  { icon: HeartPulse, title: "ביטוח בריאות", description: "כיסוי רפואי מורחב", href: "/insurance/health" },
  { icon: Heart, title: "ביטוח חיים", description: "הגנה למשפחה שלכם", href: "/insurance/life" },
  { icon: Home, title: "ביטוח דירה", description: "מבנה ותכולה", href: "/insurance/apartment" },
  { icon: Key, title: "ביטוח שוכרים", description: "הגנה לדירה שכורה", href: "/insurance/renters" },
  { icon: Building2, title: "ביטוח עסקי", description: "הגנה מקיפה לעסק", href: "/insurance/business" },
  { icon: Plane, title: "ביטוח נסיעות", description: "כיסוי לחו״ל", href: "/insurance/travel" },
  { icon: Stethoscope, title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { icon: Activity, title: "אובדן כושר עבודה", description: "הגנה על ההכנסה", href: "/insurance/disability" },
  { icon: UserCheck, title: "ביטוח סיעודי", description: "כיסוי למצב סיעודי", href: "/insurance/nursing" },
  { icon: Landmark, title: "ביטוח משכנתא", description: "הגנה על ההלוואה", href: "/insurance/mortgage" },
  { icon: Shield, title: "מחלות קשות", description: "פיצוי חד-פעמי", href: "/insurance/critical-illness" },
  { icon: Umbrella, title: "תאונות אישיות", description: "כיסוי לתאונות", href: "/insurance/personal-accidents" },
  { icon: Briefcase, title: "ביטוח שותפים", description: "הגנה לשותפים עסקיים", href: "/insurance/partners" },
  { icon: Globe, title: "עובדים זרים", description: "ביטוח חובה לעובדים", href: "/insurance/foreign-workers" },
  { icon: Heart, title: "סיעודי כללית", description: "תוכנית סיעוד משלימה", href: "/insurance/nursing-clalit" },
];

const savingsProducts = [
  { icon: Landmark, title: "קרנות פנסיה", description: "חיסכון פנסיוני מקיף", href: "/savings/pension-funds" },
  { icon: PiggyBank, title: "קופות גמל", description: "חיסכון לטווח ארוך", href: "/savings/gemel-funds" },
  { icon: HandCoins, title: "גמל להשקעה", description: "חיסכון גמיש", href: "/savings/gemel-investment" },
  { icon: Baby, title: "חיסכון לכל ילד", description: "חיסכון לעתיד הילדים", href: "/savings/child-savings" },
  { icon: GraduationCap, title: "קרנות השתלמות", description: "חיסכון מוטב מס", href: "/savings/training-funds" },
  { icon: TrendingUp, title: "השקעות", description: "ניהול תיק השקעות", href: "/savings/investment" },
  { icon: Heart, title: "ביטוח חיים פנסיוני", description: "חיסכון + הגנה ביטוחית", href: "/insurance/life" },
  { icon: Building2, title: "קופות מעסיקים", description: "פתרונות למעסיקים", href: "/savings/employer-funds" },
  { icon: CalendarCheck, title: "טרום פרישה", description: "הכנה לפרישה מוקדמת", href: "/savings/pre-retirement" },
  { icon: Wallet, title: "פוסט פרישה", description: "ניהול כספים בפרישה", href: "/savings/post-retirement" },
  { icon: Target, title: "תכנון פיננסי", description: "תוכנית מותאמת אישית", href: "/savings/financial-planning" },
];

const calculators = [
  { icon: Landmark, title: "מחשבון משכנתא", description: "חשבו החזר חודשי, ריביות ולוח סילוקין", color: "from-[#0a3d3d] to-[#0d5a5a]" },
  { icon: Wallet, title: "מחשבון פנסיה", description: "גלו כמה תקבלו בפנסיה ומהי ההפקדה האידיאלית", color: "from-[#0d4a4a] to-[#0a3d3d]" },
  { icon: PiggyBank, title: "מחשבון חיסכון", description: "תכננו את החיסכון — ריבית דריבית ותשואות", color: "from-[#062e2e] to-[#0d4a4a]" },
  { icon: BarChart3, title: "השוואת השקעות", description: "השוו בין מסלולי השקעה וקבלו תמונה מלאה", color: "from-[#0a3d3d] to-[#062e2e]" },
];

const partners = [
  "הפניקס", "מגדל", "הראל", "כלל", "מנורה מבטחים",
  "איילון", "הכשרה", "ביטוח ישיר", "שלמה", "AIG", "ליברה",
];

const faqItems = [
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "אנחנו משווים עבורכם את כל התוכניות בשוק, בוחנים את המצב הרפואי, הגיל והצרכים שלכם, וממליצים על הכיסוי המתאים ביותר — ללא עלות נוספת.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "קרן פנסיה היא מוצר קולקטיבי עם מנגנון ביטוח הדדי, בעוד ביטוח מנהלים הוא פוליסה אישית. ההמלצה תלויה בגיל, מצב בריאותי ומצב תעסוקתי.",
  },
  {
    question: "האם אפשר לעבור ביטוח ללא תקופת אכשרה?",
    answer: "במקרים רבים ניתן לעבור חברה עם שמירת ותק וללא תקופת אכשרה מחדש. אנחנו מוודאים שהמעבר נעשה בצורה חלקה ובטוחה.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "פגישת ייעוץ ראשונית אצלנו ללא עלות. אנחנו מאמינים שכל אדם זכאי לקבל תמונה מלאה של המצב הפנסיוני שלו.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כל חברות הביטוח בשוק — הפניקס, מגדל, הראל, כלל, מנורה מבטחים ועוד — כדי למצוא לכם את הפתרון הכי מתאים ומשתלם.",
  },
];

const trustPoints = [
  { icon: Award, title: "רישיון סוכן ביטוח פנסיוני", description: "מורשה ומפוקח ע״י רשות שוק ההון" },
  { icon: Building2, title: "חלק מבית עמיתים הון", description: "סוכנות ביטוח ופיננסים מבוססת ומוכרת" },
  { icon: UserCheck, title: "שירות אישי ונגיש", description: "מענה מהיר, ליווי צמוד ויחס אנושי" },
  { icon: Scale, title: "אובייקטיביות מלאה", description: "עבודה מול כל חברות הביטוח — ההמלצה הכי טובה עבורכם" },
];

const leadSubjects = [
  "ביטוח בריאות",
  "ביטוח חיים",
  "ביטוח רכב",
  "ביטוח דירה",
  "פנסיה וחיסכון",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "אחר",
];

// ── Animation variants ──
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" },
  }),
};

const Index = () => {
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", subject: "" });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.phone.trim()) {
      toast.error("נא למלא שם וטלפון");
      return;
    }
    setLeadSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: leadForm.name.trim(),
        email: `${leadForm.phone.trim()}@lead.seeld.co.il`,
        subject: leadForm.subject || "פנייה מהאתר",
        message: `[טופס ראשי] טלפון: ${leadForm.phone}\nנושא: ${leadForm.subject || "לא צוין"}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "insurance",
            leadData: {
              fullName: leadForm.name.trim(),
              phone: leadForm.phone.trim(),
              insuranceType: leadForm.subject || "פנייה כללית",
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
      setLeadForm({ name: "", phone: "", subject: "" });
    } catch {
      toast.error("שגיאה בשליחה, נסו שוב");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      toast.error("נא למלא שם וטלפון");
      return;
    }
    setContactSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert([{
        name: contactForm.name.trim(),
        email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
        subject: "פנייה מתחתית העמוד",
        message: `טלפון: ${contactForm.phone}\n\n${contactForm.message}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "insurance",
            leadData: {
              fullName: contactForm.name.trim(),
              phone: contactForm.phone.trim(),
              email: contactForm.email.trim(),
              insuranceType: "פנייה מתחתית העמוד",
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      toast.success("הפרטים נשלחו! נחזור אליכם בהקדם.");
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("שגיאה בשליחה, נסו שוב");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      <main>
        {/* ═══════════ 1. HERO ═══════════ */}
        <HeroSection />

        {/* ═══════════ 2. INLINE LEAD FORM ═══════════ */}
        <section className="relative -mt-1">
          <div className="bg-gradient-to-b from-[#041f1f] via-[#0a3d3d] to-[#0d4a4a] py-14 sm:py-16">
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(94,198,198,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(94,198,198,0.4) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }} />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
              <ScrollReveal>
                <div className="text-center mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    רוצים לשמוע עוד? השאירו פרטים
                  </h2>
                  <p className="text-white/40 text-sm">
                    נחזור אליכם תוך שעות עבודה ספורות
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <form onSubmit={handleLeadSubmit}>
                  <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.1] text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6]/50 transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.1] text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6]/50 transition-all"
                        dir="ltr"
                      />
                      <select
                        value={leadForm.subject}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.1] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6]/50 transition-all appearance-none cursor-pointer [&>option]:bg-[#0a3d3d] [&>option]:text-white"
                      >
                        <option value="" className="text-white/30">בחר נושא</option>
                        {leadSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <motion.button
                        type="submit"
                        disabled={leadSubmitting}
                        className="w-full px-6 py-3.5 rounded-xl bg-[#5ec6c6] text-[#0a3d3d] font-bold text-sm hover:bg-[#4db8b8] transition-all disabled:opacity-60 shadow-lg shadow-[#5ec6c6]/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שלחו לי הצעה"}
                      </motion.button>
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-white/30 text-xs">או חייגו: </span>
                      <a href="tel:0523097444" className="text-[#5ec6c6] text-xs font-semibold hover:underline" dir="ltr">052-309-7444</a>
                    </div>
                  </div>
                </form>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════ 3. QUICK SERVICES BAR ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <ScrollReveal>
            <div className="bg-background border border-border/40 rounded-2xl shadow-lg shadow-black/[0.03] p-5 sm:p-7">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-5">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex flex-col items-center gap-3 py-4 px-2 rounded-xl hover:bg-[#0a3d3d]/[0.04] dark:hover:bg-[#5ec6c6]/[0.06] transition-all duration-200 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a3d3d]/10 to-[#5ec6c6]/10 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center group-hover:from-[#0a3d3d]/18 group-hover:to-[#5ec6c6]/18 transition-all duration-200 group-hover:shadow-md group-hover:shadow-[#5ec6c6]/5">
                      <action.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════ 4. WHY SEELD ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                למה <span className="text-[#0a3d3d] dark:text-[#5ec6c6]">SEELD</span>?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                אנחנו מאמינים שביטחון פיננסי מגיע לכולם — ושהדרך לשם צריכה להיות פשוטה ואנושית
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whySeeld.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <motion.div
                  className="relative bg-background border border-border/40 rounded-2xl p-6 sm:p-7 hover:shadow-lg hover:border-[#5ec6c6]/20 transition-all duration-300 group h-full overflow-hidden"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Subtle corner accent */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-[#5ec6c6]/[0.04] to-transparent rounded-bl-none rounded-tl-2xl" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a3d3d]/10 to-[#5ec6c6]/10 dark:from-[#5ec6c6]/15 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-5 group-hover:from-[#0a3d3d]/16 group-hover:to-[#5ec6c6]/16 transition-all">
                      <item.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-base font-bold mb-2 group-hover:text-[#0a3d3d] dark:group-hover:text-[#5ec6c6] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ═══════════ 5. ALL INSURANCE TYPES GRID ═══════════ */}
        <section className="bg-muted/30 border-y border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-[#5ec6c6] text-xs font-bold tracking-widest uppercase mb-3">INSURANCE</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  ביטוח — הגנה מקיפה לכל תחום
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  מגוון פתרונות ביטוח מקיפים לכל תחומי החיים — הכל במקום אחד
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {insuranceTypes.map((item, i) => (
                <motion.div
                  key={item.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  variants={cardVariants}
                >
                  <Link to={item.href} className="block h-full">
                    <motion.div
                      className="h-full bg-background border border-border/40 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-[#5ec6c6]/25 transition-all duration-300 group"
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3 group-hover:from-[#0a3d3d]/16 group-hover:to-[#5ec6c6]/16 transition-all">
                        <item.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                      </div>
                      <h3 className="text-sm font-bold mb-1 group-hover:text-[#0a3d3d] dark:group-hover:text-[#5ec6c6] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-8">
                <Link
                  to="/insurances"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a3d3d] dark:text-[#5ec6c6] hover:underline"
                >
                  לכל הביטוחים שלנו
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════ 6. SAVINGS / PENSION GRID ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[#5ec6c6] text-xs font-bold tracking-widest uppercase mb-3">SAVINGS & PENSION</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                חיסכון ופנסיה — תכנון חכם לעתיד
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                בניית עתיד פיננסי חזק — קרנות פנסיה, חיסכון, השקעות ותכנון לפרישה
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {savingsProducts.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-30px" }}
                variants={cardVariants}
              >
                <Link to={item.href} className="block h-full">
                  <motion.div
                    className="h-full bg-background border border-border/40 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-[#5ec6c6]/25 transition-all duration-300 group"
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3 group-hover:from-[#0a3d3d]/16 group-hover:to-[#5ec6c6]/16 transition-all">
                      <item.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-sm font-bold mb-1 group-hover:text-[#0a3d3d] dark:group-hover:text-[#5ec6c6] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════ 7. CALCULATORS ═══════════ */}
        <section className="bg-muted/30 border-y border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <p className="text-[#5ec6c6] text-xs font-bold tracking-widest uppercase mb-3">TOOLS</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  המחשבונים שלנו
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  כלים חכמים שיעזרו לכם לקבל החלטות פיננסיות מושכלות
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {calculators.map((calc, i) => (
                <ScrollReveal key={calc.title} delay={i * 80}>
                  <Link to="/calculators" className="block h-full">
                    <motion.div
                      className="h-full rounded-2xl overflow-hidden group cursor-pointer"
                      whileHover={{ scale: 1.04, y: -5 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={`bg-gradient-to-br ${calc.color} p-6 sm:p-8 h-full flex flex-col relative overflow-hidden`}>
                        {/* Glassmorphism accent */}
                        <div className="absolute top-[-50%] right-[-30%] w-[80%] h-[80%] rounded-full bg-white/[0.03] blur-2xl" />
                        <motion.div
                          className="w-12 h-12 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.06] flex items-center justify-center mb-5 relative"
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <calc.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <h3 className="text-base font-bold text-white mb-2 relative">{calc.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed mb-6 flex-1 relative">{calc.description}</p>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#5ec6c6] group-hover:text-white transition-colors relative">
                          חשב עכשיו
                          <ChevronLeft className="w-4 h-4" />
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ 8. PARTNERS CAROUSEL ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 overflow-hidden">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                עובדים עם מיטב החברות
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                גישה לכל חברות הביטוח והפנסיה המובילות בישראל
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="relative">
              {/* Fade edges */}
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

              <motion.div
                className="flex gap-5 sm:gap-6"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                {[...partners, ...partners].map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="flex-shrink-0 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-muted/50 border border-border/30 backdrop-blur-sm"
                  >
                    <span className="text-sm sm:text-base font-semibold text-muted-foreground whitespace-nowrap">
                      {name}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════ 9. ABOUT / TRUST SECTION ═══════════ */}
        <section className="bg-[#0a3d3d] dark:bg-[#041f1f] relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(94,198,198,0.5) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Right side - About */}
              <ScrollReveal>
                <div className="space-y-6">
                  <div>
                    <p className="text-[#5ec6c6] text-xs font-bold tracking-widest uppercase mb-4">ABOUT</p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                      שמוליק מרציאנו
                    </h2>
                    <p className="text-[#5ec6c6] font-medium text-lg">סוכן ביטוח פנסיוני מורשה</p>
                  </div>
                  <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                    שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, מלווה לקוחות בצורה אישית ומקצועית.
                    SEELD הוא חלק מבית עמיתים הון — סוכנות ביטוח ופיננסים מבוססת.
                    אנחנו כאן כדי לעזור לכם להבין את עולם הביטוח והפנסיה בצורה פשוטה וברורה — בגובה העיניים, בלי ז׳רגון מיותר.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#0a3d3d] font-bold text-sm hover:bg-white/90 transition-all shadow-lg shadow-black/20"
                    >
                      קבעו פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 text-white font-semibold text-sm hover:bg-white/[0.06] transition-all backdrop-blur-sm"
                    >
                      עוד עלינו
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Left side - Trust points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trustPoints.map((point, i) => (
                  <ScrollReveal key={point.title} delay={i * 80}>
                    <motion.div
                      className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 backdrop-blur-md"
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#5ec6c6]/10 flex items-center justify-center mb-3">
                        <point.icon className="w-5 h-5 text-[#5ec6c6]" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{point.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{point.description}</p>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 10. FAQ PREVIEW ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[#5ec6c6] text-xs font-bold tracking-widest uppercase mb-3">FAQ</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                שאלות נפוצות
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                תשובות לשאלות שנשאלות הכי הרבה
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="bg-background border border-border/40 rounded-xl px-5 overflow-hidden"
                  >
                    <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline py-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="text-center mt-8">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a3d3d] dark:text-[#5ec6c6] hover:underline"
                >
                  לכל השאלות הנפוצות
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════ 11. CONTACT SECTION ═══════════ */}
        <section className="bg-muted/30 border-y border-border/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  צרו קשר
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  אנחנו כאן בשבילכם — בכל שאלה, התייעצות או בקשה
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ScrollReveal delay={0}>
                  <motion.a
                    href="tel:097742103"
                    className="block bg-background border border-border/40 rounded-xl p-5 hover:shadow-lg hover:border-[#5ec6c6]/25 transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3">
                      <Phone className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">טלפון</h3>
                    <p className="text-xs text-muted-foreground" dir="ltr">09-774-2103</p>
                  </motion.a>
                </ScrollReveal>

                <ScrollReveal delay={60}>
                  <motion.a
                    href="https://wa.me/972523097444"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-background border border-border/40 rounded-xl p-5 hover:shadow-lg hover:border-[#5ec6c6]/25 transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3">
                      <MessageCircle className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">וואטסאפ</h3>
                    <p className="text-xs text-muted-foreground" dir="ltr">052-309-7444</p>
                  </motion.a>
                </ScrollReveal>

                <ScrollReveal delay={120}>
                  <motion.a
                    href="mailto:info@seeld.co.il"
                    className="block bg-background border border-border/40 rounded-xl p-5 hover:shadow-lg hover:border-[#5ec6c6]/25 transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3">
                      <Mail className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">אימייל</h3>
                    <p className="text-xs text-muted-foreground">info@seeld.co.il</p>
                  </motion.a>
                </ScrollReveal>

                <ScrollReveal delay={180}>
                  <motion.div
                    className="bg-background border border-border/40 rounded-xl p-5"
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a3d3d]/8 to-[#5ec6c6]/8 dark:from-[#5ec6c6]/10 dark:to-[#5ec6c6]/5 flex items-center justify-center mb-3">
                      <MapPin className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">משרדים</h3>
                    <p className="text-xs text-muted-foreground">רעננה | ירושלים</p>
                  </motion.div>
                </ScrollReveal>
              </div>

              {/* Inline Contact Form */}
              <ScrollReveal delay={100}>
                <div className="bg-background border border-border/40 rounded-2xl p-6 sm:p-8">
                  <h3 className="text-lg font-bold mb-6">השאירו פרטים ונחזור אליכם</h3>
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                        dir="ltr"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="אימייל (לא חובה)"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                    />
                    <textarea
                      placeholder="במה נוכל לעזור?"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all resize-none"
                    />
                    <motion.button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full px-6 py-3.5 rounded-xl bg-[#0a3d3d] text-white font-bold text-sm hover:bg-[#0d4a4a] transition-colors disabled:opacity-60"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שליחה"}
                    </motion.button>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════ 12. AGENT CTA ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <ScrollReveal>
            <div className="relative rounded-2xl border border-border/40 bg-background overflow-hidden">
              {/* Subtle accent gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0a3d3d] via-[#5ec6c6] to-[#0a3d3d]" />
              <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-right">
                  <h3 className="text-xl sm:text-2xl font-bold">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    פורטל SEELD לסוכנים — ניהול לקוחות, מעקב פוליסות וכלי עבודה חכמים במקום אחד.
                  </p>
                </div>
                <Link to="/app/auth" className="w-full sm:w-auto flex-shrink-0">
                  <motion.span
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0a3d3d] text-white font-bold hover:bg-[#0d4a4a] transition-all w-full sm:w-auto text-sm shadow-lg shadow-[#0a3d3d]/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogIn className="w-4 h-4" />
                    כניסה לפורטל סוכנים
                  </motion.span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
