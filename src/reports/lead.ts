// Lead payload for the locked-block call to action. Shape matches supabase save_lead (see src/questionnaires/adapters.ts),
// with origin 'report' and an extra `locked_block` key naming the block that was clicked. Nothing is sent from here.
import type { ContactDept } from "@/lib/contacts";
import type { LockReason } from "./types";

export interface ReportLeadInput {
  blockId: string;
  reason: LockReason;
  department: ContactDept;
  firstName: string;
  phone: string;
  note: string;
}

export interface ReportLeadPayload {
  p_idempotency_key: string;
  p_fields: Record<string, string>;
  p_line_of_business: "insurance" | "finance";
  p_national_id: null;
  p_agency_id: null;
  p_request_id: null;
  /** not an RPC argument: carried next to it so the server can set the lead origin */
  origin: "report";
  /** not an RPC argument: the report block the visitor clicked */
  locked_block: string;
}

const hash = (str: string) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function buildLeadPayload(i: ReportLeadInput, sessionId: string): ReportLeadPayload {
  const fields: Record<string, string> = {
    first_name: i.firstName.trim(),
    contact_phone: i.phone.trim(),
    lead_topics: `report:${i.blockId}`,
    lead_note: i.note.trim(),
    lock_reason: i.reason,
  };
  for (const k of Object.keys(fields)) if (!fields[k]) delete fields[k];
  return {
    p_idempotency_key: `lead:report:${sessionId}:${i.blockId}:${hash(JSON.stringify(fields))}`,
    p_fields: fields,
    p_line_of_business: i.department === "insurance" ? "insurance" : "finance",
    p_national_id: null,
    p_agency_id: null,
    p_request_id: null,
    origin: "report",
    locked_block: i.blockId,
  };
}
