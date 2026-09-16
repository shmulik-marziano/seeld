# SEELD.CO.IL · אתר סוכנות הפיננסים והביטוח

**מצב: מיתוג מחדש בענף `brand/seeld-green` (ראו `NOW.md`).** לפני שינוי ויזואלי, קרא `STYLESEED.md`.

**סטק:** Vite · React · TypeScript · Tailwind · shadcn/ui · **npm** · Supabase · Vercel.
טסטים: Vitest + Playwright. יש `vercel.json`. דחיפה ל־`main` מפרסמת אוטומטית ל־seeld.co.il.

## מערכת העיצוב (ספטמבר 2026)
- הנעילה: `STYLESEED.md`. הטוקנים: `src/lib/brand.ts`. המחלקות: `src/index.css`.
- רכיבי מותג: `src/components/brand/` (Illustration, BrandIcon, Elements, SeeIDLogo).
- נכסים: `public/brand/` (לוגו, איורים ב־WebP בשלושה רוחבים, אלמנטים, manifest.json).
- כלי בדיקה: `npm run brand:shots <url> <dir> <routes…>` · `npm run brand:axe <url> <routes…>` · `npm run brand:measure <url> <routes…>`.
  בגיט־באש יש להריץ עם `MSYS_NO_PATHCONV=1` כדי שנתיבים כמו `/` לא ייהפכו לנתיבי מערכת.
- `design-kit/` · `design-systems/` · `tokens/` · `taste/` · `frameworks/` · `accessibility/` הם חומרי עזר מהתקופה הקודמת (DNA v3). המקור הקובע היום הוא `STYLESEED.md`.

## אזהרות
- יש `.env` בשורש (לא רק `.env.example`). **אל תקרא, אל תדפיס, אל תעלה לגיט.**
- **npm, לא Bun.** בנייה ב-Vercel מריצה `npm install` מול `package-lock.json`.
- 11 שגיאות TypeScript קיימות ב־`src/components/personal-area/*` (טיפוסי טבלאות Supabase). הן קדמו למיתוג ואינן חוסמות בנייה.

## קבצים עמוקים — פתח רק אם המשימה מחייבת
`CLAUDE.md` **37KB (~9,700 טוקנים — אל תפתח בלי סיבה מפורשת)** · `docs-internal/` · `docs/history/`
