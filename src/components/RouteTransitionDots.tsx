import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import LogoDots from "@/components/brand/LogoDots";
import LogoMark from "@/components/brand/LogoMark";
import { LIVE_MARK } from "@/lib/flags/liveMark";
import { FADE_MS, LOGO_DOTS_TRANSITION, MIN_SHOW_MS, dotsClock } from "@/lib/flags/logoDots";

// Playwright (prerender, e2e) sets navigator.webdriver: the overlay must never exist in a snapshot.
const automated = () => typeof navigator !== "undefined" && navigator.webdriver === true;

/**
 * RouteTransitionDots: a full-viewport cream canvas with the live mark (LogoMark, thinking), or the five logo dots
 * when VITE_LIVE_MARK=off (src/lib/flags/liveMark.ts), shown on client-side navigations only.
 * Switch: src/lib/flags/logoDots.ts (VITE_LOGO_DOTS=off disables it).
 * - Never on the first location (first load is the prerendered page / snapshot), never on REPLACE navigations
 *   (<Navigate replace> redirects), never under automation, and marked data-prerender-skip as a last guard.
 * - Visible at least MIN_SHOW_MS, then fades FADE_MS and is removed from the DOM. If the lazy route is still
 *   loading, RouteFallback shows the same mark (or dots) underneath, so the overlay only needs the minimum time.
 * - Must render inside BrowserRouter but outside Suspense / PageTransition (never inside [data-seeld-route]).
 * - No focus moves, nothing focusable, no visible text.
 */
export default function RouteTransitionDots() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prev = useRef(pathname);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");

  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (pathname === prev.current) return; // first render, or a hash/search-only change
    prev.current = pathname;
    // A redirect keeps any running cycle's timers (a fresh one is never started by it).
    if (!LOGO_DOTS_TRANSITION || navType === "REPLACE" || automated()) return;
    timers.current.forEach((t) => window.clearTimeout(t)); // rapid navigations: restart the cycle
    // Clock for the fill cycle: this overlay starts at phase 0; a RouteFallback mounted later aligns to it.
    dotsClock.t0 = typeof performance !== "undefined" ? performance.now() : 0;
    setPhase("shown");
    timers.current = [
      window.setTimeout(() => {
        setPhase("leaving");
        timers.current = [window.setTimeout(() => setPhase("hidden"), FADE_MS)];
      }, MIN_SHOW_MS),
    ];
  }, [pathname, navType]);

  if (!LOGO_DOTS_TRANSITION || phase === "hidden") return null;
  return (
    <div
      className="seeld-dots-overlay"
      data-seeld-dots-overlay=""
      data-prerender-skip=""
      {...(phase === "leaving" ? { "data-leaving": "" } : {})}
      role="status"
      aria-live="polite"
      aria-label="העמוד נטען"
    >
      {LIVE_MARK ? (
        <div className="seeld-dots-mark">
          <LogoMark state="thinking" instant size="clamp(120px, 26vw, 176px)" />
        </div>
      ) : (
        <LogoDots />
      )}
    </div>
  );
}
