// Date as a text field dd/mm/yyyy with the numeric keyboard (spec §2: no date picker). Validation is done by the
// caller through validators.ts (machine.validateHarbit); this only renders and keeps the house error pattern.
import { POA_COPY as C } from "@/lib/poa/copy";
import { FieldError } from "./parts";

export function DateField({ id, label, value, onChange, err }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string;
}) {
  return (
    <div className="sd-q-subfield">
      <label htmlFor={`poa-${id}`} className="sd-q-sublabel">{label}</label>
      <input
        id={`poa-${id}`} className="sd-q-input sd-poa-date" type="text" inputMode="numeric" dir="ltr" style={{ textAlign: "right" }}
        placeholder={C.common.datePlaceholder} autoComplete="off" maxLength={10} value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d./-]/g, ""))}
        aria-invalid={err ? true : undefined} aria-describedby={err ? `poa-${id}-err` : undefined}
      />
      <FieldError id={id} err={err} />
    </div>
  );
}
