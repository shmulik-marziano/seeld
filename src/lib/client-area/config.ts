// Client area (האזור האישי, docs/product/CLIENT-AREA-SPEC.md) switch and constants.
// Imported by App.tsx: keep this file free of any other import than the backend switch.
import { IS_V2 } from "@/integrations/supabase/config";

/** Base URL of the client-area Edge Function when it is not the build's own backend (`<SUPABASE_URL>/functions/v1/client-area`). */
export const CLIENT_AREA_URL: string = (import.meta.env.VITE_CLIENT_AREA_URL ?? "").trim().replace(/\/+$/, "");

/** Browser switch: VITE_CLIENT_AREA === "on" && (IS_V2 || VITE_CLIENT_AREA_URL is set). Unset = off (the route redirects home). */
export const CLIENT_AREA_ENABLED: boolean = import.meta.env.VITE_CLIENT_AREA === "on" && (IS_V2 || CLIENT_AREA_URL !== "");

export const MY_ROUTE = "/my";

/** Product categories, in display order (the server groups products into these keys). */
export const CATEGORY_KEYS = ["pension", "gemel", "hishtalmut", "insurance_life", "insurance_health", "insurance_general", "savings", "other"] as const;
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Document kinds the area shows (the three POA documents of the wizard + documents mirrored from the agency system). */
export const DOC_KINDS = ["maslaka", "harbit", "policies", "surense"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const MY_LIMITS = {
  /** one-time code: digits */
  codeLength: 6,
  /** the code is valid this long (server: minvalid) */
  codeMinutes: 10,
  /** a new code can be asked for after this long (the server caps sends per validity window) */
  resendAfterSec: 60,
} as const;
