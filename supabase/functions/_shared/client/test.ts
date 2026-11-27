// deno test supabase/functions/_shared/client  (pure shaping; synthetic values only)
import assert from "node:assert/strict";
import { categoryOf, CATEGORY_ORDER, companyLabel, maskPolicyNumber, POA_DOC_TITLE, shapePortfolio, shapeProduct, summarize, TYPE_LABEL } from "./portfolio.ts";

const P1 = "d5100000-0000-4000-8000-000000000001";
const P2 = "d5100000-0000-4000-8000-000000000002";

Deno.test("portfolio: every Surense type 1..46 has a label and a category; unknown types land in 'other'", () => {
  for (let t = 1; t <= 46; t++) {
    assert.ok(TYPE_LABEL[t], `label for type ${t}`);
    assert.ok(CATEGORY_ORDER.includes(categoryOf(t)));
  }
  assert.equal(categoryOf(1), "pension");
  assert.equal(categoryOf(7), "hishtalmut");
  assert.equal(categoryOf(12), "insurance_health");
  assert.equal(categoryOf(29), "insurance_general");
  assert.equal(categoryOf(41), "savings");
  assert.equal(categoryOf(99), "other");
  assert.equal(categoryOf(null), "other");
});

Deno.test("portfolio: policy numbers are masked to their last four digits; short ones are hidden", () => {
  assert.equal(maskPolicyNumber("123456789"), "****6789");
  assert.equal(maskPolicyNumber(98765), "****8765");
  assert.equal(maskPolicyNumber("1234"), "****");
  assert.equal(maskPolicyNumber(""), null);
  assert.equal(maskPolicyNumber(undefined), null);
});

Deno.test("portfolio: a product is shaped with labels and figures; nothing personal and no full policy number comes out", () => {
  const p = shapeProduct({
    id: P1, source: "מסלקה_פנסיונית", company_id: 11, product_type: 1, modified_at: "2026-11-20T10:00:00Z",
    details: {
      accountPolicyNumber: "123456789", accumulation: 123456.567, shemTohnit: "Zz-Plan", status: "פעיל", totalMonthlyPremia: 1200.5,
      totalPremiaFrequency: "חודשית", subscriptionDate: "2015-03-01T00:00:00", policyEndDate: "2040-01-01", companyIdNumber: 520004078,
      masluleiAshkaa: [{ shemMaslul: "Zz-Track" }], covers: [{ insuranceAmount: 500000, premia: 80 }],
      insuredFullName: "Zz Person", idNumber: "000000018",
    },
  });
  assert.deepEqual(p, {
    id: P1, type_code: 1, type_label: "קרן פנסיה חדשה מקיפה", company_label: "הראל", policy_number_masked: "****6789", source: "maslaka",
    status: "פעיל", active: true, plan: "Zz-Plan", balance: 123456.57, premium: 1200.5, premium_frequency: "חודשית", coverage: 500000,
    start: "2015-03-01", end: "2040-01-01", track: "Zz-Track",
  });
  assert.ok(!JSON.stringify(p).includes("Zz Person") && !JSON.stringify(p).includes("000000018") && !JSON.stringify(p).includes("123456789"));
});

Deno.test("portfolio: company label falls back to 'חברה <id>'; the mirror's product_type is used when details carry no type", () => {
  assert.equal(companyLabel({}, 42), "חברה 42");
  assert.equal(companyLabel({}, null), "חברה");
  assert.equal(companyLabel({ companyName: "Zz Insurer" }, 42), "Zz Insurer");
  // a production-mode row (live keys): the balance comes from totalHonAccumulation; beneficiaries and employers never come out
  const prod = shapeProduct({ id: P2, source: "פרודוקציה_פרט", company_id: 3, product_type: 8, modified_at: null, details: {
    totalHonAccumulation: 250000, allowanceAccumulation: 1000, totalPremia: 300, totalPremiaFrequency: "חודשית", mutavim: [{ name: "Zz Heir" }], employer: { name: "Zz Corp" }, employers: [{ name: "Zz Corp" }],
  } });
  assert.equal(prod.balance, 250000);
  assert.equal(prod.premium, 300);
  assert.equal(prod.source, "production");
  assert.ok(!JSON.stringify(prod).includes("Zz Heir") && !JSON.stringify(prod).includes("Zz Corp"));
  const p = shapeProduct({ id: P2, source: "הר_הביטוח", company_id: null, product_type: 13, modified_at: null, details: {} });
  assert.equal(p.type_label, "ביטוח חיים");
  assert.equal(p.source, "harbit");
  assert.equal(p.policy_number_masked, null);
  assert.equal(p.status, null);
  assert.ok(!("balance" in p) && !("premium" in p));
});

Deno.test("portfolio: categories keep the fixed order and the summary counts them", () => {
  const cats = shapePortfolio([
    { id: P2, source: "הר_הביטוח", company_id: 1, product_type: 13, modified_at: null, details: {} },
    { id: P1, source: "מסלקה_פנסיונית", company_id: 1, product_type: 1, modified_at: null, details: {} },
    { id: "d5100000-0000-4000-8000-000000000003", source: null, company_id: null, product_type: null, modified_at: null, details: {} },
  ]);
  assert.deepEqual(cats.map((c) => c.key), ["pension", "insurance_life", "other"]);
  assert.deepEqual(summarize(cats), {
    products: 3,
    categories: [{ key: "pension", label: "פנסיה", count: 1 }, { key: "insurance_life", label: "ביטוח חיים ואובדן כושר עבודה", count: 1 }, { key: "other", label: "אחר", count: 1 }],
  });
  assert.equal(POA_DOC_TITLE.maslaka, "ייפוי כוח למסלקה הפנסיונית");
});

Deno.test("portfolio: live Surense enums arrive as objects: status, frequency and type are read from them", () => {
  const s = shapeProduct({ id: P1, source: "פרודוקציה_פרט", company_id: null, product_type: null, modified_at: null, details: {
    type: { code: 12, description: "ביטוח בריאות" }, status: { code: 1, shortDescription: "פעיל", description: "פעיל" },
    totalPremiaFrequency: { code: 1, description: "חודשית" }, totalMonthlyPremia: 210.4,
  } });
  assert.equal(s.type_code, 12);
  assert.equal(s.status, "פעיל");
  assert.equal(s.active, true);
  assert.equal(s.premium_frequency, "חודשית");
  assert.equal(s.source, "production");
  const off = shapeProduct({ id: P2, source: null, company_id: null, product_type: 3, modified_at: null, details: { status: { code: 2, shortDescription: "לא פעיל" } } });
  assert.equal(off.active, false);
  assert.equal(off.status, "לא פעיל");
  assert.equal(shapeProduct({ id: P2, source: null, company_id: null, product_type: 3, modified_at: null, details: { status: "מוקפא_מסולק_לא_פעיל" } }).status, "מוקפא מסולק לא פעיל");
});

Deno.test("portfolio: fees and the year's return are percents of the reported fractions; implausible values are left out", () => {
  const s = shapeProduct({ id: P1, source: null, company_id: null, product_type: 1, modified_at: null, details: {
    accumulationFee: 0.0022, depositFee: 0.015, netReturnPercentStartYear: 0.079,
    lastDeposit: { hafkadot: [{ month: "2026-09" }, { month: "2026-10" }, { month: "bad" }] },
  } });
  assert.equal(s.fee_balance_pct, 0.22);
  assert.equal(s.fee_deposit_pct, 1.5);
  assert.equal(s.ytd_return_pct, 7.9);
  assert.equal(s.last_deposit, "2026-10");
  const odd = shapeProduct({ id: P1, source: null, company_id: null, product_type: 1, modified_at: null, details: { netReturnPercentStartYear: -1, accumulationFee: 0.2 } });
  assert.equal(odd.ytd_return_pct, undefined);
  assert.equal(odd.fee_balance_pct, undefined);
});

Deno.test("portfolio: protection tiles come only from live products and live covers; mortgage life never counts as life", () => {
  const active = { code: 1 };
  const health = shapeProduct({ id: P1, source: null, company_id: null, product_type: 12, modified_at: null, details: {
    status: active, covers: [{ coverType: 11, coverTypeDescription: "ניתוחים" }, { coverType: 18, coverTypeDescription: "מחלות קשות", expired: true },
      { coverType: 1, coverTypeDescription: "פוליסה" }],
  } });
  assert.deepEqual(health.protects, ["health"]);
  assert.deepEqual(health.covers, ["ניתוחים"]);
  const mortgage = shapeProduct({ id: P2, source: null, company_id: null, product_type: 14, modified_at: null, details: { status: active, covers: [{ coverType: 19 }] } });
  assert.equal(mortgage.protects, undefined);
  const lapsed = shapeProduct({ id: P2, source: null, company_id: null, product_type: 13, modified_at: null, details: { status: { code: 3 } } });
  assert.equal(lapsed.protects, undefined);
  const combo = shapeProduct({ id: P2, source: null, company_id: null, product_type: 17, modified_at: null, details: { status: active } });
  assert.deepEqual(combo.protects, ["life", "disability"]);
});
