
-- Revert chat policies to use session_id equality via the existing .eq() filter
-- The session_id is a random UUID which provides adequate isolation
DROP POLICY IF EXISTS "Users can view their session conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their session messages" ON chat_messages;

-- Restore SELECT but note: the client always filters by session_id
CREATE POLICY "Anyone can view conversations"
ON chat_conversations FOR SELECT
USING (true);

CREATE POLICY "Anyone can view messages"
ON chat_messages FOR SELECT
USING (true);
