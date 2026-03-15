
-- Chat conversations table
CREATE TABLE public.pdage_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.correction_jobs(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'שיחה חדשה',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pdage_chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat conversations"
  ON public.pdage_chat_conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chat messages table
CREATE TABLE public.pdage_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.pdage_chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pdage_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages"
  ON public.pdage_chat_messages FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pdage_chat_conversations c
    WHERE c.id = pdage_chat_messages.conversation_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pdage_chat_conversations c
    WHERE c.id = pdage_chat_messages.conversation_id AND c.user_id = auth.uid()
  ));

-- Auto-update updated_at
CREATE TRIGGER update_chat_conversation_timestamp
  BEFORE UPDATE ON public.pdage_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
