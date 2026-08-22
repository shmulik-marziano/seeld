-- Reconcile the migration history with what production (lvifatyksqizwcutfbqp)
-- actually contains. Audited 2026-07-28.
--
-- Renumbered from 20260728000000 on 2026-08-22: it had never been applied, but
-- eleven migrations with later timestamps had (20260728145519 through
-- 20260816201736). `supabase db push` treats an unapplied file that predates
-- applied history as out-of-order and refuses to run without --include-all.
-- Nothing here depends on ordering — every statement is idempotent — so moving
-- the stamp past the applied history is the whole fix.
--
-- Two tables drifted away from this directory:
--
--   1. blog_posts  — has 22 rows in production but was never created by any
--                    migration here. It also carries a cover_image_url column
--                    that only ever existed in the database.
--
--   2. page_views  — 20260323000000_page_views.sql declares (id uuid, path,
--                    created_at). Production has (id bigint identity, slug,
--                    viewed_at) and 1,385 rows, so that migration was never
--                    the thing that built the table. 20260325000000 (the
--                    ALTER ... ADD COLUMN IF NOT EXISTS pass) *was* applied.
--
-- Everything below is idempotent and is a no-op against production. Its purpose
-- is to make a fresh `supabase db reset` reproduce the real schema.

-- ─────────────────────────────────────────────────────────────────────
-- blog_posts
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  slug         text NOT NULL UNIQUE,
  excerpt      text,
  content      text NOT NULL,
  category     text,
  author       text,
  status       text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Added directly in the dashboard; the blog listing and post pages both read it.
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cover_image_url text;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (published_at);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can manage posts" ON public.blog_posts;
CREATE POLICY "Authenticated can manage posts"
  ON public.blog_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- page_views — bring the 20260323 shape in line with production
-- ─────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'page_views'
               AND column_name = 'path') THEN
    ALTER TABLE public.page_views RENAME COLUMN path TO slug;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'page_views'
               AND column_name = 'created_at') THEN
    ALTER TABLE public.page_views RENAME COLUMN created_at TO viewed_at;
  END IF;
END $$;

ALTER TABLE public.page_views ALTER COLUMN slug      SET NOT NULL;
ALTER TABLE public.page_views ALTER COLUMN viewed_at SET NOT NULL;
ALTER TABLE public.page_views ALTER COLUMN viewed_at SET DEFAULT now();

-- Production's id is a bigint identity, not the uuid the 20260323 migration
-- declared. Only swap it on a table that has no rows to lose — production is
-- already bigint, so this branch cannot fire there.
DO $$
DECLARE
  id_type text;
  n_rows  bigint;
BEGIN
  SELECT data_type INTO id_type FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'id';

  IF id_type = 'uuid' THEN
    EXECUTE 'SELECT count(*) FROM public.page_views' INTO n_rows;
    IF n_rows = 0 THEN
      ALTER TABLE public.page_views DROP COLUMN id;
      ALTER TABLE public.page_views
        ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
    ELSE
      RAISE NOTICE
        'page_views.id is uuid with % rows; leaving it alone. Production uses bigint identity.',
        n_rows;
    END IF;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_page_views_path;
DROP INDEX IF EXISTS public.idx_page_views_created_at;
CREATE INDEX IF NOT EXISTS idx_page_views_slug    ON public.page_views (slug);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON public.page_views (country);

-- Production restricts reads to authenticated users; the 20260323 migration
-- left them world-readable.
DROP POLICY IF EXISTS "Allow public reads on page_views"  ON public.page_views;
DROP POLICY IF EXISTS "Allow public inserts on page_views" ON public.page_views;

DROP POLICY IF EXISTS "Allow public inserts" ON public.page_views;
CREATE POLICY "Allow public inserts"
  ON public.page_views FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "page_views_read_authenticated" ON public.page_views;
CREATE POLICY "page_views_read_authenticated"
  ON public.page_views FOR SELECT TO authenticated
  USING (true);
