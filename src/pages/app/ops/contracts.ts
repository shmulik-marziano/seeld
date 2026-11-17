// Ops Console: typed data contracts + pure helpers. NO React, NO imports from src/platform (public/platform
// isolation test) and no Supabase. The screens talk only to `OpsDataSource`; the mock adapter (mockData.ts) is the
// phase-1 implementation, and a Supabase RPC-backed one replaces it later (docs/platform/OPS-CONSOLE.md).
// Rule: no PII anywhere in these shapes. Customers appear as masked refs (customerRef), people as role slots.

// ───────────────────────── roles and capabilities ─────────────────────────

/** Roles are data (a column/claim), never personal names. */
export const OPS_ROLES = ["agent", "manager", "super_admin"] as const;
export type OpsRole = (typeof OPS_ROLES)[number];

export const OPS_CAPABILITIES = [
  "ops.view", // every read-only operational screen
  "ops.audit.security", // security-category audit events (login, MFA, role changes)
  "ops.deadletter.act", // retry / discard dead letters (also needs TOTP step-up, later phase)
  "ops.settings.view", // system settings screen
  "ops.settings.edit", // change settings (later phase, TOTP step-up)
] as const;
export type OpsCapability = (typeof OPS_CAPABILITIES)[number];

const CAPABILITY_MATRIX: Record<OpsRole, readonly OpsCapability[]> = {
  agent: [],
  manager: ["ops.view"],
  super_admin: ["ops.view", "ops.audit.security", "ops.deadletter.act", "ops.settings.view", "ops.settings.edit"],
};

export function isOpsRole(v: unknown): v is OpsRole {
  return typeof v === "string" && (OPS_ROLES as readonly string[]).includes(v);
}

export function can(role: OpsRole | null | undefined, cap: OpsCapability): boolean {
  if (!role) return false;
  return CAPABILITY_MATRIX[role].includes(cap);
}

/** The console is visible to manager and super_admin only. */
export function hasOpsAccess(role: OpsRole | null | undefined): boolean {
  return can(role, "ops.view");
}

export const ROLE_LABEL: Record<OpsRole, string> = { agent: "סוכן", manager: "מנהל תפעול", super_admin: "מנהל על" };

// ───────────────────────── shared primitives ─────────────────────────

export type Tone = "ok" | "warn" | "bad" | "info" | "muted";
export type RangeKey = "today" | "7d" | "30d";
export const RANGE_LABEL: Record<RangeKey, string> = { today: "היום", "7d": "7 ימים", "30d": "30 ימים" };

export interface OpsFilters {
  range: RangeKey;
  /** null = all agents. */
  agentId: string | null;
}

export interface AgentRef {
  id: string;
  /** A role slot label, never a personal name. */
  label: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  /** ISO time the snapshot was computed server-side (summary tables are refreshed, not live). */
  asOf: string;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export type SystemId = "salesforce" | "surense";
export const SYSTEM_LABEL: Record<SystemId, string> = { salesforce: "Salesforce", surense: "Surense" };

export type SyncStatus = "synced" | "pending" | "retrying" | "failed" | "dead_letter" | "not_applicable";
export const SYNC_LABEL: Record<SyncStatus, string> = {
  synced: "מסונכרן",
  pending: "ממתין",
  retrying: "בניסיון חוזר",
  failed: "נכשל",
  dead_letter: "הודעה שנכשלה",
  not_applicable: "לא רלוונטי",
};
export const SYNC_TONE: Record<SyncStatus, Tone> = {
  synced: "ok",
  pending: "info",
  retrying: "warn",
  failed: "bad",
  dead_letter: "bad",
  not_applicable: "muted",
};

// ───────────────────────── processes and funnels ─────────────────────────

export const PROCESS_TYPES = ["questionnaire", "report_generation", "joining", "agent_appointment", "information_order"] as const;
export type ProcessType = (typeof PROCESS_TYPES)[number];
export const PROCESS_LABEL: Record<ProcessType, string> = {
  questionnaire: "שאלון",
  report_generation: "הפקת דוח",
  joining: "הצטרפות",
  agent_appointment: "כתב מינוי",
  information_order: "הזמנת מידע",
};

export interface FunnelStep {
  key: string;
  label: string;
  /** Count of entities that reached this step in the range. Non-increasing is NOT enforced (re-entries happen). */
  count: number;
}

export interface FunnelDefinition {
  id: "leads" | "questionnaire" | ProcessType;
  title: string;
  /** The one question this funnel answers (shown under the title). */
  question: string;
  steps: FunnelStep[];
}

export interface FunnelStepView extends FunnelStep {
  /** Share of the first step, 0..1. */
  ofFirst: number;
  /** Share of the previous step, 0..1 (1 for the first step). */
  ofPrev: number;
  /** Entities lost between the previous step and this one (>= 0). */
  dropped: number;
  /** True for the single step with the largest relative drop (needs >= 2 steps and a real drop). */
  biggestDrop: boolean;
}

export interface FunnelReport {
  asOf: string;
  filters: OpsFilters;
  funnels: FunnelDefinition[];
}

// ───────────────────────── overview ─────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";
export interface OpsAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  since: string;
  source: "queue" | "sync" | "sla" | "pipeline" | "security";
  /** Console route to open for this alert. */
  href: string;
}

export interface TodayStripItem {
  key: string;
  label: string;
  value: number;
  /** Same metric yesterday at the same hour (null = no baseline). */
  previous: number | null;
}

export interface QueueDepth {
  system: SystemId;
  pending: number;
  inFlight: number;
  retrying: number;
  deadLetter: number;
  /** Seconds the oldest pending message has waited (0 = empty). */
  oldestPendingSec: number;
  /** Messages completed per hour, last 24 hours, oldest first (24 points). */
  throughput24h: number[];
}

export interface SlaBreachSummary {
  process: ProcessType;
  breached: number;
  atRisk: number;
  /** Target in minutes for the stage clock of this process. */
  targetMin: number;
}

export interface OpsOverview {
  asOf: string;
  today: TodayStripItem[];
  alerts: OpsAlert[];
  syncTiles: SystemHealthTile[];
  queues: QueueDepth[];
  sla: SlaBreachSummary[];
}

// ───────────────────────── work queue ─────────────────────────

export type Priority = "high" | "normal" | "low";
export type UrgencyBand = "critical" | "high" | "normal" | "low";

export interface LastAction {
  label: string;
  at: string;
}

export interface WorkItem {
  id: string;
  /** Masked reference, e.g. "C-4821". Never a name or national id. */
  customerRef: string;
  kind: "lead" | "customer";
  /** What needs doing now, in plain Hebrew. */
  nextStep: string;
  process: ProcessType;
  stage: string;
  assignedAgentId: string | null;
  lastAction: LastAction;
  syncStatus: SyncStatus;
  priority: Priority;
  /** When the current stage's clock runs out. */
  slaDueAt: string;
  createdAt: string;
  /** Computed by `urgencyScore`; the adapter returns it so the server can own the formula later. */
  urgency: number;
}

export interface WorkQueueQuery extends PageQuery {
  agentId?: string | null;
  /** "unassigned" selects items with no agent. */
  assignment?: "all" | "unassigned";
  syncStatus?: SyncStatus | "all";
  band?: UrgencyBand | "all";
  search?: string;
}

// ───────────────────────── process tracking ─────────────────────────

export type SlaState = "ok" | "at_risk" | "breached";

export interface ProcessInstance {
  id: string;
  process: ProcessType;
  customerRef: string;
  stage: string;
  stageIndex: number;
  stageCount: number;
  startedAt: string;
  stageEnteredAt: string;
  /** Allowed time in the current stage, minutes. */
  stageTargetMin: number;
  ownerAgentId: string | null;
  nextAction: string;
  nextActionDueAt: string | null;
  syncStatus: SyncStatus;
}

export interface ProcessQuery extends PageQuery {
  process?: ProcessType | "all";
  sla?: SlaState | "all";
  agentId?: string | null;
}

// ───────────────────────── inquiries ─────────────────────────

export type InquiryChannel = "form" | "phone" | "email" | "whatsapp" | "portal";
export const CHANNEL_LABEL: Record<InquiryChannel, string> = {
  form: "טופס באתר",
  phone: "טלפון",
  email: "דוא״ל",
  whatsapp: "וואטסאפ",
  portal: "אזור אישי",
};
export type InquiryStatus = "new" | "in_progress" | "waiting_customer" | "closed";
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "חדשה",
  in_progress: "בטיפול",
  waiting_customer: "ממתינה ללקוח",
  closed: "נסגרה",
};
export type InquiryKind = "question" | "service_request" | "document_request" | "complaint" | "callback";
export const INQUIRY_KIND_LABEL: Record<InquiryKind, string> = {
  question: "שאלה",
  service_request: "בקשת שירות",
  document_request: "בקשת מסמך",
  complaint: "תלונה",
  callback: "חזרה טלפונית",
};

export interface Inquiry {
  id: string;
  customerRef: string | null;
  channel: InquiryChannel;
  kind: InquiryKind;
  /** Short machine-made title built from codes, never free customer text (no PII in the console). */
  title: string;
  status: InquiryStatus;
  receivedAt: string;
  firstResponseDueAt: string;
  firstResponseAt: string | null;
  assignedAgentId: string | null;
}

export interface InquiryQuery extends PageQuery {
  status?: InquiryStatus | "all";
  channel?: InquiryChannel | "all";
  kind?: InquiryKind | "all";
}

// ───────────────────────── integrations ─────────────────────────

export type AdapterStatus = "ready" | "placeholder" | "disabled";
export const ADAPTER_LABEL: Record<AdapterStatus, string> = { ready: "פעיל", placeholder: "טרם חובר", disabled: "מושבת" };
export type HealthState = "healthy" | "degraded" | "down" | "idle";
export const HEALTH_LABEL: Record<HealthState, string> = { healthy: "תקין", degraded: "מדורדר", down: "מושבת", idle: "לא פעיל" };
export const HEALTH_TONE: Record<HealthState, Tone> = { healthy: "ok", degraded: "warn", down: "bad", idle: "muted" };

export interface SystemHealthTile {
  system: SystemId;
  adapter: AdapterStatus;
  state: HealthState;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  /** Failure rate over the last hour, 0..1 (null when nothing was attempted). */
  failureRate1h: number | null;
  pending: number;
  retrying: number;
  deadLetter: number;
}

export interface FailureKindCount {
  /** Matches the worker's failure kinds (queue/backoff.ts): transient, rate_limited, record_locked, permanent ... */
  kind: string;
  label: string;
  count: number;
}

export interface PipelineStatus {
  id: string;
  label: string;
  state: HealthState;
  lastRunAt: string | null;
  note: string;
}

export interface IntegrationHealth {
  asOf: string;
  systems: Array<SystemHealthTile & { queue: QueueDepth; failures24h: FailureKindCount[]; policy: { batchSize: number; maxAttempts: number; drainIntervalSec: number } }>;
  pipelines: PipelineStatus[];
}

// ───────────────────────── dead letters ─────────────────────────

export interface DeadLetter {
  id: string;
  destination: SystemId;
  customerRef: string;
  eventType: string;
  reasonCode: string;
  reasonText: string;
  attempts: number;
  firstFailedAt: string;
  deadAt: string;
  /** Later messages of this customer are paused until this one is resolved (queue ordering rule). */
  customerHalted: boolean;
  haltedBehind: number;
}

export interface DeadLetterQuery extends PageQuery {
  destination?: SystemId | "all";
  reasonCode?: string | "all";
}

// ───────────────────────── audit log ─────────────────────────

export type AuditCategory = "business" | "security";
export interface AuditEntry {
  id: string;
  at: string;
  category: AuditCategory;
  actorKind: "user" | "api_client" | "system";
  /** Role slot label, e.g. "מנהל תפעול". Never a personal name. */
  actorLabel: string;
  action: string;
  actionLabel: string;
  resourceType: string | null;
  resourceId: string | null;
  requestId: string | null;
  /** Small non-PII metadata (codes, counts). */
  meta: Record<string, string | number | boolean>;
}

export interface AuditQuery extends PageQuery {
  category?: AuditCategory | "all";
  actorKind?: AuditEntry["actorKind"] | "all";
  search?: string;
}

// ───────────────────────── settings (read-only in phase 1) ─────────────────────────

export type VisibilityMode = "shared" | "owner_only" | "owner_and_managers";
export const VISIBILITY_LABEL: Record<VisibilityMode, string> = {
  shared: "משותף: כל הסוכנים רואים הכול",
  owner_only: "לפי בעלות: כל סוכן רואה את שלו",
  owner_and_managers: "לפי בעלות, ומנהלים רואים הכול",
};

export interface AssignmentRule {
  id: string;
  order: number;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface AlertRecipient {
  id: string;
  /** A role or group, never an address. */
  audience: string;
  channel: "in_app" | "email" | "sms";
  severities: AlertSeverity[];
}

export interface FeatureFlagView {
  name: string;
  description: string;
  enabled: boolean;
  /** Where the value comes from: static default, env override or database. */
  source: "default" | "env" | "database";
}

export interface SlaTarget {
  process: ProcessType;
  stage: string;
  targetMin: number;
}

export interface OpsSettings {
  asOf: string;
  visibilityMode: VisibilityMode;
  assignmentRules: AssignmentRule[];
  alertRecipients: AlertRecipient[];
  flags: FeatureFlagView[];
  slaTargets: SlaTarget[];
  polling: { overviewSec: number; listsSec: number };
}

// ───────────────────────── the data source ─────────────────────────

/**
 * Everything the console reads. Phase 1: mockData.ts. Later: a Supabase RPC-backed implementation
 * (one RPC per method, role checked inside the RPC, never trusting the client). Screens must not import
 * anything but this interface and the types above.
 */
export interface OpsDataSource {
  readonly kind: "mock" | "live";
  listAgents(): Promise<AgentRef[]>;
  getOverview(filters: OpsFilters): Promise<OpsOverview>;
  getFunnels(filters: OpsFilters): Promise<FunnelReport>;
  getWorkQueue(q: WorkQueueQuery): Promise<Page<WorkItem>>;
  getProcesses(q: ProcessQuery): Promise<Page<ProcessInstance>>;
  getInquiries(q: InquiryQuery): Promise<Page<Inquiry>>;
  getIntegrationHealth(): Promise<IntegrationHealth>;
  getDeadLetters(q: DeadLetterQuery): Promise<Page<DeadLetter>>;
  getAuditLog(q: AuditQuery, role: OpsRole): Promise<Page<AuditEntry>>;
  getSettings(): Promise<OpsSettings>;
}

// ───────────────────────── pure helpers ─────────────────────────

const MIN = 60_000;

export function minutesBetween(fromIso: string, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - new Date(fromIso).getTime()) / MIN));
}

/** Hebrew compact duration: "12 דק׳", "3 שע׳", "2 ימים". Negative or NaN becomes "0 דק׳". */
export function formatAge(minutes: number): string {
  const m = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
  if (m < 60) return `${m} דק׳`;
  if (m < 60 * 48) {
    const h = Math.round(m / 60);
    return `${h} שע׳`;
  }
  const d = Math.round(m / (60 * 24));
  return d === 1 ? "יום" : `${d} ימים`;
}

/** SLA clock state for an open stage: ok < 75% of target, at_risk 75..100%, breached beyond target. */
export function slaState(ageMin: number, targetMin: number): SlaState {
  if (!(targetMin > 0)) return "ok";
  if (ageMin > targetMin) return "breached";
  if (ageMin >= targetMin * 0.75) return "at_risk";
  return "ok";
}

export const SLA_LABEL: Record<SlaState, string> = { ok: "בזמן", at_risk: "בסיכון", breached: "חריגה" };
export const SLA_TONE: Record<SlaState, Tone> = { ok: "ok", at_risk: "warn", breached: "bad" };

export interface UrgencyInput {
  priority: Priority;
  syncStatus: SyncStatus;
  /** Minutes until the SLA due time. Negative = already late. */
  minutesToDue: number;
  /** Minutes since the last recorded action. */
  idleMin: number;
  assigned: boolean;
}

/**
 * Urgency 0..100. Deterministic and explainable (shown in the UI tooltip):
 *  - SLA pressure up to 50 (late = 50, due within 4h scales up),
 *  - priority up to 20, - sync trouble up to 15 (dead letter 15, failed 12, retrying 6),
 *  - idle time up to 10 (caps at 3 days), - unassigned adds 5.
 */
export function urgencyScore(i: UrgencyInput): number {
  let s = 0;
  if (i.minutesToDue <= 0) s += 50;
  else if (i.minutesToDue < 240) s += Math.round(50 * (1 - i.minutesToDue / 240) * 0.8) + 10;
  else if (i.minutesToDue < 1440) s += Math.round(10 * (1 - (i.minutesToDue - 240) / 1200));
  s += i.priority === "high" ? 20 : i.priority === "normal" ? 8 : 0;
  s += i.syncStatus === "dead_letter" ? 15 : i.syncStatus === "failed" ? 12 : i.syncStatus === "retrying" ? 6 : 0;
  s += Math.min(10, Math.round((Math.max(0, i.idleMin) / (60 * 72)) * 10));
  if (!i.assigned) s += 5;
  return Math.max(0, Math.min(100, s));
}

export function urgencyBand(score: number): UrgencyBand {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "normal";
  return "low";
}

export const BAND_LABEL: Record<UrgencyBand, string> = { critical: "דחוף מאוד", high: "דחוף", normal: "רגיל", low: "נמוך" };
export const BAND_TONE: Record<UrgencyBand, Tone> = { critical: "bad", high: "warn", normal: "info", low: "muted" };

/** Adds conversion shares, drop counts and flags the single biggest relative drop. Pure. */
export function funnelView(steps: readonly FunnelStep[]): FunnelStepView[] {
  const first = steps[0]?.count ?? 0;
  const out: FunnelStepView[] = steps.map((s, i) => {
    const prev = i === 0 ? s.count : steps[i - 1].count;
    return {
      ...s,
      ofFirst: first > 0 ? s.count / first : 0,
      ofPrev: i === 0 ? 1 : prev > 0 ? s.count / prev : 0,
      dropped: i === 0 ? 0 : Math.max(0, prev - s.count),
      biggestDrop: false,
    };
  });
  let worst = -1;
  let worstLoss = 0;
  out.forEach((s, i) => {
    if (i === 0) return;
    const loss = 1 - s.ofPrev;
    if (s.dropped > 0 && loss > worstLoss) {
      worstLoss = loss;
      worst = i;
    }
  });
  if (worst >= 0) out[worst].biggestDrop = true;
  return out;
}

/** Overall conversion first -> last step, 0..1. */
export function overallConversion(steps: readonly FunnelStep[]): number {
  if (steps.length < 2 || steps[0].count <= 0) return 0;
  return steps[steps.length - 1].count / steps[0].count;
}

export function formatPct(share: number, digits = 0): string {
  if (!Number.isFinite(share)) return "0%";
  return `${(share * 100).toFixed(digits)}%`;
}

/** Health of one destination queue from its counters. Pure, so the real adapter can reuse it. */
export function queueHealth(q: Pick<QueueDepth, "pending" | "retrying" | "deadLetter" | "oldestPendingSec">, adapter: AdapterStatus, lastSuccessAt: string | null, now: Date): HealthState {
  if (adapter !== "ready") return "idle";
  const sinceOk = lastSuccessAt ? (now.getTime() - new Date(lastSuccessAt).getTime()) / 1000 : Infinity;
  if (q.pending > 0 && sinceOk > 30 * 60) return "down";
  if (q.deadLetter > 0 || q.retrying > 10 || q.oldestPendingSec > 15 * 60) return "degraded";
  return "healthy";
}

/** Change vs a baseline, for the "today" strip. null when there is no baseline. */
export function deltaOf(value: number, previous: number | null): { diff: number; pct: number | null } | null {
  if (previous === null) return null;
  const diff = value - previous;
  return { diff, pct: previous > 0 ? diff / previous : null };
}

export function paginate<T>(rows: readonly T[], q: PageQuery, asOf: string): Page<T> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(q.pageSize ?? 15)));
  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(lastPage, Math.max(1, Math.floor(q.page ?? 1)));
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize, asOf };
}

/** Which audit categories a role may read. */
export function auditCategoriesFor(role: OpsRole): AuditCategory[] {
  return can(role, "ops.audit.security") ? ["business", "security"] : can(role, "ops.view") ? ["business"] : [];
}

/** Console routes (single source for in-console links). */
export const OPS_PATH = {
  processes: "/app/ops/processes",
  integrations: "/app/ops/integrations",
  deadLetters: "/app/ops/dead-letters",
} as const;
