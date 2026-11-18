// Auth contracts. Interfaces only; implementations live beside this file.
// Nothing here is wired into the UI. The existing useAuth hook stays the source of truth until
// the owner approves a migration.

export type AuthMethod = "password" | "sms_otp" | "email_otp" | "magic_link" | "passkey";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number | null;
}

export type AuthResult<T = AuthSession> = { ok: true; value: T } | { ok: false; error: AuthFailure };

export interface AuthFailure {
  code: "invalid_credentials" | "mfa_required" | "otp_invalid" | "otp_expired" | "rate_limited" | "not_supported" | "network" | "unknown";
  message: string;
}

export interface PasswordCredentials {
  email: string;
  password: string;
}

/** One login mechanism. Providers are registered by method and chosen by the sign-in UI. */
export interface AuthProvider {
  readonly method: AuthMethod;
  /** False for placeholders (sms_otp) so UI can hide or disable them. */
  readonly available: boolean;
  signIn(input: unknown): Promise<AuthResult>;
  signOut(): Promise<void>;
}

export interface EmailPasswordProvider extends AuthProvider {
  readonly method: "password";
  signIn(input: PasswordCredentials): Promise<AuthResult>;
}

/**
 * FUTURE: SMS one-time code. Contract only. No SMS vendor is chosen and nothing is sent.
 * requestCode then verifyCode, both keyed by an E.164 phone number.
 */
export interface SmsOtpProvider extends AuthProvider {
  readonly method: "sms_otp";
  requestCode(phoneE164: string): Promise<AuthResult<{ expiresInSec: number }>>;
  verifyCode(phoneE164: string, code: string): Promise<AuthResult>;
}

// ---------- MFA (TOTP, Google Authenticator compatible) ----------

export interface TotpEnrollment {
  factorId: string;
  /** otpauth:// URI, render as QR code. Treat as secret. */
  uri: string;
  /** Base32 secret for manual entry. Treat as secret. */
  secret: string;
}

export interface MfaFactor {
  id: string;
  type: "totp" | "phone";
  status: "verified" | "unverified";
  friendlyName: string | null;
}

export type AssuranceLevel = "aal1" | "aal2";

export interface MfaService {
  enrollTotp(friendlyName?: string): Promise<AuthResult<TotpEnrollment>>;
  /** Verify the first code after enrol, which activates the factor. */
  confirmEnrollment(factorId: string, code: string): Promise<AuthResult<null>>;
  /** Step-up during sign-in: challenge and verify a code in one call. */
  challengeAndVerify(factorId: string, code: string): Promise<AuthResult<null>>;
  listFactors(): Promise<AuthResult<MfaFactor[]>>;
  unenroll(factorId: string): Promise<AuthResult<null>>;
  assuranceLevel(): Promise<AuthResult<{ current: AssuranceLevel | null; next: AssuranceLevel | null }>>;
}

// ---------- Agent security settings contract ----------

/**
 * Per-agent security policy. Persisted later (table not proposed yet: depends on owner decisions
 * about agency-level vs per-agent policy). Defaults are the intended baseline.
 */
export interface AgentSecuritySettings {
  /** Agents must hold a verified TOTP factor and sign in at aal2. */
  requireTotp: boolean;
  /** Days after which an aal2 session must be re-verified. */
  mfaReverifyDays: number;
  /** Idle timeout for the agent workspace, minutes. */
  idleTimeoutMinutes: number;
  /** Allowed login methods for this agent. */
  allowedMethods: AuthMethod[];
  /** Remembered devices may skip the TOTP prompt for this many days (0 = never). */
  trustedDeviceDays: number;
}

export const DEFAULT_AGENT_SECURITY: AgentSecuritySettings = {
  requireTotp: true,
  mfaReverifyDays: 30,
  idleTimeoutMinutes: 60,
  allowedMethods: ["password"],
  trustedDeviceDays: 0,
};

export function mergeAgentSecurity(partial?: Partial<AgentSecuritySettings> | null): AgentSecuritySettings {
  const m = { ...DEFAULT_AGENT_SECURITY, ...(partial ?? {}) };
  return {
    ...m,
    mfaReverifyDays: Math.max(0, Math.floor(m.mfaReverifyDays)),
    idleTimeoutMinutes: Math.max(1, Math.floor(m.idleTimeoutMinutes)),
    trustedDeviceDays: Math.max(0, Math.floor(m.trustedDeviceDays)),
  };
}

/** True when the session satisfies the agent policy. */
export function meetsAgentPolicy(settings: AgentSecuritySettings, level: AssuranceLevel | null): boolean {
  return !settings.requireTotp || level === "aal2";
}
