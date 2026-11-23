// Shared pieces of the POA wizard screens: the step card with its focusable h2, the bottom bar, a text field and a
// check field with the house error pattern (aria-invalid + aria-describedby + p.sd-q-error[role=alert]).
import type { ReactNode, RefObject } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { POA_COPY as C, poaStep } from "@/lib/poa/copy";

export type Dir = "fwd" | "back";
export interface ScreenBase {
  headingRef: RefObject<HTMLHeadingElement>;
  dir: Dir;
  prog: { n: number; m: number } | null;
  busy: boolean;
}

export function StepCard({ id, title, dir, headingRef, prog, children }: {
  id: string; title: string; dir: Dir; headingRef: RefObject<HTMLHeadingElement>; prog: { n: number; m: number } | null; children: ReactNode;
}) {
  const hid = `${id}-h`;
  return (
    <section className={`sd-q-card sd-q-step sd-poa-card sd-q-in-${dir}`} aria-labelledby={hid}>
      <h2 id={hid} ref={headingRef} tabIndex={-1} className="sd-q-qtitle">
        {prog && <span className="sr-only">{poaStep(prog.n, prog.m)}: </span>}{title}
      </h2>
      {children}
    </section>
  );
}

export function Bar({ onBack, cta, busy, busyText }: { onBack?: () => void; cta: string; busy: boolean; busyText?: string }) {
  return (
    <div className="sd-rk-bar sd-poa-bar" role="toolbar" aria-label={C.common.navLabel}>
      {onBack && <button type="button" className="sd-q-btn is-quiet" onClick={onBack} disabled={busy}>{C.common.back}</button>}
      <button type="submit" className="sd-q-btn" disabled={busy} aria-busy={busy || undefined} aria-live={busyText ? "polite" : undefined}>
        {busy ? busyText ?? C.common.loading : cta}{!busy && <BrandIcon name="arrow-left" size={18} />}
      </button>
    </div>
  );
}

/** Focus the first field (in DOM order of `order`) that has an error. */
export function focusFirst(order: string[], errors: Record<string, string | undefined>) {
  const first = order.find((k) => errors[k]);
  if (first) window.setTimeout(() => document.getElementById(`poa-${first}`)?.focus(), 0);
}

export function FieldError({ id, err }: { id: string; err?: string }) {
  return err ? <p id={`poa-${id}-err`} className="sd-q-error" role="alert">{err}</p> : null;
}

export function TextField({ id, label, value, onChange, err, ltr, inputMode, type = "text", autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string;
  ltr?: boolean; inputMode?: "numeric" | "email" | "text"; type?: "text" | "tel" | "email"; autoComplete?: string;
}) {
  return (
    <div className="sd-q-subfield">
      <label htmlFor={`poa-${id}`} className="sd-q-sublabel">{label}</label>
      <input
        id={`poa-${id}`} className="sd-q-input" type={type} value={value} onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode} autoComplete={autoComplete} dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: "right" } : undefined}
        aria-invalid={err ? true : undefined} aria-describedby={err ? `poa-${id}-err` : undefined}
      />
      <FieldError id={id} err={err} />
    </div>
  );
}

export function CheckField({ id, checked, onChange, err, children }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; err?: string; children: ReactNode;
}) {
  return (
    <div className="sd-poa-check">
      <label className={`sd-q-choice is-check ${checked ? "is-on" : ""}`}>
        <input id={`poa-${id}`} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          aria-invalid={err ? true : undefined} aria-describedby={err ? `poa-${id}-err` : undefined} />
        <span>{children}</span>
      </label>
      <FieldError id={id} err={err} />
    </div>
  );
}
