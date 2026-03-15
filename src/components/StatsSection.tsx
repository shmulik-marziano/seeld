import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { brandDots } from "@/components/SeeIDLogo";

interface MarqueeItem {
  label: string;
  href: string;
  dotColor: string;
}

const row1: MarqueeItem[] = [
  { label: "קרנות פנסיה", href: "/savings/pension-funds", dotColor: brandDots[3].fill },
  { label: "ביטוח בריאות", href: "/insurance/health", dotColor: brandDots[1].fill },
  { label: "קרנות השתלמות", href: "/savings/training-funds", dotColor: brandDots[3].fill },
  { label: "ביטוח חיים", href: "/insurance/life", dotColor: brandDots[1].fill },
  { label: "שאלון הצטרפות", href: "/onboarding", dotColor: brandDots[2].fill },
  { label: "קופות גמל", href: "/savings/gemel-funds", dotColor: brandDots[3].fill },
  { label: "ביטוח משכנתא", href: "/insurance/mortgage", dotColor: brandDots[1].fill },
  { label: "מחשבונים", href: "/calculators", dotColor: brandDots[2].fill },
];

const row2: MarqueeItem[] = [
  { label: "גמל להשקעה", href: "/savings/gemel-investment", dotColor: brandDots[3].fill },
  { label: "ביטוח רכב", href: "/insurance/vehicle", dotColor: brandDots[1].fill },
  { label: "תכנון פיננסי", href: "/savings/financial-planning", dotColor: brandDots[3].fill },
  { label: "מחלות קשות", href: "/insurance/critical-illness", dotColor: brandDots[1].fill },
  { label: "חיסכון לילד", href: "/savings/child-savings", dotColor: brandDots[3].fill },
  { label: "ביטוח דירה", href: "/insurance/home", dotColor: brandDots[1].fill },
  { label: "מיצוי זכויות", href: "/rights-extraction", dotColor: brandDots[2].fill },
  { label: "אובדן כושר", href: "/insurance/disability", dotColor: brandDots[1].fill },
];

const row3: MarqueeItem[] = [
  { label: "ביטוח נסיעות", href: "/insurance/travel", dotColor: brandDots[1].fill },
  { label: "ניתוח פנסיוני", href: "/contact", dotColor: brandDots[2].fill },
  { label: "לוחות תשואה", href: "/return-tables", dotColor: brandDots[2].fill },
  { label: 'טופס הו"ק', href: "/direct-debit", dotColor: brandDots[2].fill },
  { label: "ביטוח עסקי", href: "/insurance/business", dotColor: brandDots[1].fill },
  { label: "ביטוח שיניים", href: "/insurance/dental", dotColor: brandDots[1].fill },
  { label: "פוליסות חיסכון", href: "/savings/employer-funds", dotColor: brandDots[3].fill },
  { label: "לפני פרישה", href: "/savings/pre-retirement", dotColor: brandDots[3].fill },
];

function MarqueeRow({
  items,
  direction = "rtl",
  speed = 35,
}: {
  items: MarqueeItem[];
  direction?: "rtl" | "ltr";
  speed?: number;
}) {
  // Duplicate items for seamless loop
  const doubled = [...items, ...items];
  const isRtl = direction === "rtl";

  return (
    <div className="relative overflow-hidden py-1.5 sm:py-2">
      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-2.5 sm:gap-4 w-max"
        animate={{
          x: isRtl ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {doubled.map((item, i) => (
          <Link
            key={`${item.label}-${i}`}
            to={item.href}
            className="group flex-shrink-0 inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2 sm:py-3 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-border hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-150"
              style={{ backgroundColor: item.dotColor }}
            />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

const StatsSection = () => {
  return (
    <section className="py-10 sm:py-16 md:py-24 -mx-4 sm:-mx-6 lg:-mx-8">
      <motion.div
        className="text-center mb-6 sm:mb-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {brandDots.map((dot, i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
              style={{ backgroundColor: dot.fill }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 500 }}
            />
          ))}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3">
          כל השירותים במקום אחד
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-xs sm:text-sm md:text-base">
          גישה מהירה לכל המוצרים והשירותים שלנו — לחצו לפרטים
        </p>
      </motion.div>

      <div className="space-y-2 sm:space-y-3">
        <MarqueeRow items={row1} direction="rtl" speed={40} />
        <MarqueeRow items={row2} direction="ltr" speed={35} />
        <MarqueeRow items={row3} direction="rtl" speed={45} />
      </div>
    </section>
  );
};

export default StatsSection;
