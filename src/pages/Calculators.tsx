import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PiggyBank, Home, Heart, Briefcase, Wallet, Target, BarChart3, Car, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MortgageCalculator from "@/components/MortgageCalculator";
import PensionCalculator from "@/components/PensionCalculator";
import SavingsCalculator from "@/components/SavingsCalculator";
import GoalCalculator from "@/components/GoalCalculator";
import CompareCalculator from "@/components/CompareCalculator";
import { Link } from "react-router-dom";

const Calculators = () => {
  const comingSoon = [
    {
      title: "מחשבון ביטוח חיים",
      description: "כמה כיסוי ביטוחי אתם באמת צריכים?",
      icon: Heart,
    },
    {
      title: "מחשבון ביטוח רכב",
      description: "השוו מחירי ביטוח רכב בהתאם לפרופיל שלכם",
      icon: Car,
    },
    {
      title: "מחשבון מס הכנסה",
      description: "חשבו את גובה המס והחזרים אפשריים",
      icon: Briefcase,
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#0a3d3d] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            מחשבונים פיננסיים
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">
            כלים חכמים לתכנון פיננסי. חשבו משכנתא, פנסיה, חיסכון ועוד בקלות.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">מחשבונים</span>
        </nav>
      </div>

      <main>
        {/* Calculator Tabs */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Tabs defaultValue="mortgage" className="space-y-8">
              <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-gray-50 p-2 rounded-2xl justify-center border border-gray-200">
                <TabsTrigger value="mortgage" className="flex-1 min-w-[80px] min-h-[44px] rounded-xl flex items-center gap-2 text-sm data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
                  <Home className="w-4 h-4" />
                  משכנתא
                </TabsTrigger>
                <TabsTrigger value="pension" className="flex-1 min-w-[80px] min-h-[44px] rounded-xl flex items-center gap-2 text-sm data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
                  <PiggyBank className="w-4 h-4" />
                  פנסיה
                </TabsTrigger>
                <TabsTrigger value="savings" className="flex-1 min-w-[80px] min-h-[44px] rounded-xl flex items-center gap-2 text-sm data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
                  <Wallet className="w-4 h-4" />
                  חיסכון
                </TabsTrigger>
                <TabsTrigger value="goal" className="flex-1 min-w-[80px] min-h-[44px] rounded-xl flex items-center gap-2 text-sm data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
                  <Target className="w-4 h-4" />
                  יעד
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex-1 min-w-[80px] min-h-[44px] rounded-xl flex items-center gap-2 text-sm data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4" />
                  השוואה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mortgage">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <Home className="w-6 h-6 text-[#0a3d3d]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">מחשבון משכנתא</h2>
                      <p className="text-gray-500 text-sm">חשבו החזר חודשי ועלות כוללת של המשכנתא</p>
                    </div>
                  </div>
                  <MortgageCalculator />
                </div>
              </TabsContent>

              <TabsContent value="pension">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <PiggyBank className="w-6 h-6 text-[#0a3d3d]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">מחשבון פנסיה</h2>
                      <p className="text-gray-500 text-sm">חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות</p>
                    </div>
                  </div>
                  <PensionCalculator />
                </div>
              </TabsContent>

              <TabsContent value="savings">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-[#0a3d3d]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">מחשבון חיסכון</h2>
                      <p className="text-gray-500 text-sm">חשבו כמה תצברו עם ריבית דריבית</p>
                    </div>
                  </div>
                  <SavingsCalculator />
                </div>
              </TabsContent>

              <TabsContent value="goal">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#0a3d3d]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">מחשבון יעד כלכלי</h2>
                      <p className="text-gray-500 text-sm">כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?</p>
                    </div>
                  </div>
                  <GoalCalculator />
                </div>
              </TabsContent>

              <TabsContent value="compare">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-[#0a3d3d]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">השוואת מסלולי השקעה</h2>
                      <p className="text-gray-500 text-sm">ראו איך הכסף שלכם גדל בכל מסלול</p>
                    </div>
                  </div>
                  <CompareCalculator />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Coming Soon */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-8">מחשבונים נוספים בקרוב</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoon.map((calc) => (
                <div key={calc.title} className="bg-white border border-gray-200 rounded-2xl p-6 opacity-70">
                  <div className="w-12 h-12 rounded-xl bg-[#5ec6c6]/10 flex items-center justify-center mb-4">
                    <calc.icon className="w-6 h-6 text-[#0a3d3d]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0a3d3d] mb-2">{calc.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{calc.description}</p>
                  <span className="inline-block px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-full">
                    בקרוב
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-2xl p-8 sm:p-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">צריכים עזרה בתכנון?</h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                המחשבונים הם נקודת התחלה. לתכנון פיננסי מקיף, דברו עם המומחים שלנו.
              </p>
              <Link
                to="/contact"
                className="inline-block px-8 py-3.5 bg-[#5ec6c6] text-[#0a3d3d] font-semibold rounded-full hover:bg-[#4db5b5] transition-colors"
              >
                לשיחת ייעוץ
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Calculators;
