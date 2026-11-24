# שאלונים ומסמכים ללקוח (`/forms`): מסמך מוצר

תאריך: 23.11.2026. בקשת הבעלים: "מקום ייעודי שנוכל להפנות לקוחות למילוי שאלונים: הזמנת מידעים, שאלון פרטים אישיים ומסמכים,
שאלון בריאות, שאלון פיננסי, שאלון פיננסי מורחב, שאלון אפיון סיכון. וכרגע אתה מפעיל את כולם אחד אחרי השנייה, עם תוצאה אחורית
בדשבורד". הכול מאחורי מתגים, כבוי כברירת מחדל.

## 1. מה נבנה
| חלק | איפה | מה |
|---|---|---|
| העמוד הציבורי | `/forms` (`src/pages/forms/FormsHub.tsx`) | שש כרטיסיות בסדר של הבעלים, זמן משוער, מצב הלקוח (כשיש סשן בלשונית), כפתור התחלה. מופיע במפה, בתחתית האתר ("שאלונים ומסמכים") ובתפריט השירותים |
| מסע הלקוח | `/forms/:card` (`FormsFlow.tsx`, `steps.tsx`) | צעד זיהוי אחד לכל הסשן (שם, ת"ז, נייד, דוא"ל, תנאים, Turnstile), ואז שאלוני הכרטיסייה בזה אחר זה ב-`Runner` עם מתאם שרת: כל מסך נשמר, חזרה מאותו מקום, חתימה ושליחה, "ממשיכים לשאלון הבא". noindex |
| מסמכים | אחרי "פרטים אישיים" | צילום ת"ז, תלוש, דוח או מסמך אחר (PDF/JPG/PNG/HEIC עד 6 MB, עד 12 לסשן) לדלי הפרטי `client-docs` ולשורת `crm.documents` |
| אפיון סיכון | כרטיסיית `risk` | שאלון הסיכון הקיים (`RiskQuiz`), התוצאה נשמרת כשאלון `risk-profile` עם `derived.risk_level` |
| שרת | `supabase/functions/forms-intake` | `POST /start`, `GET /state`, `POST /step`, `POST /submit`, `POST /document`. אותו שלד של `poa-intake`: Origin, Turnstile, אסימון סשן ב-`x-forms-session` (רק ה-SHA-256 מגיע למסד), תקרות גוף, רשימת מפתחות מותרת לכל נתיב, שגיאה `{error, code}` בלי ערכים, לוגים בלי ערכים |
| מסד | `20261125090000_client_forms.sql` (נקרא קודם `20261123120000`; הוזז אחרי `20261124100000_client_area`, האחרונה שהוחלה, כדי ש-`migrate.yml` לא ייעצר על "out of order") | `crm.form_sessions`, `crm.form_submissions`, הרחבת `crm.documents`, `api.form_*`, `staff.form_submission_*`, `staff.client_doc_get` מורחב, pgTAP `14_client_forms` |
| לצוות | לשונית "שאלונים" ב-`/site-admin` (`src/pages/admin/FormsModule.tsx`) | טבלה עם סינון לפי סוג וסטטוס, חיפוש, מיון, מגירה עם התשובות לפי פרקים (`ResponseViewer`), תוצאות נגזרות, מסמכים (הורדה דרך `client-docs`), "סומן כטופל"; ולמטה מצב הזמנות המידעים (`staff.poa_session_list`: מנוע, שיגור). מחליפה את לשונית "שאלוני הצטרפות" הישנה שקראה מטוקיו |

## 2. מיפוי הכרטיסיות (`src/forms/catalog.ts`)
| # | כרטיסייה | מה רץ | הערות |
|---|---|---|---|
| 1 | הזמנת מידעים | אשף ייפויי הכוח (`/report/start/order?from=forms`) | לא חלק מהסשן; שורת פתיחה משלו (`PoaEntry` `forms`) |
| 2 | פרטים אישיים ומסמכים | `personal` + צעד מסמכים (`id_copy`, `payslip`, `statement`, `other`) | |
| 3 | שאלון בריאות | `health` | רגיש: אין מילוי מראש, התשובות נשמרות בשרת רק כש-`forms_health_enabled` דלוק; אחרת נשלחת רק תוצאת הסינון (`derived.health_screening`) והלקוח מוריד PDF לעצמו |
| 4 | שאלון פיננסי | `needs-assessment` (יחס לסיכון, תמונה פיננסית) | |
| 5 | שאלון פיננסי מורחב | `occupation-income` → `retirement-planning` → `savings-join` | שלושה שאלונים בזה אחר זה תחת כרטיסייה אחת |
| 6 | אפיון סיכון | `RiskQuiz` → `risk-profile` | בלי צעד חתימה (`signer.kind = none`) |

מצב כרטיסייה: "לא התחיל" / "בתהליך" (טיוטה או חלק מהשאלונים) / "נשלח" (כל שאלוני הכרטיסייה נשלחו). "ממשיכים לשאלון הבא" מציע את
הכרטיסייה הבאה בסדר שעדיין לא נשלחה (אף פעם לא את הזמנת המידעים).

## 3. מודל הנתונים
- `crm.form_sessions`: `token_hash` (sha256 בלבד), `identity_enc` (שם, ת"ז, נייד, דוא"ל, ip), `national_id_hmac`, `phone_hmac`, `phone_tail`, `status` open/expired/locked, `expires_at` (14 יום), `last_seen_at`, `last_error`.
- `crm.form_submissions`: שורה לכל (סשן, שאלון): `card_key`, `questionnaire_key`, `version`, `status` draft/submitted/reviewed, `answers_enc` (jsonb מוצפן; null לבריאות כשהמתג סגור, `answers_stored=false`), `derived` (בלי פרטים אישיים: סינון בריאותי, רמת סיכון), `step_key` + `draft_version` (חזרה מאותו מקום; שמירה ישנה נדחית `stale_draft`), `completion_pct`, `signer_enc` (שם, סוג, PNG, hash, ip, user-agent), `signed_at`, `submitted_at`, `reviewed_at/by`, `review_note_enc`, `pdf_document_id` (ריק: ה-PDF מרונדר בדפדפן; רינדור שרת הוא צעד המשך).
- `crm.documents`: `form_session_id` (בדיוק אחד מ-`session_id`/`form_session_id`), סוגים `id_copy|payslip|statement|other`, מקור `client`, נתיב `forms/{agency}/{session}/{kind}-{document}.{ext}`, `size_bytes`.
- RPC שירות (`service_role`): `api.form_config`, `form_session_start`, `form_session_get` (טיוטה חוזרת עם תשובותיה; שאלון שנשלח בלי תשובות), `form_step_save`, `form_submit` (אידמפוטנטי), `form_session_fail`, `form_document_add` (השורה קודם, המסד קובע את הנתיב), `form_document_stored`.
- RPC צוות (`authenticated`, מנהל + TOTP טרי, רישום גישה): `staff.form_submission_list(p_limit, p_offset, p_card, p_status)`, `staff.form_submission_get(p_id)` (מפענח לקריאה הזו), `staff.form_submission_set_status(p_id, p_status, p_note)`.
- הגבלות קצב: כתובת 20/שעה, זהות 10/שעה, כולם 60/שעה, 300/יום מכבה את `forms_enabled` ומרים התראה (כמו האשף); מצב 240/דקה לאסימון; צעדים 600/שעה לסשן; שליחות 30/שעה.
- ביקורת: טריגר `audit.log_change('no_values')` על שתי הטבלאות, `private.audit_action` על התחלה/שליחה/מסמכים/סטטוס, `private.log_access` על כל קריאת צוות.

## 4. מתגים
| מתג | ברירת מחדל | מה פותח |
|---|---|---|
| `ops.config forms_enabled` | `false` | כל ה-RPC של הלקוח (בלעדיו `/start` עונה `inactive`) |
| `ops.config forms_health_enabled` | `false` | שמירת תשובות שאלון הבריאות בשרת. סגור: רק תוצאת הסינון |
| `ops.config forms_turnstile_required` | `true` | Turnstile ב-`/start` |
| `VITE_FORMS_FLOW=on` (Vercel) | לא מוגדר | המסע בדפדפן; בלעדיו הכרטיסיות מציגות "בקרוב" והזמנת המידעים עובדת כרגיל |
| `VITE_FORMS_INTAKE_URL` | לא מוגדר | כתובת הפונקציה כשהיא לא של ה-backend של הבנייה (preview) |
| `VITE_FORMS_ADAPTER=mock` | לא מוגדר | פיתוח: מתאם בזיכרון, בלי שרת |

## 5. מה הסשן ההורה עושה אחרי המיזוג
1. להחיל את המיגרציה `20261125090000_client_forms.sql`: דרך `migrate.yml` (GitHub, ריצה יבשה ואז החלה, באישור הבעלים), או MCP `apply_migration` ואז יישור הגרסה ב-`schema_migrations` ל-`20261125090000`.
2. לפרוס `forms-intake` (`npx supabase functions deploy forms-intake --project-ref qxhpolktdfgcbxtfxgov --use-api --yes`). אין סודות חדשים: משתמשת ב-`SEELD_SECRET_KEY`/`SUPABASE_SECRET_KEYS`, `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS`.
3. Vercel: `VITE_FORMS_FLOW=on` (ייצור), ואז `update ops.config set value='true' where key='forms_enabled'` עם שורת ביקורת.
4. הרצת בדיקה עם נתוני דמה: זיהוי → שאלון פיננסי → בריאות (לוודא ש-`answers_stored=false`) → מסמך → לשונית הצוות.
5. החלטות בעלים (OWNER-STEPS 6.23): האם לשמור תשובות בריאות בשרת (`forms_health_enabled`), חלון שמירה לסשנים ולשאלונים שלא נשלחו, ורינדור PDF בשרת.

## 6. בדיקות
- vitest: `forms-catalog` (מיפוי מול הרישום, סטטוסים), `forms-api` (מתאם HTTP: אסימון בכותרת בלבד, קודים, סשן שפג; מתאם ה-Runner: סריאליזציה של גרסאות טיוטה, חותם, בריאות בלי תשובות), `forms-pages` (hub, זרימה: זיהוי → שאלון).
- Deno: `supabase/functions/forms-intake/test.ts` (נתיבים, ולידציה, Turnstile, מתג, מצב, צעד, שליחה, מסמך, קודים).
- pgTAP: `supabase/tests/14_client_forms.test.sql`; `00_policy_lint` מעודכן (52 RPC שירות, 22 רשומות צוות).

## 7. פתוח
- רינדור PDF בשרת (`pdf_document_id` ריק; הלקוח מוריד את העותק החתום בדפדפן, הצוות רואה את התשובות במגירה).
- תפריט שירותים בכותרת: אין תפריט כזה בכותרת היום; הקישור נוסף לתחתית האתר (`SERVICE_LINKS`).
- `HEALTH_PRIVACY_NOTE` ("לא נשלח לשום מקום בשלב זה") נכון כל עוד `forms_health_enabled` סגור; הדלקה דורשת עדכון נוסח.
- שמירה ומחיקה: הקוד לא מוחק דבר (כלל אי-המחיקה); חלון השמירה הוא החלטת בעלים.
