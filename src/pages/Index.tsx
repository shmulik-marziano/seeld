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

const Index = () => {
  const featuredArticles = articles.slice(0, 6);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <section className="py-8 space-y-5 relative">
          <LogoDotsBackground />
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
          <section className="py-4">
            <div className="rounded-2xl bg-[hsl(210,30%,15%)] p-6 md:p-8 hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-l from-[hsl(210,40%,20%)] to-transparent opacity-50" />
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                <a 
                  href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center sm:text-right space-y-2 flex-1 hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-lg md:text-xl font-bold text-white">ביטוח נסיעות לחו״ל</h3>
                  <p className="text-white/60 text-sm">רכישה מיידית ומאובטחת — לחצו לפרטים</p>
                </a>
                
                <div className="relative inline-block shrink-0">
                  <img
                    src={travelLogos}
                    alt="הראל ביטוח נסיעות - PassportCard"
                    className="h-14 md:h-20 w-auto rounded-lg"
                  />
                  <div className="absolute inset-0 flex">
                    <a
                      href="https://digital.harel-group.co.il/travel-policy?guid=bee1d408-c6a7-410e-b4ee-ac690224bdd3&an=025318"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-1/2 h-full cursor-pointer rounded-l-lg hover:bg-white/5 transition-colors"
                      title="רכישת ביטוח הראל"
                    />
                    <a
                      href="https://buy.passportcard.co.il/?AffiliateId=fOYE25Ik9VYSMk30irogAg%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-1/2 h-full cursor-pointer rounded-r-lg hover:bg-white/5 transition-colors"
                      title="רכישת ביטוח PassportCard"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Brand divider */}
        <LogoDotsDivider />

        {/* Featured Articles Grid */}
        <section id="articles" className="py-12 md:py-16 relative">
          <div className="absolute -top-4 left-4 hidden lg:block">
            <DoodleDecoration type="growth" size="lg" className="opacity-40 -rotate-12" parallax parallaxSpeed={0.12} />
          </div>

          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm">
                  <span className="text-xs text-muted-foreground font-medium">📚 בלוג ומדריכים</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">מדריכים ומאמרים</h2>
              </div>
              <a href="#all" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors px-5 py-2.5 rounded-full hover:bg-muted/60 border border-transparent hover:border-border/50">
                ← הצג הכל
              </a>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article, index) => (
              <ScrollReveal key={article.id} delay={index * 80}>
                <ArticleCard {...article} size="small" />
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <ScrollReveal direction="scale">
          <section className="my-16 md:my-20 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(var(--accent)/0.8)]" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-[60px]" />
            </div>

            <div className="relative p-10 md:p-16 text-center">
              <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="text-xs text-primary-foreground/80 font-medium">✉️ ניוזלטר</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary-foreground">קבלו עדכונים והטבות</h2>
                <p className="text-lg text-primary-foreground/70 leading-relaxed">
                  הירשמו לקבלת טיפים פיננסיים, מדריכים בנושאי ביטוח והטבות בלעדיות ישירות לתיבת הדואר שלכם.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="האימייל שלכם"
                    className="flex-1 px-6 py-4 rounded-full bg-white/15 border border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all text-right backdrop-blur-sm"
                  />
                  <button className="px-10 py-4 rounded-full bg-primary-foreground text-primary font-semibold hover:bg-primary-foreground/90 hover:scale-105 transition-all shadow-lg">
                    הרשמה
                  </button>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Agent Platform CTA */}
        <ScrollReveal>
          <section className="my-12 md:my-16">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-right">
                <h3 className="text-xl md:text-2xl font-bold">סוכן ביטוח? הכלים שלך מחכים כאן</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  פורטל SEELD לסוכנים — ניהול לקוחות, מעקב פוליסות, חישובים מתקדמים וכלי עבודה חכמים במקום אחד.
                </p>
              </div>
              <Link
                to="/app/auth"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 hover:scale-105 transition-all shadow-lg shrink-0"
              >
                <LogIn className="w-5 h-5" />
                כניסה לפורטל סוכנים
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
