// ס0: opening. Outside the progress indicator. The first line follows the entry context (`?from=`, spec ס0
// "נקודות כניסה"): the wizard is the one conversion step every marketing page leads to. The "מיועדים לקבלת מידע בלבד"
// line is not shown until the template's verifiedScope flag is approved (spec ס0), so it is not rendered at all.
import { BrandIcon } from "@/components/brand/BrandIcon";
import type { PoaEntry } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import { StepCard, type ScreenBase } from "../parts";

export function Welcome({ headingRef, dir, entry, onStart }: ScreenBase & { entry: PoaEntry; onStart: () => void }) {
  return (
    <StepCard id="poa-s0" title={C.s0.title} dir={dir} headingRef={headingRef} prog={null}>
      <p className="sd-q-hint sd-poa-lead">{C.s0.lead[entry]}</p>
      <p className="sd-q-hint">{C.s0.body}</p>
      <h3 className="sd-poa-h3">{C.s0.prepareTitle}</h3>
      <ul className="sd-rk-points">
        <li>{C.s0.prepareLine}</li>
      </ul>
      <p className="sd-q-note">{C.s0.note}</p>
      <div className="sd-rk-actions">
        <button type="button" className="sd-q-btn" onClick={onStart}>{C.s0.cta}<BrandIcon name="arrow-left" size={18} /></button>
      </div>
    </StepCard>
  );
}
