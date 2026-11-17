// Questionnaire spine: schemas and types. Definitions live in src/data/questionnaires/*.json and are validated
// against these schemas by scripts/questionnaires/build.mjs (run in vitest). Field names of questions follow the
// insform.questions columns (snake_case) so an exported row stays recognisable; our own additions live in `meta`.
import { z } from "zod";

export const QUESTION_TYPES = ["choice", "date", "file", "long", "multi", "number", "repeat", "text", "consent"] as const;
export const FORMATS = ["email", "israeli-id", "passport", "person-name", "phone", "digits", "full-name", "bank-account", "branch-code", "bank-pick"] as const;
export const NUMBER_KINDS = ["amount", "percent", "year", "integer", "decimal", "height", "weight"] as const;

/** Show a question only when the answer of `id` equals `value` (string) or is one of `value` (array). Multi answers match when they contain any. */
export const ConditionSchema = z.object({
  id: z.string().min(1),
  value: z.union([z.string(), z.array(z.string()).min(1)]),
});

export const SubFieldSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(QUESTION_TYPES),
    label: z.string().min(1),
    section: z.string().optional(),
    required: z.boolean().optional(),
    maxLength: z.number().int().positive().optional(),
    format: z.enum(FORMATS).optional(),
    options: z.array(z.string()).optional(),
    when: ConditionSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
    allowUnknown: z.boolean().optional(),
    allowFuture: z.boolean().optional(),
  })
  .strict();

export const QuestionMetaSchema = z
  .object({
    sectionId: z.string(),
    bankId: z.number().nullable().optional(),
    gate: z.boolean().optional(),
    draft: z.boolean().optional(),
    todo: z.string().optional(),
    numberKind: z.enum(NUMBER_KINDS).optional(),
    unit: z.string().optional(),
    allowFuture: z.boolean().optional(),
    futureOnly: z.boolean().optional(),
    afterKey: z.string().optional(),
    dateRole: z.enum(["birth"]).optional(),
    minEntries: z.number().int().min(0).optional(),
    maxEntries: z.number().int().min(1).optional(),
    singleForm: z.boolean().optional(),
    /** Optional target field in the agent's system (Surense). The bank has no such mapping yet. */
    surenseField: z.string().optional(),
    note: z.string().optional(),
    /** Picker widget backed by public/ref data. */
    widget: z.enum(["city", "street", "healthfund", "bank", "branch"]).optional(),
    /** Repeat group whose entry count follows the numeric answer of this key. */
    countFrom: z.string().optional(),
  })
  .strict();

export const QuestionSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    section: z.string(),
    type: z.enum(QUESTION_TYPES),
    required: z.boolean(),
    allow_unknown: z.boolean(),
    format: z.enum(FORMATS).nullable(),
    hint: z.string().nullable(),
    options: z.array(z.string()).nullable(),
    when: ConditionSchema.nullable(),
    fields: z.array(SubFieldSchema).nullable(),
    min_val: z.number().nullable(),
    max_val: z.number().nullable(),
    integer_only: z.boolean(),
    max_length: z.number().int().positive().nullable(),
    origin: z.string(),
    confidence: z.string().nullable(),
    version: z.number().int(),
    meta: QuestionMetaSchema,
  })
  .strict();

export const SectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    intro: z.string().nullable(),
    spot: z.string().nullable(),
    /** Follow-up module: shown only when one of its screening gates is answered YES. */
    module: z.boolean(),
    questions: z.array(QuestionSchema).min(1),
  })
  .strict();

export const IntroSchema = z
  .object({
    title: z.string(),
    body: z.array(z.string()).min(1),
    consentLabel: z.string(),
    todo: z.string().optional(),
  })
  .strict();

export const ScreeningSchema = z
  .object({
    title: z.string(),
    intro: z.string(),
    gates: z.array(z.object({ key: z.string(), sectionId: z.string() }).strict()).min(1),
  })
  .strict();

export const DeclarationSchema = z
  .object({ title: z.string(), paragraphs: z.array(z.string()).min(1), checkbox: z.string() })
  .strict();

export const QuestionnaireSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9-]*$/),
    version: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().min(1),
    status: z.enum(["live", "draft-for-approval"]),
    group: z.enum(["core", "extra"]),
    intro: IntroSchema.nullable(),
    consent: z.unknown().nullable(),
    notes: z.array(z.string()),
    screening: ScreeningSchema.optional(),
    declaration: DeclarationSchema,
    sections: z.array(SectionSchema).min(1),
  })
  .strict();

export type Declaration = z.infer<typeof DeclarationSchema>;
export type Screening = z.infer<typeof ScreeningSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type SubField = z.infer<typeof SubFieldSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Special answer meaning "I don't know" (only for questions with allow_unknown). */
export const UNKNOWN = { unknown: true } as const;
export type UnknownAnswer = typeof UNKNOWN;
export interface RepeatEntry { [field: string]: AnswerValue }
export type AnswerValue = string | number | string[] | RepeatEntry[] | UnknownAnswer | null | undefined | RepeatEntry;
export type Answers = Record<string, AnswerValue>;

export function isUnknown(v: unknown): v is UnknownAnswer {
  return typeof v === "object" && v !== null && !Array.isArray(v) && (v as { unknown?: unknown }).unknown === true;
}

export const UNKNOWN_OPTION = "לא יודע/ת";

export type QuestionnaireStatus = "not-started" | "in-progress" | "ready" | "submitted";
export type RunnerMode = "agent" | "client-link" | "meeting";

/** Where a submitted answer comes from. 'pre_treatment_questionnaire' is the bank name of rank 4 in src/platform/sources. */
export const QUESTIONNAIRE_SOURCE = "pre_treatment_questionnaire" as const;
export const QUESTIONNAIRE_SOURCE_RANK = 4 as const;

export const QUESTIONNAIRE_KEYS = [
  "direct-debit",
  "personal",
  "personal-extended",
  "health",
  "needs-assessment",
  "retirement-planning",
  "insurance-need",
  "occupation-income",
  "hazardous-activities",
  "accidents-disability",
  "savings-join",
  "travel-trip",
] as const;
export type QuestionnaireKey = (typeof QUESTIONNAIRE_KEYS)[number];
