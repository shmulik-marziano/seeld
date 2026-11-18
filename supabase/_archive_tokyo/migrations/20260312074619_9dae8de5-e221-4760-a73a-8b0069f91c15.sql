
-- Create admin profile
INSERT INTO public.profiles (user_id, agency_id, full_name, phone, license_number, role)
VALUES (
  '28512734-ff3a-4b06-866a-94ece6c0714c',
  'ac98bd13-5953-4742-a20e-d9b42cd4b90e',
  'שמואל מרציאנו',
  '0523097444',
  '000183666',
  'admin'
);

-- Fix all RESTRICTIVE policies on agencies to be PERMISSIVE
DROP POLICY IF EXISTS "Users view own agency" ON public.agencies;
CREATE POLICY "Users view own agency" ON public.agencies FOR SELECT TO authenticated
USING (id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Users update own agency" ON public.agencies;
CREATE POLICY "Users update own agency" ON public.agencies FOR UPDATE TO authenticated
USING (id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert first agency" ON public.agencies;
CREATE POLICY "Authenticated can insert first agency" ON public.agencies FOR INSERT TO authenticated
WITH CHECK (NOT user_has_profile(auth.uid()));

-- Fix profiles policies to be PERMISSIVE
DROP POLICY IF EXISTS "Users view agency profiles" ON public.profiles;
CREATE POLICY "Users view agency profiles" ON public.profiles FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Fix customers policies
DROP POLICY IF EXISTS "Agency members can view customers" ON public.customers;
CREATE POLICY "Agency members can view customers" ON public.customers FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert customers" ON public.customers;
CREATE POLICY "Agency members can insert customers" ON public.customers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update customers" ON public.customers;
CREATE POLICY "Agency members can update customers" ON public.customers FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete customers" ON public.customers;
CREATE POLICY "Agency members can delete customers" ON public.customers FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix products policies
DROP POLICY IF EXISTS "Agency members can view products" ON public.products;
CREATE POLICY "Agency members can view products" ON public.products FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert products" ON public.products;
CREATE POLICY "Agency members can insert products" ON public.products FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update products" ON public.products;
CREATE POLICY "Agency members can update products" ON public.products FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete products" ON public.products;
CREATE POLICY "Agency members can delete products" ON public.products FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix recommendations policies
DROP POLICY IF EXISTS "Agency members can view recommendations" ON public.recommendations;
CREATE POLICY "Agency members can view recommendations" ON public.recommendations FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert recommendations" ON public.recommendations;
CREATE POLICY "Agency members can insert recommendations" ON public.recommendations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update recommendations" ON public.recommendations;
CREATE POLICY "Agency members can update recommendations" ON public.recommendations FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete recommendations" ON public.recommendations;
CREATE POLICY "Agency members can delete recommendations" ON public.recommendations FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix activity_log policies
DROP POLICY IF EXISTS "Agency members can view activity" ON public.activity_log;
CREATE POLICY "Agency members can view activity" ON public.activity_log FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert activity" ON public.activity_log;
CREATE POLICY "Agency members can insert activity" ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

-- Fix reasoning_bank policies
DROP POLICY IF EXISTS "Agency members can view reasoning" ON public.reasoning_bank;
CREATE POLICY "Agency members can view reasoning" ON public.reasoning_bank FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert reasoning" ON public.reasoning_bank;
CREATE POLICY "Agency members can insert reasoning" ON public.reasoning_bank FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update reasoning" ON public.reasoning_bank;
CREATE POLICY "Agency members can update reasoning" ON public.reasoning_bank FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete reasoning" ON public.reasoning_bank;
CREATE POLICY "Agency members can delete reasoning" ON public.reasoning_bank FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix recommendation_summaries policies
DROP POLICY IF EXISTS "Agency members can view summaries" ON public.recommendation_summaries;
CREATE POLICY "Agency members can view summaries" ON public.recommendation_summaries FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert summaries" ON public.recommendation_summaries;
CREATE POLICY "Agency members can insert summaries" ON public.recommendation_summaries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update summaries" ON public.recommendation_summaries;
CREATE POLICY "Agency members can update summaries" ON public.recommendation_summaries FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete summaries" ON public.recommendation_summaries;
CREATE POLICY "Agency members can delete summaries" ON public.recommendation_summaries FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix execution_summaries policies
DROP POLICY IF EXISTS "Agency members can view exec summaries" ON public.execution_summaries;
CREATE POLICY "Agency members can view exec summaries" ON public.execution_summaries FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert exec summaries" ON public.execution_summaries;
CREATE POLICY "Agency members can insert exec summaries" ON public.execution_summaries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update exec summaries" ON public.execution_summaries;
CREATE POLICY "Agency members can update exec summaries" ON public.execution_summaries FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete exec summaries" ON public.execution_summaries;
CREATE POLICY "Agency members can delete exec summaries" ON public.execution_summaries FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix execution_summary_items policies
DROP POLICY IF EXISTS "Agency members can manage exec items" ON public.execution_summary_items;
CREATE POLICY "Agency members can manage exec items" ON public.execution_summary_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM execution_summaries es WHERE es.id = execution_summary_items.execution_summary_id AND es.agency_id = get_user_agency_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM execution_summaries es WHERE es.id = execution_summary_items.execution_summary_id AND es.agency_id = get_user_agency_id(auth.uid())));

-- Fix client_access_links policies
DROP POLICY IF EXISTS "Agency members can view links" ON public.client_access_links;
CREATE POLICY "Agency members can view links" ON public.client_access_links FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert links" ON public.client_access_links;
CREATE POLICY "Agency members can insert links" ON public.client_access_links FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update links" ON public.client_access_links;
CREATE POLICY "Agency members can update links" ON public.client_access_links FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete links" ON public.client_access_links;
CREATE POLICY "Agency members can delete links" ON public.client_access_links FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

-- Fix source_files policies
DROP POLICY IF EXISTS "Agency members can view source files" ON public.source_files;
CREATE POLICY "Agency members can view source files" ON public.source_files FOR SELECT TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can insert source files" ON public.source_files;
CREATE POLICY "Agency members can insert source files" ON public.source_files FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Agency members can update source files" ON public.source_files;
CREATE POLICY "Agency members can update source files" ON public.source_files FOR UPDATE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));

DROP POLICY IF EXISTS "Agency members can delete source files" ON public.source_files;
CREATE POLICY "Agency members can delete source files" ON public.source_files FOR DELETE TO authenticated
USING (agency_id = get_user_agency_id(auth.uid()));
