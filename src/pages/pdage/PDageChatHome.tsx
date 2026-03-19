import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send, Loader2, Sparkles, User, Upload, History, BookOpen,
  FileText, ArrowLeft, MessageCircle, LayoutDashboard, Plus, Clock,
  Zap, ChevronLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { usePdageChat } from '@/hooks/usePdageChat';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const quickActions = [
  { label: 'העלאת מסמך', desc: 'סריקה ואיתור חוסרים', icon: Upload, path: '/app/pdage/upload', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/8' },
  { label: 'היסטוריה', desc: 'תיקונים קודמים', icon: History, path: '/app/pdage/history', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/8' },
  { label: 'בנק חוסרים', desc: 'תבניות מוכנות', icon: BookOpen, path: '/app/pdage/deficiency-bank', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/8' },
  { label: 'דשבורד', desc: 'סטטיסטיקות ונתונים', icon: LayoutDashboard, path: '/app/pdage/overview', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/8' },
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

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
    processing: 'bg-blue-500/10 text-blue-600 border-blue-200',
    review: 'bg-violet-500/10 text-violet-600 border-violet-200',
    done: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
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
    <div className="flex flex-col sm:flex-row h-[calc(100vh-5rem)] sm:h-[calc(100vh-5rem)] max-w-5xl mx-auto">
      {/* Conversation history sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 border-l border-border/60 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">שיחות קודמות</h3>
              <button onClick={() => setShowHistory(false)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              <button
                onClick={() => { startNewConversation(); setShowHistory(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                שיחה חדשה
              </button>
              {pastConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { loadConversation(conv.id); setShowHistory(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-right transition-all ${
                    conversationId === conv.id
                      ? 'bg-primary/8 border border-primary/15 font-medium'
                      : 'hover:bg-muted/70'
                  }`}
                >
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-foreground text-[13px]">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {format(new Date(conv.updated_at), 'dd/MM/yy HH:mm')}
                    </p>
                  </div>
                </button>
              ))}
              {pastConversations.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-6">אין שיחות קודמות</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages / Welcome area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">טוען שיחה...</span>
              </div>
            </div>
          ) : !hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full space-y-8 max-w-2xl mx-auto">
              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4"
              >
                <div className="relative mx-auto w-fit">
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/15">
                    <Sparkles className="h-9 w-9 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-background flex items-center justify-center">
                    <Zap className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    pDage AI
                  </h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    העוזר החכם שלך לתיקון ליקויים במסמכים ביטוחיים ופיננסיים
                  </p>
                </div>
              </motion.div>

              {/* Quick actions grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full"
              >
                {quickActions.map((action, i) => (
                  <motion.button
                    key={action.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    onClick={() => navigate(action.path)}
                    className="group flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl border border-border/60 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 bg-card"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold text-foreground block">{action.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:block mt-0.5">{action.desc}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* Recent jobs */}
              {recentJobs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="w-full space-y-2.5"
                >
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <p className="text-xs font-semibold text-muted-foreground/70">עבודות אחרונות</p>
                  </div>
                  <div className="space-y-1.5">
                    {recentJobs.map(job => {
                      const customer = (job as any).pdage_customers as any;
                      return (
                        <button
                          key={job.id}
                          onClick={() => navigate(`/app/pdage/job/${job.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-card hover:shadow-sm transition-all text-right group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                            <FileText className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {customer?.full_name || 'ללא לקוח'}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 truncate">{job.original_file_name}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] shrink-0 border ${statusColors[job.status] || ''}`}>
                            {statusLabels[job.status] || job.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Past conversations */}
              {pastConversations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-full space-y-2.5"
                >
                  <div className="flex items-center gap-2 px-1">
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <p className="text-xs font-semibold text-muted-foreground/70">שיחות אחרונות</p>
                  </div>
                  <div className="space-y-1.5">
                    {pastConversations.slice(0, 3).map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-card hover:shadow-sm transition-all text-right group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/8 transition-colors">
                          <MessageCircle className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {format(new Date(conv.updated_at), 'dd/MM/yy HH:mm')}
                          </p>
                        </div>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </button>
                    ))}
                    {pastConversations.length > 3 && (
                      <button
                        onClick={() => setShowHistory(true)}
                        className="w-full text-xs text-primary hover:text-primary/80 font-medium py-2 transition-colors"
                      >
                        הצג את כל השיחות ({pastConversations.length})
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Suggestions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="w-full space-y-2.5"
              >
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <p className="text-xs font-semibold text-muted-foreground/70">שאל אותי...</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.04 }}
                      onClick={() => handleSend(s)}
                      className="text-xs px-4 py-2.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-sm"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Chat messages */
            <div className="space-y-5 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/10'
                      : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-md shadow-sm shadow-primary/10'
                      : 'bg-card border border-border/50 rounded-tl-md shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-muted/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md">
                        <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            {/* Action pills */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={`gap-1.5 shrink-0 text-xs h-8 rounded-lg border-border/60 ${showHistory ? 'bg-primary/8 border-primary/20 text-primary' : ''}`}
              >
                <Clock className="h-3.5 w-3.5" />
                שיחות קודמות
              </Button>
              {hasMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startNewConversation}
                  className="gap-1.5 shrink-0 text-xs h-8 rounded-lg border-border/60"
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
                  className="gap-1.5 shrink-0 text-xs h-8 rounded-lg border-border/60"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2.5 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="שאל שאלה מקצועית, בקש עזרה בתיקון, או נווט במערכת..."
                  rows={1}
                  className="resize-none min-h-[48px] max-h-[140px] text-sm rounded-xl border-border/60 bg-card shadow-sm focus-visible:ring-primary/20 pl-3 pr-4"
                />
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground/40 text-center mt-2.5">
              pDage AI · עוזר חכם לסוכני ביטוח ופיננסים
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
