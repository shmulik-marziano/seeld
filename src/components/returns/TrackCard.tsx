import { useMemo, useState } from "react";
import BoardTable from "@/components/returns/BoardTable";
import ReturnChart, { MAX_SERIES } from "@/components/returns/ReturnChart";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { COLUMNS } from "@/components/returns/BoardTable";
import { fmtAssets, periodLabel, TRACKS, type BoardFund } from "@/hooks/useCmaBoard";
import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

/**
 * One track category (e.g. "כללי" inside קרנות השתלמות): the group's total
 * assets, a one-line description, the actions (chart, Excel, print) and the
 * sortable table. The chart draws the six largest funds by default; the reader
 * swaps funds in and out from the details row of the table.
 */
interface TrackCardProps {
  trackKey: string;
  productLabel: string;
  funds: BoardFund[];
  view: "full" | "compact";
}

const rowId = (f: BoardFund) => `${f.fund_id}:${f.source}`;

const TrackCard = ({ trackKey, productLabel, funds, view }: TrackCardProps) => {
  const meta = TRACKS[trackKey] ?? { label: trackKey, description: "" };
  const assets = funds.reduce((s, f) => s + (f.total_assets ?? 0), 0);
  const [chartOpen, setChartOpen] = useState(false);
  const [charted, setCharted] = useState<Set<string>>(() => {
    const top = [...funds].sort((a, b) => (b.total_assets ?? 0) - (a.total_assets ?? 0)).slice(0, MAX_SERIES);
    return new Set(top.map(rowId));
  });
  const [exporting, setExporting] = useState(false);

  const chartFunds = useMemo(() => funds.filter((f) => charted.has(rowId(f))), [funds, charted]);

  const toggleChart = (f: BoardFund) => {
    setCharted((prev) => {
      const next = new Set(prev);
      const id = rowId(f);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SERIES) next.add(id);
      return next;
    });
    setChartOpen(true);
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const header = ["שם הקופה", "חברה", "מספר קופה", ...COLUMNS.map((c) => c.short ?? c.label), "6 חודשים", "גיוסים נטו 12 חודשים (מיליוני ₪)", "נכון ל"];
      const rows = funds.map((f) => [
        f.fund_name, f.company, f.fund_id,
        ...COLUMNS.map((c) => f[c.key] ?? null),
        f.ret_6m ?? null, f.inflow_12m ?? null, periodLabel(f.report_period),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws["!cols"] = header.map((_, i) => ({ wch: i === 0 ? 48 : 14 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, meta.label.slice(0, 30));
      XLSX.writeFile(wb, `שילד-לוח-תשואות-${productLabel}-${meta.label}.xlsx`.replace(/[\\/:*?"<>|]/g, "-"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="board-card dna-concept !p-0 overflow-hidden" aria-labelledby={`track-${trackKey}`}>
      <header className="px-5 sm:px-6 pt-5 pb-4 border-b" style={{ borderColor: LINE }}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h3 id={`track-${trackKey}`} className="text-[22px] leading-tight" style={{ color: GREEN }}>
              {/* Both halves are bidi-isolated: a label ending in digits ("עד 50")
                  would otherwise merge with the number that follows it. */}
              <bdi>{meta.label}</bdi>
              <span className="mr-3 text-[15px] font-normal tabular-nums" style={{ color: MUTED, unicodeBidi: "isolate" }}>
                {fmtAssets(assets)} · {funds.length} קופות
              </span>
            </h3>
            {meta.description && <p className="mt-1 text-[15px] leading-[1.6]" style={{ color: BODY }}>{meta.description}</p>}
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChartOpen((v) => !v)}
              aria-expanded={chartOpen}
              className={`inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[14px] font-bold transition-colors ${chartOpen ? "text-[#FAF7EF]" : ""}`}
              style={chartOpen ? { background: GREEN } : { boxShadow: `inset 0 0 0 1.5px ${GREEN}`, color: GREEN }}
            >
              <BrandIcon name="chart" size={18} />
              גרף
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[14px] font-bold transition-colors disabled:opacity-60"
              style={{ boxShadow: `inset 0 0 0 1.5px ${GREEN}`, color: GREEN }}
            >
              <BrandIcon name="download" size={18} />
              {exporting ? "מכין קובץ" : "אקסל"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[14px] font-bold transition-colors"
              style={{ boxShadow: `inset 0 0 0 1.5px ${GREEN}`, color: GREEN }}
            >
              <BrandIcon name="document" size={18} />
              הדפסה
            </button>
          </div>
        </div>
      </header>

      {chartOpen && (
        <div className="px-5 sm:px-6 py-5 border-b" style={{ borderColor: LINE }}>
          <ReturnChart funds={chartFunds} />
        </div>
      )}

      <div className="p-3 sm:p-4">
        <BoardTable
          funds={funds}
          view={view}
          charted={charted}
          onToggleChart={toggleChart}
          chartFull={charted.size >= MAX_SERIES}
          caption={`${productLabel}: ${meta.label}. תשואות ונתוני סיכון לכל הקופות במסלול`}
        />
      </div>
    </section>
  );
};

export default TrackCard;
