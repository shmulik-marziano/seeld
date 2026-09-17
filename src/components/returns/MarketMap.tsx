import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { fmtMillions, PRODUCTS, type CompanyMapRow } from "@/hooks/useCmaBoard";
import { BODY, GREEN, MUTED, RUST_TEXT } from "@/lib/brand";

/**
 * The market map: managed assets per company and product (₪ millions), the
 * company total and its net inflows over the last twelve months.
 */
const MarketMap = ({ rows }: { rows: CompanyMapRow[] }) => {
  const [showAll, setShowAll] = useState(false);

  const companies = useMemo(() => {
    const by = new Map<string, { company: string; cells: Record<string, number | null>; total: number; inflow: number | null; inflowPartial: boolean }>();
    for (const r of rows) {
      const c = by.get(r.company) ?? { company: r.company, cells: {}, total: 0, inflow: null, inflowPartial: false };
      c.cells[r.board_product] = r.assets;
      c.total += r.assets ?? 0;
      if (r.inflow_12m !== null && r.inflow_12m !== undefined) c.inflow = (c.inflow ?? 0) + r.inflow_12m;
      if (!r.inflow_complete) c.inflowPartial = true;
      by.set(r.company, c);
    }
    return [...by.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const visible = showAll ? companies : companies.slice(0, 12);
  const grand = companies.reduce((s, c) => s + c.total, 0);

  return (
    <div className="board-card dna-concept !p-0 overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[14px]" style={{ color: MUTED }}>כל הסכומים במיליוני ₪. גיוסים: הפקדות פחות משיכות והעברות ב־12 החודשים האחרונים.</p>
        <p className="text-[14px] tabular-nums" style={{ color: MUTED }}>סך השוק: <span className="font-bold" style={{ color: GREEN }}>{fmtMillions(grand)}</span></p>
      </div>
      <div className="p-3 sm:p-4 pt-0">
        <div className="overflow-x-auto rounded-[10px]">
          <table className="dna-data board-table" style={{ fontSize: 15 }}>
            <caption className="sr-only">נכסים מנוהלים לפי חברה ומוצר, במיליוני שקלים, וגיוסים נטו ב־12 החודשים האחרונים</caption>
            <thead>
              <tr>
                <th scope="col">חברה</th>
                {PRODUCTS.map((p) => (
                  <th key={p.key} scope="col" className="num">
                    <Link to={`/return-tables/${p.slug}`} className="hover:underline underline-offset-4 whitespace-nowrap">{p.short}</Link>
                  </th>
                ))}
                <th scope="col" className="num">סה"כ</th>
                <th scope="col" className="num">גיוסים (12 ח')</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.company}>
                  <th scope="row" className="fund-cell font-bold whitespace-nowrap" style={{ color: GREEN }}>{c.company}</th>
                  {PRODUCTS.map((p) => {
                    const v = c.cells[p.key];
                    return (
                      <td key={p.key} className="num">
                        {v === null || v === undefined ? <span style={{ color: MUTED }}>—</span> : <span dir="ltr" className="tabular-nums" style={{ color: BODY }}>{fmtMillions(v)}</span>}
                      </td>
                    );
                  })}
                  <td className="num"><span dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>{fmtMillions(c.total)}</span></td>
                  <td className="num">
                    {c.inflow === null ? (
                      <span style={{ color: MUTED }}>—</span>
                    ) : (
                      <span dir="ltr" className="tabular-nums font-bold" style={{ color: c.inflow < 0 ? RUST_TEXT : GREEN }}>
                        {c.inflow > 0 ? "+" : ""}{fmtMillions(c.inflow)}{c.inflowPartial ? " *" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {companies.length > 12 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="link-rule mt-4 text-[15px]">
            {showAll ? "הצגת החברות הגדולות בלבד" : `הצגת כל ${companies.length} החברות`}
            <BrandIcon name={showAll ? "chevron-down" : "arrow-left"} size={16} className={showAll ? "rotate-180" : ""} />
          </button>
        )}
        <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
          * גיוסים חלקיים: לפוליסות חיסכון (ביטוחנט) אין נתוני הפקדות ומשיכות במקור, ולכן אינן כלולות בעמודה זו.
        </p>
      </div>
    </div>
  );
};

export default MarketMap;
