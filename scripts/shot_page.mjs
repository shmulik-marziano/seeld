// Screenshots a built route at desktop + phone widths: node scripts/shot_page.mjs /insurance/life outDir
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = process.env.SHOT_DIST ? resolve(process.env.SHOT_DIST) : resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const [route = "/", out = "shots"] = process.argv.slice(2);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const shell = await readFile(join(ROOT, "_shell.html").replace(/_shell\.html$/, (await stat(join(ROOT, "_shell.html")).then(() => "_shell.html", () => "index.html"))), "utf8");
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try { if (extname(p) && (await stat(join(ROOT, p))).isFile()) { res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }); return res.end(await readFile(join(ROOT, p))); } } catch { /* shell */ }
  res.writeHead(200, { "content-type": "text/html" }); res.end(shell);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
for (const [name, w, h] of [["desktop", 1440, 900], ["phone", 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: "he-IL", reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("cookie-consent", "declined"));
  const page = await ctx.newPage();
  await page.route(/\/rest\/v1\/page_views|\/api\/geo/, (r) => r.fulfill({ status: 204, body: "" }));
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
  await page.screenshot({ path: join(out, `${name}-fold.png`) });
  if (name === "desktop" || process.env.ALL_SECTIONS) for (const id of ["guide", "coverage", "faq", "contact-form"]) { const el = page.locator(`#${id}`); if (await el.count()) await el.screenshot({ path: join(out, `${name}-${id}.png`) }); }
  console.log(name, await page.evaluate(() => ({ h: document.documentElement.scrollHeight, hScroll: document.documentElement.scrollWidth > innerWidth })));
  await ctx.close();
}
await browser.close(); server.close();
