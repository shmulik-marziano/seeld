import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { YearPoint, shekels, shekelsCompact } from "../lib/finance";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as YearPoint;
  return (
    <div dir="rtl" className="rounded-xl border border-white/15 bg-[#0c0a1e]/95 px-3.5 py-2.5 backdrop-blur-md shadow-2xl">
      <p className="text-[11px] text-white/50">גיל {Math.round(p.age)}</p>
      <p className="tnum text-[15px] font-bold text-white">{shekels(p.balance)}</p>
      <p className="tnum text-[11px] text-[#67e8f9]">עם דמי ניהול מופחתים: {shekels(p.optimizedBalance)}</p>
    </div>
  );
}

export function ProjectionChart({ series, animate = true }: { series: YearPoint[]; animate?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="v2area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0218a" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#e0218a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="v2areaOpt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="age"
          tickFormatter={(v) => `${Math.round(v)}`}
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          reversed
        />
        <YAxis
          tickFormatter={(v) => shekelsCompact(v)}
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
          tickLine={false}
          axisLine={false}
          width={48}
          orientation="right"
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="optimizedBalance"
          stroke="#67e8f9"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#v2areaOpt)"
          isAnimationActive={animate}
          animationDuration={1400}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#f472b6"
          strokeWidth={2.5}
          fill="url(#v2area)"
          isAnimationActive={animate}
          animationDuration={1600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
