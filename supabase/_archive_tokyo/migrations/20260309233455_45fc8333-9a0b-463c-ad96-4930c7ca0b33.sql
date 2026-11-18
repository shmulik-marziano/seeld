
-- Reasoning bank table
CREATE TABLE public.reasoning_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  category text NOT NULL,
  recommendation_type text NOT NULL,
  text text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

ALTER TABLE public.reasoning_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their own reasoning"
  ON public.reasoning_bank FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Add new fields to recommendations per spec
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'חשוב',
  ADD COLUMN IF NOT EXISTS problem_gap text,
  ADD COLUMN IF NOT EXISTS recommended_company text,
  ADD COLUMN IF NOT EXISTS recommended_track text,
  ADD COLUMN IF NOT EXISTS cost_before numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_after numeric(12,2),
  ADD COLUMN IF NOT EXISTS recommendation_type text DEFAULT 'שינוי',
  ADD COLUMN IF NOT EXISTS product_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS advantages text,
  ADD COLUMN IF NOT EXISTS disadvantages text;
