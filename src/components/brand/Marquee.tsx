// MarketMarquee — the reference's moving ticker band on a paper tile.
// Continuous scroll via .seeld-marquee (26s linear, disabled under
// prefers-reduced-motion in index.css). Values render in their own LTR
// span so "+11.4%" survives bidi inside Hebrew labels.
import { MONO } from "@/lib/brand";
import { LiveDot } from "@/components/brand/Live";

export type MarqueeItem = { label: string; value?: string; dot?: boolean };

export const MarketMarquee = ({
  items, ariaLabel, className = "",
}: { items: MarqueeItem[]; ariaLabel: string; className?: string }) => (
  <div
    className={`bento-panel flex items-center overflow-hidden ${className}`}
    dir="ltr"
    aria-label={ariaLabel}
    style={{
      maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
      WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
    }}
  >
    <div className="seeld-marquee relative z-10 items-center py-4">
      {[0, 1].map((copy) => (
        <div
          key={copy}
          className="flex items-center shrink-0"
          aria-hidden={copy === 1 ? "true" : undefined}
        >
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 px-4 text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.12em] text-[#171717] whitespace-nowrap tabular-nums"
              style={{ fontFamily: MONO }}
            >
              {item.dot && <LiveDot size={6} />}
              <span dir="auto">{item.label}</span>
              {item.value && <span dir="ltr">{item.value}</span>}
              <span className="text-[#171717]/30 select-none">—</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);
