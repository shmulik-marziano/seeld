import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X, MessageSquare, FileText, Calculator, Shield, PiggyBank } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { INK, MONO, CARD_SHADOW, RING, LINE } from "@/lib/brand";
import { LiveDot, LiveTag } from "@/components/brand/Live";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

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
    { icon: FileText, text: "בדיקת תיק ללא עלות" },
    { icon: Calculator, text: "כמה אני משלם יותר מדי?" },
    { icon: Shield, text: "מה כולל ביטוח בריאות?" },
    { icon: PiggyBank, text: "איך בוחרים קרן פנסיה?" },
  ],
  "/insurances": [
    { icon: Shield, text: "איזה ביטוח מתאים לי?" },
    { icon: FileText, text: "מה ההבדל בין תוכניות?" },
    { icon: Calculator, text: "כמה עולה ביטוח בריאות?" },
  ],
  "/savings": [
    { icon: PiggyBank, text: "גמל או השתלמות?" },
    { icon: Calculator, text: "כמה לחסוך לפנסיה?" },
    { icon: FileText, text: "מה זה דמי ניהול?" },
  ],
  "/calculators": [
    { icon: Calculator, text: "עזרה עם המחשבון" },
    { icon: PiggyBank, text: "כמה כדאי להפקיד?" },
  ],
};

const defaultSuggestions = [
  { icon: FileText, text: "איך מתחילים?" },
  { icon: Shield, text: "מה כולל הייעוץ?" },
  { icon: Calculator, text: "כמה זה עולה?" },
  { icon: PiggyBank, text: "רוצה לקבוע פגישה" },
];

const AIChatBot = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const suggestions = pageSuggestions[location.pathname] || defaultSuggestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Allow other parts of the site (e.g. homepage capability cards) to open the chat
  useEffect(() => {
    const open = () => setIsExpanded(true);
    window.addEventListener("seeld:open-chat", open);
    return () => window.removeEventListener("seeld:open-chat", open);
  }, []);

  // Load previous conversation
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

  const saveMessage = async (message: Message, convId: string) => {
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
      });
    } catch { /* non-blocking */ }
  };

  const getOrCreateConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId })
      .select("id")
      .single();
    if (error || !data) throw new Error("Failed to create conversation");
    setConversationId(data.id);
    return data.id;
  };

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const convId = await getOrCreateConversation();
      await saveMessage(userMsg, convId);

      const sessionId = getSessionId();
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: convId,
          sessionId,
          history: messages.slice(-10),
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

      if (assistantContent) {
        await saveMessage({ role: "assistant", content: assistantContent }, convId);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        { role: "assistant", content: error instanceof Error ? error.message : "ההודעה לא נשלחה. נסו שוב." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleSuggestion = (text: string) => {
    streamChat(text);
  };

  return (
    <>
      {/* ── Launcher ── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 left-4 sm:left-6 z-50 group"
            aria-label="פתחו צ'אט עם צוות SEELD"
          >
            <div className="relative">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#171717] transition-colors duration-150 group-hover:bg-[#262626]"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              {/* Live status */}
              <span
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white"
                style={{ boxShadow: RING }}
              >
                <LiveDot size={8} />
              </span>
            </div>
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md bg-[#171717] px-3 py-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="text-[12px] font-medium text-white">שוחחו עם הצוות</span>
              <span
                className="text-[10px] tracking-[0.12em]"
                style={{ fontFamily: MONO, color: "rgba(250,250,250,.6)" }}
                dir="ltr"
              >
                LIVE
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-4 left-4 sm:left-6 z-50 flex w-[calc(100vw-2rem)] max-h-[85vh] flex-col sm:w-[420px]"
            role="dialog"
            aria-label="צ'אט עם צוות SEELD"
          >
            <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-lg bg-white" style={{ boxShadow: CARD_SHADOW }}>
              {/* Header — ink band */}
              <div className="flex shrink-0 items-center justify-between px-5 py-3.5" style={{ backgroundColor: INK }}>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-semibold tracking-tight text-white" dir="ltr">
                    SEELD
                  </span>
                  <span className="h-4 w-px bg-white/15" aria-hidden="true" />
                  <LiveTag dark dot>LIVE · 24/7</LiveTag>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  aria-label="סגירת הצ'אט"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="min-h-[200px] max-h-[50vh] flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  /* Welcome state */
                  <div className="space-y-4 px-1 py-3">
                    <LiveTag dot>SEELD AI</LiveTag>
                    <div>
                      <h4 className="text-[15px] font-semibold text-[#171717]">צוות SEELD כאן.</h4>
                      <p className="mt-1 text-sm leading-relaxed text-[#4d4d4d]">
                        שאלו על ביטוח, פנסיה או חיסכון. נענה מיד.
                      </p>
                    </div>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(s.text)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#171717] transition-colors duration-150 hover:border-[#171717]"
                        >
                          <s.icon className="h-3.5 w-3.5 text-[#6e6e6e]" />
                          {s.text}
                        </button>
                      ))}
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
                            "max-w-[85%] rounded-lg px-3.5 py-2.5 text-[14px] leading-relaxed",
                            msg.role === "user"
                              ? "rounded-br-sm bg-[#171717] text-white"
                              : "rounded-bl-sm bg-[#fafafa] text-[#171717]"
                          )}
                          style={msg.role === "assistant" ? { boxShadow: RING } : undefined}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-[14px] [&_p]:text-[14px]">
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
                          className="flex items-center gap-1.5 rounded-lg rounded-bl-sm bg-[#fafafa] px-4 py-3"
                          style={{ boxShadow: RING }}
                        >
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#171717]/40" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#171717]/40" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#171717]/40" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    {/* Quick suggestions after messages */}
                    {!isLoading && messages.length > 0 && messages.length < 6 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestions.slice(0, 2).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestion(s.text)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#ebebeb] bg-white px-3 py-1.5 text-[13px] font-medium text-[#5c5c5c] transition-colors duration-150 hover:border-[#171717] hover:text-[#171717]"
                          >
                            <s.icon className="h-3 w-3" />
                            {s.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input — hairline top divider */}
              <form onSubmit={handleSubmit} className="shrink-0 border-t px-3 py-3" style={{ borderColor: LINE }}>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="שאלו אותנו כל דבר"
                    className="h-10 min-w-0 flex-1 rounded-md border border-[#ebebeb] bg-white px-3 text-right text-[14px] text-[#171717] transition-colors duration-150 placeholder:text-[#6e6e6e] focus:border-[#171717] focus:outline-none disabled:opacity-50"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    aria-label="שליחת הודעה"
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
                      input.trim()
                        ? "bg-[#171717] text-white hover:bg-[#262626]"
                        : "bg-[#f5f5f5] text-[#a3a3a3]"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-[#6e6e6e]">
                  SEELD AI · יועץ פיננסי דיגיטלי
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
