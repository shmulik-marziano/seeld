-- FOUNDATION 02: identity tables, role helpers, updated_at trigger, audit log.
-- Authorization is read from core.staff (database), NOT from JWT claims, so revoking a role is instant
-- and there is no stale-claim window. The JWT is used only for identity (auth.uid()) and assurance level (aal).

create table core.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('agent', 'manager', 'admin')),
  display_name text not null check (char_length(display_name) between 2 and 80),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table core.staff is 'Internal users (agents, managers, admins). Row exists = may work in the system. Written only by service_role / admin RPC.';

create table core.client_accounts (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  customer_id uuid unique,
  status      text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table core.client_accounts is 'Login accounts of clients (invite-only). customer_id links to the customer registry of the event platform (identity_links) when adopted.';
create index client_accounts_invited_by_idx on core.client_accounts (invited_by);

-- updated_at ----------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger staff_set_updated_at before update on core.staff
  for each row execute function private.set_updated_at();
create trigger client_accounts_set_updated_at before update on core.client_accounts
  for each row execute function private.set_updated_at();

-- role helpers (security definer so they can read core.staff past RLS; pinned search_path) -------
create or replace function private.jwt_aal()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1');
$$;

create or replace function private.staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.role
  from core.staff s
  where s.user_id = (select auth.uid())
    and s.active
$$;

-- is_staff: an active staff member whose session passed the second factor (TOTP) = aal2.
create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.staff_role() is not null and private.jwt_aal() = 'aal2'
$$;

create or replace function private.has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.staff_role() = any (p_roles), false) and private.jwt_aal() = 'aal2'
$$;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(array['manager', 'admin'])
$$;

create or replace function private.is_client()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from core.client_accounts c
    where c.user_id = (select auth.uid()) and c.status = 'active'
  )
$$;

revoke all on function private.jwt_aal(), private.staff_role(), private.is_staff(),
  private.has_role(text[]), private.is_manager(), private.is_client() from public, anon;
grant execute on function private.jwt_aal(), private.staff_role(), private.is_staff(),
  private.has_role(text[]), private.is_manager(), private.is_client() to authenticated, service_role;

-- RLS + grants on identity tables ---------------------------------------------
alter table core.staff enable row level security;
alter table core.client_accounts enable row level security;

grant select on core.staff, core.client_accounts to authenticated;
grant select, insert, update, delete on core.staff, core.client_accounts to service_role;

-- a staff member sees own row; managers see all (reads only; writes go through service role)
create policy staff_select on core.staff for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_manager()));
create policy client_accounts_select on core.client_accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff()));

-- audit ------------------------------------------------------------------------
create table audit.log (
  id           bigint generated always as identity primary key,
  at           timestamptz not null default now(),
  actor        uuid,
  actor_role   text,
  table_name   text not null,
  op           text not null check (op in ('INSERT', 'UPDATE', 'DELETE')),
  pk           text,
  changed_cols text[],
  old_data     jsonb,
  new_data     jsonb
);
comment on table audit.log is 'Append-only. Values are omitted for PII tables (trigger arg no_values): only changed column names are kept.';
create index audit_log_table_at_idx on audit.log (table_name, at desc);
create index audit_log_actor_idx on audit.log (actor, at desc);
alter table audit.log enable row level security;
revoke all on audit.log from anon, authenticated;
grant select on audit.log to service_role;

create or replace function audit.log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_cols text[];
  v_novals boolean := coalesce(tg_argv[0], '') = 'no_values';
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(k order by k), '{}') into v_cols
    from jsonb_object_keys(v_new) k
    where v_new -> k is distinct from v_old -> k and k <> 'updated_at';
    if cardinality(v_cols) = 0 then
      return new;   -- no real change
    end if;
  end if;

  insert into audit.log (actor, actor_role, table_name, op, pk, changed_cols, old_data, new_data)
  values (
    (select auth.uid()),
    current_user,
    tg_table_schema || '.' || tg_table_name,
    tg_op,
    coalesce(v_row ->> 'id', v_row ->> 'user_id'),
    v_cols,
    case when v_novals then null else v_old end,
    case when v_novals then null else v_new end
  );
  return coalesce(new, old);
end;
$$;
revoke all on function audit.log_change() from public, anon, authenticated;

create or replace function audit.block_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('audit.allow_purge', true), '') = 'on' then
    return coalesce(old, new);
  end if;
  raise exception 'audit.log is append-only' using errcode = '42501';
end;
$$;
create trigger audit_log_append_only before update or delete on audit.log
  for each row execute function audit.block_mutation();

create trigger staff_audit after insert or update or delete on core.staff
  for each row execute function audit.log_change();
create trigger client_accounts_audit after insert or update or delete on core.client_accounts
  for each row execute function audit.log_change('no_values');
