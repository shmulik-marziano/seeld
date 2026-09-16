// axe-core accessibility sweep over live routes of a running server.
// Usage: MSYS_NO_PATHCONV=1 node scripts/axe_brand.mjs <baseURL> [route ...]
// Runs WCAG 2.x A/AA rules at desktop and phone widths and prints violations
// (rule, impact, node count, first target) per route. Exit 1 on any
// serious/critical violation.
import { chromium } from "@playwright/test";

const [base = "http://localhost:4173", ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ["/", "/insurance/health", "/calculators"];
const AXE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

const browser = await chromium.launch();
let bad = 0;
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: "he-IL" });
  await ctx.addInitScript(() => { try { localStorage.setItem("cookie-consent", "accepted"); } catch { /* ignore */ } });
  for (const route of pages) {
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important}" });
    await page.addScriptTag({ url: AXE_URL });
    await page.waitForFunction(() => typeof window.axe !== "undefined");
    const result = await page.evaluate(async () =>
      window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }),
    );
    const v = result.violations;
    console.log(`\n${vp.name} ${route}: ${v.length} violation rule(s), ${result.passes.length} rules passed`);
    for (const item of v) {
      if (item.impact === "serious" || item.impact === "critical") bad++;
      const first = item.nodes[0];
      console.log(`  [${item.impact}] ${item.id} x${item.nodes.length}: ${item.help}`);
      if (first) console.log(`      ${first.target[0]}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
