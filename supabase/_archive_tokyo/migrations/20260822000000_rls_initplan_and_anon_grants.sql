-- Maintenance round, 2026-08-22. NOT YET APPLIED — review before running.
--
-- Two findings from the Supabase advisors, both mechanical:
--
--   1. 97 RLS policies call auth.uid() / auth.jwt() / auth.role() bare, so
--      Postgres re-evaluates the function once per candidate row instead of
--      once per query. Wrapping the call in a scalar subquery turns it into an
--      InitPlan: same value, same semantics, evaluated once. This is Supabase's
--      own documented remedy (lint 0003_auth_rls_initplan).
--      The 32 statements below cover only the tables this project owns: each is
--      created by a migration in this repo AND read by code in this repo. The
--      database is shared with sibling products (skill store, lenny,
--      knowledge/workflow, work orders) — their policies have the same problem
--      and are deliberately left for their owner.
--
--   2. Three SECURITY DEFINER functions, all defined by this project's own
--      migrations, carry EXECUTE for PUBLIC/anon that they never needed.
--      get_chat_messages and get_conversation_by_session are NOT in this list —
--      the public chat bot calls them anonymously on purpose.
--
-- Verify afterwards with:
--   select count(*) from pg_policies where schemaname='public'
--     and (qual ~ 'auth\.(uid|jwt|role)\(\)' or with_check ~ 'auth\.(uid|jwt|role)\(\)')
--     and coalesce(qual,'') !~ 'select auth\.' and coalesce(with_check,'') !~ 'select auth\.';

begin;

-- ── 1. RLS initplan ──────────────────────────────────────────────────────────

ALTER POLICY "Agents can insert activity" ON public.activity_log WITH CHECK (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can view their own activity" ON public.activity_log USING (((select auth.uid()) = agent_id));

ALTER POLICY "Agency members can update" ON public.agencies USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.agency_id = agencies.id)))));
ALTER POLICY "Authenticated can insert first agency" ON public.agencies WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid()))))));

ALTER POLICY "Anyone can read published posts" ON public.blog_posts USING (((status = 'published'::text) OR ((select auth.uid()) IS NOT NULL)));

ALTER POLICY "Service write cma_funds" ON public.cma_funds USING (((select auth.role()) = 'service_role'::text));

ALTER POLICY "Users can view their own submissions" ON public.contact_submissions USING (((select auth.uid()) = user_id));

ALTER POLICY "Agents can delete their own customers" ON public.customers USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can insert their own customers" ON public.customers WITH CHECK (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can update their own customers" ON public.customers USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can view their own customers" ON public.customers USING (((select auth.uid()) = agent_id));
ALTER POLICY "Customers read own record by email" ON public.customers USING ((lower(email) = lower(((select auth.jwt()) ->> 'email'::text))));

-- form_submissions / work_orders are NOT this project's. No migration here
-- creates them and no code here reads them — they belong to a sibling product
-- on the shared database. Their three policies have the same initplan problem;
-- that is for their owner to fix, not us.

ALTER POLICY "Agents can update insurance leads" ON public.insurance_leads USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));
ALTER POLICY "Agents can view insurance leads" ON public.insurance_leads USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Agents can update pension leads" ON public.pension_analysis_leads USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));
ALTER POLICY "Agents can view pension leads" ON public.pension_analysis_leads USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'admin'::text)))));

ALTER POLICY "Agents can delete their own products" ON public.products USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can insert their own products" ON public.products WITH CHECK (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can update their own products" ON public.products USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can view their own products" ON public.products USING (((select auth.uid()) = agent_id));

ALTER POLICY "Admins can delete agency profiles" ON public.profiles USING (((EXISTS ( SELECT 1
   FROM profiles admin_profile
  WHERE ((admin_profile.user_id = (select auth.uid())) AND (admin_profile.role = 'admin'::text) AND (admin_profile.agency_id = profiles.agency_id)))) AND (user_id <> (select auth.uid()))));
ALTER POLICY "Users can insert their own profile" ON public.profiles WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own profile" ON public.profiles USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own profile" ON public.profiles USING (((select auth.uid()) = user_id));

ALTER POLICY "Agents can delete their own recommendations" ON public.recommendations USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can insert their own recommendations" ON public.recommendations WITH CHECK (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can update their own recommendations" ON public.recommendations USING (((select auth.uid()) = agent_id));
ALTER POLICY "Agents can view their own recommendations" ON public.recommendations USING (((select auth.uid()) = agent_id));

ALTER POLICY "Users can delete their own calculations" ON public.saved_calculations USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own calculations" ON public.saved_calculations WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own calculations" ON public.saved_calculations USING (((select auth.uid()) = user_id));

ALTER POLICY "Agents can manage their source files" ON public.source_files USING (((select auth.uid()) = agent_id)) WITH CHECK (((select auth.uid()) = agent_id));

-- ── 2. Over-broad EXECUTE on SECURITY DEFINER functions ──────────────────────

-- RLS helper: reads profiles as the definer. anon could pass any user id and
-- learn which agency that user belongs to.
REVOKE EXECUTE ON FUNCTION public.get_user_agency_id(uuid) FROM PUBLIC, anon;

-- Existence probe over profiles — enumeration primitive for anon.
REVOKE EXECUTE ON FUNCTION public.user_has_profile(uuid) FROM PUBLIC, anon;

-- Auth trigger function; never a legitimate RPC target.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ...but the on_auth_user_created trigger on auth.users runs as
-- supabase_auth_admin, and that role held EXECUTE only through PUBLIC. Without
-- this grant the revoke above breaks signup. Applied as a follow-up migration
-- (restore_auth_admin_execute_on_handle_new_user) after the first push; kept
-- here so a fresh `db reset` never reproduces the broken window.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Not touched, though the advisor flags them: rls_auto_enable(), category_slug()
-- and name_slug() are not created by any migration in this repo. They are
-- database-wide hygiene installed by another owner on the shared project.

commit;

-- ── Deliberately NOT in this migration ───────────────────────────────────────
--
-- * 17 SECURITY DEFINER views (v_skill_*, knowledge_*, v_workflow_*, lenny_*,
--   fund_dim, fund_last_period, session_init, v_active_executions …). Flipping
--   them to security_invoker is the right end state, but several are read by
--   the sibling products in this org and some may be definer on purpose to
--   expose aggregates to anon. Needs a per-view decision, not a sweep.
-- * 62 tables with RLS enabled and no policy. Harmless today (deny-all), but
--   each one is either an oversight or a table that should not be in the API.
-- * pg_trgm installed in public; cma_funds_latest selectable by anon.
-- * 68 unindexed foreign keys and 72 unused indexes.
