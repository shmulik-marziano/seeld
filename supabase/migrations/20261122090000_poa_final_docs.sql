-- V3-02 follow-up (owner's full run 2026-11-22): the policies step of the tool's public page answers pre-signed links to the
-- three final documents, so poa-intake stores them right after the last approval (the webhook path stays the fallback).
--   api.poa_document_from_url(session, kind, sha256)   creates / refreshes the crm.documents row of a wizard session for a
--       document that arrived as a link (no Surense document id is known yet) and answers {document_id, agency_id, ...} so the
--       function can build poa/{agency}/{session}/{kind}-{document}.pdf and record it with api.poa_document_stored
--   api.poa_session_fail   a code starting 'docs_' is now also accepted on a COMPLETED session (like 'launch_'): the
--       documents are stored after the session completed, and a failed store must leave a trace staff can see
-- Behind the same off switches: the new RPC needs poa_docs_enabled (poa_enabled stays the switch of the wizard itself).
-- Applying needs no secret.

-- the session is addressed by id (as every session-scoped RPC; the id came from api.poa_session_get). Only a LIVE run takes a
-- document: an open session inside its 60 minutes or one completed in the last 24 hours, and only for a module the visitor
-- performed. A repeat call is idempotent. A row that already holds a stored file is left untouched ({stored:true}): the
-- bytes in the bucket and the hash of the row must never drift apart.
create or replace function api.poa_document_from_url(p_session uuid, p_kind text, p_sha256 text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_doc uuid; v_stored boolean; v_complete boolean;
begin
  perform private.kill_switch('poa_docs_enabled');
  if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions where id = p_session for update;
  if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
  if s.status = 'locked' then raise exception 'session_locked' using errcode = 'PT403'; end if;
  if s.status = 'expired'
     or (s.status = 'open' and s.expires_at <= now())
     or (s.status = 'completed' and s.completed_at <= now() - interval '24 hours') then
    raise exception 'session_expired' using errcode = 'PT410';
  end if;
  if not coalesce((s.modules -> p_kind ->> 'enabled')::boolean, false) or not coalesce((s.modules -> p_kind ->> 'performed')::boolean, false) then
    raise exception 'invalid_input:kind' using errcode = 'PT400';
  end if;
  insert into crm.documents as d (session_id, kind, source, status, sha256)
  values (s.id, p_kind, 'surense', 'pending_staff_verification', decode(p_sha256, 'hex'))
  on conflict (session_id, kind) do update
    set sha256 = excluded.sha256
    where d.status in ('incomplete', 'pending_staff_verification') and d.storage_path is null
  returning d.id into v_doc;
  if v_doc is null then
    select d.id into v_doc from crm.documents d where d.session_id = s.id and d.kind = p_kind and d.status <> 'revoked';
    if v_doc is null then raise exception 'document_not_found' using errcode = 'PT404'; end if;
  end if;
  select d.storage_path is not null into v_stored from crm.documents d where d.id = v_doc;
  select not exists (select 1 from unnest(array['maslaka', 'harbit', 'policies']) k
                      where coalesce((s.modules -> k ->> 'enabled')::boolean, false)
                        and not exists (select 1 from crm.documents d where d.session_id = s.id and d.kind = k and d.status <> 'revoked'))
    into v_complete;
  if v_complete and s.docs_complete_at is null then update crm.poa_sessions set docs_complete_at = now() where id = s.id; end if;
  perform private.audit_action('crm.documents', v_doc::text, '{}', jsonb_build_object('action', 'poa_document_from_url', 'kind', p_kind, 'complete', v_complete));
  return jsonb_build_object('linked', true, 'session_id', s.id, 'agency_id', s.agency_id, 'document_id', v_doc, 'stored', v_stored, 'complete', v_complete);
end $$;

-- a code only (<= 80 chars). 'locked' also closes the session (the wizard shows the locked screen).
-- A code starting 'launch_' or 'docs_' is the exception for a COMPLETED session ('docs_' also for an open one: the last module
-- may have been approved a moment ago): 'launch_' records that the E9100 launch was not queued, 'docs_' that a final document
-- could not be stored (engine_last_error + an audit row), so staff can see which completed sessions need a manual step.
create or replace function api.poa_session_fail(p_session uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions;
begin
  perform private.kill_switch('poa_enabled');
  if p_code is null or p_code !~ '^[a-z0-9_.:-]{1,80}$' then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
  if p_code ~ '^(launch|docs)_' then
    if p_session is null then raise exception 'invalid_input:session' using errcode = 'PT400'; end if;
    select * into s from crm.poa_sessions where id = p_session for update;
    if not found then raise exception 'session_inactive' using errcode = 'PT401'; end if;
    if s.status <> 'completed' and not (p_code ~ '^docs_' and s.status = 'open') then raise exception 'invalid_input:code' using errcode = 'PT400'; end if;
    update crm.poa_sessions set engine_last_error = p_code where id = s.id;
    perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'],
      jsonb_build_object('action', case when p_code ~ '^docs_' then 'poa_docs_not_stored' else 'poa_launch_not_queued' end, 'code', p_code));
    return jsonb_build_object('ok', true);
  end if;
  s := private.poa_open_session(p_session);
  update crm.poa_sessions set engine_last_error = p_code, status = case when p_code = 'locked' then 'locked' else status end where id = s.id;
  perform private.audit_action('crm.poa_sessions', s.id::text, array['engine_last_error'], jsonb_build_object('action', 'poa_session_fail', 'code', p_code));
  return jsonb_build_object('ok', true);
end $$;

-- api.poa_document_link (webhook path): a row that already holds a stored file keeps its path and hash (the bucket object and
-- the hash must never drift apart); the answer says stored:true so the worker skips the download. Otherwise as before.
create or replace function api.poa_document_link(p_customer uuid, p_kind text, p_document_id uuid, p_sha256 text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s crm.poa_sessions; v_doc uuid; v_complete boolean; v_stored boolean;
begin
  if p_customer is null or p_document_id is null then raise exception 'invalid_input:ids' using errcode = 'PT400'; end if;
  if p_kind is null or p_kind not in ('maslaka', 'harbit', 'policies') then raise exception 'invalid_input:kind' using errcode = 'PT400'; end if;
  if p_sha256 is not null and p_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'invalid_input:sha256' using errcode = 'PT400'; end if;
  select * into s from crm.poa_sessions x
   where x.surense_customer_id = p_customer
     and ((x.status = 'open' and x.expires_at > now()) or (x.status = 'completed' and x.completed_at > now() - interval '24 hours'))
     and coalesce((x.modules -> p_kind ->> 'enabled')::boolean, false)
     and coalesce((x.modules -> p_kind ->> 'performed')::boolean, false)
   order by x.created_at desc limit 1
   for update;
  if not found then return jsonb_build_object('linked', false, 'session_id', null); end if;
  if exists (select 1 from crm.documents d2 where d2.session_id = s.id and d2.kind <> p_kind and d2.surense_document_id = p_document_id) then
    return jsonb_build_object('linked', false, 'session_id', s.id, 'reason', 'already_linked');
  end if;
  insert into crm.documents as d (session_id, kind, source, status, surense_document_id, sha256)
  values (s.id, p_kind, 'surense', 'pending_staff_verification', p_document_id, case when p_sha256 is not null then decode(p_sha256, 'hex') end)
  on conflict (session_id, kind) do update
    set surense_document_id = excluded.surense_document_id, sha256 = coalesce(excluded.sha256, d.sha256)
    where d.status in ('incomplete', 'pending_staff_verification') and d.storage_path is null
  returning d.id into v_doc;
  if v_doc is null then select d.id into v_doc from crm.documents d where d.session_id = s.id and d.kind = p_kind; end if;
  select d.storage_path is not null into v_stored from crm.documents d where d.id = v_doc;
  select not exists (select 1 from unnest(array['maslaka', 'harbit', 'policies']) k
                      where coalesce((s.modules -> k ->> 'enabled')::boolean, false)
                        and not exists (select 1 from crm.documents d where d.session_id = s.id and d.kind = k and d.status <> 'revoked'))
    into v_complete;
  if v_complete and s.docs_complete_at is null then update crm.poa_sessions set docs_complete_at = now() where id = s.id; end if;
  perform private.audit_action('crm.documents', v_doc::text, '{}', jsonb_build_object('action', 'poa_document_link', 'kind', p_kind, 'complete', v_complete));
  return jsonb_build_object('linked', true, 'session_id', s.id, 'agency_id', s.agency_id, 'document_id', v_doc, 'complete', v_complete, 'stored', coalesce(v_stored, false));
end $$;

revoke all on function api.poa_document_from_url(uuid, text, text) from public, anon, authenticated;
grant execute on function api.poa_document_from_url(uuid, text, text) to service_role;
