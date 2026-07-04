// Live elements — the only color in SEELD Mono (people & status).
// Locked in STYLESEED.md: chips mark real people/statuses, never decoration.
import { MONO, CHIP_GREEN, FAINT, INK } from "@/lib/brand";

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
