import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { isQuietRoute } from "@/lib/quietRoutes";
import { LiveDot } from "@/components/brand/Live";
import ChatLauncher from "@/components/ChatLauncher";
import ChatNudge from "@/components/ChatNudge";
import { LIVE_MARK } from "@/lib/flags/liveMark";
import { IS_V2 } from "@/integrations/supabase/config";
import "@/components/sd/chrome.css";

// v2 (seeld-site): the AI chat is not wired to the new chat-bot function yet, so the launcher opens a calm
// contact panel instead (no Supabase call). Legacy keeps the full chat.
const loadChat = IS_V2 ? () => import("@/components/ChatUnavailable") : () => import("@/components/AIChatBot");
const AIChatBot = lazy(loadChat);

/**
 * The chat panel (react-markdown pipeline, supabase-js for history, framer panel
 * animation) is only needed once someone talks to it. Until then this renders just
 * the launcher button — same classes / aria-label as the one inside AIChatBot, so
 * the cookie-banner lift and phone/desktop sizing in chrome.css apply unchanged.
 *
 * - Hover / focus / touch on the launcher warms the chunk (no wait on click).
 * - Click, or `seeld:open-chat` (homepage capability cards), mounts the chat opened.
 * - Once mounted, AIChatBot renders its own launcher when the panel is closed.
 */
const AIChatBotLoader = () => {
  const [mounted, setMounted] = useState(false);
  const openOnMount = useRef(false);
  const prefill = useRef("");
  const quiet = isQuietRoute(useLocation().pathname);

  useEffect(() => {
    const openEarly = (e: Event) => {
      const p = (e as CustomEvent<{ prefill?: string } | undefined>).detail?.prefill;
      if (typeof p === "string") prefill.current = p;
      openOnMount.current = true;
      setMounted(true);
    };
    window.addEventListener("seeld:open-chat", openEarly);
    return () => window.removeEventListener("seeld:open-chat", openEarly);
  }, []);

  if (mounted) {
    return (
      <Suspense fallback={null}>
        <AIChatBot defaultOpen={openOnMount.current} initialPrefill={prefill.current} />
      </Suspense>
    );
  }

  // Reading routes stay quiet: no launcher and no nudge until the page's own "ask" button opens the chat.
  if (quiet) return null;

  if (LIVE_MARK) {
    return (
      <>
        <ChatNudge />
        <ChatLauncher
          onClick={() => {
            openOnMount.current = true;
            setMounted(true);
          }}
          onPointerEnter={() => { void loadChat(); }}
          onFocus={() => { void loadChat(); }}
          onTouchStart={() => { void loadChat(); }}
        />
      </>
    );
  }

  return (
    <>
    <ChatNudge />
    <button
      type="button"
      onClick={() => {
        openOnMount.current = true;
        setMounted(true);
      }}
      onPointerEnter={() => { void loadChat(); }}
      onFocus={() => { void loadChat(); }}
      onTouchStart={() => { void loadChat(); }}
      className="sd-chrome-fab sd-chrome-fab-chat"
      data-prerender-skip
      aria-label="פתחו שיחה עם היועץ הדיגיטלי של SEELD"
    >
      <MessageCircle className="h-6 w-6 sm:hidden" strokeWidth={1.75} aria-hidden="true" />
      <span className="hidden sm:inline-flex"><LiveDot size={8} /></span>
      <span className="hidden sm:inline text-[14px] font-bold tracking-[0.02em]">שיחה עם היועץ הדיגיטלי</span>
    </button>
    </>
  );
};

export default AIChatBotLoader;
