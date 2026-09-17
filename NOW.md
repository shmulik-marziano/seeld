# מצב · עודכן 17.9.2026

**המיתוג החדש באוויר** (ירוק עמוק על שנהב, Rubik, קיט איורים 1.1). `brand/seeld-green` מוזג ל-`main` ב-17.9 ופורסם ל-seeld.co.il. דרך חזרה: קידום הפריסה מ-22.8 ב-Vercel, או `git revert` של הטווח `1983c24..03017e2`.

**לוח התשואות החדש בענף `feature/returns-board`** (ממתין לאישור שמוליק למיזוג ל-`main`):
- נתונים: `cma_board` (מטריאליזד־ויו מעל `cma_funds`, מרוענן יומית 03:15 UTC + אחרי הסנכרון החודשי) + `cma_company_map`. המיגרציה `supabase/migrations/20260917100000_cma_board.sql` הוחלה בפרויקט `lvifatyksqizwcutfbqp`.
- שכבת API: `api/board.ts`, `api/company-map.ts` (edge, פרנקפורט, קאש שעה). ההוק: `src/hooks/useCmaBoard.ts` (נופל לשאילתה ישירה ב-`vite preview`).
- עמודים: `/return-tables` (מפת שוק לפי חברה + כרטיסי מוצר), `/return-tables/:product` (סלאגים: `pension`, `hishtalmut`, `gemel`, `gemel-invest`, `policies`, `child-savings`). סלאג לא מוכר מציג את הסקירה.
- רכיבים: `src/components/returns/` (BoardTable, TrackCard, ReturnChart, MarketMap).
- דוח מסירה: `docs/history/2026-09-17-returns-board.md`.

**מובייל ורמת גימור בענף `feature/mobile-craft`** (מעל לוח התשואות, ממתין לאישור): כפתורים צפים קומפקטיים בטלפון, תיקון גלישה ועימוד במסלולי השקעה, כרטיסי שירות קומפקטיים בבית, טקסט 14 פיקסל מינימום, יעדי מגע 44, איורי קיט במקום תמונות סטוק בבלוג, `api/geo.ts` במקום שירות מיקום חיצוני. כלי סקר: `scripts/mobile_audit.mjs`. דוח + תוכנית "צוות עיצוב": `docs/history/2026-09-17-mobile-and-craft.md`.

- הנעילה העיצובית: `STYLESEED.md`. הטוקנים: `src/lib/brand.ts`. הנכסים: `public/brand/`.
- דוח מסירה של המיתוג: `docs/history/2026-09-16-brand-rollout.md`.
- כלי בדיקה: `npm run brand:shots` (צילומי מסך), `npm run brand:axe` (נגישות), `npm run brand:measure` (ביצועים), `scripts/calc_snapshot.mjs` (השוואת תוצאות מחשבונים).
- חסר מחבילת המסירה: לוגו אנגלי, לוגו חד־צבעי, סמלים ואלמנטים כ־SVG מקוריים. שוחזרו מה־PDF (ראו הדוח).

**חוב הקשר:** `CLAUDE.md` 37KB. מועמד ראשון לפיצול.
