import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall,
  Shield, Users, Award, Home, Plane, Heart, Baby, Briefcase, Umbrella,
  Building2, HandCoins, TrendingUp, GraduationCap, UserCheck,
  Wallet, BarChart3, HelpCircle, Mail, MapPin, Phone,
  MessageCircle, ChevronLeft, Stethoscope, Key, Globe,
  Scale, Activity, Target, CalendarCheck, Loader2, Zap, Handshake,
  HeartHandshake, Search, UserPlus, ArrowDownLeft,
  Bot, LayoutDashboard, LineChart, Compass, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { icon: Landmark, doodle: "pension", label: "תכנון פנסיוני", href: "/savings/pension-funds", color: "#5ec6c6" },
  { icon: HeartPulse, doodle: "family", label: "ביטוח חיים ובריאות", href: "/insurance/health", color: "#e76f51" },
  { icon: Home, doodle: "umbrella", label: "ביטוח רכוש", href: "/insurance/home", color: "#f4a261" },
  { icon: PiggyBank, doodle: "savings", label: "חיסכון והשקעות", href: "/savings/gemel-investment", color: "#90be6d" },
  { icon: Calculator, doodle: "calculator", label: "מחשבונים", href: "/calculators", color: "#6c63ff" },
  { icon: PhoneCall, doodle: "handshake", label: "צור קשר", href: "/contact", color: "#e07cc6" },
];

const accentColors = ["#5ec6c6", "#f4a261", "#90be6d", "#e76f51"];

const whySeeld = [
  {
    icon: Users,
    doodle: "handshake",
    title: "יועץ אישי לכל לקוח",
    description: "כל לקוח בבית משובץ ליועץ ייעודי. אותו אדם מכיר את התיק, את הצרכים ואת המשפחה. קשר מקצועי, לא מוקד מתחלף.",
    accent: "#5ec6c6",
  },
  {
    icon: Handshake,
    doodle: "shield",
    title: "עצמאות מלאה",
    description: "אין לנו יעדי מכירה של חברה ספציפית. אין בונוסים לקידום מוצר. ההמלצה מבוססת על מה שמתאים ללקוח, ולא על מה שמשתלם לנו.",
    accent: "#f4a261",
  },
  {
    icon: Scale,
    doodle: "charts",
    title: "12 חברות בהשוואה",
    description: "הראל, מגדל, כלל, הפניקס, איילון, מנורה, מיטב ועוד. גישה מקצועית לכל השחקניות המובילות בשוק הישראלי בזמן אמת.",
    accent: "#90be6d",
  },
  {
    icon: Zap,
    doodle: "lightbulb",
    title: "תשתית מקצועית",
    description: "פורטל לקוחות, מערכת ניהול תיקים וכלי השוואה מתקדמים. הטכנולוגיה מאפשרת לנו להתמקד במה שחשוב באמת: הייעוץ.",
    accent: "#e76f51",
  },
];

const insuranceTypes = [
  { icon: Car, doodle: "shield", title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳ — השוואה בין כל החברות בדקות", href: "/insurance/vehicle" },
  { icon: HeartPulse, doodle: "family", title: "ביטוח בריאות", description: "ניתוחים, תרופות וטיפולים — כיסוי שמשלים את הסל ולא כופל אותו", href: "/insurance/health" },
  { icon: Heart, doodle: "family", title: "ביטוח חיים", description: "הגנה כלכלית למשפחה. לא מה שמנסים למכור לך — מה שאתה באמת צריך", href: "/insurance/life" },
  { icon: Home, doodle: "umbrella", title: "ביטוח דירה", description: "מבנה ותכולה — שלא תגלו שמשהו חסר אחרי שכבר מאוחר", href: "/insurance/home" },
  { icon: Key, doodle: "key", title: "ביטוח שוכרים", description: "כיסוי תכולה ואחריות צד ג׳ לשוכרים", href: "/insurance/renters" },
  { icon: Building2, doodle: "handshake", title: "ביטוח עסקי", description: "רכוש, אחריות מקצועית וצד ג׳ לעסק", href: "/insurance/business" },
  { icon: Plane, doodle: "target", title: "ביטוח נסיעות", description: "ביטול טיסה, אשפוז ומטען בחו״ל", href: "/insurance/travel" },
  { icon: Stethoscope, doodle: "shield", title: "ביטוח שיניים", description: "טיפולי שיניים ואורתודנטיה", href: "/insurance/dental" },
  { icon: Activity, doodle: "shield", title: "אובדן כושר עבודה", description: "תשלום חודשי אם לא תוכלו לעבוד", href: "/insurance/disability" },
  { icon: UserCheck, doodle: "family", title: "ביטוח סיעודי", description: "מימון טיפול סיעודי בבית או במוסד", href: "/insurance/nursing" },
  { icon: Landmark, doodle: "pension", title: "ביטוח משכנתא", description: "שמירה על הדירה גם במקרה בלתי צפוי", href: "/insurance/mortgage" },
  { icon: Shield, doodle: "shield", title: "מחלות קשות", description: "פיצוי כספי חד-פעמי עם אבחון מחלה", href: "/insurance/critical-illness" },
  { icon: Umbrella, doodle: "umbrella", title: "תאונות אישיות", description: "פיצוי על ימי אשפוז, שבר או נכות מתאונה", href: "/insurance/accidents" },
  { icon: Briefcase, doodle: "handshake", title: "ביטוח שותפים", description: "רציפות עסקית במקרה של אובדן שותף", href: "/insurance/partners" },
  { icon: Globe, doodle: "target", title: "עובדים זרים", description: "ביטוח חובה בהתאם לחוק", href: "/insurance/foreign-workers" },
  { icon: Heart, doodle: "family", title: "סיעודי כללית", description: "כיסוי סיעודי משלים לחברי כללית", href: "/insurance/nursing-clalit" },
];

const savingsProducts = [
  { icon: Landmark, doodle: "pension", title: "קרנות פנסיה", description: "הפקדות, כיסויים ומסלול נכון — כי ברירת המחדל היא לא תמיד הכי טובה", href: "/savings/pension-funds" },
  { icon: PiggyBank, doodle: "savings", title: "קופות גמל", description: "חיסכון לטווח ארוך עם הטבות מס", href: "/savings/gemel-funds" },
  { icon: HandCoins, doodle: "savings", title: "גמל להשקעה", description: "חיסכון נזיל בשוק ההון — בלי שקופות ובלי תקופות נעילה", href: "/savings/gemel-investment" },
  { icon: Baby, doodle: "family", title: "חיסכון לכל ילד", description: "ניהול כספי התוכנית הממשלתית", href: "/savings/child-savings" },
  { icon: GraduationCap, doodle: "lightbulb", title: "קרנות השתלמות", description: "חיסכון לשש שנים עם פטור ממס", href: "/savings/training-funds" },
  { icon: TrendingUp, doodle: "growth", title: "השקעות", description: "בחירת מסלולי השקעה ומעקב תשואות", href: "/savings/investment" },
  { icon: Heart, doodle: "family", title: "ביטוח חיים פנסיוני", description: "חיסכון עם כיסוי למקרה מוות ונכות", href: "/insurance/life" },
  { icon: Building2, doodle: "handshake", title: "קופות מעסיקים", description: "הפקדות לעובדים, ציות לחוק ובחירת מוצרים", href: "/savings/employer-funds" },
  { icon: CalendarCheck, doodle: "target", title: "טרום פרישה", description: "עוד 5-10 שנים לפנסיה? עכשיו זה הזמן לבדוק שהכל מסודר", href: "/savings/pre-retirement" },
  { icon: Wallet, doodle: "savings", title: "לאחר פרישה", description: "משיכת כספים, קצבאות ותכנון מס — שלא תפסידו שקל מיותר", href: "/savings/post-retirement" },
  { icon: Target, doodle: "target", title: "תכנון פיננסי", description: "מיפוי מלא של הנכסים ובניית תוכנית", href: "/savings/financial-planning" },
];

const digitalCapabilities: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  color: string;
  href?: string;
  badge?: string;
}[] = [
  { icon: LayoutDashboard, title: "אזור אישי ללקוח", description: "כל הפוליסות, החיסכון והמסמכים שלכם במקום אחד — מעודכן, מאובטח ונגיש מכל מכשיר.", href: "/personal-area", cta: "כניסה לאזור האישי", color: "#5ec6c6" },
  { icon: Bot, title: "יועץ SEELD AI", description: "עונה על שאלות ביטוח, פנסיה וחיסכון בכל שעה — ומחבר אתכם ליועץ אנושי כשצריך.", cta: "פתיחת שיחה", color: "#6c63ff", badge: "24/7" },
  { icon: Search, title: "איתור קרנות חכם", description: "מנוע חיפוש והשוואה לקרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות בישראל.", href: "/fund-finder", cta: "חיפוש קרן", color: "#f4a261" },
  { icon: LineChart, title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש — להשוואה שקופה בין החברות.", href: "/return-tables", cta: "צפייה בנתונים", color: "#90be6d" },
  { icon: Compass, title: "מדריך מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין כל מסלולי ההשקעה בשוק.", href: "/investment-tracks", cta: "למדריך המלא", color: "#e76f51" },
  { icon: Calculator, title: "מחשבונים פיננסיים", description: "משכנתא, פנסיה, חיסכון והשוואת מסלולים — כלים מקצועיים חופשיים, ללא רישום.", href: "/calculators", cta: "לכל המחשבונים", color: "#e07cc6" },
];

import { COMPANIES } from "@/data/companies";
import CompanyLogos from "@/components/CompanyLogos";
import DoodleIcon from "@/components/DoodleIcon";

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
    answer: "שמוליק מטפל. זה בדיוק למה יש סוכן — שלא תצטרכו להתמודד עם החברה לבד. אנחנו הכתובת שלכם.",
  },
];

const trustPoints = [
  { icon: Award, title: "מורשים ומפוקחים", description: "סוכנות ביטוח פנסיונית מורשית תחת רשות שוק ההון, ביטוח וחיסכון. ביטוח אחריות מקצועית מלא.", accent: "#5ec6c6" },
  { icon: Building2, title: "מבית עמיתים הון", description: "הבית המקצועי של SEELD. ותק, מוניטין, ותשתית של בית פיננסים מוביל בישראל.", accent: "#f4a261" },
  { icon: UserCheck, title: "יועץ ייעודי לכל לקוח", description: "כל לקוח אצלנו מקבל יועץ אישי שמלווה את התיק שלו לאורך כל שנות הקשר. אדם אחד. רציף.", accent: "#90be6d" },
  { icon: Scale, title: "עצמאות גמורה", description: "ללא התחייבות לחברה מסוימת. ללא יעדי מכירה. ההמלצה מבוססת אך ורק על מה שנכון ללקוח.", accent: "#e76f51" },
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
    description: "שיחה קצרה להיכרות עם הצרכים שלך, הסוכן הייעודי שילווה אותך, והצעדים הבאים בתהליך.",
    icon: PhoneCall,
    color: "#5ec6c6",
  },
  {
    number: 2,
    title: "מיפוי התיק",
    description: "הצוות שלנו שולף את כל הפוליסות, הקרנות והחיסכון ממקורות רשמיים. תהליך מקצועי ומאובטח לחלוטין.",
    icon: Search,
    color: "#f4a261",
  },
  {
    number: 3,
    title: "ניתוח ודוח",
    description: "תוך 48 שעות תקבל דוח מקצועי שמציג בצורה ברורה את המצב הקיים, הזדמנויות לשיפור וההמלצות המנומקות שלנו.",
    icon: Target,
    color: "#90be6d",
  },
  {
    number: 4,
    title: "פגישת ייעוץ",
    description: "ישיבה פרונטלית או בזום עם היועץ הייעודי שלך. מעבר מעמיק על כל סעיף, שאלות, והחלטה מושכלת ללא לחץ.",
    icon: BarChart3,
    color: "#e76f51",
  },
  {
    number: 5,
    title: "יישום מקצועי",
    description: "הצוות שלנו מטפל בכל הניודים, הטפסים והאינטגרציות מול החברות. אתה מקבל עדכון בכל שלב.",
    icon: Handshake,
    color: "#5ec6c6",
  },
  {
    number: 6,
    title: "ליווי שנתי",
    description: "בחינה מחדש אחת לשנה ובכל אירוע חיים משמעותי. הקשר עם היועץ שלך ממשיך לאורך כל הדרך.",
    icon: CalendarCheck,
    color: "#f4a261",
  },
];

// ── Animation variants ──
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const gridStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.035 },
  },
};

const gridItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const ProductGrid = ({ items }: { items: { icon: LucideIcon; doodle: string; title: string; description: string; href: string }[] }) => (
  <motion.div
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
    initial="hidden"
    animate="visible"
    variants={gridStagger}
  >
    {items.map((item, i) => (
      <motion.div key={item.title} variants={gridItem} className="h-full">
        <Link to={item.href} className="block h-full group">
          <div
            className="h-full bg-white border border-[#0a3d3d]/[0.06] border-r-[3px] border-r-transparent rounded-xl p-5 sm:p-6 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-r-[color:var(--accent)]"
            style={{ "--accent": accentColors[i % accentColors.length] } as React.CSSProperties}
          >
            <div className="w-14 h-14 flex items-center justify-center mb-3">
              <DoodleIcon name={item.doodle} size={48} />
            </div>
            <h3 className="text-sm font-extrabold mb-1 text-[#0a3d3d]">{item.title}</h3>
            <p className="text-xs text-[#0a3d3d]/40">{item.description}</p>
          </div>
        </Link>
      </motion.div>
    ))}
  </motion.div>
);

const CapabilityCard = ({ cap }: { cap: (typeof digitalCapabilities)[number] }) => (
  <div className="relative h-full bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-7 overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[#0a3d3d]/[0.05] group-hover:-translate-y-1.5">
    <div className="absolute top-0 right-0 left-0 h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: cap.color }} />
    <div className="flex items-start justify-between mb-5">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cap.color}14` }}>
        <cap.icon className="w-7 h-7" style={{ color: cap.color }} />
      </div>
      {cap.badge && (
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${cap.color}14`, color: cap.color }}>
          {cap.badge}
        </span>
      )}
    </div>
    <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-2">{cap.title}</h3>
    <p className="text-sm text-[#0a3d3d]/45 leading-relaxed mb-5">{cap.description}</p>
    <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: cap.color }}>
      {cap.cta}
      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
    </span>
  </div>
);

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

        {/* 2. INLINE LEAD FORM - Light gray background */}
        <section className="relative bg-[#f8f9fc]">
          <div className="py-16 sm:py-20">
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
              <ScrollReveal>
                <div className="text-center mb-10 relative">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] mb-3 leading-tight">
                    בדיקת תיק <span className="text-[#1a8f7d]">ללא עלות</span>
                  </h2>
                  <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    השאירו פרטים, הצוות שלנו יבחן את התיק הקיים ויחזור אליכם עם דוח מקצועי הכולל המלצות מעשיות.
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
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] placeholder:text-[#0a3d3d]/30 text-base sm:text-sm focus:outline-none focus:border-[#5ec6c6] transition-all min-h-[44px]"
                      />
                      <input
                        type="tel"
                        placeholder="טלפון"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] placeholder:text-[#0a3d3d]/30 text-base sm:text-sm focus:outline-none focus:border-[#5ec6c6] transition-all min-h-[44px]"
                        dir="ltr"
                      />
                      <select
                        value={leadForm.subject}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-base sm:text-sm focus:outline-none focus:border-[#5ec6c6] transition-all appearance-none cursor-pointer min-h-[44px]"
                      >
                        <option value="" className="text-[#0a3d3d]/30">בחר נושא</option>
                        {leadSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <motion.button
                        type="submit"
                        disabled={leadSubmitting}
                        className="w-full px-6 py-3.5 rounded-full bg-[#0a3d3d] text-white font-bold text-base sm:text-sm hover:bg-[#0d4a4a] transition-all disabled:opacity-60 shadow-lg shadow-[#0a3d3d]/15 min-h-[48px]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שלחו ונתחיל"}
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
                      className="w-16 h-16 flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    >
                      <DoodleIcon name={action.doodle} size={52} />
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-8 sm:mb-14">
              <SectionLabel>השיטה של SEELD</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-4 leading-[1.15]">
                מה מייחד בית <span className="text-[#1a8f7d]">פיננסים עצמאי</span>
              </h2>
              <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                ארבעה עקרונות שמגדירים את הדרך שבה אנחנו עובדים מול כל לקוח בבית.
              </p>
            </div>
          </ScrollReveal>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {whySeeld.map((item) => (
              <motion.div key={item.title} variants={staggerItem}>
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
                    <div className="w-16 h-16 flex items-center justify-center mb-6">
                      <DoodleIcon name={item.doodle} size={56} />
                    </div>
                    <h3 className="text-xl font-extrabold mb-3 text-[#0a3d3d] group-hover:text-[#0a3d3d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#0a3d3d]/45 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </section>


        {/* Wave to gray section */}
        <WaveDivider color="#f8f9fc" />

        {/* 5. PRODUCTS — INSURANCE & SAVINGS IN TABS */}
        <section className="bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-8 sm:mb-12">
                <SectionLabel>OUR SOLUTIONS</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-4 leading-[1.15]">
                  כל הפתרונות <span className="text-[#e76f51]">תחת בית אחד</span>
                </h2>
                <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  16 קטגוריות ביטוח ו-11 מוצרי חיסכון ופנסיה, מול כל החברות בישראל. בוחרים תחום ומתחילים.
                </p>
              </div>
            </ScrollReveal>

            <Tabs defaultValue="insurance" dir="rtl">
              <ScrollReveal>
                <TabsList className="mx-auto flex w-fit h-auto bg-white border border-[#0a3d3d]/[0.08] rounded-full p-1.5 mb-8 sm:mb-10 shadow-sm">
                  <TabsTrigger
                    value="insurance"
                    className="rounded-full px-6 sm:px-10 py-2.5 text-sm sm:text-base font-bold text-[#0a3d3d]/60 data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    ביטוח
                  </TabsTrigger>
                  <TabsTrigger
                    value="savings"
                    className="rounded-full px-6 sm:px-10 py-2.5 text-sm sm:text-base font-bold text-[#0a3d3d]/60 data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
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
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0a3d3d] hover:text-[#5ec6c6] transition-colors"
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
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#0a3d3d] hover:text-[#5ec6c6] transition-colors"
                  >
                    לכל מוצרי החיסכון והפנסיה
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>


        {/* Wave: gray -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* 6. DIGITAL PLATFORM — the capabilities behind the service */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-8 sm:mb-14">
              <SectionLabel>DIGITAL</SectionLabel>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-4 leading-[1.15]">
                הפלטפורמה הדיגיטלית <span className="text-[#6c63ff]">של SEELD</span>
              </h2>
              <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                הכלים שהצוות שלנו עובד איתם — פתוחים גם לכם. נתונים בזמן אמת, שקיפות מלאה וזמינות מסביב לשעון.
              </p>
            </div>
          </ScrollReveal>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
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
        </section>


        {/* 8. PARTNERS - Logo marquee */}
        <ScrollReveal>
          <CompanyLogos
            variant="marquee"
            title="עובדים מול כל השחקניות המובילות"
            subtitle="12 חברות ביטוח ו-6 בתי השקעות בישראל. גישה מקצועית בזמן אמת. השוואה שקופה. המלצה מבוססת."
          />
        </ScrollReveal>

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24 relative">
            {/* Stats row — concrete proof */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20 pb-10 sm:pb-14 border-b border-white/[0.08]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              {[
                { number: "600+", label: "משפחות מלוות", color: "#6dd9d5" },
                { number: "6", label: "שנים של ניסיון", color: "#f4a261" },
                { number: "12", label: "חברות ביטוח", color: "#90be6d" },
                { number: "₪0", label: "פגישת ייעוץ ראשונה", color: "#e76f51" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center sm:text-start"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                >
                  <div
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-1.5 tabular-nums"
                    style={{ color: stat.color }}
                  >
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-white/55 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Right side - About */}
              <ScrollReveal>
                <div className="space-y-8">
                  <div>
                    <SectionLabel>הבית של SEELD</SectionLabel>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 leading-[1.1]">
                      סוכנות בוטיק פיננסית.
                    </h2>
                    <p className="text-[#6dd9d5] font-semibold text-lg">צוות קטן של יועצים עצמאיים. שירות ברמה שלא פגשת.</p>
                  </div>
                  <div className="space-y-5 text-white/75 text-base sm:text-lg leading-[1.85]">
                    <p>
                      SEELD היא סוכנות ביטוח ופיננסים עצמאית, שנבנתה סביב עקרון אחד פשוט: להעמיד את הלקוח מעל כל שיקול אחר.
                    </p>
                    <p>
                      הצוות שלנו כולל סוכני ביטוח מורשים, יועצי פנסיה ומומחי פיננסים. כולם עצמאיים, כולם ללא תלות בחברה אחת. זו לא אמירה שיווקית. זו התשתית המשפטית והעסקית שלנו.
                    </p>
                    <p className="text-white font-semibold">
                      לכל לקוח אצלנו יש יועץ אישי.
                    </p>
                    <p>
                      אדם אחד שמכיר את התיק שלך, את המשפחה שלך ואת השינויים שאתה עובר לאורך השנים. לא מוקד. לא נציג מתחלף. קשר מקצועי ארוך טווח עם מי שאחראי לתוצאה.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#f4a261] text-[#0a3d3d] font-bold text-base hover:bg-[#f5b17e] hover:scale-[1.02] transition-all shadow-xl shadow-[#f4a261]/25"
                    >
                      קביעת פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/[0.06] transition-all"
                    >
                      הכירו את הצוות
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Left side - Trust points */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                {trustPoints.map((point) => (
                  <motion.div
                    key={point.title}
                    variants={staggerItem}
                    className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md"
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.06)" }}
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
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Wave: dark -> white */}
        <WaveDivider color="#ffffff" flip />


        {/* PROCESS PIPELINE — Tech System Flow */}
        <section className="py-10 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-8 sm:mb-14">
                <SectionLabel>PROCESS</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-4 leading-[1.15]">
                  תהליך העבודה <span className="text-[#1a8f7d]">של הבית</span>
                </h2>
                <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  ששה שלבים מובנים מהפנייה הראשונית ועד ליווי שוטף. מתודולוגיה מקצועית שמבטיחה דיוק בכל שלב.
                </p>
              </div>
            </ScrollReveal>

            {/* Desktop: horizontal pipeline */}
            <div className="hidden md:block">
              <div className="relative">
                {/* Gradient pipeline line */}
                <div className="absolute top-[52px] right-[8%] left-[8%] h-[3px] z-0">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(to left, #5ec6c6, #f4a261, #90be6d, #e76f51, #5ec6c6, #f4a261)" }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    /* transform origin for RTL: line fills from right */
                    {...{ style: { background: "linear-gradient(to left, #5ec6c6, #f4a261, #90be6d, #e76f51, #5ec6c6, #f4a261)", transformOrigin: "right" } }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                  {processSteps.map((step, i) => (
                    <motion.div
                      key={step.number}
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ delay: 0.15 * i + 0.3, duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Numbered circle */}
                      <motion.div
                        className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] lg:w-[104px] lg:h-[104px] rounded-full flex items-center justify-center mb-5 border-[3px] border-white shadow-xl relative"
                        style={{ backgroundColor: step.color, boxShadow: `0 8px 30px ${step.color}40` }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {/* Step number badge */}
                        <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#0a3d3d] flex items-center justify-center shadow-md">
                          <span className="text-white text-xs font-extrabold">{step.number}</span>
                        </div>
                        <step.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      {/* Title */}
                      <h3 className="text-base font-extrabold text-[#0a3d3d] mb-2 leading-tight">{step.title}</h3>
                      {/* Description */}
                      <p className="text-xs text-[#0a3d3d]/45 leading-relaxed max-w-[160px]">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: vertical pipeline (line on the right side - RTL) */}
            <div className="md:hidden">
              <div className="relative pr-14">
                {/* Vertical gradient line on the right */}
                <div className="absolute right-[22px] top-0 bottom-0 w-[3px] z-0">
                  <motion.div
                    className="w-full h-full rounded-full"
                    style={{ background: "linear-gradient(to bottom, #5ec6c6, #f4a261, #90be6d, #e76f51, #5ec6c6, #f4a261)" }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    {...{ style: { background: "linear-gradient(to bottom, #5ec6c6, #f4a261, #90be6d, #e76f51, #5ec6c6, #f4a261)", transformOrigin: "top" } }}
                  />
                </div>

                <div className="space-y-8">
                  {processSteps.map((step, i) => (
                    <motion.div
                      key={step.number}
                      className="relative flex items-start gap-5"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: 0.12 * i, duration: 0.5, ease: "easeOut" }}
                    >
                      {/* Circle on the line */}
                      <div
                        className="absolute right-[-56px] top-0 w-[44px] h-[44px] rounded-full flex items-center justify-center border-[3px] border-white shadow-lg z-10"
                        style={{ backgroundColor: step.color, boxShadow: `0 4px 16px ${step.color}35` }}
                      >
                        <span className="text-white text-sm font-extrabold">{step.number}</span>
                      </div>
                      {/* Content card */}
                      <div className="bg-white border border-[#0a3d3d]/[0.06] rounded-xl p-5 flex-1 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-2">
                          <step.icon className="w-4 h-4 flex-shrink-0" style={{ color: step.color }} />
                          <h3 className="text-base font-extrabold text-[#0a3d3d]">{step.title}</h3>
                        </div>
                        <p className="text-sm text-[#0a3d3d]/45 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO SCANNER */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <ScrollReveal>
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="space-y-6 text-center lg:text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a8f7d]/[0.08] border border-[#1a8f7d]/15">
                    <span className="w-2 h-2 rounded-full bg-[#1a8f7d] animate-pulse" />
                    <span className="text-xs font-bold text-[#1a8f7d] tracking-wide">בדיקה מקצועית · 48 שעות</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a3d3d] tracking-tight leading-[1.1]">
                    <span className="text-[#1a8f7d]">תמונה מלאה</span> של התיק
                  </h2>
                  <p className="text-[#0a3d3d]/60 text-base sm:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                    הכלי המקצועי של SEELD מאגד את כל הנתונים מהחברות, מזהה כפילויות, דמי ניהול חריגים וכיסויים חסרים. דוח מפורט במייל, פגישת הסבר עם יועץ ייעודי.
                  </p>
                  <Link to="/contact">
                    <Button className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-8 py-5 text-base font-bold shadow-xl shadow-[#0a3d3d]/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all mt-4 min-h-[52px]">
                      בקשת בדיקת תיק
                      <ArrowDownLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </Link>
                </div>
                <motion.div className="bg-white rounded-3xl shadow-2xl shadow-[#0a3d3d]/8 border border-[#0a3d3d]/[0.06] overflow-hidden max-w-md mx-auto w-full"
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}>
                  <div className="bg-[#0a3d3d] px-5 py-3.5 flex items-center gap-3">
                    <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e76f51]" /><span className="w-2.5 h-2.5 rounded-full bg-[#f4a261]" /><span className="w-2.5 h-2.5 rounded-full bg-[#90be6d]" /></div>
                    <span className="text-white/60 text-xs font-medium">SEELD — סריקת תיק ביטוח</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <motion.div className="w-3 h-3 rounded-full bg-[#5ec6c6]" animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <span className="text-sm font-bold text-[#0a3d3d]">סורק את התיק...</span>
                    </div>
                    {[
                      { label: "כפל ביטוחי", status: "נמצא", color: "#e76f51" },
                      { label: "דמי ניהול גבוהים", status: "2 מוצרים", color: "#f4a261" },
                      { label: "מסלול השקעה לא מתאים", status: "לבדוק", color: "#f4a261" },
                      { label: "תשואה מתחת לממוצע", status: "קרן פנסיה", color: "#e76f51" },
                      { label: "כיסוי אובדן כושר", status: "חסר", color: "#e76f51" },
                      { label: "ביטוח בריאות", status: "תקין ✓", color: "#90be6d" },
                      { label: "חיסכון לילדים", status: "תקין ✓", color: "#90be6d" },
                    ].map((item, i) => (
                      <motion.div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.4 }}>
                        <span className="text-xs sm:text-sm text-[#0a3d3d]/70">{item.label}</span>
                        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.status}</span>
                      </motion.div>
                    ))}
                    <motion.div className="mt-3 pt-3 border-t-2 border-[#0a3d3d]/[0.06]" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0a3d3d]">פוטנציאל חיסכון שנתי</span>
                        <motion.span className="text-lg font-extrabold text-[#5ec6c6]" initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.4, type: "spring" }}>₪4,200</motion.span>
                      </div>
                      <motion.div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5 }}>
                        <motion.div className="h-full rounded-full bg-gradient-to-l from-[#5ec6c6] to-[#90be6d]" initial={{ width: "0%" }} whileInView={{ width: "72%" }} viewport={{ once: true }} transition={{ delay: 1.7, duration: 1, ease: "easeOut" }} />
                      </motion.div>
                      <p className="text-[10px] text-[#0a3d3d]/40 mt-1.5">72% מהתיק נסרק — נמצאו 3 הזדמנויות לשיפור</p>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* Wave: white -> gray */}
        <WaveDivider color="#f8f9fc" />

        {/* 10. FAQ PREVIEW */}
        <section className="bg-[#f8f9fc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-8 sm:mb-14">
                <SectionLabel>FAQ</SectionLabel>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-4 leading-[1.15]">
                  שאלות <span className="text-[#1a8f7d]">שעולות בכל תיק</span>
                </h2>
                <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
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
                  <Accordion type="single" collapsible className="space-y-4">
                    {faqItems.map((item, i) => (
                      <motion.div key={i} variants={staggerItem}>
                        <AccordionItem
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
                      </motion.div>
                    ))}
                  </Accordion>
                </motion.div>

                <ScrollReveal delay={200}>
                  <div className="text-center mt-10">
                    <Link
                      to="/faq"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#0a3d3d] hover:text-[#5ec6c6] transition-colors"
                    >
                      לכל השאלות הנפוצות
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
          </div>
        </section>

        {/* Wave: gray -> white */}
        <WaveDivider color="#ffffff" flip />

        {/* 11. CONTACT STRIP — Premium minimal bar */}
        <motion.section
          className="bg-[#0a3d3d]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-white/10" style={{ direction: "rtl" }}>
              {/* Phone */}
              <a
                href="tel:0523097444"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.04] rounded-lg sm:rounded-none"
              >
                <Phone className="w-[18px] h-[18px] text-[#5ec6c6] flex-shrink-0" />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">טלפון</span>
                  <span className="block text-white/40 text-xs mt-0.5" dir="ltr">052-309-7444</span>
                  <span className="block text-white/30 text-[10px]" dir="ltr">09-774-2103</span>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.04] rounded-lg sm:rounded-none"
              >
                <MessageCircle className="w-[18px] h-[18px] text-[#90be6d] flex-shrink-0" />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">WhatsApp</span>
                  <span className="block text-white/40 text-xs mt-0.5">שלחו הודעה</span>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@seeld.co.il"
                className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2 group transition-colors hover:bg-white/[0.04] rounded-lg sm:rounded-none"
              >
                <Mail className="w-[18px] h-[18px] text-[#f4a261] flex-shrink-0" />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold group-hover:text-white transition-colors">אימייל</span>
                  <span className="block text-white/40 text-xs mt-0.5" dir="ltr">info@seeld.co.il</span>
                </div>
              </a>

              {/* Offices */}
              <div className="flex items-center justify-center gap-3 py-3 sm:py-4 px-2">
                <MapPin className="w-[18px] h-[18px] text-[#e76f51] flex-shrink-0" />
                <div className="text-center sm:text-right">
                  <span className="block text-white/90 text-sm font-bold">משרדים</span>
                  <span className="block text-white/40 text-xs mt-0.5">רעננה | ירושלים</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contact Form — standalone below the strip */}
        <section className="py-10 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="text-center mb-10">
                <SectionLabel>CONTACT</SectionLabel>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0a3d3d] mb-3 leading-[1.15]">
                  <span className="text-[#1a8f7d]">השיחה הראשונה</span> על חשבוננו
                </h2>
                <p className="text-[#0a3d3d]/55 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                  השאירו פרטים ויועץ מהצוות שלנו יצור קשר באותו יום עבודה.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-7 sm:p-9 shadow-lg shadow-[#0a3d3d]/[0.03]">
                <form className="space-y-5" onSubmit={handleContactSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input
                      type="text"
                      placeholder="שם מלא"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-base sm:text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all min-h-[44px]"
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-base sm:text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all min-h-[44px]"
                      dir="ltr"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="אימייל (לא חובה)"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-1 py-3.5 bg-transparent border-b-2 border-[#0a3d3d]/10 text-[#0a3d3d] text-base sm:text-sm placeholder:text-[#0a3d3d]/25 focus:outline-none focus:border-[#5ec6c6] transition-all min-h-[44px]"
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
                    className="w-full px-6 py-4 rounded-full bg-[#0a3d3d] text-white font-bold text-base hover:bg-[#0d4a4a] transition-colors disabled:opacity-60 shadow-lg shadow-[#0a3d3d]/15 min-h-[48px]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {contactSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "שליחה"}
                  </motion.button>
                </form>
              </div>
            </ScrollReveal>
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
                    פורטל SEELD לסוכנים — כל הכלים שצריך בשביל לנהל סוכנות חכמה. CRM, ניתוח תיקים, ליקויים ומסמכים.
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
