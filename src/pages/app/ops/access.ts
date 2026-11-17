// Ops Console access. The console is visible to manager and super_admin only.
//
// TODO(ops-roles): there is no role mechanism for operators yet. The existing `profile.role` column is the agent
// portal role and must not be reused blindly. When the roles data lands (see supabase/proposed), read the role here
// from the server (JWT claim or an RPC), never from client-writable state, and keep the production default = NO access.
// Until then: production builds ALWAYS resolve to no access; dev/test builds take a mock role from
// VITE_OPS_MOCK_ROLE (manager | super_admin | agent) and, in dev only, from the ?opsRole= query parameter.
import { useMemo } from "react";
import { hasOpsAccess, isOpsRole } from "./contracts";
import type { OpsRole } from "./contracts";

/** Console home route. */
export const OPS_HOME = "/app/ops";

/** Pure resolver (unit tested). `prod` true => always null. */
export function resolveMockRole(prod: boolean, envValue: unknown, queryValue?: string | null): OpsRole | null {
  if (prod) return null;
  const raw = queryValue ?? envValue;
  return isOpsRole(raw) ? raw : null;
}

function readMockRole(): OpsRole | null {
  if (import.meta.env.PROD) return null;
  let q: string | null = null;
  try {
    q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("opsRole") : null;
  } catch {
    q = null;
  }
  return resolveMockRole(false, import.meta.env.VITE_OPS_MOCK_ROLE, q);
}

export interface OpsRoleState {
  role: OpsRole | null;
  /** Where the role came from. "mock" must never reach production. */
  source: "none" | "mock";
  hasAccess: boolean;
}

export function useOpsRole(): OpsRoleState {
  return useMemo(() => {
    const role = readMockRole();
    return { role, source: role ? "mock" : "none", hasAccess: hasOpsAccess(role) };
  }, []);
}

/** For the sidebar: true only when the current user may open the console. */
export function opsNavVisible(): boolean {
  if (import.meta.env.PROD) return false;
  return hasOpsAccess(readMockRole());
}
