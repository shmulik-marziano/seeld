import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Engineering-grid backdrop (STYLESEED.md: decoration never carries color).
 * A faint two-level blueprint grid over the whole site — strongest at the top
 * of the page, fading as you scroll. multiply keeps it invisible on ink bands.
 */
const INK = "#171717";

const GridBackdrop = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 900], [0.05, 0.016]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[30] pointer-events-none"
      style={{
        opacity,
        mixBlendMode: "multiply",
        willChange: "opacity",
        backgroundImage: [
          // fine cells
          `linear-gradient(${INK} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
          // major lines every 5 cells (painted twice = slightly stronger)
          `linear-gradient(${INK} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
        ].join(", "),
        backgroundSize: "56px 56px, 56px 56px, 280px 280px, 280px 280px",
      }}
    />
  );
};

export default GridBackdrop;
