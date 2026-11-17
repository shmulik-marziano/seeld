// Deferred access to the Supabase client.
//
// Public pages (home, /insurance/*, /savings/*, ...) must not download supabase-js
// (~45kB gzip) just to render. Anything that only needs the client at an interaction
// point (form submit, analytics, chat history) awaits one of these instead of
// importing site-client statically. The dynamic import is memoised by the module system.
export const loadSiteSupabase = () => import("./site-client").then((m) => m.siteSupabase);
export const loadSupabase = () => import("./client").then((m) => m.supabase);

/** True when a persisted Supabase session exists (a returning, logged-in visitor). */
export function hasStoredSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch { /* storage blocked */ }
  return false;
}
