// Zod schemas of the raw, source-shaped structures. All three are deliberately loose (passthrough)
// with TODO fields: the real shapes are decided after the owner supplies sample files.
import { z } from "zod";

/** Clearing house ("מסלקה") pension file. */
export const clearingHouseRawSchema = z
  .object({
    // TODO(owner): confirm file format (XML / XLSX / PDF) and field names from a real sample.
    reportDate: z.string().optional(),
    holderIdHash: z.string().optional(), // hash only, never the raw ID number
    accounts: z
      .array(
        z
          .object({
            accountRef: z.string(),
            productType: z.string().optional(),
            providerName: z.string().optional(),
            // TODO: balance, monthly deposit, fee percentages, status, dates
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type ClearingHouseRaw = z.infer<typeof clearingHouseRawSchema>;

/** Har HaBituach (insurance mountain) file. */
export const harHabituachRawSchema = z
  .object({
    // TODO(owner): confirm format and fields from a real sample.
    reportDate: z.string().optional(),
    holderIdHash: z.string().optional(),
    policies: z
      .array(
        z
          .object({
            policyRef: z.string(),
            branch: z.string().optional(),
            insurerName: z.string().optional(),
            // TODO: coverage, premium, start/end dates, beneficiaries flag
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();
export type HarHabituachRaw = z.infer<typeof harHabituachRawSchema>;

/** Third source: undefined. Placeholder accepting any object until the owner names the source. */
export const thirdSourceRawSchema = z.object({}).passthrough();
export type ThirdSourceRaw = z.infer<typeof thirdSourceRawSchema>;

/** Row shape of public.document_sources in supabase/proposed/. */
export const documentSourceRowSchema = z.object({
  id: z.string().uuid(),
  source_type: z.enum(["clearing-house", "har-habituach", "third-source"]),
  display_name: z.string(),
  enabled: z.boolean(),
});

/** Row shape of public.document_ingestions in supabase/proposed/. */
export const documentIngestionRowSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  source_type: z.enum(["clearing-house", "har-habituach", "third-source"]),
  status: z.enum(["uploaded", "validating", "parsing", "normalising", "ready", "failed", "rejected"]),
  error_code: z.string().nullable(),
  storage_path: z.string(),
  created_at: z.string(),
  finished_at: z.string().nullable(),
});
