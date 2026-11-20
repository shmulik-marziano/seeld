import { describe, it, expect } from "vitest";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { POA_COPY as C } from "@/lib/poa/copy";
import { validateCheck, validateContact, validateHarbit, validateIdentity, validateSignature } from "@/lib/poa/machine";

/** A fake but structurally valid ID: 8 made-up digits + the computed check digit. */
const fakeId = (eight = "12345678") => {
  for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(eight + d)) return eight + d;
  throw new Error("no check digit");
};
const ID = fakeId();
const wrongId = ID.slice(0, 8) + String((Number(ID[8]) + 1) % 10);
const NOW = new Date("2026-06-15T12:00:00Z");

describe("poa validation: identity (ס1)", () => {
  it("accepts names and a valid ID, normalised", () => {
    const r = validateIdentity({ first: "  ישראל ", last: "ישראלי", id: ID });
    expect(r.errors).toEqual({});
    expect(r.value).toEqual({ first: "ישראל", last: "ישראלי", id: ID });
  });

  it("left-pads a short ID", () => {
    const full = fakeId("00001234"); // 9 digits with leading zeros
    const r = validateIdentity({ first: "ישראל", last: "ישראלי", id: full.replace(/^0+/, "") });
    expect(r.value?.id).toBe(full);
  });

  it("blank fields get the spec strings (never the validator's generic required message)", () => {
    const r = validateIdentity({ first: " ", last: "", id: "" });
    expect(r.errors).toEqual({ first: C.s1.errFirst, last: C.s1.errLast, id: C.s1.errId });
    expect(r.value).toBeUndefined();
    expect(Object.values(r.errors).join(" ")).not.toMatch(/\/ת/);
  });

  it.each([
    [wrongId, /ספרה אחר ספרה/],
    ["1234567890", /עד 9 ספרות/],
    ["000000000", /לא נראה תקין/],
  ])("rejects ID %s with the validator message", (id, re) => {
    expect(validateIdentity({ first: "ישראל", last: "ישראלי", id }).errors.id).toMatch(re);
  });

  it("rejects a name with digits", () => {
    expect(validateIdentity({ first: "ישראל1", last: "ישראלי", id: ID }).errors.first).toBeTruthy();
  });
});

describe("poa validation: contact (ס2)", () => {
  const ok = { phone: "0501234567", email: "", terms: true, marketing: false };

  it("accepts a 05 mobile, normalises +972, email optional", () => {
    expect(validateContact(ok).value).toEqual({ ...ok, email: "" });
    expect(validateContact({ ...ok, phone: "+972-50-123-4567" }).value?.phone).toBe("0501234567");
    expect(validateContact({ ...ok, email: "Test@Example.com" }).value?.email).toBe("test@example.com");
  });

  it.each(["031234567", "021234567", "12", ""])("rejects %s with the single spec phone message", (phone) => {
    expect(validateContact({ ...ok, phone }).errors.phone).toBe(C.s2.errPhone);
  });

  it("rejects a malformed email, but only when one is given", () => {
    expect(validateContact({ ...ok, email: "not-an-email" }).errors.email).toBeTruthy();
    expect(validateContact({ ...ok, email: "   " }).errors.email).toBeUndefined();
  });

  it("requires the terms, never the marketing box", () => {
    expect(validateContact({ ...ok, terms: false }).errors.terms).toBe(C.s2.errTerms);
    expect(validateContact({ ...ok, marketing: false }).errors).toEqual({});
  });
});

describe("poa validation: dates (ס5)", () => {
  const ok = { birth: "01/02/1980", issue: "15/03/2015", check: true };

  it("accepts dd/mm/yyyy and returns ISO", () => {
    expect(validateHarbit(ok, NOW).value).toEqual({ birth_date: "1980-02-01", issue_date: "2015-03-15" });
  });

  it("blank dates get the spec strings", () => {
    const r = validateHarbit({ birth: "", issue: " ", check: true }, NOW);
    expect(r.errors).toEqual({ birth: C.s5.errBirth, issue: C.s5.errIssue });
  });

  it("the issue date must not precede the birth date", () => {
    expect(validateHarbit({ ...ok, issue: "01/01/1979" }, NOW).errors.issue).toBe(C.s5.errOrder);
    expect(validateHarbit({ ...ok, issue: "01/02/1980" }, NOW).errors.issue).toBeUndefined();
  });

  it("national ID only, from age 18", () => {
    expect(validateHarbit({ ...ok, birth: "16/06/2008" }, NOW).errors.birth).toBe(C.s5.errAge);
    expect(validateHarbit({ ...ok, birth: "15/06/2008", issue: "15/06/2020" }, NOW).errors.birth).toBeUndefined();
  });

  it.each([["31/02/1980"], ["1980"], ["01/02/80"]])("rejects the malformed birth date %s", (birth) => {
    expect(validateHarbit({ ...ok, birth }, NOW).errors.birth).toBe(C.s5.errDate);
  });

  it("rejects future dates", () => {
    expect(validateHarbit({ ...ok, issue: "01/01/2027" }, NOW).errors.issue).toBe(C.s5.errFuture);
    expect(validateHarbit({ ...ok, birth: "01/01/2027" }, NOW).errors.birth).toBe(C.s5.errFuture);
  });

  it("rejects an implausibly old birth date", () => {
    expect(validateHarbit({ ...ok, birth: "01/01/1900" }, NOW).errors.birth).toBe(C.s5.errDate);
  });

  it("every ס5 message is a copy.ts string", () => {
    const own = new Set<string>(Object.values(C.s5));
    for (const d of [{ birth: "x", issue: "x", check: false }, { birth: "01/01/2099", issue: "01/01/2099", check: false }, { birth: "16/06/2008", issue: "", check: false }]) {
      for (const m of Object.values(validateHarbit(d, NOW).errors)) expect(own.has(m!)).toBe(true);
    }
  });

  it("requires the check", () => {
    expect(validateHarbit({ ...ok, check: false }, NOW).errors.check).toBe(C.s5.errCheck);
  });
});

describe("poa validation: check and signature", () => {
  it("ס4 check and ס6 signature", () => {
    expect(validateCheck(false)).toBe(C.s4.err);
    expect(validateCheck(true)).toBeUndefined();
    expect(validateSignature(null)).toBe(C.s6.err);
    expect(validateSignature("data:image/png;base64,AAAA")).toBeUndefined();
  });
});
