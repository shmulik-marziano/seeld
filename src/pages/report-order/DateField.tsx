// Date with the browser's own picker (owner decision 2026-11-22: a tap opens the date picker on the phone). The value
// is ISO yyyy-mm-dd, which the validators read directly. Validation is done by the caller (machine.validateAnswer);
// this only renders and keeps the house error pattern.
import { FieldError } from "./parts";

const todayIso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };

export function DateField({ id, label, value, onChange, err, min, max }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string;
  /** ISO bounds for the picker ("today" = the day of rendering) */
  min?: string; max?: string | "today";
}) {
  return (
    <div className="sd-q-subfield">
      <label htmlFor={`poa-${id}`} className="sd-q-sublabel">{label}</label>
      <input
        id={`poa-${id}`} className="sd-q-input sd-poa-date" type="date" dir="ltr" style={{ textAlign: "right" }}
        autoComplete="off" value={value} min={min} max={max === "today" ? todayIso() : max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={err ? true : undefined} aria-describedby={err ? `poa-${id}-err` : undefined}
      />
      <FieldError id={id} err={err} />
    </div>
  );
}
