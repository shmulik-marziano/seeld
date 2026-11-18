# האתר מול ה-backend החדש (T3, 18.11.2026)

המסמך מתאר את המתג שמעביר את האתר מפרויקט Tokyo (`lvifatyksqizwcutfbqp`) לפרויקט seeld-site בפרנקפורט (`qxhpolktdfgcbxtfxgov`), מה משתנה בכל מצב, ואיך מבצעים cutover וחזרה.

## המתג

משתנה בנייה אחד: `VITE_SEELD_BACKEND`.

| ערך | התנהגות |
|---|---|
| לא מוגדר / `legacy` | ברירת המחדל. בדיוק ההתנהגות של היום מול Tokyo |
| `v2` | seeld-site בלבד: קריאות דרך סכמת `api`, לידים דרך `lead-intake`, בלי שום נפילה חזרה ל-Tokyo |

Vite מחליף את `import.meta.env.*` בערכים קבועים, ולכן הענף של המצב השני נזרק מהבאנדל. הבדיקה: ב-build של v2 אין `lvifatyksqizwcutfbqp` בשום קובץ ב-`dist/` (מלבד טקסט שאינו קוד, אם יש).

אותו משתנה נקרא גם בזמן ריצה בפונקציות `api/*.ts` (Vercel Node) וב-`scripts/prerender.mjs`.

## משתני סביבה (שמות בלבד)

| שם | חובה ב-v2 | הערה |
|---|---|---|
| `VITE_SEELD_BACKEND` | כן (`v2`) | build + `api/*.ts` + prerender |
| `VITE_SUPABASE_URL` | כן | `https://qxhpolktdfgcbxtfxgov.supabase.co`. אין ברירת מחדל ב-v2 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | כן | מפתח `sb_publishable_*` (ציבורי). נשלח בכותרת `apikey` בלבד |
| `VITE_SUPABASE_PROJECT_ID` | לא | |
| `VITE_TURNSTILE_SITE_KEY` | ב-Production כן | בלעדיו אין ווידג'ט; `lead-intake` מדלגת על Turnstile רק מחוץ ל-production |
| `VITE_FORMS_ENABLED` | לא | `false` הופך את הטפסים לתצוגה מקדימה שלא שולחת (Preview אחרי מחיקת staging) |
| `VITE_STAFF_APP_ENABLED` | לא | שמור לשלב ב'. כרגע ב-v2 אזורי הסגל והאזור האישי תמיד מציגים "בקרוב" |

אף מפתח סודי לא נכנס ל-Vercel או לבאנדל.

## מה משתנה ב-v2

### קריאות
- לקוח Supabase אחד (`src/integrations/supabase/client.ts`) עם `db.schema = 'api'`, בלי שמירת session ובלי רענון טוקן. `site-client` ו-`v2-client` הם אותו מופע.
- טיפוסים: `src/integrations/supabase/api-types.ts` מפנה ל-`docs/platform/types.generated.ts` (api + staff).
- `api.blog_posts`, `api.cma_board`, `api.cma_company_map`, `api.cma_funds_latest`, `api.cma_sync_log`, `api.investment_tracks`.
- כל רשימה שעלולה לעבור 200 שורות נקראת בדפים של 200 עם `Range` ו-`count=exact` (`src/lib/apiPaging.ts`), והלולאה עוצרת לפי הספירה של השרת, לא לפי אורך הדף.
- מסלולי השקעה: גם `source_period` (YYYYMM של דיווח data.gov.il). כל מסלול מקבל אותו כ-`lastUpdate` (`2026-09`), ושורת הסטטוס בדף מציגה "נכון לספטמבר 2026". ב-seeld-site יש היום 1,040 מסלולים פעילים (ב-Tokyo היו 571).
- `api.travel_companies` קיים, אבל האתר לא קורא ממנו היום (דף הנסיעות סטטי). אין מה לחבר.

### `api/*.ts` (Vercel, Node)
`board`, `company-map`, `funds`, `fund-status`, `tracks`: ב-v2 שולחים `apikey` + `Accept-Profile: api`, בלי `Authorization`, בדפים של 200 עם `Prefer: count=exact`, וסדר דטרמיניסטי (מפתח שובר שוויון). בלי URL או מפתח: 502 עם `no-store`, בלי קריאה ל-Tokyo. גוף השגיאה תמיד `{"error":"unavailable"}` (בשני המצבים); הסיבה (`not configured`, `upstream <status>`) נכתבת רק ליומן הפונקציה. ב-legacy הקוד זהה לקודם. `api/geo.ts` לא נקרא יותר ב-v2 (מחיקתו באישור הבעלים בלבד).

### לידים
כל הטפסים הציבוריים עוברים דרך `src/lib/leadIntake.ts` ו-`src/hooks/useLeadIntake.tsx`:

| טופס | `kind` | `payload` |
|---|---|---|
| `pages/Contact.tsx`, `pages/Index.tsx`, `pages/BlogPost.tsx` | `contact` | `subject`, `page` |
| `components/PortfolioReviewForm.tsx` | `portfolio_review` | `subject`, `page` |
| `pages/Report.tsx` | `report` | `subject`, `page` |
| `components/InsuranceEnrollmentForm.tsx` (כולל ביטוח נסיעות) | `insurance` | `insurance_type` + שדות הסוג מהרשימה הסגורה |
| `components/PensionAnalysisForm.tsx` | `pension` | `focus_area`, `employment_status`, `retirement_age`, `risk_tolerance`, `primary_goals`, `children_count`, `preferred_contact_time` |
| `components/retire/RetireForm.tsx` (תכנון פרישה) | `pension` | `focus_area=retirement`, `age_range`, `situation`, `concern` |

- גוף הבקשה: payload קנוני (`kind, full_name, phone, email, message, payload, utm, consent, consent_version, source, hp`) ועוד `turnstile_token`. המפתחות ב-`payload` מסוננים לפי `INTAKE_PAYLOAD_KEYS`, שבדיקה משווה ל-`ops.intake_payload_keys` במיגרציה 090500. ערך שנראה כמו ת.ז. (8-9 ספרות) נזרק.
- `Idempotency-Key` לכל ניסיון שליחה: אותו מפתח כל עוד הטופס לא השתנה (ניסיון חוזר אחרי 503 או ניתוק לא יוצר ליד שני), מפתח חדש אחרי הצלחה, אחרי 409 או אחרי עריכה. לחיצה כפולה = בקשה אחת.
- honeypot מוסתר בכל טופס. Turnstile נטען בעצלתיים (רק כשהטופס מתקרב למסך ורק כש-`VITE_TURNSTILE_SITE_KEY` מוגדר), וכל טוקן משמש פעם אחת.
- תשובה מתורגמת לעברית לפי סטטוס: 400 (לפי השדה), 403, 409, 413, 423, 429, 503 וניתוק. הטקסט של השרת לא מוצג. 403: `lead-intake` מחזירה `{error:{code:"forbidden"}}` גם על Origin חסום וגם על Turnstile שנכשל, ולכן הלקוח מציג טקסט משולב ("לא הצלחנו לאמת את השליחה. רעננו את הדף ונסו שוב, או חייגו ...") שתמיד כולל טלפון; טקסט צר יותר רק כשהתג מפורש (`origin` / `turnstile`).
- ADR-42: ב-v2 אין בטפסים הציבוריים ת.ז., פרטי בנק, שכר, תאריך לידה, מידע רפואי, מספר רישוי, שווי או כתובת נכס, מחזור עסקי או יתרות מוצרים. השדות מוסתרים ב-v2 בלבד.
- הסכמה: `RetireForm` דורש תיבת סימון. בשאר הטפסים השליחה עצמה, מתחת להערת הפרטיות הקיימת, נחשבת הסכמה ליצירת קשר (`consent=true`). פתוח לבעלים: האם להוסיף תיבת סימון מפורשת לכל טופס.

### מה כבוי ב-v2
- יומן צפיות בדפים (`page_views` + `/api/geo`): אין טבלה כזו ב-seeld-site (FOUNDATION §17.8).
- `/app/*`, `/portal/*`, `/client/*`, `/execution-portal/*`, `/q/:token`, `/personal-area`, `/saved-calculations`, `/site-admin`: מסך "בקרוב" עם אייקוני הקשר של שתי המחלקות (`src/pages/ComingSoon.tsx`), בלי שום קריאה ל-Supabase. נבנים מחדש בשלב ב'.
- `/onboarding`, `/direct-debit`: אותו מסך בגרסת "הטופס הדיגיטלי יחזור בקרוב" (הם אוספים ת.ז. ופרטי בנק).
- כפתור שמירת/שליחת חישוב במחשבונים (דורש session ו-`send-calculation-email`).
- הצ'אט: הכפתור נשאר, ונפתח פאנל קשר עם שתי המחלקות (`src/components/ChatUnavailable.tsx`) עד שהצ'אט יחובר ל-`chat-bot`.
- כניסה (auth): ספק ה-auth לא נטען כלל.

### PDage
המסלולים, הייבוא ב-`App.tsx` ותשובת העזרה הוסרו בשני המצבים. קבצי המודול עדיין בדיסק כי מחיקת קבצים נחסמה בהרשאות הסשן (ראו "צעדי בעלים").

## Cutover

### תנאים מוקדמים (כולם חייבים להתקיים לפני `VITE_SEELD_BACKEND=v2` ב-Production)
- [ ] Turnstile: ווידג׳ט ב-Cloudflare ל-`seeld.co.il` ו-`www`; Edge secret `TURNSTILE_SECRET_KEY` ב-seeld-site; Vercel `VITE_TURNSTILE_SITE_KEY` (Production). בלי שניהם `lead-intake` עונה 503 לכל ליד (הטופס ממתין 8 שניות לטוקן, שולח בלעדיו, והשרת דוחה).
- [ ] Edge secret `ALLOWED_ORIGINS` = `https://seeld.co.il`, `https://www.seeld.co.il` (ואם רוצים טפסים ב-Preview, גם כתובת ה-Preview; אחרת `VITE_FORMS_ENABLED=false` ב-Preview).
- [ ] מסלולי השקעה: ב-seeld-site יש 1,040 מסלולים פעילים מול 571 ב-Tokyo (מיפוי של T4/T0, אחרי 095300). דף `/investment-tracks` ישתנה ב-cutover; נדרש אישור בעלים.
- [ ] הסכמה: החלטת בעלים אם כל טופס מקבל תיבת סימון מפורשת (היום רק `RetireForm`; השאר שולחים `consent=true` מתחת להערת הפרטיות).
- [ ] סביבת הריצה של `api/*.ts` עברה מ-Edge ל-Node (`export default { fetch }`, `fra1`, `maxDuration` מ-`vercel.json`; פריט 22 בתוכנית). לפני merge ל-main (push = פריסה לייצור) לוודא על פריסת Preview במצב legacy ש-`/api/board`, `/api/funds`, `/api/tracks`, `/api/company-map`, `/api/fund-status` עונים 200 עם נתונים.
- [ ] CSP ב-`vercel.json` כבר מתיר `qxhpolktdfgcbxtfxgov.supabase.co` ו-`challenges.cloudflare.com`. ב-PR של ה-cutover עצמו מסירים את שני מקורות טוקיו (`https://` ו-`wss://lvifatyksqizwcutfbqp.supabase.co`) מה-CSP באותו PR של החלפת משתני ה-VITE, אחרת שער `check-csp-bundle` ב-CI נכשל; אחרי המיזוג מגדירים `vars.CUTOVER_DONE=1` (ראו RUNBOOK.md סעיף ה).

### צעדים
1. Vercel > Production env: `VITE_SEELD_BACKEND=v2`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`. לוודא שאין משתנה סודי.
2. חשוב: `lead-intake` רצה כ-production כל עוד `ENV` לא מוגדר, ובלי `TURNSTILE_SECRET_KEY` היא מחזירה 503 לכל ליד ("הטופס אינו זמין כרגע"). לכן Turnstile (מפתח אתר ב-Vercel וסוד ב-Edge) הוא תנאי ל-cutover. Edge secret `ALLOWED_ORIGINS` כולל `https://seeld.co.il` ו-`https://www.seeld.co.il` (ובענף preview את כתובת ה-preview); `TURNSTILE_SECRET_KEY` מוגדר.
3. Redeploy. ה-build מריץ `PRERENDER_STRICT=1 npm run build:seo`; ה-prerender קורא את הבלוג מ-`api.blog_posts`.
4. Smoke: `/blog`, `/return-tables`, `/investment-tracks`, ליד בדיקה אחד מ-`/contact` (ולחיצה כפולה = ליד אחד ב-`staff.leads_list`), `/api/board` מחזיר 1,257 שורות, `/api/tracks` מחזיר את כל המסלולים הפעילים.
5. בדפדפן: אין בקשה ל-`lvifatyksqizwcutfbqp` ואין ל-`ipapi.co`.

## חזרה (rollback)
Vercel Instant Rollback לפריסה הקודמת, או להסיר את `VITE_SEELD_BACKEND` ולבנות מחדש. Tokyo לא נגעו בו, כך שהאתר הישן ממשיך לעבוד. לידים שנכנסו ב-v2 בזמן החלון נשארים ב-seeld-site ונקראים דרך `staff.leads_list`.

## בדיקות
- `src/test/lead-intake.test.ts`: מפתחות payload מול המיגרציה, payload קנוני, מיפוי שגיאות, אין שדות ת.ז./בנק/שכר/בריאות באף קריאת שליחה.
- `src/test/lead-intake-hook.test.tsx`: לחיצה כפולה = בקשה אחת; ניסיון חוזר באותו מפתח; מפתח חדש אחרי הצלחה או עריכה.
- `src/test/backend-v2.test.ts`: config ו-client בשני המצבים; עימוד; כל `api/*.ts` ב-v2 (Accept-Profile, Range, count=exact, בלי Authorization) וב-legacy (ללא שינוי).
- `src/test/v2-holding.test.tsx`: מסך "בקרוב", מסלולי v2, יומן הצפיות legacy בלבד, אין PDage בנתב.
