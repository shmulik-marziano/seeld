import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatLauncher from "@/components/ChatLauncher";
import LogoMark from "@/components/brand/LogoMark";
import { LIVE_MARK } from "@/lib/flags/liveMark";
import { LiveDot } from "@/components/brand/Live";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { CONTACTS, DEPT_LABEL, type ContactDept } from "@/lib/contacts";
import { LINE, NAVY } from "@/lib/brand";
import "@/components/sd/chrome.css";

// v2 stand-in for the AI chat (VITE_SEELD_BACKEND=v2): same launcher, and a small panel with the two
// department contacts. It makes no network call. Replaced when the chat is wired to the chat-bot function.

const DEPTS: ContactDept[] = ["insurance", "general"];

// initialPrefill is accepted for parity with AIChatBot (the loader passes both); this panel has no text field.
const ChatUnavailable = ({ defaultOpen = false }: { defaultOpen?: boolean; initialPrefill?: string }) => {
  const [open, setOpen] = useState(defaultOpen);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("seeld:open-chat", onOpen);
    return () => window.removeEventListener("seeld:open-chat", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open && LIVE_MARK) return <ChatLauncher onClick={() => setOpen(true)} />;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sd-chrome-fab sd-chrome-fab-chat"
        data-prerender-skip
        aria-label="פתחו שיחה עם היועץ הדיגיטלי של SEELD"
      >
        <MessageCircle className="h-6 w-6 sm:hidden" strokeWidth={1.75} aria-hidden="true" />
        <span className="hidden sm:inline-flex"><LiveDot size={8} /></span>
        <span className="hidden sm:inline text-[14px] font-bold tracking-[0.02em]">שיחה עם היועץ הדיגיטלי</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="sd-chat-soon-title"
      dir="rtl"
      data-prerender-skip
      style={{
        position: "fixed", zIndex: 50, left: 16, bottom: 16, width: "min(360px, calc(100vw - 32px))",
        background: "#fff", borderRadius: 20, boxShadow: `0 0 0 1px ${LINE}, 0 24px 48px -20px rgba(32,57,87,.45)`,
        overflow: "hidden",
      }}
    >
      {LIVE_MARK ? (
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", padding: "12px 16px 0" }}>
          <span aria-hidden="true" />
          <div style={{ display: "flex", justifyContent: "center" }}><LogoMark state="idle" breathe size="44px" /></div>
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label="סגירה"
            style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, color: NAVY }}>
            <X size={20} aria-hidden="true" />
          </button>
          <h2 id="sd-chat-soon-title" style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 16, fontWeight: 700, margin: "6px 0 0", color: NAVY }}>היועץ הדיגיטלי יחזור בקרוב</h2>
        </div>
      ) : (
      <div style={{ background: NAVY, color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 id="sd-chat-soon-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>היועץ הדיגיטלי יחזור בקרוב</h2>
        <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label="סגירה"
          style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, color: "#fff" }}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      )}
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.6 }}>בינתיים אנחנו כאן בשבילכם, בטלפון, בוואטסאפ או במייל:</p>
        <div style={{ display: "grid", gap: 12 }}>
          {DEPTS.map((d) => (
            <section key={d} aria-label={DEPT_LABEL[d]} style={{ border: `1px solid ${LINE}`, borderRadius: 14, padding: "10px 12px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>
                {DEPT_LABEL[d]} <span dir="ltr" className="tabular-nums" style={{ fontWeight: 400 }}>{CONTACTS[d].phone}</span>
              </h3>
              <ContactIcons dept={d} tone="dark" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatUnavailable;
