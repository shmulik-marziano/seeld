// Document sources: contracts, ingestion status model, normalisation pipeline contract.
// No parsing is implemented. Real parsers arrive per source, later, behind these interfaces.
import type { ZodType } from "zod";

export const SOURCE_TYPES = ["clearing-house", "har-habituach", "third-source"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Lifecycle of one uploaded file. Terminal states: ready, failed, rejected. */
export const INGESTION_STATUSES = [
  "uploaded",
  "validating",
  "parsing",
  "normalising",
  "ready",
  "failed",
  "rejected",
] as const;
export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

const TRANSITIONS: Record<IngestionStatus, IngestionStatus[]> = {
  uploaded: ["validating", "rejected", "failed"],
  validating: ["parsing", "rejected", "failed"],
  parsing: ["normalising", "failed"],
  normalising: ["ready", "failed"],
  ready: [],
  failed: ["uploaded"], // retry re-enters the pipeline
  rejected: [],
};

export function canTransition(from: IngestionStatus, to: IngestionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(s: IngestionStatus): boolean {
  return s === "ready" || s === "rejected";
}

export interface IngestionRecord {
  id: string;
  sourceType: SourceType;
  status: IngestionStatus;
  /** Machine-readable reason when failed or rejected. Never contains file content or PII. */
  errorCode?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface FileDescriptor {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

/** What a normalised row looks like once a source is parsed: source-agnostic product facts. */
export interface NormalisedProduct {
  sourceType: SourceType;
  /** Stable id within the source file, used for de-duplication. */
  sourceRef: string;
  category: "pension" | "provident" | "study-fund" | "life" | "health" | "other";
  providerName?: string;
  // TODO(owner): final field list after sample files are reviewed (balance, fees, coverage, dates).
  data: Record<string, unknown>;
}

export interface ValidationOutcome {
  ok: boolean;
  /** Machine codes only. */
  reasons: string[];
}

/**
 * One adapter per source type. Stages are separate so each is testable and replaceable:
 * validate (cheap file checks) -> parse (raw rows, source-shaped) -> normalise (unified products).
 */
export interface SourceAdapter<TRaw = unknown> {
  readonly type: SourceType;
  readonly displayName: string;
  readonly acceptedMimeTypes: readonly string[];
  readonly maxSizeBytes: number;
  /** Schema of the parsed (raw, source-shaped) structure. */
  readonly rawSchema: ZodType<TRaw>;
  validate(file: FileDescriptor): ValidationOutcome;
  /** Not implemented yet for any source. Must throw NotImplementedError until built. */
  parse(bytes: Uint8Array, file: FileDescriptor): Promise<TRaw>;
  normalise(raw: TRaw): NormalisedProduct[];
}

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what} is not implemented yet`);
    this.name = "NotImplementedError";
  }
}

export interface PipelineHooks {
  onStatus?(status: IngestionStatus, info?: { errorCode?: string }): void;
}

export interface PipelineResult {
  status: IngestionStatus;
  products: NormalisedProduct[];
  errorCode?: string;
}
