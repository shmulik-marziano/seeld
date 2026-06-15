import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X, Bot, AlertTriangle, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

const smartTips = [
  "מה ביטוח בריאות מכסה בדרך כלל?",
  "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
  "מהי קרן השתלמות ולמה זה חשוב?",
  "מה כדאי לבדוק בחידוש ביטוח רכב?",
  "מהם סוגי הביטוח שכל משפחה צריכה?",
  "איך בוחרים קופת גמל להשקעה?",
];

const getSessionId = () => {
  let sessionId = localStorage.getItem("seeld_client_chat_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("seeld_client_chat_session", sessionId);
  }
  return sessionId;
};

const ClientAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Load previous conversation
  useEffect(() => {
    const loadConversation = async () => {
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
    };
    loadConversation();
  }, []);

  const saveMessage = async (message: Message, convId: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      role: message.role,
      content: message.content,
    });
  };

  const getOrCreateConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId })
      .select("id")
      .single();

    if (error || !data) throw new Error("שגיאה ביצירת שיחה");
    setConversationId(data.id);
    return data.id;
  };

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");

    let assistantContent = "";

    try {
      const convId = await getOrCreateConversation();
      await saveMessage(userMsg, convId);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "שגיאה בחיבור");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
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

  const handleQuickQuestion = (q: string) => {
    streamChat(q);
  };

  return (
    <div className="space-y-4">
      {/* Chatbot header card */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1a1a4b 0%, #2a2a66 100%)" }}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm">עוזר חכם</h3>
            <p className="text-white/60 text-xs">שאלו שאלות כלליות בנושאי ביטוח וחיסכון</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3 text-[#d6157e]" />
            <span className="text-[10px] text-white/70 font-medium">AI</span>
          </div>
        </div>

        {/* Disclaimer banner inside chat */}
        <div className="px-4 py-3 bg-[#fef3c7]/60 border-b border-[#f59e0b]/15">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#92400e] leading-relaxed">
              * העוזר החכם מספק מידע כללי בלבד ואינו מהווה ייעוץ מקצועי.
              לפני ביצוע כל פעולה, מומלץ להתייעץ עם סוכן הביטוח שלך.
            </p>
          </div>
        </div>

        {/* Messages area */}
        <div className="h-[360px] overflow-y-auto p-4 space-y-3" style={{ background: "#f8f9fc" }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, #fce7f3 0%, #b2dfdb 100%)" }}
              >
                <Bot className="w-8 h-8 text-[#1a1a4b]" />
              </div>
              <h4 className="font-bold text-[#1a1a4b] mb-1">איך אפשר לעזור?</h4>
              <p className="text-gray-400 text-sm mb-6">
                שאלו שאלות כלליות על ביטוח, חיסכון ופנסיה
              </p>

              {/* Quick question suggestions */}
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {smartTips.slice(0, 4).map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(tip)}
                    className="text-right text-xs px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-[#1a1a4b]/30 hover:bg-[#1a1a4b]/[0.03] transition-all min-h-[40px]"
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isUser
                          ? "bg-[#1a1a4b] text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                      )}
                    >
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none text-sm [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                          <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* "Consult agent" reminder after every assistant message */}
              {messages.length > 1 && messages[messages.length - 1]?.role === "assistant" && !isLoading && (
                <div className="flex justify-center">
                  <div className="bg-[#fce7f3] rounded-full px-4 py-1.5 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-[#1a1a4b]/60" />
                    <span className="text-[10px] text-[#1a1a4b]/70 font-medium">
                      לפני ביצוע פעולה, מומלץ להתייעץ עם הסוכן שלך
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאלו שאלה כללית..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-[#1a1a4b] focus:ring-1 focus:ring-[#1a1a4b]/30 transition-all min-h-[44px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 min-w-[44px] min-h-[44px]"
              style={{ background: "#1a1a4b", color: "white" }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
              )}
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            * התשובות נוצרות באמצעות בינה מלאכותית ואינן מהוות ייעוץ מקצועי
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientAIChatbot;
