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
