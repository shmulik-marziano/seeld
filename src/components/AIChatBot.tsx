import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

const getSessionId = () => {
  let sessionId = localStorage.getItem("seeld_chat_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("seeld_chat_session", sessionId);
  }
  return sessionId;
};

const AIChatBot = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (showResponse) scrollToBottom();
  }, [messages, showResponse]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

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
          setShowResponse(true);
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

    if (error || !data) throw new Error("Failed to create conversation");
    setConversationId(data.id);
    return data.id;
  };

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");
    setShowResponse(true);

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
      console.error("Chat error:", error);
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

  const lastAssistantMessage = messages.filter(m => m.role === "assistant").slice(-1)[0];

  return (
    <>
      {/* Floating Orb Button - Fixed bottom left */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              "fixed bottom-6 left-4 sm:left-6 z-50 transition-all duration-300",
              isExpanded && "opacity-0 pointer-events-none scale-0"
            )}
            aria-label="פתח צ'אט עם אריק"
          >
            {/* Glowing Orb Dot */}
            <div className="relative w-12 h-12 group">
              {/* Outer pulsating glow */}
              <div className="absolute inset-[-6px] rounded-full bg-gradient-to-r from-[hsl(195,70%,70%)] via-[hsl(280,50%,70%)] to-[hsl(195,70%,60%)] animate-orb-pulse blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
              {/* Inner glow ring */}
              <div className="absolute inset-[-1px] rounded-full animate-orb-glow" />
              {/* Middle rotating ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(195,80%,75%)] via-[hsl(280,60%,70%)] to-[hsl(195,70%,65%)] animate-spin-slow opacity-80" />
              {/* Inner orb with shimmer */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[hsl(195,90%,85%)] via-[hsl(280,50%,80%)] to-[hsl(195,80%,75%)] animate-orb-shimmer shadow-lg" />
              {/* Center highlight */}
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-white/60 blur-[1px]" />
              {/* Secondary highlight */}
              <div className="absolute bottom-2 right-1.5 w-1.5 h-1.5 rounded-full bg-white/30 blur-[1px]" />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card border-border">
          <p>שוחחו עם אריק - היועץ הפיננסי שלכם 💬</p>
        </TooltipContent>
      </Tooltip>

      {/* Expanded Chat Panel - Fixed bottom left */}
      <div
        className={cn(
          "fixed bottom-6 left-4 sm:left-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] sm:max-w-[calc(100vw-3rem)] transition-all duration-300 origin-bottom-left",
          isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Response Bubble - shows above input when there's a response */}
        {showResponse && lastAssistantMessage && (
          <div className="mb-3 bg-card/95 backdrop-blur-lg rounded-2xl border border-border shadow-xl p-4 max-h-60 overflow-y-auto animate-scale-in">
            <div className="flex items-start gap-3">
              {/* Mini orb */}
              <div className="w-8 h-8 rounded-full shrink-0 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(195,70%,60%)] via-[hsl(280,60%,65%)] to-[hsl(195,70%,50%)] animate-spin-slow opacity-60 blur-[2px]" />
                <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[hsl(195,80%,70%)] via-[hsl(280,50%,75%)] to-[hsl(195,60%,60%)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">אריק • יועץ AI</p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                  <ReactMarkdown>{lastAssistantMessage.content || "..."}</ReactMarkdown>
                </div>
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-3">
          {/* Small Orb */}
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-[hsl(195,70%,70%)] via-[hsl(280,50%,70%)] to-[hsl(195,70%,60%)] animate-orb-pulse blur-md opacity-70" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(195,80%,75%)] via-[hsl(280,60%,70%)] to-[hsl(195,70%,65%)] animate-spin-slow opacity-80" />
            <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[hsl(195,90%,85%)] via-[hsl(280,50%,80%)] to-[hsl(195,80%,75%)] animate-orb-shimmer" />
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60 blur-[1px]" />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 bg-card/95 backdrop-blur-lg rounded-full border border-border shadow-xl flex items-center gap-2 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאלו את אריק..."
              className="flex-1 bg-transparent border-none focus:outline-none text-right text-base sm:text-sm py-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                input.trim() ? "bg-primary text-primary-foreground hover:scale-105" : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChatBot;
