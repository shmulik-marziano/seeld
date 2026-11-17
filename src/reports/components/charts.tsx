// Accessible SVG donuts (no chart library) and the summary dashboard.
import { formatCurrency, formatPercent, NO_INFO } from "../format";
import type { Slice } from "../types";
import { Block } from "./LockedBlock";
import { useReport } from "./context";

export const DONUT_COLORS = ["#203957", "#AD833E", "#819B7D", "#7FA3C7", "#9C8FB5", "#C98E84", "#B9B39A"];

export function Donut({ title, slices, total }: { title: string; slices: Slice[]; total: number | null }) {
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  const desc = slices.map((s) => `${s.label}: ${s.pct}%`).join(", ");
  const id = `dn-${title.replace(/\s+/g, "-")}`;
  return (
    <figure className="rp-donut">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-labelledby={`${id}-t ${id}-d`}>
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{desc || NO_INFO}</desc>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#E6E9EE" strokeWidth="20" />
        <g transform="rotate(-90 70 70)">
          {slices.map((s, i) => {
            const len = (s.pct / 100) * C;
            const el = <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="20" strokeDasharray={`${Math.max(0, len - 1.5)} ${C - Math.max(0, len - 1.5)}`} strokeDashoffset={-acc} />;
            acc += len;
            return el;
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" className="rp-donut-total-l">סך הכל</text>
        <text x="70" y="86" textAnchor="middle" className="rp-donut-total">{total === null ? "" : `${compact(total)} ₪`}</text>
      </svg>
      <figcaption>
        <b className="rp-h3">{title}</b>
        <ul className="rp-legend">
          {slices.map((s, i) => (
            <li key={s.label}><i style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} aria-hidden="true" /><span>{s.label}</span><b>{s.pct}%</b><small>{formatCurrency(s.value)}</small></li>
          ))}
          {slices.length === 0 && <li className="rp-quiet">{NO_INFO}</li>}
        </ul>
      </figcaption>
    </figure>
  );
}

function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, "")} מ׳`;
  if (v >= 1000) return `${Math.round(v / 1000)} א׳`;
  return String(Math.round(v));
}

export function Stat({ label, value, sub, foot }: { label: string; value: string; sub?: string; foot?: string }) {
  return (
    <div className="rp-stat">
      <span className="rp-stat-l">{label}</span>
      <b className="rp-stat-v">{value}</b>
      {sub && <span className="rp-stat-s">{sub}</span>}
      {foot && <small className="rp-stat-f">{foot}</small>}
    </div>
  );
}

export function SummaryDashboard() {
  const { report } = useReport();
  const s = report.summary;
  const savings = true;
  const ins = report.mode === "unified";
  return (
    <Block id="summary-dashboard">
      <section className="rp-block rp-dash" aria-labelledby="rp-dash-h">
        <h2 id="rp-dash-h" className="rp-h2">תמונת מצב</h2>
        <div className="rp-stats">
          {savings && <Stat label="סך החיסכון הצבור" value={formatCurrency(s.totalSavings)} sub={`${s.savingsCount} מוצרי חיסכון`} />}
          {savings && <Stat label="תשואה מתחילת השנה" value={formatPercent(s.returnPct)} foot="* התשואה לפי דוחות היצרנים, ממוצע משוקלל ביתרות." />}
          {ins && (
            <Stat label="סך הפרמיה החודשית" value={formatCurrency(s.premiumTotal)} sub={`חיים ${formatCurrency(s.premiumLife)} · בריאות ${formatCurrency(s.premiumHealth)}`} />
          )}
        </div>
      </section>
    </Block>
  );
}

export function DonutsSection() {
  const { report } = useReport();
  const total = report.summary.totalSavings;
  return (
    <div className="rp-donuts">
      <Block id="donut-type"><div className="rp-block"><Donut title="פילוח לפי סוג מוצר" slices={report.donuts.byType} total={total} /></div></Block>
      <Block id="donut-manufacturer"><div className="rp-block"><Donut title="פילוח לפי יצרן" slices={report.donuts.byManufacturer} total={total} /></div></Block>
      <Block id="donut-liquidity"><div /></Block>
      <Block id="donut-exposure"><div /></Block>
    </div>
  );
}
