// Thin typed wrappers over the Surense operations SEELD uses (key-operations.md). No logic beyond shaping the call:
// paging loops, flags and storage live in sync.ts. Writes carry an audit op name; reads sent as POST are idempotent.
// There is deliberately no delete wrapper (README section 5: no deletions from our side).
import type { SurenseClient } from "./client.ts";
import { InputError } from "./errors.ts";
import type {
  CreateCustomerRequest, CreateLeadRequest, Customer, CustomerBrief, DataImportInitiateRequest, DataImportInitiateResponse,
  DataImportProvider, DataImportRecord, DocumentSearchPage, DocumentSearchRequest, DocumentType, DocumentUrlsRequest,
  DocumentUrlsResponse, E9100DownloadRequest, E9100DownloadResponse, E9100Event, E9100SubmitRequest, Lead, Licensee,
  Portfolio, PortfolioHistoryEntry, PortfolioRequest, ProxiesInviteRequest, ProxiesInviteResponse, SearchPage,
  SearchRequest, SwiftnessAccount, UploadFinalizeRequest, UploadFinalizeResponse, UploadInitiateRequest,
  UploadInitiateResponse, UserInfo, Uuid,
} from "./types.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** path segments are always ids we validated: never interpolate free text into a path */
export function seg(id: string): string {
  if (!UUID.test(id)) throw new InputError("bad_id");
  return id.toLowerCase();
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export interface SurenseApi {
  userInfo(): Promise<UserInfo>;
  customers: {
    create(req: CreateCustomerRequest): Promise<Customer>;
    leadCustomer(req: CreateCustomerRequest): Promise<Customer>;
    search(req: SearchRequest): Promise<SearchPage<Customer>>;
    get(id: Uuid): Promise<Customer>;
    brief(ids: Uuid[]): Promise<CustomerBrief[]>;
    portfolio(id: Uuid, req: PortfolioRequest): Promise<Portfolio>;
    portfolioHistory(id: Uuid): Promise<PortfolioHistoryEntry[]>;
  };
  proxies: {
    invite(req: ProxiesInviteRequest): Promise<ProxiesInviteResponse>;
  };
  swiftness: {
    accountsList(): Promise<SwiftnessAccount[]>;
    e9100Submit(req: E9100SubmitRequest): Promise<E9100Event>;
    e9100Download(req: E9100DownloadRequest): Promise<E9100DownloadResponse>;
  };
  documents: {
    uploadInitiate(req: UploadInitiateRequest): Promise<UploadInitiateResponse>;
    /** PUT each file to its uploadUrl (host-locked), then finalize. */
    uploadFinalize(req: UploadFinalizeRequest): Promise<UploadFinalizeResponse>;
    put(uploadUrl: string, bytes: Uint8Array, mime: string): Promise<number>;
    search(req: DocumentSearchRequest): Promise<DocumentSearchPage>;
    urls(req: DocumentUrlsRequest): Promise<DocumentUrlsResponse>;
    types(): Promise<DocumentType[]>;
  };
  dataImport: {
    providers(): Promise<DataImportProvider[]>;
    initiate(req: DataImportInitiateRequest): Promise<DataImportInitiateResponse>;
    start(id: Uuid): Promise<DataImportRecord>;
    get(id: Uuid): Promise<DataImportRecord>;
    /** PUT the ZIP to the uploadUrl of initiate (host-locked to `hosts`; no bearer, no retry) */
    put(uploadUrl: string, zip: Uint8Array, hosts: readonly string[]): Promise<number>;
  };
  licensees: {
    list(): Promise<Licensee[]>;
    get(id: Uuid): Promise<Licensee>;
  };
  leads: {
    create(req: CreateLeadRequest): Promise<Lead>;
    search(req: SearchRequest): Promise<SearchPage<Lead>>;
  };
}

export function surenseApi(c: SurenseClient): SurenseApi {
  const read = <T>(path: string, body?: unknown) =>
    c.request<T>(path, body === undefined ? { method: "GET" } : { method: "POST", body, idempotent: true });
  const write = <T>(path: string, body: unknown, op: string, ref: string | null = null) =>
    c.request<T>(path, { method: "POST", body, audit: op, auditRef: ref });

  return {
    userInfo: () => read<UserInfo>("/user/info"),
    customers: {
      create: (req) => write<Customer>("/customers", req, "customers.create"),
      leadCustomer: (req) => write<Customer>("/customers/lead_customer", req, "customers.lead_customer", isUuid(req.leadId) ? req.leadId : null),
      search: (req) => read<SearchPage<Customer>>("/customers/search", req),
      get: (id) => read<Customer>(`/customers/${seg(id)}`),
      brief: (ids) => read<CustomerBrief[]>("/customers/brief", { customerIds: ids.map(seg).slice(0, 50) }),
      // portfolio is a POST that only reads
      portfolio: (id, req) => read<Portfolio>(`/customers/${seg(id)}/portfolio`, req),
      portfolioHistory: (id) => read<PortfolioHistoryEntry[]>(`/customers/${seg(id)}/portfolio/history`),
    },
    proxies: {
      invite: (req) =>
        write<ProxiesInviteResponse>("/customers/proxies/invite", req, "proxies.invite", isUuid(req.customerId) ? req.customerId : isUuid(req.leadId) ? req.leadId : null),
    },
    swiftness: {
      accountsList: () => read<SwiftnessAccount[]>("/swiftness/accounts/list"),
      e9100Submit: (req) => write<E9100Event>("/swiftness/e9100/events", req, "swiftness.e9100.submit", req.customerId),
      // download only returns links: idempotent
      e9100Download: (req) => read<E9100DownloadResponse>("/swiftness/e9100/download", req),
    },
    documents: {
      uploadInitiate: (req) => write<UploadInitiateResponse>("/documents/upload/initiate", req, "documents.upload_initiate"),
      uploadFinalize: (req) =>
        write<UploadFinalizeResponse>("/documents/upload/finalize", req, "documents.upload_finalize", isUuid(req.customerId) ? req.customerId : null),
      put: (url, bytes, mime) => c.putUpload(url, bytes, mime),
      search: (req) => read<DocumentSearchPage>("/documents/search", req),
      urls: (req) => read<DocumentUrlsResponse>("/documents/urls", req),
      types: () => read<DocumentType[]>("/documents/types"),
    },
    dataImport: {
      providers: () => read<DataImportProvider[]>("/data-import/providers"),
      initiate: (req) => write<DataImportInitiateResponse>("/data-import/initiate", req, "data_import.initiate"),
      // documented as idempotent (a second start returns the current record)
      start: (id) => c.request<DataImportRecord>(`/data-import/${seg(id)}/start`, { method: "POST", idempotent: true, audit: "data_import.start", auditRef: id }),
      get: (id) => read<DataImportRecord>(`/data-import/${seg(id)}`),
      put: (url, zip, hosts) => c.putUpload(url, zip, "application/zip", hosts),
      // deliberately no revert: our code never undoes an import (README section 5)
    },
    licensees: {
      list: () => read<Licensee[]>("/licensees"),
      get: (id) => read<Licensee>(`/licensees/${seg(id)}`),
    },
    leads: {
      create: (req) => write<Lead>("/leads", req, "leads.create"),
      search: (req) => read<SearchPage<Lead>>("/leads/search", req),
    },
  };
}
