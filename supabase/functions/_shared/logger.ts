// Structured JSON logger with PII redaction. One line per event, to stdout/stderr (Supabase log drain).
// Rules: log ids and codes, never personal values. Redaction is defence in depth, not permission.

// Surense field names (camelCase, case-insensitive): cellNumber, idNumber, email1/email2, partnerCellNumber,
// partnerEmail, partnerIdNumber, firstName, lastName, fullName, birthDate; plus client_secret, the svix-signature
// header and pre-signed links (url, href: they carry access tokens in the query string).
const PII_KEYS = /^(password|pass|secret|token|access_token|refresh_token|authorization|api_?key|x-api-key|cookie|id_?number|national_?id|teudat_?zehut|tz|phone|mobile|cell_?number|email\d*|full_?name|first_?name|last_?name|address|birth_?date|iban|account_?number|partner_?(?:cell_?number|email\d*|id_?number)|client_?secret|svix[-_]signature|url|href)$/i;

// Secret-shaped values: a Svix endpoint secret (whsec_...), a Supabase secret key, a Surense client id (cid_...).
// A string that STARTS with one of them is replaced whole; an embedded one is cut out of the surrounding text.
const SECRET_PREFIX = /^(?:whsec_|sb_secret_|cid_)/;
const SECRET_INLINE = /\b(?:whsec|sb_secret|cid)_[A-Za-z0-9+/=._~-]*/g;

// Israeli ID (9 digits), Israeli mobile/landline (05x-xxxxxxx, +972...), emails, bearer tokens, JWTs.
const VALUE_PATTERNS: Array<[RegExp, string]> = [
  [SECRET_INLINE, "[redacted-secret]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/g, "Bearer [redacted]"],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[redacted-jwt]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]"],
  [/(?:\+972|972|0)[-\s]?(?:5\d|[2-4689])[-\s]?\d{3}[-\s]?\d{4}\b/g, "[redacted-phone]"],
  [/(?<![\d-])\d{9}(?![\d-])/g, "[redacted-id]"],
];

export function redactString(s: string): string {
  if (SECRET_PREFIX.test(s)) return "[redacted-secret]";
  let out = s;
  for (const [re, rep] of VALUE_PATTERNS) out = out.replace(re, rep);
  return out;
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = PII_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export type LogLevel = "debug" | "info" | "warn" | "error";
const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  child(fields: Record<string, unknown>): Logger;
}

export function createLogger(
  base: Record<string, unknown> = {},
  opts: { level?: LogLevel; write?: (line: string, level: LogLevel) => void; now?: () => Date } = {},
): Logger {
  const min = ORDER[opts.level ?? "info"];
  const write =
    opts.write ??
    ((line: string, level: LogLevel) => (level === "error" || level === "warn" ? console.error(line) : console.log(line)));
  const now = opts.now ?? (() => new Date());
  const emit = (level: LogLevel, msg: string, fields?: Record<string, unknown>) => {
    if (ORDER[level] < min) return;
    write(JSON.stringify(redact({ ts: now().toISOString(), level, msg: redactString(msg), ...base, ...fields })), level);
  };
  return {
    debug: (m, f) => emit("debug", m, f),
    info: (m, f) => emit("info", m, f),
    warn: (m, f) => emit("warn", m, f),
    error: (m, f) => emit("error", m, f),
    child: (f) => createLogger({ ...base, ...f }, opts),
  };
}
