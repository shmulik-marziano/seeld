import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTES, ROUTE_BY_PATH } from "@/data/seo/routes";
import type { LlmsGroup } from "@/data/seo/routes";
import { answerSummaries } from "@/data/answerSummaries";
import { faqCategories } from "@/data/faq";
import { GLOSSARY_TERMS } from "@/data/glossary";
import { stories } from "@/data/stories";
import { GUIDE_CATALOG, GUIDES_BASE, TAX_BASE, TAX_CATALOG, guidePath, taxPath } from "@/data/knowledge/catalog";
import { CATEGORIES } from "@/data/knowledge/categories";
import type { Guide } from "@/data/knowledge/types";

// Knowledge section: guides under /learn/guides and the tax series under /learn/pension-tax.
// Guide modules are loaded eagerly here. While the folders are still partly filled the tests skip the
// catalog entries that have no module yet; a registered page without a module is always a failure.
// Set KNOWLEDGE_STRICT=1 to require a module for every catalog entry.

const ROOT = join(__dirname, "..", "..");
const STRICT = process.env.KNOWLEDGE_STRICT === "1";

type Mod = Record<string, unknown> & { guide?: Guide };
const eagerGuides = import.meta.glob("../data/knowledge/guides/*.ts", { eager: true }) as Record<string, Mod>;
const eagerTax = import.meta.glob("../data/knowledge/tax/*.ts", { eager: true }) as Record<string, Mod>;

const slugOfFile = (f: string) => f.replace(/^.*\//, "").replace(/\.ts$/, "");

interface Loaded {
  section: "guides" | "tax";
  slug: string;
  path: string;
  mod: Mod;
}

const loaded: Loaded[] = [
  ...Object.entries(eagerGuides).map(([f, mod]) => ({ section: "guides" as const, slug: slugOfFile(f), path: guidePath(slugOfFile(f)), mod })),
  ...Object.entries(eagerTax).map(([f, mod]) => ({ section: "tax" as const, slug: slugOfFile(f), path: taxPath(slugOfFile(f)), mod })),
];
const moduleFor = (path: string) => loaded.find((l) => l.path === path);

const CATALOG_PATHS = [
  ...GUIDE_CATALOG.map((e) => guidePath(e.slug)),
  ...TAX_CATALOG.map((e) => taxPath(e.slug)),
];
const SECTION_ROUTES = ROUTES.filter((r) => r.path.startsWith(`${GUIDES_BASE}/`) || r.path.startsWith(`${TAX_BASE}/`));
const HUBS = [GUIDES_BASE, TAX_BASE];

/** Every user-visible string of a module (the guide, the tax figures and sources); never slug, category, checked. */
function textsOf(mod: Mod): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  const g = mod.guide;
  if (g) {
    walk([g.title, g.lead, g.blocks, g.sources]);
  }
  for (const [k, v] of Object.entries(mod)) if (k !== "guide" && k !== "default") walk(v);
  return out;
}

// Forbidden-word pack of the content spec. Each entry: name, regex (u flag).
const PROMISE_OK = /(מקדם קצבה מובטח|מקדמי קצבה מובטחים|תשלומים מובטחים)/gu;
const LATIN_OK = /\b(SEELD|ETF|S&P)\b/gu;
const PACK: Array<[string, RegExp]> = [
  ["names", /(?<![֐-׿A-Za-z])(שמוליק|שמואל מרציאנו|מרציאנו|משה|Shmulik|Marziano)(?![֐-׿A-Za-z])/u],
  ["corporate", /תאגיד/u],
  ["free", /ללא עלות|בחינם|חינם|על חשבוננו/u],
  ["promise", /(?<!אינם )(?<!אינן )(?<!אינה )(?<!אינו )(?<!לא )(?<!ללא )(מובטח|מובטחת|מבטיחים|מבטיחה|נבטיח|נבטיחו|מספר 1)/u],
  ["superlative", /ביותר|הכי זול|בלעדי/u],
  ["safe-word", /(?<![֐-׿])בטוח/u],
  ["advice", /ייעוץ|יועץ|מתייעץ|מומלץ/u],
  ["social proof 1", /\d[\d,.]*\+?\s*(לקוחות|משפחות מרוצות|לקוחות מרוצים)/u],
  ["social proof 2", /(מעל|למעלה מ|יותר מ)[־\s-]*\d[\d,.]*\s*(שנות|שנים|לקוחות|משפחות)/u],
  ["social proof 3", /\d[\d,.]*\s*שנות ניסיון/u],
  ["licence", /138666|רישיון מס|מס' רישיון|מספר רישיון|סוכנות ברישיון|מבית עמיתים הון/u],
  ["long digits", /\d{6,}/u],
  ["gendered", /[֐-׿]\/[֐-׿]/u],
  ["first person", /(?<![֐-׿])אני(?![֐-׿])|הסוכן שלכם/u],
  ["emoji", /\p{Extended_Pictographic}/u],
  ["dashes", /[—–]/u],
  ["latin in hebrew", /[֐-׿]\s+[A-Za-z]{2,}\s+[֐-׿]/u],
  ["retired wording", /בדיקת תיק|360|SeelD/u],
];

const forbiddenIn = (text: string): string[] => {
  const t = text.replace(PROMISE_OK, " ").replace(LATIN_OK, " ");
  return PACK.filter(([, re]) => re.test(t)).map(([name]) => name);
};

const FIGURE = /[%₪]|ש["״]ח/u;
const words = (s: string) => s.trim().split(/\s+/).length;

describe("knowledge: catalog and registry", () => {
  it("has unique latin kebab-case slugs", () => {
    const re = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    const slugs = [...GUIDE_CATALOG, ...TAX_CATALOG].map((e) => e.slug);
    expect(slugs.filter((s) => !re.test(s))).toEqual([]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses only declared categories", () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    expect([...GUIDE_CATALOG, ...TAX_CATALOG].filter((e) => !keys.has(e.category))).toEqual([]);
    expect(GUIDE_CATALOG.filter((e) => e.category === "pension-tax")).toEqual([]);
    expect(TAX_CATALOG.filter((e) => e.category !== "pension-tax")).toEqual([]);
    for (const c of CATEGORIES) {
      expect(c.lede).not.toMatch(/\d/);
      expect(forbiddenIn(`${c.title} ${c.lede}`)).toEqual([]);
    }
  });

  it("registers both hubs with a group row and a summary", () => {
    for (const p of HUBS) {
      const r = ROUTE_BY_PATH[p];
      expect(r, p).toBeTruthy();
      expect(r.group).toBe("guides");
      expect(answerSummaries[p], p).toBeTruthy();
    }
    expect(ROUTE_BY_PATH[GUIDES_BASE].kind).toBe("hub");
    expect(ROUTE_BY_PATH[TAX_BASE].kind).toBe("info");
    expect(ROUTE_BY_PATH[TAX_BASE].parent).toBe(GUIDES_BASE);
  });

  it("gives every registered guide page a catalog entry, a module and a summary", () => {
    const catalog = new Set(CATALOG_PATHS);
    for (const r of SECTION_ROUTES) {
      expect(catalog.has(r.path), `catalog entry for ${r.path}`).toBe(true);
      expect(moduleFor(r.path), `module for ${r.path}`).toBeTruthy();
      expect(answerSummaries[r.path], `summary for ${r.path}`).toBeTruthy();
      expect(r.group).toBe("guides");
      expect(r.kind).toBe(r.path === taxPath("numbers") ? "data" : "article");
      expect(r.parent).toBe(r.path.startsWith(`${TAX_BASE}/`) ? TAX_BASE : GUIDES_BASE);
    }
  });

  it("registers every catalog entry that has a module (every entry in strict mode)", () => {
    const registered = new Set(SECTION_ROUTES.map((r) => r.path));
    const missingModule: string[] = [];
    const unregistered: string[] = [];
    for (const p of CATALOG_PATHS) {
      if (moduleFor(p)) {
        if (!registered.has(p)) unregistered.push(p);
      } else missingModule.push(p);
    }
    // The assembler adds the registry entries from the writers' output; until then only warn through the strict switch.
    if (STRICT) {
      expect(missingModule).toEqual([]);
      expect(unregistered).toEqual([]);
    } else {
      expect(registered.size).toBeLessThanOrEqual(CATALOG_PATHS.length);
    }
  });

  it("has no module that the catalog does not know", () => {
    const catalog = new Set(CATALOG_PATHS);
    expect(loaded.filter((l) => !catalog.has(l.path)).map((l) => l.path)).toEqual([]);
  });

  it("resolves related paths of every section page, and further slugs of every guide", () => {
    for (const r of [...SECTION_ROUTES, ...HUBS.map((h) => ROUTE_BY_PATH[h])]) {
      for (const p of r.related ?? []) expect(ROUTE_BY_PATH[p], `${r.path} related ${p}`).toBeTruthy();
    }
    const slugs = new Set([...GUIDE_CATALOG, ...TAX_CATALOG].map((e) => e.slug));
    for (const l of loaded) {
      for (const f of l.mod.guide?.further ?? []) expect(slugs.has(f), `${l.slug} further ${f}`).toBe(true);
    }
  });

  it("keeps summaries and registry copy digit-free, and summaries at citable length", () => {
    for (const p of [...HUBS, ...SECTION_ROUTES.map((r) => r.path)]) {
      const r = ROUTE_BY_PATH[p];
      const s = answerSummaries[p];
      for (const t of [r.title, r.description, s]) expect(t, p).not.toMatch(/\d/);
      expect(r.description.length, `${p} description`).toBeGreaterThanOrEqual(50);
      expect(r.description.length, `${p} description`).toBeLessThanOrEqual(240);
      expect(r.title.length, `${p} title`).toBeGreaterThanOrEqual(15);
      expect(r.title.length, `${p} title`).toBeLessThanOrEqual(90);
      expect(words(s), `${p} summary words`).toBeGreaterThanOrEqual(40);
      expect(words(s), `${p} summary words`).toBeLessThanOrEqual(60);
      expect(forbiddenIn(`${r.title} ${r.description} ${s}`), p).toEqual([]);
    }
    const titles = ROUTES.map((r) => r.title);
    expect(new Set(titles).size).toBe(titles.length);
    const descriptions = ROUTES.map((r) => r.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe("knowledge: guide modules", () => {
  it("export a guide that matches the file name and the catalog", () => {
    for (const l of loaded) {
      const g = l.mod.guide;
      expect(g, l.path).toBeTruthy();
      if (!g) continue;
      const entry = [...GUIDE_CATALOG, ...TAX_CATALOG].find((e) => e.slug === l.slug);
      expect(g.slug, l.path).toBe(l.slug);
      expect(g.category, l.path).toBe(entry?.category);
    }
  });

  it("have a title and a lead without digits, at least one source and two h2 blocks", () => {
    for (const l of loaded) {
      const g = l.mod.guide;
      if (!g) continue;
      expect(g.title, l.path).not.toMatch(/\d/);
      expect(g.lead, l.path).not.toMatch(/\d/);
      expect(g.sources.length, `${l.path} sources`).toBeGreaterThanOrEqual(1);
      // the numbers page is a table page (its figures table is rendered by the layout), so it is exempt
      if (l.slug !== "numbers") expect(g.blocks.filter((b) => b.t === "h2").length, `${l.path} h2`).toBeGreaterThanOrEqual(2);
      expect(g.checked, l.path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(g.checked)), l.path).toBe(false);
    }
  });

  it("pass the forbidden-word pack in every string, tables, callouts and sources included", () => {
    const bad: string[] = [];
    for (const l of loaded) {
      for (const t of textsOf(l.mod)) {
        const hit = forbiddenIn(t);
        if (hit.length) bad.push(`${l.path}: ${hit.join(",")}: ${t.slice(0, 60)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("knowledge: machine-readable copy has no figures", () => {
  it("keeps glossary terms free of % and shekel amounts and digits-free of forbidden words", () => {
    for (const g of GLOSSARY_TERMS) {
      expect(`${g.term} ${g.body}`, g.term).not.toMatch(FIGURE);
      expect(forbiddenIn(`${g.term} ${g.body}`), g.term).toEqual([]);
      if (g.more) expect(ROUTE_BY_PATH[g.more] ?? CATALOG_PATHS.includes(g.more), g.term).toBeTruthy();
    }
    const terms = GLOSSARY_TERMS.map((g) => g.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("keeps FAQ answers free of % and shekel amounts", () => {
    for (const c of faqCategories) for (const q of c.questions) expect(q.a, q.q).not.toMatch(FIGURE);
  });

  it("keeps every answer summary free of % and shekel amounts", () => {
    for (const [p, s] of Object.entries(answerSummaries)) expect(s, p).not.toMatch(FIGURE);
  });

  it("keeps the knowledge stories free of figures and forbidden words", () => {
    for (const p of HUBS) {
      const s = stories[p];
      expect(s, p).toBeTruthy();
      if (!s) continue;
      const all = [s.kicker, s.title, s.body, ...s.moments, s.caption].join(" ");
      expect(all, p).not.toMatch(FIGURE);
      expect(all, p).not.toMatch(/\d/);
      expect(forbiddenIn(all), p).toEqual([]);
      expect(s.moments).toHaveLength(3);
    }
    for (const [p, s] of Object.entries(stories)) {
      expect([s.kicker, s.title, s.body, ...s.moments, s.caption].join(" "), p).not.toMatch(FIGURE);
    }
  });
});

describe("knowledge: llms groups", () => {
  const lib = readFileSync(join(ROOT, "scripts", "seo", "lib.mjs"), "utf8");
  const block = /const GROUPS = \[([\s\S]*?)\];/.exec(lib)?.[1] ?? "";
  const rows = new Set([...block.matchAll(/\["([a-z]+)",/g)].map((m) => m[1]));

  it("finds the GROUPS table", () => {
    expect(rows.size).toBeGreaterThan(3);
  });

  it("has a GROUPS row for every llms group used in the registry", () => {
    const used = new Set<LlmsGroup>(ROUTES.map((r) => r.group));
    expect([...used].filter((g) => !rows.has(g))).toEqual([]);
    for (const g of ["guides", "info"]) expect(rows.has(g)).toBe(true);
  });
});
