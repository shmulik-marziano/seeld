// ס1: first name, last name, national ID. Blank fields get the spec strings; anything else the validator's message.
import { useState, type FormEvent } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateIdentity, type Identity as IdentityValue } from "@/lib/poa/machine";
import { Bar, StepCard, TextField, focusFirst, type ScreenBase } from "../parts";

export function Identity({ headingRef, dir, prog, busy, initial, onSubmit, onBack }: ScreenBase & {
  initial: IdentityValue; onSubmit: (v: IdentityValue) => void; onBack: () => void;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateIdentity>["errors"]>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validateIdentity(v);
    setErrors(r.errors);
    if (r.value) onSubmit(r.value); else focusFirst(["first", "last", "id"], r.errors);
  };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-s1" title={C.s1.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s1.lead}</p>
        <TextField id="first" label={C.s1.labelFirst} value={v.first} onChange={(first) => setV({ ...v, first })} err={errors.first} autoComplete="given-name" />
        <TextField id="last" label={C.s1.labelLast} value={v.last} onChange={(last) => setV({ ...v, last })} err={errors.last} autoComplete="family-name" />
        <TextField id="id" label={C.s1.labelId} value={v.id} onChange={(id) => setV({ ...v, id })} err={errors.id} ltr inputMode="numeric" autoComplete="off" />
        <p className="sd-q-fine">{C.s1.why}</p>
      </StepCard>
      <Bar onBack={onBack} cta={C.s1.cta} busy={busy} />
    </form>
  );
}
