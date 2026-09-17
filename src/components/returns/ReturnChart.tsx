import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cumulativeSeries, fmtPct, periodLabel, periodShort, type BoardFund } from "@/hooks/useCmaBoard";
import { BODY, GREEN, LINE_SOFT, MUTED } from "@/lib/brand";

/**
 * Cumulative 12-month return, one line per fund (up to six).
 *
 * Series colors are the validated categorical order from the data-viz method
 * (adjacent-pair colorblind separation and normal-vision floor pass; three of
 * the six sit below 3:1 on white, so the legend carries the name and the final
 * value, and the table under the chart is always present). Chart chrome stays
 * in the brand inks.
 */
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"] as const;
export const MAX_SERIES = SERIES_COLORS.length;

interface ReturnChartProps {
  funds: BoardFund[];
  height?: number;
}

type Point = { p: number; label: string } & Record<string, number | string | null>;

const ReturnChart = ({ funds, height = 300 }: ReturnChartProps) => {
  const shown = funds.slice(0, MAX_SERIES);

  const data = useMemo<Point[]>(() => {
    const byPeriod = new Map<number, Point>();
    shown.forEach((f, i) => {
      for (const pt of cumulativeSeries(f.series_12m)) {
        const row = byPeriod.get(pt.p) ?? { p: pt.p, label: periodShort(pt.p) };
        row[`s${i}`] = pt.v === null ? null : Math.round(pt.v * 100) / 100;
        byPeriod.set(pt.p, row);
      }
    });
    return [...byPeriod.values()].sort((a, b) => a.p - b.p);
  }, [shown]);

  if (shown.length === 0 || data.length === 0) {
    return (
      <p className="text-[15px]" style={{ color: MUTED }} role="status">
        אין מספיק נתונים חודשיים לציור הגרף.
      </p>
    );
  }

  const finals = shown.map((f, i) => {
    const last = [...data].reverse().find((row) => row[`s${i}`] !== null && row[`s${i}`] !== undefined);
    return last ? (last[`s${i}`] as number) : null;
  });

  return (
    <div>
      <div dir="ltr" style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={LINE_SOFT} strokeDasharray="0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: MUTED }} tickLine={false} axisLine={{ stroke: "#CCD6CC" }} />
            <YAxis
              tick={{ fontSize: 12, fill: MUTED }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
            />
            <Tooltip
              cursor={{ stroke: "#CCD6CC", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const period = (payload[0].payload as Point).p;
                return (
                  <div dir="rtl" className="rounded-xl border bg-white px-3.5 py-2.5 text-[13px] shadow-sm" style={{ borderColor: "#CCD6CC", color: BODY }}>
                    <div className="font-bold mb-1" style={{ color: GREEN }}>{periodLabel(period) || String(label)}</div>
                    {payload.map((entry) => {
                      const idx = Number(String(entry.dataKey).slice(1));
                      const fund = shown[idx];
                      const v = entry.value as number | null;
                      return (
                        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <i style={{ width: 10, height: 10, borderRadius: 2, background: SERIES_COLORS[idx], display: "inline-block" }} aria-hidden="true" />
                            <span className="max-w-[220px] truncate">{fund?.fund_name}</span>
                          </span>
                          <span dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>{fmtPct(v) ?? "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            {shown.map((f, i) => (
              <Line
                key={f.fund_id + f.source}
                type="monotone"
                dataKey={`s${i}`}
                stroke={SERIES_COLORS[i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend: name + final cumulative value, in text ink; the swatch carries identity */}
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-[14px]" aria-label="מקרא הגרף">
        {shown.map((f, i) => (
          <li key={f.fund_id + f.source} className="flex items-center justify-between gap-3 min-w-0">
            <span className="flex items-center gap-2 min-w-0">
              <i style={{ width: 12, height: 12, borderRadius: 3, background: SERIES_COLORS[i], flexShrink: 0, display: "inline-block" }} aria-hidden="true" />
              <span className="truncate" style={{ color: BODY }}>{f.fund_name}</span>
            </span>
            <span dir="ltr" className="tabular-nums font-bold shrink-0" style={{ color: GREEN }}>{fmtPct(finals[i]) ?? "—"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px]" style={{ color: MUTED }}>
        תשואה מצטברת ב־12 החודשים האחרונים, לפי התשואות החודשיות שפורסמו. עד שש קופות בגרף.
      </p>
    </div>
  );
};

export default ReturnChart;
