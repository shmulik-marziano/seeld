
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  id_type TEXT NOT NULL DEFAULT 'תעודת זהות',
  id_number TEXT NOT NULL,
  birth_date DATE,
  gender TEXT DEFAULT 'זכר',
  marital_status TEXT DEFAULT 'רווק/ה',
  mobile_phone TEXT NOT NULL,
  other_phone TEXT,
  email TEXT,
  city TEXT,
  street TEXT,
  house_number TEXT,
  apartment_number TEXT,
  po_box TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'ישראל',
  source TEXT,
  internal_notes TEXT,
  status TEXT NOT NULL DEFAULT 'חדש',
  next_follow_up DATE,
  employment_status TEXT,
  occupation TEXT,
  profession TEXT,
  position TEXT,
  monthly_income NUMERIC,
  annual_income NUMERIC,
  bank TEXT,
  branch TEXT,
  account_number TEXT,
  account_type TEXT,
  tax_resident BOOLEAN DEFAULT true,
  us_citizen BOOLEAN DEFAULT false,
  birth_country TEXT,
  id_issue_date DATE,
  is_confidential BOOLEAN DEFAULT false,
  health_fund TEXT,
  supplementary_insurance TEXT,
  height NUMERIC,
  weight NUMERIC,
  bmi NUMERIC,
  is_smoker BOOLEAN DEFAULT false,
  cigarettes_per_day INTEGER,
  was_smoker BOOLEAN DEFAULT false,
  quit_year INTEGER,
  medical_advice_to_quit BOOLEAN DEFAULT false,
  medical_details TEXT,
  medications TEXT,
  hospitalizations TEXT,
  surgeries TEXT,
  pre_existing_conditions TEXT,
  dangerous_hobbies TEXT,
  spouse_name TEXT,
  number_of_children INTEGER,
  beneficiaries TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete their own customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (auth.uid() = agent_id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'כסף',
  company TEXT,
  product_type TEXT,
  sub_description TEXT,
  policy_number TEXT,
  product_number TEXT,
  is_active BOOLEAN DEFAULT true,
  monthly_premium NUMERIC,
  accumulation NUMERIC,
  track TEXT,
  management_fee_deposit NUMERIC,
  management_fee_accumulation NUMERIC,
  return_year NUMERIC,
  return_3_years NUMERIC,
  phase TEXT NOT NULL DEFAULT 'פעיל',
  notes TEXT,
  manually_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own products"
  ON public.products FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own products"
  ON public.products FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete their own products"
  ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = agent_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recommendations table
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  current_state TEXT,
  rationale TEXT NOT NULL,
  based_on TEXT,
  improvement TEXT,
  action_type TEXT NOT NULL DEFAULT 'הוספה',
  requires_quote BOOLEAN DEFAULT false,
  decision_status TEXT NOT NULL DEFAULT 'טיוטה',
  next_step TEXT,
  missing_for_execution TEXT,
  execution_note TEXT,
  execution_status TEXT,
  customer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own recommendations"
  ON public.recommendations FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert their own recommendations"
  ON public.recommendations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own recommendations"
  ON public.recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete their own recommendations"
  ON public.recommendations FOR DELETE TO authenticated
  USING (auth.uid() = agent_id);

CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Source files table
CREATE TABLE public.source_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'מסלקה',
  file_name TEXT NOT NULL,
  file_path TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analysis_status TEXT NOT NULL DEFAULT 'ממתין'
);

ALTER TABLE public.source_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their source files"
  ON public.source_files FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID,
  product_id UUID,
  recommendation_id UUID,
  title TEXT NOT NULL,
  detail TEXT,
  level TEXT NOT NULL DEFAULT 'מידע',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own activity"
  ON public.activity_log FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert activity"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

-- Client access links for public portal
CREATE TABLE public.client_access_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_access_links ENABLE ROW LEVEL SECURITY;

-- Agents manage their own links
CREATE POLICY "Agents can manage their links"
  ON public.client_access_links FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Public read for valid tokens (anonymous access for client portal)
CREATE POLICY "Public can read active links by token"
  ON public.client_access_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Public access policies for client portal (anon can read customer data via link)
CREATE POLICY "Public portal read customers"
  ON public.customers FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.client_access_links
      WHERE client_access_links.customer_id = customers.id
        AND client_access_links.is_active = true
        AND (client_access_links.expires_at IS NULL OR client_access_links.expires_at > now())
    )
  );

CREATE POLICY "Public portal read recommendations"
  ON public.recommendations FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.client_access_links
      WHERE client_access_links.customer_id = recommendations.customer_id
        AND client_access_links.is_active = true
        AND (client_access_links.expires_at IS NULL OR client_access_links.expires_at > now())
    )
  );

-- Allow anon to update recommendation decisions from client portal
CREATE POLICY "Public portal update recommendation decisions"
  ON public.recommendations FOR UPDATE TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.client_access_links
      WHERE client_access_links.customer_id = recommendations.customer_id
        AND client_access_links.is_active = true
        AND (client_access_links.expires_at IS NULL OR client_access_links.expires_at > now())
    )
  );

CREATE POLICY "Public portal read products"
  ON public.products FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.client_access_links
      WHERE client_access_links.customer_id = products.customer_id
        AND client_access_links.is_active = true
        AND (client_access_links.expires_at IS NULL OR client_access_links.expires_at > now())
    )
  );

-- Storage bucket for source files
INSERT INTO storage.buckets (id, name, public) VALUES ('source-files', 'source-files', false);

CREATE POLICY "Agents can upload source files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'source-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Agents can view their source files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'source-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Agents can delete their source files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'source-files' AND auth.uid()::text = (storage.foldername(name))[1]);
