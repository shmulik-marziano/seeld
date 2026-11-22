// ס1: one question per screen (owner decision 2026-11-22). The question is the heading, one field under it, the
// keyboard matches the answer (digits for the ID, the zip and the phone, the date picker for dates, the e-mail keyboard
// for the address), Enter or "המשך" validates and opens the next question. Nothing advances on an invalid answer.
// The zip question asks the adapter for the zip of the street + city given before and fills it in (the visitor can fix it).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ZIP_LOOKUP_URL } from "@/questionnaires/validators";
import type { PoaApi } from "@/lib/poa/api";
import { POA_COPY as C } from "@/lib/poa/copy";
import { Q_KEYS, validateAnswer, type Details, type QKey } from "@/lib/poa/machine";
import { DateField } from "../DateField";
import { CheckField, StepCard, TextField, type ScreenBase } from "../parts";

export function Questions({ headingRef, dir, busy, q, details, api, onAnswer, onBack }: ScreenBase & {
  q: number; details: Details; api: Pick<PoaApi, "zip">; onAnswer: (patch: Partial<Details>) => void; onBack: () => void;
}) {
  const key: QKey = Q_KEYS[q];
  const copy = C.q[key];
  const [d, setD] = useState<Details>(details);
  const [err, setErr] = useState<string | undefined>(undefined);
  const [zipState, setZipState] = useState<"idle" | "searching" | "found">("idle");
  const fieldRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setD(details); setErr(undefined); }, [key, details]);
  // the field takes focus right after the heading announced the question (the page focuses the heading first)
  useEffect(() => {
    const t = window.setTimeout(() => fieldRef.current?.querySelector<HTMLElement>("input")?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(t);
  }, [key]);
  // zip: look it up once from the street and the city already answered; an empty answer stays empty
  useEffect(() => {
    if (key !== "zip" || details.zip || !details.street || !details.city) { setZipState("idle"); return; }
    let live = true;
    setZipState("searching");
    api.zip({ street: details.street, city: details.city }).then((zip) => {
      if (!live) return;
      if (zip) { setD((cur) => ({ ...cur, zip })); setZipState("found"); } else setZipState("idle");
    });
    return () => { live = false; };
  }, [key, details.zip, details.street, details.city, api]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = validateAnswer(key, d);
    if (r.err) { setErr(r.err); fieldRef.current?.querySelector<HTMLElement>("input")?.focus(); return; }
    setErr(undefined);
    onAnswer(r.patch ?? {});
  };
  const skip = () => { setErr(undefined); onAnswer({ email: "" }); };
  const set = (patch: Partial<Details>) => { setD({ ...d, ...patch }); if (err) setErr(undefined); };

  let field: JSX.Element;
  switch (key) {
    case "first": field = <TextField id="first" label={C.q.first.label} value={d.first} onChange={(first) => set({ first })} err={err} autoComplete="given-name" />; break;
    case "last": field = <TextField id="last" label={C.q.last.label} value={d.last} onChange={(last) => set({ last })} err={err} autoComplete="family-name" />; break;
    case "id": field = <TextField id="id" label={C.q.id.label} value={d.id} onChange={(id) => set({ id })} err={err} ltr inputMode="numeric" autoComplete="off" />; break;
    case "birth": field = <DateField id="birth" label={C.q.birth.label} value={d.birth} onChange={(birth) => set({ birth })} err={err} max="today" />; break;
    case "issue": field = <DateField id="issue" label={C.q.issue.label} value={d.issue} onChange={(issue) => set({ issue })} err={err} min={d.birth || undefined} max="today" />; break;
    case "street": field = <TextField id="street" label={C.q.street.label} value={d.street} onChange={(street) => set({ street })} err={err} autoComplete="street-address" />; break;
    case "city": field = <TextField id="city" label={C.q.city.label} value={d.city} onChange={(city) => set({ city })} err={err} autoComplete="address-level2" />; break;
    case "zip": field = (
      <>
        <TextField id="zip" label={C.q.zip.label} value={d.zip} onChange={(zip) => { set({ zip }); setZipState("idle"); }} err={err} ltr inputMode="numeric" autoComplete="postal-code" />
        {zipState === "searching" && <p className="sd-q-fine" role="status">{C.q.zipSearching}</p>}
        {zipState === "found" && <p className="sd-q-fine" role="status">{C.q.zipFound}</p>}
        <p className="sd-q-fine"><a href={ZIP_LOOKUP_URL} target="_blank" rel="noopener noreferrer">{C.q.zipLookup}</a></p>
      </>
    ); break;
    case "phone": field = <TextField id="phone" label={C.q.phone.label} value={d.phone} onChange={(phone) => set({ phone })} err={err} ltr type="tel" inputMode="numeric" autoComplete="tel" />; break;
    case "email": field = <TextField id="email" label={C.q.email.label} value={d.email} onChange={(email) => set({ email })} err={err} ltr type="email" inputMode="email" autoComplete="email" />; break;
    case "consent": {
      const [t1, terms, t3, privacy] = C.q.consent.termsParts;
      field = (
        <>
          <CheckField id="terms" checked={d.terms} onChange={(terms) => set({ terms })} err={err}>
            {t1}<a href="/terms" target="_blank" rel="noopener noreferrer">{terms}</a>{t3}<a href="/privacy" target="_blank" rel="noopener noreferrer">{privacy}</a>
          </CheckField>
          <CheckField id="marketing" checked={d.marketing} onChange={(marketing) => set({ marketing })}>{C.q.consent.marketing}</CheckField>
        </>
      );
      break;
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepCard id={`poa-q-${key}`} title={copy.title} dir={dir} headingRef={headingRef} prog={null}>
        <p className="sd-poa-counter">{C.q.counter(q + 1, Q_KEYS.length)}</p>
        {copy.hint && <p className="sd-q-hint">{copy.hint}</p>}
        <div ref={fieldRef} className="sd-poa-field">{field}</div>
      </StepCard>
      <div className="sd-rk-bar sd-poa-bar" role="toolbar" aria-label={C.common.navLabel}>
        <button type="button" className="sd-q-btn is-quiet" onClick={onBack} disabled={busy}>{C.common.back}</button>
        {key === "email" && <button type="button" className="sd-q-btn is-quiet" onClick={skip} disabled={busy}>{C.q.skip}</button>}
        <button type="submit" className="sd-q-btn" disabled={busy}>{C.q.cta}<BrandIcon name="arrow-left" size={18} /></button>
      </div>
    </form>
  );
}
