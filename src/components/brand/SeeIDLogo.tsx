interface SeeIDLogoProps {
  /** Rendered height in px. */
  size?: number;
  /** true = the full lockup (wordmark + descriptor). false = the symbol only. */
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  textColor?: string;
}

const FULL_RATIO = 1705 / 735;
const ICON_RATIO = 495 / 720;

/**
 * Brand mark for app surfaces (personal area, agent tools, chat).
 * Uses the kit's PNG assets; the symbol alone only where the brand context is
 * already clear (a header or a signed-in screen).
 */
export function SeeIDLogo({ size = 40, showText = false, className = "" }: SeeIDLogoProps) {
  const full = showText;
  const h = size;
  const w = Math.round(h * (full ? FULL_RATIO : ICON_RATIO));
  return (
    <span className={`inline-flex items-center ${className}`} style={{ padding: Math.round(h / 8) }}>
      <img
        src={full ? "/brand/logo.png" : "/brand/logo-icon.png"}
        alt="שילד ביטוח ופיננסים"
        width={w}
        height={h}
        style={{ height: h, width: "auto" }}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
