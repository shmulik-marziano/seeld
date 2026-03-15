import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { brandDots } from "@/components/SeeIDLogo";

/**
 * Page transition wrapper that shows animated brand dots 
 * when navigating between pages, inspired by Anthropic's transitions.
 */
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Brand dots entrance overlay */}
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center gap-3"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {brandDots.map((dot, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                backgroundColor: dot.fill,
                width: i === 1 ? 14 : i === 0 || i === 4 ? 8 : 11,
                height: i === 1 ? 14 : i === 0 || i === 4 ? 8 : 11,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1, 0],
                opacity: [0, 0.9, 0.9, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </motion.div>

        {/* Page content with slide-up entrance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
