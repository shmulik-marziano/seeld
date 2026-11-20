// ס2א: the details that will appear in the documents, from component state only. "תיקון" is open until the server
// answers the start call; after that the link is gone (changing details means starting again, spec ס2א).
import type { FormEvent } from "react";
import { formatPhone } from "@/questionnaires/validators";
import { POA_COPY as C } from "@/lib/poa/copy";
import type { Contact, Identity } from "@/lib/poa/machine";
import { Bar, StepCard, type ScreenBase } from "../parts";

export function Review({ headingRef, dir, prog, busy, identity, contact, started, onConfirm, onEdit, onBack }: ScreenBase & {
  identity: Identity; contact: Contact; started: boolean; onConfirm: () => void; onEdit: () => void; onBack?: () => void;
}) {
  const submit = (e: FormEvent) => { e.preventDefault(); onConfirm(); };
  return (
    <form onSubmit={submit} noValidate>
      <StepCard id="poa-s2a" title={C.s2a.title} dir={dir} headingRef={headingRef} prog={prog}>
        <dl className="sd-poa-rows sd-poa-review">
          <div><dt>{C.s2a.labelName}</dt><dd>{identity.first} {identity.last}</dd></div>
          <div><dt>{C.s2a.labelId}</dt><dd dir="ltr">{identity.id}</dd></div>
          <div><dt>{C.s2a.labelPhone}</dt><dd dir="ltr">{formatPhone(contact.phone)}</dd></div>
        </dl>
        {!started && <button type="button" className="sd-q-linkbtn" onClick={onEdit} disabled={busy}>{C.s2a.fix}</button>}
      </StepCard>
      <Bar onBack={onBack} cta={C.s2a.cta} busy={busy} />
    </form>
  );
}
