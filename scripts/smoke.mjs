// smoke:  npm run smoke -- <baseUrl>     (default https://seeld.co.il)
// Playwright browser smoke test. Loads key pages and fails on console errors, failed requests of the
// site itself, and 4xx/5xx on /assets. Also checks (never submits) that the contact form renders.
// Read-only: analytics beacons are stubbed so a smoke run does not pollute page_views.
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "https://seeld.co.il").replace(/\/+$/, "");
const PAGES = [
  { path: "/", name: "home", h1: true },
  { path: "/insurance/life", name: "insurance page", h1: true },
  { path: "/travel", name: "travel", h1: true },
  { path: "/blog", name: "blog", h1: true },
  { path: "/contact", name: "contact", h1: true, form: true },
  { path: "/app/auth", name: "login page", h1: false },
];

const failures = [];
const notes = [];
const origin = new URL(BASE).origin;

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ locale: "he-IL", viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem("cookie-consent", "declined"); } catch { /* ignore */ }
});
await ctx.route(/\/rest\/v1\/page_views|ipapi\.co|\/api\/geo/, (r) => r.fulfill({ status: 204, body: "" }));

for (const p of PAGES) {
  const page = await ctx.newPage();
  const local = [];
  page.on("console", (m) => {
    if (m.type() === "error") local.push(`console error: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => local.push(`page error: ${e.message.slice(0, 200)}`));
  page.on("requestfailed", (r) => {
    const u = r.url();
    const f = r.failure()?.errorText ?? "failed";
    // ERR_ABORTED = the browser cancelled it (lazy images scrolled away, stubbed beacons): not a site failure.
    if (f.includes("ERR_ABORTED")) return;
    if (u.startsWith(origin)) local.push(`request failed: ${u} (${f})`);
    else notes.push(`${p.path} third-party request failed: ${u.slice(0, 120)} (${f})`);
  });
  page.on("response", (res) => {
    const u = res.url();
    if (u.startsWith(origin) && new URL(u).pathname.startsWith("/assets/") && res.status() >= 400) {
      local.push(`asset ${res.status()}: ${u}`);
    }
  });
  try {
    const res = await page.goto(BASE + p.path, { waitUntil: "networkidle", timeout: 45_000 });
    if (!res || res.status() >= 400) local.push(`navigation status ${res?.status()}`);
    if (p.h1 && (await page.locator("h1").count()) < 1) local.push("no h1 rendered");
    if (p.form) {
      const form = page.locator("form").first();
      if (!(await form.isVisible().catch(() => false))) local.push("contact form not visible");
      else if (!(await form.locator("button[type=submit]").count())) local.push("contact form has no submit button");
    }
  } catch (e) {
    local.push(`load error: ${e.message.split("\n")[0]}`);
  }
  console.log(`${local.length ? "FAIL" : "PASS"}  ${p.name} ${p.path}`);
  for (const l of local) {
    console.log(`        ${l}`);
    failures.push(`${p.path}: ${l}`);
  }
  await page.close();
}
await browser.close();

for (const n of notes) console.log(`NOTE  ${n}`);
console.log(`\nsmoke: ${PAGES.length - new Set(failures.map((f) => f.split(":")[0])).size}/${PAGES.length} pages clean against ${BASE}`);
if (failures.length) process.exit(1);
