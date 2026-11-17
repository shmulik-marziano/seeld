import { describe, expect, it } from "vitest";
import { buildFinancialReport, buildInsuranceReport, buildUnifiedReport, sumOrNull } from "./builders";
import { BLOCKS } from "./blocks";
import { SYNTHETIC_FAMILY, SYNTHETIC_SINGLE } from "./fixtures/synthetic";
import { NO_INFO, formatCurrency, formatDate, formatPercent, maskId, maskPolicy, percentsSumTo100, toIsoDate } from "./format";
import { ENTITLEMENTS, ReportDataSchema, type ReportData } from "./types";
import { buildLeadPayload } from "./lead";

describe("formatters", () => {
  it("currency uses ₪ and thousands separators, null is 'לא התקבל מידע'", () => {
    expect(formatCurrency(1234567.4)).toBe("1,234,567 ₪");
    expect(formatCurrency(null)).toBe(NO_INFO);
    expect(formatCurrency(Number.NaN)).toBe(NO_INFO);
  });
  it("percent and dates", () => {
    expect(formatPercent(4.55)).toMatch(/^4[.,][56]%$/);
    expect(formatPercent(undefined)).toBe(NO_INFO);
    expect(formatDate("2026-11-17")).toBe("17/11/2026");
    expect(formatDate("20261109140543")).toBe("09/11/2026");
    expect(toIsoDate("5/3/2025")).toBe("2025-03-05");
    expect(formatDate("garbage")).toBe(NO_INFO);
  });
  it("masks ids and policy numbers", () => {
    expect(maskId("123456782")).toBe("***-**-782");
    expect(maskId("12")).toBe("***-**-***");
    expect(maskPolicy("123456789")).toMatch(/6789$/);
    expect(maskPolicy("123456789")).not.toContain("12345");
  });
  it("percentsSumTo100 always lands on exactly 100", () => {
    for (const vs of [[1, 1, 1], [33.3, 33.3, 33.4], [1, 2, 3, 4, 5, 6, 7], [0.1, 0.2, 99.7], [5]]) {
      expect(percentsSumTo100(vs).reduce((a, b) => a + b, 0)).toBe(100);
    }
    expect(percentsSumTo100([0, 0])).toEqual([0, 0]);
  });
});

describe("builders: totals and percentages", () => {
  const fin = buildFinancialReport(SYNTHETIC_FAMILY, ENTITLEMENTS.client);
  const ins = buildInsuranceReport(SYNTHETIC_FAMILY, ENTITLEMENTS.visitor);
  const uni = buildUnifiedReport(SYNTHETIC_FAMILY, ENTITLEMENTS.client);

  it("sums savings and premiums, splitting life and health", () => {
    expect(fin.summary.totalSavings).toBe(400000 + 150000 + 520000 + 60000 + 30000);
    expect(ins.summary.premiumTotal).toBe(85 + 60 + 140 + 45 + 35 + 95);
    expect(ins.summary.premiumLife).toBe(85 + 60);
    expect(ins.summary.premiumHealth).toBe(140 + 45 + 95);
  });
  it("insurance report carries only insurance products, financial only savings, unified both", () => {
    expect(ins.data.products.every((p) => p.kind === "insurance")).toBe(true);
    expect(fin.data.products.every((p) => p.kind !== "insurance")).toBe(true);
    expect(uni.data.products.length).toBe(SYNTHETIC_FAMILY.products.length);
  });
  it("donut percentages sum to 100 and cover the whole balance", () => {
    for (const d of [fin.donuts.byType, fin.donuts.byManufacturer]) {
      expect(d.reduce((a, s) => a + s.pct, 0)).toBe(100);
      expect(d.reduce((a, s) => a + s.value, 0)).toBe(fin.summary.totalSavings);
    }
  });
  it("weighted return stays null when no product reported one", () => {
    const none: ReportData = { ...SYNTHETIC_SINGLE, products: SYNTHETIC_SINGLE.products.map((p) => ({ ...p, returnPct: null })) };
    expect(buildFinancialReport(none).summary.returnPct).toBeNull();
    expect(fin.summary.returnPct).toBeGreaterThan(4);
  });
  it("sumOrNull never turns unknown into zero", () => {
    expect(sumOrNull([null, undefined])).toBeNull();
    expect(sumOrNull([null, 5])).toBe(5);
  });
  it("capital by type adds up to the savings total when every product is split", () => {
    const c = fin.capitalByType;
    expect((c.employee ?? 0) + (c.employer ?? 0) + (c.severance ?? 0) + (c.other ?? 0)).toBe(c.total);
  });
});

describe("builders: 'לא התקבל מידע' handling", () => {
  const ins = buildInsuranceReport(SYNTHETIC_FAMILY, ENTITLEMENTS.visitor);
  it("always returns nine tiles per person", () => {
    for (const card of ins.personCards) expect(card.tiles).toHaveLength(9);
  });
  it("the child has health only; every other tile is 'none-received'", () => {
    const child = ins.personCards.find((c) => c.person.role === "child");
    expect(child?.tiles.find((t) => t.kind === "health")?.state).toBe("exists");
    expect(child?.tiles.filter((t) => t.state === "none-received")).toHaveLength(8);
  });
  it("a tile with an amount reports 'amount', not just 'exists'", () => {
    const self = ins.personCards.find((c) => c.person.role === "self");
    expect(self?.tiles.find((t) => t.kind === "death")).toMatchObject({ state: "amount", amount: 1000000 });
  });
  it("unknown figures are null, never 0", () => {
    const empty: ReportData = { ...SYNTHETIC_SINGLE, products: [] };
    const r = buildUnifiedReport(empty);
    expect(r.summary.totalSavings).toBeNull();
    expect(r.summary.premiumTotal).toBeNull();
    expect(r.donuts.byType).toEqual([]);
  });
});

describe("tiers: same structure, different unlocked set", () => {
  const visitor = buildUnifiedReport(SYNTHETIC_FAMILY, ENTITLEMENTS.visitor);
  const client = buildUnifiedReport(SYNTHETIC_FAMILY, ENTITLEMENTS.client);
  const agent = buildUnifiedReport(SYNTHETIC_FAMILY, ENTITLEMENTS.agent);
  const ids = (r: typeof visitor) => r.blocks.map((b) => b.id);
  const shown = (r: typeof visitor) => r.blocks.filter((b) => b.status === "shown").map((b) => b.id);

  it("block list is identical across tiers", () => {
    expect(ids(client)).toEqual(ids(visitor));
    expect(ids(agent)).toEqual(ids(visitor));
    expect(ids(visitor).length).toBe(BLOCKS.filter((b) => b.modes.includes("unified")).length);
  });
  it("visitor sees deposit blocks locked with needs_client_authorisation, client sees them", () => {
    for (const id of ["deposits-monthly", "projected-with-deposits", "employment-salary", "product-deposits"]) {
      const v = visitor.blocks.find((b) => b.id === id);
      expect(v).toMatchObject({ status: "locked", reason: "needs_client_authorisation" });
      expect(client.blocks.find((b) => b.id === id)?.status).toBe("shown");
    }
  });
  it("unlocked set grows: visitor is a subset of client, client of agent", () => {
    expect(shown(visitor).every((id) => shown(client).includes(id))).toBe(true);
    expect(shown(client).every((id) => shown(agent).includes(id))).toBe(true);
    expect(shown(client).length).toBeGreaterThan(shown(visitor).length);
  });
  it("blocks no file can fill carry a reason (information order / policy copy / not in files)", () => {
    for (const id of ["donut-liquidity", "donut-exposure", "investment-mix", "product-returns"]) {
      expect(client.blocks.find((b) => b.id === id)).toMatchObject({ status: "locked", reason: "needs_information_order" });
    }
    const harOnly: ReportData = { ...SYNTHETIC_FAMILY, sources: { har: true, maslaka: false }, products: SYNTHETIC_FAMILY.products.filter((p) => p.kind === "insurance").map((p) => ({ ...p, coverages: [], sources: ["har" as const] })) };
    const har = buildInsuranceReport(harOnly, ENTITLEMENTS.client);
    expect(har.blocks.find((b) => b.id === "policy-details")).toMatchObject({ status: "locked", reason: "needs_policy_copy" });
    expect(har.blocks.find((b) => b.id === "coverage-amounts")).toMatchObject({ status: "locked", reason: "needs_policy_copy" });
  });
  it("agent view marks what is locked for the client; other tiers never set the flag", () => {
    expect(agent.blocks.filter((b) => b.lockedForClient).length).toBeGreaterThan(0);
    expect(visitor.blocks.some((b) => b.lockedForClient)).toBe(false);
    expect(client.blocks.some((b) => b.lockedForClient)).toBe(false);
    expect(agent.blocks.find((b) => b.id === "deposits-monthly")?.lockedForClient).toBe(true);
  });
  it("coverage indicator counts shown over total, honestly", () => {
    expect(visitor.coverage.total).toBe(client.coverage.total);
    expect(visitor.coverage.shown).toBeLessThan(client.coverage.shown);
    expect(visitor.coverage.shown).toBe(visitor.blocks.filter((b) => b.status === "shown" && BLOCKS.find((d) => d.id === b.id)?.counted).length);
  });
  it("a locked block never carries numbers: deposits and employment are stripped from the visitor model", () => {
    for (const p of visitor.data.products) {
      expect(p.deposits).toEqual([]);
      expect(p.salary).toBeNull();
      expect(p.employer).toBeNull();
      expect(p.projectedCapitalWithDeposits).toBeNull();
    }
    expect(visitor.depositsMonthlyByType.total).toBeNull();
    expect(visitor.projection.withDeposits.capital).toBeNull();
    expect(client.depositsMonthlyByType.total).not.toBeNull();
  });
  it("entitled client with no deposit data in the files is locked as not_in_source_files", () => {
    const noDeposits: ReportData = { ...SYNTHETIC_FAMILY, products: SYNTHETIC_FAMILY.products.map((p) => ({ ...p, deposits: [] })) };
    expect(buildFinancialReport(noDeposits, ENTITLEMENTS.client).blocks.find((b) => b.id === "deposits-monthly")).toMatchObject({ status: "locked", reason: "not_in_source_files" });
  });
  it("model data validates against the zod schema", () => {
    expect(() => ReportDataSchema.parse(SYNTHETIC_FAMILY)).not.toThrow();
    expect(() => ReportDataSchema.parse(SYNTHETIC_SINGLE)).not.toThrow();
  });
});

describe("lead payload (matches save_lead, origin 'report')", () => {
  it("names the clicked block and carries no personal data by default", () => {
    const p = buildLeadPayload({ blockId: "deposits-monthly", reason: "needs_client_authorisation", department: "general", firstName: "דנה", phone: "0500000000", note: "" }, "sess1");
    expect(p).toMatchObject({ origin: "report", p_national_id: null, p_agency_id: null, p_request_id: null, locked_block: "deposits-monthly", p_line_of_business: "finance" });
    expect(p.p_fields.lead_topics).toContain("deposits-monthly");
    expect(p.p_idempotency_key).toMatch(/^lead:report:sess1:/);
    expect(Object.keys(p.p_fields)).not.toContain("national_id");
  });
  it("insurance blocks route to the insurance line", () => {
    const p = buildLeadPayload({ blockId: "coverage-amounts", reason: "needs_policy_copy", department: "insurance", firstName: "", phone: "0500000000", note: "" }, "s");
    expect(p.p_line_of_business).toBe("insurance");
  });
});
