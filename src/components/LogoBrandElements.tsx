import { motion } from "framer-motion";
import { brandDots } from "@/components/SeeIDLogo";

interface LogoDotsDecorationProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

/**
 * Decorative scattered dots inspired by the SEELD logo's dot crown pattern.
 * Use as section decorations, backgrounds, or dividers.
 */
export const LogoDotsDecoration = ({ className = "", size = 120, animate = true }: LogoDotsDecorationProps) => {
  const dots = [
    { cx: 20, cy: 30, r: 8, fill: brandDots[0].fill, delay: 0 },
    { cx: 50, cy: 15, r: 10, fill: brandDots[1].fill, delay: 0.1 },
    { cx: 80, cy: 25, r: 7, fill: brandDots[2].fill, delay: 0.2 },
    { cx: 35, cy: 70, r: 6, fill: brandDots[3].fill, delay: 0.3 },
    { cx: 70, cy: 75, r: 9, fill: brandDots[4].fill, delay: 0.4 },
    { cx: 15, cy: 55, r: 5, fill: brandDots[1].fill, delay: 0.5 },
    { cx: 85, cy: 55, r: 6, fill: brandDots[3].fill, delay: 0.6 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {dots.map((dot, i) => (
        animate ? (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={dot.fill}
            opacity={0.35}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.35 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: dot.delay }}
          />
        ) : (
          <circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={dot.fill}
            opacity={0.35}
          />
        )
      ))}
    </svg>
  );
};

/**
 * A horizontal divider with logo-colored dots instead of a plain line.
 */
export const LogoDotsDivider = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center gap-3 py-6 ${className}`}>
      {brandDots.map((dot, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ 
            backgroundColor: dot.fill, 
            width: i === 2 ? 10 : i === 0 || i === 4 ? 6 : 8,
            height: i === 2 ? 10 : i === 0 || i === 4 ? 6 : 8,
          }}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
};

/**
 * A single SVG drop icon matching the logo — for use as section markers or bullets.
 */
export const LogoDropIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`flex-shrink-0 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="dropIconGrad" x1="12" y1="4" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#171717" />
        <stop offset="100%" stopColor="#171717" />
      </linearGradient>
    </defs>
    <path
      d="M12 4C12 4 5.5 12.5 5.5 16.5C5.5 19.8 8.4 22 12 22C15.6 22 18.5 19.8 18.5 16.5C18.5 12.5 12 4 12 4Z"
      fill="url(#dropIconGrad)"
      stroke="#2D3436"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <ellipse cx="10.5" cy="15" rx="1.5" ry="2.2" fill="white" opacity="0.2" transform="rotate(-10 10.5 15)" />
  </svg>
);

/**
 * Background pattern of scattered brand dots — for section backgrounds.
 */
export const LogoDotsBackground = ({ className = "" }: { className?: string }) => {
  const scattered = [
    { left: "5%", top: "10%", size: 12, fill: brandDots[0].fill, opacity: 0.15 },
    { left: "15%", top: "60%", size: 8, fill: brandDots[1].fill, opacity: 0.12 },
    { left: "25%", top: "30%", size: 16, fill: brandDots[2].fill, opacity: 0.1 },
    { left: "40%", top: "80%", size: 10, fill: brandDots[3].fill, opacity: 0.14 },
    { left: "55%", top: "15%", size: 14, fill: brandDots[4].fill, opacity: 0.12 },
    { left: "70%", top: "50%", size: 8, fill: brandDots[0].fill, opacity: 0.1 },
    { left: "80%", top: "25%", size: 12, fill: brandDots[1].fill, opacity: 0.13 },
    { left: "90%", top: "70%", size: 10, fill: brandDots[3].fill, opacity: 0.11 },
    { left: "60%", top: "90%", size: 6, fill: brandDots[2].fill, opacity: 0.15 },
    { left: "35%", top: "45%", size: 9, fill: brandDots[4].fill, opacity: 0.1 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {scattered.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.fill,
            opacity: dot.opacity,
          }}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
        />
      ))}
    </div>
  );
};
