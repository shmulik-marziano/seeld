// Registry of source adapters. Adding a source = implement SourceAdapter, call registerSource().
import {
  clearingHouseRawSchema,
  harHabituachRawSchema,
  thirdSourceRawSchema,
} from "./schemas";
import {
  NotImplementedError,
  SOURCE_TYPES,
  type FileDescriptor,
  type SourceAdapter,
  type SourceType,
  type ValidationOutcome,
} from "./types";

const MB = 1024 * 1024;

function baseValidate(accepted: readonly string[], max: number) {
  return (file: FileDescriptor): ValidationOutcome => {
    const reasons: string[] = [];
    if (!accepted.includes(file.mimeType)) reasons.push("unsupported_mime_type");
    if (file.sizeBytes <= 0) reasons.push("empty_file");
    if (file.sizeBytes > max) reasons.push("file_too_large");
    return { ok: reasons.length === 0, reasons };
  };
}

function stubAdapter<T>(
  type: SourceType,
  displayName: string,
  accepted: readonly string[],
  max: number,
  rawSchema: SourceAdapter<T>["rawSchema"],
): SourceAdapter<T> {
  return {
    type,
    displayName,
    acceptedMimeTypes: accepted,
    maxSizeBytes: max,
    rawSchema,
    validate: baseValidate(accepted, max),
    async parse() {
      throw new NotImplementedError(`${type} parser`);
    },
    normalise() {
      throw new NotImplementedError(`${type} normaliser`);
    },
  };
}

// TODO(owner): confirm accepted formats per source after sample files arrive.
const COMMON = ["application/pdf", "application/xml", "text/xml", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

const adapters = new Map<SourceType, SourceAdapter<unknown>>();

export function registerSource<T>(adapter: SourceAdapter<T>): void {
  // adapters are stored type-erased; the pipeline re-validates raw output with rawSchema
  if (adapters.has(adapter.type)) throw new Error(`source already registered: ${adapter.type}`);
  adapters.set(adapter.type, adapter as unknown as SourceAdapter<unknown>);
}

export function getSource(type: SourceType): SourceAdapter<unknown> {
  const a = adapters.get(type);
  if (!a) throw new Error(`unknown source type: ${type}`);
  return a;
}

export function listSources(): SourceAdapter<unknown>[] {
  return [...adapters.values()];
}

registerSource(stubAdapter("clearing-house", "מסלקה פנסיונית", COMMON, 25 * MB, clearingHouseRawSchema));
registerSource(stubAdapter("har-habituach", "הר הביטוח", COMMON, 25 * MB, harHabituachRawSchema));
registerSource(stubAdapter("third-source", "מקור שלישי (טרם הוגדר)", COMMON, 25 * MB, thirdSourceRawSchema));

export { SOURCE_TYPES };
