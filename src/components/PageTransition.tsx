import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ROUTE_ATTR } from "@/lib/prerenderSnapshot";

/**
 * Snap page transition (STYLESEED.md): a single quick fade-and-settle.
 * No overlays, no decoration — navigation should feel instant.
 */
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    // initial={false}: the first page is already on screen (prerendered snapshot), so it must not fade in again
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        {...{ [ROUTE_ATTR]: "" }}
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
