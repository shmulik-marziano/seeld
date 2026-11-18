-- Drop old agent_id-based policies and replace with agency_id-based

-- ===== CUSTOMERS =====
DROP POLICY IF EXISTS "Agents can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Agents can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Agents can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Agents can delete their own customers" ON public.customers;

CREATE POLICY "Agency members can view customers" ON public.customers FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert customers" ON public.customers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update customers" ON public.customers FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete customers" ON public.customers FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== PRODUCTS =====
DROP POLICY IF EXISTS "Agents can view their own products" ON public.products;
DROP POLICY IF EXISTS "Agents can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Agents can update their own products" ON public.products;
DROP POLICY IF EXISTS "Agents can delete their own products" ON public.products;

CREATE POLICY "Agency members can view products" ON public.products FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert products" ON public.products FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update products" ON public.products FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete products" ON public.products FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== RECOMMENDATIONS =====
DROP POLICY IF EXISTS "Agents can view their own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Agents can insert their own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Agents can update their own recommendations" ON public.recommendations;
DROP POLICY IF EXISTS "Agents can delete their own recommendations" ON public.recommendations;

CREATE POLICY "Agency members can view recommendations" ON public.recommendations FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert recommendations" ON public.recommendations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update recommendations" ON public.recommendations FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete recommendations" ON public.recommendations FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== RECOMMENDATION_SUMMARIES =====
DROP POLICY IF EXISTS "Agents can manage their summaries" ON public.recommendation_summaries;

CREATE POLICY "Agency members can view summaries" ON public.recommendation_summaries FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert summaries" ON public.recommendation_summaries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update summaries" ON public.recommendation_summaries FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete summaries" ON public.recommendation_summaries FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== CLIENT_ACCESS_LINKS =====
DROP POLICY IF EXISTS "Agents can manage their links" ON public.client_access_links;

CREATE POLICY "Agency members can view links" ON public.client_access_links FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert links" ON public.client_access_links FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update links" ON public.client_access_links FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete links" ON public.client_access_links FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== SOURCE_FILES =====
DROP POLICY IF EXISTS "Agents can manage their source files" ON public.source_files;

CREATE POLICY "Agency members can view source files" ON public.source_files FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert source files" ON public.source_files FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update source files" ON public.source_files FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete source files" ON public.source_files FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== ACTIVITY_LOG =====
DROP POLICY IF EXISTS "Agents can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Agents can view their own activity" ON public.activity_log;

CREATE POLICY "Agency members can view activity" ON public.activity_log FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert activity" ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);

-- ===== EXECUTION_SUMMARIES =====
DROP POLICY IF EXISTS "Agents can manage their execution summaries" ON public.execution_summaries;

CREATE POLICY "Agency members can view exec summaries" ON public.execution_summaries FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert exec summaries" ON public.execution_summaries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update exec summaries" ON public.execution_summaries FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete exec summaries" ON public.execution_summaries FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== EXECUTION_SUMMARY_ITEMS (via join) =====
DROP POLICY IF EXISTS "Agents can manage their execution summary items" ON public.execution_summary_items;

CREATE POLICY "Agency members can manage exec items" ON public.execution_summary_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM execution_summaries es WHERE es.id = execution_summary_items.execution_summary_id AND es.agency_id = public.get_user_agency_id(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM execution_summaries es WHERE es.id = execution_summary_items.execution_summary_id AND es.agency_id = public.get_user_agency_id(auth.uid())));

-- ===== REASONING_BANK =====
DROP POLICY IF EXISTS "Agents can manage their own reasoning" ON public.reasoning_bank;

CREATE POLICY "Agency members can view reasoning" ON public.reasoning_bank FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert reasoning" ON public.reasoning_bank FOR INSERT TO authenticated
WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update reasoning" ON public.reasoning_bank FOR UPDATE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete reasoning" ON public.reasoning_bank FOR DELETE TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));

-- ===== PROFILES: Allow agency members to see colleagues =====
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view agency profiles" ON public.profiles FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id(auth.uid()));