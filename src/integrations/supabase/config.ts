// Connection constants only — NO supabase-js import, so public pages can read the URL/anon key
// (e.g. to call edge functions or PostgREST with fetch) without pulling the 45kB SDK.
// Publishable (anon) credentials — safe to ship in the client bundle; access
// control is enforced by Supabase RLS. Env vars override for other environments.
// Exported: several components build edge-function URLs / headers from these.
const LEGACY_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";
const LEGACY_SUPABASE_URL = "https://lvifatyksqizwcutfbqp.supabase.co";
const LEGACY_SUPABASE_PROJECT_ID = "lvifatyksqizwcutfbqp";

// Backend switch, read at BUILD time (docs/platform/FRONTEND-BACKEND-V2.md):
//   VITE_SEELD_BACKEND unset or "legacy" -> the Tokyo project, behaviour unchanged.
//   VITE_SEELD_BACKEND = "v2"            -> seeld-site (Frankfurt): reads through the `api` schema only,
//                                           leads through the lead-intake Edge Function, no Tokyo fallbacks.
// Vite replaces a SET import.meta.env.VITE_* with a literal, so with VITE_SEELD_BACKEND=v2 the legacy branch
// is dropped from the bundle. When VITE_SEELD_BACKEND is UNSET (today's legacy build) the comparison is not
// constant-folded and the v2 code stays in the bundle as dead code (measured: about +1.26 KB gzip on the entry).
// Removing it needs a define default for VITE_SEELD_BACKEND in vite.config.ts (outside T3's files).
export type SeeldBackend = "legacy" | "v2";
export const IS_V2: boolean = import.meta.env.VITE_SEELD_BACKEND === "v2";
export const SEELD_BACKEND: SeeldBackend = IS_V2 ? "v2" : "legacy";

// v2 has no fallbacks: a build without VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY must never talk
// to Tokyo by accident. Empty strings make every request fail visibly instead.
export const SUPABASE_URL: string = IS_V2
  ? (import.meta.env.VITE_SUPABASE_URL ?? "")
  : (import.meta.env.VITE_SUPABASE_URL ?? LEGACY_SUPABASE_URL);
export const SUPABASE_PUBLISHABLE_KEY: string = IS_V2
  ? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")
  : (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? LEGACY_SUPABASE_PUBLISHABLE_KEY);
export const SUPABASE_PROJECT_ID: string = IS_V2
  ? (import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "")
  : (import.meta.env.VITE_SUPABASE_PROJECT_ID ?? LEGACY_SUPABASE_PROJECT_ID);

/** v2: seeld-site PostgREST returns at most this many rows per request (max_rows). Read with Range paging. */
export const API_PAGE_SIZE = 200;

/** v2: Cloudflare Turnstile site key (public). Unset = no widget; lead-intake decides (test secret off production). */
export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

/** v2: "false" turns the public lead forms into a preview that never posts (Preview deployments after staging). */
export const FORMS_ENABLED: boolean = import.meta.env.VITE_FORMS_ENABLED !== "false";
