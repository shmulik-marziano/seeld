// Feature flags: static map plus env override (VITE_FLAGS="portal.enabled=true,auth.totp=false").
// Everything defaults to off. No flag is read by any current page.

export const FLAG_DEFAULTS = {
  "portal.enabled": false,
  "portal.documents": false,
  "auth.totp": false,
  "auth.sms": false,
  "api.v1": false,
  "audit.enabled": false,
} as const;

export type FlagName = keyof typeof FLAG_DEFAULTS;

export function parseOverrides(raw: string | undefined | null): Partial<Record<FlagName, boolean>> {
  const out: Partial<Record<FlagName, boolean>> = {};
  if (!raw) return out;
  for (const part of raw.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (!k || !(k in FLAG_DEFAULTS)) continue;
    if (v === "true" || v === "1") out[k as FlagName] = true;
    else if (v === "false" || v === "0") out[k as FlagName] = false;
  }
  return out;
}

export function resolveFlags(rawOverrides?: string | null): Record<FlagName, boolean> {
  return { ...FLAG_DEFAULTS, ...parseOverrides(rawOverrides) };
}

export function isEnabled(flag: FlagName, rawOverrides?: string | null): boolean {
  return resolveFlags(rawOverrides)[flag];
}
