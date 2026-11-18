# Supabase לפלטפורמת SEELD: מדריך עיון למעצב ולמיישמים (נובמבר 2026)

**מצב המסמך:** מחקר בלבד. לא בוצע שינוי בשום פרויקט Supabase, לא בוצע git ולא פריסה.
**מקור הידע:** תיעוד רשמי של Supabase (גרסאות הדפים כפי שנקראו ב-18.11.2026), עמוד התמחור הרשמי, ומסמכי הפלטפורמה הקיימים ברפו (`ARCHITECTURE.md`, `EVENT-ARCHITECTURE.md`, `OPEN-DECISIONS.md`, `config.proposed.toml`).
**קונבנציות:** כל טענה טכנית מלווה בקישור לתיעוד הרשמי. מה שלא נמצא לו אימות בתיעוד מסומן **לא אומת**. מזהים, פקודות וקוד באנגלית בתוך בלוקי קוד; הפרוזה בעברית.

**ההקשר שלנו (תזכורת):** אתר סוכנות ביטוח קטנה (Vite/React SPA ב-Vercel, מרונדר מראש). עוברים מפרויקט משותף ומבולגן בטוקיו (`ap-northeast-1`) לפרויקט Pro נקי ב-`eu-central-1` (פרנקפורט). נתונים חמים: אלפי שורות ועוד כ-40 אלף שורות קרנות שמתרעננות ב-cron. צרכים: קריאה ציבורית (בלוג, טבלאות קרנות/תשואות), קליטת לידים מגולשים אנונימיים, כניסת סוכנים (סיסמה + TOTP), פורטל לקוחות בהמשך (הזמנה בלבד, ת"ז + SMS OTP), Edge Functions (התראות לידים דרך Resend, צ'אט Gemini, webhook של Surense, worker לתור), משימות pg_cron, תורי pgmq, ואחסון מסמכי לקוחות בהמשך.

**איך לקרוא:** כל פרק בנוי מארבעה חלקים: *מה אומר התיעוד (2026)*, *למה זה חשוב לנו*, *ההחלטה/הסטנדרט שלנו*, *פקודות או קוד*. בסוף: 15 ההחלטות המרכזיות, רשימת מלכודות, ואינדקס מקורות.

---

## תוכן

1. [מבנה פרויקט עם Supabase CLI](#1-מבנה-פרויקט-עם-supabase-cli)
2. [עיצוב סכמה ל-Data API](#2-עיצוב-סכמה-ל-data-api)
3. [RLS](#3-rls)
4. [Auth](#4-auth)
5. [Edge Functions](#5-edge-functions)
6. [Storage](#6-storage)
7. [תורים ומשימות](#7-תורים-ומשימות-pgmq-pg_cron-pg_net)
8. [Realtime](#8-realtime)
9. [תפעול](#9-תפעול)
10. [בסיס אבטחה](#10-בסיס-אבטחה-checklist)
11. [מודל עלויות](#11-מודל-עלויות)
12. [מעבר מפרויקט ישן](#12-מעבר-מפרויקט-ישן-טוקיו--פרנקפורט)
13. [15 ההחלטות המרכזיות ל-SEELD](#13-15-ההחלטות-המרכזיות-ל-seeld)
14. [מלכודות (gotchas)](#14-מלכודות-gotchas)
15. [אינדקס מקורות](#15-אינדקס-מקורות)

---

## 1. מבנה פרויקט עם Supabase CLI

### 1.1 מה אומר התיעוד (2026)

**`config.toml`.** נוצר ב-`supabase init`, יושב ב-`supabase/config.toml`, ומנהל את כל הקונפיגורציה המקומית; שינויים דורשים `supabase stop && supabase start`. סודות נכתבים כ-`env(VAR_NAME)` ונקראים מקובץ `.env` בשורש הפרויקט שאסור להכניס ל-git. מקור: [Managing config and secrets](https://supabase.com/docs/guides/local-development/managing-config), [CLI config reference](https://supabase.com/docs/guides/local-development/cli/config).

ערכי ברירת מחדל שחשובים לנו (מתוך ה-reference):
- `api.schemas` = `["public", "storage", "graphql_public"]`; `public` ו-`storage` נכללים תמיד.
- `api.extra_search_path` = `["public", "extensions"]`.
- `api.max_rows` = `1000` (תקרת שורות לתשובה אחת מטבלה/view/פונקציה).
- `db.major_version` = `15` בברירת מחדל; חייב להיות זהה לגרסת הפרויקט המרוחק (`SHOW server_version;`).
- `db.seed.enabled` = `true`, `db.seed.sql_paths` = `["./seed.sql"]`.
- `auth.enable_signup` = `true`, `auth.jwt_expiry` = `3600` (מקסימום 604,800), `auth.enable_refresh_token_rotation` = `true`, `auth.refresh_token_reuse_interval` = `10`.
- `auth.email.otp_length` = `6` (6 עד 10), `auth.email.otp_expiry` = `3600`, `auth.email.enable_confirmations` = `false` מקומית (אבל `true` בפרויקט מנוהל).
- `auth.rate_limit.email_sent` = `2` לשעה (רק עם SMTP מותאם), `auth.rate_limit.sms_sent` = `30` לשעה, `auth.rate_limit.sign_in_sign_ups` = `30` ל-5 דקות לכתובת IP, `auth.rate_limit.token_verifications` = `30`, `auth.rate_limit.token_refresh` = `150`.
- `auth.hook.<hook_name>.enabled` / `.uri`; שמות ה-hook: `custom_access_token`, `send_sms`, `send_email`, `mfa_verification_attempt`, `password_verification_attempt`.
- `auth.mfa.totp.enroll_enabled` / `verify_enabled` = `false` מקומית; `auth.mfa.max_enrolled_factors` = `10`.
- `auth.sessions.timebox`, `auth.sessions.inactivity_timeout` (ערכים כמו `'50m'`, `'20h'`).
- `edge_runtime.policy` = `"oneshot"` (פיתוח) או `"per_worker"` (בדיקות עומס ומשימות רקע).
- `functions.<name>.verify_jwt` = `true`, `functions.<name>.import_map`, `.entrypoint`, `.enabled`.
- `storage.file_size_limit` = `"50MiB"`, `storage.buckets.<bucket>.public` / `.file_size_limit` / `.allowed_mime_types` / `.objects_path`.
- `remotes.<branch_name>.project_id` לקונפיגורציה פר-ענף קבוע.
- `experimental.pgdelta.enabled` (ברירת מחדל: מנוע `pg-delta` פעיל).
מקור לכל אלה: [CLI config reference](https://supabase.com/docs/guides/local-development/cli/config). **לא אומת:** המפתחות `auth.minimum_password_length`, `auth.password_requirements`, `auth.captcha.*`, `edge_runtime.deno_version` לא נמצאו ב-reference בעת הקריאה (ייתכן שהם קיימים ומתועדים במקום אחר; `deno_version = 2` מופיע בדוגמה רשמית ב-[MCP server with mcp-lite](https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite)).

**סכמה דקלרטיבית מול מיגרציות.** בסכמה דקלרטיבית מצהירים על *המצב הרצוי* בקבצי SQL תחת `supabase/schemas/`, והמיגרציות נוצרות אוטומטית ב-`supabase db schema declarative sync`, שמשווה את קבצי הסכמה **להיסטוריית המיגרציות** (לא למסד החי). שינויים שנעשו ישירות במסד לא נקלטים. מנוע ההשוואה הדיפולטי הוא `pg-delta` (פתוח, טוען כל מצב לתוך Postgres אמיתי וקורא מהקטלוג; מכסה גם comments, domains, roles, publication membership ו-`security_invoker` על views; תומך ב-Postgres 14 עד 18). המנוע הישן `migra` נשאר רק אם `[experimental.pgdelta] enabled = false`. מקור: [Declarative database schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas), [Diff engines](https://supabase.com/docs/guides/local-development/diff-engines).

מגבלות מתועדות של הגישה הדקלרטיבית ("Known caveats"): DML (`INSERT/UPDATE/DELETE`) לא נעקב לעולם, כולל שורות `storage.buckets`; הרשאות ברירת מחדל על אובייקטים חדשים; סכמות שמנוהלות על ידי Supabase; אובייקטים של הרחבות. יש לבדוק כל מיגרציה שנוצרה לפני commit. מקור: [Known caveats](https://supabase.com/docs/guides/local-development/declarative-database-schemas#known-caveats), [Known limitations of db diff](https://supabase.com/docs/guides/local-development/cli-workflows#known-limitations-of-db-diff).

אימוץ על פרויקט קיים: `supabase db schema declarative generate --remote` כותב קבצי SQL לכל אובייקט תחת `supabase/schemas/`; אחר כך `supabase db pull --declarative --remote` מרענן את העץ בלי ליצור מיגרציה. **חובה** שתהיה היסטוריית מיגרציות בסיס לפני ה-`sync` הראשון (`supabase db pull --remote` יוצר baseline), אחרת ה-`sync` הראשון ייצר את כל הסכמה כמיגרציה אחת שתיכשל ב-`db push` כי האובייקטים כבר קיימים. גרסאות CLI לפני 2.115.0 כתבו ל-`supabase/database`; מ-2.115.0 קוראים `supabase/schemas`. מקור: [Pulling in your production schema](https://supabase.com/docs/guides/local-development/declarative-database-schemas#pulling-in-your-production-schema).

**מיגרציות אימפרטיביות (הדרך המסורתית).** `supabase migration new <name>` יוצר `supabase/migrations/<timestamp>_<name>.sql`; `supabase db diff -f <name>` מייצר מיגרציה מהבדל בין המסד המקומי להיסטוריה; `supabase db reset` הורס את המסד המקומי, מריץ את כל המיגרציות ואז את ה-seed; `supabase db push --dry-run --remote` מציג מה יוחל; `supabase db push --remote` מחיל רק מיגרציות שעדיין לא נרשמו ב-`supabase_migrations.schema_migrations`. `--include-seed` לעולם לא בפרודקשן. מקור: [Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows), [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments).

**Seeds.** רצים בפעם הראשונה של `supabase start` ובכל `supabase db reset`, *אחרי* המיגרציות; רק הוספות נתונים, לא DDL. אפשר לפצל: `[db.seed] sql_paths = ['./seeds/*.sql']` (סדר לקסיקוגרפי, בסיס הנתיב הוא `supabase/`). מקור: [Seeding your database](https://supabase.com/docs/guides/local-development/seeding-your-database).

**פיתוח מקומי.** `supabase start` מעלה את כל הסטאק ב-Docker; `supabase status` מציג URL מקומי (`http://127.0.0.1:54321`), מפתח `sb_publishable_...` מקומי, ו-Mailpit ב-`http://127.0.0.1:54324` שתופס כל מייל של Auth. הסטאק המקומי אינו מוקשח (אין TLS, אין rate limit, סיסמאות ברירת מחדל) ואסור לחשוף אותו החוצה. מקור: [Test auth flows](https://supabase.com/docs/guides/auth/testing-auth-flows), [Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows).

**יצירת טיפוסים.** `supabase gen types typescript --remote="$PROJECT_REF" --schema public > database.types.ts`; מקומית בלי `--remote`. אפשר לייצר לכמה סכמות (`--schema public --schema api`). עם סכמה שאינה `public` יש להעביר את שם הסכמה כ-generic שני: `createClient<Database, 'api'>(...)`; `supabase.schema('api').from(...)` מסיק לבד. מקור: [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types), [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas).

**Lint.** `supabase db lint` בודק את המסד המקומי (ברירת מחדל); `--remote` לפרויקט המקושר; דגלים: `--level warning|error`, `--fail-on none|warning|error`, `-s/--schema`. מקור: [Testing and linting](https://supabase.com/docs/guides/local-development/cli/testing-and-linting), [supabase db lint](https://supabase.com/docs/reference/cli/supabase-db-lint).

**pgTAP.** `supabase test new <name>` יוצר קובץ בדיקה; קבצי `*.sql` תחת `supabase/tests/` רצים ב-`supabase test db` עם pgTAP; הדפוס: `begin; select plan(n); ... select * from finish(); rollback;`. ב-CI: `supabase db start` ואז `supabase test db`. מקור: [Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview), [Testing Your Database](https://supabase.com/docs/guides/database/testing), [Automated testing using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/testing).

**Branching.** כל branch הוא סביבת Supabase נפרדת עם credentials משלה. **Preview branches** זמניים ונמחקים אוטומטית כשה-PR נסגר/ממוזג; **Persistent branches** (staging/QA/dev) לא נמחקים ולא מושהים. branch נוצר כשיבוט של פרויקט הבסיס (Edge Functions וקונפיגורציה) אבל **בלי נתונים ובלי אובייקטי Storage**; נתונים מגיעים מ-seed (או "Include data" ביצירה דרך ה-Dashboard). מיזוג מפעיל DAG של פריסה: Clone, Pull, Health, Configure, Migrate, Seed, Deploy. אפשרות **Deploy to production** באינטגרציית GitHub מחילה בפוש ל-`main`: מיגרציות חדשות, Edge Functions שמוצהרות ב-`config.toml`, ו-storage buckets שמוצהרים ב-`config.toml`; שאר הקונפיגורציה (API, Auth, seeds) **לא** נפרסת בברירת מחדל. ב-`config.toml` בלוק `[remotes.<name>]` עם `project_id` של ה-branch הקבוע מאפשר הגדרות פר-סביבה; סודות ל-branch נקבעים בנפרד לכל branch (`supabase secrets set --env-file`), ואפשר להשתמש ב-dotenvx ובערכי `encrypted:` בשדות סוד מוגדרים. מקור: [Branching](https://supabase.com/docs/guides/deployment/branching), [GitHub integration](https://supabase.com/docs/guides/deployment/branching/github-integration), [Configuration](https://supabase.com/docs/guides/deployment/branching/configuration).

עלות branching: אין תעריף קבוע; משלמים על שימוש (compute, disk, egress, storage) כמו בפרויקט רגיל; branch על Micro מתחיל ב-`$0.01344` לשעה (כ-10$ לחודש אם קבוע). **Compute Credits לא חלים על branching, ו-branching לא מכוסה ב-Spend Cap.** מקור: [Manage Branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching).

**קידום בין סביבות בלי Branching.** התיעוד מציע שני פרויקטים (staging, production) ו-GitHub Actions: `ci.yml` על PR (`supabase db start`, `supabase db diff --strict-coverage`, בדיקת שהטיפוסים המחוללים מחויבים), `staging.yml` על push ל-`develop` (`supabase link` + `supabase db push --yes --remote`), `production.yml` על push ל-`main`. דרוש Personal Access Token עם הרשאות Read על Project Settings, API Keys ו-API Key Secrets, וסודות `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`. מקור: [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments).

### 1.2 למה זה חשוב לנו

- הפרויקט בטוקיו סחף (drift) מהקוד: דגלי `verify_jwt` שונים ממה שפרוס, סכמות של מוצרים אחרים, 130 טבלאות עם RLS בלי policies (ראו `OPEN-DECISIONS.md` סעיף ה). בפרויקט החדש הסכמה חייבת להיות **קוד** ולא קליקים.
- אנחנו צוות קטן. דפוס "מיגרציה לכל שינוי" ידני יוצר הרבה קבצים קטנים; הדפוס הדקלרטיבי מרכז את ה-DDL במקום אחד, אבל לא מכסה נתונים (buckets, cron jobs, seeds של תפקידים).
- Branching קבוע עולה כ-10$ לחודש ל-Micro; preview לכל PR נוח אבל כל branch נולד בלי נתוני קרנות, כלומר צריך seed מייצג.

### 1.3 ההחלטה/הסטנדרט שלנו

1. **רפו אחד, תיקיית `supabase/` בשורש.** `config.toml` הוא מקור האמת לקונפיגורציה שניתן לקודד (API schemas, Auth, functions flags, buckets). ה-`config.proposed.toml` הקיים ב-`docs/platform/` הוא הטיוטה; הוא עובר ל-`supabase/config.toml` עם פתיחת הפרויקט החדש, עם ההשלמות מהמסמך הזה (ראו פרק 13).
2. **מודל היברידי:** DDL של הסכמות שלנו (`api`, `platform`, `private`) ב-`supabase/schemas/` עם `pg-delta`; ה-`sync` מייצר מיגרציות ל-`supabase/migrations/`. כל דבר שהוא *נתון* או שאינו נתמך בדקלרטיבי (buckets ב-`storage.buckets`, `cron.schedule`, הרשאות ברירת מחדל, seeds של `role_permissions`, `vault.create_secret`) נכתב במיגרציה ידנית אידמפוטנטית (`supabase migration new`).
3. **Baseline קודם:** בפרויקט החדש הריק מריצים את המיגרציות הראשונות דרך `db push`; רק אחר כך `declarative generate` כדי שהעץ והיסטוריה יהיו מיושרים (ההנחיה מהתיעוד: היסטוריה לפני `sync` ראשון).
4. **Seeds:** `supabase/seeds/*.sql` עם glob; seed מייצג של כמה מאות שורות קרנות (אנונימי ולא פרודקשן), תפקידים (`platform_user_roles`) ומשתמשי בדיקה שנוצרים דרך Admin API ב-script, לא ב-SQL ישיר ל-`auth.users` (שורה ב-`auth.users` בלי סיסמה אינה ניתנת לכניסה).
5. **Lint ובדיקות ב-CI:** `supabase db lint --level warning --fail-on error`, `supabase test db` (pgTAP ל-RLS), `supabase db diff --strict-coverage`, ובדיקת טיפוסים מחויבים. אין merge ל-`main` בלי ירוק.
6. **סביבות:** local (`supabase start`) לפיתוח יומי; **preview branches** דרך אינטגרציית GitHub לכל PR עם seed; **persistent branch `staging`** אחד (כ-10$ לחודש) שמקבל כל merge ל-`develop`; production = הפרויקט בפרנקפורט. "Deploy to production" של האינטגרציה מופעל, אבל זוכרים שהוא מפרס רק מיגרציות, פונקציות ו-buckets; קונפיגורציית Auth/API מוחלת ידנית או דרך Management API (ראו 4.3).
7. **טיפוסים:** `supabase gen types typescript --remote --schema api --schema platform > src/platform/db/types.gen.ts` ב-CI, ובדיקה שהקובץ מחויב.

### 1.4 פקודות או קוד

```bash
# פעם אחת
supabase init
supabase login
supabase link --project-ref <NEW_FRANKFURT_REF>

# פיתוח יומי
supabase start
supabase status                       # URL מקומי, sb_publishable_ מקומי, Mailpit
supabase db reset                     # מיגרציות + seeds מאפס
supabase db schema declarative sync   # schemas/ -> migrations/ (pg-delta)
supabase db push --dry-run --remote   # מה יוחל על הפרויקט המקושר
supabase db push --remote

# בדיקות ואיכות
supabase db lint --level warning --fail-on error
supabase test new agents_rls          # יוצר supabase/tests/agents_rls.test.sql
supabase test db
supabase db diff --strict-coverage    # נכשל אם pg-delta לא מכסה אובייקט

# טיפוסים
supabase gen types typescript --remote="$PROJECT_REF" --schema api --schema platform > src/platform/db/types.gen.ts

# branching (CLI, ניסיוני)
supabase --experimental branches create --persistent   # יוצר branch קבוע
supabase --experimental branches list                  # BRANCH PROJECT ID -> [remotes.staging].project_id
```

```toml
# supabase/config.toml (קטעים רלוונטיים; הערכים המלאים בפרק 13)
project_id = "seeld-site"

[api]
schemas = ["api"]
extra_search_path = ["extensions"]
max_rows = 200

[db]
major_version = 17

[db.seed]
enabled = true
sql_paths = ["./seeds/*.sql"]

[experimental.pgdelta]
enabled = true

[remotes.staging]
project_id = "<STAGING_BRANCH_PROJECT_ID>"

[remotes.staging.db.seed]
enabled = true
sql_paths = ["./seeds/*.sql", "./seeds-staging/*.sql"]
```

```yaml
# .github/workflows/db-ci.yml (מבוסס על Managing Environments + CI testing)
name: db-ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase db start
      - run: supabase db lint --level warning --fail-on error
      - run: supabase db diff --strict-coverage
      - run: supabase test db
      - run: |
          supabase gen types typescript --schema api --schema platform > src/platform/db/types.gen.ts
          git diff --ignore-space-at-eol --exit-code --quiet src/platform/db/types.gen.ts
```

---

## 2. עיצוב סכמה ל-Data API

### 2.1 מה אומר התיעוד (2026)

**שתי שכבות הרשאה.** Grants קובעים אילו תפקידי Postgres (`anon`, `authenticated`, `service_role`) מגיעים בכלל לטבלה/view/פונקציה דרך ה-Data API; RLS קובע אילו שורות. טבלה בלי grant מחזירה `42501` עם hint שמכיל את פקודת ה-`GRANT` המדויקת. מקור: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api).

**הרשאות ברירת מחדל ב-`public`.** בפרויקטים קיימים, כל אובייקט חדש ב-`public` מקבל אוטומטית: טבלאות: `select, insert, update, delete, truncate, references, trigger` (ו-`maintain` ב-PG17) ל-`anon`, `authenticated`, `service_role`; פונקציות: `execute`; sequences: `usage, select, update`. בהגדרות Data API יש מתג **Automatically expose new tables**; כיבויו מסיר את ההרשאות שה-Data API משתמש בהן, אבל משאיר `truncate/references/trigger/maintain` ו-`update` על sequences, ו-`execute` על פונקציות נשאר כי Postgres נותן אותו ל-`PUBLIC` גלובלית. Supabase מודיעה על שינוי ברירת המחדל הפלטפורמי לכיוון opt-in ([דיון 45329](https://github.com/orgs/supabase/discussions/45329)). מקור: [Default privileges](https://supabase.com/docs/guides/api/securing-your-api#default-privileges).

**ה-SQL המדויק להסרת ההרשאות האוטומטיות:**

```sql
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;

alter default privileges for role postgres
  revoke execute on functions from public;
```

אזהרה מהתיעוד: הפקודה האחרונה מגבילה גם פונקציות שה-`postgres` יוצר בסכמות אחרות, כולל פונקציות עזר של RLS; צריך `grant execute` מפורש לכל אחת לתפקידים שקוראים לה. בדיקה של מצב קיים: שאילתה על `pg_default_acl` (מופיעה בתיעוד). מקור: [Revoke default privileges](https://supabase.com/docs/guides/api/securing-your-api#revoke-default-privileges), [Check your default privileges](https://supabase.com/docs/guides/api/securing-your-api#check-your-default-privileges).

**סכמה ייעודית ל-API.** "A dedicated schema adds another boundary around your Data API. Objects in a schema such as `api` define the API surface. Internal tables and helper functions remain in schemas that aren't exposed." חשיפת סכמה: הוספה ל-**Exposed schemas** בהגדרות API (או `api.schemas` ב-`config.toml`), ואז grants: `GRANT USAGE ON SCHEMA`, ו-`GRANT ... ON ALL TABLES/ROUTINES/SEQUENCES` לפי צורך, ו-`ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA api ...`. בצד הלקוח: `createClient(url, key, { db: { schema: 'api' } })` או `supabase.schema('api').from(...)`. מקור: [Dedicated API schemas](https://supabase.com/docs/guides/api/securing-your-api#dedicated-api-schemas), [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas).

**Views.** Views נוצרים כברירת מחדל כ-`SECURITY DEFINER` (מדלגים על RLS של הטבלאות שמתחתיהם). ב-PG15+ מגדירים `create view ... with (security_invoker = true)`. פונקציות `security definer` לעולם לא בסכמה חשופה. מקור: [RLS: Views](https://supabase.com/docs/guides/database/postgres/row-level-security#views), [Use security definer functions](https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions).

**Lints רלוונטיים** (Security Advisor): `0010_security_definer_view` (ERROR), `0013_rls_disabled_in_public` (ERROR), `0014_extension_in_public` (WARN), `0016_materialized_view_in_api` (WARN), `0017_foreign_table_in_api`, `0023_sensitive_columns_exposed` (ERROR), `0026/0027_pg_graphql_*_table_exposed`, `0028/0029_*_security_definer_function_executable` (WARN), `0002_auth_users_exposed` (ERROR). מקור: [Advisors](https://supabase.com/docs/guides/observability/advisors).

**`max_rows`.** ברירת מחדל 1000; "Limits payload size for accidental or malicious requests". מקור: [CLI config: api.max_rows](https://supabase.com/docs/guides/local-development/cli/config#api.max_rows).

**Pre-request.** אפשר להגדיר פונקציה שרצה לפני כל בקשה (`alter role authenticator set pgrst.db_pre_request = 'public.check_request'`) ולקרוא `request.method`, `request.path`, `request.headers`, `request.jwt` דרך `current_setting()`; שימושי לחסימת IP/כותרות. מקור: [Pre-request checks](https://supabase.com/docs/guides/api/securing-your-api#pre-request-checks).

**ביצועים של שאילתות API.** `explain()` על שאילתת supabase-js מחזיר plan (מכובה כברירת מחדל; `alter role authenticator set pgrst.db_plan_enabled to 'true'; notify pgrst, 'reload config';`; בפרודקשן רק עם הגנת pre-request). מקור: [Query plans with explain()](https://supabase.com/docs/guides/api/rest/debugging-performance).

**שמות/מזהים/זמנים.** התיעוד עצמו משתמש ב-`id bigint generated always as identity primary key` ([Generating types](https://supabase.com/docs/guides/api/rest/generating-types)) וב-`id uuid primary key default gen_random_uuid()` ([Testing overview](https://supabase.com/docs/guides/local-development/testing/overview)); אין תקן רשמי לשמות. ההמלצות שלהלן הן הסטנדרט שלנו.

### 2.2 למה זה חשוב לנו

- בטוקיו היו 8 views פנימיים חשופים לכל גולש, פונקציות עם `search_path` לא מקובע, ו-`pg_trgm` ב-`public` (סעיף ה ב-`OPEN-DECISIONS.md`). הסיבה: כל מה שנולד ב-`public` נחשף אוטומטית. בפרנקפורט אנחנו מתחילים מ-"סגור כברירת מחדל".
- טבלת הקרנות (40 אלף שורות) נקראת מגולשים אנונימיים; בלי `max_rows` נמוך ובלי views מצומצמים, בקשה אחת יכולה למשוך מגה-בייטים (egress) ולהעמיס IO.
- לידים נכנסים מאנונימיים: לא דרך `INSERT` ישיר לטבלה אלא דרך Edge Function (`lead-intake`) שמאמת Turnstile ומקור, או דרך RPC `security definer` עם ולידציה. אין grant `insert` ל-`anon` על טבלאות.

### 2.3 ההחלטה/הסטנדרט שלנו

1. **ארבע סכמות:** `api` (היחידה החשופה; רק views עם `security_invoker = true` ו-RPC), `platform` (טבלאות התפעול: לידים, תורים, תפקידים, יומן ביקורת), `private` (פונקציות עזר ל-RLS, `security definer`, לא חשוף), `extensions` (כל הרחבה). `public` נשאר ריק ולא חשוף (`api.schemas = ["api"]`).
2. **הסרת הרשאות ברירת מחדל** במיגרציה הראשונה (ה-SQL מסעיף 2.1), גם על `public` וגם על `platform`; ואז `grant` מפורש לכל אובייקט ב-`api`.
3. **קריאה ציבורית:** views ב-`api` (`api.blog_posts_public`, `api.funds_public`, `api.returns_board`) עם `security_invoker`, grant `select` ל-`anon, authenticated`, ו-RLS על הטבלאות מאחור עם policy `to anon, authenticated using (published = true)`. אין חשיפה ישירה של טבלאות.
4. **כתיבה:** אפס `insert/update/delete` ל-`anon` ול-`authenticated` על טבלאות. כתיבה רק דרך RPC `security definer set search_path = ''` שבודק תפקיד ו-`aal`, או דרך Edge Function עם `supabaseAdmin` (ראו פרק 5).
5. **`max_rows = 200`** ועימוד (range) בכל קריאה מהאתר; טבלת הקרנות נקראת לפי מסנן (קטגוריה/חברה) ולא כולה.
6. **שמות:** `snake_case`, יחיד לטבלה (`lead`, `fund`), `created_at timestamptz not null default now()`, `updated_at` עם טריגר, מזהים `uuid default gen_random_uuid()` לישויות שנחשפות החוצה (לידים, מסמכים), `bigint identity` לטבלאות פנימיות גדולות (קרנות, מדדים). מזהים חיצוניים לעולם לא ת"ז (HMAC בלבד, ראו `EVENT-ARCHITECTURE.md`).
7. **אין `graphql_public` חשוף** (לא בשימוש; מצמצם משטח תקיפה ו-lints 0026/0027).
8. **`explain()`** מופעל רק ב-staging; בפרודקשן רק עם pre-request שמגביל ל-IP שלנו.

### 2.4 פקודות או קוד

```sql
-- 0001_schemas_and_privileges.sql
create schema if not exists api;
create schema if not exists platform;
create schema if not exists private;
create schema if not exists extensions;

-- סגירת ברירות המחדל (public וגם platform)
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres
  revoke execute on functions from public;

-- api: רק usage; כל אובייקט מקבל grant מפורש
grant usage on schema api to anon, authenticated, service_role;
revoke all on schema public from anon, authenticated;   -- public לא חשוף ולא נגיש
grant usage on schema platform to service_role;         -- רק service role
grant usage on schema private to service_role;          -- פונקציות עזר נקראות מתוך policies/RPC

-- דוגמה: טבלת קרנות (platform) + view ציבורי (api)
create table platform.fund (
  id            bigint generated always as identity primary key,
  provider_code text not null,
  fund_number   text not null unique,
  name          text not null,
  category      text not null,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table platform.fund enable row level security;
create index on platform.fund (category) where is_published;

create policy "public read published funds"
  on platform.fund for select
  to anon, authenticated
  using (is_published);
grant select on platform.fund to anon, authenticated;   -- נדרש כדי שה-view (invoker) יעבוד

create view api.funds_public
  with (security_invoker = true) as
  select fund_number, name, category, provider_code
  from platform.fund;
grant select on api.funds_public to anon, authenticated;

-- RPC לכתיבה (לא טבלה חשופה)
create or replace function api.submit_lead(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare lead_id uuid;
begin
  -- ולידציה, מגבלת קצב, hash לת"ז וכו'
  insert into platform.lead (id, payload) values (gen_random_uuid(), payload) returning id into lead_id;
  return lead_id;
end $$;
revoke execute on function api.submit_lead(jsonb) from public;
grant execute on function api.submit_lead(jsonb) to anon;   -- רק אם מחליטים לקבל לידים ישירות; אחרת רק service_role
```

```ts
// src/platform/db/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types.gen'

export const supabase = createClient<Database, 'api'>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,   // sb_publishable_...
  { db: { schema: 'api' } }
)

// קריאה מעומדת ומסוננת (לא כל הטבלה)
const { data } = await supabase
  .from('funds_public')
  .select('fund_number,name,category')
  .eq('category', 'pension')
  .order('name')
  .range(0, 49)
```

---

## 3. RLS

### 3.1 מה אומר התיעוד (2026)

**יסודות.** RLS חובה על כל טבלה בסכמה חשופה; policy היא בעצם `WHERE` שמתווסף לכל שאילתה. `anon` = בקשה בלי משתמש; `authenticated` = משתמש מחובר (גם משתמש אנונימי של Auth מקבל `authenticated`, עם claim `is_anonymous`). תמיד לציין תפקיד ב-`to`. `UPDATE` דורש גם policy `SELECT`. `auth.uid()` מחזיר `null` כשאין משתמש, ולכן `auth.uid() = user_id` נכשל בשקט; עדיף לבדוק מפורשות `auth.uid() is not null`. מקור: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

**ביצועים (עם מדידות מהתיעוד):**
- אינדקס על כל עמודה שמשתתפת ב-policy (171ms ל-<0.1ms).
- לעטוף קריאות פונקציה ב-`(select ...)`: `(select auth.uid()) = user_id`. זה יוצר `initPlan` שמחושב פעם אחת לשאילתה ולא לכל שורה (179ms ל-9ms; פונקציית `is_admin()` עם join: 11,000ms ל-7ms). עובד ל-`auth.uid()`, `auth.jwt()` ולפונקציות `security definer`, **רק** כשהתוצאה אינה תלויה בשורה.
- להוסיף מסננים גם בשאילתת הלקוח (`.eq('user_id', uid)`) ולא להסתמך רק על ה-policy (171ms ל-9ms).
- פונקציית עזר `security definer` בסכמה **לא חשופה** (למשל `private.has_good_role()`) כדי לסרוק טבלת תפקידים בלי קנס RLS.
- לצמצם joins: `team_id in (select team_id from team_user where user_id = (select auth.uid()))` במקום join לטבלת המקור.
- `to authenticated` חוסך את הרצת ה-policy עבור `anon`.
מקור: [RLS performance recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations).

**`auth.jwt()` ומטא-דאטה.** `raw_user_meta_data` ניתן לעריכה על ידי המשתמש ולכן **אסור** להשתמש בו להרשאות (lint `0015_rls_references_user_metadata`, ERROR); `raw_app_meta_data` לא ניתן לעריכה ומתאים. JWT לא תמיד "טרי": שינוי ב-`app_metadata` משתקף רק אחרי רענון טוקן. מקור: [Helper functions](https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions), [Advisors 0015](https://supabase.com/docs/guides/observability/advisors).

**MFA ב-RLS.** policy מגבילה (`as restrictive`) שדורשת `(select auth.jwt()->>'aal') = 'aal2'`; שלוש אסטרטגיות (לכולם / למשתמשים חדשים / למי שנרשם ל-MFA). `as restrictive` מגביל כל פקודה על הטבלה ללא קשר ל-policies אחרות. מקור: [Enforce rules for MFA logins](https://supabase.com/docs/guides/auth/auth-mfa#enforce-rules-for-mfa-logins).

**Custom Access Token Hook (claims של תפקידים).** ה-hook רץ לפני הוצאת כל טוקן ומקבל `user_id`, `claims`, `authentication_method`; מחזיר `claims` מעודכנים. ה-claims הנדרשים (`iss, aud, exp, iat, sub, role, aal, session_id, email, phone, is_anonymous`) חובה להשאיר. דוגמת RBAC רשמית: טבלאות `user_roles` ו-`role_permissions`, פונקציה `public.custom_access_token_hook(event jsonb)` ב-plpgsql `stable` שמוסיפה `user_role` ל-claims; grants: `grant usage on schema public to supabase_auth_admin`, `grant execute ... to supabase_auth_admin`, `revoke execute ... from authenticated, anon, public`, `grant all on table user_roles to supabase_auth_admin`, `revoke all on table user_roles from authenticated, anon, public`, ו-policy `select` ל-`supabase_auth_admin`. ההפעלה: Dashboard > Authentication > Hooks, או ב-`config.toml`: `[auth.hook.custom_access_token] enabled = true uri = "pg-functions://postgres/<schema>/<function>"`. התיעוד **ממליץ שלא** להגדיר את פונקציית ה-hook כ-`security definer` אלא לתת grants מפורשים ל-`supabase_auth_admin`. בצד הלקוח ה-claim זמין רק בפענוח `access_token` (למשל `jwt-decode`), לא באובייקט `user`. פונקציית `authorize(requested_permission)` ב-`security definer set search_path = ''` קוראת `auth.jwt() ->> 'user_role'` ובודקת מול `role_permissions`; ב-policy: `using ((select authorize('messages.delete')))`. מקור: [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook), [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac), [Auth Hooks: Developing](https://supabase.com/docs/guides/auth/auth-hooks#developing).

**בדיקת RLS עם pgTAP.** בתוך טרנזקציה: `set local role authenticated; set local request.jwt.claim.sub = '<uuid>';` (או `set local "request.jwt.claims" = '{"sub":"...","role":"authenticated","user_role":"agent"}'`), ואז `results_eq`, `lives_ok`, `results_ne`; `policies_are('public','profiles', array[...])` בודק שקיימות policies בשמות נתונים. `supabase test db` מריץ את הכול ו-`rollback` מנקה. ספריית עזר קהילתית: basejump `supabase-test-helpers`. מקור: [Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview), [pgTAP](https://supabase.com/docs/guides/database/extensions/pgtap), [Test helpers](https://supabase.com/docs/guides/local-development/cli/testing-and-linting#test-helpers).

**Lints רלוונטיים:** `0003_auth_rls_initplan` (WARN, קריאה לא עטופה), `0006_multiple_permissive_policies` (WARN), `0007_policy_exists_rls_disabled`, `0008_rls_enabled_no_policy` (INFO), `0024_permissive_rls_policy` (WARN, `using (true)`), `0028/0029` (פונקציית `security definer` שניתנת להרצה ל-`anon`/`authenticated`). מקור: [Advisors](https://supabase.com/docs/guides/observability/advisors).

### 3.2 למה זה חשוב לנו

- בטוקיו נעטפו 92 policies ב-`(select ...)` בדיעבד; בפרנקפורט זה הסטנדרט מהשורה הראשונה.
- המודל שלנו (ראו `EVENT-ARCHITECTURE.md` סעיף 6): תפקידים הם נתונים ב-`platform_user_roles`; לקוח/אנונימי = אפס גישה ישירה; סוכן רואה את שלו לפי `visibility_mode`; `super_admin` דורש step-up (`aal2` + `totp` טרי ב-`amr`). claim של תפקיד ב-JWT חוסך join בכל policy.
- המלכודת: claim ב-JWT מתעדכן רק ברענון טוקן (עד `jwt_expiry`). הורדת תפקיד לסוכן חייבת להיות אפקטיבית מיד: לכן פעולות רגישות עוברות RPC שבודק גם את הטבלה, לא רק את ה-claim.

### 3.3 ההחלטה/הסטנדרט שלנו

1. **כל טבלה:** `enable row level security` באותה מיגרציה שיוצרת אותה; בלי policy ללקוח/אנונימי אלא אם מדובר בתוכן ציבורי מפורש.
2. **כל policy:** `to <role>` מפורש, `(select auth.uid())`, `(select auth.jwt()->>'aal')`, `(select private.current_role())`; אינדקס על כל עמודת policy ועל כל FK (lint 0001).
3. **תפקידים ב-JWT:** Custom Access Token Hook ב-`private.custom_access_token_hook` (לא `public`), שמוסיף `user_role` ו-`agency_id` מ-`platform.platform_user_roles`; grants ל-`supabase_auth_admin` לפי התיעוד; **לא** `security definer`. ה-claim משמש ל-policies של **קריאה**; פעולות **כתיבה/ניהול** עוברות RPC שבודק מחדש בטבלה (עמידות בפני claim ישן).
4. **Step-up ל-`super_admin`:** policy `as restrictive` עם `aal2` + בדיקת `amr[0].method = 'totp'` וגיל ≤ 900 שניות (כבר ממומש כ-`require_super_admin_fresh()` לפי `EVENT-ARCHITECTURE.md`).
5. **פונקציות עזר** ב-`private` בלבד, `security definer set search_path = ''`, `revoke execute from public, anon, authenticated` ו-`grant execute` רק למי שצריך (זכרו: אחרי `revoke execute on functions from public` גלובלי, גם policies צריכות grant מפורש).
6. **בדיקות pgTAP חובה** לכל טבלה חדשה: תרחיש `anon` (0 שורות / 42501), `authenticated` ללא תפקיד (0 שורות), `agent` שלו בלבד, `manager`, `super_admin` עם ובלי `aal2`. הבדיקות רצות ב-CI.
7. **Security Advisor ירוק** (אין ERROR) הוא תנאי ל-merge; WARN מתועד עם סיבה.

### 3.4 פקודות או קוד

```sql
-- private.current_role(): claim מה-JWT, עטוף ב-(select ...) בכל policy
create or replace function private.current_role()
returns text
language sql
stable
set search_path = ''
as $$ select coalesce(auth.jwt() ->> 'user_role', 'none') $$;
revoke execute on function private.current_role() from public, anon, authenticated;
grant execute on function private.current_role() to authenticated;   -- נקרא מתוך policies

-- hook: תפקיד + סוכנות ל-JWT (לפי הדוגמה הרשמית, מותאם לסכמות שלנו)
create or replace function private.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := event->'claims';
  r record;
begin
  select role, agency_id into r
  from platform.platform_user_roles
  where user_id = (event->>'user_id')::uuid
  limit 1;

  if found then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(r.role));
    claims := jsonb_set(claims, '{agency_id}', coalesce(to_jsonb(r.agency_id), 'null'::jsonb));
  else
    claims := jsonb_set(claims, '{user_role}', '"none"');
  end if;
  return jsonb_set(event, '{claims}', claims);
end $$;

grant usage on schema private to supabase_auth_admin;
grant usage on schema platform to supabase_auth_admin;
grant execute on function private.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function private.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on table platform.platform_user_roles to supabase_auth_admin;
create policy "auth admin reads roles" on platform.platform_user_roles
  as permissive for select to supabase_auth_admin using (true);
```

```toml
# supabase/config.toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/private/custom_access_token_hook"
```

```sql
-- policies לדוגמה: סוכן רואה לידים שלו; super_admin דורש aal2 טרי
create policy "agent reads own leads" on platform.lead
  for select to authenticated
  using (
    (select private.current_role()) in ('agent','manager','super_admin')
    and assigned_agent_id = (select auth.uid())
  );

create policy "admin actions need aal2" on platform.assignment_rules
  as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
```

```sql
-- supabase/tests/lead_rls.test.sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'agent1@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'agent2@test.local');
insert into platform.platform_user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'agent');
insert into platform.lead (id, assigned_agent_id, payload) values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '{}'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '{}');

-- anon: אין grant בכלל
set local role anon;
select throws_ok($$ select count(*) from platform.lead $$, '42501', null, 'anon cannot read leads');

-- agent1 עם claim של תפקיד
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","aal":"aal1","user_role":"agent"}';
select results_eq($$ select count(*) from platform.lead $$, array[1::bigint], 'agent sees only own lead');

-- משתמש מחובר בלי תפקיד
set local "request.jwt.claims" = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated","aal":"aal1","user_role":"none"}';
select results_eq($$ select count(*) from platform.lead $$, array[0::bigint], 'user without role sees nothing');

select * from finish();
rollback;
```

---

## 4. Auth

### 4.1 מה אומר התיעוד (2026)

**Email OTP מול Magic Link.** שתי השיטות משתפות מימוש אחד: `signInWithOtp({ email })` שולח Magic Link כברירת מחדל; כדי לשלוח קוד, משנים את תבנית **Magic Link** כך שתכלול `{{ .Token }}`. ברירת מחדל: בקשה אחת ל-60 שניות, תוקף שעה. **הגדרת Email OTP Expiration שולטת גם בתוקף של כל קישורי המייל** (אישור, שחזור סיסמה, שינוי מייל, הזמנה). תוקף מעל 86,400 שניות "strongly discouraged" ואפשרי רק דרך Management API. `shouldCreateUser: false` מונע הרשמה אוטומטית ב-OTP. מקור: [Passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless). ה-production checklist: תוקף OTP ≤ 3600 שניות; אם צריך יותר אנטרופיה, להאריך את הקוד (`otp_length` 6 עד 10). מקור: [Production security checklist: Auth](https://supabase.com/docs/guides/security/production-checklist#auth).

**ביטול הרשמות.** "Allow new users to sign up: Users will be able to sign up. If this config is disabled, only existing users can sign in." קיימים גם מתגים פר-ספק: `auth.email.enable_signup`, `auth.sms.enable_signup`. מקור: [General configuration](https://supabase.com/docs/guides/auth/general-configuration), [CLI config](https://supabase.com/docs/guides/local-development/cli/config#auth.enable_signup).

**הזמנות ויצירת משתמשים מהשרת.** `supabase.auth.admin.inviteUserByEmail('email@example.com')` שולח מייל הזמנה (דרך SMTP של הפרויקט); `supabase.auth.admin.generateLink({ type: 'invite' | 'magiclink' | 'recovery' | 'signup', email })` מחזיר קישור/טוקן לשליחה דרך ספק מייל משלנו. יצירת משתמש ישירה: `auth.admin.createUser({ email, phone, password, email_confirm: true, phone_confirm: true })` (מופיע בדוגמת הבדיקות הרשמית). מקור: [inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview). ה-hook **Before User Created** (Free/Pro) מאפשר לדחות הרשמה לפי דומיין/IP/כל כלל; החזרת `{"error": {...}}` עם 4xx חוסמת. מקור: [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook).

**Phone / SMS OTP.** ספקים נתמכים: MessageBird, Twilio, Twilio Verify, Vonage, TextLocal (קהילתי). WhatsApp רק דרך Twilio/Twilio Verify. ברירת מחדל: בקשה ל-60 שניות, תוקף שעה. `verifyOtp({ phone, token, type: 'sms' })`; שינוי מספר: `updateUser({ phone })` ואז `verifyOtp` עם `type: 'phone_change'` תוך 60 שניות. אזהרה רשמית: לשלוט בעלויות SMS באמצעות rate limits ו-CAPTCHA. מספרי בדיקה: `[auth.sms.test_otp] 14155552671 = "123456"` (ללא `+`, בינלאומי); ב-Dashboard חובה תאריך תפוגה; **לא חלים על Phone MFA**; יש להסיר לפני פרודקשן. מקור: [Phone sign-in](https://supabase.com/docs/guides/auth/phone-login), [Test phone sign-in with test numbers](https://supabase.com/docs/guides/auth/testing-auth-flows#test-phone-sign-in-with-test-numbers), [CLI config: auth.sms](https://supabase.com/docs/guides/local-development/cli/config).

**Send SMS Hook (ספק ישראלי).** מחליף את השליחה המובנית; מתאים ל-"regional SMS provider". קלט: `user` (כולל `phone`) ו-`sms.otp`. פלט: לא נדרש; תשובת 200 ריקה = הצלחה. שגיאה: `{"error": {"http_code": 500, "message": "..."}}`. hook מסוג HTTP חותם לפי **Standard Webhooks** (`webhook-id`, `webhook-timestamp`, `webhook-signature`); הסוד בפורמט `v1,whsec_<base64>`; מאמתים עם ספריית `standardwebhooks`. דוגמה רשמית: Edge Function עם `Deno.serve`, `new Webhook(secret).verify(payload, headers)`, ואז קריאת API של Twilio. אפשר גם hook מסוג פונקציית Postgres שמכניסה לתור (`job_queue`) ושולחת ב-`pg_cron`. מקור: [Send SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook), [Auth Hooks: Security model](https://supabase.com/docs/guides/auth/auth-hooks#security-model).

**MFA/TOTP.** TOTP זמין ומופעל כברירת מחדל בכל הפרויקטים, בחינם; זרימה: `mfa.enroll()` (QR + secret), `mfa.challenge()`, `mfa.verify()`; בכניסה: `mfa.getAuthenticatorAssuranceLevel()` מחזיר `currentLevel` ו-`nextLevel` (`aal1/aal2` = נרשם ולא אימת). ה-JWT מקבל `aal` ו-`amr` (רשימת שיטות עם timestamp, האחרונה ראשונה; `jsonb_path_query(auth.jwt(), '$.amr[0]')`). אכיפה: RLS מגביל (3.1) ובדיקות בשרת. הגבלת קצב ל-challenge/verify: 15 לדקה ל-IP, לא ניתן לשינוי. **Phone MFA** הוא add-on בתשלום: 75$ לחודש לפרויקט הראשון. `[auth.mfa.totp] enroll_enabled/verify_enabled`, `max_enrolled_factors`. מקור: [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [MFA (TOTP)](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), [Manage Advanced MFA Phone usage](https://supabase.com/docs/guides/platform/manage-your-usage/advanced-mfa-phone).

**סשנים ורענון.** ברירת מחדל: סשן אינסופי, מספר סשנים בלתי מוגבל; access token קצר (5 דקות עד שעה), refresh token חד-פעמי. **Pro ומעלה:** Time-box, Inactivity timeout, Single session per user. האכיפה קורית ברענון, לכן אורך הסשן האפקטיבי = timeout + `jwt_expiry`; לא לרדת מתחת ל-5 דקות ב-JWT. Refresh token reuse: חלון 10 שניות (לא לשנות), זיהוי reuse מסיים את הסשן. `auth.jwt_expiry` עד שבוע. מקור: [User sessions](https://supabase.com/docs/guides/auth/sessions), [CLI config](https://supabase.com/docs/guides/local-development/cli/config).

**Rate limits (ברירות מחדל):** מיילים: 2 לשעה עם השרת המובנה (ניתן לשינוי רק עם SMTP מותאם או Send Email Hook); SMS: 30 לשעה; הרשמות/כניסות (`/signup, /recover, /resend, /magiclink, /otp, /user`): 30 ל-5 דקות ל-IP; OTP/magic link לאותו משתמש: פעם ב-60 שניות; `/verify`: 30 ל-5 דקות ל-IP; `/token`: 150 ל-5 דקות ל-IP; MFA challenge/verify: 15 לדקה. אלגוריתם token bucket בקיבולת 30. שינוי דרך Dashboard או `PATCH /v1/projects/{ref}/config/auth` עם `rate_limit_*`. מקור: [Rate limits](https://supabase.com/docs/guides/auth/rate-limits).

**CAPTCHA.** hCaptcha או Cloudflare Turnstile; מופעל ב-Auth > Attack Protection עם ה-Secret key; בצד הלקוח מעבירים `options: { captchaToken }` לקריאות Auth (הדוגמה הרשמית: `signUp`). מקור: [Enable CAPTCHA Protection](https://supabase.com/docs/guides/auth/auth-captcha). **לא אומת בתיעוד שנקרא:** רשימת כל הקריאות שדורשות `captchaToken` כש-CAPTCHA מופעל (`signInWithOtp`, `signInWithPassword`, `resetPasswordForEmail`) והאם `verifyOtp` פטור; יש לבדוק מול reference של supabase-js לפני המימוש. אימות Turnstile בתוך Edge Function משלנו (לידים, צ'אט) הוא דוגמה רשמית נפרדת: [CAPTCHA support with Cloudflare Turnstile](https://supabase.com/docs/guides/functions/examples/cloudflare-turnstile).

**Auth Hooks: זמינות לפי תוכנית.** Before User Created, Custom Access Token, Send SMS, Send Email: Free ו-Pro. **MFA Verification Attempt ו-Password Verification Attempt: Teams ו-Enterprise בלבד.** hook מסוג Postgres רץ בתוך המסד (לא יוצא החוצה); hook HTTP חתום לפי Standard Webhooks. שגיאות מ-hook של Postgres אינן retry-able. מקור: [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks).

**SMTP מותאם.** השרת המובנה שולח רק לכתובות של חברי הצוות בארגון, מוגבל ל-2 מיילים לשעה, ללא SLA. אחרי הגדרת SMTP מותאם (Resend, SES, Postmark, SendGrid ועוד) מגבלת ברירת המחדל היא 30 לשעה, ניתנת לשינוי. הגדרה דרך Dashboard או `PATCH .../config/auth` עם `smtp_host/port/user/pass/admin_email/sender_name`. אסטרטגיות נגד abuse: CAPTCHA, להעדיף OTP על סיסמאות, לא לבטל אישור מייל תחת לחץ. מקור: [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

**URL configuration.** Site URL = יעד ברירת מחדל כש-`redirectTo` לא נשלח (קריטי לאישורי מייל ושחזור סיסמה); רשימת Redirect URLs עם wildcards; מקומית `auth.site_url`, `auth.additional_redirect_urls`. מקור: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

**סיסמאות.** אורך מינימלי, דרישות תווים (ספרות, אותיות גדולות/קטנות, סימנים), ו-**הגנה מפני סיסמאות שנחשפו (HaveIBeenPwned): Pro ומעלה**. אימות מחדש לפני שינוי סיסמה (`reauthenticate()` + `nonce`). משתמש קיים עם סיסמה חלשה מקבל `WeakPasswordError` בכניסה. מקור: [Password security](https://supabase.com/docs/guides/auth/password-security).

**יומני Auth.** אירועי Auth נרשמים אוטומטית; אפשר להפעיל כתיבה גם ל-`auth.audit_log_entries` ב-Postgres (עולה מקום). מקור: [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs).

### 4.2 למה זה חשוב לנו

- **סוכנים:** מעט משתמשים, רגישות גבוהה. סיסמה + TOTP חובה, 30 יום, פסק זמן 60 דקות (החלטת הבעלים ב-`OPEN-DECISIONS.md` סעיף 4). Time-box/Inactivity זמינים לנו כי אנחנו Pro.
- **לקוחות (פורטל עתידי):** הזמנה בלבד; זיהוי בת"ז (HMAC) + SMS OTP. ספקי SMS מובנים אינם ישראליים; Send SMS Hook נותן לנו שער ישראלי או Twilio כגיבוי. Phone MFA (75$ לחודש) **לא** נדרש: כניסת לקוח ב-SMS OTP היא כניסה ראשית (`aal1`), לא גורם שני.
- **הוקים של Password/MFA Verification** אינם זמינים ב-Pro, לכן נעילת חשבון אחרי ניסיונות כושלים נבנית אצלנו (יומן ב-`platform.auth_events` דרך Auth logs או טריגר) ולא דרך hook.
- כל האימיילים (הזמנות, שחזור) חייבים SMTP מותאם; אחרת רק חברי הצוות יקבלו מיילים ו-2 לשעה.

### 4.3 ההחלטה/הסטנדרט שלנו

1. **הרשמה סגורה:** `enable_signup = false` (וגם `auth.email.enable_signup = false`, `auth.sms.enable_signup = false`). סוכנים נוצרים ב-Edge Function `invite-agent` (`auth.admin.inviteUserByEmail` או `generateLink` + Resend); לקוחות ייווצרו ב-`auth.admin.createUser({ phone, phone_confirm: true })` אחרי אימות ת"ז מול `identity_links`. שכבת הגנה נוספת: Before User Created hook שדוחה כל יצירה שלא מגיעה מ-`service_role` (**לא אומת** שה-payload מזהה את מקור הבקשה; עד שיאומת, הסתמכות על `enable_signup = false`).
2. **סוכנים:** email + password (אורך ≥ 12, כל סוגי התווים, leaked-password protection מופעל) + TOTP חובה. אחרי כניסה, אם `nextLevel = 'aal2'` חוסמים את האפליקציה עד `verify`; אם `aal1/aal1` מכניסים ל-enroll כפוי. RLS: `as restrictive aal2` על כל טבלאות `platform`. Sessions: Time-box 30 יום, Inactivity 60 דקות, Single session per user מופעל; `jwt_expiry = 3600` (לא פחות מ-5 דקות; שומרים שעה כדי שה-`amr` לא יתנפח בבקשות רענון).
3. **לקוחות:** SMS OTP בלבד (`signInWithOtp({ phone })` → `verifyOtp({ type: 'sms' })`), `shouldCreateUser: false`; `otp_expiry` 600 שניות; תוקף Email OTP 600 שניות גם לקישורי ההזמנה של סוכנים (זכרו: אותה הגדרה).
4. **SMS:** Send SMS Hook מסוג HTTP → Edge Function `auth-send-sms` (`verify_jwt = false`, אימות Standard Webhooks בקוד) → ספק ישראלי דרך REST (ספק וחוזה API: **לא אומת**, בחירה פתוחה בסעיף 16 ב-`OPEN-DECISIONS.md`), Twilio כגיבוי. עד שהספק נבחר: Twilio Verify מובנה. מגבלת SMS: 30 לשעה (ברירת מחדל) ו-CAPTCHA חובה על מסך הכניסה של הלקוחות.
5. **SMTP:** Resend (גם ל-Auth דרך SMTP וגם לפונקציות דרך HTTP API). `smtp_admin_email = no-reply@seeld.co.il`, `rate_limit_email_sent = 30`.
6. **CAPTCHA:** Turnstile מופעל ב-Attack Protection; הלקוח מעביר `captchaToken` בכל קריאת Auth שמתחילה זרימה. אותו Turnstile משמש ב-`lead-intake` וב-`chat-bot` עם אימות בקוד הפונקציה.
7. **URL:** `site_url = https://seeld.co.il`, `additional_redirect_urls = ["https://seeld.co.il/**", "https://*-seeld.vercel.app/**"]` (**לא אומת** התחביר המדויק של wildcard לדומייני preview של Vercel; לבדוק בעמוד Redirect URLs לפני הגדרה).
8. **Rate limits:** `sign_in_sign_ups = 30`, `token_verifications = 30`, `sms_sent = 30`, `email_sent = 30`; מעלים רק לפי מדידה.
9. **Claims:** Custom Access Token Hook (פרק 3). Minimal JWT לא נדרש כרגע (אין SSR cookies).
10. **ניטור:** Auth audit logs נכתבים ל-DB (`auth.audit_log_entries`) כי יומן הביקורת שלנו צריך אירועי כניסה/MFA; לבדוק נפח אחרי חודש.

### 4.4 פקודות או קוד

```toml
# supabase/config.toml: Auth
[auth]
site_url = "https://seeld.co.il"
additional_redirect_urls = ["https://seeld.co.il/**"]
enable_signup = false
enable_anonymous_sign_ins = false
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10

[auth.email]
enable_signup = false
enable_confirmations = true
double_confirm_changes = true
otp_length = 6
otp_expiry = 600          # 10 דקות; שולט גם בקישורי הזמנה/שחזור

[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_SMTP_PASSWORD)"
admin_email = "no-reply@seeld.co.il"
sender_name = "SEELD"

[auth.sms]
enable_signup = false
enable_confirmations = true

[auth.hook.send_sms]
enabled = true
uri = "https://<PROJECT_REF>.supabase.co/functions/v1/auth-send-sms"
secrets = "env(SEND_SMS_HOOK_SECRET)"       # v1,whsec_...

[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/private/custom_access_token_hook"

[auth.mfa]
max_enrolled_factors = 3

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true

[auth.sessions]
timebox = "720h"            # 30 יום
inactivity_timeout = "60m"

[auth.rate_limit]
email_sent = 30
sms_sent = 30
sign_in_sign_ups = 30
token_verifications = 30
token_refresh = 150
```

```bash
# הגדרות שאינן ב-config.toml (או כגיבוי): Management API
export SUPABASE_ACCESS_TOKEN="..." PROJECT_REF="..."
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "mailer_autoconfirm": false,
    "mailer_otp_exp": 600,
    "rate_limit_email_sent": 30,
    "rate_limit_sms_sent": 30,
    "rate_limit_otp": 60,
    "smtp_host": "smtp.resend.com", "smtp_port": "465", "smtp_user": "resend",
    "smtp_pass": "<RESEND_SMTP_PASSWORD>", "smtp_admin_email": "no-reply@seeld.co.il",
    "smtp_sender_name": "SEELD"
  }'
```

```ts
// Edge Function: supabase/functions/auth-send-sms/index.ts (Send SMS Hook, HTTP)
import { Webhook } from 'npm:standardwebhooks@1'

export default {
  fetch: async (req: Request) => {
    const payload = await req.text()
    const secret = Deno.env.get('SEND_SMS_HOOK_SECRET')!.replace('v1,whsec_', '')
    let data: { user: { phone: string }; sms: { otp: string } }
    try {
      data = new Webhook(secret).verify(payload, Object.fromEntries(req.headers)) as typeof data
    } catch {
      return Response.json({ error: { http_code: 401, message: 'bad signature' } }, { status: 401 })
    }
    const ok = await sendViaIsraeliGateway(data.user.phone, `קוד הכניסה ל-SEELD: ${data.sms.otp}`) // ספק: לא אומת
      || await sendViaTwilio(data.user.phone, `SEELD code: ${data.sms.otp}`)
    return ok
      ? Response.json({}, { status: 200 })
      : Response.json({ error: { http_code: 502, message: 'sms provider failed' } }, { status: 502 })
  },
}
```

```ts
// לקוח: כניסת סוכן עם TOTP
const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } })
const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totp = factors!.totp[0]
  const { data: ch } = await supabase.auth.mfa.challenge({ factorId: totp.id })
  await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: ch!.id, code })
} else if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal1') {
  // enroll כפוי: supabase.auth.mfa.enroll({ factorType: 'totp' }) -> QR -> challenge/verify
}

// לקוח: כניסת לקוח ב-SMS OTP (משתמש שנוצר מראש)
await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: false, captchaToken } })
await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
```

---

## 5. Edge Functions

### 5.1 מה אומר התיעוד (2026)

**Runtime ותלויות.** Supabase Edge Runtime הוא runtime תואם Deno, TypeScript-first, עם תמיכה ב-WASM; ייבוא מ-`npm:`, `jsr:`, `node:` builtins. מומלץ `deno.json` **לכל פונקציה** (בידוד תלויות); `import_map.json` הוא legacy. דגל `deno_version = 2` תחת `[edge_runtime]` מופיע בדוגמה רשמית (**לא אומת** כמפתח ב-reference של config). מקור: [Edge Functions](https://supabase.com/docs/guides/functions), [Managing dependencies](https://supabase.com/docs/guides/functions/dependencies), [MCP server with mcp-lite](https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite).

**מבנה תיקיות.** "fat functions" (מעט פונקציות גדולות); קוד משותף בתיקייה עם קידומת קו תחתון `supabase/functions/_shared/` (למשל `supabaseAdmin.ts`, `supabaseClient.ts`, `cors.ts`); שמות עם מקפים; בדיקות בתיקיית `tests/`. מקור: [Development tips](https://supabase.com/docs/guides/functions/development-tips).

**אימות: שתי שכבות.** (1) בדיקת פלטפורמה `verify_jwt` (ברירת מחדל `true`) שבודקת את כותרת `Authorization` לפני שהקוד רץ: מקבלת JWT של משתמש (HS256 ישן או signing keys חדשים), **אבל מקבלת גם מפתחות `sb_publishable_`/`sb_secret_` בשתי הכותרות** "for migration compatibility", ולכן היא לבדה אינה מאמתת קורא ששולח רק מפתח API. (2) בקוד: החבילה `@supabase/server` עם `withSupabase({ auth: ... }, handler)`: `'user'` (JWT ב-`Authorization`), `'secret'` (מפתח secret בשם `default` ב-`apikey`; `'secret:<name>'` או `'secret:*'`), `'publishable'`, `'none'` (webhooks חתומים). אפשר מערך `['user', 'secret']`. ה-handler מקבל `ctx.supabase` (RLS של הקורא), `ctx.supabaseAdmin` (עוקף RLS), `ctx.userClaims`. `createSupabaseContext` ל-401 מותאם. משתני סביבה שהחבילה קוראת: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS`. מתי לכבות `verify_jwt`: webhooks חיצוניים ו-service-to-service (cron, pg_net, פונקציה→פונקציה) שמגיעים עם `apikey` ולא עם JWT. מקור: [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth), [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers), [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration).

**CORS.** `withSupabase` מטפל ב-preflight אוטומטית. ידנית: `import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'` (מ-2.95.0) כדי שרשימת הכותרות המותרות תישאר מסונכרנת עם ה-SDK (כולל `traceparent/tracestate/baggage` מ-2.112.3). מקור: [CORS](https://supabase.com/docs/guides/functions/cors). **הערה:** התיעוד לא מתאר allowlist של Origin; זה קוד שלנו.

**סודות.** מקומי: `supabase/functions/.env` (נטען ב-`supabase start`); פרודקשן: Dashboard או `supabase secrets set --env-file ./supabase/.env`; רק Owner/Administrator יכולים ליצור/למחוק סוד. מגבלות: 100 סודות לפרויקט, שם ≤ 256 תווים, ערך ≤ 48KiB, אסור קידומת `SUPABASE_`. סודות מובנים: `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS` (ו-legacy `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); ב-hosted גם `SB_REGION`, `SB_EXECUTION_ID`, `DENO_DEPLOYMENT_ID`. מקור: [Environment variables](https://supabase.com/docs/guides/functions/secrets), [Limits](https://supabase.com/docs/guides/functions/limits).

**קונפיגורציה פר-פונקציה** ב-`config.toml`: `[functions.<name>] verify_jwt`, `import_map`, `entrypoint`, `enabled`. `--no-verify-jwt` ב-serve/deploy עוקף. מקור: [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration), [CLI config](https://supabase.com/docs/guides/local-development/cli/config).

**משימות רקע.** `EdgeRuntime.waitUntil(promise)`: ה-instance ממשיך לרוץ עד שה-promise מסתיים, גם אחרי שהתשובה נשלחה; `beforeunload` מודיע לפני כיבוי; `unhandledrejection` לטיפול בשגיאות. מקומית חייבים `[edge_runtime] policy = "per_worker"` כדי שהרקע לא ייקטע. מקור: [Background Tasks](https://supabase.com/docs/guides/functions/background-tasks).

**תזמון עם pg_cron + pg_net.** הסודות (URL ומפתח secret) ב-Vault: `vault.create_secret('https://<ref>.supabase.co', 'project_url')`, `vault.create_secret('sb_secret_...', 'secret_key')`; `cron.schedule(... net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/<fn>', headers := jsonb_build_object('Content-type','application/json','apikey', (select decrypted_secret ... 'secret_key')), body := ...))`. הפונקציה: `verify_jwt = false` + `auth: 'secret'`. **אזהרה רשמית:** עד שהבקשה נשלחת, pg_net כותב את המפתח המפוענח ל-`net.http_request_queue`, שכל תפקיד שיכול להתחבר למסד יכול לקרוא. מקור: [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).

**לוגים.** Dashboard > Edge Functions > פונקציה > Logs: שורות invocation (status, זמן) ו-console/events (boot, shutdown, שגיאות); סינון לפי זמן/סוג/רמה/טקסט; מצב Live. מגבלות: הודעת לוג ≤ 10,000 תווים; סף 100 אירועים ל-10 שניות. ייצוא: Log Drains (פרק 9). מקור: [Edge Functions logging](https://supabase.com/docs/guides/functions/logging), [Limits](https://supabase.com/docs/guides/functions/limits).

**מגבלות.** זיכרון 256MB; wall clock 400 שניות בתוכניות בתשלום (150 ב-Free); CPU 2 שניות לבקשה (לא כולל I/O אסינכרוני); idle timeout 150 שניות (504); גודל bundle 20MB (CLI) או 5MB (Dashboard/API); Pro: 1000 פונקציות; קריאות רקורסיביות: 30 בקשות ל-trace ב-60 שניות; **פורטים 25 ו-587 חסומים** (אין SMTP ישיר מפונקציה); HTML מוגש רק עם custom domain; אין Web Worker; ספריות multithread (sharp, libvips) לא נתמכות. מקור: [Limits](https://supabase.com/docs/guides/functions/limits).

**אזורים.** ברירת מחדל: הפונקציה רצה באזור הקרוב למשתמש; לעבודה כבדה מול DB כדאי לקבע לאזור המסד: `supabase.functions.invoke(name, { region: FunctionRegion.EuCentral1 })` או כותרת `x-region: eu-central-1`; ל-webhooks/CORS: query `forceFunctionRegion`. בדיקה: כותרת תשובה `x-sb-edge-region`. **כשמקבעים אזור אין ניתוב מחדש בתקלה אזורית.** `eu-central-1` ברשימה. מקור: [Regional Invocations](https://supabase.com/docs/guides/functions/regional-invocation).

**Postgres מתוך פונקציה.** מועדף: `ctx.supabase` / `ctx.supabaseAdmin`. חיבור ישיר: דרך ה-pooler במצב transaction (פורט 6543), לקוח אחד ברמת המודול, `max: 1`, `prepare: false`, `ssl: 'require'`. מקור: [Integrating with Postgres](https://supabase.com/docs/guides/functions/connect-to-postgres), [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres#configure-your-client).

**Resend.** דוגמה רשמית: `fetch('https://api.resend.com/emails', { headers: { Authorization: 'Bearer ' + RESEND_API_KEY } })` בתוך `withSupabase({ auth: ['user', 'secret'] })`; `RESEND_API_KEY` ב-secrets. מקור: [Sending Emails](https://supabase.com/docs/guides/functions/examples/send-emails).

**אידמפוטנטיות ו-retry:** אין מנגנון מובנה בתיעוד; ההמלצה הכללית בתיעוד: "design for short-lived, idempotent operations" ([Edge Functions](https://supabase.com/docs/guides/functions)). המימוש הוא שלנו.

### 5.2 למה זה חשוב לנו

- `lead-intake` ו-`chat-bot` נקראים מגולשים אנונימיים: אין JWT, ולכן `verify_jwt = false` + אימות Turnstile + Origin allowlist בקוד + rate limit לסשן. המפתח `sb_publishable_` שהדפדפן שולח **לא** מאמת דבר.
- `notify-worker`, `fetch-cma-data`, `sync-tracks` נקראים מ-pg_cron/pg_net: `auth: 'secret:automations'` (מפתח secret נפרד שניתן לסובב בלי לפגוע באפליקציה).
- `surense-webhook`: webhook חיצוני חתום על ידי Surense: `auth: 'none'` + אימות חתימה (חוזה החתימה של Surense: **לא אומת**, לבדוק מול הספק) + idempotency key (`event_id`).
- `auth-send-sms`: hook של Auth, חתום Standard Webhooks.
- `invite-agent`: `auth: 'user'` + בדיקת `user_role in ('manager','super_admin')` + `aal2`.
- CPU 2 שניות לבקשה: רענון 40 אלף שורות קרנות לא רץ בפונקציה אחת בלולאה; הפונקציה מושכת קובץ ומבצעת `upsert` באצוות דרך PostgREST, או מכניסה לתור ו-worker מעבד אצוות קצרות (`EVENT-ARCHITECTURE.md`).
- פורט 587 חסום: מיילים רק דרך HTTP API של Resend, לא SMTP.

### 5.3 ההחלטה/הסטנדרט שלנו

1. **כל פונקציה ב-`@supabase/server`** (`withSupabase`), `deno.json` לכל פונקציה, קוד משותף ב-`_shared/` (`origin.ts`, `turnstile.ts`, `idempotency.ts`, `errors.ts`, `resend.ts`).
2. **מצבי אימות קבועים בטבלה** (ראו config למטה). `verify_jwt = true` רק לפונקציות שנקראות מ-`supabase.functions.invoke` עם משתמש מחובר.
3. **CORS allowlist:** `ALLOWED_ORIGINS` ב-secrets (`https://seeld.co.il,https://www.seeld.co.il` + דומייני preview לפי regex); החזרת `Access-Control-Allow-Origin` רק אם ה-Origin ברשימה, אחרת 403; preflight דרך `withSupabase` או `corsHeaders` מה-SDK עם החלפת ה-Origin.
4. **אידמפוטנטיות:** כותרת `Idempotency-Key` (או `event_id` של הספק) → טבלה `platform.idempotency_keys (key text primary key, response jsonb, created_at)` עם TTL 48 שעות ב-pg_cron; `insert ... on conflict do nothing` ואם קיים מחזירים את התשובה השמורה (כפי שנקבע ב-`EVENT-ARCHITECTURE.md`).
5. **סודות:** שמות ללא `SUPABASE_`; מפתח secret נפרד `automations` לקריאות מהמסד; `RESEND_API_KEY`, `GEMINI_API_KEY`, `TURNSTILE_SECRET`, `SEND_SMS_HOOK_SECRET`, `SURENSE_WEBHOOK_SECRET`, `SMS_GATEWAY_*`. מקומית `supabase/functions/.env` ב-`.gitignore`.
6. **אזור:** פונקציות שעובדות מול DB (worker, sync, webhook) נקראות עם `x-region: eu-central-1`/`forceFunctionRegion=eu-central-1`; פונקציות למשתמש (צ'אט) נשארות "הקרוב למשתמש".
7. **רקע:** שליחת מייל/התראה אחרי קליטת ליד ב-`EdgeRuntime.waitUntil`, אבל *מצב* הליד נכתב ל-DB לפני התשובה (אם הפונקציה נופלת, ה-cron `notify-worker` ישלים מהתור).
8. **לוגים:** JSON בשורה אחת, `requestId`, בלי PII (מזהים בלבד); Log Drain אחד ל-Grafana Cloud/Loki כשנגיע לפרודקשן (60$ לחודש, פרק 9) או ייצוא דרך Metrics API בלבד בהתחלה.
9. **בדיקות:** Deno test לכל פונקציה (`supabase/functions/tests/`), ו-`supabase functions serve --env-file supabase/functions/.env` מקומית.

### 5.4 פקודות או קוד

```toml
# supabase/config.toml: Edge Functions
[edge_runtime]
enabled = true
policy = "per_worker"      # נדרש מקומית למשימות רקע
deno_version = 2           # לא אומת כמפתח reference; מופיע בדוגמה רשמית

[functions.lead-intake]      # גולש אנונימי; Turnstile + Origin + rate limit בקוד
verify_jwt = false
[functions.chat-bot]         # גולש אנונימי; Gemini; rate limit לסשן
verify_jwt = false
[functions.surense-webhook]  # webhook חיצוני; auth:'none' + חתימה בקוד
verify_jwt = false
[functions.auth-send-sms]    # Auth hook; Standard Webhooks בקוד
verify_jwt = false
[functions.notify-worker]    # pg_cron/pg_net עם secret 'automations'
verify_jwt = false
[functions.fetch-cma-data]
verify_jwt = false
[functions.sync-tracks]
verify_jwt = false
[functions.invite-agent]     # משתמש מחובר manager/super_admin + aal2
verify_jwt = true
```

```ts
// supabase/functions/_shared/origin.ts
export function corsFor(req: Request) {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim())
  const origin = req.headers.get('origin') ?? ''
  const ok = allowed.includes(origin) || /^https:\/\/seeld-[a-z0-9-]+\.vercel\.app$/.test(origin)
  return { ok, headers: ok ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {} }
}
```

```ts
// supabase/functions/lead-intake/index.ts
import { withSupabase } from 'npm:@supabase/server@1'
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'
import { corsFor } from '../_shared/origin.ts'
import { verifyTurnstile } from '../_shared/turnstile.ts'

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const { ok, headers } = corsFor(req)
    if (req.method === 'OPTIONS') return new Response(null, { headers: { ...corsHeaders, ...headers } })
    if (!ok) return new Response('forbidden', { status: 403 })

    const body = await req.json()
    if (!(await verifyTurnstile(body.turnstileToken, req.headers.get('cf-connecting-ip')))) {
      return Response.json({ error: { code: 'captcha_failed' } }, { status: 400, headers })
    }
    const idem = req.headers.get('idempotency-key') ?? crypto.randomUUID()
    const { data, error } = await ctx.supabaseAdmin.schema('platform').rpc('intake_lead', { p_idempotency_key: idem, p_payload: body })
    if (error) return Response.json({ error: { code: 'intake_failed' } }, { status: 500, headers })

    EdgeRuntime.waitUntil(ctx.supabaseAdmin.schema('platform').rpc('enqueue_notification', { p_lead_id: data }))
    return Response.json({ id: data }, { status: 201, headers })
  }),
}
```

```ts
// supabase/functions/notify-worker/index.ts (נקרא מ-pg_cron עם apikey = secret 'automations')
import { withSupabase } from 'npm:@supabase/server@1'
export default {
  fetch: withSupabase({ auth: 'secret:automations' }, async (_req, ctx) => {
    const { data: msgs } = await ctx.supabaseAdmin.schema('pgmq_public').rpc('read', { queue_name: 'notifications', sleep_seconds: 60, n: 10 })
    for (const m of msgs ?? []) {
      try {
        await sendWithResend(m.message)                // fetch api.resend.com, RESEND_API_KEY
        await ctx.supabaseAdmin.schema('pgmq_public').rpc('archive', { queue_name: 'notifications', message_id: m.msg_id })
      } catch (e) {
        console.error(JSON.stringify({ msg_id: m.msg_id, err: String(e) }))   // חוזר לתור אחרי vt
      }
    }
    return Response.json({ processed: msgs?.length ?? 0 })
  }),
}
```

```sql
-- תזמון worker כל דקה, סודות ב-Vault
select vault.create_secret('https://<REF>.supabase.co', 'project_url');
select vault.create_secret('sb_secret_...', 'automations_key');
select cron.schedule('notify-worker-every-minute', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/notify-worker?forceFunctionRegion=eu-central-1',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'automations_key')),
    body := jsonb_build_object('t', now()),
    timeout_milliseconds := 5000
  ) as request_id;
$$);
```

```bash
supabase functions new lead-intake
supabase functions serve --env-file supabase/functions/.env          # מקומי
supabase secrets set --env-file ./supabase/functions/.env.production  # פרודקשן (Owner/Admin)
supabase secrets list
supabase functions deploy                                            # כל הפונקציות לפי config.toml
```

---

## 6. Storage

### 6.1 מה אומר התיעוד (2026)

**Buckets.** פרטיים כברירת מחדל: כל פעולה כפופה ל-RLS על `storage.objects`, כולל הורדה. ציבורי: קריאה פתוחה לכל מי שיש לו URL (העלאה/מחיקה עדיין נשלטות ב-RLS), ו-cache טוב יותר ב-CDN. מקור: [Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

**RLS על `storage.objects`.** בלי policies אין העלאה בכלל. העלאה = `insert`; `upsert` דורש גם `select` ו-`update`. פונקציות עזר: `storage.foldername(name)`, `storage.filename(name)`, `storage.extension(name)`, ו-`storage.allow_only_operation('object.list')` / `storage.allow_any_operation(array[...])` כדי להבדיל בין listing לקריאה. דוגמאות רשמיות: תיקייה לפי `(storage.foldername(name))[1] = (select auth.jwt()->>'sub')`; קריאה לבעלים `(select auth.jwt()->>'sub') = owner_id`. מפתח secret ב-`Authorization` עוקף RLS. **אסור** לשנות את סכמת `storage` (למעט הוספת אינדקסים). מקור: [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control), [Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions), [The Storage Schema](https://supabase.com/docs/guides/storage/schema/design).

**הגשה.** ציבורי: `/storage/v1/object/public/<bucket>/<path>`; פרטי: signed URL מוגבל בזמן (`createSignedUrl`, גם עם `transform`) או `GET /storage/v1/object/authenticated/<bucket>/<path>` עם JWT. **אי אפשר לבטל signed URL בודד**; לביטול כולם מסובבים את URL signing key של Storage (נפרד ממפתחות Auth). `?download=name.pdf` לכפיית הורדה. מקור: [Serving assets](https://supabase.com/docs/guides/storage/serving/downloads), [Storage URL Signing Keys](https://supabase.com/docs/guides/storage/security/signing-keys).

**העלאות.** Standard upload (multipart) מתאים לקבצים עד ~6MB; מעבר לכך TUS (resumable). `upsert: true` כדי לדרוס; `contentType` מפורש. **Presigned uploads:** `createSignedUploadUrl(path)` בשרת → `uploadToSignedUrl(path, token, file)` בלקוח. מקור: [Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads).

**מגבלות.** Global file size limit: Pro עד 500GB (Free 50MB), ברירת מחדל מקומית `50MiB`; פר-bucket: `fileSizeLimit` ו-`allowedMimeTypes` (`createBucket('docs', { public: false, allowedMimeTypes: ['application/pdf'], fileSizeLimit: '10MB' })` או `[storage.buckets.<name>]` ב-`config.toml`). שמות קבצים: אלפאנומרי, `_ - . ' ,`, סימנים `! * & $ @ = ; : + ? ( )` ורווח. מקור: [Storage upload limits](https://supabase.com/docs/guides/storage/uploads/file-limits), [Creating Buckets](https://supabase.com/docs/guides/storage/buckets/creating-buckets), [CLI config](https://supabase.com/docs/guides/local-development/cli/config).

**Image transformations.** Pro ומעלה; `getPublicUrl/createSignedUrl` עם `transform: { width, height }`; ניתן לכבות בהגדרות; מחויב בנפרד. מקור: [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations), [Manage Image Transformations usage](https://supabase.com/docs/guides/platform/manage-your-usage/storage-image-transformations).

**מחיקה ו-retention.** מחיקה **רק דרך ה-API** (`storage.from(b).remove([...])`, עד 1000 בבת אחת); מחיקה ב-SQL משאירה אובייקט יתום שמחויב. ריקון bucket גדול: `aws s3 sync empty-dir/ s3://bucket --delete` עם S3 credentials של Supabase. **לא אומת:** לא נמצאו כללי lifecycle/retention מובנים בתיעוד; retention ממומש אצלנו (pg_cron → Edge Function → `remove`). מקור: [Delete Objects](https://supabase.com/docs/guides/storage/management/delete-objects).

**גיבויים.** גיבויי המסד **לא כוללים אובייקטי Storage** (רק מטא-דאטה). שחזור גיבוי לא מחזיר קבצים שנמחקו. מקור: [Database Backups](https://supabase.com/docs/guides/platform/backups).

### 6.2 למה זה חשוב לנו

- מסמכי לקוחות (פוליסות, טפסים) הם PII רגיש: bucket פרטי, נתיב לפי `owner_id`/`client_id` (לא ת"ז), signed URLs קצרים, סוג וגודל מוגבלים ברמת bucket (לא רק בקוד).
- אין גיבוי אוטומטי לקבצים: צריך העתקה תקופתית (S3 sync) או קבלת הסיכון במסמך ההחלטות.
- העלאה מהפורטל: לא ישירות מהדפדפן עם RLS מורכב, אלא דרך signed upload URL שהשרת מייצר אחרי בדיקת זכאות (פחות policies, יותר שליטה).

### 6.3 ההחלטה/הסטנדרט שלנו

1. **Buckets:** `client-docs` (פרטי, `application/pdf,image/jpeg,image/png`, 10MB), `agent-uploads` (פרטי, 25MB), `public-assets` (ציבורי, תמונות בלוג, `image/*`, 5MB). מוצהרים ב-`config.toml` (נפרסים ב-"Deploy to production") **וגם** במיגרציה (`insert into storage.buckets ... on conflict do nothing`) כי הדקלרטיבי לא עוקב שורות.
2. **נתיב:** `client-docs/<client_uuid>/<doc_uuid>.<ext>`; מטא-דאטה (שם מקורי, סוג, hash, מי העלה) בטבלת `platform.document`; `storage.objects.name` לעולם לא מכיל ת"ז או שם.
3. **קריאה:** רק signed URLs ל-5 דקות שמיוצרים ב-RPC/Edge Function אחרי בדיקת זכאות (`owner` או סוכן משויך); אין policy `select` ל-`authenticated` על `client-docs` (מונע listing).
4. **כתיבה:** `createSignedUploadUrl` מהשרת; policy `insert` ל-`authenticated` מצומצמת לתיקיית ה-`sub` כקו הגנה שני (אם יוחלט על העלאה ישירה).
5. **Retention:** 7 שנים למסמכי פוליסה (דרישה רגולטורית: **לא אומת** במסמך זה, לקביעת הבעלים), מחיקה ב-pg_cron דרך Edge Function בלבד; מסמכי לידים שלא הפכו ללקוחות: 90 יום.
6. **גיבוי קבצים:** job חודשי `aws s3 sync` לדלי שלנו (או קבלת סיכון) — החלטת בעלים.
7. **Image transformations:** כבוי עד שיש צורך (עלות).

### 6.4 פקודות או קוד

```toml
# supabase/config.toml
[storage]
enabled = true
file_size_limit = "25MiB"

[storage.buckets.client-docs]
public = false
file_size_limit = "10MiB"
allowed_mime_types = ["application/pdf", "image/jpeg", "image/png"]

[storage.buckets.public-assets]
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/*"]
```

```sql
-- מיגרציה: buckets (DML, לא דקלרטיבי) + policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-docs', 'client-docs', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- קריאה: אין policy ל-authenticated; הגשה רק ב-signed URL מהשרת (service role)
-- כתיבה ישירה (אם תאושר): רק לתיקיית ה-sub של המשתמש
create policy "client uploads to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-docs'
  and (storage.foldername(name))[1] = (select auth.jwt()->>'sub')
);
create index if not exists storage_objects_owner_idx on storage.objects (bucket_id, owner_id);
```

```ts
// RPC/Edge: קישור קריאה קצר אחרי בדיקת זכאות
const { data, error } = await ctx.supabaseAdmin.storage
  .from('client-docs')
  .createSignedUrl(`${clientId}/${docId}.pdf`, 300, { download: 'policy.pdf' })

// העלאה דרך token חתום
const { data: up } = await ctx.supabaseAdmin.storage.from('client-docs').createSignedUploadUrl(`${clientId}/${docId}.pdf`)
// בלקוח:
await supabase.storage.from('client-docs').uploadToSignedUrl(path, up.token, file, { contentType: 'application/pdf' })
```

---

## 7. תורים ומשימות: pgmq, pg_cron, pg_net

### 7.1 מה אומר התיעוד (2026)

**Supabase Queues (pgmq).** תור pull-based, FIFO בלי עדיפויות, "exactly once within a visibility window", הודעות הן JSON שנשמרות עד שהצרכן מוחק/מארכב. שני סוגים: **Basic** (טבלה logged, עמידה) ו-**Unlogged** (מהיר יותר, עלול לאבד הודעות). כל תור יוצר `pgmq.q_<name>` ו-`pgmq.a_<name>` (ארכיון). דורש Postgres 15.6.1.143+. ניהול: Dashboard > Integrations > Queues. שמות תור: אותיות קטנות, מקפים וקו תחתון. מקור: [Queues Quickstart](https://supabase.com/docs/guides/queues/quickstart), [Supabase Queues](https://supabase.com/docs/guides/queues).

**API.** בסכמה `pgmq_public` (נוצרת כשמפעילים **Expose Queues via PostgREST**): `send(queue_name, message, sleep_seconds)`, `send_batch(queue_name, messages[], sleep_seconds)`, `read(queue_name, sleep_seconds, n)` (visibility timeout = `sleep_seconds`), `pop(queue_name)` (קורא ומוחק), `archive(queue_name, message_id)`, `delete(queue_name, message_id)`. אין בה יצירה/מחיקה של תורים. הודעה שנקראה חוזרת: `msg_id`, `read_ct`, `vt`, `enqueued_at`, `message`. מקור: [Queues API](https://supabase.com/docs/guides/queues/api), [Consuming with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions).

**חשיפה ללקוחות (אם בכלל).** ברירת מחדל: התורים **לא** חשופים ב-Data API; אם חושפים, חובה RLS על כל `pgmq.q_*` (lint `0019_insecure_queue_exposed_in_api`, ERROR) ו-grants לפונקציות `pgmq_public` לפי פעולה: `send/send_batch` = Select+Insert; `read/pop` = Select+Update; `archive/delete` = Select+Delete. לעולם לא `postgres`/`service_role` בצד לקוח. מקור: [Expose Queues to client-side consumers](https://supabase.com/docs/guides/queues/quickstart#expose-queues-to-client-side-consumers), [Advisors 0019](https://supabase.com/docs/guides/observability/advisors).

**Retries ו-DLQ.** בתיעוד Supabase: הודעה שלא נמחקה/אורכבה חוזרת להיות נראית אחרי ה-visibility timeout; השדה `read_ct` סופר קריאות. **אין DLQ מובנה בתיעוד Supabase** (**לא אומת** מעבר לכך; pgmq עצמו מתעד `archive` ו-`set_vt`). מקור: [Consuming with Edge Functions](https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions).

**pg_cron.** `cron.schedule(name, schedule, command)`; תחביר cron רגיל או שניות (`'30 seconds'`, 1 עד 59, דורש Postgres 15.1.1.61+); שמות case-sensitive, לא ניתנים לעריכה, ו-`cron.schedule` עם אותו שם מחליף (upsert); `cron.alter_job(job_id, schedule, command, active...)`; `cron.unschedule(name)`. היסטוריה ב-`cron.job_run_details` **לא מתנקה אוטומטית** (גם לא אחרי unschedule); לתזמן ניקוי. המלצה: לא יותר מ-8 jobs במקביל, כל job עד 10 דקות. דוגמה רשמית לקריאת Edge Function כל 30 שניות עם `net.http_post`. מקור: [Cron](https://supabase.com/docs/guides/cron), [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart).

**pg_net.** HTTP אסינכרוני מ-SQL: `net.http_get(url, params, headers, timeout_milliseconds)`, `net.http_post(url, body jsonb, params, headers, timeout_milliseconds)` (ברירת מחדל timeout 2000ms), `net.http_delete`. הבקשות **נשלחות רק ב-commit**; מחזירות `request_id`. תשובות נשמרות 6 שעות ב-`net._http_response` (unlogged, נעלם ב-crash); `select * from net._http_response where status_code >= 400 or error_msg is not null` לאיתור כשלים. מגבלות: עד ~200 בקשות לשנייה; POST רק עם JSON; אין PATCH/PUT; API בבטא. סכמה `net` לא חשופה ב-Data API; `anon`/`authenticated` הם `NOLOGIN`. להתקין `with schema extensions` (האובייקטים נוצרים ב-`net`). **אין retry מובנה בתיעוד** (**לא אומת**). מקור: [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).

**Database Webhooks** = טריגרים על pg_net; קריאה ל-Edge Function עם מפתח secret ב-`apikey` (`auth: 'secret'`, `verify_jwt = false`); המפתח נשמר בהגדרת הטריגר (ולכן ב-dump), אלא אם משתמשים ב-Vault במיגרציה. מקור: [Database Webhooks](https://supabase.com/docs/guides/database/webhooks).

**Vault.** `vault.create_secret(secret, name, description)`; קריאה דרך `vault.decrypted_secrets`; מוצפן על הדיסק ובגיבויים; מפתח השורש נשמר בפרויקט (מועתק ב-branching וב-"Restore to a new project", אבל **לא** בשחזור ידני עם pg_dump). מקור: [Vault](https://supabase.com/docs/guides/database/vault), [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

### 7.2 למה זה חשוב לנו

- `EVENT-ARCHITECTURE.md` כבר קבע: תור `surense_outbound` ועוד תורים, worker שמושך אצווה קצרה, lease מבוסס `queue_claim` עם `max_attempts` → `poison` → DLQ (ארכיון), **בלי** להסתמך על `read_ct` (סופר גם דילוגים תמימים). המסמך הזה מאשר שהתיעוד לא מספק DLQ מובנה, אז ההחלטה שלנו נכונה.
- התורים לעולם לא נחשפים ב-PostgREST ללקוח; רק Edge Functions עם secret.
- pg_net כותב מפתח מפוענח לתור הבקשות; מפתח `automations` נפרד מצמצם נזק.
- `cron.job_run_details` גדל: בטוקיו כבר נוספה משימת ניקוי יומית; גם בפרנקפורט.

### 7.3 ההחלטה/הסטנדרט שלנו

1. **תורים (Basic/logged):** `notifications` (מייל/SMS ללידים), `surense_outbound`, `salesforce_outbound`, `fund_sync` (אצוות של 500 שורות). אין `pgmq_public` חשוף ל-`anon`/`authenticated`; ה-worker משתמש ב-`service_role` דרך `ctx.supabaseAdmin`.
2. **ניסיון חוזר:** `read` עם visibility 60–300 שניות לפי סוג; הודעה שנכשלה חוזרת אוטומטית; אחרי `max_attempts` (3–5) ה-worker קורא ל-`archive` ומסמן ב-`platform.dead_letters` (זהו ה-DLQ שלנו, עם מסך ב-ops console).
3. **pg_cron:** כל job מוגדר במיגרציה אידמפוטנטית (`cron.schedule` באותו שם = upsert); שמות קבועים: `notify-worker-1m`, `fund-sync-daily-0300`, `cleanup-cron-history-daily`, `cleanup-idempotency-keys-hourly`, `metrics-fold-1m`. לא יותר מ-8 במקביל.
4. **pg_net:** timeout מפורש (5000ms), בדיקת כשלים יומית מ-`net._http_response` לתוך `platform.alerts`; כל קריאה ל-Edge Function עם `forceFunctionRegion=eu-central-1`.
5. **Vault:** `project_url`, `automations_key`, `national_id_hmac_key`, `national_id_enc_key`, `event_hash_key`; סבב מפתחות בהחלטת בעלים; **לפני כל מעבר פרויקט מעתיקים את מפתח השורש** (פרק 12).

### 7.4 פקודות או קוד

```sql
-- מיגרציה: הרחבות ותורים
create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select pgmq.create('notifications');       -- לא אומת: חתימה מדויקת של pgmq.create ב-pgmq העדכני; ה-Dashboard יוצר תורים גם כן
select pgmq.create('fund_sync');

-- שליחה מתוך RPC (service role בלבד; פונקציה ב-platform)
create or replace function platform.enqueue_notification(p_lead_id uuid)
returns bigint language sql security definer set search_path = '' as $$
  select pgmq.send('notifications', jsonb_build_object('lead_id', p_lead_id, 'kind', 'new_lead'))
$$;
revoke execute on function platform.enqueue_notification(uuid) from public, anon, authenticated;

-- ניקוי היסטוריית cron (לפי התיעוד)
select cron.schedule('cleanup-cron-history-daily', '0 3 * * *',
  $$ delete from cron.job_run_details where end_time < now() - interval '30 days' $$);

-- ניקוי מפתחות אידמפוטנטיות
select cron.schedule('cleanup-idempotency-keys-hourly', '15 * * * *',
  $$ delete from platform.idempotency_keys where created_at < now() - interval '48 hours' $$);

-- בדיקת כשלי pg_net
select id, status_code, error_msg, created from net._http_response
where status_code >= 400 or error_msg is not null order by created desc limit 50;
```

---

## 8. Realtime

### 8.1 מה אומר התיעוד (2026)

- שתי דרכים להאזין לשינויים: **Broadcast** (מומלץ, "for scalability and security") ו-**Postgres Changes** (פשוט יותר אבל לא מתרחב). מקור: [Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
- **Broadcast מהמסד:** `realtime.send(payload, event, topic, private)` או טריגר שקורא `realtime.broadcast_changes(topic, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD)`; הודעות נשמרות ב-`realtime.messages` **3 ימים**; `private => true` כברירת מחדל ודורש התאמה לערוץ פרטי בלקוח (`channel('x', { config: { private: true } })`). מקור: [Broadcast](https://supabase.com/docs/guides/realtime/broadcast).
- **הרשאה:** policies על `realtime.messages` (`select` = לקבל, `insert` = לשלוח) עם `realtime.topic()` ו-`realtime.messages.extension in ('broadcast','presence')`; כדי לאכוף ערוצים פרטיים יש לכבות **Allow public access** ב-Realtime Settings. RLS כבר מופעל על `realtime.messages`; **אסור** לכתוב `alter table realtime.messages enable row level security` במיגרציה (נכשל ב-`42501 must be owner` ומפיל את כל המיגרציה). ה-policies **נשמרות במטמון לכל החיבור** עד רענון JWT, לכן JWT קצר. מקור: [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization).
- **Postgres Changes:** דורש הוספת טבלאות ל-publication `supabase_realtime`; כל אירוע עובר בדיקת הרשאה **לכל מנוי** ובחוט יחיד, ולכן compute גדול לא עוזר; RLS לא מסנן אירועי `DELETE` (ראו גם [production checklist](https://supabase.com/docs/guides/security/production-checklist#database)); סינון `DELETE` דורש `replica identity full`. מקור: [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
- חיבורי Realtime ציבוריים עם מפתח publishable מוגבלים ל-24 שעות אלא אם משתמש מתחבר. מקור: [API keys: Known limitations](https://supabase.com/docs/guides/api/api-keys#known-limitations).

### 8.2 למה זה חשוב לנו

האתר הציבורי מרונדר מראש ואין בו צורך ב-Realtime. השימוש היחיד הסביר: לוח התפעול (ops console) שרוצה לראות לידים חדשים ובריאות תורים בלי polling. בטוקיו הייתה publication פתוחה; זה סיכון (DELETE לא מסונן ב-RLS).

### 8.3 ההחלטה/הסטנדרט שלנו

1. **Realtime כבוי כברירת מחדל** לכל טבלה: publication `supabase_realtime` ריקה. אין Postgres Changes.
2. אם ה-ops console יצטרך עדכונים חיים: **Broadcast פרטי** בלבד, טריגר `after insert on platform.lead` שקורא `realtime.broadcast_changes('agency:' || agency_id, ...)`, policy `select` על `realtime.messages` לתפקידי `manager/super_admin` לפי `realtime.topic()`; "Allow public access" כבוי.
3. אחרת: polling כל 60 שניות ל-RPC `get_queue_health` (כבר קיים לפי `OPS-CONSOLE.md`), זול ופשוט.

### 8.4 פקודות או קוד

```sql
-- publication ריקה (אין Postgres Changes)
begin;
drop publication if exists supabase_realtime;
create publication supabase_realtime;
commit;

-- אם יוחלט על Broadcast ללוח התפעול:
create policy "ops can receive agency broadcasts"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select private.current_role()) in ('manager','super_admin')
  and (select realtime.topic()) = 'agency:' || (select auth.jwt()->>'agency_id')
);

create or replace function platform.lead_broadcast()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.broadcast_changes('agency:' || new.agency_id::text, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;
create trigger lead_broadcast after insert or update on platform.lead
for each row execute function platform.lead_broadcast();
```

---

## 9. תפעול

### 9.1 מה אומר התיעוד (2026)

**Compute.** כל פרויקט = Postgres ייעודי. גדלים ומחירים (USD לחודש בקירוב): Micro ~10 (1GB RAM, shared CPU, עד 10GB DB מומלץ), Small ~15 (2GB, עד 50GB), Medium ~60 (4GB, עד 100GB), Large ~110 (8GB, 2 vCPU dedicated, עד 200GB), XL ~210 (16GB, 4 vCPU), 2XL ~410, 4XL ~960. שינוי compute: בדרך כלל פחות מ-2 דקות downtime. חיבורים לפי גודל: Micro 60 ישירים / 200 לקוחות pooler / pool 15; Small 90/400/15; Medium 120/600/15; Large 160/800/20; XL 240/1,000/20. מקור: [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk).

**Disk IO budget.** ברירת המחדל gp3: 125MB/s ו-3,000 IOPS, 8GB כלולים ואז 0.125$ ל-GB. ה-IOPS/throughput האפקטיביים = המינימום בין מה שה-compute מאפשר למה שהדיסק מספק. לפי compute: Micro baseline 11MB/s / 500 IOPS, burst עד 261MB/s / 11,800 IOPS; Small 22MB/s / 1,000; Medium 39MB/s / 2,000; Large 79MB/s / 3,600 (burst 594MB/s / 20,000); 4XL ומעלה "sustained". **עד 2XL הפרויקט יכול לפרוץ (burst) מעל ה-baseline לזמן קצר על חשבון Disk IO budget; כשהתקציב נגמר, הביצועים חוזרים ל-baseline.** מדד **Disk IO balance** ב-Observability (100% = מלא, 0% = נגמר; ממוצע לחלון, יכול להסתיר דקות של 0%); הערך הנמוך ביותר ב-7 ימים ב-Infrastructure settings. אחרי כל שינוי דיסק: cooldown ~4 שעות; אפשר להגדיל דיסק אך לא להקטין; הגדלת IOPS/throughput דורשת Large ומעלה ועולה כסף. מקור: [Compute and Disk: Disk](https://supabase.com/docs/guides/platform/compute-and-disk#disk), [Manage Disk Throughput usage](https://supabase.com/docs/guides/platform/manage-your-usage/disk-throughput), [Manage Disk size usage](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size).

**אבחון שאילתות.** `pg_stat_statements` (סטטיסטיקות לכל שאילתה מנורמלת), Query Performance ו-Performance Advisor ב-Dashboard, `explain()` ל-Data API, `pg_stat_activity` לחיבורים. Reports ב-Observability. מקור: [pg_stat_statements](https://supabase.com/docs/guides/database/extensions/pg_stat_statements), [Performance Tuning](https://supabase.com/docs/guides/platform/performance), [Query plans with explain()](https://supabase.com/docs/guides/api/rest/debugging-performance).

**Supavisor ו-pooling.** בחירה לפי מקום הקוד: frontend → Data API; serverless/edge → **shared pooler, transaction mode, פורט 6543** (`postgresql://postgres.[REF]:[PWD]@[POOLER-HOST]:6543/postgres`); backend קבוע על IPv6 (או IPv4 add-on) → חיבור ישיר `db.[REF].supabase.co:5432`; backend/כלי BI על IPv4 → **shared pooler, session mode, פורט 5432**. ה-shared pooler הוא IPv4 בלבד; **dedicated pooler (PgBouncer) זמין ב-Pro** ליד המסד (IPv6 או IPv4 add-on). Transaction mode: בלי prepared statements (`prepare: false`, `pgbouncer=true` ל-Prisma, `statement_cache_size=0` ל-asyncpg), בלי `set`/`listen`/temp tables/cursors חוצי טרנזקציה, בלי pipelining. Pool size מוגדר **לכל תפקיד** ב-Database settings; כלל: ישירים + backend של שני ה-poolers < max connections של ה-compute, ולהשאיר מקום ל-Auth/Storage/PostgREST; עם PostgREST כבד לא לעבור 40% מה-max. SSL: `sslmode=require` לפחות; `verify-full` + `sslrootcert` לאימות שרת. מקור: [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres), [Connection pooling and limits](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits), [Connection management](https://supabase.com/docs/guides/database/connection-management).

**גיבויים.** Pro: גיבוי יומי, 7 ימים אחורה (Team 14, Enterprise 30). פרויקטים על Postgres 15.8.1.079+ משתמשים ב-physical backups. גיבויים **לא כוללים Storage objects** ולא סיסמאות של תפקידים מותאמים. שחזור = downtime (תלוי גודל); subscriptions/replication slots יש להסיר ולהקים מחדש. **PITR** (add-on): snapshot יומי + WAL כל 2 דקות (RPO 2 דקות), מכבה גיבויים יומיים; תמחור: 7 ימים ~100$ לחודש, 14 ימים ~200$, 28 ימים ~400$; מחויב לפי שעה; **לא מכוסה ב-Spend Cap**. **Restore to a new project** (שיבוט): לפרויקטים בתשלום עם physical backups; מעתיק סכמה, נתונים, תפקידים, משתמשי Auth כולל hash סיסמאות, ומפתח ההצפנה של Vault; **לא** מעתיק Storage objects, Edge Functions, הגדרות Auth/API keys/Realtime, הרחבות; **הנתונים נשארים באותו אזור**. מקור: [Database Backups](https://supabase.com/docs/guides/platform/backups), [Manage PITR usage](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery), [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project).

**Log drains.** Pro ומעלה; יעדים: Custom HTTP, OTLP, Datadog, Loki, S3, Sentry, Axiom, Last9, Syslog; אצוות של 250 אירועים או שנייה. עלות: 60$ לחודש לכל drain (0.0822$ לשעה) + 0.20$ למיליון אירועים + egress; **לא מכוסה ב-Spend Cap**. שמירת לוגים ב-Pro: 7 ימים. מקור: [Log Drains](https://supabase.com/docs/guides/observability/log-drains), [Manage Log Drain usage](https://supabase.com/docs/guides/platform/manage-your-usage/log-drains), [Pricing](https://supabase.com/pricing).

**Advisors.** בדיקות דטרמיניסטיות: Health (שיעורי שגיאה ב-Data API/Auth/Storage/Edge), Security, Performance; גישה דרך Studio, MCP `get_advisors`, CLI `supabase db advisors`, Management API. רשימת lints בפרקים 2–3; בנוסף `0001_unindexed_foreign_keys`, `0004_no_primary_key`, `0005_unused_index`, `0009_duplicate_index`, `0011_function_search_path_mutable`, `0020_table_bloat`, `0021_fkey_to_auth_unique` (ERROR: FK ל-unique שאינו PK ב-`auth` חוסם שדרוגי Auth), `0022_extension_versions_outdated`, `0025_public_bucket_allows_listing`, `0030_autovacuum_disabled`. מקור: [Advisors](https://supabase.com/docs/guides/observability/advisors).

**SSL enforcement.** חוסם חיבורי Postgres/pooler ללא SSL (שני צדי ה-pooler); ה-HTTP APIs תמיד TLS 1.2/1.3; ההפעלה גורמת reboot קצר. Dashboard > Database > Settings > SSL Configuration, או `PUT /v1/projects/{ref}/ssl-enforcement`. מקור: [SSL Enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement).

**Network restrictions.** allowlist של CIDR ל-Postgres ול-pooler (לא ל-HTTP APIs); נאכף לפני הגעת התעבורה; Owner/Admin; יש להוסיף גם IPv6 וגם IPv4 אם אין IPv4 add-on. מקור: [Network Restrictions](https://supabase.com/docs/guides/platform/network-restrictions).

**Custom domain.** add-on 10$ לחודש (0.0137$ לשעה); CNAME בלבד; דומיין אחד לפרויקט; שימושי לניידות API (`api.seeld.co.il` במקום `<ref>.supabase.co`) ולמסכי OAuth; **לא** נועד להגשת frontend. חלופה: vanity subdomain (ניסיוני). מקור: [Custom Domains](https://supabase.com/docs/guides/platform/custom-domains), [Manage Custom Domain usage](https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains).

**Read replicas.** מסדים לקריאה בלבד עם replication lag; רלוונטי ל-CPU מעל 70% מתמשך, עומס 80%+ קריאות, או geo-distribution; לא רלוונטי לנו. מקור: [Read Replicas](https://supabase.com/docs/guides/platform/read-replicas).

**ניטור והתראות.** Metrics API תואם Prometheus: `https://<ref>.supabase.co/customer/v1/privileged/metrics`, Basic Auth `service_role:<sb_secret_...>`, ~200 סדרות, scrape פעם בדקה; אינטגרציית Grafana Cloud בקליק ודשבורד `supabase-grafana` מוכן. Advanced Telemetry ב-Dashboard: Teams ומעלה. **לא אומת:** התראות מובנות (email/Slack) מהפלטפורמה ל-Pro מלבד Health Advisors. מקור: [Metrics API](https://supabase.com/docs/guides/observability/metrics), [Connection management](https://supabase.com/docs/guides/database/connection-management).

### 9.2 למה זה חשוב לנו

- **מה צורך Disk IO אצלנו:** רענון 40 אלף שורות קרנות (WAL + אינדקסים), סריקות מלאות של טבלת הקרנות מהאתר (בלי אינדקס/מסנן), `VACUUM` אחרי מחיקות המוניות, בניית אינדקסים, ו-`cron.job_run_details` שגדל. על Micro ה-baseline הוא 11MB/s; רענון יומי של 40 אלף שורות ב-`TRUNCATE + COPY` או `upsert` באצוות אמור להסתיים בתקציב, אבל כמה ימים של burst רציף ירוקנו אותו. Small (22MB/s, 2GB RAM) נותן מרווח.
- Edge Functions מתחברות דרך `supabase-js` (HTTP), לא ב-Postgres ישיר, ולכן ה-pool הקטן של Micro/Small מספיק; אם נשתמש ב-driver ישיר ב-worker: transaction pooler, `max: 1`.
- גיבוי יומי של 7 ימים מספיק לשלב האתר; כשהפורטל יחזיק מסמכי לקוחות: PITR 7 ימים (100$ לחודש) או קבלת סיכון של עד 24 שעות נתונים.

### 9.3 ההחלטה/הסטנדרט שלנו

1. **Compute:** להתחיל ב-**Small** (~15$, 2GB) ולא Micro: מרווח IO ו-RAM לרענון הקרנות; לבדוק Disk IO balance אחרי שבועיים; Medium רק אם ה-balance יורד מתחת ל-30% באופן חוזר.
2. **דיסק:** gp3 ברירת מחדל, 8GB; אין הגדלה ידנית לפני 60% תפוסה (לא ניתן להקטין).
3. **חיבורים:** האתר דרך Data API; פונקציות דרך `supabase-js`; כלי אדמין (psql/DBeaver) דרך session pooler 5432 ברשת מורשית; `sslmode=verify-full` עם התעודה שהורדה.
4. **SSL enforcement מופעל** ו-**Network restrictions** עם CIDR של המשרד/VPN בלבד (ה-HTTP APIs לא מושפעים). Edge Functions משתמשות ב-HTTP, לא נחסמות.
5. **גיבויים:** Pro יומי בשלב 1; **PITR 7 ימים** נדלק ביום שבו טבלת `platform.document` או `identity_links` מקבלות נתוני לקוחות אמיתיים. בנוסף: `supabase db dump` שבועי אוטומטי (GitHub Action) לקבצים מוצפנים ב-S3 שלנו (**החלטת בעלים**).
6. **ניטור:** Metrics API → Grafana Cloud (אינטגרציה בקליק) עם התראות על: Disk IO balance < 30%, חיבורים > 70% מהמקסימום, שגיאות 5xx ב-Data API, כשלי pg_net, DLQ > 0. Health Advisors נבדקים שבועית. Log Drain נדחה (60$ לחודש) עד שיש צורך ב-forensics.
7. **Custom domain:** `api.seeld.co.il` (10$ לחודש) **כן**: הופך את ה-URL של Auth/Functions/Storage לנייד בין פרויקטים (רלוונטי במיוחד אחרי המעבר מטוקיו), ומנקה את ה-CSP ב-`vercel.json`.
8. **Read replicas:** לא.

### 9.4 פקודות או קוד

```sql
-- שאילתות אבחון שגרתיות
-- 1. שאילתות שקוראות הכי הרבה בלוקים מהדיסק (IO)
select calls, total_exec_time::int as ms, shared_blks_read, shared_blks_hit, temp_blks_written, left(query, 120)
from pg_stat_statements order by shared_blks_read desc limit 20;

-- 2. חיבורים לפי תפקיד/אפליקציה
select usename, application_name, state, count(*)
from pg_stat_activity group by 1,2,3 order by 4 desc;

-- 3. גודל DB ו-WAL
select pg_size_pretty(sum(pg_database_size(datname))) from pg_database;
select pg_size_pretty(sum(size)) as wal_size from pg_ls_waldir();

-- 4. בלואט/ואקום: Performance Advisor + 0020_table_bloat
```

```bash
# advisors ו-lint מה-CLI
supabase db advisors --remote
supabase db lint --remote --level warning

# metrics scrape (בדיקה ידנית)
curl "https://<REF>.supabase.co/customer/v1/privileged/metrics" --user 'service_role:sb_secret_...' | head

# SSL enforcement (Management API)
curl -X PUT "https://api.supabase.com/v1/projects/$PROJECT_REF/ssl-enforcement" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"requestedConfig":{"database":true}}'

# מחרוזות חיבור (מתוך Connect ב-Dashboard)
# transaction (serverless):  postgresql://postgres.<REF>:<PWD>@<POOLER-HOST>:6543/postgres?sslmode=require
# session (IPv4, כלי אדמין): postgresql://postgres.<REF>:<PWD>@<POOLER-HOST>:5432/postgres?sslmode=verify-full&sslrootcert=prod-ca-2021.crt
# direct (IPv6):             postgresql://postgres:<PWD>@db.<REF>.supabase.co:5432/postgres
```

---

## 10. בסיס אבטחה (checklist)

### 10.1 מה אומר התיעוד (2026)

**מפתחות API.** שני סוגים: **publishable** (`sb_publishable_...`) לכל מה שנשלח ללקוח (דפדפן, אפליקציה, CLI); ממופה לתפקיד `anon` ואחרי כניסה ל-`authenticated`; RLS מגן. **secret** (`sb_secret_...`) לשרתים/Edge Functions/cron; ממופה ל-`service_role` עם `BYPASSRLS`; **נחסם בדפדפן** (לפי `User-Agent`, מחזיר 401); אפשר כמה מפתחות secret בשמות שונים לסבב נפרד לכל רכיב. המפתחות החדשים **אינם JWT**: לשלוח בכותרת `apikey`, לא ב-`Authorization: Bearer`. `anon`/`service_role` הישנים (JWT) יוצאו משימוש **עד סוף 2026**. כללי טיפול: לעולם לא בקוד לקוח/מקור/URL/לוג; הצפנה במנוחה; הפרדה לכל רכיב; סבב מיד אחרי דליפה. מקור: [API keys](https://supabase.com/docs/guides/api/api-keys), [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

**JWT signing keys.** מערכת חדשה של מפתחות אסימטריים (ES256 מומלץ, RS256, EdDSA בקרוב) או shared secret, במקום JWT secret יחיד. מצבי מפתח: standby → current (rotate) → previously used → revoked; כל פעולה הפיכה; מיגרציה מהסוד הישן ב-"Migrate JWT secret" ואז "Rotate keys"; לחכות לפחות `jwt_expiry` + 15 דקות לפני revoke. JWKS: `GET /auth/v1/.well-known/jwks.json`, מטמון 10 דקות ב-edge + 10 דקות ב-SDK (מוצרי Supabase עצמם לא נסמכים על המטמון; revoke מיידי בהם). אימות בצד שלנו: `supabase.auth.getClaims()`. אזהרה בתיעוד: Edge Functions עם Verify JWT עלולות להישבר ברוטציה ויש "לכבות את ההגדרה" (בעוד שעמוד Authorization headers מציין שהבדיקה מאמתת גם מפתחות אסימטריים חדשים; **סתירה בתיעוד, לא אומת** מה נכון בפועל; לבדוק ב-staging לפני רוטציה בפרודקשן). Storage signed URLs משתמשים במפתח נפרד. מקור: [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys), [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers).

**ארגון.** **MFA enforcement ברמת ארגון: Pro, Team, Enterprise**; רק Owner מפעיל, והוא חייב MFA בעצמו; חברים ללא MFA מאבדים גישה מיד; PATs לא מושפעים. **SSO לארגון (SAML): Team/Enterprise בלבד.** **Platform Audit Logs: Team/Enterprise**; לכל חשבון יש Account Audit Logs. Auth Audit Logs (אירועי משתמשים) זמינים בכל פרויקט. מקור: [Enforce MFA on Organization](https://supabase.com/docs/guides/platform/mfa/org-mfa-enforcement), [Enable SSO](https://supabase.com/docs/guides/platform/sso), [Platform Audit Logs](https://supabase.com/docs/guides/security/platform-audit-logs), [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs), [Secure configuration of Supabase platform](https://supabase.com/docs/guides/security/platform-security).

**Production security checklist (רשמי):** RLS על כל טבלה ועל כל טבלה ב-publication; SSL enforcement; Network restrictions; MFA לחשבונות (GitHub 2FA או Supabase MFA); MFA enforcement לארגון; יותר מ-Owner אחד; אישור מייל מופעל; הסרת מספרי בדיקה; OTP ≤ 3600 שניות; MFA למשתמשים אם נדרש; SMTP מותאם. מקור: [Production security checklist](https://supabase.com/docs/guides/security/production-checklist).

### 10.2 למה זה חשוב לנו

- בטוקיו היה שימוש במפתחות legacy ובסודות בקוד של פונקציות; בפרנקפורט מתחילים ישר עם `sb_publishable_`/`sb_secret_` ו-signing keys אסימטריים, ואין בכלל `anon`/`service_role` legacy פעילים.
- הארגון שלנו הוא Pro: MFA enforcement זמין; SSO ו-Platform Audit Logs לא (Team). לכן ביקורת פעולות Dashboard נשענת על Account Audit Logs של כל חבר ועל מספר מינימלי של חברים.
- נתוני ת"ז/טלפון/בריאות: HMAC + הצפנה (Vault) כבר נקבעו; המפתחות חייבים סבב מתועד.

### 10.3 ההחלטה/הסטנדרט שלנו: רשימת תיוג

| # | פריט | סטטוס נדרש | מקור |
|---|---|---|---|
| 1 | רק `sb_publishable_` בלקוח (Vite env `VITE_SUPABASE_PUBLISHABLE_KEY`); אין `service_role`/`sb_secret_` בשום bundle, ב-`vercel.json`, ב-git או בלוג | חובה | [API keys](https://supabase.com/docs/guides/api/api-keys) |
| 2 | מפתחות secret בשמות: `default` (Edge Functions), `automations` (pg_cron/pg_net/webhooks), `ci` (GitHub Actions); סבב כל 12 חודשים ומיד בדליפה | חובה | [API keys](https://supabase.com/docs/guides/api/api-keys#handling-secret-keys-safely) |
| 3 | מפתחות legacy `anon`/`service_role` מושבתים בפרויקט החדש אחרי אימות שאין צרכן | חובה לפני go-live | [Migrating to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys) |
| 4 | JWT signing key אסימטרי (ES256) מהיום הראשון; רוטציה שנתית; `getClaims()` בכל אימות בצד שלנו | חובה | [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys) |
| 5 | MFA enforcement לארגון; לפחות 2 Owners עם MFA (הבעלים + השותף) | חובה | [Org MFA](https://supabase.com/docs/guides/platform/mfa/org-mfa-enforcement) |
| 6 | RLS על כל טבלה; Security Advisor בלי ERROR; `public` ריק ולא חשוף; `api` רק views/RPC | חובה | [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) |
| 7 | SSL enforcement + Network restrictions (CIDR משרד/VPN) | חובה | [SSL](https://supabase.com/docs/guides/platform/ssl-enforcement), [Network](https://supabase.com/docs/guides/platform/network-restrictions) |
| 8 | Auth: `enable_signup=false`, אישור מייל, OTP 600 שניות, מספרי בדיקה מוסרים, SMTP מותאם, CAPTCHA, leaked-password protection, TOTP לסוכנים | חובה | [Production security checklist](https://supabase.com/docs/guides/security/production-checklist) |
| 9 | Vault: `national_id_hmac_key`, `national_id_enc_key`, `event_hash_key`, `automations_key`, `project_url`; גיבוי מפתח השורש (Management API) לפני כל מעבר | חובה | [Vault](https://supabase.com/docs/guides/database/vault) |
| 10 | Edge Functions: `verify_jwt` לפי טבלה (פרק 5), `withSupabase` בכל פונקציה, Origin allowlist, סודות ב-secrets בלבד | חובה | [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth) |
| 11 | Storage: buckets פרטיים, signed URLs 5 דקות, אין listing ל-`authenticated` | חובה | [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) |
| 12 | Realtime: publication ריקה, "Allow public access" כבוי | חובה | [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization) |
| 13 | Auth audit logs נכתבים ל-DB; `platform.audit_log` append-only | חובה | [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) |
| 14 | PAT ל-CI עם הרשאות Read מינימליות (Project Settings, API Keys, API Key Secrets); סוד ב-GitHub Secrets | חובה | [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments) |
| 15 | סקירת Security Advisor ו-Account Audit Logs: שבועית; רוטציית סודות: שנתית; בדיקת rate limits: רבעונית | שגרה | [Advisors](https://supabase.com/docs/guides/observability/advisors) |

### 10.4 פקודות או קוד

```bash
# מפתחות: רשימה דרך CLI/MCP (אין להדפיס ערכים ללוג)
supabase projects api-keys --project-ref "$PROJECT_REF"   # לא אומת: שם הפקודה המדויק בגרסה הנוכחית; חלופה: Dashboard > Settings > API Keys

# JWKS של הפרויקט (ציבורי)
curl -s "https://<REF>.supabase.co/auth/v1/.well-known/jwks.json"
```

```ts
// אימות JWT בצד שלנו (Edge Function / שרת) בלי להסתמך על verify_jwt
const { data, error } = await supabase.auth.getClaims(token)   // משתמש ב-JWKS עם מטמון
if (error || data?.claims.aal !== 'aal2') return new Response('unauthorized', { status: 401 })
```

---

## 11. מודל עלויות

### 11.1 מה אומר התיעוד (2026)

**Pro: 25$ לחודש לארגון**, כולל: פרויקט ראשון (10$ Compute Credits שמכסים Micro אחד; לא נצברים), 100,000 MAU (אז 0.00325$ ל-MAU), 8GB דיסק לפרויקט (אז 0.125$ ל-GB), 250GB egress + 250GB cached egress (אז 0.09$ / 0.03$ ל-GB), 100GB Storage (אז 0.0213$ ל-GB), 2 מיליון קריאות Edge Functions (אז 2$ למיליון; OPTIONS לא נספר), גיבויים יומיים 7 ימים, 7 ימי לוגים, Email support. פרויקטים נוספים "from $10/mo" (כל פרויקט = compute משלו, Micro לפחות). מקור: [Pricing](https://supabase.com/pricing), [Manage Compute usage](https://supabase.com/docs/guides/platform/manage-your-usage/compute), [Egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [Storage size](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size), [MAU](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users), [Edge Function Invocations](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations).

**Compute** (לפי שעה, לחודש בקירוב): Micro 10$, Small 15$, Medium 60$, Large 110$. **Add-ons:** PITR 100$/200$/400$ (7/14/28 ימים); Custom domain 10$; Log drain 60$ לכל drain + 0.20$ למיליון אירועים; Advanced MFA Phone 75$ (פרויקט ראשון); IPv4 add-on (**לא אומת** המחיר במסמך זה); Branching לפי שימוש (Micro 0.01344$ לשעה ≈ 10$ לחודש ל-branch קבוע; preview לפי שעות חיים). **Spend Cap** (Pro) מכסה רק: Disk size, Egress, Edge invocations, Logs ingest/query, MAU, Realtime, Image transformations, Storage size; **לא** מכסה Compute, Branching, PITR, Log drains, Custom domain, MFA Phone, Disk throughput. מקור: [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk), [PITR usage](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery), [Custom Domain usage](https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains), [Log Drain usage](https://supabase.com/docs/guides/platform/manage-your-usage/log-drains), [MFA Phone usage](https://supabase.com/docs/guides/platform/manage-your-usage/advanced-mfa-phone), [Branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching), [Control your costs](https://supabase.com/docs/guides/platform/cost-control).

**SMS.** Supabase אינה מחייבת על SMS של כניסה; העלות היא של הספק (Twilio וכו'). רק Phone MFA הוא add-on. מקור: [MFA Phone usage](https://supabase.com/docs/guides/platform/manage-your-usage/advanced-mfa-phone), [Phone sign-in](https://supabase.com/docs/guides/auth/phone-login). מחיר SMS לישראל: **לא אומת** (תלוי ספק; לקבל הצעת מחיר).

### 11.2 הערכה חודשית ל-SEELD

הנחות: אתר קטן (אלפי מבקרים בחודש, הדפים הציבוריים מוגשים מ-Vercel ולא מ-Supabase), כמה עשרות סוכנים/לקוחות פעילים, 40 אלף שורות קרנות (~50MB כולל אינדקסים), cron כל דקה (~45 אלף קריאות Edge לחודש) + קריאות גולשים (לידים, צ'אט) ≈ עד 200 אלף קריאות. Egress: אם האתר מושך טבלאות קרנות מסוננות (עשרות KB לבקשה) ולא את כל הטבלה: עשרות GB לכל היותר.

| תרחיש | רכיבים | לחודש (USD, קירוב) |
|---|---|---|
| **A. מינימום** | Pro 25 + Micro 10 − 10 קרדיט | **~25** |
| **B. מומלץ לשלב האתר** | Pro 25 + Small 15 − 10 + Custom domain 10 | **~40** |
| **C. B + staging branch קבוע** | + Micro branch ~10 (אין קרדיט) | **~50** |
| **D. C + פורטל לקוחות** | + PITR 7 ימים 100 | **~150** |
| **E. D + forensics** | + Log drain 60 (+ אירועים) | **~210+** |
| תקופת מעבר (טוקיו + פרנקפורט במקביל) | + compute של הפרויקט הישן (≥ Micro 10, בלי קרדיט נוסף) | +10 עד +60 לחודש בחפיפה |

מה **לא** צפוי לעלות בגבולות שלנו: MAU (רחוק מ-100k), Storage (רחוק מ-100GB), Edge invocations (< 2M), דיסק (< 8GB בשנה הראשונה). סיכוני עלות: SMS (ספק), egress אם ה-SPA ימשוך 40 אלף שורות בכל טעינה (ראו פרק 2: `max_rows` ועימוד), ו-branching אם preview branches לא נסגרים.

### 11.3 ההחלטה/הסטנדרט שלנו

1. **Spend Cap כבוי** (אחרת שירותים נעצרים כשעוברים quota) **אבל** התראת תקציב ב-Grafana על egress/invocations, ובדיקה חודשית של Usage page.
2. תרחיש B מיד; C כשמתחילים לעבוד עם branches; D ביום שנתוני לקוחות עולים.
3. preview branches נסגרים אוטומטית עם ה-PR (ברירת מחדל); בדיקה שבועית שאין branches "זומבי".
4. פרויקט טוקיו: לאחר cutover ואישור, להשהות (paused לא נספר ב-Compute) ואז למחוק אחרי 30 יום (זכרו: מחיקה מוחקת גם גיבויים).

---

## 12. מעבר מפרויקט ישן (טוקיו → פרנקפורט)

### 12.1 מה אומר התיעוד (2026)

**שתי דרכים.** (א) **Restore to a new project** (שיבוט אוטומטי): לפרויקטים בתשלום עם physical backups; מעתיק סכמה, נתונים, תפקידים, משתמשי Auth כולל hash סיסמאות, ומפתח ההצפנה (Vault); לא מעתיק Storage objects, Edge Functions, הגדרות Auth/API/Realtime, הרחבות; **הנתונים נשארים באותו אזור** ("to ensure compliance with data residency requirements"). כלומר **לא מתאים לשינוי אזור.** (ב) **Backup and Restore using the CLI** (pg_dump/psql): מתאים לפרויקט חדש בכל אזור. מקור: [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project), [Migrating within Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase), [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

**הדרך ב-CLI (רשמית):**
1. גיבוי: `supabase db dump --remote=[OLD] -f roles.sql --role-only`, `supabase db dump --remote=[OLD] -f schema.sql`, `supabase db dump --remote=[OLD] -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"`. דגל `--schema <list>` מאפשר לבחור סכמות (למשל `--schema supabase_migrations`).
2. פרויקט חדש: להפעיל Database Webhooks והרחבות לא-דיפולטיות **לפני** השחזור.
3. שחזור: `psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql --dbname [NEW]` (replica מכבה טריגרים ומונע הצפנה כפולה).
4. **Vault/pgsodium:** להעתיק את מפתח השורש **לפני** שמשהים/מוחקים את הישן: `GET /v1/projects/{old}/pgsodium` → `PUT /v1/projects/{new}/pgsodium` (64 תווי hex); אחרת סודות ועמודות מוצפנות לא יפוענחו.
5. להפעיל מחדש publications של Realtime.
6. היסטוריית מיגרציות: dump ו-restore של סכמת `supabase_migrations` בנפרד.
7. התאמות ב-`auth`/`storage` (טריגרים, policies על `storage.objects`): לא בדומפ הרגיל; `supabase db diff --remote` על הישן (pg-delta כולל התאמות בסכמות מנוהלות) ולהחיל מהמיגרציות שלנו.
8. תפקידים מותאמים עם `LOGIN`: לקבוע סיסמה מחדש; שגיאות `ALTER ... OWNER TO "supabase_admin"`: להעיר בשורות.
9. Edge Functions: `supabase functions download <name> --remote=<old>` (ללא `deno.json`/import maps) ו-`supabase functions deploy --remote=<new>`; סודות מוזנים מחדש (`supabase secrets set --env-file`).
10. Storage objects: סקריפט Node רשמי שמעתיק bucket-אחר-bucket עם מפתחות secret של שני הפרויקטים (`list` רקורסיבי → `download` → `upload`), כולל יצירת buckets.
מקור: [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

**משתמשי Auth.** hash הסיסמה שמור ב-`auth.users.encrypted_password` (bcrypt + salt), ולכן העתקת נתוני סכמת `auth` משמרת סיסמאות; זהויות ב-`auth.identities`; גורמי MFA ב-`auth.mfa_factors`. מקור: [Password security](https://supabase.com/docs/guides/auth/password-security), [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project) (מאשר: "hashed passwords, and authentication records from the auth schema" מועתקים). **לא אומת:** האם ייבוא ה-JWT secret הישן למערכת signing keys של הפרויקט החדש ("import a private key or shared secret you already have") משמר סשנים קיימים; הנחת העבודה: המשתמשים יתחברו מחדש.

### 12.2 למה זה חשוב לנו

- אין קיצור דרך: שינוי אזור = פרויקט חדש + העברה ידנית. "Restore to a new project" לא יעזור.
- הפרויקט בטוקיו מכיל סכמות של מוצרים אחרים (`seeldbooks`, `insbook`, `lenny_*`, `rec_*` ועוד; `OPEN-DECISIONS.md` סעיף 6): מעבירים **רק** את הסכמות של SEELD. העברה סלקטיבית = `--schema` בדומפים + סינון ידני של `roles.sql`.
- נתוני ת"ז בטקסט גלוי ב-20 טבלאות (סעיף 1 שם): המעבר הוא ההזדמנות להמיר ל-HMAC/הצפנה **בזמן ההעתקה** (ETL קטן) ולא להעתיק כמו שהוא.
- Vault: שלושת המפתחות (`national_id_hmac_key`, `national_id_enc_key`, `event_hash_key`) מוצפנים במפתח השורש של טוקיו; בלי העתקת מפתח השורש, הנתונים המוצפנים אבודים.

### 12.3 ההחלטה/הסטנדרט שלנו: תכנית cutover

**שלב 0: הכנה (לפני כל דבר).**
- מיפוי סכמות/טבלאות להעברה (רשימה סגורה; כל שאר הסכמות נשארות בטוקיו לבעליהן).
- פרויקט חדש ב-`eu-central-1`, Pro, Small, Postgres 17; הפעלת הרחבות: `pgmq`, `pg_net`, `pg_cron`, `pgtap`, `pg_trgm` (ב-`extensions`), `supabase_vault`.
- מיגרציות של הסכמה החדשה (`api`/`platform`/`private`) מהרפו דרך `db push`; **לא** `schema.sql` מטוקיו (זה מעתיק את הבלגן).
- העתקת מפתח השורש של Vault (`/v1/projects/{old}/pgsodium` → `/v1/projects/{new}/pgsodium`) **רק אם** מחליטים להעביר סודות/עמודות מוצפנות כפי שהם; חלופה נקייה: ליצור סודות חדשים ולהצפין מחדש ב-ETL.
- Auth config, SMTP, hooks, CAPTCHA, URL config, rate limits דרך Management API (סקריפט חוזר); JWT signing key ES256; מפתחות API חדשים; secrets ל-Edge Functions; `supabase functions deploy`.
- Custom domain `api.seeld.co.il` מצביע לפרויקט החדש (אם אושר).

**שלב 1: העתקה ראשונית (dry run מלא על staging branch).**
- `supabase db dump --remote=[OLD] --data-only --use-copy --schema public -f data_public.sql` → ETL (ת"ז → HMAC) → טעינה ל-`platform`.
- `supabase db dump --remote=[OLD] --data-only --use-copy --schema auth -f data_auth.sql` → טעינה **רק** של `auth.users`, `auth.identities`, `auth.mfa_factors` של משתמשי SEELD (סינון לפי רשימת מיילים/ids); לא sessions/refresh tokens.
- Storage: הסקריפט הרשמי, רק buckets של SEELD.
- cron jobs: **לא** מועתקים; נוצרים מהמיגרציות (שמות קבועים).
- בדיקות: ספירות שורות, `supabase test db`, Security Advisor ירוק, כניסת סוכן בדיקה עם סיסמה קיימת + TOTP קיים.

**שלב 2: cutover (חלון של שעה בלילה).**
1. הקפאת כתיבה בטוקיו: `lead-intake`/`chat-bot` עוברים למצב "תור מקומי" (ההודעות נשמרות ב-pgmq של **פרנקפורט** כבר בשלב זה; האתר הציבורי לא מושפע).
2. דלתא: dump/restore של טבלאות שהשתנו מאז שלב 1 (לפי `updated_at`).
3. Vercel: החלפת `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, עדכון CSP ב-`vercel.json`, פריסה.
4. Webhooks חיצוניים: Surense ו-Make מצביעים ל-`https://api.seeld.co.il/functions/v1/surense-webhook` (או ל-`<new-ref>.supabase.co`); Auth Site URL/Redirects; SMS hook URL.
5. בדיקות עשן: ליד בדיקה, כניסת סוכן, צ'אט, worker רץ (cron), `net._http_response` נקי.
6. טוקיו: השבתת מפתחות ה-API הישנים של SEELD (לא של מוצרים אחרים), השארת הפרויקט רץ 30 יום לקריאה בלבד.

**שלב 3: rollback (אם נדרש בתוך 72 שעות).** החזרת env vars ב-Vercel ו-webhooks לטוקיו; ההודעות שנכנסו לפרנקפורט בחלון מועתקות ידנית (אידמפוטנטיות לפי `event_id`). אחרי 72 שעות ללא בעיות: אין rollback, רק תיקון קדימה.

### 12.4 פקודות או קוד

```bash
# גיבוי סלקטיבי מטוקיו (session pooler אם אין IPv6)
OLD="postgresql://postgres.<OLD_REF>:<PWD>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
NEW="postgresql://postgres.<NEW_REF>:<PWD>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

supabase db dump --remote="$OLD" -f roles.sql --role-only                         # לסנן ידנית: רק תפקידי SEELD
supabase db dump --remote="$OLD" -f data_public.sql --use-copy --data-only --schema public
supabase db dump --remote="$OLD" -f data_auth.sql   --use-copy --data-only --schema auth
supabase db dump --remote="$OLD" -f history.sql     --use-copy --data-only --schema supabase_migrations   # רק אם רוצים היסטוריה

# מפתח השורש של Vault (לפני השהיית הישן!)
curl "https://api.supabase.com/v1/projects/$OLD_REF/pgsodium" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" |
curl "https://api.supabase.com/v1/projects/$NEW_REF/pgsodium" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -X PUT --json @-

# סכמה חדשה מהרפו (לא schema.sql מטוקיו)
supabase link --project-ref "$NEW_REF"
supabase db push --remote

# טעינת נתונים (אחרי ETL) עם טריגרים כבויים
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' \
  --file data_public.transformed.sql \
  --dbname "$NEW"

# Edge Functions וסודות
supabase functions deploy --remote="$NEW_REF"
supabase secrets set --env-file ./supabase/functions/.env.production

# אימות
supabase migration list --remote
supabase db advisors --remote
supabase test db
```

```sql
-- ETL לדוגמה: ת"ז גלויה -> HMAC (Vault) בזמן ההעתקה
insert into platform.identity_links (client_id, national_id_hmac, created_at)
select gen_random_uuid(),
       encode(extensions.hmac(trim(national_id)::bytea,
              (select decrypted_secret from vault.decrypted_secrets where name = 'national_id_hmac_key')::bytea, 'sha256'), 'hex'),
       created_at
from staging_import.old_clients
where national_id ~ '^\d{9}$';
```

```js
// העתקת Storage (מבוסס על הסקריפט הרשמי; buckets נבחרים בלבד)
const BUCKETS = ['client-docs', 'public-assets']
for (const b of BUCKETS) {
  await ensureBucketExists(b, { public: b === 'public-assets' })
  for (const f of await listAllFiles(b)) {
    const { data } = await oldSupabase.storage.from(b).download(f.fullPath)
    await newSupabase.storage.from(b).upload(f.fullPath, data, { contentType: f.metadata.mimetype, upsert: true })
  }
}
```

---

## 13. 15 ההחלטות המרכזיות ל-SEELD

| # | החלטה | סיבה בקצרה | פרק |
|---|---|---|---|
| 1 | **פרויקט Pro חדש ב-`eu-central-1`, Small compute, Postgres 17**; טוקיו נשאר למוצרים האחרים ואז מושהה | אזור לא ניתן לשינוי; Small נותן מרווח IO/RAM לרענון הקרנות | 9, 11, 12 |
| 2 | **מעבר ב-CLI dump/restore סלקטיבי + ETL** (לא "Restore to a new project", שנשאר באותו אזור) | שינוי אזור + ניקוי סכמות זרות + המרת ת"ז ל-HMAC בדרך | 12 |
| 3 | **`api.schemas = ["api"]`; `public` ריק ולא חשוף; `platform`/`private` פנימיים** | סגור כברירת מחדל; פחות lints; משטח API מוגדר | 2 |
| 4 | **הסרת הרשאות ברירת מחדל** במיגרציה הראשונה + grants מפורשים לכל אובייקט | מה שנולד ב-`public` לא ייחשף בטעות שוב | 2 |
| 5 | **קריאה ציבורית רק דרך views `security_invoker` ב-`api`, `max_rows = 200`, עימוד ומסננים** | egress ו-IO של 40 אלף שורות קרנות | 2, 9 |
| 6 | **אין INSERT/UPDATE ל-`anon`/`authenticated` על טבלאות**; כתיבה דרך RPC `security definer` או Edge Function עם secret | לידים מאנונימיים נכנסים דרך `lead-intake` עם Turnstile | 2, 5 |
| 7 | **RLS בכל טבלה, `(select ...)` בכל policy, `to <role>`, אינדקס לכל עמודת policy ו-FK, pgTAP ב-CI** | הביצועים והאבטחה נקבעים ביום הראשון | 3 |
| 8 | **תפקידים ב-JWT דרך Custom Access Token Hook (`private.custom_access_token_hook`), בלי `security definer`**; פעולות כתיבה בודקות גם את הטבלה | claim ישן עד רענון טוקן | 3 |
| 9 | **הרשמה סגורה; סוכנים: סיסמה חזקה + TOTP חובה + `aal2` ב-RLS; Time-box 30 יום, Inactivity 60 דקות, Single session** | דרישת הבעלים; זמין ב-Pro | 4 |
| 10 | **לקוחות: SMS OTP דרך Send SMS Hook (HTTP) לספק ישראלי, Twilio Verify כגיבוי; לא Phone MFA (75$)** | ספקים מובנים אינם ישראליים; SMS OTP הוא כניסה ראשית | 4, 11 |
| 11 | **SMTP = Resend; CAPTCHA Turnstile על Auth ועל `lead-intake`/`chat-bot`; OTP 600 שניות** | 2 מיילים לשעה בלי SMTP; הגנה על עלויות SMS | 4 |
| 12 | **כל Edge Function ב-`@supabase/server`; `verify_jwt` לפי טבלה; secret בשם `automations` ל-cron/pg_net; Origin allowlist; Idempotency-Key** | `verify_jwt` לבדו לא מאמת API keys | 5 |
| 13 | **pgmq Basic + pg_cron + pg_net עם Vault; DLQ שלנו (`max_attempts` → archive); תורים לא חשופים ב-PostgREST** | אין DLQ מובנה; pg_net חושף מפתח בתור | 7 |
| 14 | **מפתחות `sb_publishable_`/`sb_secret_` בלבד, JWT signing key ES256, MFA enforcement לארגון, SSL enforcement + Network restrictions, Realtime כבוי** | legacy keys יוצאים משימוש ב-2026; checklist רשמי | 8, 10 |
| 15 | **Custom domain `api.seeld.co.il` (10$); PITR 7 ימים (100$) כשנתוני לקוחות עולים; staging branch קבוע (~10$); אין Log drain בשלב זה** | ניידות API אחרי המעבר; RPO 2 דקות למסמכי לקוחות | 9, 11 |

`config.toml` המאוחד (מיזוג `config.proposed.toml` עם המסמך הזה) מופיע בפרקים 1.4, 4.4, 5.4, 6.4; שינויים מול ההצעה הקיימת: `max_rows` 200 (היה 1000), הוספת `[auth.sessions]`, `[auth.email.smtp]`, `[auth.hook.*]`, `[auth.sms]`, `[storage.buckets.*]`, `[remotes.staging]`, `[edge_runtime] policy`, ופונקציות `surense-webhook` ו-`auth-send-sms`. המפתחות `minimum_password_length` ו-`password_requirements` שבהצעה הקיימת: **לא אומת** שהם מפתחות config תקפים (לא נמצאו ב-reference); הגדרת הסיסמאות תתבצע ב-Dashboard/Management API עד לאימות.

---

## 14. מלכודות (gotchas)

1. **"Restore to a new project" נשאר באותו אזור.** לא דרך לעבור לפרנקפורט. ([clone-project](https://supabase.com/docs/guides/platform/clone-project))
2. **מפתח השורש של Vault לא נמצא בשום dump.** בלי `GET/PUT /v1/projects/{ref}/pgsodium` לפני השהיית הישן, סודות ועמודות מוצפנות אבודים לצמיתות. ([backup-restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore))
3. **`verify_jwt` מקבל גם `sb_publishable_` ו-`sb_secret_` בכל כותרת.** פונקציה "מוגנת" ב-`verify_jwt=true` נגישה לכל מי שיש לו את המפתח הציבורי; האימות האמיתי הוא בקוד. ([auth-headers](https://supabase.com/docs/guides/functions/auth-headers))
4. **Email OTP Expiration שולט גם בקישורי הזמנה/שחזור/אישור.** 600 שניות ל-OTP = גם 10 דקות להזמנת סוכן. ([auth-email-passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless))
5. **בלי SMTP מותאם: 2 מיילים לשעה ורק לחברי הצוות.** הזמנות לסוכנים ייכשלו עם `email_address_not_authorized`. ([auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp))
6. **`revoke execute on functions from public` גלובלי שובר policies** שקוראות לפונקציות עזר ללא grant מפורש. ([securing-your-api](https://supabase.com/docs/guides/api/securing-your-api#revoke-default-privileges))
7. **הסכמה הדקלרטיבית לא עוקבת DML:** buckets, cron jobs, seeds של תפקידים, `vault.create_secret` חייבים מיגרציה ידנית. ([declarative schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas#known-caveats))
8. **`sync` ראשון בלי baseline מייצר מיגרציה של כל הסכמה שתיכשל ב-`db push`.** `db pull --remote` קודם. ([declarative schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas#pulling-in-your-production-schema))
9. **"Deploy to production" של אינטגרציית GitHub לא מחיל Auth/API config ולא seeds**, רק מיגרציות/פונקציות/buckets. ([github-integration](https://supabase.com/docs/guides/deployment/branching/github-integration#deploying-changes-to-production))
10. **branches נולדים בלי נתונים ובלי Storage**, ו-Compute Credits לא חלים עליהם; Spend Cap לא מכסה אותם. ([branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching))
11. **`alter table realtime.messages enable row level security` במיגרציה מפיל את כל המיגרציה (42501).** RLS כבר מופעל שם. ([realtime authorization](https://supabase.com/docs/guides/realtime/authorization))
12. **Postgres Changes: RLS לא מסנן `DELETE`.** ([production checklist](https://supabase.com/docs/guides/security/production-checklist#database))
13. **מחיקת קבצי Storage ב-SQL משאירה אובייקטים יתומים שמחויבים.** רק דרך ה-API. ([delete-objects](https://supabase.com/docs/guides/storage/management/delete-objects))
14. **גיבויי המסד לא כוללים Storage objects.** ([backups](https://supabase.com/docs/guides/platform/backups))
15. **אי אפשר לבטל signed URL בודד**, רק לסובב את מפתח החתימה של Storage (או להזיז את הקובץ). ([downloads](https://supabase.com/docs/guides/storage/serving/downloads))
16. **pg_net כותב את המפתח המפוענח ל-`net.http_request_queue`** עד השליחה; כל תפקיד שמתחבר למסד רואה אותו. ([schedule-functions](https://supabase.com/docs/guides/functions/schedule-functions))
17. **`cron.job_run_details` לא מתנקה לבד** (גם אחרי unschedule). ([cron quickstart](https://supabase.com/docs/guides/cron/quickstart))
18. **שם cron job חוזר = upsert שקט**; שמות case-sensitive ולא ניתנים לעריכה. ([cron quickstart](https://supabase.com/docs/guides/cron/quickstart))
19. **Edge Functions: CPU 2 שניות לבקשה, פורטים 25/587 חסומים, בלי `sharp`.** רענון 40 אלף שורות בלולאה = timeout; SMTP ישיר = חסום. ([limits](https://supabase.com/docs/guides/functions/limits))
20. **קיבוע אזור (`x-region`) מבטל failover אזורי.** ([regional-invocation](https://supabase.com/docs/guides/functions/regional-invocation))
21. **Transaction pooler: בלי prepared statements, `set`, `listen`, temp tables, pipelining.** ([connecting-to-postgres](https://supabase.com/docs/guides/database/connecting-to-postgres#transaction-mode-limitations))
22. **Pool size הוא לכל תפקיד**, לא לכל הפרויקט; קל לעבור את max connections ב-Micro/Small. ([connection-management](https://supabase.com/docs/guides/database/connection-management))
23. **הגדרות סשן (time-box/inactivity) נאכפות רק ברענון:** אורך אפקטיבי = timeout + `jwt_expiry`. ([sessions](https://supabase.com/docs/guides/auth/sessions))
24. **claims מותאמים מתעדכנים רק ברענון טוקן;** הורדת תפקיד לא מיידית. ([RLS helper functions](https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions))
25. **`raw_user_meta_data` ניתן לעריכה על ידי המשתמש**: לעולם לא להרשאות (lint 0015). ([advisors](https://supabase.com/docs/guides/observability/advisors))
26. **Password/MFA Verification hooks: Teams+ בלבד.** נעילת חשבון = קוד שלנו. ([auth-hooks](https://supabase.com/docs/guides/auth/auth-hooks))
27. **מספרי טלפון לבדיקה לא חלים על Phone MFA ויש להסירם לפני פרודקשן.** ([testing-auth-flows](https://supabase.com/docs/guides/auth/testing-auth-flows))
28. **`anon`/`service_role` legacy יוצאים משימוש עד סוף 2026**; secret key נחסם בדפדפן (401 לפי User-Agent). ([api-keys](https://supabase.com/docs/guides/api/api-keys))
29. **רוטציית JWT signing key עשויה לשבור Edge Functions עם Verify JWT** לפי דף signing keys (סתירה עם דף auth-headers; לבדוק ב-staging). ([signing-keys](https://supabase.com/docs/guides/auth/signing-keys))
30. **הגבלת קצב MFA (15/דקה) לא ניתנת לשינוי; מיילים 2/שעה בלי SMTP; SMS 30/שעה.** ([rate-limits](https://supabase.com/docs/guides/auth/rate-limits))
31. **Disk IO balance בממוצע מסתיר דקות של 0%;** הערך המינימלי ב-Infrastructure settings. אחרי שינוי דיסק: 4 שעות cooldown; דיסק לא קטן. ([compute-and-disk](https://supabase.com/docs/guides/platform/compute-and-disk))
32. **PITR מכבה גיבויים יומיים ולא מכוסה ב-Spend Cap; מחיקת פרויקט מוחקת גם גיבויים.** ([backups](https://supabase.com/docs/guides/platform/backups))
33. **סיסמאות של תפקידים מותאמים לא נשמרות בגיבויים/דומפים.** ([backups](https://supabase.com/docs/guides/platform/backups))
34. **`supabase functions download` לא מוריד `deno.json`/import maps.** פריסה מהרפו, לא מהפרויקט הישן. ([backup-restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore))
35. **פרויקט נוסף = compute נוסף (≥ Micro 10$) ללא קרדיט נוסף.** תקופת החפיפה טוקיו/פרנקפורט עולה כסף. ([compute usage](https://supabase.com/docs/guides/platform/manage-your-usage/compute))

---

## 15. אינדקס מקורות

**CLI, פרויקט וסביבות**
- https://supabase.com/docs/guides/local-development/cli/config
- https://supabase.com/docs/guides/local-development/managing-config
- https://supabase.com/docs/guides/local-development/declarative-database-schemas
- https://supabase.com/docs/guides/local-development/diff-engines
- https://supabase.com/docs/guides/local-development/cli-workflows
- https://supabase.com/docs/guides/local-development/seeding-your-database
- https://supabase.com/docs/guides/local-development/cli/testing-and-linting
- https://supabase.com/docs/guides/local-development/testing/overview
- https://supabase.com/docs/guides/database/testing
- https://supabase.com/docs/guides/database/extensions/pgtap
- https://supabase.com/docs/guides/api/rest/generating-types
- https://supabase.com/docs/guides/deployment/managing-environments
- https://supabase.com/docs/guides/deployment/ci/testing
- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/deployment/branching/github-integration
- https://supabase.com/docs/guides/deployment/branching/configuration
- https://supabase.com/docs/guides/platform/manage-your-usage/branching

**Data API וסכמה**
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/api/using-custom-schemas
- https://supabase.com/docs/guides/api/rest/debugging-performance
- https://supabase.com/docs/guides/observability/advisors

**RLS ו-Auth**
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- https://supabase.com/docs/guides/auth/auth-hooks
- https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
- https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
- https://supabase.com/docs/guides/auth/auth-hooks/password-verification-hook
- https://supabase.com/docs/guides/auth/auth-hooks/mfa-verification-hook
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/guides/auth/phone-login
- https://supabase.com/docs/guides/auth/testing-auth-flows
- https://supabase.com/docs/guides/auth/auth-mfa
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/auth/auth-mfa/phone
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/guides/auth/jwt-fields
- https://supabase.com/docs/guides/auth/audit-logs
- https://supabase.com/docs/guides/auth/signing-keys
- https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
- https://supabase.com/docs/reference/javascript/auth-admin-generatelink

**Edge Functions**
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/auth-headers
- https://supabase.com/docs/guides/functions/function-configuration
- https://supabase.com/docs/guides/functions/development-tips
- https://supabase.com/docs/guides/functions/dependencies
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/functions/cors
- https://supabase.com/docs/guides/functions/background-tasks
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/functions/logging
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/regional-invocation
- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/examples/send-emails
- https://supabase.com/docs/guides/functions/examples/cloudflare-turnstile
- https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite

**Storage**
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/buckets/creating-buckets
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/schema/helper-functions
- https://supabase.com/docs/guides/storage/schema/design
- https://supabase.com/docs/guides/storage/serving/downloads
- https://supabase.com/docs/guides/storage/uploads/standard-uploads
- https://supabase.com/docs/guides/storage/uploads/resumable-uploads
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/storage/serving/image-transformations
- https://supabase.com/docs/guides/storage/management/delete-objects
- https://supabase.com/docs/guides/storage/security/signing-keys

**תורים, cron, pg_net, Vault, Realtime**
- https://supabase.com/docs/guides/queues
- https://supabase.com/docs/guides/queues/quickstart
- https://supabase.com/docs/guides/queues/api
- https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions
- https://supabase.com/docs/guides/cron
- https://supabase.com/docs/guides/cron/quickstart
- https://supabase.com/docs/guides/database/extensions/pg_net
- https://supabase.com/docs/guides/database/webhooks
- https://supabase.com/docs/guides/database/vault
- https://supabase.com/docs/guides/realtime/broadcast
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/postgres-changes
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes

**תפעול, אבטחה, עלויות, מעבר**
- https://supabase.com/docs/guides/platform/compute-and-disk
- https://supabase.com/docs/guides/platform/manage-your-usage/disk-throughput
- https://supabase.com/docs/guides/platform/manage-your-usage/disk-size
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits
- https://supabase.com/docs/guides/database/connection-management
- https://supabase.com/docs/guides/database/extensions/pg_stat_statements
- https://supabase.com/docs/guides/platform/performance
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery
- https://supabase.com/docs/guides/platform/clone-project
- https://supabase.com/docs/guides/observability/log-drains
- https://supabase.com/docs/guides/platform/manage-your-usage/log-drains
- https://supabase.com/docs/guides/observability/metrics
- https://supabase.com/docs/guides/platform/ssl-enforcement
- https://supabase.com/docs/guides/platform/network-restrictions
- https://supabase.com/docs/guides/platform/custom-domains
- https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains
- https://supabase.com/docs/guides/platform/read-replicas
- https://supabase.com/docs/guides/api/api-keys
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- https://supabase.com/docs/guides/platform/mfa/org-mfa-enforcement
- https://supabase.com/docs/guides/platform/sso
- https://supabase.com/docs/guides/security/platform-audit-logs
- https://supabase.com/docs/guides/security/platform-security
- https://supabase.com/docs/guides/security/production-checklist
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/manage-your-usage/compute
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/platform/manage-your-usage/storage-size
- https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users
- https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- https://supabase.com/docs/guides/platform/manage-your-usage/advanced-mfa-phone
- https://supabase.com/docs/guides/platform/cost-control
- https://supabase.com/docs/guides/platform/migrating-within-supabase
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore

**פריטים שסומנו "לא אומת" במסמך (לבדיקה לפני מימוש):** מפתחות config `auth.minimum_password_length`, `auth.password_requirements`, `auth.captcha.*`, `edge_runtime.deno_version`; האם ה-payload של Before User Created מזהה יצירה דרך `service_role`; רשימת קריאות Auth שדורשות `captchaToken`; תחביר wildcard לדומייני preview ב-Redirect URLs; חתימת `pgmq.create` ו-DLQ ב-pgmq העדכני; retry מובנה ב-pg_net; התראות מובנות ל-Pro; מחיר IPv4 add-on ומחיר SMS לישראל; חוזה חתימת webhook של Surense; ייבוא JWT secret ישן לשימור סשנים; סתירת התיעוד לגבי `verify_jwt` ברוטציית מפתחות; פקודת CLI להצגת מפתחות API; דרישת retention רגולטורית למסמכי פוליסה.
