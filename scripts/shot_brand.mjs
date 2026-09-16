// Brand QA screenshots: full-page captures at desktop and phone widths.
// Usage: node scripts/shot_brand.mjs <baseURL> <outDir> [route ...]
// Requires a running server (vite preview) and the Playwright chromium build.
// Reveal-on-scroll sections are triggered by scrolling through the page first;
// the cookie banner is pre-accepted so it does not cover content.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [base = "http://localhost:4173", outDir = "shots", ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ["/", "/insurance/health", "/calculators"];
// Override with SHOT_VIEWPORTS="name:WxH,name:WxH" (e.g. "s360:360x800,tablet:768x1024,zoom200:720x900"
// — 720px wide ≈ a 1440px screen at 200% browser zoom).
const viewports = (process.env.SHOT_VIEWPORTS || "desktop:1440x900,phone:390x844")
  .split(",")
  .map((s) => {
    const [name, dims] = s.split(":");
    const [width, height] = dims.split("x").map(Number);
    return { name, width, height };
  });

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const report = [];
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: "he-IL", deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("cookie-consent", "accepted"); } catch { /* ignore */ }
  });
  for (const route of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()}`));
    await page.goto(base + route, { waitUntil: "networkidle" });
    // Reveal-on-scroll wrappers are forced visible for the capture (QA only).
    await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important}" });
    // Scroll through in viewport steps so lazy images and whileInView blocks load.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.floor(vp.height * 0.7)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    // Real horizontal overflow only: body width beyond the viewport, or a page that
    // actually scrolls sideways. (documentElement.scrollWidth over-reports for RTL
    // scroll containers in Chromium, so it is not used.)
    const overflow = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      window.scrollTo(-2000, 0); const neg = Math.abs(window.scrollX);
      window.scrollTo(2000, 0); const pos = Math.abs(window.scrollX);
      window.scrollTo(0, 0);
      return Math.max(0, document.body.scrollWidth - vw, neg, pos);
    });
    const slug = route === "/" ? "home" : route.replace(/^\//, "").replace(/[\/:]/g, "_");
    const file = join(outDir, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    report.push({ route, viewport: vp.name, overflow, errors: errors.slice(0, 5), file });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
for (const r of report) {
  console.log(`${r.viewport.padEnd(8)} ${r.route.padEnd(24)} overflow=${r.overflow}px errors=${r.errors.length}`);
  for (const e of r.errors) console.log(`    ${e}`);
}
