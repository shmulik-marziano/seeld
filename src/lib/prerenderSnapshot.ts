/**
 * The build prerenders every public route (scripts/prerender.mjs) by snapshotting the LIVE client-rendered DOM,
 * so the HTML has no React hydration markers (no Suspense comments) and hydrateRoot cannot adopt it: React reports
 * error #418 and throws the markup away. Instead we keep the snapshot of the page wrapper and hand it to the
 * route Suspense fallback, so the visitor keeps seeing the real page (same h1, same text) while the lazy
 * route chunk loads, rather than the logo spinner. The first real render then replaces it in place.
 */
export const ROUTE_ATTR = "data-seeld-route";

let snapshot: { path: string; html: string } | null = null;

export function captureSnapshot(container: HTMLElement) {
  const el = container.querySelector(`[${ROUTE_ATTR}]`);
  if (el) snapshot = { path: window.location.pathname, html: el.outerHTML };
}

export function getSnapshot(): string | null {
  return snapshot && snapshot.path === window.location.pathname ? snapshot.html : null;
}

export function clearSnapshot() {
  snapshot = null;
}
