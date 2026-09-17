import { GREEN, PASTEL_SAGE, PASTEL_SAND, RUST, SAGE, SAND, TINT_SAGE, TINT_SAND } from "@/lib/brand";

/**
 * The abstract thumbnail from the knowledge-hub mock: a tinted field with a
 * few overlapping brand circles. Four arrangements, chosen by `variant`, so a
 * list of cards does not repeat the same picture. Decorative (aria-hidden).
 */
const VARIANTS = [
  { bg: TINT_SAND, discs: [{ c: SAGE, s: 58, x: 34, y: 18, o: 0.9 }, { c: RUST, s: 34, x: 8, y: 46, o: 0.9 }, { c: PASTEL_SAND, s: 44, x: 52, y: 50, o: 1 }] },
  { bg: TINT_SAGE, discs: [{ c: SAND, s: 52, x: 10, y: 20, o: 0.9 }, { c: PASTEL_SAGE, s: 60, x: 40, y: 38, o: 1 }, { c: RUST, s: 26, x: 66, y: 12, o: 0.9 }] },
  { bg: TINT_SAND, discs: [{ c: PASTEL_SAGE, s: 64, x: 30, y: 10, o: 1 }, { c: GREEN, s: 28, x: 10, y: 56, o: 1 }, { c: SAND, s: 40, x: 58, y: 48, o: 0.9 }] },
  { bg: TINT_SAGE, discs: [{ c: RUST, s: 36, x: 14, y: 14, o: 0.9 }, { c: SAGE, s: 56, x: 42, y: 30, o: 0.9 }, { c: PASTEL_SAND, s: 38, x: 6, y: 54, o: 1 }] },
];

export const CircleArt = ({ variant = 0, className = "" }: { variant?: number; className?: string }) => {
  const v = VARIANTS[Math.abs(variant) % VARIANTS.length];
  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ background: v.bg, aspectRatio: "4 / 3" }} aria-hidden="true">
      {v.discs.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{ width: `${d.s}%`, paddingTop: `${d.s}%`, left: `${d.x}%`, top: `${d.y}%`, background: d.c, opacity: d.o }}
        />
      ))}
    </div>
  );
};

export default CircleArt;
