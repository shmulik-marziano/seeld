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
import { usePageMeta } from "@/hooks/usePageMeta";

const Calculators = () => {
  usePageMeta("מחשבונים פיננסיים", "כלים חכמים לתכנון פיננסי: מחשבון משכנתא, פנסיה, חיסכון, יעדים והשוואה.");
  const comingSoon = [
    {
      title: "מחשבון ביטוח חיים",
      description: "כמה כיסוי ביטוחי אתם באמת צריכים?",
      icon: Heart,
      color: "#e76f51",
    },
    {
      title: "מחשבון ביטוח רכב",
      description: "השוו מחירי ביטוח רכב בהתאם לפרופיל שלכם",
      icon: Car,
      color: "#f4a261",
    },
    {
      title: "מחשבון מס הכנסה",
      description: "חשבו את גובה המס והחזרים אפשריים",
      icon: Briefcase,
      color: "#90be6d",
    },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Banner - Bold design */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        {/* Solid colored circles */}
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#e76f51]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#90be6d]" />

        {/* Dashed line */}
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            מחשבונים <span className="text-[#5ec6c6]">פיננסיים</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed">
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
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Tabs defaultValue="mortgage" className="space-y-8">
              <TabsList className="w-full flex flex-wrap h-auto gap-1.5 sm:gap-2 bg-[#f8f9fc] p-1.5 sm:p-2 rounded-2xl sm:rounded-full justify-center border border-[#0a3d3d]/[0.06]">
                <TabsTrigger value="mortgage" className="flex-1 min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] rounded-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0a3d3d]/20 transition-all px-2 sm:px-3">
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">משכנתא</span><span className="sm:hidden">משכנתא</span>
                </TabsTrigger>
                <TabsTrigger value="pension" className="flex-1 min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] rounded-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0a3d3d]/20 transition-all px-2 sm:px-3">
                  <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  פנסיה
                </TabsTrigger>
                <TabsTrigger value="savings" className="flex-1 min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] rounded-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0a3d3d]/20 transition-all px-2 sm:px-3">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  חיסכון
                </TabsTrigger>
                <TabsTrigger value="goal" className="flex-1 min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] rounded-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0a3d3d]/20 transition-all px-2 sm:px-3">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  יעד
                </TabsTrigger>
                <TabsTrigger value="compare" className="flex-1 min-w-[60px] sm:min-w-[80px] min-h-[40px] sm:min-h-[44px] rounded-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#0a3d3d]/20 transition-all px-2 sm:px-3">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  השוואה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mortgage">
                <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#5ec6c6] flex items-center justify-center shadow-md shadow-[#5ec6c6]/20">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d]">מחשבון משכנתא</h2>
                      <p className="text-gray-500 text-sm">חשבו החזר חודשי ועלות כוללת של המשכנתא</p>
                    </div>
                  </div>
                  <MortgageCalculator />
                </div>
              </TabsContent>

              <TabsContent value="pension">
                <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#f4a261] flex items-center justify-center shadow-md shadow-[#f4a261]/20">
                      <PiggyBank className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d]">מחשבון פנסיה</h2>
                      <p className="text-gray-500 text-sm">חשבו כמה תקבלו בפנסיה לפי ההפקדות הנוכחיות</p>
                    </div>
                  </div>
                  <PensionCalculator />
                </div>
              </TabsContent>

              <TabsContent value="savings">
                <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#90be6d] flex items-center justify-center shadow-md shadow-[#90be6d]/20">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d]">מחשבון חיסכון</h2>
                      <p className="text-gray-500 text-sm">חשבו כמה תצברו עם ריבית דריבית</p>
                    </div>
                  </div>
                  <SavingsCalculator />
                </div>
              </TabsContent>

              <TabsContent value="goal">
                <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#e76f51] flex items-center justify-center shadow-md shadow-[#e76f51]/20">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d]">מחשבון יעד כלכלי</h2>
                      <p className="text-gray-500 text-sm">כמה להפקיד כדי להגיע ליעד הפנסיוני שלכם?</p>
                    </div>
                  </div>
                  <GoalCalculator />
                </div>
              </TabsContent>

              <TabsContent value="compare">
                <div className="bg-[#f8f9fc] border border-[#0a3d3d]/[0.06] rounded-2xl p-6 sm:p-8 text-right">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#6c63ff] flex items-center justify-center shadow-md shadow-[#6c63ff]/20">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d]">השוואת מסלולי השקעה</h2>
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
        <section className="py-10 sm:py-16 bg-[#f8f9fc] relative overflow-hidden">
          <div className="absolute top-8 left-[8%] w-4 h-4 rounded-full bg-[#5ec6c6] hidden sm:block" />
          <div className="absolute bottom-12 right-[6%] w-3 h-3 rounded-full bg-[#f4a261] hidden sm:block" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-8">מחשבונים נוספים <span className="text-[#5ec6c6]">בקרוב</span></h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoon.map((calc) => (
                <div key={calc.title} className="bg-white border border-[#0a3d3d]/[0.06] rounded-2xl p-6 opacity-80 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-1 rounded-b-full" style={{ backgroundColor: calc.color }} />
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-md" style={{ backgroundColor: calc.color, boxShadow: `0 4px 12px ${calc.color}30` }}>
                    <calc.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0a3d3d] mb-2">{calc.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{calc.description}</p>
                  <span className="inline-block px-5 py-2 bg-[#f0f0f8] text-[#0a3d3d]/50 text-sm font-semibold rounded-full">
                    בקרוב
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-[#0a3d3d] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute top-[-25px] right-[-25px] w-[90px] h-[90px] rounded-full bg-[#5ec6c6] opacity-20" />
              <div className="absolute bottom-[-20px] left-[-20px] w-[70px] h-[70px] rounded-full bg-[#f4a261] opacity-15" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 relative">צריכים עזרה <span className="text-[#5ec6c6]">בתכנון?</span></h2>
              <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto relative">
                המחשבונים הם נקודת התחלה. לתכנון פיננסי מקיף, דברו עם המומחים שלנו.
              </p>
              <Link
                to="/contact"
                className="relative inline-block px-10 py-4 bg-[#5ec6c6] text-[#0a3d3d] font-bold rounded-full hover:bg-[#4db5b5] transition-colors shadow-xl shadow-[#5ec6c6]/20 text-base"
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
