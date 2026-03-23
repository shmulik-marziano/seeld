-- Create page_views table for site analytics
create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id text,
  created_at timestamptz default now()
);

-- Performance indexes
create index if not exists idx_page_views_created_at on page_views(created_at desc);
create index if not exists idx_page_views_path on page_views(path);

-- Row Level Security
alter table page_views enable row level security;

-- Anyone (anon) can insert page views for tracking
create policy "Allow public inserts on page_views"
  on page_views for insert
  with check (true);

-- Anyone can read aggregated stats (paths + timestamps, no PII)
create policy "Allow public reads on page_views"
  on page_views for select
  using (true);
