// Client forms (/forms): switch and constants (docs/product/CLIENT-FORMS.md).
// Imported by App.tsx: keep this file free of any other import than the backend switch.
import { IS_V2 } from "@/integrations/supabase/config";

/** Base URL of the forms-intake Edge Function when it is not `<SUPABASE_URL>/functions/v1/forms-intake`. Empty = not set. */
export const FORMS_INTAKE_URL: string = (import.meta.env.VITE_FORMS_INTAKE_URL ?? "").trim().replace(/\/+$/, "");

/**
 * Browser switch: FORMS_FLOW_ENABLED = VITE_FORMS_FLOW === "on" && (IS_V2 || VITE_FORMS_INTAKE_URL is set). Unset = off:
 * the hub still renders (static content, the POA card works), the five questionnaire cards show "בקרוב" and nothing is sent.
 * The server has its own switch (ops.config forms_enabled); both must be on for a session to start.
 */
export const FORMS_FLOW_ENABLED: boolean = import.meta.env.VITE_FORMS_FLOW === "on" && (IS_V2 || FORMS_INTAKE_URL !== "");

export const FORMS_ROUTE = "/forms";

export const FORMS_LIMITS = {
  /** a document the client uploads (bytes) */
  documentMaxBytes: 6 * 1024 * 1024,
  /** per call, in ms */
  timeoutMs: 30_000,
  /** a document upload, in ms */
  uploadTimeoutMs: 90_000,
} as const;
