import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = join(__dirname, "..", "..");
const APP = readFileSync(join(ROOT, "src", "App.tsx"), "utf8");

/** Public routes, i.e. everything a search engine or an anonymous visitor can reach. */
function publicRoutes(): string[] {
  return [...APP.matchAll(/<Route path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => !/^\*|:|^\/app|^\/portal|^\/client|^\/execution-portal/.test(p));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(entry) ? [full] : [];
  });
}

describe("sitemap", () => {
  // Routes that exist but must stay out of the index: redirects, admin surfaces,
  // and pages whose content is specific to one signed-in person.
  const EXCLUDED = new Set([
    "/admin",
    "/install",
    "/site-admin",
    "/style-guide",
    "/personal-area",
    "/saved-calculations",
  ]);

  const listed = new Set(
    [...readFileSync(join(ROOT, "public", "sitemap.xml"), "utf8")
      .matchAll(/<loc>https:\/\/seeld\.co\.il(\/[^<]*)<\/loc>/g)]
      .map((m) => (m[1] === "/" ? "/" : m[1].replace(/\/$/, ""))),
  );

  it("lists every public route that is not deliberately excluded", () => {
    const missing = publicRoutes().filter((r) => !EXCLUDED.has(r) && !listed.has(r));
    expect(missing).toEqual([]);
  });

  it("does not list routes the app no longer serves", () => {
    const routes = new Set(publicRoutes());
    const stale = [...listed].filter((loc) => !routes.has(loc));
    expect(stale).toEqual([]);
  });

  it("does not advertise an excluded route", () => {
    const leaked = [...listed].filter((loc) => EXCLUDED.has(loc));
    expect(leaked).toEqual([]);
  });
});

describe("internal navigation", () => {
  // A raw <a href="/…"> inside the SPA tears the whole app down and boots it
  // again to move one route. Every internal destination goes through <Link>.
  // Anchors that open a new tab are exempt — those really are document loads.
  it("uses <Link> rather than <a href> for in-app destinations", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(ROOT, "src"))) {
      const text = readFileSync(file, "utf8");
      for (const tag of text.matchAll(/<a\b[^>]*>/gs)) {
        const attrs = tag[0];
        if (!/href=(\{`\/|"\/)/.test(attrs)) continue; // external, mailto, tel, anchor
        if (/target=["']_blank["']/.test(attrs)) continue;
        offenders.push(`${file.slice(ROOT.length + 1)}: ${attrs.replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  // A link to a path with no route does not 404 — it falls through to the
  // catch-all and quietly renders NotFound, so the breakage only shows up when
  // a visitor clicks it.
  it("points every literal internal link at a route that exists", () => {
    const routes = publicRoutes().concat(
      [...APP.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]),
    );
    const exact = new Set(routes.filter((r) => !r.includes(":") && r !== "*"));
    const patterns = routes
      .filter((r) => r.includes(":"))
      .map((r) => new RegExp(`^${r.replace(/:[^/]+/g, "[^/]+")}$`));
    const resolves = (p: string) => exact.has(p) || patterns.some((re) => re.test(p));

    const menuHrefs = readdirSync(join(ROOT, "src", "data"))
      .filter((f) => f.endsWith(".ts"))
      .flatMap((f) => [
        ...readFileSync(join(ROOT, "src", "data", f), "utf8").matchAll(/href:\s*"(\/[^"]*)"/g),
      ].map((m) => m[1]));

    const jsxHrefs = sourceFiles(join(ROOT, "src"))
      .filter((f) => !f.includes(`${sep}test${sep}`))
      .flatMap((f) => [...readFileSync(f, "utf8").matchAll(/(?:to|href)="(\/[^"]*)"/g)].map((m) => m[1]));

    const broken = [...new Set([...menuHrefs, ...jsxHrefs])]
      .map((h) => h.split(/[?#]/)[0].replace(/\/$/, "") || "/")
      .filter((p) => !resolves(p))
      .sort();

    expect(broken).toEqual([]);
  });

  // Guards the guards: both checks above scan the component tree, and a scan
  // that silently matches nothing passes for the wrong reason. That is not
  // hypothetical here — the mega-menu components these tests originally watched
  // turned out to be unimported, and were deleted.
  it("scans a component tree that actually has components in it", () => {
    expect(sourceFiles(join(ROOT, "src")).length).toBeGreaterThan(100);
  });
});
