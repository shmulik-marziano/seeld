// Shared presentational pieces of the Ops Console: pills, tiles, filters, pager, disabled actions, state wrapper,
// and the three tiny accessible charts (CSS/SVG, no chart library). Colour is never the only signal: every
// status has a text label and a shape marker, and charts carry their numbers in the DOM.
import type { ReactNode } from "react";
import { CaEmpty, CaError, CaLoading, CaPanel } from "@/components/sd/client";
import type { Pastel } from "@/components/sd/topics";
import { formatAge, formatPct, funnelView } from "./contracts";
import type { FunnelStep, Tone, Page } from "./contracts";
import type { QueryState } from "./OpsData";

const he = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (iso: string | null | undefined) => (iso ? he.format(new Date(iso)) : "אין");
export const ageFrom = (iso: string, now = new Date()) => formatAge(Math.round((now.getTime() - new Date(iso).getTime()) / 60_000));
export const num = (n: number) => n.toLocaleString("he-IL");

// ─────────── status pill with a shape marker (circle ok, triangle warn, square bad, diamond info) ───────────
export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className="ops-pill" data-tone={tone}>{children}</span>;
}

// ─────────── page header ───────────
export function ScreenHead({ title, question, asOf, children }: { title: string; question: string; asOf?: string | null; children?: ReactNode }) {
  return (
    <header className="ops-screen-head">
      <div>
        <h2 className="ops-h2">{title}</h2>
        <p className="ops-question">{question}</p>
      </div>
      <div className="ops-head-side">
        {asOf && <span className="ops-asof">נכון ל-{fmtDateTime(asOf)}</span>}
        {children}
      </div>
    </header>
  );
}

// ─────────── query state wrapper: loading, error, empty, data ───────────
export function QueryView<T>({ q, empty, children, tone = "sky" }: {
  q: QueryState<T>;
  empty?: (d: T) => { title: string; text: string } | null;
  children: (d: T) => ReactNode;
  tone?: Pastel;
}) {
  if (q.loading && !q.data) return <CaLoading label="טוען נתונים" tone={tone} />;
  if (q.error && !q.data) return <CaError title="הנתונים לא נטענו" text={`${q.error}. הנתונים הקודמים לא זמינים. אפשר לנסות שוב.`} onRetry={q.reload} />;
  if (!q.data) return null;
  const e = empty?.(q.data) ?? null;
  return (
    <>
      {q.error && <p className="ops-stale" role="alert">הרענון האחרון נכשל, מוצגים נתונים מ-{q.updatedAt ? fmtDateTime(q.updatedAt.toISOString()) : "קודם"}.</p>}
      {e ? <CaEmpty compact tone={tone} title={e.title} text={e.text} /> : children(q.data)}
    </>
  );
}

// ─────────── stat tile ───────────
export function StatTile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone }) {
  return (
    <div className="ops-tile" data-tone={tone}>
      <span className="ops-tile-label">{label}</span>
      <span className="ops-tile-value">{value}</span>
      {sub && <span className="ops-tile-sub">{sub}</span>}
    </div>
  );
}

// ─────────── filters ───────────
export function Segmented<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: Array<{ value: V; label: string }>; onChange: (v: V) => void }) {
  return (
    <div className="ops-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="ops-field"><span>{label}</span>{children}</label>;
}

export function Select<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: Array<{ value: V; label: string }>; onChange: (v: V) => void }) {
  return (
    <Field label={label}>
      <select className="ops-select" value={value} onChange={(e) => onChange(e.target.value as V)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

// ─────────── pager ───────────
export function Pager<T>({ page, onPage }: { page: Page<T>; onPage: (n: number) => void }) {
  const last = Math.max(1, Math.ceil(page.total / page.pageSize));
  if (page.total <= page.pageSize) return <p className="ops-count">{num(page.total)} רשומות</p>;
  return (
    <nav className="ops-pager" aria-label="מעבר בין עמודים">
      <span className="ops-count">{num(page.total)} רשומות, עמוד {page.page} מתוך {last}</span>
      <span className="ops-pager-btns">
        <button type="button" className="btn-secondary" disabled={page.page <= 1} onClick={() => onPage(page.page - 1)}>הקודם</button>
        <button type="button" className="btn-secondary" disabled={page.page >= last} onClick={() => onPage(page.page + 1)}>הבא</button>
      </span>
    </nav>
  );
}

// ─────────── disabled action with a tooltip that works for keyboard and touch (aria-disabled, focusable) ───────────
export function DisabledAction({ children, reason, id }: { children: ReactNode; reason: string; id: string }) {
  return (
    <span className="ops-tip">
      <button type="button" className="btn-secondary ops-btn-sm" aria-disabled="true" aria-describedby={id} onClick={(e) => e.preventDefault()}>{children}</button>
      <span role="tooltip" id={id} className="ops-tip-text">{reason}</span>
    </span>
  );
}

export function Section({ title, tone, note, children }: { title: string; tone?: Pastel; note?: string; children: ReactNode }) {
  return (
    <CaPanel tone={tone} className="ops-panel">
      <div className="ops-panel-head"><h3>{title}</h3>{note && <span className="ops-note">{note}</span>}</div>
      {children}
    </CaPanel>
  );
}

// ═════════════ charts ═════════════

/** Horizontal funnel. Rows carry label, count and conversion as text; bars are decorative (aria-hidden). */
export function FunnelBars({ steps, id }: { steps: readonly FunnelStep[]; id: string }) {
  const v = funnelView(steps);
  const max = Math.max(1, v[0]?.count ?? 1);
  return (
    <ol className="ops-funnel" aria-label="שלבי המשפך">
      {v.map((s, i) => (
        <li key={s.key} className="ops-funnel-row" data-worst={s.biggestDrop || undefined}>
          <span className="ops-funnel-label">{s.label}</span>
          <span className="ops-funnel-track" aria-hidden="true"><i style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }} /></span>
          <span className="ops-funnel-count" id={`${id}-${i}`}>{num(s.count)}</span>
          <span className="ops-funnel-meta">
            {i === 0 ? "נקודת פתיחה" : <>{formatPct(s.ofPrev)} מהשלב הקודם{s.dropped > 0 && <>, נשרו {num(s.dropped)}</>}</>}
            {s.biggestDrop && <b className="ops-worst">הנשירה הגדולה ביותר</b>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Tiny line chart. The summary text is the accessible name; the numbers live in the title. */
export function Sparkline({ values, label, height = 40 }: { values: readonly number[]; label: string; height?: number }) {
  const w = 160;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((n, i) => `${(i * step).toFixed(1)},${(height - 3 - (n / max) * (height - 8)).toFixed(1)}`);
  const area = `0,${height} ${pts.join(" ")} ${w},${height}`;
  return (
    <svg className="ops-spark" viewBox={`0 0 ${w} ${height}`} width="100%" height={height} role="img" aria-label={label} preserveAspectRatio="none">
      <title>{label}</title>
      <polygon points={area} className="ops-spark-area" />
      <polyline points={pts.join(" ")} className="ops-spark-line" />
    </svg>
  );
}

/** Queue depth as one stacked bar. Segments differ by fill pattern as well as lightness; legend shows the numbers. */
export function QueueBar({ pending, inFlight, retrying, deadLetter }: { pending: number; inFlight: number; retrying: number; deadLetter: number }) {
  const total = pending + inFlight + retrying + deadLetter;
  const seg = [
    { k: "pending", label: "ממתינות", n: pending },
    { k: "inflight", label: "בעיבוד", n: inFlight },
    { k: "retrying", label: "בניסיון חוזר", n: retrying },
    { k: "dead", label: "נכשלו", n: deadLetter },
  ];
  return (
    <div>
      <div className="ops-qbar" aria-hidden="true">
        {total === 0 ? <i className="ops-qbar-empty" /> : seg.map((s) => s.n > 0 && <i key={s.k} data-k={s.k} style={{ flexGrow: s.n }} />)}
      </div>
      <ul className="ops-legend">
        {seg.map((s) => <li key={s.k}><i data-k={s.k} aria-hidden="true" />{s.label} <b>{num(s.n)}</b></li>)}
      </ul>
    </div>
  );
}
