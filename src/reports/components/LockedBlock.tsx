// Honest locked block: title, the fields it would hold (as skeleton lines, never numbers), a plain reason, and one calm call to action.
import type { ReactNode } from "react";
import { BLOCKS, WHY, blockDef } from "../blocks";
import type { LockReason } from "../types";
import { useBlock, useReport } from "./context";

export const REASON_LABEL: Record<LockReason, string> = {
  needs_policy_copy: "נדרש העתק פוליסה",
  needs_information_order: "נדרשת הזמנת מידע",
  needs_client_authorisation: "נדרש אישור צפייה במידע",
  not_in_source_files: "אינו מופיע בקבצים",
};

export function LockedBlock({ id, compact, title }: { id: string; compact?: boolean; title?: string }) {
  const { onLockedClick } = useReport();
  const st = useBlock(id);
  const def = blockDef(id) ?? BLOCKS[0];
  const reason = (st?.reason ?? def.absent) as LockReason;
  return (
    <section className={`rp-block rp-locked ${compact ? "is-compact" : ""}`} aria-label={`${title ?? def.title}: לא ניתן להצגה כרגע`} data-block={id} data-locked={reason}>
      <div className="rp-locked-head">
        <span className="rp-lock-ico" aria-hidden="true"><img src="/art/icons/lock.svg" alt="" width={28} height={28} loading="lazy" /></span>
        <div>
          <h3 className="rp-h3">{title ?? def.title}</h3>
          <p className="rp-locked-state"><b>לא ניתן להצגה כרגע</b> <span className="rp-chip">{REASON_LABEL[reason]}</span></p>
        </div>
      </div>
      {def.fields.length > 0 && (
        <ul className="rp-skel-list" aria-label="הנתונים שהבלוק יכלול">
          {def.fields.map((f) => (
            <li key={f}><span>{f}</span><i aria-hidden="true" /></li>
          ))}
        </ul>
      )}
      <p className="rp-locked-why">{WHY[reason]}</p>
      <button type="button" className="rp-cta rp-noprint" onClick={() => onLockedClick(id, reason)}>
        אפשר להשלים את הנתון הזה, נשמח לעזור
      </button>
    </section>
  );
}

/** Renders `children` when the block is shown, the locked card when locked, nothing when the block is not part of this mode. */
export function Block({ id, children, className = "", title }: { id: string; children: ReactNode; className?: string; title?: string }) {
  const st = useBlock(id);
  const { report } = useReport();
  if (!st) return null;
  if (st.status === "locked") return <LockedBlock id={id} title={title} />;
  return (
    <div className={`rp-blockwrap ${className}`} data-block={id}>
      {report.entitlements.tier === "agent" && st.lockedForClient && <span className="rp-agent-flag rp-noprint">נעול ללקוח בתצוגה זו</span>}
      {children}
    </div>
  );
}

/** One quiet line for a locked block that repeats per product (the full explanation sits in the first product). */
export function LockedLine({ id }: { id: string }) {
  const { onLockedClick } = useReport();
  const st = useBlock(id);
  const def = blockDef(id) ?? BLOCKS[0];
  const reason = (st?.reason ?? def.absent) as LockReason;
  return (
    <p className="rp-lockline" data-block={id} data-locked={reason}>
      <img src="/art/icons/lock.svg" alt="" width={18} height={18} loading="lazy" />
      <span>{def.title}: <b>לא ניתן להצגה כרגע</b> ({REASON_LABEL[reason]}).</span>
      <button type="button" className="rp-link rp-noprint" onClick={() => onLockedClick(id, reason)}>נשמח לעזור</button>
    </p>
  );
}
