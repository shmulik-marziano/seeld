import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall,
  Shield, Users, Award, Home, Plane, Heart, Baby, Briefcase, Umbrella,
  Building2, HandCoins, TrendingUp, GraduationCap, UserCheck,
  Wallet, BarChart3, HelpCircle, Mail, MapPin, Phone,
  MessageCircle, ChevronLeft, Stethoscope, Key, Globe,
  Scale, Activity, Target, CalendarCheck, Loader2, Zap, Handshake,
  FileText, ShieldCheck, HeartHandshake, Search, UserPlus
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
  { icon: Landmark, label: "תכנון פנסיוני", href: "/savings/pension-funds", color: "#5ec6c6" },
  { icon: HeartPulse, label: "ביטוח חיים ובריאות", href: "/insurance/health", color: "#e76f51" },
  { icon: Home, label: "ביטוח רכוש", href: "/insurance/apartment", color: "#f4a261" },
  { icon: PiggyBank, label: "חיסכון והשקעות", href: "/savings/gemel-investment", color: "#90be6d" },
  { icon: Calculator, label: "מחשבונים", href: "/calculators", color: "#6c63ff" },
  { icon: PhoneCall, label: "צור קשר", href: "/contact", color: "#e07cc6" },
];

const accentColors = ["#5ec6c6", "#f4a261", "#90be6d", "#e76f51"];

const whySeeld = [
  {
    icon: Users,
    title: "שירות אישי בגובה העיניים",
    description: "לא קול סנטר ולא צ׳אטבוט — אתם מדברים ישירות עם שמוליק. מענה אנושי, ליווי צמוד, יחס אישי.",
    accent: "#5ec6c6",
  },
  {
    icon: Handshake,
    title: "סוכנות מבוססת ומוכרת",
    description: "סוכנות ביטוח ופיננסים עם מוניטין ארוך שנים, מפוקחת ומורשית. אתם בידיים טובות.",
    accent: "#f4a261",
  },
  {
    icon: Scale,
    title: "עבודה עם כל החברות",
    description: "לא משווקים חברה אחת — אנחנו משווים את כל השוק ומוצאים את הפתרון הכי טוב עבורכם.",
    accent: "#90be6d",
  },
  {
    icon: Zap,
    title: "טכנולוגיה מתקדמת",
    description: "כלים דיגיטליים חכמים — מחשבונים, פורטל לקוחות, מעקב פוליסות — הכל זמין ונגיש.",
    accent: "#e76f51",
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
  { icon: Landmark, title: "מחשבון משכנתא", description: "חשבו החזר חודשי, ריביות ולוח סילוקין", color: "#5ec6c6" },
  { icon: Wallet, title: "מחשבון פנסיה", description: "גלו כמה תקבלו בפנסיה ומהי ההפקדה האידיאלית", color: "#f4a261" },
  { icon: PiggyBank, title: "מחשבון חיסכון", description: "תכננו את החיסכון — ריבית דריבית ותשואות", color: "#90be6d" },
  { icon: BarChart3, title: "השוואת השקעות", description: "השוו בין מסלולי השקעה וקבלו תמונה מלאה", color: "#e76f51" },
];

const partners = [
  "הפניקס", "מגדל", "הראל", "כלל", "מנורה מבטחים",
  "איילון", "מיטב", "ילין לפידות", "אנליסט", "אלטשולר שחם", "הכשרה",
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
  { icon: Award, title: "רישיון סוכן ביטוח פנסיוני", description: "מורשה ומפוקח ע״י רשות שוק ההון", accent: "#5ec6c6" },
  { icon: Building2, title: "סוכנות מבוססת ומוכרת", description: "SEELD — סוכנות לפיננסים וביטוח, מפוקחת ומורשית", accent: "#f4a261" },
  { icon: UserCheck, title: "שירות אישי ונגיש", description: "מענה מהיר, ליווי צמוד ויחס אנושי", accent: "#90be6d" },
  { icon: Scale, title: "אובייקטיביות מלאה", description: "עבודה מול כל חברות הביטוח — ההמלצה הכי טובה עבורכם", accent: "#e76f51" },
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

// ── Reusable Design Components ──

const WaveDivider = ({ color = '#f8f9fc', flip = false }: { color?: string; flip?: boolean }) => (
  <div className={flip ? 'rotate-180' : ''} aria-hidden="true">
    <svg viewBox="0 0 1440 80" fill="none" className="w-full h-[40px] sm:h-[60px]">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z" fill={color} />
    </svg>
  </div>
);

const SectionLabel = ({ children }: { children: string }) => (
  <p className="text-[#5ec6c6] text-xs font-bold tracking-[0.2em] uppercase mb-4">{children}</p>
);

const processSteps = [
  {
    number: 1,
    title: "פנייה ראשונית",
    description: "פונים אלינו בטלפון, WhatsApp או דרך האתר",
    icon: PhoneCall,
    color: "#5ec6c6",
  },
  {
    number: 2,
    title: "פגישת היכרות",
    description: "נפגשים, מבינים את הצרכים שלכם לעומק",
    icon: UserPlus,
    color: "#f4a261",
  },
  {
    number: 3,
    title: "ניתוח והצעה",
    description: "מנתחים את המצב הקיים ומגישים הצעה מותאמת",
    icon: Search,
    color: "#90be6d",
  },
  {
    number: 4,
    title: "ליווי שוטף",
    description: "מלווים אתכם לאורך כל הדרך, תמיד זמינים",
    icon: HeartHandshake,
    color: "#e76f51",
  },
];

const RegulatoryBadgesBar = () => (
  <div className="bg-[#0a3d3d] py-10 sm:py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center text-center">
        {[
          { icon: FileText, text: "בעלי רישיון סוכנות ביטוח\nמטעם משרד האוצר", color: "#5ec6c6" },
          { icon: ShieldCheck, text: "לשכת סוכני הביטוח\nבישראל", color: "#f4a261" },
          { icon: Handshake, text: "חברים בלשכת סוכני\nהביטוח בישראל", color: "#90be6d" },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: item.color, boxShadow: `0 4px 16px ${item.color}30` }}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/80 text-sm font-medium leading-snug whitespace-pre-line">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        {/* 1. HERO */}
        <HeroSection />

        {/* 2. INLINE LEAD FORM - Light gray background */}
        <section className="relative bg-[#f8f9fc]">
          <div className="py-16 sm:py-20">
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
              <ScrollReveal>
                <div className="text-center mb-10 relative">
                  <div className="absolute top-0 right-[15%] w-4 h-4 rounded-full bg-[#e76f51] opacity-20 hidden sm:block" />
                  <div className="absolute top-6 left-[18%] w-3 h-3 rounded-full bg-[#90be6d] opacity-25 hidden sm:block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3">
                    רוצים <span className="text-[#5ec6c6]">לשמוע עוד?</span>
                  </h2>
                  <p className="text-[#0a3d3d]/40 text-base sm:text-lg">
                    השאירו פרטים ונחזור אליכם תוך שעות עבודה ספורות
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <form onSubmit={handleLeadSubmit}>
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-[#0a3d3d]/[0.04]">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] placeholder:text-[#0a3d3d]/30 text-sm focus:outline-none focus:border-[#5ec6c6] transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] placeholder:text-[#0a3d3d]/30 text-sm focus:outline-none focus:border-[#5ec6c6] transition-all"
                        dir="ltr"
                      />
                      <select
                        value={leadForm.subject}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-sm focus:outline-none focus:border-[#5ec6c6] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="text-[#0a3d3d]/30">בחר נושא</option>
                        {leadSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <motion.button
                        type="submit"
                        disabled={leadSubmitting}
                        className="w-full px-6 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-sm hover:bg-[#0d4a4a] transition-all disabled:opacity-60 shadow-lg shadow-[#0a3d3d]/15"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שלחו לי הצעה"}
                      </motion.button>
                    </div>
                    <div className="text-center mt-5">
                      <span className="text-[#0a3d3d]/30 text-xs">או חייגו: </span>
                      <a href="tel:0523097444" className="text-[#5ec6c6] text-xs font-bold hover:underline" dir="ltr">052-309-7444</a>
                    </div>
                  </div>
                </form>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* 3. QUICK SERVICES BAR */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <div className="bg-white border border-[#0a3d3d]/[0.06] rounded-3xl shadow-xl shadow-[#0a3d3d]/[0.03] p-6 sm:p-8">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex flex-col items-center gap-3 py-5 px-2 rounded-2xl hover:bg-[#f8f9fc] transition-all duration-200 group"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 group-hover:shadow-lg group-hover:scale-110 shadow-md"
                      style={{ backgroundColor: action.color, boxShadow: `0 6px 20px ${action.color}35` }}
                    >
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-bold text-[#0a3d3d]/70 group-hover:text-[#0a3d3d] transition-colors text-center leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* 4. WHY SEELD */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-20 relative">
              <div className="absolute top-1 right-[12%] w-5 h-5 rounded-full bg-[#5ec6c6] opacity-20 hidden sm:block" />
              <div className="absolute top-10 left-[10%] w-4 h-4 rounded-full bg-[#f4a261] opacity-25 hidden sm:block" />
              <SectionLabel>WHY SEELD</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                למה <span className="text-[#5ec6c6]">SEELD</span>?
              </h2>
              <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                אנחנו מאמינים שביטחון פיננסי מגיע לכולם — ושהדרך לשם צריכה להיות פשוטה ואנושית
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {whySeeld.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <motion.div
                  className="relative bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-7 sm:p-8 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 group h-full overflow-hidden"
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Solid colored accent circle at top-left */}
                  <div
                    className="absolute top-5 left-5 w-5 h-5 rounded-full opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all"
                    style={{ backgroundColor: item.accent }}
                  />
                  {/* Small dashed connector from circle to icon */}
                  <svg className="absolute top-[28px] left-[38px] w-[30px] h-[30px]" viewBox="0 0 30 30" fill="none" aria-hidden="true">
                    <path d="M0,2 C10,2 20,15 28,28" stroke={item.accent} strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" opacity="0.3"/>
                  </svg>
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all shadow-md"
                      style={{ backgroundColor: item.accent, boxShadow: `0 6px 20px ${item.accent}30` }}
                    >
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-extrabold mb-3 text-[#0a3d3d] group-hover:text-[#0a3d3d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#0a3d3d]/45 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Wave to gray section */}
        <WaveDivider color="#f8f9fc" />

        {/* 5. ALL INSURANCE TYPES GRID */}
        <section className="bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <ScrollReveal>
              <div className="text-center mb-14 sm:mb-20 relative">
                {/* Decorative solid circles */}
                <div className="absolute top-0 right-[10%] w-6 h-6 rounded-full bg-[#e76f51] opacity-20 hidden sm:block" />
                <div className="absolute top-8 left-[12%] w-4 h-4 rounded-full bg-[#5ec6c6] opacity-25 hidden sm:block" />
                <SectionLabel>INSURANCE</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                  ביטוח — <span className="text-[#e76f51]">הגנה מקיפה</span>
                </h2>
                <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                  מגוון פתרונות ביטוח מקיפים לכל תחומי החיים — הכל במקום אחד
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
                      className="h-full bg-white border border-[#0a3d3d]/[0.06] rounded-xl p-5 sm:p-6 transition-all duration-300 group"
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={{ duration: 0.2 }}
                      style={{ borderRightWidth: '3px', borderRightColor: 'transparent' }}
                      onHoverStart={(e) => {
                        const el = e as unknown as { target: HTMLElement };
                        if (el.target && el.target.style) {
                          el.target.style.borderRightColor = accentColors[i % accentColors.length];
                        }
                      }}
                      onHoverEnd={(e) => {
                        const el = e as unknown as { target: HTMLElement };
                        if (el.target && el.target.style) {
                          el.target.style.borderRightColor = 'transparent';
                        }
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all shadow-sm"
                        style={{ backgroundColor: accentColors[i % accentColors.length], boxShadow: `0 4px 14px ${accentColors[i % accentColors.length]}25` }}
                      >
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-extrabold mb-1 text-[#0a3d3d] group-hover:text-[#0a3d3d] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#0a3d3d]/40">{item.description}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-10">
                <Link
                  to="/insurances"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0a3d3d] hover:text-[#5ec6c6] transition-colors"
                >
                  לכל הביטוחים שלנו
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Wave: gray -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* 6. SAVINGS / PENSION GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-20 relative">
              {/* Decorative solid circles */}
              <div className="absolute top-2 left-[8%] w-5 h-5 rounded-full bg-[#90be6d] opacity-25 hidden sm:block" />
              <div className="absolute top-10 right-[15%] w-3 h-3 rounded-full bg-[#f4a261] opacity-20 hidden sm:block" />
              <SectionLabel>SAVINGS & PENSION</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                חיסכון <span className="text-[#90be6d]">ופנסיה</span>
              </h2>
              <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                בניית עתיד פיננסי חזק — קרנות פנסיה, חיסכון, השקעות ותכנון לפרישה
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
                    className="h-full bg-white border border-[#0a3d3d]/[0.06] rounded-xl p-5 sm:p-6 transition-all duration-300 group hover:shadow-lg"
                    whileHover={{ scale: 1.03, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all shadow-sm"
                      style={{ backgroundColor: accentColors[i % accentColors.length], boxShadow: `0 4px 14px ${accentColors[i % accentColors.length]}25` }}
                    >
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-sm font-extrabold mb-1 text-[#0a3d3d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#0a3d3d]/40">{item.description}</p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Wave: white -> gray */}
        <WaveDivider color="#f8f9fc" />

        {/* 7. CALCULATORS */}
        <section className="bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <ScrollReveal>
              <div className="text-center mb-14 sm:mb-20 relative">
                <div className="absolute top-0 right-[12%] w-5 h-5 rounded-full bg-[#6c63ff] opacity-20 hidden sm:block" />
                <div className="absolute top-12 left-[10%] w-4 h-4 rounded-full bg-[#f4a261] opacity-20 hidden sm:block" />
                <SectionLabel>TOOLS</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                  <span className="text-[#6c63ff]">המחשבונים</span> שלנו
                </h2>
                <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                  כלים חכמים שיעזרו לכם לקבל החלטות פיננסיות מושכלות
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {calculators.map((calc, i) => (
                <ScrollReveal key={calc.title} delay={i * 80}>
                  <Link to="/calculators" className="block h-full">
                    <motion.div
                      className="h-full bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-7 sm:p-8 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 group overflow-hidden relative"
                      whileHover={{ scale: 1.04, y: -5 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Colored top bar */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2" style={{ backgroundColor: calc.color }} />
                      {/* Decorative small circle accent */}
                      <div className="absolute top-4 left-4 w-4 h-4 rounded-full opacity-30 group-hover:opacity-50 transition-opacity" style={{ backgroundColor: calc.color }} />
                      <motion.div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-6 relative shadow-md"
                        style={{ backgroundColor: calc.color, boxShadow: `0 6px 20px ${calc.color}30` }}
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <calc.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-2 relative">{calc.title}</h3>
                      <p className="text-sm text-[#0a3d3d]/40 leading-relaxed mb-6 flex-1 relative">{calc.description}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-bold group-hover:text-[#0a3d3d] transition-colors relative" style={{ color: calc.color }}>
                        חשב עכשיו
                        <ChevronLeft className="w-4 h-4" />
                      </span>
                    </motion.div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Wave: gray -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* 8. PARTNERS - Clean badge row */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16 relative">
              <div className="absolute top-1 left-[15%] w-4 h-4 rounded-full bg-[#5ec6c6] opacity-25 hidden sm:block" />
              <SectionLabel>PARTNERS</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                עובדים עם <span className="text-[#5ec6c6]">מיטב החברות</span>
              </h2>
              <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                גישה לכל חברות הביטוח והפנסיה המובילות בישראל
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {partners.map((name) => (
                <span
                  key={name}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] text-sm sm:text-base font-bold text-[#0a3d3d]/50 hover:text-[#0a3d3d] hover:border-[#5ec6c6]/30 hover:bg-white transition-all duration-200 cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Wave: white -> dark */}
        <WaveDivider color="#0a3d3d" />

        {/* 9. ABOUT / TRUST SECTION */}
        <section className="bg-[#0a3d3d] relative overflow-hidden">
          {/* Background decorative solid circles */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-[8%] left-[3%] w-[180px] h-[180px] rounded-full bg-[#5ec6c6]/[0.06]" />
            <div className="absolute bottom-[8%] right-[3%] w-[140px] h-[140px] rounded-full bg-[#f4a261]/[0.06]" />
            <div className="absolute top-[50%] left-[40%] w-[60px] h-[60px] rounded-full bg-[#90be6d]/[0.05]" />
            {/* Dashed connector */}
            <svg className="absolute top-[15%] right-[10%] w-[200px] h-[200px] hidden lg:block" viewBox="0 0 200 200" fill="none">
              <path d="M180,20 C140,60 60,80 20,180" stroke="#5ec6c6" strokeWidth="1.5" strokeDasharray="8 6" strokeLinecap="round" opacity="0.1"/>
            </svg>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Right side - About */}
              <ScrollReveal>
                <div className="space-y-7">
                  <div>
                    <SectionLabel>ABOUT</SectionLabel>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
                      שמוליק מרציאנו
                    </h2>
                    <p className="text-[#5ec6c6] font-semibold text-xl">סוכן ביטוח פנסיוני מורשה</p>
                  </div>
                  <p className="text-white/45 text-base sm:text-lg leading-relaxed">
                    שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, מלווה לקוחות בצורה אישית ומקצועית.
                    SEELD — סוכנות לפיננסים וביטוח, מפוקחת ומורשית.
                    אנחנו כאן כדי לעזור לכם להבין את עולם הביטוח והפנסיה בצורה פשוטה וברורה — בגובה העיניים, בלי ז׳רגון מיותר.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#0a3d3d] font-bold text-base hover:bg-white/90 transition-all shadow-xl shadow-black/20"
                    >
                      קבעו פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/15 text-white font-semibold text-base hover:bg-white/[0.06] transition-all"
                    >
                      עוד עלינו
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Left side - Trust points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {trustPoints.map((point, i) => (
                  <ScrollReveal key={point.title} delay={i * 80}>
                    <motion.div
                      className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md"
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-md"
                        style={{ backgroundColor: point.accent, boxShadow: `0 6px 18px ${point.accent}30` }}
                      >
                        <point.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1.5">{point.title}</h3>
                      <p className="text-sm text-white/35 leading-relaxed">{point.description}</p>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Wave: dark -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* PROCESS TIMELINE with dashed SVG connectors */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <ScrollReveal>
            <div className="text-center mb-14 sm:mb-20 relative">
              <div className="absolute top-0 right-[8%] w-5 h-5 rounded-full bg-[#f4a261] opacity-25 hidden sm:block" />
              <div className="absolute top-10 left-[14%] w-3 h-3 rounded-full bg-[#e76f51] opacity-20 hidden sm:block" />
              <SectionLabel>PROCESS</SectionLabel>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                איך <span className="text-[#f4a261]">מתחילים?</span>
              </h2>
              <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                תהליך פשוט וברור — מהפנייה הראשונה ועד ליווי שוטף
              </p>
            </div>
          </ScrollReveal>

          <div className="relative">
            {/* Dashed vertical connector line for desktop */}
            <svg className="absolute right-1/2 top-0 bottom-0 w-[40px] h-full hidden md:block" style={{ transform: 'translateX(50%)' }} aria-hidden="true">
              <line
                x1="20" y1="30" x2="20" y2="100%"
                stroke="#0a3d3d"
                strokeWidth="2"
                strokeDasharray="8 8"
                opacity="0.12"
              />
            </svg>

            <div className="space-y-8 md:space-y-14">
              {processSteps.map((step, i) => (
                <ScrollReveal key={step.number} delay={i * 100}>
                  <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    {/* Card */}
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                      <motion.div
                        className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-7 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 relative overflow-hidden"
                        whileHover={{ y: -3, scale: 1.02 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Decorative corner circle */}
                        <div className="absolute top-[-12px] left-[-12px] w-10 h-10 rounded-full opacity-15" style={{ backgroundColor: step.color }} />
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: step.color }}>
                            <step.icon className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-extrabold text-[#0a3d3d]">{step.title}</h3>
                        </div>
                        <p className="text-sm text-[#0a3d3d]/45 leading-relaxed">{step.description}</p>
                      </motion.div>
                    </div>

                    {/* Number circle - each step gets its own color */}
                    <div className="relative z-10 flex-shrink-0 order-first md:order-none">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                        style={{ backgroundColor: step.color, boxShadow: `0 8px 24px ${step.color}30` }}
                      >
                        <span className="text-white font-extrabold text-xl">{step.number}</span>
                      </div>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="flex-1 hidden md:block" />
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Decorative dashed curved lines between steps - desktop only */}
            <svg className="absolute top-0 left-0 w-full h-full hidden md:block pointer-events-none" aria-hidden="true">
              <path
                d="M50%,80 C55%,120 45%,160 50%,200"
                stroke="#0a3d3d"
                strokeWidth="1.5"
                strokeDasharray="6 5"
                fill="none"
                opacity="0.06"
              />
            </svg>
          </div>
        </section>

        {/* Wave: white -> gray */}
        <WaveDivider color="#f8f9fc" />

        {/* 10. FAQ PREVIEW */}
        <section className="bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <ScrollReveal>
              <div className="text-center mb-14 sm:mb-20 relative">
                <div className="absolute top-1 right-[10%] w-4 h-4 rounded-full bg-[#ff6b9d] opacity-25 hidden sm:block" />
                <div className="absolute top-8 left-[8%] w-5 h-5 rounded-full bg-[#5ec6c6] opacity-20 hidden sm:block" />
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                  שאלות <span className="text-[#ff6b9d]">נפוצות</span>
                </h2>
                <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                  תשובות לשאלות שנשאלות הכי הרבה
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="max-w-2xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqItems.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="bg-white border border-[#0a3d3d]/[0.06] rounded-xl px-6 overflow-hidden shadow-sm"
                    >
                      <AccordionTrigger className="text-sm sm:text-base font-bold hover:no-underline py-5 text-[#0a3d3d]">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: accentColors[i % accentColors.length], boxShadow: `0 2px 8px ${accentColors[i % accentColors.length]}40` }} />
                          {item.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-[#0a3d3d]/50 leading-relaxed pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="text-center mt-10">
                  <Link
                    to="/faq"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0a3d3d] hover:text-[#5ec6c6] transition-colors"
                  >
                    לכל השאלות הנפוצות
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Wave: gray -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* 11. CONTACT SECTION */}
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-14 sm:mb-20 relative">
                <div className="absolute top-0 left-[10%] w-5 h-5 rounded-full bg-[#e76f51] opacity-20 hidden sm:block" />
                <div className="absolute top-12 right-[12%] w-3 h-3 rounded-full bg-[#90be6d] opacity-25 hidden sm:block" />
                <SectionLabel>CONTACT</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a3d3d] mb-4">
                  צרו קשר
                </h2>
                <p className="text-[#0a3d3d]/40 text-base sm:text-lg max-w-xl mx-auto">
                  אנחנו כאן בשבילכם — בכל שאלה, התייעצות או בקשה
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Contact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: Phone, title: "טלפון", info: "09-774-2103", href: "tel:097742103", color: "#5ec6c6", dir: "ltr" },
                  { icon: MessageCircle, title: "וואטסאפ", info: "052-309-7444", href: "https://wa.me/972523097444", color: "#90be6d", dir: "ltr", external: true },
                  { icon: Mail, title: "אימייל", info: "info@seeld.co.il", href: "mailto:info@seeld.co.il", color: "#f4a261" },
                  { icon: MapPin, title: "משרדים", info: "רעננה | ירושלים", color: "#e76f51" },
                ].map((item, i) => (
                  <ScrollReveal key={item.title} delay={i * 60}>
                    <motion.div
                      className="block bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#0a3d3d]/[0.04] transition-all duration-300 cursor-pointer"
                      whileHover={{ scale: 1.03, y: -3 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => item.href && window.open(item.href, item.external ? '_blank' : '_self')}
                    >
                      <div
                        className="w-13 h-13 rounded-full flex items-center justify-center mb-4 shadow-md w-[52px] h-[52px]"
                        style={{ backgroundColor: item.color, boxShadow: `0 4px 16px ${item.color}25` }}
                      >
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-bold text-[#0a3d3d] mb-1">{item.title}</h3>
                      <p className="text-sm text-[#0a3d3d]/40" dir={item.dir}>{item.info}</p>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>

              {/* Inline Contact Form */}
              <ScrollReveal delay={100}>
                <div className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-7 sm:p-9 shadow-lg shadow-[#0a3d3d]/[0.03]">
                  <h3 className="text-xl font-extrabold text-[#0a3d3d] mb-7">השאירו פרטים ונחזור אליכם</h3>
                  <form className="space-y-5" onSubmit={handleContactSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all"
                        dir="ltr"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="אימייל (לא חובה)"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all"
                    />
                    <textarea
                      placeholder="במה נוכל לעזור?"
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all resize-none"
                    />
                    <motion.button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full px-6 py-4 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-colors disabled:opacity-60 shadow-lg shadow-[#0a3d3d]/15"
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

        {/* 12. AGENT CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <ScrollReveal>
            <div className="relative rounded-3xl border border-[#0a3d3d]/[0.06] bg-white overflow-hidden shadow-lg shadow-[#0a3d3d]/[0.03]">
              {/* Colored accent bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#5ec6c6] via-[#f4a261] to-[#90be6d]" />
              {/* Decorative circle */}
              <div className="absolute top-[-60px] left-[-60px] w-[180px] h-[180px] rounded-full bg-[#5ec6c6]/[0.04]" />
              <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 relative">
                <div className="space-y-3 text-center sm:text-right">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d]">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                  <p className="text-base text-[#0a3d3d]/40 max-w-md">
                    פורטל SEELD לסוכנים — ניהול לקוחות, מעקב פוליסות וכלי עבודה חכמים במקום אחד.
                  </p>
                </div>
                <Link to="/app/auth" className="w-full sm:w-auto flex-shrink-0">
                  <motion.span
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-[#0a3d3d] text-white font-bold hover:bg-[#0d4a4a] transition-all w-full sm:w-auto text-base shadow-lg shadow-[#0a3d3d]/15"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogIn className="w-5 h-5" />
                    כניסה לפורטל סוכנים
                  </motion.span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Regulatory badges are in Footer */}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
