# פאנל העיצוב: סינתזה (18.11.2026)

תהליך: 3 בדיקות היקף עצמאיות (קוד, קטלוג, יומני ריצה) עם 2 מבקרים לכל ממצא, 3 עיצובים עצמאיים (אבטחה תחילה, פשטות ותפעול תחילה, אירועים והרחבה תחילה), 3 שופטים, וסינתזה אחת. ציוני השופטים: [126, 123, 103], עיצוב מנצח: 0 (SEELD: תכנון יעד לבק-אנד פרנקפורט, Vercel ו-CI מנקודת מבט אבטחה ופרטיות).

## ממצאי היקף מאומתים (מול INVENTORY.md של טוקיו)

- **[high] inventory_error**: table recommendation_summaries (anon RLS policies 'Public portal read summary' / 'Public portal update summary')
  - ראיה: INVENTORY.md line 30 describes recommendation_summaries as 'anon portal read+update by link token' and the junk/defect list (line 113) omits it. Tokyo policy qual for both anon SELECT and anon UPDATE is only (link_token IS NOT NULL AND (link_expires_at IS NULL OR link_expires_at > now())) - the token value is never bound. The code applies the token only as a client-side filter: C:\dev\seeld-seo-prerender\src\pages\ClientPortalPage.tsx:148-152 (.eq('link_token', resolvedToken)), and performs anon UPDATEs by id alone at lines 251-254 (opened_at) and 291-294 (client_submitted_at, status='client_responded'). Any holder of the public anon key can therefore list every live summary (incl. customer_id) and mark any of them submitted. Same class as the known execution_summaries USING(true) defect but not recorded.
- **[high] unclear_dependency**: table client_access_links (and the anon portal policies on customers, products, recommendations that depend on it)
  - ראיה: Code never inserts or selects client_access_links; the only reference is a cascade delete at C:\dev\seeld-seo-prerender\src\contexts\AppProviderImpl.tsx:414 (0 rows in Tokyo, INVENTORY line 33). Yet Tokyo anon policies 'Public portal read customers', 'Public portal read products', 'Public portal read recommendations' and 'Public portal update recommendation decisions' all require EXISTS(active client_access_links row for the customer). The portal pages authenticate by a token on a different table (recommendation_summaries.link_token at ClientPortalPage.tsx:148-152; execution_summaries.link_token at C:\dev\seeld-seo-prerender\src\pages\ExecutionSummaryPortalPage.tsx:61-65) and then read customers (ClientPortalPage.tsx:195-199; ExecutionSummaryPortalPage.tsx:71-75), recommendations/products (ClientPortalPage.tsx:230-235) and update recommendations (285-287) as anon - all of which return 0 
- **[high] unclear_dependency**: storage bucket source-files (object paths vs policies)
  - ראיה: Every code upload path puts a non-user id in the first folder: `${customerId}/...` at C:\dev\seeld-seo-prerender\src\components\FileUploadSection.tsx:129-130, C:\dev\seeld-seo-prerender\src\services\import-service.ts:349-350, C:\dev\seeld-seo-prerender\src\pages\NewCustomerPage.tsx:180-181; and `agency-logos/${agency.id}.${ext}` at C:\dev\seeld-seo-prerender\src\pages\AgencySettingsPage.tsx:81-85 followed by getPublicUrl at lines 88-90. Tokyo storage.objects policies for source-files (INSERT/SELECT/DELETE, role authenticated) all require (auth.uid())::text = (storage.foldername(name))[1], and the bucket is public=false. So no upload in the codebase can pass RLS and the logo URL would be a 400 even if it did - which is why the bucket holds 0 objects (INVENTORY line 98). The inventory states the policy and the 0 count but not that the code and the policy are incompatible; the new design mu
- **[high] unclear_dependency**: public.customer_financial_snapshot
  - ראיה: FK customer_financial_snapshot_customer_id_fkey -> customers(id) (NO ACTION). 184 rows (count(*)), RLS on, 0 policies. Table comment (Hebrew): per-customer financial/insurance snapshot sourced from clearing-house data via Surense, "sensitive, separated from the customers table". Written by cron job 7 (process_integration_inbox, every 5 min) and read by view v_insbase_first_client_candidates. Inventory mentions it only as Surense output (§4); it is not recorded as a dependent of the site's customers table, not in the export plan (§8) and not in §9 decisions. Holds health/financial data keyed 1:1 to the 191 site customers.
- **[high] inventory_error**: investment_tracks + edge function sync-tracks + cron 5 sync-tracks-weekly
  - ראיה: pg_stat_user_tables 27d: n_tup_ins/upd/del = 0/0/0 (seq_scan 156 = anon reads: 149+1 PostgREST statements). max(last_sync)=max(updated_at)=max(created_at)=2026-03-26 15:00:32Z on all 571 rows. No service_role/postgres statement in pg_stat_statements references investment_tracks. cron.job_run_details job 5: 19 'succeeded' runs, last 2026-11-15 06:00Z, but function_edge_logs 2026-11-15 shows 'POST | 500 | .../functions/v1/sync-tracks' and function_logs 'Sync error: TypeError: error sending request for url (https://gemelnet.mof.gov.il/GmulotNetReports/tsuotKupotRavHodshiRD...'; cron 'succeeded' only records that net.http_post was enqueued. INVENTORY s1 ('write ... S via sync-tracks') and s8 ('investment_tracks [reproducible] by sync-tracks') are false at runtime: the table has not been written for ~8 months and the sync cannot reproduce it. Policy track_write_authenticated (ALL, USING true)
- **[medium] missing_from_inventory**: realtime publication supabase_realtime -> public.customer_messages
  - ראיה: C:\dev\seeld-seo-prerender\src\components\personal-area\ChatTab.tsx:30-49 subscribes with .channel(`customer_messages_${customerId}`).on('postgres_changes', {schema:'public', table:'customer_messages', event:'INSERT', filter:'customer_id=eq.<id>'}).subscribe(); the component is mounted at C:\dev\seeld-seo-prerender\src\components\personal-area\PersonalAreaDashboard.tsx:258. Tokyo pg_publication_tables for supabase_realtime contains only team.blockers and team.runs, so the subscription never receives events. INVENTORY.md has no realtime section at all (only the CSP wss: entry at line 93). New design must add customer_messages to the publication (with realtime RLS) or remove the subscription.
- **[medium] inventory_error**: PDage module relationships: correction_jobs -> pdage_customers / deficiency_categories / deficiency_bank (PostgREST embedded selects)
  - ראיה: Tokyo correction_jobs has ZERO foreign keys (pg_constraint contype='f' returns none; deficiency_bank/deficiency_categories also have none) and to_regclass('public.pdage_customers') is null, while the code embeds all three relations in correction_jobs selects: C:\dev\seeld-seo-prerender\src\pages\pdage\PDageDashboard.tsx:29, PDageCorrectionRoom.tsx:63, PDageJobView.tsx:41, PDageChatHome.tsx:56, PDageHistory.tsx:33, C:\dev\seeld-seo-prerender\supabase\functions\validate-correction\index.ts:29, process-correction\index.ts:33, pdage-chat\index.ts:105. PostgREST embedding requires an FK, so every one of these reads fails (PGRST200), i.e. the whole PDage module and 3 edge functions are non-functional in Tokyo, not just the pdage_customers insert path (C:\dev\seeld-seo-prerender\src\pages\pdage\PDageUpload.tsx:57-76). The generated types still carry the three FKs the code was built against (C:\
- **[medium] unclear_dependency**: storage bucket correction-files (no RLS policies)
  - ראיה: INVENTORY line 98 left 'correction-files policy not found in catalog grep (check)'. Confirmed: pg_policies on storage.objects has no policy mentioning correction-files, so the browser paths are denied for authenticated users: upload at C:\dev\seeld-seo-prerender\src\pages\pdage\PDageUpload.tsx:51-53 (path `${userId}/...`, which would fit a uid-first-folder policy) and createSignedUrl at C:\dev\seeld-seo-prerender\src\pages\pdage\PDageJobView.tsx:108 and PDageHistory.tsx:41. Only the service-role path works (C:\dev\seeld-seo-prerender\supabase\functions\process-correction\index.ts:60-62). If PDage is kept, the new design needs INSERT/SELECT policies keyed on foldername[1] = auth.uid().

### ממצאים שלא אומתו (מעבר למכסה של 8)

- [medium] inventory_error: edge function parse-import-file (secrets VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
- [medium] wrongly_included: edge function noa-onboarding
- [low] unclear_dependency: edge function fetch-cma-data (browser trigger)
- [low] unclear_dependency: auth provider google (3 of 6 Tokyo users)
- [low] missing_from_inventory: edge function invite-agent -> GoTrue admin invite (auth.admin.inviteUserByEmail)
- [medium] inventory_error: INVENTORY.md §1 claim: "FK closure of the set is closed (only external parent: auth.users)"
- [medium] missing_from_inventory: public.v_insbase_first_client_candidates (view)
- [medium] unclear_dependency: public.customer_policies
- [medium] unclear_dependency: public.agent_sales
- [medium] unclear_dependency: public.customer_family_links
- [medium] unclear_dependency: public.calls
- [medium] unclear_dependency: cron job 7 "process-integration-inbox" -> public.process_integration_inbox() (+ helpers surense_norm_tz, surense_tz_valid, surense_text, surense_date, surense_num, surense_bool, surense_month; tables 
- [medium] missing_from_inventory: EXECUTE grants (pg_proc.proacl) on the 11 site functions
- [low] unclear_dependency: public.work_orders
- [low] unclear_dependency: public.customer_recommendations, public.form_submissions, public.lab_case
- [low] unclear_dependency: public.master_prompts
- [low] unclear_dependency: public.get_user_agency_id(uuid), public.user_has_profile(uuid)
- [low] inventory_error: INVENTORY.md §2 claims "anon/authenticated hold ALL privileges on public tables" and "Matview/view cma_* readable by anon"
- [medium] missing_from_inventory: insbook_api.guard() as pgrst.db_pre_request + authenticator role config
- [medium] wrongly_included: chat_conversations, chat_messages, rpc get_chat_messages (AIChatBot persistence path)
- [medium] unclear_dependency: travel_companies (new content.travel_companies / api.travel_companies in repo migrations dated 2026-11-18) vs Tokyo travel_* runtime
- [medium] inventory_error: page_views access intent ('A insert only; U read')
- [medium] unclear_dependency: customers (personal-area lookup) and agencies: queries that always fail with 400
- [medium] wrongly_included: 20 listed tables with zero website activity in 27 days: pension_analysis_leads, onboarding_submissions, saved_calculations, user_policies, agency_invitations, client_access_links, execution_summary_it
- [low] inventory_error: cma_funds 'public read all' (A)
- [low] inventory_error: blog_posts write path ('U manage all')
- [low] missing_from_inventory: Realtime (postgres_changes) subscription on customer_messages
- [low] unclear_dependency: Google OAuth login in active use (INVENTORY s7 'social off' decision)
- [low] unclear_dependency: Tokyo pg_cron reliability for site jobs (cron 1/2/9 fetch-cma-data, 5 sync-tracks, 8/10/11)
- [low] inventory_error: customers 'Fed by Surense pipeline (process_integration_inbox)'

## הסינתזה

# SEELD: סינתזה סמכותית לבק-אנד פרנקפורט, Vercel ו-CI

תאריך: 18.11.2026. מסמך תכנון; לא שונה דבר בשום פרויקט Supabase, Vercel או GitHub.
בסיס: עיצוב 0 (אבטחה ופרטיות) כמנצח, בתוספת כל ה-`must_steal` של שלושת השופטים, ותיקון כל פגם שנמנה, אחרי אימות מול התיעוד הרשמי.
יעד: `seeld-site` (`qxhpolktdfgcbxtfxgov`, `eu-central-1`). מקור: `lvifatyksqizwcutfbqp` (טוקיו), קריאה בלבד.

הנחת עבודה שאומתה בריפו: שמונה מיגרציות היסוד `20261118162452..20261118162856` קיימות (סכמות `api/core/crm/content/ops/audit/private`, `private.is_staff/is_manager/has_role/is_client`, `private.check_rate_limit`, `private.client_ip`, `ops.outbox/config/rate_limits`, `ops.cleanup` + cron, `audit.log` + `log_change`, `api.submit_lead` חשוף ל-`anon`, `api.leads` עם `grant update (status, assigned_to, notes, deleted_at)` ל-`authenticated`, `content.cma_sync_log` כבר עם `'stale'` באילוץ). כל מה שלהלן הוא **דלתא** על היסוד הזה.

---

## 0. ההחלטה בעשר שורות

1. מבנה עיצוב 0 נשמר: טבלאות בסכמות לא חשופות, שתי סכמות חשופות (`api` לגולש וללקוח, `staff` לצוות), הרשאה מטבלה (`core.staff`) + `aal2` ב-RLS, אפס כתיבה ישירה מהדפדפן ל-PII, RPC בעלי שם לכל כתיבה.
2. **hooks של נעילה יוצאים**: `password_verification_attempt` ו-`mfa_verification_attempt` זמינים רק ב-Teams/Enterprise. נשאר רק `before_user_created` (Free/Pro). פיצוי: מגבלות הקצב המובנות של Auth, סיסמה 12+ עם HIBP, TOTP חובה, והעתקה כל 10 דקות של `auth.audit_log_entries` ל-`audit.auth_events` עם התראה על ≥10 כשלונות ב-15 דקות.
3. **אין RPC כתיבה ל-`anon` בשלב א'** (רשימת ה-allowlist ריקה ונבדקת ב-pgTAP). הצ'אט כותב רק דרך `service_role` מהפונקציה. בשלב ב' החריג היחיד והמוצהר: `api.portal_open` / `api.portal_submit` (טוקן מגובב, last-4 בשרת, קצב, נעילה).
4. **Preview לא נוגע בפרודקשן**: ל-Data API אין רשימת Origin (אומת), ולכן "preview קורא פרודקשן לקריאה בלבד" אינו בטוח. פתרון: ענף Supabase עמיד אחד בשם `preview` עם seed סינתטי (~$10 לחודש), בלי ענף לכל PR. `env-guard` ב-CI חוסם כל `VITE_SUPABASE_PROJECT_ID` של פרודקשן או טוקיו ב-preview.
5. **שער מיגרציות לפרודקשן**: required reviewers ב-GitHub Environment דורשים GitHub Enterprise במאגר פרטי (אומת). במקומו: `workflow_dispatch` עם Environment `production` (סודות + deployment branch = `main`) ובדיקת `github.actor` מול רשימה סגורה; PR שמשנה `supabase/migrations/**` דורש סקירה דרך `CODEOWNERS`.
6. cron: 7 → **5** (`notify-worker-tick`, `cma-sync-weekly` שמרענן matviews בתוכו, `cma-freshness-monthly`, `ops-watchdog` שכולל `cron_http_audit` וסריקת `net._http_response`, `ops-cleanup`). `sync-tracks` לא נפרס (המקור שבור מ-26.3.2026).
7. outbox: `ops.outbox` שכבר הוחל, עם v2 (`next_attempt_at`, `locked_until`, `dead` כ-DLQ, `Idempotency-Key` ל-Resend = `outbox.id`, תקציב זמן 60%). pgmq מגיע עם 06-09 ולא עכשיו.
8. נתונים: עוברים `blog_posts` (22), `investment_tracks` (571, קפוא ומסומן), 2 לידים; `cma_*` נבנה מהמקור; **`customers` (191) ו-`customer_financial_snapshot` (184) לא מועתקים** אלא לארכיון מוצפן אצל הבעלים (ת"ז בטקסט גלוי לא נכנסת לעולם). PDage, `client_access_links`, `page_views`, `insbase_links`, enums: לא נבנים.
9. אפליקציית הסוכנים הישנה: החבילה החדשה של `seeld.co.il` מכילה **אפס** הפניות לטוקיו (שער `no-tokyo-ref` ב-CI). אם הבעלים רוצה גישה זמנית ללקוחות הישנים, הפריסה הנוכחית ננעלת תחת alias נפרד (`legacy`) ל-30 יום לכל היותר. חלופה (העתקת 191 לקוחות ל-`crm.customers` עם HMAC) היא החלטת בעלים כי היא מעתיקה PII.
10. תרגולים מצומצמים למה ששני אנשים יקיימו: תרגיל שחזור רבעוני (issue אוטומטי), סיבוב סודות שנתי או בחשד, ו-dump מוצפן ידני חודשי (לא ב-GitHub).

---

## 1. עובדות שאומתו מול תיעוד רשמי (ומה הן משנות)

| טענה במחלוקת | מה התיעוד אומר | מקור | השפעה |
|---|---|---|---|
| hooks של ניסיון סיסמה/MFA זמינים ב-Pro | "MFA Verification Attempt: Teams and Enterprise; Password Verification Attempt: Teams and Enterprise; Before User Created / Custom Access Token: Free, Pro" | `https://supabase.com/docs/guides/auth/auth-hooks` | סעיף 4.4 של עיצוב 0 נמחק; נשאר `before_user_created` |
| "סכמה שנייה חשופה בלתי אפשרית" (עיצוב 2) | Exposed schemas מקבל כמה סכמות; `supabase.schema('myschema').from(...)` ו-`Accept-Profile`/`Content-Profile` | `https://supabase.com/docs/guides/api/using-custom-schemas` | `staff` כסכמה חשופה שנייה נשארת |
| "preview לא יכול לכתיב כי Origin נבדק" (עיצוב 1) | CORS בשער: "All origins allowed ... The auth boundary for Supabase APIs is the apikey header rather than the request origin" (מתואר כזהה להתנהגות הפלטפורמה) | `https://supabase.com/docs/guides/self-hosting/self-hosted-envoy` | preview חייב להצביע לפרויקט/ענף אחר |
| hook שקורא טבלה כ-`supabase_auth_admin` | התיעוד מוסיף `grant all on table ... to supabase_auth_admin` ו-`create policy ... to supabase_auth_admin using (true)`; ממליץ **לא** להשתמש ב-`security definer` ל-hooks | `https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac`, `https://supabase.com/docs/guides/auth/auth-hooks` | `hook_before_user_created` נכתב בלי definer, עם grants ו-policy ל-`supabase_auth_admin` על `core.invitations` ו-`audit.auth_events` |
| required reviewers ב-Environment עם GitHub Pro/Team | "If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, other deployment protection rules, such as a wait timer or required reviewers, are only available for public repositories" | `https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments` | שער אנושי = `workflow_dispatch` + בדיקת actor + CODEOWNERS; לא "דורש Pro" |
| `verify_jwt` עם מפתחות `sb_publishable_*` | הבדיקה מצפה ל-JWT של משתמש ב-`Authorization`; מפתחות API אינם JWT; להשאיר `verify_jwt` לפונקציות שנקראות עם JWT משתמש, לכבות לפונקציות ללא `Authorization` | `https://supabase.com/docs/guides/functions/auth-headers` | `staff-invite` = `true`; `lead-intake`, `chat-bot`, פונקציות cron = `false` עם אימות בקוד. לא "false אחיד" |
| `getClaims()` מאמת מקומית | רק עם מפתחות חתימה אסימטריים (ECC/RSA); אחרת פנייה לשרת Auth | `https://supabase.com/docs/reference/javascript/auth-getclaims` | מפתחות חתימה אסימטריים (P-256) מופעלים ביום 1 (פעולת בעלים) |
| log drains רק ב-Team | "Log Drains are available as a project Add-On for all Pro, Team and Enterprise users ... $60 per month" | `https://supabase.com/docs/guides/platform/manage-your-usage/log-drains` | אופציה ל-S3 של הבעלים בעתיד; לא נדרש עכשיו כי הרשומה הפורנזית היא `audit.*` במסד |
| עלות ענף Supabase | "A branch running on the default Micro Compute size starts at $0.01344 per hour"; Compute Credits לא חלים | `https://supabase.com/docs/guides/platform/manage-your-usage/branching` | ענף `preview` עמיד ≈ $10 לחודש |
| PITR | Pro/Team/Enterprise כתוסף, ~$100 לחודש ל-7 ימים, דורש Small compute לפחות | `https://supabase.com/docs/guides/platform/backups` | PITR נדחה עד מסמכי לקוח; אז גם Small |
| גיבויים ב-Pro | 7 ימים של גיבוי יומי | כנ"ל | dump ידני חודשי של הבעלים כהשלמה |
| `x-forwarded-for` | התיעוד מציע `split_part(..., ',', 1)` לפריט הראשון | `https://supabase.com/docs/guides/api/securing-your-api` | הפריט הראשון ניתן לזיוף על ידי לקוח; לכן `cf-connecting-ip` קודם, IP הוא בקרה משנית אחרי Turnstile, ואימות הכותרות בבקשת בדיקה ביום 1 |

---

## 2. עקרונות (נשמרים מעיצוב 0, עם שלוש הבהרות)

1. סגור כברירת מחדל: `revoke all` על כל סכמה, `alter default privileges` שמבטל `execute`/`select`, event trigger שמדליק RLS (כבר ביסוד 01).
2. שלוש דלתות: גולש (`anon`), לקוח (`authenticated` + `core.client_accounts`), צוות (`authenticated` + `core.staff` + `aal2`). **הבהרה**: הגבול המבני של סכמת `staff` חל על `anon` בלבד (אין `usage`); בין לקוח לצוות הגבול הוא RLS ו-`is_staff()`, והבדיקה האוטומטית מוכיחה את שניהם.
3. זהות מה-JWT (`sub`, `aal`, `amr`, `session_id`), הרשאה מהמסד. אין Custom Access Token hook. ביטול = שורה אחת, תקף מיידית.
4. הדפדפן לא כותב PII: כל כתיבה ל-`crm`/`core` היא RPC `security definer` עם שם פעולה, ולידציה, בדיקת תפקיד ו-aal, מתג כיבוי, קצב ו-audit. כתיבה דרך view רק לתוכן ציבורי.
5. מידע מזהה רגיש לא קיים בטקסט גלוי: ת"ז = HMAC עם מפתח Vault מגורסה + עמודה מוצפנת; IP = HMAC עם pepper; ת"ז/טלפון/אימייל לא ביומנים ולא בתור.
6. כל גישה לנתוני לקוח מתועדת: `audit.log` (שינויים), `audit.access_log` (קריאות), `audit.auth_events` (אימות); 25 חודשים.
7. קליטה ציבורית חסינה: Turnstile, Origin בפונקציה, קצב בשלוש שכבות, `Idempotency-Key` עם תשובה שמורה, גבולות גודל, honeypot, אימייל התראה בלי PII. **הבהרה**: בדיקת `rendered_at` נמחקת (ניתנת לזיוף, ביטחון כוזב).
8. סוד = שם + מקום אחד. אף סוד ב-`cron.job.command`, בגיט או בלוג.
9. הבטחת אבטחה שאינה בדיקה אוטומטית אינה קיימת (`ci-ok`).
10. מתגי כיבוי ב-`ops.config`, נבדקים בכל RPC ופונקציה.
11. הפרדת סביבות: preview לעולם לא מצביע לפרודקשן או לטוקיו (CI), ולעולם לא מחזיק נתוני אמת.
12. **הבהרה**: פשטות אחרי אבטחה, אבל טקס שלא יתקיים אינו בקרה. לוח התרגולים מצומצם למה ששני אנשים יקיימו.

---

## 3. סכמות ובעלות (דלתא על היסוד)

| סכמה | מחזיקה | חשופה | `usage` | שינוי מול היסוד |
|---|---|---|---|---|
| `api` | views `security_invoker` לתוכן ציבורי (`blog_posts`, `travel_companies`, `investment_tracks`, `cma_sync_log`, `cma_funds_latest`, `cma_board`, `cma_company_map`), `api.me()`, `api.submit_lead` (ל-`service_role` בלבד), `api.health()`; שלב ב': `api.portal_*`, `api.client_*` | כן | `anon`, `authenticated`, `service_role` | `api.leads` מוסר (עובר ל-`staff.leads`); `submit_lead` נסגר ל-`anon` |
| `staff` | `staff.leads`, `staff.lead_notes`, `staff.ops_health`, `staff.audit_recent`; RPC `staff.lead_set_status`, `lead_assign`, `lead_note_add`, `admin_*`; שלב ב': `staff.customers`, `documents`, `portal_link_issue` | כן | `authenticated`, `service_role` (**לא** `anon`) | חדש |
| `content` | כפי שהוחל + עמודה `source_frozen_at` ל-`investment_tracks`; `content.refresh_fund_views()`, `content.cma_check_freshness()` | לא | `anon`, `authenticated`, `service_role` | `grant delete` על `blog_posts`/`travel_companies` ל-`authenticated` **מוסר** (מחיקה = `status='archived'`); policies `blog_delete`/`travel_delete` נמחקות |
| `core` | `agencies` (חדש), `staff` (+`agency_id`), `client_accounts`, `invitations` (חדש) | לא | `authenticated`, `service_role`, `supabase_auth_admin` (select על `invitations` בלבד) | `agency_id` מיום 1 |
| `crm` | `leads` (+`agency_id`, +`suspect`), `lead_notes` (חדש), `chat_sessions`, `chat_messages` (חדש, `session_hash`); שלב ב': `customers`, `customer_identities`, `documents`, `portal_links`, `portal_events` | לא | `authenticated`, `service_role` | `grant insert/update` ל-`authenticated` על `crm.leads` **מוסר**; policies `leads_insert`/`leads_update` נמחקות |
| `ops` | `config`, `rate_limits`, `outbox` (v2), `idempotency_keys`, `job_runs`, `alerts`, `alert_recipients` | לא | `service_role` | חדש: `call_function`, `job_finish`, `raise_alert`, `watchdog`, `cron_http_audit`, `outbox_claim/complete` |
| `audit` | `log` (`op` מורחב), `access_log`, `auth_events` | לא | `service_role`, `supabase_auth_admin` (insert ב-`auth_events`) | חדש |
| `private` | כפי שהוחל + `is_fresh_mfa`, `my_agency_id`, `kill_switch`, `assert_staff`, `assert_admin_fresh`, `log_access`, `hook_before_user_created` | לא | `authenticated`, `service_role`, `supabase_auth_admin` | חדש |
| `public` | ריק; נבדק ב-pgTAP (`count(pg_tables where schemaname='public') = 0`) | לא | אף אחד | אינווריאנט חדש |

Exposed schemas בדשבורד: `api, staff`. Extra search path: `extensions`. `max_rows`: 1000. GraphQL כבוי.

### 3.1 שמות
טבלאות ברבים `snake_case`; RPC `<schema>.<object>_<verb>`; policies `<table>_<action>_<role>` (אחת לכל טבלה×פעולה×תפקיד, תמיד `to <role>`, תמיד `(select ...)`); מפתחות Vault `<purpose>_<kind>_v<N>` (`national_id_hmac_key_v1`, `edge_cron_secret`, `project_url`); מתגים `<feature>_enabled`; מיגרציות `YYYYMMDDHHMMSS_<topic>.sql`.

---

## 4. מודל הרשאות

### 4.1 פונקציות עזר חדשות (כולן `set search_path = ''`, `revoke from public, anon`)

```sql
create table core.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table core.agencies enable row level security;
revoke all on core.agencies from anon, authenticated;
grant select on core.agencies to authenticated;
create policy agencies_select_authenticated on core.agencies for select to authenticated
  using (id = (select private.my_agency_id()));

alter table core.staff add column agency_id uuid references core.agencies (id);
alter table crm.leads  add column agency_id uuid references core.agencies (id);
alter table crm.leads  add column suspect boolean not null default false;
-- one-off backfill in the same migration: set every null agency_id to the single seeded agency, then set not null.

create or replace function private.my_agency_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select s.agency_id from core.staff s where s.user_id = (select auth.uid()) and s.active $$;

create or replace function private.is_fresh_mfa(p_max_age integer default 900) returns boolean
language sql stable set search_path = '' as $$
  select private.jwt_aal() = 'aal2' and exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) a
    where a ->> 'method' = 'totp'
      and to_timestamp((a ->> 'timestamp')::bigint) > now() - make_interval(secs => p_max_age)) $$;

create or replace function private.kill_switch(p_key text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce((select value from ops.config where key = p_key), 'true') <> 'true' then
    raise exception 'feature_disabled:%', p_key using errcode = 'PT423';
  end if;
end $$;

create or replace function private.assert_staff() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'unauthenticated' using errcode = 'PT401'; end if;
  if not private.is_staff() then raise exception 'forbidden:staff_aal2' using errcode = 'PT403'; end if;
  return (select auth.uid());
end $$;

create or replace function private.assert_admin_fresh() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.assert_staff();
  if private.staff_role() <> 'admin'
     or not private.is_fresh_mfa(coalesce((select value from ops.config where key = 'stepup_max_age_sec'), '900')::int)
  then raise exception 'forbidden:admin_fresh_totp' using errcode = 'PT403'; end if;
  return (select auth.uid());
end $$;

create table audit.access_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid, actor_role text, session_id text,
  action text not null, customer_ids uuid[] not null default '{}', row_count integer not null default 0,
  request_id text);
create index access_log_at_idx on audit.access_log (at desc);
create index access_log_customer_idx on audit.access_log using gin (customer_ids);
alter table audit.access_log enable row level security;
revoke all on audit.access_log from anon, authenticated;
create policy deny_api_roles on audit.access_log for all to anon, authenticated using (false) with check (false);
create trigger access_log_append_only before update or delete on audit.access_log
  for each row execute function audit.block_mutation();

create or replace function private.log_access(p_action text, p_customer_ids uuid[], p_rows integer) returns void
language sql security definer set search_path = '' as $$
  insert into audit.access_log (actor, actor_role, session_id, action, customer_ids, row_count, request_id)
  values ((select auth.uid()), private.staff_role(), auth.jwt() ->> 'session_id', p_action, coalesce(p_customer_ids,'{}'), p_rows,
          nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id') $$;

-- audit.log op widened; the existing trigger tests keep passing (INSERT/UPDATE/DELETE unchanged)
alter table audit.log drop constraint audit_log_op_check;
alter table audit.log add constraint audit_log_op_check check (op in ('INSERT','UPDATE','DELETE','ACTION','ACCESS'));
```

### 4.2 תקן grants (קובץ `..._rls_standard.sql`; כל טבלה חדשה מעתיקה)

```sql
-- table: RLS on (event trigger), zero implicit privileges
alter table crm.leads enable row level security;
revoke all on crm.leads from public, anon, authenticated;
grant select on crm.leads to authenticated;                         -- read via staff.leads only
grant select, insert, update, delete on crm.leads to service_role;   -- RPC (definer) is the only writer
-- public content: read anon+authenticated, insert/update authenticated (RLS = staff), NEVER delete/truncate/references/trigger
revoke delete on content.blog_posts, content.travel_companies from authenticated;
-- exposed views mirror the base grant exactly
grant select on staff.leads to authenticated;
-- functions: execute only to the caller that must call it
revoke all on function api.submit_lead(jsonb, text, text) from public, anon, authenticated;
grant execute on function api.submit_lead(jsonb, text, text) to service_role;
```

### 4.3 צורות policy (ארבע תבניות, אין חמישית)

```sql
-- A. public content (already applied for blog/travel/tracks); delete policies dropped
drop policy blog_delete on content.blog_posts; drop policy travel_delete on content.travel_companies;

-- B. staff PII: read through view, write through RPC only
drop policy leads_insert on crm.leads; drop policy leads_update on crm.leads;
drop policy leads_select on crm.leads;
create policy leads_select_authenticated on crm.leads for select to authenticated
  using ((select private.is_staff()) and agency_id = (select private.my_agency_id()));

-- C. client ownership (phase B): customer_id = my_customer_id() or is_staff(); index on customer_id
-- D. explicit deny on service tables (applied in 08; extended to every new ops/audit table)
create policy deny_api_roles on ops.idempotency_keys for all to anon, authenticated using (false) with check (false);
```

### 4.4 דוגמת RPC של צוות

```sql
create or replace function staff.lead_set_status(p_lead_id uuid, p_status text, p_reason text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_actor uuid := private.assert_staff(); v_old text;
begin
  if p_status not in ('new','contacted','qualified','won','lost','spam') then
    raise exception 'invalid_input:status' using errcode = 'PT400'; end if;
  select status into v_old from crm.leads
   where id = p_lead_id and deleted_at is null and agency_id = (select private.my_agency_id()) for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if v_old = p_status then return jsonb_build_object('ok', true, 'unchanged', true); end if;
  update crm.leads set status = p_status where id = p_lead_id;   -- row trigger records changed_cols
  insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, new_data)
  values (v_actor, private.staff_role(), 'crm.leads', 'ACTION', p_lead_id::text, array['status'],
          jsonb_build_object('action','lead_set_status','from',v_old,'to',p_status,'reason',left(p_reason,200)));
  return jsonb_build_object('ok', true);
end $$;
revoke all on function staff.lead_set_status(uuid, text, text) from public, anon;
grant execute on function staff.lead_set_status(uuid, text, text) to authenticated;
```

חוזה אחיד לכל RPC: פרמטרים `p_*`, מחזיר `jsonb`, שגיאות `SQLSTATE` `PT400/401/403/404/409/410/423/429` שממופות ל-HTTP על ידי PostgREST.

### 4.5 בדיקות (pgTAP, חובה ב-`ci-ok`)

מטריצת שבעה אקטורים לכל טבלה: `anon`, לקוח א', לקוח ב', צוות aal1, צוות aal2, מנהל aal2, צוות מושבת. ובנוסף `00_policy_lint.test.sql`:

```sql
select is((select count(*)::int from pg_tables where schemaname = 'public'), 0, 'public holds no tables');
select is((select count(*) from pg_policies where schemaname in ('crm','core','ops','audit')
           and (qual = 'true' or with_check = 'true')), 0::bigint, 'no USING(true) on private schemas');
select set_eq($$ select schemaname||'.'||tablename||':'||policyname from pg_policies where qual = 'true' $$,
              $$ values ('content.cma_sync_log:sync_log_select_anon'), ('content.cma_sync_log:sync_log_select_auth') $$,
              'using(true) allowlist');
select is((select count(*) from pg_policies where schemaname in ('crm','core','content','ops','audit') and roles = '{public}'),
          0::bigint, 'every policy names a role');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname in ('api','staff','private','ops','audit','content','crm','core') and p.prosecdef
           and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')),
          0::bigint, 'every security definer pins search_path');
select ok(not has_schema_privilege('anon','staff','usage'), 'anon cannot see staff');
select ok(not has_schema_privilege('anon','crm','usage') and not has_schema_privilege('anon','core','usage')
          and not has_schema_privilege('anon','ops','usage') and not has_schema_privilege('anon','audit','usage'));
select is_empty($$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                   where n.nspname in ('api','staff') and p.provolatile = 'v' and has_function_privilege('anon', p.oid, 'execute') $$,
                'phase A: anon can execute no volatile RPC');          -- phase B replaces with set_eq {portal_open, portal_submit}
select is_empty($$ select grantee||' '||table_schema||'.'||table_name from information_schema.role_table_grants
                   where grantee in ('anon','authenticated') and table_schema in ('ops','audit','pgmq','vault') $$,
                'client roles have no grants on ops/audit/pgmq/vault');
select is((select count(*) from information_schema.role_table_grants
           where grantee in ('anon','authenticated') and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER','DELETE')
           and table_schema in ('api','staff','content','crm','core')), 0::bigint, 'no delete/truncate/references/trigger to API roles');
select is((select count(*) from pg_views v join pg_class c on c.relname = v.viewname
           join pg_namespace n on n.oid = c.relnamespace and n.nspname = v.schemaname
           where v.schemaname in ('api','staff')
           and coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker'),'false') <> 'true'),
          0::bigint, 'every exposed view is security_invoker');
select is_empty($$ select jobname from cron.job where command ~* 'http|secret|bearer' $$, 'cron commands carry no URL or secret');
select is_empty($$ select 1 from pg_policies where schemaname in ('crm','core') and 'anon' = any(roles) $$,
                'no anon policy on any PII table');
```

---

## 5. Auth

### 5.1 צוות
אימייל + סיסמה (12+, `lower_upper_letters_digits_symbols`, HIBP) + **TOTP חובה**. בלי TOTP הסשן `aal1` ורואה אפס נתונים פרטיים (RLS); ההרשמה ל-TOTP היא הזרם היחיד המותר ב-`aal1`. יצירה רק בהזמנה: `staff-invite` (edge, `verify_jwt=true`) קורא `staff.admin_assert_fresh()`, **מכניס קודם** שורה ל-`core.invitations`, ואז `auth.admin.inviteUserByEmail`, ואז `core.staff` + `audit.log` (סדר זה חובה כי ה-hook דוחה אימייל ללא הזמנה). פעולות אדמין דורשות `is_fresh_mfa(900)`; ה-UI מבקש `mfa.challengeAndVerify` לפני. שלושת משתמשי Google מטוקיו לא מועתקים.

### 5.2 לקוחות
שלב א': אין. שלב ב': `staff.customer_create` (ת"ז רק כ-HMAC + מוצפן ב-`crm.customer_identities`), `client-invite`, כניסה ב-OTP אימייל 8 ספרות (`shouldCreateUser=false`), `api.client_bind_identity(p_national_id)` בכניסה הראשונה (3 כשלונות = `locked`); SMS OTP מאוחר יותר דרך Send SMS hook (Free/Pro).

### 5.3 הגדרות כקוד (`supabase/config.toml`; נדחפות עם `supabase config push` אם זמין ב-CLI, אחרת מועתקות לדשבורד פעם אחת ונבדקות ב-smoke)

```toml
project_id = "qxhpolktdfgcbxtfxgov"

[api]
schemas = ["api", "staff"]
extra_search_path = ["extensions"]
max_rows = 1000

[auth]
site_url = "https://seeld.co.il"
additional_redirect_urls = ["https://seeld.co.il/**"]
jwt_expiry = 900
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = false
enable_anonymous_sign_ins = false
enable_manual_linking = false
minimum_password_length = 12
password_requirements = "lower_upper_letters_digits_symbols"
[auth.sessions]
timebox = "12h"
inactivity_timeout = "1h"
[auth.email]
enable_signup = false
double_confirm_changes = true
enable_confirmations = true
secure_password_change = true
otp_length = 8
otp_expiry = 600
max_frequency = "1m0s"
[auth.sms]
enable_signup = false
[auth.mfa]
max_enrolled_factors = 2
[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
[auth.mfa.phone]
enroll_enabled = false
verify_enabled = false
[auth.rate_limit]
email_sent = 10
sms_sent = 0
anonymous_users = 0
token_refresh = 150
sign_in_sign_ups = 20
token_verifications = 20
[auth.hook.before_user_created]
enabled = true
uri = "pg-functions://postgres/private/hook_before_user_created"

[functions.lead-intake]
verify_jwt = false
[functions.notify-worker]
verify_jwt = false
[functions.chat-bot]
verify_jwt = false
[functions.fetch-cma-data]
verify_jwt = false
[functions.health]
verify_jwt = false
[functions.staff-invite]
verify_jwt = true
```

בדשבורד (פעולות בעלים): SMTP דרך Resend עם SPF/DKIM/DMARC לדומיין; Leaked password protection; **JWT signing keys אסימטריים (ECC P-256)** והעברת המפתח הנוכחי ל-standby; כל ספקי OAuth כבויים; Phone כבוי; legacy `anon`/`service_role` JWT keys מבוטלים אחרי cutover; preview redirect URLs רק על ענף `preview`.

### 5.4 hook יחיד: `before_user_created` (Free/Pro), לפי תבנית התיעוד (ללא definer)

```sql
create table core.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null, kind text not null check (kind in ('staff','client')),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days', accepted_at timestamptz,
  created_at timestamptz not null default now());
create unique index invitations_open_email_idx on core.invitations (lower(email)) where accepted_at is null;
alter table core.invitations enable row level security;
revoke all on core.invitations from anon, authenticated;
grant select on core.invitations to supabase_auth_admin;
create policy invitations_select_auth_admin on core.invitations for select to supabase_auth_admin using (true);  -- allowlisted in policy lint

create table audit.auth_events (
  id bigint generated always as identity primary key, at timestamptz not null default now(),
  user_id uuid, kind text not null, ok boolean not null, ip_hash bytea, source text not null default 'gotrue', payload jsonb);
alter table audit.auth_events enable row level security;
revoke all on audit.auth_events from anon, authenticated;
grant insert on audit.auth_events to supabase_auth_admin;
grant usage on schema private, core, audit to supabase_auth_admin;

create or replace function private.hook_before_user_created(event jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare v_email text := lower(event #>> '{user,email}');
begin
  if not exists (select 1 from core.invitations i where lower(i.email) = v_email and i.expires_at > now() and i.accepted_at is null) then
    insert into audit.auth_events (kind, ok, source) values ('user_created_denied', false, 'hook');
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'ההרשמה בהזמנה בלבד.'));
  end if;
  return '{}'::jsonb;
end $$;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.hook_before_user_created(jsonb) from public, anon, authenticated;
```

### 5.5 פיצוי על היעדר hooks של נעילה
מגבלות הקצב המובנות של Auth (`sign_in_sign_ups=20` ל-5 דקות ל-IP, `token_verifications=20`); סיסמה 12+ עם HIBP; TOTP חובה (סיסמה שדלפה לבדה לא פותחת כלום); ו-`ops.watchdog()` כל 10 דקות מעתיק שורות חדשות מ-`auth.audit_log_entries` ל-`audit.auth_events` (`source='gotrue'`, בלי PII, לפי `id`/`created_at` אחרון) ומעלה `warning` על ≥10 `login_failed`/`mfa_challenge_verified=false` ב-15 דקות ו-`critical` על ≥30. תגובה: `staff.admin_staff_disable` + `auth.admin.signOut(user,'global')`. כאשר הארגון יעלה ל-Team, שני ה-hooks מתווספים כמיגרציה בלי שינוי מודל.

---

## 6. קליטת לידים

### 6.1 זרימה
```
דפדפן (טופס + Turnstile) → POST https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/lead-intake
  1. OPTIONS/CORS: Origin ∈ ALLOWED_ORIGINS, אחרת 403
  2. גוף ≤ 32KB, JSON בלבד (413/400)
  3. honeypot `hp` ריק, אחרת 200 {ok:true,id:null} בלי אחסון
  4. zod לפי kind
  5. Turnstile siteverify עם remoteip = cf-connecting-ip
  6. Idempotency-Key (uuid שנוצר בפתיחת הטופס) → p_idem_key
  7. api.submit_lead(p_payload, p_idem_key, p_client_ip) עם SEELD_SECRET_KEY (service_role)
→ submit_lead: kill switch → קצב (IP 8/10 דק', email 3/שעה, גלובלי 300/שעה) → ולידציה → idempotency → insert crm.leads → private.enqueue
→ notify-worker (cron כל דקה): אימייל לצוות בלי PII: "פנייה חדשה (ביטוח) · https://seeld.co.il/app/leads/<id>"
```
**אין** rewrite `/api/lead` ב-Vercel (היה מכניס hop של Vercel ומאחד את כל הגולשים ל-IP אחד מול Turnstile ומגבלת הקצב). **אין** אימייל אישור ללקוח בשלב א' (וקטור spam לכתובת שרירותית; החלטת בעלים). `send-calculation-email` לא מועבר.

### 6.2 חוזה `lead-intake`
```
POST /functions/v1/lead-intake
Headers: content-type: application/json; idempotency-key: <uuid>; x-request-id?: <uuid>
Body: { kind: 'insurance'|'pension'|'contact'|'portfolio_review'|'report', full_name, phone?, email?, message?,
        payload?: object, utm?: object, consent: true, consent_version: 'v1', source?: string, hp?: '', turnstile_token }
200 {ok:true,id}  400 {error:'invalid_input:<field>'}  403 {error:'origin'|'turnstile'}  409 {error:'idempotency_conflict'}
413  423 {error:'feature_disabled'}  429 {error:'rate_limited', retry_after}
```

### 6.3 `api.submit_lead` v2 (מחליף את החתימה שהוחלה)
- חתימה: `api.submit_lead(p_payload jsonb, p_idem_key text, p_client_ip text default null)`; `grant execute ... to service_role` בלבד; הפונקציה הישנה (11 פרמטרים) נמחקת.
- `p_client_ip` מתקבל רק כשה-`auth.role() = 'service_role'`; אחרת `private.client_ip()`.
- `private.client_ip()` מתוקן: `cf-connecting-ip` קודם; אחרת **הפריט האחרון** של `x-forwarded-for` (ההופ שהשער הוסיף), לא הראשון. אימות ביום 1: בקשת בדיקה שמדפיסה את הכותרות שמגיעות לפונקציה ול-PostgREST. ה-IP הוא בקרה משנית; הראשית היא Turnstile והמפתח הגלובלי.
- idempotency אמיתי: `ops.idempotency_keys (key text primary key, request_hash bytea, response jsonb, created_at)`; אותו מפתח ב-48 שעות = התשובה השמורה; אותו מפתח עם `request_hash` שונה = `PT409`. "אותו טלפון/אימייל ב-10 דקות" נשאר כרשת שנייה.
- `perform private.kill_switch('intake_enabled')`; `utm` מוגבל למפתחות `utm_source, utm_medium, utm_campaign, utm_content, utm_term, ref` ≤100 תווים כל אחד; `agency_id` מ-`ops.config.default_agency_id`.
- `payload.rendered_at`: **לא** נבדק (נמחק).

### 6.4 שכבות קצב
| שכבה | מפתח | מגבלה |
|---|---|---|
| Vercel Firewall | IP על `/api/*` | 60/דקה; managed bot ruleset; Attack Challenge Mode ב-runbook |
| `lead-intake` | Turnstile לכל בקשה; IP (זיכרון קצר) | 20/דקה ל-IP |
| מסד | `lead_ip` 8/10 דק', `lead_email` 3/שעה, `lead_all` 300/שעה | `PT429` |

### 6.5 מיפוי טפסים בקוד
| מקור | יעד |
|---|---|
| `Contact.tsx`, `Index.tsx`, `Report.tsx`, `BlogPost.tsx`, `PortfolioReviewForm.tsx`, `RetireForm.tsx` | `lead-intake` `kind='contact'|'report'|'portfolio_review'`, `payload.subject` |
| `InsuranceEnrollmentForm.tsx` | `kind='insurance'`, `payload.insurance_type` ∈ רשימה סגורה |
| `PensionAnalysisForm.tsx` | `kind='pension'`, `payload.focus_area` |
| `RequestsPanel.tsx`, `Onboarding.tsx`, `DirectDebit.tsx` | שלב ב' (RPC של לקוח / שאלונים); עד אז "בקרוב" |
| `SaveCalculationButton.tsx` → `send-calculation-email` | לא מועבר; חלופה: PDF בצד לקוח |
| `App.tsx` → `page_views` + `/api/geo` | נמחק; Vercel Web Analytics |
| `AIChatBot.tsx` → `finance-chat`, כתיבה ישירה ל-`chat_messages` | `chat-bot` + כתיבה ב-`service_role`; `ClientAIChatbot`/`ChatTab` לא בשלב א' |
| `AppProviderImpl.tsx` ו-41 קבצים עם 107 קריאות DML ישירות | שלב א': רק מסכי לידים ובלוג מחוברים (`staff.leads` + RPC, `api.blog_posts`); שאר המסכים (לקוחות, מוצרים, המלצות, ביצוע, ייבוא, PDage, לוגו) מוסרים מה-router עד שלב ב' |

כל הטפסים דרך עטיפה אחת `src/lib/leadIntake.ts`; ווידג'ט Turnstile נטען עצלני כשהטופס נכנס ל-viewport; במצב `VITE_APP_ENV=preview` הטופס מציג "תצוגה מקדימה, לא נשלח". בדיקת CI `intake-keys`: מפתחות ה-zod ⊆ רשימת `kind`/`payload` המותרת ב-`submit_lead`.

---

## 7. Edge functions

| פונקציה | `verify_jwt` | אימות בפועל | קורא | סודות (שמות) | כותבת |
|---|---|---|---|---|---|
| `lead-intake` | false | Origin + Turnstile + קצב | דפדפן | `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS`, `SEELD_SECRET_KEY` | `api.submit_lead` |
| `notify-worker` | false | `x-cron-secret` (זמן קבוע) | pg_cron | `EDGE_CRON_SECRET`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL`, `NOTIFY_INCLUDE_PII` (ברירת מחדל `false`), `SEELD_SECRET_KEY` | `ops.outbox_claim/complete`, `ops.job_finish`, `ops.alerts` |
| `chat-bot` | false | Origin + מתג `chat_enabled` + קצב session/IP | דפדפן | `GOOGLE_AI_API_KEY`, `ALLOWED_ORIGINS`, `CHAT_MAX_INPUT_CHARS`=1000, `CHAT_TIMEOUT_MS`=12000, `SEELD_SECRET_KEY` | `crm.chat_sessions`/`chat_messages` ב-service (session_hash = sha256) |
| `fetch-cma-data` | false | `x-cron-secret` | pg_cron שבועי | `EDGE_CRON_SECRET`, `SEELD_SECRET_KEY` | `content.cma_funds`, `cma_sync_log`, קוראת `content.refresh_fund_views()` בסיום, `ops.job_finish` |
| `staff-invite` | true | JWT (`getClaims` מול JWKS) + `staff.admin_assert_fresh()` | אפליקציית הצוות | `SEELD_SECRET_KEY` | `core.invitations`, `auth.users` (invite), `core.staff`, `audit.log` |
| `health` | false | אין; מחזיר רק `ok/degraded` וגילאים מעוגלים | `site-watch`, Vercel | `SUPABASE_PUBLISHABLE_KEY` | קריאה `api.health()` |
| שלב ב' | | | | | `client-invite`, `upload-url`, `document-worker`, `auth-sms-hook`, `queue-worker` |

**לא מועברים**: `send-lead-notification`, `send-calculation-email`, `send-onboarding-summary`, `admin-verify`, `invite-agent` (מוחלף), `sync-tracks` (לא נפרס עד תיקון המקור), `fetch-bank-branches` (קובץ סטטי ב-`public/` או `api/bank-branches.ts` עם `s-maxage=86400`), `noa-onboarding`, `finance-chat` (מוחלף ב-`chat-bot`), `parse-*`, `generate-recommendation`, `pdage-chat`, `process-correction`, `validate-correction`, `api-v1`, `tmp-tiny-upload`.

**הערה על סודות**: שמות שמתחילים ב-`SUPABASE_` שמורים לפלטפורמה ואינם ניתנים להגדרה ידנית, לכן המפתח הסודי החדש (`sb_secret_*`) נשמר כ-`SEELD_SECRET_KEY`.

### 7.1 תקנים משותפים (`supabase/functions/_shared/`, קיימים: `cors.ts`, `errors.ts`, `logger.ts`, `rateLimit.ts`, `auth.ts`, `request.ts`, `alerts.ts`, `queueWorker.ts`)
- `env.ts` (חדש): קריאת סודות בשם עם zod; חסר = כישלון בעלייה (`config_missing`); בדיקת deno: אין `VITE_` (הפגם של `parse-import-file`).
- `cors.ts`: `ALLOWED_ORIGINS` מפוצל; `Access-Control-Allow-Origin: <origin שהותאם>`, `Vary: Origin`, methods `POST, OPTIONS`, headers `authorization, apikey, content-type, idempotency-key, x-request-id`, `Max-Age: 600`; לעולם לא `*`; Origin חסר מותר רק בפונקציות cron.
- `auth.ts`: `requireCronSecret(req)` (`crypto.subtle.timingSafeEqual`), `requireUser(req)` (`getClaims` מקומי מול JWKS, מחזיר `sub`, `aal`, `amr`), `requireStaffFresh(req)` (RPC `staff.admin_assert_fresh`).
- `logger.ts`: JSON עם `request_id`, `fn`, `ms`, `code`; הסתרת ת"ז (9 ספרות), טלפון, אימייל, טוקנים; בדיקות יחידה.
- `errors.ts`: `{ error: { code, message_he, request_id } }`; אין stack traces.
- `queueWorker.ts`: תקציב זמן, עוצר ב-60% מ-`locked_until` ומשחרר את שאר האצווה.
- imports נעולים (`npm:@supabase/supabase-js@2.x.y`, `jsr:@std/...@x.y.z`); `deno check` + `deno test` ב-CI; `config.toml` כולל כל תיקיית פונקציה עם `verify_jwt` מפורש; CI משווה ל-`supabase functions list --project-ref`.
- `x-request-id` מהדפדפן → `crm.leads` (עמודת `request_id` חדשה) → `audit.log.request_id` → נושא האימייל; ליד נעקב מהטופס עד המייל.

---

## 8. משימות מתוזמנות, outbox, זיהוי כשל שקט

### 8.1 wrapper יחיד
```sql
-- owner, once, never in git:
-- select vault.create_secret('https://qxhpolktdfgcbxtfxgov.supabase.co', 'project_url');
-- select vault.create_secret(encode(gen_random_bytes(32),'hex'), 'edge_cron_secret');  -- same value as EDGE_CRON_SECRET edge secret

create table ops.job_runs (
  id bigint generated always as identity primary key, job text not null,
  started_at timestamptz not null default now(), finished_at timestamptz, ok boolean, stats jsonb, request_id bigint, error text);
create index job_runs_job_started_idx on ops.job_runs (job, started_at desc);

create or replace function ops.call_function(p_name text, p_body jsonb default '{}'::jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_url text; v_secret text; v_req bigint; v_run bigint;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'edge_cron_secret';
  if v_url is null or v_secret is null then raise exception 'vault_secret_missing' using errcode = '55000'; end if;
  insert into ops.job_runs (job) values (p_name) returning id into v_run;
  select net.http_post(url := v_url || '/functions/v1/' || p_name,
    headers := jsonb_build_object('content-type','application/json','x-cron-secret',v_secret,
                                  'x-request-id', gen_random_uuid()::text, 'x-job-run', v_run::text),
    body := p_body, timeout_milliseconds := 20000) into v_req;
  update ops.job_runs set request_id = v_req where id = v_run;
  return v_req;
end $$;
revoke all on function ops.call_function(text, jsonb) from public, anon, authenticated;

create or replace function ops.job_finish(p_run bigint, p_ok boolean, p_stats jsonb default '{}'::jsonb, p_error text default null) returns void
language sql security definer set search_path = '' as $$
  update ops.job_runs set finished_at = now(), ok = p_ok, stats = p_stats, error = left(p_error, 500) where id = p_run $$;
grant execute on function ops.job_finish(bigint, boolean, jsonb, text) to service_role;
```
`cron.job.command` מכיל רק `select ops.call_function('notify-worker')`. הבריאות נמדדת ב-`ops.job_runs.finished_at`, לעולם לא ב-`cron.job_run_details.status` ("הצליח" = הבקשה נשלחה).

### 8.2 לוח (5 משימות)
| שם | לוח (UTC) | פקודה |
|---|---|---|
| `notify-worker-tick` | `* * * * *` | `select ops.call_function('notify-worker')` |
| `cma-sync-weekly` | `0 3 * * 0` | `select ops.call_function('fetch-cma-data')` (הפונקציה מרעננת matviews בסיומה; `cma-refresh-views-daily` לא נוצר) |
| `cma-freshness-monthly` | `30 4 12 * *` | `select content.cma_check_freshness()` (`stale` כבר באילוץ) |
| `ops-watchdog` | `*/10 * * * *` | `select ops.watchdog()` |
| `ops-cleanup` | `17 * * * *` | `select ops.cleanup()` (קיים; retention מעודכן) |

`tracks-sync-weekly` לא נוצר; מתג `tracks_sync_enabled=false`; הטבלה מוצגת "נכון ל-<source_frozen_at>".

### 8.3 outbox v2 (על `ops.outbox` שהוחל)
```sql
alter table ops.outbox add column next_attempt_at timestamptz not null default now(),
  add column locked_until timestamptz, add column last_error text;
alter table ops.outbox drop constraint outbox_status_check;
alter table ops.outbox add constraint outbox_status_check check (status in ('pending','processing','sent','dead'));
create index outbox_due_idx on ops.outbox (next_attempt_at) where status in ('pending','processing');

create or replace function ops.outbox_claim(p_limit integer default 20) returns setof ops.outbox
language sql security definer set search_path = '' as $$
  with c as (select id from ops.outbox
             where (status = 'pending' or (status = 'processing' and locked_until < now())) and next_attempt_at <= now()
             order by id limit least(greatest(p_limit,1),50) for update skip locked)
  update ops.outbox o set status = 'processing', locked_until = now() + interval '2 minutes', attempts = o.attempts + 1
  from c where o.id = c.id returning o.* $$;

create or replace function ops.outbox_complete(p_id bigint, p_ok boolean, p_error text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_attempts int;
begin
  if p_ok then update ops.outbox set status='sent', processed_at=now(), locked_until=null where id=p_id; return; end if;
  select attempts into v_attempts from ops.outbox where id = p_id;
  if v_attempts >= 5 then
    update ops.outbox set status='dead', last_error=left(p_error,500), locked_until=null where id=p_id;
    perform ops.raise_alert('critical','outbox_dead','outbox id='||p_id);
  else
    update ops.outbox set status='pending', last_error=left(p_error,500), locked_until=null,
      next_attempt_at = now() + (array[interval '1 minute', interval '5 minutes', interval '30 minutes', interval '2 hours', interval '6 hours'])[v_attempts]
    where id = p_id;
  end if;
end $$;
grant execute on function ops.outbox_claim(integer), ops.outbox_complete(bigint, boolean, text) to service_role;
```
`dead` = DLQ באותה טבלה; שחזור `staff.admin_outbox_replay(p_id)` (אדמין טרי, מתועד). Resend נקרא עם `Idempotency-Key: outbox-<id>`. ההודעה נושאת `lead_id`+`kind` בלבד; פרטים נקראים מהמסד רק אם `NOTIFY_INCLUDE_PII=true`.

### 8.4 watchdog כולל `cron_http_audit`
```sql
create table ops.alerts (
  id bigint generated always as identity primary key, at timestamptz not null default now(),
  severity text not null check (severity in ('info','warning','critical')), kind text not null,
  dedupe_key text, summary text not null, status text not null default 'pending' check (status in ('pending','sent','resolved')));
create unique index alerts_dedupe_idx on ops.alerts (dedupe_key) where status = 'pending' and dedupe_key is not null;
create table ops.alert_recipients (email text primary key, active boolean not null default true);

create or replace function ops.raise_alert(p_sev text, p_kind text, p_summary text, p_dedupe text default null) returns void
language sql security definer set search_path = '' as $$
  insert into ops.alerts (severity, kind, summary, dedupe_key) values (p_sev, p_kind, left(p_summary, 500), p_dedupe)
  on conflict (dedupe_key) where status = 'pending' and dedupe_key is not null do nothing $$;

create or replace function ops.cron_http_audit() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform ops.raise_alert('warning', 'cron_http_failed',
    'cron http failures last 10m: ' || count(*) || ' first_status=' || coalesce(min(status_code)::text,'none') || ' err=' || left(coalesce(min(error_msg),'-'),60),
    'cronhttp:' || date_trunc('hour', now())::text)
  from net._http_response
  where created > now() - interval '10 minutes' and (status_code is null or status_code >= 400 or timed_out)
  having count(*) > 0;
end $$;

create or replace function ops.watchdog() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform ops.cron_http_audit();
  perform ops.copy_auth_events();                         -- auth.audit_log_entries -> audit.auth_events (ids since last copy)
  if exists (select 1 from ops.outbox where status='pending' and created_at < now() - interval '15 minutes') then
    perform ops.raise_alert('critical','outbox_backlog','pending > 15 min','outbox_backlog'); end if;
  if exists (select 1 from ops.job_runs where finished_at is null and started_at < now() - interval '10 minutes') then
    perform ops.raise_alert('warning','job_not_finished','job started and not finished 10 min','job_not_finished'); end if;
  if not exists (select 1 from ops.job_runs where job='fetch-cma-data' and ok and finished_at > now() - interval '8 days') then
    perform ops.raise_alert('warning','cma_stale','no successful fetch-cma-data for 8 days','cma_stale'); end if;
  if (select count(*) from audit.auth_events where not ok and at > now() - interval '15 minutes') >= 10 then
    perform ops.raise_alert('warning','auth_failure_burst','>=10 auth failures in 15 min','auth_burst:'||date_trunc('hour',now())::text); end if;
  if (select coalesce(sum(hits),0) from ops.rate_limits where bucket like 'lead_%' and window_start > now() - interval '1 hour') >= 500 then
    perform ops.raise_alert('warning','intake_flood','lead rate-limit pressure','intake_flood:'||date_trunc('hour',now())::text); end if;
  return jsonb_build_object('ok', true);
end $$;
```
התראות `pending` נשלחות על ידי `notify-worker` (`topic='alert'`) לנמענים ב-`ops.alert_recipients` ומסומנות `sent`.

---

## 9. Storage
אפס policies ל-`anon`/`authenticated` על `storage.objects`; הכול מתווך ב-signed URLs מפונקציה שבודקת הרשאה במסד. **בהקמה: אין buckets** (שני ה-buckets בטוקיו ריקים; הקוד והמדיניות סתרו זה את זה). לוגו סוכנות = קובץ ב-`public/`; `AgencySettingsPage` לא מועבר. `correction-files`/PDage לא מועברים.

שלב ב' (`client-documents`, private, 10MB, `pdf/jpeg/png`, נתיב `customers/<customer_id>/<document_id>.<ext>`):
1. `upload-url` (`verify_jwt=true`): `requireUser`; לקוח → `customer_id = my_customer_id()`; צוות → aal2 + אותה סוכנות; יוצר `crm.documents(status='pending', expires_at=now()+2min)` ב-RPC; `createSignedUploadUrl(path)`.
2. הדפדפן מעלה עם ה-token.
3. `document-worker` (cron, `x-cron-secret`): magic bytes מול mime, גודל, `stored|rejected`, `audit.log`.
4. הורדה: `api.document_url(p_document_id)` → בודק בעלות/צוות, `log_access`, `createSignedUrl(path, 60)`.
בניית נתיבים במודול אחד (`src/lib/storagePaths.ts`) עם בדיקת יחידה; `position('..' in name) = 0` בכל `with check` עתידי. retention: `crm.documents.retain_until` + `ops.storage_purge()`.

---

## 10. נתונים: טבלת move / rebuild / drop לכל אובייקט בטוקיו

| אובייקט (שורות) | החלטה | שיטה ואימות |
|---|---|---|
| `blog_posts` (22) | **move** | מ-`C:/tmp/infra/migrate-site/data/blog_posts.json` (sha256 ב-`MANIFEST_public.json`) בסקריפט עם `SEELD_SECRET_KEY` ל-`content.blog_posts`; `count=22`, md5 של `string_agg(row::text)` מול INVENTORY §1 |
| `travel_companies` | **move/rebuild** | מהייצוא אם קיים, אחרת seed |
| `investment_tracks` (571) | **move קפוא** | מהייצוא; `source_frozen_at='2026-03-26'`; "נכון ל-" באתר; `tracks_sync_enabled=false`; התראה אם גיל > 45 יום ואין החלטה |
| `cma_funds` (39,614), `cma_sync_log` (133) | **rebuild** | `fetch-cma-data` מ-data.gov.il בלילה במנות 2,000; `raw_data` לא מועבר; אימות `cma_board=1,257`, `cma_company_map=120`, `cma_funds_latest=1,442` |
| `cma_funds_latest`, `cma_board`, `cma_company_map` | **rebuild** | `content.refresh_fund_views()` |
| `insurance_leads` (2) | **move** | הבעלים מייצא CSV ומזין ל-`crm.leads` (`consent_version='legacy-v0'`, `consent_at=created_at`); לא דרך הצ'אט |
| `pension_analysis_leads`, `contact_submissions`, `onboarding_submissions` (0) | **drop** | מוחלפים ב-`crm.leads` |
| `page_views` (3,359) | **drop (ארכיון בעלים)** | הייצוא הקיים נשמר בארכיון המוצפן; לא נבנה; Vercel Web Analytics |
| `chat_conversations` (6), `chat_messages` (8) | **drop (ארכיון)** | מודל חדש `crm.chat_sessions(session_hash)`, 90 יום |
| `profiles` (6), `agencies` (0), `agency_invitations` (0), `auth.users` (6), `auth.identities` (8) | **rebuild** | `core.agencies` שורה אחת, `core.staff` בהזמנה; אין העתקת `auth.users`; `legacy.user_id_map` במסמך הבעלים |
| `customers` (191) | **לא מועתק (ארכיון מוצפן)** | PII + ת"ז גלויה + מוזן מ-Surense של מוצר אחר; קליטה בשלב ב' דרך `staff.customer_import` עם HMAC + הצפנה; `id_number` גלוי לא נכנס לעולם. חלופה (D1 `tokyo_import`) רק באישור בעלים |
| `customer_financial_snapshot` (184) | **לא מועתק (ארכיון מוצפן)** | בריאות/פיננסי 1:1 ל-191 הלקוחות; לא רשום ב-INVENTORY כתלות; קליטה עתידית רק דרך אינטגרציה מאומתת עם סיווג "רגישות מיוחדת" |
| `products`, `recommendations`, `recommendation_summaries` (1/1/1), `execution_summaries(+items)`, `customer_messages`, `source_files`, `import_batches`(6), `import_batch_items`, `activity_log`(4), `reasoning_bank`(2) | **rebuild בשלב ב'** | מודל פורטל חדש (§11); FK כפולים לא מועתקים; הקיים לארכיון הבעלים |
| `client_access_links` (0) | **drop** | הפורטל מעולם לא עבד דרכו (אומת); מוחלף ב-`crm.portal_links.token_hash` |
| `saved_calculations`, `user_policies` (0) | **drop** | |
| `insbase_links` (0) | **לעולם לא** | טוקני OAuth; חיבור מחדש |
| `correction_jobs`, `correction_*`, `deficiency_*`, `pdage_*` (0) + 3 פונקציות + bucket | **drop** | המודול לא פעל (אין FK, `pdage_customers` לא קיימת, אין policy ל-bucket); אם יחזור, מוצר נפרד |
| enums `pension_product_type`, `insurance_type`, `lead_status` | **drop** | `text + check` (ADR-8) |
| realtime publication | **לא** | Realtime כבוי; `ChatTab.tsx` לא נפרס בשלב א' |
| 7 cron jobs | **rebuild → 5** | §8.2 |
| 17 edge functions | **5 חדשות/מותאמות + 1 בשלב ב'** | §7 |
| Surense/Make → טוקיו | **לא נוגעים** | שייך למוצר אחר |

כלל: שום רשומת PII לא עוברת דרך הקשר הצ'אט או דרך סוכן. פעולת הבעלים: `pg_dump --data-only` לטבלאות הפרטיות → קובץ מוצפן (`age`) בארכיון פרטי → מחיקת העותקים המקומיים (`C:/tmp/...`) רק באישורו המפורש (חוק "אין מחיקה בלי אישור").

---

## 11. פורטל לקוחות בטוקן (שלב ב'; חוזה סופי שמתקן את שני הפגמים שאומתו)

```sql
create table crm.portal_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references crm.customers (id),
  purpose text not null check (purpose in ('recommendation_summary','execution_summary','document_request')),
  target_id uuid not null,
  token_hash bytea not null unique,                  -- sha256 of a 32-byte random token; plaintext shown once to the agent
  requires_last4 boolean not null default true,
  expires_at timestamptz not null, max_opens integer not null default 20, opens integer not null default 0,
  failed_attempts integer not null default 0, revoked_at timestamptz,
  created_by uuid not null references core.staff (user_id), created_at timestamptz not null default now());
-- no policy for anon/authenticated; RPC only

create or replace function api.portal_open(p_token text, p_id_last4 text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v_hash bytea := extensions.digest(convert_to(coalesce(p_token,''),'utf8'),'sha256'); l crm.portal_links;
        v_ip text := coalesce(private.client_ip(),'unknown');
begin
  perform private.kill_switch('portal_enabled');
  if not private.check_rate_limit('portal_token', encode(v_hash,'hex'), 10, interval '10 minutes')
     or not private.check_rate_limit('portal_ip', v_ip, 20, interval '10 minutes') then
    raise exception 'rate_limited' using errcode = 'PT429'; end if;
  select * into l from crm.portal_links where token_hash = v_hash and revoked_at is null and expires_at > now() for update;
  if not found then raise exception 'not_found' using errcode = 'PT404'; end if;
  if l.requires_last4 and (p_id_last4 is null or p_id_last4 <> (select national_id_last4 from crm.customer_identities where customer_id = l.customer_id)) then
    update crm.portal_links set failed_attempts = failed_attempts + 1,
      revoked_at = case when failed_attempts + 1 >= 5 then now() end where id = l.id;
    raise exception 'verification_failed' using errcode = 'PT403';
  end if;
  if l.opens >= l.max_opens then raise exception 'link_exhausted' using errcode = 'PT410'; end if;
  update crm.portal_links set opens = opens + 1 where id = l.id;
  insert into crm.portal_events (link_id, kind, ip_hash) values (l.id, 'opened', private.ip_hash(v_ip));
  perform private.log_access('portal_open', array[l.customer_id], 1);
  return private.portal_payload(l.purpose, l.target_id);   -- scoped projection, never raw rows
end $$;
revoke all on function api.portal_open(text, text) from public;
grant execute on function api.portal_open(text, text) to anon, authenticated;
```
`api.portal_submit(p_token, p_decisions jsonb)` באותה צורה: מעדכן רק את `target_id` הקשור לטוקן. `id_number` לעולם לא מגיע לדפדפן; `national_id_last4` עמודה נפרדת. ת"ז: `national_id_hmac bytea` (HMAC עם `national_id_hmac_key_v1`), `national_id_enc bytea` (`pgp_sym_encrypt` עם `national_id_enc_key_v1`), `key_ref text`; פונקציית re-key ל-`v2` קיימת מהיום הראשון של שלב ב'. בשלב ב' ה-allowlist של `anon` ב-pgTAP משתנה מ-`is_empty` ל-`set_eq {portal_open, portal_submit}` וזו ההצהרה המפורשת של החריג.

---

## 12. Vercel + CI/CD

### 12.1 `vercel.json` (עיקרים)
```json
{
  "buildCommand": "PRERENDER_STRICT=1 npm run build:seo",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["fra1"],
  "functions": { "api/*.ts": { "maxDuration": 10 } },
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
      { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://qxhpolktdfgcbxtfxgov.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests" }
    ]},
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/api/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, s-maxage=300, stale-while-revalidate=3600" }] },
    { "source": "/(app|portal|client|personal-area|execution-portal)(.*)", "headers": [
      { "key": "X-Robots-Tag", "value": "noindex, nofollow" }, { "key": "Cache-Control", "value": "private, no-store" } ] }
  ]
}
```
`ipapi.co` ו-`wss:` מוסרים; **אין** rewrite `/api/lead`; `'unsafe-inline'` נשאר (ADR-19). ב-preview ה-CSP מכיל את כתובת ענף `preview` (נבנה מ-`VITE_SUPABASE_URL` בזמן build).

### 12.2 משתני סביבה
| שם | Production | Preview | Local |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `seeld-site` | ענף `preview` | `http://127.0.0.1:54321` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` של prod | של הענף | מקומי |
| `VITE_SUPABASE_PROJECT_ID` | `qxhpolktdfgcbxtfxgov` | ref של הענף | `local` |
| `VITE_TURNSTILE_SITE_KEY` | מפתח אתר | `1x00000000000000000000AA` | test |
| `VITE_APP_ENV` | `production` | `preview` | `local` |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (ל-`api/*.ts`) | כמו VITE | כמו VITE | |
| **אף מפתח סודי של Supabase לא קיים ב-Vercel** | | | |

`src/integrations/supabase/config.ts`, `api/*.ts`, `scripts/prerender.mjs`: ברירות המחדל הקשיחות (כתובת טוקיו ומפתח) נמחקות; חסר = שגיאת build. שני לקוחות: `supabase.schema('api')` לציבור, `supabase.schema('staff')` לצוות; טיפוסים `gen types --schema api,staff`.

### 12.3 אסטרטגיית preview (פותרת את הסתירה בין עיצוב 0 לעיצוב 1)
- ענף Supabase **אחד עמיד** בשם `preview` (Micro, ~$10 לחודש), נוצר מהדשבורד/CLI (branching ללא אינטגרציית GitHub), עם אותן מיגרציות + `seed.sql` סינתטי (2 סוכנים, 5 לידים דמה). כל ה-previews של Vercel מצביעים אליו דרך Preview env (הגדרה חד-פעמית). אין ענף לכל PR (אין החלפת env אוטומטית, אין עלות משתנה).
- Auth redirect ל-`https://*-<team>.vercel.app/**` מוגדר **רק** בענף `preview`.
- Vercel Deployment Protection = Standard (preview דורש כניסה; פרודקשן פתוח); `preview-smoke.yml` משתמש ב-`VERCEL_AUTOMATION_BYPASS_SECRET`.
- `env-guard` ב-CI: ב-PR, `VITE_SUPABASE_PROJECT_ID` ≠ `qxhpolktdfgcbxtfxgov` וגם ≠ `lvifatyksqizwcutfbqp`.
- הגנה בעומק: ב-`VITE_APP_ENV=preview` טפסים במצב "לא נשלח" ו-Turnstile במפתח בדיקה.
- מיגרציות נבדקות על הענף `preview` לפני פרודקשן (`supabase db push --db-url <preview>` מ-CI על merge ל-`main`, אוטומטי; לפרודקשן ראו 12.4).

### 12.4 שערי CI ו-workflows
| job ב-`ci.yml` | בודק | נכשל כאשר |
|---|---|---|
| `verify` | `tsc`, `eslint`, `vitest`, build עם `PRERENDER_STRICT=1`, `check:aeo`, `size:check`, בדיקת בידוד platform | כל כישלון |
| `database` | `supabase db reset` מאפס, `supabase test db` (מטריצות + `00_policy_lint`), `supabase db lint --level warning`, `gen types --schema api,staff` מול הקובץ בגיט | מיגרציה לא עוברת, בדיקה נכשלת, טיפוסים לא מעודכנים |
| `functions` | `deno check`, `deno test`; `config.toml` כולל כל תיקיית פונקציה עם `verify_jwt` מפורש; grep: אין `VITE_`, אין `Access-Control-Allow-Origin: *` | סטייה |
| `supply-chain` | `npm audit --omit=dev --audit-level=high`, gitleaks, `package-lock` ללא טווחים, Deno imports נעולים | חולשה high, סוד, import לא נעול |
| `env-guard` | §12.3 | preview שמצביע לפרודקשן/טוקיו |
| `no-tokyo-ref` | grep `lvifatyksqizwcutfbqp` ב-`src/`, `api/`, `scripts/`, `dist/` אחרי build = 0 | כל הופעה |
| `intake-keys` | מפתחות zod של הטפסים ⊆ רשימת `kind`/`payload` ב-`submit_lead` | סטייה |
| `ci-ok` | אגרגציה; הבדיקה היחידה הנדרשת בהגנת הענף | אחד נכשל |

workflows:
- `preview-smoke.yml` (`deployment_status`): `npm run smoke` על ה-preview; בודק ש-OpenAPI של PostgREST כ-`anon` מחזיר רק את ה-views הצפויים.
- `deploy-backend-preview.yml` (push ל-`main`, `paths: supabase/**`): `db push` לענף `preview` + `functions deploy` לענף; `functions list` מול `config.toml`.
- `functions-deploy.yml` (push ל-`main` אחרי `ci-ok`): `supabase functions deploy --project-ref qxhpolktdfgcbxtfxgov` עם `SUPABASE_ACCESS_TOKEN` מ-Environment `production`; אחריו drift check.
- `migrate-prod.yml` (`workflow_dispatch`, Environment `production` עם deployment branch `main` וסודות `SUPABASE_DB_URL` session pooler): `if: contains(fromJSON(vars.PROD_MIGRATORS), github.actor)`; `supabase db push`; אחריו `supabase db diff` ריק, `get_advisors` ריק. **Required reviewers אינם זמינים במאגר פרטי בלי Enterprise**, לכן השער האנושי הוא: (א) `CODEOWNERS` על `supabase/migrations/**` = הבעלים, PR חובה; (ב) רשימת actors; (ג) ה-run מתועד ב-RUNBOOK.
- `site-watch.yml` (קיים, 30 דקות): + `health`, + issue אוטומטי רבעוני "תרגיל שחזור" ו-issue חודשי "dump מוצפן".
- `deploy-vercel.yml`: נשאר `workflow_dispatch` בלבד או נמחק; Vercel פורס מ-Git (ADR-12); expand/contract מבטל חשיבות סדר.

### 12.5 GitHub
Branch protection על `main`: PR חובה, `ci-ok` חובה, סקירה אחת, `CODEOWNERS` ל-`supabase/**`, אין force-push. Secrets ברמת Environment: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL` (production בלבד), `SUPABASE_PREVIEW_DB_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`. Dependabot שבועי. Actions מוצמדים ל-SHA. **אין** `SEELD_SECRET_KEY` ב-GitHub.

---

## 13. תצפיתיות, גיבויים, תרגולים, תקרית

### 13.1 מה נמדד
- רשומה פורנזית קבועה במסד: `audit.log`, `audit.access_log`, `audit.auth_events` (יומני Supabase קצרי טווח ב-Pro אינם המקור).
- `ops.job_runs.finished_at` = אות הבריאות; `ops.alerts` + `alert_recipients` = התראות באימייל דרך `notify-worker`.
- `staff.ops_health` (view לצוות, מונים בלי PII): `outbox_pending`, `oldest_pending_sec`, `dead_count`, `cma_age_days`, `tracks_age_days`, `last_notify_ok_at`, `auth_failures_15m`.
- `health` ציבורי: `{ ok, degraded, version, cma_age_bucket }` בלבד (לא מספרים מדויקים; צמצום recon). `site-watch` נכשל על `ok=false`.
- Vercel Web Analytics + Runtime Logs; Security/Performance Advisor שבועי ב-RUNBOOK (15 דקות).

### 13.2 retention (`ops.cleanup()`)
`ops.rate_limits` 2 ימים; `ops.idempotency_keys` 48 שעות; `ops.outbox` `sent` 14 יום; `ops.job_runs` 90 יום; `ops.alerts` `resolved` 90 יום; `cron.job_run_details` 7 ימים; `crm.chat_*` 90 יום; `audit.*` **25 חודשים**; `crm.leads` `lost|spam` מחיקה רכה אחרי 24 חודשים ומחיקה קשה אחרי 36 (החלטת בעלים ויועץ). `audit.access_log`: אם > 5M שורות, חלוקה חודשית (לא עכשיו).

### 13.3 גיבויים
Pro: גיבוי יומי 7 ימים. PITR לא עכשיו (ADR-14; מופעל עם Small כש-`client-documents`/שאלונים עולים). **אין dump של PII ב-GitHub Actions** (GitHub לא הופך למעבד משנה של גיבויים): `npm run backup:dump` ידני חודשי של הבעלים (`pg_dump --data-only` לסכמות `crm, core, content, audit, ops` דרך session pooler → `age` למפתח ציבורי של הבעלים → אחסון פרטי), עם issue תזכורת אוטומטי. Storage (שלב ב'): סנכרון שבועי של `client-documents` לאחסון מוצפן.

### 13.4 תרגולים (מצומצם למה שיתקיים)
| תרגיל | תדירות | קריטריון |
|---|---|---|
| שחזור dump לענף `preview` + `supabase test db` + ספירות מול MANIFEST | רבעוני (issue אוטומטי), 30 דקות; הראשון ביום 3 | ירוק; זמן < 30 דקות |
| סיבוב `edge_cron_secret`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `SEELD_SECRET_KEY` | שנתי או בחשד | אפס שגיאות ב-`job_runs` ב-24 שעות |
| חשבון צוות פרוץ: `admin_staff_disable` + `signOut(global)` | פעם אחת ביום 3, אחר כך בחשד | הסשן נדחה תוך דקה |
| re-key של `national_id_hmac_key` | שלב ב', בחשד | כל `customer_identities` עם `key_ref` חדש |

### 13.5 runbook תקרית
1. מתגים: `update ops.config set value='false' where key in ('intake_enabled','chat_enabled','portal_enabled')`; Attack Challenge Mode ב-Vercel.
2. ניתוק: `admin_staff_disable`, ביטול `sb_secret`, סיבוב `edge_cron_secret`, `admin_portal_link_revoke_all`.
3. ראיות: `audit.*`, `ops.job_runs`, יומני Supabase (לייצא מיד), Vercel logs; ארכיון מוצפן.
4. דיווח: אירוע אבטחה חמור במאגר ברמה בינונית/גבוהה מחייב דיווח לרשות להגנת הפרטיות (תקנה 11) ולפי תיקון 13 עלולה להידרש הודעה לנושאי המידע; נוסח עם יועץ משפטי; תבנית ב-RUNBOOK.
5. מסמכי חובה (לא קוד): מסמך הגדרות המאגר (מטרות, סוגי מידע, מעבדי משנה: AWS Frankfurt דרך Supabase, Vercel, Resend, Cloudflare Turnstile, Google AI לצ'אט), נוהל אבטחה, רשימת מורשי גישה (= `core.staff`), סיווג רמת אבטחה (סביר: בינונית; לאימות), בדיקת חובת ממונה הגנת פרטיות לפי תיקון 13, מפת נתונים כולל הארכיון המוצפן של הבעלים.

---

## 14. עלות חודשית מוערכת
| פריט | הערכה |
|---|---|
| Supabase Pro | $25 (כולל קרדיט $10 ל-Micro) |
| ענף `preview` עמיד (Micro, קרדיט לא חל) | ~$10 |
| Small compute (לא עכשיו; עם PITR) | +$5 נטו |
| Vercel Pro | $20 למושב (1-2) |
| Resend | $0 עד 3,000/חודש; $20 מעל |
| Cloudflare Turnstile | $0 (חשבון Cloudflare חינמי נדרש) |
| GitHub Actions | $0-8 (prerender ~6-10 דקות לריצה; 2,000 דקות חינם) |
| אחסון ארכיון מוצפן של הבעלים | $0-5 |
| PITR 7 ימים (שלב ב') | ~$100 |
| **סה"כ עכשיו** | **~$55-90** |

---

## 15. מה לא בונים עכשיו
פורטל לקוחות/שאלונים/דוחות/מסמכים (חוזים מוגדרים; בנייה בשלב ב' אחרי ייעוץ משפטי ו-PITR); מערכת האירועים 06-09 (pgmq, workbench, metrics, adapters; `ops.outbox` מספיק); Realtime, GraphQL, Presence; SMS OTP, Passkeys, התחברות חברתית; Custom Access Token hook, `api_clients`/`api-v1`; hooks של נעילה (Team); PDage, `send-calculation-email`, `fetch-bank-branches` כפונקציה, אימייל אישור ללקוח; PITR, read replica, log drains, WAF גיאוגרפי; הצפנה ברמת מפתח-ללקוח, KMS/HSM חיצוני; nonce ל-CSP; ענף Supabase לכל PR; העתקת CRM/Surense/snapshot ישנים לאף מערכת חדשה.

---

## 16. רשומות החלטה (ADR)

**ADR-S1 בסיס = עיצוב 0 כדלתא על היסוד שהוחל.** חלופות: פריסת `public` כ-API (עיצוב 1), הכול ב-`public` + `legacy` (עיצוב 2). נימוק: שתי החלופות דורשות למחוק 8 מיגרציות ו-4 קבצי pgTAP שכבר הוחלו; "הרחבה בלי rework" מתחילה בלא להרוס את מה שעובד.

**ADR-S2 שתי סכמות חשופות (`api`, `staff`).** חלופה: אחת. נימוק: PostgREST תומך בכמה סכמות ו-`supabase.schema()` (אומת); `anon` בלי `usage` על `staff` = גבול שניתן להוכחה ב-`has_schema_privilege`. הודאה: בין לקוח לצוות הגבול נשאר RLS. מחיר: שני לקוחות ו-`gen types --schema api,staff`.

**ADR-S3 הרשאה מטבלה, לא מ-claims; אין Custom Access Token hook.** חלופה: עיצוב 1. נימוק: ביטול מיידי, אין SPOF לכניסה, אין חלון claim מיושן של שעה, ואין צורך ב-policy ל-`supabase_auth_admin` על טבלת תפקידים (הפגם שהתיעוד מתקן ב-`using (true)`).

**ADR-S4 hooks: רק `before_user_created`.** חלופות: שלושת ה-hooks של עיצוב 0; אפס hooks (עיצוב 2). נימוק: Password/MFA Verification Attempt הם Teams/Enterprise (אומת); `before_user_created` הוא Free/Pro ומהווה הגנה בעומק מאחורי `enable_signup=false`. פיצוי לנעילה: מגבלות קצב מובנות + העתקת `auth.audit_log_entries` + התראה.

**ADR-S5 אפס RPC כתיבה ל-`anon` בשלב א'; החריג היחיד בשלב ב' הוא הפורטל.** חלופה: `chat_start/chat_append` חשופים ל-`anon` (סתירה בעיצוב 0). נימוק: כתיבת צ'אט דרך `service_role` מהפונקציה מאפשרת Origin + מתג + קצב בלי להרחיב את ה-allowlist; הפורטל מוצהר כחריג ונבדק ב-`set_eq`.

**ADR-S6 preview = ענף Supabase עמיד אחד, לא פרודקשן ולא ענף לכל PR.** חלופות: קריאה מפרודקשן עם Origin allowlist (עיצוב 1; שגוי כי Data API לא בודק Origin, אומת); ענף לכל PR (עיצוב 0; יותר חלקים נעים ועלות משתנה). נימוק: בידוד אמיתי ב-~$10 לחודש ובהגדרה חד-פעמית.

**ADR-S7 שער מיגרציות לפרודקשן בלי Enterprise.** חלופות: GitHub Environment required reviewers (דורש Enterprise במאגר פרטי, אומת); מאגר ציבורי (לא); `db push` אוטומטי על merge (עיצוב 1; אין שער). נבחר: `workflow_dispatch` + Environment `production` (סודות, deployment branch) + בדיקת actor + CODEOWNERS על המיגרציות.

**ADR-S8 `verify_jwt` לפי סוג הקורא, לא אחיד.** חלופה: `false` לכולן (עיצוב 2). נימוק: התיעוד מורה להשאיר `true` לפונקציות שנקראות עם JWT משתמש ולכבות רק לפונקציות בלי `Authorization`; `false` אחיד הוא הפגם של `send-lead-notification` בהכללה.

**ADR-S9 מפתחות חתימה אסימטריים (P-256).** נימוק: `getClaims()` מאמת מקומית מול JWKS רק עם מפתח אסימטרי (אומת); חוסך קריאת Auth לכל בקשה ב-`staff-invite` ובפונקציות שלב ב'.

**ADR-S10 `ops.outbox` v2 ולא pgmq עכשיו.** חלופה: pgmq עם ארכיון כ-DLQ (עיצוב 1). נימוק: `ops.outbox` כבר הוחל (ADR-6 ביסוד); הוספת `next_attempt_at/locked_until/dead` היא מיגרציה אחת; pgmq מגיע עם 06-09. נלקח מ-D1/D2: `Idempotency-Key` לפי מזהה, תקציב זמן 60%, DLQ בלי תור שני.

**ADR-S11 cron 7 → 5; זיהוי כשל שקט בשני מקורות.** נימוק: `cron.job_run_details='succeeded'` אומר שהבקשה נשלחה (הפגם בטוקיו); `ops.job_runs.finished_at` (עיצוב 1) + סריקת `net._http_response` (עיצוב 2) מכסים גם פונקציה שלא ענתה וגם פונקציה שענתה 500.

**ADR-S12 סוד cron נפרד מהמפתח הסודי.** נימוק: דליפת Vault או `cron.job` מאפשרת לכל היותר להפעיל job. `cron.job.command` בלי URL ובלי סוד, נבדק ב-pgTAP.

**ADR-S13 `audit.access_log` במסד, 25 חודשים; לא pgaudit.** חלופה: pgaudit ליומני Supabase (עיצוב 1). נימוק: יומני הפלטפורמה קצרים ואינם רשומה משפטית; תקנה 10 דורשת תיעוד גישה 24 חודשים לפחות. מחיר: כל RPC שמחזיר נתוני לקוח קורא `log_access`.

**ADR-S14 ת"ז לעולם לא בטקסט גלוי.** חלופה: `id_number` גלוי + `id_hash` (עיצוב 1). נימוק: HMAC עם מפתח Vault מגורסה + `pgp_sym_encrypt` + `last4` נפרד; הדפדפן מקבל רק נכון/לא נכון. בעיצוב 1 ת"ז מגיעה לדפדפן.

**ADR-S15 לא מעתיקים `customers` ו-`customer_financial_snapshot` לפרנקפורט בשלב א'.** חלופות: העתקה קפואה (עיצוב 1), EAV עם מקור 'clearing_house' (עיצוב 2; מזייף אמינות). נימוק: עותק שני של PII רפואי/פיננסי שמתיישן בעוד Surense ממשיך להזין את טוקיו = עיבוד ללא מטרה ופיצול זהות. הארכיון המוצפן אצל הבעלים נרשם כמאגר במפת הנתונים. חלופת `tokyo_import` נשמרת כאופציה באישור בעלים בלבד.

**ADR-S16 החבילה החדשה בלי הפניות לטוקיו; גישה ללקוחות ישנים רק דרך alias legacy מוגבל בזמן.** חלופה: שתי כתובות Supabase בחבילה ובמשך 30 יום (עיצוב 0). נימוק: שער `no-tokyo-ref` הופך את ההפרדה לבדיקה; ה-legacy הוא הפריסה הקיימת ננעלת תחת alias, לא קוד חדש.

**ADR-S17 `agency_id` מיום 1 כגבול RLS; `assigned_to` לשיוך.** חלופה: בלי סוכנות (סוכנות אחת היום). נימוק: הוספה אחר כך = שינוי כל policy; היום = עמודה ו-`default_agency_id` ב-`ops.config`.

**ADR-S18 Storage בלי policies לתפקידי API; אפס buckets בשלב א'.** חלופות: policies לפי `agency_id` (עיצוב 1), לפי `auth.uid` (עיצוב 2). נימוק: הפגם בטוקיו היה אי-התאמה בין נתיב בקוד ל-policy; signed URLs מפונקציה מבטלים את המחלקה. לוגו = נכס סטטי.

**ADR-S19 בלי אימייל אישור ללקוח ובלי `send-calculation-email` בשלב א'.** נימוק: שליחה לכתובת שמקליד הגולש היא וקטור spam-relay גם מאחורי Turnstile. החלטת בעלים מתועדת אם לשנות (תבנית קבועה בלבד, `NOTIFY_LEAD_ACK=true`).

**ADR-S20 גיבוי PII לא דרך GitHub Actions.** חלופות: artifact מוצפן (עיצוב 2), `backup.yml` לאחסון בעלים (עיצוב 0; דורש אישורי אחסון ב-GitHub). נבחר: dump ידני חודשי של הבעלים עם תזכורת אוטומטית; GitHub לא מעבד משנה של גיבויים.

**ADR-S21 תרגולים מצומצמים.** נימוק: לוח חודשי/רבעוני/חצי-שנתי של עיצוב 0 לא יתקיים בסוכנות של שניים; טקס שלא מתקיים אינו בקרה. רבעוני לשחזור, שנתי לסודות, ושאר התרחישים פעם אחת ביום 3 ובחשד.

**ADR-S22 `page_views` נמחק (ארכיון בלבד); Vercel Web Analytics.** חלופה: RPC `track_page_view` עם עיר/מדינה 400 יום (עיצוב 1). נימוק: מידע אישי בעל ערך נמוך וווקטור כתיבה אנונימי. הייצוא הקיים נשמר בארכיון הבעלים (חוק "אין השמטה").

**ADR-S23 `health` ציבורי מחזיר רק `ok/degraded` ודליים.** נימוק: `outbox_pending` ו-`turnstile_required` חשופים = recon זול לתוקף; המספרים המדויקים ב-`staff.ops_health`.

**ADR-S24 בדיקת `rendered_at` נמחקת.** נימוק: ניתנת לזיוף על ידי כל סקריפט; קוד + ביטחון כוזב.

---

## 17. פעולות ידניות של הבעלים (דשבורד), בסדר ביצוע

**Supabase (`seeld-site`)**
1. Settings > API: Exposed schemas = `api, staff`; Extra search path = `extensions`; max rows 1000; GraphQL כבוי.
2. Settings > API Keys: ליצור `sb_publishable_*` ו-`sb_secret_*`; לרשום שמות בלבד; legacy JWT keys מבוטלים אחרי cutover.
3. Authentication > Signing Keys: מפתח אסימטרי ECC P-256, המפתח הישן ל-standby ואחר כך לביטול.
4. Authentication > Providers: Email בלבד; Google/Facebook/Apple/Phone כבויים; anonymous כבוי; `enable_signup` כבוי.
5. Authentication > Settings: סיסמה 12+ ודרישות, Leaked password protection, JWT 900, refresh rotation, inactivity 60 דק', time-box 12 שעות, OTP 8 ספרות/600 שניות, Site URL `https://seeld.co.il`, redirects `https://seeld.co.il/**`.
6. Authentication > SMTP: Resend (`smtp.resend.com:465`, user `resend`, password = מפתח Resend); DNS: SPF, DKIM, DMARC ל-`seeld.co.il` ב-Resend (לפני יום 3).
7. Authentication > Hooks: Before User Created → Postgres → `private.hook_before_user_created`.
8. Authentication > MFA: TOTP enroll+verify פעיל; phone MFA כבוי; max factors 2.
9. SQL Editor (פעם אחת): `select vault.create_secret('https://qxhpolktdfgcbxtfxgov.supabase.co','project_url'); select vault.create_secret(encode(gen_random_bytes(32),'hex'),'edge_cron_secret');` ולהעתיק את הערך השני ל-Edge secrets כ-`EDGE_CRON_SECRET`.
10. Edge Functions > Secrets: `SEELD_SECRET_KEY`, `EDGE_CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS=https://seeld.co.il`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL`, `NOTIFY_INCLUDE_PII=false`, `GOOGLE_AI_API_KEY`, `CHAT_MAX_INPUT_CHARS=1000`, `CHAT_TIMEOUT_MS=12000`.
11. Branching: ליצור ענף עמיד `preview`; לרשום ref + publishable key שלו; ב-Auth של הענף להוסיף redirect `https://*-<team>.vercel.app/**`.
12. Organization > Security: MFA חובה לחברי הארגון של Supabase.
13. Database > Backups: לאמת גיבוי יומי פעיל.

**Cloudflare Turnstile**: site `seeld.co.il` (managed); לרשום site key (Vercel) ו-secret (Edge).

**Vercel (`seeld`)**: Project > Functions region `fra1`; Environment Variables לפי §12.2 (Production/Preview בנפרד); Deployment Protection = Standard + Automation Bypass secret (GitHub); Firewall: rate limit `/api/*` 60/דקה ל-IP, managed bot ruleset; Web Analytics; Spend alert; alias `legacy` לפריסה הנוכחית אם נבחרה האופציה בשאלה 2.

**GitHub**: Branch protection על `main` (PR, `ci-ok`, סקירה, CODEOWNERS על `supabase/**`); Environment `production` עם deployment branch `main` וסודות `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL`; Environment `preview` עם `SUPABASE_PREVIEW_DB_URL`; Repository variable `PROD_MIGRATORS` = JSON של שמות משתמשים; Dependabot.

**Resend**: דומיין + DKIM/SPF; מפתח API (לשם בלבד).

**טוקיו (אחרי 48 שעות ירוקות, לפי החלטת הבעלים)**: `cron.unschedule` ל-7 משימות האתר; השבתת `send-lead-notification`; **שום מחיקת נתונים** בטוקיו.

---

## 18. תוכנית ביצוע 3 ימים עם בדיקות קבלה

### יום 1: מסד (סוכן-מסד, מקומי; הבעלים לדשבורד במקביל)
| # | משימה | בדיקת קבלה |
|---|---|---|
| 1.1 | מיגרציה `staff_schema`: סכמה `staff`, `staff.leads` (העתקת `api.leads`), הסרת `api.leads`, הסרת grants/policies של כתיבה ל-`authenticated` על `crm.leads`, הסרת `delete` על תוכן, `revoke usage on schema staff from anon` | pgTAP: `not has_schema_privilege('anon','staff','usage')`; `update staff.leads` כצוות = `42501`; `delete api.blog_posts` = `42501` |
| 1.2 | מיגרציה `core_agencies_invitations`: `core.agencies`, `agency_id` על `staff`/`leads`, `core.invitations`, `my_agency_id` | pgTAP: סוכן רואה רק את הסוכנות שלו |
| 1.3 | מיגרציה `private_helpers_audit`: `is_fresh_mfa`, `kill_switch`, `assert_*`, `log_access`, `audit.access_log`, `audit.auth_events`, `op` מורחב | pgTAP: `is_fresh_mfa` לפי `amr` מזויף; `access_log` נכתב מ-RPC; `audit.log` append-only עדיין |
| 1.4 | מיגרציה `staff_rpc`: `lead_set_status`, `lead_assign`, `lead_note_add`, `admin_config_set`, `admin_staff_disable`, `admin_alert_recipient_upsert`, `admin_outbox_replay` | מטריצה: לקוח = `PT403`, צוות aal1 = `PT403`, צוות aal2 = ok, אדמין בלי TOTP טרי על `admin_*` = `PT403` |
| 1.5 | מיגרציה `submit_lead_v2`: חתימה חדשה, `service_role` בלבד, `ops.idempotency_keys`, `kill_switch`, `client_ip` מתוקן | pgTAP: `anon` → `42501`; אותו `p_idem_key` פעמיים = אותה תשובה; גוף שונה = `PT409`; `intake_enabled=false` → `PT423` |
| 1.6 | מיגרציה `ops_cron_wrapper`: `call_function`, `job_runs`, `job_finish`, `alerts`, `alert_recipients`, `raise_alert`, `cron_http_audit`, `copy_auth_events`, `watchdog`, outbox v2, `cleanup` מעודכן, 5 cron jobs | pgTAP: `cron.job.command` בלי `http`/`secret`; `outbox_claim` ב-2 סשנים לא מחזיר אותה שורה; `watchdog` מעלה התראה על `pending` ישן |
| 1.7 | מיגרציה `auth_hook`: `hook_before_user_created` + grants/policy ל-`supabase_auth_admin` | pgTAP: כ-`supabase_auth_admin` בלי הזמנה → `error.http_code=403`; עם הזמנה → `{}` |
| 1.8 | `00_policy_lint.test.sql` + מטריצות; `config.toml` חדש; `seed.sql` סינתטי | `supabase db reset && supabase test db` ירוק; `public` ללא טבלאות |
| 1.9 | בעלים: §17 פריטים 1-13 | `select api.me()` עם publishable על `schema('api')` עובד; הרשמה חופשית נדחית; advisors נקי; `select name from vault.secrets` = 2 |

### יום 2: קצה, פונקציות, CI, Vercel, נתונים
| # | משימה | בדיקת קבלה |
|---|---|---|
| 2.1 | `_shared/env.ts`, עדכון `auth.ts/cors.ts/logger.ts`; `lead-intake`, `notify-worker`, `chat-bot`, `fetch-cma-data` (עם refresh בסיום), `staff-invite`, `health` | `deno test` ירוק; Origin זר = 403; בלי Turnstile = 403; 9 בקשות רצופות = 429; ליד אמיתי → אימייל אחד בלי PII עם קישור; `health` = `ok`; בקשת בדיקה מדפיסה את כותרות ה-IP ואומתה |
| 2.2 | פריסה לענף `preview`: `db push`, `functions deploy`, cron | `ops.job_runs` מקבל שורה בכל דקה מ-`notify-worker` עם `finished_at`; `watchdog` שקט |
| 2.3 | פרונט: `config.ts` בלי fallback, שני לקוחות `schema('api')`/`schema('staff')`, כל הטפסים → `leadIntake.ts` + Turnstile, הסרת `page_views`/`geo`, הסרת subscription ב-`ChatTab.tsx`, הסרת מסכי CRM/PDage מה-router, `api/*.ts` עם allowlist, `prerender.mjs` מ-`api.blog_posts`, טיפוסים | `tsc` נקי; prerender 87 נתיבים; smoke על preview: בית, בלוג, לוח (1,257), מסלולים (571), 5 טפסים במצב preview; קונסול בלי שגיאות CSP; grep טוקיו ב-`dist/` = 0 |
| 2.4 | CI: `verify`, `database`, `functions`, `supply-chain`, `env-guard`, `no-tokyo-ref`, `intake-keys`, `ci-ok`; `preview-smoke.yml`, `deploy-backend-preview.yml`, `functions-deploy.yml`, `migrate-prod.yml` | PR שמפיל pgTAP נחסם; PR עם project id של prod ב-preview נחסם; gitleaks על סוד מזויף נכשל; `migrate-prod` מ-actor לא ברשימה נכשל |
| 2.5 | `vercel.json`; env; בעלים: Deployment Protection, Firewall, Branch protection, Environments | preview דורש כניסה; securityheaders A; 61 בקשות בדקה ל-`/api/board` → 429 |
| 2.6 | פרודקשן: `migrate-prod` (actor מורשה), `functions-deploy`; טעינת `blog_posts` (22) ו-`investment_tracks` (571, `source_frozen_at`); `fetch-cma-data` ראשון בלילה | ספירות ו-md5 כב-INVENTORY; `cma_board=1,257`, `cma_company_map=120`, `cma_funds_latest=1,442`; `cma_check_freshness()` רץ בלי שגיאת אילוץ |

### יום 3: אנשים, תרגול, cutover
| # | משימה | בדיקת קבלה |
|---|---|---|
| 3.1 | הזמנת 3 חברי צוות ב-`staff-invite`; TOTP; 2 הלידים הישנים ב-CSV | סוכן aal1 רואה 0 לידים; אחרי TOTP רואה; `admin_config_set` בלי TOTP טרי = `PT403`, אחרי challenge = ok; `audit.log` מראה `ACTION` |
| 3.2 | תרגיל שחזור: dump → ענף `preview` → `supabase test db` → ספירות; תרחיש חשבון פרוץ | ירוק < 30 דקות; סשן מושבת נדחה תוך דקה; רשום ב-RUNBOOK |
| 3.3 | חזרת cutover על preview: smoke מלא, ליד בדיקה עד אימייל, Instant Rollback | רשימת "לפני" מסומנת; rollback < 5 דקות |
| 3.4 | cutover: env Production → פרנקפורט, merge, purge CDN, smoke על `seeld.co.il`; alias `legacy` אם נבחר | `health` ok; ליד בדיקה → אימייל; בלוג ולוח; אפס CSP; grep טוקיו ב-dist החי = 0; טוקיו לא נגע |
| 3.5 | ניטור 48 שעות | `site-watch` ירוק; אפס `pending` > 15 דקות; אפס `dead`; `job_runs` של `cma-sync` ו-`notify-worker` מצליחים |

---

## 19. סיכונים
1. Turnstile כנקודת כשל לקליטה: `intake_turnstile_required=false` זמני עם קצב מחמיר (IP 3/10 דק'), מתועד ב-audit, חוזר ל-`true` תוך 24 שעות; הטופס מציג טלפון/WhatsApp כשהווידג'ט לא נטען.
2. `investment_tracks` קפוא מ-26.3.2026: תווית "נכון ל-", התראה, החלטת בעלים אם להסתיר.
3. מסכי לקוחות/מוצרים/המלצות נעלמים מהאפליקציה החדשה ביום 3: זו החלטה (ADR-S15/S16); תלויה בשאלה 2.
4. TOTP חובה חוסם סוכן שלא נרשם: שעת הדרכה ביום 3; runbook איפוס factor על ידי אדמין (`auth.admin.mfa.deleteFactor`) עם שני מפעילים.
5. SMTP: בלי SPF/DKIM/DMARC ההזמנות וה-OTP ייתקעו (2 הודעות לשעה): פעולת בעלים לפני יום 3.
6. שער המיגרציות אינו "required reviewer" אמיתי בלי Enterprise: הפיצוי הוא CODEOWNERS + actor allowlist + תיעוד; הסיכון מתועד.
7. כותרות IP (`cf-connecting-ip`) לא אומתו מול הפלטפורמה: נבדקות ביום 2; עד אז IP = בקרה משנית.
8. רגולציה: סיווג רמת האבטחה, חובת ממונה, תקופת תיעוד, דיווח: הבנה הנדסית, לא ייעוץ משפטי.
9. הגדרות Auth גלובליות (JWT 15 דק', inactivity 60 דק', time-box 12 שעות) יחולו גם על לקוחות בשלב ב'.
10. Disk IO ב-Micro: טעינת 39k שורות בלילה במנות; נקודת החלטה ל-Small מתועדת.
11. סטיית `verify_jwt`/פריסה ידנית מהדשבורד: CI מתריע ולא מונע; כלל: אין פריסה מהדשבורד.
12. Exposed schemas ידני: pgTAP על `has_schema_privilege` + smoke OpenAPI כ-`anon` אחרי כל שינוי דשבורד.
13. שרשרת אספקה ב-Deno: נעילת גרסאות ו-`deno check` בלבד.
14. Rollback אחרי קליטת לידים חדשים: עבודה ידנית (CSV), בלי איבוד נתונים.
15. הארכיון המוצפן של הבעלים הוא מאגר בעצמו: נרשם במסמך הגדרות המאגר; העותקים ב-`C:/tmp/...` נמחקים רק באישור מפורש.
16. LLM בצ'אט מקבל טקסט חופשי של גולשים: מדיניות הפרטיות חייבת לציין; הצ'אט של האזור האישי לא מחובר ל-LLM עד החלטה.
17. ענף `preview` עמיד מתיישן מול פרודקשן: `deploy-backend-preview.yml` דוחף כל merge; `supabase branches reset` חודשי ב-RUNBOOK.

---

## 20. שאלות פתוחות שרק הבעלים יכול לענות
1. אימייל אישור ללקוח (`NOTIFY_LEAD_ACK`): כן/לא? ואם כן, האם מקובל שהוא תבנית קבועה בלבד?
2. אפליקציית הסוכנים הישנה: (א) alias `legacy` לפריסה הנוכחית מול טוקיו ל-30 יום, (ב) העתקת 191 הלקוחות ל-`crm.customers` עם HMAC+הצפנה (PII לפרנקפורט), או (ג) בלי גישה עד שלב ב'? ותאריך סיום.
3. `NOTIFY_INCLUDE_PII`: האם אימייל ההתראה יכיל שם וטלפון, או קישור בלבד?
4. GitHub: להישאר ב-Free/Pro עם שער actor+CODEOWNERS, או לשקול Enterprise/מאגר ציבורי לצורך required reviewers?
5. Supabase Team ($599) לצורך hooks של נעילה: לא מומלץ עכשיו; לאשר שמסתפקים בפיצוי.
6. `page_views` (3,359): ארכיון מוצפן בלבד, או לטעון היסטוריה למקום כלשהו?
7. `investment_tracks`: להציג עם "נכון ל-03/2026", להסתיר, או לחפש מקור חלופי?
8. PDage: למחוק את הקוד מהריפו, או להשאיר מאחורי דגל כבוי?
9. `customer_financial_snapshot` ו-Surense: מי מחזיק את הצינור, ומתי נבנה `surense-webhook` לפרנקפורט (שלב ב')?
10. סיווג רמת האבטחה של המאגר ומינוי ממונה הגנת פרטיות (תיקון 13): עם מי מאמתים, ועד מתי?
11. retention ללידים `lost|spam`: 24/36 חודשים מקובל?
12. נמעני התראות (`ops.alert_recipients`) וניתוב לידים (`NOTIFY_TO_*`): אילו כתובות?
13. שמות שלושת חברי הצוות ותפקידיהם (`agent/manager/admin`), ומי ה-admin שרושם TOTP ראשון.
14. חשבון Cloudflare (חינמי) ל-Turnstile: קיים או ליצור?
15. מחיקת העותקים המקומיים ב-`C:/tmp/infra/migrate-site/data/` אחרי ארכוב מוצפן: אישור מפורש נדרש.

## רשומות החלטה (ADR)

### 1. בסיס הסינתזה = עיצוב 0 כדלתא על 8 מיגרציות היסוד שכבר הוחלו על seeld-site
- נימוק: רק עיצוב 0 בנוי על api/core/crm/content/ops/audit/private, private.check_rate_limit, ops.outbox ו-api.submit_lead הקיימים; שתי החלופות דורשות למחוק עבודה שהוחלה ונבדקה
- חלופות שנדחו: public כסכמת API + site/crm/ops (עיצוב 1); הכול ב-public + legacy עם proposed/01-09 (עיצוב 2)

### 2. שתי סכמות חשופות: api (anon+לקוחות) ו-staff (צוות), anon בלי usage על staff
- נימוק: אומת בתיעוד (docs/guides/api/using-custom-schemas) שניתן לחשוף כמה סכמות ולפנות אליהן עם supabase.schema(); גבול שניתן להוכחה ב-has_schema_privilege; הודאה שבין לקוח לצוות הגבול הוא RLS
- חלופות שנדחו: סכמה חשופה אחת (יסוד, עיצוב 2 בטענה שגויה ש-worker מחייב public)

### 3. הרשאה מטבלה core.staff + aal2 ב-RLS; Custom Access Token hook כבוי
- נימוק: ביטול מיידי, אין SPOF לכניסה, אין חלון של שעה עם claim מיושן, ואין צורך ב-policy using(true) ל-supabase_auth_admin על טבלת תפקידים
- חלופות שנדחו: app_role ב-JWT דרך hook עם jwt_expiry 3600 (עיצוב 1)

### 4. Auth hooks: רק before_user_created; hooks של ניסיון סיסמה/MFA לא מופעלים
- נימוק: תיעוד Supabase: Password/MFA Verification Attempt זמינים ב-Teams and Enterprise בלבד; Before User Created ב-Free/Pro. פיצוי: מגבלות קצב מובנות, HIBP, TOTP חובה, העתקת auth.audit_log_entries ל-audit.auth_events כל 10 דקות + התראה
- חלופות שנדחו: שלושת ה-hooks (עיצוב 0, לא זמין ב-Pro); מעבר ל-Team ($599) רק לשם נעילה; אפס hooks (עיצוב 2)

### 5. אפס RPC כתיבה ל-anon בשלב א' (pgTAP is_empty); בשלב ב' החריג היחיד portal_open/portal_submit (set_eq)
- נימוק: פותר את הסתירה בעיצוב 0 (chat_start/chat_append ב-allowlist); כתיבת צ'אט דרך service_role מהפונקציה עם Origin, מתג וקצב
- חלופות שנדחו: api.chat_* חשופים ל-anon; submit_lead חשוף ל-anon עד Turnstile (ADR-5 ביסוד)

### 6. preview = ענף Supabase עמיד אחד בשם preview עם seed סינתטי; לא פרודקשן ולא ענף לכל PR
- נימוק: Data API לא בודק Origin (אומת: all origins allowed, הגבול הוא apikey), ולכן סוכן מחובר ב-preview יכול לכתוב לפרודקשן; ענף עמיד אחד עולה ~$10 לחודש ($0.01344 לשעה) בלי החלפת env אוטומטית
- חלופות שנדחו: preview קורא פרודקשן לקריאה בלבד עם Origin allowlist (עיצוב 1, מבוסס עובדה שגויה); ענף לכל PR (עיצוב 0)

### 7. שער מיגרציות לפרודקשן: workflow_dispatch + Environment production (סודות, deployment branch main) + בדיקת github.actor מול PROD_MIGRATORS + CODEOWNERS על supabase/**
- נימוק: תיעוד GitHub: required reviewers ו-wait timer במאגר פרטי זמינים רק ב-GitHub Enterprise; Pro/Team נותנים רק environments, secrets ו-deployment branches
- חלופות שנדחו: GitHub Environment required reviewers (כל שלושת העיצובים והשופטים; דורש Enterprise); db push אוטומטי על merge (עיצוב 1); מאגר ציבורי

### 8. verify_jwt לפי סוג הקורא: true ל-staff-invite (JWT משתמש), false ל-lead-intake/chat-bot/cron/health עם אימות בקוד
- נימוק: תיעוד auth-headers: הבדיקה מצפה ל-JWT משתמש ב-Authorization, מפתחות sb_* אינם JWT; להשאיר on כשנקרא עם JWT ולכבות כשאין Authorization
- חלופות שנדחו: verify_jwt=false אחיד (עיצוב 2; הכללה של פגם send-lead-notification)

### 9. מפתחות חתימת JWT אסימטריים (ECC P-256) ביום 1
- נימוק: getClaims() מאמת מקומית מול JWKS רק עם מפתח אסימטרי (תיעוד reference/javascript/auth-getclaims); חוסך קריאת Auth לכל בקשה בפונקציות
- חלופות שנדחו: HS256 legacy עם getUser לכל בקשה

### 10. ops.outbox v2 (next_attempt_at, locked_until, dead כ-DLQ) ולא pgmq עכשיו; Resend Idempotency-Key = outbox-<id>; תקציב זמן 60%
- נימוק: ops.outbox כבר הוחל (ADR-6); מיגרציה אחת מוסיפה retry/backoff/DLQ; pgmq מגיע עם 06-09 בלי rework
- חלופות שנדחו: pgmq עם ארכיון כ-DLQ עכשיו (עיצוב 1); שלושה זוגות תורים (עיצוב 2)

### 11. cron 7 → 5: notify-worker-tick, cma-sync-weekly (refresh בתוך הפונקציה), cma-freshness-monthly, ops-watchdog (כולל cron_http_audit על net._http_response והעתקת auth events), ops-cleanup
- נימוק: cron.job_run_details='succeeded' אומר שהבקשה נשלחה (פגם טוקיו); ops.job_runs.finished_at (עיצוב 1) + סריקת net._http_response (עיצוב 2) מכסים כשל שקט משני הסוגים
- חלופות שנדחו: 7 jobs של עיצוב 0 כולל cma-refresh-views-daily; 11 jobs עם notify-worker כל 30 שניות (עיצוב 2); sync-tracks מתוזמן למקור שבור

### 12. סוד cron ייעודי edge_cron_secret ב-Vault + ops.call_function; cron.job.command בלי URL ובלי סוד, נבדק ב-pgTAP
- נימוק: דליפת Vault או cron.job מאפשרת לכל היותר להפעיל job; מתקן את הפגם של URL קשיח ללא auth בטוקיו
- חלופות שנדחו: המפתח הסודי של הפרויקט ב-Vault (יסוד); net.http_post ישיר ב-cron

### 13. audit.access_log במסד לקריאות PII עם שמירה 25 חודשים; לא pgaudit
- נימוק: יומני הפלטפורמה קצרי טווח ואינם רשומה משפטית; תקנה 10 לתקנות אבטחת מידע דורשת תיעוד גישה 24 חודשים לפחות
- חלופות שנדחו: pgaudit ליומני Supabase (עיצוב 1); audit_log של כתיבות בלבד (עיצוב 2)

### 14. ת"ז לעולם לא בטקסט גלוי: HMAC עם national_id_hmac_key_v1 + pgp_sym_encrypt + national_id_last4 נפרד; הדפדפן מקבל רק תוצאת השוואה
- נימוק: מאגר של 191 לקוחות מזוהים עם נתוני בריאות/פיננסים; ת"ז בדפדפן ובטקסט גלוי הוא הטיפול החלש ביותר
- חלופות שנדחו: id_number גלוי + id_hash לצידו (עיצוב 1); בדיקת last-4 בצד לקוח (טוקיו)

### 15. customers (191) ו-customer_financial_snapshot (184) לא מועתקים לפרנקפורט בשלב א'; ארכיון מוצפן אצל הבעלים; חלופת tokyo_import רק באישור בעלים
- נימוק: עותק שני של PII רפואי/פיננסי שמתיישן בעוד Surense ממשיך להזין טוקיו = עיבוד ללא מטרה ופיצול זהות; שלב ב' קולט דרך אינטגרציה מאומתת עם HMAC
- חלופות שנדחו: העתקה קפואה service-only (עיצוב 1); identity_upsert_verified(..., 'clearing_house') שמזייף מקור אמינות (עיצוב 2)

### 16. החבילה החדשה של seeld.co.il בלי אף הפניה לטוקיו (שער no-tokyo-ref); גישה זמנית ללקוחות ישנים רק דרך alias legacy של הפריסה הקיימת, ≤30 יום, לפי החלטת בעלים
- נימוק: מבטל split-brain של שתי כתובות Supabase ושני מפתחות בחבילה אחת; ההפרדה הופכת לבדיקה אוטומטית
- חלופות שנדחו: שתי כתובות ב-CSP ובחבילה ל-30 יום (עיצוב 0); העתקת CRM מלאה ביום 3 (עיצוב 1)

### 17. agency_id מיום 1 על core.staff ו-crm.leads כגבול RLS; assigned_to לשיוך בלבד; core.agencies + default_agency_id
- נימוק: הוספה מאוחרת = שינוי כל policy; היום = עמודה ו-backfill; תיבת לידים משותפת לשני המפעילים
- חלופות שנדחו: בלי סוכנות עד שתהיה שנייה

### 18. Storage: אפס policies לתפקידי API, אפס buckets בשלב א', signed upload/download URLs מפונקציה אחרי שורת crm.documents; לוגו = נכס סטטי
- נימוק: הפגם בטוקיו היה אי-התאמה בין נתיב בקוד ל-policy (0 אובייקטים); תיווך מלא מבטל את המחלקה
- חלופות שנדחו: policies לפי agency_id/customer_id + bucket ציבורי ללוגו (עיצוב 1); policies לפי auth.uid (עיצוב 2)

### 19. בלי אימייל אישור ללקוח ובלי send-calculation-email בשלב א'; החלטת בעלים מתועדת לשינוי
- נימוק: שליחה לכתובת שמקליד הגולש היא וקטור spam-relay גם מאחורי Turnstile (אותה מחלקה כמו send-lead-notification)
- חלופות שנדחו: lead_ack מה-worker (עיצובים 1 ו-2)

### 20. גיבוי PII לא דרך GitHub Actions: dump ידני חודשי של הבעלים מוצפן ב-age עם תזכורת אוטומטית; גיבוי יומי של Supabase (7 ימים); PITR רק עם מסמכי לקוח (ועם Small)
- נימוק: GitHub כמעבד משנה של גיבויי PII מוסיף מקום שלישי; הנתונים בשלב א' קטנים; PITR ~$100 לחודש ודורש Small לפי התיעוד
- חלופות שנדחו: artifact מוצפן ב-Actions 90 יום (עיצוב 2); backup.yml לאחסון בעלים עם אישורים ב-GitHub (עיצוב 0)

### 21. לוח תרגולים מצומצם: שחזור רבעוני (issue אוטומטי), סיבוב סודות שנתי/בחשד, תרחיש חשבון פרוץ פעם אחת ביום 3, re-key של HMAC בשלב ב' בחשד
- נימוק: לוח חודשי/רבעוני/חצי-שנתי לא יתקיים בסוכנות של שניים; טקס שלא מתקיים אינו בקרה
- חלופות שנדחו: לוח התרגולים המלא של עיצוב 0

### 22. page_views נמחק (ארכיון מוצפן בלבד) ו-/api/geo מוסר; Vercel Web Analytics
- נימוק: עיר לפי IP + נתיב = מידע אישי בעל ערך נמוך ווקטור כתיבה אנונימי; חוק 'אין השמטה' מתקיים בארכיון
- חלופות שנדחו: RPC track_page_view אנונימי עם שמירה 400 יום (עיצוב 1); 90 יום (עיצוב 2)

### 23. PDage, client_access_links, insbase_links, saved_calculations, user_policies, enums: לא נבנים
- נימוק: PDage לא פעל בטוקיו (אין FK, pdage_customers לא קיימת, אין policy ל-bucket); client_access_links לא שימש את הפורטל בפועל (אומת); insbase_links = טוקני OAuth
- חלופות שנדחו: יצירת pdage_customers + 3 FK + policies; שמירת קוד PDage מאחורי דגל (שאלה פתוחה לבעלים)

### 24. health ציבורי מחזיר רק ok/degraded ודליים; מספרים מדויקים ב-staff.ops_health
- נימוק: outbox_pending ו-turnstile_required חשופים הם recon זול לתוקף שמתזמן flood
- חלופות שנדחו: health עם outbox_pending/oldest_pending_sec/turnstile_required (עיצוב 0); v_ops_health ל-anon (עיצוב 1)

### 25. בדיקת rendered_at ≥ 3 שניות נמחקת; rewrite /api/lead ב-Vercel לא נוצר
- נימוק: rendered_at ניתן לזיוף על ידי כל סקריפט; rewrite מכניס hop של Vercel שמאחד גולשים ל-IP אחד מול Turnstile remoteip ומגבלת lead_ip
- חלופות שנדחו: שניהם מעיצוב 0

### 26. private.client_ip(): cf-connecting-ip קודם, אחרת הפריט האחרון של x-forwarded-for; IP = בקרה משנית אחרי Turnstile; אימות כותרות ביום 2
- נימוק: הפריט הראשון של x-forwarded-for (כפי שהתיעוד מציע) ניתן לזיוף על ידי לקוח שמוסיף כתובות; ההופ שהשער מוסיף הוא האחרון
- חלופות שנדחו: split_part(..., ',', 1) כפי שהוחל ביסוד

### 27. סודות Edge: המפתח הסודי נשמר כ-SEELD_SECRET_KEY (לא SUPABASE_*)
- נימוק: שמות שמתחילים ב-SUPABASE_ שמורים לפלטפורמה ואינם ניתנים להגדרה ידנית
- חלופות שנדחו: SUPABASE_SECRET_KEY (עיצוב 0)

### 28. staff-invite מכניס שורת core.invitations לפני inviteUserByEmail
- נימוק: hook_before_user_created דוחה כל יצירה בלי הזמנה פתוחה; סדר הפוך = כל הזמנה נכשלת (פגם שהשופט זיהה בעיצוב 0)
- חלופות שנדחו: הזמנה מהדשבורד בלי שורת invitations

### 29. hook_before_user_created ללא security definer, עם grant select + policy ל-supabase_auth_admin על core.invitations ו-grant insert על audit.auth_events
- נימוק: תיעוד Supabase ממליץ לא להשתמש ב-security definer ל-hooks ומראה grant + policy ל-supabase_auth_admin; בלעדיהם ה-hook רואה אפס שורות (הפגם שזוהה בעיצוב 1)
- חלופות שנדחו: hook כ-security definer (עיצוב 0)

### 30. grant delete על content.blog_posts/travel_companies ל-authenticated מוסר; מחיקה = status='archived'
- נימוק: עקביות עם 'אין delete לתפקידי API' ועם pgTAP policy lint; היסוד נתן delete למנהלים
- חלופות שנדחו: delete למנהלים דרך view (יסוד)

## שאלות פתוחות לבעלים

- אימייל אישור אוטומטי ללקוח (NOTIFY_LEAD_ACK): כן/לא? אם כן, האם מקובלת תבנית קבועה בלבד ללא טקסט חופשי?
- אפליקציית הסוכנים הישנה אחרי cutover: (א) alias legacy לפריסה הנוכחית מול טוקיו ל-30 יום, (ב) העתקת 191 הלקוחות ל-crm.customers עם HMAC+הצפנה (PII לפרנקפורט), או (ג) בלי גישה עד שלב ב'? ותאריך סיום.
- NOTIFY_INCLUDE_PII: האם אימייל ההתראה לסוכן יכיל שם וטלפון, או רק סוג הפנייה וקישור?
- GitHub: להישאר ב-Free/Pro עם שער actor+CODEOWNERS למיגרציות, או לשקול Enterprise/מאגר ציבורי לצורך required reviewers?
- Supabase Team ($599) לצורך hooks של נעילת סיסמה/MFA: לאשר שמסתפקים בפיצוי (מגבלות קצב, HIBP, TOTP, התראה) ולא עולים תוכנית.
- page_views (3,359 שורות): ארכיון מוצפן בלבד, או לטעון היסטוריה למקום כלשהו?
- investment_tracks (קפוא מ-26.3.2026): להציג עם 'נכון ל-03/2026', להסתיר, או לחפש מקור חלופי?
- PDage: למחוק את הקוד מהריפו, או להשאיר מאחורי דגל כבוי?
- customer_financial_snapshot והצינור Surense→טוקיו: מי מחזיק אותו, ומתי נבנה surense-webhook לפרנקפורט (שלב ב')?
- סיווג רמת האבטחה של המאגר (בינונית/גבוהה) ובדיקת חובת מינוי ממונה הגנת פרטיות לפי תיקון 13: עם איזה יועץ ועד מתי?
- retention ללידים בסטטוס lost/spam: מחיקה רכה אחרי 24 חודשים ומחיקה קשה אחרי 36 מקובל?
- נמעני ההתראות התפעוליות (ops.alert_recipients) וניתוב הלידים (NOTIFY_TO_INSURANCE/FINANCE/GENERAL): אילו כתובות?
- שלושת חברי הצוות ותפקידיהם (agent/manager/admin), ומי ה-admin שרושם TOTP ראשון.
- חשבון Cloudflare (חינמי) ל-Turnstile: קיים או ליצור?
- אישור מפורש למחיקת העותקים המקומיים ב-C:/tmp/infra/migrate-site/data/ אחרי ארכוב מוצפן ואימות ספירות.

## שלושת העיצובים (עיקרי ההחלטות)

### עיצוב 0: SEELD: תכנון יעד לבק-אנד פרנקפורט, Vercel ו-CI מנקודת מבט אבטחה ופרטיות (security-first)
- שתי סכמות חשופות לפי קהל: api לאנונימי וללקוחות, staff לצוות; anon ללא usage על staff; הטבלאות עצמן בסכמות לא חשופות (core, crm, content, ops, audit, private)
- אין כתיבה ישירה מהדפדפן לשום טבלה עם PII; כל כתיבה ל-crm/core היא RPC security definer עם ולידציה, בדיקת תפקיד, aal2 ורישום audit; כתיבה דרך view מותרת רק לתוכן ציבורי (blog_posts, travel_companies) ובלי delete
- אין RPC כתיבה שחשוף ל-anon: lead-intake עם Turnstile + Origin allowlist מיום 1 קורא ל-api.submit_lead עם המפתח הסודי; p_client_ip מתקבל רק מ-service_role
- הרשאה מטבלה (core.staff) ולא מ-claims; is_staff() = שורה פעילה + aal2; פעולות מנהל דורשות amr עם totp טרי (is_fresh_mfa); ביטול סוכן = עדכון שורה אחת ותקף מיידית
- סוד cron נפרד מהמפתח הסודי: edge_cron_secret ב-Vault, wrapper ops.call_function() כך שאין סוד ואין כתובת ב-cron.job.command; הפונקציה משווה בזמן קבוע
- תיעוד גישה ל-PII (audit.access_log) בכל RPC שמחזיר נתוני לקוח, בנוסף ל-audit.log של שינויים; שמירה 25 חודשים (תקנה 10 לתקנות אבטחת מידע, לאימות משפטי) ולא 400 יום
- Auth hooks כפונקציות Postgres: password_verification_attempt ו-mfa_verification_attempt לנעילה אחרי 5 כשלונות ולתיעוד; before_user_created דוחה כל יצירה שאינה בהזמנה; Custom Access Token hook כבוי
- פורטל לקוחות (שלב ב'): טוקנים נשמרים כ-sha256 בלבד, קשורים למטרה ולרשומה, last-4 של ת"ז נבדק בשרת עם נעילה; קריאה ועדכון רק ב-api.portal_open / api.portal_submit; אפס policies ל-anon על טבלאות פרטיות (מתקן את recommendation_summaries ו-client_access_links)
- ת"ז לעולם לא בטקסט גלוי: HMAC-SHA256 עם מפתח Vault מגורסה (national_id_hmac_key_v1) + pgp_sym_encrypt; הדפדפן לא מקבל אף פעם id_number, רק תוצאת השוואה
- Storage ללא policies ל-anon/authenticated בכלל: העלאה רק ב-signed upload URL מפונקציה שיוצרת קודם שורת crm.documents, הורדה רק ב-signed URL 60 שניות שנרשם ב-access_log; אין bucket בהקמה; לוגו סוכנות נשאר בקוד
- Realtime כבוי עכשיו (הסרת subscription של customer_messages); בשלב ב' broadcast פרטי מטריגר עם RLS על realtime.messages ולא postgres_changes
- נתונים: רק blog_posts (22), investment_tracks (571 מהייצוא, הסנכרון שבור) ו-cma_* מהמקור נכנסים; customers/customer_financial_snapshot/Surense לא מועתקים, ארכיון מוצפן אצל הבעלים; PDage נמחק; page_views נמחק (Vercel Web Analytics); insbase_links לעולם לא

### עיצוב 1: SEELD Frankfurt: תכנון יעד פשוט-לתפעול (simplicity-ops-first) (simplicity-ops-first)
- Schema split: `public` holds zero tables, only `security_invoker` views + RPC; base tables live in `site` (public content), `crm` (all PII), `ops` (operations). Enforced by a pgTAP invariant in CI; structurally eliminates the Tokyo 'anon/authenticated hold ALL' defect.
- Roles are data in `ops.principals` (one row per user: agent|manager|super_admin|client, agency_id, customer_id) projected into JWT claims `app_role`/`agency_id`/`customer_id` by a Custom Access Token Hook; RLS reads only claims + auth.uid(). MFA is enforced in RLS via `ops.aal2()` (aal1 agents see zero rows), not in the frontend.
- Agency-wide visibility (`agency_id`) is the RLS boundary for the two-person agency; `agent_id` is assignment only.
- Exactly one unauthenticated edge function: `lead-intake` (Origin allowlist, Turnstile, honeypot, zod, IP+email rate limits, idempotency key). It inserts via `crm.submit_lead` and enqueues to pgmq `notifications` in one transaction; all email is sent by `notify-worker` (cron every minute, Resend with Idempotency-Key, archive after 5 reads = DLQ). Replaces send-lead-notification, send-calculation-email, send-onboarding-summary.
- Client portal fixed: no anon table access; `portal_open(token, id_last4)` / `portal_respond(...)` RPCs with `token_hash` stored (raw token never persisted), expiry, last-4 check server-side, 10 attempts/hour per token. `client_access_links` dropped.
- Cron: 7 jobs -> 4 (`cma_sync` 0 3 * * 0,3 replaces three; matview refresh moved inside fetch-cma-data; `notify_worker`; `cma_freshness` with fixed CHECK; `housekeeping`). All HTTP cron goes through `ops.call_edge()` reading `edge_base_url` + `cron_shared_secret` from Vault; functions verify `CRON_SHARED_SECRET`.
- Auth: agents = email+password+TOTP, signup disabled, invite-only; social OFF (3 Google identities not migrated, users reset password); clients phase 1 = token link, phase 2 = SMS OTP via Supabase phone auth after national-ID hash precheck; custom SMTP via Resend; sessions timeboxed.
- Storage: `source-files` private with path `{agency_id}/{customer_id}/...` and agency-keyed policy; new public `agency-assets` bucket for logos; `correction-files` and `client-files` not created now.
- Data: site.* loaded from existing JSON exports via service key; PII tables via owner-run pg_dump into a `tokyo_import` schema then mapped INSERT...SELECT (fixing duplicate FK columns during the move); auth.users/identities (email only) copied preserving ids; `customer_financial_snapshot` moved as frozen service-only copy; Surense pipeline stays in Tokyo (explicit gap); `investment_tracks` moved frozen, no cron (source dead since 2026-03).
- PDage module (4 tables, 3 functions, bucket) not created; code kept behind a disabled flag pending owner decision. Realtime removed (ChatTab -> polling), `wss:` dropped from CSP.
- Vercel: project-level `regions: [fra1]`, CSP updated to Frankfurt URL + challenges.cloudflare.com, no hardcoded fallbacks anywhere (config.ts, api/*.ts, prerender.mjs fail loudly). Preview uses production anon key read-only; writes blocked by Origin allowlist; no Supabase branching.
- CI/CD: existing ci.yml + new `db` job (`supabase db reset`, `supabase test db` pgTAP, `db lint`, config.toml drift check); new `deploy-backend.yml` on main runs `supabase db push` + `functions deploy` with only SUPABASE_ACCESS_TOKEN/DB_PASSWORD/PROJECT_REF secrets; expand/contract makes deploy order irrelevant.

### עיצוב 2: בק-אנד חדש לאתר SEELD בפרנקפורט: הפלטפורמה המונחית אירועים כצרכן ראשון (extensibility-event-first)
- הקבצים המאומתים supabase/proposed/01,02,03,06,07,08,09 מוחלים מילה במילה כליבה; 04/05 נדחים; שינוי יחיד כשכבת-על: current_platform_role() מחזיר null בלי aal2, כך ש-TOTP נאכף בכל RPC של צוות
- ליד הוא אירוע: הטפסים קוראים ל-Edge Function אחת intake-lead (Origin + Turnstile + consume_rate_limit לפי IP וטלפון + idempotency-key) שמסתיימת ב-save_lead; שדות הליד נזרעים כ-field_ownership (lead.*) ולא כעמודות; אין INSERT אנונימי לשום טבלה, page_views דרך RPC
- התראות הן תור pgmq נפרד notifications שמוזן מטריגר על event_log (event.accepted/lead.created) באותה טרנזקציה; notify-worker שולח דרך Resend עם Idempotency-Key=eventId ומטפל גם ב-ops_alerts; אין endpoint ציבורי ששולח מייל
- cron קורא לפונקציות רק דרך cron_invoke() (URL וסוד מ-Vault); cron_http_audit() סורק net._http_response ו-heartbeat/v_health/api/health חושפים cron מת; cma נמשך פעם בשבוע ומרענן matviews בסוף; cma_check_freshness מתוקן
- ברירות המחדל של Supabase מבוטלות ב-default privileges; ארבע תבניות policy בלבד (תוכן ציבורי, ניהול צוות, שורות בעלים, אין policy + RPC); using(true) רק ברשימה סגורה שנבדקת ב-pgTAP; verify_jwt=false אחיד עם אימות בקוד
- שתי סכמות בלבד: public (API + פלטפורמה + תוכן אתר) ו-legacy (ארכיון לא חשוף); סכמה נוספת לא תהיה גבול אבטחה כי ה-worker מחייב חשיפת public
- מודול ה-CRM הישן (customers/products/recommendations/execution/import/PDage/client_access_links/customer_messages/chat) לא מועבר; 191 הלקוחות נכנסים ל-identity_links/field_values/agent_workbench מ-dump שהבעלים יספק; customer_financial_snapshot נשאר בטוקיו עד adapter של Surense
- Auth: הרשמות, OAuth, Phone, אנונימי כבויים; 6 משתמשי טוקיו לא מועברים, 3 אנשי צוות מוזמנים מחדש עם סיסמה+TOTP; לקוחות כבויים עד שלב ההזמנות (ת"ז HMAC + SMS OTP דרך identity_links.auth_user_id הקיים); אין hooks
- Storage: אף bucket בשבועות הראשונים; תקן עתידי של שני buckets (client-files לפי auth.uid, customer-files לפי internal_customer_id) עם policies תואמות לבניית נתיבים אחת
- Vercel ב-fra1, CSP חדש (פרנקפורט + Turnstile, בלי ipapi/wss), no-store+noindex לנתיבי האפליקציה, אפס fallback לטוקיו (שער CI); מיגרציות ופונקציות נפרסות רק מ-GitHub Actions עם אישור ידני; Vercel ממשיך לפרוס מ-git ולכן expand/contract
- לא עכשיו: adapters/queue-worker, פורטל לקוחות, buckets, AI, צ'אט, הוראת קבע, api-v1, realtime, branching, GraphQL, hooks, PITR (מופעל לפני נתוני לקוחות פיננסיים)

## הערות השופטים

- מנצח לפי שופט זה: 0. Lens: operability and cost for a two-agent agency that must run this without DevOps. Repo check confirms the grounding facts the designs rely on: 8 foundation migrations dated 20261118 are already in the repo (schemas api/core/crm/content/ops/audit/private, private.check_rate_limit, ops.outbox, api.submit_lead, api.leads with `grant update (status, assigned_to, notes, deleted_at) ... to authenticated`), 4 pgTAP files exist under supabase/tests, _shared/ has cors/errors/logger/rateLimit/auth/request/alerts/queueWorker, and FOUNDATION.md contains ADR-2/5/14/19 as cited by Design 0. Only Design 0 is written as a delta on that applied foundation; Designs 1 and 2 each propose a different schema layout (public-as-API + site/crm/ops; everything-in-public + legacy) that would discard the lead architect's work, which is a hidden rework cost neither of them prices.

Design 0 wins (44) on this lens despite being the least simple, because its operability features are the ones that matter on a Saturday morning: ops.config kill switches checked in every RPC/function, a watchdog with named thresholds, DLQ replay as an RPC, health exposing backlog age, a cron secret that is not the DB key, and CI gates that stop preview-to-prod and verify_jwt drift. Its security has no structural hole; its concrete defects are a plan-tier error (password/MFA verification hooks are Team/Enterprise, not Pro), an unrealistic day-1 scope, 7 cron jobs, and a drill/rotation calendar two agents will not keep. All are trimmable without touching the architecture.

Design 1 (41) is the best pure-simplicity answer and the cheapest, and it is the only one that keeps the agents' CRM working on day 3. It loses on three concrete facts: (a) 'preview cannot write' is false because PostgREST ignores Origin, so any preview build is a write path to production CRM for a logged-in agent; (b) role claims in a 1-hour JWT via Custom Access Token Hook delay revocation and make the hook a login SPOF; (c) pgaudit output lives in 7-day Supabase logs while agents read PII through views, so there is effectively no 24-month access record. Plaintext id_number and direct DML grants on PII tables finish the gap. Its cron reduction, pgmq-archive DLQ, same-name views and job_runs.finished_at monitoring should be ported into Design 0.

Design 2 (32) inverts the owner's constraint: it builds the integration platform first (11 cron jobs, a 30-second worker, EAV leads 'owned by salesforce', metrics folding every minute) for a site with two leads and no connected systems, and justifies a single exposed schema with an incorrect claim about PostgREST. Its cron_http_audit, heartbeat/v_health thresholds, request-id tracing and the zod-subset-of-seed CI test are worth taking regardless.

Recommended synthesis for the lead architect: keep Design 0's structure and take from Design 1 the fold of matview refresh into fetch-cma-data (7 -> 5 cron jobs), the pgmq archive as DLQ instead of a hand-rolled outbox v2, and the 'preview shows forms as not-sent' pattern; take from Design 2 cron_http_audit and the heartbeat thresholds; drop the Team-plan auth hooks (rely on built-in auth rate limits + auth.audit_log_entries + a nightly query), cut the drill calendar to one quarterly restore drill and one annual secret rotation, and decide explicitly whether the agents' CRM (191 customers) ships in phase B or whether Design 1's tokyo_import path is adopted for a read-only customers list on day 3.
  - עיצוב 0: סה"כ 44; חוזקות: Only design with no structural write path from the browser to PII: every crm/core write is a named security-definer RPC with role+aal2 check, kill-switch check and semantic audit row; a stolen aal2 session cannot bulk-update leads through a view; Builds as a delta on the 8 foundation migrations already applied to seeld-site (api/core/crm/content/ops/audit/private, private.check_rate_limit, ops.outbox, api.submit_lead) instead of discarding the lead architect's work; it even identifies the concrete hole in the applied foundation (grant update on api.leads/crm.leads to authenticated) and removes it; Dedicated edge_cron_secret in Vault separate from the DB secret key, with ops.call_function() so cron.job.command carries no URL and no secret; a Vault or cron.job leak can at most trigger a job; חולשות: Wrong Supabase plan fact: the password_verification_attempt and mfa_verification_attempt hooks are Team/Enterprise-plan features, not available on the $25 Pro plan the cost table assumes; the lockout-after-5-failures design in section 4.4 will not deploy as written (before_user_created is fine). Fallback is Supabase's built-in auth rate limits + auth.audit_log_entries; Ceremony load is not boring-to-operate for two agents: monthly 30-min restore drill, quarterly rotation of 4 secrets, annual HMAC re-key, semi-annual compromised-account and rollback drills, weekly 15-min observability review. This calendar will not be kept by a two-person agency; Day 1 scope (6 migrations incl. staff schema split, helpers, RPC set, submit_lead v2, cron wrapper + outbox v2 + watchdog, auth hooks, plus a 7-actor pgTAP matrix per table) is realistically 2-3 days on its own; the 3-day plan is optimistic; לקחת: Dedicated edge_cron_secret (not the DB key) in Vault + ops.call_function() wrapper so cron.job.command contains neither URL nor secret; constant-time comparison in the function; ops.config kill switches (intake_enabled, chat_enabled, portal_enabled, intake_turnstile_required) checked at the top of every RPC and edge function; audit.access_log for PII reads via private.log_access(action, customer_ids, row_count) with 25-month retention
  - עיצוב 1: סה"כ 41; חוזקות: Fewest moving parts of the three: one exposed schema, three storage schemas, one auth hook, four cron jobs, native pgmq archive as DLQ, no custom outbox state machine, no new vendors; Same-name security_invoker views in public (blog_posts, customers, products...) so the existing frontend `.from()` calls and PostgREST embedding keep working; the cutover is mostly env + one leadIntake.ts wrapper; Preserves the agents' working CRM: 191 customers, products, recommendations, import batches and auth.users move with ids preserved; the owner keeps a functioning app on day 3; חולשות: Wrong Supabase fact underpinning 'preview cannot write': PostgREST does not enforce Origin; CORS is browser-side and Supabase allows all origins. An agent who logs in (password+TOTP needs no redirect URL) from any *.vercel.app preview build writes straight to production crm.* through the views. The Origin allowlist protects only lead-intake; Custom Access Token Hook puts app_role/agency_id in the JWT with jwt_expiry=3600: deactivating a principal or demoting a role takes effect up to an hour later, and a hook failure means nobody can log in (acknowledged as a single point of failure). Table-lookup authorization (D0/D2) revokes immediately; Direct DML grants (select/insert/update/delete) on crm.customers and other PII tables to authenticated: a stolen aal2 session can bulk-mutate or (as manager) delete PII through the view; audit is trigger-diff, not semantic action; לקחת: Collapse 7 cron jobs to 4: refresh matviews inside fetch-cma-data, single cma_sync schedule, notify_worker, cma_freshness, housekeeping; pgmq archive as the DLQ (no second queue) + Resend Idempotency-Key = msg_id; replay = pgmq.send from the archive table; Same-name 1:1 security_invoker views so existing `.from()` and embedded selects survive the cutover; verify embedding on day 1 with the real AppProviderImpl queries against the local DB
  - עיצוב 2: סה"כ 32; חוזקות: Maximal reuse of SQL that already exists and is tested (proposed 01,02,03,06,07,08,09 with 164 pgTAP tests): the DB build on day 1 is mostly applying files, not writing them; cron_http_audit() scanning net._http_response for status>=400/timeouts turns the Tokyo silent-pg_net failure into an ops_alert; heartbeat table -> v_health -> /api/health thresholds (cron>180s, notify_worker>300s); Single overlay change (current_platform_role() returns null without aal2) enforces TOTP in every staff RPC without editing verified code; חולשות: Wrong Supabase fact used to justify the single-schema design: a second exposed schema is not 'impossible because the worker needs public'. PostgREST exposes multiple schemas ([api] schemas = [...]) and supabase-js targets them with .schema(); the worker could call RPC in an ops schema. Result: platform tables, content and RPC all live in public and safety rests on grants alone; Applies the entire event platform (identity_links, field_ownership, field_values, source precedence, Salesforce/Surense queues with enabled=false, dashboard metrics, workbench time flags) for a site with 2 leads and zero connected systems; a website lead becomes EAV rows 'owned by salesforce'. Premature generality, not extensibility; 11 cron jobs (Tokyo had 7) including notify-worker every 30 s, metrics_fold every minute, heartbeat every minute, workbench flags and queue watchdog every 5 min: constant pg_net and Disk IO churn on Micro with no traffic; the compute upgrade this will force is not in the cost table; לקחת: cron_http_audit(): scan net._http_response every 10 min for status null/>=400/timed_out and raise a deduplicated ops_alert; heartbeat table touched by cron/worker/cma jobs, surfaced through v_health with explicit staleness thresholds; CI test that the intake zod schema keys are a subset of the seeded field/column list (schema-vs-data drift guard)
- מנצח לפי שופט זה: 0. Lens: product fit + extensibility for a two-agent agency that must run boringly, be built in days, meet Israeli data-security regulations (health + financial data), and extend without rework.

Repo facts checked: the eight foundation migrations 20261118162452..20261118162856 exist, so Design 0's 'delta' framing is real; foundation_crm_leads.sql currently grants insert + column-update on crm.leads/api.leads to authenticated, which Design 0 explicitly removes. The agent app has 107 direct .insert/.update/.upsert/.delete call sites across 42 files (AppProviderImpl.tsx 17), which is why Design 0 must park the CRM screens and why Design 1's same-name views are the cheapest cutover. docs/platform/research/ does not exist as Design 0 states. proposed/01-09 exist as Design 2 relies on.

Why Design 0 wins (41 vs 40 vs 37), narrowly: it is the only design that actually delivers 'highest professional level' for a special-category PII database (read-access log with 24+ month retention, HMAC+encrypted national ID, immediate table-driven revocation, kill switches, preview isolation, no second rotting PII store) and its complexity is mostly build-time SQL and tests that run themselves; runtime is one worker, one cron wrapper, one outbox. Its real costs are the loss of the CRM screens at cutover (defensible: 1/1/1/0 rows in those modules, Surense remains the system of record) and a dependency on Team-plan Auth hooks that must be removed.

Why Design 1 does not win despite being the most boring and the best product-continuity story: it contains a day-1 lockout bug (hook reads an RLS-enabled table with zero policies as supabase_auth_admin), a wrong Supabase fact that creates a real exposure (previews can write to production via PostgREST with a prod agent session), one-hour revocation latency from claims-in-JWT, plaintext national IDs, pgaudit into 7-day logs as the access-log story, and it duplicates 191 customers + 184 health/financial snapshots into a copy that rots while Tokyo keeps updating. Fixing those turns it into most of Design 0.

Why Design 2 is last on this lens: strongest extensibility on paper, but it violates 'boring to operate' outright (EAV lead storage with Salesforce-owned fields and no Salesforce, silent field rejection, 11 cron jobs with 30-second ticks on Micro, a workbench UI rewrite squeezed into day 2) and generalizes Tokyo's verify_jwt=false defect to every function. Its overlay trick, cron_http_audit, trigger-fed pgmq notifications and asymmetric JWT keys are worth transplanting.

Recommended synthesis for the lead architect: take Design 0 as the base; drop the password/MFA verification hooks (Team plan) in favor of GoTrue rate limits + auth.audit_log_entries + before_user_created; define private.my_agency_id(); drop or fix the /api/lead rewrite (x-forwarded-for) ; steal Design 1's same-named security_invoker views for any read path the existing UI needs, 4-cron consolidation and job_runs-based monitoring; steal Design 2's aal2-in-role chokepoint (already equivalent in is_staff), cron_http_audit and the event_log->pgmq trigger pattern for when 06-09 land. Keep previews off production regardless of which base is chosen.
  - עיצוב 0: סה"כ 41; חוזקות: Only design that maps the Israeli Data Security Regulations concretely: audit.access_log for PII reads from every customer-returning RPC, 25-month retention (Reg 10), DPO/Amendment 13 check, incident-report template, sub-processor list (AWS/Supabase, Vercel, Resend, Cloudflare, Google AI).; Authorization from core.staff rows + aal2 in RLS, so revocation is one UPDATE and immediate; no custom claims, Custom Access Token hook off (one less moving part the other designs depend on).; api.submit_lead is service_role-only behind a Turnstile+Origin edge function from day 1; anon has exactly four allow-listed RPCs, proven by a pgTAP set_eq test.; חולשות: Password-verification-attempt and MFA-verification-attempt Auth hooks are Team/Enterprise plan features in Supabase; on the $25 Pro plan the whole 5-failures lockout design (4.4) cannot be enabled. before_user_created is fine. Verify, but as written the lockout is paper.; 'Browser never writes PII' collides with the real codebase: 107 direct .insert/.update/.upsert/.delete call sites across 42 files (AppProviderImpl.tsx alone has 17). Consequence is admitted: the agent app (/app, /portal, /client, /execution-portal) stays on Tokyo or is disabled at cutover; only leads survive via staff.*. The CRM screens vanish for the two agents on day 3.; Optional /api/lead Vercel rewrite is an operational trap: requests reach lead-intake from Vercel's egress IP, so Turnstile remoteip and the lead_ip 8/10-minute bucket collapse all visitors into one key unless x-forwarded-for is parsed; the rate limiter then self-DoSes legitimate leads.; לקחת: ops.call_function() wrapper with a dedicated edge_cron_secret (not the DB secret key) so cron.job.command contains neither URL nor secret.; audit.access_log for PII reads written by every customer-returning RPC, retained 25 months (Reg 10 of the Data Security Regulations).; private.is_fresh_mfa() step-up from amr[].timestamp for admin RPCs (staff disable, config set, portal-link revoke-all).
  - עיצוב 1: סה"כ 40; חוזקות: public holds zero tables; same-named security_invoker views over site./crm. mean .from('blog_posts') and PostgREST embedding keep working, so frontend cutover is near zero code change. One pgTAP invariant (pg_tables in public = 0) enforces it forever.; Smallest runtime footprint of the three: 4 cron jobs, 1 auth hook, 1 unauthenticated function, 1 pgmq queue; matview refresh folded into fetch-cma-data.; Expand/contract discipline makes Vercel-from-git vs db push ordering irrelevant; no maintenance window.; חולשות: Day-1 lockout bug: ops.custom_access_token_hook reads ops.principals, and the design rule says ops.* tables have RLS enabled with zero policies and zero grants. supabase_auth_admin is not the table owner and has no BYPASSRLS, so the hook sees zero rows and every agent gets app_role='none'. Supabase's own hook docs add an explicit policy for supabase_auth_admin; this design omits it.; Wrong Supabase fact: 'preview cannot write because lead-intake enforces an Origin allowlist'. PostgREST/Supabase Data API does not enforce Origin. An agent who logs into any preview deployment (unreviewed PR code) holds a production aal2 session with insert/update/delete grants on crm.customers and can write to production. No Vercel Deployment Protection is mentioned.; Roles projected into JWT claims with jwt_expiry=3600: deactivating or demoting an agent (principals.active=false) takes effect only at the next refresh, up to one hour; no auth.admin.signOut(global) step is specified. Design 0 and 2 revoke immediately via table lookup.; לקחת: public schema holds zero tables; same-named security_invoker views over site./crm. so existing .from() calls and PostgREST embedding survive the cutover with no frontend rewrite.; pgTAP invariants: count(pg_tables where schemaname='public') = 0, and no anon/authenticated grants in ops/pgmq/vault.; Seven cron jobs collapsed to four; matview refresh executed inside fetch-cma-data so there is nothing to drift.
  - עיצוב 2: סה"כ 37; חוזקות: Reuses the verified proposed/01,02,03,06,07,08,09 verbatim with 164 existing pgTAP tests; the single overlay (current_platform_role() returns null without aal2) enforces TOTP on every staff RPC through one chokepoint.; Maximal extensibility: adding Salesforce/Surense adapters, notification recipients, assignment rules or fields is an INSERT (field_ownership, queue_destinations, notification_routes, assignment_rules), not a deploy.; Transactional outbox done properly: trigger on event_log enqueues to pgmq notifications in the same transaction; notify-worker loads PII only at send time; Resend Idempotency-Key = eventId.; חולשות: An event platform with EAV storage (field_values + field_ownership) for a contact form: lead fields are seeded with owner_system='salesforce' although the agency has no Salesforce, and an unknown field key is silently rejected by save_lead (reject_unknown_field). Adding one form field = migration + seed + CI check. This is the opposite of boring for two agents.; 11 cron jobs including a 30-second notify-worker, per-minute metrics_fold and heartbeat, 5-minute workbench flags and queue watchdog, on Micro compute shared with pg_net and matview refreshes; Saturday-morning debugging means joining event_log, field_values, agent_workbench and identity_links to find out why a lead is missing a phone number.; Uniform verify_jwt=false for every function generalizes Tokyo's exact defect pattern (send-lead-notification). The publishable-key argument is half-right, but the result is that every function is one forgotten requireX() call away from being an open endpoint; the other designs keep verify_jwt=true where a user JWT is required.; לקחת: current_platform_role()/is_staff() returning null without aal2: a single chokepoint that enforces TOTP across every staff RPC and policy without touching each one.; cron_http_audit() scanning net._http_response for status >= 400 / timed_out and raising deduped ops_alerts; heartbeat row per worker surfaced in /api/health with thresholds.; AFTER INSERT trigger on event_log that pgmq.send()s to notifications in the same transaction; worker loads PII only at send time; Resend Idempotency-Key = eventId.
- מנצח לפי שופט זה: 0. Lens: security and compliance (Israeli Protection of Privacy Law, data security regulations 2017, amendment 13; the dataset includes national IDs, health and financial data for ~191 identified clients). Facts checked against C:/tmp/infra/migrate-site/INVENTORY.md and the repo: the 8 foundation migrations 20261118162452..162856 ARE applied/committed (api schema with security_invoker views, api.leads with column-level update to authenticated, api.submit_lead granted to anon with a comment 'revoke once Turnstile fronts it', private.check_rate_limit, private.client_ip, ops.outbox/config, ops.cleanup cron). Only Design 0 builds on that; Designs 1 and 2 propose incompatible schema layouts (site/crm/ops + public views; everything in public via proposed 01-09) and would rework the lead architect's work on day 1.

Totals: D0 41, D1 42, D2 34. The totals are within one point between D0 and D1; the winner is Design 0 because under this lens the security gap (9 vs 5) is decisive and D1's weaknesses are structural while D0's are trimmable. D1's regressions cannot be patched without changing its model: roles in JWT claims give a 60-minute revocation lag and a login-wide hook SPOF; direct insert/update/delete grants on every PII table through views bypass its own audit log; pgaudit as the access log lands in 7-day Postgres logs and fails the 24-month retention of reg. 10; national IDs stay plaintext and reach the browser; health snapshots are copied with no consumer; public LLM endpoints and a visitor-addressed ack mail remain. D0's weaknesses are scope (two exposed schemas, hooks, 7-actor matrices, branching, GitHub Environments) and three concrete errors: (1) Password/MFA Verification Attempt hooks are Teams/Enterprise-only, so the lockout logic is unavailable on the $25 Pro plan it budgets; (2) the anon RPC allowlist contradicts the 'no anon write RPC' claim (chat_start/chat_append/portal_submit); (3) IP-keyed DB rate limits depend on an unspecified x-forwarded-for parsing that may be spoofable. All three can be fixed by deletion or a one-line clarification.

Design 2 is the strongest on extensibility ideology and has the best silent-failure detection (cron_http_audit, heartbeat), but it imposes an event platform with no live consumer on a two-agent agency with 2 leads, drops the agents' CRM screens, fabricates provenance for imported customers ('clearing_house'), keeps everything in one exposed schema, loosens sessions (8h inactivity/24h timebox), and runs 11 cron jobs. It is neither boring nor proportionate.

Recommended merge for the lead architect: ship Design 0 with D1's simplifications (no Supabase branching: preview reads prod public views with writes Origin-blocked; one health view -> /api/health -> site-watch; pgmq archive as DLQ; expand/contract; factor-reset runbook) and D2's detectors (cron_http_audit over net._http_response, heartbeat table, no-tokyo-ref grep, using(true) allowlist test, auth config as code). Drop D0's password/MFA hooks (plan tier) in favor of built-in auth rate limits plus audit.auth_events written from the frontend-visible failures, keep before_user_created, remove chat_start/chat_append from the anon allowlist (route chat writes through the service role only), and specify client_ip() to take the gateway-appended hop. Owner decisions to surface explicitly: ack email yes/no, customer ack vs spam risk, Tokyo /app end date, Teams plan or no lockout hooks, GitHub Pro/Team for environment approvals.
  - עיצוב 0: סה"כ 41; חוזקות: Only design written as a delta on the 8 foundation migrations already applied to seeld-site (verified in repo: 20261118162452..162856 create api/core/content/ops/audit/private, security_invoker api views, private.check_rate_limit, private.client_ip, ops.outbox/config, api.submit_lead granted to anon with a comment saying 'revoke once Turnstile fronts it'). Its deltas are surgical and do exactly what the foundation asked for: revoke anon on submit_lead, strip the column-level update on api.leads, add a staff schema.; Authorization from a table (core.staff) + aal2 in RLS, no custom claims: revocation is immediate, no hook SPOF, no stale-JWT window.; Zero browser DML on PII: every crm/core write is a named security-definer RPC with assert_staff/assert_admin_fresh, validation, kill-switch check, audit row, SQLSTATE PT4xx mapped to HTTP; ops.idempotency_keys stores the response (true idempotency).; חולשות: Wrong Supabase plan fact: Password Verification Attempt and MFA Verification Attempt hooks are Teams/Enterprise features, not Pro. On the $25 Pro plan budgeted, the lockout logic in 4.4 cannot be enabled (Before User Created and Custom Access Token are available on Pro). Either price Teams or fall back to built-in auth rate limits; the design does neither.; Internal contradiction: claims 'no write RPC is exposed to anon' yet the pgTAP anon allowlist grants anon execute on chat_start/chat_append (and portal_submit writes). Anonymous DB writes exist, protected only by an IP-keyed DB rate limit.; IP-keyed DB rate limits (lead_ip 8/10min, portal_ip 20/10min, chat 60/h) depend on private.client_ip() parsing request.headers x-forwarded-for; if the function takes the first hop, a client can prepend fake addresses and bypass every DB-side limit. Not specified.; לקחת: edge_cron_secret distinct from the DB key + ops.call_function wrapper so cron.job.command holds no URL/secret; pgTAP asserting it.; audit.access_log for PII reads (who/what/which customer ids/row count/request_id) with 25-month retention, plus the incident runbook (reg. 11 reporting, DPO check, sub-processor list, data-map document).; The policy-lint pgTAP file: no USING(true) in private schemas, every definer pins search_path, anon RPC allowlist via set_eq, every exposed view security_invoker, no TRUNCATE/REFERENCES/TRIGGER grants to API roles.
  - עיצוב 1: סה"כ 42; חוזקות: Simplest operable shape of the three: one unauthenticated function, one hook, pgmq, 4 cron jobs, views named after the old tables so the agent app cuts over with a config change; expand/contract removes deploy ordering entirely.; pgTAP invariant 'public holds zero tables' + 'anon/authenticated have no grants on ops/pgmq/vault' structurally kills the Tokyo ALL-privileges defect and is one assertion to maintain.; Portal fixed correctly: token_hash only, expiry, last-4 server side, 10 attempts/hour per token, client_access_links dropped, recommendation_summaries.link_token replaced by hash.; חולשות: Authorization lives in JWT claims via the Custom Access Token hook with jwt_expiry 3600: disabling an agent in ops.principals takes effect only at the next refresh, so a compromised or terminated account keeps RLS access for up to 60 minutes. RLS cannot revoke sooner. The hook is also a login-wide single point of failure (acknowledged, not mitigated).; Direct DML grants to `authenticated` on every PII table (`grant select, insert, update, delete on crm.customers to authenticated`) through 1:1 views: a stolen aal2 session can bulk-update or (as manager) bulk-delete an agency's customers via PostgREST, and direct writes bypass ops.audit_log, which is only written from RPC/edge. No change audit for the most sensitive tables.; Read-access logging is delegated to pgaudit, whose output goes to Postgres logs retained 7 days on Pro (log drains need Team plan): fails the 24-month audit retention of reg. 10 of the data security regulations. `auth.audit_log_entries` is likewise internal, unretained and not a compliance record.; לקחת: pgTAP invariant: `public` holds zero tables; anon/authenticated have no grants on ops/pgmq/vault.; Preview strategy without Supabase branching: prod public views read-only, writes blocked by Origin allowlist, no auth redirect to *.vercel.app, forms in 'preview, not sent' mode.; Health signal = ops.job_runs.finished_at (never cron.job_run_details) → v_ops_health (6 numbers, no PII) → /api/health → the existing site-watch GitHub issue.
  - עיצוב 2: סה"כ 34; חוזקות: Default privileges revoked at schema level (tables, sequences, functions) so the Tokyo ALL-privileges defect cannot recur in `public`; four policy templates only, using(true) restricted to a pgTAP-tested allowlist.; Single aal2 choke point: current_platform_role() returns null without aal2, so every staff RPC and policy enforces TOTP; super_admin step-up (900s) exists; role from table → immediate revocation; no auth hooks at all.; Lead intake atomic with notification: trigger on event_log enqueues to pgmq in the same transaction; no public mail endpoint; Resend Idempotency-Key = eventId; message carries ids only, PII loaded at send time.; חולשות: Over-engineering for a two-agent site with 2 leads: identity_links, field_ownership, trust tiers, 3 pgmq queue pairs, 11 cron jobs (notify-worker every 30s, metrics fold every minute, workbench flags every 5 min, queue watchdog), destinations for Salesforce/Surense that do not exist. Not boring to operate and burns Micro Disk IO for nothing.; Lead fields seeded with owner_system='salesforce' for an agency with no Salesforce; any form field missing from field_ownership is dropped silently by save_lead (reject_unknown_field). Silent PII loss on every form change, mitigated only by a CI check the design itself had to invent.; Single exposed `public` schema holds the entire platform and all PII tables with zero grants: one future `grant select on all tables in schema public` or a policy with the wrong role exposes everything. The claim 'a schema is not a security boundary' is wrong in practice: denying `usage` on a schema is exactly the defense in depth Design 0 proves with has_schema_privilege.; לקחת: cron_http_audit() scanning net._http_response for status>=400/timeouts + heartbeat table with thresholds surfaced in /api/health and site-watch.; Notification enqueue via a trigger on the event/audit row in the same transaction (nothing to forget to enqueue).; current_platform_role() returning null without aal2 as the single choke point for staff RPC and RLS.
