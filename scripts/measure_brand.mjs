// Before/after performance measurement for the brand rollout.
// Usage: MSYS_NO_PATHCONV=1 node scripts/measure_brand.mjs <baseURL> [route ...]
// Prints, per route, the median of 3 cold loads: TTFB, DOMContentLoaded, load,
// LCP, CLS, transferred bytes and request count (desktop 1440 and phone 390,
// no CPU/network throttling; numbers are comparable only run against the same
// machine and server type, i.e. `vite preview` of a production build).
import { chromium } from "@playwright/test";

const [base = "http://localhost:4173", ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ["/", "/insurance/health", "/calculators"];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];
const RUNS = 3;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const browser = await chromium.launch();
const rows = [];
for (const vp of viewports) {
  for (const route of pages) {
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: "he-IL" });
      await ctx.addInitScript(() => {
        try { localStorage.setItem("cookie-consent", "accepted"); } catch { /* ignore */ }
        window.__lcp = 0; window.__cls = 0;
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; })
          .observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
          .observe({ type: "layout-shift", buffered: true });
      });
      const page = await ctx.newPage();
      let bytes = 0, requests = 0;
      page.on("response", async (r) => {
        requests++;
        try { const b = await r.body(); bytes += b.length; } catch { /* opaque */ }
      });
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          ttfb: nav.responseStart - nav.requestStart,
          dcl: nav.domContentLoadedEventEnd - nav.startTime,
          load: nav.loadEventEnd - nav.startTime,
          lcp: window.__lcp,
          cls: window.__cls,
        };
      });
      samples.push({ ...m, bytes, requests });
      await ctx.close();
    }
    const agg = {};
    for (const k of ["ttfb", "dcl", "load", "lcp", "cls", "bytes", "requests"]) agg[k] = median(samples.map((s) => s[k]));
    rows.push({ viewport: vp.name, route, ...agg });
  }
}
await browser.close();
console.log("viewport route ttfb_ms dcl_ms load_ms lcp_ms cls kb requests");
for (const r of rows) {
  console.log(
    `${r.viewport} ${r.route} ${r.ttfb.toFixed(0)} ${r.dcl.toFixed(0)} ${r.load.toFixed(0)} ${r.lcp.toFixed(0)} ${r.cls.toFixed(3)} ${(r.bytes / 1024).toFixed(0)} ${r.requests}`,
  );
}
