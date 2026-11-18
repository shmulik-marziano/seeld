// Background work + the cron contract (FOUNDATION §7): verify x-cron-secret, answer 202 at once, do the work inside
// EdgeRuntime.waitUntil, and report completion ONLY through api.job_finish(p_run). The HTTP status means "delivered",
// never "done". ops.http_invoke sends the run id in x-job-run; a manual call (no header) simply has no run to finish.

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

export type Defer = (p: Promise<unknown>) => void;

/** Real runtime: EdgeRuntime.waitUntil. Elsewhere (deno test, local serve without per_worker): fire and keep a handle. */
export function runtimeDefer(): Defer {
  return (p) => {
    const guarded = p.catch(() => { /* every task logs its own failure */ });
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(guarded);
  };
}

/** Test helper: collects deferred promises so a test can await them. */
export function collectingDefer(): { defer: Defer; settle: () => Promise<void> } {
  const pending: Promise<unknown>[] = [];
  return {
    defer: (p) => void pending.push(p.catch(() => {})),
    settle: async () => {
      while (pending.length) await pending.shift();
    },
  };
}

export function jobRunId(req: Request): number | null {
  const v = (req.headers.get("x-job-run") ?? "").trim();
  if (!/^\d{1,18}$/.test(v)) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
