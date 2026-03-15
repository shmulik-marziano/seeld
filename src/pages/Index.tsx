import { Link } from "react-router-dom";
import { LogIn, Car, HeartPulse, Landmark, PiggyBank, Calculator, PhoneCall, Shield, Users, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import ScrollReveal from "@/components/ScrollReveal";
import { motion } from "framer-motion";
import travelLogos from "@/assets/travel-insurance-logos.jpeg";

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
    description: "ניסיון של למעלה מ-15 שנה בתחום הביטוח והפיננסים עם מאות לקוחות מרוצים.",
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
                  <div className="h-full bg-background border border-border/50 rounded-2xl p-5 sm:p-8 hover:shadow-md hover:border-border transition-all duration-300 group">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-[#0a3d3d] dark:group-hover:text-[#5ec6c6] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {service.description}
                    </p>
                    <span className="text-sm font-medium text-[#0a3d3d] dark:text-[#5ec6c6]">
                      {service.buttonText} &larr;
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Why SEELD Section */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
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
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#0a3d3d]/8 dark:bg-[#5ec6c6]/10 flex items-center justify-center mx-auto mb-5">
                      <item.icon className="w-6 h-6 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Numbers Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { value: "15+", label: "שנות ניסיון" },
                { value: "5,000+", label: "לקוחות" },
                { value: "98%", label: "שביעות רצון" },
                { value: "24/7", label: "זמינות" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#0a3d3d] dark:text-[#5ec6c6] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* Travel Insurance Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
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
