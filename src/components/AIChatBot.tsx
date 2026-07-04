import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X, Sparkles, MessageSquare, ArrowDownLeft, FileText, Calculator, Shield, PiggyBank } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
    { icon: FileText, text: "בדיקת תיק חינם" },
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

      if (!response.ok) throw new Error("שגיאה בשרת. נסה שוב.");
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
        { role: "assistant", content: error instanceof Error ? error.message : "שגיאה, נסה שוב." },
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
      {/* ═══ Floating Button ═══ */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-6 left-4 sm:left-6 z-50 group"
            aria-label="פתחו צ'אט עם צוות SEELD"
          >
            <div className="relative">
              {/* Main button */}
              <div className="relative w-14 h-14 rounded-full bg-[#171717] shadow-2xl shadow-[#171717]/40 flex items-center justify-center transition-colors group-hover:bg-[#0a0a0a]">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              {/* Online indicator */}
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1f9d55] border-2 border-white shadow-sm">
                <span className="absolute inset-0 rounded-full bg-[#1f9d55] animate-ping opacity-40" />
              </div>
            </div>
            {/* Label on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 rounded-lg bg-[#171717] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              שוחחו עם הצוות שלנו
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#171717]" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ Chat Panel ═══ */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[85vh] flex flex-col"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-[#171717]/15 border border-[#171717]/[0.08] overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-[#171717] px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1f9d55] border-2 border-[#171717]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">SEELD</h3>
                    <p className="text-white/50 text-xs">צוות הייעוץ הפיננסי</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[50vh]">
                {messages.length === 0 ? (
                  /* Welcome state */
                  <div className="text-center py-6 space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#171717]/20 to-[#1f9d55]/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-[#1f9d55]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#171717] text-base mb-1">שלום! הצוות של SEELD כאן.</h4>
                      <p className="text-sm text-[#171717]/50 leading-relaxed max-w-xs mx-auto">
                        נשמח לעזור לך בכל שאלה על ביטוח, פנסיה או חיסכון. על מה תרצה לשוחח?
                      </p>
                    </div>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(s.text)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#171717]/10 text-xs font-medium text-[#171717]/70 hover:text-[#171717] hover:border-[#1f9d55]/30 hover:bg-[#1f9d55]/5 transition-all"
                        >
                          <s.icon className="w-3 h-3" />
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
                        className={cn(
                          "flex gap-2.5",
                          msg.role === "user" ? "justify-start" : "justify-end"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed",
                            msg.role === "user"
                              ? "bg-[#171717] text-white rounded-br-sm"
                              : "bg-[#f4f6f8] text-[#171717] rounded-bl-sm"
                          )}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:mt-1 [&_li]:text-sm">
                              <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === "" && (
                      <div className="flex gap-2.5 justify-end">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-[#f4f6f8] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#171717]/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-[#171717]/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-[#171717]/30 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#171717]/8 text-[11px] font-medium text-[#171717]/50 hover:text-[#171717] hover:border-[#1f9d55]/20 transition-all"
                          >
                            <s.icon className="w-3 h-3" />
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
              <form
                onSubmit={handleSubmit}
                className="px-4 pb-4 pt-2 shrink-0 border-t border-[#171717]/[0.06]"
              >
                <div className="flex items-center gap-2 bg-[#f4f6f8] rounded-full px-4 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="שאלו אותנו כל דבר..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-right text-sm py-1.5 placeholder:text-[#171717]/30"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                      input.trim()
                        ? "bg-[#171717] text-white hover:bg-[#0d4a4a] hover:scale-105 shadow-md"
                        : "bg-transparent text-[#171717]/25"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#171717]/25 mt-2">
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
