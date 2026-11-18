-- 1. Agencies table
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  entity_type text DEFAULT 'סוכנות ביטוח',
  phone text,
  email text,
  logo_url text,
  primary_color text DEFAULT '#3d6b4f',
  secondary_color text,
  accent_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text,
  license_number text,
  role text NOT NULL DEFAULT 'agent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Add monthly_deposit to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS monthly_deposit numeric;

-- 4. Security definer function to get user agency
CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 5. Agencies RLS
CREATE POLICY "Authenticated can insert agencies"
ON public.agencies FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users view own agency"
ON public.agencies FOR SELECT TO authenticated
USING (id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Users update own agency"
ON public.agencies FOR UPDATE TO authenticated
USING (id = public.get_user_agency_id(auth.uid()));

-- 6. Profiles RLS
CREATE POLICY "Users insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- 7. Updated_at triggers
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();