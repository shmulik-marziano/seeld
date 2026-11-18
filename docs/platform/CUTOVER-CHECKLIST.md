# רשימת סימון: מעבר האתר לפרויקט seeld-site

מעודכן: 19.11.2026. הסדר וההסברים: `docs/platform/RUNBOOK.md` סעיף ה. פעולות הבעלים: `docs/platform/OWNER-STEPS.md`.
מסמנים פריט רק אחרי שנבדק בפועל. פריט שסומן כבר מופיע עם [x].

## 1. תנאים מוקדמים: החלטות

- [ ] הבעלים אישר שדף המסלולים יציג 1,040 מסלולים פעילים במקום 571.
- [ ] הבעלים החליט על תיבת סכמה בטפסים (כל טופס, או רק טופס הפרישה כמו היום).
- [ ] הבעלים החליט על תוכן מייל הליד לצוות: קישור בלבד, או `api.lead_notify_details` עם `NOTIFY_INCLUDE_PII=true`.
- [ ] הבעלים החליט אם לידים מקבלים מייל אישור.
- [ ] הבעלים אישר שקרא את גילוי אירוע הפרטיות (`DATA-MIGRATION.md` סעיף 2א). לא חוסם טכנית, אבל נסגר לפני ה-cutover.

## 2. סודות קיימים (שמות בלבד)

Supabase seeld-site, Edge Functions → Secrets:
- [ ] `SEELD_SECRET_KEY` (מפתח `sb_secret_*` בשם `automations`)
- [ ] `EDGE_CRON_SECRET` (זהה לערך ב-Vault `edge_cron_secret`)
- [ ] `TURNSTILE_SECRET_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `GOOGLE_AI_API_KEY`
- [ ] `ALLOWED_ORIGINS` (`https://seeld.co.il`, `https://www.seeld.co.il`)
- [ ] `ENV=production`
- [ ] `NOTIFY_FROM` ו-`NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL` (או שמקבלים את ברירות המחדל)
- [ ] אין `SEELD_ENV` בפרויקט הזה

Supabase seeld-site, Vault:
- [x] `project_url`
- [x] `edge_cron_secret`
- [x] `pii_enc_key`, `national_id_hmac_key`
- [ ] עותקי נאמנות offline של `pii_enc_key` ו-`national_id_hmac_key`

Vercel, Production (מוכנים לשלב 6, עוד לא מופעלים):
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` של seeld-site בהישג יד
- [ ] `VITE_TURNSTILE_SITE_KEY`

GitHub:
- [ ] `vars.SMOKE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `secrets.VERCEL_AUTOMATION_BYPASS_SECRET`
- [ ] Environment `production` עם `SUPABASE_DB_URL`, ו-`vars.PROD_MIGRATORS`

## 3. backend פועל

- [x] Data API: רק `api` ו-`staff`, `max_rows=200`, `extra_search_path=extensions`
- [x] Hook `private.hook_before_user_created` פעיל; הרשמה כבויה; TOTP; Site URL ו-Redirect URLs
- [x] `ops.alert_recipients` עם נמען פעיל אחד לפחות
- [x] פונקציות פרוסות: `lead-intake`, `notify-worker`, `chat-bot`, `health`, `fetch-cma-data`, `staff-invite`
- [ ] SMTP של Resend ב-Auth, ודומיין השולח מאומת ב-Resend
- [ ] CAPTCHA של Auth = Turnstile
- [ ] `edge_cron_enabled=true`
- [ ] `ops.job_runs` מראה `notify-worker` עם `ok=true` ו-`finished_at`
- [ ] `select status, count(*) from ops.outbox group by status;` בלי `pending` ישנים ובלי `dead`
- [ ] `api.health` מחזיר `degraded=false`
- [ ] `GET /functions/v1/health` עם `x-cron-secret` מראה שכל שמות הסודות מסעיף 2 מוגדרים
- [ ] ריצה ידנית אחת של `fetch-cma-data` הסתיימה ב-`ok=true`

## 4. שערים ירוקים

- [x] `ci-ok` ירוק על `main`
- [ ] הגנת ענף על `main` דורשת `ci-ok`
- [ ] PR ה-cutover: `ci-ok` ירוק (כולל `scripts/ci/check-csp-bundle.mjs`)
- [ ] `preview-smoke` ירוק על Preview של PR ה-cutover:
  - [ ] אורך `/api/funds` = `totalFunds` של `/api/fund-status` (1,442)
  - [ ] אף רשימה לא עוצרת בדיוק על 200 או 1,000
  - [ ] `/api/tracks` ו-`/api/board` מחזירים יותר מ-200 שורות
  - [ ] ה-CSP תואם לפרויקטים שהבאנדל קורא אליהם
- [ ] Preview במצב legacy: `/api/board`, `/api/funds`, `/api/tracks`, `/api/company-map`, `/api/fund-status` עונים 200 עם נתונים

## 5. חזרות (dry runs)

- [ ] בדיקות זהות יום 3 על ענף (`IDENTITY.md` §7): הזמנה, שליחה חוזרת, השבתה ואז refresh נכשל, הפעלה ואז כניסה, break-glass, הזמנת `client` נדחית
- [ ] תרגיל kill switch: `intake_enabled=false` מחזיר 423 בטופס, והחזרה ל-`true`
- [ ] ליד בדיקה על Preview v2 (עם `ALLOWED_ORIGINS` שכולל את ה-Preview): לחיצה כפולה = ליד אחד; מייל הגיע לתיבה הנכונה
- [ ] `migrate.yml` עם `dry_run=true` עבר
- [ ] תרגיל Instant Rollback ב-Vercel הושלם בפחות מ-5 דקות
- [ ] הערכים הנוכחיים של `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` (טוקיו) נרשמו במקום פרטי של הבעלים, לצורך rollback

## 6. המעבר

- [ ] PR אחד מסיר מ-`vercel.json` את `https://lvifatyksqizwcutfbqp.supabase.co` ואת `wss://lvifatyksqizwcutfbqp.supabase.co`
- [ ] Vercel Production: `VITE_SEELD_BACKEND=v2`
- [ ] Vercel Production: `VITE_SUPABASE_URL=https://qxhpolktdfgcbxtfxgov.supabase.co`
- [ ] Vercel Production: `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Vercel Production: `VITE_TURNSTILE_SITE_KEY`
- [ ] Vercel Production: `VITE_SUPABASE_ANON_KEY` של טוקיו הוסר
- [ ] אין משתנה סודי ב-Vercel
- [ ] ה-PR מוזג ל-`main`, והפריסה לייצור הסתיימה ב-Ready
- [ ] `migrate.yml` (רק אם יש מיגרציה חדשה)

## 7. אימות אחרי המעבר

- [ ] `npm run health -- https://seeld.co.il` ירוק
- [ ] `npm run smoke -- https://seeld.co.il` ירוק
- [ ] אין בקשה ל-`lvifatyksqizwcutfbqp` ואין ל-`ipapi.co` בדפדפן
- [ ] ליד בדיקה מ-`/contact` (כולל לחיצה כפולה): ליד אחד ב-`staff.leads_list`, שורת outbox ב-`sent`, מייל הגיע
- [ ] טופס ביטוח וטופס פנסיה: `{ok:true}`, מייל לתיבה הנכונה
- [ ] הצ'אט: פאנל הקשר מוצג (או תשובה, אם חובר ל-`chat-bot`)
- [ ] `/api/board` = 1,257 שורות
- [ ] `/api/tracks` = 1,040 מסלולים, ו-`/investment-tracks` מציג "נכון לספטמבר 2026"
- [ ] `/api/funds` = 1,442
- [ ] `/blog` = 22 מאמרים
- [ ] `api.health`: `degraded=false`
- [ ] GitHub: `vars.HEALTH_URL=https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health`
- [ ] GitHub: `vars.CUTOVER_DONE=1`
- [ ] ניטור צמוד 60 דקות
- [ ] `site-watch` ירוק 24 שעות

## 8. מתי עושים rollback

מבצעים את `RUNBOOK.md` סעיף ה.4 מיד, אם בחלון של 24 השעות מתקיים אחד מאלה:
- [ ] טפסים לא נשלחים (403, 503 או ניתוק) יותר מ-15 דקות, ואין תיקון ברור של סוד או של `ALLOWED_ORIGINS`.
- [ ] דף ראשי (בית, צור קשר, לוח תשואות, מסלולים, בלוג) לא נטען, או מחזיר נתונים חסרים או קטועים.
- [ ] בקשה נחסמת ב-CSP ושוברת דף.
- [ ] `degraded=true` שלא נפתר תוך 30 דקות.
- [ ] חשד לחשיפת מידע או לגישה לא מורשית (במקביל: הודעה מיידית לבעלים).

אחרי rollback: להחזיר את משתני טוקיו ב-Vercel, revert ל-PR, למחוק `CUTOVER_DONE` אם הוגדר, ולבדוק `npm run health` ו-`npm run smoke`.
