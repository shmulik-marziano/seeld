import type { CSSProperties } from "react";
import { FundReturn } from "@/data/fundReturns";
import { BODY, GREEN, MUTED, RUST_TEXT } from "@/lib/brand";

// Return table for one product category (SEELD brand system 2026-09):
// table.dna-data, figures in LTR tabular cells, a missing value is named,
// never rendered as 0. Wide table scrolls inside its own container on phones.

interface FundReturnTableProps {
  funds: FundReturn[];
  title: string;
}

const TH: CSSProperties = { fontSize: 14 };
const NONE = "אין נתון";

const Pct = ({ value }: { value: number | null | undefined }) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span style={{ color: MUTED }}>{NONE}</span>;
  }
  return (
    <span className="font-bold" style={{ color: value < 0 ? RUST_TEXT : GREEN }}>
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
};

const FundReturnTable = ({ funds, title }: FundReturnTableProps) => (
  <div>
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h3 className="text-[18px]" style={{ color: GREEN }}>
        {title}
      </h3>
      <p className="text-[14px]" style={{ color: MUTED }}>
        <span dir="ltr" className="tabular-nums">{funds.length}</span> קרנות · תשואות באחוזים
      </p>
    </div>

    <div className="overflow-x-auto rounded-[10px]">
      <table className="dna-data min-w-[640px]" style={{ fontSize: 15 }}>
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col" style={TH}>שם הקרן</th>
            <th scope="col" style={TH}>חברה</th>
            <th scope="col" style={TH}>חודש</th>
            <th scope="col" style={TH}>שנה</th>
            <th scope="col" style={TH}>3 שנים</th>
            <th scope="col" style={TH}>5 שנים</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund, index) => (
            <tr key={`${fund.name}-${index}`}>
              <td>{fund.name}</td>
              <td className="whitespace-nowrap" style={{ color: BODY }}>{fund.company}</td>
              <td className="num"><Pct value={fund.monthReturn} /></td>
              <td className="num"><Pct value={fund.yearReturn} /></td>
              <td className="num"><Pct value={fund.threeYearReturn} /></td>
              <td className="num"><Pct value={fund.fiveYearReturn} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="mt-2 text-[14px] sm:hidden" style={{ color: MUTED }}>
      אפשר לגלול את הטבלה לצדדים כדי לראות את כל העמודות.
    </p>
  </div>
);

export default FundReturnTable;
