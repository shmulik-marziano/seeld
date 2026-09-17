// Mobile QA audit: per route and phone viewport, reports the things that make a
// page feel wrong on a phone and that a screenshot alone does not show.
// Usage: MSYS_NO_PATHCONV=1 node scripts/mobile_audit.mjs <baseURL> <outDir> [route ...]
//   AUDIT_VIEWPORTS="s360:360x780,phone:390x844" (default) — name:WxH list.
// Output: <outDir>/audit.json (full detail) and a summary table on stdout.
// Checks: horizontal overflow and the offending elements; tap targets under
// 44x44 (links, buttons, inputs) that are visible; body text under 14px;
// inputs under 16px (iOS zooms the page on focus); fixed/sticky elements and
// how much of the first fold they cover; images without intrinsic size (CLS);
// page errors. Also saves a first-fold screenshot per route and viewport.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [base = "http://localhost:4173", outDir = "mobile-audit", ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ["/", "/insurance/health", "/calculators", "/contact"];
const viewports = (process.env.AUDIT_VIEWPORTS || "s360:360x780,phone:390x844")
  .split(",")
  .map((s) => {
    const [name, dims] = s.split(":");
    const [width, height] = dims.split("x").map(Number);
    return { name, width, height };
  });

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: "he-IL",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("cookie-consent", "accepted"); } catch { /* ignore */ }
  });
  for (const route of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    try {
      await page.goto(base + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) {
      results.push({ vp: vp.name, route, error: String(e.message) });
      await page.close();
      continue;
    }
    await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important}" });
    // Scroll through so lazy content mounts, then return to the top.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += vp.height) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const data = await page.evaluate(({ vw, vh }) => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
      };
      const desc = (el) => {
        const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
        return `${el.tagName.toLowerCase()}${id}${cls} "${t}"`;
      };
      const doc = document.documentElement;
      const overflow = Math.max(0, doc.scrollWidth - vw);
      const wide = [];
      if (overflow > 0) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 || r.left < -1) {
            if (r.width < vw * 3 && vis(el)) wide.push(`${desc(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
          }
          if (wide.length >= 12) break;
        }
      }
      const small = [];
      for (const el of document.querySelectorAll("a[href], button, input, select, textarea, [role=button]")) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) {
          // Inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception).
          const inline = el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, li, td, dd");
          if (!inline) small.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
      const tiny = new Map();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim() || n.textContent.trim().length < 3) continue;
        const el = n.parentElement;
        if (!el || !vis(el)) continue;
        if (el.closest("script, style, noscript, [aria-hidden=true], sup, sub")) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 14) tiny.set(desc(el) + ` ${fs}px`, true);
      }
      const inputsSmall = [];
      for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea")) {
        if (!vis(el)) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) inputsSmall.push(`${desc(el)} ${fs}px`);
      }
      const fixed = [];
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if ((cs.position === "fixed" || cs.position === "sticky") && vis(el)) {
          const r = el.getBoundingClientRect();
          if (r.width * r.height > 100) fixed.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)}`);
        }
      }
      const imgs = [];
      for (const img of document.querySelectorAll("img")) {
        if (!vis(img)) continue;
        if (!img.getAttribute("width") || !img.getAttribute("height")) {
          const cs = getComputedStyle(img);
          if (cs.aspectRatio === "auto" && !img.closest("[style*=aspect-ratio], .aspect-\\[")) imgs.push(desc(img));
        }
      }
      const h1 = document.querySelector("h1");
      const h1fs = h1 ? parseFloat(getComputedStyle(h1).fontSize) : null;
      const bodyFs = parseFloat(getComputedStyle(document.body).fontSize);
      const meta = document.querySelector("meta[name=viewport]")?.getAttribute("content") || "";
      return { overflow, wide, small, tiny: [...tiny.keys()], inputsSmall, fixed, imgsNoSize: imgs, h1fs, bodyFs, meta, height: doc.scrollHeight, vh };
    }, { vw: vp.width, vh: vp.height });

    const shot = join(outDir, `${route.replace(/\//g, "_").replace(/^_$/, "home") || "home"}-${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.push({ vp: vp.name, route, errors, ...data, shot });
    await page.close();
  }
  await ctx.close();
}
await browser.close();

writeFileSync(join(outDir, "audit.json"), JSON.stringify(results, null, 2));
const pad = (s, n) => String(s).padEnd(n);
console.log(pad("vp", 6) + pad("route", 34) + pad("ovf", 5) + pad("tap<44", 7) + pad("txt<14", 7) + pad("in<16", 6) + pad("fixed", 6) + pad("img", 4) + pad("h1", 5) + "err");
for (const r of results) {
  if (r.error) { console.log(pad(r.vp, 6) + pad(r.route, 34) + "LOAD ERROR " + r.error); continue; }
  console.log(pad(r.vp, 6) + pad(r.route, 34) + pad(r.overflow, 5) + pad(r.small.length, 7) + pad(r.tiny.length, 7) + pad(r.inputsSmall.length, 6) + pad(r.fixed.length, 6) + pad(r.imgsNoSize.length, 4) + pad(r.h1fs ?? "-", 5) + r.errors.length);
}
