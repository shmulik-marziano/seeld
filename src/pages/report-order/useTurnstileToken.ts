// Turnstile token for the first submitting screen (the start call). Reuses the site widget and the wait pattern of
// the lead form: the widget renders only when VITE_TURNSTILE_SITE_KEY is set; every start attempt waits briefly for a
// token and resets the widget afterwards (tokens are single-use). With no key the token is null and nothing renders.
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { TURNSTILE_SITE_KEY } from "@/integrations/supabase/config";
import type { TurnstileHandle } from "@/components/forms/TurnstileWidget";

const TOKEN_WAIT_MS = 8000;

export interface TurnstileProps {
  siteKey: string;
  handle: RefObject<TurnstileHandle>;
  onToken: (token: string | null) => void;
  onError: () => void;
}

export function useTurnstileToken(siteKey: string = TURNSTILE_SITE_KEY) {
  const token = useRef<string | null>(null);
  const waiters = useRef<Array<(t: string | null) => void>>([]);
  const handle = useRef<TurnstileHandle>(null);
  const [failed, setFailed] = useState(false);

  const onToken = useCallback((t: string | null) => {
    token.current = t;
    if (t) waiters.current.splice(0).forEach((w) => w(t));
  }, []);
  const onError = useCallback(() => setFailed(true), []);

  /** The current token, waiting up to a few seconds for the widget; null when there is no widget or it never answered. */
  const waitForToken = useCallback((): Promise<string | null> => {
    if (!siteKey || failed) return Promise.resolve(null);
    if (token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      const done = (t: string | null) => { clearTimeout(timer); resolve(t); };
      const timer = setTimeout(() => {
        waiters.current = waiters.current.filter((w) => w !== done);
        resolve(null);
      }, TOKEN_WAIT_MS);
      waiters.current.push(done);
    });
  }, [siteKey, failed]);

  /** Call after every start attempt, successful or not. */
  const reset = useCallback(() => { token.current = null; handle.current?.reset(); }, []);

  const widget = useMemo<TurnstileProps | undefined>(
    () => (siteKey && !failed ? { siteKey, handle, onToken, onError } : undefined),
    [siteKey, failed, onToken, onError],
  );
  return { widget, waitForToken, reset };
}
