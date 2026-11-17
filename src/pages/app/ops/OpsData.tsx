// Data plumbing for the Ops Console screens: the DataSource context and one polling-aware query hook.
// Refresh strategy (docs/platform/OPS-CONSOLE.md): summary tables are re-read by polling (visible tab only) plus a
// manual refresh; realtime is a later, flag-gated upgrade for the queue-depth tiles only.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createMockOpsDataSource } from "./mockData";
import type { OpsDataSource, OpsRole } from "./contracts";

/** Single place that picks the implementation. TODO(ops-live): return the Supabase RPC-backed source for live builds. */
export function getOpsDataSource(): OpsDataSource {
  return createMockOpsDataSource();
}

interface OpsCtx {
  ds: OpsDataSource;
  role: OpsRole;
  /** Bumped by the shell's refresh button and by auto-refresh. */
  tick: number;
  refresh: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
}

const Ctx = createContext<OpsCtx | null>(null);

export function OpsProvider({ role, ds, children }: { role: OpsRole; ds?: OpsDataSource; children: ReactNode }) {
  const source = useMemo(() => ds ?? getOpsDataSource(), [ds]);
  const [tick, setTick] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => ({ ds: source, role, tick, refresh, autoRefresh, setAutoRefresh }), [source, role, tick, refresh, autoRefresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOps(): OpsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOps must be used inside <OpsProvider>");
  return c;
}

export interface QueryState<T> {
  data: T | null;
  error: string | null;
  /** First load (no data yet). */
  loading: boolean;
  /** Background re-read while data is shown. */
  refreshing: boolean;
  reload: () => void;
  updatedAt: Date | null;
}

/**
 * Loads `fn(ds)` on mount and whenever deps or the shell tick change. When `pollMs` is set and auto refresh is on,
 * it re-reads on that interval, only while the tab is visible. Stale responses are ignored.
 */
export function useOpsQuery<T>(fn: (ds: OpsDataSource) => Promise<T>, deps: readonly unknown[], pollMs?: number): QueryState<T> {
  const { ds, tick, autoRefresh } = useOps();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [local, setLocal] = useState(0);
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const hasData = useRef(false);

  const run = useCallback(() => {
    const id = ++seq.current;
    if (hasData.current) setRefreshing(true);
    fnRef.current(ds).then(
      (d) => {
        if (id !== seq.current) return;
        hasData.current = true;
        setData(d);
        setError(null);
        setUpdatedAt(new Date());
        setLoading(false);
        setRefreshing(false);
      },
      (e: unknown) => {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
        setLoading(false);
        setRefreshing(false);
      },
    );
  }, [ds]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run, tick, local, ...deps]);

  useEffect(() => {
    if (!pollMs || !autoRefresh) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") run(); }, pollMs);
    return () => clearInterval(t);
  }, [pollMs, autoRefresh, run]);

  useEffect(() => () => { seq.current++; }, []);

  const reload = useCallback(() => { setLoading(!hasData.current); setLocal((n) => n + 1); }, []);
  return { data, error, loading, refreshing, reload, updatedAt };
}

/** Agent id -> role-slot label, plus the list for filter dropdowns. */
export function useAgents(): { agents: Array<{ id: string; label: string }>; label: (id: string | null) => string } {
  const q = useOpsQuery((d) => d.listAgents(), []);
  const agents = q.data ?? [];
  return { agents, label: (id) => (id ? agents.find((a) => a.id === id)?.label ?? "לא ידוע" : "לא משויך") };
}
