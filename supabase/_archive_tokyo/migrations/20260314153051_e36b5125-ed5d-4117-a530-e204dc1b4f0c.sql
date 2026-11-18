
CREATE TABLE public.user_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type text NOT NULL,
  policy_name text NOT NULL,
  policy_number text,
  provider text,
  start_date date,
  end_date date,
  monthly_premium numeric,
  coverage_amount numeric,
  status text NOT NULL DEFAULT 'active',
  details jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own policies" ON public.user_policies
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policies" ON public.user_policies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policies" ON public.user_policies
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policies" ON public.user_policies
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_policies_updated_at
  BEFORE UPDATE ON public.user_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
