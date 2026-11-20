// deno test supabase/functions/_shared/surense/auth_test.ts  (fake token responses only; no network)
import assert from "node:assert/strict";
import { checkScopes, createTokenSource, REQUIRED_SCOPES, type ScopeReport } from "./auth.ts";
import { json, mockFetch, silentLog } from "../test_helpers.ts";

const FAKE_TOKEN = "tok_fake_zzzzzzzzzzzzzzzz";
const tokenWith = (scope: unknown) =>
  json({ access_token: FAKE_TOKEN, token_type: "Bearer", expires_in: 3600, ...(scope === undefined ? {} : { scope }) });

async function fetchOnce(scope: unknown) {
  const lines: string[] = [];
  const reports: ScopeReport[] = [];
  const f = mockFetch(() => tokenWith(scope));
  const ts = createTokenSource({
    clientId: "cid_fake", clientSecret: "fake-secret", fetch: f.fetch, log: silentLog(lines), onScopes: (r) => reports.push(r),
  });
  const tok = await ts.get();
  return { tok, lines, reports, parsed: lines.map((l) => JSON.parse(l)) };
}

Deno.test("scopes: REQUIRED_SCOPES are exact spec names (no invented documents:* / data_proxies:* names)", () => {
  for (const s of REQUIRED_SCOPES) assert.match(s, /^[a-z_]+(?::[a-z_]+)+$/);
  for (const s of ["customers:read", "customers:create", "leads:create", "leads:read", "licensees:list", "swiftness:accounts:list", "swiftness:phishing:request"]) {
    assert.ok((REQUIRED_SCOPES as readonly string[]).includes(s), s);
  }
  assert.ok(!REQUIRED_SCOPES.some((s) => s.includes("delete")), "nothing that deletes is required");
});

Deno.test("scopes: checkScopes parses the space-delimited string", () => {
  const all = REQUIRED_SCOPES.join(" ");
  assert.deepEqual(checkScopes(all), { present: true, granted: [...REQUIRED_SCOPES], missing: [], deleteScopes: [] });
  const r = checkScopes("customers:read  leads:read customers:delete customers:delete_my_items leads:delete");
  assert.ok(r.missing.includes("customers:create"));
  assert.ok(!r.missing.includes("customers:read"));
  assert.deepEqual(r.deleteScopes, ["customers:delete", "customers:delete_my_items", "leads:delete"]);
  assert.deepEqual(checkScopes(undefined), { present: false, granted: [], missing: [], deleteScopes: [] });
  assert.deepEqual(checkScopes(["customers:read"]).present, false);
  assert.deepEqual(checkScopes("", ["x:y"]).missing, ["x:y"]);
});

Deno.test("scopes: a full, delete-free token logs nothing and is returned", async () => {
  const { tok, parsed, reports } = await fetchOnce(REQUIRED_SCOPES.join(" "));
  assert.equal(tok, FAKE_TOKEN);
  assert.equal(parsed.filter((j) => j.level === "warn").length, 0);
  assert.equal(reports.length, 1);
  assert.deepEqual(reports[0].missing, []);
});

Deno.test("scopes: missing and *:delete scopes warn (no throw); the token never reaches the log", async () => {
  const { tok, lines, parsed } = await fetchOnce("customers:read customers:delete leads:read");
  assert.equal(tok, FAKE_TOKEN, "a scope warning never blocks authentication");
  const missing = parsed.find((j) => j.msg === "surense token missing required scopes");
  assert.ok(missing);
  assert.equal(missing.level, "warn");
  assert.ok(missing.missing.includes("customers:create"));
  assert.ok(missing.missing.includes("swiftness:phishing:request"));
  const del = parsed.find((j) => String(j.msg).startsWith("surense token has delete scopes"));
  assert.deepEqual(del?.deleteScopes, ["customers:delete"]);
  const all = lines.join("\n");
  assert.ok(!all.includes(FAKE_TOKEN));
  assert.ok(!all.includes("fake-secret"));
});

Deno.test("scopes: a response without `scope` warns once and still authenticates", async () => {
  const { tok, parsed, reports } = await fetchOnce(undefined);
  assert.equal(tok, FAKE_TOKEN);
  assert.ok(parsed.some((j) => j.msg === "surense token without scope field"));
  assert.equal(reports[0].present, false);
});

Deno.test("scopes: a throwing onScopes callback does not break the token fetch", async () => {
  const f = mockFetch(() => tokenWith("customers:read"));
  const ts = createTokenSource({
    clientId: "cid_fake", clientSecret: "fake-secret", fetch: f.fetch, log: silentLog(),
    onScopes: () => {
      throw new Error("boom");
    },
  });
  assert.equal(await ts.get(), FAKE_TOKEN);
});
