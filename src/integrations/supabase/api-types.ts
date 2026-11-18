// Types of the seeld-site (v2) API surface: schemas `api` and `staff`.
// Single source of truth: docs/platform/types.generated.ts, generated from the replayed migrations
// (supabase gen types typescript --local --schema api,staff). Regenerate there, never edit by hand.
export type { Database as ApiDatabase, Json as ApiJson } from "../../../docs/platform/types.generated";
import type { Database } from "../../../docs/platform/types.generated";

/** Row of an api.* view, e.g. ApiView<"blog_posts">. */
export type ApiView<Name extends keyof Database["api"]["Views"]> = Database["api"]["Views"][Name]["Row"];
