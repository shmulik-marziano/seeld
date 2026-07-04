import { COMPANIES, type Company } from "@/data/companies";
import { motion } from "framer-motion";
import { SERIF, BRONZE } from "@/lib/brand";

/*
  CompanyLogos — partner insurance/investment companies as quiet
  typographic wordmarks (architectural language, no colored pills).
  variant="grid"    → static ruled block   (service pages)
  variant="marquee" → slow scrolling strip (homepage)
*/

interface Props {
  variant?: "grid" | "marquee";
  companies?: Company[];
  title?: string;
  subtitle?: string;
}

/* Quiet serif wordmark */
function CompanyName({ company, size = "md" }: { company: Company; size?: "sm" | "md" }) {
  return (
    <span
      className={`${size === "sm" ? "text-base" : "text-base sm:text-lg"} text-[#171717]/45 hover:text-[#171717] transition-colors duration-300 whitespace-nowrap shrink-0`}
      style={{ fontFamily: SERIF, fontWeight: 600 }}
    >
      {company.name}
    </span>
  );
}

/* Grid variant — used on insurance/savings pages */
function LogoGrid({ companies }: { companies: Company[] }) {
  return (
    <div className="border-t border-b border-[#171717]/10 py-8 sm:py-10">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-4">
        {companies.map((c, i) => (
          <span key={c.slug} className="flex items-baseline gap-x-4">
            <CompanyName company={c} />
            {i < companies.length - 1 && (
              <span className="text-[13px] select-none" style={{ color: BRONZE }} aria-hidden="true">
                ·
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Marquee variant — used on homepage */
function LogoMarquee({ companies }: { companies: Company[] }) {
  const doubled = [...companies, ...companies];
  return (
    <div className="relative overflow-hidden border-t border-b border-[#171717]/10 py-7 sm:py-8">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-transparent to-white z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-transparent to-white z-10 pointer-events-none" />
      <motion.div
        className="flex items-baseline gap-x-10 sm:gap-x-14 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((c, i) => (
          <CompanyName key={`${c.slug}-${i}`} company={c} size="sm" />
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
          <p className="mt-2 text-base text-[#171717]/50 leading-relaxed max-w-xl">{subtitle}</p>
        </div>
        {variant === "marquee" ? (
          <LogoMarquee companies={companies} />
        ) : (
          <LogoGrid companies={companies} />
        )}
      </div>
    </section>
  );
}
