import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FundExplorer from '@/components/fund-finder/FundExplorer';
import FundCard from '@/components/fund-finder/FundCard';
import FundCompareChart from '@/components/fund-finder/FundCompareChart';
import FundCostCalculator from '@/components/fund-finder/FundCostCalculator';
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from '@/hooks/useCmaFunds';
import { cmaLastUpdate } from '@/data/cmaFundsData';
import { Printer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { LiveTag } from '@/components/brand/Live';
import { DISPLAY, LINE, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT } from '@/lib/brand';

// SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline separators.

const FundFinder = () => {
  // Live data from Supabase (falls back to static data automatically)
  const { data: liveFunds, isLoading: fundsLoading, isError: fundsError } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const isLive = !fundsError && liveFunds && liveFunds.length > 0;

  const [showMonthly, setShowMonthly] = useState(false);
  const [showDeepDrill, setShowDeepDrill] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [showCostCalc, setShowCostCalc] = useState(false);
  const [printRecipient, setPrintRecipient] = useState('');

  const handlePrint = () => window.print();

  const lastUpdate = syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : cmaLastUpdate;

  const toolbarToggles = [
    { label: 'תשואות חודשיות', checked: showMonthly, onChange: setShowMonthly },
    { label: 'חקירה לעומק', checked: showDeepDrill, onChange: setShowDeepDrill },
    { label: 'גרפים', checked: showChart, onChange: setShowChart },
    { label: 'חישוב עלויות', checked: showCostCalc, onChange: setShowCostCalc },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="dna-page">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 280, height: 280, top: -120, left: -110, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, top: 320, right: -110, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12">
            <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">איתור קופות</span>
            </nav>

            <h1
              className="dna-display leading-[1.15] mb-5 max-w-3xl"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.1rem)' }}
            >
              איתור והשוואת קופות
            </h1>
            <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9] mb-8" style={{ color: MUTED }}>
              חיפוש, סינון והשוואה בין קופות גמל, קרנות השתלמות, קרנות פנסיה ופוליסות חיסכון.
              הנתונים נמשכים ממקורות רשות שוק ההון: גמלנט, ביטוחנט ופנסיהנט.
            </p>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <LiveTag dot={isLive}>{isLive ? 'LIVE DATA' : 'LOCAL DATA'}</LiveTag>
              <span className="text-[13px]" style={{ color: MUTED }}>
                עדכון אחרון:{' '}
                <span className="tabular-nums" style={{ fontFamily: MONO, color: NAVY }}>{lastUpdate}</span>
              </span>
              {syncStatus?.totalFunds ? (
                <span className="text-[13px]" style={{ color: MUTED }}>
                  <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
                    {syncStatus.totalFunds.toLocaleString('en-US')}
                  </span>{' '}
                  קופות במאגר
                </span>
              ) : null}
            </div>
          </section>

          {/* Tool body — one live search over the whole database */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
              <FundExplorer funds={liveFunds} loading={fundsLoading}>
                {(selected, remove) =>
                  selected.length > 0 ? (
                    <div className="space-y-8">
                      {/* What to show about the picked funds */}
                      <div className="border-t border-b py-3.5 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ borderColor: LINE }}>
                        {toolbarToggles.map((t) => (
                          <label
                            key={t.label}
                            className="flex items-center gap-1.5 text-[13px] cursor-pointer hover:text-[#1D2D3D] transition-colors"
                            style={{ color: MUTED }}
                          >
                            <Checkbox
                              checked={t.checked}
                              onCheckedChange={(c) => t.onChange(!!c)}
                              className="border-[#1D2D3D] data-[state=checked]:bg-[#1D2D3D] data-[state=checked]:border-[#1D2D3D]"
                            />
                            {t.label}
                          </label>
                        ))}

                        <div className="ms-auto flex items-center gap-3">
                          <label htmlFor="print-recipient" className="sr-only">נמען להדפסה</label>
                          <input
                            id="print-recipient"
                            value={printRecipient}
                            onChange={(e) => setPrintRecipient(e.target.value)}
                            placeholder="נמען להדפסה"
                            className="w-36 px-3 py-1.5 bg-white border border-[#E7EDF1] rounded-lg text-[13px] text-[#1D2D3D] placeholder:text-[#5a6a78] focus:outline-none focus:border-[#1D2D3D] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D2D3D] text-[13px] font-medium text-white hover:bg-[#16222f] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                            הדפסה
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {selected.map((fund, i) => (
                          <FundCard
                            key={fund.id}
                            fund={fund}
                            rank={i + 1}
                            onRemove={remove}
                            showMonthly={showMonthly}
                            showDeepDrill={showDeepDrill}
                          />
                        ))}
                      </div>

                      {showChart && selected.length > 1 && <FundCompareChart funds={selected} />}
                      {showCostCalc && <FundCostCalculator funds={selected} />}
                    </div>
                  ) : null
                }
              </FundExplorer>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <div className="max-w-3xl">
                <div className="dna-quote gold">
                  <div className="dna-ql">הבהרה חשובה</div>
                  <div className="dna-qt">
                    הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון, ביטוח וחיסכון
                    (גמלנט, ביטוחנט, פנסיהנט) ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על
                    תשואות עתידיות. שיעור העלויות מחושב על פי דמי הניהול שהוזנו ואינו כולל מרכיבים נוספים.
                    לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
                  </div>
                </div>
                <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
                  <span className="font-medium" style={{ color: NAVY }}>מקור הנתונים:</span>{' '}
                  רשות שוק ההון, ביטוח וחיסכון, משרד האוצר. הנתונים מתעדכנים בהתאם לפרסום הרשמי.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Closing CTA — institutional navy band */}
      <section className="dna-navy-band" style={{ backgroundColor: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2
            className="text-white leading-tight mb-3"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', letterSpacing: '-0.5px' }}
          >
            מצאתם קופה מעניינת?
          </h2>
          <p className="text-base leading-[1.85] mb-8 max-w-xl" style={{ color: 'rgba(255,255,255,.65)' }}>
            לפני שמניידים, כדאי לבדוק דמי ניהול, כיסויים ורצף זכויות.
            יועץ מהצוות יעבור איתכם על ההשוואה, ללא עלות וללא התחייבות.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
          >
            דברו עם יועץ
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FundFinder;
