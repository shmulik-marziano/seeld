-- Recommendation summaries (versions)
CREATE TABLE public.recommendation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  parent_version_id uuid REFERENCES public.recommendation_summaries(id),
  status text NOT NULL DEFAULT 'draft',
  link_token text UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'::text),
  link_expires_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  client_submitted_at timestamptz,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (customer_id, version)
);

-- Add summary_id to recommendations
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS summary_id uuid REFERENCES public.recommendation_summaries(id);
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.recommendation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS: agents manage their own summaries
CREATE POLICY "Agents can manage their summaries" ON public.recommendation_summaries
  FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- RLS: anon can read summaries via active link token
CREATE POLICY "Public can read summaries by token" ON public.recommendation_summaries
  FOR SELECT TO anon
  USING (
    link_token IS NOT NULL
    AND status != 'draft'
    AND (link_expires_at IS NULL OR link_expires_at > now())
  );

-- Trigger for updated_at
CREATE TRIGGER update_recommendation_summaries_updated_at
  BEFORE UPDATE ON public.recommendation_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();