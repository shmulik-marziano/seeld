import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { supabase } from "@/integrations/supabase/client";
import { siteSupabase } from "@/integrations/supabase/site-client";

const ROOT = join(__dirname, "..", "..");

describe("supabase clients", () => {
  // Two createClient() calls against the same project share one storage key,
  // which means two GoTrueClient instances running two refresh timers over one
  // refresh token. The loser replays a spent token and the session is killed.
  it("share a single connection, so only one auth client exists", () => {
    expect(siteSupabase).toBe(supabase);
  });
});

describe("column selection", () => {
  /** Field names declared by an `interface Name { … }` block in a source file. */
  function interfaceFields(source: string, name: string): string[] {
    const body = source.match(new RegExp(`interface ${name} \\{([^}]*)\\}`, "s"))?.[1];
    if (!body) throw new Error(`interface ${name} not found`);
    return [...body.matchAll(/^\s*([a-z_]+)\??:/gm)].map((m) => m[1]);
  }

  /**
   * The joined column list assigned to `const NAME = [ … ].join(',')`.
   * Accepts either quote style — src/ is single-quoted and api/ is double, and
   * a quote-blind matcher would silently return an empty list and "pass".
   */
  function columnList(source: string, name: string): string[] {
    const body = source.match(new RegExp(`const ${name} = \\[(.*?)\\]\\.join`, "s"))?.[1];
    if (!body) throw new Error(`${name} not found`);
    const cols = [...body.matchAll(/['"]([a-z_]+)['"]/g)].map((m) => m[1]);
    if (cols.length === 0) throw new Error(`${name} parsed as empty`);
    return cols;
  }

  // These hooks pull ~1,400 and ~570 rows on public pages. They ask for named
  // columns instead of '*', so the row type and the column list have to agree:
  // a field added to the type but not the list arrives undefined at runtime.
  it("useCmaFunds fetches every column CmaFundRow declares", () => {
    const src = readFileSync(join(ROOT, "src", "hooks", "useCmaFunds.ts"), "utf8");
    const missing = interfaceFields(src, "CmaFundRow")
      .filter((f) => !columnList(src, "FUND_COLUMNS").includes(f));
    expect(missing).toEqual([]);
  });

  it("useInvestmentTracks fetches every column DBTrack declares", () => {
    const src = readFileSync(join(ROOT, "src", "hooks", "useInvestmentTracks.ts"), "utf8");
    const missing = interfaceFields(src, "DBTrack")
      .filter((f) => !columnList(src, "TRACK_COLUMNS").includes(f));
    expect(missing).toEqual([]);
  });

  // The cached edge routes under api/ are built separately from the Vite app,
  // so each keeps its own copy of the column list. They are the same query
  // against the same view — if they drift, the edge and the fallback start
  // returning differently shaped rows and only one of the two paths breaks,
  // which is the kind of bug that only shows up in production.
  it.each([
    ["funds", "useCmaFunds.ts", "FUND_COLUMNS"],
    ["tracks", "useInvestmentTracks.ts", "TRACK_COLUMNS"],
  ])("api/%s asks for the same columns as the hook fallback", (route, hook, constant) => {
    const edge = readFileSync(join(ROOT, "api", `${route}.ts`), "utf8");
    const client = readFileSync(join(ROOT, "src", "hooks", hook), "utf8");
    expect(columnList(edge, constant)).toEqual(columnList(client, constant));
  });
});
