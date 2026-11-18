-- Tighten agencies INSERT: only allow if user doesn't already have a profile/agency
DROP POLICY IF EXISTS "Authenticated can insert agencies" ON public.agencies;
CREATE POLICY "Authenticated can insert first agency"
ON public.agencies FOR INSERT TO authenticated
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);