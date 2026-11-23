// ס4–ס6 in ONE screen (owner decision 2026-11-23: "את הסימונים וי לסמן במסך אחד בלי חפירה מיותרת", "רק בסוף יהיה
// שידור"). Every enabled document is listed with its explanation, its card ("צפייה במסמך") and its own check; the
// policies document keeps the drawn signature. One button at the end sends the approvals in order (PoaFlow); nothing
// goes to Surense before the last one. A document approved earlier in the session (after an error and "נסו שוב")
// shows "אושר ונשמר" and is not asked again.
import { useState, type FormEvent } from "react";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { contactFor } from "@/lib/contacts";
import { POA_KINDS, POA_ROUTE, type PoaKind } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import type { PoaModules } from "@/lib/poa/api";
import { validateCheck, validateSignature } from "@/lib/poa/machine";
import { SignaturePad } from "@/questionnaires/components/SignaturePad";
import { DocCard } from "../DocCard";
import { Bar, CheckField, FieldError, StepCard, focusFirst, type ScreenBase } from "../parts";

const LEAD: Record<PoaKind, string> = { maslaka: C.s4.lead, harbit: C.s5.lead, policies: C.s6.lead };
const CHECK: Record<Exclude<PoaKind, "policies">, string> = { maslaka: C.s4.check, harbit: C.s5.check };
const fieldOf = (k: PoaKind) => (k === "policies" ? "sig" : `check-${k}`);

export function Approve({ headingRef, dir, prog, busy, seq, modules, previews, onSubmit, onBack }: ScreenBase & {
  /** while the approvals are being sent: which one of how many */
  seq: { n: number; m: number } | null;
  modules: PoaModules;
  previews: Partial<Record<PoaKind, Blob>>;
  /** the drawn signature when the policies document is among the open ones, else null */
  onSubmit: (signaturePng: string | null) => void;
  onBack?: () => void;
}) {
  const kinds = POA_KINDS.filter((k) => modules[k].enabled);
  const open = kinds.filter((k) => !modules[k].performed);
  const [checks, setChecks] = useState<Partial<Record<PoaKind, boolean>>>({});
  const [png, setPng] = useState<string | null>(null);
  const [errs, setErrs] = useState<Partial<Record<PoaKind, string>>>({});
  const [alt, setAlt] = useState(false);
  const ready = open.every((k) => !!previews[k]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<PoaKind, string>> = {};
    for (const k of open) {
      const m = k === "policies" ? validateSignature(png) : validateCheck(!!checks[k]);
      if (m) next[k] = m;
    }
    setErrs(next);
    const first = open.find((k) => next[k]);
    if (first) { focusFirst([fieldOf(first)], { [fieldOf(first)]: next[first] }); return; }
    onSubmit(open.includes("policies") ? png : null);
  };

  const sigDescribedBy = [errs.policies ? "poa-sig-err" : "", "poa-alt-btn"].filter(Boolean).join(" ");
  const cta = open.includes("policies") ? C.s6.cta : C.s3.cta;

  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-approve" title={C.s3.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s3.lead}</p>
        <ol className="sd-poa-approve">
          {kinds.map((k) => {
            const performed = modules[k].performed;
            return (
              <li key={k} className={performed ? "is-done" : undefined}>
                <p className="sd-q-hint">{LEAD[k]}</p>
                <DocCard kind={k} pdf={previews[k] ?? null} />
                {k === "harbit" && <p className="sd-q-fine">{C.s5.datesLine}</p>}
                {k === "policies" && (
                  <>
                    <p className="sd-poa-declaration">{C.s6.declaration}</p>
                    <p className="sd-q-fine">{C.s6.minorsLine}</p>
                  </>
                )}
                {performed ? (
                  <p className="sd-poa-approved">{C.s3.doneLine}</p>
                ) : k === "policies" ? (
                  <>
                    <p id="poa-sig-label" className="sd-q-sublabel">{C.s6.sigLabel}</p>
                    {/* focus target for the missing-signature error: the canvas itself cannot take focus */}
                    <div id="poa-sig" tabIndex={-1} role="group" aria-labelledby="poa-sig-label" aria-describedby={sigDescribedBy}
                      aria-invalid={errs.policies ? true : undefined}>
                      <SignaturePad label={C.s6.sigLabel} hint={C.s6.sigHint} undoLabel={C.s6.sigUndo} clearLabel={C.s6.sigClear}
                        onChange={(p) => { setPng(p); if (p) setErrs((x) => ({ ...x, policies: undefined })); }} />
                    </div>
                    <FieldError id="sig" err={errs.policies} />
                    <button type="button" id="poa-alt-btn" className="sd-q-linkbtn" aria-expanded={alt} aria-controls="poa-alt" onClick={() => setAlt(!alt)}>{C.s6.altSign}</button>
                    {alt && <div id="poa-alt" className="sd-poa-alt"><ContactIcons dept={contactFor(POA_ROUTE)} tone="dark" /></div>}
                  </>
                ) : (
                  <CheckField id={fieldOf(k)} checked={!!checks[k]} err={errs[k]}
                    onChange={(c) => { setChecks((x) => ({ ...x, [k]: c })); if (c) setErrs((x) => ({ ...x, [k]: undefined })); }}>
                    {CHECK[k]}
                  </CheckField>
                )}
              </li>
            );
          })}
        </ol>
      </StepCard>
      <Bar onBack={onBack} cta={cta} busy={busy || !ready} busyText={seq ? C.s3.preparing(seq.n, seq.m) : undefined} />
    </form>
  );
}
