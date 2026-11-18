-- V2-07 (ADR-29): invitations + Before User Created hook (official pattern: no security definer, explicit grants and policies).
-- The invitation carries role and agency; api.staff_provision takes them from here, never from the request.
create table core.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (char_length(email) <= 254),
  kind        text not null check (kind in ('staff', 'client')),
  role        text check (role in ('agent', 'manager', 'admin')),
  agency_id   uuid not null references core.agencies (id),
  invited_by  uuid references auth.users (id) on delete set null,
  expires_at  timestamptz not null default now() + interval '24 hours',
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  check (kind <> 'staff' or role is not null)
);
create unique index invitations_open_email_idx on core.invitations (lower(email)) where accepted_at is null;
create index invitations_invited_by_idx on core.invitations (invited_by);
create index invitations_agency_idx on core.invitations (agency_id);
alter table core.invitations enable row level security;
revoke all on core.invitations from anon, authenticated;
grant select, insert, update, delete on core.invitations to service_role;
create policy deny_api_roles on core.invitations for all to anon, authenticated using (false) with check (false);
create trigger invitations_audit after insert or update or delete on core.invitations for each row execute function audit.log_change('no_values');

grant usage on schema private, core, audit to supabase_auth_admin;
grant select on core.invitations to supabase_auth_admin;
create policy invitations_select_auth_admin on core.invitations for select to supabase_auth_admin using (true);
grant insert on audit.auth_events to supabase_auth_admin;
-- RLS is on and supabase_auth_admin is neither owner nor BYPASSRLS: without this policy the deny path itself fails with 42501
create policy auth_events_insert_auth_admin on audit.auth_events for insert to supabase_auth_admin with check (true);

create or replace function private.hook_before_user_created(event jsonb)
returns jsonb language plpgsql set search_path = '' as $$
declare v_email text := lower(event #>> '{user,email}');
begin
  if v_email is null or not exists (
      select 1 from core.invitations i
       where lower(i.email) = v_email and i.expires_at > now() and i.accepted_at is null) then
    insert into audit.auth_events (kind, ok, source) values ('user_created_denied', false, 'hook');
    return jsonb_build_object('error', jsonb_build_object('http_code', 403, 'message', 'ההרשמה בהזמנה בלבד.'));
  end if;
  return '{}'::jsonb;
end $$;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.hook_before_user_created(jsonb) from public, anon, authenticated;
