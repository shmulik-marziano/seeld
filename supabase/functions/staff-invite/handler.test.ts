// deno-lint-ignore-file require-await -- the fake ports are async stubs that implement the Ports interface
// Run: deno test supabase/functions/staff-invite/
// (or, without a local Deno: docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 test staff-invite/)
// All data is synthetic (example.test addresses, fixed uuids).
import { createLogger } from "../_shared/logger.ts";
import { createHandler, type Ports, type RpcResult } from "./handler.ts";
import { type Claims, type Env, readEnv } from "./logic.ts";

function assertEquals(actual: unknown, expected: unknown, msg = "") {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} expected ${e}, got ${a}`);
}
function assert(cond: unknown, msg = "assertion failed") {
  if (!cond) throw new Error(msg);
}

const ADMIN = "00000000-0000-4000-8000-0000000000a1";
const TARGET = "00000000-0000-4000-8000-0000000000b2";
const AGENCY = "5eed0000-0000-4000-8000-000000000001";
const INV = "00000000-0000-4000-8000-0000000000c3";
const NOW = new Date("2026-11-19T10:00:00Z");
const NOW_S = Math.floor(NOW.getTime() / 1000);
const EMAIL = "new.agent@example.test";

const freshAdminClaims = (over: Partial<Claims> = {}): Claims => ({
  sub: ADMIN,
  role: "authenticated",
  aal: "aal2",
  amr: [{ method: "password", timestamp: NOW_S - 100 }, { method: "totp", timestamp: NOW_S - 60 }],
  ...over,
});

type Call = { port: string; args: unknown[] };

function fakePorts(over: Partial<Ports> = {}, claims: Claims | null = freshAdminClaims()) {
  const calls: Call[] = [];
  const rec = <T>(port: string, args: unknown[], v: T): T => {
    calls.push({ port, args });
    return v;
  };
  const base: Ports = {
    getClaims: async (t) => rec("getClaims", [t], claims),
    staffRpc: async (_t, fn, args) =>
      rec(
        "staffRpc:" + fn,
        [args],
        fn === "admin_assert_fresh" ? { data: { user_id: ADMIN, agency_id: AGENCY } } : { data: { ok: true } },
      ) as RpcResult,
    memberActive: async (_t, id) => rec("memberActive", [id], { data: null }),
    serviceRpc: async (fn, args) =>
      rec(
        "serviceRpc:" + fn,
        [args],
        fn === "invitation_create"
          ? { data: INV }
          : fn === "invitation_resend"
          ? { data: { mode: "invite", invitation_id: INV, user_id: null } }
          : { data: { ok: true, role: "agent", agency_id: AGENCY } },
      ) as RpcResult,
    inviteUserByEmail: async (e, r) => rec("inviteUserByEmail", [e, r], {}),
    sendRecoveryEmail: async (e, r) => rec("sendRecoveryEmail", [e, r], {}),
    generateLink: async (type, e, r) => rec("generateLink", [type, e, r], { link: "https://example.test/verify?token=synthetic" }),
    userConfirmed: async (id) => rec("userConfirmed", [id], { confirmed: true }),
    setBan: async (id, d) => rec("setBan", [id, d], {}),
    sendEmail: async (m) => rec("sendEmail", [m.to, m.subject], {}),
  };
  const ports: Ports = { ...base };
  for (const [k, fn] of Object.entries(over)) {
    // deno-lint-ignore no-explicit-any
    (ports as any)[k] = async (...a: unknown[]) => rec(k, a, await (fn as (...x: unknown[]) => Promise<unknown>)(...a));
  }
  return { ports, calls };
}

const baseEnv = (over: Partial<Env> = {}): Env => ({
  ...readEnv((k) =>
    ({ SUPABASE_URL: "https://x.supabase.test", SUPABASE_ANON_KEY: "anon-test", SEELD_SECRET_KEY: "secret-test" } as Record<
      string,
      string
    >)[k]
  ),
  ...over,
});

function setup(opts: { env?: Partial<Env>; ports?: Partial<Ports>; claims?: Claims | null } = {}) {
  const lines: string[] = [];
  const { ports, calls } = fakePorts(opts.ports, opts.claims === undefined ? freshAdminClaims() : opts.claims);
  const handler = createHandler({
    env: baseEnv(opts.env),
    ports,
    log: createLogger({}, { write: (l) => lines.push(l) }),
    now: () => NOW,
    requestId: () => "req-test-0001",
  });
  return { handler, calls, lines };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://fn.test/staff-invite", {
    method: "POST",
    headers: { authorization: "Bearer header.payload.sig", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

async function call(h: (r: Request) => Promise<Response>, req: Request) {
  const res = await h(req);
  const body = await res.json().catch(() => null);
  return { status: res.status, body, headers: res.headers };
}

const ports = (calls: Call[]) => calls.map((c) => c.port);

// ---------- auth gate ----------
Deno.test("401 without a bearer token, no port is called", async () => {
  const { handler, calls } = setup();
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }, { authorization: "" }));
  assertEquals(r.status, 401);
  assertEquals(r.body.error.message, "missing_credentials");
  assertEquals(calls.length, 0);
});

Deno.test("401 when the JWT does not verify", async () => {
  const { handler } = setup({ claims: null });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 401);
  assertEquals(r.body.error.message, "invalid_token");
});

Deno.test("401 for the anon key (no user session)", async () => {
  const { handler, calls } = setup({ claims: { role: "anon", iss: "supabase" } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 401);
  assertEquals(r.body.error.message, "not_a_user_session");
  assertEquals(ports(calls), ["getClaims"]);
});

Deno.test("403 for an aal1 session", async () => {
  const { handler, calls } = setup({ claims: freshAdminClaims({ aal: "aal1", amr: [{ method: "password", timestamp: NOW_S }] }) });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 403);
  assertEquals(r.body.error.message, "forbidden:aal2_required");
  assertEquals(ports(calls), ["getClaims"]);
});

Deno.test("403 stale amr: TOTP older than the ceiling is rejected before any DB call", async () => {
  const { handler, calls } = setup({ claims: freshAdminClaims({ amr: [{ method: "totp", timestamp: NOW_S - 7200 }] }) });
  const r = await call(handler, post({ action: "disable", user_id: TARGET }));
  assertEquals(r.status, 403);
  assertEquals(r.body.error.message, "forbidden:admin_fresh_totp");
  assertEquals(ports(calls), ["getClaims"]);
});

Deno.test("403 stale amr per the database window (PT403 from staff.admin_assert_fresh)", async () => {
  const { handler, calls } = setup({
    ports: { staffRpc: async () => ({ error: { code: "PT403", message: "forbidden:admin_fresh_totp" } }) },
  });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 403);
  assertEquals(r.body.error.message, "forbidden:admin_fresh_totp");
  assert(!ports(calls).some((p) => p.startsWith("serviceRpc") || p === "inviteUserByEmail"), "nothing after a failed admin check");
});

Deno.test("403 when the RPC answers for a different user than the JWT", async () => {
  const { handler } = setup({ ports: { staffRpc: async () => ({ data: { user_id: TARGET, agency_id: AGENCY } }) } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 403);
});

Deno.test("503 staff_api_unavailable when the staff schema is not exposed", async () => {
  const { handler } = setup({
    ports: { staffRpc: async () => ({ error: { code: "PGRST106", message: "The schema must be one of the following: api" } }) },
  });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 503);
  assertEquals(r.body.error.message, "staff_api_unavailable");
});

Deno.test("503 when SEELD_SECRET_KEY is missing (after the caller is authenticated)", async () => {
  const { handler } = setup({ env: { secretKey: null } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 503);
  assertEquals(r.body.error.message, "not_configured");
});

// ---------- request shape ----------
Deno.test("405 for GET, 415 for a non-JSON body, 204 preflight echoes only an allowed origin", async () => {
  const { handler } = setup();
  assertEquals((await call(handler, new Request("https://fn.test/x", { method: "GET" }))).status, 405);
  assertEquals((await call(handler, post("{}", { "content-type": "text/plain" }))).status, 415);
  const ok = await handler(new Request("https://fn.test/x", { method: "OPTIONS", headers: { origin: "https://seeld.co.il" } }));
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("access-control-allow-origin"), "https://seeld.co.il");
  const bad = await handler(new Request("https://fn.test/x", { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
  assertEquals(bad.headers.get("access-control-allow-origin"), null);
});

Deno.test("400 for bad bodies, before any port is called", async () => {
  const { handler, calls } = setup();
  const cases: Array<[unknown, string]> = [
    ["not json", "invalid_json"],
    [[1, 2], "invalid_body"],
    [{ action: "nuke" }, "invalid_input:action"],
    [{ action: "invite", email: "no-at-sign", role: "agent" }, "invalid_input:email"],
    [{ action: "invite", email: EMAIL, role: "owner" }, "invalid_input:role"],
    [{ action: "invite", email: EMAIL, role: "agent", agency_id: AGENCY }, "unknown_keys"],
    [{ action: "disable", user_id: "1; drop table" }, "invalid_input:user_id"],
    [{ action: "accept", display_name: "x" }, "invalid_input:display_name"],
  ];
  for (const [body, msg] of cases) {
    const r = await call(handler, post(body));
    assertEquals(r.status, 400, msg);
    assertEquals(r.body.error.message, msg);
  }
  assertEquals(calls.length, 0);
  assertEquals((await call(handler, post("x".repeat(5000)))).status, 413);
});

// ---------- invite ----------
Deno.test("invite ok (production, Auth SMTP): invitation_create with the caller as inviter, then inviteUserByEmail; no link returned", async () => {
  const { handler, calls, lines } = setup();
  const r = await call(handler, post({ action: "invite", email: "  New.Agent@Example.TEST ", role: "manager" }));
  assertEquals(r.status, 201);
  assertEquals(r.body, { ok: true, invitation_id: INV, delivery: "smtp" });
  assertEquals(ports(calls), ["getClaims", "staffRpc:admin_assert_fresh", "serviceRpc:invitation_create", "inviteUserByEmail"]);
  assertEquals(calls[2].args[0], { p_email: EMAIL, p_kind: "staff", p_role: "manager", p_invited_by: ADMIN });
  assertEquals(calls[3].args, [EMAIL, "https://seeld.co.il/app/auth/accept"]);
  assertEquals(r.headers.get("x-request-id"), "req-test-0001");
  assert(lines.every((l) => !l.includes("@")), "no email address in logs");
});

Deno.test("inviteUserByEmail failure gives 502 with the invitation id and never provisions core.staff", async () => {
  const { handler, calls } = setup({ ports: { inviteUserByEmail: async () => ({ error: "smtp_error" }) } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 502);
  assertEquals(r.body.error.code, "delivery_failed");
  assertEquals(r.body.error.details, { next: "resend", invitation_id: INV });
  assert(!ports(calls).includes("serviceRpc:staff_provision"), "no core.staff row is created by invite");
});

Deno.test("invite with Resend configured: generateLink + email, the link is never returned", async () => {
  const { handler, calls } = setup({ env: { resendApiKey: "re-test", mailFrom: "SEELD <noreply@example.test>" } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 201);
  assertEquals(r.body.delivery, "resend");
  assertEquals(r.body.action_link, undefined);
  assertEquals(ports(calls).slice(-2), ["generateLink", "sendEmail"]);
});

Deno.test("Resend send failure gives 502 delivery_failed", async () => {
  const { handler } = setup({
    env: { resendApiKey: "re-test", mailFrom: "x@example.test" },
    ports: { sendEmail: async () => ({ error: "resend_500" }) },
  });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 502);
});

Deno.test("non-production without Resend returns the link to the admin caller; production never does", async () => {
  const pre = setup({ env: { appEnv: "preview" } });
  const r = await call(pre.handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 201);
  assertEquals(r.body.delivery, "link");
  assertEquals(r.body.action_link, "https://example.test/verify?token=synthetic");
  const prod = setup({ env: { appEnv: "production" } });
  const p = await call(prod.handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(p.body.action_link, undefined);
});

Deno.test("second open invitation: PT409 invitation_open passes through as 409", async () => {
  const { handler, calls } = setup({ ports: { serviceRpc: async () => ({ error: { code: "PT409", message: "invitation_open" } }) } });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 409);
  assertEquals(r.body.error.message, "invitation_open");
  assert(!ports(calls).includes("inviteUserByEmail"));
});

Deno.test("unknown database errors are hidden", async () => {
  const { handler } = setup({
    ports: { serviceRpc: async () => ({ error: { code: "23505", message: 'duplicate key value violates unique constraint "x"' } }) },
  });
  const r = await call(handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 500);
  assertEquals(r.body.error.message, "internal");
});

// ---------- resend ----------
Deno.test("resend mode invite re-invites; mode recovery of an unconfirmed user re-invites; a confirmed one gets recovery mail", async () => {
  const a = setup();
  const r1 = await call(a.handler, post({ action: "resend", email: EMAIL }));
  assertEquals(r1.status, 200);
  assertEquals(r1.body.mode, "invite");
  assertEquals(ports(a.calls).slice(-1), ["inviteUserByEmail"]);

  const rec = { data: { mode: "recovery", invitation_id: INV, user_id: TARGET } };
  const b = setup({ ports: { serviceRpc: async () => rec, userConfirmed: async () => ({ confirmed: false }) } });
  await call(b.handler, post({ action: "resend", email: EMAIL }));
  assertEquals(ports(b.calls).slice(-2), ["userConfirmed", "inviteUserByEmail"]);

  const c = setup({ ports: { serviceRpc: async () => rec, userConfirmed: async () => ({ confirmed: true }) } });
  const r3 = await call(c.handler, post({ action: "resend", email: EMAIL }));
  assertEquals(r3.body.mode, "recovery");
  assertEquals(ports(c.calls).slice(-2), ["userConfirmed", "sendRecoveryEmail"]);

  const d = setup({ env: { resendApiKey: "re-test", mailFrom: "x@example.test" }, ports: { serviceRpc: async () => rec } });
  await call(d.handler, post({ action: "resend", email: EMAIL }));
  assertEquals(ports(d.calls).slice(-2), ["generateLink", "sendEmail"]);
  assertEquals(d.calls.at(-2)?.args[0], "recovery");
});

Deno.test("link delivery never returns a RECOVERY link to the admin caller: 409 before generateLink", async () => {
  const rec = { data: { mode: "recovery", invitation_id: INV, user_id: TARGET } };
  for (const appEnv of ["local", "preview"] as const) {
    const { handler, calls } = setup({ env: { appEnv }, ports: { serviceRpc: async () => rec } });
    const r = await call(handler, post({ action: "resend", email: EMAIL }));
    assertEquals(r.status, 409, appEnv);
    assertEquals(r.body.error.message, "recovery_link_not_returned");
    assertEquals(r.body.error.details, { next: "configure_email_delivery", invitation_id: INV, mode: "recovery" });
    assertEquals(r.body.error.action_link, undefined);
    assert(!JSON.stringify(r.body).includes("token="), "no link anywhere in the body");
    assert(!ports(calls).includes("generateLink"), "the recovery link is never even generated");
  }
  // an 'invite' mode resend in link delivery still returns the invite link (no account exists yet)
  const inv = setup({ env: { appEnv: "preview" } });
  const r2 = await call(inv.handler, post({ action: "resend", email: EMAIL }));
  assertEquals(r2.status, 200);
  assertEquals(r2.body.action_link, "https://example.test/verify?token=synthetic");
});

Deno.test("Resend Idempotency-Key is server-generated, never the caller's x-request-id, and unique per send", async () => {
  const keys: string[] = [];
  const { handler } = setup({
    env: { resendApiKey: "re-test", mailFrom: "x@example.test" },
    ports: {
      sendEmail: async (m: { idempotencyKey: string }) => {
        keys.push(m.idempotencyKey);
        return {};
      },
    },
  });
  const rid = "caller-chosen-id-123";
  for (let i = 0; i < 2; i++) {
    const r = await call(handler, post({ action: "resend", email: EMAIL }, { "x-request-id": rid }));
    assertEquals(r.status, 200);
    assertEquals(r.headers.get("x-request-id"), rid);
  }
  assertEquals(keys.length, 2);
  assert(keys.every((k) => !k.includes(rid)), "key not derived from the inbound header");
  assert(keys[0] !== keys[1], "a new key per send");
  assert(keys.every((k) => /^staff-invite\/invite\/[0-9a-f-]{36}$/.test(k)), "key shape");
});

Deno.test("invite of an address that already has an account: GoTrue email_exists maps to 409 user_exists (all deliveries)", async () => {
  const smtp = setup({ ports: { inviteUserByEmail: async () => ({ error: "email_exists" }) } });
  const r = await call(smtp.handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r.status, 409);
  assertEquals(r.body.error.message, "user_exists");
  assertEquals(r.body.error.details, { next: "enable_if_disabled_staff", invitation_id: INV });

  const viaLink = setup({
    env: { resendApiKey: "re-test", mailFrom: "x@example.test" },
    ports: { generateLink: async () => ({ error: "email_exists" }) },
  });
  const r2 = await call(viaLink.handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r2.status, 409);
  assertEquals(r2.body.error.message, "user_exists");
  assert(!ports(viaLink.calls).includes("sendEmail"));

  // any other provider error stays a 502 delivery failure with next=resend
  const other = setup({ ports: { inviteUserByEmail: async () => ({ error: "over_email_send_rate_limit" }) } });
  const r3 = await call(other.handler, post({ action: "invite", email: EMAIL, role: "agent" }));
  assertEquals(r3.status, 502);
  assertEquals(r3.body.error.details.next, "resend");
});

Deno.test("resend of an already active user: PT409 already_active", async () => {
  const { handler } = setup({ ports: { serviceRpc: async () => ({ error: { code: "PT409", message: "already_active" } }) } });
  const r = await call(handler, post({ action: "resend", email: EMAIL }));
  assertEquals(r.status, 409);
  assertEquals(r.body.error.message, "already_active");
});

// ---------- disable / enable ----------
Deno.test("disable: staff.admin_staff_disable first, then ban 876000h", async () => {
  const { handler, calls } = setup();
  const r = await call(handler, post({ action: "disable", user_id: TARGET }));
  assertEquals(r.status, 200);
  assertEquals(r.body, { ok: true, user_id: TARGET, active: false, banned: true, already: false });
  assertEquals(ports(calls), ["getClaims", "staffRpc:admin_assert_fresh", "staffRpc:admin_staff_disable", "setBan"]);
  assertEquals(calls[3].args, [TARGET, "876000h"]);
});

Deno.test("disable self: 409 before any write", async () => {
  const { handler, calls } = setup();
  const r = await call(handler, post({ action: "disable", user_id: ADMIN }));
  assertEquals(r.status, 409);
  assert(!ports(calls).includes("setBan") && !ports(calls).includes("staffRpc:admin_staff_disable"));
});

Deno.test("disable: ban failure gives 502 ban_failed (db already disabled); a retry is idempotent and bans", async () => {
  const a = setup({ ports: { setBan: async () => ({ error: "unexpected_failure" }) } });
  const r = await call(a.handler, post({ action: "disable", user_id: TARGET }));
  assertEquals(r.status, 502);
  assertEquals(r.body.error.code, "ban_failed");
  assertEquals(r.body.error.details.db_state, "disabled");

  const b = setup({
    ports: {
      staffRpc: async (_t: string, fn: string) =>
        fn === "admin_assert_fresh" ? { data: { user_id: ADMIN, agency_id: AGENCY } } : { error: { code: "PT404", message: "not_found" } },
      memberActive: async () => ({ data: false }),
    },
  });
  const r2 = await call(b.handler, post({ action: "disable", user_id: TARGET }));
  assertEquals(r2.status, 200);
  assertEquals(r2.body.already, true);
  assertEquals(ports(b.calls).slice(-2), ["memberActive", "setBan"]);
});

Deno.test("disable of a user outside the agency: 404 and no ban", async () => {
  const { handler, calls } = setup({
    ports: {
      staffRpc: async (_t: string, fn: string) =>
        fn === "admin_assert_fresh" ? { data: { user_id: ADMIN, agency_id: AGENCY } } : { error: { code: "PT404", message: "not_found" } },
      memberActive: async () => ({ data: null }),
    },
  });
  const r = await call(handler, post({ action: "disable", user_id: TARGET }));
  assertEquals(r.status, 404);
  assert(!ports(calls).includes("setBan"));
});

Deno.test("enable calls staff.admin_staff_enable BEFORE the unban (ban_duration none)", async () => {
  const { handler, calls } = setup();
  const r = await call(handler, post({ action: "enable", user_id: TARGET }));
  assertEquals(r.status, 200);
  const order = ports(calls);
  assert(order.indexOf("staffRpc:admin_staff_enable") < order.indexOf("setBan"), "RPC before unban");
  assertEquals(calls.at(-1)?.args, [TARGET, "none"]);
});

Deno.test("enable refused by the database: no unban", async () => {
  const { handler, calls } = setup({
    ports: {
      staffRpc: async (_t: string, fn: string) =>
        fn === "admin_assert_fresh"
          ? { data: { user_id: ADMIN, agency_id: AGENCY } }
          : { error: { code: "PT403", message: "forbidden:admin_fresh_totp" } },
    },
  });
  const r = await call(handler, post({ action: "enable", user_id: TARGET }));
  assertEquals(r.status, 403);
  assert(!ports(calls).includes("setBan"));
});

// ---------- accept ----------
Deno.test("accept needs aal2 but not a fresh TOTP, and provisions only the caller", async () => {
  const me = "00000000-0000-4000-8000-0000000000d4";
  const a = setup({ claims: { sub: me, role: "authenticated", aal: "aal1", amr: [{ method: "otp", timestamp: NOW_S }] } });
  assertEquals((await call(a.handler, post({ action: "accept", display_name: "סוכן בדיקה" }))).status, 403);

  const b = setup({ claims: { sub: me, role: "authenticated", aal: "aal2", amr: [{ method: "totp", timestamp: NOW_S - 86400 }] } });
  const r = await call(b.handler, post({ action: "accept", display_name: "  סוכן בדיקה " }));
  assertEquals(r.status, 201);
  assertEquals(r.body, { ok: true, role: "agent", agency_id: AGENCY });
  assertEquals(ports(b.calls), ["getClaims", "serviceRpc:staff_provision"]);
  assertEquals(b.calls[1].args[0], { p_user_id: me, p_display_name: "סוכן בדיקה" });
});

Deno.test("accept without an open invitation: PT409 invitation_missing", async () => {
  const { handler } = setup({
    claims: freshAdminClaims(),
    ports: { serviceRpc: async () => ({ error: { code: "PT409", message: "invitation_missing" } }) },
  });
  const r = await call(handler, post({ action: "accept", display_name: "Test Agent" }));
  assertEquals(r.status, 409);
  assertEquals(r.body.error.message, "invitation_missing");
});
