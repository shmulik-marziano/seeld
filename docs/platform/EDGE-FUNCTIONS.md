# Edge Functions (v2, seeld-site)

Contract source: `FOUNDATION.md` §7 / §9 / §10 and `IMPLEMENTATION-PLAN.md` T2. This file is the operational reference
for the five functions T2 owns. `staff-invite` belongs to T1 and is documented there.

| Function | Caller | verify_jwt | Auth in code | DB access (api schema, service key) |
|---|---|---|---|---|
| `lead-intake` | website forms (browser) | false | Origin allowlist + Turnstile + DB rate limits | `lead_replay`, `submit_lead`, `intake_note_reject` |
| `notify-worker` | pg_cron `notify-worker-tick` (every minute) | false | `x-cron-secret` | `outbox_claim`, `outbox_complete`, `job_finish` (+ optional `lead_notify_details`) |
| `chat-bot` | website chat widget (browser) | false | Origin allowlist + memory limit + DB limits | `chat_session_touch`, `chat_append` |
| `fetch-cma-data` | pg_cron `cma-sync-weekly` (Sun 03:00 UTC) | false | `x-cron-secret` | `cma_upsert_batch`, `cma_finish_sync`, `job_continue`, `job_finish` |
| `health` | site-watch / anyone | false | none (coarse); `x-cron-secret` or staff JWT for detail | `api.health` (anon-granted); `staff.ops_health` with a staff JWT |

`verify_jwt=false` everywhere here on purpose: the platform JWT check also accepts the publishable and secret API keys,
so it authenticates nothing for these callers (research/SUPABASE.md, "Securing Edge Functions"). Each function does its
own auth as listed.

## Layout

```
supabase/functions/
  _shared/        cors errors logger request rateLimit alerts auth (existing; T1 extends auth.ts)
                  env.ts        typed environment, envPresence() = names/booleans only
                  db.ts         PostgREST RPC client (apikey header only; PT4xx -> RpcError(status, code, short message))
                  ip.ts         client address: cf-connecting-ip, else LAST public x-forwarded-for hop (mirrors private.client_ip)
                  secret.ts     timingSafeEqual (SHA-256 based), x-cron-secret check (fails closed), shortHash = keyed
                                IP tag (HMAC-SHA-256 under a random per-isolate key that never leaves memory)
                  turnstile.ts  siteverify with remoteip (no idempotency_key); skip outside production, refuse in
                                production; production + allowlist: a missing or foreign hostname fails
                  resend.ts     Resend send with Idempotency-Key; retryable = 429/5xx/network
                  background.ts EdgeRuntime.waitUntil wrapper, x-job-run parsing
                  test.ts, test_helpers.ts   Deno tests + doubles (never imported by an index.ts)
  <fn>/index.ts    entrypoint: reads the env once, builds the RPC client, Deno.serve(handler)
  <fn>/handler.ts  all logic, dependencies injected (env, rpc, fetch, defer, clock)
  <fn>/test.ts     Deno tests for that handler
```

## Shared standards

- **Errors**: `{ "error": { "code", "message", "requestId", "details"? } }` from `_shared/errors.ts`; browser-facing
  messages are Hebrew. Codes: 400 bad_request, 401 unauthenticated, 403 forbidden, 405, 409 conflict, 413
  payload_too_large, 423 feature_disabled (a kill switch is off), 429 rate_limited (+ `retry-after`), 500 internal,
  503 unavailable.
- **Logs**: one JSON line per event through `_shared/logger.ts` (key and value redaction). Logged: request id, codes,
  statuses, outbox ids, counts, a 12-hex KEYED tag of the client address (HMAC under a random key per isolate; a plain
  hash would be reversible, since IPv4 is only 2^32 values, so it is never used). Never logged: names, phones,
  e-mails, message text, IP addresses or plain hashes of them, keys. DB error details/hints are dropped in `db.ts`
  (they can echo row values).
- **CORS**: `_shared/cors.ts` allowlist from `ALLOWED_ORIGINS` (default `https://seeld.co.il,https://www.seeld.co.il`).
  No `*` anywhere (CI greps for it). Exposed headers include `x-chat-session`, `retry-after`.
- **Keys**: service RPCs use `SEELD_SECRET_KEY` in the `apikey` header only. If it is not set, the platform-injected
  `SUPABASE_SECRET_KEYS` (`default` entry) is used, so the functions work before the owner creates the dedicated key;
  `health` shows which one (`edge.secret_key`). `SUPABASE_SERVICE_ROLE_KEY` is never read (CI greps for it).
- **Cron contract**: `x-cron-secret` must equal `EDGE_CRON_SECRET` (missing secret = 503, wrong = 401) -> answer `202`
  at once -> work inside `EdgeRuntime.waitUntil` -> report ONLY through `api.job_finish(x-job-run)`. A call without
  `x-job-run` (manual run) does the work and finishes no run.

## lead-intake

`POST /functions/v1/lead-intake`, headers `Origin` (allowlisted), `Content-Type: application/json`,
`Idempotency-Key: [A-Za-z0-9_-]{8,128}` (one per form submission; reuse it on retry).

Body (either shape):

```json
{ "kind": "contact", "full_name": "...", "phone": "05...", "email": "...", "message": "...",
  "payload": { "subject": "...", "page": "/contact" }, "utm": { "utm_source": "..." },
  "consent": true, "consent_version": "v1", "source": "/contact", "hp": "", "turnstile_token": "..." }
```
or `{ "lead": { ...same fields without the token... }, "turnstile_token": "..." }`.

Only the canonical keys (`kind full_name phone email message payload utm consent consent_version source hp`) are
forwarded to `api.submit_lead`; `turnstile_token` never enters the hashed payload, so a retry with a NEW token and the
same key replays. Allowed `payload` keys per kind live in `ops.intake_payload_keys` (DB-enforced).

Order (zero DB calls for steps 1-2 and for Turnstile rejects; no DB write before Turnstile):

1. Origin in allowlist, else 403 with `details.field = "origin"`. Memory counter per address: 30 early rejects in
   10 min -> 429 without DB.
2. Body <= 32 KB (413), JSON, Idempotency-Key, canonical shape (kind, full_name 2-120, consent true, phone/email
   format, at least one contact, flat payload with scalar values <= 200 chars and no 8-9 digit ID-like value, utm keys).
   `hp` (honeypot) non-empty -> `{ok:true}` and nothing is stored.
3. `api.lead_replay(key, payload)` (pure read): stored answer -> `{ok:true}`; different body -> 409.
4. Turnstile siteverify (`TURNSTILE_SECRET_KEY`): fail -> 403 with `details.field = "turnstile"` (so the site can tell
   it from the origin 403; `src/lib/leadIntake.ts` reads `details.field`). No `idempotency_key` is sent to Cloudflare
   (it expects a UUID and caches failures per key; step 3 already makes retries safe). In production with an allowlist
   a response without `hostname` fails. Secret missing: skipped with a warning when `ENV` is not production; 503 in
   production (ENV unset = production).
5. `api.submit_lead(payload, key, client_ip)`; client ip = `cf-connecting-ip` or the last public `x-forwarded-for` hop.
6. DB rejects after Turnstile: PT400 -> 400 (`details.field`), PT409 -> 409, PT423 -> 423 `feature_disabled` (the
   site shows its "form closed" text), PT429 -> 429
   (`retry-after: 600`); each also calls `api.intake_note_reject(reason, ip)` in the background.

Success body is always exactly `{"ok":true}`: no id, no duplicate flag. The notification is enqueued by
`api.submit_lead` itself (`private.enqueue('lead.created', {lead_id, kind, request_id})`, same transaction), so the
function makes no separate outbox call.

## notify-worker

Cron every minute: `select ops.call_function('notify-worker')`. Loop: `api.outbox_claim(20)` -> per row build the
e-mail -> Resend with `Idempotency-Key: outbox-<id>` -> `api.outbox_complete(id, ok, code)`. Stops claiming 20 s
before the 72 s budget (a claimed row costs an attempt). Overlapping runs are safe (`FOR UPDATE SKIP LOCKED` + 2-minute
lock). Delivery failures go back to the DB backoff (1m, 5m, 30m, 2h, then dead + `outbox_dead` alert); the run itself is
`ok=true` unless a DB call failed. `RESEND_API_KEY` missing: nothing is claimed, `job_finish(false,
'resend_not_configured')`.

- `alert` rows: recipients come from the CLAIMED payload (20261119091600 resolves `ops.alert_recipients` at claim time).
  Empty list -> `outbox_complete(id,false,'no_recipients')`.
- E-mail bodies are deterministic per row: no send-time clock anywhere (Resend answers 409
  `invalid_idempotent_request` when `outbox-<id>` comes back with a different body). The lead time is shown only when a
  stored `created_at` is available (from `lead_notify_details`). A 409 `invalid_idempotent_request` (an earlier attempt
  already reached Resend) is completed as sent with a warning; `concurrent_idempotent_requests` stays a normal retry.
- `lead.created` rows: staff e-mail WITHOUT PII by default: subject `פנייה חדשה (<kind>)`, kind, link
  `${STAFF_APP_URL}/app/leads/<id>`. Routing: `insurance` -> `NOTIFY_TO_INSURANCE` (default Moshe@seeld.info);
  `pension` / `portfolio_review` / `report` -> `NOTIFY_TO_FINANCE` (default Shmulik@seeld.info); `contact` ->
  `NOTIFY_TO_GENERAL` (default Shmulik@seeld.info), or insurance when the details say the subject is insurance/travel.
  `LEAD_NOTIFY_TO` (FOUNDATION §10) is a shared fallback for any department variable that is unset.
- `NOTIFY_INCLUDE_PII=true` adds name/phone/e-mail/message/payload from `api.lead_notify_details(p_lead_id)`. **That RPC
  does not exist yet** (open item for T0, proposed SQL below); while it is missing the worker logs one warning and sends
  the PII-free e-mail.
- Unknown topics -> `outbox_complete(false,'unknown_topic')`.

## chat-bot

`POST /functions/v1/chat-bot`, `Origin` allowlisted, body `{messages:[{role,content}], page?}` or the legacy widget shape
`{message, history}`; optional session key in header `x-chat-session` (or `session_id`) matching
`[A-Za-z0-9_-]{16,128}`; if absent or malformed a new key is minted and returned in the `x-chat-session` response header.

Port of the Tokyo `finance-chat`: Gemini OpenAI-compatible endpoint, models `GEMINI_MODELS` (default
`gemini-3.5-flash-lite, gemini-3.5-flash, gemini-flash-latest`), 12 s per attempt, retry on 404/408/429/5xx, 12-turn
window, 2,000 chars per turn, 700 output tokens, temperature 0.4, same system prompt, same Hebrew busy message, SSE
streamed back unchanged. Added: memory limit 20/min per address, `api.chat_session_touch` (kill switch
`chat_enabled` -> 503; DB limits 30/10 min per session and 60/h per address -> 429), `api.chat_append` for the user turn
and (after the stream ends, from a tee of the stream) the assistant text. Only the system prompt, the page path and the
visitor's turns go to Gemini, with e-mail/phone/ID-number patterns masked; the same masked text is stored. The DB gate
is never skipped: no DB client, no client address, or an unreachable/failed `chat_session_touch` -> 503 with the
"chat unavailable" text and no Gemini call (fail closed, so the `chat_enabled` kill switch cannot be bypassed).
`GOOGLE_AI_API_KEY` missing -> 503. There is no Turnstile on the chat: protection is Origin + memory limit + DB limits +
kill switch (the `config.toml` comment that says "Turnstile" is wrong; T5 owns that file).

## fetch-cma-data

Cron `cma-sync-weekly` (Sunday 03:00 UTC). Sources (data.gov.il CKAN `datastore_search`): gemelnet
`a30dcbea-a1d2-482c-ae29-8f781f5025fb`, pensyanet `6d47d6b5-cb08-488b-b333-f1e717b1e1bd`, bituachnet
`c6c62cc7-fe02-4b18-8f3e-813abfbb4647`. Per source: latest `REPORT_PERIOD` (newest record by sort; the SQL endpoint is
blocked), then pages of 2,000 rows (`filters={REPORT_PERIOD}`, `sort=_id asc`) -> `api.cma_upsert_batch` (same field
mapping as the Tokyo function, no `raw_data`) -> `api.cma_finish_sync(source, success|error, stats)`. CKAN calls retry 3
times (20 s timeout each). With `x-job-run` the work runs in slices of 50 s; an unfinished slice calls
`api.job_continue(run, 'fetch-cma-data', cursor)` and ends (the DB invokes the next slice with `{cursor}`); the last
slice calls `api.job_finish(run, ok = every source success, stats)`. `cma_finish_sync` sets `cma_refresh_pending`, and
`ops.watchdog` (every 10 min) then runs `content.refresh_fund_views()` and `content.refresh_investment_tracks()`: that
is the automatic refresh of `investment_tracks` from the official source.

Manual run (owner, SQL Editor, after `EDGE_CRON_SECRET` is set):
`select ops.call_function('fetch-cma-data');` (needs `edge_cron_enabled='true'`), or with curl and the cron secret,
optional body `{"source":"gemelnet"}` (runs in one invocation, no job run).

## health

`GET /functions/v1/health` -> exactly `{ok, degraded, cma_age_bucket}` from `api.health()` (`Cache-Control: no-store`);
DB unreachable -> 503 with `{ok:false, degraded:true, cma_age_bucket:"unknown"}`. Memory limit 60/min per address.
With a valid `x-cron-secret`: adds `edge` (stage, which secret NAMES are set, key source, region, deployment id, and which
header supplied the client address plus the x-forwarded-for hop count; never values). With `Authorization: Bearer
<staff JWT>`: adds `staff` = `staff.ops_health()` called as that user (needs `staff` in the exposed schemas); a refused
or failed staff call only drops the `staff` view (warning in the log) and the public body is answered as usual, so a
monitor that sends a stray Authorization header never sees the probe as down.

## Environment (Edge Function secrets; NAMES only)

| Name | Used by | Required | Notes |
|---|---|---|---|
| `SEELD_SECRET_KEY` | lead-intake, notify-worker, chat-bot, fetch-cma-data | recommended | dedicated `sb_secret_*` (name it `automations`); falls back to the injected `SUPABASE_SECRET_KEYS` |
| `EDGE_CRON_SECRET` | notify-worker, fetch-cma-data, health (detail) | yes for cron | must equal Vault `edge_cron_secret` |
| `ALLOWED_ORIGINS` | lead-intake, chat-bot, health | optional | comma list; default seeld.co.il + www; staging adds its preview origin |
| `ENV` | all | recommended | `production` / `staging` / `development`; unset = production (fail closed) |
| `TURNSTILE_SECRET_KEY` | lead-intake | yes in production | test secret on branches |
| `RESEND_API_KEY` | notify-worker | yes | |
| `NOTIFY_FROM` | notify-worker | optional | default `SEELD <no-reply@seeld.co.il>` (domain must be verified in Resend) |
| `NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL` | notify-worker | optional | defaults Moshe@ / Shmulik@ / Shmulik@seeld.info |
| `LEAD_NOTIFY_TO` | notify-worker | optional | shared fallback for the three above |
| `NOTIFY_INCLUDE_PII` | notify-worker | optional | default false; needs `api.lead_notify_details` |
| `STAFF_APP_URL` | notify-worker | optional | default `https://seeld.co.il` |
| `GOOGLE_AI_API_KEY` | chat-bot | yes for chat | |
| `GEMINI_MODELS` | chat-bot | optional | comma list overrides the model chain |
| injected: `SUPABASE_URL`, `SUPABASE_SECRET_KEYS`, `SUPABASE_PUBLISHABLE_KEYS`, `SB_REGION`, `DENO_DEPLOYMENT_ID` | all | platform | never set by hand |

## Cron wiring

```
pg_cron 'notify-worker-tick' (* * * * *)   -> select ops.call_function('notify-worker')
pg_cron 'cma-sync-weekly'   (0 3 * * 0)    -> select ops.call_function('fetch-cma-data')
ops.call_function: returns null while ops.config edge_cron_enabled <> 'true'; otherwise inserts ops.job_runs and calls
ops.http_invoke(run, name, body): Vault project_url + '/functions/v1/<name>?forceFunctionRegion=eu-central-1',
headers x-cron-secret (Vault edge_cron_secret), x-request-id, x-job-run; timeout 5000 ms (functions answer 202 at once).
```

Day-2 enable (owner, SQL Editor, in this order):
1. Vault: `project_url` and `edge_cron_secret` exist (created 2026-11-18 by T2 on seeld-site; check with
   `select name from vault.secrets`).
2. Edge secret `EDGE_CRON_SECRET` = the Vault value (copy it in the SQL Editor with
   `select decrypted_secret from vault.decrypted_secrets where name = 'edge_cron_secret';` and paste it into
   Edge Functions > Secrets; never into chat, git or a ticket).
3. `RESEND_API_KEY` set and `insert into ops.alert_recipients (email) values ('<address>');`
4. `update ops.config set value = 'true', updated_at = now() where key = 'edge_cron_enabled';`
5. Within 2 minutes: `select job, ok, finished_at, error from ops.job_runs order by id desc limit 5;` shows
   `notify-worker` rows with `finished_at` and `ok=true`.

## Proposed SQL for T0 (not applied; T2 may not add migrations)

```sql
-- api.lead_notify_details: PII for the staff e-mail, read only by notify-worker when NOTIFY_INCLUDE_PII=true
create or replace function api.lead_notify_details(p_lead_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('kind', l.kind, 'full_name', l.full_name, 'phone', l.phone, 'email', l.email,
                            'message', l.message, 'payload', l.payload, 'source', l.source, 'created_at', l.created_at)
    from crm.leads l where l.id = p_lead_id and l.deleted_at is null
$$;
revoke all on function api.lead_notify_details(uuid) from public, anon, authenticated;
grant execute on function api.lead_notify_details(uuid) to service_role;
```

## Tests

```bash
# Deno (no local install needed; image used in CI-like runs)
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno test --no-prompt _shared/test.ts lead-intake/ notify-worker/ chat-bot/ fetch-cma-data/ health/
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno check lead-intake/index.ts notify-worker/index.ts chat-bot/index.ts fetch-cma-data/index.ts health/index.ts
# vitest keeps covering the shared modules from the web side
npx vitest run src/test/edge-shared.test.ts
npx eslint supabase/functions
```

Hosted smoke (safe paths only): OPTIONS from an allowed origin = 204 with ACAO; POST from another origin = 403; a bad
phone = 400 `details.field=phone`; GET on POST-only functions = 405; cron functions without the secret = 503 (secret
unset) or 401; `GET /health` = 200 with three keys.

## Deploy

The repo source is authoritative. With the CLI (needs an access token, owner machine):
`supabase functions deploy lead-intake notify-worker chat-bot fetch-cma-data health --project-ref qxhpolktdfgcbxtfxgov`
(verify_jwt comes from `supabase/config.toml`). The first deploy (2026-11-18, T2) went through the Supabase MCP as one
esbuild bundle per function:

```bash
node_modules/.bin/esbuild supabase/functions/<fn>/index.ts --bundle --format=esm --platform=neutral --target=es2022 \
  --charset=utf8 --minify-whitespace --minify-syntax --legal-comments=none --outfile=<out>/<fn>.js
```

deployed as `index.js` with `verify_jwt=false`. A later CLI deploy from the repo replaces it with the multi-file source.
