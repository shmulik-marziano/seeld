// ס4: the pension clearing house document. Approved by a check (spec §3).
import { useState, type FormEvent } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateCheck } from "@/lib/poa/machine";
import { DocCard } from "../DocCard";
import { Bar, CheckField, StepCard, focusFirst, type ScreenBase } from "../parts";

export function Maslaka({ headingRef, dir, prog, busy, pdf, onSubmit, onBack }: ScreenBase & {
  pdf: Blob | null; onSubmit: () => void; onBack?: () => void;
}) {
  const [check, setCheck] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const m = validateCheck(check);
    setErr(m);
    if (m) focusFirst(["check"], { check: m }); else onSubmit();
  };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-maslaka" title={C.s4.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s4.lead}</p>
        <DocCard kind="maslaka" pdf={pdf} />
        <CheckField id="check" checked={check} onChange={setCheck} err={err}>{C.s4.check}</CheckField>
      </StepCard>
      <Bar onBack={onBack} cta={C.s4.cta} busy={busy || !pdf} />
    </form>
  );
}
