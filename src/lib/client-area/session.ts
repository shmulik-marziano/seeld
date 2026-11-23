// The client session token in the browser: localStorage (30-day sign-in, per owner decision "אזור אישי מאובטח פר לקוח"),
// read and written inside try/catch (private windows, blocked storage). Only the opaque token lives here: no name, no
// id, no phone. Cleared on logout and on an unauthenticated answer.
const KEY = "seeld-my-session";

export interface SessionStore {
  read(): string | null;
  write(token: string, expiresAt: string): void;
  clear(): void;
}

export function createBrowserSessionStore(storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage): SessionStore {
  return {
    read() {
      try {
        const raw = storage?.getItem(KEY);
        if (!raw) return null;
        const j = JSON.parse(raw) as { t?: unknown; e?: unknown };
        if (typeof j.t !== "string" || typeof j.e !== "string") return null;
        if (Date.parse(j.e) <= Date.now()) { storage?.removeItem(KEY); return null; }
        return j.t;
      } catch {
        return null;
      }
    },
    write(token, expiresAt) {
      try { storage?.setItem(KEY, JSON.stringify({ t: token, e: expiresAt })); } catch { /* storage blocked: the sign-in lasts this tab's life */ }
    },
    clear() {
      try { storage?.removeItem(KEY); } catch { /* nothing to clear */ }
    },
  };
}

export function createMemorySessionStore(): SessionStore {
  let token: string | null = null;
  return { read: () => token, write: (t) => { token = t; }, clear: () => { token = null; } };
}
