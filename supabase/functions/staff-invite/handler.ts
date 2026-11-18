// staff-invite request handler. All I/O goes through the injected Ports, so the flow is tested with fakes
// (handler.test.ts) and wired to supabase-js + Resend in index.ts.
import { corsHeaders, parseAllowedOrigins, preflight } from "../_shared/cors.ts";
import type { Logger } from "../_shared/logger.ts";
import {
  BAN_FOREVER,
  BAN_NONE,
  bearerToken,
  buildEmail,
  checkClaims,
  chooseDelivery,
  type Claims,
  type Command,
  type DbError,
  type Delivery,
  type Env,
  type LinkMode,
  mapDbError,
  parseCommand,
  StaffError,
} from "./logic.ts";

export interface RpcResult<T = unknown> {
  data?: T | null;
  error?: DbError | null;
}

export interface Ports {
  /** Verify the caller's JWT (signature + expiry) and return its claims, or null. */
  getClaims(token: string): Promise<Claims | null>;
  /** RPC in schema 'staff' as the caller (their JWT). */
  staffRpc(token: string, fn: string, args: Record<string, unknown>): Promise<RpcResult>;
  /** Read staff.members as the caller (agency-scoped by RLS). */
  memberActive(token: string, userId: string): Promise<RpcResult<boolean | null>>;
  /** RPC in schema 'api' with the secret key (service_role). */
  serviceRpc(fn: string, args: Record<string, unknown>): Promise<RpcResult>;
  inviteUserByEmail(email: string, redirectTo: string): Promise<{ error?: string }>;
  sendRecoveryEmail(email: string, redirectTo: string): Promise<{ error?: string }>;
  generateLink(type: LinkMode, email: string, redirectTo: string): Promise<{ link?: string; error?: string }>;
  userConfirmed(userId: string): Promise<{ confirmed?: boolean; error?: string }>;
  setBan(userId: string, duration: string): Promise<{ error?: string }>;
  sendEmail(msg: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<{ error?: string }>;
}

export interface Deps {
  env: Env;
  ports: Ports;
  log: Logger;
  now?: () => Date;
  requestId?: () => string;
}

interface Ctx {
  requestId: string;
  cors: Record<string, string>;
}

function json(body: unknown, status: number, ctx: Ctx): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-request-id": ctx.requestId, "cache-control": "no-store", ...ctx.cors },
  });
}

function errorJson(e: StaffError, ctx: Ctx): Response {
  return json(
    { error: { code: e.code, message: e.message, requestId: ctx.requestId, ...(e.details ? { details: e.details } : {}) } },
    e.status,
    ctx,
  );
}

// GoTrue error codes for "this address already has an account" (invite / generateLink type invite).
const USER_EXISTS_CODES = new Set(["email_exists", "user_already_exists"]);

const unwrap = <T>(r: RpcResult<T>): T => {
  if (r.error) throw mapDbError(r.error);
  return r.data as T;
};

export function createHandler(deps: Deps): (req: Request) => Promise<Response> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.requestId ?? (() => crypto.randomUUID());
  const allowed = parseAllowedOrigins(deps.env.allowedOrigins);
  const { ports, env } = deps;

  return async (req: Request): Promise<Response> => {
    const pre = preflight(req, allowed);
    if (pre) return pre;
    const inbound = req.headers.get("x-request-id");
    const ctx: Ctx = {
      requestId: inbound && /^[A-Za-z0-9_-]{8,64}$/.test(inbound) ? inbound : newId(),
      cors: corsHeaders(req.headers.get("origin"), allowed),
    };
    const log = deps.log.child({ fn: "staff-invite", request_id: ctx.requestId });
    try {
      if (req.method !== "POST") throw new StaffError(405, "method_not_allowed", "method_not_allowed");
      const token = bearerToken(req.headers.get("authorization"));
      if (!token) throw new StaffError(401, "unauthenticated", "missing_credentials");
      if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
        throw new StaffError(415, "unsupported_media_type", "content_type_must_be_json");
      }
      const cmd = parseCommand(await req.text());
      if (!env.supabaseUrl || !env.publishableKey) throw new StaffError(503, "unavailable", "not_configured");

      const claims = await ports.getClaims(token);
      const callerId = checkClaims(claims, cmd.action === "accept" ? "accept" : "admin", Math.floor(now().getTime() / 1000));
      if (!env.secretKey) throw new StaffError(503, "unavailable", "not_configured");

      const result = await run(cmd, token, callerId, log);
      return json({ ok: true, ...result.body }, result.status, ctx);
    } catch (err) {
      const e = err instanceof StaffError ? err : new StaffError(500, "internal", "internal");
      if (e.status >= 500) {
        log.error("staff_invite_failed", { code: e.code, reason: e.message, err: err instanceof StaffError ? undefined : String(err) });
      } else log.info("staff_invite_rejected", { status: e.status, reason: e.message });
      return errorJson(e, ctx);
    }
  };

  async function assertAdmin(token: string, callerId: string): Promise<{ userId: string; agencyId: string }> {
    const d = unwrap(await ports.staffRpc(token, "admin_assert_fresh", {})) as { user_id?: string; agency_id?: string } | null;
    if (!d || typeof d.user_id !== "string" || d.user_id.toLowerCase() !== callerId) {
      throw new StaffError(403, "forbidden", "forbidden:admin_fresh_totp");
    }
    return { userId: callerId, agencyId: String(d.agency_id ?? "") };
  }

  /**
   * GoTrue refuses an invite for an address that already belongs to a confirmed user (email_exists). That is a state
   * conflict, not a delivery failure: a disabled staff member is restored with 'enable', never re-invited.
   */
  function sendFailure(err: string, reason: string): StaffError {
    if (USER_EXISTS_CODES.has(err)) return new StaffError(409, "conflict", "user_exists", { next: "enable_if_disabled_staff" });
    return new StaffError(502, "delivery_failed", reason, { next: "resend" });
  }

  /** Get the link to the invitee. Returns the delivery used and, only for 'link' + 'invite', the link itself. */
  async function deliver(
    mode: LinkMode,
    email: string,
    userId: string | null,
  ): Promise<{ delivery: Delivery; action_link?: string }> {
    const delivery = chooseDelivery(env);
    if (delivery === "smtp") {
      if (mode === "invite") {
        const r = await ports.inviteUserByEmail(email, env.redirectTo);
        if (r.error) throw sendFailure(r.error, "invite_send_failed");
        return { delivery };
      }
      // recovery: an invited user who never confirmed is simply re-invited; a confirmed one gets the recovery mail
      const c = userId ? await ports.userConfirmed(userId) : { confirmed: false };
      if (c.error) throw new StaffError(502, "delivery_failed", "user_lookup_failed", { next: "resend" });
      const r = c.confirmed ? await ports.sendRecoveryEmail(email, env.redirectTo) : await ports.inviteUserByEmail(email, env.redirectTo);
      if (r.error) throw sendFailure(r.error, "recovery_send_failed");
      return { delivery };
    }
    // A recovery link signs in as an EXISTING account. It is only ever sent to that account's mailbox, never handed to
    // the admin caller (that would be an account takeover on a non-production project). Refuse before generating it.
    if (delivery === "link" && mode === "recovery") {
      throw new StaffError(409, "conflict", "recovery_link_not_returned", { next: "configure_email_delivery" });
    }
    const g = await ports.generateLink(mode, email, env.redirectTo);
    if (g.error || !g.link) throw sendFailure(g.error ?? "", "link_generation_failed");
    if (delivery === "link") return { delivery, action_link: g.link };
    const msg = buildEmail(mode, g.link);
    // Server-side key only: never derived from the caller's x-request-id (a reused id would dedupe or 409 a later send).
    const s = await ports.sendEmail({ to: email, ...msg, idempotencyKey: `staff-invite/${mode}/${crypto.randomUUID()}` });
    if (s.error) throw new StaffError(502, "delivery_failed", "email_send_failed", { next: "resend" });
    return { delivery };
  }

  async function run(
    cmd: Command,
    token: string,
    callerId: string,
    log: Logger,
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    switch (cmd.action) {
      case "invite": {
        const admin = await assertAdmin(token, callerId);
        const invitationId = unwrap(
          await ports.serviceRpc("invitation_create", {
            p_email: cmd.email,
            p_kind: "staff",
            p_role: cmd.role,
            p_invited_by: admin.userId,
          }),
        ) as string;
        let d: { delivery: Delivery; action_link?: string };
        try {
          d = await deliver("invite", cmd.email, null);
        } catch (e) {
          if (e instanceof StaffError) throw new StaffError(e.status, e.code, e.message, { ...e.details, invitation_id: invitationId });
          throw e;
        }
        log.info("staff_invited", { invitation_id: invitationId, role: cmd.role, delivery: d.delivery });
        return { status: 201, body: { invitation_id: invitationId, ...d } };
      }
      case "resend": {
        const admin = await assertAdmin(token, callerId);
        const r = unwrap(await ports.serviceRpc("invitation_resend", { p_email: cmd.email, p_invited_by: admin.userId })) as {
          mode?: string;
          invitation_id?: string;
          user_id?: string | null;
        };
        const mode: LinkMode = r?.mode === "recovery" ? "recovery" : "invite";
        let d: { delivery: Delivery; action_link?: string };
        try {
          d = await deliver(mode, cmd.email, r?.user_id ?? null);
        } catch (e) {
          if (e instanceof StaffError) {
            throw new StaffError(e.status, e.code, e.message, { ...e.details, invitation_id: r?.invitation_id, mode });
          }
          throw e;
        }
        log.info("staff_invite_resent", { invitation_id: r?.invitation_id, mode, delivery: d.delivery });
        return { status: 200, body: { invitation_id: r?.invitation_id, mode, ...d } };
      }
      case "disable":
      case "enable": {
        await assertAdmin(token, callerId);
        const disable = cmd.action === "disable";
        if (disable && cmd.userId === callerId) throw new StaffError(409, "conflict", "cannot_disable_self");
        const rpc = await ports.staffRpc(token, disable ? "admin_staff_disable" : "admin_staff_enable", { p_user_id: cmd.userId });
        let already = false;
        if (rpc.error) {
          const e = mapDbError(rpc.error);
          if (e.status !== 404) throw e;
          // Idempotent retry: the row is already in the target state (e.g. a previous ban/unban call failed) -> redo the auth step.
          const m = await ports.memberActive(token, cmd.userId);
          if (m.error) throw mapDbError(m.error);
          if (m.data === null || m.data === undefined || m.data === disable) throw e;
          already = true;
        }
        const ban = await ports.setBan(cmd.userId, disable ? BAN_FOREVER : BAN_NONE);
        if (ban.error) {
          log.error("staff_ban_step_failed", { target: cmd.userId, action: cmd.action });
          throw new StaffError(502, disable ? "ban_failed" : "unban_failed", disable ? "ban_failed" : "unban_failed", {
            db_state: disable ? "disabled" : "enabled",
            next: `retry ${cmd.action}`,
          });
        }
        log.info(disable ? "staff_disabled" : "staff_enabled", { target: cmd.userId, already });
        return { status: 200, body: { user_id: cmd.userId, active: !disable, banned: disable, already } };
      }
      case "accept": {
        const r = unwrap(await ports.serviceRpc("staff_provision", { p_user_id: callerId, p_display_name: cmd.displayName })) as {
          role?: string;
          agency_id?: string;
        };
        log.info("staff_provisioned", { user_id: callerId, role: r?.role });
        return { status: 201, body: { role: r?.role, agency_id: r?.agency_id } };
      }
    }
  }
}
