import { COMPANIES, type Company } from "@/data/companies";
import { motion } from "framer-motion";
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

/* Marquee variant — used on homepage. Purely decorative: pointer-events-none
   on the moving row means the mouse can't drag, select, or grab the strip. */
function LogoMarquee({ companies }: { companies: Company[] }) {
  const doubled = [...companies, ...companies];
  return (
    <div
      className="relative overflow-hidden border-t border-b border-[#171717]/10 py-7 sm:py-8 select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-transparent to-white z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-transparent to-white z-10 pointer-events-none" />
      <motion.div
        className="flex items-center gap-x-12 sm:gap-x-16 whitespace-nowrap pointer-events-none"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
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
    <section className="bg-white">
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
