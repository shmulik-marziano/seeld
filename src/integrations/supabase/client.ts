// The one Supabase client of the site.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_PROJECT_ID, IS_V2 } from './config';
// Re-exported: several components build edge-function URLs / headers from these.
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_PROJECT_ID };

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// legacy (Tokyo): the auth-capable client of the agent app and the site, unchanged.
// v2 (seeld-site): ONE anonymous client on the `api` schema. No session is stored or refreshed: the
// public site reads api.* views only, and the staff app is rebuilt in phase 2. It is typed with the
// legacy Database so the shared read paths (blog_posts, cma_*, investment_tracks) compile unchanged;
// the api views keep those names and columns. Typed access to api/staff lives in ./v2-client.
const createSiteClient = () =>
  IS_V2
    ? (createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        db: { schema: 'api' },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }) as unknown as ReturnType<typeof createClient<Database>>)
    : createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      });

export const supabase = createSiteClient();
