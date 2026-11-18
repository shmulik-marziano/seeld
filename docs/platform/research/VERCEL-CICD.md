# Vercel, CI/CD ותצפית לאתר SEELD: מחקר ייחוס להחלטה

תאריך: 18.11.2026 · גרסה 1 · מצב: הצעה למחקר, שום דבר לא הוחל (לא בוצע deploy, לא שונה פרויקט Vercel, לא שונו משתני סביבה).

מסמך זה הוא הייחוס שהארכיטקט והמיישמים יעבדו לפיו. לכל טענה מצורף קישור לתיעוד הרשמי (Vercel, GitHub, Supabase, Sentry, Resend, MDN, web.dev). פריט שלא נמצא לו אישור בתיעוד מסומן **לא אומת**. מספרים מתיעוד הם נכונים לתאריך הקריאה (נובמבר 2026) ועלולים להשתנות.

מבנה כל סעיף: מה התיעוד אומר (2026) → למה זה חשוב לנו → התקן שלנו → קונפיגורציה מדויקת.

---

## 0. מקרא ועובדות שנמצאו בבדיקה (קריאה בלבד)

### 0.1 מה נבדק
- הריפו `C:\dev\seeld-seo-prerender` (ענף `design/kit-pages`, remote `shmulik-marziano/seeld`).
- פרויקט Vercel `seeld` (`prj_SqYD41WfZ5j71QfZ15bcekKx0zGP`, צוות `team_dZ6Ivl6PBJEmz6Gf19sSjs1J`) דרך קריאות MCP לקריאה בלבד.
- תיעוד רשמי: Vercel (כ-45 עמודים), GitHub Docs, Supabase Docs, Sentry Docs, Resend Docs, MDN, web.dev, hstspreload.org, Vite.

### 0.2 תמונת מצב: מה קיים היום

| נושא | נמצא | משמעות |
|---|---|---|
| `vercel.json` | `buildCommand: PRERENDER_STRICT=1 npm run build:seo`, `framework: vite`, כותרות אבטחה גלובליות, `Cache-Control: immutable` על `/assets/(.*)`, 13 rewrites ל-`/_shell.html`, 8 redirects לפי host לדומיינים ישנים | בסיס טוב; חסרים `regions`, `trailingSlash`, מדיניות cache לקבצים לא-מגובבים, והפרדה בין preview לפרודקשן |
| פלט prerender | `dist/<route>/index.html` לכל נתיב, `dist/_shell.html` (עותק נקי של `index.html`), `dist/404.html`, `sitemap.xml`, `llms.txt`, `llms-full.txt` נכתבים ב-`scripts/prerender.mjs` | URL ללא סיומת, תואם למודל "תיקייה + index.html" של Vercel |
| פונקציות API | 6 קבצים ב-`api/` (`board`, `funds`, `tracks`, `company-map`, `fund-status`, `geo`), כולם `export const config = { runtime: "edge", regions: ["fra1"] }`, קוראים ל-Supabase REST עם מפתח publishable, מחזירים `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` (ו-`no-store` בשגיאה; `geo` מחזיר `private, no-store`) | כבר ממוקמים ב-Frankfurt; Vercel ממליצה כיום לעבור מ-Edge ל-Node.js (סעיף 1.6) |
| הגדרות פרויקט ב-Vercel | `framework: "nextjs"` בהגדרות הפרויקט (בעוד `vercel.json` אומר `vite`), `nodeVersion: 24.x`, `ssoProtection: all_except_custom_domains` (Standard Protection), `passwordProtection: false`, דומיינים: `seeld.co.il`, `seeld.vercel.app` | חוסר התאמה ב-framework; `www.seeld.co.il` והדומיינים הישנים (`seeld-ins.*`) **אינם** מחוברים לפרויקט, כך ש-8 ה-redirects ב-`vercel.json` לא פעילים |
| GitHub Actions | `ci.yml` (typecheck, lint, vitest, prerender קשיח, AEO, תקציב bundle) על PR ו-main; `deploy-vercel.yml` מריץ `vercel deploy --prod` על כל push ל-main; `site-watch.yml` כל 30 דקות עם `user-agent: seeld-site-watch/1.0` | `deploy-vercel.yml` הוא מקור הפריסה הכפולה (סעיף 2.5). CI על Node 22 בעוד Vercel על 24 |
| תקציב bundle | `scripts/bundle-baseline.json`: כניסה ראשית 118,586 B gzip (408,019 B raw), תקרה +8% | טוב; מוצע להוסיף גם תקרה אבסולוטית (סעיף 5.5) |
| CSP נוכחי | `script-src 'self' 'unsafe-inline'`, פונטים מ-Google Fonts, `connect-src` כולל `https://ipapi.co` | `ipapi.co` כבר לא בשימוש (`api/geo.ts` מחליף אותו); יש פונטי Rubik מקומיים ב-`public/fonts` (TTF) |
| התאוששות מ-chunk חסר | סקריפט inline ב-`index.html` + `src/lib/chunkRecovery.ts` (re-fetch עם cache bypass ואז reload פעם אחת) | מגן בצד הלקוח; הפתרון המבני הוא מניעת הפריסה הכפולה + Skew Protection (סעיף 2.8) |
| Supabase | 49 מיגרציות, `supabase/tests/*.test.sql` (pgTAP), `config.toml`; מעבר לפרויקט Frankfurt (`eu-central-1`) | מתאים ל-`fra1` של Vercel (אותו אזור AWS) |
| קבצים מוצעים קיימים | `docs/platform/vercel.proposed.json`, `docs/platform/ci.proposed.yml` (לא מעוקבים ב-git) | מסמך זה מתייחס אליהם ומציע תיקונים (סעיף 1.9, 7.3) |

---

## 1. `vercel.json` כקוד

### 1.1 rewrites: קליפת SPA מול HTML מרונדר מראש

**מה התיעוד אומר.** rewrites מופעלים אחרי redirects; מערכת הקבצים קודמת ל-rewrites, לכן נתיב שקיים כקובץ סטטי (למשל `dist/about/index.html`) נשלח כפי שהוא ו-rewrite אליו לא נדרש. תבנית SPA מלאה היא `{ "source": "/(.*)", "destination": "/index.html" }`. מקור: <https://vercel.com/docs/project-configuration/vercel-json#rewrites>, <https://vercel.com/docs/frameworks/frontend/vite>, <https://vercel.com/docs/routing/rewrites>.

**למה זה חשוב לנו.** יש לנו שני סוגי נתיבים: כ-90 נתיבים ציבוריים שמרונדרים מראש (SEO/AEO, חייבים להגיע כ-HTML מלא עם `h1`, JSON-LD וכו'), ונתיבים אפליקטיביים (`/app/*`, `/portal/*`, `/client/*`, `/admin`...) שחייבים לקבל קליפה נקייה (`_shell.html`) ולא HTML של עמוד אחר. נתיב לא מוכר צריך להחזיר 404 אמיתי (יש `dist/404.html`), לא קליפה עם סטטוס 200, אחרת מנועי חיפוש יאנדקסו "soft 404".

**התקן שלנו.**
1. אין catch-all ל-`index.html`. רק prefixים אפליקטיביים מפורשים מקבלים `/_shell.html`.
2. כל נתיב ציבורי חדש חייב להיכנס לרשימת ה-prerender (אחרת יחזור 404). בדיקת `check:aeo` כבר אוכפת נוכחות.
3. `_shell.html` נשאר עותק נקי של `index.html` כפי שהסקריפט עושה; לא מוסיפים לו תוכן.

**קונפיגורציה.** רשימת ה-rewrites הקיימת נשמרת כפי שהיא (ראו הקובץ המלא בסעיף 1.9).

### 1.2 redirects: דומיינים ישנים, `www`, וכתובת `vercel.app`

**מה התיעוד אומר.** redirect ב-`vercel.json` עם `has: [{type: "host", value: ...}]` מאפשר להפנות לפי host; `permanent: true` נותן 308. Vercel ממליצה להפנות את `your-project.vercel.app` לדומיין המותאם כדי לא לייצר תוכן כפול, עם התאמת host מדויקת (נקודות מוברחות) כדי לא לפגוע ב-preview URLs. מקור: <https://vercel.com/docs/routing/redirects>, <https://vercel.com/docs/project-configuration/vercel-json#redirects>.
redirect של `www` ↔ apex מוגדר ברמת הדומיין (Project Settings → Domains → Edit → Redirect to), ו-Vercel מנסה להפנות אוטומטית גם בלי הגדרה מפורשת אך ממליצה להגדיר במפורש. מקור: <https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting#redirecting-domains>.
כותרת `x-robots-tag: noindex` מתווספת אוטומטית ל-preview deployments ולפריסות פרודקשן שנפתחות דרך ה-URL הייחודי שלהן, אך **לא** לדומיין פרודקשן כמו `seeld.vercel.app`. מקור: <https://vercel.com/docs/headers/response-headers#x-robots-tag>.

**למה זה חשוב לנו.** (א) `seeld.vercel.app` הוא דומיין פרודקשן פעיל של הפרויקט ואינו מקבל `noindex`, לכן הוא עותק כפול של האתר שגוגל יכול לאנדקס. (ב) 8 ה-redirects לדומיינים `seeld-ins.*` לא יכולים לפעול כי הדומיינים אינם מחוברים לפרויקט (רשימת הדומיינים: `seeld.co.il`, `seeld.vercel.app` בלבד). (ג) `www.seeld.co.il` אינו מחובר, כך שגולש שמקליד `www` מקבל שגיאת DNS או תעודה, ובנוסף ההצעה ל-HSTS preload דורשת ש-`www` יעבוד ב-HTTPS אם קיימת לו רשומת DNS (סעיף 1.4).

**התקן שלנו.**
1. דומיין קנוני יחיד: `https://seeld.co.il` (apex, ללא `www`, ללא לוכסן סופי).
2. `www.seeld.co.il` מתווסף לפרויקט ומופנה ל-apex ברמת הדומיין בלוח Vercel (308). פעולה של הבעלים.
3. `seeld.vercel.app` מופנה ל-`seeld.co.il` ב-`vercel.json` (כלל host מדויק).
4. דומיינים ישנים: או שמחברים אותם לפרויקט (ואז הכללים הקיימים נכנסים לתוקף), או שמוחקים את הכללים. **לא מוחקים** בלי אישור הבעלים; עד להחלטה הכללים נשארים (הם לא מזיקים).

**קונפיגורציה.** ראו סעיף 1.9, מפתח `redirects`.

### 1.3 `trailingSlash` ו-`cleanUrls`

**מה התיעוד אומר.** `trailingSlash: false` מפנה ב-308 מ-`/about/` ל-`/about`; `trailingSlash: true` עושה את ההפך (ולא נוגע בנתיבים עם סיומת קובץ). `cleanUrls: true` מסיר `.html` ומפנה ב-308 מ-`/x.html` ל-`/x`. מקור: <https://vercel.com/docs/project-configuration/vercel-json#trailingslash>, <https://vercel.com/docs/project-configuration/vercel-json#cleanurls>.

**למה זה חשוב לנו.** ה-sitemap ו-canonical שלנו ללא לוכסן סופי. בלי הגדרה, `/about` ו-`/about/` שניהם מחזירים 200, כלומר שתי כתובות לאותו תוכן. `trailingSlash: false` סוגר את זה ב-308 (שומר PageRank).

**התקן שלנו.** `trailingSlash: false`. לא מפעילים `cleanUrls` (אין לנו כתובות `.html` חשופות; ההפעלה הייתה מפנה גם `/_shell.html` ו-`/404.html` ועלולה להפתיע). **לבדוק ב-preview**: `curl -I https://<preview>/about` מחזיר 200 עם `x-vercel-cache: PRERENDER|HIT`, ו-`/about/` מחזיר 308 ל-`/about`.

### 1.4 כותרות אבטחה

**מה התיעוד אומר.**
- Vercel מוסיפה ברירת מחדל `strict-transport-security: max-age=63072000` (ללא `includeSubDomains`/`preload`). מקור: <https://vercel.com/docs/headers/response-headers#strict-transport-security>.
- רשימת ה-preload של Chrome דורשת: תעודה תקפה, redirect מ-HTTP ל-HTTPS באותו host, **כל** תת-הדומיינים ב-HTTPS (כולל `www` אם קיימת לו רשומה, וכולל תת-דומיינים פנימיים), וכותרת על דומיין הבסיס עם `max-age >= 31536000`, `includeSubDomains`, `preload`. מומלץ להעלות `max-age` בשלבים (5 דקות → שבוע → חודש) לפני הגשה. מקור: <https://hstspreload.org/>.
- CSP: `'strict-dynamic'` מעביר אמון מסקריפט עם nonce/hash לסקריפטים שהוא מטעין ומבטל `'self'`/host-sources; `'unsafe-hashes'` מאפשר hash ל-inline handlers; `'unsafe-inline'` הוא החלש מכולם. מקור: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy>.
- כותרות ב-`vercel.json` מוגדרות לפי `source` (path-to-regexp) ואפשר לסייג לפי `has` (למשל host). מקור: <https://vercel.com/docs/project-configuration/vercel-json#headers>.

**למה זה חשוב לנו.** אתר פיננסי עם טפסי לידים, אזור אישי ו-Supabase. CSP מחמיר הוא ההגנה העיקרית מפני XSS/הזרקת סקריפטים בצד לקוח; HSTS preload סוגר downgrade. nonce אינו אפשרי באתר סטטי (אין שרת שמייצר nonce לכל תגובה) ולכן האפשרויות הן hash לסקריפט ה-inline היחיד (סקריפט ההתאוששות ב-`index.html`) או allowlist קשיח. JSON-LD (`<script type="application/ld+json">`) הוא data block ואינו מופעל, לכן CSP לא חוסם אותו.

**התקן שלנו (שני שלבים).**
- שלב א (מיידי): CSP כמו היום אך בלי `ipapi.co`, בלי Google Fonts (אחרי מעבר לפונטים עצמיים, סעיף 5.4), עם Supabase החדש ב-Frankfurt, ועם `worker-src`/`manifest-src`.
- שלב ב (אחרי בניית צעד CI שמחשב hash): `script-src 'self' 'sha256-<hash>'` במקום `'unsafe-inline'`; הסקריפט ה-inline היחיד הוא סקריפט ההתאוששות, ולכן ה-hash יציב עד שמשנים אותו. במקביל מריצים `Content-Security-Policy-Report-Only` עם המדיניות המחמירה שבועיים לפני אכיפה.
- HSTS: `max-age=63072000; includeSubDomains; preload` כבר קיים אצלנו. **לפני הגשה ל-hstspreload.org** יש לוודא HTTPS לכל תת-דומיין שיהיה אי פעם (כולל `www`, וכולל תת-דומיינים של דוא"ל אם יוקמו על `seeld.co.il`). עד אז הכותרת כשלעצמה בטוחה.
- `Cross-Origin-Opener-Policy: same-origin` נשאר (אין יותר כניסת Google/Facebook בחלון popup). `Cross-Origin-Resource-Policy` לא מוגדר גלובלית: הוא היה חוסם הטענת תמונות/לוגו שלנו מאתרים אחרים (OG previews וכו') בלי תועלת ממשית; `COEP` לא נדרש (אין `SharedArrayBuffer`).
- `Permissions-Policy`: סוגרים חיישנים ותשלום. **לא אומת**: שם ה-directive הנוכחי לביטול Topics API (`browsing-topics`) בדפדפנים השונים; `interest-cohort` (FLoC) כבר אינו רלוונטי.
- **לא אומת**: האם Vercel Toolbar ב-preview deployments נחסם על ידי CSP מחמיר (הכלי מוזרק לדפי preview). אם כן, מוסיפים כלל כותרות נפרד ב-`has: host` ל-`*.vercel.app` עם CSP רפוי יותר, או מכבים את ה-toolbar לפרויקט.

### 1.5 אסטרטגיית `Cache-Control` וקאשינג של 404

**מה התיעוד אומר.**
- ברירת המחדל: `cache-control: public, max-age=0, must-revalidate` (לא CDN ולא דפדפן). טבלת ההמלצות: עמודים זהים לכל גולש `max-age=0, s-maxage=86400`; תוכן חצי-סטטי `max-age=120, s-maxage=86400`; נכסים מגובבים `max-age=31536000, immutable`. `s-maxage` חוקי בטווח 1..31536000. `stale-while-revalidate` מגיש ישן ומחדש ברקע. מקור: <https://vercel.com/docs/caching/cache-control-headers>.
- קבצים סטטיים נשמרים ב-CDN אוטומטית לכל פריסה; "Vercel doesn't allow bypassing the cache for static files by design". מקור: <https://vercel.com/docs/caching/cdn-cache#static-files-caching>.
- **קריטריוני cacheability**: תגובה ניתנת לקאשינג אם היא `GET/HEAD`, בלי `Authorization`, **סטטוס `200`, `404`, `410`, `301`, `302`, `307` או `308`**, עד 10MB, בלי `set-cookie`, בלי `private/no-cache/no-store`, בלי `Vary: *` או `Vary: Cookie`. מקור: <https://vercel.com/docs/caching/cdn-cache#cacheable-response-criteria>.
- פונקציות קודמות לקובץ הקונפיגורציה בקביעת `Cache-Control`; `CDN-Cache-Control` ו-`Vercel-CDN-Cache-Control` מפרידים בין הנחיות ל-CDN של Vercel, ל-CDN חיצוני ולדפדפן. מקור: <https://vercel.com/docs/caching/cache-control-headers#functions-have-priority-over-config-files>, <https://vercel.com/docs/caching/cache-control-headers#cdn-cache-control-header>.
- ניקוי: `vercel cache purge --type cdn` (לפרויקט), או invalidation לפי תגיות (`Vercel-Cache-Tag` + `invalidateByTag`). מקור: <https://vercel.com/docs/cli/cache>, <https://vercel.com/docs/caching/cdn-cache/purge>.
- ערכי `x-vercel-cache`: `HIT`, `MISS`, `STALE`, `PRERENDER`, `REVALIDATED`, `BYPASS`. מקור: <https://vercel.com/docs/headers/response-headers#x-vercel-cache>, <https://vercel.com/docs/caching/cache-status>.
- נכסים immutable שנדלפו אפשר למחוק לצמיתות דרך `POST /v1/edge-cache/dangerously-delete-immutable-static` (חוסם 410 לשבעה ימים ומסובב את build hash salt). מקור: <https://vercel.com/docs/caching/cdn-cache#deleting-immutable-static-assets>.

**למה זה חשוב לנו: שחזור התקלה.** כלל הכותרות `/assets/(.*)` → `immutable` חל על **כל תגובה** לנתיב הזה, גם על 404. כש-HTML ישן (מפריסה א') ביקש chunk שלא קיים בפריסה ב' (כי הפריסה הידנית ייצרה hashים אחרים), ה-CDN החזיר את עמוד ה-404 עם `Cache-Control: immutable` וסטטוס 404, שהוא ניתן לקאשינג לפי הקריטריונים לעיל, ולכן נשמר לשנה גם ב-CDN וגם בדפדפן. `vercel.json` אינו יכול לסייג כותרת לפי סטטוס. לכן ההגנה חייבת להיות מבנית:
1. **מקור פריסה יחיד** (סעיף 2.5), כך שלא יהיו שתי פריסות עם hashים שונים לאותו commit.
2. **Skew Protection** עם `?dpl=` בכתובות הנכסים (סעיף 2.8), כך שבקשת נכס מ-HTML ישן תנותב לפריסה הישנה ותקבל 200 ולא 404.
3. HTML נשאר `max-age=0, must-revalidate` (ברירת המחדל), כדי שדפדפן יקבל תמיד את ה-HTML העדכני ואת רשימת ה-chunks העדכנית.
4. `chunkRecovery.ts` נשאר כקו הגנה אחרון בצד הלקוח.
5. runbook: אם בכל זאת נתקע 404 ב-CDN: `vercel cache purge --type cdn --yes` ואז בדיקה (סעיף 8.4).

**התקן שלנו.**

| סוג תוכן | כותרת | הערה |
|---|---|---|
| `/assets/*` (hash בשם) | `public, max-age=31536000, immutable` | קיים |
| HTML מרונדר, `_shell.html`, `404.html` | ברירת המחדל (`public, max-age=0, must-revalidate`) | לא מגדירים ידנית; ה-CDN מגיש PRERENDER ומתחלף בכל פריסה |
| `/sitemap.xml`, `/robots.txt`, `/llms*.txt` | ברירת המחדל | מתחלפים בכל פריסה; גוגל/בוטים צריכים לראות עדכון מיד |
| `/fonts/*` (לא מגובב) | `public, max-age=604800, stale-while-revalidate=2592000` | עד שהפונטים יעברו דרך Vite ויקבלו hash (ואז `/assets/*`) |
| `/art/*`, `/brand/*`, `/logos/*` | `public, max-age=86400, stale-while-revalidate=604800` | איורים ולוגואים; שינוי שם קובץ בכל גרסה חדשה |
| `/api/*` | **בקוד הפונקציה בלבד** (היום `s-maxage=3600, stale-while-revalidate=86400`; `geo` עם `private, no-store`) | לא מגדירים ב-`vercel.json`: הפונקציה קודמת, וכלל גלובלי היה מסתיר שגיאות `no-store` |
| תגובת שגיאה מ-API | `no-store` | קיים; שגיאה לא נשמרת ב-CDN |

### 1.6 `functions`: runtime, אזור, זיכרון, משך

**מה התיעוד אומר.**
- "We recommend migrating from edge to Node.js for improved performance and reliability. Both runtimes run on Fluid compute with Active CPU pricing." פונקציות Edge חייבות להתחיל להשיב תוך 25 שניות. מקור: <https://vercel.com/docs/functions/runtimes/edge>.
- אזור ברירת מחדל `iad1`; Pro עד 5 אזורים; `regions` ב-`vercel.json` קובע ברירת מחדל לפרויקט, ואפשר לדרוס לפונקציה ב-`functions["api/x.ts"].regions`. `fra1` = `eu-central-1` Frankfurt. "Functions should be executed in the same region as your database". מקור: <https://vercel.com/docs/functions/configuring-functions/region>, <https://vercel.com/docs/regions>.
- משך: Pro ברירת מחדל 300 שניות, מקסימום 800 (1800 בבטא). זיכרון: 2GB/1vCPU ברירת מחדל, עד 4GB/2vCPU ב-Pro. עם Fluid, זיכרון נקבע בלוח ולא ב-`vercel.json`. מקור: <https://vercel.com/docs/functions/configuring-functions/duration>, <https://vercel.com/docs/limits#vercel-functions>, <https://vercel.com/docs/project-configuration/vercel-json#functions>.
- תמחור Fluid ל-Pro: Active CPU, Provisioned Memory ו-Invocations לפי שימוש (מחיר תלוי אזור), בלי מכסה כלולה אך עם קרדיט חודשי של $20. מקור: <https://vercel.com/docs/functions/usage-and-pricing>.

**למה זה חשוב לנו.** Supabase עובר ל-Frankfurt; `fra1` הוא אותו AWS region (`eu-central-1`) ולכן זמן הסיבוב פונקציה↔DB מינימלי. הפונקציות שלנו הן proxy קצר (REST → JSON) עם קאשינג שעה ב-CDN, כך שרוב הבקשות כלל לא מגיעות לפונקציה. ההמלצה הרשמית לעבור ל-Node.js מתיישבת גם עם צורך עתידי ב-`@supabase/supabase-js` מלא או בחתימות HMAC.

**התקן שלנו.**
1. `regions: ["fra1"]` ברמת הפרויקט ב-`vercel.json` (ולא רק בתוך כל קובץ).
2. מעבר ל-Node.js runtime (Fluid) בכל `api/*.ts`: מחיקת `export const config = { runtime: "edge" }`, חתימת `export default async function handler(req: Request): Promise<Response>` נשארת תקפה (Web API ב-Node runtime). **לא אומת**: שחתימת Web `Request`/`Response` ללא `@vercel/node` נתמכת בפונקציות Node מחוץ ל-framework בדיוק כמו היום; לבדוק ב-preview לפני מיזוג.
3. `maxDuration: 10` ל-`api/*.ts` (proxy שלא אמור לקחת יותר מכמה מאות ms; תקרה נמוכה מגבילה נזק של פונקציה תקועה). זיכרון: ברירת המחדל (2GB) בלוח.
4. אין `fluid: true` נדרש; Fluid הוא ברירת המחדל לפרויקטים חדשים (<https://vercel.com/docs/fluid-compute>). **לא אומת**: האם הפרויקט שלנו (נוצר 03.2026) כבר ב-Fluid; לבדוק בלוח Settings → Functions.

### 1.7 `images`: אופטימיזציית תמונות ל-Vite

**מה התיעוד אומר.** ב-frameworks ללא רכיב `Image`, ה-API הוא `/_vercel/image?url=<src>&w=<width>&q=<quality>`; הערכים המותרים נקבעים ב-`images` ב-`vercel.json` (`sizes`, `localPatterns`, `remotePatterns`, `qualities`, `formats`, `minimumCacheTTL`, `dangerouslyAllowSVG`). פורמטי מקור: jpeg/png/webp/avif בלבד (אחרים מוגשים כפי שהם); עד 8192px; עד 10MB לפלט. תמחור (Pro, לפי אזור): transformations $0.05–$0.0812 ל-1K, cache reads $0.40–$0.64 ל-1M, cache writes $4–$6.40 ל-1M. מקור: <https://vercel.com/docs/image-optimization#image-transformation-url-format>, <https://vercel.com/docs/project-configuration/vercel-json#images>, <https://vercel.com/docs/image-optimization/limits-and-pricing>.

**למה זה חשוב לנו.** האיורים ב-`public/art` הם רכיב LCP בעמודים רבים. AVIF/WebP ב-`srcset` לפי רוחב חוסכים עשרות אחוזים. SVG לא עובר אופטימיזציה (וטוב שכך; נשאר ישיר). העלות זניחה (כמה אלפי transformations בחודש, רובן נפגעות ב-cache).

**התקן שלנו.** `images` עם `localPatterns` ל-`/art`, `/brand`, `/logos`; `sizes: [320, 480, 640, 960, 1280, 1920]`; `qualities: [60, 75]`; `formats: ["image/avif", "image/webp"]`; `minimumCacheTTL: 2592000`. בקוד: רכיב `<Art>` שמייצר `srcset` של `/_vercel/image?url=/art/x.png&w=...&q=75` ו-`sizes`. ב-`vite preview` מקומי הנתיב לא קיים, לכן fallback ל-`src` הגולמי כשלא רצים על Vercel (אותו דגם כמו ב-`api/geo.ts`).

### 1.8 `ignoreCommand`: preview רק ל-PR

**מה התיעוד אומר.** `ignoreCommand` ב-`vercel.json` דורס את Ignored Build Step; יציאה בקוד `0` מבטלת את הבנייה, `1` ממשיכה. `VERCEL_GIT_PULL_REQUEST_ID` ריק כשפריסה נוצרת על ענף לפני שנפתח PR; `VERCEL_GIT_PREVIOUS_SHA` חשוף רק כש-Ignored Build Step מוגדר. ברירת המחדל: preview לכל push לענף שאינו production וגם לפתיחת PR. מקור: <https://vercel.com/docs/project-configuration/vercel-json#ignorecommand>, <https://vercel.com/docs/environment-variables/system-environment-variables>, <https://vercel.com/docs/deployments/environments#preview-environment-pre-production>.

**למה זה חשוב לנו.** כל push לענף עבודה בונה prerender של 90 נתיבים עם Chromium (דקות של build). לרוב הענפים אין צורך ב-URL חי עד שיש PR. חיסכון בזמן בנייה ובמכסה (Pro: עד 6,000 פריסות ביום, 45 דקות build לפריסה; <https://vercel.com/docs/limits#general-limits>).

**התקן שלנו.** פריסת preview נוצרת רק כשיש PR; פרודקשן תמיד נבנה. סקריפט:

```bash
#!/usr/bin/env bash
# scripts/vercel-ignore.sh
# Exit 0 = skip build. Exit 1 = build.
set -eu
if [ "${VERCEL_ENV:-}" = "production" ]; then exit 1; fi
if [ -z "${VERCEL_GIT_PULL_REQUEST_ID:-}" ]; then
  echo "preview without PR -> skip"; exit 0
fi
exit 1
```

### 1.9 הקובץ המוצע במלואו (לא הוחל)

הערות לפני הקובץ:
- `<SUPABASE_REF>` = מזהה פרויקט Supabase החדש ב-Frankfurt. אין להכניס מפתח כלשהו ל-`vercel.json`.
- `functions` מניח מעבר ל-Node runtime (סעיף 1.6). עד המעבר, אם הפונקציות נשארות Edge, יש להסיר את המפתח `functions` (ל-Edge אין `maxDuration` ב-`vercel.json`).
- אין להשתמש ב-`routes` (למשל לחוקי WAF) יחד עם `rewrites`/`redirects`/`headers`: **לא אומת בסבב זה**, אך לפי תיעוד `vercel.json` המפתח `routes` אינו משתלב עם המפתחות המודרניים; חוקי WAF ינוהלו בלוח/CLI (סעיף 3.4).
- תיקונים ביחס ל-`docs/platform/vercel.proposed.json`: `git.deploymentEnabled: {"main": true}` חסר משמעות (ברירת המחדל כבר `true`); כלל `"/((?!assets/).*)\\.html"` לא תופס את העמודים כי הכתובות הציבוריות הן ללא `.html`; כלל `/api/(.*)` ב-headers מתעלם מכך שהפונקציה קודמת; `challenges.cloudflare.com` ב-CSP מתאים רק אם מוסיפים Turnstile (לא הוחלט); `ipapi.co` כבר לא נדרש.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "PRERENDER_STRICT=1 npm run build:seo",
  "outputDirectory": "dist",
  "ignoreCommand": "bash scripts/vercel-ignore.sh",
  "trailingSlash": false,
  "regions": ["fra1"],
  "functions": {
    "api/*.ts": { "maxDuration": 10 }
  },
  "images": {
    "sizes": [320, 480, 640, 960, 1280, 1920],
    "localPatterns": [
      { "pathname": "^/art/.*$", "search": "" },
      { "pathname": "^/brand/.*$", "search": "" },
      { "pathname": "^/logos/.*$", "search": "" }
    ],
    "qualities": [60, 75],
    "formats": ["image/avif", "image/webp"],
    "minimumCacheTTL": 2592000,
    "dangerouslyAllowSVG": false
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "X-Permitted-Cross-Domain-Policies", "value": "none" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://<SUPABASE_REF>.supabase.co wss://<SUPABASE_REF>.supabase.co; worker-src 'self'; manifest-src 'self'; frame-src 'none'; upgrade-insecure-requests"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=604800, stale-while-revalidate=2592000" }]
    },
    {
      "source": "/(art|brand|logos)/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }]
    }
  ],
  "rewrites": [
    { "source": "/app/:path*", "destination": "/_shell.html" },
    { "source": "/portal/:path*", "destination": "/_shell.html" },
    { "source": "/client/:path*", "destination": "/_shell.html" },
    { "source": "/execution-portal/:path*", "destination": "/_shell.html" },
    { "source": "/article/:path*", "destination": "/_shell.html" },
    { "source": "/blog/:path*", "destination": "/_shell.html" },
    { "source": "/return-tables/:path*", "destination": "/_shell.html" },
    { "source": "/admin", "destination": "/_shell.html" },
    { "source": "/site-admin", "destination": "/_shell.html" },
    { "source": "/personal-area", "destination": "/_shell.html" },
    { "source": "/saved-calculations", "destination": "/_shell.html" },
    { "source": "/style-guide", "destination": "/_shell.html" },
    { "source": "/install", "destination": "/_shell.html" }
  ],
  "redirects": [
    { "source": "/:path*", "has": [{ "type": "host", "value": "seeld\\.vercel\\.app" }], "destination": "https://seeld.co.il/:path*", "permanent": true },
    { "source": "/", "has": [{ "type": "host", "value": "seeld-ins.com" }], "destination": "https://seeld.co.il/", "permanent": true },
    { "source": "/:path*", "has": [{ "type": "host", "value": "seeld-ins.com" }], "destination": "https://seeld.co.il/:path*", "permanent": true },
    { "source": "/", "has": [{ "type": "host", "value": "www.seeld-ins.com" }], "destination": "https://seeld.co.il/", "permanent": true },
    { "source": "/:path*", "has": [{ "type": "host", "value": "www.seeld-ins.com" }], "destination": "https://seeld.co.il/:path*", "permanent": true },
    { "source": "/", "has": [{ "type": "host", "value": "seeld-ins.co.il" }], "destination": "https://seeld.co.il/", "permanent": true },
    { "source": "/:path*", "has": [{ "type": "host", "value": "seeld-ins.co.il" }], "destination": "https://seeld.co.il/:path*", "permanent": true },
    { "source": "/", "has": [{ "type": "host", "value": "www.seeld-ins.co.il" }], "destination": "https://seeld.co.il/", "permanent": true },
    { "source": "/:path*", "has": [{ "type": "host", "value": "www.seeld-ins.co.il" }], "destination": "https://seeld.co.il/:path*", "permanent": true }
  ]
}
```

בדיקות קבלה לקובץ (ב-preview, לפני מיזוג): `curl -I` על `/`, `/about`, `/about/` (308), `/app/x` (200, קליפה), `/nonexistent` (404), `/assets/<chunk>` (`immutable`), `/api/board` (`s-maxage`), `/_vercel/image?url=/art/<file>.png&w=640&q=75` (200, `content-type: image/avif|webp`), ו-`https://seeld.vercel.app/` (308 ל-`seeld.co.il`).

---

## 2. סביבות, Git ומחזור פריסה

### 2.1 משתני סביבה

**מה התיעוד אומר.** שלוש סביבות ברירת מחדל (Production, Preview, Development) ואפשר סביבות מותאמות. כל משתנה הוא Config (קריא לחברי צוות מורשים) או Secret (כתיבה בלבד אחרי שמירה; הסוג הישן Sensitive ממשיך לפעול כ-Secret). משתני Preview יכולים להיות לפי ענף (`vercel env add X --environment preview --git-branch feature`). שינוי משתנה חל רק על פריסות חדשות. גבולות: 1,000 משתנים לסביבה, 64KB סה"כ (שמות+ערכים) לפריסה. ערך Secret באורך 32+ תווים מוסתר כ-`[REDACTED]` בלוגי build. מקור: <https://vercel.com/docs/environment-variables>, <https://vercel.com/docs/environment-variables/sensitive-environment-variables>, <https://vercel.com/docs/environment-variables/manage-across-environments>, <https://vercel.com/docs/limits#environment-variables>.

**למה זה חשוב לנו.** האתר מחזיק רק מפתח publishable של Supabase (לפי `.env.example`), אך בעתיד ייכנסו מפתחות שרת (Resend, service role ל-Edge Functions בצד Supabase, אולי Sentry DSN). ההפרדה Preview/Production חיונית כדי ש-preview לא יכתוב ל-DB פרודקשן.

**התקן שלנו.**
- `VITE_*` = ציבורי בלבד (נכנס ל-bundle). כל מפתח שאינו ציבורי מוגדר Secret ובלי קידומת `VITE_`.
- Production מצביע ל-Supabase פרודקשן (Frankfurt); Preview מצביע לפרויקט/ענף staging; Development לערכי מקומי בלבד.
- משתנים לכל הסביבות: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. Secret ל-Production/Preview בלבד: `VERCEL_AUTOMATION_BYPASS_SECRET` (נוצר אוטומטית בהפעלת Protection Bypass), `SEELD_MONITOR_TOKEN` (סעיף 3.3), ובעתיד `RESEND_API_KEY`.
- ביקורת רבעונית: `vercel env ls --environment production` מול `preview` מול `development` (<https://vercel.com/docs/environment-variables/manage-across-environments>).

### 2.2 אינטגרציית Git: ענף פרודקשן, previews, forks, verified commits

**מה התיעוד אומר.** כל push לענף שאינו production יוצר preview; PR מקבל URL לפי ענף ו-URL לפי commit. PR מ-fork דורש אישור של חבר צוות (Git Fork Protection) כדי לא להדליף משתני סביבה/OIDC. אפשר לדרוש Verified Commits (רק GitHub): פריסה לקומיט לא מאומת מבוטלת. `github.autoJobCancelation` (ברירת מחדל `true`) מבטל build ישן כשמגיע commit חדש. `git.deploymentEnabled` יכול לכבות פריסה אוטומטית לענפים (minimatch) או לכולם (`false`). מקור: <https://vercel.com/docs/git/vercel-for-github>, <https://vercel.com/docs/project-configuration/git-settings#verified-commits>, <https://vercel.com/docs/project-configuration/git-configuration>, <https://vercel.com/docs/deployments/environments>.

**התקן שלנו.** ענף production = `main`. Previews רק ל-PR (סעיף 1.8). Git Fork Protection נשאר מופעל. Verified Commits: להפעיל אחרי שכל המפתחים חותמים (SSH/GPG) כי אחרת פריסות יבוטלו בשקט. לא משנים `autoJobCancelation`.

### 2.3 Deployment Protection ו-bypass לאוטומציה

**מה התיעוד אומר.** שיטות: Vercel Authentication (חינם), Password Protection ($20 לחודש לפרויקט ב-Pro), Passport ו-Trusted IPs (Enterprise). היקפים: Standard Protection (`all_except_custom_domains`: מגן על כל ה-URLs של previews ועל URL הפרודקשן הגנרי, אך לא על דומיינים מותאמים), All Deployments, Only Production. Protection Bypass for Automation: סוד לפרויקט שנחשף כ-`VERCEL_AUTOMATION_BYPASS_SECRET`; שולחים כותרת `x-vercel-protection-bypass: <secret>` (מועדף) או פרמטר שאילתה באותו שם; יש גם `vercel curl` שמטפל בזה אוטומטית. מקור: <https://vercel.com/docs/deployment-protection>, <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation>, <https://vercel.com/docs/deployment-protection/automated-agent-access>, <https://vercel.com/docs/cli/curl>.

**מצב נוכחי.** `ssoProtection: all_except_custom_domains` = Standard Protection עם Vercel Authentication. זה נכון: previews סגורים לצוות, `seeld.co.il` פתוח.

**התקן שלנו.** נשאר Standard Protection. מפעילים Protection Bypass for Automation (פעולה בלוח של הבעלים) ושומרים את הסוד כ-GitHub Secret בשם `VERCEL_AUTOMATION_BYPASS_SECRET` לבדיקות smoke מול previews (סעיף 7.4). לא מפעילים Password Protection (אין בו צורך לאתר ציבורי; $20 לחודש).

### 2.4 Deploy Hooks

**מה התיעוד אומר.** URL ייחודי שמקבל `GET/POST` ובונה ענף מוגדר; עד 5 hooks לפרויקט ב-Pro; `?buildCache=false` לבנייה בלי cache; לא פועל אם `github.enabled=false`. מקור: <https://vercel.com/docs/deploy-hooks>, <https://vercel.com/docs/limits#general-limits>.

**התקן שלנו.** hook אחד בשם `content-rebuild` לענף `main`, להפעלה כשנתוני ה-board ב-Supabase מתעדכנים (סנכרון חודשי) ורוצים לרענן HTML מרונדר שמכיל מספרים. ה-URL הוא סוד (GitHub Secret / Supabase Vault), לא נכנס לקוד.

### 2.5 מניעת פריסות כפולות

**מה התיעוד אומר.** פריסה מ-CLI (`vercel deploy --prod`) ופריסה מאינטגרציית Git הן שני מסלולים עצמאיים; תבנית GitHub Actions הרשמית בונה עם `vercel build` ומעלה `vercel deploy --prebuilt`, ומי שעובד כך מכבה את הפריסה האוטומטית (`git.deploymentEnabled: false`) כדי שלא יהיו שתיים. מקור: <https://vercel.com/docs/git/vercel-for-github#using-github-actions>, <https://vercel.com/docs/project-configuration/git-configuration#turning-off-all-automatic-deployments>, <https://vercel.com/docs/cli/deploy>.

**למה זה חשוב לנו.** זה שורש התקלה: `deploy-vercel.yml` מריץ `vercel deploy --prod` על כל push ל-`main` במקביל לפריסת Git. שתי בניות של אותו commit בשתי סביבות בנייה שונות יצרו hashים שונים; HTML מהאחת וקבצי `/assets` מהשנייה.

**התקן שלנו.** מסלול פריסה יחיד: אינטגרציית Git של Vercel. **מוחקים** את `.github/workflows/deploy-vercel.yml` (בכפוף לאישור הבעלים לפי חוקת ה-HQ) או משאירים אותו `workflow_dispatch` בלבד ככפתור חירום. חוק: אף סוכן ואף סקריפט לא מריץ `create_deployment`/`vercel deploy --prod` מול הפרויקט כשהאינטגרציה פעילה.

### 2.6 Instant Rollback ו-Promote

**מה התיעוד אומר.** ב-Pro אפשר לחזור לכל פריסה שהייתה פעם מאוחזת לדומיין פרודקשן (Hobby: רק הקודמת). הרולבק מצביע על build ישן: משתני סביבה שהשתנו מאז לא מתעדכנים, ו-cron jobs משוחזרים לפי הפריסה. `vercel rollback <url>`, `vercel rollback status`, וביטול רולבק עם `vercel promote <url>`. רולבקים ו-promotes רצים אחד בכל פעם. Promote של preview לפרודקשן **מבצע build מחדש** עם משתני פרודקשן. מקור: <https://vercel.com/docs/instant-rollback>, <https://vercel.com/docs/deployments/rollback-production-deployment>, <https://vercel.com/docs/deployments/promote-preview-to-production>, <https://vercel.com/docs/cli/rollback>.

**התקן שלנו.** רולבק קודם לחקירה (כבר ב-`RUNBOOK.md`). להעדיף Instant Rollback על Promote-של-preview (האחרון בונה מחדש = hashים חדשים). בדיקה אחרי: `vercel logs requests --environment production --query 'httpStatus >= 500' --since 5m` ו-`npm run health -- https://seeld.co.il`.

### 2.7 Deployment Retention

**מה התיעוד אומר.** Pro: 30 יום לכל סוג פריסה (אפשר לשנות ברמת צוות/פרויקט). חריגים: 10 הפריסות האחרונות, 20 פריסות פרודקשן אחרונות במצב Ready, פריסה עם alias פרודקשן, וה-preview האחרון של ענף עם PR פתוח. מקור: <https://vercel.com/docs/deployment-retention>.

**התקן שלנו.** פרודקשן 90 יום (כדי שרולבק ו-Skew Protection יוכלו להישען על היסטוריה), previews 30 יום, errored/canceled 7 יום. פעולה בלוח.

### 2.8 Skew Protection: הפתרון המבני לאי-התאמת chunks

**מה התיעוד אומר.** זמין ב-Pro/Enterprise. מזהה הפריסה נוסע ב-`?dpl=<id>`, בכותרת `x-deployment-id`, או ב-cookie `__vdpl`; Vercel מנתבת את הבקשה לפריסה שהגישה את העמוד. ניווט מסמך מלא (refresh, הקלדת URL) תמיד מקבל את הפריסה העדכנית; רק בקשות-משנה ננעלות. Maximum Age ברירת מחדל 12 שעות ב-Pro, ניתן להגדלה עד מדיניות ה-retention; Googlebot/Bingbot מקבלים 60 יום אוטומטית. בלי framework נתמך מיישמים ידנית: `?dpl=${process.env.VERCEL_DEPLOYMENT_ID}` כש-`VERCEL_SKEW_PROTECTION_ENABLED === '1'`. פריסה שנמחקה (ידנית או לפי retention) אינה נגישה. מקור: <https://vercel.com/docs/skew-protection>, <https://vercel.com/docs/environment-variables/system-environment-variables>.
Vite מאפשר לעצב את כתובות הנכסים בזמן build דרך `experimental.renderBuiltUrl(filename, { hostType, type })` (ניסיוני). מקור: <https://vite.dev/guide/build.html#advanced-base-options>.

**למה זה חשוב לנו.** זה בדיוק התרחיש שלנו: גולש עם עמוד פתוח (או HTML שנשאר רגע ב-cache) מבקש chunk מהפריסה הקודמת. עם `?dpl=` בכתובת, הבקשה מגיעה לפריסה הישנה ומקבלת 200, לא 404 שנכנס ל-cache לשנה.

**התקן שלנו (Phase 2, אחרי Phase 1 של מסלול פריסה יחיד).**
1. להפעיל Skew Protection בלוח (Settings → Advanced), Maximum Age = 7 ימים (קצר מ-retention של 90 יום לפרודקשן).
2. ב-`vite.config.ts`: כש-`process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1"`, להוסיף `?dpl=<VERCEL_DEPLOYMENT_ID>` לכל נכס מגובב (JS/CSS/פונטים שעוברים דרך Vite):

```ts
// vite.config.ts (קטע)
const dpl =
  process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1" && process.env.VERCEL_DEPLOYMENT_ID
    ? `?dpl=${process.env.VERCEL_DEPLOYMENT_ID}`
    : "";

export default defineConfig({
  experimental: {
    renderBuiltUrl(filename, { type }) {
      if (type === "asset" || filename.startsWith("assets/")) return `/${filename}${dpl}`;
      return { relative: true };
    },
  },
});
```

3. **לא אומת**: ש-`renderBuiltUrl` מכסה גם את ה-preload helper של dynamic imports ואת `url()` ב-CSS בכל המקרים; לבדוק ב-preview עם `grep -c "dpl=" dist/assets/*.js dist/index.html`. אם לא מכסה, חלופה: cookie `__vdpl` דרך Routing Middleware קטן על בקשות מסמך בלבד (<https://vercel.com/docs/skew-protection#setting-the-cookie-in-routing-middleware>), במחיר CDN Request CPU (<https://vercel.com/docs/pricing>).
4. ה-prerender רץ אחרי `vite build` ולכן ה-HTML המרונדר יכיל את כתובות ה-`?dpl=` אוטומטית.

### 2.9 Rolling Releases

**מה התיעוד אומר.** Pro: פרויקט אחד; שלבים באחוזים עם 100% בסוף; דורש Skew Protection (הפעלתו מפעילה אותו אוטומטית); abort = חזרה לפריסה הקודמת. מקור: <https://vercel.com/docs/rolling-releases>.

**התקן שלנו.** לא כעת. אתר תוכן עם פריסות קטנות; הסיכון נמוך והמורכבות (ותלות ב-Skew) לא מצדיקה. לשקול כשיהיו טפסים קריטיים שמשתנים לעיתים.

### 2.10 Deployment Checks ו-Checks API

**מה התיעוד אומר.** Deployment Checks מחזיקים פריסת פרודקשן בלי להצמיד אותה לדומיין עד שכל הבדיקות הנדרשות עוברות. Native checks: `lint`, `typecheck` (לפי סקריפטים ב-`package.json`). GitHub Checks: workflow ב-GitHub Actions שמופעל ב-`repository_dispatch` (`vercel.deployment.success` וכו') ומדווח סטטוס עם `vercel/repository-dispatch/actions/status@v1`; שמות job ייחודיים. Checks API הוותיק הוא לאינטגרציות (OAuth). מקור: <https://vercel.com/docs/deployment-checks>, <https://vercel.com/docs/git/vercel-for-github#repository-dispatch-events>, <https://vercel.com/docs/checks/checks-api>.

**למה זה חשוב לנו.** זה שער איכות **אחרי** build פרודקשן ו**לפני** שהדומיין עובר: אפשר להריץ `health-check`/`smoke` מול URL הפריסה החדשה (עם bypass) ולחסום פרומוט אם נכשל.

**התקן שלנו.** Phase 2: GitHub Check בשם `Vercel - seeld: smoke` (סעיף 7.4). Phase 1: native `typecheck` ו-`lint` (זול, מיידי). **לא אומת**: האם Deployment Checks זמינים ללא תוספת תשלום ב-Pro; העמוד שנקרא לא ציין מחיר.

---

## 3. אבטחה: Firewall, Security Checkpoint, בוטים, לוגים

### 3.1 שכבות וסדר הפעלה

**מה התיעוד אומר.** סדר: DDoS mitigation (פלטפורמה) → WAF IP blocking → WAF custom rules → WAF managed rulesets. Deployment Protection נבדק אחרי שכבת הפלטפורמה ולפני ה-WAF. DDoS mitigation (L3/L4/L7) חינם בכל התכניות ותעבורה חסומה לא מחויבת. מקור: <https://vercel.com/docs/vercel-firewall>, <https://vercel.com/docs/vercel-firewall/firewall-concepts>, <https://vercel.com/docs/vercel-firewall/ddos-mitigation>.

### 3.2 Security Checkpoint: מה זה ולמה הניטור שלנו נחסם

**מה התיעוד אומר.** פעולת `challenge` מאמתת שהלקוח הוא דפדפן אמיתי שמריץ JavaScript; "During this process, visitors see a Vercel Security Checkpoint screen". לקוחות שאינם דפדפן (בוטים, סקריפטים) לא יכולים לעבור. challenge מופעל על ידי: Attack Mode (לכל התעבורה שאינה בוט מאומת), Bot Protection Managed Ruleset במצב Challenge, או כלל מותאם עם `challenge`. בקשות-משנה בתוך session תקף עוברות. מקור: <https://vercel.com/docs/vercel-firewall/firewall-concepts#challenge>, <https://vercel.com/docs/vercel-firewall/vercel-waf/attack-challenge-mode>, <https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-bot-protection-managed-ruleset>.
Attack Mode: חינם, 1/6/24 שעות, בוטים מאומתים (מנועי חיפוש, webhooks) עוברים, לא משפיע על אינדוקס, בקשות חסומות לא מחויבות. מקור: <https://vercel.com/docs/vercel-firewall/vercel-waf/attack-challenge-mode>.

**למה זה חשוב לנו.** `scripts/health-check.mjs` שולח `user-agent: seeld-site-watch/1.0` מ-GitHub Actions (IP משתנה). זה בדיוק "non-browser client": כש-Bot Protection במצב Challenge או כש-Attack Mode פעיל, הניטור מקבל את עמוד ה-Checkpoint (HTML, סטטוס לא-200) ומדווח כשל שווא. **לא אומת**: מה מצב הכלל `bot-protection` בפרויקט כעת (לא נקראה הקונפיגורציה הפעילה בסבב זה; לקרוא עם `vercel firewall bot-management` או `get_firewall_config(active)`).

### 3.3 איך ניטור לגיטימי מתאמת

**מה התיעוד אומר.** לתעבורה אוטומטית מהימנה יוצרים כלל מותאם עם פעולת `bypass` (עוקף את managed rulesets ו-custom rules), למשל לפי User Agent או כותרת. `bypass` אינו נתמך ב-`vercel.json` (רק `challenge`/`deny`), כן בלוח/CLI. לעקיפת שכבת ה-DDoS של הפלטפורמה יש System Bypass Rules (Pro/Enterprise). מקור: <https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets#bypassing-rulesets>, <https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules#supported-actions>, <https://vercel.com/docs/vercel-firewall/ddos-mitigation#system-bypass-rules>, <https://vercel.com/docs/cli/firewall>.

**התקן שלנו.**
1. הניטור שולח כותרת סודית: `x-seeld-monitor: <SEELD_MONITOR_TOKEN>` (סוד ב-GitHub Actions ובסביבת Vercel). לא מסתמכים על User Agent (ניתן לזיוף) ולא על IP (GitHub Actions משתנים).
2. כלל WAF (בלוח או CLI): אם כותרת `x-seeld-monitor` שווה לערך הסוד → `bypass`. ממוקם לפני כללי challenge/rate limit.
3. מול previews מוסיפים גם `x-vercel-protection-bypass` (סעיף 2.3).
4. אם יידרש (כשלים בזמן מתקפה): System Bypass Rule לפי אותה כותרת. **לא אומת**: אילו תנאים System Bypass Rules תומכים ב-Pro (העמוד הייעודי לא נקרא).

```bash
# דוגמה (CLI; הערכים מוחלפים; לא הורץ)
vercel firewall rules add "monitor-bypass" \
  --condition '{"type":"header","key":"x-seeld-monitor","op":"eq","value":"<SEELD_MONITOR_TOKEN>"}' \
  --action bypass --yes
vercel firewall publish --confirm-name seeld
```

שינוי ב-`scripts/health-check.mjs`: הוספת שתי הכותרות כש-`process.env.SEELD_MONITOR_TOKEN` / `VERCEL_AUTOMATION_BYPASS_SECRET` קיימים. **לא אומת**: הסינטקס המדויק של `--condition` לכותרת (`key`/`value`) ב-CLI; לאמת מול <https://vercel.com/docs/cli/firewall> לפני הרצה.

### 3.4 WAF custom rules ו-rate limiting

**מה התיעוד אומר.** Custom rules חינם בכל התכניות (Hobby: 3 כללים). פעולות: log, deny, challenge, bypass, rate_limit, redirect; persistent actions חוסמות IP לזמן מוגדר בשכבת הפלטפורמה. Rate limiting: Pro 40 כללים לפרויקט, חלון 10 שניות עד 10 דקות, מפתחות IP/JA4, fixed window; מחיר $0.50 ל-1M **בקשות שהותרו** (חסומות לא מחויבות); המונים לפי אזור. ב-`vercel.json` אפשר רק `challenge`/`deny` דרך `routes` + `mitigate`. מקור: <https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules>, <https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting>, <https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing>.

**התקן שלנו (סדר כללים).**
1. `monitor-bypass` (סעיף 3.3).
2. `deny-sensitive-paths`: path מסתיים ב-`.env`, `.git`, `.bak`, `wp-login.php`, `xmlrpc.php` → deny, persistent 1 שעה.
3. `ratelimit-api`: path מתחיל ב-`/api/` → 120 בקשות לדקה ל-IP → deny ל-10 דקות. ה-API שלנו מוגש מ-CDN cache ברובו, כך שגולש רגיל לא מתקרב.
4. `ratelimit-forms`: `POST` ל-`/api/` (כשיהיו endpoints לטפסים) → 10 לדקה ל-IP.
5. Bot Protection Managed Ruleset: **Log** תחילה (שבועיים), ואז Challenge. חשוב: Challenge לא פוגע בבוטים מאומתים (Googlebot, Bingbot) כי הם מוחרגים.
6. AI Bots Managed Ruleset: **Allow** ל-AI Assistants (זה ליבת ה-AEO שלנו: `llms.txt`, תשובות), **Log** ל-AI Crawlers; לא Deny בלי החלטת מוצר. מקור: <https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-ai-bots-managed-ruleset>.
7. OWASP Core Ruleset: Enterprise בלבד ($0.80 ל-1M בקשות נבדקות); לא רלוונטי ל-Pro. מקור: <https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-owasp-core-ruleset>, <https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing#managed-ruleset-pricing>.
8. BotID: Basic חינם, Deep Analysis $1 ל-1,000 קריאות `checkBotId()` ב-Pro. לשקול רק לטופס ליד אם יזוהה spam. מקור: <https://vercel.com/docs/botid#pricing>.
9. הערה: Bot Protection לא עובד נכון מאחורי reverse proxy (Cloudflare וכו'). אין להציב CDN נוסף לפני Vercel. מקור: <https://vercel.com/docs/bot-management#bot-protection-ruleset-with-reverse-proxies>.

### 3.5 Attack Mode ו-DDoS: runbook קצר

- מתקפה ממוקדת: `vercel firewall attack-mode enable --duration 6h --yes` (מיידי, ללא publish). הניטור ממשיך לעבוד בזכות `bypass`. **לא אומת**: האם כלל `bypass` של WAF עוקף גם Attack Mode (שהוא שכבה לפני custom rules); אם לא, הניטור ידווח כשל בזמן Attack Mode ויש לציין זאת ב-issue.
- לא מכבים System Mitigations (24 שעות) אלא לצורך דיבוג false positive; המשתמש משלם על תעבורה שהייתה נחסמת. מקור: <https://vercel.com/docs/vercel-firewall/ddos-mitigation#bypass-system-level-mitigations>.
- תחקיר: `vercel firewall traffic inspect ip <ip>`, `vercel firewall alerts inspect <id>`. מקור: <https://vercel.com/docs/cli/firewall>.

### 3.6 Log Drains, Activity Log, Audit Log

**מה התיעוד אומר.** Drains (Pro/Enterprise): לוגים (runtime/build/static), traces, Speed Insights (עם Plus), Web Analytics, Audit Logs (Enterprise בלבד); $0.50 ל-GB לפי JSON לא דחוס. Audit Logs: Enterprise. Activity Log קיים ל-Pro (מתועד למשל ברדקציה של Secrets). `vercel security` מריץ בדיקות תצורת אבטחה מה-CLI (JSON לא אינטראקטיבי). מקור: <https://vercel.com/docs/drains>, <https://vercel.com/docs/audit-log>, <https://vercel.com/docs/environment-variables/sensitive-environment-variables#build-log-redaction>, <https://vercel.com/docs/security/security-dashboard>.

**התקן שלנו.** לא פותחים Drain כעת (Observability Plus נותן 30 יום retention, סעיף 4.3). כשיידרש ארכיון ארוך: Drain לוגים + Web Analytics ל-endpoint של Supabase Edge Function או ל-S3 (עלות: כמה GB בחודש = דולרים בודדים). `vercel security check --findings` רץ בבדיקת תחזוקה חודשית (סעיף 8.5).

---

## 4. תצפית (Observability)

### 4.1 Web Analytics

**מה התיעוד אומר.** Pro: אין אירועים כלולים, $0.03 ל-1K אירועים (מהקרדיט החודשי), חלון דיווח 12 חודשים; Plus $10 לחודש לצוות (24 חודשים, UTM, 8 מאפיינים). הפעלה מוסיפה נתיבים `/_vercel/insights/*` באותו origin; ל-HTML רגיל יש תגית `<script>` (או `inject()` מהחבילה `@vercel/analytics`). מקור: <https://vercel.com/docs/analytics/limits-and-pricing>, <https://vercel.com/docs/analytics/quickstart>.

**למה זה חשוב לנו.** אותו origin → CSP `'self'` מספיק, אין cookies של צד ג', אין פגיעה ב-bundle (סקריפט נפרד). עלות ל-50K צפיות = $1.50.

**התקן שלנו.** להפעיל; קריאת `inject()` מ-`@vercel/analytics` ב-`main.tsx` רק כש-`import.meta.env.PROD`, או תגית script ב-`index.html`. `beforeSend` מסיר פרמטרי שאילתה רגישים (<https://vercel.com/docs/analytics/redacting-sensitive-data>).

### 4.2 Speed Insights ויעדי Core Web Vitals

**מה התיעוד אומר.** חינם: 10,000 אירועים ב-30 יום (מתגלגל) לצוות, RES בלבד; Plus: $10 לחודש לפרויקט + $0.65 ל-10K אירועים, כל ה-CWV, פירוטים, Drains. ספי CWV "טוב" באחוזון 75: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. מקור: <https://vercel.com/docs/speed-insights/limits-and-pricing>, <https://web.dev/articles/vitals>.

**התקן שלנו (יעדים לאתר עברי RTL).**

| מדד | יעד p75 (נייד) | הערות RTL/עברית |
|---|---|---|
| LCP | ≤ 2.0s (יעד פנימי מחמיר מ-2.5) | האיור/כותרת `h1` ב-Rubik: פונט עצמי ב-woff2 עם `preload` + `font-display: swap`; subset עברי+לטיני בלבד |
| INP | ≤ 150ms | ללא JS כבד ב-hydration של טפסים; Radix lazy |
| CLS | ≤ 0.05 | `size-adjust`/`ascent-override` לפונט fallback כדי שהחלפת פונט לא תזיז טקסט RTL; `aspect-ratio` לאיורים; לא להזריק באנרים מעל התוכן |
| TTFB | ≤ 400ms מישראל | HTML סטטי מ-PoP; **לא אומת** היכן ה-PoP הקרוב ביותר לישראל (הרשימה הציבורית מפרטת אזורי compute, לא PoPs) |

Speed Insights חינמי מספיק לבדיקת RES; מעבר ל-Plus רק אם רוצים INP/CLS לפי מסלול.

### 4.3 Runtime Logs, Observability, Observability Plus

**מה התיעוד אומר.** Runtime logs: Pro יום אחד, עם Observability Plus 30 יום (14 ימים רצופים בחלון של 30); 256 שורות ו-1MB לבקשה. Observability Plus: $1.20 ל-1M אירועים, **מופעל כברירת מחדל לצוותי Pro שנוצרו/שודרגו מ-03.04.2026**, אפשר להחריג פרויקטים. CLI: `vercel logs --environment production --query 'level:error' --since 1h`, `vercel logs requests --query 'httpStatus >= 500'`, `vercel curl --trace`. מקור: <https://vercel.com/docs/logs/runtime#limits>, <https://vercel.com/docs/observability/observability-plus>, <https://vercel.com/docs/observability>.

**התקן שלנו.** לבדוק אם Plus פעיל (לוח → Billing). עלות משוערת: אתר עם ~1M בקשות CDN בחודש = ~1M אירועים = ~$1.20. משאירים פעיל. שאילתות קבועות ב-runbook: שגיאות 5xx, `cacheResult:MISS` על `/api/*` (אמור להיות נמוך), בקשות ל-`/assets/*` עם `httpStatus:404` (איתות מוקדם לאי-התאמת chunks).

### 4.4 Sentry בלי לנפח את ה-bundle

**מה התיעוד אומר.** Developer plan חינמי למשתמש אחד עם Error Monitoring ו-Tracing (המכסות המדויקות מופיעות במחשבון ולא בטקסט קבוע; **לא אומת** המספר המדויק). חבילת `@sentry/react` עם `Sentry.init` + `browserTracingIntegration` + `replayIntegration` היא ההתקנה המלאה. להקטנת bundle: יצירת `BrowserClient` ידנית מ-`@sentry/browser` עם אינטגרציות מינימליות (`globalHandlersIntegration`, `linkedErrorsIntegration`, `dedupeIntegration`, `breadcrumbsIntegration`) מאפשרת tree-shaking של ברירות המחדל; דגלי build `__SENTRY_DEBUG__: false`, `__SENTRY_TRACING__: false` מסירים קוד. Loader Script טוען את ה-SDK מ-CDN של Sentry רק כשיש שגיאה (lazy כברירת מחדל). מקור: <https://sentry.io/pricing/>, <https://docs.sentry.io/pricing/>, <https://docs.sentry.io/platforms/javascript/guides/react/>, <https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/>, <https://docs.sentry.io/platforms/javascript/install/loader/>.

**התקן שלנו.**
1. בלי Tracing, בלי Replay, בלי Feedback (כל אחד מהם עשרות KB ו-PII).
2. `import()` דינמי של מודול `src/lib/monitoring.ts` רק אחרי `window.load` ורק ב-`import.meta.env.PROD`, שבונה `BrowserClient` מינימלי. כך הכניסה הראשית לא גדלה (תקציב `size:check` נשמר) והקוד נטען אחרי LCP.
3. ב-`vite.config.ts`: `define: { __SENTRY_DEBUG__: false, __SENTRY_TRACING__: false }`.
4. CSP: הוספת כתובת ה-ingest ל-`connect-src` (צורת הדומיין תלויה באזור הארגון ב-Sentry; לבחור EU; **לא אומת** התבנית המדויקת, לקרוא מה-DSN).
5. חלופה בלי קוד בכלל: Loader Script עם `data-lazy` (ברירת מחדל). נדחה כי דורש `script-src` לדומיין חיצוני ומטעין מ-CDN של צד ג'.
6. שגיאות API: Vercel Runtime Logs/Observability (`get_runtime_errors`) מספיקים; לא מתקינים Sentry בפונקציות.

---

## 5. ביצועים

### 5.1 רשת ה-CDN והגשת HTML סטטי

**מה התיעוד אומר.** 126 PoPs ב-94 ערים, 19 אזורי compute; קבצים סטטיים נשמרים ב-CDN אוטומטית ומוגשים מהאזור הקרוב; `x-vercel-cache: PRERENDER` = הוגש מאחסון סטטי. ISR רלוונטי ל-frameworks עם רינדור בשרת; אצלנו ה-prerender בזמן build הוא המקבילה. מקור: <https://vercel.com/docs/regions>, <https://vercel.com/docs/caching/cdn-cache#static-files-caching>, <https://vercel.com/docs/headers/response-headers#x-vercel-cache>.

**התקן שלנו.** כל עמוד ציבורי = קובץ סטטי. אין רינדור בשרת. נתונים שמשתנים (לוח תשואות) מגיעים מ-`/api/*` עם `s-maxage` ולא נכנסים ל-HTML, אלא אם ה-Deploy Hook (סעיף 2.4) מרנדר מחדש אחרי סנכרון חודשי.

### 5.2 דחיסה

**מה התיעוד אומר.** Brotli מועדף על gzip כשהלקוח תומך (JS קטן ב-14%, HTML ב-21%, CSS ב-17%); דחיסה אוטומטית לפי `Accept-Encoding` ול-MIME types ברשימה (text/*, application/javascript, json, svg, פונטים otf/ttf). מקור: <https://vercel.com/docs/edge-network/compression>.

**התקן שלנו.** אין מה להגדיר. `size:check` מודד gzip; להוסיף מדידת brotli להשוואה (אינפורמטיבי). woff2 כבר דחוס ולא נכנס לרשימה; TTF נדחס, ועדיין woff2 קטן יותר (סעיף 5.4).

### 5.3 תמונות

ראו סעיף 1.7. בנוסף: `og-cover.png` (38KB) ו-PWA icons נשארים PNG (צרכני OG לא תומכים ב-AVIF).

### 5.4 פונטים

**מצב.** `index.html` מטעין Rubik מ-Google Fonts (`preconnect` + CSS) בעוד שב-`public/fonts` יש `Rubik-Regular.ttf` ו-`Rubik-Bold.ttf`. CSP מאפשר `fonts.googleapis.com`/`fonts.gstatic.com`.

**התקן שלנו.** פונט עצמי בלבד: המרה ל-woff2 עם subset (עברית + לטינית בסיסית + ספרות), `<link rel="preload" as="font" type="font/woff2" crossorigin>` ל-Regular בלבד, `@font-face` עם `font-display: swap` ו-fallback עם `size-adjust` כדי לצמצם CLS. הקבצים עוברים דרך Vite (`src/assets/fonts`) כדי לקבל hash ו-`immutable`. אחר כך מסירים Google Fonts מה-CSP. יתרונות: פחות חיבור DNS/TLS לדומיין שלישי, פרטיות (אין בקשות לגוגל), שליטה ב-cache.

### 5.5 תקציב bundle

**מצב.** כניסה ראשית 118.6KB gzip, תקרה יחסית +8%.

**התקן שלנו.** שתי תקרות: יחסית (+8%, קיימת) ואבסולוטית 130KB gzip לכניסה הראשית ו-250KB gzip לסך ה-JS הנטען בעמוד הבית (למדוד ב-`size-check.mjs` מתוך `dist/index.html`). כל ספרייה חדשה ≥ 10KB gzip נכנסת רק ב-`import()` דינמי. `manualChunks` הקיים (react, radix וכו') נשמר.

---

## 6. דומיינים ו-DNS

### 6.1 apex ו-www, רשומות, תעודות

**מה התיעוד אומר.** apex דורש רשומת `A` (או ALIAS/ANAME אצל ספק שתומך) ל-IP שמוצג בהגדרות הפרויקט; `www` דורש `CNAME` ליעד שמוצג (בדוגמאות התיעוד: `cname.vercel-dns.com`); משתמשים **בערכים שמוצגים לפרויקט** ולא בערכים מפרויקט אחר. Vercel ממליצה טכנית על `www` כראשי (CNAME גמיש יותר מ-A מול DDoS), אך תומכת ב-apex ב-Anycast. תעודות TLS מונפקות ומתחדשות אוטומטית (`vercel certs ls`). אם הדומיין נשאר אצל רשם חיצוני, מוסיפים את הרשומות שם; מעבר ל-nameservers של Vercel דורש שחזור רשומות דוא"ל, אחרת "Email stopped arriving after a nameserver change". מקור: <https://vercel.com/docs/domains/working-with-domains/add-a-domain>, <https://vercel.com/docs/domains/set-up-custom-domain>, <https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting#additional-technical-information-about-domain-redirects>, <https://vercel.com/docs/domains/managing-dns-records>.

**התקן שלנו.**
1. `seeld.co.il` נשאר הראשי (apex) כפי שהוא היום (verified).
2. **DNS נשאר אצל הרשם** (לא מעבירים nameservers ל-Vercel): פחות סיכון לדוא"ל ולרשומות אחרות; Vercel צריכה רק `A` ו-`CNAME`.
3. להוסיף `www.seeld.co.il` לפרויקט + `CNAME www → <ערך מהלוח>` + Redirect to `seeld.co.il` (308) בלוח.
4. אימות: `dig A seeld.co.il +short`, `dig CNAME www.seeld.co.il +short`, `curl -IL https://www.seeld.co.il` מסתיים ב-`https://seeld.co.il/`.
5. **לא אומת**: ערכי ה-`A`/`CNAME` הנוכחיים המומלצים לפרויקט (התיעוד מציג דוגמאות `76.76.21.21` ו-`cname.vercel-dns.com`, אך מנחה להשתמש בערך שמוצג בהגדרות). לקרוא מהלוח (Settings → Domains).

### 6.2 רשומות דוא"ל שחייבות להישאר

**מה התיעוד אומר.** Resend מאמת דומיין דרך DKIM ו-SPF; Return-Path משתמש כברירת מחדל בתת-דומיין `send` (ואם מוצגות רשומות CNAME, גם סיבלינג עם קידומת `r`); DMARC = TXT ב-`_dmarc` עם `p=none` תחילה ואז `quarantine`/`reject`, `rua=` לדיווחים. מקור: <https://resend.com/docs/dashboard/domains/introduction>, <https://resend.com/docs/dashboard/domains/custom-return-path>, <https://resend.com/docs/dashboard/domains/dmarc>.

**התקן שלנו.**
- הדואר יוצא מ-`seeld.info` (דומיין נפרד). אין לגעת ברשומות שלו בשום פעולת Vercel; `seeld.info` **אינו** מתווסף לפרויקט Vercel (אין צורך) ולכן אין סיכון.
- אם בעתיד ישלחו מ-`seeld.co.il`: הרשומות (DKIM TXT, SPF/MX על `send.seeld.co.il`, `_dmarc`) נוספות אצל הרשם; `includeSubDomains` ב-HSTS אינו משפיע על דוא"ל (HSTS הוא HTTP בלבד) אך תת-דומיין עם שרת HTTP (אם יהיה) חייב HTTPS.
- DMARC ל-`seeld.info`: `v=DMARC1; p=none; rua=mailto:<תיבה>` → אחרי חודש נקי `p=quarantine`.
- **לא אומת**: שמות הרשומות המדויקים שמציג Resend לדומיין ספציפי (מוצגים בלוח Resend בעת ההוספה).

### 6.3 כללי redirect

מסוכם בסעיף 1.2: קנוני `https://seeld.co.il`, `www` → apex (לוח), `seeld.vercel.app` → apex (`vercel.json`), דומיינים ישנים ממתינים להחלטה.

---

## 7. CI ב-GitHub Actions

### 7.1 מה רץ איפה

| בדיקה | על PR | על `main` | מקור/הערה |
|---|---|---|---|
| typecheck (`tsc --noEmit -p tsconfig.app.json`) | כן | כן | קיים |
| lint (`eslint .`) | כן | כן | קיים |
| vitest | כן | כן | קיים |
| `build:seo` עם `PRERENDER_STRICT=1` (Playwright Chromium) | כן | כן | קיים; מוסיפים cache לדפדפן |
| `check:aeo` | כן | כן | קיים |
| `size:check` (+8%, ותקרה אבסולוטית) | כן | כן | קיים |
| Supabase: `supabase db start` → מיגרציות מאפס → `supabase test db` (pgTAP) → `supabase db lint --level warning --fail-on error` → drift של types | כן | כן | <https://supabase.com/docs/guides/cli/github-action/testing>, <https://supabase.com/docs/reference/cli/supabase-db-lint>, <https://supabase.com/docs/guides/deployment/ci/generating-types> |
| `npm audit --omit=dev --audit-level=high` | כן | כן | חינם |
| סריקת סודות (gitleaks) | כן | כן | צד ג'; GitHub Push Protection ברמת ריפו דורש Secret Protection (ראו 7.5) |
| smoke מול preview (`repository_dispatch: vercel.deployment.success`) עם bypass | כן (אחרי שהפריסה מוכנה) | כן (מול הפריסה החדשה לפני פרומוט, כ-Deployment Check) | <https://vercel.com/docs/git/vercel-for-github#repository-dispatch-events>, <https://vercel.com/docs/deployment-checks> |
| site-watch כל 30 דקות | לא | cron | קיים; מוסיפים כותרת ניטור |
| תיוג release + CHANGELOG | לא | כן (release-please) | צד ג' (גוגל); אופציונלי |
| Dependabot (npm שבועי מקובץ, github-actions שבועי) | PRs אוטומטיים | | <https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file> |

### 7.2 אבטחת workflows

**מה התיעוד אומר.** `permissions` מינימליים ל-`GITHUB_TOKEN`; נעילת actions לקומיט SHA מלא (או lockfile של workflows כשזמין); לא לשמור סודות כ-JSON; `::add-mask::`. מקור: <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions>.

**התקן שלנו.** `permissions: contents: read` כברירת מחדל; הרחבה רק ב-job שצריך (`statuses: write` לדיווח Deployment Check, `issues: write` ל-site-watch). כל action צד ג' ננעל ל-SHA עם הערת גרסה; Dependabot `github-actions` מעדכן.

### 7.3 `ci.yml` המוצע (לא הוחל)

הערות: Node 24 כדי להתאים ל-`nodeVersion: 24.x` של הפרויקט ב-Vercel (ולקבע `"engines": {"node": "24.x"}` ב-`package.json`), או להוריד את Vercel ל-22; לא להשאיר שתי גרסאות. ה-SHA של ה-actions מסומנים `<sha>` ויש להחליפם בעת ההחלה. ה-job `ci-ok` הוא ה-status check היחיד שנדרש ב-ruleset.

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "24"

jobs:
  verify:
    name: verify
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - name: Typecheck
        run: npx tsc --noEmit -p tsconfig.app.json
      - name: Lint
        run: npx eslint .
      - name: Unit tests
        run: npx vitest run
      - name: Cache Playwright browsers
        uses: actions/cache@<sha> # v4
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - name: Install Chromium for prerender
        run: npx playwright install --with-deps chromium
      - name: Build with strict prerender
        run: npm run build:seo
        env:
          PRERENDER_STRICT: "1"
          VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_SUPABASE_PROJECT_ID: ${{ vars.VITE_SUPABASE_PROJECT_ID }}
      - name: AEO check
        run: npm run check:aeo
      - name: Bundle budget
        run: npm run size:check
      - name: Assert no dpl-less chunk refs when skew enabled (phase 2)
        if: ${{ vars.SKEW_PROTECTION == '1' }}
        run: grep -q "dpl=" dist/index.html

  database:
    name: database
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: supabase/setup-cli@<sha> # v1
        with:
          version: "<pinned-cli-version>"
      - name: Start local Postgres only
        run: supabase db start
      - name: Replay migrations from scratch
        run: supabase db reset
      - name: pgTAP
        run: supabase test db
      - name: Lint SQL
        run: supabase db lint --level warning --fail-on error
      - name: Migration file naming
        run: |
          bad=$(ls supabase/migrations | grep -Ev '^[0-9]{14}_[a-z0-9_]+\.sql$' || true)
          [ -z "$bad" ] || { echo "bad migration names: $bad"; exit 1; }
      - name: Generated types drift
        run: |
          supabase gen types typescript --local --schema public,api > /tmp/types.generated.ts
          diff -u src/integrations/supabase/types.generated.ts /tmp/types.generated.ts

  supply-chain:
    name: supply-chain
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<sha> # v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci --ignore-scripts
      - name: Audit production dependencies
        run: npm audit --omit=dev --audit-level=high
      - name: Secret scan
        uses: gitleaks/gitleaks-action@<sha> # v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  ci-ok:
    name: ci-ok
    if: always()
    needs: [verify, database, supply-chain]
    runs-on: ubuntu-latest
    steps:
      - run: |
          test "${{ needs.verify.result }}" = success
          test "${{ needs.database.result }}" = success
          test "${{ needs.supply-chain.result }}" = success
```

**לא אומת**: ש-`supabase db start` (DB בלבד) מספיק ל-`supabase test db` ו-`supabase gen types --local` בלי `supabase start` מלא; תיעוד Supabase מציג `supabase db start` + `supabase test db` ב-workflow הדוגמה (<https://supabase.com/docs/guides/cli/github-action/testing>), אך `supabase test db` בעמוד ה-CLI דורש "local development stack started by running supabase start". לבדוק בריצה הראשונה; אם נכשל, לעבור ל-`supabase start -x <שירותים לא נדרשים>` כמו ב-`ci.proposed.yml`.

### 7.4 `preview-smoke.yml` המוצע (smoke מול URL הפריסה + Deployment Check)

```yaml
name: Preview smoke

on:
  repository_dispatch:
    types: ["vercel.deployment.success"]

permissions:
  contents: read
  statuses: write

jobs:
  smoke:
    name: "Vercel - seeld: smoke"
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      BASE_URL: ${{ github.event.client_payload.url }}
      VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
      SEELD_MONITOR_TOKEN: ${{ secrets.SEELD_MONITOR_TOKEN }}
    steps:
      - uses: actions/checkout@<sha> # v4
        with:
          ref: ${{ github.event.client_payload.git.sha }}
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: "24"
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Health (read-only)
        run: node scripts/health-check.mjs "$BASE_URL"
      - name: Browser smoke
        run: node scripts/smoke.mjs "$BASE_URL"
      - name: Report to Vercel Deployment Checks
        if: always()
        uses: vercel/repository-dispatch/actions/status@<sha> # v1
        with:
          name: "Vercel - seeld: smoke"
```

הערות: הסקריפטים חייבים לשלוח `x-vercel-protection-bypass` (לפריסות מוגנות) ו-`x-seeld-monitor` (ל-WAF) כשהמשתנים קיימים. השדה המדויק של ה-SHA ב-`client_payload` **לא אומת** (העמוד מתעד `client_payload.url`; את שאר השדות לקרוא מהתיעוד או מריצה ראשונה). ה-workflow חייב להיות על `main` כדי ש-`repository_dispatch` יפעיל אותו.

### 7.5 הגנות ריפו, Dependabot, סודות

**מה התיעוד אומר.** Rulesets זמינים חינם בריפו ציבורי; בריפו פרטי דורשים GitHub Pro/Team. כללים: Require a pull request before merging, Require status checks to pass (עם בחירת האפליקציה המדווחת), Require linear history, Block force pushes, Restrict deletions, Require signed commits. Push protection ברמת ריפו דורש GitHub Secret Protection. GitHub Actions: ריפו ציבורי = runners סטנדרטיים חינם; פרטי = $12 compute כלול ב-Free (Linux 2-core $0.006 לדקה ≈ 2,000 דקות). מקור: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets>, <https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection>, <https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions>.

**התקן שלנו.**
- Ruleset על `main`: PR חובה (אפשר 0 מאשרים כשיש מפתח יחיד, אך דרוש `ci-ok`), required status check `ci-ok`, linear history, block force push, restrict deletions. **לא אומת**: אם הריפו פרטי ובחשבון Free, rulesets לא זמינים ואז משתמשים ב-Branch protection הקלאסי או משדרגים.
- Dependabot:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly, day: sunday, time: "06:00", timezone: Asia/Jerusalem }
    open-pull-requests-limit: 5
    cooldown: { default-days: 7, semver-major-days: 21 }
    groups:
      radix: { patterns: ["@radix-ui/*"] }
      dev-tooling: { dependency-type: development, update-types: [minor, patch] }
      prod-minor-patch: { dependency-type: production, update-types: [minor, patch] }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

- סודות: gitleaks ב-CI (7.3) + הפעלת Push Protection אם הריפו ציבורי (חינם) או כשיש רישיון Secret Protection. `.env*` ב-`.gitignore` (לוודא).
- Conventional commits: בדיקת כותרת PR (action צד ג' `amannn/action-semantic-pull-request`, SHA-pinned) ו-release-please לתיוג `v*` ו-CHANGELOG. אופציונלי; הערך העיקרי: תיוג שמקל על רולבק לפי גרסה.

### 7.6 תקציב זמן ועלות CI

הערכה (לא נמדדה): `verify` 9–12 דקות (Chromium ~1 דקה עם cache, prerender 90 נתיבים 3–5 דקות), `database` 4–6 דקות, `supply-chain` ~2 דקות, במקביל; סה"כ ~18 דקות-runner ל-push. בריפו פרטי ב-Free: ~2,000 דקות = ~110 pushes בחודש לפני חיוב; בריפו ציבורי חינם. `concurrency: cancel-in-progress` חוסך ריצות על pushes רצופים.

---

## 8. Runbooks

### 8.1 פריסה רגילה
1. PR → `ci-ok` ירוק → preview (נוצר רק עם PR) → smoke ירוק על ה-preview.
2. Squash-merge ל-`main` (linear history).
3. Vercel בונה פרודקשן; Deployment Checks (native typecheck/lint + smoke) חייבים לעבור לפני שהדומיין עובר.
4. אימות: `npm run health -- https://seeld.co.il`, `curl -I https://seeld.co.il/` (`x-vercel-cache`), Observability: 5xx ב-15 הדקות הראשונות.
5. אסור: `vercel deploy --prod`, `create_deployment`, Promote ידני של preview (בונה מחדש).

### 8.2 רולבק
1. לוח → Deployments → סינון `main` → ⋮ → Instant Rollback לפריסה האחרונה שהייתה תקינה (או `vercel rollback <url>`).
2. `vercel rollback status`; `npm run health`; `vercel logs requests --environment production --query 'httpStatus >= 500' --since 5m`.
3. לזכור: משתני סביבה שהשתנו מאז לא חלים על הפריסה המשוחזרת. הפריסה הבאה מ-`main` תחליף שוב, לכן תיקון/revert ב-`main` לפני push.
4. ביטול רולבק: `vercel promote <url>`.

### 8.3 הקפאה (freeze) בחירום
- מתג מהיר ללא פריסה: Settings → Git → Ignored Build Step → פקודה `exit 0` (כל build מדולג; ההגדרה בלוח דורסת רק אם אין `ignoreCommand` ב-`vercel.json`; **לא אומת** מי גובר כשיש שניהם, לכן בחירום מעדיפים ruleset שנועל את `main` ב-GitHub + מחיקת Deploy Hook זמנית).
- נעילת `main`: Ruleset → Restrict updates (רק bypass list).
- מתקפה: `vercel firewall attack-mode enable --duration 6h --yes`.
- לא: `pause project` (מחזיר שגיאה לגולשים), לא `git.deploymentEnabled: false` (דורש פריסה כדי להיכנס לתוקף).

### 8.4 תקלת chunk / cache
1. סימן: `health` מדווח `asset ... content-type` או HTML במקום JS; Observability: `/assets/*` עם 404.
2. `vercel cache purge --type cdn --yes` (לפרויקט), בדיקה חוזרת.
3. אם נמשך: רולבק (8.2).
4. אחרי האירוע: לוודא שאין מסלול פריסה שני (`gh run list --workflow deploy-vercel.yml`), ולקדם את Skew Protection (2.8).

### 8.5 Hotfix
1. ענף `hotfix/<topic>` מ-`main`, PR, `ci-ok`, מיזוג. אין קיצור דרך דרך CLI.
2. אם CI איטי מדי: `workflow_dispatch` של `verify` בלבד אינו מחליף `ci-ok`; במקום זה, Instant Rollback מיידי ואז hotfix רגיל.

### 8.6 תחזוקה חודשית (יום ראשון ראשון בחודש)
- מיזוג PRs של Dependabot אחרי `ci-ok`; `npm audit`.
- Supabase Advisors (אבטחה/ביצועים) ולוגים; `supabase db lint` מול linked (`--remote`) באישור הבעלים.
- `vercel security check --findings`; סקירת Firewall traffic (`vercel firewall overview`), כללים ב-Log שאפשר להעלות ל-Challenge/Deny.
- Speed Insights/CWV p75 מול היעדים (4.2); `size:check` baseline מעודכן בכוונה בלבד.
- `vercel env ls` לכל סביבה; סיבוב `SEELD_MONITOR_TOKEN` רבעוני.
- בדיקת תעודות (`vercel certs ls`), DMARC reports של `seeld.info`.
- עדכון מסמך זה אם התיעוד השתנה (לבדוק תאריכי "Last updated" של העמודים המצוטטים).

### 8.7 צ'קליסט אירוע
1. לשרת תחילה: רולבק או Attack Mode (לפי סוג).
2. לפתוח/לעדכן issue `site-watch failure` עם זמן, סימפטום, פעולה.
3. ראיות: `vercel logs requests --since 1h --json`, `x-vercel-id` מתגובה שגויה, צילום Observability.
4. להודיע לבעלים לפי טבלת `RUNBOOK.md` סעיף 7.
5. סיום: סיבה שורש, תיקון בענף, בדיקה חדשה ב-`health-check.mjs` אם היתה מונעת.

---

## 9. עלויות (Pro)

**מה התיעוד אומר.** Pro: מושב אחד כלול ו-$20 לחודש לכל מושב נוסף; $20 קרדיט שימוש חודשי; Flat Rate CDN: הדרגה הנמוכה כלולה (1M בקשות CDN ו-1TB העברה בחודש); on-demand: Fast Data Transfer $0.15/GB, CDN Requests $2 ל-1M, CDN Request CPU שעה כלולה ואז $0.30 לשעה; Functions (Fluid) לפי Active CPU/Provisioned Memory/Invocations במחיר אזורי; Image transformations $0.05–$0.0812 ל-1K; Web Analytics $0.03 ל-1K אירועים; Speed Insights חינם (10K/30 יום) או Plus $10 לפרויקט + $0.65 ל-10K; Observability Plus $1.20 ל-1M אירועים; Drains $0.50/GB; Rate limiting $0.50 ל-1M בקשות שהותרו; Password Protection $20 לפרויקט; Attack Mode, DDoS, custom rules, IP blocking: חינם. מקור: <https://vercel.com/docs/plans/pro>, <https://vercel.com/docs/pricing>, <https://vercel.com/docs/functions/usage-and-pricing>, <https://vercel.com/docs/image-optimization/limits-and-pricing>, <https://vercel.com/docs/analytics/limits-and-pricing>, <https://vercel.com/docs/speed-insights/limits-and-pricing>, <https://vercel.com/docs/observability/observability-plus#pricing>, <https://vercel.com/docs/drains#usage-and-pricing>, <https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing>.

**הערכה לתעבורה שלנו** (הנחות: 50K צפיות עמוד בחודש, ~20 בקשות לעמוד, 1.5MB לעמוד ראשון ו-0.3MB בניווט פנימי; **לא נמדד**):

| רכיב | אומדן חודשי | הערה |
|---|---|---|
| CDN requests | ~1M | בתוך Flat Rate הכלול; מעבר: $2 ל-1M |
| Fast Data Transfer | ~30–50GB | הרבה מתחת ל-1TB |
| Functions `/api/*` | אלפי invocations (cache שעה ב-CDN) | סנטים; Active CPU של proxy ≈ אפסי |
| Image transformations | ~2–5K (רוב ההיטים מה-cache) | ≤ $0.50 |
| Web Analytics | 50K אירועים | $1.50 |
| Speed Insights | חינם (עד 10K) | דגימה; Plus רק אם נדרש |
| Observability Plus | ~1M אירועים | ~$1.20 |
| Firewall | 0 | rate limiting: $0.50 ל-1M מותרות על `/api` בלבד ≈ סנטים |
| סה"כ מעבר למושבים | ≈ $3–5, בתוך קרדיט ה-$20 | |

מסקנה: העלות השולית של כל התצפית והאבטחה המוצעת נבלעת בקרדיט. התוספות היחידות שעולות כסף קבוע ואינן מומלצות כעת: Password Protection ($20), Speed Insights Plus ($10), Web Analytics Plus ($10).

---

## 10. Top 15 החלטות ל-SEELD

1. **מסלול פריסה יחיד**: אינטגרציית Git של Vercel בלבד; `deploy-vercel.yml` נמחק/מנוטרל (באישור הבעלים). איסור על `vercel deploy --prod`/`create_deployment`.
2. **קנוני**: `https://seeld.co.il`, `trailingSlash: false`, `www` ו-`seeld.vercel.app` מופנים ב-308.
3. **`regions: ["fra1"]`** לפרויקט, לצד Supabase ב-`eu-central-1`.
4. **מעבר מ-Edge ל-Node.js (Fluid)** בפונקציות `/api`, `maxDuration: 10`; ההמלצה הרשמית של Vercel.
5. **Cache**: `/assets` immutable, HTML ברירת מחדל (`max-age=0, must-revalidate`), API בקוד בלבד, קבצים לא-מגובבים עם `max-age` קצר + SWR. אין כלל גלובלי ל-`/api`.
6. **Skew Protection** (Phase 2) עם `?dpl=` דרך `renderBuiltUrl`, Maximum Age 7 ימים, retention פרודקשן 90 יום. הסוף המבני לתקלת ה-chunk.
7. **CSP** מחמיר בשני שלבים: ניקוי (ללא `ipapi.co`/Google Fonts) ואז hash לסקריפט ה-inline במקום `'unsafe-inline'`; Report-Only לפני אכיפה.
8. **HSTS preload** נשאר, הגשה לרשימה רק אחרי ש-`www` וכל תת-דומיין עתידי ב-HTTPS.
9. **Previews רק ל-PR** (`ignoreCommand`), Standard Protection נשאר, Protection Bypass לאוטומציה.
10. **ניטור מאומת**: כותרת `x-seeld-monitor` + כלל WAF `bypass`; לא UA, לא IP.
11. **WAF**: deny לנתיבים רגישים, rate limit על `/api`, Bot Protection ב-Log ואז Challenge, AI Assistants נשארים Allow (AEO).
12. **תצפית**: Web Analytics + Speed Insights חינמי + Observability Plus (כבר כלול בצוותי Pro חדשים). Sentry רק כ-`BrowserClient` מינימלי ב-`import()` מושהה.
13. **פונטים עצמיים woff2** עם preload ו-`size-adjust`; Google Fonts יוצא מה-CSP.
14. **תמונות דרך `/_vercel/image`** עם `images` ב-`vercel.json` (AVIF/WebP, `srcset`).
15. **CI**: Node 24 מיושר ל-Vercel, `ci-ok` כ-status check יחיד, job DB (מיגרציות מאפס + pgTAP + lint + drift), smoke מול preview כ-Deployment Check, Dependabot מקובץ, actions ננעלים ל-SHA.

---

## 11. Gotchas

1. **כותרות לפי נתיב חלות גם על 404.** `Cache-Control: immutable` על `/assets/(.*)` ייכנס לתגובת 404 כי 404 הוא סטטוס ניתן לקאשינג ב-Vercel. אין סייג לפי סטטוס ב-`vercel.json`. ההגנה מבנית (החלטות 1, 6).
2. **Promote של preview בונה מחדש** ולכן מייצר hashים חדשים; Instant Rollback לא.
3. **רולבק לא מעדכן משתני סביבה** שהשתנו אחרי הפריסה המשוחזרת.
4. **`seeld.vercel.app` אינו מקבל `noindex`** (רק URL פריסה ייחודי ו-previews מקבלים) ולכן חייב redirect.
5. **`framework: "nextjs"` בלוח מול `vite` ב-`vercel.json`**: `vercel.json` קובע לפריסה, אך הלוח מטעה; לתקן בלוח (פעולת בעלים).
6. **Node 22 ב-CI מול 24 ב-Vercel**: הבדל סמוי שיכול לייצר build ירוק ב-CI ושבור ב-Vercel או להפך.
7. **Redirects לדומיינים שאינם מחוברים לפרויקט לא עושים כלום.** 8 הכללים הנוכחיים רדומים.
8. **`routes` לא משתלב עם `rewrites`/`redirects`/`headers`** (לפי תיעוד `vercel.json`; **לא אומת בסבב זה**): חוקי WAF ב-`vercel.json` לא זמינים לנו; משתמשים בלוח/CLI.
9. **Challenge חוסם כל לקוח שאינו דפדפן**, כולל הניטור שלנו ו-`curl` של מפתחים; רק `bypass` או בוט מאומת עוברים.
10. **Bot Protection לא עובד מאחורי reverse proxy**; לא לשים Cloudflare לפני Vercel.
11. **Skew Protection לא נועל ניווט מסמך מלא**: refresh תמיד מקבל את הפריסה החדשה; זה רצוי. פריסה שנמחקה (retention) אינה נגישה; לכן retention פרודקשן ארוך מ-Maximum Age.
12. **Deploy Hooks לא פועלים** אם `github.enabled=false` (מתועד). **לא אומת** האם גם `git.deploymentEnabled: false` מנטרל אותם; אנחנו לא מכבים אף אחד מהשניים, כך שהשאלה תיאורטית.
13. **Secret ≥ 32 תווים מוסתר בלוגי build; קצר יותר לא.** `SEELD_MONITOR_TOKEN` חייב להיות ארוך מ-32.
14. **`repository_dispatch` מפעיל workflow רק אם הקובץ קיים על `main`**; לבדיקה לפני מיזוג מוסיפים `workflow_dispatch`.
15. **Standard Protection מגן גם על URL הפרודקשן הגנרי** (`seeld-<hash>-....vercel.app`): כל בדיקה ישירה מולו דורשת bypass; מול `seeld.co.il` לא.
16. **Password Protection עולה $20 לחודש לפרויקט** ואין בו צורך.
17. **Image Optimization לא מטפל ב-SVG** (ו-`dangerouslyAllowSVG` נשאר `false`); SVG מוגש ישירות.
18. **Rate limit נספר לפי אזור**; לקוח שמגיע דרך שני אזורים יכול לחרוג מהסף הכפול. לא קריטי לנו.
19. **`includeSubDomains` ב-HSTS הוא בלתי הפיך בפועל** אחרי preload: כל תת-דומיין עתידי חייב HTTPS, כולל פנימיים.
20. **Playwright ב-CI**: בלי cache, `playwright install --with-deps chromium` מוסיף דקה+ לכל ריצה.

---

## 12. מקורות (רשימה מרוכזת)

Vercel
- <https://vercel.com/docs/project-configuration/vercel-json>
- <https://vercel.com/docs/project-configuration/git-configuration>
- <https://vercel.com/docs/project-configuration/git-settings>
- <https://vercel.com/docs/routing/rewrites> · <https://vercel.com/docs/routing/redirects>
- <https://vercel.com/docs/frameworks/frontend/vite>
- <https://vercel.com/docs/caching/cdn-cache> · <https://vercel.com/docs/caching/cache-control-headers> · <https://vercel.com/docs/caching/cdn-cache/purge> · <https://vercel.com/docs/caching/cache-status> · <https://vercel.com/docs/cli/cache>
- <https://vercel.com/docs/headers/response-headers>
- <https://vercel.com/docs/functions/runtimes/edge> · <https://vercel.com/docs/functions/configuring-functions/region> · <https://vercel.com/docs/functions/configuring-functions/duration> · <https://vercel.com/docs/functions/usage-and-pricing> · <https://vercel.com/docs/fluid-compute>
- <https://vercel.com/docs/regions> · <https://vercel.com/docs/edge-network/compression>
- <https://vercel.com/docs/image-optimization> · <https://vercel.com/docs/image-optimization/limits-and-pricing>
- <https://vercel.com/docs/environment-variables> · <https://vercel.com/docs/environment-variables/sensitive-environment-variables> · <https://vercel.com/docs/environment-variables/system-environment-variables> · <https://vercel.com/docs/environment-variables/manage-across-environments>
- <https://vercel.com/docs/deployments/environments> · <https://vercel.com/docs/git/vercel-for-github> · <https://vercel.com/docs/builds/configure-a-build>
- <https://vercel.com/docs/deployment-protection> · <https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation> · <https://vercel.com/docs/deployment-protection/automated-agent-access> · <https://vercel.com/docs/cli/curl> · <https://vercel.com/docs/cli/project>
- <https://vercel.com/docs/deploy-hooks> · <https://vercel.com/docs/instant-rollback> · <https://vercel.com/docs/deployments/rollback-production-deployment> · <https://vercel.com/docs/deployments/promote-preview-to-production> · <https://vercel.com/docs/cli/rollback>
- <https://vercel.com/docs/deployment-retention> · <https://vercel.com/docs/skew-protection> · <https://vercel.com/docs/rolling-releases>
- <https://vercel.com/docs/deployment-checks> · <https://vercel.com/docs/checks/checks-api>
- <https://vercel.com/docs/vercel-firewall> · <https://vercel.com/docs/vercel-firewall/firewall-concepts> · <https://vercel.com/docs/vercel-firewall/ddos-mitigation> · <https://vercel.com/docs/vercel-firewall/vercel-waf/attack-challenge-mode> · <https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules> · <https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting> · <https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets> · <https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing> · <https://vercel.com/docs/bot-management> · <https://vercel.com/docs/botid> · <https://vercel.com/docs/cli/firewall> · <https://vercel.com/docs/security/security-dashboard>
- <https://vercel.com/docs/drains> · <https://vercel.com/docs/audit-log> · <https://vercel.com/docs/logs/runtime> · <https://vercel.com/docs/observability> · <https://vercel.com/docs/observability/observability-plus>
- <https://vercel.com/docs/analytics/limits-and-pricing> · <https://vercel.com/docs/analytics/quickstart> · <https://vercel.com/docs/analytics/redacting-sensitive-data> · <https://vercel.com/docs/speed-insights/limits-and-pricing> · <https://vercel.com/docs/speed-insights/quickstart>
- <https://vercel.com/docs/domains/working-with-domains/add-a-domain> · <https://vercel.com/docs/domains/set-up-custom-domain> · <https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting> · <https://vercel.com/docs/domains/managing-dns-records>
- <https://vercel.com/docs/plans/pro> · <https://vercel.com/docs/pricing> · <https://vercel.com/docs/limits>
- <https://vercel.com/docs/ci> (Vercel CI, בטא, Turborepo; לא רלוונטי כעת)

GitHub
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets>
- <https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file>
- <https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection>
- <https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions>
- <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions>

Supabase
- <https://supabase.com/docs/guides/cli/github-action/testing> · <https://supabase.com/docs/guides/deployment/ci/generating-types> · <https://supabase.com/docs/reference/cli/supabase-db-lint> · <https://supabase.com/docs/reference/cli/supabase-test-db> · <https://supabase.com/docs/guides/database/extensions/pgtap>

Sentry
- <https://sentry.io/pricing/> · <https://docs.sentry.io/pricing/> · <https://docs.sentry.io/platforms/javascript/guides/react/> · <https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/> · <https://docs.sentry.io/platforms/javascript/install/loader/>

אחרים
- Resend: <https://resend.com/docs/dashboard/domains/introduction> · <https://resend.com/docs/dashboard/domains/custom-return-path> · <https://resend.com/docs/dashboard/domains/dmarc>
- web.dev: <https://web.dev/articles/vitals>
- HSTS preload: <https://hstspreload.org/>
- MDN CSP: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy>
- Vite: <https://vite.dev/guide/build.html#advanced-base-options>
