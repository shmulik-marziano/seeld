import { Link } from "react-router-dom";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { GREEN, LINE, PASTEL_SAGE, PASTEL_SAND, RUST, SAGE, SAND } from "@/lib/brand";

/**
 * The home opening art from the design mock.
 *
 * Reading the mock: the circles are an environment, not an object. One large
 * sage disc holds the centre; a deep-green disc sits behind its lower edge; a
 * pale sand disc rests in the opposite corner; two or three small dots in the
 * brand triad. The white disc with the leaf is a small, quiet element on the
 * upper edge of the sage disc (about a third of the width, not a hero). The
 * three cards float in the free corners with room around them.
 * Pure CSS + one inline SVG. The discs are decoration; the cards are links.
 */

const CARDS: { label: string; icon: BrandIconName; href: string; pos: string }[] = [
  { label: "ביטוח", icon: "shield", href: "/insurances", pos: "top-[8%] left-[6%]" },
  { label: "חיסכון", icon: "leaf", href: "/savings", pos: "top-[34%] right-[2%]" },
  { label: "פרישה", icon: "retirement", href: "/savings/pre-retirement", pos: "bottom-[6%] left-[30%]" },
];

const Leaf = () => (
  <svg viewBox="0 0 100 100" className="h-[62%] w-[62%]" aria-hidden="true">
    <path d="M50 6 C 86 22, 92 64, 50 96 C 8 64, 14 22, 50 6 Z" fill={GREEN} />
    <path d="M50 18 C 50 42, 48 66, 44 90" stroke="#FAF7EF" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85" />
    <path d="M50 40 C 60 42, 68 48, 73 57 M47 58 C 38 58, 31 63, 26 71" stroke="#FAF7EF" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

export const HeroComposition = ({ className = "", cards = true }: { className?: string; cards?: boolean }) => (
  <div className={`relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[420px] lg:max-w-[540px] ${className}`}>
    <div className="absolute inset-0" aria-hidden="true">
      {/* environment: the pale field behind everything */}
      <div className="absolute rounded-full" style={{ width: "72%", height: "72%", top: "2%", right: "6%", background: PASTEL_SAGE, opacity: 0.9 }} />
      {/* the sage disc holds the centre */}
      <div className="absolute rounded-full" style={{ width: "50%", height: "50%", top: "22%", right: "24%", background: SAGE, opacity: 0.9 }} />
      {/* deep green behind its lower edge */}
      <div className="absolute rounded-full" style={{ width: "38%", height: "38%", bottom: "10%", right: "44%", background: GREEN }} />
      {/* pale sand in the opposite corner */}
      <div className="absolute rounded-full" style={{ width: "22%", height: "22%", bottom: "14%", left: "4%", background: PASTEL_SAND }} />
      {/* the triad, small */}
      <div className="absolute rounded-full" style={{ width: "8%", height: "8%", top: "16%", right: "6%", background: RUST }} />
      <div className="absolute rounded-full" style={{ width: "5%", height: "5%", top: "56%", left: "18%", background: SAND }} />
      <div className="absolute rounded-full" style={{ width: "4%", height: "4%", bottom: "8%", right: "34%", background: SAGE }} />
      {/* the white disc with the leaf, on the upper edge of the sage disc */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-white"
        style={{ width: "30%", height: "30%", top: "14%", right: "40%", boxShadow: "0 16px 36px -22px rgba(0,61,48,0.45)" }}
      >
        <Leaf />
      </div>
    </div>

    {cards && CARDS.map((c) => (
      <Link
        key={c.href}
        to={c.href}
        className={`absolute ${c.pos} flex w-[24%] max-w-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-white text-[14px] sm:text-[15px] font-bold transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]`}
        style={{ color: GREEN, border: `1px solid ${LINE}`, boxShadow: "0 14px 30px -18px rgba(0,61,48,0.35)", aspectRatio: "1 / 1" }}
      >
        <BrandIcon name={c.icon} size={24} />
        {c.label}
      </Link>
    ))}
  </div>
);

export default HeroComposition;
