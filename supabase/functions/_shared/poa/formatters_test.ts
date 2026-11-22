// deno test supabase/functions/_shared/poa/  (synthetic values only; these are the contract tests of the value formats:
// when the owner's full run locks a format, the expectation here changes together with formatters.ts)
import assert from "node:assert/strict";
import {
  cellForTool, cleanEmail, cleanName, dateForTool, harbitDates, isValidIsraeliId, MAX_SIGNATURE_CHARS, nationalIdForTool, parseIsoDate, pastIsoDate,
  pngBase64, signatureForTool, todayIsrael, toE164IsraeliMobile, toLocalMobile,
} from "./formatters.ts";
import { PNG_B64, PNG_URL, SYNTH_ID } from "./fixtures.ts";

Deno.test("formatters: national id check digit", () => {
  assert.equal(isValidIsraeliId(SYNTH_ID), true);
  assert.equal(isValidIsraeliId("000000019"), false);
  assert.equal(isValidIsraeliId("12345"), false, "9 digits exactly");
  assert.equal(isValidIsraeliId("00000001a"), false);
  assert.equal(nationalIdForTool(SYNTH_ID), SYNTH_ID);
});

Deno.test("formatters: Israeli mobile only, +972 form", () => {
  assert.equal(toE164IsraeliMobile("0501234567"), "+972501234567");
  assert.equal(toE164IsraeliMobile("050-123 4567"), "+972501234567");
  assert.equal(toE164IsraeliMobile("+972501234567"), "+972501234567");
  assert.equal(toE164IsraeliMobile("972541234567"), "+972541234567");
  assert.equal(toE164IsraeliMobile("0212345678"), null, "landline");
  assert.equal(toE164IsraeliMobile("+14155550123"), null, "other country");
  assert.equal(toE164IsraeliMobile("050123456"), null, "too short");
  assert.equal(toE164IsraeliMobile("05012345678"), null, "too long");
  assert.equal(toE164IsraeliMobile("abc"), null);
  assert.equal(toLocalMobile("+972501234567"), "0501234567");
  assert.equal(toLocalMobile("0501234567"), null);
  assert.equal(cellForTool("+972501234567"), "+972501234567");
});

Deno.test("formatters: names and e-mail", () => {
  assert.equal(cleanName("  דנה   כהן "), "דנה כהן");
  assert.equal(cleanName("O'Neil-Smith"), "O'Neil-Smith");
  assert.equal(cleanName(""), null);
  assert.equal(cleanName("1234"), null);
  assert.equal(cleanName("<b>x</b>"), null);
  assert.equal(cleanName(42), null);
  assert.equal(cleanEmail(null), null);
  assert.equal(cleanEmail(""), null);
  assert.equal(cleanEmail(" A@Example.com "), "a@example.com");
  assert.equal(cleanEmail("not-an-email"), undefined);
  assert.equal(cleanEmail(5), undefined);
});

Deno.test("formatters: dates are real calendar days, never in the future", () => {
  assert.equal(parseIsoDate("2000-02-29"), "2000-02-29");
  assert.equal(parseIsoDate("2001-02-29"), null);
  assert.equal(parseIsoDate("2000-13-01"), null);
  assert.equal(parseIsoDate("01/02/2000"), null);
  const now = Date.UTC(2026, 10, 21, 12, 0, 0);
  assert.equal(todayIsrael(now), "2026-11-21");
  assert.equal(todayIsrael(Date.UTC(2026, 10, 21, 22, 30, 0)), "2026-11-22", "Israel is already on the next day at 22:30 UTC");
  assert.equal(pastIsoDate("2026-11-21", now), "2026-11-21");
  assert.equal(pastIsoDate("2026-11-22", now), null);
  assert.equal(pastIsoDate("1899-12-31", now), null);
  assert.equal(dateForTool("1990-05-17"), "1990-05-17");
});

Deno.test("formatters: harbit dates follow the database rule (issue strictly after birth, today = Israel today)", () => {
  const now = Date.UTC(2026, 10, 21, 12, 0, 0);
  assert.deepEqual(harbitDates("1990-05-17", "2015-01-02", now), { birth: "1990-05-17", issue: "2015-01-02" });
  assert.deepEqual(harbitDates("1990-05-17", "1990-05-17", now), { error: "invalid_issue_date" }, "issue == birth is refused (the database says <=)");
  assert.deepEqual(harbitDates("1990-05-17", "1980-01-01", now), { error: "invalid_issue_date" });
  assert.deepEqual(harbitDates("2026-11-21", "2026-11-21", now), { error: "invalid_birth_date" }, "born today is not a birth date");
  assert.deepEqual(harbitDates("1990-05-17", "2026-11-21", now), { birth: "1990-05-17", issue: "2026-11-21" }, "issued today (Israel) is fine");
  assert.deepEqual(harbitDates("1990-05-17", "2026-11-22", now), { error: "invalid_issue_date" }, "tomorrow is not");
  // 23:30 UTC is already the next day in Israel: that day is "today" for the function and for the database
  const late = Date.UTC(2026, 10, 21, 23, 30, 0);
  assert.deepEqual(harbitDates("1990-05-17", "2026-11-22", late), { birth: "1990-05-17", issue: "2026-11-22" });
  assert.deepEqual(harbitDates("nope", "2015-01-02", now), { error: "invalid_birth_date" });
});

Deno.test("formatters: signature is a PNG data URL and travels as the full data URL (verified 2026-11-22)", () => {
  assert.equal(pngBase64(PNG_URL), PNG_B64);
  assert.equal(pngBase64("data:image/jpeg;base64," + PNG_B64), null);
  assert.equal(pngBase64("data:image/png;base64,AAAA"), null, "too short / not a PNG");
  assert.equal(pngBase64("data:image/png;base64," + "A".repeat(200)), null, "no PNG signature");
  assert.equal(pngBase64(PNG_URL + "!"), null);
  assert.equal(pngBase64("data:image/png;base64," + PNG_B64.repeat(MAX_SIGNATURE_CHARS)), null, "size cap");
  assert.equal(pngBase64(null), null);
  assert.equal(signatureForTool(PNG_URL), PNG_URL);
  assert.ok(signatureForTool(PNG_URL).startsWith("data:image/png;base64,"), "the wire value keeps the data-URL prefix");
  assert.throws(() => signatureForTool("data:text/html;base64,AAAA"), /bad_signature/);
});
