import { useState } from 'react';
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
import { SdBand, tintStyle, useSdFont } from '@/components/sd/primitives';
import { PUB_TOPICS, PubClose, PubHero } from '@/components/sd/pub';
import { BODY, GREEN, MUTED } from '@/lib/brand';
import '@/components/sd/sd.css';

// Fund finder in the kit design: a tool page. The search, the table and the comparison stay central;
// the kit hero, colour bands and closing wrap them. Queries, filters, sorting and compare actions are
// unchanged (useFundExplorer / useCmaFunds).

const FundFinder = () => {
  useSdFont();
  const topic = PUB_TOPICS.fundFinder;
  const [p1, p2] = topic.palette;

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
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          compact
          crumbs={[{ label: 'דף הבית', to: '/' }, { label: 'איתור קופות' }]}
          eyebrow="נתוני רשות שוק ההון"
          title="איתור והשוואת קופות"
          lead="חיפוש, סינון והשוואה בין קופות גמל, קרנות השתלמות, קרנות פנסיה ופוליסות חיסכון. הנתונים נמשכים ממקורות רשות שוק ההון: גמלנט, ביטוחנט ופנסיהנט."
          art={topic.art}
          tint={p1}
          meta={
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              <div className="flex gap-2">
                <dt>מקור הנתונים:</dt>
                <dd><b>רשות שוק ההון, ביטוח וחיסכון</b></dd>
              </div>
              <div className="flex gap-2">
                <dt>עדכון אחרון:</dt>
                <dd><b className="tabular-nums">{lastUpdate}</b></dd>
              </div>
              {syncStatus?.totalFunds ? (
                <div className="flex gap-2">
                  <dt>קופות במאגר:</dt>
                  <dd>
                    <b dir="ltr" className="tabular-nums whitespace-nowrap">
                      {syncStatus.totalFunds.toLocaleString('en-US')}
                    </b>
                  </dd>
                </div>
              ) : null}
            </dl>
          }
        >
          <p className="mt-3 text-[14px]" style={{ color: MUTED }} role="status">
            {fundsLoading
              ? 'טוען נתונים עדכניים מהמאגר. בינתיים מוצגים נתונים מקומיים.'
              : isLive
                ? 'הנתונים נטענו מהמאגר העדכני.'
                : 'המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.'}
          </p>
        </PubHero>

        {/* Tool body: one live search over the whole database */}
        <SdBand tone="cream" id="tool" className="!pt-8 sm:!pt-12">
          <div className="sd-wrap">
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
                            className="h-5 w-5 border-[#203957] data-[state=checked]:bg-[#203957] data-[state=checked]:border-[#203957]"
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
        </SdBand>

        {/* Disclaimer */}
        <SdBand tone={p2} id="disclaimer" className="!py-10 sm:!py-14">
          <div className="sd-wrap">
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
        </SdBand>

        <PubClose
          title="מצאתם קופה מעניינת?"
          text="לפני שמניידים, כדאי לבדוק דמי ניהול, כיסויים ורצף זכויות. בדיקת תיק 360 מסדרת את ההשוואה מול התיק הקיים שלכם."
          art="10-financial-planning"
        />
      </main>

      <Footer />
    </div>
  );
};

export default FundFinder;
