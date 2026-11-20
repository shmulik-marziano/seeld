// ס5: the insurance mountain document. Birth date and ID issue date (dd/mm/yyyy), approved by a check.
// The birth date is always editable: the server never returns it (spec ס5).
import { useState, type FormEvent } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateHarbit } from "@/lib/poa/machine";
import { DateField } from "../DateField";
import { DocCard } from "../DocCard";
import { Bar, CheckField, StepCard, focusFirst, type ScreenBase } from "../parts";

export interface HarbitDraft { birth: string; issue: string }

export function Harbit({ headingRef, dir, prog, busy, pdf, initial, onDraft, onSubmit, onBack }: ScreenBase & {
  pdf: Blob | null; onSubmit: (v: { birth_date: string; issue_date: string }) => void; onBack?: () => void;
  /** the dates typed so far, kept by the page so "נסו שוב" after an error does not wipe them (memory only) */
  initial?: HarbitDraft; onDraft?: (d: HarbitDraft) => void;
}) {
  const [v, setRaw] = useState({ birth: initial?.birth ?? "", issue: initial?.issue ?? "", check: false });
  const setV = (n: typeof v) => { setRaw(n); onDraft?.({ birth: n.birth, issue: n.issue }); };
  const [errors, setErrors] = useState<ReturnType<typeof validateHarbit>["errors"]>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validateHarbit(v);
    setErrors(r.errors);
    if (r.value) onSubmit(r.value); else focusFirst(["birth", "issue", "check"], r.errors);
  };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-harbit" title={C.s5.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s5.lead}</p>
        <DocCard kind="harbit" pdf={pdf} />
        <DateField id="birth" label={C.s5.labelBirth} value={v.birth} onChange={(birth) => setV({ ...v, birth })} err={errors.birth} />
        <DateField id="issue" label={C.s5.labelIssue} value={v.issue} onChange={(issue) => setV({ ...v, issue })} err={errors.issue} />
        <p className="sd-q-fine">{C.s5.why}</p>
        <CheckField id="check" checked={v.check} onChange={(check) => setV({ ...v, check })} err={errors.check}>{C.s5.check}</CheckField>
      </StepCard>
      <Bar onBack={onBack} cta={C.s5.cta} busy={busy || !pdf} />
    </form>
  );
}
