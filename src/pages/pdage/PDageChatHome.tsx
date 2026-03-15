import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send, Loader2, Sparkles, User, Upload, History, BookOpen,
  FileText, ArrowLeft, MessageCircle, LayoutDashboard, Plus, Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { usePdageChat } from '@/hooks/usePdageChat';
import { format } from 'date-fns';

const quickActions = [
  { label: 'העלאת מסמך', icon: Upload, path: '/app/pdage/upload', color: 'from-primary to-accent' },
  { label: 'היסטוריה', icon: History, path: '/app/pdage/history', color: 'from-blue-500 to-blue-600' },
  { label: 'בנק חוסרים', icon: BookOpen, path: '/app/pdage/deficiency-bank', color: 'from-amber-500 to-orange-500' },
  { label: 'דשבורד', icon: LayoutDashboard, path: '/app/pdage/overview', color: 'from-violet-500 to-purple-600' },
];

const suggestions = [
  'מה ההבדל בין ביטוח מנהלים לקרן פנסיה?',
  'איך מטפלים בחוסר טופס הצטרפות?',
  'מה הדרישות הרגולטוריות לתיעוד המלצה?',
  'תעזור לי להתחיל תיקון מסמך חדש',
  'מה החוסרים הנפוצים ביותר?',
  'איך מפיקים PDF מתוקן?',
];

export default function PDageChatHome() {
  const navigate = useNavigate();
  const { session } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const {
    messages, isLoading, loadingHistory, conversationId,
    sendMessage, startNewConversation, loadConversation,
  } = usePdageChat();

  // Fetch recent jobs
  const { data: recentJobs = [] } = useQuery({
    queryKey: ['pdage-recent-jobs-chat'],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_jobs')
        .select('id, original_file_name, status, created_at, pdage_customers(full_name)')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!session,
  });

  // Fetch past conversations
  const { data: pastConversations = [] } = useQuery({
    queryKey: ['pdage-chat-conversations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pdage_chat_conversations')
        .select('id, title, updated_at, job_id')
        .order('updated_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!session,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleNavigationClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setShowHistory(false);
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'ממתין', processing: 'בעיבוד', review: 'לבדיקה', done: 'הושלם',
  };

  const hasMessages = messages.length > 0;

  const markdownComponents = {
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('navigation:')) {
        const path = href.replace('navigation:', '');
        return (
          <button
            onClick={() => handleNavigationClick(path)}
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline cursor-pointer"
          >
            {children}
            <ArrowLeft className="h-3 w-3" />
          </button>
        );
      }
      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] max-w-5xl mx-auto">
      {/* Conversation history sidebar */}
      {showHistory && (
        <div className="w-72 shrink-0 border-l border-border bg-muted/30 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">שיחות קודמות</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => { startNewConversation(); setShowHistory(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              שיחה חדשה
            </button>
            {pastConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => { loadConversation(conv.id); setShowHistory(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-right hover:bg-muted transition-colors ${
                  conversationId === conv.id ? 'bg-muted font-medium' : ''
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground">{conv.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(conv.updated_at), 'dd/MM/yy HH:mm')}
                  </p>
                </div>
              </button>
            ))}
            {pastConversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">אין שיחות קודמות</p>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages / Welcome area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full space-y-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">שלום, אני pDage AI 👋</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    העוזר החכם שלך לתיקון ליקויים במסמכים ביטוחיים ופיננסיים
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
                {quickActions.map(action => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-card"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>

              {recentJobs.length > 0 && (
                <div className="w-full max-w-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">עבודות אחרונות</p>
                  <div className="space-y-1.5">
                    {recentJobs.map(job => {
                      const customer = (job as any).pdage_customers as any;
                      return (
                        <button
                          key={job.id}
                          onClick={() => navigate(`/app/pdage/job/${job.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-right"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {customer?.full_name || 'ללא לקוח'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">{job.original_file_name}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {statusLabels[job.status] || job.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past conversations */}
              {pastConversations.length > 0 && (
                <div className="w-full max-w-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">שיחות אחרונות</p>
                  <div className="space-y-1.5">
                    {pastConversations.slice(0, 3).map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all text-right"
                      >
                        <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(conv.updated_at), 'dd/MM/yy HH:mm')}
                          </p>
                        </div>
                      </button>
                    ))}
                    {pastConversations.length > 3 && (
                      <button
                        onClick={() => setShowHistory(true)}
                        className="w-full text-xs text-primary hover:underline py-1"
                      >
                        הצג את כל השיחות ({pastConversations.length})
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full max-w-lg space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">שאל אותי...</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-xs px-3.5 py-2 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-md'
                      : 'bg-muted/70 border border-border/50 rounded-tl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md">
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/70 border border-border/50 rounded-2xl rounded-tl-md px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5 shrink-0 text-xs h-8"
            >
              <Clock className="h-3.5 w-3.5" />
              שיחות קודמות
            </Button>
            {hasMessages && (
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="gap-1.5 shrink-0 text-xs h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                שיחה חדשה
              </Button>
            )}
            {quickActions.slice(0, 2).map(action => (
              <Button
                key={action.path}
                variant="outline"
                size="sm"
                onClick={() => navigate(action.path)}
                className="gap-1.5 shrink-0 text-xs h-8"
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאל שאלה מקצועית, בקש עזרה בתיקון, או נווט במערכת..."
              rows={1}
              className="resize-none min-h-[44px] max-h-[140px] text-sm rounded-xl"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            pDage AI · עוזר חכם לסוכני ביטוח ופיננסים
          </p>
        </div>
      </div>
    </div>
  );
}
