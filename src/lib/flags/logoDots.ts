// Logo-dots page transition switch: the five logo dots, alive, between pages.
// Build time, like IS_V2 / FORMS_ENABLED (src/integrations/supabase/config.ts):
//   VITE_LOGO_DOTS=off  -> no overlay and the previous RouteFallback (PNG mark + top bar), i.e. today's behaviour exactly.
//   unset / any other value -> on (default).
// Imported by App.tsx (main entry): keep this file free of imports.
export const LOGO_DOTS_TRANSITION: boolean = import.meta.env.VITE_LOGO_DOTS !== "off";

/** The overlay stays fully visible at least this long after a client-side navigation (ms). */
export const MIN_SHOW_MS = 500;
/** Then it fades out over this long and is removed from the DOM (ms). */
export const FADE_MS = 180;

/** One fill-and-drain cycle of the dots (ms); must equal the seeld-dot-fill duration in logo-dots.css. */
export const DOTS_CYCLE_MS = 1250;
/** performance.now() of the last overlay start; LogoDots instances mounted later align their cycle to it. */
export const dotsClock = { t0: 0 };

/** One full cycle of the live mark's orbit (5 steps of 720 ms; must match --lg-step in logo-mark.css). */
export const MARK_CYCLE_MS = 3600;
/** Milliseconds since the overlay started (dotsClock.t0), within one mark cycle; 0 when no overlay ran. */
export const markPhaseMs = (): number => {
  try {
    if (!dotsClock.t0 || typeof performance === "undefined") return 0;
    const elapsed = performance.now() - dotsClock.t0;
    return elapsed > 0 ? elapsed % MARK_CYCLE_MS : 0;
  } catch {
    return 0;
  }
};
