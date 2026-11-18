-- V2-17 (round-3 review): alert recipients are resolved when notify-worker CLAIMS the message, not when the alert is raised.
-- ops.raise_alert (090700) snapshots the active ops.alert_recipients into the outbox payload at enqueue time. Alerts raised
-- while the table is still empty (hosted, before owner step "insert one alert recipient") would carry recipients=[] forever,
-- reach no one, and end as 'undeliverable'. api.outbox_claim now overwrites payload.recipients for topic 'alert' with the
-- CURRENT active list, so a recipient added later still receives every pending alert, and a deactivated one stops at once.
-- The stored payload keeps its enqueue-time snapshot (audit only); notify-worker must use the claimed payload.
-- An empty list at claim time is a delivery failure for notify-worker: api.outbox_complete(id, false, 'no_recipients'),
-- which backs off and retries (1m, 5m, 30m, 2h) before the alert becomes 'undeliverable'.
-- Same signature and return type as 090800, so create or replace keeps the existing grants (service_role only).
create or replace function api.outbox_claim(p_limit integer default 20)
returns table (id bigint, topic text, payload jsonb, attempts integer, locked_until timestamptz)
language sql volatile security definer set search_path = '' as $$
  select o.id, o.topic,
         case when o.topic = 'alert'
              then o.payload || jsonb_build_object('recipients',
                     (select coalesce(jsonb_agg(r.email order by r.email), '[]'::jsonb) from ops.alert_recipients r where r.active))
              else o.payload end,
         o.attempts, o.locked_until
    from ops.outbox_claim(p_limit) o
$$;
