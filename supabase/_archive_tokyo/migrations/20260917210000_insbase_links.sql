-- קישור בין משתמש מחובר באתר לבין התיק שלו באינסבייס (insbase.io).
-- האסימונים נשמרים לכל משתמש בשורה שלו בלבד (אבטחת שורה: user_id = auth.uid()).
-- ניתוק = מחיקת השורה. הסוכנות יכולה לבטל אסימון מצד אינסבייס בכל רגע.
create table if not exists public.insbase_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_id text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  display_name text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insbase_links enable row level security;

drop policy if exists "Users manage own insbase link" on public.insbase_links;
create policy "Users manage own insbase link" on public.insbase_links
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.insbase_links from anon;
