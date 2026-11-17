# ארכיטקטורת הפלטפורמה של SEELD

תאריך: 17.11.2026 · סטטוס: תשתית בלבד. לא נבנו SMS, עיבוד דוחות, תורים או כל פיתוח ספציפי. כל מה שלהלן הוא שלד מודולרי, מוכן לחיבור, בלי שינוי התנהגות באתר. ראו גם `docs/product/CLIENT-PORTAL-PLAN.md`.

## 1. עקרונות
1. **ציבורי לא נוגע בפלטפורמה.** עמודי האתר הציבורי לא מייבאים כלום מ-`src/platform`. נאכף בבדיקה (`src/test/platform.test.ts`, "platform isolation") ובתקציב גודל החבילה (`npm run size:check`).
2. **מודולרי.** כל יכולת היא מודול עם ממשק (interface) ומימוש דק. מחליפים מימוש בלי לגעת בצרכנים.
3. **בטוח כברירת מחדל.** RLS קודם, הרשאה מינימלית, יומן ביקורת, בלי PII ביומנים.
4. **בודק את עצמו.** CI בכל שינוי, site-watch כל 30 דקות, smoke אחרי פריסה.
5. **שום דבר לא מופעל בלי אישור.** הצעות SQL נמצאות ב-`supabase/proposed/` ולא ב-`migrations`. פונקציית `api-v1` לא נפרסת.

## 2. שכבות ומודולים

```
דפדפן (Vite + React, RTL)
 ├─ אתר ציבורי  (src/pages, src/components)        <- מרונדר מראש, בלי platform
 └─ אזור אישי / סוכנים (עתידי)                      <- יצרוך את src/platform
        │
src/platform   (TypeScript טהור, בלי React, בלי ייבוא מעמודים)
 ├─ config      env מאומת ב-zod (local / preview / production)
 ├─ api         לקוח fetch מוקלד ל-/api/v1: timeout, retry+backoff, שגיאות מנורמלות, request id
 ├─ auth        ממשק ספקי כניסה, TOTP MFA, חוזה הגדרות אבטחת סוכן
 ├─ documents   מתאמי מקורות (מסלקה, הר הביטוח, מקור שלישי), סכמות, צינור נרמול, מודל סטטוס
 ├─ events      ממשק אירועים ויומן ביקורת (sinks)
 └─ flags       דגלי יכולת: מפה סטטית + דריסה ב-env
        │  HTTPS
Edge: supabase/functions
 ├─ _shared     cors, auth guard, rate limiter, logger עם הסתרת PII, פורמט שגיאה אחיד, request id
 ├─ api-v1      router + GET /health + GET /version (שלד, לא נפרס)
 └─ פונקציות קיימות (לא משתנות)
        │
Supabase: Postgres + RLS, Auth (+MFA), Storage פרטי, cron
```

| מודול | אחריות | מה לא באחריותו |
|---|---|---|
| `config` | קריאה ואימות של env, ברירות מחדל | סודות (אין סודות בדפדפן) |
| `api` | תקשורת עם `/api/v1` | לוגיקה עסקית, UI |
| `auth` | חוזים ומעטפות דקות ל-Supabase Auth | ניהול סשן באפליקציה (נשאר `useAuth` הקיים עד לאישור) |
| `documents` | הגדרת מקורות, סכמות, סטטוס, צינור | פענוח בפועל (טרם נבנה) |
| `events` | אירוע ביקורת מוקלד, סינון PII | אחסון (ה-sink בצד שרת) |
| `flags` | הדלקה וכיבוי של יכולות | ניסויים A/B |

## 3. סביבות

| | local | preview | production |
|---|---|---|---|
| דומיין | `localhost:5173` | כתובת Vercel לכל ענף/PR | `seeld.co.il` |
| Supabase | פרויקט מקומי (`supabase start`) או branch | **branch של Supabase** (מוצע) | פרויקט `lvifatyksqizwcutfbqp` |
| משתנים | `.env.local` (לא נכנס ל-git) | משתני Vercel (Preview) | משתני Vercel (Production) |
| `VITE_APP_ENV` | local | preview | production |
| דגלים | הכול ניתן להדלקה | לפי ענף | רק מה שאושר |

כלל: פיתוח של טבלאות והרשאות רץ קודם על branch/מקומי. מיגרציה לפרודקשן רק אחרי אישור הבעלים.

## 4. קונפיגורציה וסודות
- **ציבורי (נכנס לחבילה):** כל מה שמתחיל ב-`VITE_`: כתובת Supabase, מפתח publishable (anon), דגלים. נבדק בתחילת `src/platform/config` (zod). ערך שגוי = שגיאה ברורה, לא תקלה שקטה.
- **סודי (לעולם לא בדפדפן):** `SUPABASE_SERVICE_ROLE_KEY`, מפתחות ספקים, מפתחות API. נשמרים רק ב-Supabase Edge Function secrets, בסודות GitHub (`VERCEL_TOKEN`) או במשתני Vercel מסוג Sensitive.
- אין קבצי `.env` ב-git. אין סודות ביומנים. סיבוב מפתחות: מתועד ב-RUNBOOK, ובעבור מפתחות API חלון חפיפה (ראו `API-CLIENT-AUTH.md`).
- קיים כיום ערך ברירת מחדל של המפתח הציבורי בקוד (`src/integrations/supabase/config.ts`). זה תקין כי הוא publishable, אך שינוי פרויקט ידרוש עדכון משתני Vercel.

## 5. אסטרטגיית פרויקטים: Supabase ו-Vercel
**המצב היום (אומת):** פרויקט Supabase אחד משותף (`lvifatyksqizwcutfbqp`, שם SEELD) ופרויקט Vercel אחד `seeld`. הפרויקט המשותף מחזיק גם פונקציות ותוכן של מוצרים אחרים, לכן כל מיגרציה בו מחייבת בדיקה מול הסכמה החיה.

**המלצה:**
1. Supabase: להישאר בפרויקט אחד לייצור, ולהוסיף **branching** לפיתוח (preview לכל ענף). פרויקט נפרד לכל מוצר רק בהחלטת הבעלים.
2. Vercel: פרויקט אחד, `main` = production, ענפים = preview. פריסה נשארת דרך `.github/workflows/deploy-vercel.yml`.
3. גבולות: סכמה `public` לתוכן האתר, וטבלאות הפלטפורמה החדשות (`supabase/proposed/`) תחת אותן כללי RLS. אפשרות לעתיד: סכמה נפרדת `platform`.

### 5.1 החלטה לבעלים: אזור (region) ושהיות
**עובדות מאומתות:** פרויקט Supabase רץ ב-`ap-northeast-1` (טוקיו). בנייה ב-Vercel רצה ב-`iad1` (וושינגטון, ארה"ב). המשתמשים בישראל.

**השפעה (הערכות סדר גודל, לא נמדדו; יש למדוד לפני החלטה):**
- דפדפן בישראל <-> Supabase בטוקיו: כ-250 עד 300 מילישניות הלוך-חזור לכל בקשה (REST, Auth, Storage). כניסה למערכת וטעינת נתונים אישיים כוללות כמה בקשות רציפות, כלומר שניות.
- פונקציית Vercel ב-`iad1` שמדברת עם Supabase בטוקיו: כ-150 עד 200 מילישניות לכל שאילתה, ועוד המסלול מהמשתמש.
- עמודי האתר הציבורי מרונדרים מראש ומוגשים מ-CDN, לכן **אינם מושפעים**. ההשפעה היא על כניסה, אזור אישי, טפסים (פניות), ועל כל מה שנבנה על `/api/v1`.

**אזורים מומלצים:** Supabase ב-`eu-central-1` (פרנקפורט), פונקציות Vercel ב-`fra1`. פרנקפורט קרובה לישראל (כ-60 עד 80 מילישניות) ושני השירותים באותו אזור.

**מחיר ההחלטה:** שינוי אזור של Supabase אינו הגדרה אלא **יצירת פרויקט חדש והעברת נתונים** (dump/restore), עדכון מפתחות, כתובות ו-webhooks (Surense, Make), עדכון CSP ב-`vercel.json`, והתראה על חלון תחזוקה. עדיף לעשות זאת **לפני** שהאזור האישי מחזיק נתוני לקוחות. 
**לא שונה דבר.** ההחלטה נדרשת מהבעלים: (א) להישאר בטוקיו, (ב) להעביר לפרנקפורט לפני עליית האזור האישי, (ג) לפתוח פרויקט פרנקפורט חדש רק לפלטפורמה ולהשאיר את הקיים.

## 6. תצפית (observability)
- **יומנים:** JSON שורה לאירוע (`_shared/logger.ts`): `ts, level, msg, requestId, ...`. הסתרה אוטומטית של תעודות זהות, טלפונים, אימיילים, טוקנים (ובדיקות יחידה לכך).
- **Request id:** כל בקשה מקבלת `x-request-id` (נכנס או נוצר), חוזר בתגובה ובשגיאה, ונרשם בלוגים וביומן ביקורת. לקוח ה-API שולח אותו אוטומטית.
- **מדדים:** Vercel Analytics/Runtime Logs לצד הלקוח, יומני Supabase (`query_logs`) לצד השרת.
- **ניטור פעיל:** `site-watch` (כל 30 דקות), `npm run smoke` (דפדפן), `dist/health.json` (גרסה, commit, מספר נתיבים) ו-`GET /api/v1/health`.
- **שגיאות לקוח:** עתידי, הצעה: sink ל-`events` בלי PII.

## 7. עקרונות אבטחה
1. **RLS קודם.** כל טבלה חדשה: `enable row level security` באותה מיגרציה. מדיניות עם `(select auth.uid())` (מטמון ב-planner) ואינדקס על כל עמודה שמשמשת מדיניות וכל מפתח זר.
2. **הרשאה מינימלית.** `revoke all` מ-`anon`/`authenticated` ואז `grant` מפורש. כתיבה של סטטוס, תוצאות ורישום ביקורת: service role בלבד. פונקציות `security definer` עם `search_path = ''` ובלי `execute` ל-`public`.
3. **יומן ביקורת append-only** (`audit_log`, טריגר חוסם update/delete). נרשמים: כניסה, MFA, העלאה, צפייה, שינוי הגדרות, יצירת/ביטול מפתח API.
4. **בלי PII ביומנים.** מזהים וקודים בלבד. בקבצים מזהים לפי hash של ת"ז, לא הערך.
5. **MFA לסוכנים.** TOTP (Google Authenticator) דרך Supabase Auth MFA. מדיניות ברירת מחדל: `requireTotp`, בדיקה חוזרת כל 30 יום, פסק זמן חוסר פעילות. ה-API של הסוכנים ידרוש `aal2`. חוזה: `src/platform/auth/types.ts`.
6. **SMS.** מוגדר כממשק (`SmsOtpProvider`) ו-placeholder שמחזיר `not_supported`. ספק ובנייה בהמשך.
7. **אחסון קבצים:** bucket פרטי, נתיב עם קידומת `owner_id`, קישורים חתומים קצרי חיים, סריקה ובדיקת סוג/גודל בצד שרת.
8. **CORS** ברשימה מותרת (`ALLOWED_ORIGINS`), לא `*`, בפונקציות חדשות. כותרות אבטחה ו-CSP כבר ב-`vercel.json`.
9. **תלויות:** נעילת גרסאות, `npm ci` ב-CI.

## 8. אימות ו-API
- משתמשים: JWT של Supabase. מערכות חיצוניות: מפתח API (`x-api-key`, hash בלבד, scopes, מגבלת קצב). ראו `API-CLIENT-AUTH.md`.
- חוזה: `docs/platform/openapi.yaml`. שלד: `supabase/functions/api-v1` (נתיבים `/health`, `/version`).
- פורמט שגיאה אחיד: `{ "error": { "code", "message", "requestId", "details?" } }` ובלקוח `ApiError` עם `code`, `status`, `retryable`.
- Rate limit: חוזה `RateLimiter`, מימוש זיכרון (לפיתוח) ומימוש עתידי מעל `consume_rate_limit` (הצעה 03).
- גרסאות: `/api/v1` יציב. שינוי שובר = `/api/v2`.
- כתובת: היום `.../functions/v1/api-v1`. כינוי ציבורי `seeld.co.il/api/v1` דורש rewrite ב-Vercel (לא הוגדר).

## 9. איך מוסיפים אינטגרציה או מקור מסמך חדש

### מקור מסמך חדש (למשל "מקור שלישי" שהוגדר)
1. ב-`src/platform/documents/schemas.ts`: להגדיר סכמת zod לפורמט הגולמי של המקור (להחליף TODO).
2. ב-`registry.ts`: ליצור `SourceAdapter` (`validate`, `parse`, `normalise`) ולרשום `registerSource`. עד שיש parser המימוש זורק `NotImplementedError` והצינור מדווח `failed/not_implemented`.
3. להוסיף מקור ל-`SOURCE_TYPES` ול-CHECK בהצעות SQL 04 ו-05, ולשורת קטלוג ב-`document_sources` (`enabled=false`).
4. בדיקות: קבצי דוגמה אנונימיים ב-`src/test/fixtures` (בלי נתוני אמת) ובדיקת סכמה.
5. הדלקה: דגל `portal.documents` ל-preview, ורק אז לפרודקשן.
6. עיבוד בפועל רץ בצד שרת (פונקציית worker, service role). הדפדפן אף פעם לא מפענח קבצי לקוח.

### אינטגרציה (מערכת חיצונית שקוראת אלינו או שאנו קוראים אליה)
- **נכנסת (הם קוראים ל-API):** להוסיף route ב-`api-v1/router.ts` עם `auth` ו-`scope`, לתעד ב-`openapi.yaml`, לכתוב בדיקה, ליצור `api_clients` ללקוח עם scopes מינימליים.
- **יוצאת (אנו קוראים):** מעטפת בצד שרת בלבד, סוד ב-secrets, timeout ו-retry, רישום ב-`audit_log`, ובדיקת חוזה עם mock.
- אף אינטגרציה לא נוגעת ישירות בעמודי האתר. תמיד דרך `api` או פונקציה.

## 10. בדיקות ובקרה עצמית
| מנגנון | מה בודק | מתי |
|---|---|---|
| `ci.yml` | tsc, eslint, vitest, build עם `PRERENDER_STRICT`, `check:aeo`, תקציב גודל | כל PR ו-push ל-main |
| `site-watch.yml` | נתיבים, h1, chunks (JS ולא HTML), sitemap/llms/robots, תוקף TLS מעל 14 יום | כל 30 דקות; פותח issue `site-watch failure` |
| `npm run smoke -- <url>` | דפדפן אמיתי: שגיאות קונסול, בקשות כושלות, 4xx/5xx על `/assets`, טופס קשר | ידני / אחרי פריסה |
| `npm run size:check` | חבילת הכניסה לא גדלה ביותר מ-8% מהבסיס (`scripts/bundle-baseline.json`) | ב-CI |
| בדיקת בידוד | אין ייבוא של platform בעמודים | vitest |

עדכון בסיס הגודל במכוון: `npm run build:seo && npm run size:check -- --update` ולבצע commit לקובץ.

## 11. מפת קבצים
- `src/platform/**` מודולי הפלטפורמה · `src/test/platform.test.ts`, `src/test/edge-shared.test.ts`
- `supabase/functions/_shared/**`, `supabase/functions/api-v1/**`
- `supabase/proposed/*.sql` הצעות סכמה (לא מיושמות)
- `scripts/health-check.mjs`, `smoke.mjs`, `size-check.mjs`, `build-info.mjs`
- `.github/workflows/ci.yml`, `site-watch.yml`
- `docs/platform/RUNBOOK.md`, `openapi.yaml`, `API-CLIENT-AUTH.md`

## 12. החלטות פתוחות לבעלים
1. אזור: טוקיו / פרנקפורט (סעיף 5.1).
2. אישור הצעות ה-SQL (01 עד 05) והחלתן על branch ואז פרודקשן.
3. פריסת `api-v1` וכינוי `seeld.co.il/api/v1`.
4. מקור שלישי: איזה, ובאיזה פורמט. נדרשות דוגמאות קבצים (אנונימיות).
5. מדיניות אבטחת סוכנים: ברירות מחדל (TOTP חובה, 30 יום) ברמת סוכנות או לכל סוכן.
6. Supabase branching לסביבת preview (עלות).
7. מי מקבל התראות site-watch (ראו RUNBOOK).
