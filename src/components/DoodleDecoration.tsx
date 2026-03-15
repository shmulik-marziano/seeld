import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import doodleSavings from "@/assets/doodle-savings.png";
import doodleShield from "@/assets/doodle-shield.png";
import doodleCalculator from "@/assets/doodle-calculator.png";
import doodleHandshake from "@/assets/doodle-handshake.png";
import doodleFamily from "@/assets/doodle-family.png";
import doodleGrowth from "@/assets/doodle-growth.png";
import doodlePension from "@/assets/doodle-pension.png";
import doodleUmbrella from "@/assets/doodle-umbrella.png";
import doodleCharts from "@/assets/doodle-charts.png";
import doodleTarget from "@/assets/doodle-target.png";
import doodleLightbulb from "@/assets/doodle-lightbulb.png";
import doodleKey from "@/assets/doodle-key.png";

export const doodleImages = {
  savings: doodleSavings,
  shield: doodleShield,
  calculator: doodleCalculator,
  handshake: doodleHandshake,
  family: doodleFamily,
  growth: doodleGrowth,
  pension: doodlePension,
  umbrella: doodleUmbrella,
  charts: doodleCharts,
  target: doodleTarget,
  lightbulb: doodleLightbulb,
  key: doodleKey,
} as const;

export type DoodleType = keyof typeof doodleImages;

interface DoodleDecorationProps {
  type: DoodleType;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  parallax?: boolean;
  parallaxSpeed?: number;
  float?: boolean;
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const DoodleDecoration = ({ type, className, size = "md", animate = true, parallax = false, parallaxSpeed = 0.15, float = true }: DoodleDecorationProps) => {
  const ref = useRef<HTMLImageElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const delta = (centerY - viewportCenter) * parallaxSpeed;
      setOffset(delta);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax, parallaxSpeed]);

  return (
    <img
      ref={ref}
      src={doodleImages[type]}
      alt=""
      aria-hidden="true"
      className={cn(
        sizeMap[size],
        "rounded-2xl object-cover select-none pointer-events-none opacity-60",
        animate && "hover:opacity-90 transition-all duration-500 hover:scale-110",
        float && !parallax && "animate-doodle-float",
        className
      )}
      style={parallax ? { transform: `translateY(${offset}px)`, willChange: "transform" } : undefined}
    />
  );
};

export default DoodleDecoration;
