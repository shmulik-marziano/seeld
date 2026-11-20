// Connector operations shared by surense-sync (staff) and surense-worker (queue). Each one: Surense call(s) through
// the host-locked client -> pure mapping (mirror.ts) -> api.surense_* RPC (which encrypts). Return values hold ids,
// counts and codes only; nothing personal ever leaves these functions except the proxies invite url, which the staff
// caller asked for. Flags are enforced in SQL (every RPC calls private.kill_switch) and by api.surense_gate up front.
import type { Rpc } from "../db.ts";
import type { Logger } from "../logger.ts";
import { isUuid, type SurenseApi } from "./api.ts";
import { assertAllowedUrl, type SurenseClient } from "./client.ts";
import { InputError, SurenseError } from "./errors.ts";
import { mapCustomer, mapDocument, mapProduct } from "./mirror.ts";
import { extOf, objectPath, sha256Hex, type Storage } from "./storage.ts";
import type { E9100SubmitRequest, ProxiesInviteRequest, SearchFilter, SurenseDocument } from "./types.ts";

export interface SyncDeps {
  api: SurenseApi;
  client: SurenseClient;
  rpc: Rpc;
  log: Logger;
  storage: Storage | null;
  now?: () => number;
}

export const PAGE_SIZE = 100;
export const UPSERT_CHUNK = 100;
export const CUSTOMERS_STATE_KEY = "customers";

function chunks<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** map, dropping records whose id is malformed (counted, never logged) */
function mapAll<T, R>(xs: T[] | undefined, f: (x: T) => R): { rows: R[]; bad: number } {
  const rows: R[] = [];
  let bad = 0;
  for (const x of xs ?? []) {
    try {
      rows.push(f(x));
    } catch {
      bad++;
    }
  }
  return { rows, bad };
}

async function upsert(rpc: Rpc, fn: "surense_customers_upsert" | "surense_documents_upsert", rows: unknown[]): Promise<number> {
  let n = 0;
  for (const c of chunks(rows, UPSERT_CHUNK)) {
    const r = await rpc.call<{ upserted?: number }>(fn, { p_rows: c });
    n += r?.upserted ?? 0;
  }
  return n;
}

// ---------------------------------------------------------------- health
export async function health(d: SyncDeps) {
  const [user, licensees, accounts, types] = await Promise.all([
    d.api.userInfo(),
    d.api.licensees.list(),
    d.api.swiftness.accountsList(),
    d.api.documents.types(),
  ]);
  return {
    user: { userId: isUuid(user?.userId) ? user.userId : null, agencyId: isUuid(user?.agencyId) ? user.agencyId : null,
      agencyAdmin: user?.agencyAdmin === true, tenantAdmin: user?.tenantAdmin === true },
    licensees: (licensees ?? []).map((l) => ({ id: l.id, name: typeof l.name === "string" ? l.name : null, accessible: l.accessible !== false })),
    swiftnessAccounts: (accounts ?? []).map((a) => ({
      id: a.id,
      accountName: a.accountName ?? null,
      status: typeof a.status === "object" && a.status ? a.status.description ?? a.status.code : a.status ?? null,
      defaultAccount: a.defaultAccount === true,
    })),
    documentTypes: (types ?? []).map((t) => ({ id: t.id, title: t.title ?? null, active: t.active !== false })),
  };
}

// ---------------------------------------------------------------- customers
export interface PullStats {
  pages: number;
  rows: number;
  upserted: number;
  bad: number;
  done: boolean;
}

export interface DocPullStats extends PullStats {
  /** set when the deadline stopped the pass: the offset to continue from (a follow-up job) */
  nextStart: number | null;
}

export const MAX_OFFSET = 10_000;

/** Cursor-paged full pass over the customers the key can see; the cursor is saved after every page, so a pass
 *  survives budgets and restarts. `deadline` = epoch ms after which no new page is fetched.
 *  TODO(real API): no sort is sent (the cursor must be replayed with the same sorts, and the sortable field names are
 *  not verified yet); an incremental filter on lastModifiedDate can replace the full pass once its field name is known. */
export async function pullCustomers(d: SyncDeps, o: { deadline: number; maxPages?: number }): Promise<PullStats> {
  const now = d.now ?? Date.now;
  const state = await d.rpc.call<{ cursor: string | null }>("surense_sync_state_get", { p_key: CUSTOMERS_STATE_KEY });
  let cursor = state?.cursor ?? "";
  const stats: PullStats = { pages: 0, rows: 0, upserted: 0, bad: 0, done: false };
  while (now() < o.deadline && stats.pages < (o.maxPages ?? 50)) {
    const page = await d.api.customers.search({ cursor, pageSize: PAGE_SIZE });
    stats.pages++;
    const { rows, bad } = mapAll(page?.results, mapCustomer);
    stats.rows += rows.length;
    stats.bad += bad;
    stats.upserted += await upsert(d.rpc, "surense_customers_upsert", rows);
    const next = typeof page?.nextCursor === "string" && page.nextCursor ? page.nextCursor : null;
    const done = !page?.hasNextPage || !next;
    await d.rpc.call("surense_sync_state_set", { p_key: CUSTOMERS_STATE_KEY, p_cursor: done ? null : next, p_done: done, p_rows: rows.length });
    if (done) {
      stats.done = true;
      break;
    }
    cursor = next as string;
  }
  return stats;
}

export async function pullCustomer(d: SyncDeps, customerId: string): Promise<{ upserted: number }> {
  const c = await d.api.customers.get(customerId);
  const upserted = await upsert(d.rpc, "surense_customers_upsert", [mapCustomer(c)]);
  return { upserted };
}

// ---------------------------------------------------------------- documents
/** Offset-paged document search for one customer (or since a date), from `startRow` (default 0). Offset paging stops
 *  at row 10,000 (done stays false, nextStart null). A pass cut by the deadline returns nextStart to continue from.
 *  TODO(real API): the filter field names ("customerId", "createdDate") are taken from the response schema and still
 *  need a check against GET /documents/fields. */
export async function pullDocuments(
  d: SyncDeps,
  o: { customerId?: string; since?: string; startRow?: number; deadline: number },
): Promise<DocPullStats> {
  const now = d.now ?? Date.now;
  const filters: SearchFilter[] = [];
  if (o.customerId) filters.push({ field: "customerId", operator: "equals", value: o.customerId });
  if (o.since) filters.push({ field: "createdDate", operator: "greaterThanOrEqual", value: o.since });
  if (!filters.length) throw new InputError("customer_or_since_required");
  const first = o.startRow ?? 0;
  if (!Number.isSafeInteger(first) || first < 0 || first % PAGE_SIZE !== 0) throw new InputError("bad_start_row");
  const stats: DocPullStats = { pages: 0, rows: 0, upserted: 0, bad: 0, done: false, nextStart: null };
  for (let start = first; start <= MAX_OFFSET - PAGE_SIZE; start += PAGE_SIZE) {
    if (now() >= o.deadline) {
      stats.nextStart = start;
      break;
    }
    const page = await d.api.documents.search({ filters, startRow: start, endRow: start + PAGE_SIZE });
    stats.pages++;
    const { rows, bad } = mapAll<SurenseDocument, ReturnType<typeof mapDocument>>(page?.results, mapDocument);
    stats.rows += rows.length;
    stats.bad += bad;
    stats.upserted += await upsert(d.rpc, "surense_documents_upsert", rows);
    if (!page?.hasNextPage || !(page?.results ?? []).length) {
      stats.done = true;
      break;
    }
  }
  return stats;
}

// ---------------------------------------------------------------- E9100 (clearing house)
export interface DownloadStats {
  files: number;
  stored: number;
  existing: number;
  refusedHost: number;
  /** the deadline stopped before every file was handled (a retry is safe: put and file_record dedupe) */
  partial: boolean;
}

/** Fetch the E9100 file links and store each file in client-docs + crm.surense_documents (sha256, size, mime).
 *  Links on a host outside ALLOWED_HOSTS are refused and counted (owner decision pending, see client.ts). */
export async function e9100Download(
  d: SyncDeps,
  o: { customerId: string; eventId: string; deadline?: number },
): Promise<DownloadStats> {
  if (!isUuid(o.customerId) || !isUuid(o.eventId)) throw new InputError("bad_id");
  const now = d.now ?? Date.now;
  const res = await d.api.swiftness.e9100Download({ customerId: o.customerId, eventId: o.eventId });
  const files = res?.files ?? [];
  const stats: DownloadStats = { files: files.length, stored: 0, existing: 0, refusedHost: 0, partial: false };
  for (const f of files) {
    if (o.deadline !== undefined && now() >= o.deadline) {
      stats.partial = true;
      break;
    }
    if (typeof f?.url !== "string") continue;
    try {
      assertAllowedUrl(f.url);
    } catch {
      stats.refusedHost++;
      continue;
    }
    if (!d.storage) throw new SurenseError(0, "storage_not_configured", "config");
    const { bytes, mime } = await d.client.downloadFile(f.url);
    const sha = await sha256Hex(bytes);
    const ext = extOf(f.name);
    const path = objectPath(o.customerId.toLowerCase(), "e9100", o.eventId.toLowerCase(), sha, ext);
    const put = await d.storage.put(path, bytes, mime ?? "application/octet-stream");
    await d.rpc.call("surense_file_record", {
      p_customer: o.customerId, p_event: o.eventId, p_path: path, p_sha256: sha, p_size: bytes.byteLength, p_mime: mime,
      p_details: { name: f.name ?? null, source: "swiftness.e9100" },
    });
    if (put === "stored") stats.stored++;
    else stats.existing++;
  }
  return stats;
}

export async function e9100Submit(d: SyncDeps, req: E9100SubmitRequest) {
  const ev = await d.api.swiftness.e9100Submit(req);
  return { eventId: isUuid(ev?.id) ? ev.id : null, progress: typeof ev?.e9100Progress === "number" ? ev.e9100Progress : null, rejected: ev?.rejected === true };
}

// ---------------------------------------------------------------- proxies (POA) and portfolio
/** Returns the personal approval link only. Surense's suggested `message` text is dropped and nothing is sent to the
 *  customer from here: delivery is the wizard's job (POA-WIZARD-SPEC), after the owner's approval. */
export async function inviteProxies(d: SyncDeps, req: ProxiesInviteRequest) {
  const r = await d.api.proxies.invite(req);
  return { url: typeof r?.url === "string" ? r.url : null, partnerUrl: typeof r?.partnerUrl === "string" ? r.partnerUrl : null };
}

export async function portfolio(
  d: SyncDeps,
  o: { customerId: string; mode: "production" | "pre_advice"; misparMislaka?: string; hbValidityDate?: string },
) {
  const res = await d.api.customers.portfolio(o.customerId, {
    mode: o.mode === "production" ? "פרודוקציה" : "טרום_טיפול",
    ...(o.misparMislaka ? { misparMislaka: o.misparMislaka } : {}),
    ...(o.hbValidityDate ? { hbValidityDate: o.hbValidityDate } : {}),
  });
  const { rows, bad } = mapAll(res?.products, (p) => mapProduct(p, o.customerId));
  const r = await d.rpc.call<{ snapshot_id: number; products: number }>("surense_portfolio_store", {
    p_customer: o.customerId, p_mode: o.mode, p_snapshot: JSON.stringify(res ?? {}), p_products: rows,
  });
  return { snapshotId: r?.snapshot_id ?? null, products: r?.products ?? 0, bad };
}

// ---------------------------------------------------------------- webhook events
/** Ids found in a webhook payload. TODO(real API): Svix shows "No schema available" for Surense events; until the
 *  first deliveries are inspected we look for uuid-shaped ids in payload, payload.data, payload.payload and
 *  payload.object, under the obvious names. Nothing else in the payload is read. */
export function eventRefs(payload: unknown): { id: string | null; customerId: string | null; eventId: string | null; documentId: string | null } {
  const layers: Record<string, unknown>[] = [];
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const k of ["data", "payload", "object"]) if (p[k] && typeof p[k] === "object") layers.push(p[k] as Record<string, unknown>);
    layers.push(p);
  }
  const pick = (...keys: string[]) => {
    for (const l of layers) for (const k of keys) if (isUuid(l[k])) return (l[k] as string).toLowerCase();
    return null;
  };
  return {
    id: pick("id", "entityId"),
    customerId: pick("customerId", "customer_id", "cid"),
    eventId: pick("eventId", "e9100EventId", "event_id"),
    documentId: pick("documentId", "docId", "document_id"),
  };
}

export type EventPlan =
  | { action: "pull_customer"; customerId: string }
  | { action: "mark_customer_deleted"; customerId: string }
  | { action: "pull_documents"; customerId: string }
  | { action: "mark_document_deleted"; documentId: string }
  | { action: "e9100_download"; customerId: string; eventId: string }
  | { action: "skip"; reason: string };

/** Pure routing from (event type, payload) to the work to do. */
export function planEvent(type: string, payload: unknown): EventPlan {
  const r = eventRefs(payload);
  if (/^dataproxy\.(aleph|hei|bet)\.approved$/.test(type) || type === "harb.uploaded" || type === "document.uploaded") {
    const customerId = r.customerId ?? (type.startsWith("dataproxy.") ? r.id : null);
    return customerId ? { action: "pull_documents", customerId } : { action: "skip", reason: "no_customer_ref" };
  }
  if (type === "document.deleted") {
    const documentId = r.documentId ?? r.id;
    return documentId ? { action: "mark_document_deleted", documentId } : { action: "skip", reason: "no_document_ref" };
  }
  if (type === "swiftness.e9100.completed") {
    const eventId = r.eventId ?? r.id;
    return r.customerId && eventId ? { action: "e9100_download", customerId: r.customerId, eventId } : { action: "skip", reason: "no_e9100_ref" };
  }
  if (type === "customer.created" || type === "customer.updated") {
    const customerId = r.customerId ?? r.id;
    return customerId ? { action: "pull_customer", customerId } : { action: "skip", reason: "no_customer_ref" };
  }
  if (type === "customer.deleted") {
    const customerId = r.customerId ?? r.id;
    return customerId ? { action: "mark_customer_deleted", customerId } : { action: "skip", reason: "no_customer_ref" };
  }
  if (type.startsWith("lead.")) {
    // no lead mirror yet: refresh the lead's customer when the payload names it
    return r.customerId ? { action: "pull_customer", customerId: r.customerId } : { action: "skip", reason: "no_lead_mirror" };
  }
  return { action: "skip", reason: "no_handler" };
}
