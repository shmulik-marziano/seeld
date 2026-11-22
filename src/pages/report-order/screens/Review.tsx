// ס2א: the details that will appear in the documents, from component state only. "תיקון" is open until the server
// answers the start call; after that the link is gone (changing details means starting again, spec ס2א).
import type { FormEvent } from "react";
import { formatDateHe, formatPhone } from "@/questionnaires/validators";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { POA_COPY as C } from "@/lib/poa/copy";
import type { Details } from "@/lib/poa/machine";
import { Bar, StepCard, type ScreenBase } from "../parts";
import type { TurnstileProps } from "../useTurnstileToken";

export function Review({ headingRef, dir, prog, busy, details: d, started, turnstile, onConfirm, onEdit, onBack }: ScreenBase & {
  details: Details; started: boolean; turnstile?: TurnstileProps; onConfirm: () => void; onEdit: () => void; onBack?: () => void;
}) {
  const submit = (e: FormEvent) => { e.preventDefault(); onConfirm(); };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-s2a" title={C.s2a.title} dir={dir} headingRef={headingRef} prog={prog}>
        <dl className="sd-poa-rows sd-poa-review">
          <div><dt>{C.s2a.labelName}</dt><dd>{d.first} {d.last}</dd></div>
          <div><dt>{C.s2a.labelId}</dt><dd dir="ltr">{d.id}</dd></div>
          <div><dt>{C.s2a.labelBirth}</dt><dd dir="ltr">{formatDateHe(d.birth)}</dd></div>
          <div><dt>{C.s2a.labelIssue}</dt><dd dir="ltr">{formatDateHe(d.issue)}</dd></div>
          <div><dt>{C.s2a.labelAddress}</dt><dd>{d.street}, {d.city}</dd></div>
          <div><dt>{C.s2a.labelPhone}</dt><dd dir="ltr">{formatPhone(d.phone)}</dd></div>
          {d.email && <div><dt>{C.s2a.labelEmail}</dt><dd dir="ltr">{d.email}</dd></div>}
        </dl>
        {turnstile && !started && <TurnstileWidget ref={turnstile.handle} siteKey={turnstile.siteKey} onToken={turnstile.onToken} onError={turnstile.onError} />}
        {!started && <button type="button" className="sd-q-linkbtn" onClick={onEdit} disabled={busy}>{C.s2a.fix}</button>}
      </StepCard>
      <Bar onBack={onBack} cta={C.s2a.cta} busy={busy} />
    </form>
  );
}
