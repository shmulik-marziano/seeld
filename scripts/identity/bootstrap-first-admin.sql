-- First-admin bootstrap for seeld-site (run ONCE, by the owner, in Dashboard > SQL Editor).
-- Procedure and context: docs/platform/IDENTITY.md §3. Nothing here contains a real address: replace the placeholders
-- in the editor, run each step on its own, and never commit the filled-in copy.
--
--   <ADMIN_EMAIL>    the first admin's email (the one that will sign in)
--   <DISPLAY_NAME>   2..80 characters, shown to colleagues
--
-- The default agency is the seed row from 20261119090100_core_agencies.sql.

-- ===== STEP 1: open a staff/admin invitation (valid 24 h; the before_user_created hook accepts only this) =====
do $$
declare
  v_email  text := lower(btrim('<ADMIN_EMAIL>'));
  v_agency uuid := '5eed0000-0000-4000-8000-000000000001';
begin
  if v_email like '<%' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    raise exception 'replace <ADMIN_EMAIL> with the real address first';
  end if;
  if exists (select 1 from core.staff s where s.role = 'admin' and s.active) then
    raise exception 'an active admin already exists: invite through staff-invite instead of this script';
  end if;
  insert into core.invitations as i (email, kind, role, agency_id, invited_by)
  values (v_email, 'staff', 'admin', v_agency, null)
  on conflict ((lower(email))) where accepted_at is null
  do update set expires_at = now() + interval '24 hours', kind = 'staff', role = 'admin', agency_id = v_agency;
  raise notice 'invitation open until %', (select max(expires_at) from core.invitations where lower(email) = v_email and accepted_at is null);
end $$;

-- ===== STEP 2 (Dashboard, not SQL) =====
-- Either  Authentication > Users > Invite user  (needs working Auth SMTP; the link is valid 10 minutes;
--         if it expires: Users > the user > Send password recovery),
-- or      Authentication > Users > Add user > Create new user, with a strong password and "Auto Confirm User" ticked
--         (no email needed; the hook still requires the open invitation from step 1).

-- ===== STEP 3: provision core.staff from the invitation (role and agency come from the invitation row) =====
select api.staff_provision(u.id, btrim('<DISPLAY_NAME>'))
  from auth.users u
 where lower(u.email) = lower(btrim('<ADMIN_EMAIL>'));
-- expected: {"ok": true, "role": "admin", "agency_id": "5eed0000-0000-4000-8000-000000000001"}

-- ===== STEP 4: check =====
select s.user_id, s.role, s.active, s.locked_until, s.agency_id,
       (select count(*) from auth.mfa_factors f where f.user_id = s.user_id and f.status = 'verified') as verified_totp_factors
  from core.staff s join auth.users u on u.id = s.user_id
 where lower(u.email) = lower(btrim('<ADMIN_EMAIL>'));
-- verified_totp_factors must become 1 after TOTP enrolment (IDENTITY.md §5); until then every staff RPC answers PT403.
