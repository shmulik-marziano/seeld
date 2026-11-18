-- Fix agencies INSERT policy to use security definer function
CREATE OR REPLACE FUNCTION public.user_has_profile(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id)
$$;

-- Drop and recreate the agencies INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert first agency" ON public.agencies;
CREATE POLICY "Authenticated can insert first agency" ON public.agencies
FOR INSERT TO authenticated
WITH CHECK (NOT public.user_has_profile(auth.uid()));

-- Also ensure profiles INSERT works for new users
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());