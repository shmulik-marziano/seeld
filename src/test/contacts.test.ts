import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CONTACTS, GENERAL_MAILBOX, contactFor, DEPT_LABEL, DEPT_TEAM } from "@/lib/contacts";

describe("contactFor routing", () => {
  it("sends insurance paths to the insurance desk", () => {
    for (const p of ["/insurance/life", "/insurance/travel", "/insurances", "/insurance/vehicle?x=1", "/travel"]) {
      expect(contactFor(p)).toBe("insurance");
    }
  });
  it("sends insurance topics and subjects to the insurance desk", () => {
    for (const t of ["travel", "life", "health", "insurance", "ביטוח חיים", "ביטוח נסיעות"]) {
      expect(contactFor(t)).toBe("insurance");
    }
  });
  it("sends finance, management and everything else to the general desk", () => {
    for (const p of ["/", "/contact", "/savings/pension-funds", "/portfolio-review", "/about", "/blog", "pension", "savings", "ניוד פנסיה", "אחר", "", undefined, null]) {
      expect(contactFor(p as string)).toBe("general");
    }
  });
});

describe("contact config", () => {
  it("has the agreed numbers and addresses", () => {
    expect(CONTACTS.insurance).toEqual({ phone: "052-7958970", tel: "+972527958970", wa: "972527958970", email: "Moshe@seeld.info" });
    expect(CONTACTS.general).toEqual({ phone: "052-3097444", tel: "+972523097444", wa: "972523097444", email: "Shmulik@seeld.info" });
  });
  it("labels contain no Hebrew personal names", () => {
    const text = JSON.stringify([DEPT_LABEL, DEPT_TEAM, GENERAL_MAILBOX]);
    for (const n of ["מלול", "שמוליק", "משה", "שמואל", "מרציאנו"]) expect(text).not.toContain(n);
  });
  it("llms facts in the SEO script mirror the config (no stale number)", () => {
    const lib = readFileSync("scripts/seo/lib.mjs", "utf8");
    expect(lib).not.toContain("052-309-7444");
    expect(lib).toContain("d.CONTACTS.insurance.phone");
  });
});
