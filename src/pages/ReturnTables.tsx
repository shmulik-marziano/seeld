import { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FundReturnTable from "@/components/FundReturnTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allFunds as staticFunds, cmaLastUpdate } from "@/data/cmaFundsData";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import type { FundReturn } from "@/data/fundReturns";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BrandDots, LeafCanopy } from "@/components/brand/Elements";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, RUST_TEXT, SAGE_ON_GREEN } from "@/lib/brand";

// Return tables (SEELD brand system 2026-09): a tool page. The tables stay
// central; the data source and date are stated; one vector element in the
// hero margin; the moving ticker is replaced by a static labelled list.

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
  "rounded-none bg-transparent px-0 pb-4 text-[15px] sm:text-[16px] font-bold text-[#476356] border-b-2 border-transparent data-[state=active]:border-[#003D30] data-[state=active]:text-[#003D30] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors whitespace-nowrap";

const Pct = ({ value }: { value: number }) => (
  <span dir="ltr" className="tabular-nums whitespace-nowrap font-bold" style={{ color: value < 0 ? RUST_TEXT : GREEN }}>
    {value > 0 ? "+" : ""}
    {value.toFixed(2)}%
  </span>
);

const ReturnTables = () => {
  const { data: liveFunds, isLoading, isError } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const allFunds = (!isError && liveFunds && liveFunds.length > 0) ? liveFunds : staticFunds;
  const isLive = !isError && liveFunds && liveFunds.length > 0;

  // Build fund lists from the CMA data source
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
    { value: "study-general", label: "השתלמות כללי", funds: studyFundsGeneral, title: "קרנות השתלמות, מסלול כללי" },
    { value: "study-stocks", label: "השתלמות מניות", funds: studyFundsStocks, title: "קרנות השתלמות, מסלול מניות" },
    { value: "gemel", label: "קופות גמל", funds: gemelFunds, title: "קופות גמל, מסלול כללי" },
    { value: "gemel-invest", label: "גמל להשקעה", funds: gemelInvestFunds, title: "קופות גמל להשקעה, מסלול כללי" },
    { value: "pension", label: "פנסיה כללי", funds: pensionFunds, title: "קרנות פנסיה, מסלול כללי" },
    { value: "pension-stocks", label: "פנסיה מניות", funds: pensionStocks, title: "קרנות פנסיה, מסלול מניות" },
    { value: "savings", label: "פוליסות חיסכון", funds: savingsPolicies, title: "פוליסות חיסכון" },
    { value: "child", label: "חיסכון לכל ילד", funds: childSavings, title: "חיסכון לכל ילד" },
  ];

  const totalFunds = allFunds.length;
  const maxYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year1)), [allFunds]);
  const maxFiveYear = useMemo(() => Math.max(...allFunds.map((f) => f.returns.year5 ?? -Infinity)), [allFunds]);
  const topFund = useMemo(() => allFunds.find((f) => f.returns.year1 === maxYear), [allFunds, maxYear]);
  const topFiveYearFund = useMemo(() => allFunds.find((f) => f.returns.year5 === maxFiveYear), [allFunds, maxFiveYear]);

  const lastUpdate = syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : cmaLastUpdate;

  // Top 12-month return per product category, derived from the table data
  const categoryTops = tabDefs
    .filter((t) => t.funds.length > 0)
    .map((t) => ({ label: t.label, value: Math.max(...t.funds.map((f) => f.yearReturn)) }));

  const stats = [
    { value: Number.isFinite(maxYear) ? maxYear : null, unit: "%", label: "תשואה שנתית מובילה", detail: topFund?.name },
    { value: Number.isFinite(maxFiveYear) ? maxFiveYear : null, unit: "%", label: "תשואת 5 שנים מובילה", detail: topFiveYearFund?.name },
    { value: totalFunds, unit: "", label: "קרנות במעקב", detail: `${tabDefs.length} קטגוריות מוצר` },
  ];

  const dataStatus = isLoading
    ? "טוען נתונים עדכניים מהמאגר. בינתיים מוצגים נתונים מקומיים."
    : isLive
      ? "הנתונים נטענו מהמאגר העדכני."
      : "המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.";

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* Hero: ivory, two pastel bubbles in the margins only */}
        <div className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -150, right: -130, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 180, height: 180, top: 60, left: -100, backgroundColor: PASTEL_SAND, opacity: 0.7 }}
            />
          </div>

          <section className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-10">
            <nav className="flex items-center gap-2 text-[14px] mb-8" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">לוחות תשואה</span>
            </nav>

            <div className="flex items-start justify-between gap-8">
              <div>
                <BrandDots className="mb-4" />
                <h1 className="dna-display leading-[1.15] mb-4 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  לוחות תשואה
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  תשואות רשמיות של קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון בישראל.
                  הנתונים נמשכים מגמלנט, ביטוחנט ופנסיהנט ומתעדכנים מדי חודש.
                </p>

                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]" style={{ color: MUTED }}>
                  <div className="flex gap-2">
                    <dt>מקור הנתונים:</dt>
                    <dd className="font-bold" style={{ color: GREEN }}>רשות שוק ההון, ביטוח וחיסכון</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>עדכון אחרון:</dt>
                    <dd className="font-bold tabular-nums" style={{ color: GREEN }}>{lastUpdate}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[14px]" style={{ color: MUTED }} role="status">{dataStatus}</p>

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link to="/fund-finder" className="link-rule text-[15px]">
                    לכלי איתור והשוואת קופות
                    <BrandIcon name="arrow-left" size={16} />
                  </Link>
                </div>
              </div>
              <LeafCanopy className="hidden lg:block w-44 shrink-0" />
            </div>

            {/* Top 12-month return per category: a static labelled list */}
            {categoryTops.length > 0 && (
              <div className="dna-concept mt-10">
                <p className="text-[16px] font-bold mb-3" style={{ color: GREEN }}>
                  התשואה השנתית הגבוהה ביותר בכל קטגוריה
                </p>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                  {categoryTops.map((c) => (
                    <div key={c.label} className="flex items-baseline justify-between gap-3 border-b pb-2" style={{ borderColor: LINE }}>
                      <dt className="text-[15px]" style={{ color: BODY }}>{c.label}</dt>
                      <dd className="text-[16px]"><Pct value={c.value} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        </div>

        {/* Tables: underline tabs, one dense view */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <BrandDots className="mb-4" />
            <h2 className="dna-display leading-tight mb-8" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
              התשואות לפי קטגוריה
            </h2>

            <Tabs defaultValue={(tabDefs.find((t) => t.funds.length > 0) ?? tabDefs[0]).value} dir="rtl">
              <TabsList className="flex w-full flex-wrap justify-start gap-x-6 gap-y-1 sm:gap-x-8 h-auto bg-transparent p-0 mb-8 border-b rounded-none" style={{ borderColor: LINE }}>
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
                    <div className="dna-concept max-w-xl" role="status">
                      <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>
                        {isLoading
                          ? "טוען את הנתונים של הקטגוריה הזו."
                          : "אין עדיין נתונים בקטגוריה הזו לתקופה הנוכחית. נסו קטגוריה אחרת, או חפשו קופה ספציפית בכלי איתור הקופות."}
                      </p>
                      {!isLoading && (
                        <Link to="/fund-finder" className="link-rule mt-4 text-[15px]">
                          לאיתור קופות
                          <BrandIcon name="arrow-left" size={16} />
                        </Link>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Numbers band: green big figures over hairlines */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-10 border-t border-b py-10 sm:py-12" style={{ borderColor: LINE }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center px-4">
                  <dd
                    className="tabular-nums mb-2 whitespace-nowrap"
                    dir="ltr"
                    style={{ fontWeight: 700, color: stat.value === null ? MUTED : GREEN, fontSize: stat.value === null ? "1.25rem" : "clamp(2.2rem, 4vw, 3.2rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
                  >
                    {stat.value === null
                      ? "אין נתון"
                      : stat.unit === "%"
                        ? `${(stat.value as number).toFixed(2)}%`
                        : String(stat.value)}
                  </dd>
                  <dt className="text-[15px]" style={{ color: MUTED }}>{stat.label}</dt>
                  {stat.detail && (
                    <p className="mt-1 text-[14px] truncate max-w-[260px] mx-auto" style={{ color: MUTED }}>
                      {stat.detail}
                    </p>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="dna-callout max-w-3xl text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>הבהרה חשובה</p>
              <p>
                הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון (גמלנט, ביטוחנט, פנסיהנט)
                ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על תשואות עתידיות.
                דמי הניהול אינם כלולים בחישוב התשואות. לפני קבלת החלטות פיננסיות,
                מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
              </p>
              <p className="mt-2" style={{ color: MUTED }}>
                מקור הנתונים: רשות שוק ההון, ביטוח וחיסכון, משרד האוצר.
              </p>
            </div>
          </div>
        </section>

        {/* Closing: deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3vw, 34px)" }}>
              המספרים ברורים. מה עושים איתם?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              תשואה היא רק חלק מהתמונה. דמי ניהול, רמת סיכון והתאמה אישית משנים את התוצאה.
              בדיקת תיק 360 מסדרת את הביטוחים, הפנסיה והחיסכון בתמונה אחת.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                בדיקת תיק 360
              </Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                תיאום פגישה
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnTables;
