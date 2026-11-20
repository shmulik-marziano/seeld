// Pure mapping from Surense records to mirror rows (crm.surense_customers / _documents / _products).
// Rule: indexable columns hold only non-PII (Surense ids, status/class/source names and codes, manager id, timestamps,
// booleans, counts). Everything else goes into `details`, which the api.surense_*_upsert RPCs encrypt with
// private.pii_encrypt (Vault pii_enc_key) before it touches a table. The national id travels once as `national_id`
// and is turned into private.national_id_hmac in SQL; it is never stored in clear (the copy inside details is
// encrypted). Names, phones, e-mails, addresses, policy numbers and free text never land in an indexable column, nor do
// personal attributes (deceased, minor, sensitive): those stay in details.
import type { Customer, PortfolioProduct, SurenseDocument } from "./types.ts";
import { isUuid } from "./api.ts";
import { InputError } from "./errors.ts";

export const CUSTOMER_INDEX_KEYS = [
  "surense_id", "surense_agency_id", "manager_id", "manager_ids", "status_id", "status_name", "status_active", "class_id",
  "class_name", "source_id", "source_name", "creation_source", "id_type", "id_number_locked", "cell_verified", "duplicate",
  "swiftness_proxy_signed_on", "swiftness_proxy_expires_on", "hb_proxy_signed_on",
  "hb_proxy_expires_on", "policies_proxy_signed_on", "policies_proxy_expires_on", "last_e9100_data_on",
  "surense_created_at", "surense_modified_at", "surense_version",
] as const;
export const DOCUMENT_INDEX_KEYS = [
  "surense_id", "customer_surense_id", "lead_surense_id", "type_id", "mime", "file_extension", "size_bytes", "source",
  "system_generated", "company_id", "surense_created_at", "surense_modified_at",
] as const;
export const PRODUCT_INDEX_KEYS = [
  "surense_id", "customer_surense_id", "source", "company_id", "product_id", "product_type", "hidden", "surense_modified_at",
] as const;
/** transport-only keys: never a column */
export const TRANSPORT_KEYS = ["national_id", "details"] as const;

type Row<K extends readonly string[]> = { [P in K[number]]: unknown } & { details: Record<string, unknown> };
export type CustomerRow = Row<typeof CUSTOMER_INDEX_KEYS> & { national_id: string | null };
export type DocumentRow = Row<typeof DOCUMENT_INDEX_KEYS>;
export type ProductRow = Row<typeof PRODUCT_INDEX_KEYS>;

const ISO_TS = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const DATE = /^(\d{4}-\d{2}-\d{2})/;

const uuid = (v: unknown): string | null => (isUuid(v) ? v.toLowerCase() : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const int = (v: unknown): number | null => (typeof v === "number" && Number.isSafeInteger(v) ? v : null);
const ts = (v: unknown): string | null => (typeof v === "string" && ISO_TS.test(v) ? v : null);
const date = (v: unknown): string | null => (typeof v === "string" && DATE.test(v) ? DATE.exec(v)![1] : null);
/** short label (status/class/source names, enums): bounded, single line */
const label = (v: unknown, max = 80): string | null =>
  typeof v === "string" && v.trim() && v.length <= max && !/[\r\n]/.test(v) ? v.trim() : null;
const code = (v: unknown): number | null =>
  int(v) ?? (v && typeof v === "object" ? int((v as { code?: unknown }).code) : null);

/** strip display duplicates (…Formatted, …Uri, …WhatsAppUri) and the keys already held in columns */
function rest(rec: Record<string, unknown>, used: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (used.includes(k) || /(Formatted|Uri)$/.test(k) || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export function mapCustomer(c: Customer): CustomerRow {
  const id = uuid(c.id);
  if (!id) throw new InputError("bad_customer_id");
  const idType = code(c.idType);
  const nid = idType === 1 && typeof c.idNumber === "string" && /^\d{5,9}$/.test(c.idNumber.trim()) ? c.idNumber.trim() : null;
  const used = [
    "id", "agencyId", "managerId", "managers", "statusId", "statusName", "statusActive", "classId", "customerClassId", "className",
    "sourceId", "sourceName", "creationSource", "idNumberLocked", "cellNumberVerified", "duplicate",
    "createdDate", "lastModifiedDate", "version", "tenantId", "createdBy", "lastModifiedBy",
  ];
  return {
    surense_id: id,
    surense_agency_id: uuid(c.agencyId),
    manager_id: uuid(c.managerId),
    manager_ids: Array.isArray(c.managers) ? c.managers.map(uuid).filter((x): x is string => !!x).slice(0, 20) : [],
    status_id: uuid(c.statusId),
    status_name: label(c.statusName),
    status_active: bool(c.statusActive),
    class_id: uuid(c.classId ?? c.customerClassId),
    class_name: label(c.className),
    source_id: uuid(c.sourceId),
    source_name: label(c.sourceName),
    creation_source: int(c.creationSource),
    id_type: idType,
    id_number_locked: bool(c.idNumberLocked),
    cell_verified: bool(c.cellNumberVerified),
    duplicate: bool(c.duplicate),
    swiftness_proxy_signed_on: date(c.swiftnessProxySignDate),
    swiftness_proxy_expires_on: date(c.swiftnessProxyExpiryDate),
    hb_proxy_signed_on: date(c.hbProxySignDate),
    hb_proxy_expires_on: date(c.hbProxyExpiryDate),
    policies_proxy_signed_on: date(c.policiesProxySignDate),
    policies_proxy_expires_on: date(c.policiesProxyExpiryDate),
    last_e9100_data_on: date(c.lastE9100DataDate),
    surense_created_at: ts(c.createdDate),
    surense_modified_at: ts(c.lastModifiedDate),
    surense_version: int(c.version),
    national_id: nid,
    details: rest(c as Record<string, unknown>, used),
  };
}

export function mapDocument(d: SurenseDocument): DocumentRow {
  const id = uuid(d.id);
  if (!id) throw new InputError("bad_document_id");
  const ext = typeof d.fileExtension === "string" && /^[A-Za-z0-9]{1,10}$/.test(d.fileExtension) ? d.fileExtension.toLowerCase() : null;
  const mime = typeof d.mime === "string" && /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(d.mime) && d.mime.length <= 100 ? d.mime.toLowerCase() : null;
  const used = ["id", "customerId", "leadId", "typeId", "mime", "fileExtension", "size", "source", "systemGenerated", "companyId",
    "createdDate", "lastModifiedDate", "tenantId", "createdBy", "lastModifiedBy"];
  return {
    surense_id: id,
    customer_surense_id: uuid(d.customerId),
    lead_surense_id: uuid(d.leadId),
    type_id: uuid(d.typeId),
    mime,
    file_extension: ext,
    size_bytes: int(d.size),
    source: label(d.source, 40),
    system_generated: bool(d.systemGenerated),
    company_id: int(d.companyId),
    surense_created_at: ts(d.createdDate),
    surense_modified_at: ts(d.lastModifiedDate),
    details: rest(d as Record<string, unknown>, used), // name, notes, linked policy numbers: encrypted
  };
}

export function mapProduct(p: PortfolioProduct, customerId: string): ProductRow {
  const id = uuid(p.id);
  if (!id) throw new InputError("bad_product_id");
  const used = ["id", "customerId", "source", "companyId", "productId", "type", "hidden", "lastModifiedDate", "tenantId",
    "createdBy", "lastModifiedBy"];
  return {
    surense_id: id,
    customer_surense_id: uuid(p.customerId) ?? uuid(customerId),
    source: label(p.source, 40),
    company_id: int(p.companyId),
    product_id: int(p.productId),
    product_type: int(p.type),
    hidden: bool(p.hidden),
    surense_modified_at: ts(p.lastModifiedDate),
    details: rest(p as Record<string, unknown>, used), // policy number, balances, coverages: encrypted
  };
}
