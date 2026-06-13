import { useEffect, useState, useRef } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Message = {
  id: string;
  customer_id: string;
  content: string;
  sender: string;
  created_at: string;
};

const ChatTab = ({ customerId, customerName }: { customerId: string; customerName: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = siteSupabase
      .channel(`customer_messages_${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "customer_messages",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      siteSupabase.removeChannel(channel);
    };
  }, [customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await siteSupabase
        .from("customer_messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch {
      toast.error("שגיאה בטעינת ההודעות");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const { data: cust } = await siteSupabase
        .from("customers")
        .select("agent_id")
        .eq("id", customerId)
        .single();
      if (!cust?.agent_id) {
        throw new Error("Customer has no assigned agent");
      }

      const { error } = await siteSupabase
        .from("customer_messages")
        .insert({
          customer_id: customerId,
          agent_id: cust.agent_id,
          content: trimmed,
          sender: "customer",
        });

      if (error) throw error;
      setNewMessage("");
    } catch {
      toast.error("שגיאה בשליחת ההודעה");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && new Date(lastGroup.messages[0].created_at).toDateString() === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msg.created_at, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#0a3d3d" }} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col relative" style={{ height: "calc(100dvh - 200px)", minHeight: 400 }}>
      {/* On mobile, ensure full height usage */}
      {/* Chat header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ background: "#0a3d3d" }}>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">צ'אט עם הסוכן</h3>
          <p className="text-white/70 text-xs">שלח הודעה והסוכן שלך יחזור אליך בהקדם</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ background: "#f8f9fc" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#e0f2f1" }}>
              <MessageCircle className="w-8 h-8" style={{ color: "#0a3d3d" }} />
            </div>
            <p className="text-gray-500 text-sm">אין הודעות עדיין. שלח הודעה ראשונה לסוכן שלך!</p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-white rounded-full px-4 py-1 text-xs text-gray-400 shadow-sm border">
                  {formatDate(group.date)}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isCustomer = msg.sender === "customer";
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-3 ${isCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isCustomer
                          ? "rounded-br-md"
                          : "rounded-bl-md"
                      }`}
                      style={{
                        background: isCustomer ? "#0a3d3d" : "white",
                        color: isCustomer ? "white" : "#1f2937",
                        border: isCustomer ? "none" : "1px solid #e5e7eb",
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isCustomer ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - sticky at bottom */}
      <div className="border-t bg-white p-3 sticky bottom-0 z-10 safe-area-pb">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="הקלד הודעה..."
            className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-[#0a3d3d] focus:ring-1 focus:ring-[#0a3d3d] transition-colors min-h-[44px]"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-40 min-w-[44px] min-h-[44px]"
            style={{ background: "#0a3d3d", color: "white" }}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
