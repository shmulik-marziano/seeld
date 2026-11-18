-- Break-glass: the only admin is locked or disabled (FOUNDATION.md §6 (ח), IDENTITY.md §7).
-- Owner only, Dashboard > SQL Editor. Replace <USER_ID> (uuid from Authentication > Users). Never commit a filled-in copy.

-- 1. data side: re-activate and unlock, with an audit row
begin;
update core.staff set locked_until = null, active = true where user_id = '<USER_ID>';
insert into audit.log (actor_role, table_name, op, pk, new_data)
values ('owner_sql', 'core.staff', 'ACTION', '<USER_ID>', '{"action":"break_glass_unlock"}');
commit;

-- 2. auth side: lift the GoTrue ban (Dashboard alternative: Authentication > Users > the user > Unban)
update auth.users set banned_until = null where id = '<USER_ID>';

-- 3. check: active, not locked, not banned
select s.active, s.locked_until, u.banned_until
  from core.staff s join auth.users u on u.id = s.user_id
 where s.user_id = '<USER_ID>';
