// Shared pieces of the client area screens: the card with its focusable h2, a text field with the house error pattern
// (aria-invalid + aria-describedby + p.sd-q-error[role=alert]), and small formatters. Ids are prefixed `my-`.
import type { ReactNode, RefObject } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { MY_COPY as C } from "@/lib/client-area/copy";

export function MyCard({ id, title, headingRef, children, aside }: {
  id: string; title: string; headingRef?: RefObject<HTMLHeadingElement>; children: ReactNode; aside?: ReactNode;
}) {
  const hid = `${id}-h`;
  return (
    <section className="sd-q-card sd-my-card" aria-labelledby={hid}>
      <div className="sd-my-card-head">
        <h2 id={hid} ref={headingRef} tabIndex={-1} className="sd-q-qtitle">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function FieldError({ id, err }: { id: string; err?: string }) {
  return err ? <p id={`my-${id}-err`} className="sd-q-error" role="alert">{err}</p> : null;
}

export function Field({ id, label, value, onChange, err, inputMode, autoComplete, maxLength, autoFocus }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string;
  inputMode?: "numeric" | "tel" | "text"; autoComplete?: string; maxLength?: number; autoFocus?: boolean;
}) {
  return (
    <div className="sd-q-subfield sd-my-field">
      <label htmlFor={`my-${id}`} className="sd-q-sublabel">{label}</label>
      <input
        id={`my-${id}`} className="sd-q-input" type="text" value={value} onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode} autoComplete={autoComplete} maxLength={maxLength} dir="ltr" style={{ textAlign: "right" }}
        autoFocus={autoFocus} aria-invalid={err ? true : undefined} aria-describedby={err ? `my-${id}-err` : undefined}
      />
      <FieldError id={id} err={err} />
    </div>
  );
}

export function SubmitBar({ cta, busy, busyText, secondary }: { cta: string; busy: boolean; busyText?: string; secondary?: ReactNode }) {
  return (
    <div className="sd-rk-bar sd-my-bar" role="toolbar" aria-label={C.common.navLabel}>
      {secondary}
      <button type="submit" className="sd-q-btn" disabled={busy} aria-busy={busy || undefined} aria-live={busyText ? "polite" : undefined}>
        {busy ? busyText ?? C.common.loading : cta}{!busy && <BrandIcon name="arrow-left" size={18} />}
      </button>
    </div>
  );
}

/** Focus the first field (in DOM order of `order`) that has an error. */
export function focusFirst(order: string[], errors: Record<string, string | undefined>) {
  const first = order.find((k) => errors[k]);
  if (first) window.setTimeout(() => document.getElementById(`my-${first}`)?.focus(), 0);
}

const ILS = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
export const money = (n: number) => ILS.format(n);
export function dateHe(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`; // dd/mm/yyyy, as the wizard prints dates
}
