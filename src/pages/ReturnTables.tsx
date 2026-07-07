import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import FundReturnTable from "@/components/FundReturnTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveDot, LiveTag } from "@/components/brand/Live";
import { allFunds as staticFunds, cmaLastUpdate } from "@/data/cmaFundsData";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import type { FundReturn } from "@/data/fundReturns";
import { SERIF, MONO } from "@/lib/brand";

// Convert CMA Fund format to the existing FundReturn format used by FundReturnTable
const toFundReturn = (f: (typeof staticFunds)[number]): FundReturn => ({
  name: f.name,
  company: f.name.split(" ")[0], // first word as company display
  monthReturn: f.returns.month,
  yearReturn: f.returns.year1,
  threeYearReturn: f.returns.year3,
  fiveYearReturn: f.returns.year5,
});

const tabTriggerClass =
  "rounded-none bg-transparent px-0 pb-4 text-sm sm:text-base font-medium text-[#5c5c5c] border-b-2 border-transparent data-[state=active]:border-[#171717] data-[state=active]:text-[#171717] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

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

  const tabDefs = [
    { value: "study-general", label: "השתלמות כללי", funds: studyFundsGeneral, title: "קרנות השתלמות - מסלול כללי" },
    { value: "study-stocks", label: "השתלמות מניות", funds: studyFundsStocks, title: "קרנות השתלמות - מסלול מניות" },
    { value: "gemel", label: "קופות גמל", funds: gemelFunds, title: "קופות גמל - מסלול כללי" },
    { value: "gemel-invest", label: "גמל להשקעה", funds: gemelInvestFunds, title: "קופות גמל להשקעה - כללי" },
    { value: "pension", label: "פנסיה כללי", funds: pensionFunds, title: "קרנות פנסיה - מסלול כללי" },
    { value: "pension-stocks", label: "פנסיה מניות", funds: pensionStocks, title: "קרנות פנסיה - מסלול מניות" },
    { value: "savings", label: "פוליסות חיסכון", funds: savingsPolicies, title: "פוליסות חיסכון" },
    { value: "child", label: "חיסכון לכל ילד", funds: childSavings, title: "חיסכון לכל ילד" },
  ];

  const totalFunds = allFunds.length;
  const maxYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year1)), [allFunds]);
  const maxFiveYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year5)), [allFunds]);
  const topFund = useMemo(() => allFunds.find((f) => f.returns.year1 === maxYear), [allFunds, maxYear]);
  const topFiveYearFund = useMemo(() => allFunds.find((f) => f.returns.year5 === maxFiveYear), [allFunds, maxFiveYear]);

  const lastUpdate = syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : cmaLastUpdate;

  // Marquee feed — top 12-month return per product category, derived from the table data
  const marqueeItems: { label: string; value?: string; dot?: boolean }[] = [
    { label: isLive ? "LIVE DATA" : "LOCAL DATA", dot: isLive },
    ...tabDefs
      .filter((t) => t.funds.length > 0)
      .map((t) => {
        const top = Math.max(...t.funds.map((f) => f.yearReturn));
        return { label: t.label, value: `${top >= 0 ? "+" : ""}${top.toFixed(1)}%` };
      }),
  ];

  const stats = [
    { value: maxYear.toFixed(2), unit: "%", label: "תשואה שנתית מובילה", detail: topFund?.name },
    { value: maxFiveYear.toFixed(2), unit: "%", label: "תשואת 5 שנים מובילה", detail: topFiveYearFund?.name },
    { value: String(totalFunds), unit: "", label: "קרנות במעקב", detail: "8 קטגוריות מוצר" },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#0a0a0a" }}>
      <Header />

      {/* Hero tile + live top-return tile (the play) */}
      <section className="px-2 pt-2">
        <div className="grid gap-2 lg:grid-cols-[1fr_260px]">
          <div className="bento-panel">
            <div className="px-5 sm:px-8 pt-10 sm:pt-12 pb-10 sm:pb-12 relative z-10">
              <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-12 flex items-baseline justify-between gap-4">
                <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
                  <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                  <span>←</span>
                  <span className="text-[#171717]/70 font-medium">לוחות תשואה</span>
                </nav>
                <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium text-[#5c5c5c]">
                  נתוני רשות שוק ההון
                </span>
              </div>

              <h1
                className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
              >
                לוחות תשואה
              </h1>
              <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9] mb-8">
                תשואות רשמיות של קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון בישראל.
                הנתונים נמשכים מגמלנט, ביטוחנט ופנסיהנט ומתעדכנים מדי חודש.
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <LiveTag dot={isLive}>{isLive ? "LIVE DATA" : "LOCAL DATA"}</LiveTag>
                <span className="text-[13px] text-[#5c5c5c]">
                  עדכון אחרון:{" "}
                  <span className="text-[#171717] tabular-nums" style={{ fontFamily: MONO }}>{lastUpdate}</span>
                </span>
                <Link
                  to="/fund-finder"
                  className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                >
                  לכלי איתור והשוואת קופות
                  <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Orange stat tile — live top 12-month return, links to the fund finder */}
          <Link
            to="/fund-finder"
            className="bento-panel-orange bento-hover flex flex-col items-center justify-center gap-1 p-6 min-h-[150px]"
            dir="ltr"
            aria-label="התשואה השנתית המובילה · לכלי איתור והשוואת קופות"
          >
            <span className="text-[30px] sm:text-[36px] font-bold text-[#171717] tabular-nums" style={{ fontFamily: MONO }}>
              {maxYear >= 0 ? "+" : ""}{maxYear.toFixed(2)}%
            </span>
            <span className="text-[10px] tracking-[0.2em] font-semibold text-[#171717]/80" style={{ fontFamily: MONO }}>
              TOP RETURN · 12M
            </span>
            {topFund && (
              <span className="mt-1.5 max-w-[210px] truncate text-[11px] text-[#171717]/70" dir="rtl">
                {topFund.name}
              </span>
            )}
            <span className="mt-1.5 text-[9px] tracking-[0.22em] font-semibold text-[#171717]/70" style={{ fontFamily: MONO }}>
              FUND FINDER →
            </span>
          </Link>
        </div>

        {/* Market marquee band — top category returns (HeroSection marquee pattern) */}
        <div
          className="bento-panel mt-2 flex items-center overflow-hidden"
          dir="ltr"
          aria-label="תשואות 12 חודשים מובילות לפי קטגוריה"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
          }}
        >
          <div className="seeld-marquee relative z-10 items-center py-4">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex items-center shrink-0"
                aria-hidden={copy === 1 ? "true" : undefined}
              >
                {marqueeItems.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2.5 px-4 text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.12em] text-[#171717] whitespace-nowrap tabular-nums"
                    style={{ fontFamily: MONO }}
                  >
                    {item.dot && <LiveDot size={6} />}
                    <span dir="auto">{item.label}</span>
                    {item.value && <span dir="ltr">{item.value}</span>}
                    <span className="text-[#171717]/30 select-none">—</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main>
        {/* Tables tile — underline tabs, one dense view */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <Tabs defaultValue={(tabDefs.find((t) => t.funds.length > 0) ?? tabDefs[0]).value} dir="rtl">
              <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#171717]/10 rounded-none overflow-x-auto scrollbar-hide">
                {tabDefs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabDefs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {tab.funds.length > 0 ? (
                    <FundReturnTable funds={tab.funds} title={tab.title} />
                  ) : (
                    <div className="border-t border-[#171717]/15 pt-6 pb-10">
                      <p className="text-base text-[#4d4d4d] leading-[1.85] max-w-xl">
                        אין עדיין נתונים בקטגוריה הזו לתקופה הנוכחית. נסו קטגוריה אחרת,
                        או חפשו קופה ספציפית בכלי איתור הקופות.
                      </p>
                      <Link
                        to="/fund-finder"
                        className="group mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                      >
                        לאיתור קופות
                        <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                      </Link>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div></div>
        </section>

        {/* Numbers band tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 border-t border-b border-[#171717]/15 py-10 sm:py-12">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center px-4">
                    <div
                      className="text-[#171717] tabular-nums mb-2"
                      dir="ltr"
                      style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(2.2rem, 4vw, 3.2rem)", letterSpacing: "-0.02em" }}
                    >
                      {stat.value}
                      {stat.unit && <span style={{ fontSize: "0.55em" }}>{stat.unit}</span>}
                    </div>
                    <div className="text-[12px] tracking-[0.12em] text-[#5c5c5c]">{stat.label}</div>
                    {stat.detail && (
                      <div className="mt-1 text-[12px] text-[#5c5c5c] truncate max-w-[260px] mx-auto">{stat.detail}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div></div>
        </section>

        {/* Disclaimer tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/15 pt-6 max-w-3xl">
              <h2 className="text-lg text-[#171717] mb-3" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                הבהרה חשובה
              </h2>
              <p className="text-[14px] text-[#4d4d4d] leading-[1.85]">
                הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון (גמלנט, ביטוחנט, פנסיהנט)
                ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על תשואות עתידיות.
                דמי הניהול אינם כלולים בחישוב התשואות. לפני קבלת החלטות פיננסיות,
                מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
              </p>
              <p className="mt-3 text-[13px] text-[#5c5c5c]">
                <span className="font-medium text-[#171717]">מקור הנתונים:</span>{" "}
                רשות שוק ההון, ביטוח וחיסכון, משרד האוצר.
              </p>
            </div>
          </div></div>
        </section>

        {/* Next action — closing ink tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.3rem)" }}
              >
                המספרים ברורים. מה עושים איתם?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                תשואה היא רק חלק מהתמונה. דמי ניהול, רמת סיכון והתאמה אישית משנים את התוצאה.
                יועץ מהצוות יעבור איתכם על התיק, ללא עלות.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                בדיקת תיק ללא עלות
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnTables;
