// SYNTHETIC DEMO DATA. Every name, number and date below is invented for layout and tests.
// It is not derived from any real person, policy or amount. Never paste real client values into this file.
import { ProductSchema, type Product, type ReportData } from "../types";

export const DEMO_AS_OF = "2026-10-31";

const P = (o: Partial<Product> & Pick<Product, "id" | "ownerKey" | "kind" | "manufacturer" | "planName">): Product =>
  ProductSchema.parse({ sources: ["maslaka"], asOfDate: DEMO_AS_OF, ...o });

const months = (n: number, base: { employee: number; employer: number; severance: number; salary: number }) =>
  Array.from({ length: n }, (_, i) => {
    const m = 10 - i; // from 2026-10 backwards
    const y = m > 0 ? 2026 : 2025;
    const mm = m > 0 ? m : m + 12;
    return { month: `${y}-${String(mm).padStart(2, "0")}`, employee: base.employee, employer: base.employer, severance: base.severance, salary: base.salary };
  });

const A = "p_demoA";
const B = "p_demoB";
const C = "p_demoC";

export const SYNTHETIC_FAMILY: ReportData = {
  asOfDate: DEMO_AS_OF,
  familyLabel: "משפחת דוגמה",
  sources: { har: true, maslaka: true },
  persons: [
    { key: A, displayName: "אורית דוגמה", idMasked: "***-**-101", role: "self", birthYear: 1984 },
    { key: B, displayName: "יובל דוגמה", idMasked: "***-**-202", role: "spouse", birthYear: 1982 },
    { key: C, displayName: "נועם דוגמה", idMasked: "***-**-303", role: "child", birthYear: 2015 },
  ],
  products: [
    P({ id: "d-pen-a", ownerKey: A, kind: "pension", manufacturer: "קרן הדוגמה", planName: "פנסיה מקיפה", policyNumber: "1000001", status: "active", joinDate: "2008-03-01",
      balance: 400000, balanceSplit: { employee: 120000, employer: 170000, severance: 110000, other: null }, returnPct: 6.2,
      projectedCapitalNoDeposits: 900000, projectedCapitalWithDeposits: 2100000, projectedPensionMonthlyNoDeposits: 3300, projectedPensionMonthlyWithDeposits: 7600,
      feeFromDepositPct: 1.5, feeFromBalancePct: 0.2, employer: "חברת דוגמה בע\"מ", salary: 18000, salaryDate: "2026-09-30", lastDepositDate: "2026-10-09", currentMonthlyDeposit: 3700,
      tracks: [
        { name: "מסלול כללי", balance: 300000, depositSharePct: 70, annualCostPct: 0.1, returnPct: 6.4, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null },
        { name: "מסלול מחקה מדד", balance: 100000, depositSharePct: 30, annualCostPct: 0.05, returnPct: 5.9, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null },
      ],
      deposits: months(12, { employee: 1080, employer: 1170, severance: 1450, salary: 18000 }),
      coverages: [
        { kind: "disability", insuredKey: A, productId: "d-pen-a", amount: null, monthlyBenefit: 9000, premium: null },
        { kind: "survivors", insuredKey: A, productId: "d-pen-a", amount: null, monthlyBenefit: 5400, premium: null },
      ] }),
    P({ id: "d-tr-a", ownerKey: A, kind: "training", manufacturer: "גמל הדוגמה", planName: "קרן השתלמות", policyNumber: "2000002", status: "active", joinDate: "2012-05-01",
      balance: 150000, balanceSplit: { employee: null, employer: null, severance: null, other: 150000 }, returnPct: 5.1,
      feeFromDepositPct: 0, feeFromBalancePct: 0.6, employer: "חברת דוגמה בע\"מ", salary: 18000, salaryDate: "2026-09-30", lastDepositDate: "2026-10-09", currentMonthlyDeposit: 1350,
      tracks: [{ name: "מסלול מניות", balance: 150000, depositSharePct: 100, annualCostPct: 0.5, returnPct: 5.1, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null }],
      deposits: months(12, { employee: 450, employer: 900, severance: 0, salary: 18000 }) }),
    P({ id: "d-pen-b", ownerKey: B, kind: "pension", manufacturer: "קרן הדוגמה השנייה", planName: "פנסיה מקיפה", policyNumber: "1000003", status: "active", joinDate: "2005-01-01",
      balance: 520000, balanceSplit: { employee: 160000, employer: 220000, severance: 140000, other: null }, returnPct: 5.8,
      projectedCapitalNoDeposits: 1100000, projectedCapitalWithDeposits: 2400000, projectedPensionMonthlyNoDeposits: 4000, projectedPensionMonthlyWithDeposits: 8700,
      feeFromDepositPct: 1.2, feeFromBalancePct: 0.18, employer: "מפעל הדוגמה בע\"מ", salary: 21000, salaryDate: "2026-09-30", lastDepositDate: "2026-10-10", currentMonthlyDeposit: 4300,
      tracks: [{ name: "מסלול ברירת מחדל", balance: 520000, depositSharePct: 100, annualCostPct: 0.1, returnPct: 5.8, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null }],
      deposits: months(12, { employee: 1260, employer: 1365, severance: 1750, salary: 21000 }),
      coverages: [{ kind: "disability", insuredKey: B, productId: "d-pen-b", amount: null, monthlyBenefit: 10500, premium: null }] }),
    P({ id: "d-prov-b", ownerKey: B, kind: "provident", manufacturer: "גמל הדוגמה", planName: "קופת גמל", policyNumber: "2000004", status: "inactive", joinDate: "2010-01-01",
      balance: 60000, balanceSplit: { employee: null, employer: null, severance: null, other: 60000 }, returnPct: 4.4, feeFromDepositPct: null, feeFromBalancePct: 0.8,
      tracks: [{ name: "מסלול כללי", balance: 60000, depositSharePct: null, annualCostPct: 0.7, returnPct: 4.4, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null }] }),
    P({ id: "d-inv-a", ownerKey: A, kind: "investment", manufacturer: "גמל הדוגמה", planName: "גמל להשקעה", policyNumber: "2000005", status: "active", joinDate: "2019-06-01",
      balance: 30000, balanceSplit: { employee: null, employer: null, severance: null, other: 30000 }, returnPct: 7.0, feeFromDepositPct: null, feeFromBalancePct: 0.7,
      tracks: [{ name: "מסלול S&P 500", balance: 30000, depositSharePct: 100, annualCostPct: 0.4, returnPct: 7.0, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null }],
      deposits: months(12, { employee: 500, employer: 0, severance: 0, salary: 0 }).map((r) => ({ ...r, salary: null })) }),
    // insurance
    P({ id: "d-life-a", ownerKey: A, kind: "insurance", insuranceType: "life", manufacturer: "ביטוח הדוגמה", planName: "ביטוח חיים (ריסק)", policyNumber: "3000006", status: "active", joinDate: "2015-02-01",
      endDate: "2040-02-01", monthlyPremium: 85, premiumKind: "monthly", sources: ["har", "maslaka"],
      coverages: [{ kind: "death", insuredKey: A, productId: "d-life-a", amount: 1000000, monthlyBenefit: null, premium: 85 }] }),
    P({ id: "d-mort-b", ownerKey: B, kind: "insurance", insuranceType: "mortgageLife", manufacturer: "ביטוח הדוגמה", planName: "ביטוח חיים למשכנתא", policyNumber: "3000007", status: "active", joinDate: "2018-09-01",
      endDate: "2043-09-01", monthlyPremium: 60, premiumKind: "monthly", sources: ["har", "maslaka"],
      coverages: [{ kind: "mortgageLife", insuredKey: B, productId: "d-mort-b", amount: 600000, monthlyBenefit: null, premium: 60 }] }),
    P({ id: "d-health-a", ownerKey: A, kind: "insurance", insuranceType: "health", manufacturer: "בריאות הדוגמה", planName: "ביטוח בריאות", policyNumber: "3000008", status: "active", joinDate: "2016-04-01",
      monthlyPremium: 140, premiumKind: "monthly", sources: ["har"] }),
    P({ id: "d-health-c", ownerKey: C, kind: "insurance", insuranceType: "health", manufacturer: "בריאות הדוגמה", planName: "ביטוח בריאות לילד", policyNumber: "3000009", status: "active", joinDate: "2016-04-01",
      monthlyPremium: 45, premiumKind: "monthly", sources: ["har"] }),
    P({ id: "d-acc-b", ownerKey: B, kind: "insurance", insuranceType: "personalAccidents", manufacturer: "ביטוח הדוגמה", planName: "תאונות אישיות", policyNumber: "3000010", status: "active", joinDate: "2020-01-01",
      endDate: "2027-01-01", monthlyPremium: 35, premiumKind: "monthly", sources: ["har"] }),
    P({ id: "d-nurs-a", ownerKey: A, kind: "insurance", insuranceType: "nursing", manufacturer: "בריאות הדוגמה", planName: "ביטוח סיעודי", policyNumber: "3000011", status: "active", joinDate: "2017-07-01",
      monthlyPremium: 95, premiumKind: "monthly", sources: ["har"] }),
  ],
  loans: [
    { productId: "d-pen-a", productLabel: "פנסיה מקיפה, קרן הדוגמה", startDate: "2022-03-15", amount: 60000, interestPct: 3.9, monthlyPayment: 1100, balance: 35000, endDate: "2027-03-15" },
  ],
};

/** Single synthetic client: one person, savings and insurance, no loans. */
export const SYNTHETIC_SINGLE: ReportData = {
  asOfDate: DEMO_AS_OF,
  familyLabel: null,
  sources: { har: true, maslaka: true },
  persons: [{ key: A, displayName: "אורית דוגמה", idMasked: "***-**-101", role: "self", birthYear: 1984 }],
  products: SYNTHETIC_FAMILY.products.filter((p) => p.ownerKey === A),
  loans: SYNTHETIC_FAMILY.loans,
};
