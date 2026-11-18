# זהות וגישת צוות (T1)

מסמך החוזה של הזהות בפרויקט `seeld-site` (`qxhpolktdfgcbxtfxgov`). הוא נגזר מ-FOUNDATION.md גרסה 2.2 (§6, §7, ADR-22, ADR-29, ADR-30) ומ-IMPLEMENTATION-PLAN.md (T1). אם יש סתירה, ה-SQL במיגרציות גובר על הניסוח כאן.

## 1. עקרונות

- צוות בלבד: אימייל, סיסמה ו-TOTP חובה. אין התחברות חברתית, אין SMS ואין הרשמה עצמית.
- משתמש נוצר רק כשיש הזמנת **סגל** פתוחה. ה-hook `private.hook_before_user_created` דוחה כל דבר אחר, כולל הזמנות `client`, עד שהפורטל ייבנה.
- התפקיד והסוכנות נלקחים משורת ההזמנה בלבד ולא מהבקשה (`api.invitation_create`, `api.staff_provision`).
- המסד הוא הסמכות: `private.assert_staff()` דורש `aal2`. `private.assert_admin_fresh()` דורש אדמין פעיל, לא נעול, עם TOTP מאומת בתוך `stepup_max_age_sec` (ברירת מחדל 900 שניות, טווח 300 עד 3600).
- הפונקציה `staff-invite` בודקת שוב רק מה שאפשר לבדוק בלי מסד: JWT תקין, `aal2`, ו-TOTP שאינו ישן מ-3600 שניות. מעבר לזה היא תמיד שואלת את המסד.

## 2. רכיבים

| רכיב | מקום | תפקיד |
|---|---|---|
| `core.invitations` | 20261119090600 | הזמנה: `kind`, `role`, `agency_id`, תקפה 24 ש'. הזמנה פתוחה אחת לכל אימייל |
| `private.hook_before_user_created` | 090600, הוחלף ב-091400 | מקבל רק הזמנת `staff` פתוחה. דחייה מחזירה 403 ונרשמת ב-`audit.auth_events` |
| `api.invitation_create / invitation_resend / staff_provision` | 090800 | RPC שירות (`service_role` בלבד), נקראות מ-`staff-invite` |
| `staff.admin_assert_fresh` | 090300 | בדיקת אדמין טרי עם ה-JWT של המשתמש. מחזירה `{user_id, agency_id}` |
| `staff.admin_staff_disable / admin_staff_enable / admin_staff_unlock` | 090900, 091400 | השבתה, הפעלה ושחרור נעילה, בתוך אותה סוכנות, עם שורת `ACTION` ב-`audit.log` |
| `ops.watchdog` (שלב auth) | 091100 | נעילה אוטומטית ל-30 דק'. כבויה עד יום 3 |
| `supabase/functions/staff-invite` | הפונקציה | invite, resend, disable, enable, accept |
| `scripts/identity/bootstrap-first-admin.sql` | סקריפט | אדמין ראשון, מריץ הבעלים |
| `scripts/identity/break-glass.sql` | סקריפט | שחרור אדמין יחיד שננעל או הושבת |
| `scripts/identity/verify-identity.mjs` | סקריפט | dry-run לקריאה בלבד, ומצב `--enroll` ל-TOTP |

## 3. אדמין ראשון (חד-פעמי, הבעלים)

הסקריפט `scripts/identity/bootstrap-first-admin.sql` עם שני placeholders: `<ADMIN_EMAIL>` ו-`<DISPLAY_NAME>`. ממלאים אותם בעורך בלבד ולא שומרים עותק ממולא במאגר.

1. **שלב 1, SQL Editor:** פותח הזמנת `staff/admin` בסוכנות ברירת המחדל. הסקריפט מסרב אם ה-placeholder לא הוחלף, ומסרב אם כבר קיים אדמין פעיל (מאותו רגע מזמינים רק דרך `staff-invite`). הרצה חוזרת מרעננת את התוקף ל-24 ש'.
2. **שלב 2, Dashboard:** אחת משתי דרכים:
   - Authentication > Users > Invite user. דורש SMTP תקין. הקישור תקף 10 דקות, ואם פג: Send password recovery.
   - Authentication > Users > Add user > Create new user, עם סיסמה חזקה ו-Auto Confirm. לא צריך אימייל, וה-hook עדיין דורש את ההזמנה משלב 1.
3. **שלב 3, SQL Editor:** `api.staff_provision` יוצר את שורת `core.staff` מתוך ההזמנה. מצופה: `{"ok": true, "role": "admin", ...}`.
4. **שלב 4:** בדיקה. `verified_totp_factors` צריך להיות 1 אחרי רישום TOTP (§5). עד אז כל RPC של צוות מחזיר PT403.
5. **רישום TOTP:** באפליקציית הסוכנים (שלב ב'), או עכשיו:
   ```
   SEELD_PUBLISHABLE_KEY=... STAFF_EMAIL=... STAFF_PASSWORD=... STAFF_TOTP_OUT=<קובץ מחוץ למאגר> node scripts/identity/verify-identity.mjs --enroll
   ```
   הסקריפט כותב את ה-otpauth URI לקובץ (לא למסך), מבקש קוד בן 6 ספרות ומוודא `aal2` ו-`staff.admin_assert_fresh`. אחרי הוספה לאפליקציית המאמת מוחקים את הקובץ. אם CAPTCHA של Auth פעיל, צריך גם `STAFF_CAPTCHA_TOKEN`.

אומת על replay מקומי (27 מיגרציות): placeholder נדחה; הזמנה נפתחה ורועננה; `staff_provision` החזיר admin; ניסיון שני כשיש אדמין נדחה. `auth.users.banned_until` ו-`auth.mfa_factors` קיימים בפרויקט המתארח. ב-replay המקומי אין אותם (stub), ולכן שלב 4 ו-break-glass שלב 2 נבדקו רק מול הקטלוג המתארח.

## 4. מחזור החיים של הזמנה

```
admin (aal2, TOTP טרי)
  -> staff-invite {action:"invite", email, role}
       staff.admin_assert_fresh (JWT של האדמין)
       api.invitation_create(email,'staff',role,admin)   -- PT409 invitation_open אם יש הזמנה פתוחה בתוקף
       שליחת קישור (ראו "מסירה")                         -- 502 delivery_failed: ההזמנה נשארת, משתמשים ב-resend
  מוזמן לוחץ על הקישור (תקף 10 דק', חד-פעמי)
       GoTrue יוצר את המשתמש -> hook: הזמנת staff פתוחה? כן -> נוצר
       /app/auth/accept: session aal1 -> updateUser({password}) -> רישום TOTP -> verify -> aal2
  -> staff-invite {action:"accept", display_name}  (aal2, בלי דרישת טריות)
       api.staff_provision(caller, name)  -- role ו-agency מההזמנה; accepted_at נקבע
       PT409 invitation_missing (פגה או לא קיימת) / staff_exists
```

**מסירה** (`chooseDelivery`):

| מצב | תנאי | מה קורה |
|---|---|---|
| `resend` | `RESEND_API_KEY` ו-`STAFF_INVITE_FROM` (או `NOTIFY_FROM`) מוגדרים | `auth.admin.generateLink` ומייל בעברית RTL דרך Resend עם `Idempotency-Key: staff-invite/<mode>/<uuid חדש בשרת>`. המפתח לא נגזר לעולם מ-`x-request-id` של הקורא. הקישור לא חוזר לקורא |
| `smtp` | production בלי Resend | `inviteUserByEmail` דרך ה-SMTP של Auth. recovery: משתמש שלא אישר מקבל הזמנה מחדש, ומשתמש מאושר מקבל `resetPasswordForEmail` |
| `link` | `SEELD_ENV=preview` או `local` בלי Resend | **הזמנה בלבד**: `generateLink` מסוג invite, והקישור חוזר לאדמין הקורא (`action_link`). קישור recovery (כניסה לחשבון קיים) לא נוצר ולא חוזר לעולם: `409 recovery_link_not_returned`. ב-production אין `link` בכלל |

`SEELD_ENV` חסר או לא מוכר נחשב production. ב-production כתובת `STAFF_INVITE_REDIRECT_URL` שאינה https מוחלפת בברירת המחדל `https://seeld.co.il/app/auth/accept`, שנמצאת ב-Redirect URLs (`https://seeld.co.il/**`).

> **אזהרה:** ב-seeld-site (`qxhpolktdfgcbxtfxgov`) אסור להגדיר `SEELD_ENV` בכלל. הערכים `preview`/`local` מדליקים מסירת `link`, שבה קישורי הזמנה חיים חוזרים לאדמין הקורא במקום להגיע לתיבת המוזמן. `SEELD_ENV` מוגדר רק בפרויקט preview/מקומי נפרד.

**כתובת שכבר יש לה חשבון:** GoTrue מסרב להזמין כתובת של משתמש מאושר (`email_exists`), והפונקציה מחזירה `409 user_exists` (`details.next:"enable_if_disabled_staff"`, `details.invitation_id`). איש צוות מושבת **מוחזר עם `enable`**, לא בהזמנה מחדש. שורת ההזמנה שנפתחה נשארת עד שפג תוקפה (24 ש') ואינה מאפשרת דבר לאיש צוות קיים (`staff_provision` מחזיר `staff_exists`).

**שליחה חוזרת** (`{action:"resend", email}`): `api.invitation_resend` מרעננת הזמנה פתוחה ל-24 ש' ומחזירה `mode`:
- `invite`: אין עדיין משתמש Auth.
- `recovery`: יש משתמש שעוד לא נכנס. זה כולל קישור הזמנה ישן מ-10 דקות. הבדיקה "הזמנה ישנה מ-10 דק' ניתנת לשליחה חוזרת" מכוסה כאן. הקישור הולך רק לתיבת המשתמש (Resend או SMTP). במסירת `link` התשובה היא `409 recovery_link_not_returned` ולא נוצר קישור.
- `PT409 already_active`: המשתמש כבר נכנס. אין מה לשלוח.
- `PT404 not_found:invitation`: אין הזמנה בסוכנות של האדמין.

## 5. TOTP: חוזה השרת לאפליקציית הסוכנים (הקוד בשלב ב')

| מסך / שלב | קריאות supabase-js | תנאי מעבר |
|---|---|---|
| כניסה | `auth.signInWithPassword({email, password, options:{captchaToken}})` (Turnstile) | session `aal1` |
| שער TOTP | `auth.mfa.getAuthenticatorAssuranceLevel()`. אם `nextLevel='aal2'` ו-`currentLevel='aal1'`: `mfa.challenge` ואז `mfa.verify` (או `challengeAndVerify`) | `aal2`. בלי פקטור מאומת: מסך רישום (`mfa.enroll({factorType:'totp'})`, QR, ואז verify) |
| `/app/auth/accept` | session מהקישור, `updateUser({password})`, רישום TOTP, verify, ואז `staff-invite` `accept` | `201 {ok, role, agency_id}` |
| step-up לפני פעולת אדמין | אם ה-`amr` מסוג totp ישן מ-`stepup_max_age_sec` (900), שוב `challengeAndVerify` (יוצר `amr` totp חדש) ואז `refreshSession` | `staff.admin_assert_fresh` עובר |
| טיפול בשגיאות | `forbidden:staff_aal2` מוביל לשער TOTP. `forbidden:admin_fresh_totp` מוביל ל-step-up. `PT423 feature_disabled:*` הוא מתג כבוי | |

הגדרות Auth (FOUNDATION §6): `enable_signup=false`, סשן 12 ש', חוסר פעילות שעה, JWT של 15 דק', `otp_expiry=600`, TOTP enroll/verify פעילים.

## 6. API של `staff-invite`

`POST /functions/v1/staff-invite`, `verify_jwt=true`, `Authorization: Bearer <access token של המשתמש>`, `content-type: application/json`, גוף עד 4KB. מפתחות לא מוכרים נדחים.

| action | גוף | הרשאה | הצלחה |
|---|---|---|---|
| `invite` | `{email, role: agent\|manager\|admin}` | אדמין טרי | `201 {ok, invitation_id, delivery, action_link?}` |
| `resend` | `{email}` | אדמין טרי | `200 {ok, invitation_id, mode, delivery, action_link?}` |
| `disable` | `{user_id}` | אדמין טרי, לא עצמו | `200 {ok, user_id, active:false, banned:true, already}`. קודם `staff.admin_staff_disable`, אחר כך `ban_duration:'876000h'` |
| `enable` | `{user_id}` | אדמין טרי | `200 {ok, user_id, active:true, banned:false, already}`. קודם `staff.admin_staff_enable`, **אחר כך** `ban_duration:'none'` |
| `accept` | `{display_name}` (2 עד 80) | כל משתמש `aal2` | `201 {ok, role, agency_id}` |

`disable` ו-`enable` הן אידמפוטנטיות: אם ה-RPC מחזיר 404 כי השורה כבר במצב המבוקש (למשל אחרי ban שנכשל), שלב ה-Auth רץ שוב ו-`already=true`.

| HTTP | `error.code` / `message` | מתי |
|---|---|---|
| 401 | (gateway) `UNAUTHORIZED_*` | אין JWT או JWT לא תקין |
| 401 | `unauthenticated` / `invalid_token`, `not_a_user_session` | מפתח anon, טוקן לא מאומת |
| 400 | `bad_request` / `invalid_json`, `invalid_input:*`, `unknown_keys` | צורה |
| 403 | `forbidden` / `forbidden:aal2_required`, `forbidden:admin_fresh_totp` | MFA או טריות, מקדם-בדיקה או מהמסד |
| 404 / 409 | `not_found` / `conflict`: `invitation_open`, `already_active`, `cannot_disable_self`, `staff_exists`, `invitation_missing`, `user_exists` (כתובת עם חשבון קיים), `recovery_link_not_returned` (מסירת `link` לא מחזירה קישור recovery) | מצב |
| 405 / 413 / 415 | שיטה, גודל, content-type | |
| 423 | `locked` / `feature_disabled:*` | מתג |
| 502 | `delivery_failed` (`details.invitation_id`, `next:"resend"`), `ban_failed`, `unban_failed` (`details.db_state`) | ספק חיצוני או Auth נכשל אחרי שהמסד כבר השתנה |
| 503 | `unavailable` / `not_configured`, `staff_api_unavailable` | סוד חסר, או `staff` לא חשוף ב-Data API |

שגיאות מסד שאינן אסימונים שלנו מוסתרות (`internal`). הלוג רושם מזהים וסיבות בלבד, בלי אימייל, שם או טוקן. נבדק בלוג המתארח.

## 7. השבתה, נעילה ו-break-glass

- **השבתה:** `active=false` עוצר גישה לנתונים מיד (`private.staff_role()` מחזיר null). ה-ban חוסם refresh, וה-access token האחרון פג תוך 15 דק'.
- **הפעלה:** ה-RPC מאפס גם `locked_until`, ואחריו ה-unban.
- **נעילה אוטומטית (ADR-30):** כבויה עד יום 3 (`auth_lock_enabled=false`, `auth_failure_actions=''`). כשתופעל: 10 כשלונות ב-15 דק' מ-2 מקורות IP לפחות נועלים ל-30 דק' עם התראה `staff_locked`. אדמין לא ננעל לעולם (רק התראה). מקור יחיד נשאר לטיפול של GoTrue ו-CAPTCHA.
- **שחרור נעילה:** `staff.admin_staff_unlock(user_id)` ישירות דרך PostgREST (schema `staff`), אדמין טרי. אין צורך ב-`staff-invite` כי אין שלב Auth.
- **Break-glass** (אדמין יחיד נעול או מושבת): `scripts/identity/break-glass.sql` (`<USER_ID>`):
  1. `update core.staff set locked_until=null, active=true` ושורת `audit.log` עם `owner_sql`/`break_glass_unlock`.
  2. `update auth.users set banned_until=null`, או Dashboard > Users > Unban.
  3. בדיקה. התרגיל ביום 3 על אדמין בדיקה, והקבלה היא כניסה מוצלחת.

## 8. הגדרות וסודות (שמות בלבד)

| שם | חובה | הערה |
|---|---|---|
| `SEELD_SECRET_KEY` | כן | מפתח `sb_secret_*`. בלעדיו כל פעולה מחזירה 503 אחרי אימות הקורא |
| `RESEND_API_KEY` + `STAFF_INVITE_FROM` (או `NOTIFY_FROM`) | לא | מסירה דרך Resend. בלעדיהם: SMTP של Auth ב-production |
| `SEELD_ENV` | **לא להגדיר ב-seeld-site** | `preview`/`local` מאפשרים `link` (הזמנה בלבד), רק בפרויקט שאינו production. חסר = production |
| `STAFF_INVITE_REDIRECT_URL` | לא | ברירת המחדל `https://seeld.co.il/app/auth/accept` |
| `ALLOWED_ORIGINS` | לא | ברירת המחדל seeld.co.il ו-www |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | אוטומטי | מוזרקים על ידי הפלטפורמה. אפשר לעקוף עם `SEELD_PUBLISHABLE_KEY` |

## 9. צעדי הבעלים

1. Edge Functions > Secrets: `SEELD_SECRET_KEY` (חובה לפני כל הזמנה). לא להוסיף `SEELD_ENV` ב-seeld-site.
2. Authentication > Emails > SMTP Settings: Resend SMTP (host `smtp.resend.com`, port 465, user `resend`, סיסמה = מפתח Resend, sender מדומיין מאומת). בלי זה מייל ההזמנה של GoTrue מוגבל מאוד. לחלופין, ב-Edge Secrets: `RESEND_API_KEY` ו-`STAFF_INVITE_FROM`.
3. Authentication > Hooks: Before User Created מצביע על `private.hook_before_user_created` (Postgres). זה חובה לפני ההזמנה הראשונה.
4. Authentication > Attack Protection: CAPTCHA (Turnstile) כשמפתחות Cloudflare יגיעו. אז האפליקציה ו-`--enroll` צריכים `captchaToken`.
5. Data API: הסכימה `staff` חשופה. בבדיקה האחרונה anon קיבל 42501 ולא PGRST106, כלומר היא כבר חשופה.
6. אדמין ראשון: §3 (סקריפט, Dashboard, `staff_provision`, TOTP).
7. יום 3: כניסה כושלת אמיתית, ממנה ממלאים `auth_failure_actions` ומדליקים `auth_lock_enabled`. תרגיל break-glass על אדמין בדיקה. disable ואחריו refresh נכשל; enable ואחריו כניסה מצליחה.

## 10. אימות

| בדיקה | פקודה | תוצאה |
|---|---|---|
| Deno: בדיקות טיפוסים, lint, fmt, 38 בדיקות | `docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 test staff-invite/` (וגם `check staff-invite/index.ts`, `lint`, `fmt --check --line-width 140`) | 38 passed, 0 failed |
| replay מקומי | `NAME=t1-identity-replay KEEP=1 bash supabase/tests/replay-local.sh` | 27 migrations, PASS |
| bootstrap ו-break-glass על ה-replay | §3 | כצפוי (ראו §3) |
| dry-run מתארח | `SEELD_PUBLISHABLE_KEY=... SEELD_ANON_JWT=... node scripts/identity/verify-identity.mjs` | 14 passed, 0 failed |
| smoke מתארח | curl: בלי auth 401; JWT פגום 401; anon עם גוף שגוי 400 (×4); anon עם גוף תקין 401 (×3); GET 405; text/plain 415; OPTIONS ממקור מותר 204 עם ACAO; ממקור זר בלי ACAO | הכל כצפוי, ולא נשלח אף מייל |

## 11. הקשחות SQL פתוחות (בעלות T0, מיגרציה הבאה)

הפונקציה כבר חוסמת את הנזק בצד שלה. אלה ההקשחות בצד המסד (T1 לא מוסיף מיגרציות):

1. `api.invitation_resend`: כש-`accepted_at is null` ויש משתמש Auth, להחזיר `recovery` רק אם אין לו שורה ב-`core.staff`, או שהשורה שלו ב-`v_agency`. אחרת `PT409 already_registered`. כך אדמין בסוכנות אחת לא יכול לגרום ל-SEELD לשלוח מייל recovery אמיתי לאיש צוות של סוכנות אחרת או ללקוח פורטל.
2. `staff.admin_staff_disable`: לפוג את ההזמנות הפתוחות שהמושבת שלח (`update core.invitations set expires_at = now() where invited_by = p_user_id and accepted_at is null`), כדי שהזמנה מאדמין מושבת לא תישאר שמישה 24 ש'. לחלופין `api.staff_provision` יבדוק ש-`invited_by` עדיין אדמין פעיל.
