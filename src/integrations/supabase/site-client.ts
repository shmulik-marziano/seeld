import { createClient } from '@supabase/supabase-js';
import type { Database } from './site-types';

const SITE_SUPABASE_URL = import.meta.env.VITE_SITE_SUPABASE_URL;
const SITE_SUPABASE_KEY = import.meta.env.VITE_SITE_SUPABASE_PUBLISHABLE_KEY;

export const siteSupabase = createClient<Database>(SITE_SUPABASE_URL, SITE_SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
