// Zip (מיקוד) lookup for the wizard's address question (owner decision 2026-11-22: the zip is required and filled in
// automatically from the street, house number and city). Source: the undocumented backend of the Israel Post locate-zip
// page (apimftprd.israelpost.co.il/mypost-zip; subscription key = the public key the site's own bundle ships, overridable
// with ISRAEL_POST_KEY). Server to server only (the API sends no CORS headers). Rules: HTTPS, one host, GET only, no
// redirects followed, 10 s per call, no cookies; values are never logged (only counts and outcomes). Best effort: any
// failure answers "not found" and the visitor types the zip.
import type { FetchFn } from "../db.ts";
import type { Logger } from "../logger.ts";

export const ZIP_HOST = "apimftprd.israelpost.co.il";
export const ZIP_BASE = `https://${ZIP_HOST}/mypost-zip`;
/** the public key hard-coded in the Israel Post site bundle (documented by the community as public; not a secret of ours) */
export const ZIP_PUBLIC_KEY = "5ccb5b137e7444d885be752eda7f767a";
export const ZIP_TIMEOUT_MS = 10_000;
const ZIP_RE = /^[0-9]{7}$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 2000;

export interface ZipQuery { city: string; street: string; house: string }
export interface ZipLookup { lookup(q: ZipQuery): Promise<string | null> }

interface Envelope<T> { ReturnCode: number; ErrorMessage: string | null; Result: T }
interface Locality { id: string; n: string; syn: string; divided: boolean; zip: string }
interface Street { id: string; n: string; syn: string; cityID: string }
interface ZipResult { zip: string | null; msgtype: string }

const norm = (s: string) => s.replace(/[\s\-"'`׳״]+/g, " ").trim().toLowerCase();

/** pick the row whose name (or synonym) equals the query; else the single row; else the first row that starts with it */
function pick<T extends { n: string; syn: string }>(rows: T[], wanted: string): T | null {
  const w = norm(wanted);
  if (!w) return null;
  const exact = rows.find((r) => norm(r.n) === w || norm(r.syn) === w);
  if (exact) return exact;
  if (rows.length === 1) return rows[0];
  return rows.find((r) => norm(r.n).startsWith(w) || norm(r.syn).startsWith(w)) ?? null;
}

export function createZipLookup(o: { log: Logger; fetch?: FetchFn; key?: string; now?: () => number; timeoutMs?: number }): ZipLookup {
  const doFetch = o.fetch ?? fetch;
  const key = (o.key ?? "").trim() || ZIP_PUBLIC_KEY;
  const now = o.now ?? Date.now;
  const timeoutMs = o.timeoutMs ?? ZIP_TIMEOUT_MS;
  const cache = new Map<string, { at: number; zip: string | null }>();

  async function get<T>(path: string, query: Record<string, string>): Promise<T | null> {
    const u = new URL(`${ZIP_BASE}/${path}`);
    for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
    if (u.hostname !== ZIP_HOST || u.protocol !== "https:") return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await doFetch(u.href, { method: "GET", headers: { "Ocp-Apim-Subscription-Key": key, accept: "application/json" }, redirect: "manual", signal: ctl.signal });
      if (res.status !== 200) { o.log.warn("zip lookup refused", { path, status: res.status }); return null; }
      const body = await res.json() as Envelope<T>;
      if (!body || typeof body !== "object" || body.ReturnCode !== 0) { o.log.warn("zip lookup error envelope", { path }); return null; }
      return body.Result;
    } catch {
      o.log.warn("zip lookup failed", { path });
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async lookup(q) {
      const city = q.city.trim(), street = q.street.trim(), house = q.house.replace(/\D/g, "").slice(0, 4);
      if (!city || !street || !house) return null;
      const ck = `${norm(city)}|${norm(street)}|${house}`;
      const hit = cache.get(ck);
      if (hit && now() - hit.at < CACHE_TTL_MS) return hit.zip;
      const remember = (zip: string | null) => { if (cache.size > CACHE_MAX) cache.clear(); cache.set(ck, { at: now(), zip }); return zip; };

      const cities = await get<Locality[]>("getcities-lang", { CityStartsWith: city.slice(0, 2), Lang: "he" });
      const loc = pick(Array.isArray(cities) ? cities : [], city);
      if (!loc) { o.log.info("zip lookup: city not matched"); return remember(null); }
      if (!loc.divided && ZIP_RE.test(loc.zip)) return remember(loc.zip); // a locality with one zip: no street needed

      const streets = await get<Street[]>("GetStreets-lang", { CityID: loc.id, CityName: "", SearchMode: "ID-StartsWith", StartsWith: street.slice(0, 2), Lang: "he" });
      const st = pick(Array.isArray(streets) ? streets : [], street);
      if (!st) { o.log.info("zip lookup: street not matched"); return remember(null); }

      const r = await get<ZipResult>("SearchZip-Lang", { CityID: loc.id, StreetID: st.id, House: house, Lang: "he", ByMaanimID: "true" });
      const zip = r && typeof r.zip === "string" && ZIP_RE.test(r.zip) ? r.zip : null;
      o.log.info("zip lookup", { found: !!zip });
      return remember(zip);
    },
  };
}
