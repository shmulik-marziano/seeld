import { COMPANIES, type Company } from "@/data/companies";
import { motion } from "framer-motion";

/*
  CompanyLogos — shows partner insurance/investment companies.
  variant="grid"    → static responsive grid   (service pages)
  variant="marquee" → auto-scrolling marquee    (homepage)
*/

interface Props {
  variant?: "grid" | "marquee";
  companies?: Company[];
  title?: string;
  subtitle?: string;
}

/* Company logo "pill" — initial + name, colored accent */
function CompanyPill({ company, size = "md" }: { company: Company; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-10" : "h-12";
  const text = size === "sm" ? "text-xs" : "text-sm";
  const initial = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const px = size === "sm" ? "px-3" : "px-4";

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${px} py-2 ${h} rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shrink-0`}
    >
      <div
        className={`${initial} rounded-lg flex items-center justify-center font-black text-white shrink-0`}
        style={{ backgroundColor: company.color }}
      >
        {company.initial}
      </div>
      <span className={`${text} font-semibold text-[#1a1a4b] whitespace-nowrap`}>
        {company.name}
      </span>
    </div>
  );
}

/* Grid variant — used on insurance/savings pages */
function LogoGrid({ companies }: { companies: Company[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {companies.map((c) => (
        <CompanyPill key={c.slug} company={c} />
      ))}
    </div>
  );
}

/* Marquee variant — used on homepage */
function LogoMarquee({ companies }: { companies: Company[] }) {
  const doubled = [...companies, ...companies];
  return (
    <div className="relative overflow-hidden py-4">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-transparent to-white z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-transparent to-white z-10 pointer-events-none" />
      <motion.div
        className="flex gap-4 sm:gap-6 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((c, i) => (
          <CompanyPill key={`${c.slug}-${i}`} company={c} size="sm" />
        ))}
      </motion.div>
    </div>
  );
}

export default function CompanyLogos({
  variant = "grid",
  companies = COMPANIES,
  title = "חברות שאנחנו משווקים",
  subtitle = "עובדים עם כל החברות המובילות בישראל — משווים ובוחרים את מה שמתאים לכם",
}: Props) {
  return (
    <section className="py-12 sm:py-16 bg-[#fafbfd]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a4b] mb-3">
          {title}
        </h2>
        <p className="text-gray-500 mb-10 text-base sm:text-lg max-w-xl mx-auto">
          {subtitle}
        </p>
        {variant === "marquee" ? (
          <LogoMarquee companies={companies} />
        ) : (
          <LogoGrid companies={companies} />
        )}
      </div>
    </section>
  );
}
