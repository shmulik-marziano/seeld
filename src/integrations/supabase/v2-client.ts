// Typed handle onto the v2 (seeld-site) client: the same single instance as ./client, viewed through the
// generated `api` schema types. Only meaningful when IS_V2; in a legacy build it points at the Tokyo client
// and must not be used (callers branch on IS_V2 first).
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";
import type { ApiDatabase } from "./api-types";

export const apiSupabase = supabase as unknown as SupabaseClient<ApiDatabase, "api">;
