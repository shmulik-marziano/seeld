import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FundReturnTable from "@/components/FundReturnTable";
import { TrendingUp, Calendar, Info, Search, Wifi, WifiOff, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { allFunds as staticFunds, cmaLastUpdate } from "@/data/cmaFundsData";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import type { FundReturn } from "@/data/fundReturns";

// Convert CMA Fund format to the existing FundReturn format used by FundReturnTable
const toFundReturn = (f: typeof allFunds[0]): FundReturn => ({
  name: f.name,
  company: f.name.split(" ")[0], // first word as company display
  monthReturn: f.returns.month,
  yearReturn: f.returns.year1,
  threeYearReturn: f.returns.year3,
  fiveYearReturn: f.returns.year5,
});

const ReturnTables = () => {
  const { data: liveFunds, isError } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const allFunds = (!isError && liveFunds && liveFunds.length > 0) ? liveFunds : staticFunds;
  const isLive = !isError && liveFunds && liveFunds.length > 0;

  // Build fund lists from the new CMA data source
  const studyFundsGeneral = useMemo(
    () => allFunds.filter((f) => f.productType === "hishtalmut" && f.specialization === "general").map(toFundReturn),
    [allFunds]
  );
  const studyFundsStocks = useMemo(
    () => allFunds.filter((f) => f.productType === "hishtalmut" && f.specialization === "stocks").map(toFundReturn),
    [allFunds]
  );
  const gemelFunds = useMemo(
    () => allFunds.filter((f) => f.productType === "gemel" && f.specialization === "general").map(toFundReturn),
    [allFunds]
  );
  const gemelInvestFunds = useMemo(
    () => allFunds.filter((f) => f.productType === "gemel_invest").map(toFundReturn),
    [allFunds]
  );
  const pensionFunds = useMemo(
    () => allFunds.filter((f) => f.productType === "pensia" && f.specialization === "general").map(toFundReturn),
    [allFunds]
  );
  const pensionStocks = useMemo(
    () => allFunds.filter((f) => f.productType === "pensia" && f.specialization === "stocks").map(toFundReturn),
    [allFunds]
  );
  const savingsPolicies = useMemo(
    () => allFunds.filter((f) => f.productType === "polisa").map(toFundReturn),
    [allFunds]
  );
  const childSavings = useMemo(
    () => allFunds.filter((f) => f.productType === "child_savings").map(toFundReturn),
    [allFunds]
  );

  const totalFunds = allFunds.length;
  const maxYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year1)), [allFunds]);
  const maxFiveYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year5)), [allFunds]);
  const topFund = useMemo(() => allFunds.find((f) => f.returns.year1 === maxYear), [allFunds, maxYear]);
  const topFiveYearFund = useMemo(() => allFunds.find((f) => f.returns.year5 === maxFiveYear), [allFunds, maxFiveYear]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[85px] h-[85px] rounded-full bg-[#90be6d]" />
        <div className="absolute bottom-[12%] left-[7%] w-[60px] h-[60px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute top-[50%] right-[20%] w-[30px] h-[30px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[25%] left-[14%] w-[24px] h-[24px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 left-[18%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            לוחות <span className="text-[#90be6d]">תשואה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            נתוני תשואות עדכניים של קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון בישראל
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4" />
              עדכון אחרון: {syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : cmaLastUpdate}
            </div>
            <Badge variant={isLive ? "default" : "secondary"} className="text-xs gap-1">
              {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'נתונים חיים' : 'נתונים מקומיים'}
            </Badge>
          </div>
          <div className="mt-5">
            <Link to="/fund-finder">
              <Button variant="outline" className="border-[#0a3d3d] text-[#0a3d3d] rounded-full px-6 text-sm font-semibold">
                <Search className="w-4 h-4 ml-1.5" />
                לכלי איתור והשוואת קופות מתקדם
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">לוחות תשואה</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs for different fund types */}
        <Tabs defaultValue="study-general" className="space-y-8">
          <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-[#f0f0f8] p-2 rounded-full">
            <TabsTrigger value="study-general" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              השתלמות כללי
            </TabsTrigger>
            <TabsTrigger value="study-stocks" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              השתלמות מניות
            </TabsTrigger>
            <TabsTrigger value="gemel" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              קופות גמל
            </TabsTrigger>
            <TabsTrigger value="gemel-invest" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              גמל להשקעה
            </TabsTrigger>
            <TabsTrigger value="pension" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              פנסיה כללי
            </TabsTrigger>
            <TabsTrigger value="pension-stocks" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              פנסיה מניות
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              פוליסות חיסכון
            </TabsTrigger>
            <TabsTrigger value="child" className="flex-1 min-w-[100px] rounded-full text-xs sm:text-sm">
              חיסכון לכל ילד
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study-general">
            <FundReturnTable funds={studyFundsGeneral} title="קרנות השתלמות - מסלול כללי" />
          </TabsContent>
          <TabsContent value="study-stocks">
            <FundReturnTable funds={studyFundsStocks} title="קרנות השתלמות - מסלול מניות" />
          </TabsContent>
          <TabsContent value="gemel">
            <FundReturnTable funds={gemelFunds} title="קופות גמל - מסלול כללי" />
          </TabsContent>
          <TabsContent value="gemel-invest">
            <FundReturnTable funds={gemelInvestFunds} title="קופות גמל להשקעה - כללי" />
          </TabsContent>
          <TabsContent value="pension">
            <FundReturnTable funds={pensionFunds} title="קרנות פנסיה - מסלול כללי" />
          </TabsContent>
          <TabsContent value="pension-stocks">
            <FundReturnTable funds={pensionStocks} title="קרנות פנסיה - מסלול מניות" />
          </TabsContent>
          <TabsContent value="savings">
            <FundReturnTable funds={savingsPolicies} title="פוליסות חיסכון" />
          </TabsContent>
          <TabsContent value="child">
            <FundReturnTable funds={childSavings} title="חיסכון לכל ילד" />
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#90be6d] flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-[#0a3d3d]">{maxYear.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 mt-1">תשואה שנתית מקסימלית</p>
            <p className="text-xs text-gray-400 mt-1">{topFund?.name}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#5ec6c6] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-[#0a3d3d]">{maxFiveYear.toFixed(2)}%</p>
            <p className="text-sm text-gray-500 mt-1">תשואה ל-5 שנים מקסימלית</p>
            <p className="text-xs text-gray-400 mt-1">{topFiveYearFund?.name}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#6c63ff] flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-[#0a3d3d]">{totalFunds}</p>
            <p className="text-sm text-gray-500 mt-1">קרנות במעקב</p>
            <p className="text-xs text-gray-400 mt-1">8 קטגוריות שונות</p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-12 rounded-2xl bg-[#f8f9fc] p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-[#0a3d3d] mb-4">הבהרה חשובה</h2>
          <p className="text-gray-500 leading-relaxed">
            הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון (גמלנט, ביטוחנט, פנסיהנט) ומיועדים להשוואה כללית בלבד.
            תשואות עבר אינן מעידות על תשואות עתידיות. דמי הניהול אינם כלולים בחישוב התשואות.
            לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
            <br /><br />
            <strong className="text-[#0a3d3d]">מקור הנתונים:</strong> רשות שוק ההון, ביטוח וחיסכון — משרד האוצר.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnTables;
