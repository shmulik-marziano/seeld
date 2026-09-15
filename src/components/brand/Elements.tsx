import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { GREEN, RUST, SAGE, SAGE_LIGHT, SAND } from "@/lib/brand";

/**
 * Vector elements from the illustrations kit (03-elements), redrawn as inline
 * SVG so they scale and take brand colors. All are decorative: aria-hidden,
 * pointer-events none, never behind fields, sums or buttons.
 */

/** The three brand dots — sage · sand · rust. Decorative motif, not a status. */
export const BrandDots = ({ className, size = 8 }: { className?: string; size?: number }) => (
  <span className={cn("inline-flex items-center", className)} style={{ gap: size, direction: "ltr" }} aria-hidden="true">
    {[SAGE, SAND, RUST].map((c) => (
      <i key={c} style={{ width: size, height: size, borderRadius: "50%", background: c, display: "block" }} />
    ))}
  </span>
);

/** Corner bubbles — two partial circles and two dots. Place absolutely in a corner. */
export const BubbleCorner = ({
  className,
  style,
  flip = false,
}: { className?: string; style?: CSSProperties; flip?: boolean }) => (
  <svg
    viewBox="0 0 400 400"
    className={cn("pointer-events-none select-none", className)}
    style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="60" cy="120" r="180" fill={SAGE_LIGHT} />
    <circle cx="20" cy="330" r="120" fill={SAGE} />
    <circle cx="240" cy="290" r="26" fill={SAND} />
    <circle cx="280" cy="340" r="14" fill={RUST} />
  </svg>
);

/** Path divider — the winding road as a section break, with the three dots on it. */
export const PathDivider = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 960 160"
    className={cn("block w-full h-auto pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="none"
  >
    <path
      d="M0 96 C 160 20, 260 20, 400 84 S 700 150, 960 60"
      fill="none"
      stroke={SAGE_LIGHT}
      strokeWidth="34"
      strokeLinecap="round"
    />
    <path
      d="M0 96 C 160 20, 260 20, 400 84 S 700 150, 960 60"
      fill="none"
      stroke={GREEN}
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.75"
    />
    <circle cx="150" cy="58" r="7" fill={SAGE} />
    <circle cx="490" cy="104" r="7" fill={SAND} />
    <circle cx="800" cy="82" r="7" fill={RUST} />
  </svg>
);

/** Leaf canopy — two leaves meeting at the top, with sand and rust dots. */
export const LeafCanopy = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 480 320"
    className={cn("pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M240 30 C 150 60, 60 150, 40 300 C 140 240, 210 150, 240 30 Z" fill={GREEN} />
    <path d="M240 30 C 330 60, 420 150, 440 300 C 340 240, 270 150, 240 30 Z" fill={SAGE} />
    <path d="M240 30 C 200 120, 120 220, 40 300" fill="none" stroke="#FAF7EF" strokeWidth="3" />
    <path d="M240 30 C 280 120, 360 220, 440 300" fill="none" stroke="#FAF7EF" strokeWidth="3" />
    <circle cx="296" cy="54" r="18" fill={SAND} />
    <circle cx="322" cy="86" r="8" fill={RUST} />
  </svg>
);

/** Balanced stones with a sprout — the saving-and-growth mark. */
export const BalancedStones = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 320 300"
    className={cn("pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
    focusable="false"
  >
    <ellipse cx="160" cy="250" rx="120" ry="32" fill={GREEN} />
    <ellipse cx="160" cy="196" rx="90" ry="28" fill={SAGE} />
    <ellipse cx="160" cy="146" rx="60" ry="24" fill={SAND} />
    <path d="M160 126 C 160 100, 165 80, 170 60" fill="none" stroke={GREEN} strokeWidth="4" strokeLinecap="round" />
    <path d="M168 80 C 130 72, 118 40, 126 26 C 156 30, 172 54, 168 80 Z" fill={GREEN} />
    <path d="M170 68 C 200 62, 216 34, 212 20 C 184 24, 168 46, 170 68 Z" fill={SAGE} />
  </svg>
);

/** Olive branch — a diagonal stem with five leaves. */
export const OliveBranch = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 260 320"
    className={cn("pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M40 300 C 90 220, 150 130, 220 30" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" />
    <path d="M118 176 C 84 172, 62 140, 64 116 C 98 118, 122 146, 118 176 Z" fill={SAGE} />
    <path d="M150 128 C 156 96, 184 74, 210 74 C 208 106, 182 128, 150 128 Z" fill={SAGE} />
    <path d="M88 226 C 56 224, 36 194, 38 170 C 70 172, 92 198, 88 226 Z" fill={SAGE} />
    <path d="M126 158 C 132 128, 160 106, 186 106 C 184 138, 158 160, 126 158 Z" fill={GREEN} opacity="0.85" />
    <path d="M196 64 C 200 40, 222 20, 244 18 C 244 44, 222 64, 196 64 Z" fill={SAGE} />
  </svg>
);

/** Signature landscape — the road through layered hills (raster from the kit, transparent). */
export const SignatureLandscape = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <img
    src="/brand/elements/signature-landscape.png"
    width={676}
    height={640}
    alt=""
    loading="lazy"
    decoding="async"
    draggable={false}
    className={cn("pointer-events-none select-none", className)}
    style={style}
    aria-hidden="true"
  />
);
