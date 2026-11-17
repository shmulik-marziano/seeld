// check:aeo - validates the prerendered site (dist/) for answer-engine readiness. Exit 1 on any error.
//
//   npm run build:seo && npm run check:aeo        (default dist dir)
//   node scripts/check-aeo.mjs C:/tmp/dist-x      (custom dist dir)
//
// Per page: single h1, canonical, unique title and description, OG tags, hreflang, robots,
// JSON-LD parses with a consistent @id graph (Organization, WebSite, WebPage, BreadcrumbList,
// Service where relevant), answer summary present (JSON-LD abstract, plus the visible
// [data-answer-summary] paragraph on insurance/savings pages), no forbidden words
// (corporate-structure word, personal names) and no invented-number or promise patterns.
// Site level: every registry route has a summary and a prerendered file, sitemap has lastmod and
// hreflang, llms.txt / llms-full.txt list every route, robots.txt allows the AI crawlers.
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT, loadData } from "./seo/lib.mjs";

const DIST = resolve(process.argv[2] ?? join(ROOT, "dist"));
const errors = [];
const warnings = [];
const err = (route, msg) => errors.push(`${route}  ${msg}`);
const warn = (route, msg) => warnings.push(`${route}  ${msg}`);

// ───── rules ─────
const FORBIDDEN_WORDS = [/תאגיד/u];
const HE = "\\u0590-\\u05FFA-Za-z";
const NAME_RE = new RegExp(`(?<![${HE}])(שמוליק|שמואל מרציאנו|מרציאנו|משה|Shmulik|Marziano)(?![${HE}])`, "u");
const NEG = "(?<!אינם )(?<!אינן )(?<!אינה )(?<!אינו )(?<!לא )(?<!ללא )";
// Always errors: promises and unverifiable superlatives.
const PROMISE_RES = [
  new RegExp(`${NEG}(מובטח|מובטחת|מבטיחים|מבטיחה|נבטיח|נבטיחו|מספר 1)`, "u"),
  /(אצלנו|אנחנו|שילד|אצל שילד)\s+\S+\s*(\S+\s*)?(הכי זול|הזול ביותר|הטוב ביותר|בלעדי)/u,
  /\d[\d,.]*\+?\s*(לקוחות|משפחות מרוצות|לקוחות מרוצים)/u,
  /(מעל|למעלה מ|יותר מ)[־\s-]*\d[\d,.]*\s*(שנות|שנים|לקוחות|משפחות)/u,
  /\d[\d,.]*\s*שנות ניסיון/u,
];
// Generic figures: errors in meta, summaries and JSON-LD; warnings in the visible body.
const FIGURE_RES = [
  /\d[\d,.]*\s?%/u,
  /₪\s?\d|\d[\d,.]*\s?(₪|ש"ח|שקלים|ש״ח)/u,
];
// Pages whose visible body legitimately contains computed or published figures.
const BODY_FIGURES_OK = new Set(["tool", "data", "flow"]);

// ───── html helpers ─────
const visibleText = (html) =>
  html.replace(/<head[\s\S]*?<\/head>/i, " ").replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const attr = (tag, name) => tag.match(new RegExp(`${name}=("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find((x) => x !== undefined);
const metas = (html) => [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
const metaContent = (html, key, val) => {
  const tag = metas(html).find((t) => attr(t, key) === val);
  return tag ? attr(tag, "content") : undefined;
};
const decode = (s) => s?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const pathToFile = (p) => (p === "/" ? join(DIST, "index.html") : join(DIST, p, "index.html"));

// ───── main ─────
const d = await loadData();
const ORG_ID = `${d.SITE_URL}/#organization`;
const SITE_ID = `${d.SITE_URL}/#website`;

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`[check:aeo] ${DIST}/index.html missing. Run \`npm run build:seo\` first.`);
  process.exit(1);
}

// Pages = sitemap URLs.
const sitemap = existsSync(join(DIST, "sitemap.xml")) ? readFileSync(join(DIST, "sitemap.xml"), "utf8") : "";
const sitemapPaths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || "/");
if (!sitemapPaths.length) err("sitemap.xml", "missing or empty in dist");
if (sitemap && !/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) err("sitemap.xml", "no lastmod");
if (sitemap && !/hreflang="he-IL"/.test(sitemap)) err("sitemap.xml", "no hreflang alternates");

for (const e of d.ROUTES) {
  if (!d.summaries[e.path]) err(e.path, "no answer summary in src/data/answerSummaries.ts");
  if (!sitemapPaths.includes(e.path)) err(e.path, "registry route missing from sitemap.xml");
}
const registered = new Set(d.ROUTES.map((e) => e.path));
for (const p of sitemapPaths) {
  if (!registered.has(p) && !p.startsWith("/blog/")) err(p, "in sitemap.xml but not in the route registry");
}
for (const p of Object.keys(d.summaries)) if (!registered.has(p)) warn(p, "summary has no registry route");

const titles = new Map();
const descriptions = new Map();
const checked = [];

for (const p of sitemapPaths) {
  const file = pathToFile(p);
  if (!existsSync(file)) { err(p, "no prerendered HTML"); continue; }
  const html = readFileSync(file, "utf8");
  const entry = d.ROUTE_BY_PATH[p];
  const isPost = p.startsWith("/blog/");
  const kind = entry?.kind ?? (isPost ? "post" : "unknown");
  checked.push(p);

  // h1
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1s !== 1) err(p, `expected exactly one h1, found ${h1s}`);

  // title, description, canonical, OG, hreflang, robots
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim());
  const desc = decode(metaContent(html, "name", "description"));
  const canonTag = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => attr(t, "rel") === "canonical");
  const canonical = canonTag ? attr(canonTag, "href") : undefined;
  const expected = `${d.SITE_URL}${p === "/" ? "" : p}`;
  if (!title) err(p, "no <title>");
  else {
    if (title.length < 15 || title.length > 90) warn(p, `title length ${title.length}`);
    if (titles.has(title)) err(p, `duplicate title with ${titles.get(title)}: "${title}"`);
    titles.set(title, p);
    if (entry && title !== entry.title) err(p, `title differs from registry: "${title}"`);
  }
  if (!desc) err(p, "no meta description");
  else {
    if (desc.length < 50 || desc.length > 240) warn(p, `description length ${desc.length}`);
    if (descriptions.has(desc)) err(p, `duplicate description with ${descriptions.get(desc)}`);
    descriptions.set(desc, p);
    if (entry && desc !== entry.description) err(p, "description differs from registry");
  }
  if (!canonical) err(p, "no canonical");
  else if (canonical !== expected && canonical !== `${expected}/`) err(p, `canonical ${canonical} != ${expected}`);
  const ogUrl = metaContent(html, "property", "og:url");
  if (!ogUrl) err(p, "no og:url"); else if (canonical && ogUrl !== canonical) err(p, "og:url != canonical");
  for (const k of ["og:title", "og:description", "og:image"]) if (!metaContent(html, "property", k)) err(p, `no ${k}`);
  if (!metaContent(html, "name", "twitter:title")) err(p, "no twitter:title");
  const robots = metaContent(html, "name", "robots");
  if (robots && /noindex/i.test(robots)) err(p, `indexable page has robots "${robots}"`);
  if (!/hreflang="he-IL"/i.test(html)) err(p, "no hreflang alternate");

  // JSON-LD
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const nodes = [];
  blocks.forEach((raw, i) => {
    try {
      const j = JSON.parse(raw);
      nodes.push(...(Array.isArray(j["@graph"]) ? j["@graph"] : [j]));
    } catch (e) { err(p, `JSON-LD block ${i + 1} does not parse: ${e.message}`); }
  });
  const byId = new Map();
  for (const n of nodes) {
    if (!n["@id"]) continue;
    if (byId.has(n["@id"]) && JSON.stringify(byId.get(n["@id"])) !== JSON.stringify(n)) err(p, `duplicate @id ${n["@id"]}`);
    byId.set(n["@id"], n);
  }
  const typeOf = (n) => [].concat(n["@type"] ?? []);
  const hasType = (t) => nodes.some((n) => typeOf(n).includes(t));
  if (!byId.has(ORG_ID)) err(p, "Organization node (#organization) missing");
  if (!byId.has(SITE_ID)) err(p, "WebSite node (#website) missing");
  const refs = [];
  (function walk(v) {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === "@id") refs.push(v["@id"]);
      else Object.values(v).forEach(walk);
    }
  })(nodes);
  for (const r of refs) if (!byId.has(r)) err(p, `JSON-LD @id reference not defined on the page: ${r}`);

  const page = nodes.find((n) => String(n["@id"] ?? "").endsWith("#webpage"));
  if (!page) err(p, "no WebPage node");
  else {
    if (page.url && page.url !== `${d.SITE_URL}${p === "/" ? "/" : p}`) err(p, `WebPage url ${page.url} mismatch`);
    // Answer summary: JSON-LD abstract on every page.
    const abstract = page.abstract ?? nodes.find((n) => typeOf(n).some((t) => /Article|BlogPosting/.test(t)))?.abstract;
    if (!abstract || String(abstract).trim().length < 30) err(p, "no answer summary (WebPage.abstract)");
    else if (entry && d.summaries[p] && abstract !== d.summaries[p]) err(p, "abstract differs from answerSummaries");
  }
  if (p !== "/" && !hasType("BreadcrumbList")) err(p, "no BreadcrumbList");
  if (entry && ["insurance", "savings", "service"].includes(entry.kind) && !hasType("Service")) err(p, "no Service node");
  if (entry?.path === "/faq" && !JSON.stringify(nodes).includes('"Question"')) err(p, "FAQ page without Question entities");
  if (isPost && !hasType("BlogPosting")) warn(p, "blog post without BlogPosting node");
  if (entry && ["insurance", "savings"].includes(entry.kind)) {
    if (!hasType("FAQPage")) warn(p, "no FAQPage JSON-LD (page has no FAQ items?)");
    const vis = html.match(/<p[^>]*data-answer-summary[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
    if (!vis) err(p, "no visible [data-answer-summary] paragraph");
    else if (decode(vis) !== d.summaries[p]) err(p, "visible summary differs from answerSummaries");
  }
  if (entry?.related?.length && !/data-related-pages/.test(html)) warn(p, "related-pages block not rendered (page without Footer?)");

  // forbidden words, personal names, figures
  const body = visibleText(html);
  const head = [title, desc, metaContent(html, "property", "og:title"), metaContent(html, "property", "og:description"), ...blocks].join(" ");
  const everything = `${body} ${head}`;
  for (const re of FORBIDDEN_WORDS) if (re.test(everything)) err(p, `forbidden word ${re}`);
  const nm = everything.match(NAME_RE);
  if (nm) err(p, `personal name "${nm[0]}" (context: ...${everything.slice(Math.max(0, nm.index - 25), nm.index + 30)}...)`);
  for (const re of PROMISE_RES) {
    const m = everything.match(re);
    if (m) (isPost ? warn : err)(p, `promise / invented-claim pattern "${m[0]}" (context: ...${everything.slice(Math.max(0, m.index - 30), m.index + 40)}...)`);
  }
  const strict = `${head} ${d.summaries[p] ?? ""}`;
  for (const re of FIGURE_RES) {
    const m = strict.match(re);
    if (m) (isPost ? warn : err)(p, `figure in title/description/summary/JSON-LD "${m[0]}"`);
    if (!BODY_FIGURES_OK.has(kind)) {
      const b = body.match(re);
      if (b) warn(p, `figure in body "${b[0]}" (verify it is sourced)`);
    }
  }
}

// ───── site-level files ─────
const read = (f) => (existsSync(join(DIST, f)) ? readFileSync(join(DIST, f), "utf8") : null);
for (const f of ["llms.txt", "llms-full.txt"]) {
  const txt = read(f);
  if (!txt) { err(f, "missing in dist"); continue; }
  if (/\{\{[A-Z_]+\}\}/.test(txt)) err(f, "unreplaced placeholder");
  for (const re of FORBIDDEN_WORDS) if (re.test(txt)) err(f, `forbidden word ${re}`);
  if (NAME_RE.test(txt)) err(f, "personal name");
  for (const e of d.ROUTES) if (!txt.includes(`${d.SITE_URL}${e.path === "/" ? "/" : e.path}`)) err(f, `route ${e.path} not listed`);
  if (f === "llms-full.txt") for (const e of d.ROUTES) if (d.summaries[e.path] && !txt.includes(d.summaries[e.path])) err(f, `summary of ${e.path} missing`);
}
const robotsTxt = read("robots.txt") ?? "";
if (!/Sitemap:\s*https:\/\/seeld\.co\.il\/sitemap\.xml/.test(robotsTxt)) err("robots.txt", "no Sitemap line");
for (const bot of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot",
  "Perplexity-User", "Google-Extended", "Googlebot", "Bingbot", "Applebot-Extended", "Meta-ExternalAgent", "Amazonbot", "CCBot", "cohere-ai"]) {
  if (!new RegExp(`User-agent:\\s*${bot}\\b`, "i").test(robotsTxt)) err("robots.txt", `no group for ${bot}`);
}
const groups = robotsTxt.split(/\n\s*\n/).filter((g) => /User-agent:\s*GPTBot/i.test(g));
if (!groups.length || !/^Allow:\s*\/\s*$/m.test(groups[0])) err("robots.txt", "AI bot group lacks `Allow: /`");
if (groups.length && /^Disallow:\s*\/\s*$/m.test(groups[0])) err("robots.txt", "AI bot group disallows everything");

// ───── report ─────
const bySeverity = (list) => [...new Set(list)];
console.log(`[check:aeo] ${checked.length} pages checked in ${DIST}`);
if (warnings.length) console.log(`warnings (${warnings.length}):\n  ${bySeverity(warnings).join("\n  ")}`);
if (errors.length) {
  console.error(`\nERRORS (${errors.length}):\n  ${bySeverity(errors).join("\n  ")}`);
  process.exit(1);
}
console.log("[check:aeo] OK");
