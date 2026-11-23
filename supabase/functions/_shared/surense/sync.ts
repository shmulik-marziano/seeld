// Connector operations shared by surense-sync (staff) and surense-worker (queue). Each one: Surense call(s) through
// the host-locked client -> pure mapping (mirror.ts) -> api.surense_* RPC (which encrypts). Return values hold ids,
// counts and codes only; nothing personal ever leaves these functions except the proxies invite url, which the staff
// caller asked for. Flags are enforced in SQL (every RPC calls private.kill_switch) and by api.surense_gate up front.
import { type Rpc, RpcError } from "../db.ts";
import type { Logger } from "../logger.ts";
import { isUuid, type SurenseApi } from "./api.ts";
import { assertAllowedUrl, type SurenseClient } from "./client.ts";
import { InputError, SurenseError } from "./errors.ts";
import { mapCustomer, mapDocument, mapProduct } from "./mirror.ts";
import { extOf, objectPath, sha256Hex, type Storage } from "./storage.ts";
import type { PoaEngine, PoaKind } from "../poa/engine/types.ts";
import { poaStoragePath } from "../poa/storage.ts";
import type { E9100SubmitRequest, ProxiesInviteRequest, SearchFilter, SurenseDocument } from "./types.ts";

export interface SyncDeps {
  api: SurenseApi;
  client: SurenseClient;
  rpc: Rpc;
  log: Logger;
  storage: Storage | null;
  now?: () => number;
  /** the engine that feeds the tool for the ship job (surense.poa_ship); null/absent = that job fails with engine_not_configured */
  poaEngine?: PoaEngine | null;
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
  o: { customerId?: string; since?: string; startRow?: number; deadline: number; onRows?: (rows: SurenseDocument[]) => void },
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
    if (o.onRows && page?.results?.length) o.onRows(page.results);
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

// ---------------------------------------------------------------- POA documents (wizard)
export interface PoaLinkStats {
  /** the POA session took the document (false: no session for this customer, switch off, RPC missing, or nothing found) */
  linked: boolean;
  /** all enabled modules of the session now have a linked document */
  complete: boolean;
  /** the file bytes were fetched and hashed (false while the download host is not allowed) */
  hashed: boolean;
  /** the bytes are in the private bucket at the path the database mandates */
  stored: boolean;
}

const NO_LINK: PoaLinkStats = { linked: false, complete: false, hashed: false, stored: false };

interface LinkResult {
  linked?: boolean;
  complete?: boolean;
  session_id?: string;
  document_id?: string;
  /** the migration answers agency_id on a link (the path is built from it); storage_path is accepted too */
  storage_path?: string;
  agency_id?: string;
  /** linked=false with reason 'already_linked': this Surense document already backs another kind of the session */
  reason?: string;
  /** the session's row already holds a stored file (e.g. from the policies-step links): bytes and hash are left alone */
  stored?: boolean;
}

/** at most this many of the newest documents are offered to the session, newest first (one per kind is all it can take) */
const MAX_LINK_CANDIDATES = 3;

const POA_PATH = /^poa\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/(maslaka|harbit|policies)-[0-9a-f-]{36}\.pdf$/;

/** After a dataproxy.aleph|hei|bet.approved pull: link the customer's newest document to the POA session as `kind`
 *  (api.poa_document_link; Surense document id; it never raises for a customer without a wizard session).
 *  TODO(owner-full-run): the document type ids of the three proxies are unknown, so "newest" stands in for "the one that
 *  was just approved" (events arrive one module at a time). When the events are processed late (worker lag, a retried job)
 *  the newest document may already back another kind of the session: the database answers linked=false/already_linked and
 *  the next newest document is offered instead, so one file is never linked to two kinds.
 *  Order: link first without a hash (cheap, and tells whether a session exists at all), then, only for a session, fetch the
 *  bytes, hash them and link again with the hash. The bytes are stored at poa/{agency}/{session}/{kind}-{document}.pdf and
 *  recorded with api.poa_document_stored ONLY when the download host is allowed (client.ts ALLOWED_HOSTS) and the link
 *  result names the path (or the agency id to build it); until then the document stays metadata-only and the client's
 *  download answers document_not_ready. A closed poa_docs_enabled switch (423) or a database without the RPC (404) is not
 *  a failure: nothing is linked. Ids and booleans only. */
export async function linkPoaDocument(d: SyncDeps, o: { customerId: string; kind: PoaKind; docs: SurenseDocument[] }): Promise<PoaLinkStats> {
  if (!isUuid(o.customerId)) throw new InputError("bad_id");
  const candidates = o.docs.filter((x) => isUuid(x?.id)).sort((a, b) => String(b.createdDate ?? "").localeCompare(String(a.createdDate ?? "")))
    .slice(0, MAX_LINK_CANDIDATES);
  if (candidates.length === 0) return NO_LINK;
  const customerId = o.customerId.toLowerCase();
  let docId = "";
  const link = async (sha: string | null): Promise<LinkResult | null> => {
    try {
      return await d.rpc.call<LinkResult | null>("poa_document_link", { p_customer: customerId, p_kind: o.kind, p_document_id: docId, p_sha256: sha });
    } catch (e) {
      if (e instanceof RpcError && (e.status === 423 || e.status === 404)) return null;
      throw e;
    }
  };
  let first: LinkResult | null = null;
  for (const c of candidates) {
    docId = c.id.toLowerCase();
    const r = await link(null);
    if (r?.linked === true) {
      first = r;
      break;
    }
    if (r?.linked === false && r.reason === "already_linked") continue; // taken by another kind: try the next newest
    return NO_LINK;
  }
  if (!first) return NO_LINK;
  // a file was already stored for this row (the policies-step links): never download or overwrite its hash
  if (first.stored === true) return { linked: true, complete: first.complete === true, hashed: false, stored: true };

  let sha: string | null = null;
  let bytes: Uint8Array | null = null;
  if (d.storage) {
    const urls = await d.api.documents.urls({ documents: [{ docId, inline: false, shorten: false }] });
    const entry = urls?.entries?.find((e) => e?.documentId?.toLowerCase() === docId) ?? urls?.entries?.[0];
    if (typeof entry?.url === "string") {
      let allowed = true;
      try {
        assertAllowedUrl(entry.url);
      } catch {
        allowed = false;
      }
      if (allowed) {
        bytes = (await d.client.downloadFile(entry.url)).bytes;
        sha = await sha256Hex(bytes);
      }
    }
  }
  if (!sha || !bytes) return { linked: true, complete: first.complete === true, hashed: false, stored: false };

  const second = (await link(sha)) ?? first;
  const path = typeof second.storage_path === "string" && POA_PATH.test(second.storage_path)
    ? second.storage_path
    : isUuid(second.agency_id) && isUuid(second.session_id) && isUuid(second.document_id)
    ? poaStoragePath(second.agency_id, second.session_id, o.kind, second.document_id)
    : null;
  let stored = false;
  if (path && d.storage && isUuid(second.document_id)) {
    await d.storage.put(path, bytes, "application/pdf");
    await d.rpc.call("poa_document_stored", { p_document: second.document_id, p_path: path, p_sha256: sha });
    stored = true;
  }
  return { linked: true, complete: second.complete === true, hashed: true, stored };
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
/** Ids found in a webhook payload. Real Surense bodies (verified 2026-11-23) are flat: customerId at top level, txId on
 *  SwiftnessE9100Completed, swiftnessEventId on SwiftnessE9100Submitted, leadId on LeadCreated. The wrapped shapes
 *  (payload.data / payload.payload / payload.object) stay accepted. Nothing else in the payload is read. */
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
    // txId: the clearing-house transaction on SwiftnessE9100Completed (the download endpoint's optional eventId)
    eventId: pick("eventId", "e9100EventId", "event_id", "txId", "swiftnessEventId"),
    documentId: pick("documentId", "docId", "document_id"),
  };
}

const POA_KIND_OF: Record<string, PoaKind> = { aleph: "maslaka", hei: "harbit", bet: "policies" };

export type EventPlan =
  | { action: "pull_customer"; customerId: string }
  | { action: "mark_customer_deleted"; customerId: string }
  | { action: "pull_documents"; customerId: string; poaKind?: PoaKind }
  | { action: "mark_document_deleted"; documentId: string }
  | { action: "e9100_download"; customerId: string; eventId: string }
  | { action: "skip"; reason: string };

/** Pure routing from (event type, payload) to the work to do. */
export function planEvent(type: string, payload: unknown): EventPlan {
  const r = eventRefs(payload);
  const proxy = /^dataproxy\.(aleph|hei|bet)\.approved$/.exec(type);
  if (proxy || type === "harb.uploaded" || type === "document.uploaded") {
    const customerId = r.customerId ?? (type.startsWith("dataproxy.") ? r.id : null);
    if (!customerId) return { action: "skip", reason: "no_customer_ref" };
    // aleph = maslaka, hei = harbit, bet = policies: tells the POA wizard which of its three documents just arrived
    return proxy ? { action: "pull_documents", customerId, poaKind: POA_KIND_OF[proxy[1]] } : { action: "pull_documents", customerId };
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
