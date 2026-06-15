import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Brand colors extracted from the official logo
export const brandDots = [
  { cx: 17, cy: 8,  r: 3.2, fill: "#d6157e" }, // teal
  { cx: 26, cy: 4,  r: 4.0, fill: "#3b3f99" }, // coral
  { cx: 35, cy: 8,  r: 3.2, fill: "#6b6fc4" }, // amber
  { cx: 12, cy: 17, r: 2.8, fill: "#f06ba8" }, // green
  { cx: 40, cy: 17, r: 2.8, fill: "#d6157e" }, // teal
] as const;

const SeeIDLogo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: { icon: 30, text: "text-sm", sub: "text-[9px]", gap: "gap-2" },
    md: { icon: 38, text: "text-lg", sub: "text-[10px]", gap: "gap-2.5" },
    lg: { icon: 52, text: "text-2xl", sub: "text-xs", gap: "gap-3" },
  };
  const s = sizes[size];

  return (
    <Link to="/" className={`inline-flex items-center ${s.gap} group ${className}`}>
      <motion.div
        className="inline-flex items-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        whileHover={{ scale: 1.03 }}
        style={{ display: "flex", alignItems: "center", gap: "inherit" }}
      >
        {/* Icon */}
        <motion.svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          whileHover={{ rotate: 5 }}
        >
          <defs>
            <linearGradient id="seeldDropGrad" x1="26" y1="14" x2="26" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d6157e" />
              <stop offset="100%" stopColor="#1a1a4b" />
            </linearGradient>
          </defs>

          {/* Decorative dots */}
          {brandDots.map((dot, i) => (
            <motion.circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={dot.fill}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.4 + i * 0.08 }}
            />
          ))}

          {/* Main drop */}
          <motion.path
            d="M26 14C26 14 16.5 25 16.5 32.5C16.5 37.75 20.75 43 26 43C31.25 43 35.5 37.75 35.5 32.5C35.5 25 26 14 26 14Z"
            fill="url(#seeldDropGrad)"
            stroke="#2D3436"
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ fillOpacity: 0 }}
            animate={{ fillOpacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
          <ellipse cx="23" cy="30" rx="2.8" ry="4.5" fill="white" opacity="0.22" transform="rotate(-12 23 30)" />
        </motion.svg>

        {/* Text */}
        <div className="flex flex-col leading-none">
          <motion.span
            className={`${s.text} font-bold tracking-tight text-foreground`}
            style={{ fontFamily: "'Poppins', 'Heebo', sans-serif", letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: "easeOut" }}
          >
            SEELD
          </motion.span>
          <motion.span
            className={`${s.sub} text-muted-foreground/60 font-medium mt-0.5`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            ביטוח, חיסכון ופנסיה
          </motion.span>
        </div>
      </motion.div>
    </Link>
  );
};

export default SeeIDLogo;
