import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Sparkles, User, X, MessageCircle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { usePdageChat, type ChatMessage } from '@/hooks/usePdageChat';

const fieldLabels: Record<string, string> = {
  customerName: 'שם לקוח',
  idNumber: 'תעודת זהות',
  policyNumber: 'מספר פוליסה',
  company: 'חברת ביטוח',
  productType: 'סוג מוצר',
  startDate: 'תאריך התחלה',
  endDate: 'תאריך סיום',
  coverageAmount: 'סכום כיסוי',
  monthlyPremium: 'פרמיה חודשית',
  beneficiaries: 'מוטבים',
  additionalNotes: 'הערות נוספות',
};

interface PDageChatPanelProps {
  jobId: string;
  jobTitle?: string;
  onClose?: () => void;
  correctionFields?: Record<string, string>;
  onFieldUpdate?: (key: string, value: string) => void;
}

export function PDageChatPanel({ jobId, jobTitle, onClose, correctionFields, onFieldUpdate }: PDageChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages, isLoading, loadingHistory, sendMessage,
  } = usePdageChat({ jobId });

  const [input, setInput] = useState('');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    await sendMessage(text, (key, value) => {
      if (onFieldUpdate) {
        onFieldUpdate(key, value);
        toast.success('שדות עודכנו בהצלחה');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'מה בדיוק צריך לתקן במסמך?',
    'תן הוראות שלב-אחרי-שלב',
    'עדכן את שם הלקוח ל...',
    'שנה את מספר הפוליסה ל...',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">עוזר AI</h3>
            <p className="text-[10px] text-muted-foreground leading-none">pDage AI — עריכת מסמכים</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto">
              <MessageCircle className="h-6 w-6 text-primary/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">איך אפשר לעזור?</p>
              <p className="text-xs text-muted-foreground mt-1">שאל על המסמך, החוסר, או בקש לעדכן שדות</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((msg, i) => {
          if (msg.role === 'system_update') {
            return (
              <div key={i} className="flex justify-center">
                <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-xs max-w-[90%]">
                  <div className="flex items-center gap-1.5 text-accent-foreground font-medium mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    שדות עודכנו
                  </div>
                  <div className="prose prose-sm max-w-none text-accent-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                msg.role === 'user' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
              }`}>
                {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שאל על המסמך או בקש עזרה בתיקון..."
            rows={1}
            className="resize-none min-h-[40px] max-h-[120px] text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
