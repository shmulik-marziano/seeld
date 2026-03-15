-- Allow anon to update recommendation_summaries when accessed via valid link_token
-- This enables the portal to mark summaries as opened and submitted
CREATE POLICY "Public portal update summary"
ON public.recommendation_summaries
FOR UPDATE
TO anon
USING (
  link_token IS NOT NULL 
  AND status <> 'draft'
  AND (link_expires_at IS NULL OR link_expires_at > now())
)
WITH CHECK (
  link_token IS NOT NULL 
  AND (link_expires_at IS NULL OR link_expires_at > now())
);