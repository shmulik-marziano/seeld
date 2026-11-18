import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile, loaded lazily: the script is requested only when a form scrolls near the viewport,
// and only when VITE_TURNSTILE_SITE_KEY is set (the caller renders nothing otherwise). CSP already allows
// https://challenges.cloudflare.com for script-src / frame-src / connect-src (vercel.json).

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
  remove(id?: string): void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => { scriptPromise = null; reject(new Error("turnstile script failed")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Ask for a fresh token (tokens are single-use: call after every submit). */
  reset(): void;
}

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Called when the widget cannot load at all (blocked script, network). */
  onError?: () => void;
}

export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(function TurnstileWidget({ siteKey, onToken, onError }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef({ onToken, onError });
  cb.current = { onToken, onError };

  useImperativeHandle(ref, () => ({
    reset() {
      cb.current.onToken(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }), []);

  useEffect(() => {
    const el = box.current;
    if (!el || !siteKey) return;
    let cancelled = false;
    const mount = () => {
      loadTurnstile()
        .then((t) => {
          if (cancelled || widgetId.current) return;
          widgetId.current = t.render(el, {
            sitekey: siteKey,
            language: "he",
            appearance: "interaction-only",
            size: "flexible",
            callback: (token: string) => cb.current.onToken(token),
            "expired-callback": () => cb.current.onToken(null),
            "error-callback": () => { cb.current.onToken(null); },
          });
        })
        .catch(() => { if (!cancelled) cb.current.onError?.(); });
    };
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "function") {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io?.disconnect(); mount(); }
      }, { rootMargin: "300px" });
      io.observe(el);
    } else {
      mount();
    }
    return () => {
      cancelled = true;
      io?.disconnect();
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  return <div ref={box} className="sd-turnstile" data-prerender-skip="" />;
});
