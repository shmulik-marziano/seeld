import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { DOTS, DROP_D, DROP_FILL, LEAF_D, LEAF_FILL } from "./logoMarkPaths";
import "./logo-mark.css";

export type LogoMarkState = "idle" | "listening" | "thinking" | "speaking";

export interface LogoMarkProps {
  state?: LogoMarkState;
  size?: string;
  breathe?: boolean;
  onDark?: boolean;
  instant?: boolean;
  className?: string;
  label?: string;
}

const SETTLE_MS = 900;
const EASE = "cubic-bezier(.65,0,.25,1)";
const ANIM = ".seeld-lm-anim";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Rotation angle in degrees from a computed "matrix(a, b, ...)" string. */
function angleOf(matrix: string): number {
  const m = /matrix\(([^)]+)\)/.exec(matrix);
  if (!m) return 0;
  const [a, b] = m[1].split(",").map((v) => parseFloat(v));
  return (Math.atan2(b, a) * 180) / Math.PI;
}

function clearSettle(el: SVGSVGElement) {
  el.querySelectorAll<SVGElement>(ANIM).forEach((n) => {
    n.style.animation = "";
    n.style.transform = "";
    n.style.transition = "";
  });
  el.classList.remove("is-settling");
}

/**
 * Port of LogoAnimator.setThinking. While thinking the element carries "is-thinking".
 * On exit every running animation is frozen at its current pose, then eased home
 * over 900ms (class "is-settling"), then cleared.
 */
export function useLogoMarkSettle(ref: RefObject<SVGSVGElement>, isThinking: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const was = useRef(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stopTimer = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    if (isThinking) {
      stopTimer();
      clearSettle(el);
      el.classList.add("is-thinking");
      was.current = true;
      return;
    }
    if (!was.current) return;
    was.current = false;
    stopTimer();
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.remove("is-thinking");
      clearSettle(el);
      return;
    }
    const nodes = Array.from(el.querySelectorAll<SVGElement>(ANIM));
    const frozen = nodes.map((n) => {
      const t = getComputedStyle(n).transform;
      if (!t || t === "none") return "none";
      return n.classList.contains("seeld-lm-spin") ? `rotate(${angleOf(t).toFixed(3)}deg)` : t;
    });
    nodes.forEach((n, i) => {
      n.style.animation = "none";
      n.style.transition = "none";
      n.style.transform = frozen[i];
    });
    el.classList.remove("is-thinking");
    el.classList.add("is-settling");
    void el.getBoundingClientRect(); // commit the frozen pose
    nodes.forEach((n) => {
      n.style.transition = `transform ${SETTLE_MS}ms ${EASE}`;
      n.style.transform = n.classList.contains("seeld-lm-spin")
        ? "rotate(0deg)"
        : n.classList.contains("seeld-lm-hop")
          ? "translate(0px, 0px)"
          : "none";
    });
    timer.current = setTimeout(() => {
      timer.current = null;
      clearSettle(el);
    }, SETTLE_MS + 50);
  }, [isThinking, ref]);

  // A className rewrite by React (breathe/onDark/instant change) must not drop the thinking class.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (isThinking && el && !el.classList.contains("is-thinking")) el.classList.add("is-thinking");
  });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    },
    [],
  );
}

export default function LogoMark({
  state = "idle",
  size = "48px",
  breathe = false,
  onDark = false,
  instant = false,
  className,
  label,
}: LogoMarkProps) {
  const ref = useRef<SVGSVGElement>(null);
  const thinking = state === "thinking";
  useLogoMarkSettle(ref, thinking);

  const cls = [
    "seeld-lm",
    breathe && state === "idle" ? "seeld-lm--breathe" : "",
    onDark ? "seeld-lm--on-dark" : "",
    instant ? "seeld-lm--instant" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      ref={ref}
      className={cls}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      style={{ "--lg-size": size } as CSSProperties}
      data-logo-state={state}
      aria-busy={thinking ? "true" : undefined}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      <g className="seeld-lm-mark">
        <path className="seeld-lm-drop" fillRule="evenodd" d={DROP_D} fill={DROP_FILL} />
        <path className="seeld-lm-leaf seeld-lm-anim" d={LEAF_D} fill={LEAF_FILL} />
      </g>
      {DOTS.map((d) => (
        <g
          key={d.i}
          className="seeld-lm-pos"
          style={
            {
              "--i": d.i,
              "--a": `${d.a}deg`,
              "--r": `${d.r}px`,
              "--ta": `${d.ta}deg`,
              "--hop": d.hop,
            } as CSSProperties
          }
        >
          <g className="seeld-lm-spin seeld-lm-anim">
            <g className="seeld-lm-arm">
              <g className="seeld-lm-hop seeld-lm-anim">
                <circle className="seeld-lm-dot seeld-lm-anim" r={d.rOut} fill={d.fill} />
              </g>
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}
