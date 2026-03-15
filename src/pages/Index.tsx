import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import HeroSection from "@/components/HeroSection";
import IntroSection from "@/components/IntroSection";
import ScrollReveal from "@/components/ScrollReveal";
import TestimonialsSection from "@/components/TestimonialsSection";
import StatsSection from "@/components/StatsSection";
import DoodleDecoration from "@/components/DoodleDecoration";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider, LogoDotsBackground } from "@/components/LogoBrandElements";
import { articles } from "@/data/articles";
import travelLogos from "@/assets/travel-insurance-logos.jpeg";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { siteSupabase } from "@/integrations/supabase/site-client";

const Index = () => {
  const featuredArticles = articles.slice(0, 6);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitting(true);
    try {
      const { error } = await siteSupabase.from("contact_submissions").insert([{
        email: newsletterEmail,
        subject: "newsletter",
        name: "",
        message: "Newsletter signup",
      }]);
      if (error) throw error;
      toast.success("נרשמתם בהצלחה! נשלח לכם עדכונים בקרוב.");
      setNewsletterEmail("");
    } catch (err) {
      toast.error("שגיאה בהרשמה, נסו שוב.");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Hero Section */}
        <HeroSection />

        {/* Brand divider */}
        <LogoDotsDivider />

        {/* Intro Section */}
        <IntroSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Brand divider */}
        <LogoDotsDivider />

        {/* Feature Cards */}
        <section className="py-8 sm:py-12 space-y-4 sm:space-y-5 md:space-y-6 relative">
          <LogoDotsBackground />

          {/* Section header */}
          <ScrollReveal>
            <div className="text-center mb-6 sm:mb-10">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm mb-4"
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-xs text-muted-foreground font-medium">השירותים שלנו</span>
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                פתרונות מותאמים אישית
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <FeatureCard
              title="ביטוח מקיף ומותאם"
              description="מגוון פתרונות ביטוח לכל שלבי החיים — בריאות, חיים, רכב, דירה ועוד. הגנה אמיתית למשפחה שלכם."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="umbrella"
              buttonText="גלו את הביטוחים"
              buttonHref="/insurances"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="חיסכון ופנסיה חכמה"
              description="תכנון פנסיוני, קרנות השתלמות, קופות גמל והשקעות — כל הכלים לעתיד פיננסי בטוח."
              bgColor="bg-primary/5"
              doodle="pension"
              buttonText="התחילו לחסוך"
              buttonHref="/savings/pension-funds"
            />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <FeatureCard
              title="מחשבונים פיננסיים"
              description="כלים חכמים לחישוב משכנתא, פנסיה, חיסכון ועוד — קבלו תמונה מלאה ברגע."
              bgColor="bg-accent/10"
              doodle="charts"
              buttonText="לחשב עכשיו"
              buttonHref="/calculators"
            />
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <FeatureCard
              title="שאלון הצטרפות"
              description="פתיחת תיק לקוח דיגיטלי בקלות — מלאו את הפרטים, חתמו על ההרשאות וקבלו שירות מותאם אישית."
              bgColor="bg-accent/8"
              doodle="handshake"
              buttonText="למילוי השאלון"
              buttonHref="/onboarding"
            />
          </ScrollReveal>
          <ScrollReveal delay={400}>
            <FeatureCard
              title='מילוי טופס הו"ק'
              description='מלאו את פרטי הבנק, בחרו יום חיוב נוח — וזהו. הוראת הקבע תוגדר עבורכם במהירות ובבטחה.'
              bgColor="bg-primary/8"
              doodle="key"
              buttonText='למילוי הטופס'
              buttonHref="/direct-debit"
            />
          </ScrollReveal>
        </section>

        {/* Travel Insurance Partner Banner */}
        <ScrollReveal delay={300}>
          <section className="py-4 sm:py-6">
            <motion.div
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[hsl(210,30%,15%)] to-[hsl(210,35%,12%)] p-5 sm:p-6 md:p-8 lg:p-10 hover:shadow-2xl transition-all duration-500 group overflow-hidden relative"
              whileHover={{ y: -2 }}
            >
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-l from-[hsl(210,40%,20%)] to-transparent opacity-50" />
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />

              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <a
                  href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center sm:text-right space-y-2 flex-1 hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">ביטוח נסיעות לחו״ל</h3>
                  <p className="text-white/60 text-xs sm:text-sm">רכישה מיידית ומאובטחת — לחצו לפרטים</p>
                </a>

                <div className="relative inline-block shrink-0">
                  <img
                    src={travelLogos}
                    alt="הראל ביטוח נסיעות - PassportCard"
                    className="h-12 sm:h-14 md:h-20 w-auto rounded-xl shadow-lg"
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
            </motion.div>
          </section>
        </ScrollReveal>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Brand divider */}
        <LogoDotsDivider />

        {/* Featured Articles Grid */}
        <section id="articles" className="py-10 sm:py-12 md:py-16 relative">
          <div className="absolute -top-4 left-4 hidden lg:block">
            <DoodleDecoration type="growth" size="lg" className="opacity-40 -rotate-12" parallax parallaxSpeed={0.12} />
          </div>

          <ScrollReveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm">
                  <span className="text-xs text-muted-foreground font-medium">בלוג ומדריכים</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">מדריכים ומאמרים</h2>
              </div>
              <a href="#all" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-muted/60 border border-transparent hover:border-border/50">
                ← הצג הכל
              </a>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {featuredArticles.map((article, index) => (
              <ScrollReveal key={article.id} delay={index * 80}>
                <ArticleCard {...article} size="small" />
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <ScrollReveal direction="scale">
          <section className="my-12 sm:my-16 md:my-20 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(var(--accent)/0.8)]" />
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute top-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px]"
                animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-[60px]"
                animate={{ scale: [1.1, 1, 1.1], y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="relative p-6 sm:p-10 md:p-16 text-center">
              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 relative z-10">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-xs text-primary-foreground/80 font-medium">ניוזלטר</span>
                </motion.div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground">קבלו עדכונים והטבות</h2>
                <p className="text-sm sm:text-base md:text-lg text-primary-foreground/70 leading-relaxed px-2">
                  הירשמו לקבלת טיפים פיננסיים, מדריכים בנושאי ביטוח והטבות בלעדיות ישירות לתיבת הדואר שלכם.
                </p>
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="האימייל שלכם"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full bg-white/15 border border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all text-right backdrop-blur-sm text-sm sm:text-base"
                  />
                  <motion.button
                    type="submit"
                    disabled={newsletterSubmitting}
                    className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-primary-foreground text-primary font-semibold hover:bg-primary-foreground/90 transition-all shadow-lg text-sm sm:text-base disabled:opacity-60"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {newsletterSubmitting ? "שולח..." : "הרשמה"}
                  </motion.button>
                </form>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Agent Platform CTA */}
        <ScrollReveal>
          <section className="my-8 sm:my-12 md:my-16">
            <motion.div
              className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 hover:border-border/60 transition-all duration-300"
              whileHover={{ y: -2, boxShadow: "0 20px 60px -15px hsl(var(--primary) / 0.08)" }}
            >
              <div className="space-y-2 text-center sm:text-right">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  פורטל SEELD לסוכנים — ניהול לקוחות, מעקב פוליסות, חישובים מתקדמים וכלי עבודה חכמים במקום אחד.
                </p>
              </div>
              <Link
                to="/app/auth"
                className="w-full sm:w-auto"
              >
                <motion.span
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 shrink-0 w-full sm:w-auto text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  כניסה לפורטל סוכנים
                </motion.span>
              </Link>
            </motion.div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
