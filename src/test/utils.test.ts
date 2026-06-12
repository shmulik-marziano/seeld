import { describe, it, expect } from "vitest";
import { isValidIsraeliPhone } from "@/lib/utils";

describe("isValidIsraeliPhone", () => {
  it("accepts valid mobile numbers", () => {
    expect(isValidIsraeliPhone("0523097444")).toBe(true);
    expect(isValidIsraeliPhone("052-309-7444")).toBe(true);
    expect(isValidIsraeliPhone("052 309 7444")).toBe(true);
  });

  it("accepts valid landline numbers", () => {
    expect(isValidIsraeliPhone("035556677")).toBe(true);
    expect(isValidIsraeliPhone("02-5556677")).toBe(true);
    expect(isValidIsraeliPhone("098765432")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidIsraeliPhone("")).toBe(false);
    expect(isValidIsraeliPhone("abc")).toBe(false);
    expect(isValidIsraeliPhone("123")).toBe(false);
    expect(isValidIsraeliPhone("0523097")).toBe(false); // too short
    expect(isValidIsraeliPhone("05230974445")).toBe(false); // too long
    expect(isValidIsraeliPhone("1523097444")).toBe(false); // doesn't start with 0
    expect(isValidIsraeliPhone("0623097444")).toBe(false); // 06 is not a valid prefix
  });
});
