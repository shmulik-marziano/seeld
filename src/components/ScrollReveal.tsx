import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  staggerChildren?: boolean;
  staggerDelay?: number;
}

const directionOffset = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: 20 },
  right: { x: -20 },
  scale: { scale: 0.95 },
};

const ScrollReveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
  staggerChildren = false,
  staggerDelay = 0.1,
}: ScrollRevealProps) => {
  const offset = directionOffset[direction];

  if (staggerChildren) {
    return (
      <motion.div
        className={cn(className)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: delay / 1000,
            },
          },
        }}
      >
        {React.Children.map(children, (child) => (
          <motion.div
            variants={{
              hidden: { opacity: 0, ...offset },
              visible: {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
