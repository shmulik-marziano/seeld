import { Link } from "react-router-dom";

/**
 * The approved brand lockup: שילד (Hebrew wordmark) with "ביטוח ופיננסים" beneath,
 * the leaf-drop symbol with three dots on the left. Served from the kit's PNG
 * asset — never redrawn, stretched, recolored or boxed.
 *
 * Clear space: at least a quarter of the symbol height on every side (the
 * padding below). Sizes are the rendered height of the lockup.
 */
const HEIGHTS = { sm: 38, md: 54, lg: 68 } as const;
const RATIO = 1500 / 625; // asset width / height

const SeeIDLogo = ({
  className = "",
  size = "md",
  to = "/",
}: { className?: string; size?: keyof typeof HEIGHTS; to?: string }) => {
  const h = HEIGHTS[size];
  const w = Math.round(h * RATIO);
  return (
    <Link
      to={to}
      className={`inline-flex items-center shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#203957] ${className}`}
      aria-label="שילד ביטוח ופיננסים, לדף הבית"
      style={{ padding: Math.round(h / 8) }}
    >
      <img
        src="/brand/logo.png"
        srcSet="/brand/logo-204.png 204w, /brand/logo-306.png 306w, /brand/logo-480.png 480w, /brand/logo.png 720w"
        sizes={`${w}px`}
        alt="שילד ביטוח ופיננסים"
        width={w}
        height={h}
        style={{ height: h, width: "auto" }}
        decoding="async"
        draggable={false}
      />
    </Link>
  );
};

export default SeeIDLogo;
