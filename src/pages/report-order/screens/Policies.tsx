// ס6: policy copies, the only document signed by hand (spec §3, owner default 9). Uses the existing SignaturePad
// as it is (PNG only); vector strokes (onStrokes) are PR 3. The alternative opens the contact buttons.
import { useState, type FormEvent } from "react";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { contactFor } from "@/lib/contacts";
import { POA_ROUTE } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateSignature } from "@/lib/poa/machine";
import { SignaturePad } from "@/questionnaires/components/SignaturePad";
import { DocCard } from "../DocCard";
import { Bar, FieldError, StepCard, focusFirst, type ScreenBase } from "../parts";

export function Policies({ headingRef, dir, prog, busy, pdf, onSubmit, onBack }: ScreenBase & {
  pdf: Blob | null; onSubmit: (png: string) => void; onBack?: () => void;
}) {
  const [png, setPng] = useState<string | null>(null);
  const [err, setErr] = useState<string | undefined>();
  const [alt, setAlt] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const m = validateSignature(png);
    setErr(m);
    if (m) focusFirst(["sig"], { sig: m }); else if (png) onSubmit(png);
  };
  const describedBy = [err ? "poa-sig-err" : "", "poa-alt-btn"].filter(Boolean).join(" ");
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-policies" title={C.s6.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s6.lead}</p>
        <DocCard kind="policies" pdf={pdf} />
        <p className="sd-poa-declaration">{C.s6.declaration}</p>
        <p className="sd-q-fine">{C.s6.minorsLine}</p>
        <p id="poa-sig-label" className="sd-q-sublabel">{C.s6.sigLabel}</p>
        {/* focus target for the missing-signature error: the canvas itself cannot take focus */}
        <div id="poa-sig" tabIndex={-1} role="group" aria-labelledby="poa-sig-label" aria-describedby={describedBy}
          aria-invalid={err ? true : undefined}>
          <SignaturePad label={C.s6.sigLabel} hint={C.s6.sigHint} undoLabel={C.s6.sigUndo} clearLabel={C.s6.sigClear}
            onChange={(p) => { setPng(p); if (p) setErr(undefined); }} />
        </div>
        <FieldError id="sig" err={err} />
        <button type="button" id="poa-alt-btn" className="sd-q-linkbtn" aria-expanded={alt} aria-controls="poa-alt" onClick={() => setAlt(!alt)}>{C.s6.altSign}</button>
        {alt && <div id="poa-alt" className="sd-poa-alt"><ContactIcons dept={contactFor(POA_ROUTE)} tone="dark" /></div>}
      </StepCard>
      <Bar onBack={onBack} cta={C.s6.cta} busy={busy || !pdf} />
    </form>
  );
}
