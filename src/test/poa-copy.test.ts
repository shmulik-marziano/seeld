import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { POA_COPY, poaAllStrings, poaStep } from "@/lib/poa/copy";

const ROOT = join(__dirname, "..", "..");
const SPEC_PATH = join(ROOT, "docs", "product", "POA-WIZARD-SPEC.md");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    return statSync(full).isDirectory() ? files(full) : /\.(tsx?|css)$/.test(e) ? [full] : [];
  });
}
const SOURCES = [...files(join(ROOT, "src", "lib", "poa")), ...files(join(ROOT, "src", "pages", "report-order"))];
const RAW = SOURCES.map((f) => readFileSync(f, "utf8")).join("\n");
const ALL = poaAllStrings();
const JOINED = ALL.join("\n");

const HE = "\\u0590-\\u05FFA-Za-z";
// The name deny-list lives in one place only, scripts/check-aeo.mjs NAME_RE (with word boundaries: "משהו" is not a
// name). It is read from there at test time so no name is copied into this file.
const AEO_SRC = readFileSync(join(ROOT, "scripts", "check-aeo.mjs"), "utf8");
const NAME_SRC = /const NAME_RE = new RegExp\(`(.*)`, "u"\)/.exec(AEO_SRC)?.[1];
const NAME_RE = new RegExp((NAME_SRC ?? "(?!)").split("${HE}").join(HE), "u");
const FORBIDDEN: [string, RegExp][] = [
  ["תאגיד", /תאגיד/u],
  ["advice wording", /ייעוץ|יועץ|מתייעץ/u],
  ["free", /ללא עלות|בחינם/u],
  ["promise", /מובטח|מבטיח/u],
  ["safe (not ביטוח)", /(?<![֐-׿])בטוח/u],
  ["superlative", /ביותר/u],
  ["gendered suffix", /[֐-׿]\/[֐-׿]/u],
  ["licence text", /רישיון מס|מס' רישיון|מספר רישיון/u],
  ["names", NAME_RE],
];

describe("poa copy: site copy rules", () => {
  it("the name deny-list was found in scripts/check-aeo.mjs", () => {
    expect(NAME_SRC).toBeTruthy();
    expect(NAME_SRC).toContain("${HE}");
    expect("משהו השתבש").not.toMatch(NAME_RE);
  });

  it.each(FORBIDDEN)("no %s in any visible string", (_n, re) => expect(JOINED).not.toMatch(re));

  it("the safe-word rule still lets ביטוח through", () => {
    expect("הר הביטוח, חברות הביטוח").not.toMatch(FORBIDDEN[4][1]);
    expect("זה בטוח").toMatch(FORBIDDEN[4][1]);
  });

  it("no digits that look like a licence or an ID (6+ digits)", () => {
    for (const s of ALL) expect(s).not.toMatch(/\d{6,}/);
  });

  it.each(FORBIDDEN.filter(([n]) => n !== "advice wording"))("no %s in the raw source of src/lib/poa and src/pages/report-order", (_n, re) => {
    expect(RAW).not.toMatch(re);
  });

  it("no long digit runs or real contact values in the raw source", () => {
    expect(RAW).not.toMatch(/(?<![\w.])\d{7,}(?![\w.])/);
    expect(RAW).not.toMatch(/@seeld\.|\+9725\d{8}/);
  });

  it("no browser storage in the wizard", () => {
    expect(RAW).not.toMatch(/localStorage|sessionStorage|indexedDB/);
  });
});

describe("poa copy: verbatim from the spec", () => {
  // never skipped: without the spec file the main copy gate would turn itself off
  it("the spec file exists", () => expect(existsSync(SPEC_PATH)).toBe(true));
  const SPEC = existsSync(SPEC_PATH) ? readFileSync(SPEC_PATH, "utf8") : "";
  const c = POA_COPY;
  const verbatim = [
    c.s0.eyebrow, c.s0.title, ...Object.values(c.s0.lead), c.s0.body, c.s0.prepareTitle, c.s0.prepareLine, c.s0.note, c.s0.cta,
    ...(["first", "last", "id", "birth", "issue", "street", "city", "zip", "phone", "email"] as const).flatMap((k) => [c.q[k].title, c.q[k].label, c.q[k].err]),
    ...(["first", "last", "id", "issue", "street", "zip", "phone", "email"] as const).map((k) => c.q[k].hint),
    c.q.zipSearching, c.q.zipFound, c.q.zipLookup,
    c.q.consent.title, c.q.consent.termsParts.join(""), c.q.consent.marketing, c.q.consent.err,
    c.q.errDate, c.q.errFuture, c.q.errAge, c.q.errOrder, c.q.cta, c.q.skip,
    c.s2a.title, c.s2a.fix, c.s2a.cta,
    c.s3.title, c.s3.lead, c.s3.cta, c.s3.doneLine,
    ...Object.values(c.card.labels), c.card.fixedLine, c.card.view,
    c.s4.title, c.s4.lead, c.s4.check, c.s4.err, c.s4.cta,
    c.s5.title, c.s5.lead, c.s5.datesLine, c.s5.check, c.s5.errCheck, c.s5.cta,
    c.s6.title, c.s6.lead, c.s6.declaration, c.s6.minorsLine, c.s6.sigLabel, c.s6.altSign, c.s6.err, c.s6.cta,
    c.s7.title, c.s7.methodCheck, c.s7.methodSign, c.s7.download, c.s7.downloadNote, c.s7.nextTitle, c.s7.next1, c.s7.next2, c.s7.keptLine, c.s7.afterReload,
    c.s8.inactive, c.s8.unavailable, c.s8.unavailableText, c.s8.generic, c.s8.genericAction,
    `${c.s8.expiredTitle}. ${c.s8.expiredText}`, c.s8.expiredAction,
    `${c.s8.lockedTitle}. ${c.s8.lockedText}`, c.s8.completed, c.s8.warn, c.s8.warnAction,
    c.draftMark,
  ];
  it.each(verbatim.map((s) => [s]))("%s", (s) => expect(SPEC).toContain(s));

  it("a few exact equalities", () => {
    expect(c.s0.title).toBe("כמה פרטים, שלושה אישורים, והמידע מגיע אלינו");
    expect(c.q.phone.err).toBe("צריך מספר נייד שמתחיל ב־05");
    expect(poaStep(2, 6)).toBe("שלב 2 מתוך 6");
    expect(c.q.counter(3, 11)).toBe("שאלה 3 מתוך 11");
    expect(c.s3.preparing(2, 3)).toBe("מכינים את המסמכים… 2 מתוך 3");
    expect(SPEC).toContain("שאלה N מתוך M");
    expect(SPEC).toContain("שלב N מתוך M");
    expect(SPEC).toContain("מכינים את המסמכים… N מתוך M");
  });
});

describe("poa copy: every key is used", () => {
  const leaves = (o: unknown, p: string[] = []): string[] =>
    typeof o === "string" || Array.isArray(o) ? [p.join(".")]
      : Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...p, k]));
  // the mock-only strings are used by the mock's draft PDF
  const USES = RAW;
  it.each(leaves(POA_COPY).map((k) => [k]))("C.%s", (key) => {
    const parts = key.split(".");
    const used = parts.some((_, i) => {
      const prefix = parts.slice(0, parts.length - i).join(".");
      return i === 0 ? new RegExp(`C\\.${prefix.replace(/\./g, "\\.")}(?![\\w])`).test(USES) : USES.includes(`C.${prefix}[`);
    }) || USES.includes(`POA_COPY.${key}`);
    expect(used).toBe(true);
  });
});

// Built chunks (spec §6 row 2 "dist/assets/*.js"). Run after the build with POA_DIST_SCAN=1: then a missing dist or a
// build with no wizard chunk fails. Without the variable the block runs only when a dist exists (local runs).
// CI wiring (a post-build step in ci.yml mirrored in docs/platform/ci.proposed.yml) waits for the owner's approval.
const DIST = join(ROOT, "dist", "assets");
const DIST_REQUIRED = process.env.POA_DIST_SCAN === "1";
describe.skipIf(!DIST_REQUIRED && !existsSync(DIST))("poa copy: built chunks", () => {
  it("the chunk that carries the wizard strings has no forbidden word, name or licence text", () => {
    expect(existsSync(DIST)).toBe(true);
    const chunks = readdirSync(DIST).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(DIST, f), "utf8"))
      .filter((js) => js.includes(POA_COPY.s0.title));
    if (DIST_REQUIRED) expect(chunks.length).toBeGreaterThan(0);
    for (const js of chunks) {
      const text = js.replace(/[A-Za-z0-9._+-]+@seeld\.info/g, "");
      for (const re of [/תאגיד/u, /ללא עלות|בחינם/u, /רישיון מס|מס' רישיון|מספר רישיון/u, NAME_RE]) expect(text).not.toMatch(re);
    }
  });
});
