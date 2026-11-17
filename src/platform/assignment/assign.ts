// Lead assignment. Pure twin of public.assign_lead (08_dashboard_tables.sql). Rules are DATA
// (public.assignment_rules); no agent names or ids are hard coded anywhere.
// Order: manual override -> sticky (existing customer keeps their agent) -> round robin / least loaded under a load cap
// -> no capacity: null agent (shared pool, visibility follows platform_settings.visibility_mode).

export type LineOfBusiness = "insurance" | "finance";
export type AssignmentRole = "insurance_lead" | "finance_lead";
export type Strategy = "round_robin" | "least_loaded";

export interface AssignmentRule {
  priority: number; // lower = evaluated first
  lineOfBusiness: LineOfBusiness | "any";
  requiredRole: AssignmentRole | null; // null = any active agent
  sticky: boolean;
  strategy: Strategy;
  loadCap: number | null; // max active leads+customers per agent; null = no cap
  enabled: boolean;
}

export interface AgentCandidate {
  agentId: string;
  roles: string[];
  active: boolean;
  activeLoad: number;
  lastAssignedAtMs: number | null;
}

export interface AssignInput {
  lineOfBusiness: LineOfBusiness;
  existingAgentId?: string | null;
  manualOverrideAgentId?: string | null;
  agents: AgentCandidate[];
  rules: AssignmentRule[];
}

export type AssignReason = "manual_override" | "sticky" | "round_robin" | "least_loaded" | "no_rule" | "no_capacity";
export interface AssignResult {
  agentId: string | null;
  reason: AssignReason;
  /** manual overrides must be written to audit_log by the caller. */
  audit: boolean;
}

export function assignAgent(input: AssignInput): AssignResult {
  if (input.manualOverrideAgentId) return { agentId: input.manualOverrideAgentId, reason: "manual_override", audit: true };

  const rule = [...input.rules]
    .filter((r) => r.enabled && (r.lineOfBusiness === "any" || r.lineOfBusiness === input.lineOfBusiness))
    .sort((a, b) => a.priority - b.priority)[0];
  if (!rule) return { agentId: null, reason: "no_rule", audit: false };

  const eligible = (a: AgentCandidate) => a.active && (rule.requiredRole === null || a.roles.includes(rule.requiredRole));

  if (rule.sticky && input.existingAgentId) {
    const keep = input.agents.find((a) => a.agentId === input.existingAgentId);
    if (keep && eligible(keep)) return { agentId: keep.agentId, reason: "sticky", audit: false };
  }

  const pool = input.agents.filter((a) => eligible(a) && (rule.loadCap === null || a.activeLoad < rule.loadCap));
  if (pool.length === 0) return { agentId: null, reason: "no_capacity", audit: false };

  const sorted = [...pool].sort((a, b) => {
    if (rule.strategy === "least_loaded" && a.activeLoad !== b.activeLoad) return a.activeLoad - b.activeLoad;
    const la = a.lastAssignedAtMs ?? -1;
    const lb = b.lastAssignedAtMs ?? -1;
    return la !== lb ? la - lb : a.agentId < b.agentId ? -1 : 1;
  });
  return { agentId: sorted[0].agentId, reason: rule.strategy, audit: false };
}
