/*
  Chunk recovery. Hashed files under /assets are cached for a year ("immutable"). If a visitor's browser
  requests a new file in the minute a deploy is still propagating and gets an error page, that error is cached
  under the file's URL, and the page then fails until the cache entry is replaced.
  On a load failure we (1) re-fetch every failed /assets file bypassing the cache, which overwrites the bad
  entry, then (2) reload once. The guard stops a loop if the problem is real.
*/

const GUARD = "seeld-chunk-heal";
const LOAD_FAILURE = /dynamically imported module|Importing a module script failed|Loading chunk|Unable to preload|reading 'default'|error loading dynamically/i;

export function isChunkLoadFailure(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return LOAD_FAILURE.test(msg);
}

async function replaceBadAssets(): Promise<void> {
  const failed = performance
    .getEntriesByType("resource")
    .filter((e) => e.name.includes("/assets/") && ((e as PerformanceResourceTiming & { responseStatus?: number }).responseStatus ?? 0) >= 400)
    .map((e) => e.name);
  await Promise.all([...new Set(failed)].map((u) => fetch(u, { cache: "reload" }).catch(() => undefined)));
}

export async function recoverFromChunkFailure(): Promise<boolean> {
  try {
    if (sessionStorage.getItem(GUARD)) return false;
    sessionStorage.setItem(GUARD, String(Date.now()));
  } catch {
    return false;
  }
  await replaceBadAssets();
  window.location.reload();
  return true;
}

export function installChunkRecovery(): void {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    void recoverFromChunkFailure();
  });
  // A page that survived the whole session without a failure may heal again next time.
  window.addEventListener("load", () => {
    window.setTimeout(() => {
      try {
        if (document.querySelector("#root h1")) sessionStorage.removeItem(GUARD);
      } catch { /* storage unavailable */ }
    }, 4000);
  });
}
