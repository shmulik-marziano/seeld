import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { motion } from "framer-motion";
import DoodleDecoration, { type DoodleType } from "@/components/DoodleDecoration";

interface FeatureCardProps {
  title: string;
  description: string;
  bgColor: string;
  doodle: DoodleType;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

const FeatureCard = ({ title, description, bgColor, doodle, buttonText, buttonHref, className = "" }: FeatureCardProps) => {
  return (
    <motion.div
      className={`group rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden border border-transparent hover:border-border/20 ${bgColor} ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, boxShadow: "0 25px 60px -15px hsl(var(--primary) / 0.1)" }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-l from-[hsl(var(--accent)/0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[hsl(var(--accent)/0.08)] to-transparent rounded-br-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Glass-morphism shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/[0.04] via-transparent to-transparent" />
      </div>

      <div className="flex-1 space-y-2 sm:space-y-3 z-10 text-center sm:text-right">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-w-lg">
          {description}
        </p>
        {buttonText && buttonHref && (
          <Link to={buttonHref}>
            <motion.span
              className="inline-flex items-center gap-2 mt-2 sm:mt-3 px-5 sm:px-6 py-2.5 sm:py-2.5 min-h-[44px] border border-foreground/20 rounded-full text-xs sm:text-sm font-medium hover:bg-foreground hover:text-background transition-all duration-300 group/link"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowUpLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {buttonText}
            </motion.span>
          </Link>
        )}
      </div>
      <motion.div
        className="flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 relative order-first sm:order-last"
        whileHover={{ scale: 1.12, rotate: 5 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <DoodleDecoration type={doodle} size="xl" className="!w-full !h-full opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
      </motion.div>
    </motion.div>
  );
};

export default FeatureCard;
