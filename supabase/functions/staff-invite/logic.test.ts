// Pure-function tests for staff-invite/logic.ts. Synthetic data only.
import {
  bearerToken,
  buildEmail,
  checkClaims,
  chooseDelivery,
  lastTotpAt,
  mapDbError,
  normaliseEmail,
  readEnv,
  StaffError,
} from "./logic.ts";

function assertEquals(actual: unknown, expected: unknown, msg = "") {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} expected ${e}, got ${a}`);
}
function assertThrowsStatus(fn: () => unknown, status: number, message?: string) {
  try {
    fn();
  } catch (e) {
    if (!(e instanceof StaffError)) throw e;
    assertEquals(e.status, status);
    if (message) assertEquals(e.message, message);
    return;
  }
  throw new Error("expected a StaffError");
}

const SUB = "00000000-0000-4000-8000-0000000000a1";
const NOW = 1_800_000_000;

Deno.test("readEnv: missing or unknown SEELD_ENV is production; non-https redirect is ignored in production", () => {
  assertEquals(readEnv(() => undefined).appEnv, "production");
  assertEquals(readEnv((k) => (k === "SEELD_ENV" ? "staging" : undefined)).appEnv, "production");
  assertEquals(readEnv((k) => (k === "SEELD_ENV" ? "preview" : undefined)).appEnv, "preview");
  const e = readEnv((k) => (k === "STAFF_INVITE_REDIRECT_URL" ? "http://localhost:5173/app/auth/accept" : undefined));
  assertEquals(e.redirectTo, "https://seeld.co.il/app/auth/accept");
  const l = readEnv((k) =>
    ({ SEELD_ENV: "local", STAFF_INVITE_REDIRECT_URL: "http://localhost:5173/app/auth/accept" } as Record<string, string>)[k]
  );
  assertEquals(l.redirectTo, "http://localhost:5173/app/auth/accept");
  assertEquals(readEnv((k) => (k === "NOTIFY_FROM" ? "a@example.test" : undefined)).mailFrom, "a@example.test");
});

Deno.test("chooseDelivery", () => {
  assertEquals(chooseDelivery({ resendApiKey: "k", mailFrom: "f", appEnv: "production" }), "resend");
  assertEquals(chooseDelivery({ resendApiKey: "k", mailFrom: null, appEnv: "production" }), "smtp");
  assertEquals(chooseDelivery({ resendApiKey: null, mailFrom: null, appEnv: "production" }), "smtp");
  assertEquals(chooseDelivery({ resendApiKey: null, mailFrom: null, appEnv: "preview" }), "link");
  assertEquals(chooseDelivery({ resendApiKey: "k", mailFrom: "f", appEnv: "local" }), "resend");
});

Deno.test("checkClaims", () => {
  const ok = { sub: SUB, role: "authenticated", aal: "aal2", amr: [{ method: "totp", timestamp: NOW - 10 }] };
  assertEquals(checkClaims(ok, "admin", NOW), SUB);
  assertThrowsStatus(() => checkClaims(null, "admin", NOW), 401, "invalid_token");
  assertThrowsStatus(() => checkClaims({ ...ok, role: "anon" }, "admin", NOW), 401);
  assertThrowsStatus(() => checkClaims({ ...ok, role: "service_role" }, "admin", NOW), 401);
  assertThrowsStatus(() => checkClaims({ ...ok, is_anonymous: true }, "accept", NOW), 401);
  assertThrowsStatus(() => checkClaims({ ...ok, aal: "aal1" }, "accept", NOW), 403, "forbidden:aal2_required");
  assertThrowsStatus(
    () => checkClaims({ ...ok, amr: [{ method: "totp", timestamp: NOW - 3601 }] }, "admin", NOW),
    403,
    "forbidden:admin_fresh_totp",
  );
  assertThrowsStatus(
    () => checkClaims({ ...ok, amr: [{ method: "password", timestamp: NOW }] }, "admin", NOW),
    403,
    "forbidden:admin_fresh_totp",
  );
  assertThrowsStatus(() => checkClaims({ ...ok, amr: [{ method: "totp", timestamp: NOW + 3600 }] }, "admin", NOW), 403);
  assertEquals(checkClaims({ ...ok, amr: [{ method: "totp", timestamp: NOW - 99999 }] }, "accept", NOW), SUB);
});

Deno.test("lastTotpAt picks the newest totp entry and ignores junk", () => {
  assertEquals(lastTotpAt(null), null);
  assertEquals(
    lastTotpAt([{ method: "totp", timestamp: 5 }, { method: "totp", timestamp: 9 }, { method: "password", timestamp: 99 }, "x", null]),
    9,
  );
  assertEquals(lastTotpAt([{ method: "totp", timestamp: "abc" }]), null);
});

Deno.test("mapDbError", () => {
  assertEquals([
    mapDbError({ code: "PT409", message: "invitation_open" }).status,
    mapDbError({ code: "PT409", message: "invitation_open" }).message,
  ], [409, "invitation_open"]);
  assertEquals(mapDbError({ code: "PT423", message: "feature_disabled:portal_enabled" }).status, 423);
  assertEquals(mapDbError({ code: "PT403", message: "forbidden:admin_fresh_totp" }).code, "forbidden");
  assertEquals(mapDbError({ code: "42501", message: "permission denied for function x" }).status, 403);
  assertEquals(mapDbError({ code: "PGRST202", message: "Could not find the function" }).status, 503);
  const hidden = mapDbError({ code: "XX000", message: 'relation "core.staff" does not exist' });
  assertEquals([hidden.status, hidden.message], [500, "internal"]);
  assertEquals(mapDbError({ code: "PT404", message: "Some Long Text With Spaces" }).message, "database_error");
});

Deno.test("normaliseEmail and bearerToken", () => {
  assertEquals(normaliseEmail("  A.B@Example.TEST "), "a.b@example.test");
  assertThrowsStatus(() => normaliseEmail("a b@example.test"), 400);
  assertThrowsStatus(() => normaliseEmail("x".repeat(250) + "@e.test"), 400);
  assertThrowsStatus(() => normaliseEmail(42), 400);
  assertEquals(bearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  assertEquals(bearerToken("bearer   abc"), "abc");
  assertEquals(bearerToken("Basic abc"), null);
  assertEquals(bearerToken(null), null);
});

Deno.test("buildEmail is RTL Hebrew and escapes the link", () => {
  const m = buildEmail("invite", 'https://example.test/v?a=1&b="2"');
  if (!m.html.includes('dir="rtl"') || !m.html.includes("&amp;b=&quot;2&quot;")) throw new Error("html not escaped / not rtl");
  if (!m.text.includes('https://example.test/v?a=1&b="2"')) throw new Error("text link missing");
  if (!m.subject.includes("הזמנה")) throw new Error("subject");
  if (!buildEmail("recovery", "https://x.test").subject.includes("קישור")) throw new Error("recovery subject");
});
