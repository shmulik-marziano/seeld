import "./logo-dots.css";

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

interface LogoDotsProps {
  className?: string;
  /** CSS width; height follows the viewBox. Default: large, 200px..336px (70% of min(100vw, 480px)). */
  size?: string;
  /** Staggered wave; under prefers-reduced-motion a soft opacity change only. */
  animated?: boolean;
}

/** Inline SVG of the five logo dots only (decorative: the container carries the label). */
export default function LogoDots({ className, size = "clamp(200px, 70vw, 336px)", animated = true }: LogoDotsProps) {
  const motion = animated ? (reducedMotion() ? " seeld-dots--static" : " seeld-dots--anim") : "";
  return (
    <svg
      className={`seeld-dots${motion}${className ? ` ${className}` : ""}`}
      style={{ width: size }}
      // Cropped to the dots (x 111.4..484.6, y 55..212.5) with room for the 14-unit rise and 1.08 scale.
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
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
