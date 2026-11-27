# ספר הפעלה: פלטפורמת האתר (seeld-site)

מעודכן: 19.11.2026. המסמך הזה הוא המקור המחייב להפעלה, לתקלות, ל-cutover ול-rollback. הוא מחליף את ספר ההפעלה הקודם (17.11.2026), שהתייחס רק לפרויקט טוקיו.

מסמכים נלווים:
- `docs/platform/CUTOVER-CHECKLIST.md`: רשימת סימון ל-cutover.
- `docs/platform/OWNER-STEPS.md`: רק מה שהבעלים עושה בעצמו, לפי סדר ולפי מסוף.
- חוזים מפורטים: `FOUNDATION.md` (גרסה 2.2), `IMPLEMENTATION-PLAN.md`, `EDGE-FUNCTIONS.md`, `IDENTITY.md`, `FRONTEND-BACKEND-V2.md`, `DATA-MIGRATION.md`.

כללים קבועים:
- אין מחיקה, הזזה או ריקון של קבצים, טבלאות, פרויקטים או סודות בלי אישור פרטני של הבעלים.
- ערכי סודות לא נכתבים בשום מקום: לא בצ'אט, לא ב-git, לא ב-issue ולא במסמך. במסמך הזה מופיעים שמות בלבד.
- הפרויקט `seeld-ops` מושעה לתמיד, ומידע פרטי של הסוכנות מחוץ לתחום הפלטפורמה.

---

## א. מפת המערכת בפועל

### פרויקטים

| רכיב | מזהה | מצב ב-19.11.2026 |
|---|---|---|
| Supabase החדש (פרנקפורט) | `seeld-site` / `qxhpolktdfgcbxtfxgov` | מוכן, עוד לא משרת את האתר. 29 מיגרציות הוחלו |
| Supabase הישן (טוקיו) | `lvifatyksqizwcutfbqp` | **משרת את האתר החי** דרך `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` ב-Vercel |
| Vercel | פרויקט `seeld` (`prj_SqYD41WfZ5j71QfZ15bcekKx0zGP`, צוות `team_dZ6Ivl6PBJEmz6Gf19sSjs1J`) | מחובר ל-`shmulik-marziano/seeld`. כל דחיפה ל-`main` נפרסת לייצור (`fra1`) |
| GitHub | `shmulik-marziano/seeld` (ציבורי) | `ci.yml` ירוק על `main` |

הקוד החדש של האתר רץ במצב v2 רק כשב-Vercel מוגדרים יחד `VITE_SEELD_BACKEND=v2`, `VITE_SUPABASE_URL` (פרנקפורט), `VITE_SUPABASE_PUBLISHABLE_KEY` ו-`VITE_TURNSTILE_SITE_KEY`. בלי זה הבאנדל במצב legacy ומדבר עם טוקיו.

### מיגרציות שהוחלו על seeld-site

- 8 מיגרציות יסוד: `20261118162452` עד `20261118162856`.
- 17 מיגרציות v2.2: `20261119090000` עד `20261119091600`.
- 4 מיגרציות נתונים (T4): `20261119095000_tracks_site_mapping`, `20261119095100_customers_sealed_import`, `20261119095200_t4_private_deny_policies`, `20261119095300_t4_fix_pass`.

מיגרציות חדשות מוחלות רק דרך `.github/workflows/migrate.yml` (ראו סעיף ב.9).

### Edge Functions ב-seeld-site

| פונקציה | גרסה | `verify_jwt` | מי קורא |
|---|---|---|---|
| `lead-intake` | 2 | false | טפסי האתר (דפדפן) |
| `notify-worker` | 2 | false | `pg_cron` דרך `ops.call_function`, כל דקה |
| `chat-bot` | 2 | false | הצ'אט באתר (עוד לא מחובר; ב-v2 מוצג פאנל קשר) |
| `health` | 2 | false | `site-watch` וכל אחד |
| `fetch-cma-data` | 1 | false | `pg_cron`, יום ראשון 03:00 UTC |
| `staff-invite` | 2 | true | אדמין עם TOTP (אפליקציית הסוכנים, שלב ב') |
| `surense-webhook` | לא נפרסה | false | שורנס דרך Svix (חתימה + מתג `surense_webhook_enabled`) |
| `surense-worker` | לא נפרסה | false | ידני עם סוד ה-cron; `pg_cron` רק אחרי אישור הבעלים |
| `surense-sync` | לא נפרסה | true | אדמין עם TOTP טרי (פעולות מול שורנס) |

הקוד הפרוס הוא באנדל esbuild שהועבר דרך MCP. אחרי שיהיה טוקן פריסה, פורסים מחדש מהמאגר (סעיף ז, פריט 2.3).

### משימות `pg_cron`

| שם | לוח (UTC) | פעולה |
|---|---|---|
| `notify-worker-tick` | כל דקה | `select ops.call_function('notify-worker')` |
| `cma-sync-weekly` | ראשון 03:00 | `select ops.call_function('fetch-cma-data')` |
| `ops-watchdog` | כל 10 דק' | `select ops.watchdog()` |
| `ops-cleanup` | כל שעה ב-:17 | `ops.cleanup()` לפי מדיניות השימור |
| `cma-freshness-monthly` | 12 בחודש 04:30 | `content.cma_check_freshness()` |
| `sms-health-hourly` | כל שעה ב-:41 | `select ops.call_function('sms-health')`: בדיקת יתרה ב-Micropay, בלי שליחה (`20261128120000`) |

כל עוד `ops.config` מכיל `edge_cron_enabled=false` (המצב היום), `ops.call_function` לא קוראת לשום פונקציה ולא רושמת `job_runs`. ה-watchdog וה-cleanup כן רצים.

### חשיפת API (Data API)

- סכמות חשופות: `api` ו-`staff` בלבד. `public` ו-`graphql_public` לא חשופות.
- `max_rows = 200`, `extra_search_path = extensions`.
- Auth: הרשמה כבויה, ספק אימייל פעיל, מדיניות סיסמה, TOTP, Site URL ו-Redirect URLs הוגדרו. ה-hook `private.hook_before_user_created` פעיל.

### שערי CI

| קובץ | מתי | מה |
|---|---|---|
| `.github/workflows/ci.yml` | כל PR ודחיפה | `verify`, `database`, `functions`, `supply-chain`, ואז `ci-ok` (הבדיקה היחידה שהגנת הענף צריכה לדרוש). רצים על `ubuntu-24.04` |
| `.github/workflows/preview-smoke.yml` | פריסת Preview הצליחה | כותרות, CSP מול הבאנדל, `/api/*` לא קטועים, הגדרות Auth. לא חובה, אות לבודק |
| `.github/workflows/site-watch.yml` | כל 30 דק' | בריאות האתר; עם `vars.HEALTH_URL` גם `degraded` |
| `.github/workflows/migrate.yml` | ידני בלבד | החלת מיגרציות לייצור (Environment `production`) |
| `.github/workflows/content-dump.yml` | ראשון 02:30 UTC | גיבוי מוצפן של `content` (Environment `backup`) |

סקריפטים: `scripts/ci/check-csp-bundle.mjs`, `scripts/ci/check-supabase-config.mjs`, `scripts/ci/check-secret-scope.mjs`, `scripts/ci/check-migration-history.mjs`, `scripts/ci/check-auth-settings.mjs`, `scripts/ci/preview-smoke.mjs`, `scripts/ci/audit-gate.mjs`, ובדיקה עצמית `scripts/ci/self-test.mjs`.

---

## ב. הפעלה יומית ותקלות

### ב.1 אבחון ראשוני (5 דקות)

1. אם נפתח issue בשם **site-watch failure**: לפתוח את ה-run ולקרוא את שורות `FAIL`.
2. בדיקה מקומית:
   ```
   npm run health -- https://seeld.co.il
   npm run smoke -- https://seeld.co.il
   ```
3. מצב ה-backend החדש (SQL Editor של seeld-site):
   ```sql
   select api.health();
   select job, ok, started_at, finished_at, error from ops.job_runs order by id desc limit 20;
   select id, at, severity, kind, status, summary from ops.alerts order by id desc limit 20;
   select status, count(*) from ops.outbox group by status;
   ```

| כשל | משמעות סבירה | פעולה |
|---|---|---|
| נתיב לא 200 | פריסה שבורה או rewrite | rollback ב-Vercel (ב.10) |
| אין `h1` בעמוד | ה-prerender נפל | לוג build, ואז rollback |
| `asset ... content-type` או HTML במקום JS | chunk ישן במטמון | purge (ב.11), ואז rollback אם נמשך |
| `degraded=true` ב-health | outbox תקוע, התראה ממתינה, או watchdog לא רץ | ב.3 |
| כשל חד-פעמי ואז תקין | תקלת רשת רגעית | סוגרים את ה-issue עם הערה |

### ב.2 `ops.job_runs`

זו טבלת האמת של כל ריצה מתוזמנת.
- `finished_at` ריק אחרי יותר מכמה דקות: הריצה לא הסתיימה (הפונקציה לא קראה ל-`api.job_finish`).
- `ok=false` עם `error`: הסיבה בקוד קצר בלבד. בצעדי ה-watchdog נרשם רק SQLSTATE, בלי טקסט (כדי לא לשאת ערכים).
- `stats` של `cma-refresh`: כולל `upserted`, `hidden`, ולפעמים `collisions`, `unmapped_companies`, `unmapped_funds`.
- `notify-worker` עם `error='resend_not_configured'`: חסר `RESEND_API_KEY`.
- `error='http_timeout'` או `http_<status>`: ה-watchdog סגר ריצה שעברה את התקציב שלה (`ops.job_budget`) והקריאה אליה נכשלה, כך שהפונקציה לא הגיעה אליה. הטיק הבא רץ מחדש. 5 כאלה בשעה מעלים `cron_http_timeouts` (`20261128120000`).
- ריצה שעברה את התקציב בלי כישלון HTTP מעלה `job_not_finished` פעם אחת ליממה לכל משימה, עם שם המשימה ומספר הריצות (`job_not_finished:<job>`). עד 27.11.2026 כל ריצה כזו התריעה כל שעה במשך יממה.

### ב.3 `api.health` ו-`degraded`

`GET https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health` מחזיר בדיוק `{ok, degraded, cma_age_bucket}`.

`degraded=true` כשמתקיים אחד מאלה:
- ה-outbox תקוע;
- יש שורת `dead` ב-24 השעות האחרונות;
- התראה ב-`pending` יותר מ-30 דק';
- אין ריצת watchdog שהסתיימה ב-30 הדקות האחרונות.

**מצב צפוי היום:** `degraded=true`. יש 3 התראות ו-3 שורות outbox במצב `pending`, כי `edge_cron_enabled=false` ואין מי שימסור אותן. זה ייפתר רק אחרי הדלקת `edge_cron_enabled` (ב.7). לכן `vars.HEALTH_URL` מוגדר רק אחרי ש-outbox התרוקן בהצלחה פעם ראשונה.

עם `x-cron-secret` תקין, התשובה כוללת גם `edge`: אילו **שמות** סודות מוגדרים, מקור המפתח, אזור ומזהה פריסה. זו הדרך לוודא שסוד הוגדר בלי לראות אותו.

### ב.4 התראות ומצבי outbox

מסלול: `ops.raise_alert` → `ops.outbox` → `notify-worker` → Resend → תיבת הנמענים ב-`ops.alert_recipients`.

| טבלה | מצב | משמעות |
|---|---|---|
| `ops.outbox` | `pending` | ממתין לשליחה (או לניסיון חוזר לפי `next_attempt_at`) |
| `ops.outbox` | `processing` | נלקח על ידי worker; נעול עד `locked_until` (2 דק') |
| `ops.outbox` | `sent` | נמסר ל-Resend |
| `ops.outbox` | `dead` | נכשל 5 פעמים (המתנות 1 דק', 5 דק', 30 דק', 2 ש'). `last_error` מראה את הסיבה. נוצרת התראת `outbox_dead` |
| `ops.alerts` | `pending` / `sent` / `resolved` | ממתינה / נשלחה / נסגרה ידנית |
| `ops.alerts` | `undeliverable` | שורת ה-outbox שלה מתה. מצב סופי. מפתח ה-dedupe משתחרר, ו-`degraded` כבה אחרי חלון 24 ש' |

נמענים נקבעים ברגע שה-worker לוקח את השורה (מיגרציה `091600`), לא ברגע יצירת ההתראה. רשימה ריקה גורמת ל-`no_recipients` ולניסיונות חוזרים, ובסוף `undeliverable`. היום יש נמען פעיל אחד (תיבת הצוות הכללית).

הוספת נמען:
```sql
insert into ops.alert_recipients (email) values ('<address>');
```

סגירת התראה ידנית: אדמין עם TOTP טרי קורא ל-`staff.admin_alert_resolve(<id>)` (נרשם ב-audit). חלופת SQL לבעלים:
```sql
update ops.alerts set status = 'resolved' where id = <id> and status = 'pending';
```

### ב.5 מתגי כיבוי (`ops.config`)

| מפתח | ברירת מחדל | כבוי פירושו |
|---|---|---|
| `intake_enabled` | `true` | `lead-intake` מחזירה 423 והאתר מציג "הטופס סגור זמנית" |
| `chat_enabled` | `true` | `chat-bot` מחזירה 503 "הצ'אט אינו זמין" |
| `edge_cron_enabled` | `false` | `pg_cron` לא קורא לשום פונקציה |
| `tracks_sync_enabled` | `true` | רענון המסלולים האוטומטי לא רץ |
| `auth_lock_enabled` | `false` | נעילה אוטומטית אחרי כשלונות כניסה כבויה (עד יום 3) |
| `lead_retention_enabled` | `false` | מחיקת לידים ישנים כבויה |
| `surense_enabled` | `false` | מחבר שורנס כבוי: `surense-sync` מחזירה 423, `surense-worker` לא לוקחת עבודות |
| `surense_write_enabled` | `false` | אין כתיבה לשורנס (הזמנת ייפוי כוח, שליחת E9100); קריאות ממשיכות אם `surense_enabled` דלוק |
| `surense_e9100_enabled` | `false` | אין שליחת E9100 (`e9100-submit` מחזירה 423) גם כש-`surense_write_enabled` דלוק; שליחה דורשת את שני המתגים. הזמנת ייפוי כוח לא תלויה בו |
| `surense_webhook_enabled` | `false` | `surense-webhook` מחזירה 503 ו-Svix מנסה שוב עד כיום; אירועים לא נשמרים |
| `surense_retention_enabled` | `false` | `ops.cleanup` לא מוחק שום דבר של שורנס: לא אירועים (`ops.surense_events`), לא עבודות (`ops.surense_jobs`) ולא את המראה `crm.surense_*` (הנתונים האישיים של לקוח או מסמך שנמחקו בשורנס מתאפסים בכל מקרה) |

עצירת חירום של הטפסים והצ'אט:
```sql
update ops.config set value = 'false', updated_at = now() where key in ('intake_enabled', 'chat_enabled');
```
עצירת חירום של מחבר שורנס: `update ops.config set value = 'false', updated_at = now() where key like 'surense%';`. שמירת אירועי שורנס, רק כש-`surense_retention_enabled` דלוק: 90 יום (אירוע שיש לו עבודה פתוחה נשמר), עבודות שהסתיימו 30 יום, עבודות מתות 90 יום. מחיקת אירוע לא מוחקת את העבודה שלו: `event_id` מתאפס (`on delete set null`), כך שעבודה מתה נשארת לתחקיר (`ops.cleanup`; TODO(owner): לאשר את החלונות ולקבוע שמירה למראה `crm.surense_*`).

**ניסיון חוזר בעבודות שורנס:** שכבה אחת בלבד. `surense-worker` מבצע קריאת HTTP אחת לכל פנייה לשורנס (`maxAttempts` 1), ובכשל זמני מחזיר ל-`api.surense_job_complete` את סוג הכשל ואת `Retry-After`. המסד קובע `next_attempt_at` לפי הגדול מבין ה-backoff (1, 5, 30 דק', 2 ש') וה-`Retry-After`, עם jitter של 50% עד 100%, ולעולם לא לפני ה-`Retry-After`. בניסיון החמישי העבודה עוברת ל-`dead` עם התראה קריטית. `surense-sync` (פעולות צוות) נשאר עם עד 3 ניסיונות לקריאות בלבד, והמתנה פנימית של עד 5 שניות.

**כתיבה סינכרונית לשורנס** (הזמנת ייפוי כוח, שליחת E9100, יצירת לקוח): שורת audit בשלב `pending` נכתבת לפני הבקשה (אם היא נכשלת, הבקשה לא נשלחת), ושורת `result` עם סטטוס ה-HTTP אחריה. כתיבה לא נשלחת שוב אוטומטית אחרי timeout. timeout, כשל רשת, 502 או 504 מחזירים 409 עם `details.reason = "ambiguous_check_surense"` ושורת audit בשלב `ambiguous`: **לבדוק בשורנס אם הפעולה בוצעה לפני שמנסים שוב** (כפילות מגיעה ללקוח או לגוף המוסדי). איתור:
```sql
select at, pk, new_data ->> 'op' as op, new_data ->> 'status' as status from audit.log
 where table_name = 'surense.api' and new_data ->> 'phase' = 'ambiguous' order by at desc limit 20;
```

**התראות שורנס ב-`ops.watchdog`** (צעד `surense`, מזהים וספירות בלבד):

| kind | מתי | מה עושים |
|---|---|---|
| `surense_backlog` (critical) | עבודה ב-`pending` שמועד הניסיון שלה עבר לפני יותר מ-15 דק' | ה-worker לא רץ או נכשל: `ops.job_runs` של `surense-worker`, מתג `surense_enabled`, סוד ה-cron |
| `surense_job_stuck` (critical) | עבודה ב-`processing` שה-lock שלה פג לפני יותר מ-10 דק' | ריצה שמתה באמצע; הריצה הבאה לוקחת אותה מחדש (או מעבירה ל-`dead` בניסיון 5) |
| `surense_dead_24h` (warning, פעם ביום) | עבודות `dead` ב-24 השעות האחרונות | `select id, kind, last_error, last_error_kind from ops.surense_jobs where status = 'dead' order by id desc;` |
| `surense_events_silent` (warning, פעם ביום) | `surense_webhook_enabled` דלוק יותר מ-24 ש' ואין אירוע ב-24 ש' | נקודת הקצה ב-Svix מושבתת, או סוד החתימה לא תואם |
| `surense_webhook_off` (warning, פעם ביום) | `surense_enabled` דלוק ו-`surense_webhook_enabled` כבוי יותר מ-24 ש' | להדליק את הקליטה, או לכבות את המחבר כולו |


או, כאדמין טרי: `staff.admin_config_set('intake_enabled', 'false')`. מפתח `intake_enabled` או `chat_enabled` שחסר בטבלה נחשב פתוח; כל מפתח אחר שחסר נחשב סגור.

### ב.6 מגבלות קצב

| איפה | מגבלה |
|---|---|
| `lead-intake`, בזיכרון, לפני המסד | 30 דחיות מוקדמות (Origin, צורה, Turnstile) ב-10 דק' לכתובת, ואז 429 בלי פנייה למסד |
| `api.submit_lead` | 8 לידים ב-10 דק' לכתובת (`lead_ip`); 300 לשעה בסך הכול (`lead_all`) |
| `chat-bot` | 20 לדקה לכתובת בזיכרון; 30 ב-10 דק' לסשן; 60 לשעה לכתובת |
| `health` | 60 לדקה לכתובת |
| Auth | כניסות והרשמות 20 ל-5 דק'; רענון 150; אימותים 20; אימייל 10 לשעה |

### ב.7 מה המשמעות של קודי התשובה בטפסים

| קוד | מקור | מה המבקר רואה | מה בודקים |
|---|---|---|---|
| 400 | שדה לא תקין (`details.field`) | הודעה לפי השדה | בדרך כלל באמת קלט שגוי |
| 403 `details.field=origin` | הדומיין לא ב-`ALLOWED_ORIGINS` | הודעת אימות עם טלפון | Edge secret `ALLOWED_ORIGINS` |
| 403 `details.field=turnstile` | Turnstile נכשל | הודעת אימות עם טלפון | מפתח אתר מול סוד, דומיין הווידג'ט |
| 409 | אותו `Idempotency-Key` עם גוף אחר | הודעת כפילות | רגיל אחרי עריכה בלי מפתח חדש |
| 423 `feature_disabled` | `intake_enabled=false` | "הטופס סגור זמנית" | מישהו כיבה את המתג |
| 429 | מגבלת קצב (`retry-after: 600`) | "נסו שוב בעוד כמה דקות" | התקפה או בדיקה אגרסיבית; לראות `ops.alerts` |
| 503 | סוד חסר (למשל `TURNSTILE_SECRET_KEY` בייצור), או מסד לא זמין | "הטופס אינו זמין כרגע" | `health` עם `x-cron-secret` מראה אילו שמות חסרים |

### ב.8 סימני כשל של ספקים חיצוניים

| ספק | סימן | פעולה |
|---|---|---|
| Resend | `job_runs` של `notify-worker` עם `resend_not_configured`; שורות outbox עם `last_error` חוזר ומצטברות ל-`dead`; התראת `outbox_dead` | לבדוק את `RESEND_API_KEY` ואת אימות הדומיין של `NOTIFY_FROM` ב-Resend. בלוג: `resend idempotency mismatch; treated as sent` = שורה שסומנה כנשלחה בלי ודאות מסירה |
| Turnstile | כל ליד מקבל 403 turnstile, או 503 אם הסוד חסר | Cloudflare: הווידג'ט כולל `seeld.co.il` ו-`www`; זוג המפתחות תואם |
| Gemini | הצ'אט עונה בהודעת "עמוס" או 503 | `GOOGLE_AI_API_KEY` קיים; מכסה ב-Google AI Studio |
| Micropay | התראה קריטית `sms_unavailable` (עם הקוד, למשל `bad_token`), מ-`sms-health` השעתי או ממסרון כניסה שנכשל; אזהרה `sms_low_credit` מתחת ל-`ops.config sms_low_credit_threshold` (200) | לקוחות לא מקבלים קוד כניסה. לבדוק את `SMS_API_TOKEN` ואת היתרה ב-Micropay, ואז `select ops.call_function('sms-health')` וב-`net._http_response` לראות `ok:true`. המסך ללקוח לא משתנה בזמן התקלה (כדי לא לחשוף מי לקוח) |
| data.gov.il | `job_runs` של `fetch-cma-data` עם `ok=false` | ריצה חוזרת ידנית (ד.2); `node scripts/tracks/check-tracks-source.mjs 202609` |

### ב.9 החלת מיגרציה חדשה

1. ה-PR ממוזג ל-`main` ו-`ci-ok` ירוק על ה-commit.
2. Actions → **Migrate production database** → Run workflow מ-`main`, עם `confirm=qxhpolktdfgcbxtfxgov` ו-`dry_run=true`. לקרוא את רשימת המיגרציות הממתינות.
3. אותו דבר עם `dry_run=false`. הבעלים מאשר את ה-Environment `production`.
4. אם `scripts/ci/check-migration-history.mjs` נכשל, ההיסטוריה בייצור לא תואמת למאגר. לא דוחפים: הסקריפט מדפיס פקודות תיקון לבדיקה.

לא מחילים מיגרציה דרך הדשבורד או דרך MCP. החריג היחיד היה בהקמה (18-19.11.2026).

### ב.10 Rollback של פריסה ב-Vercel

1. Vercel → פרויקט `seeld` → **Deployments**.
2. הפריסה האחרונה שהייתה תקינה → `...` → **Instant Rollback** (או Promote to Production).
3. בדיקה: `npm run health -- https://seeld.co.il` ו-`npm run smoke -- https://seeld.co.il`.
4. לא מוחקים פריסות. לפני הדחיפה הבאה ל-`main` מתקנים או עושים revert, כי היא תחליף שוב את הפריסה.

### ב.11 Purge של מטמון

Vercel → Settings → Caching → Purge CDN Cache. קבצי `/assets/*` הם immutable עם hash בשם, כך ש-chunk חסר פירושו בדרך כלל HTML ישן במטמון. האתר מתאושש בעצמו (`src/lib/chunkRecovery.ts`), אבל הניטור יסמן כשל עד שהמטמון תקין.

### ב.12 בדיקות שבועיות

- Supabase → Reports → Disk IO: המינימום של 7 ימים ב-Disk IO Balance.
- `content-dump.yml` הצליח; ה-artifact קיים (30 יום).
- `ops.alerts` ב-`pending` ריקה, או שכל התראה מוסברת.

### ב.13 את מי מודיעים

| מצב | מודיעים |
|---|---|
| כשל שנמשך יותר מ-30 דק' | הבעלים |
| בוצע rollback | הבעלים, והודעה פנימית לצוות |
| חשד לדליפת מידע, מפתח או גישה לא מורשית | הבעלים מיד. לא מפרסמים. מסובבים מפתחות רק לפי בקשתו |
| תקלה אצל Vercel או Supabase | `status.vercel.com` / `status.supabase.com`, ועדכון לבעלים |

---

## ג. זהות

חוזה מלא: `docs/platform/IDENTITY.md`. אדמין ראשון: §3. השבתה, נעילה ו-break-glass: §7. הקשחות פתוחות: §11.

### ג.1 אדמין ראשון (חד-פעמי, הבעלים)

תנאים: `SEELD_SECRET_KEY` מוגדר; ה-hook פעיל (בוצע); SMTP של Resend מוגדר, או משתמשים ב-Create new user.

1. SQL Editor: `scripts/identity/bootstrap-first-admin.sql`, אחרי החלפת `<ADMIN_EMAIL>` ו-`<DISPLAY_NAME>` בעורך בלבד. הסקריפט פותח הזמנת `staff/admin` בסוכנות `5eed0000-0000-4000-8000-000000000001`.
2. Dashboard → Authentication → Users → Invite user (הקישור תקף 10 דק'), או Add user → Create new user עם Auto Confirm.
3. SQL Editor: `api.staff_provision` (שלב 3 בסקריפט). מצופה `{"ok": true, "role": "admin", ...}`.
4. רישום TOTP:
   ```
   SEELD_PUBLISHABLE_KEY=... STAFF_EMAIL=... STAFF_PASSWORD=... STAFF_TOTP_OUT=<קובץ מחוץ למאגר> node scripts/identity/verify-identity.mjs --enroll
   ```
   אחרי הוספה לאפליקציית המאמת מוחקים את קובץ ה-URI. אם CAPTCHA פעיל, צריך גם `STAFF_CAPTCHA_TOKEN`.

### ג.2 הזמנה, שליחה חוזרת, השבתה והפעלה

כל הפעולות דרך `POST /functions/v1/staff-invite` עם JWT של אדמין ב-`aal2` ו-TOTP טרי (900 שניות):

| פעולה | גוף | הערה |
|---|---|---|
| `invite` | `{email, role}` | 409 `invitation_open` אם יש הזמנה פתוחה; 409 `user_exists` אם לכתובת כבר יש חשבון |
| `resend` | `{email}` | מחזיר `mode`: `invite` או `recovery`. 409 `already_active` אם המשתמש כבר נכנס |
| `disable` | `{user_id}` | `active=false` מיד, ואחר כך ban. ה-access token האחרון פג תוך 15 דק' |
| `enable` | `{user_id}` | קודם ה-RPC (מאפס גם נעילה), אחר כך unban. **איש צוות מושבת מוחזר עם `enable`, לא בהזמנה מחדש** |
| `accept` | `{display_name}` | המוזמן עצמו, אחרי רישום TOTP |

502 `delivery_failed` משאיר את ההזמנה פתוחה: משתמשים ב-`resend`. אסור להגדיר `SEELD_ENV` ב-seeld-site.

### ג.3 נעילה ושחרור

- נעילה אוטומטית כבויה (`auth_lock_enabled=false`, `auth_failure_actions` ריק) עד שתבוצע כניסה כושלת אמיתית אחת על ענף ונרשם שם הפעולה של GoTrue (`OWNER-STEPS.md`, יום 3).
- כשתופעל: 10 כשלונות ב-15 דק' מ-2 כתובות לפחות נועלים ל-30 דק' עם התראת `staff_locked`. אדמין לא ננעל.
- שחרור: אדמין טרי קורא ל-`staff.admin_staff_unlock(<user_id>)`.

### ג.4 Break-glass (אדמין יחיד נעול או מושבת)

`scripts/identity/break-glass.sql` עם `<USER_ID>`, ב-SQL Editor, כבעלים:
1. מחזיר `active=true`, מאפס `locked_until` ורושם `audit.log` (`break_glass_unlock`).
2. מאפס `banned_until`, או Dashboard → Users → Unban.
3. בדיקה: כניסה מוצלחת. התרגיל מבוצע ביום 3 על אדמין בדיקה.

---

## ד. נתונים

### ד.1 מסלולי השקעה

- מקור: data.gov.il (gemelnet, pensyanet, bituachnet), דרך `fetch-cma-data` → `content.cma_funds` → `api.cma_finish_sync` מסמנת `cma_refresh_pending` → צעד `cma_refresh` של `ops.watchdog` מרענן את ה-matviews ומריץ `content.refresh_investment_tracks()`.
- הגוף התקף של הפונקציה הוא זה של מיגרציה `20261119095300_t4_fix_pass.sql`. לא מחילים שוב את הגוף של `091000` או `095000`.
- מצב היום: 1,040 מסלולים פעילים (`source_period=202609`), התנגשות אחת (`B103`), 48 חברות ו-217 קרנות לא ממופות.
- קרנות שיצאו מהפיד מוסתרות ולא נמחקות. אם רענון נוגע בפחות ממחצית השורות הפעילות, שום דבר לא מוסתר ונשלחת התראת `tracks_shrink`.
- **מחזור חודשי:** data.gov.il מפרסם תקופה חדשה; `cma-sync-weekly` מושך אותה ביום ראשון; ה-watchdog מרענן. בדיקה:
  ```
  node scripts/tracks/check-tracks-source.mjs 202609
  ```
  יוצא עם 1 אם data.gov.il מקדים את התקופה שבמסד.
- **חברות לא ממופות:** מופיעות ב-`stats` של כל ריצת `cma-refresh`. כדי לפרסם חברה: שורה ב-`private.track_company_slugs` (נתונים, בלי DDL) וגם slug ב-`src/types/fund.ts` באתר. בלי שני הצדדים החברה לא מוצגת.
- רענון ידני (אחרי `edge_cron_enabled=true`):
  ```sql
  select ops.call_function('fetch-cma-data');
  ```
  או רענון המסלולים בלבד מתוך הנתונים שכבר במסד: `select content.refresh_investment_tracks();`

### ד.2 לוח התשואות

`api.cma_board` = 1,257 שורות, `api.cma_company_map` = 120, `api.cma_funds_latest` = 1,442. ה-matviews מתרעננים בצעד `cma_refresh`. אחרי ה-cutover, `/api/board` חייב להחזיר את כל 1,257 השורות דרך עימוד של 200.

### ד.3 גיבוי התוכן

- `content-dump.yml`: `pg_dump --schema=content` בתפקיד `content_dump`, מוצפן ב-age למפתח הציבורי `vars.BACKUP_AGE_RECIPIENT`, artifact ל-30 יום.
- שחזור (הבעלים, עם המפתח הפרטי שמחוץ למאגר):
  ```
  age -d -i <key-file> content-<date>.dump.age > content.dump
  pg_restore --schema=content --dbname <target> content.dump
  ```
- סודות Vault אינם חלק מ-`pg_dump`. אחרי שחזור מלא יוצרים מחדש את `project_url` ו-`edge_cron_secret`, ומשחזרים את `pii_enc_key` ו-`national_id_hmac_key` מהנאמנות הלא מקוונת. בלי שני האחרונים אי אפשר לפענח את `crm.customers`.
- בענף Supabase: Vault של הענף מחזיק את כתובת הענף בלבד, אף פעם לא את כתובת הייצור.

---

## ה. מעבר (cutover) ו-rollback

רשימת סימון: `docs/platform/CUTOVER-CHECKLIST.md`. כאן הסדר המחייב.

### ה.1 תנאים מוקדמים (כולם)

1. כל צעדי הבעלים שלפני ה-cutover ב-`OWNER-STEPS.md` בוצעו, ובפרט: Edge secrets `SEELD_SECRET_KEY`, `EDGE_CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `GOOGLE_AI_API_KEY`, `ALLOWED_ORIGINS`.
2. `edge_cron_enabled=true`, `ops.job_runs` מתמלא, ה-outbox התרוקן לפחות פעם אחת, ו-`api.health` מחזיר `degraded=false`.
3. בדיקות הזהות של יום 3 עברו (`IDENTITY.md` §7; `IMPLEMENTATION-PLAN.md` T1).
4. **תנאי העימוד:** `preview-smoke` ירוק על Preview של ה-PR. כלומר: אורך `/api/funds` שווה ל-`totalFunds` של `/api/fund-status`; אף רשימה לא עוצרת בדיוק על 200 או 1,000; `/api/tracks` ו-`/api/board` מחזירים יותר מ-200 שורות. היום הייצור נכשל בבדיקה הזאת (`/api/funds` מחזיר 1,000 מתוך 1,442).
5. על Preview במצב legacy: `/api/board`, `/api/funds`, `/api/tracks`, `/api/company-map`, `/api/fund-status` עונים 200 עם נתונים (הם עברו מ-Edge ל-Node).
6. החלטות הבעלים שחוסמות: אישור 1,040 מסלולים במקום 571; תיבת הסכמה בטפסים; תוכן מייל הליד (ז, פריטים 6.x).
7. `vars.SMOKE_SUPABASE_PUBLISHABLE_KEY` ו-`secrets.VERCEL_AUTOMATION_BYPASS_SECRET` מוגדרים, אחרת `preview-smoke` לא יכול לרוץ.

### ה.2 ביצוע (לפי הסדר)

1. **PR אחד** שמשנה את `vercel.json`: מסיר מ-`connect-src` את שני המקורות של טוקיו (`https://lvifatyksqizwcutfbqp.supabase.co` ו-`wss://lvifatyksqizwcutfbqp.supabase.co`). `scripts/ci/check-csp-bundle.mjs` מכשיל את ה-CI אם ה-CSP והבאנדל לא תואמים, בשני הכיוונים. לכן ה-PR ומשתני הסביבה של Preview חייבים לזוז יחד.
2. Vercel → `seeld` → Settings → Environment Variables, סביבת **Production**:
   - להוסיף `VITE_SEELD_BACKEND=v2`.
   - להחליף `VITE_SUPABASE_URL` ל-`https://qxhpolktdfgcbxtfxgov.supabase.co`.
   - להוסיף `VITE_SUPABASE_PUBLISHABLE_KEY` (מפתח `sb_publishable_*` של seeld-site).
   - להוסיף `VITE_TURNSTILE_SITE_KEY`.
   - להסיר את `VITE_SUPABASE_ANON_KEY` של טוקיו (לרשום לפני כן את הערכים הקודמים במקום פרטי של הבעלים, לצורך rollback).
   - לוודא שאין אף משתנה סודי ב-Vercel.
3. ממזגים את ה-PR ל-`main`. הדחיפה פורסת לייצור עם המשתנים החדשים (אין צורך בפריסה ידנית).
4. אם יש מיגרציה חדשה: `migrate.yml` (ב.9).
5. אימות (ה.3).
6. GitHub → Variables: `HEALTH_URL=https://qxhpolktdfgcbxtfxgov.supabase.co/functions/v1/health`.
7. אחרי שהאימות עבר והבאנדל בייצור כבר לא מזכיר את טוקיו: `CUTOVER_DONE=1`. מאותו רגע כל אזכור של טוקיו מכשיל CI ו-smoke.
8. ניטור צמוד 60 דק', ואחר כך `site-watch` ירוק 24 ש'.

### ה.3 מה מאמתים אחרי המעבר

| בדיקה | מצופה |
|---|---|
| `npm run health -- https://seeld.co.il` ו-`npm run smoke -- https://seeld.co.il` | ירוק |
| דפדפן, לשונית Network | אין בקשה ל-`lvifatyksqizwcutfbqp` ואין ל-`ipapi.co` |
| ליד בדיקה מ-`/contact`, כולל לחיצה כפולה | ליד אחד ב-`staff.leads_list`; מייל לצוות הגיע; `ops.outbox` של השורה = `sent` |
| טופס ביטוח וטופס פנסיה | `{ok:true}` ומייל לתיבה הנכונה |
| הצ'אט | ב-v2 מוצג פאנל הקשר (הצ'אט עוד לא מחובר ל-`chat-bot`). אם חובר: תשובה בעברית |
| `/api/board` | 1,257 שורות |
| `/investment-tracks` ו-`/api/tracks` | 1,040 מסלולים פעילים, "נכון לספטמבר 2026" (במקום 571 בטוקיו; נדרש אישור בעלים) |
| `/api/funds` | 1,442 = `totalFunds` |
| `/blog` | 22 מאמרים |
| `api.health` | `degraded=false` |
| `ops.job_runs` | `notify-worker` מתמלא עם `ok=true` |

### ה.4 Rollback (בחלון של 24 ש')

מתי: טפסים לא נשלחים יותר מ-15 דק'; אחד הדפים הראשיים לא נטען; נתוני לוח או מסלולים חסרים; בקשות לטוקיו נחסמות ב-CSP ושוברות דף; `degraded=true` שלא נפתר תוך 30 דק'.

1. Vercel → Deployments → הפריסה האחרונה שלפני ה-cutover → **Instant Rollback**. זה מחזיר גם את הבאנדל וגם את ה-CSP הישן, כי שניהם בתוך הפריסה.
2. Vercel → Environment Variables (Production): להחזיר את `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` של טוקיו, ולהסיר את `VITE_SEELD_BACKEND`. אחרת הדחיפה הבאה תפרוס שוב v2.
3. revert של ה-PR ב-`main` (הוא מחזיר את מקורות טוקיו ל-CSP).
4. אם כבר הוגדר `CUTOVER_DONE=1`: למחוק את המשתנה (אחרת ה-CI נכשל על אזכורי טוקיו). למחוק או לרוקן גם את `HEALTH_URL` אם הבעיה ב-backend.
5. בדיקה: `npm run health` ו-`npm run smoke`.
6. לידים שהגיעו בחלון נשארים ב-seeld-site ונקראים דרך `staff.leads_list`. **אין יצוא לקובץ.**

טוקיו לא משתנה בזמן ה-cutover, ולכן ה-rollback מחזיר את האתר בדיוק למצב הקודם.

---

## ו. מחיקת פרויקט טוקיו

**לא לפני שכל אלה מתקיימים:**
1. ה-cutover הושלם ו-`CUTOVER_DONE=1`.
2. 14 יום רצופים של יציבות: `site-watch` ירוק, אין rollback, `degraded=false`.
3. החלטה מפורשת של הבעלים על גיבוי פרטי של טבלאות הסוכנות.

### ו.1 מה יאבד במחיקה

הפלטפורמה החדשה לא מחזיקה, לא קוראת ולא מעבירה את הטבלאות הפרטיות של הסוכנות. בטוקיו נמצאות טבלאות לפי הדפוסים `ops_*`, `crm_*`, `plan_*`, `insurer_commissions`, `agency_agent_numbers`, `harel_*`. אם לא נלקח גיבוי, הן נמחקות עם הפרויקט, יחד עם:
- `page_views` (3,359 שורות; החלטה פתוחה: לא להעביר).
- `profiles` ו-6 משתמשי Auth (נבנים מחדש בהזמנה).
- `chat_conversations`, `chat_messages` (לא מועברים).
- 2 שורות `insurance_leads` (הבעלים מקליד אותן ב-seeld-site).
- סכמות של מוצרים אחרים שבתוך הפרויקט (רשימה ב-`OPEN-DECISIONS.md` סעיף ב.6), שצריכות להעתקה לפרויקטים שלהן לפני כן.
- כל הקבצים ב-Storage של טוקיו.
- יומני Auth ו-Postgres של טוקיו.

### ו.2 גיבוי מוצפן (הבעלים מריץ ממחשב משלו; שמות בלבד)

- מחרוזת חיבור: Tokyo → Connect → Session pooler, נשמרת רק במשתנה סביבה מקומי `TOKYO_DB_URL`, לא בקובץ ולא ב-GitHub.
- מפתח: מפתח age ציבורי של הבעלים (`BACKUP_AGE_RECIPIENT`); המפתח הפרטי נשאר offline.
- דוגמה (pg_dump בגרסה 17):
  ```
  pg_dump "$TOKYO_DB_URL" --format=custom --no-owner \
    --table='public.ops_*' --table='public.crm_*' --table='public.plan_*' \
    --table='public.insurer_commissions' --table='public.agency_agent_numbers' --table='public.harel_*' \
    | age -r "$BACKUP_AGE_RECIPIENT" > tokyo-agency-<date>.dump.age
  ```
- בדיקה: `age -d` על עותק ואחריו `pg_restore --list` מציג את הטבלאות. הקובץ נשמר מחוץ למאגר, מחוץ ל-OneDrive המשותף, ובשני מקומות.
- אף סוכן לא מריץ את הגיבוי הזה ולא רואה את התוכן.

### ו.3 הסדר

1. גיבוי (ו.2) ואישור הבעלים שהקובץ נפתח.
2. Supabase → Tokyo → Settings → General → **Pause project**.
3. 7 ימים נוספים של יציבות כשהפרויקט מושהה (כל תלות שנשכחה תתגלה עכשיו).
4. רק אז, באישור פרטני של הבעלים: Delete project. הפעולה בלתי הפיכה.

---

## ז. פריטים פתוחים

מקור: דוחות הסיום של T0, T5 (שלב A) ושל T1, T2, T3, T4 (שלב B), אחרי איחוד כפילויות. "בעלים" = פעולה או החלטה של הבעלים. "סוכן" = עבודה שהמתאם מקצה. מצב נכון ל-19.11.2026.

### 1. פרטיות ואבטחה

| # | פריט | אחראי | מצב |
|---|---|---|---|
| 1.1 | **אירוע פרטיות בהעתקת הלקוחות (18.11.2026).** בזמן העתקת 191 הלקוחות, מפתח ההעברה ו-4 הבלוקים החתומים עברו דרך תמליל הסשן של הסוכן. מי שמחזיק בתמליל יכול לפענח את כל 191 הרשומות, כולל תעודות זהות. החשיפה מוגבלת לתמליל: ביומני seeld-site יש רק DDL, ובטוקיו לא נרשמו הצהרות SELECT. נתיב ההעברה הוצא משימוש (`095300`, PT410). פירוט: `DATA-MIGRATION.md` סעיף 2א, `FOUNDATION-REVIEW-LOG.md` סעיף T4. **נדרש מהבעלים:** אישור שקרא את הגילוי, והחלטה כמה זמן לשמור את תמליל הסשן או אם למחוק אותו. רק הבעלים רשאי למחוק את התמליל | בעלים | פתוח |
| 1.2 | מחיקת הסוד המת `customers_transport_key` מ-Vault (לא מעבירים אותו לנאמנות) | בעלים (אישור) | פתוח |
| 1.3 | אישור בדיעבד של 13 מפתחות `details` בטבלה של `DATA-MIGRATION.md` סעיף 2ב; מפתח שנדחה מוסר ב-`private.customers_details_drop_keys` | בעלים | פתוח |
| 1.4 | נאמנות לא מקוונת של `pii_enc_key` ו-`national_id_hmac_key` (הסודות קיימים ב-Vault) | בעלים | פתוח |
| 1.5 | `deploy-vercel.yml` מקבל טוקן כקלט `workflow_dispatch`, שנראה בהיסטוריה של ריפו ציבורי. המלצה: להסיר את הקלט ולהשתמש רק ב-`secrets.VERCEL_TOKEN` | בעלים (אישור), סוכן (שינוי) | פתוח |
| 1.6 | הקשחות SQL: `api.invitation_resend` מחזיר `recovery` רק לאיש צוות באותה סוכנות; `staff.admin_staff_disable` מפקיע הזמנות פתוחות של המושבת (`IDENTITY.md` §11) | סוכן (מסד) | פתוח |
| 1.7 | תשובת 409 `user_exists` משאירה הזמנה פתוחה עד 24 ש'. אין RPC לביטול הזמנה | סוכן (מסד) | פתוח, סיכון נמוך |
| 1.8 | Resend 409 `invalid_idempotent_request` נרשם כנשלח; במקרה נדיר מייל יסומן כנשלח בלי מסירה (מופיע בלוג עם מזהה ה-outbox) | ידוע | מקובל |
| 1.9 | הריפו `seeld` ציבורי; לשקול להפוך לפרטי | בעלים | פתוח |

### 2. backend ופונקציות

| # | פריט | אחראי | מצב |
|---|---|---|---|
| 2.1 | Edge secrets שחסרים: `SEELD_SECRET_KEY`, `EDGE_CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `GOOGLE_AI_API_KEY`, `ALLOWED_ORIGINS`, `NOTIFY_FROM`, `NOTIFY_TO_*`; וגם `ENV=production` | בעלים | פתוח |
| 2.2 | הדלקת `edge_cron_enabled` אחרי הסודות, ובדיקה ש-`job_runs` מתמלא ושה-outbox מתרוקן (3 התראות ממתינות היום) | בעלים | פתוח |
| 2.3 | הקוד הפרוס הוא באנדלים שהועברו דרך MCP. לא הוכח שהוא זהה בבייטים למאגר (בעיקר `SYSTEM_PROMPT` של הצ'אט). לפרוס מחדש את כל הפונקציות מהמאגר עם `supabase functions deploy` כשיהיה טוקן. `fetch-cma-data` בגרסה 1 (התנהגות זהה) | סוכן + בעלים (טוקן) | פתוח |
| 2.4 | לא נבדק על הייצור: כתיבת ליד מלאה, שליחה של `notify-worker`, ריצת `fetch-cma-data`, תשובת צ'אט, מקור כתובת ה-IP (`GET /health` עם `x-cron-secret`) | סוכן אחרי 2.1 | פתוח |
| 2.5 | `api.lead_notify_details` לא קיימת. בלעדיה (וגם בלי `NOTIFY_INCLUDE_PII=true`) מייל הליד לצוות מכיל רק סוג וקישור, ואפליקציית הסוכנים היא שלב ב'. SQL מוצע ב-`EDGE-FUNCTIONS.md` | בעלים (החלטה), סוכן (מיגרציה) | **פער ל-cutover** |
| 2.6 | הצ'אט נכשל סגור כשהמסד לא זמין (שינוי מכוון מטוקיו) | ידוע | מקובל |
| 2.7 | הצ'אט באתר לא מחובר ל-`chat-bot`; ב-v2 מוצג פאנל קשר | סוכן (אתר) | פתוח |
| 2.8 | הערה שגויה ב-`supabase/config.toml` על `chat-bot` ("Turnstile"); אין Turnstile בצ'אט | סוכן (CI) | פתוח, תיעוד בלבד |
| 2.9 | `src/platform/api/errors.ts` לא מכיר `feature_disabled` (ימופה ל-`unknown` בלקוח API כללי) | סוכן (אתר) | פתוח, סיכון נמוך |
| 2.10 | אופציונלי: קוד 403 נפרד בשרת (`origin_forbidden`); הלקוח כבר מבדיל לפי `details.field` | סוכן | אופציונלי |
| 2.11 | `api-v1` ו-`queue-worker` עדיין בתיקיית הפונקציות (אפשרות ב' בפועל: `SEELD_SECRET_KEY`, `verify_jwt=true`). החלטה סופית: להשאיר או להעביר ל-`supabase/_parked` | בעלים | פתוח |

### 3. זהות

| # | פריט | אחראי | מצב |
|---|---|---|---|
| 3.1 | בדיקות יום 3 על ענף: הזמנה עם hook, שליחה חוזרת אחרי 10 דק', refresh נכשל אחרי השבתה, כניסה אחרי הפעלה, תרגיל break-glass, הזמנת `client` לא יוצרת משתמש. **תנאי ל-cutover** | בעלים + סוכן | פתוח |
| 3.2 | כניסה כושלת אמיתית אחת, רישום `auth_failure_actions`, ורק אז החלטה על `auth_lock_enabled` | בעלים | פתוח |
| 3.3 | SMTP של Resend ב-Auth (או `RESEND_API_KEY` + `STAFF_INVITE_FROM`). שחזור סיסמה במצב SMTP עלול לדרוש `captchaToken` כש-CAPTCHA פעיל | בעלים | פתוח |
| 3.4 | CAPTCHA של Auth (Turnstile) | בעלים | פתוח |
| 3.5 | אדמין ראשון (ג.1) | בעלים | פתוח |
| 3.6 | ה-CI עוד לא מריץ את בדיקות Deno של `staff-invite` | סוכן (CI) | פתוח |
| 3.7 | שגיאת ESLint `no-explicit-any` ב-`supabase/functions/staff-invite/handler.test.ts` (תוקנה מקומית, ממתינה ל-commit של המתאם) | מתאם | בטיפול |

### 4. אתר ו-cutover

| # | פריט | אחראי | מצב |
|---|---|---|---|
| 4.1 | עימוד של 200 שורות ב-`api/board.ts`, `funds.ts`, `tracks.ts`, `company-map.ts` מאומת ב-`preview-smoke`. הייצור היום מחזיר 1,000 מתוך 1,442 קרנות. **תנאי ל-cutover** | סוכן (אתר) + `preview-smoke` | הקוד מוכן; אימות על Preview פתוח |
| 4.2 | `api/*.ts` עברו מ-Edge ל-Node: לוודא על Preview במצב legacy שכל חמשת הנתיבים עונים 200 | סוכן | פתוח |
| 4.3 | קוד v2 נשאר בבאנדל legacy כקוד מת (1.26KB gzip). צריך ערך ברירת מחדל ל-`VITE_SEELD_BACKEND` ב-`vite.config.ts` | סוכן | פתוח |
| 4.4 | מחיקת 13 קבצי PDage (`src/pages/pdage/*`, `src/components/pdage/*`, `src/hooks/usePdageChat.ts`) ובלוקי `pdage_*` ב-`src/integrations/supabase/types.ts`. אושרה בעיקרון, ממתינה לאישור פרטני לרשימה | בעלים | פתוח |
| 4.5 | הסרת `api/geo.ts` | בעלים (החלטה) | פתוח |
| 4.6 | תיבת סכמה מפורשת בכל טופס (היום רק בטופס הפרישה) | בעלים (החלטה) | פתוח |
| 4.7 | אישור 1,040 מסלולים פעילים במקום 571 | בעלים | פתוח |
| 4.8 | פרסום 48 החברות הלא ממופות (217 קרנות): slugs באתר + שורות ב-`private.track_company_slugs` | בעלים (החלטה), סוכן | פתוח |
| 4.9 | ריצה חודשית אחת מקצה לקצה של רענון המסלולים, אחרי 2.2 | סוכן | פתוח |
| 4.10 | Skew Protection ב-Vercel אחרי שהאתר שולח `?dpl=` בכתובות הנכסים | סוכן + בעלים | פתוח |
| 4.11 | `VITE_STAFF_APP_ENABLED` שמור ולא נקרא | ידוע | שלב ב' |
| 4.12 | `api.travel_companies` (6 שורות, כולן `active=false`) לא נקרא באתר. החלטה אם להפעיל את 4 החברות הפעילות | בעלים | פתוח |
| 4.13 | `page_views`: לא מועבר (המלצה) | בעלים (החלטה) | פתוח |
| 4.14 | מייל אישור לליד עצמו (היה בטוקיו) | בעלים (החלטה) | פתוח |

### 5. CI ותפעול

| # | פריט | אחראי | מצב |
|---|---|---|---|
| 5.1 | GitHub Environments `production` (`SUPABASE_DB_URL`) ו-`backup` (`CONTENT_DUMP_DB_URL`); משתנים `PROD_MIGRATORS`, `SMOKE_SUPABASE_PUBLISHABLE_KEY`, `BACKUP_AGE_RECIPIENT`; secret `VERCEL_AUTOMATION_BYPASS_SECRET`. בלי אלה `migrate.yml`, `content-dump.yml` ו-`preview-smoke.yml` לא רצים | בעלים | פתוח |
| 5.2 | `content_dump` עם הרשאת login וסיסמה (כ-SCRAM verifier מחושב מראש) | בעלים | פתוח |
| 5.3 | הגנת ענף על `main` שדורשת `ci-ok` | בעלים | פתוח |
| 5.4 | לא אומת מקומית (אין CLI): `supabase db lint --level warning --fail-on error` ו-`supabase test db` על CLI 2.122.1. ה-CI על `main` ירוק, כך שזה אומת שם בפועל | סוכן | נסגר על ידי CI |
| 5.5 | `supabase/tests/local_bootstrap.sql` עלול להיאסף בהרצה רקורסיבית של `supabase test db`; הזזתו דורשת אישור | בעלים (אישור) | פתוח |
| 5.6 | `docs/platform/types.generated.ts` עם כותרת ידנית | סוכן | פתוח, קוסמטי |
| 5.7 | סטיית הערות בלבד ב-3 פונקציות יסוד בייצור | ידוע | מקובל |
| 5.8 | בסיס `npm audit` (39 זוגות) דורש שדרוג תלויות; actions מוצמדים לגרסה ראשית ולא ל-SHA; אזהרות lint ב-watchdog | סוכן | backlog |
| 5.9 | בדיקת `max_rows` ב-CI עוברת באופן טריוויאלי (0 שורות תוכן). אופציונלי: 250 שורות סינתטיות | סוכן | אופציונלי |
| 5.10 | אינטגרציית GitHub של Supabase (אם הופעלה): לכבות פריסה אוטומטית לייצור | בעלים | לבדוק |
| 5.11 | Database → Auth DB connections: מעבר לאחוזים | בעלים | פתוח |
| 5.12 | `HEALTH_URL` מוגדר רק אחרי שה-outbox התרוקן בהצלחה פעם ראשונה | בעלים | פתוח |
| 5.13 | איש קשר לדוחק ומספר טלפון לתקלות | בעלים | פתוח |
| 5.14 | חזרת cutover על סביבת staging (`IMPLEMENTATION-PLAN.md` T6): תרגיל kill switch, התראה עד `undeliverable`, Instant Rollback תוך פחות מ-5 דק' | סוכן + בעלים | פתוח |
