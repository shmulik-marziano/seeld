import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Snap page transition (STYLESEED.md): a single quick fade-and-settle.
 * No overlays, no decoration — navigation should feel instant.
 */
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
