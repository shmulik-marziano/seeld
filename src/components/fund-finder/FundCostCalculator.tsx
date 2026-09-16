import { useState, useMemo } from 'react';
import type { Fund } from '@/types/fund';
import { calculateAnnualCost, calculateWeightedAverage } from '@/data/cmaFundsData';
import { companyLabels } from '@/types/fund';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, LINE, MUTED, RUST_TEXT, TINT_SAGE } from '@/lib/brand';

// Cost calculator for the picked funds: every input has a visible label,
// results appear only after "חישוב", and a row with no figures says so
// instead of showing a zero cost.

interface FundCostCalculatorProps {
  funds: Fund[];
}

export default function FundCostCalculator({ funds }: FundCostCalculatorProps) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [deposits, setDeposits] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const costResults = useMemo(() => {
    if (!showResults) return [];
    return funds.map((fund) => {
      const balance = balances[fund.id] || 0;
      const deposit = deposits[fund.id] || 0;
      const annualCost = calculateAnnualCost(fund, balance, deposit);
      return { fund, balance, deposit, annualCost };
    });
  }, [funds, balances, deposits, showResults]);

  const weightedResult = useMemo(() => {
    if (!showResults) return null;
    const entries = funds
      .filter((f) => (balances[f.id] || 0) > 0)
      .map((f) => ({ fund: f, balance: balances[f.id] || 0 }));
    if (entries.length === 0) return null;
    return calculateWeightedAverage(entries);
  }, [funds, balances, showResults]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(v);

  if (funds.length === 0) return null;

  const hasAnyInput = funds.some((f) => (balances[f.id] || 0) > 0 || (deposits[f.id] || 0) > 0);

  return (
    <section className="dna-concept !p-5 sm:!p-6" aria-labelledby="fund-cost-title">
      <h3 id="fund-cost-title" className="flex items-center gap-2 text-[18px]" style={{ color: GREEN }}>
        <BrandIcon name="calculator" size={22} />
        חישוב עלויות וממוצע משוקלל
      </h3>
      <p className="mt-1 mb-5 text-[15px] leading-[1.7]" style={{ color: MUTED }}>
        הזינו יתרה והפקדה שנתית לכל קופה. העלות השנתית מחושבת לפי דמי הניהול שפורסמו.
      </p>

      <div className="space-y-3">
        {funds.map((fund) => (
          <div key={fund.id} className="rounded-[12px] border p-4" style={{ borderColor: LINE }}>
            <p className="text-[15px] font-bold" style={{ color: GREEN }}>{fund.name}</p>
            <p className="text-[14px] mb-3" style={{ color: MUTED }}>{companyLabels[fund.company]}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`cost-balance-${fund.id}`} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                  יתרה (₪)
                </label>
                <input
                  id={`cost-balance-${fund.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={balances[fund.id] || ''}
                  onChange={(e) => setBalances((prev) => ({ ...prev, [fund.id]: Number(e.target.value) }))}
                  className="field tabular-nums"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div>
                <label htmlFor={`cost-deposit-${fund.id}`} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                  הפקדה שנתית (₪)
                </label>
                <input
                  id={`cost-deposit-${fund.id}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={deposits[fund.id] || ''}
                  onChange={(e) => setDeposits((prev) => ({ ...prev, [fund.id]: Number(e.target.value) }))}
                  className="field tabular-nums"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setShowResults(true)} className="btn-primary min-w-[200px]">
          חישוב עלות וממוצע משוקלל
        </button>
        {showResults && !hasAnyInput && (
          <p className="text-[14px]" style={{ color: RUST_TEXT }} role="status">
            לא הוזנו יתרה או הפקדה. הזינו לפחות נתון אחד כדי לקבל תוצאה.
          </p>
        )}
      </div>

      {showResults && hasAnyInput && costResults.length > 0 && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: LINE }} role="status">
          <h4 className="text-[16px] mb-3" style={{ color: GREEN }}>עלות שנתית צפויה</h4>
          <ul className="space-y-2">
            {costResults.map(({ fund, balance, deposit, annualCost }) => (
              <li
                key={fund.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[10px] px-4 py-2.5 text-[15px]"
                style={{ backgroundColor: TINT_SAGE }}
              >
                <span className="min-w-0 truncate" style={{ color: BODY }}>{fund.name}</span>
                {balance === 0 && deposit === 0 ? (
                  <span style={{ color: MUTED }}>לא הוזנו נתונים</span>
                ) : (
                  <span dir="ltr" className="tabular-nums whitespace-nowrap">
                    <span className="font-bold" style={{ color: GREEN }}>{formatCurrency(annualCost)}</span>
                    {balance > 0 && (
                      <span style={{ color: MUTED }}> ({((annualCost / balance) * 100).toFixed(2)}%)</span>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && weightedResult && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: LINE }}>
          <h4 className="text-[16px] mb-3" style={{ color: GREEN }}>ממוצע משוקלל לפי היתרות</h4>
          <div className="rounded-[12px] p-4 sm:p-5" style={{ backgroundColor: TINT_SAGE }}>
            <p className="text-[14px] mb-3" style={{ color: MUTED }}>
              סך היתרות:{' '}
              <span dir="ltr" className="tabular-nums whitespace-nowrap font-bold" style={{ color: GREEN }}>
                {formatCurrency(weightedResult.totalBalance)}
              </span>
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'שנה', value: weightedResult.year1 },
                { label: '24 חודשים', value: weightedResult.year2 },
                { label: '3 שנים', value: weightedResult.year3 },
                { label: '5 שנים', value: weightedResult.year5 },
              ].map((cell) => (
                <div key={cell.label}>
                  <dt className="text-[14px]" style={{ color: MUTED }}>{cell.label}</dt>
                  <dd dir="ltr" className="text-[20px] font-bold tabular-nums text-right" style={{ color: GREEN }}>
                    {cell.value.toFixed(2)}%
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
