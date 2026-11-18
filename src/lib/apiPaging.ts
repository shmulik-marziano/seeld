// v2 reads: seeld-site PostgREST caps every response at max_rows (200). Anything that can be longer is read in
// Range pages with count=exact, and the loop follows the server's count, not the page length, so a lower
// max_rows on the server can never silently truncate a list.
import { API_PAGE_SIZE } from "@/integrations/supabase/config";

export interface PageResult<T> {
  data: T[] | null;
  error: unknown;
  count?: number | null;
}

/** Calls fetchPage(from, to) until `count` rows (or an empty page) arrive. Throws the first error. */
export async function readAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = API_PAGE_SIZE,
  maxRows = 50000,
): Promise<T[]> {
  const rows: T[] = [];
  let total: number | null = null;
  while (rows.length < maxRows) {
    const from = rows.length;
    const { data, error, count } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    if (typeof count === "number") total = count;
    const page = data ?? [];
    rows.push(...page);
    if (page.length === 0) break;
    if (total !== null ? rows.length >= total : page.length < pageSize) break;
  }
  return rows;
}
