// ס7: summary. One row per performed document: title, approval means, time, validity, and "הורדה" (one download per
// document, inside the 30-minute window; spec ס7, §5). After that, or when the copy is no longer available, the row
// says "לעותק נוסף צרו קשר". Outside the progress indicator.
import { useState } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { contactFor } from "@/lib/contacts";
import { POA_KINDS, POA_ROUTE, type PoaKind } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import { errorKindOf, poaFileName, type PoaApi } from "@/lib/poa/api";
import type { DoneDoc } from "@/lib/poa/machine";
import { formatDateHe } from "@/questionnaires/validators";
import { StepCard, type ScreenBase } from "../parts";

const timeHe = (iso: string) => new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

export function Done({ headingRef, dir, done, preDone = [], api }: ScreenBase & {
  done: Partial<Record<PoaKind, DoneDoc>>;
  /** performed before this session's start call (e.g. after the expiry restart): a row with no download */
  preDone?: PoaKind[];
  api: PoaApi;
}) {
  const [gone, setGone] = useState<Partial<Record<PoaKind, true>>>({});
  const [loading, setLoading] = useState<PoaKind | null>(null);
  const kinds = POA_KINDS.filter((k) => done[k] || preDone.includes(k));

  const download = async (k: PoaKind) => {
    setLoading(k);
    try {
      const blob = await api.doc(k);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href; a.download = poaFileName(k, new Date(done[k]!.approved_at)); a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
      setGone((g) => ({ ...g, [k]: true }));
    } catch (e) {
      // a transient failure did not use the one download: keep the button. Otherwise the row says to contact us.
      if (errorKindOf(e) !== "unavailable") setGone((g) => ({ ...g, [k]: true }));
    }
    setLoading(null);
  };
  const anyGone = kinds.some((k) => gone[k] || !done[k]);

  return (
    <StepCard id="poa-s7" title={C.s7.title} dir={dir} headingRef={headingRef} prog={null}>
      <p className="sd-q-hint">{C.s7.downloadNote}</p>
      <ul className="sd-poa-done">
        {kinds.map((k) => {
          const d = done[k];
          if (!d) return (
            <li key={k}>
              <p className="sd-poa-doc-title">{C.docTitle[k]}</p>
              <p className="sd-q-fine">{C.s7.afterReload}</p>
            </li>
          );
          return (
            <li key={k}>
              <p className="sd-poa-doc-title">{C.docTitle[k]}</p>
              <dl className="sd-poa-rows">
                <div><dt>{d.method === "signature" ? C.s7.methodSign : C.s7.methodCheck}</dt><dd><time dateTime={d.approved_at}>{C.s7.labelTime} {timeHe(d.approved_at)}</time></dd></div>
                {/* validity only from the approved template (spec §4): hidden while there is none */}
                {d.valid_until && <div><dt>{C.s7.labelValidity}</dt><dd>{formatDateHe(d.valid_until)}</dd></div>}
              </dl>
              {gone[k]
                ? <p className="sd-q-fine">{C.s7.afterReload}</p>
                : (
                  <button type="button" className="sd-q-btn is-quiet" onClick={() => download(k)} disabled={loading !== null} aria-busy={loading === k || undefined}>
                    <BrandIcon name="download" size={18} />{loading === k ? C.common.loading : C.s7.download}
                  </button>
                )}
            </li>
          );
        })}
      </ul>
      {anyGone && <ContactIcons dept={contactFor(POA_ROUTE)} tone="dark" />}
      <div className="sd-q-next">
        <h3>{C.s7.nextTitle}</h3>
        <p>{C.s7.next1}</p>
        <p>{C.s7.next2}</p>
      </div>
      <p className="sd-q-fine">{C.s7.keptLine}</p>
    </StepCard>
  );
}
