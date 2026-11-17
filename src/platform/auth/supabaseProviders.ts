// Thin Supabase Auth implementations of the auth contracts. The SupabaseClient is injected so this
// module never imports the app's client (and public pages never pull in anything from here).
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type {
  AuthFailure,
  AuthResult,
  AuthSession,
  EmailPasswordProvider,
  GoogleProvider,
  MfaFactor,
  MfaService,
  PasswordCredentials,
  SmsOtpProvider,
  TotpEnrollment,
} from "./types";

export function toFailure(err: { message?: string; status?: number; code?: string } | null | undefined): AuthFailure {
  const message = err?.message ?? "Unknown auth error";
  const code = err?.code ?? "";
  if (err?.status === 429 || code === "over_request_rate_limit") return { code: "rate_limited", message };
  if (code === "invalid_credentials" || /invalid login/i.test(message)) return { code: "invalid_credentials", message };
  if (code === "otp_expired") return { code: "otp_expired", message };
  if (/code|otp|token/i.test(message) && /invalid|incorrect/i.test(message)) return { code: "otp_invalid", message };
  if (/fetch|network/i.test(message)) return { code: "network", message };
  return { code: "unknown", message };
}

export function toSession(s: Session): AuthSession {
  return {
    user: { id: s.user.id, email: s.user.email ?? null, phone: s.user.phone || null },
    accessToken: s.access_token,
    expiresAt: s.expires_at ?? null,
  };
}

export function createEmailPasswordProvider(client: SupabaseClient): EmailPasswordProvider {
  return {
    method: "password",
    available: true,
    async signIn({ email, password }: PasswordCredentials): Promise<AuthResult> {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.session) return { ok: false, error: toFailure(error) };
      return { ok: true, value: toSession(data.session) };
    },
    async signOut() {
      await client.auth.signOut();
    },
  };
}

export function createGoogleProvider(client: SupabaseClient): GoogleProvider {
  return {
    method: "google",
    available: true,
    async signIn({ redirectTo }): Promise<AuthResult<null>> {
      const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
      return error ? { ok: false, error: toFailure(error) } : { ok: true, value: null };
    },
    async signOut() {
      await client.auth.signOut();
    },
  };
}

/** Placeholder: SMS login is intentionally not built yet. Always reports not_supported. */
export function createSmsOtpPlaceholder(): SmsOtpProvider {
  const nope = async (): Promise<AuthResult<never>> => ({
    ok: false,
    error: { code: "not_supported", message: "SMS login is not enabled" },
  });
  return {
    method: "sms_otp",
    available: false,
    signIn: nope,
    requestCode: nope,
    verifyCode: nope,
    async signOut() {},
  };
}

/** TOTP MFA over supabase.auth.mfa. */
export function createMfaService(client: SupabaseClient): MfaService {
  const mfa = client.auth.mfa;
  return {
    async enrollTotp(friendlyName) {
      const { data, error } = await mfa.enroll({ factorType: "totp", friendlyName });
      if (error || !data) return { ok: false, error: toFailure(error) };
      const value: TotpEnrollment = { factorId: data.id, uri: data.totp.uri, secret: data.totp.secret };
      return { ok: true, value };
    },
    async confirmEnrollment(factorId, code) {
      const { error } = await mfa.challengeAndVerify({ factorId, code });
      return error ? { ok: false, error: toFailure(error) } : { ok: true, value: null };
    },
    async challengeAndVerify(factorId, code) {
      const { error } = await mfa.challengeAndVerify({ factorId, code });
      return error ? { ok: false, error: toFailure(error) } : { ok: true, value: null };
    },
    async listFactors() {
      const { data, error } = await mfa.listFactors();
      if (error || !data) return { ok: false, error: toFailure(error) };
      const value: MfaFactor[] = data.all.map((f) => ({
        id: f.id,
        type: f.factor_type as MfaFactor["type"],
        status: f.status as MfaFactor["status"],
        friendlyName: f.friendly_name ?? null,
      }));
      return { ok: true, value };
    },
    async unenroll(factorId) {
      const { error } = await mfa.unenroll({ factorId });
      return error ? { ok: false, error: toFailure(error) } : { ok: true, value: null };
    },
    async assuranceLevel() {
      const { data, error } = await mfa.getAuthenticatorAssuranceLevel();
      if (error || !data) return { ok: false, error: toFailure(error) };
      return { ok: true, value: { current: data.currentLevel, next: data.nextLevel } };
    },
  };
}
