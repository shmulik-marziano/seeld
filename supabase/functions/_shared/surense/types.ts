// Hand-written minimal Surense API types, derived from the merged openapi.json (2026-11-20). Only the fields this
// connector reads or sends; every response field is optional because the live API omits nulls freely.
// Do NOT add the other ~220 schemas here: fields we do not use must not be typed into reach.

export type Uuid = string;

/** Enumerated values travel as {code} and come back with a Hebrew description. */
export interface CodeValue {
  code: number;
  description?: string;
}

/** Error body of every failing call (components.schemas.ApiError). */
export interface ApiErrorBody {
  statusCode?: number;
  errors?: Array<{ code?: number; message?: string; details?: unknown }>;
  error?: { code?: number; message?: string };
}

// ---- search (PaginatedOrCursorSearchRequest) ----
export type FilterOperator =
  | "inRange" | "notInRange" | "greaterThan" | "lessThan" | "equals" | "isAnyOf" | "isNoneOf" | "notEquals" | "isEmpty"
  | "greaterThanOrEqual";

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value?: string | string[];
}

export interface SearchRequest {
  filters?: SearchFilter[];
  filtersOperator?: "and" | "or";
  sorts?: Array<{ field: string; dir?: "asc" | "desc" }>;
  /** offset paging (<= 100 rows per page, start <= 10000) */
  startRow?: number;
  endRow?: number;
  /** cursor paging (pageSize 1..100); empty cursor = first page */
  cursor?: string;
  pageSize?: number;
}

export interface SearchPage<T> {
  results?: T[];
  hasNextPage?: boolean;
  nextCursor?: string | null;
  totalElements?: number;
}

// ---- customers ----
/** CustomerValue: the subset the mirror reads. Everything personal is copied only into details_enc. */
export interface Customer {
  id: Uuid;
  agencyId?: Uuid;
  createdDate?: string;
  lastModifiedDate?: string;
  version?: number;
  duplicate?: boolean;
  statusId?: Uuid;
  statusName?: string;
  statusActive?: boolean;
  sourceId?: Uuid;
  sourceName?: string;
  classId?: Uuid;
  className?: string;
  managerId?: Uuid;
  managers?: Uuid[];
  sensitive?: boolean;
  creationSource?: number;
  idType?: CodeValue;
  idNumber?: string;
  idNumberLocked?: boolean;
  cellNumberVerified?: boolean;
  death?: boolean;
  minor?: boolean;
  swiftnessProxySignDate?: string;
  swiftnessProxyExpiryDate?: string;
  hbProxySignDate?: string;
  hbProxyExpiryDate?: string;
  policiesProxySignDate?: string;
  policiesProxyExpiryDate?: string;
  lastE9100DataDate?: string;
  [personal: string]: unknown;
}

/** POST /customers and POST /customers/lead_customer (createLeadCustomer: idType/idNumber optional). */
export interface CreateCustomerRequest {
  managerId: Uuid;
  idType?: CodeValue | number;
  idNumber?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber1?: string;
  email1?: string;
  birthDate?: string;
  gender?: CodeValue | number;
  statusId?: Uuid;
  sourceId?: Uuid;
  classId?: Uuid;
  leadId?: Uuid;
  forceCreation?: boolean;
  [field: string]: unknown;
}

export interface CustomerBrief {
  id: Uuid;
  found?: boolean;
  accessible?: boolean;
  statusId?: Uuid;
  statusActive?: boolean;
  classId?: Uuid;
  sourceId?: Uuid;
  [personal: string]: unknown;
}

// ---- data proxies ----
export interface ProxyPolicy {
  type: number;
  company: number;
  policy: string;
  sivugPolisa?: "אישי" | "קבוצתי" | "קבוצתי_קופת_חולים";
}

export interface ProxiesInviteRequest {
  customerId?: Uuid;
  leadId?: Uuid;
  cellNumber?: string;
  email?: string;
  licenseeId?: Uuid;
  nispahAlef?: boolean;
  swiftnessAccountId?: Uuid;
  nispahHei?: boolean;
  nispahBet?: boolean;
  policies?: ProxyPolicy[];
  partner?: boolean;
  partnerCellNumber?: string;
  partnerEmail?: string;
}

export interface ProxiesInviteResponse {
  url?: string;
  message?: string;
  partnerUrl?: string;
  partnerMessage?: string;
}

// ---- swiftness (clearing house) ----
export interface SwiftnessAccount {
  id: Uuid;
  accountName?: string;
  /** spec says a string enum; the live API returned {code, description} (README section 6) */
  status?: string | CodeValue;
  defaultAccount?: boolean;
}

export interface E9100SubmitRequest {
  customerId: Uuid;
  /** Swiftness account id */
  registrationId: Uuid;
  /** YYYY-MM-DD */
  proxyApprovalDate: string;
}

export interface E9100Event {
  id: Uuid;
  customerId?: Uuid;
  swiftnessAccountId?: Uuid;
  misparMislaka?: string;
  rejected?: boolean;
  e9100Progress?: number;
  e9100CompletedDate?: string;
  records?: Array<{ id?: Uuid; type?: string; received?: boolean; size?: number; mime?: string }>;
  [personal: string]: unknown;
}

export interface E9100DownloadRequest {
  customerId: Uuid;
  eventId?: Uuid;
  misparMislaka?: string;
}

export interface E9100DownloadResponse {
  customerId?: Uuid;
  eventId?: Uuid;
  misparMislaka?: string;
  files?: Array<{ name?: string; url?: string }>;
}

// ---- portfolio ----
export interface PortfolioRequest {
  mode: "טרום_טיפול" | "פרודוקציה";
  misparMislaka?: string;
  hbValidityDate?: string;
  month?: string;
}

export interface PortfolioProduct {
  id: Uuid;
  customerId?: Uuid;
  hidden?: boolean;
  source?: string;
  companyId?: number;
  productId?: number;
  type?: number;
  lastModifiedDate?: string;
  [personal: string]: unknown;
}

export interface Portfolio {
  misparMislaka?: string;
  hbValidityDate?: string;
  productiaMonth?: string;
  products?: PortfolioProduct[];
  [other: string]: unknown;
}

export interface PortfolioHistoryEntry {
  production?: boolean;
  source?: number;
  misparMislaka?: string;
  e9100Progress?: number;
  validityDate?: string;
  validityMonth?: string;
}

// ---- documents ----
export interface SurenseDocument {
  id: Uuid;
  customerId?: Uuid;
  leadId?: Uuid;
  typeId?: Uuid;
  name?: string;
  mime?: string;
  fileExtension?: string;
  size?: number;
  source?: string;
  systemGenerated?: boolean;
  companyId?: number;
  createdDate?: string;
  lastModifiedDate?: string;
  [personal: string]: unknown;
}

export interface DocumentSearchRequest extends Omit<SearchRequest, "cursor" | "pageSize"> {
  includeIndirect?: boolean;
  excludeReports?: boolean;
  excludeMeetingSummaries?: boolean;
}

export interface DocumentSearchPage {
  results?: SurenseDocument[];
  hasNextPage?: boolean;
  totalElements?: number;
}

export interface DocumentType {
  id: Uuid;
  title?: string;
  active?: boolean;
}

export interface UploadInitiateRequest {
  documents: Array<{ name: string; mime?: string }>;
}
export interface UploadInitiateResponse {
  results?: Array<{ id: Uuid; name?: string; uploadUrl?: string }>;
}
export interface UploadFinalizeRequest {
  documents: Array<{ id: Uuid; name: string }>;
  customerId?: Uuid;
  leadId?: Uuid;
  workflowId?: Uuid;
  meetingId?: Uuid;
  employerId?: Uuid;
  type?: Uuid;
  companyId?: number;
  accountPolicyNumber?: string;
}
export interface UploadFinalizeResponse {
  results?: Array<{ id: Uuid; name?: string; duplicateDocId?: Uuid; duplicateDocName?: string }>;
}

export interface DocumentUrlsRequest {
  documents: Array<{ docId: Uuid; inline: boolean; shorten: boolean }>;
}
export interface DocumentUrlsResponse {
  entries?: Array<{ documentId?: Uuid; name?: string; url?: string }>;
}

// ---- data import ----
export interface DataImportProvider {
  id: Uuid;
  name?: string;
  description?: string;
  properties?: Record<string, unknown>;
  subProviders?: Array<{ id: Uuid; name?: string }>;
}
export interface DataImportInitiateRequest {
  provider: Uuid;
  files: Array<{ fileName: string; fileSize?: number }>;
  params?: Record<string, unknown>;
  agencyId?: Uuid;
  multiSet?: boolean;
}
export interface DataImportRecord {
  id: Uuid;
  status?: "INITIATED" | "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
  failureReason?: string;
  [other: string]: unknown;
}
export interface DataImportInitiateResponse {
  record?: DataImportRecord;
  uploadUrl?: string;
  records?: Array<{ record?: DataImportRecord; uploadUrl?: string }>;
}

// ---- licensees / users / leads ----
export interface Licensee {
  id: Uuid;
  name?: string | null;
  accessible?: boolean;
  type?: unknown;
  licenseNumber?: string | null;
  [personal: string]: unknown;
}

/** GET /user/info: not in the spec; keys verified live on 2026-11-20 (README section 6). */
export interface UserInfo {
  userId?: Uuid;
  agencyId?: Uuid;
  accountId?: Uuid;
  name?: string;
  permissions?: unknown;
  agencyAdmin?: boolean;
  tenantAdmin?: boolean;
  [personal: string]: unknown;
}

export interface CreateLeadRequest {
  typeId: Uuid;
  externalId?: string;
  reuseOpenLead?: boolean;
  customerId?: Uuid;
  ownerId?: Uuid;
  managerId?: Uuid;
  assignedUserId?: Uuid;
  sourceId?: Uuid;
  statusId?: Uuid;
  templateId?: Uuid;
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  phoneNumber1?: string;
  email?: string;
  notes?: string;
  leadDate?: string;
  forceCreation?: boolean;
  [field: string]: unknown;
}

export interface Lead {
  id: Uuid;
  customerId?: Uuid;
  typeId?: Uuid;
  statusId?: Uuid;
  externalId?: string;
  [personal: string]: unknown;
}
