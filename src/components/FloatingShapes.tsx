import { useEffect, useState } from "react";

/*
  Floating ambient shapes that drift across the viewport.
  They sit behind all content (z-0, pointer-events-none) and use
  CSS animations only — zero JS animation loops, zero re-renders.
*/

interface Shape {
  id: number;
  type: "circle" | "ring" | "dot" | "diamond" | "blob";
  size: number;          // px
  color: string;
  left: number;          // % from left
  top: number;           // % from top (initial)
  duration: number;      // seconds
  delay: number;         // seconds
  drift: "float-a" | "float-b" | "float-c" | "float-d";
  opacity: number;
}

const COLORS = [
  "#5ec6c6", "#f4a261", "#e76f51", "#90be6d", "#6c63ff",
  "#5ec6c6", "#f4a261", "#90be6d",
];

const DRIFTS: Shape["drift"][] = ["float-a", "float-b", "float-c", "float-d"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function generateShapes(count: number): Shape[] {
  const types: Shape["type"][] = ["circle", "ring", "dot", "diamond", "blob"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: types[Math.floor(Math.random() * types.length)],
    size: randomBetween(6, 45),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    left: randomBetween(2, 96),
    top: randomBetween(5, 90),
    duration: randomBetween(18, 40),
    delay: randomBetween(0, 12),
    drift: DRIFTS[Math.floor(Math.random() * DRIFTS.length)],
    opacity: randomBetween(0.06, 0.18),
  }));
}

function ShapeElement({ s }: { s: Shape }) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: `${s.left}%`,
    top: `${s.top}%`,
    width: s.size,
    height: s.size,
    opacity: s.opacity,
    animationName: s.drift,
    animationDuration: `${s.duration}s`,
    animationDelay: `${s.delay}s`,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationFillMode: "both",
    willChange: "transform",
  };

  switch (s.type) {
    case "circle":
      return <div style={{ ...base, borderRadius: "50%", background: s.color }} />;
    case "ring":
      return <div style={{ ...base, borderRadius: "50%", border: `2px solid ${s.color}`, background: "transparent" }} />;
    case "dot":
      return <div style={{ ...base, borderRadius: "50%", background: s.color, width: Math.max(s.size * 0.4, 4), height: Math.max(s.size * 0.4, 4) }} />;
    case "diamond":
      return <div style={{ ...base, transform: "rotate(45deg)", borderRadius: "4px", background: s.color }} />;
    case "blob":
      return <div style={{ ...base, borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%", background: s.color }} />;
  }
}

export default function FloatingShapes() {
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    // Generate once on mount — fewer on mobile
    const isMobile = window.innerWidth < 768;
    setShapes(generateShapes(isMobile ? 10 : 18));
  }, []);

  if (shapes.length === 0) return null;

  return (
    <>
      {/* CSS keyframes — injected once */}
      <style>{`
        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -20px) scale(1.05); }
          50% { transform: translate(-15px, -40px) scale(0.95); }
          75% { transform: translate(20px, -10px) scale(1.02); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-25px, 25px) rotate(8deg); }
          66% { transform: translate(20px, -15px) rotate(-5deg); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-35px, -30px) scale(1.1); }
        }
        @keyframes float-d {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(15px, -25px); }
          40% { transform: translate(-20px, -10px); }
          60% { transform: translate(10px, 20px); }
          80% { transform: translate(-15px, -5px); }
        }
      `}</style>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {shapes.map((s) => (
          <ShapeElement key={s.id} s={s} />
        ))}
      </div>
    </>
  );
}
