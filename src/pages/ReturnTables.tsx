import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import FundReturnTable from "@/components/FundReturnTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveTag } from "@/components/brand/Live";
import { MarketMarquee } from "@/components/brand/Marquee";
import { allFunds as staticFunds, cmaLastUpdate } from "@/data/cmaFundsData";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import type { FundReturn } from "@/data/fundReturns";
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH, TINT_TURQ, TURQ, TURQ_TEXT } from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline separators,
// marquee on a white tile (HeroSection usage), turquoise big stats.

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
  "rounded-none bg-transparent px-0 pb-4 text-sm sm:text-base font-medium text-[#5a6a78] border-b-2 border-transparent data-[state=active]:border-[#4E9D8F] data-[state=active]:text-[#1D2D3D] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

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
  const maxFiveYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year5 ?? -Infinity)), [allFunds]);
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
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="dna-page">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 280, height: 280, top: -120, right: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, top: 420, left: -110, backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 240, height: 240, bottom: -130, right: "36%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero + top-return stat tile */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
            <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">לוחות תשואה</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[1fr_260px] items-start">
              <div>
                <h1
                  className="dna-display leading-[1.15] mb-5 max-w-3xl"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)" }}
                >
                  לוחות תשואה
                </h1>
                <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9] mb-8" style={{ color: MUTED }}>
                  תשואות רשמיות של קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון בישראל.
                  הנתונים נמשכים מגמלנט, ביטוחנט ופנסיהנט ומתעדכנים מדי חודש.
                </p>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <LiveTag dot={isLive}>{isLive ? "LIVE DATA" : "LOCAL DATA"}</LiveTag>
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    עדכון אחרון:{" "}
                    <span className="tabular-nums" style={{ fontFamily: MONO, color: NAVY }}>{lastUpdate}</span>
                  </span>
                  <Link
                    to="/fund-finder"
                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                  >
                    לכלי איתור והשוואת קופות
                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                </div>
              </div>

              {/* Turquoise-tint stat tile — live top 12-month return, links to the fund finder */}
              <Link
                to="/fund-finder"
                className="dna-hover rounded-xl flex flex-col items-center justify-center gap-1 p-6 min-h-[150px] border"
                style={{ backgroundColor: TINT_TURQ, borderColor: "#E1EAF1" }}
                dir="ltr"
                aria-label="התשואה השנתית המובילה · לכלי איתור והשוואת קופות"
              >
                <span
                  className="text-[30px] sm:text-[36px] tabular-nums"
                  style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, lineHeight: 1.1 }}
                >
                  {maxYear >= 0 ? "+" : ""}{maxYear.toFixed(2)}%
                </span>
                <span className="text-[10px] tracking-[0.2em] font-semibold" style={{ fontFamily: MONO, color: TURQ_TEXT }}>
                  TOP RETURN · 12M
                </span>
                {topFund && (
                  <span className="mt-1.5 max-w-[210px] truncate text-[11px]" style={{ color: "#3a4c5a" }} dir="rtl">
                    {topFund.name}
                  </span>
                )}
                <span className="mt-1.5 text-[9px] tracking-[0.22em] font-semibold" style={{ fontFamily: MONO, color: TURQ_TEXT }}>
                  FUND FINDER →
                </span>
              </Link>
            </div>

            {/* Market marquee band — white tile (HeroSection usage) */}
            <MarketMarquee
              items={marqueeItems}
              ariaLabel="תשואות 12 חודשים מובילות לפי קטגוריה"
              className="mt-8 !bg-white !rounded-xl border border-[#E1EAF1] after:!content-none"
            />
          </section>

          {/* Tables — underline tabs, one dense view */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <Tabs defaultValue={(tabDefs.find((t) => t.funds.length > 0) ?? tabDefs[0]).value} dir="rtl">
                <TabsList className="flex w-full justify-start gap-6 sm:gap-8 h-auto bg-transparent p-0 mb-10 border-b border-[#E7EDF1] rounded-none overflow-x-auto scrollbar-hide">
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
                      <div className="border-t pt-6 pb-10" style={{ borderColor: LINE }}>
                        <p className="text-base leading-[1.85] max-w-xl" style={{ color: "#3a4c5a" }}>
                          אין עדיין נתונים בקטגוריה הזו לתקופה הנוכחית. נסו קטגוריה אחרת,
                          או חפשו קופה ספציפית בכלי איתור הקופות.
                        </p>
                        <Link
                          to="/fund-finder"
                          className="group mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                        >
                          לאיתור קופות
                          <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </section>

          {/* Numbers band — turquoise big stats over hairlines */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <ScrollReveal>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 border-t border-b py-10 sm:py-12" style={{ borderColor: LINE }}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center px-4">
                      <div
                        className="tabular-nums mb-2"
                        dir="ltr"
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 900,
                          color: TURQ,
                          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.1,
                        }}
                      >
                        {stat.value}
                        {stat.unit && <span style={{ fontSize: "0.55em" }}>{stat.unit}</span>}
                      </div>
                      <div className="text-[13px] tracking-[0.1em]" style={{ color: MUTED }}>{stat.label}</div>
                      {stat.detail && (
                        <div className="mt-1 text-[12px] truncate max-w-[260px] mx-auto" style={{ color: MUTED }}>
                          {stat.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <div className="max-w-3xl">
                <div className="dna-quote gold">
                  <div className="dna-ql">הבהרה חשובה</div>
                  <div className="dna-qt">
                    הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון (גמלנט, ביטוחנט, פנסיהנט)
                    ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על תשואות עתידיות.
                    דמי הניהול אינם כלולים בחישוב התשואות. לפני קבלת החלטות פיננסיות,
                    מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
                  </div>
                </div>
                <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
                  <span className="font-medium" style={{ color: NAVY }}>מקור הנתונים:</span>{" "}
                  רשות שוק ההון, ביטוח וחיסכון, משרד האוצר.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Closing CTA — institutional navy band */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2
            className="text-white leading-tight mb-3"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
          >
            המספרים ברורים. מה עושים איתם?
          </h2>
          <p className="text-base leading-[1.85] mb-8 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
            תשואה היא רק חלק מהתמונה. דמי ניהול, רמת סיכון והתאמה אישית משנים את התוצאה.
            יועץ מהצוות יעבור איתכם על התיק, ללא עלות.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
          >
            בדיקת תיק ללא עלות
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReturnTables;
