import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL } from './client';
import type { Database } from './site-types';

// The site client used to be a second createClient() call — same project, same
// anon key, same default storage key. That meant two GoTrueClient instances
// sharing one refresh token, each running its own refresh timer: whichever
// fired second replayed an already-spent token, and Supabase answered by
// invalidating the session. Users were being signed out at random.
//
// There is only one connection here now. `siteSupabase` stays as a separately
// typed handle onto it, because the public-site tables live in a different
// generated Database type than the agent app's.
export const SITE_SUPABASE_URL = SUPABASE_URL;

export const siteSupabase = supabase as unknown as SupabaseClient<Database>;
