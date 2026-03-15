-- Allow reading onboarding submissions (admin page uses password-based access, not RLS auth)
CREATE POLICY "Public can read onboarding submissions"
  ON public.onboarding_submissions
  FOR SELECT
  USING (true);