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
import { Checkbox } from '@/components/ui/checkbox';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BrandDots, OliveBranch } from '@/components/brand/Elements';
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, SAGE_ON_GREEN } from '@/lib/brand';

// Fund finder (SEELD brand system 2026-09): a tool page. The search, the
// table and the comparison stay central; one vector element in the hero
// margin, no illustration. Queries, filters, sorting and compare actions are
// unchanged (useFundExplorer / useCmaFunds).

const FundFinder = () => {
  // Live data from Supabase (falls back to the static snapshot automatically)
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
    { id: 'toggle-monthly', label: 'תשואות חודשיות', checked: showMonthly, onChange: setShowMonthly },
    { id: 'toggle-deep', label: 'חקירה לעומק', checked: showDeepDrill, onChange: setShowDeepDrill },
    { id: 'toggle-chart', label: 'גרף השוואה', checked: showChart, onChange: setShowChart },
    { id: 'toggle-cost', label: 'חישוב עלויות', checked: showCostCalc, onChange: setShowCostCalc },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* Hero: ivory, two pastel bubbles in the margins only */}
        <div className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -150, left: -130, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 180, height: 180, top: 40, right: -100, backgroundColor: PASTEL_SAND, opacity: 0.7 }}
            />
          </div>

          <section className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-10">
            <nav className="flex items-center gap-2 text-[14px] mb-8" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">איתור קופות</span>
            </nav>

            <div className="flex items-start justify-between gap-8">
              <div>
                <BrandDots className="mb-4" />
                <h1 className="dna-display leading-[1.15] mb-4 max-w-3xl" style={{ fontSize: 'clamp(32px, 4.4vw, 52px)' }}>
                  איתור והשוואת קופות
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  חיפוש, סינון והשוואה בין קופות גמל, קרנות השתלמות, קרנות פנסיה ופוליסות חיסכון.
                  הנתונים נמשכים ממקורות רשות שוק ההון: גמלנט, ביטוחנט ופנסיהנט.
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
                  {syncStatus?.totalFunds ? (
                    <div className="flex gap-2">
                      <dt>קופות במאגר:</dt>
                      <dd className="font-bold">
                        <span dir="ltr" className="tabular-nums whitespace-nowrap" style={{ color: GREEN }}>
                          {syncStatus.totalFunds.toLocaleString('en-US')}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="mt-2 text-[14px]" style={{ color: MUTED }} role="status">
                  {fundsLoading
                    ? 'טוען נתונים עדכניים מהמאגר. בינתיים מוצגים נתונים מקומיים.'
                    : isLive
                      ? 'הנתונים נטענו מהמאגר העדכני.'
                      : 'המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.'}
                </p>
              </div>
              <OliveBranch className="hidden lg:block w-36 shrink-0" />
            </div>
          </section>
        </div>

        {/* Tool body: one live search over the whole database */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <FundExplorer funds={liveFunds} loading={fundsLoading} error={fundsError}>
              {(selected, remove) =>
                selected.length > 0 ? (
                  <div className="space-y-8">
                    {/* What to show about the picked funds */}
                    <div className="dna-concept flex flex-wrap items-center gap-x-6 gap-y-3 !py-4">
                      {toolbarToggles.map((t) => (
                        <div key={t.id} className="flex items-center gap-2">
                          <Checkbox
                            id={t.id}
                            checked={t.checked}
                            onCheckedChange={(c) => t.onChange(!!c)}
                            className="h-5 w-5 border-[#003D30] data-[state=checked]:bg-[#003D30] data-[state=checked]:border-[#003D30]"
                          />
                          <label htmlFor={t.id} className="cursor-pointer text-[15px]" style={{ color: BODY }}>
                            {t.label}
                          </label>
                        </div>
                      ))}

                      <div className="ms-auto flex flex-wrap items-end gap-3">
                        <div>
                          <label htmlFor="print-recipient" className="block text-[14px] font-bold mb-1" style={{ color: GREEN }}>
                            נמען להדפסה
                          </label>
                          <input
                            id="print-recipient"
                            value={printRecipient}
                            onChange={(e) => setPrintRecipient(e.target.value)}
                            className="field w-48 !min-h-[44px] !py-2"
                            autoComplete="off"
                          />
                        </div>
                        <button type="button" onClick={handlePrint} className="btn-secondary !min-h-[44px] !py-2">
                          <BrandIcon name="document" size={18} />
                          הדפסה
                        </button>
                      </div>
                    </div>
                    {printRecipient && (
                      <p className="hidden print:block text-[16px]" style={{ color: GREEN }}>
                        השוואה עבור: {printRecipient}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {selected.map((fund) => (
                        <FundCard
                          key={fund.id}
                          fund={fund}
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
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="dna-callout max-w-3xl text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>הבהרה חשובה</p>
              <p>
                הנתונים המוצגים מבוססים על מידע ממקורות ציבוריים של רשות שוק ההון, ביטוח וחיסכון
                (גמלנט, ביטוחנט, פנסיהנט) ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על
                תשואות עתידיות. שיעור העלויות מחושב על פי דמי הניהול שהוזנו ואינו כולל מרכיבים נוספים.
                לפני קבלת החלטות פיננסיות, מומלץ להתייעץ עם יועץ פנסיוני או פיננסי מוסמך.
              </p>
              <p className="mt-2" style={{ color: MUTED }}>
                מקור הנתונים: רשות שוק ההון, ביטוח וחיסכון, משרד האוצר. הנתונים מתעדכנים בהתאם לפרסום הרשמי.
              </p>
            </div>
          </div>
        </section>

        {/* Closing: deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: 'clamp(26px, 3vw, 34px)' }}>
              מצאתם קופה מעניינת?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              לפני שמניידים, כדאי לבדוק דמי ניהול, כיסויים ורצף זכויות.
              בדיקת תיק 360 מסדרת את ההשוואה מול התיק הקיים שלכם.
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

export default FundFinder;
