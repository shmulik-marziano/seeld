// staff-invite (verify_jwt=true): admin-only staff lifecycle + self-provisioning after an accepted invitation.
//   invite  : api.invitation_create, then the invite link (Resend / Auth SMTP / returned only outside production)
//   resend  : api.invitation_resend, then an invite or recovery link
//   disable : staff.admin_staff_disable (caller JWT), then ban_duration '876000h'
//   enable  : staff.admin_staff_enable (caller JWT), then ban_duration 'none'
//   accept  : api.staff_provision for the caller (aal2), role and agency come from the invitation row
// Secrets: SEELD_SECRET_KEY (sent as apikey), optional RESEND_API_KEY + STAFF_INVITE_FROM, SEELD_ENV, ALLOWED_ORIGINS.
// Contract and owner steps: docs/platform/IDENTITY.md.
import { createClient } from "npm:@supabase/supabase-js@2.99.0";
import { createLogger } from "../_shared/logger.ts";
import { createHandler, type Ports, type RpcResult } from "./handler.ts";
import { type Claims, type LinkMode, readEnv } from "./logic.ts";

const env = readEnv((k) => Deno.env.get(k));
const TIMEOUT_MS = 10_000;

const timedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(TIMEOUT_MS) });
const AUTH_OPTS = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

const userClient = (token: string) =>
  createClient(env.supabaseUrl, env.publishableKey, {
    auth: AUTH_OPTS,
    db: { schema: "staff" },
    global: { fetch: timedFetch, headers: { Authorization: `Bearer ${token}` } },
  });

const anon = env.supabaseUrl && env.publishableKey
  ? createClient(env.supabaseUrl, env.publishableKey, { auth: AUTH_OPTS, global: { fetch: timedFetch } })
  : null;
const service = env.supabaseUrl && env.secretKey
  ? createClient(env.supabaseUrl, env.secretKey, { auth: AUTH_OPTS, db: { schema: "api" }, global: { fetch: timedFetch } })
  : null;

const failed = (e: unknown) => ({ error: e instanceof Error ? e.name : "error" });
const dbFailed = (): RpcResult => ({ error: { code: "fetch_failed", message: "fetch_failed" } });
const svc = () => {
  if (!service) throw new Error("not_configured");
  return service;
};

const ports: Ports = {
  async getClaims(token) {
    if (!anon) return null;
    try {
      const { data, error } = await anon.auth.getClaims(token);
      return error || !data ? null : (data.claims as unknown as Claims);
    } catch {
      return null;
    }
  },
  async staffRpc(token, fn, args) {
    try {
      const { data, error } = await userClient(token).rpc(fn, args);
      return { data, error };
    } catch {
      return dbFailed();
    }
  },
  async memberActive(token, userId) {
    try {
      const { data, error } = await userClient(token).from("members").select("active").eq("user_id", userId).maybeSingle();
      return { data: data ? Boolean((data as { active: boolean }).active) : null, error };
    } catch {
      return dbFailed() as RpcResult<boolean | null>;
    }
  },
  async serviceRpc(fn, args) {
    try {
      const { data, error } = await svc().rpc(fn, args);
      return { data, error };
    } catch {
      return dbFailed();
    }
  },
  async inviteUserByEmail(email, redirectTo) {
    try {
      const { error } = await svc().auth.admin.inviteUserByEmail(email, { redirectTo });
      return error ? { error: error.code ?? error.name } : {};
    } catch (e) {
      return failed(e);
    }
  },
  async sendRecoveryEmail(email, redirectTo) {
    try {
      const { error } = await svc().auth.resetPasswordForEmail(email, { redirectTo });
      return error ? { error: error.code ?? error.name } : {};
    } catch (e) {
      return failed(e);
    }
  },
  async generateLink(type: LinkMode, email, redirectTo) {
    try {
      const { data, error } = await svc().auth.admin.generateLink({ type, email, options: { redirectTo } });
      if (error) return { error: error.code ?? error.name };
      return { link: data?.properties?.action_link };
    } catch (e) {
      return failed(e);
    }
  },
  async userConfirmed(userId) {
    try {
      const { data, error } = await svc().auth.admin.getUserById(userId);
      if (error) return { error: error.code ?? error.name };
      return { confirmed: Boolean(data?.user?.email_confirmed_at) };
    } catch (e) {
      return failed(e);
    }
  },
  async setBan(userId, duration) {
    try {
      const { error } = await svc().auth.admin.updateUserById(userId, { ban_duration: duration });
      return error ? { error: error.code ?? error.name } : {};
    } catch (e) {
      return failed(e);
    }
  },
  async sendEmail(msg) {
    try {
      const res = await timedFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          "content-type": "application/json",
          "Idempotency-Key": msg.idempotencyKey,
        },
        body: JSON.stringify({ from: env.mailFrom, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      });
      await res.body?.cancel();
      return res.ok ? {} : { error: `resend_${res.status}` };
    } catch (e) {
      return failed(e);
    }
  },
};

Deno.serve(createHandler({ env, ports, log: createLogger({ service: "staff-invite" }) }));
