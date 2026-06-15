import { ReactNode, useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";

/* QUWEB's canvas is clean white — no decorative field. Kept for API parity. */
export function Aurora() {
  return null;
}

/* Eased count-up that runs when scrolled into view */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("he-IL"),
  duration = 1.6,
  className,
  delay = 0,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return (
    <span ref={ref} className={`tnum ${className ?? ""}`}>
      {display}
    </span>
  );
}

export function GlassCard({
  children,
  className = "",
  hover = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`v2-card ${hover ? "v2-card-hover" : ""} rounded-3xl ${className}`} {...rest}>
      {children}
    </div>
  );
}

/* Editorial accent (hand-drawn underline), preserving QUWEB's monochrome voice */
export function GradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`v2-accent ${className}`}>{children}</span>;
}

/* Bilingual English fragment styling, e.g. "one platform." */
export function En({ children }: { children: ReactNode }) {
  return <span className="v2-en">{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#18181a1f] bg-white px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-wider text-[#76746e]">
      {children}
    </span>
  );
}

/* Animated SVG progress ring — monochrome ink */
export function Ring({
  value,
  size = 120,
  stroke = 8,
  children,
  color = "#18181a",
  track = "#e9e8e3",
  delay = 0.2,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  color?: string;
  track?: string;
  delay?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c - (c * Math.min(100, Math.max(0, value))) / 100 } : {}}
          transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* Reveal on scroll */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
