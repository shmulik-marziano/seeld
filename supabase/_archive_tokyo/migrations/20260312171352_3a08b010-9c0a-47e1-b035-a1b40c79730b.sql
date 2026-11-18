
-- Fix 1: Tighten chat_conversations SELECT to session-based filtering
DROP POLICY IF EXISTS "Anyone can view their own conversations by session" ON chat_conversations;
CREATE POLICY "Users can view their session conversations"
ON chat_conversations FOR SELECT
USING (
  session_id = COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
);

-- Fix 2: Tighten chat_messages SELECT to only messages from user's session conversations
DROP POLICY IF EXISTS "Anyone can view messages from any conversation" ON chat_messages;
CREATE POLICY "Users can view their session messages"
ON chat_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM chat_conversations 
    WHERE session_id = COALESCE(
      current_setting('request.headers', true)::json->>'x-session-id',
      ''
    )
  )
);

-- Fix 3: Remove public read on onboarding_submissions (admin should use service role)
DROP POLICY IF EXISTS "Public can read onboarding submissions" ON onboarding_submissions;
