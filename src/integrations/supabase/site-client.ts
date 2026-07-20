import { createClient } from '@supabase/supabase-js';
import type { Database } from './site-types';

// Publishable (anon) credentials — safe to ship in the client bundle; access
// control is enforced by Supabase RLS. Env vars override for other environments.
const SITE_SUPABASE_URL = import.meta.env.VITE_SITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";
const SITE_SUPABASE_KEY = import.meta.env.VITE_SITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWZhdHlrc3FpendjdXRmYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDg3NTIsImV4cCI6MjA4OTE4NDc1Mn0.a1ECWY9SDwMveRvi1zj7bA2b7U6BvRv0Mh0rMysg40E";

export const siteSupabase = createClient<Database>(SITE_SUPABASE_URL, SITE_SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
