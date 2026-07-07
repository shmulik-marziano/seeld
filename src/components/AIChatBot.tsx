import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, X, FileText, Calculator, Shield, PiggyBank, Phone, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LINE, MONO, MUTED, NAVY, RING } from "@/lib/brand";
import { LiveDot, LiveTag } from "@/components/brand/Live";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;
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

/* ── Suggestion chips based on page context ── */
const pageSuggestions: Record<string, { icon: typeof Shield; text: string }[]> = {
  "/": [
    { icon: FileText, text: "מה כוללת בדיקת תיק ללא עלות?" },
    { icon: Calculator, text: "איך בודקים אם אני משלם יותר מדי?" },
    { icon: Shield, text: "מה כולל ביטוח בריאות פרטי?" },
    { icon: PiggyBank, text: "איך בוחרים קרן פנסיה?" },
  ],
  "/insurances": [
    { icon: Shield, text: "איזה ביטוח מתאים לי?" },
    { icon: FileText, text: "מה ההבדל בין ביטוח פרטי לקופת חולים?" },
    { icon: Calculator, text: "ממה מורכב מחיר של ביטוח בריאות?" },
  ],
  "/savings": [
    { icon: PiggyBank, text: "קרן השתלמות או גמל להשקעה?" },
    { icon: Calculator, text: "כמה כדאי להפקיד לפנסיה?" },
    { icon: FileText, text: "מה זה דמי ניהול ולמה זה חשוב?" },
  ],
  "/calculators": [
    { icon: Calculator, text: "איזה מחשבון מתאים לשאלה שלי?" },
    { icon: PiggyBank, text: "איך קוראים את תוצאות מחשבון הפנסיה?" },
  ],
};

const defaultSuggestions = [
  { icon: FileText, text: "איך מתחיל תהליך הייעוץ?" },
  { icon: Shield, text: "מה כולל הייעוץ ומה זה עולה?" },
  { icon: Calculator, text: "מה בודקים בבדיקת תיק?" },
  { icon: PiggyBank, text: "רוצה לקבוע פגישה" },
];

const AIChatBot = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const reduced = useReducedMotion();

  const suggestions = pageSuggestions[location.pathname] || defaultSuggestions;

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
    const open = () => setIsExpanded(true);
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

      if (!response.ok) throw new Error("משהו השתבש אצלנו. נסו לשלוח שוב, או חייגו 052-309-7444.");
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
        throw new Error("לא התקבלה תשובה. נסו שוב, או חייגו 052-309-7444.");
      }

      const convId = await convPromise;
      await saveMessage({ role: "assistant", content: assistantContent }, convId);
    } catch (error) {
      // Network-level failures surface English browser strings; keep the visitor in Hebrew
      const raw = error instanceof Error ? error.message : "";
      const friendly = /[֐-׿]/.test(raw)
        ? raw
        : "ההודעה לא נשלחה. בדקו את החיבור ונסו שוב, או חייגו 052-309-7444.";
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
    localStorage.removeItem("seeld_chat_session");
    inputRef.current?.focus();
  };

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
            className="fixed bottom-6 left-4 sm:left-6 z-50 flex min-h-[52px] items-center gap-2.5 rounded-full bg-[#1D2D3D] py-3 pr-5 pl-4 text-white transition-colors duration-150 hover:bg-[#16222f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            style={{ boxShadow: "0 10px 28px -10px rgba(29,45,61,.55), inset 0 0 0 1px rgba(255,255,255,.08)" }}
            aria-label="פתחו שיחה עם היועץ הדיגיטלי של SEELD"
          >
            <LiveDot size={8} />
            <span className="text-[14px] font-semibold tracking-[0.02em]">שיחה עם היועץ</span>
            <span
              className="hidden sm:inline text-[10px] tracking-[0.18em] text-white/55"
              style={{ fontFamily: MONO }}
              dir="ltr"
            >
              AI · LIVE
            </span>
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
            className="fixed z-50 flex flex-col inset-x-2 bottom-2 top-16 sm:inset-auto sm:bottom-4 sm:left-6 sm:h-[min(700px,calc(100dvh-3rem))] sm:w-[440px] lg:w-[500px]"
            role="dialog"
            aria-label="שיחה עם היועץ הדיגיטלי של SEELD"
          >
            <div
              className="flex h-full flex-col overflow-hidden"
              style={{
                backgroundColor: PANEL_BG,
                borderRadius: 12,
                border: `1px solid ${LINE}`,
                boxShadow: "0 24px 60px -18px rgba(29,45,61,.35)",
              }}
            >
              {/* Header — navy band */}
              <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ backgroundColor: NAVY }}>
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-semibold tracking-tight text-white" dir="ltr">
                    SEELD<span className="text-[#D8A24A]">.</span>
                  </span>
                  <span className="h-4 w-px bg-white/15" aria-hidden="true" />
                  <LiveTag dark dot>היועץ הדיגיטלי · LIVE</LiveTag>
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
                          className="text-[22px] leading-snug text-[#1D2D3D]"
                          style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700 }}
                        >
                          שלום, כאן היועץ הדיגיטלי של SEELD.
                        </h4>
                        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[#3a4c5a]">
                          ביטוח, פנסיה, חיסכון או מס: שאלו כל דבר. עונה מיד, ומחבר אתכם ליועץ אנושי כשצריך.
                        </p>
                      </div>
                      {/* Suggestion tiles — white with the faint navy ring */}
                      <div className="grid gap-2">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => streamChat(s.text)}
                            className="flex min-h-[48px] items-center gap-3 rounded-lg bg-white px-4 py-3 text-right text-[14px] font-medium text-[#1D2D3D] transition-colors duration-150 hover:bg-[#F4F8F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                            style={{ boxShadow: RING }}
                          >
                            <s.icon className="h-4 w-4 shrink-0 text-[#5a6a78]" strokeWidth={1.75} />
                            {s.text}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Human handoff */}
                    <a
                      href="https://wa.me/972523097444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-medium text-[#1D2D3D] transition-colors duration-150 hover:bg-[#1D2D3D]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                      style={{ boxShadow: "inset 0 0 0 1.5px #1D2D3D" }}
                    >
                      <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                      מעדיפים בן אדם? 052-309-7444
                    </a>
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
                              ? "rounded-br-sm bg-[#1D2D3D] text-white"
                              : "rounded-bl-sm bg-white text-[#1D2D3D]"
                          )}
                          style={msg.role === "assistant" ? { boxShadow: HAIRLINE } : undefined}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-[14.5px] [&_p]:text-[14.5px] [&_a]:text-[#1D2D3D] [&_a]:underline">
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
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1D2D3D]/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1D2D3D]/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1D2D3D]/40" style={{ animationDelay: "300ms" }} />
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
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#5a6a78] transition-colors duration-150 hover:text-[#1D2D3D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
                            style={{ boxShadow: HAIRLINE }}
                          >
                            <s.icon className="h-3 w-3" strokeWidth={1.75} />
                            {s.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#E7EDF1] px-3 py-3 sm:px-4">
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
                    className="min-h-[48px] max-h-[120px] min-w-0 flex-1 resize-none rounded-lg bg-white px-4 py-3 text-right text-[14.5px] leading-snug text-[#1D2D3D] transition-shadow duration-150 placeholder:text-[#5a6a78] focus:outline-none shadow-[0_0_0_1px_#E7EDF1] focus:shadow-[0_0_0_1px_#1D2D3D]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    aria-label="שליחת הודעה"
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                      input.trim()
                        ? "bg-[#1D2D3D] text-white hover:bg-[#16222f]"
                        : "bg-[#1D2D3D]/10 text-[#5a6a78]"
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
                  className="mt-2 text-center text-[10.5px] tracking-[0.14em] text-[#5a6a78]"
                  style={{ fontFamily: MONO }}
                  dir="ltr"
                >
                  SEELD AI · GENERAL INFO · NOT PERSONAL ADVICE
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
