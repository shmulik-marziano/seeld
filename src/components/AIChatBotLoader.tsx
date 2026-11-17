import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { LiveDot } from "@/components/brand/Live";
import "@/components/sd/chrome.css";

const loadChat = () => import("@/components/AIChatBot");
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

  useEffect(() => {
    const openEarly = () => {
      openOnMount.current = true;
      setMounted(true);
    };
    window.addEventListener("seeld:open-chat", openEarly);
    return () => window.removeEventListener("seeld:open-chat", openEarly);
  }, []);

  if (mounted) {
    return (
      <Suspense fallback={null}>
        <AIChatBot defaultOpen={openOnMount.current} />
      </Suspense>
    );
  }

  return (
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
  );
};

export default AIChatBotLoader;
