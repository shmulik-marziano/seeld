import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export type ChatMessage = { role: 'user' | 'assistant' | 'system_update'; content: string };

interface UsePdageChatOptions {
  conversationId?: string | null;
  jobId?: string | null;
  autoCreate?: boolean;
}

export function usePdageChat({ conversationId: initialConvId, jobId, autoCreate = true }: UsePdageChatOptions = {}) {
  const { session } = useApp();
  const [conversationId, setConversationId] = useState<string | null>(initialConvId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const pendingSaveRef = useRef<ChatMessage[]>([]);
  const savingRef = useRef(false);

  // Load existing conversation messages
  useEffect(() => {
    if (!conversationId || !session) return;
    let cancelled = false;

    const load = async () => {
      setLoadingHistory(true);
      const { data } = await supabase
        .from('pdage_chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!cancelled && data) {
        setMessages(data.map(m => ({ role: m.role as ChatMessage['role'], content: m.content })));
      }
      if (!cancelled) setLoadingHistory(false);
    };

    load();
    return () => { cancelled = true; };
  }, [conversationId, session]);

  // Create conversation if needed
  const ensureConversation = useCallback(async (firstMessage: string): Promise<string> => {
    if (conversationId) return conversationId;
    if (!session?.user?.id) throw new Error('Not authenticated');

    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
    const { data, error } = await supabase
      .from('pdage_chat_conversations')
      .insert({
        user_id: session.user.id,
        job_id: jobId || null,
        title,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error('Failed to create conversation');
    setConversationId(data.id);
    return data.id;
  }, [conversationId, session, jobId]);

  // Save messages to DB (batched)
  const saveMessages = useCallback(async (convId: string, msgs: ChatMessage[]) => {
    if (msgs.length === 0) return;
    pendingSaveRef.current.push(...msgs);

    if (savingRef.current) return;
    savingRef.current = true;

    try {
      while (pendingSaveRef.current.length > 0) {
        const batch = pendingSaveRef.current.splice(0, pendingSaveRef.current.length);
        const rows = batch
          .filter(m => m.role !== 'system_update')
          .map(m => ({
            conversation_id: convId,
            role: m.role,
            content: m.content,
          }));

        if (rows.length > 0) {
          await supabase.from('pdage_chat_messages').insert(rows);
        }
      }

      // Update conversation title & timestamp
      await supabase
        .from('pdage_chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Stream chat and persist
  const sendMessage = useCallback(async (
    text: string,
    onFieldUpdate?: (key: string, value: string) => void,
  ) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    let convId: string;
    try {
      convId = await ensureConversation(text.trim());
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ שגיאה ביצירת שיחה' }]);
      setIsLoading(false);
      return;
    }

    // Save user message
    await saveMessages(convId, [userMsg]);

    const CHAT_URL = `${SUPABASE_URL}/functions/v1/pdage-chat`;
    let assistantSoFar = '';
    const newMsgsToSave: ChatMessage[] = [];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          jobId: jobId || undefined,
          messages: updatedMessages.filter(m => m.role !== 'system_update'),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'שגיאה לא ידועה' }));
        throw new Error(err.error || `שגיאה ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      const processLine = (line: string): boolean | 'break' => {
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') return false;
        if (!line.startsWith('data: ')) return false;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return true;

        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.field_updates && onFieldUpdate) {
            const updates = parsed.field_updates as { field: string; value: string }[];
            updates.forEach((u: any) => onFieldUpdate(u.field, u.value));

            const fieldLabels: Record<string, string> = {
              customerName: 'שם לקוח', idNumber: 'תעודת זהות', policyNumber: 'מספר פוליסה',
              company: 'חברת ביטוח', productType: 'סוג מוצר', startDate: 'תאריך התחלה',
              endDate: 'תאריך סיום', coverageAmount: 'סכום כיסוי', monthlyPremium: 'פרמיה חודשית',
              beneficiaries: 'מוטבים', additionalNotes: 'הערות נוספות',
            };
            const summary = updates.map((u: any) => `**${fieldLabels[u.field] || u.field}** → ${u.value}`).join('\n');
            setMessages(prev => [...prev, { role: 'system_update', content: summary }]);
            return false;
          }

          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
              }
              return [...prev, { role: 'assistant', content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          return 'break';
        }
        return false;
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          const line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          const result = processLine(line);
          if (result === true) { streamDone = true; break; }
          if (result === 'break') break;
        }
      }

      if (textBuffer.trim()) {
        for (const raw of textBuffer.split('\n')) {
          if (!raw) continue;
          processLine(raw);
        }
      }

      // Save assistant response
      if (assistantSoFar) {
        newMsgsToSave.push({ role: 'assistant', content: assistantSoFar });
      }
    } catch (e: any) {
      const errorMsg: ChatMessage = { role: 'assistant', content: `❌ ${e.message || 'שגיאה בתקשורת עם ה-AI'}` };
      setMessages(prev => [...prev, errorMsg]);
      newMsgsToSave.push(errorMsg);
    } finally {
      setIsLoading(false);
      if (newMsgsToSave.length > 0) {
        await saveMessages(convId!, newMsgsToSave);
      }
    }
  }, [messages, isLoading, ensureConversation, saveMessages, jobId]);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
  }, []);

  const loadConversation = useCallback((id: string) => {
    setConversationId(id);
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    loadingHistory,
    conversationId,
    sendMessage,
    startNewConversation,
    loadConversation,
  };
}
