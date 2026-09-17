import { useEffect, useState, useRef } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Illustration } from "@/components/brand/Illustration";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN } from "@/lib/brand";

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
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
      toast.error("טעינת ההודעות לא הצליחה. נסו לרענן את העמוד.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const { error } = await siteSupabase
        .from("customer_messages")
        .insert({
          customer_id: customerId,
          content: trimmed,
          sender: "customer",
        });

      if (error) throw error;
      setNewMessage("");
    } catch {
      toast.error("ההודעה לא נשלחה. נסו שוב.");
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
      <div className="flex justify-center py-16" aria-busy="true" aria-live="polite">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
        <span className="sr-only">טוען הודעות</span>
      </div>
    );
  }

  return (
    <div
      className="dna-concept !p-0 overflow-hidden flex flex-col relative"
      style={{ height: "calc(100dvh - 220px)", minHeight: 420 }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: GREEN }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: IVORY }}>
          <BrandIcon name="message" size={20} style={{ color: GREEN }} />
        </div>
        <div>
          <h3 className="text-[16px]" style={{ color: IVORY }}>הודעה ליועץ</h3>
          <p className="text-[14px]" style={{ color: SAGE_ON_GREEN }}>
            {customerName ? `${customerName}, ` : ""}כתבו כאן והיועץ יענה באותה שיחה.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: IVORY }}
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Illustration
              name="06-documents-service"
              sizes="200px"
              className="max-w-[200px] mb-4"
            />
            <p className="text-[16px] leading-[1.6] max-w-sm" style={{ color: BODY }}>
              אין עדיין פניות. כתבו ליועץ, והתשובה תישמר כאן.
            </p>
          </div>
        ) : (
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="flex items-center justify-center my-4">
                <span
                  className="bg-white rounded-full px-4 py-1 text-[14px] border"
                  style={{ color: MUTED, borderColor: LINE }}
                >
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
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isCustomer ? "rounded-br-md" : "rounded-bl-md"}`}
                      style={{
                        backgroundColor: isCustomer ? GREEN : "#FFFFFF",
                        color: isCustomer ? IVORY : BODY,
                        border: isCustomer ? "none" : `1px solid ${LINE}`,
                      }}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className="text-[14px] mt-1 tabular-nums"
                        style={{ color: isCustomer ? SAGE_ON_GREEN : MUTED }}
                        dir="ltr"
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

      {/* Composer */}
      <div className="border-t bg-white p-3 sticky bottom-0 z-10 safe-area-pb" style={{ borderColor: LINE }}>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        >
          <label htmlFor="pa-chat-input" className="sr-only">ההודעה ליועץ</label>
          <input
            id="pa-chat-input"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="כתבו הודעה"
            className="field flex-1 !rounded-full"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
            style={{ backgroundColor: GREEN, color: IVORY }}
            aria-label="שליחת ההודעה"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-5 h-5" style={{ transform: "scaleX(-1)" }} aria-hidden="true" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatTab;
