import { lazy, Suspense, useEffect, useRef, useState } from "react";

const AIChatBot = lazy(() => import("@/components/AIChatBot"));

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * The chat bot is mounted on every page, so react-markdown and the whole
 * micromark/mdast pipeline behind it rode along in the entry chunk — ~150kB of
 * parser that nobody needs until the panel is opened. Mount it once the browser
 * goes idle instead of before first paint.
 *
 * `seeld:open-chat` (dispatched by the homepage capability cards) can fire
 * before that point, and the panel's own listener does not exist yet — catch it
 * here and hand it over as the panel's initial open state.
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

    const w = window as IdleWindow;
    const idle = typeof w.requestIdleCallback === "function";
    const handle = idle
      ? w.requestIdleCallback!(() => setMounted(true), { timeout: 3000 })
      : window.setTimeout(() => setMounted(true), 1500);

    return () => {
      window.removeEventListener("seeld:open-chat", openEarly);
      if (idle) w.cancelIdleCallback?.(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  if (!mounted) return null;

  return (
    <Suspense fallback={null}>
      <AIChatBot defaultOpen={openOnMount.current} />
    </Suspense>
  );
};

export default AIChatBotLoader;
