import { Link } from "react-router-dom";
import {
  LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall,
  Shield, Users, Award, Home, Plane, Heart, Baby, Briefcase, Umbrella,
  Building2, HandCoins, TrendingUp, GraduationCap, UserCheck,
  Wallet, BarChart3, DollarSign, HelpCircle, Mail, MapPin, Phone,
  MessageCircle, ChevronLeft, Stethoscope, Key, UserPlus, Globe,
  Scale, Activity, Banknote, Target, CalendarCheck, FileText
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import travelLogos from "@/assets/travel-insurance-logos.jpeg";

// ── Data ──

const quickActions = [
  { icon: Car, label: "ביטוח רכב", href: "/insurance/vehicle" },
  { icon: HeartPulse, label: "ביטוח בריאות", href: "/insurance/health" },
  { icon: Landmark, label: "פנסיה", href: "/savings/pension-funds" },
  { icon: PiggyBank, label: "חיסכון", href: "/savings/gemel-investment" },
  { icon: Calculator, label: "מחשבונים", href: "/calculators" },
  { icon: PhoneCall, label: "יצירת קשר", href: "/contact" },
];

const services = [
  {
    title: "ביטוח מקיף ומותאם",
    description: "מגוון פתרונות ביטוח לכל שלבי החיים — בריאות, חיים, רכב, דירה ועוד. הגנה אמיתית למשפחה שלכם.",
    href: "/insurances",
    buttonText: "לכל הביטוחים",
  },
  {
    title: "חיסכון ופנסיה",
    description: "תכנון פנסיוני, קרנות השתלמות, קופות גמל והשקעות — כל הכלים לעתיד פיננסי בטוח.",
    href: "/savings/pension-funds",
    buttonText: "התחילו לחסוך",
  },
  {
    title: "מחשבונים פיננסיים",
    description: "כלים חכמים לחישוב משכנתא, פנסיה, חיסכון ועוד — קבלו תמונה מלאה ברגע.",
    href: "/calculators",
    buttonText: "לחשב עכשיו",
  },
  {
    title: "שאלון הצטרפות",
    description: "פתיחת תיק לקוח דיגיטלי בקלות — מלאו את הפרטים וקבלו שירות מותאם אישית.",
    href: "/onboarding",
    buttonText: "למילוי השאלון",
  },
];

const whySeeld = [
  {
    icon: Shield,
    title: "מקצועיות ואמינות",
    description: "חלק מבית עמיתים הון — סוכנות ביטוח ופיננסים מבוססת עם מוניטין של מקצועיות.",
  },
  {
    icon: Users,
    title: "שירות אישי",
    description: "כל לקוח מקבל ליווי צמוד ומענה מהיר. אנחנו כאן בשבילכם בכל שלב.",
  },
  {
    icon: Award,
    title: "פתרונות מותאמים",
    description: "לא פתרון גנרי — אנחנו מתאימים את התוכנית הפיננסית בדיוק לצרכים שלכם.",
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

const trustPoints = [
  { icon: Award, title: "רישיון סוכן ביטוח פנסיוני", description: "מורשה ומפוקח ע״י רשות שוק ההון" },
  { icon: Building2, title: "חלק מבית עמיתים הון", description: "סוכנות ביטוח ופיננסים מבוססת ומוכרת" },
  { icon: UserCheck, title: "שירות אישי ונגיש", description: "מענה מהיר, ליווי צמוד ויחס אנושי" },
  { icon: Scale, title: "אובייקטיביות מלאה", description: "עבודה מול כל חברות הביטוח — ההמלצה הכי טובה עבורכם" },
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
];

// ── Card animation variants ──
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <HeroSection />
        </div>

        {/* Quick Actions Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
          <ScrollReveal>
            <div className="bg-background border border-border/50 rounded-2xl shadow-lg shadow-black/[0.04] p-4 sm:p-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className="flex flex-col items-center gap-2.5 py-3 px-2 rounded-xl hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center group-hover:bg-[#0a3d3d]/14 dark:group-hover:bg-[#5ec6c6]/20 transition-colors">
                      <action.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Services Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                השירותים שלנו
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                פתרונות פיננסיים וביטוחיים מקיפים, מותאמים אישית לכל שלב בחיים
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {services.map((service, i) => (
              <ScrollReveal key={service.title} delay={i * 80}>
                <Link to={service.href} className="block h-full">
                  <motion.div
                    className="h-full bg-background border border-border/50 rounded-2xl p-5 sm:p-8 hover:shadow-md hover:border-border transition-all duration-300 group"
                    whileHover={{ scale: 1.015, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-[#0a3d3d] dark:group-hover:text-[#5ec6c6] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {service.description}
                    </p>
                    <span className="text-sm font-medium text-[#0a3d3d] dark:text-[#5ec6c6]">
                      {service.buttonText} &larr;
                    </span>
                  </motion.div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ═══════════ A. כל סוגי הביטוח ═══════════ */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  כל סוגי הביטוח
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  מגוון פתרונות ביטוח מקיפים לכל תחומי החיים — הכל במקום אחד
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {insuranceTypes.map((item, i) => (
                <motion.div
                  key={item.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={cardVariants}
                >
                  <Link to={item.href} className="block h-full">
                    <motion.div
                      className="h-full bg-background border border-border/50 rounded-xl p-5 hover:shadow-md hover:border-[#5ec6c6]/30 transition-all duration-300 group"
                      whileHover={{ scale: 1.03, y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3 group-hover:bg-[#0a3d3d]/14 dark:group-hover:bg-[#5ec6c6]/20 transition-colors">
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
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0a3d3d] dark:text-[#5ec6c6] hover:underline"
                >
                  לכל הביטוחים שלנו
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ═══════════ B. חיסכון ופנסיה ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                חיסכון ופנסיה
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                בניית עתיד פיננסי חזק — קרנות פנסיה, חיסכון, השקעות ותכנון לפרישה
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {savingsProducts.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={cardVariants}
              >
                <Link to={item.href} className="block h-full">
                  <motion.div
                    className="h-full bg-background border border-border/50 rounded-xl p-5 hover:shadow-md hover:border-[#5ec6c6]/30 transition-all duration-300 group"
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3 group-hover:bg-[#0a3d3d]/14 dark:group-hover:bg-[#5ec6c6]/20 transition-colors">
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

        {/* ═══════════ C. המחשבונים שלנו ═══════════ */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  המחשבונים שלנו
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                  כלים חכמים שיעזרו לכם לקבל החלטות פיננסיות מושכלות
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {calculators.map((calc, i) => (
                <ScrollReveal key={calc.title} delay={i * 100}>
                  <Link to="/calculators" className="block h-full">
                    <motion.div
                      className="h-full rounded-2xl overflow-hidden group cursor-pointer"
                      whileHover={{ scale: 1.03, y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={`bg-gradient-to-br ${calc.color} p-6 sm:p-8 h-full flex flex-col`}>
                        <motion.div
                          className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5"
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <calc.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <h3 className="text-base font-bold text-white mb-2">{calc.title}</h3>
                        <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1">{calc.description}</p>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5ec6c6] group-hover:text-white transition-colors">
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

        {/* Why SEELD Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
                למה SEELD?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                אנחנו מאמינים שביטחון פיננסי מגיע לכולם
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {whySeeld.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <motion.div
                  className="text-center"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ═══════════ D. למה לבחור ב-SEELD - Trust Section ═══════════ */}
        <section className="bg-[#0a3d3d] dark:bg-[#062e2e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Right side - About */}
              <ScrollReveal>
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                    שמוליק מרציאנו
                  </h2>
                  <p className="text-[#5ec6c6] font-medium text-lg">סוכן ביטוח פנסיוני מורשה</p>
                  <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                    שמוליק מרציאנו, סוכן ביטוח פנסיוני מורשה, מלווה לקוחות בצורה אישית ומקצועית.
                    SEELD הוא חלק מבית עמיתים הון — סוכנות ביטוח ופיננסים מבוססת.
                    אנחנו כאן כדי לעזור לכם להבין את עולם הביטוח והפנסיה בצורה פשוטה וברורה.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0a3d3d] font-semibold text-sm hover:bg-white/90 transition-colors"
                    >
                      קבעו פגישת ייעוץ
                    </Link>
                    <Link
                      to="/about"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      עוד עלינו
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              {/* Left side - Trust points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trustPoints.map((point, i) => (
                  <ScrollReveal key={point.title} delay={i * 100}>
                    <motion.div
                      className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm"
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#5ec6c6]/15 flex items-center justify-center mb-3">
                        <point.icon className="w-5 h-5 text-[#5ec6c6]" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{point.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{point.description}</p>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#0a3d3d] dark:text-[#5ec6c6] mb-1">
                  עמיתים הון
                </div>
                <div className="text-sm text-muted-foreground">סוכנות ביטוח ופיננסים מבוססת</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#0a3d3d] dark:text-[#5ec6c6] mb-1">
                  אישי
                </div>
                <div className="text-sm text-muted-foreground">שירות מקצועי בגובה העיניים</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#0a3d3d] dark:text-[#5ec6c6] mb-1">
                  24/7
                </div>
                <div className="text-sm text-muted-foreground">זמינות</div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════ E. שאלות נפוצות ═══════════ */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <ScrollReveal>
              <div className="text-center mb-12 sm:mb-16">
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
                      className="bg-background border border-border/50 rounded-xl px-5 overflow-hidden"
                    >
                      <AccordionTrigger className="text-sm sm:text-base font-medium hover:no-underline py-4">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="text-center mt-8">
                  <Link
                    to="/faq"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#0a3d3d] dark:text-[#5ec6c6] hover:underline"
                  >
                    לכל השאלות הנפוצות
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Travel Insurance Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ScrollReveal>
            <div className="rounded-2xl bg-[#0a3d3d] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center sm:text-right space-y-1 flex-1 hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-white">ביטוח נסיעות לחו״ל</h3>
                  <p className="text-white/50 text-sm">רכישה מיידית ומאובטחת</p>
                </a>
                <div className="relative inline-block shrink-0">
                  <img
                    src={travelLogos}
                    alt="הראל ביטוח נסיעות - PassportCard"
                    className="h-14 sm:h-16 w-auto rounded-xl"
                  />
                  <div className="absolute inset-0 flex">
                    <a
                      href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-1/2 h-full cursor-pointer rounded-l-xl hover:bg-white/5 transition-colors"
                      title="רכישת ביטוח הראל"
                    />
                    <a
                      href="https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-1/2 h-full cursor-pointer rounded-r-xl hover:bg-white/5 transition-colors"
                      title="רכישת ביטוח PassportCard"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ═══════════ F. צור קשר ═══════════ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 lg:pb-24">
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
                  className="block bg-background border border-border/50 rounded-xl p-5 hover:shadow-md hover:border-[#5ec6c6]/30 transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3">
                    <Phone className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">טלפון</h3>
                  <p className="text-xs text-muted-foreground" dir="ltr">09-774-2103</p>
                </motion.a>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <motion.a
                  href="mailto:info@seeld.co.il"
                  className="block bg-background border border-border/50 rounded-xl p-5 hover:shadow-md hover:border-[#5ec6c6]/30 transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">אימייל</h3>
                  <p className="text-xs text-muted-foreground">info@seeld.co.il</p>
                </motion.a>
              </ScrollReveal>

              <ScrollReveal delay={160}>
                <motion.a
                  href="https://wa.me/972523097444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-background border border-border/50 rounded-xl p-5 hover:shadow-md hover:border-[#5ec6c6]/30 transition-all duration-300"
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3">
                    <MessageCircle className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">וואטסאפ</h3>
                  <p className="text-xs text-muted-foreground" dir="ltr">052-309-7444</p>
                </motion.a>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <motion.div
                  className="bg-background border border-border/50 rounded-xl p-5"
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">משרדים</h3>
                  <p className="text-xs text-muted-foreground">רעננה | ירושלים</p>
                </motion.div>
              </ScrollReveal>
            </div>

            {/* Inline Contact Form */}
            <ScrollReveal delay={100}>
              <div className="bg-background border border-border/50 rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg font-bold mb-6">השאירו פרטים ונחזור אליכם</h3>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = "/contact";
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="שם מלא"
                      className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                    />
                    <input
                      type="tel"
                      placeholder="טלפון"
                      className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="אימייל"
                    className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all"
                  />
                  <textarea
                    placeholder="במה נוכל לעזור?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#5ec6c6]/40 focus:border-[#5ec6c6] transition-all resize-none"
                  />
                  <motion.button
                    type="submit"
                    className="w-full px-6 py-3 rounded-lg bg-[#0a3d3d] text-white font-semibold text-sm hover:bg-[#0d4a4a] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    שליחה
                  </motion.button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Agent Platform CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 lg:pb-24">
          <ScrollReveal>
            <div className="rounded-2xl border border-border/50 bg-background p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-right">
                <h3 className="text-xl sm:text-2xl font-bold">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  פורטל SEELD לסוכנים — ניהול לקוחות, מעקב פוליסות וכלי עבודה חכמים במקום אחד.
                </p>
              </div>
              <Link to="/app/auth" className="w-full sm:w-auto flex-shrink-0">
                <motion.span
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#0a3d3d] text-white font-semibold hover:bg-[#0d4a4a] transition-all w-full sm:w-auto text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogIn className="w-4 h-4" />
                  כניסה לפורטל סוכנים
                </motion.span>
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
