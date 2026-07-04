import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall,
  Shield, Users, Home, Plane, Heart, Baby, Briefcase, Umbrella,
  Building2, HandCoins, TrendingUp, GraduationCap, UserCheck,
  Wallet, BarChart3, Mail, MapPin, Phone,
  MessageCircle, ChevronLeft, Stethoscope, Key, Globe,
  Scale, Activity, Target, CalendarCheck, Loader2, Zap, Handshake,
  Search, ArrowDownLeft, Award,
  Bot, LayoutDashboard, LineChart, Compass, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import CompanyLogos from "@/components/CompanyLogos";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

// ── Design tokens ──
const INK = "#0b1114";
const ACCENT = "#14b8a6";
const ACCENT_BRIGHT = "#2dd4bf";
const LIGHT = "#f6f8f9";

// ── Data ──

const quickActions = [
  { icon: Landmark, label: "תכנון פנסיוני", href: "/savings/pension-funds" },
  { icon: HeartPulse, label: "ביטוח חיים ובריאות", href: "/insurance/health" },
  { icon: Home, label: "ביטוח רכוש", href: "/insurance/home" },
  { icon: PiggyBank, label: "חיסכון והשקעות", href: "/savings/gemel-investment" },
  { icon: Calculator, label: "מחשבונים", href: "/calculators" },
  { icon: PhoneCall, label: "צור קשר", href: "/contact" },
];

const whySeeld = [
  {
    icon: Users,
    title: "יועץ אישי לכל לקוח",
    description: "כל לקוח בבית משובץ ליועץ ייעודי. אותו אדם מכיר את התיק, את הצרכים ואת המשפחה. קשר מקצועי, לא מוקד מתחלף.",
  },
  {
    icon: Handshake,
    title: "עצמאות מלאה",
    description: "אין לנו יעדי מכירה של חברה ספציפית. אין בונוסים לקידום מוצר. ההמלצה מבוססת על מה שמתאים ללקוח, ולא על מה שמשתלם לנו.",
  },
  {
    icon: Scale,
    title: "12 חברות בהשוואה",
    description: "הראל, מגדל, כלל, הפניקס, איילון, מנורה, מיטב ועוד. גישה מקצועית לכל השחקניות המובילות בשוק הישראלי בזמן אמת.",
  },
  {
    icon: Zap,
    title: "תשתית טכנולוגית",
    description: "פורטל לקוחות, מערכת ניהול תיקים וכלי השוואה מתקדמים. הטכנולוגיה מאפשרת לנו להתמקד במה שחשוב באמת: הייעוץ.",
  },
];

const insuranceTypes = [
  { icon: Car, title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳ — השוואה בין כל החברות בדקות", href: "/insurance/vehicle" },
  { icon: HeartPulse, title: "ביטוח בריאות", description: "ניתוחים, תרופות וטיפולים — כיסוי שמשלים את הסל ולא כופל אותו", href: "/insurance/health" },
  { icon: Heart, title: "ביטוח חיים", description: "הגנה כלכלית למשפחה. לא מה שמנסים למכור לך — מה שאתה באמת צריך", href: "/insurance/life" },
  { icon: Home, title: "ביטוח דירה", description: "מבנה ותכולה — שלא תגלו שמשהו חסר אחרי שכבר מאוחר", href: "/insurance/home" },
  { icon: Key, title: "ביטוח שוכרים", description: "כיסוי תכולה ואחריות צד ג׳ לשוכרים", href: "/insurance/renters" },
  { icon: Building2, title: "ביטוח עסקי", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק", href: "/insurance/business" },
  { icon: Plane, title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", href: "/insurance/travel" },
  { icon: Stethoscope, title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { icon: Activity, title: "אובדן כושר עבודה", description: "תשלום חודשי אם לא תוכלו לעבוד", href: "/insurance/disability" },
  { icon: UserCheck, title: "ביטוח סיעודי", description: "מימון טיפול סיעודי בבית או במוסד", href: "/insurance/nursing" },
  { icon: Landmark, title: "ביטוח משכנתא", description: "שמירה על הדירה גם במקרה בלתי צפוי", href: "/insurance/mortgage" },
  { icon: Shield, title: "מחלות קשות", description: "פיצוי כספי חד-פעמי עם אבחון מחלה", href: "/insurance/critical-illness" },
  { icon: Umbrella, title: "תאונות אישיות", description: "פיצוי על ימי אשפוז, שבר או נכות מתאונה", href: "/insurance/accidents" },
  { icon: Briefcase, title: "ביטוח שותפים", description: "רציפות עסקית במקרה של אובדן שותף", href: "/insurance/partners" },
  { icon: Globe, title: "עובדים זרים", description: "ביטוח חובה בהתאם לחוק", href: "/insurance/foreign-workers" },
  { icon: Heart, title: "סיעודי כללית", description: "כיסוי סיעודי משלים לחברי כללית", href: "/insurance/nursing-clalit" },
];

const savingsProducts = [
  { icon: Landmark, title: "קרנות פנסיה", description: "הפקדות, כיסויים ומסלול נכון — כי ברירת המחדל היא לא תמיד הכי טובה", href: "/savings/pension-funds" },
  { icon: PiggyBank, title: "קופות גמל", description: "חיסכון לטווח ארוך עם הטבות מס", href: "/savings/gemel-funds" },
  { icon: HandCoins, title: "גמל להשקעה", description: "חיסכון נזיל בשוק ההון — בלי שקופות ובלי תקופות נעילה", href: "/savings/gemel-investment" },
  { icon: Baby, title: "חיסכון לכל ילד", description: "ניהול כספי התוכנית הממשלתית", href: "/savings/child-savings" },
  { icon: GraduationCap, title: "קרנות השתלמות", description: "חיסכון לשש שנים עם פטור ממס", href: "/savings/training-funds" },
  { icon: TrendingUp, title: "השקעות", description: "בחירת מסלולי השקעה ומעקב תשואות", href: "/savings/investment" },
  { icon: Heart, title: "ביטוח חיים פנסיוני", description: "חיסכון עם כיסוי למקרה מוות ונכות", href: "/insurance/life" },
  { icon: Building2, title: "קופות מעסיקים", description: "הפקדות לעובדים, ציות לחוק ובחירת מוצרים", href: "/savings/employer-funds" },
  { icon: CalendarCheck, title: "טרום פרישה", description: "עוד 5-10 שנים לפנסיה? עכשיו זה הזמן לבדוק שהכל מסודר", href: "/savings/pre-retirement" },
  { icon: Wallet, title: "לאחר פרישה", description: "משיכת כספים, קצבאות ותכנון מס — שלא תפסידו שקל מיותר", href: "/savings/post-retirement" },
  { icon: Target, title: "תכנון פיננסי", description: "מיפוי מלא של הנכסים ובניית תוכנית", href: "/savings/financial-planning" },
];

const digitalCapabilities: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  href?: string;
  badge?: string;
}[] = [
  { icon: LayoutDashboard, title: "אזור אישי ללקוח", description: "כל הפוליסות, החיסכון והמסמכים שלכם במקום אחד — מעודכן, מאובטח ונגיש מכל מכשיר.", href: "/personal-area", cta: "כניסה לאזור האישי" },
  { icon: Bot, title: "יועץ SEELD AI", description: "עונה על שאלות ביטוח, פנסיה וחיסכון בכל שעה — ומחבר אתכם ליועץ אנושי כשצריך.", cta: "פתיחת שיחה", badge: "24/7" },
  { icon: Search, title: "איתור קרנות חכם", description: "מנוע חיפוש והשוואה לקרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות בישראל.", href: "/fund-finder", cta: "חיפוש קרן" },
  { icon: LineChart, title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש — להשוואה שקופה בין החברות.", href: "/return-tables", cta: "צפייה בנתונים" },
  { icon: Compass, title: "מדריך מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין כל מסלולי ההשקעה בשוק.", href: "/investment-tracks", cta: "למדריך המלא" },
  { icon: Calculator, title: "מחשבונים פיננסיים", description: "משכנתא, פנסיה, חיסכון והשוואת מסלולים — כלים מקצועיים חופשיים, ללא רישום.", href: "/calculators", cta: "לכל המחשבונים" },
];

const faqItems = [
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "בודקים מה יש לכם בקופ״ח, מה חסר, ומשווים בין כל התוכניות בשוק. ההמלצה מותאמת לגיל, מצב בריאותי וצרכים — בלי עלות נוספת.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "בקרן פנסיה כולם חולקים את הסיכון — זה מוזיל עלויות. בביטוח מנהלים יש פוליסה אישית עם גמישות רבה יותר. מה עדיף? תלוי בגיל, בריאות ומצב תעסוקתי.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "הפגישה הראשונה ללא עלות. תקבלו תמונה מלאה של מצב הפנסיה שלכם — הפקדות, כיסויים, דמי ניהול — ותבינו בדיוק איפה אתם עומדים.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כל החברות — הפניקס, מגדל, הראל, כלל, מנורה מבטחים ועוד. ככה אפשר להשוות ולמצוא את מה שמתאים ומשתלם באמת.",
  },
  {
    question: "כמה זמן לוקח לעבור חברה?",
    answer: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכל — טפסים, ניוד, בדיקה שלא נפגעים כיסויים קיימים.",
  },
  {
    question: "מה זה סריקת תיק?",
    answer: "בדיקה של כל מה שיש לכם — ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים, ודמי ניהול גבוהים. בלי עלות ובלי התחייבות.",
  },
  {
    question: "מה קורה אם יש בעיה עם חברת הביטוח?",
    answer: "הצוות שלנו מטפל. זה בדיוק למה יש סוכן — שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם.",
  },
];

const trustPoints = [
  { icon: Award, title: "מורשים ומפוקחים", description: "סוכנות ביטוח פנסיונית מורשית תחת רשות שוק ההון, ביטוח וחיסכון. ביטוח אחריות מקצועית מלא." },
  { icon: Building2, title: "מבית עמיתים הון", description: "הבית המקצועי של SEELD. ותק, מוניטין, ותשתית של בית פיננסים מוביל בישראל." },
  { icon: UserCheck, title: "יועץ ייעודי לכל לקוח", description: "כל לקוח אצלנו מקבל יועץ אישי שמלווה את התיק שלו לאורך כל שנות הקשר. אדם אחד. רציף." },
  { icon: Scale, title: "עצמאות גמורה", description: "ללא התחייבות לחברה מסוימת. ללא יעדי מכירה. ההמלצה מבוססת אך ורק על מה שנכון ללקוח." },
];

const leadSubjects = [
  "ביטוח בריאות",
  "ביטוח חיים",
  "ביטוח רכב",
  "ביטוח דירה",
  "פנסיה וחיסכון",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "סריקת תיק קיים",
  "ניוד פנסיה",
  "אחר",
];

const processSteps = [
  { number: "01", title: "פנייה ראשונית", description: "שיחה קצרה להיכרות עם הצרכים שלך, הסוכן הייעודי שילווה אותך, והצעדים הבאים בתהליך.", icon: PhoneCall },
  { number: "02", title: "מיפוי התיק", description: "הצוות שלנו שולף את כל הפוליסות, הקרנות והחיסכון ממקורות רשמיים. תהליך מקצועי ומאובטח לחלוטין.", icon: Search },
  { number: "03", title: "ניתוח ודוח", description: "תוך 48 שעות תקבל דוח מקצועי שמציג בצורה ברורה את המצב הקיים, הזדמנויות לשיפור וההמלצות המנומקות שלנו.", icon: Target },
  { number: "04", title: "פגישת ייעוץ", description: "ישיבה פרונטלית או בזום עם היועץ הייעודי שלך. מעבר מעמיק על כל סעיף, שאלות, והחלטה מושכלת ללא לחץ.", icon: BarChart3 },
  { number: "05", title: "יישום מקצועי", description: "הצוות שלנו מטפל בכל הניודים, הטפסים והאינטגרציות מול החברות. אתה מקבל עדכון בכל שלב.", icon: Handshake },
  { number: "06", title: "ליווי שנתי", description: "בחינה מחדש אחת לשנה ובכל אירוע חיים משמעותי. הקשר עם היועץ שלך ממשיך לאורך כל הדרך.", icon: CalendarCheck },
];

// ── Shared UI ──

const SectionLabel = ({ children, dark = false }: { children: string; dark?: boolean }) => (
  <p
    className="text-[11px] font-bold tracking-[0.3em] uppercase mb-4"
    style={{ color: dark ? ACCENT_BRIGHT : ACCENT }}
  >
    {children}
  </p>
);

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const gridStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const ProductGrid = ({ items }: { items: { icon: LucideIcon; title: string; description: string; href: string }[] }) => (
  <motion.div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
    initial="hidden"
    animate="visible"
    variants={gridStagger}
  >
    {items.map((item) => (
      <motion.div key={item.title} variants={gridItem} className="h-full">
        <Link to={item.href} className="block h-full group">
          <div className="h-full bg-white border border-[#0b1114]/[0.07] rounded-xl p-5 transition-all duration-200 group-hover:border-[#14b8a6]/50 group-hover:shadow-[0_12px_32px_-16px_rgba(11,17,20,0.18)] group-hover:-translate-y-0.5">
            <item.icon className="w-5 h-5 mb-3.5 text-[#0b1114]/50 group-hover:text-[#14b8a6] transition-colors" strokeWidth={1.75} />
            <h3 className="text-sm font-bold mb-1 text-[#0b1114]">{item.title}</h3>
            <p className="text-xs text-[#0b1114]/40 leading-relaxed">{item.description}</p>
          </div>
        </Link>
      </motion.div>
    ))}
  </motion.div>
);

const CapabilityCard = ({ cap }: { cap: (typeof digitalCapabilities)[number] }) => (
  <div className="relative h-full rounded-xl p-6 sm:p-7 overflow-hidden border border-white/[0.07] bg-white/[0.03] transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-[#2dd4bf]/40 group-hover:-translate-y-1">
    <div className="flex items-start justify-between mb-5">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "rgba(45,212,191,0.10)" }}
      >
        <cap.icon className="w-5 h-5" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
      </div>
      {cap.badge && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums"
          style={{ backgroundColor: "rgba(45,212,191,0.10)", color: ACCENT_BRIGHT }}
        >
          {cap.badge}
        </span>
      )}
    </div>
    <h3 className="text-base font-bold text-white mb-2">{cap.title}</h3>
    <p className="text-[13px] text-white/45 leading-relaxed mb-5">{cap.description}</p>
    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: ACCENT_BRIGHT }}>
      {cap.cta}
      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
    </span>
  </div>
);

const inputClass =
  "w-full px-1 py-3.5 bg-transparent border-b border-[#0b1114]/15 text-[#0b1114] placeholder:text-[#0b1114]/30 text-base sm:text-sm focus:outline-none focus:border-[#14b8a6] transition-all min-h-[44px]";

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
            type: "contact",
            leadData: {
              fullName: leadForm.name.trim(),
              phone: leadForm.phone.trim(),
              email: `${leadForm.phone.trim()}@lead.seeld.co.il`,
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
            type: "contact",
            leadData: {
              fullName: contactForm.name.trim(),
              phone: contactForm.phone.trim(),
              email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
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

        {/* 2. LEAD FORM */}
        <section style={{ backgroundColor: LIGHT }}>
          <div className="py-16 sm:py-20">
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
              <ScrollReveal>
                <div className="text-center mb-10">
                  <SectionLabel>PORTFOLIO SCAN</SectionLabel>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-3 leading-tight">
                    בדיקת תיק ללא עלות
                  </h2>
                  <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    השאירו פרטים, הצוות שלנו יבחן את התיק הקיים ויחזור אליכם עם דוח מקצועי הכולל המלצות מעשיות.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <form onSubmit={handleLeadSubmit}>
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#0b1114]/[0.07] shadow-[0_24px_60px_-30px_rgba(11,17,20,0.15)]">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5">
                      <input
                        type="text"
                        placeholder="שם מלא"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        className={inputClass}
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className={inputClass}
                        dir="ltr"
                      />
                      <select
                        value={leadForm.subject}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b border-[#0b1114]/15 text-[#0b1114] text-base sm:text-sm focus:outline-none focus:border-[#14b8a6] transition-all appearance-none cursor-pointer min-h-[44px]"
                      >
                        <option value="">בחר נושא</option>
                        {leadSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <motion.button
                        type="submit"
                        disabled={leadSubmitting}
                        className="w-full px-6 py-3.5 rounded-xl bg-[#0b1114] text-white font-bold text-base sm:text-sm hover:bg-[#111a1f] transition-all disabled:opacity-60 min-h-[48px]"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שלחו ונתחיל"}
                      </motion.button>
                    </div>
                    <div className="text-center mt-5">
                      <span className="text-[#0b1114]/30 text-xs">או חייגו: </span>
                      <a href="tel:0523097444" className="text-xs font-bold hover:underline" style={{ color: ACCENT }} dir="ltr">052-309-7444</a>
                    </div>
                  </div>
                </form>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* 3. QUICK ACCESS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <ScrollReveal>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex flex-col items-center gap-3 py-6 px-2 rounded-xl border border-[#0b1114]/[0.07] bg-white hover:border-[#14b8a6]/50 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(11,17,20,0.15)] transition-all duration-200 group"
                >
                  <action.icon className="w-6 h-6 text-[#0b1114]/60 group-hover:text-[#14b8a6] transition-colors" strokeWidth={1.5} />
                  <span className="text-xs font-bold text-[#0b1114]/70 group-hover:text-[#0b1114] transition-colors text-center leading-tight">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* 4. WHY SEELD */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <SectionLabel>THE SEELD METHOD</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-4 leading-[1.15]">
                מה מייחד בית פיננסים עצמאי
              </h2>
              <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                ארבעה עקרונות שמגדירים את הדרך שבה אנחנו עובדים מול כל לקוח בבית.
              </p>
            </div>
          </ScrollReveal>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {whySeeld.map((item, i) => (
              <motion.div key={item.title} variants={staggerItem} className="h-full">
                <div className="relative bg-white border border-[#0b1114]/[0.07] rounded-xl p-7 h-full transition-all duration-300 hover:border-[#14b8a6]/40 hover:shadow-[0_16px_40px_-20px_rgba(11,17,20,0.18)] hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-6">
                    <item.icon className="w-6 h-6 text-[#0b1114]/60" strokeWidth={1.5} />
                    <span className="text-xs font-bold tabular-nums tracking-wider" style={{ color: ACCENT }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2.5 text-[#0b1114]">{item.title}</h3>
                  <p className="text-sm text-[#0b1114]/45 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 5. PRODUCTS — TABS */}
        <section style={{ backgroundColor: LIGHT }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-8 sm:mb-12">
                <SectionLabel>OUR SOLUTIONS</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-4 leading-[1.15]">
                  כל הפתרונות תחת בית אחד
                </h2>
                <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  16 קטגוריות ביטוח ו-11 מוצרי חיסכון ופנסיה, מול כל החברות בישראל. בוחרים תחום ומתחילים.
                </p>
              </div>
            </ScrollReveal>

            <Tabs defaultValue="insurance" dir="rtl">
              <ScrollReveal>
                <TabsList className="mx-auto flex w-fit h-auto bg-white border border-[#0b1114]/[0.08] rounded-xl p-1 mb-8 sm:mb-10">
                  <TabsTrigger
                    value="insurance"
                    className="rounded-lg px-6 sm:px-10 py-2.5 text-sm sm:text-base font-bold text-[#0b1114]/50 data-[state=active]:bg-[#0b1114] data-[state=active]:text-white transition-all"
                  >
                    ביטוח
                  </TabsTrigger>
                  <TabsTrigger
                    value="savings"
                    className="rounded-lg px-6 sm:px-10 py-2.5 text-sm sm:text-base font-bold text-[#0b1114]/50 data-[state=active]:bg-[#0b1114] data-[state=active]:text-white transition-all"
                  >
                    חיסכון ופנסיה
                  </TabsTrigger>
                </TabsList>
              </ScrollReveal>

              <TabsContent value="insurance" className="mt-0">
                <ProductGrid items={insuranceTypes} />
                <div className="text-center mt-8 sm:mt-10">
                  <Link
                    to="/insurances"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1114] hover:text-[#14b8a6] transition-colors"
                  >
                    לכל הביטוחים שלנו
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="savings" className="mt-0">
                <ProductGrid items={savingsProducts} />
                <div className="text-center mt-8 sm:mt-10">
                  <Link
                    to="/savings"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1114] hover:text-[#14b8a6] transition-colors"
                  >
                    לכל מוצרי החיסכון והפנסיה
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* 6. DARK BLOCK — PLATFORM + STATS + ABOUT */}
        <section style={{ backgroundColor: INK }} className="relative overflow-hidden">
          {/* Grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(to left, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)",
            }}
          />
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-[0.12] blur-3xl"
            aria-hidden="true"
            style={{ background: `radial-gradient(ellipse, ${ACCENT_BRIGHT} 0%, transparent 65%)` }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28">
            {/* Platform */}
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-14">
                <SectionLabel dark>THE PLATFORM</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] text-white mb-4 leading-[1.15]">
                  הפלטפורמה הדיגיטלית של SEELD
                </h2>
                <p className="text-white/45 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  הכלים שהצוות שלנו עובד איתם — פתוחים גם לכם. נתונים בזמן אמת, שקיפות מלאה וזמינות מסביב לשעון.
                </p>
              </div>
            </ScrollReveal>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
            >
              {digitalCapabilities.map((cap) => (
                <motion.div key={cap.title} variants={staggerItem} className="h-full">
                  {cap.href ? (
                    <Link to={cap.href} className="block h-full group">
                      <CapabilityCard cap={cap} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                      className="block w-full h-full text-start group"
                    >
                      <CapabilityCard cap={cap} />
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 my-14 sm:my-20 py-10 sm:py-12 border-y border-white/[0.07]"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              {[
                { number: "600+", label: "משפחות מלוות" },
                { number: "6", label: "שנים של ניסיון" },
                { number: "12", label: "חברות ביטוח" },
                { number: "₪0", label: "פגישת ייעוץ ראשונה" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1.5 tabular-nums text-white">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-white/40 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* About + trust */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <ScrollReveal>
                <div className="space-y-7">
                  <div>
                    <SectionLabel dark>THE HOUSE</SectionLabel>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-white mb-3 leading-[1.1]">
                      סוכנות בוטיק פיננסית.
                    </h2>
                    <p className="font-semibold text-lg" style={{ color: ACCENT_BRIGHT }}>
                      צוות קטן של יועצים עצמאיים. שירות ברמה שלא פגשת.
                    </p>
                  </div>
                  <div className="space-y-5 text-white/60 text-base sm:text-lg leading-[1.85]">
                    <p>
                      SEELD היא סוכנות ביטוח ופיננסים עצמאית, שנבנתה סביב עקרון אחד פשוט: להעמיד את הלקוח מעל כל שיקול אחר.
                    </p>
                    <p>
                      הצוות שלנו כולל סוכני ביטוח מורשים, יועצי פנסיה ומומחי פיננסים. כולם עצמאיים, כולם ללא תלות בחברה אחת. זו לא אמירה שיווקית. זו התשתית המשפטית והעסקית שלנו.
                    </p>
                    <p className="text-white font-semibold">
                      לכל לקוח אצלנו יש יועץ אישי.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3.5 pt-2">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5"
                      style={{ backgroundColor: ACCENT_BRIGHT, color: INK, boxShadow: "0 16px 40px -16px rgba(45,212,191,0.5)" }}
                    >
                      קביעת פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 text-white font-semibold text-base hover:bg-white/[0.05] transition-all"
                    >
                      הכירו את הצוות
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {trustPoints.map((point) => (
                  <motion.div
                    key={point.title}
                    variants={staggerItem}
                    className="rounded-xl p-6 border border-white/[0.07] bg-white/[0.03]"
                  >
                    <point.icon className="w-5 h-5 mb-4" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
                    <h3 className="text-[15px] font-bold text-white mb-1.5">{point.title}</h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">{point.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* 7. PROCESS */}
        <section className="py-14 sm:py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-16">
                <SectionLabel>PROCESS</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-4 leading-[1.15]">
                  תהליך העבודה של הבית
                </h2>
                <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  ששה שלבים מובנים מהפנייה הראשונית ועד ליווי שוטף. מתודולוגיה מקצועית שמבטיחה דיוק בכל שלב.
                </p>
              </div>
            </ScrollReveal>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {processSteps.map((step) => (
                <motion.div key={step.number} variants={staggerItem}>
                  <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-[#0b1114]/[0.08]">
                    <span className="text-sm font-extrabold tabular-nums tracking-wider" style={{ color: ACCENT }}>
                      {step.number}
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0b1114]">{step.title}</h3>
                    <step.icon className="w-4 h-4 text-[#0b1114]/30 mr-auto self-center" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-[#0b1114]/45 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 8. PORTFOLIO SCANNER */}
        <section style={{ backgroundColor: LIGHT }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="space-y-6 text-center lg:text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0b1114]/10 bg-white">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
                    <span className="text-xs font-bold text-[#0b1114]/60 tracking-wide">בדיקה מקצועית · 48 שעות</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold text-[#0b1114] tracking-[-0.02em] leading-[1.1]">
                    תמונה מלאה של התיק
                  </h2>
                  <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                    הכלי המקצועי של SEELD מאגד את כל הנתונים מהחברות, מזהה כפילויות, דמי ניהול חריגים וכיסויים חסרים. דוח מפורט במייל, פגישת הסבר עם יועץ ייעודי.
                  </p>
                  <Link to="/contact">
                    <Button className="bg-[#0b1114] text-white hover:bg-[#111a1f] rounded-xl px-8 py-5 text-base font-bold hover:-translate-y-0.5 transition-all mt-4 min-h-[52px]">
                      בקשת בדיקת תיק
                      <ArrowDownLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                </div>
                <motion.div
                  className="rounded-2xl overflow-hidden max-w-md mx-auto w-full border border-white/[0.06]"
                  style={{ backgroundColor: INK, boxShadow: "0 40px 80px -30px rgba(11,17,20,0.45)" }}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.07]">
                    <span className="text-white/50 text-[11px] font-medium tracking-wide">SEELD OS · סריקת תיק</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ color: ACCENT_BRIGHT, backgroundColor: "rgba(45,212,191,0.10)" }}>
                      SCANNING
                    </span>
                  </div>
                  <div className="p-5 space-y-1">
                    {[
                      { label: "כפל ביטוחי", status: "נמצא", ok: false },
                      { label: "דמי ניהול גבוהים", status: "2 מוצרים", ok: false },
                      { label: "מסלול השקעה", status: "לבדיקה", ok: false },
                      { label: "כיסוי אובדן כושר", status: "חסר", ok: false },
                      { label: "ביטוח בריאות", status: "תקין", ok: true },
                      { label: "חיסכון לילדים", status: "תקין", ok: true },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.12, duration: 0.4 }}
                      >
                        <span className="text-xs sm:text-[13px] text-white/60">{item.label}</span>
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums"
                          style={{
                            color: item.ok ? ACCENT_BRIGHT : "#fbbf24",
                            backgroundColor: item.ok ? "rgba(45,212,191,0.08)" : "rgba(251,191,36,0.08)",
                          }}
                        >
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                    <motion.div
                      className="pt-3"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white/70">פוטנציאל חיסכון שנתי</span>
                        <motion.span
                          className="text-lg font-extrabold tabular-nums"
                          style={{ color: ACCENT_BRIGHT }}
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.1, type: "spring" }}
                        >
                          ₪4,200
                        </motion.span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: ACCENT_BRIGHT }}
                          initial={{ width: "0%" }}
                          whileInView={{ width: "72%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.3, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1.5">72% מהתיק נסרק — נמצאו 3 הזדמנויות לשיפור</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 9. PARTNERS */}
        <ScrollReveal>
          <CompanyLogos
            variant="marquee"
            title="עובדים מול כל השחקניות המובילות"
            subtitle="12 חברות ביטוח ו-6 בתי השקעות בישראל. גישה מקצועית בזמן אמת. השוואה שקופה. המלצה מבוססת."
          />
        </ScrollReveal>

        {/* 10. FAQ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-10 sm:mb-14">
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-4 leading-[1.15]">
                שאלות שעולות בכל תיק
              </h2>
              <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                התשובות המקצועיות שהצוות שלנו נותן לכל לקוח חדש. מרוכז, ברור, ובלי המון מילים מיותרות.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-2xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((item, i) => (
                  <motion.div key={i} variants={staggerItem}>
                    <AccordionItem
                      value={`faq-${i}`}
                      className="bg-white border border-[#0b1114]/[0.08] rounded-xl px-6 overflow-hidden data-[state=open]:border-[#14b8a6]/40"
                    >
                      <AccordionTrigger className="text-sm sm:text-base font-bold hover:no-underline py-5 text-[#0b1114]">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-[#0b1114]/50 leading-relaxed pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>

            <ScrollReveal delay={200}>
              <div className="text-center mt-10">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0b1114] hover:text-[#14b8a6] transition-colors"
                >
                  לכל השאלות הנפוצות
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 11. CONTACT STRIP */}
        <motion.section
          style={{ backgroundColor: INK }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-white/[0.07]" style={{ direction: "rtl" }}>
              <a
                href="tel:0523097444"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.03] rounded-lg sm:rounded-none"
              >
                <Phone className="w-[18px] h-[18px] flex-shrink-0" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">טלפון</span>
                  <span className="block text-white/40 text-xs mt-0.5 tabular-nums" dir="ltr">052-309-7444</span>
                </div>
              </a>

              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.03] rounded-lg sm:rounded-none"
              >
                <MessageCircle className="w-[18px] h-[18px] flex-shrink-0" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">WhatsApp</span>
                  <span className="block text-white/40 text-xs mt-0.5">שלחו הודעה</span>
                </div>
              </a>

              <a
                href="mailto:info@seeld.co.il"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.03] rounded-lg sm:rounded-none"
              >
                <Mail className="w-[18px] h-[18px] flex-shrink-0" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">אימייל</span>
                  <span className="block text-white/40 text-xs mt-0.5" dir="ltr">info@seeld.co.il</span>
                </div>
              </a>

              <div className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2">
                <MapPin className="w-[18px] h-[18px] flex-shrink-0" style={{ color: ACCENT_BRIGHT }} strokeWidth={1.75} />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold">משרדים</span>
                  <span className="block text-white/40 text-xs mt-0.5">רעננה | ירושלים</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 12. CONTACT FORM */}
        <section className="py-14 sm:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <SectionLabel>CONTACT</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold tracking-[-0.02em] text-[#0b1114] mb-3 leading-[1.15]">
                  השיחה הראשונה על חשבוננו
                </h2>
                <p className="text-[#0b1114]/50 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                  השאירו פרטים ויועץ מהצוות שלנו יצור קשר באותו יום עבודה.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-white border border-[#0b1114]/[0.08] rounded-2xl p-7 sm:p-9 shadow-[0_24px_60px_-30px_rgba(11,17,20,0.12)]">
                <form className="space-y-5" onSubmit={handleContactSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input
                      type="text"
                      placeholder="שם מלא"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="אימייל (לא חובה)"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                  <textarea
                    placeholder="במה נוכל לעזור?"
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-1 py-3.5 bg-transparent border-b border-[#0b1114]/15 text-[#0b1114] text-sm placeholder:text-[#0b1114]/30 focus:outline-none focus:border-[#14b8a6] transition-all resize-none"
                  />
                  <motion.button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full px-6 py-4 rounded-xl bg-[#0b1114] text-white font-bold text-base hover:bg-[#111a1f] transition-colors disabled:opacity-60 min-h-[48px]"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שליחה"}
                  </motion.button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 13. AGENT CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <ScrollReveal>
            <div className="relative rounded-2xl border border-[#0b1114]/[0.08] bg-white overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-[3px]" style={{ background: `linear-gradient(to left, ${ACCENT}, ${ACCENT_BRIGHT})` }} />
              <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="space-y-3 text-center sm:text-right">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0b1114] tracking-[-0.01em]">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                  <p className="text-base text-[#0b1114]/45 max-w-md">
                    פורטל SEELD לסוכנים — כל הכלים שצריך בשביל לנהל סוכנות חכמה. CRM, ניתוח תיקים, ליקויים ומסמכים.
                  </p>
                </div>
                <Link to="/app/auth" className="w-full sm:w-auto flex-shrink-0">
                  <motion.span
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-[#0b1114] text-white font-bold hover:bg-[#111a1f] transition-all w-full sm:w-auto text-base"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <LogIn className="w-5 h-5" />
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
