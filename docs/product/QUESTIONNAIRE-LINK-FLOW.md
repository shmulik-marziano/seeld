# שאלון ללקוח דרך קישור: תהליך והצעה לצד השרת

עודכן: 17.11.2026. זו **הצעה** בלבד. לא נערכו קבצי SQL (`supabase/proposed` ללא שינוי) ולא נשלח דבר לשרת.

## 1. מה נבנה בצד הלקוח (חוזים ומדומים)
- `RequestsAdapter` (סוכן): יצירת בקשה (שאלון, אסמכתת לקוח, תוקף), החזרת token, קוד חד־פעמי בן 6 ספרות וכתובת `/q/<token>`; רשימה, ביטול, שליחה חוזרת (קוד חדש).
- `ClientSessionAdapter` (לקוח): פתיחה עם token וקוד, המשך מהצעד האחרון שנשמר, שמירת צעד (`saveStep`).
- `SubmitAdapter.saveStep` נקרא אחרי כל מסך, עם מפתח אידמפוטנטיות דטרמיניסטי (שאלון, סשן, צעד, גיבוב התשובות), גרסת שאלון ושדה-שדה `source` ו-`rank: 4`.
- חיווי "נשמר" ו"ממשיכים מאיפה שעצרת".
- יישום מדומה בזיכרון: `MockRequestsAdapter`, `MockClientSessionAdapter` (נעילה אחרי 5 ניסיונות, תוקף, ביטול).
- גיליון "שליחת שאלון ללקוח" במסך הבית: בחירת שאלון, אסמכתה, תוקף, קישור וקוד, וקישורי עומק לוואטסאפ, SMS ודוא״ל, עם טלפון מחלקתי מתוך `src/lib/contacts.ts`. אין שמות, ואין פרטים אישיים בכתובת.
- מעטפת `/q/:token`: chunk עצל, `noindex, nofollow`, `Disallow: /q/` ב-robots.txt, לא ב-sitemap, בלי prerender, מציגה "בקרוב" אלא אם `?qmock=1` (פיתוח בלבד).

## 2. יישור לטבלה הקיימת `insform.requests`
עמודות: `id, agent_id, customer_id, customer_name, customer_phone, template_ids[], custom_questions, question_snapshot, token uuid, code_hash, status, is_test, expires_at, sent_at, opened_at, submitted_at, reviewed_at, created_at, updated_at`.
החוזה `QuestionnaireRequest` ממופה: `token`, `status`, `isTest`, `expiresAt`, `sentAt`, `openedAt`, `submittedAt`, `createdAt`. `customerRef` בצד הלקוח מקביל ל-`customer_id`. אין צורך ב-`customer_name`/`customer_phone` בקישור. `question_snapshot` מתאים לנעילת גרסת השאלון לבקשה.

## 3. חלקים חסרים בשרת (הצעה)
1. **RPC `open_questionnaire_request(p_token, p_code)`** (anon, security definer): בודק `code_hash` (bcrypt/argon, לא טקסט), `expires_at`, סטטוס (לא `revoked`/`submitted`), רושם `opened_at`, מחזיר רק: מפתח שאלון, גרסה, תשובות שנשמרו, צעד אחרון, תוקף. לעולם לא מחזיר פרטי לקוח.
2. **הגבלת קצב ונעילה:** מונה ניסיונות כושלים לבקשה ולכתובת IP (חלון, למשל 5 ניסיונות ל-15 דקות), נעילה אחרי חריגה עד קוד חדש, תגובה אחידה ל"קוד שגוי" ול"קישור לא קיים" (מניעת ניחוש).
3. **תוקף וביטול:** `expires_at` נאכף בשרת; פעולה `revoke_questionnaire_request(id)` לסוכן; `resend` יוצר קוד חדש ומבטל את הישן.
4. **המשך:** `save_questionnaire_step` הקיים (`06_event_queue.sql`) מקבל `p_customer_key`, וללקוח אנונימי נדרש הסשן שנפתח באמצעות הקוד, לא `auth.uid()`. הצעה: RPC עוטף `save_questionnaire_step_by_token(p_token, p_session, ...)` שמאמת את הבקשה ומעביר ל-`save_questionnaire_step`.
5. **גרסאות לכל צעד:** `version` ב-`questionnaire_drafts` מתקדם בכל שמירה. הלקוח שולח את הגרסה שראה, והשרת דוחה שמירה ישנה (`409`) כדי שלא נדרוס מכשיר אחר.
6. **אידמפוטנטיות:** `idempotency_begin('questionnaire.save', key, customer)` כבר קיים; המפתח שהלקוח מייצר דטרמיניסטי (שאלון + סשן + צעד + גיבוב).
7. **מידע בריאותי:** יש להחליט אם בכלל נשמרות תשובות בריאות בצד השרת לפני הסכמה משפטית. עד אז הבריאות נשארת בזיכרון הדפדפן בלבד, והשדה הנגזר `health_screening` (`all_clear` / `follow_up`) הוא המועמד היחיד לשמירה.
8. **ביקורת:** כל פתיחה, שמירה, ביטול ונעילה נרשמים ב-`audit_log` (בלי תוכן תשובות).
9. **הודעות:** שליחת SMS/וואטסאפ בפועל, לפי תבניות מאושרות. כרגע רק קישורי עומק.
10. **QR:** ייווצר בצד הלקוח אחרי אישור ספרייה.

## 4. סיכונים
- קוד בן 6 ספרות הוא חלש בלי הגבלת קצב: ההגבלה בסעיף 2 חובה לפני הפעלה.
- הקישור והקוד נשלחים בנפרד מומלץ, אבל בפועל לעיתים באותה הודעה. תוקף קצר (ברירת מחדל שבוע) ובקשה חד־פעמית מצמצמים נזק.
- בקשות `is_test` צריכות להישאר מופרדות מייצור.
