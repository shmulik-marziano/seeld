# יסודות הפלטפורמה של SEELD: אתר, Supabase, Vercel, CI

מצב: 18.11.2026, **גרסה 2.2** (אחרי שתי סקירות עוינות ושני סבבי תיקון). זה המסמך הקובע. הוא נשען על `ARCHITECTURE.md`, `EVENT-ARCHITECTURE.md`, `RUNBOOK.md` ו-`OPEN-DECISIONS.md`. המחקרים נמצאים ב-`docs/platform/research/`, וסינתזת הפאנל ב-`DESIGN-PANEL.md`.

**מה קיים ומאומת:** הפרויקט `seeld-site` (Frankfurt, `qxhpolktdfgcbxtfxgov`) עם 8 מיגרציות `20261118*` שהוחלו, ו-82 בדיקות pgTAP ירוקות. גרסה 2.2 מוסיפה **15 מיגרציות קדימה** (`20261119090000`..`20261119091400`), וטרם הוחלה אף אחת מהן על פרויקט מתארח. את 8 המיגרציות שהוחלו לא עורכים לעולם. 14 הראשונות הוחלו בקונטיינר נקי אחרי ה-8, ו-`00_policy_lint` (21/21) ובדיקת העשן ההתנהגותית (26/26) עברו (נספח א). `20261119091400` (תיקוני סבב 2) עוד לא הורצה בקונטיינר. את זה מאמת T0.

**מצב המאגר (`origin/main`, אומת 18.11 22:03):** הקומיט `cb5af5e` כבר ביצע את הארכוב באישור הבעלים. 42 מיגרציות Tokyo, 17 תיקיות פונקציות (כולל `pdage-chat`) ו-`config.tokyo.toml` נמצאים עכשיו ב-`supabase/_archive_tokyo/`. ב-`supabase/migrations` נשארו רק 8 קבצי היסוד. ב-`supabase/functions` נשארו `_shared`, `api-v1` ו-`queue-worker`. אלה שלדי הפלטפורמה החדשה ולא קוד Tokyo, ויש להם בדיקות ב-`src/test`. `supabase/config.toml` הוחלף בקובץ ביניים, שעדיין לא תואם למסמך הזה (§4).

**הגדרות שהמתאם כבר ביצע בדשבורד של `seeld-site`:**
- Exposed schemas = `api` בלבד, עם `max_rows=200`.
- הרשמה כבויה.
- סיסמה של 12 תווים לפחות, עם אותיות קטנות וגדולות, ספרות וסימנים, והגנת סיסמאות שדלפו.
- TOTP פעיל.
- Site URL = `https://seeld.co.il`.
- כתובות Redirect: `https://seeld.co.il/**` ו-`https://www.seeld.co.il/**`.

**החלטות בעלים (18.11):**
- 191 הלקוחות של Tokyo מועתקים מוצפנים: HMAC לת.ז. ועמודה מוצפנת.
- אפליקציית הסוכנים נבנית מחדש בהמשך.
- מודול PDage נמחק מהמאגר.
- ל-`investment_tracks` יש מנגנון רענון אוטומטי אמיתי.
- לבעלים יש חשבון Cloudflare ל-Turnstile.

**חוקים קשיחים:** אין התחברות חברתית לעולם; אין מידע אישי תועה; המערכת משעממת לתפעול.

---

## שינויים בגרסה 2

| # | מה | איפה |
|---|---|---|
| 1 | הארכוב **בוצע** (`cb5af5e`). נשארו החלטה על `api-v1` ו-`queue-worker`, והחלפת `config.toml` הביניים בקובץ המוצע ב-PR הראשון של v2 | §4, §12, ADR-38 |
| 2 | **חוסם:** `api.submit_lead(p_payload, p_idem_key, p_client_ip)` ל-`service_role` בלבד. `p_client_ip` חובה. `api.lead_replay` (קריאה בלבד) רץ לפני Turnstile. מפתחות ה-payload סגורים לפי `kind` | §7, ADR-21 |
| 3 | **חוסם:** 14 RPC שירות ב-`api`, ל-`service_role` בלבד | §5.1, ADR-22 |
| 4 | **חוסם:** `ops.call_function`/`ops.http_invoke` עם Vault (`project_url`, `edge_cron_secret`), timeout של 5 שניות, חוזה 202, ומתג `edge_cron_enabled` | §9, ADR-25 |
| 5 | **חוסם:** outbox v2 עם נעילה, backoff של 1/5/30 דק' ו-2 ש', ומצב `dead` אחרי 5 ניסיונות. התראה שלא נמסרה עוברת ל-`undeliverable` | ADR-26 |
| 6 | `staff-invite` מחליפה את `invite-agent`: הזמנה, שליחה חוזרת, השבתה עם חסימה, והפעלה מחדש עם ביטול החסימה | §7 |
| 7 | PII של לידים נקרא **רק** דרך `staff.leads_list`/`staff.lead_get`, שכותבים ל-`audit.access_log`. כתיבה עוברת דרך `staff.lead_*` | ADR-23, ADR-34 |
| 8 | אין DELETE לתפקידי API על תוכן | ADR-23 |
| 9 | `agency_id` משמש גבול בכל policy | ADR-24 |
| 10 | עזרים: `private.flag`, `kill_switch`, `assert_staff`, `assert_admin_fresh`, `log_access`, `caller_ip` | §5.1 |
| 11 | hook `before_user_created` (סגל בלבד) + `core.invitations` | ADR-29 |
| 12 | watchdog עם צעדים מבודדים. `api.health.degraded` משמש ערוץ עוקף | §13, ADR-27 |
| 13 | 5 משימות cron במקום 7. הרענון רץ בצעד `cma_refresh` | ADR-28 |
| 14 | שימור | §9, ADR-34 |
| 15 | IP של הלקוח | ADR-35 |
| 16 | `investment_tracks` אוטומטי מ-data.gov.il | ADR-36 |
| 17 | `public` אטום | ADR-39 |
| 18 | `00_policy_lint` קטלוגי | §15 |
| 19 | מחשוב Small | ADR-33 |
| 20 | סשנים: 12 ש' לסשן, שעה של חוסר פעילות, JWT של 15 דק' | ADR-32 |
| 21 | `crm.customers` מוצפן | ADR-41 |
| 22 | PDage נמחק. טפסים שאוספים ת.ז. או חשבון בנק כבויים | ADR-42 |
| 23 | `max_rows=200` | ADR-43 |
| 24 | סודות מסד ב-GitHub רק ב-Environment מוגבל, בלי repository secrets | §10, §12, ADR-44 |

### תיקוני סקירה (סבב 1)

סקירת תפעול (O) וסקירת אבטחה (S). הפירוט המלא נמצא ב-`changes_applied`.

- **timeouts ו-cron (O-B1/F1, O-F16):** timeout של 5 שניות; תשובת 202 ועבודה ב-`waitUntil`; סיום רק ב-`api.job_finish`; `cron_http_audit` סופר רק סטטוס `>=400` או שגיאת חיבור; `job_continue`.
- **outbox (O-B2/F2):** אזעקה רק על שורה באיחור.
- **watchdog (O-B3/F3, S-F9):** בלוק חריגה לכל צעד; שורת `ops-watchdog`; `degraded`; `site-watch`.
- **intake (O-B4/F4, S-F16):** `intake_rejects` ו-`intake_near_cap`.
- **סוכנות (O-B5/F5, S-F1):** `staff_select` ו-`client_accounts_select`.
- **נעילה (O-B6/F6, S-B8, S-F2, S-F10, O-F18):** אדמין לא ננעל; נעילה רק מ-2 מקורות IP; מופעלת רק אחרי אימות; break-glass.
- **חוקי בעלים (O-B7/F7, S-B3, S-B9, S-B10):** אין Google; §18.4; אין dump פרטי; allowlist ל-payload.
- **רישום גישה (O-B8/F8, S-B5, S-F17):** RPC שרושם גישה; projection מצומצם.
- **max_rows (O-B9/F9, S-F4):** 200, וספירות ב-`count=exact`.
- **CI (O-B10/F10, S-B1, S-B2, S-B4):** סדר בלי נעילה הדדית (בסבב 2 הוחלף, כי הארכוב כבר בוצע).
- **הזמנות (O-B11/F11, S-F18):** תוקף 24 ש' ושליחה חוזרת.
- **idempotency (O-B12/F12):** replay לפני Turnstile.
- **בדיקות (O-F13, O-F14, S-F6, O-F20, S-F12, S-F15):** 02, 03, lint, 07, `replay-local.sh`.
- **Vercel (O-F15, S-F14, S-F13):** Node; CSP; Preview.
- **עמידות ועובדות (O-F17, O-F19, S-B6, S-B7, S-B11, S-B12, S-F3, S-F5, S-F7, S-F8, S-F11, S-F19, S-F20):** תוקנו כמתואר בגרסה 2.1.

### תיקוני סקירה (סבב 2)

- **מצב המאגר (A-B1, B-B1):** הארכוב בוצע ב-`cb5af5e`, ולכן §4, §12, §21, ADR-38 ונספח ד נכתבו מחדש לפי המצב בפועל.
  - **`api-v1`/`queue-worker`:** נדרשת החלטת בעלים פרטנית. ההמלצה היא להעביר אותם ל-`supabase/_parked/` יחד עם הבדיקות שלהם.
  - **`_shared`:** נשאר ומורחב.
  - **בדיקת allowlist:** "אין תיקייה מחוץ לרשימה" (הכלה ולא שוויון).
  - **`config.toml`:** הביניים מוחלף בקובץ המוצע ב-PR הראשון.
  - **CI:** בלי שלבים. השערים מלאים מה-PR הראשון של v2, והגנת ענף מופעלת אחרי שהוא ממוזג ירוק.
  - **מחיקת `pdage-chat` מהארכיון:** דורשת אישור נפרד.
- **סודות GitHub (A-B2):**
  - `SUPABASE_DB_URL` נמצא רק ב-Environment `production` (ענף `main`, `workflow_dispatch`, בדיקת שחקן).
  - `SUPABASE_ACCESS_TOKEN` בוטל.
  - טיפוסים נוצרים מהמסד המקומי.
  - ה-dump השבועי רץ כתפקיד `content_dump` עם הרשאת קריאה ל-`content` בלבד.
  - בדיקת CI חוסמת שימוש בסוד DB מחוץ ל-job עם `environment`.
- **התראה תקועה (B-B2):**
  - שורת outbox של התראה שמגיעה ל-`dead` מעבירה את ההתראה ל-`undeliverable`. זה משחרר את מפתח ה-dedupe ומוציא אותה מהתנאי `pending > 30 דק'`.
  - `staff.admin_alert_resolve` ושורת SQL ב-runbook.
  - התראת `outbox_dead` על עצמה לא נוצרת שוב (אין לולאה).
- **שאר התיקונים (F1-F19):**
  - שומר `last_admin` הוסר, כי שומר העצמי מבטיח אדמין פעיל.
  - break-glass כולל ביטול חסימה.
  - נוסף `staff.admin_staff_enable`.
  - דחיות לפני Turnstile לא כותבות למסד.
  - `lead-intake` מחזירה לדפדפן רק `{ok:true}`.
  - ייבוא לקוחות מסנן שורות פסולות בלי חריגה שמדליפה PII ללוג.
  - אין קבצי CSV של לידים.
  - ה-hook מקבל רק הזמנות סגל.
  - סימן המים של `copy_auth_events` הוא `(created_at, id)`.
  - שם אחיד: `fund_id`.
  - חפיפת `notify-worker` בטוחה.
  - `site-watch.yml` נערך ולא נוצר מחדש.
  - הסימון ב-§15 תוקן.
  - cron לא קורא לפונקציות לפני שנפרסו (`edge_cron_enabled`).
  - רצפת הגרסה ב-`replay-local.sh` נבדקת על עותק זמני.

**סתירות שהוכרעו:**
- (א) סשן 12 ש', חוסר פעילות 60 דק', JWT של 15 דק'.
- (ב) Small.
- (ג) חשיפת `api`, ואחרי V2-04 גם `staff`.
- (ד) `log_op_check`.
- (ה) `max_rows=200`.
- (ו) `degraded` מייצג רק תקינות מסירה.
- (ז) חריגי advisor הם רשימה מתועדת.
- (ח) קובץ `config.toml` שמותקן היום אינו הקובץ המוצע. הקובץ המוצע גובר.

---

## 1. עקרונות

1. **שום דבר לא חשוף כברירת מחדל:** רק views ופונקציות ב-`api` וב-`staff`.
2. **ההרשאה נקבעת במסד** (`core.staff`), וביטול שלה מיידי.
3. **כל שינוי הוא מיגרציה קדימה** שעוברת הרצה מאפס.
4. **כל הבטחה מגובה בבדיקת pgTAP ב-CI.**
5. **משעמם לתפעול:** פרויקט אחד, מסלול פריסה אחד, חמש משימות cron, ודגל אחד לכל יכולת.
6. **הרחבה בלי עבודה מחדש.**

## 2. מה למדנו (תמצית)

- סכמה חשופה אחת במקום `public`, ו-grants מפורשים.
- RLS עם `(select ...)` ו-`TO role`.
- MFA נאכף במסד (`aal2`), ו-TOTP טרי לאדמין.
- Disk IO הוא תקציב.
- ענפים נבנים ממיגרציות.
- `verify_jwt` אינו אימות.
- Vercel רץ ב-`fra1`.
- SMTP דרך Resend.
- טופס ציבורי מוגן ב-Turnstile, בבדיקת Origin וב-RPC שירות.
- **סוד מסד ב-repository secret זמין לכל ענף.**

## 3. סביבות

| סביבה | מסד | הערה |
|---|---|---|
| local | `replay-local.sh` / `supabase start` | נבנה ממיגרציות |
| preview | ענף Supabase ל-PR שנוגע ב-`supabase/` | ענף נבנה מ-`supabase/config.toml`, ולכן קובץ הביניים מוחלף ב-PR הראשון. **אחרי מחיקת staging:** `VITE_FORMS_ENABLED=false`, `VITE_STAFF_APP_ENABLED=false`, ו-Deployment Protection חובה |
| staging | ענף עמיד, ימים 4-5 בלבד | נמחק אחרי cutover |
| production | `seeld-site` | מיגרציות רק דרך PR ו-`migrate.yml` (§12) |

לכל ענף סודות Vault משלו: `project_url` של הענף בלבד, ו-`edge_cron_secret`. Rollback של קוד: Instant Rollback. Rollback של מסד: מיגרציה קדימה.

## 4. מבנה המאגר

```text
supabase/
  config.toml            # היום: קובץ ביניים (max_rows 1000, jwt 3600, sync-tracks, invite-agent); מוחלף בקובץ המוצע ב-PR הראשון של v2
  migrations/            # 8 קבצי היסוד (+15 של v2); אף גרסה < 20261118162452
  _archive_tokyo/        # בוצע ב-cb5af5e: migrations/ (42), functions/ (17 כולל pdage-chat), config.tokyo.toml, README.md
  _parked/functions/     # רק אם הבעלים בוחר: api-v1, queue-worker (לא נפרסים, לא נמחקים)
  tests/                 # 00_policy_lint, 01-09, replay-local.sh; local_bootstrap.sql מחוץ לתבנית *.test.sql
  functions/             # allowlist: _shared lead-intake notify-worker chat-bot fetch-cma-data staff-invite health
api/                     # פונקציות Vercel, Node runtime, קריאה בלבד
scripts/load/            # load-content.sql, verify-manifest.mjs (בלי קבצי נתונים)
scripts/migrate/         # copy-customers.sql (בוצע 18.11.2026, הוצא משימוש; מחליף את copy-customers.mjs), verify-migration.sql
```

**מצב והחלטות שנותרו:**
1. ב-`supabase/functions` יש היום `_shared`, `api-v1` ו-`queue-worker`. `queue-worker/index.ts:75` קורא ל-`SUPABASE_SERVICE_ROLE_KEY`, ש-§7 אוסר.
   - **החלטת בעלים פרטנית:** (א) **מומלץ:** להעביר את `api-v1` ואת `queue-worker` ל-`supabase/_parked/functions/` ואת `src/test/queue-worker.test.ts` ל-`supabase/_parked/tests/`, כי ה-outbox ו-`notify-worker` מחליפים אותם עד שלב ב'. (ב) לחלופין להשאיר אותם, להוסיף אותם ל-allowlist ול-`config.toml` (`verify_jwt=true`), ולהחליף את המפתח ב-`SEELD_SECRET_KEY`.
   - `_shared` נשאר בכל מקרה (`src/test/edge-shared.test.ts` ו-`src/platform/queue/policy.ts` תלויים בו) ומורחב.
2. `supabase/config.toml` מוחלף בתוכן `docs/platform/config.proposed.toml` ב-PR הראשון של v2. זה שינוי קוד רגיל שהבעלים סוקר, לא מחיקה. עד אז ענף או `config push` יחזירו `max_rows=1000` ו-JWT של שעה.
3. בדיקת CI: `comm -23 <(ls supabase/functions) <(allowlist)` חייבת להיות ריקה (הכלה). פונקציה חדשה שעוד לא קיימת לא מפילה את הבדיקה.

## 5. מסד הנתונים

### 5.1 סכמות

| סכמה | תוכן | חשופה |
|---|---|---|
| `api` | views invoker; `me`, `health`; RPC שירות (`service_role`): `submit_lead`, `lead_replay`, `intake_note_reject`, `outbox_claim`, `outbox_complete`, `job_finish`, `job_continue`, `cma_upsert_batch`, `cma_finish_sync`, `chat_session_touch`, `chat_append`, `invitation_create`, `invitation_resend`, `staff_provision` | כן |
| `staff` | view `members`; RPC: `leads_list`, `lead_get`, `lead_set_status`, `lead_assign`, `lead_note_add`, `lead_soft_delete`, `admin_assert_fresh`, `admin_config_set`, `admin_staff_disable`, `admin_staff_enable`, `admin_staff_unlock`, `admin_alert_resolve`, `ops_health` | כן, אחרי V2-04 |
| `content` | בלוג, נסיעות, `investment_tracks` (+`source`, `source_period`), `cma_*`, matviews | לא; `content_dump` קורא בלבד |
| `crm` | `leads`, `chat_*`, `customers` (מוצפן) | לא |
| `core` | `agencies`, `staff`, `client_accounts`, `invitations` | לא |
| `ops` | `config`, `rate_limits`, `outbox`, `idempotency_keys`, `intake_payload_keys`, `job_runs`, `alerts`, `alert_recipients` | לא |
| `audit` | `log`, `access_log`, `auth_events` | לא |
| `private` | עזרים ו-hook | לא |
| `public` | ריק ואטום | לא |

### 5.2 קונבנציות

- מזהים `uuid` (v4); `created_at`/`updated_at` עם טריגר; `text` עם `check`.
- RPC בשם `<schema>.<object>_<verb>`.
- מחיקה רכה רק ב-`crm.leads`.
- audit עם `no_values` לטבלאות PII, ושורת `ACTION` לכל RPC של צוות.
- לכל טבלה חדשה: RLS, grants בלי DELETE/TRUNCATE לתפקידי API, policy עם `TO`, אינדקסים ובדיקה.
- `security definer` רק כשחייבים, ותמיד עם `set search_path = ''`.
- **מתגים:** `private.flag(key)`. מפתח חסר נקרא כסגור, חוץ מ-`intake_enabled`/`chat_enabled`.
- **PII מוצפן:** ת.ז. נשמרת כ-HMAC וגם כ-`pgp_sym_encrypt`. המפתחות נמצאים ב-Vault ובנאמנות לא מקוונת.

### 5.3 תפקידים

| תפקיד | יכול |
|---|---|
| `anon` | תוכן ציבורי ו-`api.health()` |
| `authenticated` (לקוח) | + `api.me()`; רק השורה שלו |
| `agent` (`aal2`) | עריכת תוכן בלי מחיקה; לידים של הסוכנות שלו דרך RPC שנרשם |
| `manager`/`admin` | + צוות של אותה סוכנות; פעולות אדמין עם TOTP טרי (≤900 שניות) |
| `service_role` | RPC שירות; אין גישה ל-`crm.customers` |
| `content_dump` (לא API) | `select` על `content` בלבד, ל-dump השבועי |

### 5.4 סיווג מידע

| רמה | דוגמאות | חשיפה |
|---|---|---|
| ציבורי | תוכן, לוח, מסלולים | anon דרך `api` |
| פנימי | `ops`, `audit`, `core.staff` | service_role / עצמי |
| PII | `crm.leads` (בלי ת.ז., בלי מידע רפואי ובלי חשבון בנק), `core.invitations` | צוות `aal2` של אותה סוכנות, דרך RPC שנרשם |
| PII מוצפן | `crm.customers` | אף תפקיד API |

### 5.5 מערכת האירועים (שלב ב')

- `identity_links` מתמזג עם `crm.customers.national_id_hmac`.
- `event_log`/`queue_*` עוברים ל-`ops`.
- ה-outbox עובר ל-pgmq.
- `api-v1`/`queue-worker` (אם חנו) נבחנים מחדש בשלב הזה.

## 6. אימות

| קהל | שיטה |
|---|---|
| צוות | אימייל + סיסמה + TOTP חובה. `enable_signup=false`, ו-hook שמקבל רק הזמנת **סגל** פתוחה. סשן 12 ש', חוסר פעילות שעה, JWT של 15 דק'. CAPTCHA של Turnstile |
| לקוחות | מחוץ לתחום (§17). ה-hook דוחה הזמנות `client` עד שהפורטל ייבנה |
| אנונימי | publishable key; לידים רק דרך `lead-intake` |

**התחברות חברתית: אף פעם.** כל ספק חיצוני כבוי, ובדיקת ה-smoke מוודאת `external.*=false`.

הערות:
- (א) SMTP של Resend.
- (ב) SMS כבוי.
- (ג) שלושת המשתמשים הקודמים מוקמים מחדש.
- (ד) `otp_expiry=600`: קישור ההזמנה תקף 10 דקות, וההזמנה עצמה 24 ש'. שליחה חוזרת: `staff-invite` `resend`.
- (ה) **נעילה:** כבויה עד האימות ביום 3. אדמין לא ננעל לעולם. נעילה רק מ-2 מקורות IP לפחות (ADR-30).
- (ו) **השבתה:** `staff.admin_staff_disable` (מסרבת להשבית את עצמך, ולכן תמיד נשאר אדמין פעיל), ואחריה `staff-invite` `disable` מריצה `auth.admin.updateUserById(id, { ban_duration: '876000h' })`. `auth.admin.signOut` מקבל JWT ולא user id, ולכן לא מתאים.
- (ז) **הפעלה מחדש:** `staff.admin_staff_enable` (אדמין, TOTP טרי, אותה סוכנות, שורת ACTION), ואחריה `staff-invite` `enable` מריצה `updateUserById(id, { ban_duration: 'none' })`.
- (ח) **Break-glass (אדמין יחיד נעול או מושבת):**
  1. ב-SQL Editor:
     ```sql
     update core.staff set locked_until = null, active = true where user_id = '<uid>';
     insert into audit.log (actor_role, table_name, op, pk, new_data) values ('owner_sql', 'core.staff', 'ACTION', '<uid>', '{"action":"break_glass_unlock"}');
     ```
  2. ביטול החסימה ב-GoTrue: Dashboard > Authentication > Users > המשתמש > Unban. חלופה ב-SQL:
     ```sql
     update auth.users set banned_until = null where id = '<uid>';
     ```
  3. יום 3 כולל תרגיל על אדמין בדיקה. הקבלה: הכניסה מצליחה.

## 7. Edge Functions

**חוזה cron:** בדיקת `x-cron-secret` (`timingSafeEqual`), תשובת `202`, עבודה ב-`EdgeRuntime.waitUntil`, וסיום ב-`api.job_finish`.

| פונקציה | חוזה |
|---|---|
| `lead-intake` | (1) Origin מ-allowlist, אחרת 403. (2) payload קנוני בלבד, גוף עד 32KB, ו-`Idempotency-Key` תקין. (3) `api.lead_replay` (**קריאה אחת באינדקס, בלי כתיבה**): אם נמצא, 200; גוף שונה, 409. (4) Turnstile. (5) `api.submit_lead(payload, key, cf-connecting-ip)`. (6) `api.intake_note_reject` **רק לדחיות אחרי ש-Turnstile עבר** (400/409/423/429). דחיות Origin, צורה ו-Turnstile נספרות בזיכרון של ה-isolate (best effort, לכל IP) ונרשמות בלוג בלי PII. אין כתיבה למסד לפני Turnstile. **תשובה לדפדפן: `{ok:true}` בלבד**, בלי `id` ובלי `duplicate`, כדי שלא אפשר יהיה לאשר שליד קיים |
| `notify-worker` | cron כל דקה; 202; `api.outbox_claim(20)`, ואז Resend עם `Idempotency-Key: outbox-<id>`, ואז `api.outbox_complete`; עוצרת אחרי 72 שניות. הפעלות חופפות בטוחות: `outbox_claim` משתמשת ב-`for update skip locked` ובנעילה של 2 דק', כך ששורה נלקחת פעם אחת |
| `fetch-cma-data` | cron שבועי; 202; פרוסות של עד 60 שניות; `api.job_continue`; בסוף `api.cma_finish_sync` ו-`api.job_finish` |
| `chat-bot` | `api.chat_session_touch(key, cf-connecting-ip)` ואחריה `api.chat_append` |
| `staff-invite` | `verify_jwt=true` + `getClaims` + `staff.admin_assert_fresh()`. פעולות: `invite`, `resend`, `disable` (RPC ואחריו ban), `enable` (`staff.admin_staff_enable` ואחריו `ban_duration:'none'`). CORS מ-`ALLOWED_ORIGINS` |
| `health` | `GET`, מחזירה `{ok, degraded, cma_age_bucket}` |

**תקנים:**
- `_shared` הקיים (`auth.ts`, `cors.ts`, `errors.ts`, `logger.ts`, `request.ts`, `rateLimit.ts`, `alerts.ts`) נשאר, ומתווספים לו `env.ts` (zod), `turnstile.ts` ו-`resend.ts`. הלוג נכתב בלי PII.
- `SEELD_SECRET_KEY` נשלח בכותרת `apikey`.
- אסור `SUPABASE_SERVICE_ROLE_KEY`/`VITE_*` בפונקציות.
- רשימת הפונקציות הפרוסות זהה לרשימה במאגר.

## 8. Storage

אין buckets בהקמה.

## 9. תזמון

| שם | לוח (UTC) | פעולה |
|---|---|---|
| `ops-cleanup` | כל שעה ב-:17 | `ops.cleanup()` לפי מדיניות השימור (ADR-34). התראות לא-pending, כולל `undeliverable`, נמחקות אחרי 90 יום |
| `cma-freshness-monthly` | 12 בחודש, 04:30 | `content.cma_check_freshness()` |
| `notify-worker-tick` | כל דקה | `select ops.call_function('notify-worker')` |
| `cma-sync-weekly` | ראשון, 03:00 | `select ops.call_function('fetch-cma-data')` |
| `ops-watchdog` | כל 10 דקות | `select ops.watchdog()` |

`ops.http_invoke` היא המקום היחיד שבונה כתובת: Vault `project_url` + `/functions/v1/<fn>?forceFunctionRegion=eu-central-1`, עם timeout של 5000ms.

**`edge_cron_enabled` (ברירת מחדל `false`):** כל עוד הוא כבוי, `ops.call_function` חוזרת בלי שורה ב-`job_runs` ובלי קריאת HTTP. הבעלים מדליק אותו ביום 2 אחרי פריסת `notify-worker`, `fetch-cma-data` ו-`health`. עד אז `degraded=true` צפוי, כי התראות מצטברות ואין מי שימסור אותן. `site-watch` בודק את הדגל רק מה-cutover.

## 10. סודות (שמות בלבד)

| שם | איפה | מי |
|---|---|---|
| `SEELD_SECRET_KEY` | Edge secret | פונקציות |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_TURNSTILE_SITE_KEY`, `VITE_FORMS_ENABLED`, `VITE_STAFF_APP_ENABLED` | Vercel | בנייה |
| `project_url`, `edge_cron_secret` | Vault, לכל סביבה | `ops.http_invoke` |
| `pii_enc_key`, `national_id_hmac_key` | Vault + נאמנות לא מקוונת | `private.pii_*` |
| `EDGE_CRON_SECRET`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `GOOGLE_AI_API_KEY`, `ALLOWED_ORIGINS` | Edge secrets | לפי פונקציה |
| `RESEND_SMTP_PASSWORD` | `supabase/.env` מקומי + דשבורד | SMTP |
| `SUPABASE_DB_URL` | **GitHub Environment `production` בלבד** (ענף `main`, מאשר: הבעלים) | רק `migrate.yml` (`workflow_dispatch`) |
| `CONTENT_DUMP_DB_URL` | GitHub Environment `backup` (ענף `main`) | `content-dump.yml`, תפקיד `content_dump` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | GitHub repository secret | smoke ב-preview |
| `rate_limit_pepper` | `ops.config` | hashing |

**אין** `SUPABASE_ACCESS_TOKEN` ו**אין** כתובת מסד כ-repository secret. כתובת `postgres` מאפשרת לקרוא את `vault.decrypted_secrets`, ולכן גם לפענח את `crm.customers`. סודות Vault אינם חלק מ-pg_dump, ולכן אחרי שחזור יוצרים אותם מחדש.

## 11. Vercel

- `docs/platform/vercel.proposed.json`: `regions:["fra1"]`, `api/*.ts` על Node עם `maxDuration:10`.
- **אין** `git.deploymentEnabled`. Production Branch = `main`.
- CSP: `connect-src 'self' https://qxhpolktdfgcbxtfxgov.supabase.co https://challenges.cloudflare.com`. Turnstile מופיע ב-`script-src` וב-`frame-src`.
- מסלול פריסה יחיד (Git integration). `deploy-vercel.yml` רץ רק ב-`workflow_dispatch`.

## 12. CI/CD

| Job | בודק |
|---|---|
| `verify` | typecheck, lint, vitest, prerender, AEO, גודל חבילה, `grep -rEn 'sb_secret_\|service_role\|SUPABASE_SERVICE_ROLE_KEY' dist/ src/ api/` (קובץ הטיפוסים מוחרג) |
| `database` | רצפת גרסה (`ls supabase/migrations \| awk '$0 < "20261118162452"'` ריק), `replay-local.sh` (00-09), `supabase db reset` + `supabase test db`, טיפוסים `--schema api,staff` **מהמסד המקומי** והשוואה לקובץ במאגר |
| `functions` | grep אסורים על כל `supabase/functions`, והכלה ב-allowlist |
| `supply-chain` | npm audit, סריקת סודות, ובדיקה שאף job לא מפנה ל-`secrets.SUPABASE_DB_URL`/`CONTENT_DUMP_DB_URL` בלי `environment:` (`scripts/ci/check-secret-scope.mjs`) |
| `ci-ok` | needs: כל הארבעה |

**סדר בלי נעילה הדדית:** הארכוב כבר בוצע, ולכן אין שלבים.
1. **PR ראשון של v2 (T5):** מיישם את החלטת הבעלים על `api-v1`/`queue-worker`, מחליף את `config.toml`, ומאמץ את `ci.yml` עם שערים מלאים.
2. אחרי שה-PR ממוזג ירוק, הבעלים מפעיל הגנת ענף שדורשת `ci-ok`.

**`migrate.yml`:** רץ ב-`workflow_dispatch` בלבד, עם `environment: production` ובדיקה ש-`github.actor` נמצא ב-`vars.PROD_MIGRATORS`. מריץ `supabase db push --db-url "$SUPABASE_DB_URL"` אחרי `ci-ok` ירוק על `main`.

**`content-dump.yml`:** רץ פעם בשבוע עם `environment: backup`. מריץ `pg_dump --schema=content` כ-`content_dump`, מצפין במפתח הציבורי של הבעלים, ושומר כ-artifact ל-30 יום.

**`preview-smoke`:** מוודא שאין ספקים חיצוניים, שהרשמה נדחית, ש-`rpc('health')` עובד, ו-`exp-iat=900`.

## 13. תצפית והתראות

- **מקור האמת:** `ops.job_runs`.
- **`ops.watchdog()`:** כל צעד רץ בבלוק חריגה משלו. הצעדים:
  - `cron_http_audit`
  - `copy_auth_events` (סימן מים `(created_at, id)`)
  - outbox
  - jobs
  - `cma_refresh`
  - intake
  - auth
- **מסירה:** `ops.raise_alert`, ואז outbox, ואז `notify-worker`, ואז Resend. התראה ששורת ה-outbox שלה הגיעה ל-`dead` עוברת ל-`undeliverable`: מפתח ה-dedupe משתחרר, ו-`outbox_dead` מותרע. התראת `outbox_dead` שבעצמה מתה לא מייצרת התראה נוספת.
- **פתרון ידני:** `staff.admin_alert_resolve(id)`, או ב-SQL:
  ```sql
  update ops.alerts set status = 'resolved' where id = <id> and status = 'pending';
  ```
- **ערוץ עוקף:** `api.health().degraded` דולק כשה-outbox תקוע, כשיש `dead` ב-24 השעות האחרונות, כשהתראה ב-`pending` יותר מ-30 דק', או כשאין ריצת watchdog שהסתיימה ב-30 הדקות האחרונות. ה-workflow הקיים `.github/workflows/site-watch.yml` **נערך** כך ש-`scripts/health-check.mjs` נכשל כש-`degraded=true`. הבדיקה פעילה כשמשתנה הריפו `HEALTH_URL` מוגדר, מה-cutover.
- **Disk IO:** נבדק שבועית.

## 14. גיבוי ושחזור

- גיבוי יומי של Pro, בלי PITR.
- dump שבועי מוצפן של `content` בלבד, כתפקיד `content_dump` (§12).
- תרגיל חודשי: טעינה, בדיקות, יצירת Vault מחדש, ובדיקה של `private.pii_decrypt`.

## 15. רשימת בדיקה לאבטחה

פריט מסומן רק כשבדיקה אוטומטית ירוקה רצה על הקוד הנוכחי (8+15).

- [ ] RLS בכל טבלה (01:1); אין TRUNCATE/REFERENCES/TRIGGER (01:2). סומן בעבר על 8 המיגרציות. יסומן שוב אחרי עריכות 01 (כולל `staff`)
- [ ] אין DELETE (00)
- [ ] anon מריץ רק את `api.health`; 14 RPC שירות (00)
- [ ] חריגי advisor 0028/0029 = הרשימה המדויקת (00, ADR-22)
- [ ] authenticated בלי usage על `crm` (00); `content_dump` עם `select` על `content` בלבד (00)
- [ ] קריאת לידים נרשמת (05); היקף סוכנות (05); step-up (05)
- [ ] `submit_lead` (03); `lead-intake` מחזירה `{ok:true}` בלבד (Deno)
- [ ] hook: בלי הזמנה, 403; הזמנת `client`, 403 (07)
- [ ] נעילה: לא נטען כיסוי עד יום 3
- [ ] השבתה והפעלה: `admin_staff_enable`; ביטול חסימה ב-break-glass (07, יום 3)
- [ ] watchdog שורד צעד שבור; התראה `undeliverable` משחררת dedupe ומכבה `degraded` אחרי 24 ש' (06)
- [ ] cron: חמש משימות; `edge_cron_enabled=false` לא יוצר `job_runs` (00, 06)
- [ ] `public` אטום (00); `crm.customers` (09); ייבוא בלי חריגה על שורה פסולה (09)
- [ ] שימור (08)
- [ ] סודות DB רק ב-Environment (`supply-chain`)
- [x] הרשמה כבויה, מדיניות סיסמה, HIBP, TOTP, URL (בוצע על ידי המתאם)
- [ ] Turnstile + Origin; Deployment Protection; הגנת ענף; MFA לארגון
- [ ] סיבוב מפתחות, תרגיל שחזור, CSP

## 16. עלויות

Supabase Pro $25 + Small $15 (נטו $5); Vercel Pro $20; Resend ו-Turnstile חינם. בסך הכול כ-$50-80 לחודש.

## 17. מה לא בונים עכשיו

1. פורטל לקוחות.
2. אפליקציית סוכנים מלאה.
3. מערכת האירועים (כולל `api-v1`/`queue-worker`).
4. PITR.
5. GraphQL, Realtime.
6. התחברות חברתית (לעולם לא).
7. Schema declarative.
8. `page_views`.
9. נתוני CRM מעבר ל-191 הלקוחות.
10. staging עמיד.
11. hooks נעילה של Team.

## 18. מעבר מ-Tokyo

### 18.1 טבלאות

| טבלה | החלטה |
|---|---|
| `blog_posts` (22) | מועבר מ-`data/` (MANIFEST, md5) |
| `investment_tracks` (571) | נבנה אוטומטית ב-`content.refresh_investment_tracks()` (ADR-36). לא מועתק |
| `cma_funds` | נטען דרך `fetch-cma-data` |
| `cma_sync_log`, matviews | מתחילים מאפס, או נבנים |
| לידים (2) | הבעלים מקליד אותם ב-SQL Editor (`insert into crm.leads ... source='legacy-v0'`). **בלי קובץ** |
| `customers` (191) | מועתק מוצפן דרך `scripts/load/copy-customers.mjs`, בזרם, עם bind parameter, בלי קובץ. **בפועל (18.11.2026):** הועתק דרך `scripts/migrate/copy-customers.sql` (בלוק pgp חתום דרך MCP), לפני אישור שלב 24. זו סטייה מהחוזה, והיא מתועדת ב-DATA-MIGRATION.md סעיף 2א. הנתיב הוצא משימוש במיגרציה 095300 |
| טבלאות לקוח נלוות | נבנות מחדש עם אפליקציית הסוכנים |
| `page_views`, `chat_*` | לא מועברים |
| `onboarding_submissions`, דפי הוראת קבע/Onboarding | כבויים ב-cutover |
| `profiles`, `agencies`, `agency_invitations` | נבנים מחדש |
| `insbase_links`, `saved_calculations`, `user_policies` | לא מועברים |
| `pdage_*`, `correction_*`, `deficiency_*` | נמחקים. מודול PDage נמחק מ-`src`. מחיקת `supabase/_archive_tokyo/functions/pdage-chat` דורשת אישור נפרד |
| Cron (7) | 5 |

### 18.2 נקודות מגע

- `src/integrations/supabase/config.ts`
- `src/lib/leadIntake.ts`
- מסלולים לפי `source_period`
- `api/*.ts` (Node, עימוד של 200)
- `prerender.mjs`
- `vercel.json`
- `/app`, `/portal`, `/client`, `/personal-area` כבויים
- הסרת PDage (`src/components/pdage`, `usePdageChat` וכו')
- הסרת `api/geo.ts` (באישור)

### 18.3 Runbook

**לפני (יום 4):**
0. `ci.yml` ירוק על `main`; `ls supabase/functions` מוכל ב-allowlist; הגנת ענף פעילה; `config.toml` = הקובץ המוצע.
1. 8 + 15 המיגרציות ירוקות; advisors רק עם החריגים המתועדים.
2. טעינה בלילה: blog 22; `cma`; צעד `cma_refresh` רץ פעם אחת. הספירות (ב-`count=exact`):
   - `api.cma_board` = 1,257
   - `api.cma_company_map` = 120
   - tracks פעילים מתועדים
3. העתקת לקוחות: `received=191`, `inserted+skipped=191`, `invalid_ids` נבדק, ובדיקת פענוח אחת.
4. §21 הושלם; `edge_cron_enabled=true`; `degraded=false`; smoke ב-preview כולל ליד כפול.

**ביצוע (יום 5):**
1. משתני Production.
2. מיזוג.
3. `migrate.yml`, אם יש מיגרציה חדשה.
4. smoke.
5. `ops.job_runs` מתמלא.
6. `HEALTH_URL` מוגדר.
7. ניטור במשך 60 דק'.

**Rollback (24 ש'):** Instant Rollback + משתנים. לידים שהגיעו בחלון נשארים ב-`seeld-site` ונקראים דרך `staff.leads_list`, **בלי יצוא לקובץ**. Tokyo נשאר 30 יום.

**עצירת חירום:** `staff.admin_config_set('intake_enabled','false')`, או `update ops.config set value='false' where key in ('intake_enabled','chat_enabled');`.

### 18.4 מה לא עובר

`seeld-ops` והטבלאות הפרטיות של הסוכנות מחוץ לתחום לתמיד: הפרויקט הזה לא מאחסן, לא קורא, לא מארכב ולא מזכיר אותם בקוד, בבדיקות, ב-seed או במסמכים מעבר למשפט הזה.

## 19. תוכנית ימים

| יום | משימה | מבצע | קבלה |
|---|---|---|---|
| 1 (בוצע) | יסוד, 8 מיגרציות; ארכוב (`cb5af5e`) | ארכיטקט + בעלים | replay 0 |
| 1 | 15 מיגרציות + בדיקות 00-09 | סוכן-מסד | `replay-local.sh` יוצא 0 |
| 1 | החלטה על `api-v1`/`queue-worker`; PR ראשון: `config.toml` + `ci.yml` | בעלים + CI | `ci-ok` ירוק; אחריו הגנת ענף |
| 2 | Edge (202, replay, `{ok:true}`); אחרי פריסה: `edge_cron_enabled=true` | סוכן-Edge + בעלים | ליד כפול = ליד אחד; `job_runs` מתמלא |
| 3 | Small, טעינה, tracks, לקוחות | בעלים + נתונים | ספירות |
| 3 | `staff-invite` עם hook; השבתה/הפעלה; break-glass; כניסה כושלת אמיתית | בעלים + זהות | רענון אחרי השבתה נכשל; unban עובד |
| 4 | חזרת cutover על staging | כולם | 18.3 "לפני" |
| 5 | cutover | בעלים + CI | `site-watch` ירוק 24 ש' |

## 20. החלטות (ADR)

- **ADR-1** `api` היא הסכמה הציבורית.
- **ADR-2** הרשאות מטבלה.
- **ADR-3** `aal2` נאכף.
- **ADR-4** טבלת לידים אחת.
- **ADR-5** הוחלף ב-ADR-21.
- **ADR-6** outbox עסקתי.
- **ADR-7** uuid v4.
- **ADR-8** text+check.
- **ADR-9** מחיקה רכה ו-audit בלי ערכים.
- **ADR-10** matviews ב-`content`.
- **ADR-11** staging זמני.
- **ADR-12** מסלול פריסה יחיד + `ci-ok`.
- **ADR-13** `fra1`.
- **ADR-14** בלי PITR.
- **ADR-15** מיגרציות קדימה.
- **ADR-16** `api/*.ts` על Node.
- **ADR-17** הוחלף ב-ADR-33.
- **ADR-18** הוכחה בקונטיינר.
- **ADR-19** CSP.
- **ADR-20** טיפוסים `api`,`staff` מהמסד המקומי.
- **ADR-21** אפס RPC כתיבה ל-anon. `lead-intake` היא הכניסה היחידה. `p_client_ip` חובה. `api.lead_replay` (קריאה בלבד) לפני Turnstile. **לפני Turnstile אין כתיבה למסד:** `intake_note_reject` רק אחרי Turnstile, ודחיות מוקדמות נספרות בזיכרון ובלוג. payload קנוני ו-allowlist סגור. התשובה לדפדפן היא `{ok:true}` בלבד.
- **ADR-22** חשיפה: `api` ו-`staff`. חריג 0028 = `api.health`. חריגי 0029:
  - `api.health`, `api.me`
  - `staff.leads_list`, `staff.lead_get`, `staff.lead_set_status`, `staff.lead_assign`, `staff.lead_note_add`, `staff.lead_soft_delete`
  - `staff.admin_assert_fresh`, `staff.admin_config_set`, `staff.admin_staff_disable`, `staff.admin_staff_enable`, `staff.admin_staff_unlock`, `staff.admin_alert_resolve`
  - `staff.ops_health`

  כל ממצא אחר הוא כשל.
- **ADR-23** PII רק דרך RPC; אין DELETE.
- **ADR-24** `agency_id` הוא גבול.
- **ADR-25** wrapper יחיד, timeout של 5 שניות, חוזה 202, `job_continue`. `edge_cron_enabled` חוסם קריאות עד שהפונקציות נפרסו.
- **ADR-26** outbox v2: 1/5/30 דק' ו-2 ש'; `dead` אחרי 5 ניסיונות. התראה שמתה עוברת ל-`undeliverable` (מצב סופי). `admin_alert_resolve`.
- **ADR-27** בריאות = `job_runs` + watchdog; `degraded` הוא הערוץ העוקף.
- **ADR-28** חמש משימות; רענון ב-`cma_refresh`.
- **ADR-29** hook `before_user_created` מקבל רק `kind='staff'` (לקוחות: עם הפורטל, במיגרציה נפרדת). הזמנה נושאת `role`/`agency_id`, תקפה 24 ש', וניתנת לשליחה חוזרת.
- **ADR-30** נעילה בקוד שלנו, אחרי אימות. אדמין לא ננעל. נדרשים 2 מקורות IP לפחות. השבתה = `active=false` + `ban_duration`. הפעלה = `admin_staff_enable` + `ban_duration:'none'`. שומר העצמי מבטיח אדמין פעיל, ולכן אין צורך ב-`last_admin`. סיכון DoS מתועד.
- **ADR-31** step-up 900 שניות.
- **ADR-32** סשנים: 12 ש', שעה, 15 דק'.
- **ADR-33** Small.
- **ADR-34** שימור 25 חודשים; `access_log` נכתב.
- **ADR-35** IP חובה מהקורא; ההופ הציבורי האחרון.
- **ADR-36** `investment_tracks` נגזר מ-`content.cma_board` בכל טעינה מוצלחת:
  - upsert לפי `fund_id`
  - הסתרה (`is_active=false`) במקום מחיקה
  - `tracks_shrink` אם נגעו בפחות מחצי מהשורות
  - `tracks_stale` אחרי 9 ימים
  - מתג `tracks_sync_enabled`
- **ADR-37** מפתחות חדשים.
- **ADR-38** `supabase/migrations` מכילה רק את הבסיס. הארכוב בוצע (`cb5af5e`). `supabase/functions` מוכלת ב-allowlist. שלדים שלא בתוכנית חונים ב-`_parked` באישור.
- **ADR-39** `public` אטום.
- **ADR-40** Auth כקוד + דשבורד. `config.toml` = הקובץ המוצע.
- **ADR-41** `crm.customers` מוצפן. ייבוא אידמפוטנטי שמסנן שורות פסולות בלי חריגה (בלי DETAIL עם PII בלוג), ו-`p_rows` נשלח כ-bind parameter. (ביצוע בפועל: סטייה מתועדת ב-DATA-MIGRATION.md סעיף 2א וביומן הביקורת, בסעיף T4.)
- **ADR-42** PDage נמחק; טפסי ת.ז./בנק כבויים.
- **ADR-43** `max_rows=200`.
- **ADR-44 (חדש)** סודות מסד ב-GitHub רק ב-Environments מוגבלים ל-`main`. `production` מיועד ל-`migrate.yml` (`workflow_dispatch` ובדיקת שחקן), ו-`backup` ל-`content_dump` (קריאה בלבד ל-`content`). אין `SUPABASE_ACCESS_TOKEN`. אין קבצי נתונים אישיים (CSV) בשום שלב.

## 21. צעדי בעלים

ראו `owner_steps` (מסודרים, עם סימון [בוצע]). אין בהם אפשרות של התחברות חברתית.

---

## נספח א: ראיות

- 8 המיגרציות על `seeld-site`: 82/82.
- סבב 1: 14 המיגרציות נקיות בקונטיינר `supabase/postgres:17.6.1.178`; `00_policy_lint` 21/21; עשן 26/26. 07 רץ כ-`supabase_admin`.
- סבב 2: `cb5af5e` אומת על `origin/main`:
  - `supabase/migrations`: 8 קבצים.
  - `_archive_tokyo/migrations`: 42 קבצים, זהים לרשימה בנספח ד (md5 של רשימת השמות).
  - `_archive_tokyo/functions`: 17 תיקיות.
  - `supabase/functions`: `_shared`, `api-v1`, `queue-worker`.
- `20261119091400` טרם הורצה. T0 מאמת אותה, וייתכן שמשהו בה ייכשל עד אז (`content_dump` עם `bypassrls`).

## נספח ב: פגמי Tokyo

1. `USING(true)`.
2. ALL ל-API roles.
3. `send-lead-notification` פתוחה.
4. cron קשיח.
5. `stale`.
6. `VITE_*` בשרת.
7. סטיית `config.toml`.
8. שאריות.
9. cron "הצליח" על פונקציה מתה.

## נספח ג: backlog (אחרי cutover)

1. `api.me` invoker.
2. נוהל Vault ושחזור.
3. pgmq, והחלטה על `api-v1`/`queue-worker`.
4. סקירת אינדקסים.
5. ביטול מפתחות legacy.
6. איפוס factor.
7. DMARC.
8. זהות לקוח ו-SMS.
9. smoke Auth.
10. `lead_email` קצב.
12. ניתוב אימיילים.
13. פרטיות צ'אט.
14. מסלול חלופי לכשלונות.
15. `request_id` ב-`log_change`.
16. `deno check`/`deno test` ב-CI.
17. CORS.
18. CSP.
19. Vercel.
21. `local_bootstrap.sql`.
23. זיהוי שיבוש audit.
25. RPC צוות ל-`crm.customers`.
26. Storage.
27. `api/geo.ts`.
28. תרגיל רבעוני.
29. runbook תקרית.
30. `undeliverable` + פונקציית resend להתראות.

## נספח ד: ארכוב (בוצע ב-`cb5af5e`)

**בדיקה:**
- `ls supabase/migrations | awk '$0 < "20261118162452"' | wc -l` = 0
- `ls supabase/_archive_tokyo/migrations | wc -l` = 42
- `ls supabase/_archive_tokyo/functions | wc -l` = 17

**מיגרציות בארכיון (42):** `20260202220230_1d2c3bd3-ae59-47e9-9882-bdb09e50ea3a.sql`, `20260203142604_94c03991-28d7-4934-9df8-1dab0248b89e.sql`, `20260204174201_cbd16082-cae4-4ba2-9c33-17be527fd639.sql`, `20260218074052_a7ee32a5-e159-4c7e-828d-65c023e30c65.sql`, `20260218235734_1c718191-ba00-40ca-8b7e-5b7648e1e8b7.sql`, `20260309193912_b6a3e1ff-c2c9-45d1-9ae4-44fdf0c219f9.sql`, `20260309200917_2fac1a8d-fc7e-47ed-97d3-eefb6d14cd57.sql`, `20260309233455_45fc8333-9a0b-463c-ad96-4930c7ca0b33.sql`, `20260309235036_fcc4a412-2c50-43c8-aea5-45f60f58d5d3.sql`, `20260311225544_3ce3ccf1-f125-4be1-87b9-579ed2df7064.sql`, `20260311230319_58acbb07-5f4e-4e89-8e31-7765dece6624.sql`, `20260311230924_56dfccac-7f7b-42fe-9afb-866b66d56abb.sql`, `20260311230931_9abd5f9a-0b2d-4f28-9a6a-b3b555b89a23.sql`, `20260311231613_c9f8aad8-1abe-46c5-9c0e-f5f799d6c8e3.sql`, `20260311231639_165d79a9-3cc8-48cc-b0b4-c08804fb3f25.sql`, `20260311234123_9d71522d-54b8-4242-a7b3-8662ea2e47fd.sql`, `20260311235825_a148958a-f929-4b48-a699-764c77703b61.sql`, `20260312074549_f9d5d030-3cbe-41fa-81dc-36ec63a737a2.sql`, `20260312074619_9dae8de5-e221-4760-a73a-8b0069f91c15.sql`, `20260312095707_bd4f1c4f-6ea7-4fca-b762-d327c65cf189.sql`, `20260312154044_432d6011-506a-4d18-921f-008f530f0215.sql`, `20260312171352_3a08b010-9c0a-47e1-b035-a1b40c79730b.sql`, `20260312171449_5efa4afa-9ac4-4611-a124-e38cb6201d01.sql`, `20260312172936_9a61d8e6-7adc-44ed-b592-33aa66350eb8.sql`, `20260314113709_3911b762-91dd-4aab-b2cb-429672bb69b8.sql`, `20260314125843_3ea6523d-ceb9-4b7e-8e57-708f48faa97a.sql`, `20260314133911_3087e841-f64d-4f8c-b4ff-a087f3e5cd4a.sql`, `20260314142046_cc4aba67-486a-4cc8-964b-edd74877c5ec.sql`, `20260314144750_93cd8ecd-5f8c-453f-add6-0fee4a6eb599.sql`, `20260314152804_32530c96-799b-4156-85cb-5a6e547c3727.sql`, `20260314153051_e36b5125-ed5d-4117-a530-e204dc1b4f0c.sql`, `20260319100000_create_cma_funds.sql`, `20260319100001_cma_cron_schedule.sql`, `20260323000000_page_views.sql`, `20260325000000_page_views_v2.sql`, `20260706120000_lock_down_public_read_policies.sql`, `20260810000000_agents_read_update_site_leads.sql`, `20260821000000_reconcile_schema_with_production.sql`, `20260822000000_rls_initplan_and_anon_grants.sql`, `20260917100000_cma_board.sql`, `20260917200000_contact_submissions_status.sql`, `20260917210000_insbase_links.sql`.

**תיקיות פונקציות בארכיון (17):** `admin-verify`, `fetch-bank-branches`, `fetch-cma-data`, `finance-chat`, `generate-recommendation`, `invite-agent`, `noa-onboarding`, `parse-import-file`, `parse-insurance-file`, `parse-pdf-policy`, `pdage-chat`, `process-correction`, `send-calculation-email`, `send-lead-notification`, `send-onboarding-summary`, `sync-tracks`, `validate-correction`.
- `pdage-chat` נמחק סופית רק באישור פרטני (ADR-42).
- `fetch-cma-data` נכתבת מחדש ב-`supabase/functions`.

**נשארו ב-`supabase/functions` (קוד הפלטפורמה החדשה, לא Tokyo):**
- `_shared`: נשאר ומורחב.
- `api-v1`, `queue-worker`: החלטת בעלים (§4).

---

## סטיות ומצב בפועל (19.11.2026)

הסעיף הזה מתעד את מה שיושם בפועל לעומת הטקסט שלמעלה, שלא נערך. אם יש סתירה, הסעיף הזה וה-SQL במיגרציות גוברים. ההפעלה השוטפת: `RUNBOOK.md`; צעדי הבעלים: `OWNER-STEPS.md`; רשימת ה-cutover: `CUTOVER-CHECKLIST.md`.

**מצב seeld-site:** 29 מיגרציות הוחלו (8 יסוד, 17 של v2.2 עד `20261119091600`, ו-4 של נתונים: `095000`, `095100`, `095200`, `095300`). פונקציות פרוסות: `staff-invite` גרסה 2 (`verify_jwt=true`), `lead-intake`, `notify-worker`, `chat-bot`, `health` בגרסה 2, ו-`fetch-cma-data` בגרסה 1 (כולן `verify_jwt=false`). ב-Vault קיימים `project_url`, `edge_cron_secret`, `pii_enc_key`, `national_id_hmac_key` (נוצרו על ידי הסוכנים בזמן ההקמה, בלי להדפיס ערכים; הנאמנות הלא מקוונת עדיין אצל הבעלים), וגם הסוד המת `customers_transport_key`. `edge_cron_enabled=false`. האתר החי עדיין על טוקיו.

**מסד (§5, §9, §13):**
1. שער `edge_cron_enabled` נבנה כבר ב-`20261119090700` ולא ב-`091400` כפי שתוכנן.
2. `ops.copy_auth_events` מקבלת `p_limit integer`.
3. התפקיד `content_dump` נוצר ב-`20261119091500` (ולא ב-`091400`). בדיקת `00_policy_lint` מכשילה CI אם תתווסף טבלת תוכן בלי מדיניות `content_dump_select`.
4. התראות של צעדי ה-watchdog נושאות SQLSTATE בלבד, בלי טקסט השגיאה.
5. `20261119091600`: נמעני התראה נקבעים מ-`ops.alert_recipients` ברגע ש-`notify-worker` לוקח את השורה, ולא ביצירת ההתראה. רשימה ריקה מסתיימת ב-`no_recipients`, בניסיונות חוזרים, ולבסוף `undeliverable`.
6. משימת `cma-refresh-views-daily` מהיסוד הוסרה ב-`091100`; פועלות בדיוק חמש המשימות של §9.
7. הצעד "להחיל קודם על ענף" לא בוצע; המיגרציות הוחלו ישירות על seeld-site אחרי replay מלא בקונטיינר.

**בדיקות (נספח א, §15):** כל `supabase/tests/*.test.sql` רצים כ-`postgres`, כולל `07`. בדיקה `supabase/tests/replay_only/10_hook_as_auth_admin.test.sql` רצה רק ב-`replay-local.sh` כ-`supabase_admin` (מדלגת אם אין אפשרות להחליף תפקיד). ה-CI רץ על `ubuntu-24.04` (לא `ubuntu-latest`).

**אימות (§6):** ב-`supabase/config.toml` הערך `[auth.email] enable_signup = true` הוא מתג ספק האימייל, וחייב להיות דלוק כדי שהצוות יוכל להתחבר. ההרשמה עצמה כבויה ב-`[auth] enable_signup = false`. `scripts/ci/check-supabase-config.mjs` אוכף את זה. `staff-invite` כוללת גם פעולת `accept`, וכל הלוגיקה שלה נשארה בתוך הפונקציה: `_shared/auth.ts` לא הורחב.

**פונקציות (§7):** `lead-intake` מחזירה 423 `feature_disabled` כשהטופס סגור (במקום 503), ושתי תשובות 403 נושאות `details.field` (`origin` או `turnstile`). `chat-bot` נכשלת סגור: אם בדיקת המסד לא זמינה, הצ'אט מחזיר 503 ו-Gemini לא נקרא. אין Turnstile בצ'אט. מייל הליד לצוות לא כולל פרטים אישיים עד שתיווצר `api.lead_notify_details` ויוגדר `NOTIFY_INCLUDE_PII=true`.

**Vercel ו-CSP (§11):** עד ה-cutover ה-CSP כולל גם את `https://` וגם את `wss://` של טוקיו, בכוונה. `scripts/ci/check-csp-bundle.mjs` ו-`preview-smoke` מכשילים אם ה-CSP לא תואם לפרויקטים שהבאנדל קורא אליהם; שני מקורות טוקיו יוצאים באותו PR שמעביר את `VITE_SUPABASE_URL`; אחריו `CUTOVER_DONE=1` אוסר כל אזכור של טוקיו. `api/*.ts` עברו ל-Node. במצב legacy הבאנדל עדיין כולל את קוד v2 כקוד מת (כ-1.26KB gzip). `preview-smoke` אוכף גם עימוד: היום הייצור מחזיר 1,000 מתוך 1,442 קרנות ב-`/api/funds`.

**CI (§12):** `preview-smoke` בודק את חסימת ההרשמה מתוך `GET /auth/v1/settings` ולא מהרשמה שנדחתה (כש-CAPTCHA פעיל, CAPTCHA דוחה לפני כן). קוד ה-smoke נלקח מהענף הראשי. `migrate.yml` מריץ לפני כל דחיפה את `scripts/ci/check-migration-history.mjs`.

**מעבר (§18):** PDage הוסר מהנתב ומהבאנדל, אבל קבצי המודול עדיין במאגר עד אישור פרטני של הבעלים. מסלולי ההשקעה: 1,040 פעילים (`source_period=202609`) במקום 571; גוף הפונקציה התקף הוא של `095300`. העתקת הלקוחות בוצעה בסטייה מ-ADR-41 ומשלב 24, וכללה אירוע פרטיות (מפתח ההעברה והבלוקים עברו דרך תמליל הסוכן); פירוט ב-`DATA-MIGRATION.md` סעיף 2א, והנתיב הוצא משימוש ב-`095300`. `HEALTH_URL` מוגדר רק אחרי שה-outbox התרוקן בהצלחה בפעם הראשונה.
