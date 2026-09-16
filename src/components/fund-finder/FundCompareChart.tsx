import { useMemo, type CSSProperties } from 'react';
import type { Fund } from '@/types/fund';
import { companyLabels } from '@/types/fund';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { GREEN, MUTED, RUST, RUST_TEXT, TINT_SAGE } from '@/lib/brand';

// One measure (return since the start of the year) per picked fund: a single
// hue, identity carried by the row label, a rust bar only for a negative value
// and always beside a signed figure. The period table underneath is the
// readable form of the same data.

interface FundCompareChartProps {
  funds: Fund[];
}

const TH: CSSProperties = { fontSize: 14 };
const NONE = 'אין נתון';

const Pct = ({ value }: { value: number | null | undefined }) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span style={{ color: MUTED }}>{NONE}</span>;
  }
  return (
    <span className="font-bold" style={{ color: value < 0 ? RUST_TEXT : GREEN }}>
      {value > 0 ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
};

export default function FundCompareChart({ funds }: FundCompareChartProps) {
  const maxReturn = useMemo(
    () => Math.max(...funds.map((f) => f.returns.year1), 1),
    [funds]
  );

  if (funds.length === 0) return null;

  return (
    <section className="dna-concept !p-5 sm:!p-6" aria-labelledby="fund-compare-title">
      <h3 id="fund-compare-title" className="flex items-center gap-2 text-[18px]" style={{ color: GREEN }}>
        <BrandIcon name="chart" size={22} />
        השוואת תשואות מתחילת השנה
      </h3>
      <p className="mt-1 mb-5 text-[14px]" style={{ color: MUTED }}>
        אורך הפס יחסי לתשואה הגבוהה ביותר בהשוואה.
      </p>

      <ul className="space-y-3.5">
        {funds.map((fund) => {
          const v = fund.returns.year1;
          const barWidth = Math.min(100, Math.max(8, (v / maxReturn) * 100));
          return (
            <li key={fund.id}>
              <div className="flex items-baseline justify-between gap-4 text-[15px]">
                <span className="min-w-0 truncate">
                  <span className="font-bold" style={{ color: GREEN }}>{fund.name}</span>
                  <span style={{ color: MUTED }}> · {companyLabels[fund.company]}</span>
                </span>
                <span dir="ltr" className="shrink-0 tabular-nums whitespace-nowrap">
                  <Pct value={v} />
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-[4px]" style={{ backgroundColor: TINT_SAGE }}>
                <div
                  className="h-full rounded-[4px] transition-[width] duration-200 ease-out"
                  style={{ width: `${barWidth}%`, backgroundColor: v < 0 ? RUST : GREEN }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {funds.length > 1 && (
        <div className="mt-6 overflow-x-auto rounded-[10px]">
          <table className="dna-data min-w-[560px]" style={{ fontSize: 15 }}>
            <caption className="sr-only">תשואות לפי תקופה עבור הקופות שבהשוואה</caption>
            <thead>
              <tr>
                <th scope="col" style={TH}>קופה</th>
                <th scope="col" style={TH}>חודש אחרון</th>
                <th scope="col" style={TH}>מתחילת השנה</th>
                <th scope="col" style={TH}>ממוצע 3 שנים</th>
                <th scope="col" style={TH}>ממוצע 5 שנים</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((fund) => (
                <tr key={fund.id}>
                  <td>{fund.name}</td>
                  <td className="num"><Pct value={fund.returns.month} /></td>
                  <td className="num"><Pct value={fund.returns.year1} /></td>
                  <td className="num"><Pct value={fund.returns.year3} /></td>
                  <td className="num"><Pct value={fund.returns.year5} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
