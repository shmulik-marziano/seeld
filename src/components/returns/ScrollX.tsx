import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Horizontal scroller for wide tables. It never widens its parent (min-w-0 + own overflow) and,
 * only when the content really overflows, shows a short hint and a soft fade on the hidden edge.
 */
const ScrollX = ({ children, hint = "אפשר לגלול הצידה לעוד עמודות", className = "" }: { children: ReactNode; hint?: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setOver(el.scrollWidth > el.clientWidth + 2);
      // RTL: scrollLeft runs from 0 (start, right edge) down to a negative number (left end)
      setAtEnd(Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 2);
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className={`sd-scrollx min-w-0 ${className}`}>
      <div className="sd-scrollx-box">
        <div ref={ref} className="sd-scrollx-scroll" tabIndex={over ? 0 : undefined} role={over ? "region" : undefined} aria-label={over ? "טבלה נגללת" : undefined}>
          {children}
        </div>
        {over && !atEnd && <span className="sd-scrollx-fade" aria-hidden="true" />}
      </div>
      {over && <p className="sd-scrollx-hint" aria-hidden="true">{hint}</p>}
    </div>
  );
};

export default ScrollX;
