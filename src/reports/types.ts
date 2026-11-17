// Normalised report model (zod). Every parser (real or mock) returns this; every builder consumes it.
// No real client data lives in this repo: fixtures are synthetic. Numbers that a source did not supply are null, never 0.
import { z } from "zod";

export const ReportModeSchema = z.enum(["insurance", "financial", "unified"]);
export type ReportMode = z.infer<typeof ReportModeSchema>;

const nn = z.number().finite().nullable();

export const PersonSchema = z.object({
  /** opaque in-memory key (hash of the id number). The id number itself is never kept. */
  key: z.string(),
  displayName: z.string(),
  /** e.g. "***-**-123": last three digits only */
  idMasked: z.string(),
  role: z.enum(["self", "spouse", "child", "other"]).default("other"),
  birthYear: z.number().int().nullable().default(null),
});
export type Person = z.infer<typeof PersonSchema>;

export const ProductKindSchema = z.enum(["pension", "provident", "training", "investment", "childInvestment", "managers", "insurance", "unknown"]);
export type ProductKind = z.infer<typeof ProductKindSchema>;

export const InsuranceTypeSchema = z.enum([
  "life", "mortgageLife", "health", "nursing", "personalAccidents", "criticalIllness", "disability", "accidentDisability",
  "vehicle", "home", "business", "serviceLetter", "other",
]);
export type InsuranceType = z.infer<typeof InsuranceTypeSchema>;

export const ProductStatusSchema = z.enum(["active", "inactive", "unknown"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const CoverageKindSchema = z.enum([
  "disability", "survivors", "death", "nursing", "health", "mortgageLife", "personalAccidents", "criticalIllness", "accidentDisability",
]);
export type CoverageKind = z.infer<typeof CoverageKindSchema>;

export const CoverageSchema = z.object({
  kind: CoverageKindSchema,
  insuredKey: z.string(),
  productId: z.string(),
  /** lump sum (death cover etc.) */
  amount: nn.default(null),
  /** monthly benefit (disability, survivors) */
  monthlyBenefit: nn.default(null),
  premium: nn.default(null),
});
export type Coverage = z.infer<typeof CoverageSchema>;

export const InvestmentTrackSchema = z.object({
  name: z.string(),
  balance: nn.default(null),
  /** share of new deposits directed to the track, percent */
  depositSharePct: nn.default(null),
  annualCostPct: nn.default(null),
  /** net return as reported by the manufacturer for the reporting period, percent */
  returnPct: nn.default(null),
  /** horizons the files rarely carry: null means "not received" */
  return12mPct: nn.default(null),
  return3yAvgPct: nn.default(null),
  return5yAvgPct: nn.default(null),
});
export type InvestmentTrack = z.infer<typeof InvestmentTrackSchema>;

export const DepositRowSchema = z.object({
  /** YYYY-MM of the value date */
  month: z.string().regex(/^\d{4}-\d{2}$/),
  /** deposits by a payer code the code table does not name (SUG-MAFKID 3..6, inferred) */
  other: nn.default(null),
  employee: nn.default(null),
  employer: nn.default(null),
  severance: nn.default(null),
  salary: nn.default(null),
});
export type DepositRow = z.infer<typeof DepositRowSchema>;

export const LoanSchema = z.object({
  productId: z.string(),
  productLabel: z.string(),
  startDate: z.string().nullable().default(null),
  amount: nn.default(null),
  interestPct: nn.default(null),
  monthlyPayment: nn.default(null),
  balance: nn.default(null),
  endDate: z.string().nullable().default(null),
});
export type Loan = z.infer<typeof LoanSchema>;

export const BalanceSplitSchema = z.object({
  employee: nn.default(null),
  employer: nn.default(null),
  severance: nn.default(null),
  other: nn.default(null),
});

/** Groups read from the file for which no report block exists yet ("read, not shown yet"). */
export const ProductExtrasSchema = z.object({
  feeBenefits: z.array(z.object({ kind: z.enum(["deposit", "balance", "unknown"]), discountPct: nn.default(null), endDate: z.string().nullable().default(null), benefitType: z.string().nullable().default(null) })).default([]),
  collection: z.object({ frequency: z.string().nullable().default(null), method: z.string().nullable().default(null) }).nullable().default(null),
  hasClaim: z.boolean().nullable().default(null),
  severance: z.object({ waived: z.string().nullable().default(null), forfeited: z.string().nullable().default(null) }).nullable().default(null),
  hasProxy: z.boolean().nullable().default(null),
}).default({});
export type ProductExtras = z.infer<typeof ProductExtrasSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  ownerKey: z.string(),
  kind: ProductKindSchema,
  insuranceType: InsuranceTypeSchema.nullable().default(null),
  manufacturer: z.string(),
  planName: z.string(),
  policyNumber: z.string().nullable().default(null),
  status: ProductStatusSchema.default("unknown"),
  joinDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  /** date the balance/figures are valid for (ISO yyyy-mm-dd) */
  asOfDate: z.string().nullable().default(null),
  sources: z.array(z.enum(["har", "maslaka"])).min(1),
  // savings figures
  balance: nn.default(null),
  balanceSplit: BalanceSplitSchema.default({}),
  projectedPensionMonthlyNoDeposits: nn.default(null),
  projectedPensionMonthlyWithDeposits: nn.default(null),
  projectedCapitalNoDeposits: nn.default(null),
  projectedCapitalWithDeposits: nn.default(null),
  feeFromDepositPct: nn.default(null),
  feeFromBalancePct: nn.default(null),
  returnPct: nn.default(null),
  tracks: z.array(InvestmentTrackSchema).default([]),
  // employment: only shown with viewDeposits
  employer: z.string().nullable().default(null),
  salary: nn.default(null),
  salaryDate: z.string().nullable().default(null),
  lastDepositDate: z.string().nullable().default(null),
  currentMonthlyDeposit: nn.default(null),
  deposits: z.array(DepositRowSchema).default([]),
  // insurance figures
  monthlyPremium: nn.default(null),
  premiumKind: z.enum(["monthly", "annual-converted", "one-time", "unknown"]).default("unknown"),
  /** how the product type was decided: plan name, a code table (inferred) or the Har Habituach value sets */
  typeBasis: z.enum(["plan-name", "code", "har-dictionary", "unknown"]).default("unknown"),
  /** Har Habituach period values that are not dates */
  term: z.enum(["renewing", "lifelong"]).nullable().default(null),
  planClass: z.enum(["personal", "group", "group-hmo"]).nullable().default(null),
  extras: ProductExtrasSchema,
  coverages: z.array(CoverageSchema).default([]),
  /** true when a newer extraction of the same manufacturer replaced nothing for this product (only the older run has it) */
  fromOlderExtraction: z.boolean().default(false),
});
export type Product = z.infer<typeof ProductSchema>;

export const ReportDataSchema = z.object({
  /** ISO date of the clearing-house / Har Habituach extraction the report relies on */
  asOfDate: z.string(),
  familyLabel: z.string().nullable().default(null),
  persons: z.array(PersonSchema).min(1),
  products: z.array(ProductSchema),
  loans: z.array(LoanSchema).default([]),
  sources: z.object({ har: z.boolean(), maslaka: z.boolean() }),
});
export type ReportData = z.infer<typeof ReportDataSchema>;

// ---------------------------------------------------------------- entitlements
export const TierSchema = z.enum(["visitor", "client", "agent"]);
export type Tier = z.infer<typeof TierSchema>;

export const EntitlementsSchema = z.object({
  tier: TierSchema,
  /** information-viewing authorisation signed AND policy copies loaded (NOT an agent appointment) */
  viewDeposits: z.boolean(),
});
export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const ENTITLEMENTS: Record<Tier, Entitlements> = {
  visitor: { tier: "visitor", viewDeposits: false },
  client: { tier: "client", viewDeposits: true },
  agent: { tier: "agent", viewDeposits: true },
};

// ---------------------------------------------------------------- block lock model
export const LockReasonSchema = z.enum(["needs_policy_copy", "needs_information_order", "needs_client_authorisation", "not_in_source_files"]);
export type LockReason = z.infer<typeof LockReasonSchema>;

export const BlockStateSchema = z.object({
  id: z.string(),
  status: z.enum(["shown", "locked"]),
  reason: LockReasonSchema.nullable(),
  /** agent view only: this block would be locked for the client tier */
  lockedForClient: z.boolean(),
});
export type BlockState = z.infer<typeof BlockStateSchema>;

// ---------------------------------------------------------------- computed report
export const SliceSchema = z.object({ label: z.string(), value: z.number(), pct: z.number() });
export type Slice = z.infer<typeof SliceSchema>;

export interface PersonCoverageCard {
  person: Person;
  premiumMonthly: number | null;
  /** nine tiles, always all nine */
  tiles: { kind: CoverageKind; state: "exists" | "amount" | "none-received"; amount: number | null; monthlyBenefit: number | null }[];
  products: Product[];
}

export interface Report {
  mode: ReportMode;
  data: ReportData;
  entitlements: Entitlements;
  blocks: BlockState[];
  coverage: { shown: number; total: number };
  summary: {
    totalSavings: number | null;
    returnPct: number | null;
    premiumTotal: number | null;
    premiumLife: number | null;
    premiumHealth: number | null;
    savingsCount: number;
    insuranceCount: number;
    /** products whose figures come from an older extraction */
    olderExtractionCount: number;
    /** products whose type code is not in any code table (shown as "לא התקבל מידע") */
    unclassifiedCount: number;
    /** products whose status code is not understood */
    unknownStatusCount: number;
    /** groups read from the files but without a report block yet */
    notShownGroups: string[];
  };
  donuts: { byType: Slice[]; byManufacturer: Slice[] };
  capitalByType: { employee: number | null; employer: number | null; severance: number | null; other: number | null; total: number | null };
  depositsMonthlyByType: { employee: number | null; employer: number | null; severance: number | null; total: number | null };
  projection: { noDeposits: { capital: number | null; pension: number | null }; withDeposits: { capital: number | null; pension: number | null } };
  personCards: PersonCoverageCard[];
}
