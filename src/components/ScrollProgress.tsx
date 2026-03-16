import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [isLongPage, setIsLongPage] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsLongPage(document.documentElement.scrollHeight > window.innerHeight * 1.2);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isLongPage) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-50 origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #5ec6c6 0%, #0a3d3d 100%)",
      }}
    />
  );
};

export default ScrollProgress;
