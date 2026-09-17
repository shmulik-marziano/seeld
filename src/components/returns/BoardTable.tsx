import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { fmtMillions, fmtNum, fmtPct, fmtPlainPct, periodLabel, periodShort, type BoardFund } from "@/hooks/useCmaBoard";
import { BODY, GREEN, LINE, MUTED, RUST_TEXT, SAGE } from "@/lib/brand";

/**
 * The returns table for one track: sortable columns, group average, an
 * expandable details row per fund (12-month sparkline, inflows, fees, risk).
 * Wide on desktop inside its own horizontal scroll container with the fund
 * name pinned; the compact view keeps the five figures that matter on a phone.
 */

export type ColumnKey =
  | "monthly_yield" | "ytd_yield" | "ret_3m" | "ret_12m" | "ret_3y" | "ret_5y"
  | "std_dev" | "sharpe" | "stock_pct" | "foreign_pct" | "fx_pct" | "mgmt_fee" | "total_assets";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  short?: string;
  kind: "return" | "pct" | "num" | "millions";
  compact?: boolean;
  title?: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: "monthly_yield", label: "חודש", kind: "return", title: "תשואת החודש האחרון" },
  { key: "ytd_yield", label: "מתחילת השנה", short: "מתחילת שנה", kind: "return" },
  { key: "ret_3m", label: "3 חודשים", kind: "return", title: "תשואה מצטברת בשלושת החודשים האחרונים" },
  { key: "ret_12m", label: "12 חודשים", kind: "return", compact: true, title: "תשואה מצטברת ב־12 החודשים האחרונים" },
  { key: "ret_3y", label: "3 שנים", kind: "return", compact: true, title: "תשואה מצטברת ב־36 החודשים האחרונים" },
  { key: "ret_5y", label: "5 שנים", kind: "return", compact: true, title: "תשואה מצטברת ב־60 החודשים האחרונים" },
  { key: "std_dev", label: "סטיית תקן", kind: "num", title: "סטיית תקן חודשית של התשואות" },
  { key: "sharpe", label: "שארפ", kind: "num", title: "מדד שארפ: תשואה עודפת ליחידת סיכון" },
  { key: "stock_pct", label: "מניות", kind: "pct", title: "חשיפה למניות מסך הנכסים" },
  { key: "foreign_pct", label: "חו״ל", kind: "pct", title: "חשיפה לנכסים בחו״ל מסך הנכסים" },
  { key: "fx_pct", label: "מט״ח", kind: "pct", title: "חשיפה למטבע חוץ מסך הנכסים" },
  { key: "mgmt_fee", label: "דמי ניהול", kind: "pct", compact: true, title: "דמי ניהול שנתיים ממוצעים מהצבירה" },
  { key: "total_assets", label: "נכסים", short: "נכסים (מיליוני ₪)", kind: "millions", title: "סך הנכסים המנוהלים במיליוני ₪" },
];

const format = (kind: ColumnDef["kind"], v: number | null | undefined) => {
  switch (kind) {
    case "return": return fmtPct(v);
    case "pct": return fmtPlainPct(v, kind === "pct" ? 2 : 1);
    case "num": return fmtNum(v);
    case "millions": return fmtMillions(v);
  }
};

const Cell = ({ kind, value }: { kind: ColumnDef["kind"]; value: number | null | undefined }) => {
  const text = format(kind, value);
  if (text === null) return <span style={{ color: MUTED }} aria-label="אין נתון">—</span>;
  const color = kind === "return" ? (value! < 0 ? RUST_TEXT : GREEN) : BODY;
  return (
    <span dir="ltr" className={`tabular-nums whitespace-nowrap ${kind === "return" ? "font-bold" : ""}`} style={{ color }}>
      {text}
    </span>
  );
};

const mean = (values: (number | null | undefined)[]) => {
  const nums = values.filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};

/** 12-month sparkline of the monthly yields: a small SVG with a zero baseline. */
const Sparkline = ({ fund }: { fund: BoardFund }) => {
  const pts = (fund.series_12m ?? []).filter((p) => p.y !== null) as { p: number; y: number }[];
  if (pts.length < 2) return <span className="text-[14px]" style={{ color: MUTED }}>אין סדרה חודשית</span>;
  const w = 220, h = 56, pad = 4;
  const ys = pts.map((p) => p.y);
  const min = Math.min(0, ...ys), max = Math.max(0, ...ys);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (pts.length - 1);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={`תשואה חודשית מ־${periodShort(pts[0].p)} עד ${periodShort(pts[pts.length - 1].p)}`} style={{ direction: "ltr" }}>
      <line x1={pad} x2={w - pad} y1={y(0)} y2={y(0)} stroke="#CCD6CC" strokeWidth="1" />
      <path d={d} fill="none" stroke={GREEN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={p.p} cx={x(i)} cy={y(p.y)} r={p.y < 0 ? 2.5 : 2} fill={p.y < 0 ? RUST_TEXT : SAGE} />
      ))}
    </svg>
  );
};

interface BoardTableProps {
  funds: BoardFund[];
  view: "full" | "compact";
  /** Funds currently drawn in the card's chart; the details row lets the reader toggle them. */
  charted?: Set<string>;
  onToggleChart?: (fund: BoardFund) => void;
  chartFull?: boolean;
  caption: string;
}

const BoardTable = ({ funds, view, charted, onToggleChart, chartFull = false, caption }: BoardTableProps) => {
  const [sortKey, setSortKey] = useState<ColumnKey | "fund_name">("ret_12m");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const cols = useMemo(() => COLUMNS.filter((c) => view === "full" || c.compact), [view]);

  const sorted = useMemo(() => {
    const rows = [...funds];
    rows.sort((a, b) => {
      if (sortKey === "fund_name") return sortDir === "asc" ? a.fund_name.localeCompare(b.fund_name, "he") : b.fund_name.localeCompare(a.fund_name, "he");
      const av = a[sortKey], bv = b[sortKey];
      const an = av === null || av === undefined, bn = bv === null || bv === undefined;
      if (an && bn) return 0;
      if (an) return 1;   // nulls last in both directions
      if (bn) return -1;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [funds, sortKey, sortDir]);

  const toggleSort = (key: ColumnKey | "fund_name") => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "fund_name" ? "asc" : "desc");
    }
  };

  const ariaSort = (key: ColumnKey | "fund_name") =>
    key === sortKey ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  const rowId = (f: BoardFund) => `${f.fund_id}:${f.source}`;
  const toggleOpen = (f: BoardFund) => {
    const id = rowId(f);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalCols = cols.length + 1;

  return (
    <div className="overflow-x-auto rounded-[10px]">
      <table className="dna-data board-table" style={{ fontSize: 15 }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort("fund_name")}>
              <button type="button" onClick={() => toggleSort("fund_name")} className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap font-bold">
                שם הקופה
                <SortMark active={sortKey === "fund_name"} dir={sortDir} />
              </button>
            </th>
            {cols.map((c) => (
              <th key={c.key} scope="col" aria-sort={ariaSort(c.key)} className="num" title={c.title}>
                <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap font-bold">
                  {c.short ?? c.label}
                  <SortMark active={sortKey === c.key} dir={sortDir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((f) => {
            const id = rowId(f);
            const isOpen = open.has(id);
            return (
              <Fragment key={id}>
                <tr>
                  <td className="fund-cell">
                    <button
                      type="button"
                      onClick={() => toggleOpen(f)}
                      aria-expanded={isOpen}
                      className="flex min-h-[44px] items-start gap-1.5 text-start font-bold hover:underline underline-offset-4"
                      style={{ color: GREEN }}
                    >
                      <BrandIcon name="chevron-down" size={16} className={`mt-1 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      <span>{f.fund_name}</span>
                    </button>
                    <span className="block text-[14px] font-normal mt-0.5" style={{ color: MUTED }}>{f.company}</span>
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className="num">
                      <Cell kind={c.kind} value={f[c.key]} />
                    </td>
                  ))}
                </tr>
                {isOpen && (
                  <tr className="details-row">
                    <td colSpan={totalCols}>
                      <div dir="rtl" className="grid gap-x-8 gap-y-4 md:grid-cols-[auto_1fr] items-start py-2">
                        <div>
                          <p className="text-[14px] mb-1" style={{ color: MUTED }}>תשואה חודשית, 12 חודשים אחרונים</p>
                          <Sparkline fund={f} />
                        </div>
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-[14px]">
                          <Detail label="6 חודשים"><Cell kind="return" value={f.ret_6m} /></Detail>
                          <Detail label="3 חודשים"><Cell kind="return" value={f.ret_3m} /></Detail>
                          <Detail label="ממוצע שנתי, 3 שנים"><Cell kind="return" value={f.avg_annual_yield_3yrs} /></Detail>
                          <Detail label="ממוצע שנתי, 5 שנים"><Cell kind="return" value={f.avg_annual_yield_5yrs} /></Detail>
                          <Detail label="דמי ניהול מהפקדה"><Cell kind="pct" value={f.deposit_fee} /></Detail>
                          <Detail label="נכסים (מיליוני ₪)"><Cell kind="millions" value={f.total_assets} /></Detail>
                          <Detail label="גיוסים נטו, 12 חודשים (מיליוני ₪)">
                            {f.inflow_12m === null ? <span style={{ color: MUTED }}>אין נתון במקור</span> : (
                              <span dir="ltr" className="tabular-nums font-bold" style={{ color: f.inflow_12m < 0 ? RUST_TEXT : GREEN }}>
                                {f.inflow_12m > 0 ? "+" : ""}{Math.round(f.inflow_12m).toLocaleString("en-US")}
                              </span>
                            )}
                          </Detail>
                          <Detail label="תחילת פעילות">{f.inception_date ? <span dir="ltr" className="tabular-nums">{f.inception_date.slice(0, 10)}</span> : <span style={{ color: MUTED }}>—</span>}</Detail>
                          <Detail label="מספר קופה"><span dir="ltr" className="tabular-nums">{f.fund_id}</span></Detail>
                          <Detail label="נתונים נכון ל">{periodLabel(f.report_period)}</Detail>
                        </dl>
                        <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
                          {onToggleChart && charted && (
                            <label className="inline-flex items-center gap-2 cursor-pointer" style={{ color: GREEN }}>
                              <input
                                type="checkbox"
                                checked={charted.has(id)}
                                disabled={!charted.has(id) && chartFull}
                                onChange={() => onToggleChart(f)}
                                className="h-4 w-4 accent-[#003D30]"
                              />
                              הצגה בגרף המסלול
                              {!charted.has(id) && chartFull && <span style={{ color: MUTED }}>(הגרף מלא, הסירו קופה אחרת)</span>}
                            </label>
                          )}
                          <Link to="/fund-finder" className="link-rule text-[14px]">
                            השוואה מול קופות אחרות
                            <BrandIcon name="arrow-left" size={16} />
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="fund-cell">ממוצע לקבוצה</th>
            {cols.map((c) => (
              <td key={c.key} className="num">
                <Cell kind={c.kind} value={mean(funds.map((f) => f[c.key]))} />
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const SortMark = ({ active, dir }: { active: boolean; dir: "asc" | "desc" }) => (
  <span aria-hidden="true" className="inline-block text-[11px]" style={{ color: active ? GREEN : "#8FA396", opacity: active ? 1 : 0.9 }}>
    {active ? (dir === "desc" ? "▼" : "▲") : "↕"}
  </span>
);

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-[14px]" style={{ color: MUTED }}>{label}</dt>
    <dd className="text-[15px]" style={{ color: BODY }}>{children}</dd>
  </div>
);

export { LINE as BOARD_LINE };
export default BoardTable;
