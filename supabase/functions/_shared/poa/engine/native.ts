// The native engine (spec 1ב, owner decision 2026-11-22): the client's journey runs entirely on our side. start() takes no
// network call at all: the reference is a snapshot of the identity and the licence holder, kept encrypted by the
// session. preview() renders the unsigned document from the approved templates; consent() validates the module's data
// exactly as the tool would and records nothing itself (the handler records the consent and asks final() for the signed
// file, which it stores). The tool is fed later by the ship job (surense-worker, kind surense.poa_ship).
// Nothing here logs a value.
import type { Logger } from "../../logger.ts";
import { parseTtf, type TtfInfo } from "../../pdfkit/ttf.ts";
import { decodePng, fromBase64, PngError } from "../../pdfkit/png.ts";
import type { RawImage } from "../../pdfkit/writer.ts";
import { PoaToolError } from "../errors.ts";
import { harbitDates, pngBase64 } from "../formatters.ts";
import { renderPoa } from "../render.ts";
import type { ApprovalEvidence, ConsentData, EngineRef, ModuleFlags, PoaEngine, PoaIdentity, PoaKind, PoaLicensee } from "./types.ts";

export const NATIVE_URL_ID = "native";
/** a drawn signature larger than this is refused (a 300x64 canvas export is a few KB) */
export const MAX_SIGNATURE_PIXELS = 1_000_000;

export interface NativeEngineDeps {
  /** the licence holder printed in the documents, a value or a getter read at every start() (ops.config through api.poa_config
   *  first, the POA_LICENSEE_* secrets as the fallback); null = not configured (start answers `unavailable`) */
  licensee: PoaLicensee | null | (() => PoaLicensee | null);
  /** the two Rubik faces (bytes); parsed once, lazily */
  fonts: () => { regular: Uint8Array; bold: Uint8Array };
  log: Logger;
  now?: () => number;
  newSid?: () => string;
}

export function createNativeEngine(d: NativeEngineDeps): PoaEngine {
  const now = d.now ?? Date.now;
  const newSid = d.newSid ?? (() => crypto.randomUUID());
  let parsed: { regular: TtfInfo; bold: TtfInfo } | null = null;
  const fonts = () => {
    if (!parsed) {
      const f = d.fonts();
      parsed = { regular: parseTtf(f.regular), bold: parseTtf(f.bold) };
    }
    return parsed;
  };
  const need = (ref: EngineRef): { identity: PoaIdentity; licensee: PoaLicensee } => {
    if (!ref.identity || !ref.licensee) throw new PoaToolError("unavailable", "native_ref_incomplete");
    return { identity: ref.identity, licensee: ref.licensee };
  };
  const render = async (ref: EngineRef, kind: PoaKind, evidence?: { at: Date; ip: string; signature?: RawImage }) => {
    const { identity, licensee } = need(ref);
    try {
      return await renderPoa({ kind, identity, licensee, evidence, now: new Date(now()) }, fonts());
    } catch (e) {
      d.log.error("poa native render failed", { kind, error: e instanceof Error ? e.name : "unknown" });
      throw new PoaToolError("unavailable", "native_render");
    }
  };

  return {
    name: "native",

    async start(who, modules) {
      if (!modules.maslaka && !modules.harbit && !modules.policies) throw new PoaToolError("generic", "no_modules");
      const licensee = typeof d.licensee === "function" ? d.licensee() : d.licensee;
      if (!licensee) throw new PoaToolError("unavailable", "licensee_not_configured");
      d.log.info("poa engine started", { engine: "native", modules: Object.keys(modules).filter((k) => modules[k as PoaKind]).length });
      return { customerId: null, urlId: NATIVE_URL_ID, sid: newSid(), existing: false, identity: who, licensee, modules: { ...modules } as ModuleFlags };
    },

    // the same refusals the tool would give; nothing is stored here (the handler records the consent and stores the file)
    async consent(ref: EngineRef, kind: PoaKind, data: ConsentData) {
      need(ref);
      const bad = () => new PoaToolError("generic", "bad_consent_data");
      if (kind === "harbit") {
        if (!data.birthDate || !data.issueDate) throw bad();
        if ("error" in harbitDates(data.birthDate, data.issueDate, now())) throw bad();
      } else if (kind === "policies") {
        if (!data.signaturePng || !pngBase64(data.signaturePng)) throw bad();
      }
      return {};
    },

    preview(ref, kind) {
      return render(ref, kind);
    },

    async final(ref, kind, evidence: ApprovalEvidence) {
      let signature: RawImage | undefined;
      if (kind === "policies") {
        const b64 = evidence.signaturePng ? pngBase64(evidence.signaturePng) : null;
        if (!b64) throw new PoaToolError("generic", "bad_consent_data");
        try {
          signature = await decodePng(fromBase64(b64));
        } catch (e) {
          throw new PoaToolError("generic", e instanceof PngError ? e.code : "png_decode");
        }
        if (signature.width * signature.height > MAX_SIGNATURE_PIXELS) throw new PoaToolError("generic", "png_size");
      }
      return await render(ref, kind, { at: new Date(evidence.atMs), ip: evidence.ip, signature });
    },
  };
}
