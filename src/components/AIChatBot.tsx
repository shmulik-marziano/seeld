import { CONTACTS, contactFor, waHref } from "@/lib/contacts";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, X, Phone, RotateCcw, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LINE, MONO, MUTED, NAVY, RING } from "@/lib/brand";
import { LiveDot, LiveTag } from "@/components/brand/Live";
import ChatLauncher from "@/components/ChatLauncher";
import LogoMark, { type LogoMarkState } from "@/components/brand/LogoMark";
import { LIVE_MARK } from "@/lib/flags/liveMark";
import { CHAT_NUDGE } from "@/lib/flags/chatNudge";
import { suggestionsFor } from "@/lib/chatSuggestions";
import ChatLeadCard, { ChatLeadThanks, type LeadDraft } from "@/components/ChatLeadCard";
import "@/components/sd/chrome.css";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${SUPABASE_URL}/functions/v1/finance-chat`;
// DNA v3 panel: white surface, hairline border, navy header band (STYLESEED.md)
const PANEL_BG = "#ffffff";
const HAIRLINE = `0 0 0 1px ${LINE}`;

const getSessionId = () => {
  let sessionId = localStorage.getItem("seeld_chat_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("seeld_chat_session", sessionId);
  }
  return sessionId;
};

/** Visitor / assistant text that signals a wish to talk to a person or to get a quote. */
const LEAD_INTENT = /פגישה|להתקשר|טלפון|נציג|לחזור אלי|שיחה עם|הצעת מחיר|כמה זה עולה/;

const AIChatBot = ({ defaultOpen = false, initialPrefill = "" }: { defaultOpen?: boolean; initialPrefill?: string }) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrefill);
  const inputValueRef = useRef(input);
  inputValueRef.current = input;
  const [leadState, setLeadState] = useState<"hidden" | "open" | "done">("hidden");
  const leadShown = useRef(false);
  const leadDraft = useRef<LeadDraft>({ name: "", phone: "", consent: false });
  const touched = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const reduced = useReducedMotion();

  const suggestions = suggestionsFor(location.pathname);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
  }, [messages, reduced]);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  // Allow other parts of the site (e.g. homepage capability cards) to open the chat
  useEffect(() => {
    const open = (e: Event) => {
      setIsExpanded(true);
      const prefill = (e as CustomEvent<{ prefill?: string } | undefined>).detail?.prefill;
      if (typeof prefill === "string" && prefill && !inputValueRef.current.trim()) setInput(prefill);
      inputRef.current?.focus();
    };
    window.addEventListener("seeld:open-chat", open);
    return () => window.removeEventListener("seeld:open-chat", open);
  }, []);

  // Escape closes the panel
  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded]);

  // Lead card: once per conversation, on intent in the latest exchange or after the third visitor message
  useEffect(() => {
    if (!CHAT_NUDGE || leadShown.current || !touched.current || isLoading) return;
    const users = messages.filter((m) => m.role === "user");
    const last = messages[messages.length - 1];
    const intent =
      (users.length > 0 && LEAD_INTENT.test(users[users.length - 1].content)) ||
      (last?.role === "assistant" && last.content !== "" && LEAD_INTENT.test(last.content));
    if (intent || users.length >= 3) {
      leadShown.current = true;
      setLeadState("open");
    }
  }, [messages, isLoading]);

  const openLead = () => {
    leadShown.current = true;
    setLeadState("open");
  };

  // Load previous conversation (best effort — the chat works without it)
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const sessionId = getSessionId();
        const { data: conversations } = await supabase
          .rpc("get_conversation_by_session", { p_session_id: sessionId });
        if (conversations && conversations.length > 0) {
          const convId = conversations[0].id;
          setConversationId(convId);
          const { data: savedMessages } = await supabase
            .rpc("get_chat_messages", { p_conversation_id: convId, p_session_id: sessionId });
          if (savedMessages && savedMessages.length > 0) {
            setMessages(savedMessages as Message[]);
          }
        }
      } catch { /* silently fail on load */ }
    };
    loadConversation();
  }, []);

  const saveMessage = async (message: Message, convId: string | null) => {
    if (!convId) return;
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
      });
    } catch { /* non-blocking */ }
  };

  // Best effort: persistence must never block the conversation itself
  const getOrCreateConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ session_id: sessionId })
        .select("id")
        .single();
      if (error || !data) return null;
      setConversationId(data.id);
      return data.id;
    } catch {
      return null;
    }
  };

  const streamChat = useCallback(async (userMessage: string) => {
    touched.current = true;
    const userMsg: Message = { role: "user", content: userMessage };
    const outgoing = [...messages, userMsg];
    setMessages([...outgoing, { role: "assistant", content: "" }]);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";

    // Persistence in parallel — never blocks the answer
    const convPromise = getOrCreateConversation().then((convId) => {
      saveMessage(userMsg, convId);
      return convId;
    });

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: outgoing.slice(-12).map(({ role, content }) => ({ role, content })),
          page: location.pathname,
        }),
      });

      if (!response.ok) throw new Error(`משהו השתבש אצלנו. נסו לשלוח שוב, או חייגו ${CONTACTS.general.phone}.`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content || parsed.content || "";
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (!assistantContent) {
        throw new Error(`לא התקבלה תשובה. נסו שוב, או חייגו ${CONTACTS.general.phone}.`);
      }

      const convId = await convPromise;
      await saveMessage({ role: "assistant", content: assistantContent }, convId);
    } catch (error) {
      // Network-level failures surface English browser strings; keep the visitor in Hebrew
      const raw = error instanceof Error ? error.message : "";
      const friendly = /[֐-׿]/.test(raw)
        ? raw
        : `ההודעה לא נשלחה. בדקו את החיבור ונסו שוב, או חייגו ${CONTACTS.general.phone}.`;
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        { role: "assistant", content: friendly },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setLeadState("hidden");
    leadShown.current = false;
    leadDraft.current = { name: "", phone: "", consent: false };
    touched.current = false;
    localStorage.removeItem("seeld_chat_session");
    inputRef.current?.focus();
  };

  // The card remounts when the panel flips between welcome and messages, so "sent" and the typed draft live here.
  const leadNode = !CHAT_NUDGE || leadState === "hidden" ? null : leadState === "done" ? (
    <ChatLeadThanks />
  ) : (
    <ChatLeadCard pathname={location.pathname} draft={leadDraft.current} onDismiss={() => setLeadState("hidden")} onSent={() => setLeadState("done")} />
  );
  const leadLink = CHAT_NUDGE && leadState === "hidden" ? (
    <button
      type="button"
      onClick={openLead}
      className="mx-auto block min-h-[44px] px-3 text-[13.5px] font-medium text-[#55677C] underline underline-offset-4 transition-colors duration-150 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
    >
      להשאיר פרטים לחזרה
    </button>
  ) : null;

  if (LIVE_MARK) {
    const lastMsg = messages[messages.length - 1];
    const waiting = isLoading && lastMsg?.role === "assistant" && lastMsg.content === "";
    const streaming = isLoading && !waiting && lastMsg?.role === "assistant";
    const markState: LogoMarkState = waiting
      ? "thinking"
      : streaming
        ? "speaking"
        : inputFocused || input.length > 0
          ? "listening"
          : "idle";
    const statusLabel = { idle: "זמין", listening: "מקשיב", thinking: "חושב", speaking: "עונה" }[markState];

    return (
      <>
        {!isExpanded && <ChatLauncher onClick={() => setIsExpanded(true)} />}

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
              className="fixed z-[60] flex flex-col inset-x-2 top-16 sm:inset-auto sm:bottom-4 sm:left-6 sm:h-[min(700px,calc(100dvh-3rem))] sm:w-[440px] lg:w-[500px]"
              style={{ bottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
              role="dialog"
              aria-label="שיחה עם היועץ הדיגיטלי של SEELD"
            >
              <div
                className="flex h-full flex-col overflow-hidden"
                style={{ backgroundColor: PANEL_BG, borderRadius: 16, border: `1px solid ${LINE}`, boxShadow: "0 24px 60px -18px rgba(32, 57, 87,.35)" }}
              >
                {/* Header: three symmetric columns, no band */}
                <div className="grid shrink-0 grid-cols-[44px_1fr_44px] items-center px-4 pb-1 pt-3">
                  {messages.length > 0 ? (
                    <button
                      onClick={clearConversation}
                      aria-label="שיחה חדשה"
                      title="שיחה חדשה"
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[#55677C] transition-colors duration-150 hover:bg-[#203957]/5 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#203957]"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    {/* One live mark per view: the welcome hero carries the animation before the first message, and the
                        avatar beside the reply carries it while the assistant thinks or answers. The header only listens. */}
                    <LogoMark
                      state={messages.length === 0 || markState === "thinking" || markState === "speaking" ? "idle" : markState}
                      breathe={messages.length > 0}
                      size="44px"
                    />
                    <span className="sr-only" role="status" aria-live="polite">{markState === "thinking" || markState === "speaking" ? statusLabel : ""}</span>
                    <span
                      data-chat-status={markState}
                      aria-hidden="true"
                      className="text-[10.5px] tracking-[0.14em]"
                      style={{ fontFamily: MONO, color: MUTED }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    aria-label="סגירת הצ'אט"
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[#55677C] transition-colors duration-150 hover:bg-[#203957]/5 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#203957]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col justify-between gap-6 py-2">
                      <div className="space-y-5 text-center">
                        <div className="flex flex-col items-center">
                          <LogoMark state={markState} breathe size="72px" />
                          <h4
                            className="mt-3 text-[22px] leading-snug text-[#203957]"
                            style={{ fontFamily: "'Rubik', Arial, sans-serif", fontWeight: 700 }}
                          >
                            שלום, כאן היועץ הדיגיטלי.
                          </h4>
                          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#2D435D]">
                            ביטוח, פנסיה, חיסכון או מס: שאלו כל דבר. עונה מיד, ומחבר אתכם ליועץ אנושי כשצריך.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => streamChat(s.text)}
                              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center text-[14px] font-medium text-[#203957] transition-colors duration-150 hover:bg-[#EEF2EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                              style={{ boxShadow: RING }}
                            >
                              <s.icon className="h-4 w-4 shrink-0 text-[#55677C]" strokeWidth={1.75} />
                              {s.text}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                      {leadNode}
                      {leadLink}
                      <a
                        href={waHref(CONTACTS[contactFor(location.pathname)])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 text-[14px] font-medium text-[#55677C] underline-offset-4 transition-colors duration-150 hover:text-[#203957] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                      >
                        <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                        מעדיפים בן אדם? שיחה בוואטסאפ
                      </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) =>
                        msg.role === "user" ? (
                          <div key={i} className="flex justify-start">
                            <div className="max-w-[88%] rounded-[14px] bg-[#203957] px-4 py-3 text-[14.5px] leading-relaxed text-white">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div
                            key={i}
                            className="flex items-start gap-3"
                            data-chat-reply={i === messages.length - 1 && isLoading ? markState : "idle"}
                          >
                            {/* The avatar beside the reply is the live mark: the dots orbit while thinking, sway while answering. */}
                            <span className="-mt-1 shrink-0" aria-hidden="true">
                              <LogoMark
                                state={i === messages.length - 1 && isLoading ? markState : "idle"}
                                instant={i === messages.length - 1 && isLoading}
                                size="40px"
                              />
                            </span>
                            <div className="min-w-0 flex-1 pt-2 text-[14.5px] leading-relaxed text-[#203957]">
                              {msg.content === "" && isLoading && i === messages.length - 1 && (
                                <span className="inline-block text-[11px] tracking-[0.14em] text-[#55677C]" style={{ fontFamily: MONO }}>
                                  חושב
                                </span>
                              )}
                              {msg.content !== "" && (
                                <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-[14.5px] [&_p]:text-[14.5px] [&_a]:text-[#203957] [&_a]:underline">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                      {!isLoading && messages.length < 6 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {suggestions.slice(0, 2).map((s, i) => (
                            <button
                              key={i}
                              onClick={() => streamChat(s.text)}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[14px] font-medium text-[#55677C] transition-colors duration-150 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                              style={{ boxShadow: HAIRLINE }}
                            >
                              <s.icon className="h-3 w-3" strokeWidth={1.75} />
                              {s.text}
                            </button>
                          ))}
                        </div>
                      )}
                      {leadNode}
                    <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#D9DEE4] px-4 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="כתבו שאלה, Enter לשליחה"
                      aria-label="הודעה ליועץ הדיגיטלי"
                      className="min-h-[48px] max-h-[120px] min-w-0 flex-1 resize-none rounded-[24px] bg-white px-5 py-3 text-right text-[14.5px] leading-snug text-[#203957] transition-shadow duration-150 placeholder:text-[#55677C] focus:outline-none shadow-[0_0_0_1px_#D9DEE4] focus:shadow-[0_0_0_1px_#203957]"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      aria-label="שליחת הודעה"
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                        input.trim() ? "bg-[#203957] text-white hover:bg-[#162B45]" : "bg-[#203957]/10 text-[#55677C]",
                      )}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[10.5px] tracking-[0.14em] text-[#55677C]" style={{ fontFamily: MONO }} dir="ltr">
                    מידע כללי בלבד. לא ייעוץ אישי.
                  </p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {/* ── Launcher: a live pill, not a shy dot — institutional navy ── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setIsExpanded(true)}
            className="sd-chrome-fab sd-chrome-fab-chat"
            data-prerender-skip
            aria-label="פתחו שיחה עם היועץ הדיגיטלי של SEELD"
          >
            <MessageCircle className="h-6 w-6 sm:hidden" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline-flex"><LiveDot size={8} /></span>
            <span className="hidden sm:inline text-[14px] font-bold tracking-[0.02em]">שיחה עם היועץ הדיגיטלי</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel: white DNA card with a navy header band ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[60] flex flex-col inset-x-2 top-16 sm:inset-auto sm:bottom-4 sm:left-6 sm:h-[min(700px,calc(100dvh-3rem))] sm:w-[440px] lg:w-[500px]"
            style={{ bottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
            role="dialog"
            aria-label="שיחה עם היועץ הדיגיטלי של SEELD"
          >
            <div
              className="flex h-full flex-col overflow-hidden"
              style={{
                backgroundColor: PANEL_BG,
                borderRadius: 12,
                border: `1px solid ${LINE}`,
                boxShadow: "0 24px 60px -18px rgba(32, 57, 87,.35)",
              }}
            >
              {/* Header — navy band */}
              <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ backgroundColor: NAVY }}>
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-bold tracking-tight text-white" dir="ltr">
                    SEELD<span className="text-[#AD833E]">.</span>
                  </span>
                  <span className="h-4 w-px bg-white/15" aria-hidden="true" />
                  <LiveTag dark dot>היועץ הדיגיטלי</LiveTag>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      onClick={clearConversation}
                      aria-label="שיחה חדשה"
                      title="שיחה חדשה"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    aria-label="סגירת הצ'אט"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-5">
                {messages.length === 0 ? (
                  /* Welcome state */
                  <div className="flex h-full flex-col justify-between gap-6 px-1 py-2">
                    <div className="space-y-5">
                      <div>
                        <h4
                          className="text-[22px] leading-snug text-[#203957]"
                          style={{ fontFamily: "'Rubik', Arial, sans-serif", fontWeight: 700 }}
                        >
                          שלום, כאן היועץ הדיגיטלי של SEELD.
                        </h4>
                        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#2D435D]">
                          ביטוח, פנסיה, חיסכון או מס: שאלו כל דבר. עונה מיד, ומחבר אתכם ליועץ אנושי כשצריך.
                        </p>
                      </div>
                      {/* Suggestion tiles — white with the faint navy ring */}
                      <div className="grid gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => streamChat(s.text)}
                            className="flex min-h-[48px] items-center gap-3 rounded-lg bg-white px-4 py-3 text-right text-[14px] font-medium text-[#203957] transition-colors duration-150 hover:bg-[#EEF2EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                            style={{ boxShadow: RING }}
                          >
                            <s.icon className="h-4 w-4 shrink-0 text-[#55677C]" strokeWidth={1.75} />
                            {s.text}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Human handoff */}
                    <div className="space-y-1">
                    {leadNode}
                    {leadLink}
                    <a
                      href={waHref(CONTACTS[contactFor(location.pathname)])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg py-3 text-[14px] font-medium text-[#203957] transition-colors duration-150 hover:bg-[#203957]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                      style={{ boxShadow: "inset 0 0 0 1.5px #203957" }}
                    >
                      <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                      מעדיפים בן אדם? שיחה בוואטסאפ
                    </a>
                    </div>
                  </div>
                ) : (
                  /* Chat messages */
                  <>
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn("flex", msg.role === "user" ? "justify-start" : "justify-end")}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-xl px-4 py-3 text-[14.5px] leading-relaxed",
                            msg.role === "user"
                              ? "rounded-br-sm bg-[#203957] text-white"
                              : "rounded-bl-sm bg-white text-[#203957]"
                          )}
                          style={msg.role === "assistant" ? { boxShadow: HAIRLINE } : undefined}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-[14.5px] [&_p]:text-[14.5px] [&_a]:text-[#203957] [&_a]:underline">
                              <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === "" && (
                      <div className="flex justify-end">
                        <div
                          className="flex items-center gap-1.5 rounded-xl rounded-bl-sm bg-white px-4 py-3.5"
                          style={{ boxShadow: HAIRLINE }}
                        >
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#203957]/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#203957]/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#203957]/40" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    {/* Quick suggestions after messages */}
                    {!isLoading && messages.length > 0 && messages.length < 6 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestions.slice(0, 2).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => streamChat(s.text)}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[14px] font-medium text-[#55677C] transition-colors duration-150 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                            style={{ boxShadow: HAIRLINE }}
                          >
                            <s.icon className="h-3 w-3" strokeWidth={1.75} />
                            {s.text}
                          </button>
                        ))}
                      </div>
                    )}
                    {leadNode}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#D9DEE4] px-3 py-3 sm:px-4">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={handleInputKeyDown}
                    placeholder="כתבו שאלה, Enter לשליחה"
                    aria-label="הודעה ליועץ הדיגיטלי"
                    className="min-h-[48px] max-h-[120px] min-w-0 flex-1 resize-none rounded-lg bg-white px-4 py-3 text-right text-[14.5px] leading-snug text-[#203957] transition-shadow duration-150 placeholder:text-[#55677C] focus:outline-none shadow-[0_0_0_1px_#D9DEE4] focus:shadow-[0_0_0_1px_#203957]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    aria-label="שליחת הודעה"
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                      input.trim()
                        ? "bg-[#203957] text-white hover:bg-[#162B45]"
                        : "bg-[#203957]/10 text-[#55677C]"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p
                  className="mt-2 text-center text-[10.5px] tracking-[0.14em] text-[#55677C]"
                  style={{ fontFamily: MONO }}
                  dir="ltr"
                >
                  מידע כללי בלבד. לא ייעוץ אישי.
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
