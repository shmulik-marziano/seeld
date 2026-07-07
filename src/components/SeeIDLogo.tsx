import { Link } from "react-router-dom";

// The original SeeID brand dots — the colored arc around the droplet
export const brandDots = [
  { cx: 17, cy: 9,  r: 3.4, fill: "#7da7c9" }, // blue
  { cx: 26, cy: 5,  r: 4.2, fill: "#e8767c" }, // coral
  { cx: 35, cy: 9,  r: 3.4, fill: "#e8c36a" }, // amber
  { cx: 12, cy: 18, r: 2.9, fill: "#6cc5a1" }, // green
  { cx: 40, cy: 18, r: 2.9, fill: "#e8767c" }, // coral
] as const;

const SERIF = "'Heebo', sans-serif";

/**
 * The original SeeID lockup: droplet in ink line-work with a mint core,
 * crowned by the five brand dots, "SeeID" wordmark beside it.
 */
const SeeIDLogo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: { icon: 30, text: "text-base", sub: "text-[8px]", gap: "gap-2" },
    md: { icon: 40, text: "text-xl", sub: "text-[9px]", gap: "gap-2.5" },
    lg: { icon: 54, text: "text-3xl", sub: "text-[11px]", gap: "gap-3" },
  };
  const s = sizes[size];

  return (
    <Link to="/" className={`inline-flex items-center ${s.gap} group ${className}`}>
      {/* Droplet + colored dot arc — the original mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 52 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-[1px]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="seeid-drop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d5efe3" />
            <stop offset="100%" stopColor="#8fd4b4" />
          </linearGradient>
        </defs>
        {brandDots.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} />
        ))}
        <path
          d="M26 11C26 11 17 22.4 17 29.6C17 34.9 21 39 26 39C31 39 35 34.9 35 29.6C35 22.4 26 11 26 11Z"
          fill="url(#seeid-drop)"
          stroke="#1D2D3D"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      </svg>

      {/* SeeID wordmark + tagline */}
      <div className="flex flex-col leading-none">
        <span
          dir="ltr"
          className={`${s.text} text-[#1D2D3D] dark:text-white`}
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: "0.01em" }}
        >
          SeeID
        </span>
        <span className={`${s.sub} mt-1 text-[#6e6e6e] dark:text-white/60 font-medium tracking-[0.2em]`}>
          בית פיננסים וביטוח
        </span>
      </div>
    </Link>
  );
};

export default SeeIDLogo;
