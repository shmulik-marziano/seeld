
-- Create RPC to get conversation by session_id
CREATE OR REPLACE FUNCTION public.get_conversation_by_session(p_session_id text)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.chat_conversations c
  WHERE c.session_id = p_session_id
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

-- Create RPC to get messages by conversation_id and session_id (ensures ownership)
CREATE OR REPLACE FUNCTION public.get_chat_messages(p_conversation_id uuid, p_session_id text)
RETURNS TABLE(role text, content text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT m.role, m.content
  FROM public.chat_messages m
  INNER JOIN public.chat_conversations c ON c.id = m.conversation_id
  WHERE m.conversation_id = p_conversation_id
    AND c.session_id = p_session_id
  ORDER BY m.created_at ASC;
$$;

-- Remove open SELECT policies
DROP POLICY IF EXISTS "Anyone can view conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can view messages" ON chat_messages;
