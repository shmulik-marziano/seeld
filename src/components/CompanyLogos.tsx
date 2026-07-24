import { useRef, useState } from "react";
import { COMPANIES, type Company } from "@/data/companies";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { SERIF, BRONZE } from "@/lib/brand";

/*
  CompanyLogos — partner insurance/investment companies as official brand
  logos (public/logos), uniform height, quiet presentation.
  variant="grid"    → static ruled block   (service pages)
  variant="marquee" → slow scrolling strip (homepage)
  Pass title="" to render the strip alone with no section header.
*/

interface Props {
  variant?: "grid" | "marquee";
  companies?: Company[];
  title?: string;
  subtitle?: string;
}

/* Official logo at uniform height; name stays available to screen readers */
function CompanyLogo({ company, size = "md", eager = false }: { company: Company; size?: "sm" | "md"; eager?: boolean }) {
  return (
    <img
      src={company.logo}
      alt={company.name}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      className={`${size === "sm" ? "h-7 sm:h-8" : "h-8 sm:h-9"} w-auto max-w-[150px] object-contain shrink-0 select-none`}
    />
  );
}

/* Grid variant — used on insurance/savings pages */
function LogoGrid({ companies }: { companies: Company[] }) {
  return (
    <div className="border-t border-b border-[#171717]/10 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-7">
        {companies.map((c) => (
          <CompanyLogo key={c.slug} company={c} />
        ))}
      </div>
    </div>
  );
}

/* Marquee variant — used on homepage. Auto-scrolls slowly, and the visitor
   can grab it with the mouse (or a finger) to scrub through all the logos;
   auto-scroll resumes when they let go. Infinite wrap over a doubled list. */
const MARQUEE_SPEED = 42; // px per second

// .dna-logo-fade masks the strip edges instead of painting a white overlay, so
// the marquee sits correctly on the cream warm band and every logo stays
// readable as it passes through (narrower fade on phones).
function LogoMarquee({ companies }: { companies: Company[] }) {
  const doubled = [...companies, ...companies];
  const x = useMotionValue(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useAnimationFrame((_, delta) => {
    const row = rowRef.current;
    if (!row) return;
    const half = row.scrollWidth / 2;
    if (half <= 0) return;
    let next = x.get();
    if (!dragging) next -= (MARQUEE_SPEED * delta) / 1000;
    // wrap into (-half, 0] so the loop is seamless in both drag directions
    if (next <= -half) next += half;
    if (next > 0) next -= half;
    x.set(next);
  });

  return (
    <div className="dna-logo-fade relative overflow-hidden border-t border-b border-[#171717]/10 py-7 sm:py-8 select-none">
      <motion.div
        ref={rowRef}
        className="flex items-center gap-x-12 sm:gap-x-16 whitespace-nowrap cursor-grab active:cursor-grabbing touch-pan-y"
        style={{ x }}
        drag="x"
        dragMomentum
        dragElastic={0}
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        {doubled.map((c, i) => (
          <CompanyLogo key={`${c.slug}-${i}`} company={c} size="sm" eager />
        ))}
      </motion.div>
    </div>
  );
}

export default function CompanyLogos({
  variant = "grid",
  companies = COMPANIES,
  title = "החברות שאנחנו עובדים מולן",
  subtitle = "כל השחקניות המובילות בישראל. משווים, ובוחרים את מה שנכון לכם.",
}: Props) {
  return (
    /* The marquee is dropped into page sections that carry their own band
       colour (homepage warm band) — stay transparent there. The grid keeps
       its white plate on service pages. */
    <section className={variant === "marquee" ? "bg-transparent" : "bg-white"}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {title && (
          <div className="border-t border-[#171717]/20 pt-5 mb-10">
            <span className="text-[11px] tracking-[0.22em] font-medium block mb-3" style={{ color: BRONZE }}>
              THE MARKET
            </span>
            <h2
              className="text-[#171717] leading-tight"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
            >
              {title}
            </h2>
            {subtitle && <p className="mt-2 text-base text-[#5c5c5c] leading-relaxed max-w-xl">{subtitle}</p>}
          </div>
        )}
        {variant === "marquee" ? (
          <LogoMarquee companies={companies} />
        ) : (
          <LogoGrid companies={companies} />
        )}
      </div>
    </section>
  );
}
