import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calculator, PiggyBank, Car, Home, Heart, Briefcase, Wallet, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MortgageCalculator from "@/components/MortgageCalculator";
import PensionCalculator from "@/components/PensionCalculator";
import SavingsCalculator from "@/components/SavingsCalculator";
import GoalCalculator from "@/components/GoalCalculator";
import CompareCalculator from "@/components/CompareCalculator";
import ScrollReveal from "@/components/ScrollReveal";
import DoodleDecoration from "@/components/DoodleDecoration";
import FeatureCard from "@/components/FeatureCard";
import { LogoDotsDivider } from "@/components/LogoBrandElements";

const Calculators = () => {
  const otherCalculators = [
    {
      title: "מחשבון ביטוח חיים",
      description: "כמה כיסוי ביטוחי אתם באמת צריכים?",
      icon: Heart,
      color: "bg-red-100 dark:bg-red-900/30",
      comingSoon: true,
    },
    {
      title: "מחשבון ביטוח רכב",
      description: "השוו מחירי ביטוח רכב בהתאם לפרופיל שלכם",
      icon: Car,
      color: "bg-yellow-100 dark:bg-yellow-900/30",
      comingSoon: true,
    },
    {
      title: "מחשבון מס הכנסה",
      description: "חשבו את גובה המס והחזרים אפשריים",
      icon: Briefcase,
      color: "bg-orange-100 dark:bg-orange-900/30",
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir="rtl">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center space-y-6 relative">
          <div className="absolute top-0 left-8 hidden lg:block">
            <DoodleDecoration type="calculator" size="lg" className="opacity-30 rotate-6" />
          </div>
          <div className="absolute top-4 right-8 hidden lg:block">
            <DoodleDecoration type="growth" size="md" className="opacity-25 -rotate-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-down">
            מחשבונים פיננסיים
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up stagger-1">
            כלים חכמים לתכנון פיננסי. חשבו משכנתא, פנסיה, ביטוחים וחיסכון בקלות.
          </p>
        </div>

        <LogoDotsDivider />

        {/* Tabs for Calculators */}
        <Tabs defaultValue="mortgage" className="space-y-8">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted p-2 rounded-2xl">
            <TabsTrigger value="mortgage" className="flex-1 min-w-[100px] rounded-xl flex items-center gap-2 text-sm">
              <Home className="w-4 h-4" />
              משכנתא
            </TabsTrigger>
            <TabsTrigger value="pension" className="flex-1 min-w-[100px] rounded-xl flex items-center gap-2 text-sm">
              <PiggyBank className="w-4 h-4" />
              פנסיה
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1 min-w-[100px] rounded-xl flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4" />
              חיסכון
            </TabsTrigger>
            <TabsTrigger value="goal" className="flex-1 min-w-[100px] rounded-xl flex items-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              יעד
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex-1 min-w-[100px] rounded-xl flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              השוואה
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mortgage" className="animate-fade-in">
            <div className="rounded-2xl bg-card p-6 md:p-8 border border-border text-right">
              <div className="flex items-center justify-end gap-3 mb-6 flex-row-reverse">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">מחשבון משכנתא</h2>
                  <p className="text-muted-foreground text-sm">חשבו החזר חודשי ועלות כוללת של המשכנתא</p>
                </div>
              </div>
              <MortgageCalculator />
            </div>
          </TabsContent>

          <TabsContent value="pension" className="animate-fade-in">
            <div className="rounded-2xl bg-card p-6 md:p-8 border border-border text-right">
              <div className="flex items-center justify-end gap-3 mb-6 flex-row-reverse">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">מחשבון פנסיה</h2>
                  <p className="text-muted-foreground text-sm">חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות</p>
                </div>
              </div>
              <PensionCalculator />
            </div>
          </TabsContent>

          <TabsContent value="savings" className="animate-fade-in">
            <div className="rounded-2xl bg-card p-6 md:p-8 border border-border text-right">
              <div className="flex items-center justify-end gap-3 mb-6 flex-row-reverse">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">מחשבון חיסכון</h2>
                  <p className="text-muted-foreground text-sm">חשבו כמה תצברו עם ריבית דריבית</p>
                </div>
              </div>
              <SavingsCalculator />
            </div>
          </TabsContent>

          <TabsContent value="goal" className="animate-fade-in">
            <div className="rounded-2xl bg-card p-6 md:p-8 border border-border text-right">
              <div className="flex items-center justify-end gap-3 mb-6 flex-row-reverse">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">מחשבון יעד כלכלי</h2>
                  <p className="text-muted-foreground text-sm">כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?</p>
                </div>
              </div>
              <GoalCalculator />
            </div>
          </TabsContent>

          <TabsContent value="compare" className="animate-fade-in">
            <div className="rounded-2xl bg-card p-6 md:p-8 border border-border text-right">
              <div className="flex items-center justify-end gap-3 mb-6 flex-row-reverse">
                <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">השוואת מסלולי השקעה</h2>
                  <p className="text-muted-foreground text-sm">ראו איך הכסף שלכם גדל בכל מסלול</p>
                </div>
              </div>
              <CompareCalculator />
            </div>
          </TabsContent>
        </Tabs>

        {/* Feature Cards */}
        <section className="mt-16 space-y-6">
          <ScrollReveal>
            <FeatureCard
              title="תכנון פנסיוני מקיף"
              description="רוצים לדעת כמה תקבלו בגיל הפרישה? השתמשו במחשבון הפנסיה שלנו לתכנון חכם."
              bgColor="bg-[hsl(var(--muted))]"
              doodle="pension"
              buttonText="למחשבון פנסיה"
              buttonHref="/savings/pension-funds"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureCard
              title="השוואת מסלולים"
              description="השוו בין מסלולי השקעה שונים וגלו מה הכי משתלם עבורכם לטווח הארוך."
              bgColor="bg-primary/5"
              doodle="charts"
              buttonText="להשוואה"
              buttonHref="/return-tables"
            />
          </ScrollReveal>
        </section>

        {/* Other Calculators Coming Soon */}
        <section className="mt-12 relative">
          <div className="absolute -top-4 right-4 hidden lg:block">
            <DoodleDecoration type="savings" size="md" className="opacity-25 rotate-12" />
          </div>
          
          <ScrollReveal>
            <h2 className="text-2xl font-bold mb-6">מחשבונים נוספים בקרוב</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherCalculators.map((calc, index) => (
              <ScrollReveal key={calc.title} delay={index * 100}>
                <div className="rounded-2xl bg-card p-6 border border-border opacity-75">
                  <div className={`w-14 h-14 rounded-xl ${calc.color} flex items-center justify-center mb-4`}>
                    <calc.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{calc.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{calc.description}</p>
                  <Button className="w-full rounded-full" variant="outline" disabled>
                    בקרוב
                  </Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
