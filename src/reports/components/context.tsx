import { createContext, useContext, type ReactNode } from "react";
import type { LockReason, Report } from "../types";

export interface ReportCtx {
  report: Report;
  /** called when a locked block's call to action is pressed */
  onLockedClick: (blockId: string, reason: LockReason) => void;
}

const Ctx = createContext<ReportCtx | null>(null);

export function ReportProvider({ value, children }: { value: ReportCtx; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReport(): ReportCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useReport must be used inside <ReportProvider>");
  return c;
}

export function useBlock(id: string) {
  const { report } = useReport();
  return report.blocks.find((b) => b.id === id);
}
