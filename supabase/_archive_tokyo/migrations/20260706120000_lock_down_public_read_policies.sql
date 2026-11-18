-- Lock down world-readable SELECT policies found in the connections audit.
-- Applied to production 2026-07-06 via MCP (migration: lock_down_public_read_policies).

-- Chat RPCs are SECURITY DEFINER and enforce session ownership; the
-- world-readable SELECT policies let anyone dump every visitor's chat.
DROP POLICY IF EXISTS "Anyone can view messages from any conversation" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can view their own conversations by session" ON public.chat_conversations;

-- Onboarding submissions contain full PII (names, IDs, signatures).
DROP POLICY IF EXISTS "Public can read onboarding submissions" ON public.onboarding_submissions;
CREATE POLICY "Authenticated can read onboarding submissions"
  ON public.onboarding_submissions FOR SELECT TO authenticated USING (true);

-- Internal business data not used by the public site: authenticated only.
DROP POLICY IF EXISTS "master_prompts_read" ON public.master_prompts;
CREATE POLICY "master_prompts_read_auth" ON public.master_prompts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "file_index_read" ON public.file_index;
CREATE POLICY "file_index_read_auth" ON public.file_index FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_agent_agreements_anon" ON public.agent_agreements;
CREATE POLICY "read_agent_agreements_auth" ON public.agent_agreements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_commission_rates_anon" ON public.commission_rates;
CREATE POLICY "read_commission_rates_auth" ON public.commission_rates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_clawback_rules_anon" ON public.clawback_rules;
CREATE POLICY "read_clawback_rules_auth" ON public.clawback_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_transfer_bonus_rules_anon" ON public.transfer_bonus_rules;
CREATE POLICY "read_transfer_bonus_rules_auth" ON public.transfer_bonus_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read_management_fee_minimums_anon" ON public.management_fee_minimums;
CREATE POLICY "read_management_fee_minimums_auth" ON public.management_fee_minimums FOR SELECT TO authenticated USING (true);

-- Note: the cma-sync cron jobs (jobid 1,2,5) were failing since March on an
-- unset app.settings.supabase_url GUC; rescheduled in production to call the
-- public (verify_jwt=false) functions with a hardcoded URL and no auth header.
