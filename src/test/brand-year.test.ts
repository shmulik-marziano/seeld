import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BRAND_YEAR } from "../lib/brandYear";

const SRC = path.resolve(__dirname, "..");
const ROOT = path.resolve(SRC, "..");

const COPYRIGHT_FILES = [
  "src/components/Footer.tsx",
  "src/components/personal-area/DisclaimerBanner.tsx",
  "src/pages/PrivacyPage.tsx",
  "src/pages/TermsPage.tsx",
  "src/pages/AuthPage.tsx",
  "src/pages/SiteAdmin.tsx",
];

const COPYRIGHT_RE = /&copy;|©/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("brand year", () => {
  it("BRAND_YEAR is the static founding year", () => {
    expect(BRAND_YEAR).toBe("2025");
  });

  it.each(COPYRIGHT_FILES)("%s uses BRAND_YEAR on its copyright line, never getFullYear", (rel) => {
    const lines = fs.readFileSync(path.join(ROOT, rel), "utf8").split(/\r?\n/);
    const copyrightLines = lines.filter((l) => COPYRIGHT_RE.test(l));
    expect(copyrightLines.length).toBeGreaterThan(0);
    for (const line of copyrightLines) {
      expect(line).not.toMatch(/getFullYear/);
    }
    expect(copyrightLines.some((l) => l.includes("BRAND_YEAR"))).toBe(true);
  });

  it("no src file renders the running year on a copyright line", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, i) => {
        if (COPYRIGHT_RE.test(line) && line.includes("getFullYear")) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
