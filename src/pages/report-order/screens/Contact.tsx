// ס2: mobile phone, optional email, terms (required), marketing (optional, never pre-checked).
import { useState, type FormEvent } from "react";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateContact, type Contact as ContactValue } from "@/lib/poa/machine";
import { Bar, CheckField, StepCard, TextField, focusFirst, type ScreenBase } from "../parts";

export function Contact({ headingRef, dir, prog, busy, initial, onSubmit, onBack }: ScreenBase & {
  initial: ContactValue; onSubmit: (v: ContactValue) => void; onBack: () => void;
}) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateContact>["errors"]>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validateContact(v);
    setErrors(r.errors);
    if (r.value) onSubmit(r.value); else focusFirst(["phone", "email", "terms"], r.errors);
  };
  const [t1, terms, t3, privacy] = C.s2.termsParts;
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-s2" title={C.s2.title} dir={dir} headingRef={headingRef} prog={prog}>
        <p className="sd-q-hint">{C.s2.lead}</p>
        <TextField id="phone" label={C.s2.labelPhone} value={v.phone} onChange={(phone) => setV({ ...v, phone })} err={errors.phone}
          ltr type="tel" inputMode="numeric" autoComplete="tel" />
        <TextField id="email" label={C.s2.labelEmail} value={v.email} onChange={(email) => setV({ ...v, email })} err={errors.email}
          ltr type="email" inputMode="email" autoComplete="email" />
        <CheckField id="terms" checked={v.terms} onChange={(t) => setV({ ...v, terms: t })} err={errors.terms}>
          {t1}<a href="/terms" target="_blank" rel="noopener noreferrer">{terms}</a>{t3}<a href="/privacy" target="_blank" rel="noopener noreferrer">{privacy}</a>
        </CheckField>
        <CheckField id="marketing" checked={v.marketing} onChange={(marketing) => setV({ ...v, marketing })}>{C.s2.marketing}</CheckField>
      </StepCard>
      <Bar onBack={onBack} cta={C.s2.cta} busy={busy} />
    </form>
  );
}
