# צעדי הבעלים

מעודכן: 19.11.2026. כאן מופיעים **רק** הצעדים שהבעלים עושה בעצמו, לפי סדר ולפי מסוף. [בוצע] = כבר נעשה ונבדק.
ערכי סודות לא נכתבים בשום מקום: לא בצ'אט, לא ב-git ולא במסמך. כאן מופיעים שמות בלבד.
הסדר הכללי: שלב 1 (Supabase) ← שלב 2 (Cloudflare, Resend) ← שלב 3 (GitHub) ← שלב 4 (הדלקת cron) ← שלב 5 (זהות) ← שלב 6 (החלטות) ← שלב 7 (Vercel, ב-cutover) ← שלב 8 (טוקיו, אחרי המעבר).

---

## 1. Supabase, פרויקט seeld-site (`qxhpolktdfgcbxtfxgov`)

### 1.1 הגדרות שכבר בוצעו
- [בוצע] Settings → API: Exposed schemas = `api`, `staff`; Max rows = 200; Extra search path = `extensions`.
- [בוצע] Authentication → Hooks → Before User Created = `private.hook_before_user_created`.
- [בוצע] Authentication: הרשמה כבויה, ספק אימייל פעיל, מדיניות סיסמה, TOTP, Site URL ו-Redirect URLs.
- [בוצע] `ops.alert_recipients`: שורה פעילה אחת (תיבת הצוות הכללית).
- [בוצע] Vault: `project_url`, `edge_cron_secret`, `pii_enc_key`, `national_id_hmac_key` קיימים.

בדיקה: SQL Editor, `select name from vault.secrets order by name;` מציג את השמות (בלי ערכים).

### 1.2 מפתח API ייעודי לפונקציות
- **איפה:** Settings → API Keys → Secret keys → Create new secret key.
- **מה:** מפתח `sb_secret_*` בשם `automations`.
- **למה:** הפונקציות מדברות עם המסד במפתח נפרד שאפשר לסובב בלי לגעת בשאר.
- **בדיקה:** המפתח מופיע ברשימה בשם `automations`.

### 1.3 Edge Function secrets
- **איפה:** Edge Functions → Secrets → Add new secret.
- **מה (שמות בלבד):**

| שם | ערך | למה |
|---|---|---|
| `SEELD_SECRET_KEY` | המפתח מ-1.2 | גישת הפונקציות למסד; בלעדיו `staff-invite` מחזירה 503 |
| `EDGE_CRON_SECRET` | הערך של Vault `edge_cron_secret` | אימות קריאות ה-cron |
| `TURNSTILE_SECRET_KEY` | מהווידג'ט ב-2.1 | בלעדיו כל ליד מקבל 503 |
| `RESEND_API_KEY` | מחשבון Resend | שליחת מיילים לצוות ולהתראות |
| `GOOGLE_AI_API_KEY` | אותו מפתח Gemini שבטוקיו, מוזן מחדש | הצ'אט |
| `ALLOWED_ORIGINS` | `https://seeld.co.il,https://www.seeld.co.il` | רק האתר יכול לשלוח טפסים |
| `ENV` | `production` | מצב ייצור מפורש |
| `NOTIFY_FROM` | כתובת שולח מדומיין מאומת ב-Resend (ברירת מחדל `no-reply@seeld.co.il`) | שולח המיילים |
| `NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL` | תיבות המחלקות (אם רוצים לשנות מברירת המחדל) | ניתוב לידים |

- **אסור:** `SEELD_ENV` בפרויקט הזה (מדליק מצב שבו קישורי הזמנה חוזרים לאדמין).
- **העתקת `EDGE_CRON_SECRET`:** ב-SQL Editor `select decrypted_secret from vault.decrypted_secrets where name = 'edge_cron_secret';`, להעתיק ישר לשדה הסוד, ולסגור את התוצאה. לא להדביק בשום מקום אחר.
- **בדיקה:** `curl -H "x-cron-secret: <הערך>" https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health` מחזיר `edge` עם רשימת השמות המוגדרים.

### 1.4 נאמנות מפתחות ההצפנה
- **איפה:** Vault (Integrations → Vault) או SQL Editor.
- **מה:** לשמור offline (למשל בכספת או בהתקן מוצפן) את הערכים של `pii_enc_key` ו-`national_id_hmac_key`. את `customers_transport_key` **לא** שומרים.
- **למה:** בלעדיהם אי אפשר לפענח את רשומות הלקוחות אחרי שחזור.
- **בדיקה:** שני עותקים במקומות נפרדים, שנבדקו כקריאים.

### 1.5 SMTP של Auth דרך Resend
- **איפה:** Authentication → Emails → SMTP Settings.
- **מה:** host `smtp.resend.com`, port 465, user `resend`, סיסמה = מפתח Resend, שולח `no-reply@seeld.co.il`, שם `SEELD`. Rate limit לאימייל: 10 לשעה.
- **למה:** מיילי הזמנה ושחזור סיסמה של הצוות.
- **בדיקה:** Invite user לכתובת בדיקה מגיע (רק אחרי שיש הזמנה פתוחה; ראו 5.1).

### 1.6 CAPTCHA של Auth
- **איפה:** Authentication → Attack Protection → Enable CAPTCHA protection → Turnstile.
- **מה:** הסוד של אותו ווידג'ט מ-2.1.
- **למה:** הגנה על מסך הכניסה של הצוות.
- **בדיקה:** `GET /auth/v1/settings` עדיין מראה הרשמה כבויה; כניסה בלי `captchaToken` נדחית.

### 1.7 חיבורי מסד ל-Auth
- **איפה:** Database → Settings → Auth DB connections (או Connection pooling).
- **מה:** מעבר מערך קבוע לאחוזים.
- **בדיקה:** ההגדרה מציגה אחוז.

### 1.8 אינטגרציית GitHub של Supabase
- **איפה:** Settings → Integrations → GitHub.
- **מה:** אם מופעלת, לכבות פריסה אוטומטית לייצור.
- **למה:** מיגרציות לייצור עוברות רק דרך `migrate.yml`.
- **בדיקה:** אין "Deploy to production" פעיל.

### 1.9 תפקיד הגיבוי `content_dump`
- **איפה:** SQL Editor.
- **מה:** `alter role content_dump with login password '<SCRAM verifier מחושב מראש>';`, ואז מחרוזת החיבור נשמרת כ-`CONTENT_DUMP_DB_URL` ב-GitHub Environment `backup` (3.1).
- **למה:** הגיבוי השבועי קורא רק את סכמת `content`.
- **בדיקה:** ריצה ידנית של `content-dump.yml` מצליחה.

### 1.10 מחבר שורנס (V3-01, אחרי שהמיגרציה `20261120200000` הוחלה והפונקציות נפרסו)
כל המתגים כבויים בברירת המחדל. סדר ההדלקה:
1. **סודות (Edge Functions → Secrets, שמות בלבד):** `SURENSE_CLIENT_ID`, `SURENSE_CLIENT_SECRET` (מהמפתח במסך API/Webhooks בשורנס), `SURENSE_WEBHOOK_SECRET` (סוד ה-`whsec_` של נקודת הקצה ב-Svix, שלב 4). לעולם לא בריפו, ב-Vercel או בצ'אט.
2. **Vault:** `pii_enc_key` ו-`national_id_hmac_key` קיימים (כבר נוצרו לייבוא הלקוחות). בלעדיהם כל שמירה נכשלת ב-`55000 vault_secret_missing`.
3. **מאגר `client-docs`:** Storage → Buckets: קיים ופרטי (המיגרציה יוצרת אותו כשאפשר; אם לא, ליצור ידנית, Private, בלי policies).
4. **קריאה בלבד:** `staff.admin_config_set('surense_enabled', 'true')` (אדמין טרי), ואז `POST /functions/v1/surense-sync` עם `{"action":"health"}` מחזיר מזהי משתמש, בעלי רישיון, חשבון מסלקה וסוגי מסמכים.
5. **Webhooks:** בפורטל Svix (כפתור "ממשק ניהול Webhooks" בשורנס) נקודת קצה `https://<project-ref>.supabase.co/functions/v1/surense-webhook` (ה-ref בכותרת סעיף 1) עם כל האירועים; להעתיק את סוד החתימה לשלב 1; ואז `staff.admin_config_set('surense_webhook_enabled', 'true')`. בדיקה: "Send example" בפורטל, ואז `select event_type, received_at from ops.surense_events order by id desc limit 3;`.
6. **עיבוד התור:** בינתיים ידני: `curl -X POST -H "x-cron-secret: <הערך>" .../functions/v1/surense-worker`. תזמון `pg_cron` כל דקה דורש אישור (החלטה 6.18).
7. **כתיבה לשורנס** (הזמנת ייפוי כוח): רק אחרי בדיקה על לקוח בדיקה: `staff.admin_config_set('surense_write_enabled', 'true')`.
8. **שליחת E9100** (בקשה לגוף מוסדי דרך המסלקה): החלטה נפרדת, אחרי שלב 7 ובדיקה על לקוח בדיקה: `staff.admin_config_set('surense_e9100_enabled', 'true')`. שליחה דורשת את שני המתגים; כיבוי `surense_e9100_enabled` עוצר רק את E9100.
- **תגובה לכתיבה עמומה:** 409 עם `ambiguous_check_surense` פירושו שלא ידוע אם הפעולה בוצעה. לבדוק בשורנס לפני ניסיון חוזר (RUNBOOK, מחבר שורנס).
- **עצירה:** `update ops.config set value = 'false', updated_at = now() where key like 'surense%';`

---

## 2. Cloudflare ו-Resend

### 2.1 ווידג'ט Turnstile
- **איפה:** Cloudflare → Turnstile → Add widget.
- **מה:** דומיינים `seeld.co.il` ו-`www.seeld.co.il`, מצב Managed.
- **למה:** בדיקת אנוש בטפסים ובכניסה.
- **בדיקה:** יש Site Key (ציבורי, ל-Vercel) ו-Secret Key (ל-Supabase, 1.3 ו-1.6).

### 2.2 דומיין שולח ב-Resend
- **איפה:** Resend → Domains.
- **מה:** `seeld.co.il` מאומת (SPF, DKIM). מפתח API חדש ל-seeld-site.
- **בדיקה:** הדומיין במצב Verified.

---

## 3. GitHub, ריפו `shmulik-marziano/seeld`

### 3.1 Environments
- **איפה:** Settings → Environments → New environment.
- **מה:**
  - `production`: Deployment branches = `main` בלבד; Required reviewer = הבעלים; secret `SUPABASE_DB_URL`.
  - `backup`: Deployment branches = `main` בלבד; secret `CONTENT_DUMP_DB_URL`.
- **למה:** כתובת מסד מאפשרת לפענח נתוני לקוחות, ולכן היא לא נשמרת כ-repository secret.
- **בדיקה:** אין `SUPABASE_DB_URL` ואין `SUPABASE_ACCESS_TOKEN` ב-Settings → Secrets → Actions ברמת הריפו.

### 3.2 משתנים (Variables)
- **איפה:** Settings → Secrets and variables → Actions → Variables.
- **מה:**
  - `PROD_MIGRATORS` = מערך JSON של שמות משתמש ב-GitHub שמורשים להחיל מיגרציות.
  - `SMOKE_SUPABASE_PUBLISHABLE_KEY` = המפתח הציבורי `sb_publishable_*` של seeld-site.
  - `BACKUP_AGE_RECIPIENT` = מפתח age ציבורי (`age1...`). המפתח הפרטי נשאר offline.
  - אופציונלי: `SMOKE_CHECK_HEALTH=1`.
  - ב-cutover בלבד: `HEALTH_URL`, ואחריו `CUTOVER_DONE=1` (ראו 7).
- **בדיקה:** Actions → Preview smoke לא נכשל על "SMOKE_SUPABASE_PUBLISHABLE_KEY is not set".

### 3.3 Repository secret
- **מה:** `VERCEL_AUTOMATION_BYPASS_SECRET` בלבד (מ-Vercel → Settings → Deployment Protection → Protection Bypass for Automation).
- **למה:** `preview-smoke` עובר את הגנת הפריסה של Vercel.
- **בדיקה:** ריצת Preview smoke מגיעה לשלב הבדיקות.

### 3.4 הגנת ענף
- **איפה:** Settings → Branches → Add rule ל-`main`.
- **מה:** Require status checks: `ci-ok` בלבד.
- **בדיקה:** PR עם CI אדום לא ניתן למיזוג.

### 3.5 בדיקת `migrate.yml`
- **מה:** Actions → Migrate production database → Run workflow מ-`main`, עם `confirm=qxhpolktdfgcbxtfxgov` ו-`dry_run=true`.
- **בדיקה:** הריצה מדפיסה "אין מיגרציות ממתינות" ונעצרת.

---

## 4. הדלקת ה-cron (אחרי 1.3)

- **איפה:** SQL Editor.
- **מה:**
  ```sql
  update ops.config set value = 'true', updated_at = now() where key = 'edge_cron_enabled';
  ```
- **למה:** מתחיל את מסירת המיילים ואת סנכרון הנתונים.
- **בדיקה (תוך 2 דקות):**
  ```sql
  select job, ok, finished_at, error from ops.job_runs order by id desc limit 5;
  select status, count(*) from ops.outbox group by status;
  ```
  `notify-worker` עם `ok=true`; ה-outbox מתרוקן; תוך 30 דק' `api.health()` מחזיר `degraded=false`.
- אופציונלי: `select ops.call_function('fetch-cma-data');` לסנכרון ראשון.

---

## 5. זהות

### 5.1 אדמין ראשון
- **מה:** `RUNBOOK.md` סעיף ג.1 (`scripts/identity/bootstrap-first-admin.sql`, Invite user, `api.staff_provision`, TOTP עם `scripts/identity/verify-identity.mjs --enroll`).
- **בדיקה:** `staff.admin_assert_fresh` עובר אחרי כניסה עם TOTP.

### 5.2 יום 3, על ענף
- כניסה כושלת אמיתית אחת, ואז `select payload->>'action' from auth.audit_log_entries order by created_at desc limit 5;`, רישום שם הפעולה ב-`auth_failure_actions`, ורק אז החלטה על `auth_lock_enabled=true`.
- תרגיל: השבתה ואז refresh נכשל; הפעלה ואז כניסה מצליחה; break-glass על אדמין בדיקה (`scripts/identity/break-glass.sql`), כולל Unban.

---

## 6. החלטות

| # | החלטה | המלצה | מה עושים אחרי ההחלטה |
|---|---|---|---|
| 6.1 | מחיקת 13 קבצי PDage (`src/pages/pdage/*`, `src/components/pdage/*`, `src/hooks/usePdageChat.ts`) ובלוקי `pdage_*` ב-`src/integrations/supabase/types.ts` | [אושר בעיקרון 18.11] ממתין לאישור פרטני של הרשימה | סוכן מוחק ב-PR שמציג את הרשימה |
| 6.2 | הסרת `api/geo.ts` | להסיר (לא בשימוש ב-v2) | סוכן מסיר ב-PR |
| 6.3 | תיבת סכמה מפורשת בכל טופס | להוסיף | סוכן מוסיף לטפסים |
| 6.4 | אישור 1,040 מסלולים פעילים במקום 571 | לאשר | תנאי ל-cutover |
| 6.5 | 13 מפתחות פרטי לקוח: טבלת האישור ב-`DATA-MIGRATION.md` סעיף 2ב | לעבור מפתח אחר מפתח | מפתח שנדחה: `select private.customers_details_drop_keys(array['<key>']);` ב-SQL Editor |
| 6.6 | מחיקת הסוד המת `customers_transport_key` מ-Vault | למחוק | הבעלים מוחק ב-Vault |
| 6.7 | **אירוע הפרטיות:** אישור שקראת את `DATA-MIGRATION.md` סעיף 2א, והחלטה כמה זמן לשמור את תמליל סשן ההעתקה מ-18.11.2026 או אם למחוק אותו | למחוק את התמליל אחרי האישור | רק הבעלים מוחק את התמליל |
| 6.8 | `page_views` (3,359 שורות בטוקיו) | לא להעביר | אין פעולה |
| 6.9 | הפעלת 4 חברות הנסיעות (`api.travel_companies`) | להשאיר כבוי עד שדף הנסיעות יקרא מהטבלה | `update content.travel_companies set active = true where ...` |
| 6.10 | פרטי ליד במייל לצוות: `api.lead_notify_details` + `NOTIFY_INCLUDE_PII=true`, או קישור בלבד עד אפליקציית הסוכנים | להחליט לפני ה-cutover; בלי זה המייל מכיל רק סוג וקישור | סוכן כותב מיגרציה; הבעלים מגדיר את הסוד |
| 6.11 | מייל אישור לליד עצמו | לבחור | סוכן מוסיף ב-`notify-worker` |
| 6.12 | גיבוי פרטי של טבלאות הסוכנות בטוקיו לפני מחיקתו | לקחת גיבוי מוצפן | `RUNBOOK.md` סעיף ו.2 |
| 6.13 | `deploy-vercel.yml`: להסיר את קלט הטוקן ולהשתמש רק ב-`secrets.VERCEL_TOKEN` | לאשר | סוכן משנה |
| 6.14 | `api-v1` ו-`queue-worker`: להשאיר או להעביר ל-`supabase/_parked` | להעביר | סוכן ב-PR |
| 6.15 | הזזת `supabase/tests/local_bootstrap.sql` | לאשר | סוכן ב-PR |
| 6.16 | הריפו `seeld` ציבורי: להפוך לפרטי? | לשקול | הבעלים ב-GitHub |
| 6.17 | איש קשר וטלפון לתקלות דחופות | למלא | נכנס ל-`RUNBOOK.md` |
| 6.18 | תזמון `surense-worker` כל דקה ב-`pg_cron` | **בוצע 22.11.2026** (מיגרציה `20261122180000`, `surense-worker-tick`; הוראת הבעלים: התהליך צריך לעבוד מקצה לקצה) | פועל רק בעוד `edge_cron_enabled` ו-`surense_enabled` דלוקים |
| 6.19 | מארחי הורדה/העלאה של שורנס (קישורים חתומים לקובצי E9100, מסמכים וייבוא; כנראה S3, לא `api.surense.com`) | לאשר רק את המארח המדויק שמופיע בתשובה הראשונה | סוכן מוסיף ל-`ALLOWED_HOSTS` ב-`_shared/surense/client.ts`; עד אז ההורדה נרשמת `download_host_not_allowed` |
| 6.20 | חלונות שמירה: אירועי שורנס 90 יום, עבודות 30/90 יום; במראה `crm.surense_*` (מתג `surense_retention_enabled`, כבוי): רשומה שנמחקה בשורנס נמחקת אחרי 30 יום, ו-3 תמונות תיק אחרונות לכל לקוח | לאשר או לקבוע אחרת, ואז להדליק את המתג | סוכן משנה את `ops.cleanup` |
| 6.21 | שמות סטטוס/סיווג/מקור של שורנס כעמודות גלויות (`status_name`, `class_name`, `source_name`) | לבדוק שאין בהם שמות של אנשים (למשל "הפניה מ...") | אם יש: סוכן מעביר אותם ל-`details_enc` |
| 6.22 | נפטר, קטין ורגיש נשמרים רק מוצפנים ב-`details_enc`, לא כעמודות לסינון | לאשר; אם צריך סינון לפיהם, להחליט במפורש | סוכן מוסיף עמודה רק אחרי החלטה |
| 6.23 | **שאלונים ומסמכים ללקוח** (`/forms`, `docs/product/CLIENT-FORMS.md`): (א) הדלקה: `VITE_FORMS_FLOW=on` בוורסל + `forms_enabled`; (ב) האם לשמור את תשובות שאלון הבריאות בשרת (`forms_health_enabled`; סגור = רק תוצאת הסינון); (ג) חלון שמירה לסשנים (14 יום תוקף) ולשאלונים שלא נשלחו; (ד) רינדור PDF בשרת | (א) אחרי הרצת בדיקה; (ב) להשאיר סגור עד ייעוץ משפטי קצר; (ג) לקבוע; (ד) צעד המשך | (א) קלוד מדליק; (ב)(ג) סוכן משנה אחרי ההחלטה; הקוד לא מוחק דבר |

---

## 7. Vercel, פרויקט `seeld`

### 7.1 לפני ה-cutover
- **Git fork protection:** Settings → Git → להשאיר פעיל (פריסה מ-fork דורשת אישור).
- **Deployment Protection:** Standard, ו-Protection Bypass for Automation (הסוד ל-3.3).
- **Deployment retention:** פריסות ייצור נשמרות 90 יום.
- **Skew Protection:** Settings → Advanced, אחרי שהאתר שולח `?dpl=` בכתובות הנכסים (פריט פתוח של הסוכנים).
- **בדיקה:** Preview smoke רץ ונכנס לאתר המוגן.

### 7.2 ב-cutover (לפי `CUTOVER-CHECKLIST.md` סעיף 6)
- **איפה:** Settings → Environment Variables → Production.
- **מה:** `VITE_SEELD_BACKEND=v2`, `VITE_SUPABASE_URL=https://qxhpolktdfgcbxtfxgov.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`; להסיר את `VITE_SUPABASE_ANON_KEY` של טוקיו. לפני כן לרשום את הערכים הישנים במקום פרטי (ל-rollback).
- **במקביל:** ה-PR שמסיר את שני מקורות טוקיו מ-`vercel.json` ממוזג באותו חלון.
- **אחר כך ב-GitHub:** `HEALTH_URL=https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health`, ואחרי האימות `CUTOVER_DONE=1`.
- **בדיקה:** `RUNBOOK.md` סעיף ה.3.

---

## 8. טוקיו (`lvifatyksqizwcutfbqp`), רק אחרי ה-cutover

1. 14 יום של יציבות אחרי ה-cutover.
2. גיבוי פרטי מוצפן לפי ההחלטה ב-6.12 (`RUNBOOK.md` סעיף ו.2), ובדיקה שהקובץ נפתח.
3. Settings → General → Pause project.
4. עוד 7 ימים.
5. רק אז, אם הוחלט: Delete project. בלתי הפיך.
