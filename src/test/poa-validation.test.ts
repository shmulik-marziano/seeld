import { describe, it, expect } from "vitest";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { POA_COPY as C } from "@/lib/poa/copy";
import { emptyDetails, Q_KEYS, validateAnswer, validateCheck, validateDetails, validateSignature, type Details } from "@/lib/poa/machine";

/** A fake but structurally valid ID: 8 made-up digits + the computed check digit. */
const fakeId = (eight = "12345678") => {
  for (let d = 0; d <= 9; d++) if (israeliIdCheckDigitOk(eight + d)) return eight + d;
  throw new Error("no check digit");
};
const ID = fakeId();
const wrongId = ID.slice(0, 8) + String((Number(ID[8]) + 1) % 10);
const NOW = new Date("2026-06-15T12:00:00Z");
const OK: Details = {
  first: "ישראל", last: "ישראלי", id: ID, birth: "1980-02-01", issue: "2015-03-15", street: "הרצל 1", city: "תל אביב",
  phone: "0501234567", email: "", terms: true, marketing: false,
};
const at = (patch: Partial<Details>): Details => ({ ...OK, ...patch });

describe("poa validation: names and ID (ס1 questions 1-3)", () => {
  it("accepts names and a valid ID, normalised", () => {
    expect(validateAnswer("first", at({ first: "  ישראל " }))).toEqual({ patch: { first: "ישראל" } });
    expect(validateAnswer("last", OK)).toEqual({ patch: { last: "ישראלי" } });
    expect(validateAnswer("id", OK)).toEqual({ patch: { id: ID } });
  });

  it("left-pads a short ID", () => {
    const full = fakeId("00001234"); // 9 digits with leading zeros
    expect(validateAnswer("id", at({ id: full.replace(/^0+/, "") })).patch?.id).toBe(full);
  });

  it("blank answers get the spec strings (never the validator's generic required message)", () => {
    expect(validateAnswer("first", at({ first: " " })).err).toBe(C.q.first.err);
    expect(validateAnswer("last", at({ last: "" })).err).toBe(C.q.last.err);
    expect(validateAnswer("id", at({ id: "" })).err).toBe(C.q.id.err);
    for (const k of ["first", "last", "id"] as const) expect(C.q[k].err).not.toMatch(/\/ת/);
  });

  it.each([
    [wrongId, /ספרה אחר ספרה/],
    ["1234567890", /עד 9 ספרות/],
    ["000000000", /לא נראה תקין/],
  ])("rejects ID %s with the validator message", (id, re) => {
    expect(validateAnswer("id", at({ id })).err).toMatch(re);
  });

  it("rejects a name with digits", () => {
    expect(validateAnswer("first", at({ first: "ישראל1" })).err).toBeTruthy();
  });
});

describe("poa validation: dates (ס1 questions 4-5)", () => {
  it("accepts ISO (the picker's value) and dd/mm/yyyy, returns ISO", () => {
    expect(validateAnswer("birth", OK, NOW)).toEqual({ patch: { birth: "1980-02-01" } });
    expect(validateAnswer("issue", OK, NOW)).toEqual({ patch: { issue: "2015-03-15" } });
    expect(validateAnswer("birth", at({ birth: "01/02/1980" }), NOW)).toEqual({ patch: { birth: "1980-02-01" } });
  });

  it("blank dates get the spec strings", () => {
    expect(validateAnswer("birth", at({ birth: "" }), NOW).err).toBe(C.q.birth.err);
    expect(validateAnswer("issue", at({ issue: " " }), NOW).err).toBe(C.q.issue.err);
  });

  it("the issue date must not precede the birth date", () => {
    expect(validateAnswer("issue", at({ issue: "1979-01-01" }), NOW).err).toBe(C.q.errOrder);
    expect(validateAnswer("issue", at({ issue: "1980-02-01" }), NOW).err).toBeUndefined();
  });

  it("national ID only, from age 18", () => {
    expect(validateAnswer("birth", at({ birth: "2008-06-16" }), NOW).err).toBe(C.q.errAge);
    expect(validateAnswer("birth", at({ birth: "2008-06-15" }), NOW).err).toBeUndefined();
  });

  it.each([["1980-02-31"], ["1980"], ["01/02/80"]])("rejects the malformed birth date %s", (birth) => {
    expect(validateAnswer("birth", at({ birth }), NOW).err).toBe(C.q.errDate);
  });

  it("rejects future dates", () => {
    expect(validateAnswer("issue", at({ issue: "2027-01-01" }), NOW).err).toBe(C.q.errFuture);
    expect(validateAnswer("birth", at({ birth: "2027-01-01" }), NOW).err).toBe(C.q.errFuture);
  });

  it("rejects an implausibly old birth date", () => {
    expect(validateAnswer("birth", at({ birth: "1900-01-01" }), NOW).err).toBe(C.q.errDate);
  });

  it("every date message is a copy.ts string", () => {
    const own = new Set<string>([C.q.errDate, C.q.errFuture, C.q.errAge, C.q.errOrder, C.q.birth.err, C.q.issue.err]);
    for (const d of [at({ birth: "x", issue: "x" }), at({ birth: "2099-01-01", issue: "2099-01-01" }), at({ birth: "2008-06-16", issue: "" })]) {
      for (const k of ["birth", "issue"] as const) { const e = validateAnswer(k, d, NOW).err; if (e) expect(own.has(e)).toBe(true); }
    }
  });
});

describe("poa validation: address (ס1 questions 6-7)", () => {
  it("requires street and city, trims and collapses spaces", () => {
    expect(validateAnswer("street", at({ street: "" })).err).toBe(C.q.street.err);
    expect(validateAnswer("city", at({ city: "  " })).err).toBe(C.q.city.err);
    expect(validateAnswer("street", at({ street: "  הרצל   12 " }))).toEqual({ patch: { street: "הרצל 12" } });
    expect(validateAnswer("city", OK)).toEqual({ patch: { city: "תל אביב" } });
  });

  it("rejects a one-letter or over-long answer with the validator message", () => {
    expect(validateAnswer("street", at({ street: "א" })).err).toBeTruthy();
    expect(validateAnswer("city", at({ city: "א".repeat(81) })).err).toBeTruthy();
  });
});

describe("poa validation: contact and consent (ס1 questions 8-10)", () => {
  it("accepts a 05 mobile, normalises +972, email optional", () => {
    expect(validateAnswer("phone", OK)).toEqual({ patch: { phone: "0501234567" } });
    expect(validateAnswer("phone", at({ phone: "+972-50-123-4567" })).patch?.phone).toBe("0501234567");
    expect(validateAnswer("email", at({ email: "Test@Example.com" })).patch?.email).toBe("test@example.com");
    expect(validateAnswer("email", at({ email: "   " }))).toEqual({ patch: { email: "" } });
  });

  it.each(["031234567", "021234567", "12", ""])("rejects %s with the single spec phone message", (phone) => {
    expect(validateAnswer("phone", at({ phone })).err).toBe(C.q.phone.err);
  });

  it("rejects a malformed email, but only when one is given", () => {
    expect(validateAnswer("email", at({ email: "not-an-email" })).err).toBeTruthy();
  });

  it("requires the terms, never the marketing box", () => {
    expect(validateAnswer("consent", at({ terms: false })).err).toBe(C.q.consent.err);
    expect(validateAnswer("consent", at({ marketing: true }))).toEqual({ patch: { terms: true, marketing: true } });
  });
});

describe("poa validation: the whole set", () => {
  it("validateDetails is true only when every answer passes", () => {
    expect(validateDetails(OK, NOW)).toBe(true);
    expect(validateDetails(emptyDetails(), NOW)).toBe(false);
    for (const k of Q_KEYS) {
      const broken = k === "consent" ? at({ terms: false }) : k === "email" ? at({ email: "x" }) : at({ [k]: "" } as Partial<Details>);
      expect(validateDetails(broken, NOW)).toBe(false);
    }
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
