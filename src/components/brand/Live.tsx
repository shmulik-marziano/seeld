// Live elements — the only color in SEELD Mono (people & status).
// Locked in STYLESEED.md: chips mark real people/statuses, never decoration.
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { MONO, CHIP_GREEN, FAINT, INK } from "@/lib/brand";

/** Number that counts up once when scrolled into view (Snap: fast ease-out) */
export const CountUp = ({
  to, duration = 900, className = "", style, format,
}: {
  to: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  format?: (v: number) => string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced || to === 0) { setVal(to); return; }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={className} style={style}>
      {format ? format(val) : val.toLocaleString("en-US")}
    </span>
  );
};

/** Pulsing status dot (green = available/live) */
export const LiveDot = ({ color = CHIP_GREEN, size = 7 }: { color?: string; size?: number }) => (
  <span className="relative inline-flex" style={{ width: size, height: size }} aria-hidden="true">
    <span
      className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
      style={{ backgroundColor: color }}
    />
    <span className="relative inline-flex rounded-full h-full w-full" style={{ backgroundColor: color }} />
  </span>
);

/** People chip — a live collaboration-style tag (the Flim gesture) */
export const LiveChip = ({ label, color }: { label: string; color: string }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[13px] font-medium whitespace-nowrap"
    style={{ backgroundColor: color, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}
  >
    {label}
  </span>
);

/** Mono technical tag, e.g. LIVE · 24/7 · API */
export const LiveTag = ({
  children, dot = false, dark = false,
}: { children: React.ReactNode; dot?: boolean; dark?: boolean }) => (
  <span
    className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.12em] font-medium"
    style={{ fontFamily: MONO, color: dark ? "rgba(250,250,250,.6)" : FAINT }}
  >
    {dot && <LiveDot size={6} />}
    {children}
  </span>
);

/** Live analog clock — the reference's clock tile. Ink hands, ticks once a second.
 *  Reduced motion: no second hand, updates once a minute. */
export const LiveClock = ({
  size = 56, color = INK, className = "",
}: { size?: number; color?: string; className?: string }) => {
  const reduced = useReducedMotion();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), reduced ? 60000 : 1000);
    return () => clearInterval(id);
  }, [reduced]);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = (m + s / 60) * 6;
  const secAngle = s * 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`השעה ${h}:${String(m).padStart(2, "0")}`}
    >
      <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="50" y1="12" x2="50" y2="18"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
      <line
        x1="50" y1="50" x2="50" y2="28"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />
      <line
        x1="50" y1="50" x2="50" y2="20"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        transform={`rotate(${minAngle} 50 50)`}
      />
      {!reduced && (
        <line
          x1="50" y1="56" x2="50" y2="17"
          stroke={color} strokeWidth="1.8" strokeLinecap="round"
          transform={`rotate(${secAngle} 50 50)`}
        />
      )}
      <circle cx="50" cy="50" r="4" fill={color} />
    </svg>
  );
};

/** Status pill on white — ink text, hairline ring */
export const StatusPill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[13px] font-medium"
    style={{ color: INK, boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
  >
    <LiveDot size={6} />
    {children}
  </span>
);
