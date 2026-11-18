-- The agent app's leads page reads insurance_leads and pension_analysis_leads,
-- but both tables only ever had INSERT policies (the public site submitting).
-- Result: an authenticated agent saw zero leads. Grant agents (profiles with
-- role = 'admin') SELECT + UPDATE so the leads queue is visible and manageable.
--
-- NOTE: profiles' INSERT policy only checks user_id, not role — any signed-up
-- user could self-insert an 'admin' profile. Tracked separately; this migration
-- does not widen that hole, it reuses the same gate the rest of the app trusts.

CREATE POLICY "Agents can view insurance leads"
  ON public.insurance_leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Agents can update insurance leads"
  ON public.insurance_leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Agents can view pension leads"
  ON public.pension_analysis_leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Agents can update pension leads"
  ON public.pension_analysis_leads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
