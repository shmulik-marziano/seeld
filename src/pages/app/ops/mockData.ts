// Ops Console mock adapter (phase 1). Deterministic: the same `now` always yields the same data, so tests and
// screenshots are stable. All numbers here are DEMO values, not business facts. No PII: customers are masked refs,
// people are role slots. Replace by a Supabase RPC-backed OpsDataSource without touching the screens.
import {
  CHANNEL_LABEL,
  INQUIRY_KIND_LABEL,
  PROCESS_TYPES,
  auditCategoriesFor,
  minutesBetween,
  paginate,
  queueHealth,
  slaState,
  urgencyBand,
  urgencyScore,
} from "./contracts";
import type {
  AgentRef,
  AuditEntry,
  DeadLetter,
  FunnelDefinition,
  FunnelStep,
  Inquiry,
  InquiryChannel,
  InquiryKind,
  InquiryStatus,
  IntegrationHealth,
  OpsAlert,
  OpsDataSource,
  OpsFilters,
  OpsOverview,
  OpsSettings,
  Priority,
  ProcessInstance,
  ProcessType,
  QueueDepth,
  SlaBreachSummary,
  SyncStatus,
  SystemHealthTile,
  SystemId,
  WorkItem,
} from "./contracts";

export interface MockOptions {
  now?: Date;
  /** Simulated network delay per call. Tests pass 0. */
  latencyMs?: number;
  /** When set, every call rejects with this message (error-state demos and tests). */
  failWith?: string;
}

export const MOCK_AGENTS: AgentRef[] = [
  { id: "agent-1", label: "סוכן 1" },
  { id: "agent-2", label: "סוכן 2" },
];

/** Seeded PRNG so the dataset is stable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StageDef { name: string; targetMin: number; next: string }
export const STAGES: Record<ProcessType, StageDef[]> = {
  questionnaire: [
    { name: "פרטי קשר", targetMin: 30, next: "להתקשר ולהשלים פרטים" },
    { name: "פרופיל", targetMin: 120, next: "לשלוח תזכורת להשלמת השאלון" },
    { name: "מצב ביטוחי", targetMin: 240, next: "לבדוק תשובות ולסמן חוסרים" },
    { name: "נשלח לבדיקה", targetMin: 120, next: "לעבור על השאלון ולשייך" },
  ],
  report_generation: [
    { name: "ממתין לקבצים", targetMin: 2880, next: "להזכיר ללקוח להעלות קבצים" },
    { name: "פענוח", targetMin: 30, next: "לבדוק כשל פענוח" },
    { name: "סקירת דוח", targetMin: 240, next: "לסקור את הדוח לפני שליחה" },
    { name: "נשלח ללקוח", targetMin: 120, next: "לעקוב אחר צפייה בדוח" },
  ],
  joining: [
    { name: "מילוי פרטים", targetMin: 1440, next: "להשלים פרטים חסרים" },
    { name: "חתימה", targetMin: 2880, next: "להזכיר חתימה ללקוח" },
    { name: "אישור סוכן", targetMin: 240, next: "לאשר את ההצטרפות" },
    { name: "פתיחה במערכת", targetMin: 480, next: "לוודא פתיחה במערכת הליבה" },
  ],
  agent_appointment: [
    { name: "נשלח לחתימה", targetMin: 4320, next: "להזכיר חתימה ללקוח" },
    { name: "נחתם", targetMin: 480, next: "להגיש לחברה המבטחת" },
    { name: "הוגש לחברה", targetMin: 1440, next: "לעקוב אחר אישור החברה" },
  ],
  information_order: [
    { name: "הוזמן", targetMin: 60, next: "לוודא שההזמנה יצאה" },
    { name: "ממתין לאישור לקוח", targetMin: 1440, next: "לשלוח ללקוח תזכורת לאישור" },
    { name: "התקבל מהמסלקה", targetMin: 240, next: "להעביר לעיבוד" },
    { name: "עיבוד", targetMin: 60, next: "לבדוק תקלת עיבוד" },
  ],
};

const LAST_ACTIONS = ["נשלחה תזכורת", "שיחה יוצאת", "השאלון עודכן", "הקובץ התקבל", "שויך לסוכן", "הודעה נשלחה", "המסמך נחתם", "נוצר ליד"];
const REASONS: Array<{ code: string; text: string }> = [
  { code: "record_locked", text: "הרשומה נעולה במערכת היעד" },
  { code: "validation_failed", text: "שדה חובה חסר או לא תקין" },
  { code: "auth_expired", text: "פג תוקף הרשאת החיבור" },
  { code: "unknown_field", text: "שדה שאינו קיים במערכת היעד" },
  { code: "duplicate_conflict", text: "התנגשות עם רשומה קיימת" },
];
const EVENT_TYPES = ["lead.created", "customer.upserted", "case.updated", "task.created", "questionnaire.step_completed", "questionnaire.submitted"];

const FUNNEL_BASE: Array<Omit<FunnelDefinition, "steps"> & { steps: Array<[string, string, number]> }> = [
  {
    id: "leads",
    title: "לידים",
    question: "כמה פונים נכנסים, ואיפה הם נעצרים לפני שיחה עם הצוות?",
    steps: [["entry", "נכנסו לטופס", 68], ["topic", "בחרו נושא", 49], ["lead", "נוצר ליד", 41], ["assigned", "שויכו לסוכן", 38], ["contact", "קשר ראשון", 27], ["meeting", "שיחה או פגישה נקבעו", 14]],
  },
  {
    id: "questionnaire",
    title: "שאלונים",
    question: "באיזה צעד שאלון נעזב, וכמה מהשאלונים שהושלמו הגיעו למערכות?",
    steps: [["start", "התחילו", 52], ["s1", "צעד 1 הושלם", 44], ["s2", "צעד 2 הושלם", 38], ["s3", "צעד 3 הושלם", 29], ["submit", "נשלחו", 24], ["sync", "סונכרנו למערכות", 23]],
  },
  {
    id: "report_generation",
    title: "הפקת דוח",
    question: "כמה בקשות לדוח מגיעות לדוח מוכן, ואיפה הקבצים נתקעים?",
    steps: [["req", "דוח התבקש", 21], ["files", "קבצים התקבלו", 15], ["parsed", "פוענחו", 13], ["ready", "דוח מוכן", 12], ["viewed", "הלקוח צפה", 8]],
  },
  {
    id: "joining",
    title: "הצטרפות",
    question: "כמה לקוחות שהחלו להצטרף סיימו, ובאיזה שלב הם נעצרים?",
    steps: [["start", "התחילו", 14], ["details", "מילאו פרטים", 11], ["signed", "חתמו", 8], ["approved", "אושרו", 7], ["done", "הצטרפו", 6]],
  },
  {
    id: "agent_appointment",
    title: "חתימת כתב מינוי",
    question: "כמה כתבי מינוי נחתמו והוגשו, וכמה ממתינים לחתימה?",
    steps: [["sent", "נשלחו", 12], ["opened", "נפתחו", 9], ["signed", "נחתמו", 7], ["filed", "הוגשו לחברה", 5]],
  },
  {
    id: "information_order",
    title: "הזמנות מידע",
    question: "כמה הזמנות מידע חזרו מהמסלקה, וכמה נתקעות באישור הלקוח?",
    steps: [["ordered", "הוזמנו", 16], ["otp", "הלקוח אישר", 11], ["received", "התקבלו", 9], ["processed", "עובדו", 9]],
  },
];

const RANGE_MULT = { today: 1, "7d": 6.3, "30d": 24 } as const;

const iso = (now: Date, minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

export function buildFunnels(filters: OpsFilters): FunnelDefinition[] {
  const share = filters.agentId === "agent-1" ? 0.54 : filters.agentId === "agent-2" ? 0.46 : 1;
  const mult = RANGE_MULT[filters.range] * share;
  return FUNNEL_BASE.map((f) => {
    let prev = Infinity;
    const steps: FunnelStep[] = f.steps.map(([key, label, base]) => {
      const count = Math.min(prev, Math.round(base * mult));
      prev = count;
      return { key, label, count };
    });
    return { id: f.id, title: f.title, question: f.question, steps };
  });
}

interface Dataset {
  now: Date;
  processes: ProcessInstance[];
  work: WorkItem[];
  inquiries: Inquiry[];
  deadLetters: DeadLetter[];
  audit: AuditEntry[];
  queues: Record<SystemId, QueueDepth>;
  lastSuccess: Record<SystemId, string>;
  lastFailure: Record<SystemId, string>;
}

export function buildDataset(now: Date): Dataset {
  const rnd = mulberry32(20261117);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
  const between = (lo: number, hi: number) => lo + rnd() * (hi - lo);

  // processes
  const processes: ProcessInstance[] = [];
  const counts: Record<ProcessType, number> = { questionnaire: 12, report_generation: 9, joining: 8, agent_appointment: 6, information_order: 7 };
  let n = 0;
  for (const type of PROCESS_TYPES) {
    for (let i = 0; i < counts[type]; i++) {
      const stages = STAGES[type];
      const si = Math.floor(rnd() * stages.length);
      const st = stages[si];
      const age = Math.round(st.targetMin * between(0.1, 1.7));
      const owner = rnd() < 0.12 ? null : pick(MOCK_AGENTS).id;
      const sync: SyncStatus = (() => {
        const r = rnd();
        return r < 0.6 ? "synced" : r < 0.75 ? "pending" : r < 0.86 ? "retrying" : r < 0.93 ? "failed" : r < 0.97 ? "not_applicable" : "synced";
      })();
      processes.push({
        id: `P-${3100 + n}`,
        process: type,
        customerRef: `C-${4800 + n * 7}`,
        stage: st.name,
        stageIndex: si + 1,
        stageCount: stages.length,
        startedAt: iso(now, age + Math.round(between(30, 4000))),
        stageEnteredAt: iso(now, age),
        stageTargetMin: st.targetMin,
        ownerAgentId: owner,
        nextAction: st.next,
        nextActionDueAt: iso(now, -Math.round(st.targetMin - age)),
        syncStatus: sync,
      });
      n++;
    }
  }

  // dead letters: tied to the first customers so the screens agree
  const dlSpec: Array<[SystemId, number]> = [["surense", 0], ["surense", 3], ["surense", 9], ["surense", 14], ["surense", 21], ["salesforce", 5], ["salesforce", 17]];
  const deadLetters: DeadLetter[] = dlSpec.map(([dest, idx], k) => {
    const p = processes[idx];
    p.syncStatus = "dead_letter";
    const reason = REASONS[(k + (dest === "surense" ? 1 : 0)) % REASONS.length];
    const deadMin = Math.round(between(20, 60 * 30));
    return {
      id: `DL-${900 + k}`,
      destination: dest,
      customerRef: p.customerRef,
      eventType: EVENT_TYPES[k % EVENT_TYPES.length],
      reasonCode: reason.code,
      reasonText: reason.text,
      attempts: 3,
      firstFailedAt: iso(now, deadMin + 60 * 2),
      deadAt: iso(now, deadMin),
      customerHalted: k !== 2,
      haltedBehind: k !== 2 ? 1 + ((k * 3) % 4) : 0,
    };
  }).sort((a, b) => b.deadAt.localeCompare(a.deadAt));

  // work items: every process instance (customer) plus open leads
  const work: WorkItem[] = processes.map((p) => {
    const age = minutesBetween(p.stageEnteredAt, now);
    const due = new Date(new Date(p.stageEnteredAt).getTime() + p.stageTargetMin * 60_000);
    const idle = Math.round(Math.min(age, between(5, 60 * 40)));
    const priority: Priority = rnd() < 0.2 ? "high" : rnd() < 0.7 ? "normal" : "low";
    const minutesToDue = Math.round((due.getTime() - now.getTime()) / 60_000);
    return {
      id: `W-${p.id}`,
      customerRef: p.customerRef,
      kind: "customer",
      nextStep: p.nextAction,
      process: p.process,
      stage: p.stage,
      assignedAgentId: p.ownerAgentId,
      lastAction: { label: pick(LAST_ACTIONS), at: iso(now, idle) },
      syncStatus: p.syncStatus,
      priority,
      slaDueAt: due.toISOString(),
      createdAt: p.startedAt,
      urgency: urgencyScore({ priority, syncStatus: p.syncStatus, minutesToDue, idleMin: idle, assigned: p.ownerAgentId !== null }),
    };
  });
  for (let i = 0; i < 11; i++) {
    const assigned = rnd() < 0.55 ? pick(MOCK_AGENTS).id : null;
    const ageMin = Math.round(between(4, 60 * 20));
    const due = new Date(now.getTime() + Math.round(between(-90, 300)) * 60_000);
    const priority: Priority = rnd() < 0.3 ? "high" : "normal";
    const sync: SyncStatus = rnd() < 0.7 ? "synced" : "pending";
    work.push({
      id: `W-L-${i}`,
      customerRef: `L-${7200 + i * 11}`,
      kind: "lead",
      nextStep: assigned ? "ליצור קשר ראשון" : "לשייך סוכן וליצור קשר",
      process: "questionnaire",
      stage: "ליד חדש",
      assignedAgentId: assigned,
      lastAction: { label: "נוצר ליד", at: iso(now, ageMin) },
      syncStatus: sync,
      priority,
      slaDueAt: due.toISOString(),
      createdAt: iso(now, ageMin),
      urgency: urgencyScore({ priority, syncStatus: sync, minutesToDue: Math.round((due.getTime() - now.getTime()) / 60_000), idleMin: ageMin, assigned: assigned !== null }),
    });
  }
  work.sort((a, b) => b.urgency - a.urgency || a.id.localeCompare(b.id));

  // inquiries
  const channels: InquiryChannel[] = ["form", "phone", "email", "whatsapp", "portal"];
  const kinds: InquiryKind[] = ["question", "service_request", "document_request", "complaint", "callback"];
  const statuses: InquiryStatus[] = ["new", "new", "in_progress", "in_progress", "waiting_customer", "closed"];
  const inquiries: Inquiry[] = Array.from({ length: 22 }, (_, i) => {
    const channel = pick(channels);
    const kind = pick(kinds);
    const status = pick(statuses);
    const receivedMin = Math.round(between(8, 60 * 46));
    const dueMin = kind === "complaint" ? 60 : 240;
    const responded = status === "new" ? null : iso(now, Math.max(1, receivedMin - Math.round(between(5, dueMin * 0.9))));
    return {
      id: `Q-${5200 + i}`,
      customerRef: rnd() < 0.8 ? `C-${4800 + Math.floor(rnd() * 40) * 7}` : null,
      channel,
      kind,
      title: `${INQUIRY_KIND_LABEL[kind]} דרך ${CHANNEL_LABEL[channel]}`,
      status,
      receivedAt: iso(now, receivedMin),
      firstResponseDueAt: iso(now, receivedMin - dueMin),
      firstResponseAt: responded,
      assignedAgentId: status === "new" && rnd() < 0.5 ? null : pick(MOCK_AGENTS).id,
    };
  }).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  // queues
  const dl = (s: SystemId) => deadLetters.filter((d) => d.destination === s).length;
  const wave = (base: number, amp: number, phase: number) => Array.from({ length: 24 }, (_, h) => Math.max(0, Math.round(base + amp * Math.sin((h + phase) / 3.2) + between(-amp / 3, amp / 3))));
  const queues: Record<SystemId, QueueDepth> = {
    salesforce: { system: "salesforce", pending: 7, inFlight: 2, retrying: 3, deadLetter: dl("salesforce"), oldestPendingSec: 95, throughput24h: wave(34, 14, 2) },
    surense: { system: "surense", pending: 41, inFlight: 5, retrying: 9, deadLetter: dl("surense"), oldestPendingSec: 18 * 60 + 20, throughput24h: wave(12, 6, 7) },
  };

  // audit
  const audit: AuditEntry[] = [];
  const A = (cat: AuditEntry["category"], kind: AuditEntry["actorKind"], actor: string, action: string, label: string, rt: string | null, meta: AuditEntry["meta"]) => {
    const i = audit.length;
    audit.push({
      id: `AU-${12000 - i}`,
      at: iso(now, Math.round(5 + i * between(14, 55))),
      category: cat,
      actorKind: kind,
      actorLabel: actor,
      action,
      actionLabel: label,
      resourceType: rt,
      resourceId: rt ? `${rt === "customer" ? "C" : rt === "dead_letter" ? "DL" : "X"}-${Math.floor(rnd() * 900 + 100)}` : null,
      requestId: `req_${Math.floor(rnd() * 0xffffff).toString(16).padStart(6, "0")}`,
      meta,
    });
  };
  const bizActions: Array<[string, string, string, string]> = [
    ["customer.assigned", "שיוך לקוח לסוכן", "customer", "מנהל תפעול"],
    ["process.stage_changed", "שינוי שלב בתהליך", "process", "סוכן 1"],
    ["inquiry.status_changed", "שינוי סטטוס פנייה", "inquiry", "סוכן 2"],
    ["lead.created", "נוצר ליד מהאתר", "lead", "מערכת"],
    ["sync.retry_scheduled", "נקבע ניסיון סנכרון חוזר", "queue_message", "מערכת"],
    ["questionnaire.submitted", "שאלון נשלח", "customer", "מערכת"],
  ];
  const secActions: Array<[string, string, string | null, string, AuditEntry["actorKind"]]> = [
    ["auth.login", "כניסה למערכת", null, "מנהל תפעול", "user"],
    ["auth.mfa_verified", "אימות דו-שלבי הושלם", null, "מנהל על", "user"],
    ["deadletter.retry", "ניסיון חוזר להודעה שנכשלה", "dead_letter", "מנהל על", "user"],
    ["settings.updated", "עדכון הגדרות מערכת", "settings", "מנהל על", "user"],
    ["role.changed", "שינוי תפקיד משתמש", "user", "מנהל על", "user"],
    ["api_client.key_rotated", "סיבוב מפתח לקוח API", "api_client", "לקוח API", "api_client"],
  ];
  for (let i = 0; i < 64; i++) {
    if (i % 4 === 3) {
      const [a, l, r, actor, kind] = secActions[Math.floor(rnd() * secActions.length)];
      A("security", kind, actor, a, l, r, a === "deadletter.retry" ? { attempts: 1, stepUp: true } : { stepUp: a !== "auth.login" });
    } else {
      const [a, l, r, actor] = bizActions[Math.floor(rnd() * bizActions.length)];
      A("business", actor === "מערכת" ? "system" : "user", actor, a, l, r, a === "process.stage_changed" ? { from: 2, to: 3 } : {});
    }
  }

  return {
    now,
    processes,
    work,
    inquiries,
    deadLetters,
    audit,
    queues,
    lastSuccess: { salesforce: iso(now, 2), surense: iso(now, 11) },
    lastFailure: { salesforce: iso(now, 47), surense: iso(now, 6) },
  };
}

function tiles(ds: Dataset): SystemHealthTile[] {
  return (["salesforce", "surense"] as SystemId[]).map((s) => {
    const q = ds.queues[s];
    return {
      system: s,
      adapter: "ready",
      state: queueHealth(q, "ready", ds.lastSuccess[s], ds.now),
      lastSuccessAt: ds.lastSuccess[s],
      lastFailureAt: ds.lastFailure[s],
      failureRate1h: s === "salesforce" ? 0.03 : 0.14,
      pending: q.pending,
      retrying: q.retrying,
      deadLetter: q.deadLetter,
    };
  });
}

export function createMockOpsDataSource(opts: MockOptions = {}): OpsDataSource {
  const now = opts.now ?? new Date();
  const ds = buildDataset(now);
  const asOf = new Date(now.getTime() - 40_000).toISOString();
  const latency = opts.latencyMs ?? 140;
  const gate = async <T,>(fn: () => T): Promise<T> => {
    if (latency > 0) await new Promise((r) => setTimeout(r, latency));
    if (opts.failWith) throw new Error(opts.failWith);
    return fn();
  };
  const byAgent = (agentId: string | null | undefined, owner: string | null) => !agentId || owner === agentId;

  return {
    kind: "mock",
    listAgents: () => gate(() => MOCK_AGENTS),

    getOverview: (filters) =>
      gate((): OpsOverview => {
        const f = buildFunnels({ ...filters, range: "today" });
        const stepCount = (id: string, key: string) => f.find((x) => x.id === id)?.steps.find((s) => s.key === key)?.count ?? 0;
        const prev = (v: number, k: number) => Math.max(0, Math.round(v * k));
        const strip = [
          { key: "leads", label: "לידים חדשים", value: stepCount("leads", "lead"), previous: prev(stepCount("leads", "lead"), 1.12) },
          { key: "q", label: "שאלונים שנשלחו", value: stepCount("questionnaire", "submit"), previous: prev(stepCount("questionnaire", "submit"), 0.9) },
          { key: "r", label: "דוחות מוכנים", value: stepCount("report_generation", "ready"), previous: prev(stepCount("report_generation", "ready"), 1.0) },
          { key: "j", label: "הצטרפויות", value: stepCount("joining", "done"), previous: prev(stepCount("joining", "done"), 0.7) },
          { key: "a", label: "כתבי מינוי שנחתמו", value: stepCount("agent_appointment", "signed"), previous: prev(stepCount("agent_appointment", "signed"), 1.3) },
          { key: "i", label: "מידע שהתקבל", value: stepCount("information_order", "received"), previous: null },
        ];

        const sla: SlaBreachSummary[] = PROCESS_TYPES.map((t) => {
          const rows = ds.processes.filter((p) => p.process === t && byAgent(filters.agentId, p.ownerAgentId));
          const states = rows.map((p) => slaState(minutesBetween(p.stageEnteredAt, now), p.stageTargetMin));
          return {
            process: t,
            breached: states.filter((s) => s === "breached").length,
            atRisk: states.filter((s) => s === "at_risk").length,
            targetMin: Math.round(STAGES[t].reduce((a, s) => a + s.targetMin, 0) / STAGES[t].length),
          };
        });
        const joinBreach = sla.find((s) => s.process === "joining")?.breached ?? 0;
        const waitingInquiries = ds.inquiries.filter((q) => q.status === "new" && new Date(q.firstResponseDueAt) < now).length;
        const sur = ds.queues.surense;
        const alerts: OpsAlert[] = [];
        if (sur.deadLetter > 0) alerts.push({ id: "al-dlq-surense", severity: "critical", title: `${sur.deadLetter} הודעות נכשלו בתור Surense`, detail: "הלקוחות שלהן מושהים עד לטיפול. נדרש מנהל על לניסיון חוזר.", since: iso(now, 190), source: "queue", href: "/app/ops/dead-letters" });
        if (sur.oldestPendingSec > 900) alerts.push({ id: "al-wait-surense", severity: "warning", title: "המתנה ארוכה בתור Surense", detail: `ההודעה הוותיקה ביותר ממתינה ${Math.round(sur.oldestPendingSec / 60)} דקות.`, since: iso(now, 22), source: "sync", href: "/app/ops/integrations" });
        if (joinBreach > 0) alerts.push({ id: "al-sla-join", severity: "warning", title: `${joinBreach} הצטרפויות חרגו מזמן היעד`, detail: "תהליכי הצטרפות שעומדים בשלב מעבר ליעד.", since: iso(now, 75), source: "sla", href: "/app/ops/processes" });
        if (waitingInquiries > 0) alerts.push({ id: "al-inq", severity: "info", title: `${waitingInquiries} פניות חדשות חרגו מזמן מענה ראשון`, detail: "פניות ללא מענה מעבר ליעד.", since: iso(now, 60), source: "sla", href: "/app/ops/inquiries" });
        return { asOf, today: strip, alerts, syncTiles: tiles(ds), queues: [ds.queues.salesforce, ds.queues.surense], sla };
      }),

    getFunnels: (filters) => gate(() => ({ asOf, filters, funnels: buildFunnels(filters) })),

    getWorkQueue: (q) =>
      gate(() => {
        const needle = q.search?.trim().toLowerCase();
        const rows = ds.work.filter((w) => {
          if (q.agentId && w.assignedAgentId !== q.agentId) return false;
          if (q.assignment === "unassigned" && w.assignedAgentId !== null) return false;
          if (q.syncStatus && q.syncStatus !== "all" && w.syncStatus !== q.syncStatus) return false;
          if (q.band && q.band !== "all" && urgencyBand(w.urgency) !== q.band) return false;
          if (needle && !(w.customerRef.toLowerCase().includes(needle) || w.nextStep.includes(needle))) return false;
          return true;
        });
        return paginate(rows, q, asOf);
      }),

    getProcesses: (q) =>
      gate(() => {
        const rows = ds.processes
          .filter((p) => (!q.process || q.process === "all" || p.process === q.process) && byAgent(q.agentId, p.ownerAgentId))
          .filter((p) => !q.sla || q.sla === "all" || slaState(minutesBetween(p.stageEnteredAt, now), p.stageTargetMin) === q.sla)
          .sort((a, b) => a.stageEnteredAt.localeCompare(b.stageEnteredAt));
        return paginate(rows, q, asOf);
      }),

    getInquiries: (q) =>
      gate(() => {
        const rows = ds.inquiries.filter(
          (i) => (!q.status || q.status === "all" || i.status === q.status) && (!q.channel || q.channel === "all" || i.channel === q.channel) && (!q.kind || q.kind === "all" || i.kind === q.kind),
        );
        return paginate(rows, q, asOf);
      }),

    getIntegrationHealth: () =>
      gate((): IntegrationHealth => {
        const t = tiles(ds);
        return {
          asOf,
          systems: t.map((x) => ({
            ...x,
            queue: ds.queues[x.system],
            failures24h:
              x.system === "salesforce"
                ? [{ kind: "record_locked", label: "רשומה נעולה", count: 5 }, { kind: "transient", label: "תקלה זמנית", count: 2 }]
                : [{ kind: "rate_limited", label: "הגבלת קצב", count: 11 }, { kind: "transient", label: "תקלה זמנית", count: 6 }, { kind: "permanent", label: "תקלה קבועה", count: 5 }],
            policy: x.system === "salesforce" ? { batchSize: 20, maxAttempts: 3, drainIntervalSec: 10 } : { batchSize: 5, maxAttempts: 3, drainIntervalSec: 60 },
          })),
          pipelines: [
            { id: "sur-webhook", label: "Surense: קליטת webhook", state: "healthy", lastRunAt: iso(now, 3), note: "אירועים נקלטים לטבלת הגלם" },
            { id: "sur-processor", label: "Surense: מעבד אירועים", state: "healthy", lastRunAt: iso(now, 4), note: "גלם לטבלאות תפעוליות" },
            { id: "cron-sync", label: "משימת cron: סנכרון מחזורי", state: "healthy", lastRunAt: iso(now, 9), note: "רצה לפי לוח הזמנים" },
            { id: "worker-sf", label: "עובד תור Salesforce", state: "healthy", lastRunAt: iso(now, 1), note: "מתעורר כל 10 שניות" },
            { id: "worker-sur", label: "עובד תור Surense", state: "degraded", lastRunAt: iso(now, 2), note: "הגבלת קצב: האצה אוטומטית של הניסיונות" },
            { id: "returns", label: "רענון לוח תשואות", state: "healthy", lastRunAt: iso(now, 60 * 6), note: "רענון יומי" },
          ],
        };
      }),

    getDeadLetters: (q) =>
      gate(() => {
        const rows = ds.deadLetters.filter((d) => (!q.destination || q.destination === "all" || d.destination === q.destination) && (!q.reasonCode || q.reasonCode === "all" || d.reasonCode === q.reasonCode));
        return paginate(rows, q, asOf);
      }),

    getAuditLog: (q, role) =>
      gate(() => {
        const allowed = auditCategoriesFor(role);
        const needle = q.search?.trim().toLowerCase();
        const rows = ds.audit.filter(
          (a) =>
            allowed.includes(a.category) &&
            (!q.category || q.category === "all" || a.category === q.category) &&
            (!q.actorKind || q.actorKind === "all" || a.actorKind === q.actorKind) &&
            (!needle || a.action.includes(needle) || a.actionLabel.includes(needle) || (a.resourceId ?? "").toLowerCase().includes(needle)),
        );
        return paginate(rows, { pageSize: 20, ...q }, asOf);
      }),

    getSettings: () =>
      gate((): OpsSettings => ({
        asOf,
        visibilityMode: "shared",
        assignmentRules: [
          { id: "r1", order: 1, name: "לקוח קיים", condition: "ללקוח יש סוכן אחראי", action: "שייך לסוכן האחראי", enabled: true },
          { id: "r2", order: 2, name: "ליד מהאתר", condition: "מקור הליד הוא טופס באתר", action: "חלוקה מחזורית בין הסוכנים הפעילים", enabled: true },
          { id: "r3", order: 3, name: "עומס יתר", condition: "לסוכן יותר מ-25 פריטים פתוחים", action: "דלג לסוכן הבא", enabled: false },
        ],
        alertRecipients: [
          { id: "a1", audience: "מנהלי תפעול", channel: "in_app", severities: ["critical", "warning", "info"] },
          { id: "a2", audience: "מנהל על", channel: "email", severities: ["critical"] },
        ],
        flags: [
          { name: "ops.console", description: "מרכז התפעול", enabled: true, source: "env" },
          { name: "ops.realtime", description: "עדכון חי במקום רענון תקופתי", enabled: false, source: "default" },
          { name: "ops.bulk_actions", description: "פעולות המוניות בתור העבודה", enabled: false, source: "default" },
          { name: "audit.enabled", description: "כתיבה ליומן הפעולות", enabled: false, source: "default" },
          { name: "api.v1", description: "ממשק API חיצוני", enabled: false, source: "default" },
        ],
        slaTargets: PROCESS_TYPES.flatMap((p) => STAGES[p].map((s) => ({ process: p, stage: s.name, targetMin: s.targetMin }))),
        polling: { overviewSec: 60, listsSec: 120 },
      })),
  };
}

