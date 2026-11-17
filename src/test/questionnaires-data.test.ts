import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// esbuild cannot run inside the jsdom environment, so the validator runs as a child process (same script as `node scripts/questionnaires/build.mjs`).
async function validateAll(): Promise<{ errors: string[]; stats: unknown[]; index: unknown[] }> {
  const out = execFileSync(process.execPath, [path.resolve("scripts/questionnaires/build.mjs"), "--json"], { encoding: "utf8", maxBuffer: 20_000_000 });
  return JSON.parse(out);
}

describe("questionnaire definitions (scripts/questionnaires/build.mjs)", () => {
  it("all JSON files pass schema + cross checks (duplicate keys, when refs, option keys, min/max)", async () => {
    const r = await validateAll();
    expect(r.errors).toEqual([]);
    expect(r.stats.length).toBeGreaterThanOrEqual(12);
  }, 30000);

  it("the hub index is in sync with the definitions", async () => {
    const r = await validateAll();
    const idx = JSON.parse(fs.readFileSync(path.resolve("src/data/questionnaires.index.json"), "utf8"));
    expect(idx).toEqual(r.index);
  }, 30000);

  it("the validator really fails on broken input", async () => {
    const dir = path.resolve("src/data/questionnaires");
    const orig = fs.readFileSync(path.join(dir, "retirement-planning.json"), "utf8");
    try {
      const d = JSON.parse(orig);
      d.sections[0].questions[1].when = { id: "does_not_exist", value: "כן" };
      d.sections[0].questions[2].min_val = 10;
      d.sections[0].questions[2].max_val = 1;
      d.sections[0].questions[3].key = d.sections[0].questions[0].key;
      fs.writeFileSync(path.join(dir, "retirement-planning.json"), JSON.stringify(d));
      const r = await validateAll();
      const msgs = r.errors.join("\n");
      expect(msgs).toMatch(/unknown key does_not_exist/);
      expect(msgs).toMatch(/min_val 10 > max_val 1/);
      expect(msgs).toMatch(/duplicate key/);
    } finally {
      fs.writeFileSync(path.join(dir, "retirement-planning.json"), orig);
    }
  }, 30000);
});
