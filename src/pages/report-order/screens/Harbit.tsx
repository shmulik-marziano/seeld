// ס5: the insurance mountain document, approved by a check. The birth date and the ID issue date were answered in
// ס1 (questions birth, issue) and go to the server with this approval.
import { useState, type FormEvent } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateCheck } from "@/lib/poa/machine";
import { DocCard } from "../DocCard";
import { Bar, CheckField, StepCard, focusFirst, type ScreenBase } from "../parts";

export function Harbit({ headingRef, dir, prog, busy, pdf, onSubmit, onBack }: ScreenBase & {
  pdf: Blob | null; onSubmit: () => void; onBack?: () => void;
}) {
  const [check, setCheck] = useState(false);
  const [err, setErr] = useState<string | undefined>(undefined);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validateCheck(check) && C.s5.errCheck;
    setErr(r || undefined);
    if (!r) onSubmit(); else focusFirst(["check"], { check: r });
  };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-harbit" title={C.s5.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s5.lead}</p>
        <DocCard kind="harbit" pdf={pdf} />
        <p className="sd-q-fine">{C.s5.datesLine}</p>
        <CheckField id="check" checked={check} onChange={(c) => { setCheck(c); if (err) setErr(undefined); }} err={err}>{C.s5.check}</CheckField>
      </StepCard>
      <Bar onBack={onBack} cta={C.s5.cta} busy={busy || !pdf} />
    </form>
  );
}
