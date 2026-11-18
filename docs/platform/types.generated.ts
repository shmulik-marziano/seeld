/**
 * TypeScript types for the SEELD foundation database (seeld-site, qxhpolktdfgcbxtfxgov).
 * NOT wired into the site on purpose (cutover task).
 *
 * Honest status: the Supabase MCP generator emits only the `public` schema (and today it is empty by design:
 * everything lives in unexposed schemas behind `api`). The real generation command, once `api` is added to
 * Settings > API > Exposed schemas (or locally with the CLI), is:
 *
 *   npx supabase gen types typescript --project-id qxhpolktdfgcbxtfxgov --schema api > src/integrations/supabase/types.generated.ts
 *   (CI: `supabase gen types typescript --local --schema api` and fail the build on diff)
 *
 * Below: the generator output for `public` (empty) plus the hand-written contract of the one RPC the site calls
 * today, so frontend work can start against a stable shape.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ---- api.submit_lead contract (migration 20261118162719_foundation_api_layer) ----
export type LeadKind = "insurance" | "pension" | "contact" | "portfolio_review" | "report";

export interface SubmitLeadArgs {
  p_kind: LeadKind;
  p_full_name: string; // 2..120 chars
  p_phone?: string | null; // Israeli; +972 / dashes accepted, stored as 0XXXXXXXXX
  p_email?: string | null; // at least one of phone / email is required
  p_message?: string | null; // <= 4000
  p_payload?: Record<string, Json>; // object, <= 16000 bytes
  p_consent: true; // must be true
  p_consent_version?: string; // default 'v1'
  p_source?: string | null; // page path
  p_utm?: Record<string, string>;
  p_hp?: string | null; // honeypot: leave empty; a filled value is silently dropped
}

export type SubmitLeadResult = { ok: true; id: string | null; duplicate?: true };

/** PostgREST maps SQLSTATE PT400 / PT429 to the HTTP status. `message` is the stable code. */
export type SubmitLeadError =
  | { status: 429; message: "rate_limited" }
  | { status: 400; message: `invalid_input:${"kind" | "full_name" | "consent" | "phone" | "email" | "contact" | "message" | "payload" | "utm" | "source"}` };

/** Site client config after cutover: createClient<Database>(url, publishableKey, { db: { schema: "api" } }) */
