# ספר הפעלה: כשהאתר לא תקין

תאריך: 17.11.2026 · חל על האתר `seeld.co.il` (Vercel, פרויקט `seeld`) ועל Supabase `lvifatyksqizwcutfbqp`.

## 1. מתי זה רלוונטי
GitHub פתח או עדכן issue בשם **site-watch failure** (הבדיקה רצה כל 30 דקות), או שמישהו דיווח שהאתר לא נטען או נשבר.

## 2. אבחון ראשוני (5 דקות)
1. פתחו את ה-issue ואת הקישור ל-Actions run. שורות `FAIL` מראות מה נשבר.
2. אותה בדיקה מקומית: `npm run health -- https://seeld.co.il`
3. בדיקת דפדפן: `npm run smoke -- https://seeld.co.il`
4. התאמת הכשל:

| כשל | משמעות סבירה | פעולה |
|---|---|---|
| נתיב לא 200 | פריסה שבורה או rewrite | סעיף 3 (rollback) |
| אין h1 בעמוד | העמוד לא רונדר מראש (prerender נפל) | בדקו לוג build, rollback |
| `asset ... content-type` או גוף HTML במקום JS | **chunk ישן במטמון / פריסה חלקית**: הדף מפנה ל-chunk שלא קיים | סעיף 4 (purge) ואז rollback אם נמשך |
| sitemap / llms / robots | קובץ חסר בפריסה | rollback, בדיקת `public/` |
| TLS פחות מ-14 יום | חידוש תעודה לא התבצע | בדקו דומיין ב-Vercel (Domains), סעיף 5 |
| כשל חד-פעמי ואז תקין | תקלת רשת רגעית | לסגור את ה-issue עם הערה |

## 3. Rollback ב-Vercel
קודם מחזירים לשירות, אחר כך חוקרים.
1. Vercel Dashboard, פרויקט `seeld`, לשונית **Deployments**.
2. מצאו את הפריסה האחרונה שהייתה תקינה (Production, Ready, לפני התקלה).
3. תפריט `...` ליד הפריסה, **Promote to Production** (או **Instant Rollback**).
4. ודאו: `npm run health -- https://seeld.co.il` ו-`npm run smoke -- https://seeld.co.il`.
5. אל תמחקו פריסות. אל תעשו revert ב-git לפני שהאתר חזר.
6. אחרי ההחזרה: רשמו ב-issue מה הפריסה שהוחזרה ומה ה-commit הכושל. הפריסה הבאה מ-`main` תחליף שוב, לכן תקנו או עשו revert ב-main לפני דחיפה נוספת.

(אפשרות CLI: `vercel rollback` עם אסימון הצוות.)

## 4. Purge (ניקוי מטמון)
חשוד במטמון: chunk ישן, עמוד ישן אחרי פריסה.
1. Vercel Dashboard, פרויקט, **Settings, Caching** (או Data Cache) ופעולת **Purge CDN Cache** / **Invalidate**.
2. אם יש Cloudflare או CDN נוסף מול הדומיין: Purge Everything שם.
3. קבצי `/assets/*` הם immutable עם hash בשם, לכן chunk חסר פירושו בדרך כלל שדף HTML מהמטמון מצביע על פריסה אחרת. ניקוי HTML פותר.
4. בצד הלקוח האתר מתאושש אוטומטית מכשל טעינת chunk (`src/lib/chunkRecovery.ts`), אך הניטור עדיין יסמן כשל עד שהמטמון תקין.
5. אחרי purge: `npm run health` שוב. אם עדיין נכשל, rollback (סעיף 3).

## 5. תעודת TLS
Vercel מחדש אוטומטית. אם נותרו פחות מ-14 יום: Vercel, Domains, בדיקת רשומות DNS (A/CNAME) ו-`Valid Configuration`. אם הדומיין אצל ספק אחר, ודאו שרשומות DNS לא שונו.

## 6. תקלה בצד Supabase
סימנים: טפסים לא נשלחים, כניסה נכשלת, `smoke` מראה 5xx על Supabase.
1. Supabase Dashboard, **Logs** (API, Auth, Edge Functions) וסטטוס הפרויקט.
2. בדקו אם הפרויקט מושהה או חרג ממכסה.
3. אל תשנו סכמה, מפתחות או פונקציות כדי "לנסות". העבירו לבעלים.

## 7. את מי להודיע
| מצב | מודיעים |
|---|---|
| כל כשל שנמשך יותר מ-30 דקות | בעל האתר (שמוליק) |
| rollback בוצע | בעל האתר + שני הסוכנים (הודעה פנימית) |
| חשד לדליפת מידע, מפתח או גישה לא מורשית | בעל האתר מיד. לא לפרסם. לסובב מפתחות לפי בקשתו |
| תקלה בצד Vercel/Supabase שאינה בשליטתנו | בדקו status.vercel.com / status.supabase.com והודיעו לבעל האתר |

הערה: איש קשר לדוחק ומספר טלפון ימולאו כאן על ידי הבעלים (TODO).

## 8. סגירה
1. סגירת ה-issue עם: סיבה, פעולה, משך.
2. אם נמצאה סיבה שורש: תיקון בענף, CI ירוק, ופריסה רגילה.
3. אם בדיקה חסרה היתה מונעת את התקלה: להוסיף ל-`scripts/health-check.mjs` או ל-`smoke.mjs`.

## 9. פקודות שימושיות
```
npm run health -- https://seeld.co.il      בדיקת בריאות (קריאה בלבד)
npm run smoke -- https://seeld.co.il       בדיקת דפדפן
npm run size:check                         תקציב גודל חבילה (אחרי build:seo)
PRERENDER_STRICT=1 npm run build:seo       בנייה מלאה כמו בפרודקשן
```
