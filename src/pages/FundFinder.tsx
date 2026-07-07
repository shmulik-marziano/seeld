import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FundSearchPanel from '@/components/fund-finder/FundSearchPanel';
import FundCard from '@/components/fund-finder/FundCard';
import FundCompareChart from '@/components/fund-finder/FundCompareChart';
import FundCostCalculator from '@/components/fund-finder/FundCostCalculator';
import { useFundSearch } from '@/hooks/useFundSearch';
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from '@/hooks/useCmaFunds';
import { cmaLastUpdate } from '@/data/cmaFundsData';
import { Printer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { LiveTag } from '@/components/brand/Live';
import { SERIF, MONO, RING } from '@/lib/brand';

const FundFinder = () => {
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

  const lastUpdate = syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : cmaLastUpdate;

  const toolbarToggles = [
    { label: 'תשואות חודשיות', checked: showMonthly, onChange: setShowMonthly },
    { label: 'חקירה לעומק', checked: showDeepDrill, onChange: setShowDeepDrill },
    { label: 'גרפים', checked: showChart, onChange: setShowChart },
    { label: 'חישוב עלויות', checked: showCostCalc, onChange: setShowCostCalc },
  ];

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: '#0a0a0a' }}>
      <Header />

      {/* Hero tile — hairline rule + breadcrumb, compact */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-7xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-14 relative z-10">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">איתור קופות</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium text-[#5c5c5c]">
              נתוני רשות שוק ההון
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}
          >
            איתור והשוואת קופות
          </h1>
          <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9] mb-8">
            חיפוש, סינון והשוואה בין קופות גמל, קרנות השתלמות, קרנות פנסיה ופוליסות חיסכון.
            הנתונים נמשכים ממקורות רשות שוק ההון: גמלנט, ביטוחנט ופנסיהנט.
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <LiveTag dot={isLive}>{isLive ? 'LIVE DATA' : 'LOCAL DATA'}</LiveTag>
            <span className="text-[13px] text-[#5c5c5c]">
              עדכון אחרון:{' '}
              <span className="text-[#171717] tabular-nums" style={{ fontFamily: MONO }}>{lastUpdate}</span>
            </span>
            {syncStatus?.totalFunds ? (
              <span className="text-[13px] text-[#5c5c5c]">
                <span className="text-[#171717] tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>
                  {syncStatus.totalFunds.toLocaleString('en-US')}
                </span>{' '}
                קופות במאגר
              </span>
            ) : null}
          </div>
        </div></div>
      </section>

      <main>
        {/* Tool body tile — ink search sidebar (the play) + paper results */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 relative z-10">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Search sidebar — ink tile with paper inputs */}
              <aside className="lg:w-80 flex-shrink-0">
                <div className="sticky top-4 bento-panel-ink p-5 sm:p-6">
                  <div className="relative z-10">
                    <div className="border-b border-white/10 pb-4 mb-5">
                      <h2 className="text-lg text-[#e9dfd2]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        חיפוש קופות
                      </h2>
                      <p className="mt-1 text-[13px]" style={{ color: 'rgba(233,223,210,.6)' }}>
                        {fundsLoading ? 'טוען את מאגר הקופות...' : 'סינון לפי תשואה, חברה או שם קופה'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#e9dfd2] p-4 sm:p-5">
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
                  </div>
                </div>
              </aside>

              {/* Results area */}
              <div className="flex-1 space-y-8 min-w-0">
                {/* Empty state — directs to the first action */}
                {search.selectedFunds.length === 0 && (
                  <div className="border-t border-[#171717]/15 pt-6">
                    <h3 className="text-xl text-[#171717] mb-3" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                      עדיין לא נבחרו קופות להשוואה
                    </h3>
                    <p className="text-base text-[#4d4d4d] leading-[1.85] max-w-xl">
                      התחילו בפאנל החיפוש: שלפו את הקופות המובילות לפי תשואה,
                      עברו על קופות של חברה מסוימת, או הקלידו שם של קופה ספציפית.
                      אפשר להשוות עד 8 קופות זו לצד זו.
                    </p>
                  </div>
                )}

                {/* Toolbar — hairline strip */}
                {search.selectedFunds.length > 0 && (
                  <div className="border-t border-b border-[#171717]/15 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <span className="text-[13px] font-medium text-[#171717]">
                      <span className="tabular-nums" style={{ fontFamily: MONO }}>{search.selectedFunds.length}</span>{' '}
                      קופות נבחרו
                    </span>

                    {toolbarToggles.map((t) => (
                      <label key={t.label} className="flex items-center gap-1.5 text-[13px] text-[#171717]/60 cursor-pointer hover:text-[#171717] transition-colors">
                        <Checkbox checked={t.checked} onCheckedChange={(c) => t.onChange(!!c)} />
                        {t.label}
                      </label>
                    ))}

                    <div className="mr-auto flex items-center gap-3">
                      <input
                        value={printRecipient}
                        onChange={(e) => setPrintRecipient(e.target.value)}
                        placeholder="נמען להדפסה"
                        className="w-32 px-0 py-1.5 bg-transparent border-b border-[#171717]/20 text-[13px] text-[#171717] placeholder:text-[#5c5c5c] focus:outline-none focus:border-[#171717] transition-colors rounded-none"
                      />
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-[13px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors"
                        style={{ boxShadow: RING }}
                      >
                        <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
                        הדפסה
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected fund cards */}
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

                {/* Comparison charts */}
                {showChart && search.selectedFunds.length > 1 && (
                  <FundCompareChart funds={search.selectedFunds} />
                )}

                {/* Cost calculator */}
                {showCostCalc && search.selectedFunds.length > 0 && (
                  <FundCostCalculator funds={search.selectedFunds} />
                )}

                {/* Search results (browse + direct modes) — funds not yet added */}
                {search.results.length > 0 && search.mode !== 'top' && (
                  <div>
                    <div className="border-t border-[#171717]/15 pt-5 mb-2">
                      <h3 className="text-base text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                        תוצאות חיפוש
                      </h3>
                    </div>
                    <div>
                      {search.results
                        .filter((f) => !search.selectedFunds.some((sf) => sf.id === f.id))
                        .map((fund) => (
                          <div
                            key={fund.id}
                            className="flex items-center justify-between gap-4 py-3 border-b border-[#171717]/10 hover:bg-[#171717]/[0.04] hover:border-[#171717]/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-[14px] font-medium text-[#171717] truncate">{fund.name}</p>
                              <p className="text-[12px] text-[#5c5c5c]">
                                <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>{fund.fundNumber}</span>
                                {' · '}
                                תשואה שנתית:{' '}
                                <span className="tabular-nums text-[#171717]" dir="ltr" style={{ fontFamily: MONO }}>
                                  {fund.returns.year1.toFixed(2)}%
                                </span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => search.addFund(fund)}
                              disabled={search.selectedFunds.length >= 8}
                              className="shrink-0 px-3.5 py-1.5 rounded-md bg-white text-[13px] font-medium text-[#171717] hover:bg-[#fafafa] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              style={{ boxShadow: RING }}
                            >
                              הוספה להשוואה
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div></div>
        </section>

        {/* Disclaimer tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16 relative z-10">
            <div className="border-t border-[#171717]/15 pt-6 max-w-3xl">
              <h2 className="text-lg text-[#171717] mb-3" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                הבהרה חשובה
              </h2>
              <p className="text-[14px] text-[#4d4d4d] leading-[1.85]">
                הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון, ביטוח וחיסכון
                (גמלנט, ביטוחנט, פנסיהנט) ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על
                תשואות עתידיות. שיעור העלויות מחושב על פי דמי הניהול שהוזנו ואינו כולל מרכיבים נוספים.
                לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
              </p>
              <p className="mt-3 text-[13px] text-[#5c5c5c]">
                <span className="font-medium text-[#171717]">מקור הנתונים:</span>{' '}
                רשות שוק ההון, ביטוח וחיסכון, משרד האוצר. הנתונים מתעדכנים בהתאם לפרסום הרשמי.
              </p>
            </div>
          </div></div>
        </section>

        {/* Next action — closing ink tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.5rem, 3vw, 2.3rem)' }}
              >
                מצאתם קופה מעניינת?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                לפני שמניידים, כדאי לבדוק דמי ניהול, כיסויים ורצף זכויות.
                יועץ מהצוות יעבור איתכם על ההשוואה, ללא עלות וללא התחייבות.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                דברו עם יועץ
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FundFinder;
