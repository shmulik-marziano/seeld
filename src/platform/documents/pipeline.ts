// Normalisation pipeline contract: validate -> parse -> schema check -> normalise.
// Pure orchestration over a SourceAdapter; reports status transitions through hooks so a future
// worker can persist them to document_ingestions.
import {
  NotImplementedError,
  canTransition,
  type FileDescriptor,
  type IngestionStatus,
  type NormalisedProduct,
  type PipelineHooks,
  type PipelineResult,
  type SourceAdapter,
} from "./types";

export async function runPipeline(
  adapter: SourceAdapter<unknown>,
  file: FileDescriptor,
  bytes: Uint8Array,
  hooks: PipelineHooks = {},
): Promise<PipelineResult> {
  let status: IngestionStatus = "uploaded";
  const move = (to: IngestionStatus, info?: { errorCode?: string }) => {
    if (!canTransition(status, to)) throw new Error(`illegal transition ${status} -> ${to}`);
    status = to;
    hooks.onStatus?.(to, info);
  };
  const fail = (errorCode: string): PipelineResult => {
    move("failed", { errorCode });
    return { status, products: [], errorCode };
  };

  move("validating");
  const v = adapter.validate(file);
  if (!v.ok) {
    move("rejected", { errorCode: v.reasons[0] });
    return { status, products: [], errorCode: v.reasons[0] };
  }

  move("parsing");
  let raw: unknown;
  try {
    raw = await adapter.parse(bytes, file);
  } catch (e) {
    return fail(e instanceof NotImplementedError ? "not_implemented" : "parse_error");
  }
  const checked = adapter.rawSchema.safeParse(raw);
  if (!checked.success) return fail("schema_mismatch");

  move("normalising");
  let products: NormalisedProduct[];
  try {
    products = adapter.normalise(checked.data);
  } catch (e) {
    return fail(e instanceof NotImplementedError ? "not_implemented" : "normalise_error");
  }
  move("ready");
  return { status, products };
}
