# יסודות הפלטפורמה של SEELD: אתר, Supabase, Vercel, CI

מצב: 18.11.2026. מסמך ההחלטות והתכנון הקובע. נבנה על `ARCHITECTURE.md`, `EVENT-ARCHITECTURE.md`, `RUNBOOK.md` ו-`OPEN-DECISIONS.md` ולא חוזר עליהם. מחקרי העומק של הסוכנים המקבילים נמצאים ב-`docs/platform/research/` (`SUPABASE.md`, `VERCEL-CICD.md`, `SECURITY-PRIVACY.md`), והמסמך הזה מפנה אליהם ולא משכפל אותם.

מה כבר קיים ומאומת (לא הצעה): פרויקט `seeld-site` (Frankfurt, `qxhpolktdfgcbxtfxgov`) נבנה מאפס עם 8 מיגרציות שנמצאות ב-`supabase/migrations/20261118*`, 82 בדיקות pgTAP שעוברות גם בקונטיינר נקי וגם על הפרויקט עצמו, ו-advisors נקיים (פירוט בנספח א).

---

## 1. עקרונות (מה "יסוד בטון" אומר כאן)

1. **שום דבר לא חשוף כברירת מחדל.** מה שהדפדפן יכול לגעת בו הוא רשימה סגורה של views ופונקציות בסכמה אחת (`api`). הטבלאות עצמן בסכמות שאינן חשופות.
2. **ההרשאה נקבעת במסד, לא בקוד הלקוח וגם לא ב-claims מיושנים.** תפקיד נקרא מטבלה (`core.staff`), ביטול הרשאה נכנס לתוקף מיידית.
3. **כל שינוי הוא מיגרציה מתוארכת שעוברת הרצה מאפס.** אין שינוי ידני בדשבורד שלא מתועד כקובץ. אין עריכה של מיגרציה שכבר הורצה.
4. **הכול נבדק אוטומטית.** כל הבטחת אבטחה כתובה כבדיקת pgTAP ורצה ב-CI.
5. **משעמם לתפעול.** פחות חלקים נעים: פרויקט Supabase אחד לאתר, פרויקט Vercel אחד, מסלול פריסה אחד, שלושה cron jobs.
6. **הרחבה בלי עבודה מחדש.** מוצר חדש מוסיף סכמה ו-views, לא משנה את הבסיס.

---

## 2. עשרה דברים שלמדתי ושמשנים את הנוהג הנוכחי

מקורות בסוף הסעיף. "נקרא" = נקרא בעומק ביום זה; "חיפוש" = נמצא בחיפוש התיעוד, נקרא ברמת כותרת בלבד.

1. **סכמה חשופה אחת (`api`) במקום טבלאות ב-`public`.** ב-Tokyo 257 טבלאות, ל-`anon` ול-`authenticated` יש ALL (כולל TRUNCATE) והכול נשען על RLS בלבד. התיעוד (RLS guide, נקרא) מסביר ש"מדיניות לא מסירה grants". ההחלטה: ADR-1.
2. **grants מפורשים, ובדיקה שחוזרת על עצמה.** התיעוד מציין ש"לא כל פרויקט מעניק grants אוטומטית" ושצריך לתת לכל תפקיד רק מה שנחוץ. הבדיקה `01_structure_and_grants` נכשלת אם מישהו מעניק TRUNCATE/REFERENCES/TRIGGER ל-API roles.
3. **RLS בצורה שמתאימה למנוע.** `(select auth.uid())` ו-`(select private.is_staff())` יוצרים initPlan שמחושב פעם אחת לשאילתה (ההפרש בתיעוד: מ-179ms ל-9ms, ובפונקציית תפקידים מ-178,000ms ל-12ms), תמיד `TO role`, ואינדקס על כל עמודה במדיניות. ב-Tokyo נמצאו 92 מדיניות בלי עטיפה ו-103 מפתחות זרים בלי אינדקס (יומן שלב א׳).
3א. **אחת-לכל-תפקיד-לכל-פעולה:** מדיניות SELECT נפרדת ל-`anon` ול-`authenticated` מונעת את אזהרת multiple_permissive_policies (ב-Tokyo 31 מקרים).
4. **MFA נאכף במסד.** `auth.jwt()->>'aal'` שווה `aal2` הוא חלק מ-`private.is_staff()`. סוכן בלי TOTP רואה אפס נתונים פרטיים (בדיקה 22 בקובץ 02). זה מתועד ב-RLS guide (סעיף MFA, נקרא).
5. **תקציב Disk IO הוא מגבלה אמיתית ולא "תקלה".** לפי `compute-and-disk` (נקרא): Micro מקבל 11 MB/s ו-500 IOPS בקצב קבוע, Small 22 MB/s ו-1,000 IOPS, וכולם יכולים לפרוץ ל-261 MB/s ו-11,800 IOPS רק למשך קצר ביום (התקציב). אחרי שהתקציב נגמר המופע מוגבל, התגובות מאטות, ה-autovacuum וגיבוי יומי נפגעים (`exhaust-disk-io`, נקרא). הגורמים הנפוצים לפי התיעוד: זיכרון גבוה ו-swap, cache hit נמוך, שאילתות ארוכות, עומס. מדד "Disk IO Balance" אינו חשוף ב-Metrics API ולכן אי אפשר להגדיר עליו התראה אוטומטית. בנוסף, הגורמים הסבירים ב-Tokyo (השערה מבוססת יומן שלב א׳, לא מדידה): 122,876 שורות `cron.job_run_details`, 103 FK בלי אינדקס (סריקות), 192 אינדקסים שלא בשימוש (הגברת כתיבה), upsert של 39,614 שורות עם `raw_data` jsonb שלוש פעמים בשבוע, שני cron כל 5 דקות של מערכת אחרת, והכול על מופע אחד ל-257 טבלאות. התיקון המבני: פרויקט נפרד לאתר, שמירת נתונים (`ops.cleanup` כולל `cron.job_run_details`), בלי `raw_data`, cron אחד לכל מטרה.
6. **ענפי Supabase בונים את הסכמה ממיגרציות ולא משכפלים אותה** (`github-integration`, נקרא). לכן שחזור מאפס הוא תנאי להכול, ולכן הוכחתי אותו בקונטיינר.
7. **Edge Functions: מפתחות חדשים (publishable / secret) ומעטפת `withSupabase`** עם מצבי auth (`user`, `secret`, `publishable`, `none`). `verify_jwt` חייב להיות מוגדר ב-`config.toml` ולהישמר בגיט (ב-Tokyo הקובץ סטה ממה שפרוס). קריאת cron ל-function בעזרת מפתח secret מ-Vault ולא כתובת קשיחה (`functions/auth` ו-`schedule-functions`, הראשון נקרא).
8. **Vercel: אזור ברירת מחדל `iad1` (וושינגטון)** לפונקציות (`configuring-functions/region`, נקרא). האתר פונה ל-Frankfurt ולכן `fra1`. עוד ממצא מהפריסות בפועל: דחיפה ל-`main` מפרסמת לפרודקשן בלי להמתין ל-CI (8 פריסות פרודקשן ב-21 השעות האחרונות לפי `list_deployments`, חמש מהן בשעה וחצי האחרונות, כל אחת ישירות מ-commit). ההגנה: חוק הגנת ענף שדורש `ci-ok`, ומסלול פריסה יחיד. Deployment Protection ברמת Standard מגנה על כל מה שאינו דומיין פרודקשן (`deployment-protection`, נקרא).
9. **מגבלות Auth שמשפיעות על התכנון** (`auth/rate-limits`, נקרא): ספק האימייל המובנה שולח 2 הודעות לשעה בלבד, לכן OTP לאימייל מחייב SMTP מותאם. SMS ברירת מחדל 30 לשעה. הרשמה/כניסה 30 בקשות ל-5 דקות לכל IP. OTP לאותו משתמש: חלון 60 שניות.
10. **טופס ליד ציבורי הוא וקטור התעללות.** ב-Tokyo `send-lead-notification` פתוחה (`verify_jwt=false`) ושולחת אימייל. הפתרון: כתיבה רק דרך RPC עם ולידציה, honeypot, הגבלת קצב במסד, idempotency, ובשלב הבא Turnstile בקצה. שגיאות `PT400`/`PT429` ב-PostgREST הופכות ישירות לסטטוס HTTP (מתועד ב-PostgREST, נוסיף למדריך הלקוח).

מקורות (Supabase): https://supabase.com/docs/guides/database/postgres/row-level-security (נקרא), https://supabase.com/docs/guides/platform/compute-and-disk (נקרא), https://supabase.com/docs/guides/troubleshooting/exhaust-disk-io (נקרא), https://supabase.com/docs/guides/auth/rate-limits (נקרא), https://supabase.com/docs/guides/deployment/branching/github-integration (נקרא), https://supabase.com/docs/guides/functions/auth (נקרא), https://supabase.com/docs/guides/api/securing-your-api (חיפוש), https://supabase.com/docs/guides/api/using-custom-schemas (חיפוש), https://supabase.com/docs/guides/functions/schedule-functions (חיפוש), https://supabase.com/docs/guides/local-development/declarative-database-schemas (חיפוש), https://supabase.com/docs/guides/local-development/testing/pgtap-extended (חיפוש), https://supabase.com/docs/guides/platform/backups (חיפוש), https://supabase.com/docs/guides/database/connecting-to-postgres (חיפוש). מקורות (Vercel): https://vercel.com/docs/functions/configuring-functions/region, https://vercel.com/docs/project-configuration, https://vercel.com/docs/deployment-protection (נקראו). מחקרים נוספים: `research/SUPABASE.md`, `research/VERCEL-CICD.md`, `research/SECURITY-PRIVACY.md`.

---

## 3. סביבות ותהליך קידום

| סביבה | מה זה | מסד | מי נוגע | מתי נוצרת |
|---|---|---|---|---|
| local | `supabase start` או הקונטיינר ב-`supabase/tests/replay-local.sh` | מקומי, נבנה ממיגרציות | מפתח/סוכן | תמיד |
| preview | Vercel preview לכל PR | ענף Supabase זמני (רק ל-PR שנוגע ב-`supabase/`), אחרת מצביע ל-staging | CI | לפי PR |
| staging | ענף עמיד `staging` של `seeld-site` | ענף | חזרות cutover, בדיקות עומס | **רק** בימים 4-5 ואז נמחק (ADR-11) |
| production | `seeld-site` + הפרויקט `seeld` ב-Vercel | `qxhpolktdfgcbxtfxgov` | מיגרציות דרך PR בלבד | קיים |

תהליך: ענף קצר, PR, CI (`ci-ok` חובה), preview אוטומטי, מיזוג ל-`main`, Vercel פורס, המיגרציות מוחלות על פרודקשן על ידי הוצאה מבוקרת (`supabase db push` מ-CI ידני עם אישור, או חיבור GitHub של Supabase). מיגרציה הרסנית (drop/rename) דורשת שני שלבים (expand, ואחרי יום contract). Rollback של קוד: Vercel Instant Rollback. Rollback של מסד: מיגרציה קדימה שמתקנת, לעולם לא עריכה.

---

## 4. מבנה המאגר

```text
supabase/
  config.toml                 # הצעה: docs/platform/config.proposed.toml (הקובץ הקיים מצביע ל-Tokyo)
  migrations/                 # <14 ספרות>_<snake_case>.sql, קדימה בלבד
  tests/                      # pgTAP: NN_name.test.sql, local_bootstrap.sql, replay-local.sh
  seed.sql                    # נתוני פיתוח בלבד (לא קיים עדיין, הבדיקות מניחות טבלאות ריקות)
  functions/
    _shared/                  # cors.ts, auth.ts, errors.ts, log.ts, env.ts
    lead-intake/ notify-worker/ chat-bot/ fetch-cma-data/ sync-tracks/ invite-agent/ health/
  proposed/                   # מערכת האירועים (06-09), לא נוגעים, מאומצת בנפרד
api/                          # פונקציות Vercel: קריאה בלבד, מטמון
docs/platform/                # FOUNDATION.md, research/, *.proposed.*
src/integrations/supabase/types.generated.ts   # נוצר מסכמת api, נבדק ב-CI
```

קונבנציות: שם מיגרציה מתאר מה בוצע (`add_questionnaire_tables`), קובץ אחד לשינוי לוגי אחד, כל טבלה חדשה כוללת בקובץ עצמו: RLS, grants, מדיניות, אינדקסי FK, טריגר `updated_at`, ובדיקה בתיקיית `tests/`. **אזהרה חשובה:** התיקייה `supabase/migrations/` מכילה גם 40 מיגרציות היסטוריות של Tokyo (עד 20260917). הן שייכות לפרויקט הישן ולא לבסיס החדש. אל תריצו `supabase db push` או `db reset` לפני שבעלים מאשר העברת הקבצים הישנים לארכיון (צעד ידני 9). `replay-local.sh` מדלג עליהן במכוון.

---

## 5. פריסת מסד הנתונים

### 5.1 סכמות ובעלות

| סכמה | תוכן | חשופה ל-API | מי קורא |
|---|---|---|---|
| `api` | views (security_invoker) ופונקציות RPC. הדבר היחיד ש-PostgREST רואה | כן (היחידה) | anon, authenticated |
| `content` | תוכן ציבורי: `blog_posts`, `travel_companies`, `investment_tracks`, `cma_funds`, matviews | לא | דרך views בלבד |
| `crm` | נתונים פרטיים: `leads` (ובהמשך לקוחות, שאלונים, דוחות) | לא | צוות (aal2) דרך views |
| `core` | זהות: `staff`, `client_accounts` | לא | המשתמש עצמו, מנהלים |
| `ops` | `config`, `rate_limits`, `outbox` | לא | service_role ופונקציות definer |
| `audit` | `log` (append-only) | לא | service_role |
| `private` | פונקציות עזר (`is_staff`, `has_role`, `check_rate_limit`) | לא | policies בלבד |
| `public` | ריק במכוון (נבדק) | לא | כלום |

### 5.2 קונבנציות

- **מזהים:** `uuid` עם `gen_random_uuid()`. (uuidv7 קיים רק מ-Postgres 18, ADR-7.) טבלאות נתוני עזר שמגיעות ממקור חיצוני (`investment_tracks`) שומרות מזהה זהות עם מפתח עסקי ייחודי (`fund_number`).
- **זמנים:** `created_at`, `updated_at` מסוג `timestamptz not null default now()`, טריגר `private.set_updated_at`.
- **שמות:** snake_case, טבלאות ברבים, FK בשם `<entity>_id`, אילוצי `check` במקום enum (קל לשינוי, ADR-8).
- **מחיקה רכה:** רק במקום שיש בו ערך עסקי (`crm.leads.deleted_at`). הצוות מוחק רך דרך עדכון עמודה בלבד, מחיקה קשה רק service_role.
- **Audit:** טריגר `audit.log_change()` על כל טבלה עם ערך משפטי או עסקי. לטבלאות עם PII הארגומנט `'no_values'` שומר שמות עמודות שהשתנו, מי ומתי, אך לא ערכים. הטבלה append-only (טריגר חוסם), שימור 400 יום.
- **תקן RLS לכל טבלה חדשה:** (1) `enable row level security` (ויש גם event trigger שעושה זאת אוטומטית בסכמות המנוהלות), (2) grants מפורשים לכל תפקיד ורק מה שצריך (בלי TRUNCATE), (3) מדיניות לכל פעולה וכל תפקיד, `to <role>` תמיד, `(select ...)` סביב כל פונקציית auth/private, (4) אינדקס על עמודות המדיניות ועל כל FK, (5) בדיקת pgTAP שמוכיחה מה anon, לקוח, סוכן ללא TOTP, סוכן עם TOTP, מנהל יכולים ואינם יכולים.
- **security definer:** רק כשחייבים (קריאת `core.staff` מתוך מדיניות, כתיבה ל-`audit`/`ops`), תמיד עם `set search_path = ''`, שמות מלאים, ו-`revoke ... from public`. בדיקה אוטומטית נכשלת על פונקציה שלא נעל את ה-search_path.
- **security invoker:** כל view ב-`api`. כך המדיניות של הטבלה הבסיסית חלה על המשתמש (נבדק).

### 5.3 מודל תפקידים

| תפקיד | איך מזוהה | יכול |
|---|---|---|
| `anon` | מפתח publishable, ללא התחברות | קריאת תוכן ציבורי (פוסטים שפורסמו, חברות נסיעות פעילות, מסלולים, לוח תשואות), הרצת `api.submit_lead` בלבד |
| `authenticated` (לקוח) | `core.client_accounts.status='active'` | כרגע כמו anon + `api.me()`. נתוני הלקוח עצמו יתווספו עם מערכת הלקוחות (ראו 5.5) |
| `agent` | שורה פעילה ב-`core.staff` + `aal2` | קריאה ועדכון תוכן, קריאת לידים ושינוי `status`, `assigned_to`, `notes`, `deleted_at` בלבד |
| `manager` / `admin` | `core.staff.role` | כל מה שסוכן + מחיקת תוכן, קריאת כל רשומות הצוות |
| `service_role` | מפתח secret, בשרת בלבד | כתיבה ל-`content` (טוענים), `ops`, ניהול `core.staff`, מחיקה קשה |

הרשאה אינה נשענת על claims. כדי שה-UI ידע מה להציג יש `api.me()` שמחזיר תפקיד ורמת אימות. Custom Access Token Hook לא מופעל (ADR-2).

### 5.4 ציבורי מול פרטי (סיווג מידע)

| רמה | דוגמאות | איפה | חשיפה |
|---|---|---|---|
| ציבורי | פוסטים שפורסמו, חברות נסיעות, לוח תשואות, מסלולי השקעה | `content` | `anon` דרך `api` |
| פנימי | `ops.*`, `audit.log`, `core.staff` | `ops`, `audit`, `core` | service_role / עצמי |
| אישי רגיש (PII) | `crm.leads` (שם, טלפון, אימייל, ת.ז. בתוך payload אם נשלחה), `client_accounts` | `crm`, `core` | צוות עם TOTP בלבד, ללא ערכים ביומן |
| אישי כלכלי (בעתיד) | שאלונים, דוחות, מסמכי לקוח | `crm` + Storage פרטי | צוות עם TOTP + הלקוח עצמו, כתיבה דרך RPC בלבד |

כלל: מידע שאינו נחוץ לתפעול האתר לא נכנס. הבסיס לא מכיל נתוני CRM ישנים של הסוכנות (ראו סעיף 18.4).

### 5.5 איך מערכת האירועים (`supabase/proposed/01-09`) משתלבת

היא מאומצת בשלב ב׳, אחרי שהבסיס יציב, ובלי לשנות אותו:
- `identity_links` (HMAC של ת.ז.) הופך להיות `crm.customer_identities` ו-`core.client_accounts.customer_id` מצביע עליו.
- `event_log`, `queue_*`, `idempotency_keys`, `alerts` עוברים מ-`public` ל-`ops` (שינוי שם סכמה ב-SQL המוצע, הבדיקות שבודקות את התקשורת נשארות).
- `ops.outbox` של הבסיס הוא גרסה פשוטה שמתחלפת: ה-trigger על `crm.leads` כבר כותב אליה, וה-worker מהמערכת המוצעת יקרא ממנה (או שייכתב מחדש ל-pgmq). עד אז `notify-worker` קטן מספיק.
- `platform_user_roles` (08) מוחלף ב-`core.staff` (תפקידים: `agent`, `manager`, `admin`; `super_admin` של 08 הופך ל-`admin`). המדיניות החזקה ב-08 (`require_super_admin_fresh`) נשמרת כפונקציה נוספת.
- `rate_limit_counters` ו-`audit_log` (02/03) מוחלפים ב-`ops.rate_limits` ו-`audit.log` הקיימים.

---

## 6. מודל אימות

| קהל | שיטה | פרטים |
|---|---|---|
| סוכנים, מנהלים | אימייל + סיסמה (12+ תווים) + TOTP חובה | `enable_signup=false`. המשתמש נוצר בהזמנה (`invite-agent`, service_role) ושורה ב-`core.staff`. בלי TOTP מגיעים ל-`aal1` ורואים אפס נתונים פרטיים. הרשמת TOTP פתוחה ל-aal1 |
| לקוחות | הזמנה בלבד, תעודת זהות + אימות (SMS בשלב מאוחר) | קוד חד-פעמי לאימייל לחשבונות קיימים בלבד: `signInWithOtp({ options: { shouldCreateUser: false } })`. אין התחברות חברתית (הוסרה כבר ב-commit f55dfad) |
| אנונימי | מפתח publishable | קריאה ציבורית ו-`submit_lead` |

הערות: (א) OTP לאימייל דורש SMTP מותאם (Resend) כי הספק המובנה מגביל ל-2 הודעות בשעה. (ב) SMS: בחירת ספק (ספק ישראלי מול Twilio) מוצגת לבעלים בסעיף 21, ההחלטה נדחית לשלב לקוחות. (ג) שלושת המשתמשים שנכנסו ב-Google ב-Tokyo לא יועתקו: מקימים מחדש עם אימייל וסיסמה.

---

## 7. Edge Functions: רשימה, חוזים ותקנים

| פונקציה | מטרה | `verify_jwt` | קורא | חוזה (תמצית) |
|---|---|---|---|---|
| `lead-intake` | חזית ציבורית ללידים: מאמתת Turnstile, מקור מורשה (Origin), מעבירה ל-`api.submit_lead` עם כתובת הלקוח | false | דפדפן | `POST {kind, full_name, phone?, email?, message?, payload?, consent:true, turnstile_token}` מחזיר `200 {ok,id}` / `400 invalid_input:<field>` / `403 origin` / `429`. כותרת `Idempotency-Key` אופציונלית |
| `notify-worker` | מרוקנת את `ops.outbox`: שולחת אימייל לצוות (Resend), מסמנת `sent`, ניסיון חוזר עם backoff | false (secret בכותרת) | `pg_cron` כל דקה | `auth: 'secret'`. אידמפוטנטית לפי `outbox.id`. מחזירה `{processed, failed}` |
| `chat-bot` | בוט צ'אט ציבורי (הקיימים `finance-chat`, `noa-onboarding` מתמזגים) | false | דפדפן | `POST {session_id, message}`. הגבלה לפי session ו-IP בפונקציה, תקרת אורך הודעה, שרשרת fallback למודלים, זמן מקסימום 12 שניות |
| `fetch-cma-data` | טעינת נתוני רשות שוק ההון (data.gov.il) | false (secret) | `pg_cron` שבועי | upsert ל-`content.cma_funds`, כתיבה ל-`cma_sync_log`, קריאה ל-`content.refresh_fund_views()`. **כרון אחד** (לא שלושה) |
| `sync-tracks` | רענון `investment_tracks` | false (secret) | `pg_cron` שבועי | upsert לפי `fund_number` |
| `invite-agent` | יצירת משתמש צוות מוזמן | true + בדיקת `admin` בתוך הפונקציה | אפליקציית הסוכן | יוצרת משתמש, שורה ב-`core.staff`, שולחת הזמנה |
| `health` | בדיקת חיים: גרסה, בדיקת מסד, גיל נתוני התשואות | false | `site-watch` ו-Vercel | `GET` מחזיר `{ok, version, db, cma_age_days}` ללא סודות |
| `queue-worker` | (שלב ב׳, מערכת האירועים) | true/secret | cron | לפי `EVENT-ARCHITECTURE.md` |

תקנים לכל פונקציה:
- קוד משותף ב-`_shared`: `cors.ts` עם **רשימת מקורות מפורשת** (`https://seeld.co.il`, `https://www.seeld.co.il`, ופריוויו של הפרויקט בלבד), לא `*`; `errors.ts` (קודי שגיאה יציבים); `log.ts` (JSON מובנה עם `request_id`, בלי PII); `env.ts` (קריאת סודות עם בדיקת zod, נכשל בעלייה אם חסר).
- אימות לפי מצב `withSupabase`: `user` לפונקציות של צוות, `secret` לקריאות cron/worker, `none` רק ל-webhook חתום (svix/HMAC). `verify_jwt` מוגדר לכל פונקציה ב-`config.toml` ונבדק ב-CI שלא סטה.
- סודות בשמות רשמיים בלבד (סעיף 10). אסור `VITE_*` בשרת (תקלת `parse-import-file` ב-Tokyo).
- הגבלת קצב: במסד (`private.check_rate_limit`) ולא בזיכרון הפונקציה.
- אידמפוטנטיות: כל פעולה שיש לה תוצאת לוואי מקבלת מפתח (`Idempotency-Key` או `outbox.id`).
- גרסאות: imports נעולים (`npm:pkg@x.y.z`), Deno של Supabase Edge Runtime כפי שפורסם בתיעוד.
- אין פונקציות זמניות בפרוס (למשל `tmp-tiny-upload` ב-Tokyo) ו-CI בודק שרשימת הפרוס שווה לרשימת המאגר.

---

## 8. Storage

- **בעת ההקמה: אין buckets.** ב-Tokyo שני ה-buckets של האתר ריקים. פותחים רק כשיש תכונה.
- `client-documents` (פרטי, מגבלת 10MB, mime: pdf/jpg/png/heic): נתיב `<customer_id>/<uuid>.<ext>`. קריאה לצוות עם aal2 ולהלקוח לתיקיה שלו (`core.client_accounts.customer_id`). העלאה דרך signed upload URL שמונפק מ-RPC או function. הורדה רק ב-signed URL קצר (60 שניות).
- `site-assets` (ציבורי): רק תמונות בלוג אם נבחר להזיז אותן מ-`public/` של Vercel. עד אז לא נוצר.
- מדיניות storage נכתבות בקובץ מיגרציה, עם אינדקס על `bucket_id` ו-`name` אם צריך (תיעוד Storage Optimizations).

---

## 9. תזמון (`pg_cron`)

| שם | לוח | פעולה |
|---|---|---|
| `ops-cleanup` | כל שעה :17 | `ops.cleanup()`: מוחק `rate_limits` מעל יומיים, `outbox` שנשלח מעל 14 יום, `audit` מעל 400 יום, `cron.job_run_details` מעל 7 ימים (הלקח מ-Tokyo) |
| `cma-refresh-views-daily` | 03:15 UTC | `content.refresh_fund_views()` (רשת ביטחון, הטוען קורא לה גם אחרי סנכרון) |
| `cma-freshness-monthly` | 12 בחודש 04:30 UTC | `content.cma_check_freshness()` (תוקן: הערך `stale` מותר באילוץ) |
| `notify-worker-tick` (להוסיף עם הפונקציה) | כל דקה | `net.http_post` ל-`notify-worker` |
| `cma-sync-weekly`, `tracks-sync-weekly` (להוסיף) | ראשון 03:00 / 06:00 UTC | `net.http_post` |

קריאה ל-function מתוך cron: כתובת הפרויקט ומפתח secret נשמרים ב-**Vault** (`project_url`, `cron_secret_key`) והקריאה בונה את הכתובת והכותרת מהם. כך אין כתובת קשיחה ואין קריאה בלי הרשאה (תיקון פגמים 4 ו-3).

---

## 10. מצאי סודות (שמות בלבד)

| שם | איפה נשמר | מי משתמש | הערה |
|---|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | אוטומטי ב-Edge Functions | הפונקציות | עוברים בהדרגה למפתחות החדשים `publishable` / `secret` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Vercel (per environment) | בניית האתר | ציבוריים. **לא** ערכים בקוד כברירת מחדל |
| `SUPABASE_SECRET_KEY` (שם לוגי: `default`) | Supabase API keys + Vault (`cron_secret_key`) | cron, פונקציות worker | לעולם לא בדפדפן |
| `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY` | Edge secrets / Vercel | `lead-intake` | ממתין להחלטת בעלים |
| `RESEND_API_KEY`, `LEAD_NOTIFY_TO` | Edge secrets | `notify-worker` | `LEAD_CC_TRANSITION` ב-Tokyo לא מועבר |
| `GOOGLE_AI_API_KEY` | Edge secrets | `chat-bot` | תקרת הוצאה בצד הספק |
| `ALLOWED_ORIGINS` | Edge secrets | `_shared/cors.ts` | רשימה מופרדת בפסיקים |
| `VERCEL_TOKEN` | GitHub secret | רק אם משאירים פריסה מ-CI (לא מומלץ) | ADR-12 |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL` (session pooler) | GitHub secrets | CI: types, dump שבועי | ה-pooler כי GitHub Actions ללא IPv6 |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | GitHub secret | smoke על פריוויו מוגן | |
| `rate_limit_pepper` | `ops.config` (נוצר אקראית במיגרציה, ייחודי לכל סביבה) | `check_rate_limit`, `ip_hash` | לא בגיט |

כללים: סוד שנחשף מסתובב מיד; אין סודות ביומנים; אין קבצי `.env` בגיט; משתני Vercel מסוג Sensitive לכל מה שאינו `VITE_`.

---

## 11. תצורת Vercel

קובץ מוצע מלא: `docs/platform/vercel.proposed.json` (לא הוחל). שינויים מול הקובץ הקיים וההצדקה:
- `regions: ["fra1"]` ופונקציות `api/*.ts` עם `maxDuration: 10`: ליד Supabase Frankfurt (ברירת המחדל של Vercel היא `iad1`).
- כותרות Cache-Control: נכסי `/assets/*` immutable שנה (קיים). HTML: `max-age=0, must-revalidate`. תמונות וגופנים: יום עם stale-while-revalidate. `/api/*`: `s-maxage=300, stale-while-revalidate=3600`. הנתונים משתנים פעם בשבוע, ולכן מטמון CDN מוריד קריאות למסד.
- CSP: `connect-src` מצביע על הפרויקט החדש (כולל `wss`) ומוסיף `challenges.cloudflare.com` ל-`script-src` ו-`frame-src` עבור Turnstile. `'unsafe-inline'` נשאר (ADR-19). `permissions-policy` הורחב.
- `git.deploymentEnabled`: רק `main` מפורסם לפרודקשן.
- משתני סביבה לכל סביבה: Production, Preview (מצביע ל-staging או לענף), Development. משתני הלקוח `VITE_*` שונים בין Preview ל-Production.
- **צעדי דשבורד (בעלים):** Deployment Protection ב-Standard (מגן על פריוויו, לא על הדומיין), Web Analytics ו-Speed Insights, Firewall rate limit ל-`/api/*` (למשל 100 בדקה ל-IP), התראת Spend, `Instant Rollback` מוכן (כל deployment הוא Rollback candidate).
- **מסלול פריסה יחיד:** חיבור Git של Vercel. `deploy-vercel.yml` (פריסה מ-GitHub Actions ל-`--prod`) מוחלף או מוגבל ל-`workflow_dispatch` כדי למנוע פריסה כפולה (ADR-12).

---

## 12. CI/CD

קובץ מוצע: `docs/platform/ci.proposed.yml`.

| Job | מה בודק | מתי נכשל |
|---|---|---|
| `verify` | typecheck, lint, vitest, בניית prerender קשיח, בדיקת AEO, תקציב גודל חבילה | כל כישלון |
| `database` | `supabase db reset` (הרצה מאפס), `supabase test db`, `supabase db lint`, שם קובץ מיגרציה, סטיית טיפוסים | מיגרציה שלא עוברת מאפס, בדיקת pgTAP שנכשלה, טיפוסים לא מעודכנים |
| `supply-chain` | `npm audit` על תלויות פרודקשן, סריקת סודות | חולשה high ומעלה, סוד בגיט |
| `ci-ok` | אגרגציה: הבדיקה היחידה שחובה בהגנת הענף | אחד מהשלושה נכשל |
| `preview-smoke` (קובץ נפרד, `deployment_status`) | smoke על כתובת הפריוויו עם bypass | נתיב קריטי מחזיר שגיאה |

עוד: advisors (`security` ו-`performance`) מורצים אחרי כל מיגרציה בסביבת ההרצה הראשונה ומתועדים ב-PR. `dependabot` שבועי ל-actions ול-npm. בדיקה ידנית אחת לפני cutover: סריקת הכותרות (`securityheaders`) על הפריוויו.

---

## 13. תצפית והתראות

- **יומנים:** Supabase Logs (שימור לפי התוכנית), Vercel runtime logs. בדיקה שבועית של שגיאות 4xx/5xx של PostgREST.
- **בריאות פעילה:** `site-watch.yml` הקיים (כל 30 דקות, פותח issue) ממשיך, ומתעדכן להצביע גם על `health`.
- **התראות לבעלים:** `ops.outbox` עם `topic='alert'` ו-`notify-worker` שולח אימייל. מקורות התראה: כישלון cron (`cron.job_run_details` שאינו `succeeded`), `cma_sync_log.status in ('error','stale')`, יותר מ-5 הודעות `rate_limited` בשעה, outbox `pending` ישן מ-15 דקות. מסך סטטוס פנימי לצוות הוא תכונה עתידית בתוך אפליקציית הסוכן (`OPS-CONSOLE.md`), לא פרויקט נפרד.
- **Disk IO:** המדד אינו חשוף ל-API, ולכן בדיקה ידנית שבועית ב-Observability, והתראה על CPU/זיכרון בדשבורד. כלל: עומס כתיבה חדש (טעינה גדולה) רץ בלילה ובקבוצות.
- **עלות:** Spend Cap פעיל, התראות חשבון.

---

## 14. גיבוי ושחזור

- Pro כולל גיבוי יומי. **PITR לא מופעל עכשיו** (ADR-14): נתוני ה-hot הם אלפי שורות ומקור התשואות ניתן לטעינה מחדש.
- **dump שבועי** (`pg_dump` דרך GitHub Action ידנית/מתוזמנת, חיבור session pooler), מוצפן, נשמר באחסון פרטי של הבעלים. תוכן: `crm`, `core`, `content` (ללא matviews).
- **תרגיל שחזור חודשי (30 דקות):** יצירת ענף זמני, טעינת ה-dump, הרצת `supabase/tests` ובדיקת ספירות מול `MANIFEST`. קריטריון: כל הבדיקות ירוקות. נרשם ב-`RUNBOOK.md`.
- שחזור לפרודקשן: החלטת בעלים בלבד; רשומה ב-`audit` על מי הוציא.

---

## 15. רשימת בדיקה לאבטחה

מסומן כשהוא מכוסה בבדיקה אוטומטית (קובץ:בדיקה).

- [x] RLS פעיל בכל טבלה בסכמות מנוהלות (01:1)
- [x] אין TRUNCATE/REFERENCES/TRIGGER ל-anon/authenticated (01:2)
- [x] anon בלי גישה לסכמות פרטיות (01:3), לא יכול לקרוא leads/staff/audit (02)
- [x] אין `USING (true)` בנתונים פרטיים (01:4)
- [x] כל מדיניות עם `TO` מפורש (01:5)
- [x] עטיפת `(select ...)` בכל קריאת helper (01:6)
- [x] כל definer נעול ב-search_path (01:7)
- [x] anon מריץ רק `api.submit_lead` (01:8)
- [x] `api` מכילה views ופונקציות בלבד, כולם invoker (01:9, 01:10)
- [x] סוכן ללא TOTP לא רואה לידים (02:22), סוכן מושבת מאבד גישה מיד (02:38)
- [x] סוכן לא יכול לשכתב זהות/הסכמה/מחיקה קשה (02:28-30)
- [x] ולידציה, honeypot, idempotency והגבלת קצב ל-`submit_lead` (03)
- [x] audit ללא PII ו-append-only (03)
- [ ] הרשמה כבויה, מינימום סיסמה, MFA (דשבורד, סעיף 21)
- [ ] `api` ברשימת Exposed schemas בלבד (דשבורד)
- [ ] Turnstile ו-Origin allowlist ב-`lead-intake` (יום 2)
- [ ] Deployment Protection, firewall, חוק הגנת ענף (דשבורד)
- [ ] סיבוב מפתחות ותרגיל שחזור ראשון (יום 5)
- [ ] עדכון CSP (נפרס עם ה-cutover)

---

## 16. מודל עלויות (הערכה חודשית)

מחירי מחשוב מתוך `compute-and-disk` (נקרא): Micro כ-$10, Small כ-$15, Large כ-$110 לחודש. מחירים אחרים מסומנים "לאימות".

| פריט | הערכה | הערות |
|---|---|---|
| Supabase Pro (ארגון) | $25 | כולל קרדיט מחשוב $10 (לאימות מול החשבון) |
| מחשוב `seeld-site` | Micro $10 מכוסה בקרדיט, Small $15 (נטו $5 מעבר לקרדיט) | להתחיל ב-Micro. מעבר ל-Small אם Disk IO או זיכרון בלחץ (פי 2 בקצב קבוע) |
| ענף staging | כ-$0.01/שעה לכל ענף Micro (כ-$10 לחודש אם עמיד) | רק בימי ה-cutover, ואז נמחק |
| Vercel Pro | $20 למושב (לאימות מספר מושבים) | Hobby אינו מיועד לשימוש מסחרי |
| Resend | חינם עד מכסה נמוכה | מספיק ללידים והתראות |
| Cloudflare Turnstile | חינם | |
| SMS ללקוחות | לפי הודעה, ספק ישראלי | רק בשלב לקוחות |
| PITR (לא מופעל) | כ-$100 לחודש (לאימות) | נדחה |
| **סה״כ צפוי** | **כ-$45 עד $75 לחודש** | Supabase $25-30, Vercel $20-40, ענפים לפי שימוש |

לאן הכסף הולך: מחשוב מסד קבוע (לא יורד), מושבי Vercel, ובמידה כלשהי תעבורה (Egress) שמטופלת ע"י מטמון CDN. מה שמעלה עלות בלי הודעה: ענף עמיד שנשכח, ענפי preview פתוחים, הגדלת דיסק. לכן ההתראה והכלל "ענף נמחק אחרי cutover".

---

## 17. מה לא בונים עכשיו (רשימה מפורשת)

1. פורטל לקוחות מלא, שאלונים, דוחות (`CLIENT-PORTAL-PLAN.md`, `QUESTIONNAIRES.md` נשארים הצעות).
2. מערכת האירועים המלאה (pgmq, `queue_*`, workbench, metrics). ה-outbox הקטן מספיק עד לשלב ב׳.
3. PITR, read replica, מופע גדול מ-Small.
4. GraphQL, Realtime לתוכן, Presence.
5. התחברות חברתית.
6. הצפנת עמודות ברמת מפתח לכל לקוח (ה-HMAC לת.ז. ב-06 יאומץ בשלב ב׳).
7. Schema declarative (ADR-15).
8. אנליטיקה בבסיס נתונים (`page_views`): משתמשים ב-Vercel Web Analytics.
9. מיגרציה של נתוני CRM ו-Surense (סעיף 18.4).
10. סביבת staging עמידה.
11. ויטרינה של A/B, feature flags מורכבים.
12. אוטומציות Make/n8n חדשות.

---

## 18. מעבר מ-Tokyo

### 18.1 טבלה: מה עובר, נבנה מחדש, נארכב או נמחק (36 טבלאות האתר)

| טבלה (שורות ב-Tokyo) | החלטה | יעד / שיטה | המלצה |
|---|---|---|---|
| `blog_posts` (22) | **עובר** | `content.blog_posts`, מ-`data/` (יש `MANIFEST`), רק `status=published` עם `published_at` | טעינה בסקריפט, בדיקת ספירה ו-md5 |
| `investment_tracks` (571) | **נבנה מחדש** | `sync-tracks` טוען מהמקור. ייצוא ב-`data/` כגיבוי | טעינה ראשונית מהייצוא |
| `cma_funds` (39,614) | **נבנה מחדש** | `fetch-cma-data` מ-data.gov.il (`raw_data` לא מועבר) | טעינה מהמקור, לא מ-dump |
| `cma_sync_log` (133) | **מתחילים נקי** | יומן חדש. הישן נשמר כ-JSON | |
| `cma_funds_latest`, `cma_board`, `cma_company_map` | **נבנה מחדש** | matviews ב-`content` | `refresh_fund_views()` |
| `insurance_leads` (2), `pension_analysis_leads` (0), `contact_submissions` (0), `onboarding_submissions` (0) | **עובר (רק 2 לידים)** | `crm.leads` (`consent_at=created_at`, `consent_version='legacy-v0'`) | dump חד-פעמי ע"י הבעלים, פלט CSV, ללא העברה דרך הצ'אט |
| `page_views` (3,359) | **נמחק (לאחר ארכוב)** | Vercel Web Analytics. ארכיון פרטי של הבעלים | נתוני גולשים, ערכם נמוך |
| `chat_conversations` (6), `chat_messages` (8) | **נמחק** | צ'אט חדש עם שימור 90 יום כשייבנה | שיחות ניסיון, אישי |
| `profiles` (6), `agencies` (0), `agency_invitations` (0) | **נבנה מחדש** | `core.staff` בהזמנה. אין העתקה של `auth.users` | שלושה משתמשים בלבד (בעלים וסוכנים), שאר החשבונות לא יועברו |
| `customers` (191), `products`, `recommendations`, `recommendation_summaries`, `execution_*`, `customer_messages`, `client_access_links`, `source_files`, `import_*`, `activity_log`, `reasoning_bank` | **נבנה מחדש בשלב ב׳** | מערכת הלקוחות ומערכת האירועים. הרשומות נטענות מהמקור (לא מ-dump של טבלת האתר) | אין העתקה של PII ישן. dump פרטי בארכיון הבעלים עד שהמערכת החדשה עולה |
| `saved_calculations`, `user_policies`, `insbase_links` (טוקנים!) | **נמחק / נבנה כשיש תכונה** | טוקני OAuth לא מועברים לעולם, חיבור מחדש | |
| `correction_*`, `deficiency_*`, `pdage_*` (0) | **נמחק** | כלי תיקון (תכונה עתידית, אם תחזור) | |
| enum `pension_product_type`, ייחוס ל-`pdage_customers`, פונקציית `tmp-tiny-upload` | **נמחק** | לא מועברים | |
| Cron של האתר (7) | **נבנה מחדש** | `cma-refresh-views-daily`, `cma-freshness-monthly` (הוקמו), `cma-sync-weekly`, `tracks-sync-weekly` (עם הפונקציות). שלושת הסנכרונים הכפולים הופכים לאחד | |

### 18.2 נקודות מגע בקוד וב-Vercel (לריצת ה-cutover)

`src/integrations/supabase/config.ts` (הסרת ברירות המחדל והצבעה על `db.schema='api'`), `api/board.ts`, `api/company-map.ts`, `api/fund-status.ts`, `api/funds.ts`, `api/tracks.ts`, `scripts/prerender.mjs` (כתובת הפרויקט החדשה, קריאה מ-`api.blog_posts`), `vercel.json` (CSP כולל `wss`, `regions`), כתובות `net.http_post` בקרונים (מוחלפות ב-Vault), `supabase/config.toml` (`project_id`), משתני Vercel `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. מערכות חיצוניות: הקוד של האתר יפסיק לקרוא ל-Tokyo לגמרי. Surense/Make ורכיבים אחרים שייכים למוצרים אחרים ולא נוגעים בהם בהליך הזה.

### 18.3 Runbook: cutover ו-rollback

**לפני (יום 4):**
1. מיגרציות על `seeld-site` ירוקות, 82 בדיקות עוברות, advisors נקי.
2. טעינת נתונים: `blog_posts` (22), `investment_tracks` (571), `cma_funds` דרך `fetch-cma-data` או מהייצוא. אימות: ספירות שוות ל-`MANIFEST_public.json` (22, 571, 39,614), `select content.refresh_fund_views()`, ו-`api.cma_board` = 1,257 ו-`api.cma_company_map` = 120 כמו ב-Tokyo.
3. צעדי דשבורד 1-8 הושלמו (סעיף 21), Turnstile פעיל.
4. פריוויו עם `VITE_*` חדשים: smoke מלא (דף בית, בלוג, לוח תשואות, כל הטפסים, מסלולים, נסיעות). שליחת ליד בדיקה ומעקב עד אימייל התראה.
5. הכנת ה-PR של cutover (כל נקודות המגע בסעיף 18.2) ללא מיזוג.

**ביצוע (יום 5, מחוץ לשעות עומס):**
1. עדכון משתני Production ב-Vercel, מיזוג ה-PR (Vercel פורס אוטומטית).
2. בדיקות עשן על `seeld.co.il`: `health`, ליד בדיקה, בלוג, לוח.
3. הפעלת cron של הסנכרון בפרויקט החדש. ב-Tokyo **לא** נוגעים (נשאר כמות שהוא).
4. ניטור 60 דקות: Vercel runtime errors, `ops.outbox` ללא `pending` ישן, Supabase logs.

**Rollback (אם משהו נכשל עד 24 שעות):**
1. `Instant Rollback` ב-Vercel לפריסה הקודמת (שניות). שינוי משתני הסביבה חזרה (שמורים בשורת מעקב).
2. הלידים שנקלטו ב-`crm.leads` בחלון: ייצוא ל-CSV והזנה ידנית לזרימה הישנה. אין איבוד נתונים כי המסד החדש נשאר.
3. Tokyo נשאר פעיל ובלתי משתנה עד 30 יום אחרי cutover יציב. רק אז החלטת בעלים על כיבוי.

### 18.4 מה לא עובר

נתוני CRM וניהול תיק של הסוכנות שנמצאים ב-Tokyo (הטבלאות הפרטיות של הסוכנות ומערכות אחרות): ארכוב פרטי על ידי הבעלים לפני מחיקת Tokyo; לא מועברים לשום מערכת חדשה.

---

## 19. תוכנית ימים: חלוקה בעלים וסוכנים, עם בדיקות קבלה

| יום | משימה | מבצע | בדיקת קבלה |
|---|---|---|---|
| 1 (בוצע) | יסוד מסד: 8 מיגרציות, 82 בדיקות, advisors, מסמך זה, קבצי Vercel/CI מוצעים | סוכן-ארכיטקט | `bash supabase/tests/replay-local.sh` יוצא 0 עם 82 ok; `get_advisors` ריק |
| 1 | צעדי דשבורד 1-6 (סעיף 21) | בעלים | `select api.me()` עובד עם מפתח publishable על `schema api`; הרשמה חדשה נדחית |
| 2 | שכבת נתונים באתר: לקוח אחד עם `db.schema='api'`, `api/*.ts`, `prerender.mjs`, טיפוסים | סוכן-פרונט | ספירות ב-preview שוות ל-18.3 (22/571/1,257/120); `tsc` נקי; prerender חזר עם 87 נתיבים |
| 2 | `lead-intake`, `notify-worker`, Turnstile, `_shared` | סוכן-Edge | ליד אמיתי מגיע לאימייל פעם אחת; בקשה מקור זר = 403; 9 בקשות רצופות = 429; בדיקת Deno |
| 2 | הפעלת CI המוצע, הגנת ענף, Deployment Protection | סוכן-CI + בעלים | PR שמפיל בדיקת pgTAP נחסם; פריוויו מחייב כניסה |
| 3 | טעינת נתונים (`blog`, `tracks`, `cma`) וסקריפט אימות מול MANIFEST | סוכן-נתונים | ספירות ו-md5 תואמים; `cma_check_freshness()` רץ בלי שגיאת אילוץ |
| 3 | הזמנת סוכנים, TOTP, בדיקת תפקידים בפועל | בעלים + סוכן-Edge | סוכן ללא TOTP רואה 0 לידים; עם TOTP רואה |
| 4 | חזרת cutover על staging, תרגיל שחזור, סריקת כותרות | כולם | רשימת 18.3 "לפני" מסומנת |
| 5 | Cutover + ניטור + סגירת staging | בעלים + סוכן-CI | `site-watch` ירוק 24 שעות; אפס `pending` ישן ב-outbox |
| 6+ | שלב ב׳: מערכת לקוחות ואירועים (`proposed/06-09`) | לפי החלטה | ראו 5.5 |

---

## 20. החלטות (ADR)

**ADR-1 סכמה חשופה אחת (`api`).** הקשר: ב-Tokyo הכול ב-`public` עם ALL לתפקידי API. נבחר: טבלאות בסכמות לא חשופות, views ו-RPC ב-`api`. חלופות: טבלאות ב-`public` עם RLS (המוסכמה הרגילה), סכמה לכל מוצר חשופה. נימוק: משטח התקיפה הוא הרשימה הסגורה, הוספת טבלה בטעות לא חושפת אותה, ושמות ה-views זהים לישנים (חילוף הלקוח הוא הגדרה אחת). מחיר: צריך להגדיר Exposed schemas בדשבורד, ופקודות כמו `supabase.schema('api')` בלקוח. Advisor בודק רק סכמות חשופות, לכן אחרי החשיפה תופיע אזהרת `submit_lead` (חריג מתועד).

**ADR-2 הרשאות מטבלה ולא מ-JWT hook.** חלופה: Custom Access Token Hook שמכניס `user_role`. נימוק: שני משתמשי צוות, ביטול מיידי חשוב יותר מחיסכון בשאילתה אחת (שמבוצעת פעם בשאילתה בזכות initPlan), ו-hook הוא עוד חלק נע בדשבורד. מחיר: שאילתה קטנה לכל בקשה.

**ADR-3 `aal2` נאכף ב-RLS.** חלופה: אכיפה בלקוח בלבד. נימוק: פרטיות לקוחות פיננסיים; הגנה גם נגד סיסמה שדלפה. מחיר: סוכן חייב להירשם ל-TOTP לפני העבודה הראשונה.

**ADR-4 טבלת לידים אחת (`crm.leads`).** חלופה: טבלה לכל טופס כמו ב-Tokyo (3). נימוק: תיבת נכנסים אחת, חוק ולידציה אחד, ואין עמודות מיותרות; ייחודיות הטופס שמורה ב-`payload` מוגבל גודל. מחיר: סכמת payload נבדקת באפליקציה.

**ADR-5 קליטת לידים: RPC עכשיו, Turnstile בקצה אחרי.** חלופה: רק דרך Edge Function מההתחלה. נימוק: ה-RPC מפעיל את כל ההגנות במסד (ולידציה, rate limit, idempotency, honeypot) ועובד בלי תלות ב-Deno; Turnstile נוסף כחזית ובאותו רגע מבטלים הרצה ל-anon בשורת SQL אחת. מחיר: בחלון קצר ההגנה מבוססת IP ו-honeypot בלבד.

**ADR-6 outbox עסקתי במקום pgmq כרגע.** נימוק: טבלה אחת שנכתבת באותה עסקה, worker של עשרות שורות, ואין תלות בהרחבה. מחיר: כשיגיעו תורי ההזמנה/סדר לפי לקוח (06), מחליפים.

**ADR-7 `uuid` v4.** חלופות: uuidv7 (Postgres 18), `bigint`. נימוק: Postgres 17, אלפי שורות, בלי צורך במיון לפי זמן במפתח.

**ADR-8 `text`+`check` במקום enum.** שינוי ערך ב-enum דורש מיגרציה מורכבת ו-Tokyo נשאר עם enum שאינו בשימוש. אילוץ check מוחלף בשורה.

**ADR-9 מחיקה רכה ו-audit בלי ערכי PII.** נימוק: אפשר לדעת מי שינה מה ומתי בלי לשכפל תעודות זהות ליומן.

**ADR-10 matviews פרטיים עם פונקציית רענון.** matview אינו תומך ב-RLS ו-Advisor מזהיר על חשיפה, לכן הם ב-`content` וה-view ב-`api` קורא אותם. ריענון: פונקציה אחת שהטוען קורא לה, ועוד cron יומי.

**ADR-11 staging.** חלופות: פרויקט שני קבוע, ענף עמיד, בלי staging. נבחר: ענפים זמניים ל-PR, ענף staging עמיד רק לחזרת cutover. נימוק: שני אנשים, עלות ($10) ותחזוקה של סביבה שלישית שאיש לא מסתכל עליה.

**ADR-12 מסלול פריסה יחיד + CI חובה.** נימוק: פריסות פרודקשן יוצאות מ-`main` בלי לחכות ל-CI; ובנוסף קיים workflow שגם מפרסם ל-`--prod`. נבחר: חיבור Git של Vercel + הגנת ענף שדורשת `ci-ok`. חלופה: פריסה רק מ-GitHub Actions אחרי CI (שליטה מלאה, אך אובדן preview אוטומטי).

**ADR-13 אזור `fra1`.** הפונקציות קרובות ל-Frankfurt; השהיית משתמשים בישראל נקבעת ב-CDN (סטטי).

**ADR-14 בלי PITR.** נימוק: עלות כ-$100 לחודש מול נתוני hot קטנים, גיבוי יומי, dump שבועי ותרגיל שחזור. מתי לשנות: כשמתחילים לשמור מסמכי לקוח ושאלונים.

**ADR-15 מיגרציות קדימה ולא declarative.** נימוק: הצוות והסוכנים כותבים SQL ישיר, ל-declarative יש עקומת למידה והמיגרציות כבר מוכחות.

**ADR-16 פונקציות Vercel לקריאה ציבורית בלבד.** `api/*.ts` נשארות כמטמון CDN מול PostgREST (מסתירות את המקור ומורידות עומס), בלי כתיבה.

**ADR-17 Micro כנקודת פתיחה.** כי הנתונים קטנים, והעומס הכבד (טעינת 39k שורות) רץ בלילה. נקודת החלטה: Small כש-Disk IO או זיכרון בלחץ.

**ADR-18 הוכחת הרצה בקונטיינר ולא רק ב-CLI.** תמונת `supabase/postgres` נעולה גרסה, מאפשרת בדיקה בלי תלות בשירותי Auth, ושוחזרה בפועל (נספח א).

**ADR-19 CSP עם `'unsafe-inline'`.** נשאר כי prerender מזריק סקריפטים ו-JSON-LD. עתידי: nonce/hash.

**ADR-20 טיפוסים מסכמת `api`** נבדקים ב-CI מול `gen types` כדי למנוע סטייה.

---

## 21. צעדים ידניים של הבעלים (דשבורד; אני לא משנה הגדרות אבטחה)

פרויקט `seeld-site` (Supabase):
1. Settings > API > **Exposed schemas**: להשאיר `api` בלבד (להסיר `public` ו-`graphql_public`). `Extra search path`: `extensions`.
2. Authentication > Providers: לכבות הרשמות (Allow new users to sign up = off), לכבות Google ו-Facebook, Email: Confirm email = on, אורך סיסמה 12 ומעלה, סיסמאות דליפות (HIBP) = on.
3. Authentication > MFA: TOTP = enabled.
4. Authentication > SMTP: חיבור Resend (אחרת 2 הודעות לשעה). תבנית אימייל של OTP בעברית.
5. Authentication > URL Configuration: `Site URL=https://seeld.co.il`, Redirect: `https://seeld.co.il/**`.
6. Authentication > Rate limits: לאשר ברירות מחדל (30 לשעה ל-SMS, 30 ל-5 דקות להרשמה/כניסה).
7. Settings > API Keys: ליצור מפתח secret בשם `default`, לשמור ב-Vault את `project_url` ו-`cron_secret_key` (SQL: `vault.create_secret`). לא לשלוח אלי את הערכים.
8. Settings > Infrastructure: לאשר Micro, להגדיר התראות על שימוש. Auth: מעבר ל-"percentage" לחיבורי DB (המלצת advisor).
9. אישור להעביר לארכיון את `supabase/migrations/2026020*`..`20260917*` (מיגרציות Tokyo) כך ש-`supabase db reset` ירוץ רק על הבסיס החדש.

Vercel (פרויקט `seeld`):
10. Settings > Deployment Protection: Standard Protection.
11. Settings > Firewall: Rate limit ל-`/api/*`.
12. Analytics ו-Speed Insights: להפעיל.
13. Git: לוודא שרק Git integration מפרסם; להסיר/להגביל את `deploy-vercel.yml`.
14. Environment Variables (בזמן cutover, לא קודם): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` ל-Production ול-Preview (Preview על staging).

GitHub:
15. Branch protection על `main`: דרישת `ci-ok`, אין push ישיר, סקירה. Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`.

החלטות לבעלים: (א) האם האפליקציה/הפורטל של הסוכנים (`/app`, `/portal`, `/client`, `/personal-area`) ממשיכים לרוץ מול Tokyo עד שייבנו מחדש (ההמלצה: ממשיכים, עם תאריך סיום מוגדר) או מושבתים עד אז. (ב) ספק SMS. (ג) האם לשמור Google לשלושה משתמשים (ההמלצה: לא). (ד) תוכנית Vercel ומספר מושבים.

---

## נספח א: ראיות ההרצה (18.11.2026)

- מיגרציות שהוחלו על `seeld-site` לפי הסדר: `20261118162452_foundation_extensions_schemas`, `162507_foundation_identity_audit`, `162614_foundation_ops`, `162630_foundation_content`, `162656_foundation_fund_views`, `162717_foundation_crm_leads`, `162719_foundation_api_layer`, `162856_foundation_explicit_deny`. אותם קבצים ב-`supabase/migrations/`.
- הרצה מאפס בקונטיינר `supabase/postgres:17.6.1.178` (`supabase/tests/replay-local.sh`): 8 מיגרציות עברו, 82 בדיקות `ok`, 0 `not ok`, קוד יציאה 0. פלט שמור: `C:/tmp/infra/foundation/replay-result.txt`.
- אותן 82 בדיקות הורצו על `seeld-site` (הרחבת pgTAP זמנית ונמחקה, כל הבדיקות בעסקה שבוטלה): 12/12, 38/38, 32/32. לא נשארו שורות (`auth.users`, `crm.leads`, `audit.log`, `ops.outbox` = 0).
- `get_advisors`: security ריק (לפני הוספת מדיניות deny מפורשת: 4 הערות INFO על טבלאות ללא מדיניות), health ריק, performance: 10 הערות `unused_index` (טבלאות חדשות ללא תעבורה, צפוי) והערת `auth_db_connections_absolute` (הגדרת דשבורד).
- cron בפרויקט: `ops-cleanup`, `cma-refresh-views-daily`, `cma-freshness-monthly`.
- טיפוסים: `docs/platform/types.generated.ts` (המחולל מייצר רק `public`, ריק בכוונה; פקודת היצירה האמיתית כתובה בקובץ).
- איפוס `seeld-site` לפני הבנייה: נמחקו 36 טבלאות סקראץ׳, 2 matviews ו-view אחד, 11 פונקציות, 2 enums, 81 מדיניות, ו-7 רשומות היסטוריית מיגרציות. הפרויקט היה ריק מנתונים.

## נספח ב: תיקון פגמי Tokyo (כל סעיף הוא בדיקה)

| פגם | תיקון בבסיס | הוכחה |
|---|---|---|
| 1. `USING (true)` חושף סיכומי ביצוע והגשות onboarding | אין טבלאות כאלה ב-`crm`/`core`. מדיניות `true` מותרת רק לתוכן ציבורי (`cma_sync_log`) | 01:4 |
| 2. ALL privileges ל-anon/authenticated | grants מפורשים, ללא TRUNCATE/REFERENCES/TRIGGER, default privileges מבוטלים | 01:2 |
| 3. `send-lead-notification` פתוחה ושולחת אימייל | כתיבה דרך RPC עם הגבלות; `notify-worker` מופעלת רק עם secret; Turnstile ב-`lead-intake` | 03 |
| 4. cron עם כתובת קשיחה ובלי אימות, שלושה סנכרונים זהים | Vault, מפתח secret, cron אחד | סעיף 9 |
| 5. `stale` נדחה ע"י ה-CHECK | `stale` מותר | 01:12 |
| 6. `VITE_*` כסודות שרת | שמות סודות רשמיים ובדיקת `env.ts` | סעיף 7, 10 |
| 7. סטיית `config.toml` | `verify_jwt` לכל פונקציה בקובץ ונבדק ב-CI | `config.proposed.toml` |
| 8. FK כפולים, enum לא בשימוש, `pdage_customers`, פונקציה זמנית | לא הועברו; מדיניות "אין פונקציה בפרוס שאינה במאגר" | סעיף 18.1 |
