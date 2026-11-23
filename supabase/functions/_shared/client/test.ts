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
    status: "פעיל", plan: "Zz-Plan", balance: 123456.57, premium: 1200.5, premium_frequency: "חודשית", coverage: 500000,
    start: "2015-03-01", end: "2040-01-01", track: "Zz-Track",
  });
  assert.ok(!JSON.stringify(p).includes("Zz Person") && !JSON.stringify(p).includes("000000018") && !JSON.stringify(p).includes("123456789"));
});

Deno.test("portfolio: company label falls back to 'חברה <id>'; the mirror's product_type is used when details carry no type", () => {
  assert.equal(companyLabel({}, 42), "חברה 42");
  assert.equal(companyLabel({}, null), "חברה");
  assert.equal(companyLabel({ companyName: "Zz Insurer" }, 42), "Zz Insurer");
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
