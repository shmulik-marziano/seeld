import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LogoMark from "@/components/brand/LogoMarkLazy";
import { CHAT_NUDGE } from "@/lib/flags/chatNudge";
import { LIVE_MARK } from "@/lib/flags/liveMark";
import { IS_V2 } from "@/integrations/supabase/config";
import { suggestionsFor } from "@/lib/chatSuggestions";
import "@/components/sd/chrome.css";

const SHOWN_KEY = "seeld_nudge_shown";
const DISMISSED_KEY = "seeld_nudge_dismissed_at";
const WAIT_MS = 35_000;
const SCROLL_RATIO = 0.6;
// Real scrolling is required before the ratio counts: a short page (or ScrollToTop's scrollTo(0,0)) must not fire it.
const MIN_SCROLL_Y = 200;
const MIN_SCROLLABLE = 400;
const QUIET_MS = 7 * 24 * 60 * 60 * 1000;
const EXCLUDED = ["/app", "/q/", "/report", "/contact", "/privacy", "/terms", "/accessibility", "/auth", "/admin"];

function readSession(k: string): string | null {
  try { return window.sessionStorage.getItem(k); } catch { return null; }
}
function readLocal(k: string): string | null {
  try { return window.localStorage.getItem(k); } catch { return null; }
}

/** True when a nudge may be shown right now (checked again at the moment it would appear). */
function allowed(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (EXCLUDED.some((p) => pathname.startsWith(p))) return false;
  if (typeof navigator !== "undefined" && navigator.webdriver) return false;
  if (readSession(SHOWN_KEY)) return false;
  const at = Number(readLocal(DISMISSED_KEY));
  if (Number.isFinite(at) && at > 0 && Date.now() - at < QUIET_MS) return false;
  return true;
}

/**
 * A small, quiet speech bubble above the chat launcher: one question for this page, "ask" (opens the chat with the
 * question prefilled, not sent) and a close. Mounted only while the chat is not (AIChatBotLoader). Client-only:
 * nothing renders until a timer or a scroll fires, so prerendered snapshots never contain it.
 */
const ChatNudge = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const question = suggestionsFor(pathname)[0].text;

  useEffect(() => {
    setVisible(false);
    if (!CHAT_NUDGE || IS_V2 || !allowed(pathname)) return;
    let done = false;
    const show = () => {
      if (done || !allowed(pathname)) return;
      done = true;
      try { window.sessionStorage.setItem(SHOWN_KEY, "1"); } catch { /* storage blocked */ }
      setVisible(true);
    };
    const timer = window.setTimeout(show, WAIT_MS);
    const onScroll = () => {
      const doc = document.documentElement;
      if (window.scrollY < MIN_SCROLL_Y || doc.scrollHeight - window.innerHeight < MIN_SCROLLABLE) return;
      if ((window.scrollY + window.innerHeight) / doc.scrollHeight > SCROLL_RATIO) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    const hide = () => setVisible(false);
    window.addEventListener("seeld:open-chat", hide);
    return () => window.removeEventListener("seeld:open-chat", hide);
  }, []);

  // v2: the chat is the contact panel (no text field), so there is nothing to invite a question to.
  if (!CHAT_NUDGE || IS_V2 || !visible) return null;

  const ask = () => {
    setVisible(false);
    window.dispatchEvent(new CustomEvent("seeld:open-chat", { detail: { prefill: question } }));
  };
  const dismiss = () => {
    try { window.localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* storage blocked */ }
    setVisible(false);
  };

  return (
    <div className={LIVE_MARK ? "sd-nudge sd-nudge--live" : "sd-nudge"} role="status" aria-live="polite" data-prerender-skip>
      <span className="sd-nudge-mark" aria-hidden="true"><LogoMark state="listening" size="28px" /></span>
      <p className="sd-nudge-q">{question}</p>
      <div className="sd-nudge-actions">
        <button type="button" className="sd-nudge-ask" onClick={ask}>שאלו</button>
        <button type="button" className="sd-nudge-x" onClick={dismiss} aria-label="סגירת ההצעה">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
};

export default ChatNudge;
