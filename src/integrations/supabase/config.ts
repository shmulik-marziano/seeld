// Connection constants only — NO supabase-js import, so public pages can read the URL/anon key
// (e.g. to call edge functions or PostgREST with fetch) without pulling the 45kB SDK.
// Publishable (anon) credentials — safe to ship in the client bundle; access
// control is enforced by Supabase RLS. Env vars override for other environments.
// Exported: several components build edge-function URLs / headers from these.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "lvifatyksqizwcutfbqp";
