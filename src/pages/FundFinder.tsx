import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FundSearchPanel from '@/components/fund-finder/FundSearchPanel';
import FundCard from '@/components/fund-finder/FundCard';
import FundCompareChart from '@/components/fund-finder/FundCompareChart';
import FundCostCalculator from '@/components/fund-finder/FundCostCalculator';
import { useFundSearch } from '@/hooks/useFundSearch';
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from '@/hooks/useCmaFunds';
import { cmaLastUpdate } from '@/data/cmaFundsData';
import { Calendar, Printer, Search as SearchIcon, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from "@/hooks/usePageMeta";

const FundFinder = () => {
  usePageMeta("איתור קופות", "אתרו את הקופות והקרנות שלכם והשוו דמי ניהול ותשואות.");
  // Live data from Supabase (falls back to static data automatically)
  const { data: liveFunds, isLoading: fundsLoading, isError: fundsError } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const isLive = !fundsError && liveFunds && liveFunds.length > 0;

  const search = useFundSearch(liveFunds);
  const [showMonthly, setShowMonthly] = useState(false);
  const [showDeepDrill, setShowDeepDrill] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [showCostCalc, setShowCostCalc] = useState(false);
  const [printRecipient, setPrintRecipient] = useState('');

  const handlePrint = () => {
    if (search.selectedFunds.length === 0) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero Section — same style as ReturnTables */}
      <section className="relative bg-[#f8f9fc] overflow-hidden">
        <div className="absolute top-8 right-10 w-20 h-20 rounded-full bg-[#f06ba8] opacity-15" />
        <div className="absolute bottom-6 left-16 w-16 h-16 rounded-full bg-[#d6157e] opacity-10" />
        <div className="absolute top-1/2 right-1/3 w-10 h-10 rounded-full bg-[#6b6fc4] opacity-10" />
        <svg className="absolute bottom-0 left-0 w-full h-20 opacity-10 pointer-events-none" viewBox="0 0 800 80" fill="none">
          <path d="M0 60 Q200 15 400 45 T800 25" stroke="#f06ba8" strokeWidth="2" strokeDasharray="8 6" />
          <polygon points="795,23 800,25 795,27" fill="#f06ba8" />
        </svg>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a1a4b] mb-4 leading-tight">
            איתור והשוואת קופות
          </h1>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
            חפשו, סננו והשוו בין קופות גמל, קרנות השתלמות, קרנות פנסיה ופוליסות חיסכון.
            <br />
            נתונים ממקורות רשות שוק ההון — גמלנט, ביטוחנט, פנסיהנט.
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
            {syncStatus?.totalFunds ? (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                {syncStatus.totalFunds} קופות במאגר
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ===== פאנל חיפוש — צד ימין ===== */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1a1a4b] mb-4 flex items-center gap-2">
                <SearchIcon className="w-5 h-5" />
                חיפוש קופות
              </h2>
              <FundSearchPanel
                mode={search.mode}
                productType={search.productType}
                returnPeriod={search.returnPeriod}
                topCount={search.topCount}
                selectedCompanies={search.selectedCompanies}
                selectedSpecializations={search.selectedSpecializations}
                stockRange={search.stockRange}
                browseBy={search.browseBy}
                browseValue={search.browseValue}
                directQuery={search.directQuery}
                availableCompanies={search.availableCompanies}
                availableSpecializations={search.availableSpecializations}
                autocompleteResults={search.autocompleteResults}
                onSetMode={search.setMode}
                onSetProductType={search.setProductType}
                onSetReturnPeriod={search.setReturnPeriod}
                onSetTopCount={search.setTopCount}
                onToggleCompany={search.toggleCompany}
                onToggleSpecialization={search.toggleSpecialization}
                onSetStockRange={search.setStockRange}
                onSetBrowseBy={search.setBrowseBy}
                onSetBrowseValue={search.setBrowseValue}
                onSetDirectQuery={search.setDirectQuery}
                onSearchTop={search.searchTop}
                onSearchBrowse={search.searchBrowse}
                onSearchDirect={search.searchDirect}
                onAddFund={search.addFund}
                onReset={search.reset}
              />
            </div>
          </aside>

          {/* ===== אזור תצוגה ===== */}
          <div className="flex-1 space-y-6">
            {/* מסך ברוכים הבאים — אם אין תוצאות */}
            {search.selectedFunds.length === 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-[#f8f9fc] to-white border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-[#f06ba8]/10 flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-10 h-10 text-[#f06ba8]" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a4b] mb-2">
                  ברוכים הבאים לכלי איתור הקופות
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  השתמשו בפאנל החיפוש כדי למצוא את הקופות האטרקטיביות ביותר,
                  לסנן לפי חברה או התמחות, או לחפש קופה ספציפית.
                </p>
              </div>
            )}

            {/* סרגל כלים */}
            {search.selectedFunds.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-3">
                <span className="text-sm font-medium text-[#1a1a4b]">
                  {search.selectedFunds.length} קופות נבחרו
                </span>
                <Separator orientation="vertical" className="h-5" />

                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={showMonthly} onCheckedChange={(c) => setShowMonthly(!!c)} />
                  תשואות חודשיות
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={showDeepDrill} onCheckedChange={(c) => setShowDeepDrill(!!c)} />
                  חקירה לעומק
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={showChart} onCheckedChange={(c) => setShowChart(!!c)} />
                  גרפים
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={showCostCalc} onCheckedChange={(c) => setShowCostCalc(!!c)} />
                  חישוב עלויות
                </label>

                <div className="mr-auto flex items-center gap-2">
                  <Input
                    value={printRecipient}
                    onChange={(e) => setPrintRecipient(e.target.value)}
                    placeholder="נמען להדפסה"
                    className="h-7 text-xs w-32"
                  />
                  <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-xs gap-1">
                    <Printer className="w-3.5 h-3.5" />
                    הדפס
                  </Button>
                </div>
              </div>
            )}

            {/* כרטיסיות קופות */}
            {search.selectedFunds.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {search.selectedFunds.map((fund, i) => (
                  <FundCard
                    key={fund.id}
                    fund={fund}
                    rank={i + 1}
                    onRemove={search.removeFund}
                    showMonthly={showMonthly}
                    showDeepDrill={showDeepDrill}
                  />
                ))}
              </div>
            )}

            {/* גרפי השוואה */}
            {showChart && search.selectedFunds.length > 1 && (
              <FundCompareChart funds={search.selectedFunds} />
            )}

            {/* חישוב עלויות */}
            {showCostCalc && search.selectedFunds.length > 0 && (
              <FundCostCalculator funds={search.selectedFunds} />
            )}

            {/* תוצאות חיפוש (מצב browse ו-direct) — קופות שעדיין לא נוספו */}
            {search.results.length > 0 && search.mode !== 'top' && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#1a1a4b]">תוצאות חיפוש</h3>
                <div className="rounded-xl border overflow-hidden">
                  {search.results
                    .filter((f) => !search.selectedFunds.some((sf) => sf.id === f.id))
                    .map((fund) => (
                      <div
                        key={fund.id}
                        className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{fund.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fund.fundNumber} | תשואה שנתית: {fund.returns.year1.toFixed(2)}%
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => search.addFund(fund)}
                          disabled={search.selectedFunds.length >= 8}
                          className="h-7 text-xs"
                        >
                          + הוסף להשוואה
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer — same style as ReturnTables */}
        <section className="mt-12 rounded-2xl bg-[#f8f9fc] p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-[#1a1a4b] mb-4">הבהרה חשובה</h2>
          <p className="text-gray-500 leading-relaxed">
            הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון, ביטוח וחיסכון (גמלנט, ביטוחנט, פנסיהנט) ומיועדים להשוואה כללית בלבד.
            תשואות עבר אינן מעידות על תשואות עתידיות. שיעור העלויות מחושב על פי דמי הניהול שהוזנו ואינו כולל מרכיבים נוספים.
            לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
            <br /><br />
            <strong className="text-[#1a1a4b]">מקור הנתונים:</strong> רשות שוק ההון, ביטוח וחיסכון — משרד האוצר.
            הנתונים מתעדכנים באופן שוטף בהתאם לפרסום הנתונים הרשמיים.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FundFinder;
