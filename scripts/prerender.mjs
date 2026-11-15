// Build-time prerender. Runs after `vite build`: serves dist/, opens every public
// route in headless Chromium, and writes the rendered HTML back to dist/<route>/index.html
// so crawlers (search + AI answer engines) get real content without running JavaScript.
//
// Safe by design: the SPA still boots on top of the snapshot (createRoot replaces it),
// and any failure leaves the plain SPA build untouched (exit 0 unless PRERENDER_STRICT=1).
//
// Usage:  node scripts/prerender.mjs            (after `npm run build`)
// Env:    PRERENDER_ONLY=/about,/faq   limit routes (debugging)
//         PRERENDER_STRICT=1           exit non-zero on any failure (CI)
//         CHROMIUM_PATH=...            custom browser binary (e.g. serverless chromium)

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, copyFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const STRICT = process.env.PRERENDER_STRICT === "1";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://lvifatyksqizwcutfbqp.supabase.co";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain",
};

const RETURN_TABLE_SLUGS = ["pension", "hishtalmut", "gemel", "gemel-invest", "policies", "child-savings"];

function fail(msg) {
  console.warn(`[prerender] ${msg}`);
  process.exit(STRICT ? 1 : 0);
}

async function routesFromSitemap() {
  const xml = await readFile(join(DIST, "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
}

async function blogPosts() {
  try {
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? (await readAnonKey());
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,excerpt,updated_at,published_at&status=eq.published&order=published_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[prerender] blog posts unavailable (${e.message}); skipping blog posts`);
    return [];
  }
}

const xmlEscape = (v) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// sitemap.xml: static routes as-is, plus every published post with its real updated_at.
async function writeSitemapAndLlms(routes, posts) {
  const postByPath = new Map(posts.map((p) => [`/blog/${p.slug}`, p]));
  const urls = routes.filter((r) => r !== "/__not-found__").map((r) => {
    const post = postByPath.get(r);
    const lastmod = post?.updated_at ? `<lastmod>${post.updated_at.slice(0, 10)}</lastmod>` : "";
    return `  <url><loc>https://seeld.co.il${r === "/" ? "/" : r}</loc>${lastmod}</url>`;
  });
  await writeFile(join(DIST, "sitemap.xml"),
    ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>", ""].join("\n"));

  const llmsSrc = join(ROOT, "public/llms.txt");
  if (existsSync(llmsSrc)) {
    const list = posts.length
      ? ["## מאמרים בבלוג", "", ...posts.map((p) =>
          `- [${p.title}](https://seeld.co.il/blog/${p.slug})${p.excerpt ? `: ${p.excerpt.replace(/\s+/g, " ").trim()}` : ""}`)].join("\n")
      : "";
    await writeFile(join(DIST, "llms.txt"), (await readFile(llmsSrc, "utf8")).replace("{{BLOG_POSTS}}", list));
  }
}

async function readAnonKey() {
  const src = await readFile(join(ROOT, "src/integrations/supabase/client.ts"), "utf8");
  const m = src.match(/SUPABASE_PUBLISHABLE_KEY[^"]*"(eyJ[^"]+)"/);
  if (!m) throw new Error("anon key not found");
  return m[1];
}

function startServer(shell) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = join(DIST, path);
    try {
      if (file.startsWith(DIST) && extname(path) && (await stat(file)).isFile()) {
        res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
        return res.end(await readFile(file));
      }
    } catch { /* fall through to the shell */ }
    res.writeHead(200, { "content-type": MIME[".html"] });
    res.end(shell);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function launchBrowser() {
  const { chromium } = await import("@playwright/test");
  if (process.env.VERCEL) {
    process.env.DEBUG = [process.env.DEBUG, "pw:browser"].filter(Boolean).join(","); // surface Chromium stderr in build logs
    // Vercel's build image has no Chromium: use the serverless build.
    const sparticuz = (await import("@sparticuz/chromium")).default;
    return chromium.launch({ executablePath: await sparticuz.executablePath(), args: [...sparticuz.args.filter((a) => !/single-process|no-zygote/.test(a)), "--disable-dev-shm-usage"], headless: true });
  }
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
}

async function render(browser, base, route) {
  const ctx = await browser.newContext({
    locale: "he-IL",
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce", // framer-motion lands on final states, no half-faded sections
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("cookie-consent", "declined"); } catch { /* ignore */ }
  });
  const page = await ctx.newPage();
  // Never pollute analytics or hit the geo endpoint while snapshotting.
  await page.route(/\/rest\/v1\/page_views|\/api\/geo/, (r) => r.fulfill({ status: 204, body: "" }));
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelector("h1, main h2")?.textContent?.trim().length > 0,
    null, { timeout: 15000 },
  ).catch(() => { /* some pages legitimately lack an h1; verified separately */ });
  const html = await page.evaluate(() => {
    document.querySelectorAll("script[data-vite-dev-id], [data-prerender-skip]").forEach((n) => n.remove());
    return "<!doctype html>\n" + document.documentElement.outerHTML;
  });
  const status = { h1: await page.locator("h1").count(), text: (await page.locator("body").innerText()).length };
  await ctx.close();
  return { html, ...status };
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) return fail("dist/index.html missing; run `npm run build` first");
  const shellPath = join(DIST, "_shell.html");
  if (!existsSync(shellPath)) await copyFile(join(DIST, "index.html"), shellPath); // pristine SPA shell
  const shell = await readFile(shellPath, "utf8");

  const posts = await blogPosts();
  let routes = [...new Set([
    ...(await routesFromSitemap()),
    ...RETURN_TABLE_SLUGS.map((s) => `/return-tables/${s}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ])];
  if (process.env.PRERENDER_ONLY) routes = process.env.PRERENDER_ONLY.split(",");

  let browser;
  try { browser = await launchBrowser(); } catch (e) { return fail(`no browser (${e.message.split("\n")[0]}); shipping plain SPA`); }
  const server = await startServer(shell);
  const base = `http://127.0.0.1:${server.address().port}`;

  const failures = [];
  const thin = [];
  const CONCURRENCY = process.env.VERCEL ? 1 : 4;
  const queue = [...routes, "/__not-found__"];
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const route = queue.shift();
      try {
        const { html, h1, text } = await render(browser, base, route);
        const is404 = route === "/__not-found__";
        const finalHtml = is404 ? html
          .replace(/<link rel="canonical"[^>]*>/, "")
          .replace(/<meta property="og:url"[^>]*>/, "")
          .replace(/<title>[^<]*<\/title>/, "<title>העמוד לא נמצא | SEELD</title>")
          .replace(/<meta name="robots"[^>]*>/, "")
          .replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>') : html;
        const out = route === "/__not-found__"
          ? join(DIST, "404.html")
          : route === "/" ? join(DIST, "index.html") : join(DIST, route, "index.html");
        await mkdir(dirname(out), { recursive: true });
        await writeFile(out, finalHtml);
        if (route !== "/__not-found__" && (h1 === 0 || text < 300)) thin.push(`${route} (h1=${h1}, text=${text})`);
        console.log(`[prerender] ok ${route}  h1=${h1} text=${text}`);
      } catch (e) {
        failures.push(`${route}: ${e.message.split("\n")[0]}`);
      }
    }
  }));

  await browser.close();
  server.close();
  if (!process.env.PRERENDER_ONLY) await writeSitemapAndLlms(routes, posts);
  console.log(`[prerender] ${routes.length - failures.length}/${routes.length} routes written`);
  if (thin.length) console.warn(`[prerender] thin pages (no h1 or <300 chars):\n  ${thin.join("\n  ")}`);
  if (failures.length) {
    console.warn(`[prerender] failures:\n  ${failures.join("\n  ")}`);
    if (STRICT) process.exit(1);
  }
}

main().catch((e) => fail(e.stack ?? String(e)));
