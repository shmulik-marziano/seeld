import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Loader2 } from "lucide-react";
import { V2Shell } from "../components/V2Shell";
import { GradientText, Eyebrow } from "../components/primitives";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finance-chat`;

const SUGGESTIONS = [
  "כמה אני צריך לחסוך לפנסיה?",
  "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
  "האם כדאי לי ביטוח אובדן כושר עבודה?",
  "איך מורידים דמי ניהול?",
];

const GREETING =
  "היי, אני אריק 👋 היועץ הפיננסי החכם של SeelD. אפשר לשאול אותי כל דבר על פנסיה, ביטוח, חיסכון, השקעות או מיצוי זכויות. במה אוכל לעזור?";

export default function AdvisorChat() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;

    const history = messages.filter((m) => m.content !== GREETING);
    setMessages((prev) => [...prev, { role: "user", content: clean }]);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: clean }].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error("unavailable");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("unavailable");
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

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
              full += content;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { role: "assistant", content: full };
                return u;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      if (!full) throw new Error("empty");
    } catch {
      setMessages((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          role: "assistant",
          content:
            "אני זמין באתר החי לאחר חיבור מפתח ה-AI בשרת. בינתיים — צוות היועצים שלנו ישמח לעזור: אפשר לקבוע פגישת ייעוץ ראשונה (על חשבוננו) או לכתוב לנו בוואטסאפ.",
        };
        return u;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <V2Shell bare>
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-3xl flex-col px-5 sm:px-8 pt-10">
        <div className="mb-5">
          <Eyebrow>יועץ AI · מבוסס Gemini</Eyebrow>
          <h1 className="v2-display mt-3 text-3xl sm:text-4xl font-extrabold text-[#18181a]">
            שיחה עם <GradientText>אריק.</GradientText>
          </h1>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="v2-card flex-1 space-y-4 overflow-y-auto rounded-3xl p-4 sm:p-6">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-[1.7] ${
                  m.role === "user"
                    ? "bg-[#18181a] text-white"
                    : "bg-[#f4f3ef] text-[#3a3a3c] [&_strong]:text-[#18181a] [&_ul]:mt-1 [&_ul]:pr-4 [&_ul]:list-disc"
                }`}
              >
                {m.role === "assistant" && m.content === "" && loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#18181a]" />
                ) : m.role === "assistant" ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-[#18181a1f] bg-white px-3.5 py-2 text-[12.5px] text-[#3a3a3c] transition-colors hover:border-[#18181a40] hover:text-[#18181a]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 mb-4 flex items-center gap-2 rounded-full border border-[#18181a1f] bg-white p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתוב שאלה לאריק…"
            className="flex-1 bg-transparent px-3 py-2 text-[14px] text-[#18181a] placeholder:text-[#a8a6a0] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#18181a] text-white transition-transform hover:scale-105 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </V2Shell>
  );
}
