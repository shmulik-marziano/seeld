// node shot_el.mjs <distDir> <route> <selector> <outPng> [width] [height]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { chromium } from "@playwright/test";

const [dist, route, selector, out, w = "1440", h = "900"] = process.argv.slice(2);
const ROOT = resolve(dist);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };
const shell = await readFile(join(ROOT, "index.html"), "utf8");
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try { if (extname(p) && (await stat(join(ROOT, p))).isFile()) { res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }); return res.end(await readFile(join(ROOT, p))); } } catch { /* shell */ }
  res.writeHead(200, { "content-type": "text/html" }); res.end(shell);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, locale: "he-IL", reducedMotion: "reduce" });
await ctx.addInitScript(() => localStorage.setItem("cookie-consent", "declined"));
const page = await ctx.newPage();
await page.route(/\/rest\/v1\/page_views|\/api\/geo/, (r) => r.fulfill({ status: 204, body: "" }));
await page.goto(base + route, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const el = page.locator(selector).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await el.screenshot({ path: out });
const box = await el.boundingBox();
console.log(JSON.stringify({ selector, w: Math.round(box.width), h: Math.round(box.height) }));
await browser.close(); server.close();
