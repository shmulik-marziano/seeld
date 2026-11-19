// The report engine is mounted twice: publicly at /report/start (visitors, no login; everything stays in the browser) and inside
// the agent portal at /app/reports. Links inside the engine resolve against whichever mount is active.
import { useLocation } from "react-router-dom";

export const PUBLIC_REPORTS_BASE = "/report/start";
export const AGENT_REPORTS_BASE = "/app/reports";

export function useReportsBase(): string {
  const { pathname } = useLocation();
  return pathname.startsWith("/app/") ? AGENT_REPORTS_BASE : PUBLIC_REPORTS_BASE;
}
