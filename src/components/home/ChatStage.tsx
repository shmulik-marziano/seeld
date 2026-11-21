import { SdBand } from "@/components/sd/primitives";
import LogoMark from "@/components/brand/LogoMarkLazy";
import { CHAT_NUDGE } from "@/lib/flags/chatNudge";
import { IS_V2 } from "@/integrations/supabase/config";
import { pageSuggestions } from "@/lib/chatSuggestions";

// Home page stage for the chat, right after the hero. Pure markup (prerender-safe): the only behaviour is
// onClick handlers that fire the `seeld:open-chat` event the chat loader already listens to.

const open = (prefill?: string) =>
  window.dispatchEvent(new CustomEvent("seeld:open-chat", { detail: prefill ? { prefill } : {} }));

const ChatStage = () => {
  // v2 has no text chat yet (the launcher opens the contact panel), so the stage would be a dead end there.
  if (!CHAT_NUDGE || IS_V2) return null;
  const chips = pageSuggestions["/"].slice(0, 3);
  return (
    <SdBand tone="cream" id="ask">
      <div className="sd-wrap sd-stage">
        <LogoMark state="idle" breathe size="96px" />
        <h2 className="sd-h2">שאלו את היועץ הדיגיטלי</h2>
        <p className="sd-lead">שאלה על ביטוח, פנסיה או חיסכון? כתבו אותה וקבלו הסבר כללי, ואם צריך נחבר אתכם לצוות.</p>
        <button type="button" className="sd-stage-input" onClick={() => open()}>
          כתבו כאן את השאלה
        </button>
        <ul className="sd-stage-chips" aria-label="דוגמאות לשאלות">
          {chips.map((c) => (
            <li key={c.text}>
              <button type="button" className="sd-chip" onClick={() => open(c.text)}>{c.text}</button>
            </li>
          ))}
        </ul>
      </div>
    </SdBand>
  );
};

export default ChatStage;
