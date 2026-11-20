// ס8: every state gets a title, one line and one action, through CaError (h2 here, focused like every screen).
import type { RefObject } from "react";
import { CaError } from "@/components/sd/client";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { contactFor } from "@/lib/contacts";
import { POA_ROUTE } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import type { ErrorKind } from "@/lib/poa/api";

export function ErrorScreen({ kind, headingRef, onRetry, onRestart }: {
  kind: ErrorKind; headingRef: RefObject<HTMLHeadingElement>; onRetry: () => void; onRestart: () => void;
}) {
  const contact = <div className="sd-ca-actions"><ContactIcons dept={contactFor(POA_ROUTE)} tone="dark" /></div>;
  const base = { headingRef, headingLevel: 2 as const, headingId: "poa-err-h" };
  switch (kind) {
    case "inactive": return <CaError {...base} title={C.s8.inactive}>{contact}</CaError>;
    case "unavailable": return <CaError {...base} title={C.s8.unavailable} text={C.s8.unavailableText} onRetry={onRetry} actionLabel={C.s8.genericAction} />;
    case "expired": return <CaError {...base} title={C.s8.expiredTitle} text={C.s8.expiredText} onRetry={onRestart} actionLabel={C.s8.expiredAction} />;
    case "locked": return <CaError {...base} title={C.s8.lockedTitle} text={C.s8.lockedText}>{contact}</CaError>;
    case "completed": return <CaError {...base} title={C.s8.completed}>{contact}</CaError>;
    default: return <CaError {...base} title={C.s8.generic} onRetry={onRetry} actionLabel={C.s8.genericAction} />;
  }
}
