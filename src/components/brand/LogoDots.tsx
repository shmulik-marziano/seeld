import "./logo-dots.css";
import { DOTS_CYCLE_MS, dotsClock } from "@/lib/flags/logoDots";

// The five dots of public/brand/logo-icon.svg (viewBox "90 30 440 625", r=35), left to right. Nothing else from the logo.
const DOTS = [
  { cx: 146.4, cy: 177.5, fill: "#8C6A8F" },
  { cx: 210.5, cy: 113.4, fill: "#739371" },
  { cx: 298.0, cy: 90.0, fill: "#BB532B" },
  { cx: 385.5, cy: 113.4, fill: "#CE9B60" },
  { cx: 449.6, cy: 177.5, fill: "#5F86A8" },
] as const;

const reducedMotion = () => {
  try {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** Negative delay (ms) that puts this instance's fill cycle in step with the overlay that started at dotsClock.t0. */
const phaseMs = () => {
  try {
    if (!dotsClock.t0 || typeof performance === "undefined") return 0;
    const elapsed = performance.now() - dotsClock.t0;
    return elapsed > 0 ? -(elapsed % DOTS_CYCLE_MS) : 0;
  } catch {
    return 0;
  }
};

interface LogoDotsProps {
  className?: string;
  /** CSS width; height follows the viewBox. Default: large, 200px..336px (70% of min(100vw, 480px)). */
  size?: string;
  /** Fill-up cycle (logo-dots.css); under prefers-reduced-motion a soft opacity change only. */
  animated?: boolean;
}

/** Inline SVG of the five logo dots only (the VITE_LIVE_MARK=off transition; the live mark replaces it by default) (decorative: the container carries the label). */
export default function LogoDots({ className, size = "clamp(200px, 70vw, 336px)", animated = true }: LogoDotsProps) {
  const motion = animated ? (reducedMotion() ? " seeld-dots--static" : " seeld-dots--anim") : "";
  const phase = animated ? phaseMs() : 0;
  return (
    <svg
      className={`seeld-dots${motion}${className ? ` ${className}` : ""}`}
      style={{ width: size, ...(phase ? { "--seeld-phase": `${phase}ms` } : {}) } as React.CSSProperties}
      // Cropped to the dots (x 111.4..484.6, y 55..212.5); the 1.22 pop and the hollow stroke draw past the edge
      // (overflow visible). The stroke uses the dot's own colour: the hollow state is the dot's outline.
      viewBox="104 34 392 186"
      aria-hidden="true"
      focusable="false"
    >
      {DOTS.map((d, i) => (
        <circle
          key={d.fill}
          className="seeld-dot"
          cx={d.cx}
          cy={d.cy}
          r={35}
          fill={d.fill}
          stroke={d.fill}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
