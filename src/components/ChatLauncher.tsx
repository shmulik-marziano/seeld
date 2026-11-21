import { useState, type ButtonHTMLAttributes } from "react";
import LogoMark from "@/components/brand/LogoMark";
import "@/components/sd/chrome.css";

/**
 * Live-mark launcher (LIVE_MARK on): a white hairline pill. Phones show only the mark in a circle,
 * from the sm breakpoint the mark plus the label. Hover / focus moves the mark to "listening".
 * Keeps sd-chrome-fab sd-chrome-fab-chat for positioning and the cookie-bar lift.
 */
const ChatLauncher = ({ onClick, onPointerEnter, onPointerLeave, onFocus, onBlur, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      {...rest}
      onClick={onClick}
      onPointerEnter={(e) => { setActive(true); onPointerEnter?.(e); }}
      onPointerLeave={(e) => { setActive(false); onPointerLeave?.(e); }}
      onFocus={(e) => { setActive(true); onFocus?.(e); }}
      onBlur={(e) => { setActive(false); onBlur?.(e); }}
      className="sd-chrome-fab sd-chrome-fab-chat sd-chrome-fab-chat--live"
      data-prerender-skip
      aria-label="פתחו שיחה עם היועץ הדיגיטלי של SEELD"
    >
      <LogoMark state={active ? "listening" : "idle"} breathe size="30px" />
      <span className="hidden sm:inline text-[14px] font-bold">היועץ הדיגיטלי</span>
    </button>
  );
};

export default ChatLauncher;
