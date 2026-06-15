import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { YearPoint, shekels, shekelsCompact } from "../lib/finance";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as YearPoint;
  return (
    <div dir="rtl" className="rounded-2xl border border-[#18182814] bg-white px-3.5 py-2.5 shadow-xl">
      <p className="text-[11px] text-[#71717a]">גיל {Math.round(p.age)}</p>
      <p className="tnum text-[15px] font-bold text-[#18181b]">{shekels(p.balance)}</p>
      <p className="tnum text-[11px] text-[#16a34a]">עם דמי ניהול מופחתים: {shekels(p.optimizedBalance)}</p>
    </div>
  );
}

export function ProjectionChart({ series, animate = true }: { series: YearPoint[]; animate?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="v2area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d6bf3" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#1d6bf3" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="v2areaOpt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(24,24,40,0.06)" />
        <XAxis
          dataKey="age"
          tickFormatter={(v) => `${Math.round(v)}`}
          stroke="rgba(24,24,40,0.2)"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          reversed
        />
        <YAxis
          tickFormatter={(v) => shekelsCompact(v)}
          stroke="rgba(24,24,40,0.2)"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          width={48}
          orientation="right"
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="optimizedBalance"
          stroke="#16a34a"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#v2areaOpt)"
          isAnimationActive={animate}
          animationDuration={1400}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#1d6bf3"
          strokeWidth={2.5}
          fill="url(#v2area)"
          isAnimationActive={animate}
          animationDuration={1600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
