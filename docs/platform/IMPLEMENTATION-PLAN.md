# תוכנית היישום (נגזרת מ-FOUNDATION.md גרסה 2.2, 18.11.2026)

המסמך הזה הוא ההוראות המדויקות לסוכני היישום. SQL ובדיקות כאן גוברים על ניסוחים כלליים במסמך הבסיס.

## משימות מקבילות

### T0 database v2.2
- קבצים בבעלות: supabase/migrations/20261119090000..20261119091400 (15 files: m01..m14 from scratchpad r1, plus the new 091400_round2_fixes.sql); supabase/tests/00_policy_lint (new, 0029 list of 15), 01/02 edits, 03 rewrite, 04 one check, 05-09 new; supabase/tests/replay-local.sh. Never edits the 8 applied files.
- תלות: Authoring: none. Hosted apply: owner Vault secrets before 091100/091300; hook after 090600; add 'staff' to the exposed schemas after 090300.
- קבלה: replay-local.sh exits 0 with zero not ok across 00-09 on 8+15 migrations, including the round-2 checks (alert undeliverable frees dedupe and clears degraded after 24h; edge_cron_enabled gate; client invitation 403; admin_staff_enable; 5,001 same-timestamp auth rows copied; a bad customer row skipped without an exception; content_dump role). Applied first to a branch, where get_advisors shows only the documented 0028/0029 list. Then applied to seeld-site through migrate.yml after the owner Vault step.

### T1 identity
- קבצים בבעלות: supabase/functions/staff-invite/** (invite, resend, disable = admin_staff_disable + ban_duration '876000h', enable = admin_staff_enable + ban_duration 'none'); extend existing supabase/functions/_shared/auth.ts; agent-app auth screens (TOTP gate, step-up, captchaToken, /app/auth/accept).
- תלות: T0 (090200-091400); owner auth/SMTP/CAPTCHA/hook steps.
- קבלה: Deno tests (401/403/stale-amr 403/invite ok/inviteUserByEmail failure 502 with no core.staff row; enable calls the RPC before the unban). On a branch with the hook enabled: invite works; an invite older than 10 min can be re-sent; after disable, refresh fails; after enable, login works; the break-glass unban (dashboard or SQL) is verified; a client invitation cannot create a user; /auth/v1/settings has no external provider.

### T2 edge functions
- קבצים בבעלות: supabase/functions/lead-intake, notify-worker, chat-bot, fetch-cma-data (rewritten), health; extend the existing _shared (add env.ts, turnstile.ts, resend.ts; keep auth/cors/errors/logger/request/rateLimit/alerts).
- תלות: T0 (090500, 090700, 090800, 091100, 091400); T1 _shared/auth.ts; owner Vault/Edge secrets/Turnstile; owner flips edge_cron_enabled after deploy.
- קבלה: 202 + waitUntil + job_finish contract. lead-intake order: Origin, then canonical payload, then api.lead_replay (read only), then Turnstile, then submit_lead with cf-connecting-ip, then intake_note_reject only after Turnstile passed. Zero DB calls for origin/shape/turnstile rejects. The browser always gets {ok:true} (no id, no duplicate flag; Deno test). The same key with a new turnstile_token replays. The 9th request in 10 min gets 429. Overlapping notify-worker runs never send a row twice (skip locked). fetch-cma-data uses job_continue slices. health returns 3 keys.

### T3 frontend
- קבצים בבעלות: src/integrations/supabase/*; src/lib/leadIntake.ts (treats the response as {ok:true}); all lead forms (canonical fields + allowed payload keys; no national id/health/salary fields); DirectDebit/Onboarding off; /app, /portal, /client, /personal-area off behind VITE_STAFF_APP_ENABLED; PDage removal from src (src/components/pdage, usePdageChat, App/AppContext references); tracks page on source_period; api/*.ts Node + 200-row paging; prerender; types (api,staff).
- תלות: T0, T2 on staging; owner Turnstile site key; owner approval of the PDage file list.
- קבלה: tsc clean; 87 prerender routes; grep finds no national id field and no 'pdage' in src; a double click creates one lead; counts via count=exact; no ipapi.co call; dist free of secrets.

### T4 data load
- קבצים בבעלות: scripts/load/load-content.sql (blog, travel); scripts/load/verify-manifest.mjs; scripts/load/copy-customers.mjs (Tokyo -> private.customers_import in memory, approved column list, batches of 100, p_rows as a bind parameter, never an inline literal, no file). AS EXECUTED (T4, 2026-11-18): no .mjs was written. The copy ran through scripts/migrate/copy-customers.sql as 4 sealed pgp blobs via MCP, before step 24, with the transport key selected into the agent session. This deviates from this contract; see DATA-MIGRATION.md section 2a. The path is retired (095300).
- תלות: T0 (090800, 091000, 091300, 091400); T2 fetch-cma-data; owner Small, Vault PII keys, column approval.
- קבלה: Small before the load; blog 22 + md5; first CMA load, then cma_refresh ran once, cma_board 1,257, company_map 120, tracks active count recorded; customers: received 191, inserted+skipped 191, invalid_ids reviewed with the owner, one decrypt check; legacy leads typed by the owner (no CSV); Disk IO minimum recorded.

### T5 CI, repo hygiene and Vercel
- קבצים בבעלות: First v2 PR: the api-v1/queue-worker resolution per the owner decision (git mv to supabase/_parked or keep and fix); supabase/config.toml from config.proposed.toml; .github/workflows/ci.yml (full gates, subset allowlist, local types, check-secret-scope); migrate.yml (workflow_dispatch, environment production, PROD_MIGRATORS); content-dump.yml (environment backup); edits to the existing site-watch.yml and scripts/health-check.mjs (degraded check behind HEALTH_URL); deploy-vercel.yml workflow_dispatch; vercel.proposed.json; scripts/ci/check-secret-scope.mjs.
- תלות: Owner decisions (api-v1/queue-worker, config.toml); T0 green; owner GitHub Environments.
- קבלה: The first v2 PR is green with full gates (no phase 0); then the owner enables protection. Throwaway PRs are blocked for an old migration, a secret in src, ACAO *, and a DB secret outside an environment job. vitest stays green (edge-shared.test.ts). supabase test db does not treat local_bootstrap.sql as a test. No repository-level DB secret exists.

### T6 runbook
- קבצים בבעלות: docs/platform/RUNBOOK.md (cutover/rollback per 18.3 without any CSV export; first-admin bootstrap; invite resend; disable+ban and enable+unban; break-glass SQL plus unban; admin_alert_resolve and the SQL fallback; edge_cron_enabled day-2 step; kill switch; Vault and PII-key restore; branch Vault warning; day-3 auth verification; weekly Disk IO); docs/platform/FOUNDATION.md from foundation_markdown.
- תלות: T0-T5 on staging; owner Vercel/GitHub steps and remaining decisions.
- קבלה: Staging rehearsal: full smoke; kill-switch drill; an alert driven to undeliverable and degraded clearing after the 24h window (or simulated by moving processed_at); lockout drill only if verified; break-glass drill including unban on a test admin; Instant Rollback < 5 min; degraded=false; site-watch green 24 h after cutover.

## רשימת המיגרציות והשינויים (append-only; את 8 מיגרציות היסוד לא עורכים)

### 1. `supabase/migrations/20261119090000_seal_public_schema.sql`

```sql
UNCHANGED from round 1. Exact SQL is in C:/Users/Lenovo/AppData/Local/Temp/claude/42da58eb77f1548c/be439b72-e8f3-4494-b95f-2ec6cf6e86f6/scratchpad/r1/m01.sql (verified to apply clean after the 8). It revokes the postgres default privileges in public for anon, authenticated and service_role, revokes all on schema public, and recreates private.ensure_rls with the full schema list.
```

בדיקה להוספה:

```
00: no default ACL from postgres to API roles in public; no global default ACL (defaclnamespace = 0); no grants on schema public; probe public.zz_probe gets relrowsecurity and no anon select.
```

### 2. `supabase/migrations/20261119090100_core_agencies.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m02.sql. Contents: core.agencies (seed 5eed0000-0000-4000-8000-000000000001); ops.config defaults (intake/chat true, portal false, tracks_sync_enabled true, stepup 900); core.staff gets agency_id and locked_until; crm.leads gets agency_id, suspect and request_id; private.my_agency_id(); staff_select scoped to the agency; client_accounts_select returns only the caller's own row.
```

בדיקה להוספה:

```
05: manager a2 sees 3 rows (agency A only); agent sees 1; agency-B fixture is not visible. 02: manager staff count = own agency only.
```

### 3. `supabase/migrations/20261119090200_private_helpers_audit.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m03.sql. Contents: private.flag with a per-key default; kill_switch (PT423); is_fresh_mfa; assert_staff; assert_admin_fresh; log_op_check widened to ACTION/ACCESS; audit.access_log and audit.auth_events (append-only, with a source_id unique partial index); private.request_id; log_access; audit_action.
```

בדיקה להוספה:

```
05: stale amr gives PT403 forbidden:admin_fresh_totp; with portal_enabled missing, kill_switch gives PT423; with intake_enabled missing, the call lives; an update on access_log/auth_events gives 42501.
```

### 4. `supabase/migrations/20261119090300_staff_schema_lead_rpc.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m04.sql. Contents: schema staff; drops api.leads; authenticated loses all privileges and usage on crm; view staff.members; staff.leads_list/lead_get (definer, agency-scoped, projected columns, log_access); staff.lead_set_status/assign/note_add/soft_delete with ACTION audit; admin_assert_fresh; admin_config_set allowlist. The owner adds 'staff' to Exposed schemas after this migration.
```

בדיקה להוספה:

```
05: as agent a1, leads_list count = agency A leads; direct crm.leads select gives 42501; the access_log row_count and subject_ids match; lead_get of an agency-B lead gives PT404; aal1 gives PT403; lead_note_add writes an ACTION row without the note text; admin_config_set with an unknown key gives PT400. 02 keeps the consent_at update assertion = 42501.
```

### 5. `supabase/migrations/20261119090400_content_no_delete.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m05.sql. Revokes delete on blog/travel (tables and api views) from authenticated and drops the delete policies.
```

בדיקה להוספה:

```
02: agent and manager delete give 42501; archive by update lives. 00: no DELETE/TRUNCATE/REFERENCES/TRIGGER for API roles.
```

### 6. `supabase/migrations/20261119090500_submit_lead_v2.sql`

```sql
UNCHANGED SQL. Exact SQL: scratchpad r1/m06.sql. Contents: ops.idempotency_keys; ops.intake_payload_keys; private.client_ip (last public hop); private.caller_ip (PT400 invalid_input:client_ip for service_role); api.lead_replay (pure read, no writes: safe before Turnstile); api.intake_note_reject; api.submit_lead v2. CONTRACT CHANGE (edge, not SQL): submit_lead still returns {ok,id,duplicate} to the service caller, but lead-intake forwards only {ok:true} to the browser. intake_note_reject is called only after Turnstile has passed.
```

בדיקה להוספה:

```
03 full rewrite: anon/authenticated 42501; missing p_client_ip PT400; replay; different body PT409; tz key PT400 payload_key; an ID-like value PT400 payload_value; turnstile_token PT400; last public hop 203.0.113.7; intake_enabled=false PT423; PT429; audit has no PII; the ACTION row has actor_role agent. Deno (T2): a duplicate submit with someone else's phone returns a body exactly {ok:true}; an origin-rejected request causes zero DB calls (mocked client asserts no rpc).
```

### 7. `supabase/migrations/20261119090600_auth_hook_invitations.sql`

```sql
UNCHANGED file (scratchpad r1/m07.sql): core.invitations, grants for supabase_auth_admin, private.hook_before_user_created. Its hook body is REPLACED in 20261119091400 so that only kind='staff' invitations are accepted.
```

בדיקה להוספה:

```
07 (as supabase_admin, set local role supabase_auth_admin): no invitation gives 403 plus an auth_events row; open staff invitation gives '{}'; expired gives 403; second open invitation gives 23505; open CLIENT invitation gives 403 (after 091400).
```

### 8. `supabase/migrations/20261119090700_ops_cron_wrapper_outbox_v2.sql`

```sql
UNCHANGED file (scratchpad r1/m08.sql): pg_net; job_runs; alerts; alert_recipients; raise_alert; http_invoke (Vault, 5000 ms); call_function; job_finish; job_continue; outbox v2 (claim with for update skip locked and a 2-minute lock). REPLACED in 091400: ops.outbox_complete (alert dead-letter), ops.call_function (edge_cron_enabled gate), and the alerts status check.
```

בדיקה להוספה:

```
06: vault missing gives 55000 vault_secret_missing (skip if secrets exist); http_invoke has no hard-coded host; claim twice gives 1 then 0; complete(false) gives backoff; attempts=5 gives dead plus an outbox_dead alert; raise_alert dedupe; job_continue on a finished run gives PT404.
```

### 9. `supabase/migrations/20261119090800_service_rpc_surface.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m09.sql. Contents: crm.chat_*; outbox, job and cma api wrappers (deterministic last-row-wins upsert); cma_finish_sync sets cma_refresh_pending; chat_session_touch requires p_client_ip; chat_append PT404; invitation_create/resend; staff_provision takes role and agency from the invitation.
```

בדיקה להוספה:

```
06: duplicate F1 in one batch gives fund_name n2; cma_finish_sync sets cma_refresh_pending; bogus status PT400; chat_append unknown session PT404. 07: invitation_create by agent PT403; second open PT409; staff_provision uses the invitation role and agency; repeat PT409; resend mode 'recovery'.
```

### 10. `supabase/migrations/20261119090900_auth_lockout.sql`

```sql
UNCHANGED file (scratchpad r1/m10.sql): private.staff_role honours locked_until; config auth_failure_actions='' and auth_lock_enabled='false'; ops.copy_auth_events; staff.admin_staff_disable; staff.admin_staff_unlock. REPLACED in 091400: copy_auth_events (tie-break watermark) and admin_staff_disable (the dead last_admin guard is removed: the caller is an active, unlocked admin of the same agency and cannot disable self, so at least one active admin always remains).
```

בדיקה להוספה:

```
07: a locked agent gets staff_role null and 0 leads; two entries with an identical created_at, copied twice, give exactly 2 rows; admin disables self gives PT409 cannot_disable_self; disable agent gives next 'ban_user'. The round-1 claim 'disable the only admin by another admin -> PT409 last_admin' is DROPPED (it was unreachable).
```

### 11. `supabase/migrations/20261119091000_tracks_auto_refresh.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m11.sql. Contents: investment_tracks gets source and source_period; content.refresh_investment_tracks() upserts by fund_id from content.cma_board, hides untouched rows (never deletes) only when at least half of the active rows were touched, otherwise raises tracks_shrink; tracks_sync_enabled flag. The doc now says fund_id everywhere (ADR-36).
```

בדיקה להוספה:

```
06: 3 funds plus an OLD1 track give {'upserted':3,'hidden':1} and source_period 202603; flag off gives {'skipped':'disabled'}. 04: has_column api.investment_tracks.source_period.
```

### 12. `supabase/migrations/20261119091100_watchdog_health_cron.sql`

```sql
UNCHANGED file (scratchpad r1/m12.sql): cron_http_audit; private.health_degraded; ops.watchdog with per-step exception blocks; api.health; staff.ops_health; cron (unschedule cma-refresh-views-daily; schedule notify-worker-tick, cma-sync-weekly, ops-watchdog). The two ops.call_function crons are harmless before day 2 because 091400 makes call_function a no-op until edge_cron_enabled='true'. 091100 and 091400 are applied in the same db push, so at most one tick can fall between them.
```

בדיקה להוספה:

```
06: a retrying outbox row with a fresh watchdog run gives degraded false; timed_out gives no cron_http_failed; status 500 gives an alert; a bogus watermark gives failed_steps ['copy_auth_events'] and the run finishes ok=false; an alert pending 31 min gives degraded true. 07 lock scenarios as in round 1 (agent from 2 ips locked; admin not locked; single ip not locked).
```

### 13. `supabase/migrations/20261119091200_retention_v2.sql`

```sql
UNCHANGED. Exact SQL: scratchpad r1/m13.sql. Contents: lead_retention_enabled false; cleanup for outbox dead 30d, alerts (non-pending including undeliverable 90d; pending >30d purged with a warning), invitations, audit 25 months, leads behind the flag.
```

בדיקה להוספה:

```
08: audit rows at 24 months kept and 26 months purged; idempotency 49h purged; notify-worker run 8d purged; alert sent 91d purged; alert undeliverable 91d purged; invitation retention; soft-deleted lead purged only when the flag is true.
```

### 14. `supabase/migrations/20261119091300_customers_encrypted.sql`

```sql
UNCHANGED file (scratchpad r1/m14.sql): crm.customers; private.vault_secret, national_id_norm, national_id_hmac, pii_encrypt/decrypt; private.customers_import. The import body is REPLACED in 091400 with a pre-filtering version that never raises on a bad row, so no 'Failing row contains' DETAIL with names or phones reaches the Postgres log.
```

בדיקה להוספה:

```
09: create both vault secrets in the transaction (skip if vault is absent); ids '12345678' and '012345678' give inserted 1, skipped 1; decrypt gives '012345678'; service_role/authenticated/anon select gives 42501; a re-run inserts 0.
```

### 15. `supabase/migrations/20261119091400_round2_fixes.sql (NEW, not yet run in a container)`

```sql
-- V2-15 (round 2): alert dead-letter + resolve, staff enable, disable guard, staff-only hook,
-- tie-break auth watermark, edge cron gate, PII-safe customer import, content_dump role.

-- 1. alerts: terminal state for undeliverable alerts (frees the pending dedupe index, ends 'pending > 30 min')
alter table ops.alerts drop constraint alerts_status_check;
alter table ops.alerts add constraint alerts_status_check
  check (status in ('pending', 'sent', 'resolved', 'undeliverable'));

create or replace function ops.outbox_complete(p_id bigint, p_ok boolean, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_attempts int; v_topic text; v_payload jsonb;
begin
  if p_ok then
    update ops.outbox set status = 'sent', processed_at = now(), locked_until = null, last_error = null
     where id = p_id returning topic, payload into v_topic, v_payload;
    if v_topic = 'alert' then
      update ops.alerts set status = 'sent' where id = (v_payload ->> 'alert_id')::bigint and status = 'pending';
    end if;
    return;
  end if;
  select o.attempts, o.topic, o.payload into v_attempts, v_topic, v_payload from ops.outbox o where o.id = p_id;
  if v_attempts is null then return; end if;
  if v_attempts >= 5 then
    update ops.outbox set status = 'dead', processed_at = now(), last_error = left(p_error, 500), locked_until = null where id = p_id;
    if v_topic = 'alert' then
      update ops.alerts set status = 'undeliverable' where id = (v_payload ->> 'alert_id')::bigint and status = 'pending';
    end if;
    -- no new outbox_dead alert for a dead outbox_dead alert (no loop); the 24h dead window keeps health degraded
    if v_topic is distinct from 'alert' or (v_payload ->> 'kind') is distinct from 'outbox_dead' then
      perform ops.raise_alert('critical', 'outbox_dead', 'outbox id=' || p_id || ' is dead after 5 attempts', 'outbox_dead');
    end if;
  else
    update ops.outbox set status = 'pending', last_error = left(p_error, 500), locked_until = null,
           next_attempt_at = now() + (array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours'])[v_attempts]
     where id = p_id;
  end if;
end $$;

create or replace function staff.admin_alert_resolve(p_id bigint)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  if private.my_agency_id() is distinct from (select value::uuid from ops.config where key = 'default_agency_id') then
    raise exception 'forbidden:platform_admin' using errcode = 'PT403';
  end if;
  update ops.alerts set status = 'resolved' where id = p_id and status = 'pending';
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('ops.alerts', p_id::text, array['status'], jsonb_build_object('action', 'admin_alert_resolve'));
  return jsonb_build_object('ok', true);
end $$;

-- 2. disable: the last_admin guard was unreachable (caller is an active admin of the same agency); self guard suffices
create or replace function staff.admin_staff_disable(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh(); v_agency uuid := private.my_agency_id();
begin
  if p_user_id = v_actor then raise exception 'cannot_disable_self' using errcode = 'PT409'; end if;
  update core.staff s set active = false where s.user_id = p_user_id and s.agency_id = v_agency and s.active;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('core.staff', p_user_id::text, array['active'], jsonb_build_object('action', 'admin_staff_disable'));
  return jsonb_build_object('ok', true, 'next', 'ban_user');
end $$;

create or replace function staff.admin_staff_enable(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_admin_fresh();
begin
  update core.staff s set active = true, locked_until = null
   where s.user_id = p_user_id and s.agency_id = private.my_agency_id() and not s.active;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  perform private.audit_action('core.staff', p_user_id::text, array['active', 'locked_until'], jsonb_build_object('action', 'admin_staff_enable'));
  return jsonb_build_object('ok', true, 'next', 'unban_user');
end $$;

revoke all on function staff.admin_staff_disable(uuid), staff.admin_staff_enable(uuid), staff.admin_alert_resolve(bigint) from public, anon;
grant execute on function staff.admin_staff_disable(uuid), staff.admin_staff_enable(uuid), staff.admin_alert_resolve(bigint) to authenticated;

-- 3. hook: staff invitations only until the client portal exists
create or replace function private.hook_before_user_created(event jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_email text := lower(event #>> '{user,email}');
begin
  if v_email is null or not exists (
      select 1 from core.invitations i
       where lower(i.email) = v_email and i.kind = 'staff' and i.expires_at > now() and i.accepted_at is null) then
    insert into audit.auth_events (kind, ok, source) values ('user_created_denied', false, 'hook');
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'ההרשמה בהזמנה בלבד.'));
  end if;
  return '{}'::jsonb;
end $$;

-- 4. auth events: (created_at, id) watermark, so >5000 rows sharing one timestamp can never stall the copy
insert into ops.config (key, value) values ('auth_events_last_id', '00000000-0000-0000-0000-000000000000')
on conflict (key) do nothing;

create or replace function ops.copy_auth_events()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_since timestamptz := coalesce((select value::timestamptz from ops.config where key = 'auth_events_last_at'), now() - interval '1 day');
  v_last uuid := coalesce((select value::uuid from ops.config where key = 'auth_events_last_id'), '00000000-0000-0000-0000-000000000000'::uuid);
  v_fail text[] := array_remove(string_to_array(coalesce((select value from ops.config where key = 'auth_failure_actions'), ''), ','), '');
  v_pepper text := (select value from ops.config where key = 'rate_limit_pepper');
  v_max_at timestamptz; v_max_id uuid; n integer := 0;
begin
  if to_regclass('auth.audit_log_entries') is null then return 0; end if;
  with src as materialized (
    select e.id, e.created_at, e.payload::jsonb as p, to_jsonb(e) ->> 'ip_address' as ip_address
      from auth.audit_log_entries e
     where (e.created_at, e.id) > (v_since, v_last)
     order by e.created_at, e.id
     limit 5000),
  lst as (select s.created_at, s.id from src s order by s.created_at desc, s.id desc limit 1),
  ins as (
    insert into audit.auth_events (at, user_id, kind, ok, ip_hash, source, source_id, payload)
    select s.created_at,
           case when (s.p ->> 'actor_id') ~ '^[0-9a-f-]{36}$' then (s.p ->> 'actor_id')::uuid end,
           coalesce(s.p ->> 'action', 'unknown'),
           not (coalesce(s.p ->> 'action', '') = any (v_fail)),
           case when nullif(s.ip_address, '') is not null
                then extensions.hmac(convert_to(s.ip_address, 'utf8'), convert_to(coalesce(v_pepper, ''), 'utf8'), 'sha256') end,
           'gotrue', s.id,
           jsonb_build_object('action', s.p ->> 'action', 'log_type', s.p ->> 'log_type')
      from src s
    on conflict (source_id) where source_id is not null do nothing
    returning 1)
  select (select count(*) from ins), (select created_at from lst), (select id from lst) into n, v_max_at, v_max_id;
  if v_max_at is not null then
    update ops.config set value = v_max_at::text, updated_at = now() where key = 'auth_events_last_at';
    update ops.config set value = v_max_id::text, updated_at = now() where key = 'auth_events_last_id';
  end if;
  return n;
end $$;
revoke all on function ops.copy_auth_events() from public, anon, authenticated;

-- 5. no Edge calls from cron until the functions are deployed (owner flips it on day 2)
insert into ops.config (key, value) values ('edge_cron_enabled', 'false') on conflict (key) do nothing;

create or replace function ops.call_function(p_name text, p_body jsonb default '{}'::jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_run bigint;
begin
  if not private.flag('edge_cron_enabled') then return null; end if;
  insert into ops.job_runs (job) values (p_name) returning id into v_run;
  return ops.http_invoke(v_run, p_name, p_body);
end $$;

-- 6. customer import: invalid rows are skipped and reported by legacy_id/ordinal; nothing raises with row values
create or replace function private.customers_import(p_rows jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_agency uuid := (select value::uuid from ops.config where key = 'default_agency_id');
        n_in integer; n_total integer; v_bad jsonb;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1000 then
    raise exception 'invalid_input:rows' using errcode = 'PT400';
  end if;
  n_total := jsonb_array_length(p_rows);
  with src as materialized (
    select t.r, t.ord,
           coalesce(jsonb_typeof(t.r) = 'object', false) as is_obj,
           coalesce((t.r ->> 'legacy_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', false) as ok_id,
           coalesce(char_length(btrim(t.r ->> 'first_name')) >= 1, false) as ok_first,
           coalesce(char_length(btrim(t.r ->> 'last_name')) >= 1, false) as ok_last,
           coalesce(char_length(regexp_replace(t.r ->> 'id_number', '[^0-9]', '', 'g')) between 5 and 9, false) as ok_nid
      from jsonb_array_elements(p_rows) with ordinality as t(r, ord)),
  good as (select s.r from src s where s.is_obj and s.ok_id and s.ok_first and s.ok_last and s.ok_nid),
  bad as (select coalesce(jsonb_agg(case when s.ok_id then to_jsonb(s.r ->> 'legacy_id') else to_jsonb('#' || s.ord) end order by s.ord), '[]'::jsonb) as ids
            from src s where not (s.is_obj and s.ok_id and s.ok_first and s.ok_last and s.ok_nid)),
  ins as (
    insert into crm.customers (agency_id, legacy_id, first_name, last_name, mobile_phone, email,
                               national_id_hmac, national_id_enc, details_enc)
    select v_agency, (g.r ->> 'legacy_id')::uuid, left(btrim(g.r ->> 'first_name'), 80), left(btrim(g.r ->> 'last_name'), 80),
           case when x.phone ~ '^0[2-9][0-9]{7,8}$' then x.phone end,
           case when char_length(x.email) <= 254 and x.email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then x.email end,
           private.national_id_hmac(g.r ->> 'id_number'),
           private.pii_encrypt(private.national_id_norm(g.r ->> 'id_number')),
           case when jsonb_typeof(g.r -> 'details') = 'object' and g.r -> 'details' <> '{}'::jsonb
                then private.pii_encrypt((g.r -> 'details')::text) end
      from good g
      cross join lateral (select regexp_replace(regexp_replace(coalesce(g.r ->> 'mobile_phone', ''), '[^0-9+]', '', 'g'), '^(\+972|972)', '0') as phone,
                                 lower(btrim(coalesce(g.r ->> 'email', ''))) as email) x
    on conflict do nothing
    returning 1)
  select (select count(*) from ins), (select ids from bad) into n_in, v_bad;
  return jsonb_build_object('received', n_total, 'inserted', n_in, 'skipped', n_total - n_in,
                            'invalid', jsonb_array_length(v_bad), 'invalid_ids', v_bad);
end $$;
revoke all on function private.customers_import(jsonb) from public, anon, authenticated, service_role;

-- 7. read-only role for the weekly content dump (owner sets LOGIN + password in SQL Editor; never an API role)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'content_dump') then
    create role content_dump nologin noinherit bypassrls;
  end if;
end $$;
grant usage on schema content to content_dump;
grant select on all tables in schema content to content_dump;
grant select on all sequences in schema content to content_dump;
alter default privileges for role postgres in schema content grant select on tables to content_dump;
```

בדיקה להוספה:

```
06: an alert outbox row driven to attempts=5 then complete(false) leaves the alert status 'undeliverable' and the outbox row dead; raise_alert with the same dedupe key after the 1h window inserts a new pending row; a dead outbox_dead alert row creates no new outbox_dead alert; with processed_at set to now()-25h and no other signal, private.health_degraded() is false; admin_alert_resolve as a fresh admin gives status resolved and an ACTION row, as an agent PT403, on an unknown id PT404; with edge_cron_enabled 'false', ops.call_function('notify-worker') is null and adds no job_runs row. 07: an open kind='client' invitation makes the hook return http_code 403; admin_staff_enable on a disabled agent gives next 'unban_user', active true and an ACTION row; on an active user PT404; 5,001 audit_log_entries sharing one created_at are fully copied in two runs (5000 + 1) with auth_events_last_id advancing. 09: a batch of 3 rows where one has last_name '  ' and one has id_number 'abc' gives inserted 1, invalid 2 and invalid_ids holding their legacy_ids, with no exception. 00: pg_roles content_dump has rolcanlogin false and rolbypassrls true (if postgres cannot grant bypassrls in the image, the migration fails here; the fallback is a select-only policy per content table, added to the using(true) allowlist); content_dump has no usage on schemas other than content; the lint 0029 list includes staff.admin_staff_enable and staff.admin_alert_resolve.
```

### 16. `supabase/tests/00_policy_lint.test.sql (new) + 01_structure_and_grants.test.sql (edits)`

```sql
00 is from scratchpad r1/00_policy_lint.test.sql (21/21 verified on 14 migrations), with these round-2 edits: the lint 0029 set_eq list adds ('staff.admin_staff_enable'), ('staff.admin_alert_resolve') for 15 entries; plan(n) is raised for the content_dump checks (rolcanlogin=false, usage only on content, no privilege outside content). The 14-RPC service set_eq, the anon = {api.health} check, the 0028 list, cron = 5 jobs and the other checks are unchanged. 01 edits as in round 1: check 4 excludes supabase_auth_admin; check 6 regex includes my_agency_id/is_fresh_mfa; checks 2/7/9/10 include 'staff'; check 8 is replaced by the 00 anon set_eq.
```

בדיקה להוספה:

```
replay-local.sh exits 0 with zero 'not ok' across 00-09 on 8+15 migrations; get_advisors on the branch reports exactly the documented 0028/0029 list. Only after this run are 01:1/01:2 ticked in §15.
```

### 17. `supabase/tests/02_rls_content_and_roles.test.sql and 03_lead_intake_and_audit.test.sql`

```sql
02: core.staff/crm.leads fixtures get agency_id = default_agency_id; api.leads becomes staff.leads_list; keep the consent_at update assertion; manager count = own agency; a deactivated agent gets PT403 from staff.leads_list. 03: full rewrite per the 090500 entry.
```

בדיקה להוספה:

```
Both green in replay-local.sh; the §15 items for 03 are ticked only after this.
```

### 18. `supabase/tests/replay-local.sh`

```sql
Keep the version floor as a guard (FLOOR=20261118162452; skip v < FLOOR). Per-file user: 07_* runs as supabase_admin, others as postgres. Failure detection: '^not ok', '^(ERROR|psql:.*ERROR)', and a required '^1\.\.[0-9]+$' plan line. The real tree now holds only the 8 foundation files (archive done in cb5af5e), so the floor acceptance runs on a temporary copy.
```

בדיקה להוספה:

```
In a temp copy of supabase/migrations, add 20260917210000_probe.sql (skipped) and 20261201000000_probe.sql (applied); a test description containing 'last_error' does not fail the run; a real SQL ERROR does.
```

### 19. `supabase/config.toml (replace the interim file installed in cb5af5e) <- docs/platform/config.proposed.toml`

```sql
In the FIRST v2 PR, overwrite supabase/config.toml with the reviewed values. Today's file has max_rows=1000, jwt_expiry=3600, rate limits of 30, no [auth.captcha], no [auth.sessions], no hook, and [functions.sync-tracks]/[functions.invite-agent]. New values: project_id "seeld-site"; [api] schemas ["api","staff"], extra_search_path ["extensions"], max_rows 200; [auth] site_url and both redirect URLs (seeld.co.il/** and www.seeld.co.il/**), enable_signup false, enable_anonymous_sign_ins false, jwt_expiry 900, refresh_token_reuse_interval 10, enable_manual_linking false, minimum_password_length 12 and password_requirements (comment: dashboard is the source of truth, set 18.11); [auth.sessions] timebox "12h", inactivity_timeout "1h"; [auth.email] enable_signup false, otp_length 8, otp_expiry 600, max_frequency "1m0s", secure_password_change true; [auth.email.smtp] Resend with env(RESEND_SMTP_PASSWORD); [auth.captcha] enabled true, provider "turnstile", secret env(TURNSTILE_SECRET_KEY); [auth.sms] enable_signup false; [auth.mfa] max_enrolled_factors 2, totp on, phone off; [auth.rate_limit] email_sent 10, sign_in_sign_ups 20, sms_sent 0, anonymous_users 0, token_refresh 150, token_verifications 20; [auth.hook.before_user_created] enabled, uri pg-functions://postgres/private/hook_before_user_created; no [auth.external.*] enabled; [functions.*]: lead-intake, notify-worker, chat-bot, fetch-cma-data and health with verify_jwt=false, staff-invite with true; NO sync-tracks/invite-agent; api-v1/queue-worker only if the owner chooses to keep them (then verify_jwt=true). Keep the old interim text only in git history (no extra archive file).
```

בדיקה להוספה:

```
supabase start: signup with a random email is rejected; GET /auth/v1/settings shows all external.* false; preview smoke: access token exp-iat = 900; select count via the api returns at most 200 rows.
```

### 20. `supabase/functions/api-v1, supabase/functions/queue-worker, src/test/queue-worker.test.ts (owner decision, first v2 PR)`

```sql
Option A (recommended): git mv supabase/functions/api-v1 and supabase/functions/queue-worker to supabase/_parked/functions/, and src/test/queue-worker.test.ts to supabase/_parked/tests/ (excluded from vitest), plus any api-v1-only src/platform/api code they need; nothing is deleted. supabase/functions/_shared stays (src/test/edge-shared.test.ts and src/platform/queue/policy.ts import it). Option B: keep both, add them to the allowlist and config.toml (verify_jwt=true), and replace SUPABASE_SERVICE_ROLE_KEY in queue-worker/index.ts:75 with SEELD_SECRET_KEY.
```

בדיקה להוספה:

```
functions job: grep for SUPABASE_SERVICE_ROLE_KEY over supabase/functions is empty; comm -23 <(ls supabase/functions) <(allowlist) is empty; vitest is green (edge-shared.test.ts passes).
```

### 21. `.github/workflows/ci.yml (replace with docs/platform/ci.proposed.yml), new migrate.yml, new content-dump.yml, edit .github/workflows/site-watch.yml + scripts/health-check.mjs, new scripts/ci/check-secret-scope.mjs`

```sql
No phase 0: the archive is done, and the first v2 PR also resolves api-v1/queue-worker and config.toml. Full gates from that PR on:
- verify: grep -rEn 'sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY' dist/ src/ api/ --exclude=types.generated.ts.
- database: migration floor over all supabase/migrations; bash supabase/tests/replay-local.sh; supabase start + supabase db reset + supabase test db; supabase gen types typescript --local --schema api,staff, then git diff --exit-code on the types file.
- functions: the forbidden grep over all supabase/functions, plus the subset allowlist check.
- supply-chain: npm audit, secret scan, and node scripts/ci/check-secret-scope.mjs (parses .github/workflows/*.yml and fails if any job references secrets.SUPABASE_DB_URL or secrets.CONTENT_DUMP_DB_URL without an environment: key).
- ci-ok: needs all four.
migrate.yml: on workflow_dispatch only; environment production; if: contains(vars.PROD_MIGRATORS, github.actor); supabase db push --db-url "$SUPABASE_DB_URL".
content-dump.yml: weekly schedule plus dispatch; environment backup; pg_dump --schema=content "$CONTENT_DUMP_DB_URL"; encrypted with the owner's public key; artifact retention 30 days.
site-watch.yml: EDIT the existing 63-line workflow. Do not create a new file. Pass env HEALTH_URL: ${{ vars.HEALTH_URL }}. scripts/health-check.mjs adds: when HEALTH_URL is set, fetch it and FAIL if .degraded !== false. No SUPABASE_ACCESS_TOKEN anywhere.
```

בדיקה להוספה:

```
Throwaway PRs: an old-dated migration fails database; sb_secret_ in src fails verify; ACAO * in a function fails functions; a job using secrets.SUPABASE_DB_URL without environment fails supply-chain; an unrelated PR is green. site-watch on staging fails when health.degraded=true and is green otherwise; with HEALTH_URL unset it behaves exactly as today.
```

### 22. `docs/platform/vercel.proposed.json + api/*.ts`

```sql
Unchanged from round 1:
- Remove git.deploymentEnabled.
- CSP connect-src 'self' https://qxhpolktdfgcbxtfxgov.supabase.co https://challenges.cloudflare.com (no wss, no ipapi.co).
- In api/board.ts, company-map.ts, fund-status.ts, funds.ts and tracks.ts, replace the edge runtime config with the Node default.
- Page in 200-row Range steps.
- api/geo.ts is removed only with owner approval.
```

בדיקה להוספה:

```
Preview: a securityheaders scan; /api/tracks returns the full set through paging; no request to ipapi.co.
```

## צעדי בעלים (מסודרים; DONE = בוצע כבר)

1. [בוצע - מתאם] seeld-site > Settings > API: Exposed schemas = api, max_rows = 200. נשאר: Extra search path = extensions; לוודא ש-GraphQL כבוי.
2. [בוצע - מתאם] Auth: הרשמה כבויה; סיסמה 12+ עם lower/upper/digits/symbols; Leaked password protection; TOTP פעיל; Site URL https://seeld.co.il; Redirect https://seeld.co.il/** ו-https://www.seeld.co.il/**.
3. [בוצע - בעלים, cb5af5e] ארכוב: 42 מיגרציות Tokyo, 17 תיקיות פונקציות (כולל pdage-chat) ו-config.tokyo.toml הועברו ל-supabase/_archive_tokyo/. בדיקה: ls supabase/migrations | awk '$0 < "20261118162452"' | wc -l מחזיר 0.
4. החלטה פרטנית על api-v1 ו-queue-worker (שלדי הפלטפורמה החדשה, לא Tokyo): (א) מומלץ: להעביר (לא למחוק) ל-supabase/_parked/functions/, יחד עם src/test/queue-worker.test.ts, עד שלב ב'; (ב) או להשאיר, להוסיף ל-allowlist ול-config ולהחליף את SUPABASE_SERVICE_ROLE_KEY ב-SEELD_SECRET_KEY. _shared נשאר בכל מקרה.
5. אישור להחליף את supabase/config.toml (קובץ הביניים: max_rows 1000, JWT 3600, sync-tracks, invite-agent) בתוכן docs/platform/config.proposed.toml, ב-PR הראשון של v2.
6. [הוחלט 18.11] מחיקת מודול PDage מ-src: ה-PR מציג את רשימת הקבצים לפני המיזוג. אישור פרטני נוסף נדרש למחיקת supabase/_archive_tokyo/functions/pdage-chat.
7. Supabase > Organization: MFA חובה לכל החברים; לפחות שני Owners.
8. seeld-site > API Keys: sb_publishable_* ו-sb_secret_* בשמות default ו-automations. שמות בלבד.
9. seeld-site > Auth > Providers: לוודא שכל ספק חיצוני ו-anonymous כבויים (אין התחברות חברתית לעולם); Confirm email on; SMS signup off.
10. seeld-site > Auth > Settings: JWT expiry 900; refresh reuse interval 10; Sessions time-box 12h, inactivity 1h; Email OTP length 8, expiry 600; Secure password change on; manual linking off.
11. Resend: אימות seeld.co.il (SPF, DKIM); Auth > SMTP: smtp.resend.com:465, user resend, sender no-reply@seeld.co.il, שם השולח SEELD; קצב אימייל 10 לשעה; תבניות בעברית.
12. seeld-site > Auth > Rate limits: sign-in/sign-ups 20 ל-5 דק', token refresh 150, verifications 20, SMS 0, anonymous 0.
13. seeld-site > Auth > MFA: phone off; max factors 2.
14. Cloudflare (החשבון קיים): Turnstile widget ל-seeld.co.il ול-www; Auth > Attack Protection: CAPTCHA = Turnstile (בענפים: מפתחות בדיקה).
15. seeld-site > Auth: כתיבת Auth audit logs למסד.
16. SQL Editor, לפני החלת 20261119091100: vault.create_secret ל-project_url ול-edge_cron_secret (את השני להעתיק גם ל-EDGE_CRON_SECRET). לפני העתקת הלקוחות: vault.create_secret(encode(gen_random_bytes(32),'hex'),'pii_enc_key') ו-'national_id_hmac_key', ושמירת שני הערכים בנאמנות לא מקוונת. בכל ענף: כתובת הענף בלבד.
17. Edge Functions > Secrets: SEELD_SECRET_KEY, EDGE_CRON_SECRET, TURNSTILE_SECRET_KEY, ALLOWED_ORIGINS, RESEND_API_KEY, LEAD_NOTIFY_TO, GOOGLE_AI_API_KEY.
18. אחרי החלת 20261119090300: להוסיף staff ל-Exposed schemas.
19. אחרי החלת 20261119090600: Auth > Hooks > Before User Created > private.hook_before_user_created (אחרי 091400 הוא מקבל הזמנות סגל בלבד).
20. יום 2, אחרי פריסת notify-worker, fetch-cma-data ו-health: update ops.config set value='true' where key='edge_cron_enabled'; ולוודא ש-ops.job_runs מתמלא. עד אז degraded=true צפוי.
21. SQL Editor: insert into ops.alert_recipients; אדמין ראשון: insert into core.invitations (email, kind, role, agency_id) values ('<email>','staff','admin','5eed0000-0000-4000-8000-000000000001'); Dashboard > Invite user (הקישור תקף 10 דק'; אם פג: Send password recovery); select api.staff_provision('<uid>','<שם>'); כניסה והגדרת TOTP.
22. Database > Backups: לוודא גיבוי יומי; Auth DB connections: percentage.
23. Infrastructure: מעבר ל-Small לפני יום 3; פעם בשבוע לבדוק את מינימום Disk IO Balance של 7 ימים.
24. העתקת לקוחות: לאשר עמודה-עמודה את הרשימה ב-scripts/load/copy-customers.mjs (בנק והכנסה לא כברירת מחדל), ולהריץ ממחשב הבעלים (session pooler, p_rows כ-bind parameter, בלי קובץ ביניים). לוודא received=191 ולעבור על invalid_ids.
    **מצב בפועל (19.11.2026):** T4 כבר ביצע את ההעתקה, לפני האישור ולא ממחשב הבעלים (191/191, invalid 0). לכן שלב 24 הופך לאישור בדיעבד של רשימת העמודות שב-DATA-MIGRATION.md סעיף 2ב. עמודה שנדחית מוסרת ב-`private.customers_details_drop_keys`. הבעלים גם צריך לאשר שקרא את גילוי החשיפה בתמליל (סעיף 2א) ולהחליט כמה זמן לשמור את התמליל.
25. שני הלידים הישנים: להקליד ב-SQL Editor (insert into crm.leads ... source='legacy-v0'), בלי קובץ CSV.
26. יום 3, על ענף: כניסה כושלת אמיתית אחת, ואז select payload->>'action' from auth.audit_log_entries order by created_at desc limit 5; לרשום את שם הפעולה ב-auth_failure_actions, ורק אז להחליט על auth_lock_enabled=true. באותו יום: תרגיל השבתה, הפעלה ו-break-glass על אדמין בדיקה, כולל Unban.
27. SQL Editor: alter role content_dump with login password '<אקראי>'; ולשמור את הכתובת כ-CONTENT_DUMP_DB_URL ב-GitHub Environment backup.
28. Vercel: Deployment Protection Standard; Production Branch = main; Firewall rate limit ל-/api/*; Analytics, Speed Insights, Spend alert; deploy-vercel.yml רק ב-workflow_dispatch.
29. Vercel env (ב-cutover): VITE_* ל-Production; Preview על staging עד מחיקתו, ואחר כך VITE_FORMS_ENABLED=false ו-VITE_STAFF_APP_ENABLED=false. אף מפתח סודי.
30. GitHub: ליצור Environment בשם production (deployment branch main בלבד, required reviewer = הבעלים) עם SUPABASE_DB_URL, ו-Environment בשם backup (main בלבד) עם CONTENT_DUMP_DB_URL; משתנה ריפו PROD_MIGRATORS. repository secret יחיד: VERCEL_AUTOMATION_BYPASS_SECRET. לא ליצור SUPABASE_ACCESS_TOKEN ולא לשים כתובת מסד ב-repository secrets.
31. GitHub: הגנת ענף על main שדורשת ci-ok, אחרי שה-PR הראשון של v2 (החלטת api-v1/queue-worker, config.toml, ci.yml) מוזג ירוק.
32. ב-cutover: משתנה ריפו HEALTH_URL = https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health, כדי ש-site-watch יבדוק את degraded.
33. החלטות פתוחות: (א) ספק SMS ושיטת כניסת לקוחות (עתידי); (ב) תוכנית ומושבי Vercel; (ג) Team plan (המלצה: לא); (ד) Single session; (ה) הפעלת lead_retention_enabled; (ו) תקופת שימור ל-crm.customers ואילו עמודות מועתקות.

## מה יושם מהביקורות (changes_applied)

- R2-A-B1 (repo facts stale): verified on origin/main that cb5af5e already archived 42 migrations, 17 function folders (incl. pdage-chat) and config.tokyo.toml. Rewrote the header, §4, §12, §18.3, §19, ADR-38, Appendix D and owner steps 3-6 to 'archive done'. Owner steps 4-6 became one decision on api-v1/queue-worker (park, or keep and fix SUPABASE_SERVICE_ROLE_KEY at queue-worker/index.ts:75) plus approval to replace the interim config.toml (max_rows 1000, jwt 3600, no captcha/hook/sessions, sync-tracks/invite-agent) with config.proposed.toml in the first v2 PR.
- R2-A-B2 (CI secrets can decrypt customers): SUPABASE_DB_URL lives only in GitHub Environment 'production' (branch main, owner reviewer), used only by migrate.yml (workflow_dispatch plus a PROD_MIGRATORS actor check). SUPABASE_ACCESS_TOKEN is dropped. Types are generated from the local DB. The weekly dump runs as the new select-only role content_dump from Environment 'backup'. A supply-chain check (scripts/ci/check-secret-scope.mjs) fails any job that uses a DB secret without environment:. Added §10, §12, ADR-44 and an owner step.
- R2-B-B1 (CI deadlock, wrong folder facts): phases removed. The first v2 PR resolves api-v1/queue-worker, replaces config.toml and adopts full gates; branch protection comes after it merges green. The allowlist check is now a subset (comm -23 must be empty), so functions that do not exist yet cannot fail it. _shared is kept (it is new-platform code and edge-shared.test.ts imports it), not archived. Appendix D now lists 17 archived folders and names the 3 that remain. PDage: removed from src, and deleting the archived pdage-chat needs its own approval.
- R2-B-B2 (undeliverable alert pins degraded and dedupe for 30 days): 20261119091400 adds status 'undeliverable'. ops.outbox_complete sets it when an alert's outbox row goes dead, which frees the pending dedupe index and ends the 'pending > 30 min' degraded signal; the 24h dead window still surfaces it. A dead outbox_dead alert does not re-raise (no loop). Added staff.admin_alert_resolve (fresh admin, platform agency, ACTION audit), a runbook SQL line and 06 tests.
- R2-F1 (last_admin guard unreachable): removed from staff.admin_staff_disable in 091400. The self guard guarantees an active admin remains (ADR-30). The false 07 claim was dropped.
- R2-F2 (break-glass ignores the GoTrue ban): §6(ח) adds Dashboard Unban or `update auth.users set banned_until = null`, with a day-3 drill and acceptance.
- R2-F3 (pre-Turnstile DB writes): lead_replay confirmed a pure read. intake_note_reject is called only after Turnstile passes. Origin/shape/Turnstile rejects are counted in isolate memory and logged without PII. Stated in §7 and ADR-21, with a Deno test of zero DB calls.
- R2-F4 (duplicate flag leaks lead existence): lead-intake returns only {ok:true} to the browser (§7, ADR-21, §15). Deno test added.
- R2-F5 (customers_import leaks PII via the error DETAIL): 091400 pre-filters invalid rows (legacy_id, names, id digits) and reports invalid/invalid_ids by legacy_id or ordinal without raising. copy-customers.mjs must send p_rows as a bind parameter. 09 test added. (As executed: the copy used a sealed blob instead; see DATA-MIGRATION.md section 2a. The sealed opener is retired in 095300, so no decrypt/cast DETAIL path remains.)
- R2-F6 (lead CSV files): no CSV anywhere. The 2 legacy leads are typed by the owner in SQL Editor, and rollback-window leads stay in seeld-site, read via staff.leads_list (§18.1, §18.3, ADR-44).
- R2-F7 (hook accepts client invitations): the 091400 hook accepts only kind='staff'. Client acceptance comes with the portal migration. 07 test added (ADR-29, §6).
- R2-F8 (SUPABASE_ACCESS_TOKEN scope unclear): not needed; removed from §10 and the owner steps (types come from the local DB, migrations use the environment-scoped DB URL).
- R2-F9 (18 vs 19 folder counts): aligned to the actual 17 archived folders (pdage-chat included) in §4, ADR-38 and Appendix D. The pdage-chat delete is a separate approval.
- R2-F10 (§15 ticks): 01:1/01:2 unticked until the 01 edits (with 'staff') run green on 8+15. Only the coordinator dashboard item stays ticked.
- R2-F11 (cron fires before functions exist): 091400 adds edge_cron_enabled (default false); ops.call_function is a no-op until the owner flips it on day 2 after deploy. Expected degraded=true until then is documented in §9, the owner step list and the runbook.
- R2-F12 (site-watch.yml exists): the existing 63-line workflow is edited; scripts/health-check.mjs fails on degraded when HEALTH_URL is set (from cutover). Stated in §13 and the CI item.
- R2-F13 (no enable path): added staff.admin_staff_enable (fresh admin, same agency, ACTION audit, next 'unban_user'). staff-invite 'enable' calls it, then ban_duration 'none'. Added to ADR-22 0029 list and the 00 lint (15 entries).
- R2-F14 (copy_auth_events stall): 091400 switches to a (created_at, id) row-value watermark with an auth_events_last_id config key. 07 test with 5,001 same-timestamp rows.
- R2-F15 (fund_number vs fund_id): ADR-36 now says fund_id, matching m11.
- R2-F16 (notify-worker overlap): §7 states that outbox_claim's for update skip locked plus the 2-minute lock make overlapping 72 s runs safe. T2 acceptance updated.
- R2-F17 (step 0 / branch-protection wording): §18.3 step 0 and §15 now read 'ci.yml green on main + allowlist subset + branch protection on'.
- R2-F18 (replay floor untestable on the real tree): the floor is kept as a guard; the acceptance runs on a temporary copy of supabase/migrations.
- Round 1 (retained, unchanged from v2.1): O-B1..B12, O-F1..F20, S-B1..B12, S-F1..F20 remain resolved as mapped in the 'תיקוני סקירה (סבב 1)' section (timeouts/202, outbox alarm, watchdog isolation, intake counters, agency scoping, lockout rules, owner rules, access logging, max_rows 200, invitations, idempotency ordering, tests, Vercel, resilience, facts). The CI-ordering items (O-B10/F10, S-B1/B2/B4) are superseded by the round-2 no-phase plan because the archive is done.
- Verification note: m01-m14 and 00 are the round-1 container-verified files. 20261119091400 is new and not yet run; T0 must prove it, including whether postgres can create content_dump with bypassrls (fallback documented).

## סטיות ומצב בפועל (19.11.2026)

הטקסט שלמעלה לא נערך. כאן מתועד מה שיושם בפועל לפי דוחות הסיום של T0 עד T5. ההפעלה: `RUNBOOK.md`; צעדי הבעלים המעודכנים: `OWNER-STEPS.md` (מחליף את רשימת "צעדי בעלים" שלמעלה לגבי מה בוצע ומה פתוח).

**T0 (מסד):**
- שער `edge_cron_enabled` נמצא ב-`20261119090700`, לא ב-`091400`.
- `ops.copy_auth_events(p_limit integer)`.
- התפקיד `content_dump` ב-`20261119091500`.
- התראות צעדי ה-watchdog נושאות SQLSTATE בלבד.
- בדיקות `supabase/tests/*.test.sql` רצות כ-`postgres`, כולל `07` (סעיף 18 אומר אחרת). `supabase/tests/replay_only/10_hook_as_auth_admin.test.sql` רצה רק ב-`replay-local.sh` כ-`supabase_admin`.
- מיגרציה נוספת `20261119091600_alert_recipients_at_send`: הנמענים נקבעים ברגע הלקיחה. חוזה ל-`notify-worker`: רשימה ריקה מסתיימת ב-`api.outbox_complete(id, false, 'no_recipients')`.
- הצעד "להחיל קודם על ענף" לא בוצע.
- 353 בדיקות pgTAP עברו בהרצה נקייה.

**T1 (זהות):** נוספה פעולת `accept`. השורה "extend existing `supabase/functions/_shared/auth.ts`" בוטלה: כל הלוגיקה בתוך `staff-invite`, ואין קוד T2 שתלוי בסמלים חדשים שם. שתי הקשחות SQL הועברו ל-T0 (`IDENTITY.md` §11). בדיקות היום השלישי עדיין פתוחות ומהוות תנאי ל-cutover.

**T2 (פונקציות):** `lead-intake` מחזירה 423 `feature_disabled` כשהמתג כבוי, ו-403 עם `details.field` (`origin` / `turnstile`). `chat-bot` נכשלת סגור כשהמסד לא זמין. תג ה-IP בלוג חתום במפתח אקראי לכל מופע. `fetch-cma-data` נשארה בגרסה 1. הפריסה היא באנדלים דרך MCP, ויש לפרוס מחדש מהמאגר כשיהיה טוקן. `api.lead_notify_details` עוד לא קיימת.

**T3 (אתר):** קבצי PDage לא נמחקו (ממתין לאישור פרטני); קבלת ה-grep של `pdage` נכשלת עד אז. `api/*.ts` עברו ל-Node. קוד v2 נשאר כקוד מת בבאנדל legacy עד שיתווסף ערך ברירת מחדל ל-`VITE_SEELD_BACKEND` ב-`vite.config.ts`. ב-v2 הצ'אט מציג פאנל קשר ולא מחובר ל-`chat-bot`.

**T4 (נתונים):**
- מיגרציות `20261119095000_tracks_site_mapping`, `20261119095100_customers_sealed_import`, `20261119095200_t4_private_deny_policies`, `20261119095300_t4_fix_pass`. הגוף התקף של `content.refresh_investment_tracks` הוא של `095300`.
- 1,040 מסלולים פעילים, התנגשות אחת (`B103`), 48 חברות לא ממופות (217 קרנות).
- העתקת 191 הלקוחות בוצעה דרך `scripts/migrate/copy-customers.sql` ולא דרך `.mjs` ממחשב הבעלים, לפני אישור שלב 24. מפתח ההעברה והבלוקים החתומים עברו דרך תמליל הסוכן: אירוע פרטיות שממתין לאישור הבעלים ולהחלטה על שמירת התמליל (`DATA-MIGRATION.md` סעיף 2א). `private.customers_import_sealed` הוצאה משימוש (PT410).

**T5 (CI, תצורה, Vercel):**
- סעיף 19: `[auth.email] enable_signup = true` (זה מתג ספק האימייל; `false` חוסם כל כניסה ב-422). ההרשמה כבויה ב-`[auth] enable_signup = false`.
- סעיף 22: "no wss" לא מתקיים עד ה-cutover. ה-CSP שומר את `https://` ו-`wss://` של טוקיו, וכלל המעבר נאכף ב-`scripts/ci/check-csp-bundle.mjs`; אחרי ה-cutover `CUTOVER_DONE=1`.
- הרצים מוצמדים ל-`ubuntu-24.04`.
- `preview-smoke` אוכף את תנאי העימוד ואת התאמת ה-CSP לבאנדל, וקוד ה-smoke נלקח מהענף הראשי.
- `migrate.yml` כולל בדיקת היסטוריה (`scripts/ci/check-migration-history.mjs`).
- סעיף 20: `api-v1` ו-`queue-worker` נשארו במקומם עם `SEELD_SECRET_KEY` ו-`verify_jwt=true` (אפשרות ב' בפועל); ההחלטה הסופית עדיין אצל הבעלים.
- `deploy-vercel.yml` לא שונה וממתין לאישור הבעלים על הסרת קלט הטוקן.

**צעדי בעלים שלמעלה, מצב בפועל:** 1 בוצע במלואו (כולל Extra search path ו-`staff`); 16 בוצע לגבי יצירת ה-Vault (הנאמנות פתוחה); 18 ו-19 בוצעו; `ops.alert_recipients` (חלק מ-21) בוצע. 24 הפך לאישור בדיעבד.
