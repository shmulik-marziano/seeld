import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  auditCategoriesFor, can, deltaOf, formatAge, formatPct, funnelView, hasOpsAccess, minutesBetween, overallConversion,
  paginate, queueHealth, slaState, urgencyBand, urgencyScore,
} from "@/pages/app/ops/contracts";
import { resolveMockRole } from "@/pages/app/ops/access";
import { buildFunnels, createMockOpsDataSource, MOCK_AGENTS, mulberry32 } from "@/pages/app/ops/mockData";

const NOW = new Date("2026-11-17T09:30:00Z");
const ds = () => createMockOpsDataSource({ now: NOW, latencyMs: 0 });

describe("ops roles", () => {
  it("agent has no ops access; manager views; only super_admin acts", () => {
    expect(hasOpsAccess("agent")).toBe(false);
    expect(hasOpsAccess(null)).toBe(false);
    expect(hasOpsAccess("manager")).toBe(true);
    expect(can("manager", "ops.deadletter.act")).toBe(false);
    expect(can("manager", "ops.settings.view")).toBe(false);
    expect(can("manager", "ops.audit.security")).toBe(false);
    for (const c of ["ops.view", "ops.deadletter.act", "ops.settings.view", "ops.settings.edit", "ops.audit.security"] as const) expect(can("super_admin", c)).toBe(true);
  });
  it("audit categories follow the role", () => {
    expect(auditCategoriesFor("agent")).toEqual([]);
    expect(auditCategoriesFor("manager")).toEqual(["business"]);
    expect(auditCategoriesFor("super_admin")).toEqual(["business", "security"]);
  });
  it("mock role resolver: production NEVER grants access, dev honours the flag", () => {
    expect(resolveMockRole(true, "super_admin", "super_admin")).toBeNull();
    expect(resolveMockRole(false, "manager")).toBe("manager");
    expect(resolveMockRole(false, "manager", "super_admin")).toBe("super_admin");
    expect(resolveMockRole(false, "owner")).toBeNull();
    expect(resolveMockRole(false, undefined)).toBeNull();
  });
});

describe("ops pure helpers", () => {
  it("formatAge is Hebrew and safe", () => {
    expect(formatAge(5)).toBe("5 דק׳");
    expect(formatAge(180)).toBe("3 שע׳");
    expect(formatAge(60 * 24 * 3)).toBe("3 ימים");
    expect(formatAge(-4)).toBe("0 דק׳");
    expect(formatAge(Number.NaN)).toBe("0 דק׳");
  });
  it("slaState thresholds", () => {
    expect(slaState(10, 100)).toBe("ok");
    expect(slaState(75, 100)).toBe("at_risk");
    expect(slaState(100, 100)).toBe("at_risk");
    expect(slaState(101, 100)).toBe("breached");
    expect(slaState(500, 0)).toBe("ok");
  });
  it("urgency is bounded, monotonic in lateness and sync trouble, and banded", () => {
    const base = { priority: "normal" as const, syncStatus: "synced" as const, minutesToDue: 2000, idleMin: 0, assigned: true };
    const late = urgencyScore({ ...base, minutesToDue: -5 });
    const soon = urgencyScore({ ...base, minutesToDue: 60 });
    expect(late).toBeGreaterThan(soon);
    expect(soon).toBeGreaterThan(urgencyScore(base));
    expect(urgencyScore({ ...base, syncStatus: "dead_letter" })).toBeGreaterThan(urgencyScore({ ...base, syncStatus: "failed" }));
    expect(urgencyScore({ ...base, assigned: false })).toBe(urgencyScore(base) + 5);
    const max = urgencyScore({ priority: "high", syncStatus: "dead_letter", minutesToDue: -1, idleMin: 1e9, assigned: false });
    expect(max).toBeLessThanOrEqual(100);
    expect(urgencyScore({ priority: "low", syncStatus: "synced", minutesToDue: 1e6, idleMin: -5, assigned: true })).toBe(0);
    expect(urgencyBand(80)).toBe("critical");
    expect(urgencyBand(50)).toBe("high");
    expect(urgencyBand(25)).toBe("normal");
    expect(urgencyBand(24)).toBe("low");
  });
  it("funnelView computes shares, drops and flags the biggest relative drop once", () => {
    const v = funnelView([{ key: "a", label: "A", count: 100 }, { key: "b", label: "B", count: 80 }, { key: "c", label: "C", count: 20 }, { key: "d", label: "D", count: 18 }]);
    expect(v.map((s) => s.dropped)).toEqual([0, 20, 60, 2]);
    expect(v[2].ofPrev).toBeCloseTo(0.25);
    expect(v.filter((s) => s.biggestDrop).map((s) => s.key)).toEqual(["c"]);
    expect(overallConversion([{ key: "a", label: "A", count: 100 }, { key: "d", label: "D", count: 18 }])).toBeCloseTo(0.18);
  });
  it("funnelView handles empty and zero steps", () => {
    expect(funnelView([])).toEqual([]);
    const z = funnelView([{ key: "a", label: "A", count: 0 }, { key: "b", label: "B", count: 0 }]);
    expect(z.every((s) => !s.biggestDrop && s.ofFirst === 0)).toBe(true);
    expect(overallConversion([])).toBe(0);
    expect(formatPct(0.256)).toBe("26%");
    expect(formatPct(Number.NaN)).toBe("0%");
  });
  it("queueHealth", () => {
    const ok = { pending: 3, retrying: 0, deadLetter: 0, oldestPendingSec: 20 };
    const recent = new Date(NOW.getTime() - 60_000).toISOString();
    expect(queueHealth(ok, "ready", recent, NOW)).toBe("healthy");
    expect(queueHealth({ ...ok, deadLetter: 1 }, "ready", recent, NOW)).toBe("degraded");
    expect(queueHealth(ok, "ready", new Date(NOW.getTime() - 3_600_000).toISOString(), NOW)).toBe("down");
    expect(queueHealth({ ...ok, pending: 0 }, "ready", null, NOW)).toBe("healthy");
    expect(queueHealth(ok, "placeholder", recent, NOW)).toBe("idle");
  });
  it("deltaOf, minutesBetween, paginate", () => {
    expect(deltaOf(10, null)).toBeNull();
    expect(deltaOf(12, 10)).toEqual({ diff: 2, pct: 0.2 });
    expect(deltaOf(3, 0)).toEqual({ diff: 3, pct: null });
    expect(minutesBetween(new Date(NOW.getTime() - 90 * 60_000).toISOString(), NOW)).toBe(90);
    expect(minutesBetween(new Date(NOW.getTime() + 60_000).toISOString(), NOW)).toBe(0);
    const rows = Array.from({ length: 31 }, (_, i) => i);
    const p = paginate(rows, { page: 99, pageSize: 10 }, "x");
    expect(p.page).toBe(4);
    expect(p.items).toEqual([30]);
    expect(paginate([], {}, "x")).toMatchObject({ total: 0, page: 1, items: [] });
  });
});

describe("mock data source", () => {
  it("is deterministic for the same now", async () => {
    const a = await ds().getWorkQueue({ pageSize: 100 });
    const b = await ds().getWorkQueue({ pageSize: 100 });
    expect(a.items).toEqual(b.items);
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it("work queue is sorted by urgency and filters work", async () => {
    const all = await ds().getWorkQueue({ pageSize: 100 });
    expect(all.total).toBeGreaterThan(30);
    const u = all.items.map((i) => i.urgency);
    expect([...u].sort((x, y) => y - x)).toEqual(u);
    const unassigned = await ds().getWorkQueue({ pageSize: 100, assignment: "unassigned" });
    expect(unassigned.items.every((i) => i.assignedAgentId === null)).toBe(true);
    const a1 = await ds().getWorkQueue({ pageSize: 100, agentId: MOCK_AGENTS[0].id });
    expect(a1.items.every((i) => i.assignedAgentId === MOCK_AGENTS[0].id)).toBe(true);
    const dead = await ds().getWorkQueue({ pageSize: 100, syncStatus: "dead_letter" });
    expect(dead.total).toBe((await ds().getDeadLetters({ pageSize: 100 })).total);
  });
  it("funnels shrink with the agent share, grow with the range, never increase along a funnel", () => {
    const today = buildFunnels({ range: "today", agentId: null });
    const month = buildFunnels({ range: "30d", agentId: null });
    const one = buildFunnels({ range: "today", agentId: "agent-1" });
    expect(month[0].steps[0].count).toBeGreaterThan(today[0].steps[0].count);
    expect(one[0].steps[0].count).toBeLessThan(today[0].steps[0].count);
    for (const f of [...today, ...month, ...one]) for (let i = 1; i < f.steps.length; i++) expect(f.steps[i].count).toBeLessThanOrEqual(f.steps[i - 1].count);
  });
  it("overview numbers agree with the other screens", async () => {
    const o = await ds().getOverview({ range: "today", agentId: null });
    const dl = await ds().getDeadLetters({ pageSize: 100 });
    expect(o.queues.reduce((n, q) => n + q.deadLetter, 0)).toBe(dl.total);
    expect(o.queues.every((q) => q.throughput24h.length === 24)).toBe(true);
    expect(o.alerts.some((a) => a.id === "al-dlq-surense")).toBe(true);
  });
  it("audit log is role scoped (manager never sees security events)", async () => {
    const m = await ds().getAuditLog({ pageSize: 100 }, "manager");
    const s = await ds().getAuditLog({ pageSize: 100 }, "super_admin");
    expect(m.items.every((a) => a.category === "business")).toBe(true);
    expect(s.items.some((a) => a.category === "security")).toBe(true);
    expect((await ds().getAuditLog({ pageSize: 100 }, "agent")).total).toBe(0);
  });
  it("contains no personal names or contact details", async () => {
    const dump = JSON.stringify([await ds().getWorkQueue({ pageSize: 100 }), await ds().getInquiries({ pageSize: 100 }), await ds().getAuditLog({ pageSize: 100 }, "super_admin"), await ds().getSettings(), await ds().listAgents()]);
    expect(dump).not.toMatch(/שמוליק|משה|@|\d{9}/);
  });
  it("can simulate failures for error states", async () => {
    const bad = createMockOpsDataSource({ now: NOW, latencyMs: 0, failWith: "boom" });
    await expect(bad.getOverview({ range: "today", agentId: null })).rejects.toThrow("boom");
  });
});

describe("ops isolation", () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.(ts|tsx)$/.test(f)) out.push(p);
    }
    return out;
  };
  const src = join(__dirname, "..");
  it("only App.tsx (lazy route) and AppLayout (nav gate) reference the ops console", () => {
    const sep = join("pages", "app", "ops");
    const offenders = walk(src)
      .filter((f) => !f.includes(sep) && !f.includes(join("src", "test")))
      .filter((f) => /pages\/app\/ops/.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(src, "").replace(/\\/g, "/"));
    expect(offenders.sort()).toEqual(["/App.tsx", "/components/layout/AppLayout.tsx"]);
  });
  it("App.tsx loads the console lazily and AppLayout imports only the tiny access module", () => {
    expect(readFileSync(join(src, "App.tsx"), "utf8")).toMatch(/lazy\(\(\) => import\("@\/pages\/app\/ops\/OpsRoutes"\)\)/);
    const layout = readFileSync(join(src, "components/layout/AppLayout.tsx"), "utf8");
    expect(layout).toMatch(/from '@\/pages\/app\/ops\/access'/);
    expect(layout).not.toMatch(/ops\/(OpsRoutes|parts|mockData|screens)/);
  });
  it("the ops console never imports the platform layer or Supabase", () => {
    const offenders = walk(join(src, "pages", "app", "ops")).filter((f) => /from\s+["'](@\/platform|@\/integrations)/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
