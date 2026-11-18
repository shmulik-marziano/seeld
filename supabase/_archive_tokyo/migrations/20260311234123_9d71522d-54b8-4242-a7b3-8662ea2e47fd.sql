-- Add link_token to execution_summaries for public sharing
ALTER TABLE public.execution_summaries 
  ADD COLUMN IF NOT EXISTS link_token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text),
  ADD COLUMN IF NOT EXISTS link_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz DEFAULT NULL;

-- Allow anon to read execution summaries by token (for client portal)
CREATE POLICY "Public can read exec summary by token" ON public.execution_summaries
FOR SELECT TO anon
USING (link_token IS NOT NULL AND status != 'draft' AND (link_expires_at IS NULL OR link_expires_at > now()));

-- Allow anon to read exec summary items via summary token
CREATE POLICY "Public can read exec items by token" ON public.execution_summary_items
FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM execution_summaries es
  WHERE es.id = execution_summary_items.execution_summary_id
  AND es.link_token IS NOT NULL
  AND es.status != 'draft'
  AND (es.link_expires_at IS NULL OR es.link_expires_at > now())
));

-- Allow anon to read products/recommendations linked via execution summaries
-- (already have anon policies via client_access_links, but we need them via exec summaries too)
