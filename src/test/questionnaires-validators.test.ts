import { describe, expect, it } from "vitest";
import {
  ageFromBirth, buildIsraeliIban, checkChildAfterParent, checkSpouseNotClient, computeBmi, formatPhone, isAdult, israeliIdCheckDigitOk, parseDate, parseNumberInput,
  validateAccountNumber, validateBankCode, validateBirthDate, validateBranch, validateDate, validateEmail, validateHeight, validateIsraeliIban, validateIsraeliId,
  validateIsraeliPhone, validateNumber, validatePassport, validatePersonName, validateText, validateWeight, validateZip,
} from "@/questionnaires/validators";

const NOW = new Date(2026, 10, 17); // 17 Nov 2026

describe("israeli id", () => {
  const cases: [string, boolean, string?][] = [
    ["123456782", true, "123456782"],
    ["000000018", true, "000000018"],
    ["18", true, "000000018"], // left padded
    ["12345678", false], // pads to 012345678, bad check digit
    ["123456783", false],
    ["000000000", false],
    ["", false],
    ["   ", false],
    ["1234567890", false],
    ["123-456-782", true, "123456782"],
    ["١٢٣٤٥٦٧٨٢", true, "123456782"], // arabic-indic digits
  ];
  it.each(cases)("%s -> %s", (input, valid, value) => {
    const r = validateIsraeliId(input);
    expect(r.ok).toBe(valid);
    if (valid) expect(r.value).toBe(value);
    else expect(r.message).toBeTruthy();
  });
  it("check digit helper", () => {
    expect(israeliIdCheckDigitOk("123456782")).toBe(true);
    expect(israeliIdCheckDigitOk("12345678")).toBe(false);
  });
});

describe("israeli phone", () => {
  const cases: [string, boolean, string?][] = [
    ["052-3097444", true, "0523097444"],
    ["0523097444", true, "0523097444"],
    ["+972523097444", true, "0523097444"],
    ["972523097444", true, "0523097444"],
    ["00972 52 309 7444", true, "0523097444"],
    ["523097444", true, "0523097444"],
    ["03-5551234", true, "035551234"],
    ["02 6251234", true, "026251234"],
    ["077-1234567", true, "0771234567"],
    ["0123456789", false],
    ["05230974", false],
    ["052309744455", false],
    ["abc", false],
    ["", false],
  ];
  it.each(cases)("%s -> %s", (input, valid, value) => {
    const r = validateIsraeliPhone(input);
    expect(r.ok).toBe(valid);
    if (valid) expect(r.value).toBe(value);
  });
  it("formats", () => {
    expect(formatPhone("0523097444")).toBe("052-3097444");
    expect(formatPhone("035551234")).toBe("03-5551234");
  });
});

describe("email", () => {
  it.each([["a@b.co", true], ["Name.Last+tag@Example.COM", true], ["a@b", false], ["a b@c.com", false], ["a..b@c.com", false], ["", false], ["@c.com", false], ["a@c.", false]])("%s", (v, ok) => {
    expect(validateEmail(v).ok).toBe(ok);
  });
  it("lowercases", () => expect(validateEmail("A@B.COM").value).toBe("a@b.com"));
});

describe("passport and names", () => {
  it.each([["AB123456", true], ["a1b2c3d4e5", true], ["12345", false], ["AB 12-3456", true], ["AB1234567890123", false], ["", false], ["AB#1234", false]])("passport %s", (v, ok) => {
    expect(validatePassport(v).ok).toBe(ok);
  });
  it.each([
    ["דנה", true], ["בן-ציון", true], ["ג'ורג'", true], ["O'Brien", true], ["אבו  גוש", true], ["Anne-Marie", true], ["א", false], ["Dana3", false], ["", false], ["דנה!", false],
    ["ד".repeat(51), false], ["ש״י", true],
  ])("name %s", (v, ok) => {
    expect(validatePersonName(v).ok).toBe(ok);
  });
});

describe("bank, branch, account, iban, zip", () => {
  it.each([["12", true, "12"], ["012", true, "12"], ["0", false], ["", false], ["1234", false], ["abc", false]])("bank code %s", (v, ok, val) => {
    const r = validateBankCode(v);
    expect(r.ok).toBe(ok);
    if (ok) expect(r.value).toBe(val);
  });
  it("bank code not in list: allowed with warning", () => {
    const r = validateBankCode("99", new Set(["12", "10"]));
    expect(r.ok).toBe(true);
    expect(r.warning).toBeTruthy();
  });
  it.each([["600", true], ["1", true], ["0000", false], ["1234", false], ["", false], ["x", false]])("branch %s", (v, ok) => {
    expect(validateBranch(v).ok).toBe(ok);
  });
  it("branch not in list: soft warning", () => {
    const r = validateBranch("999", { knownBranches: new Set(["600"]) });
    expect(r.ok).toBe(true);
    expect(r.warning).toBeTruthy();
    expect(validateBranch("600", { knownBranches: new Set(["600"]) }).warning).toBeUndefined();
  });
  it.each([["1234", true], ["123456789", true], ["123 456-789", true], ["123", false], ["1234567890", false], ["", false], ["abcd", false]])("account %s", (v, ok) => {
    expect(validateAccountNumber(v).ok).toBe(ok);
  });
  it("account strips separators", () => expect(validateAccountNumber("12-345 67").value).toBe("1234567"));

  const iban = "IL620108000000099999999";
  it("known good IBAN", () => expect(validateIsraeliIban(iban).ok).toBe(true));
  it("spaces and lowercase", () => expect(validateIsraeliIban("il62 0108 0000 0009 9999 999").ok).toBe(true));
  it.each([["IL630108000000099999999"], ["IL62010800000009999999"], ["DE89370400440532013000"], ["IL6201080000000999999A9"], [""]])("bad IBAN %s", (v) => {
    expect(validateIsraeliIban(v).ok).toBe(false);
  });
  it("bank and branch consistency", () => {
    expect(validateIsraeliIban(iban, { bank: "10", branch: "800" }).ok).toBe(true);
    expect(validateIsraeliIban(iban, { bank: "12" }).ok).toBe(false);
    expect(validateIsraeliIban(iban, { bank: "10", branch: "600" }).ok).toBe(false);
  });
  it("builds valid IBANs", () => {
    for (const [b, br, a] of [["12", "600", "123456"], ["10", "800", "99999999"], ["20", "400", "1"]]) {
      expect(validateIsraeliIban(buildIsraeliIban(b, br, a), { bank: b, branch: br }).ok).toBe(true);
    }
  });
  it.each([["1234567", true], ["12345", false], ["12345678", false], ["12 34567", true], ["", false], ["abcdefg", false]])("zip %s", (v, ok) => {
    expect(validateZip(v).ok).toBe(ok);
  });
});

describe("numbers", () => {
  it.each([["1,234", 1234], ["1,234.5", 1234.5], ["₪ 12,000", 12000], ["50%", 50], ["12", 12], ["١٢", 12], ["1,23", NaN], ["abc", NaN], ["", NaN], ["12.5.1", NaN]])("parse %s", (v, n) => {
    expect(parseNumberInput(v)).toEqual(n);
  });
  it("min max integer", () => {
    expect(validateNumber("5", { min: 1, max: 10 }).ok).toBe(true);
    expect(validateNumber("0", { min: 1 }).ok).toBe(false);
    expect(validateNumber("11", { max: 10 }).ok).toBe(false);
    expect(validateNumber("2.5", { integer: true }).ok).toBe(false);
    expect(validateNumber("", {}).ok).toBe(false);
  });
  it("soft ceiling warns but passes", () => {
    const r = validateNumber("500000", { warnAbove: 100000 });
    expect(r.ok).toBe(true);
    expect(r.warning).toBeTruthy();
  });
  it("height/weight plausibility", () => {
    expect(validateHeight("172").ok).toBe(true);
    expect(validateHeight("1.72").ok).toBe(false);
    expect(validateHeight("17").ok).toBe(false);
    expect(validateHeight("300").ok).toBe(false);
    expect(validateWeight("68").ok).toBe(true);
    expect(validateWeight("1").ok).toBe(false);
    expect(validateWeight("401").ok).toBe(false);
    expect(validateHeight("1.72").message).toContain("סביר");
  });
});

describe("dates and ages", () => {
  it.each([["17/05/2020", "2020-05-17"], ["17.5.2020", "2020-05-17"], ["2020-05-17", "2020-05-17"], ["31/02/2020", null], ["29/02/2021", null], ["29/02/2020", "2020-02-29"], ["abc", null], ["17/05/20", null], ["", null]])("parse %s", (v, iso) => {
    const p = parseDate(v);
    expect(p ? `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}` : null).toBe(iso);
  });
  it("future handling", () => {
    expect(validateDate("2027-01-01", { now: NOW }).ok).toBe(false);
    expect(validateDate("2027-01-01", { now: NOW, allowFuture: true }).ok).toBe(true);
    expect(validateDate("2026-01-01", { now: NOW, futureOnly: true }).ok).toBe(false);
    expect(validateDate("2026-11-17", { now: NOW }).ok).toBe(true); // today is not future
  });
  it("age math", () => {
    expect(ageFromBirth("2008-11-17", NOW)).toBe(18);
    expect(ageFromBirth("2008-11-18", NOW)).toBe(17);
    expect(ageFromBirth("2026-11-17", NOW)).toBe(0);
    expect(ageFromBirth("2027-01-01", NOW)).toBeNull();
    expect(isAdult("2008-11-17", NOW)).toBe(true);
    expect(isAdult("2008-11-18", NOW)).toBe(false);
    expect(ageFromBirth("2000-02-29", new Date(2026, 1, 28))).toBe(25);
  });
  it("birth date range 0..120", () => {
    expect(validateBirthDate("1980-05-05", NOW).ok).toBe(true);
    expect(validateBirthDate("1890-05-05", NOW).ok).toBe(false);
    expect(validateBirthDate("1900-01-01", NOW).ok).toBe(false);
    expect(validateBirthDate("2030-05-05", NOW).ok).toBe(false);
  });
  it("notBefore", () => {
    expect(validateDate("2026-12-05", { now: NOW, allowFuture: true, notBefore: "2026-12-10" }).ok).toBe(false);
    expect(validateDate("2026-12-12", { now: NOW, allowFuture: true, notBefore: "2026-12-10" }).ok).toBe(true);
  });
});

describe("bmi", () => {
  it.each([[170, 50, 17.3, "under"], [170, 65, 22.5, "normal"], [170, 80, 27.7, "over"], [170, 95, 32.9, "obese"]])("%s cm %s kg", (h, w, v, band) => {
    const r = computeBmi(h, w, 30)!;
    expect(r.value).toBe(v);
    expect(r.band).toBe(band);
    expect(r.warning).toBeUndefined();
  });
  it("no band for minors, still a number", () => {
    const r = computeBmi(150, 40, 12)!;
    expect(r.band).toBeNull();
    expect(r.value).toBe(17.8);
  });
  it("implausible warns, never blocks", () => {
    expect(computeBmi(170, 10, 30)!.warning).toBeTruthy();
    expect(computeBmi(150, 300, 30)!.warning).toBeTruthy();
  });
  it("invalid input", () => expect(computeBmi(0, 60)).toBeNull());
});

describe("text and cross checks", () => {
  it("max length", () => {
    expect(validateText("abc", { max: 5 }).ok).toBe(true);
    expect(validateText("abcdef", { max: 5 }).ok).toBe(false);
    expect(validateText("", { required: false }).ok).toBe(true);
    expect(validateText("  ", {}).ok).toBe(false);
  });
  it("spouse is not the client", () => {
    expect(checkSpouseNotClient("123456782", "123456782").ok).toBe(false);
    expect(checkSpouseNotClient("123456782", "123-456-782").ok).toBe(false);
    expect(checkSpouseNotClient("18", "000000018").ok).toBe(false);
    expect(checkSpouseNotClient("123456782", "000000018").ok).toBe(true);
    expect(checkSpouseNotClient("", "000000018").ok).toBe(true);
  });
  it("child after parent", () => {
    expect(checkChildAfterParent("1980-01-01", "2010-01-01").ok).toBe(true);
    expect(checkChildAfterParent("1980-01-01", "1979-01-01").ok).toBe(false);
    expect(checkChildAfterParent("1980-01-01", "1980-01-01").ok).toBe(false);
    expect(checkChildAfterParent("", "2010-01-01").ok).toBe(true);
  });
  it("warm messages never use harsh words", () => {
    for (const r of [validateIsraeliId("123"), validateIsraeliPhone("1"), validateEmail("x"), validateZip("1")]) expect(r.message).toMatch(/כדאי|אפשר|בדרך כלל/);
  });
});
