import { useRef, useState } from "react";
import { COMPANIES, type Company } from "@/data/companies";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { LINE, MUTED } from "@/lib/brand";

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
    <div className="border-t border-b py-8 sm:py-10" style={{ borderColor: LINE }}>
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
   auto-scroll resumes when they let go. Infinite wrap over a doubled list.

   The strip is laid out LTR on purpose: the page is RTL, so a flex row would
   start at the right edge and overflow to the LEFT, and the leftward drift
   (negative x) would reveal empty space instead of the next logos. Logos carry
   no reading direction, so LTR layout is safe. With reduced motion the strip
   stands still and stays scrubbable. */
const MARQUEE_SPEED = 42; // px per second

function LogoMarquee({ companies }: { companies: Company[] }) {
  const doubled = [...companies, ...companies];
  const x = useMotionValue(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const reduced = useReducedMotion();

  useAnimationFrame((_, delta) => {
    const row = rowRef.current;
    if (!row) return;
    const half = row.scrollWidth / 2;
    if (half <= 0) return;
    let next = x.get();
    if (!dragging && !reduced) next -= (MARQUEE_SPEED * delta) / 1000;
    // wrap into (-half, 0] so the loop is seamless in both drag directions
    if (next <= -half) next += half;
    if (next > 0) next -= half;
    x.set(next);
  });

  return (
    <div
      dir="ltr"
      className="dna-logo-fade relative overflow-hidden border-t border-b py-7 sm:py-8 select-none"
      style={{ borderColor: LINE }}
    >
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
    /* Transparent: the strip sits on whatever band the page gives it
       (the sand band on the homepage, the ivory canvas on service pages). */
    <section className="bg-transparent">
      <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {title && (
          <div className="mb-10">
            <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
              {title}
            </h2>
            {subtitle && <p className="mt-2 text-[17px] leading-relaxed max-w-xl" style={{ color: MUTED }}>{subtitle}</p>}
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
