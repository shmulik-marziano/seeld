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
| `surense-webhook` | Surense via Svix | false | Svix signature + memory limit | `surense_event_ingest` |
| `surense-worker` | pg_cron `surense-worker-tick` (every minute, since 20261122180000) | false | `x-cron-secret` | `surense_job_claim`, `surense_job_complete`, `surense_job_enqueue`, mirror RPCs, `poa_ship_get`, `poa_ship_set`, `surense_gate`, `surense_audit`, `job_finish` |
| `surense-sync` | staff app (admin) | true | staff JWT -> `staff.admin_assert_fresh` (admin + fresh TOTP) | `surense_gate`, mirror RPCs, `surense_audit` |
| `surense-health` | owner / staff, by hand | true | platform JWT check only (read-only probe) | none (calls Surense only) |
| `sms-health` | owner, by hand (`select ops.call_function('sms-health')`, answer in `net._http_response`) | false | `x-cron-secret` (function secret or Vault via `cron_secret_ok`) | `cron_secret_ok`; calls Micropay `act=credit` only (balance; nothing is sent) |
| `poa-intake` | POA wizard (browser) | false | Origin allowlist + Turnstile + session token (SHA-256 only to the DB) + `poa_*` switches | `poa_config` (optional), `poa_session_*`, `poa_engine_ref_set`, `poa_preview_set`, `poa_consent_record`, `poa_document_from_url`, `poa_document_stored`, `poa_doc_get`, `poa_doc_claim`, `poa_ship_enqueue`, `surense_gate`, `surense_job_enqueue`, `surense_audit` |
| `client-docs` | staff app | true | staff JWT -> `staff.client_doc_get` (staff aal2 + fresh MFA + access log) | none with the service key (storage read only) |
| `forms-intake` | client forms `/forms` (browser) | false | Origin allowlist + Turnstile + session token (SHA-256 only to the DB) + `forms_*` switches | `form_config`, `form_session_start`, `form_session_get`, `form_step_save`, `form_submit`, `form_session_fail`, `form_document_add`, `form_document_stored` |
| `client-area` | personal client area `/my` (browser) | false | Origin allowlist + Turnstile on `/login/start` + one-time code to the mobile on file (Micropay) + session token (`Authorization: Bearer`, SHA-256 only to the DB) + `client_area_*` switches | `client_area_config`, `client_login_start`, `client_login_challenge_use`, `client_login_verify`, `client_session_get`, `client_portfolio_get`, `client_documents_list`, `client_document_get`, `client_logout` |

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
  _shared/surense/ Surense connector: env (presence), auth (OAuth token, memory only), client (host lock, retry,
                  timeout, error codes, audit sink), api (typed wrappers), svix, mirror (non-PII columns), storage
                  (client-docs, hash-named objects), sync (operations), jobs (queue handlers), connector (wiring)
  _shared/poa/    POA wizard backend: formatters (all value formats, one place), dp (public page API client), engine/
                  (PoaEngine interface + the "surense" engine), errors (six screen-8 kinds), rpc (typed api.poa_* wrappers),
                  session (token + SHA-256), storage (read side of client-docs), config (SURENSE_DP_HOST/_BASE/MANAGER_ID)
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
- **Cron contract**: `x-cron-secret` must equal `EDGE_CRON_SECRET`, or else the database must confirm it equals Vault
  `edge_cron_secret` (`api.cron_secret_ok`, service role, digest comparison; since 2026-11-23 the Vault is the source of truth and
  the function secret is an optional fast path; 503 only when neither exists, wrong = 401) -> answer `202`
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

## Surense connector (V3-01; migration 20261120200000; NOT deployed)

Direct API integration with Surense (`https://api.surense.com/api/v1`, OAuth2 client_credentials) plus Svix webhooks,
instead of Make/Zapier. Knowledge base: `C:/HQ/02_ידע/שורנס-API/` (README section 4 is the plan). Everything is behind
four `ops.config` switches, all `false` by default (missing key = closed): `surense_enabled` (every call and the
queue), `surense_write_enabled` (writes to Surense: proxies invite, E9100 submit, uploads), `surense_webhook_enabled`
(inbox), `surense_retention_enabled` (`ops.cleanup` purges mirror tombstones after 30 days and keeps the latest 3
portfolio snapshots per customer and mode). Admin flips them with `staff.admin_config_set`.

Rules in code: the outbound hosts are `api.surense.com` and, for pre-signed document DOWNLOADS only (never the bearer
token, never uploads), `surense-accounts-docs.s3.eu-west-1.amazonaws.com` (`_shared/surense/client.ts` `ALLOWED_HOSTS`;
approved by the owner 2026-11-22). Pre-signed links on any other host are refused and counted until the owner approves that host. The OAuth token lives
in memory per isolate (refreshed 60 s before `expires_in`, single flight, dropped on 401). Retries: 3 attempts, backoff
500 ms / 2 s, on 429/502/503/504 and network/timeout for idempotent calls; writes retry only on 429. Errors keep the HTTP
status and the numeric Surense code (40000, 40001, 40204, 40205) and drop the server text. Logs: method, path template,
status, duration. Writes leave one `audit.log` ACTION row through `api.surense_audit` (op, Surense id, status; no values).

- **surense-webhook** (`verify_jwt=false`): POST only -> 503 `disabled` without `SURENSE_WEBHOOK_SECRET`/DB or while
  `surense_webhook_enabled` is off -> memory limit 300/min per sender tag -> body <= 256 KB -> Svix signature over the raw
  body (HMAC-SHA256 of `id.timestamp.body`, any `v1,` entry, 5-minute window) BEFORE any DB call -> `api.surense_event_ingest`
  (DB limit 600/min, idempotent by `svix-id`, payload encrypted with `pii_enc_key`, one `surense.event` job queued) -> 200.
  Duplicates answer 200 (Svix retries non-2xx for about a day). Switch off (PT423) -> 503 `disabled` with
  `retry-after: 300` (a hint; Svix keeps its own schedule, nothing is stored). Key rotation: the signature is checked
  against `SURENSE_WEBHOOK_SECRET` and, when set, `SURENSE_WEBHOOK_SECRET_NEXT`; either verifies, and the log line names
  the slot that matched (`slot`) or a malformed one (`badSlots`), never a value.
- **surense-worker** (`verify_jwt=false`, cron contract as notify-worker): `api.surense_job_claim(5)` -> handler by kind ->
  `api.surense_job_complete(done|skipped|failed)`. Queue is `ops.surense_jobs`, not `ops.outbox` (notify-worker dead-letters
  unknown topics). Kinds: `surense.event` (by type: `dataproxy.*.approved`, `harb.uploaded`, `document.uploaded` -> pull
  that customer's documents; `swiftness.e9100.completed` -> E9100 download; `customer.created/updated` -> pull the
  customer; `customer.deleted`/`document.deleted` -> mark deleted; `lead.*` -> the lead's customer when named; anything
  else `skipped no_handler`), `surense.pull_customers` (cursor pass; an unfinished pass re-queues itself),
  **Real event bodies** (verified 2026-11-23 on the first 40 deliveries): a FLAT object with `eventType` in PascalCase and
  `customerId`/`tenantId`/`agencyId`/`date` plus the entity's fields at top level; no `type`, no `data` wrapper.
  `_shared/surense/events.ts` maps `NispahAlef|Bet|HeiProxyApproved` -> `dataproxy.aleph|bet|hei.approved`,
  `HarbDataLoaded` -> `harb.uploaded`, `SwiftnessE9100Completed|Submitted` -> `swiftness.e9100.completed|submitted`
  (the completion carries `txId` = the download's eventId, plus `misparMislaka`), and splits any other PascalCase name
  mechanically (`CustomerCreated` -> `customer.created`, `LeadCreated` -> `lead.created`). Until that fix every event
  was stored as `unknown` and skipped `no_handler`; the 40 were re-typed and re-queued by hand the same day.
  `surense.pull_documents`, `surense.e9100_download`, `surense.e9100_submit`, `surense.poa_ship` (a POA session completed on our
  side replayed into the tool: gate -> `poa_ship_get` -> engine start + consents -> `poa_ship_set`; then the E9100 launch). Failed jobs back off 1m/5m/30m/2h; attempt 5 -> dead + critical
  alert `surense_job_dead`. Without `SURENSE_CLIENT_ID`/`SURENSE_CLIENT_SECRET`: nothing claimed,
  `job_finish(false,'surense_not_configured')`. No cron job yet (owner decision 6.18).
- **surense-sync** (`verify_jwt=true`): POST `{action, ...}` with an admin JWT; `staff.admin_assert_fresh` must pass, then
  `api.surense_gate`. Actions: `health`, `pull-customers`, `pull-documents`, `invite-proxies` (returns the approval url
  only; Surense's message text is dropped and nothing is sent to the customer), `e9100-submit`, `e9100-download` (files to
  bucket `client-docs` at `surense/{customer}/e9100/{event}/{sha256}{.ext}`; the original name, which can contain an ID
  number, is stored only encrypted), `portfolio` (encrypted snapshot + product rows).
- **Mirror** (`crm.surense_customers`, `_documents`, `_products`, `_portfolios`): indexable columns hold Surense ids,
  status/class/source names, manager ids, dates, booleans, counts; everything personal is in `details_enc`
  (`private.pii_encrypt`); the national id is stored as `private.national_id_hmac` only. An older copy never overwrites a
  newer one (`surense_modified_at`).
- **Scopes**: after each token fetch `_shared/surense/auth.ts` splits the space-delimited `scope` string and compares it
  with `REQUIRED_SCOPES` (the exact OpenAPI names the `api.ts` wrappers need: `customers:read`, `customers:create`,
  `leads:create`, `leads:read`, `licensees:list`, `swiftness:accounts:list`, `swiftness:phishing:request`,
  `data_import:import`, `global:user`). Missing scopes and any `*:delete` scope are logged as warnings (scope names only);
  nothing is thrown.
- **Logs**: `_shared/logger.ts` also redacts the Surense field names (`cellNumber`, `idNumber`, `email1`/`email2`,
  `partnerCellNumber`, `partnerEmail`, `partnerIdNumber`, `firstName`, `lastName`, `fullName`, `birthDate`),
  `client_secret`, `svix-signature`, `url`/`href` (pre-signed links), and any value starting with `whsec_`,
  `sb_secret_` or `cid_` (replaced whole).

### surense-health (deployed v1, 2026-11-20)

`GET|POST /functions/v1/surense-health` (`verify_jwt=true`). Read-only probe of the Surense credentials: reports whether
`SURENSE_CLIENT_ID`/`SURENSE_CLIENT_SECRET` are set (booleans, length, 4-character id prefix), requests an OAuth token
(form body, then HTTP Basic, then JSON, so one call shows which mode Surense accepts) and calls four read-only endpoints
(`/user/info`, `/licensees`, `/swiftness/accounts/list`, `/documents/types`), returning statuses, counts, key lists and
the token response WITHOUT `access_token`/`refresh_token`/`id_token`. It writes nothing and touches no DB. It is
already deployed on seeld-site as version 1 (the repo file is that source); it is superseded later by the
`surense-sync` action `health` (admin + fresh TOTP), after which it can be parked with the owner's approval.
- **Unknowns to verify with the live key** (marked `TODO(real API)` in code): webhook payload shape (only `type` and
  uuid-shaped ids are read), sortable/filterable field names for the customer cursor pass and the document search, the
  download/upload hosts, rate limits.
- **Deployment gate:** apply the migration through `migrate.yml`; deploy the three functions; then OWNER-STEPS 1.10 in
  order (secrets, Vault keys, bucket, `surense_enabled`, Svix endpoint + `surense_webhook_enabled`, writes last).

## POA wizard backend (`poa-intake`, `client-docs`; contract: `docs/product/POA-WIZARD.md`; live since 2026-11-22)

Backend of the browser wizard (`src/lib/poa`). Switches in `ops.config`, all off by default: `poa_enabled`,
`poa_docs_enabled`, `poa_engine` (`surense`), `poa_native_shadow`, `poa_surense_url_id`, `poa_module_maslaka/harbit/policies`,
`poa_turnstile_required` (default true). Launch also needs the Surense switches (`surense_enabled`,
`surense_write_enabled`, and `surense_e9100_enabled` for the E9100 request).

- **poa-intake** (`verify_jwt=false`): routes `POST /start`, `POST /maslaka|/harbit|/policies`, `GET /state`,
  `GET /preview/:kind`, `GET /doc/:kind`. Order: preflight -> Origin allowlist (403) -> per-isolate reject counter (429) ->
  route + body cap (8 KB for `/start`; ~300 KB per consent, since every consent may carry the drawn signature) with a key whitelist per route -> `/start`: `api.poa_config` when the database has it
  (switch off -> 503 `{"error":"inactive"}` before anything is spent; without it the kill switches inside `api.poa_session_start` answer the same) -> Turnstile when `poa_turnstile_required` (token in body
  `turnstile_token`; missing or rejected -> 400) -> identity validation (id check digit, Israeli mobile only, names) ->
  `api.poa_session_start` (token generated here, only its SHA-256 sent as bytea) -> `api.surense_gate(write, invite-proxies)` -> engine
  -> `api.poa_engine_ref_set`; the same body shape and a padded duration for every identity (>= `POA_START_MIN_MS`, default 6000, overruns rounded up to a multiple of `POA_START_BUCKET_MS`, default 3000). Later routes read
  the token from `x-poa-session`, load the session with `api.poa_session_get` and refuse unless it is open. Errors are
  `{"error": "inactive|unavailable|generic|expired|locked|completed"}` only. Logs: route, kind, code, session id; never
  a value. The Surense duplicate paths (40204/40205) are absorbed by the engine and never shown.
- **Engine "surense"** (`_shared/poa/engine/surense.ts`): official API `customers.create` (needs `SURENSE_MANAGER_ID`; fails
  closed with `unavailable` without it) -> `licensees.list` (first active, cached in memory) -> `swiftness.accountsList`
  (first active) -> `proxies.invite` (only `url` is used; the message is dropped) -> the public page API
  (`SURENSE_DP_HOST`, default `dp.surense.com`; path prefix `SURENSE_DP_BASE`, default `/api`, a TODO until the owner's
  full run): `proxies/load`, `proxies/start`, then `proxies/swiftness`, `proxies/hb`, `proxies/policies` and
  `proxies/proxies_preview` (`sw|hb|p`). Host allowlist exactly `api.surense.com` + the dp host, https only, redirects refused, 15 s
  per call, no Authorization header; every call is audited (`poa.dp.*`, status and phase only) before it leaves.
- **Engine "native"** (`_shared/poa/engine/native.ts`, `poa_engine = native`, the engine of record since 2026-11-22): no call to
  the tool while the client is in the wizard. `/start` keeps a snapshot of the identity and the licence holder (`POA_LICENSEE_*`)
  inside the encrypted engine reference; previews and the signed final documents are rendered by `_shared/poa/render.ts` from
  `_shared/poa/templates.ts` (the tool's wording letter for letter; A4, Rubik from `_shared/pdfkit/fonts.ts`, the signature PNG
  decoded by `_shared/pdfkit/png.ts` and drawn in the client's slot of every document that came with one) and stored right after each consent (`api.poa_document_from_url(..., 'native')`). The last
  consent queues `surense.poa_ship`; the worker replays the session into the tool with the surense engine and then queues the
  E9100 launch. Staff: `staff.poa_session_list` (ship columns) and `staff.poa_ship_retry`.
- **Final documents and launch** (surense engine): the webhook events `dataproxy.aleph|hei|bet.approved` plan a document pull
  (`planEvent` now carries `poaKind` = maslaka|harbit|policies); afterwards `linkPoaDocument` calls `api.poa_document_link`
  with the newest document, first without a hash; for a customer that has a wizard session the bytes are then fetched, hashed,
  linked again and stored at `poa/{agency}/{session}/{kind}-{document}.pdf` (`api.poa_document_stored`) only when the download
  host is allowed and the link result names the agency; otherwise the document stays metadata-only. After the last module, `poa-intake` queues `surense.e9100_submit`
  (`customer_id`, `proxy_approval_date`, dedupe `e9100:<id>`; skipped for a customer that already existed); the worker
  handler runs it only when `surense_write_enabled` and `surense_e9100_enabled` are on, otherwise it completes `skipped`
  with code `e9100_switch_off`. The completed E9100 then follows the existing `e9100_download` path.
- **client-docs** (`verify_jwt=true`): `GET ?document_id=<uuid>` with a staff JWT; `staff.client_doc_get` as the caller
  (staff aal2, fresh MFA, access log), then the object streams from the private bucket with `content-disposition: attachment`,
  `cache-control: no-store`, `referrer-policy: no-referrer`. No signed URL.

## Client forms backend (`forms-intake`; contract: `docs/product/CLIENT-FORMS.md`; built 2026-11-23, off by default)

One client session for all the questionnaires of `/forms` (identity once, then the questionnaires of a card one after
another). Switches in `ops.config`: `forms_enabled` (master, off), `forms_health_enabled` (store the health answers; off =
only the derived screening result is kept), `forms_turnstile_required` (default true). No new secret.

- **forms-intake** (`verify_jwt=false`): `POST /start` (identity + consent + Turnstile -> `api.form_session_start`; the token
  goes back once, only its SHA-256 reaches the database), `GET /state` (submissions with the draft answers for resume,
  documents), `POST /step` (one step of one questionnaire; `draft_version` must be the one the server last answered, else
  409 `stale_draft`), `POST /submit` (final answers + signer evidence, idempotent), `POST /document` (base64 JSON, up to 6 MB,
  file signature checked against the extension; the row is created first so the database names the path
  `forms/{agency}/{session}/{kind}-{document}.{ext}`, the bytes go to `client-docs`, then `api.form_document_stored`).
  Order: preflight -> Origin (403) -> per-isolate reject counter (429) -> route + body cap + key whitelist -> switch
  (`api.form_config`, 503 `inactive`) -> Turnstile -> RPC. Errors are `{"error": "<kind>", "code": "<short code>"}`; the
  code is the database's short word (`stale_draft`, `already_submitted`, `feature_disabled:forms_enabled`) or the function's
  own (`invalid_phone`, `turnstile_rejected`), never a value. Logs: route, kind, code, session id.
- **Staff**: `staff.form_submission_list` / `form_submission_get` / `form_submission_set_status` (admin, fresh TOTP, access
  log); client uploads download through `client-docs` like POA documents (`staff.client_doc_get` joins both session kinds).

## Client area backend (`client-area`; contract: `docs/product/CLIENT-AREA.md`; built 2026-11-24, off by default)

The personal area of a client on the site (`/my`). Login by unique data only: the national id and the mobile number we
already hold (`crm.customers`, filled by the POA wizard and the Tokyo import), then a one-time code to that mobile
(Micropay, `_shared/sms/micropay.ts`), then a 30-day session. Data: the Surense mirror (`crm.surense_products`,
decrypted inside `api.client_portfolio_get` for one call, shaped by `_shared/client/portfolio.ts`) and the POA files of
the client's wizard sessions (`crm.documents`, joined on the national id hmac). Switches in `ops.config`:
`client_area_enabled` (master, off), `client_area_turnstile_required` (default true), `client_area_retention_enabled`
(off: nothing is deleted until the owner opens it).

- **client-area** (`verify_jwt=false`): `POST /login/start` (`api.client_login_start`: one challenge row for a hit and a miss
  alike; a hit sends the code with `otpSend`; the answer and the padded duration are the same either way), `POST /login/verify`
  (`api.client_login_challenge_use` counts the attempt and hands the mobile to the function for `otpVerify`; a valid code
  opens the session through `api.client_login_verify`, the token goes back once), `GET /me`, `GET /portfolio`,
  `GET /documents`, `GET /documents/:id` (a signed Storage link, 5 minutes, after `api.client_document_get` confirmed the
  owner and wrote the access log), `POST /logout`. Order: preflight -> Origin (403) -> per-isolate reject counter (429) ->
  route + body cap (4 KB) + key whitelist -> switch (`api.client_area_config`, 503 `inactive`) -> Turnstile -> RPC.
  Errors are `{"error": {"code": "<code>"}}` with `inactive | unauthenticated | wrong_code (+tries_left) | max_tries |
  expired | generic | rate_limited | unavailable | not_found`; never a value. Logs: route, code, ids; never a phone, an id,
  a code, a token or a url.
- **Staff**: `staff.client_sessions_revoke(p_customer)` signs a client out everywhere (staff, own agency, audit row).
- **Retention**: pg_cron `client-area-cleanup` (daily) -> `ops.client_area_cleanup()`; deletes only while
  `client_area_retention_enabled` is on (challenges after 1 day, sessions 30 days past expiry or revocation).

## Environment (Edge Function secrets; NAMES only)

| Name | Used by | Required | Notes |
|---|---|---|---|
| `SEELD_SECRET_KEY` | lead-intake, notify-worker, chat-bot, fetch-cma-data | recommended | dedicated `sb_secret_*` (name it `automations`); falls back to the injected `SUPABASE_SECRET_KEYS` |
| `EDGE_CRON_SECRET` | notify-worker, fetch-cma-data, health (detail) | yes for cron | must equal Vault `edge_cron_secret` |
| `ALLOWED_ORIGINS` | lead-intake, chat-bot, health, poa-intake, client-docs, forms-intake, client-area | optional | comma list; default seeld.co.il + www; staging adds its preview origin |
| `SMS_API_TOKEN` | client-area, sms-health | yes for the client area | Micropay token with the SMS permission only (`_shared/sms/micropay.ts`); without it `/login/start` answers `unavailable` |
| `SMS_SENDER_ID` | client-area | optional | an approved Micropay sender id (number or name); absent = the account default |
| `ENV` | all | recommended | `production` / `staging` / `development`; unset = production (fail closed) |
| `TURNSTILE_SECRET_KEY` | lead-intake, poa-intake, forms-intake, client-area | yes in production | test secret on branches |
| `RESEND_API_KEY` | notify-worker | yes | |
| `NOTIFY_FROM` | notify-worker | optional | default `SEELD <no-reply@seeld.co.il>` (domain must be verified in Resend) |
| `NOTIFY_TO_INSURANCE`, `NOTIFY_TO_FINANCE`, `NOTIFY_TO_GENERAL` | notify-worker | optional | defaults Moshe@ / Shmulik@ / Shmulik@seeld.info |
| `LEAD_NOTIFY_TO` | notify-worker | optional | shared fallback for the three above |
| `NOTIFY_INCLUDE_PII` | notify-worker | optional | default false; needs `api.lead_notify_details` |
| `STAFF_APP_URL` | notify-worker | optional | default `https://seeld.co.il` |
| `GOOGLE_AI_API_KEY` | chat-bot | yes for chat | |
| `GEMINI_MODELS` | chat-bot | optional | comma list overrides the model chain |
| `SURENSE_CLIENT_ID`, `SURENSE_CLIENT_SECRET` | surense-sync, surense-worker, poa-intake | yes for Surense | OAuth client from Surense > Settings > API/Webhooks; never in git, Vercel or chat |
| `SURENSE_WEBHOOK_SECRET` | surense-webhook | yes for webhooks | the Svix endpoint signing secret (`whsec_...`) |
| `SURENSE_WEBHOOK_SECRET_NEXT` | surense-webhook | optional | second Svix secret during a rotation; either slot verifies; `health` shows a boolean only |
| `SURENSE_MANAGER_ID` | poa-intake, surense-worker | yes for the wizard and the ship job | uuid of the Surense user that owns customers the wizard creates (`POST /customers` requires `managerId`); without it `/start` answers `unavailable` |
| `SURENSE_DP_HOST` | poa-intake, surense-worker | optional | bare hostname of the public page API, default `dp.surense.com`; the only host besides `api.surense.com` the engine may reach |
| `SURENSE_DP_BASE` | poa-intake, surense-worker | optional | path prefix of the public page API, default `/api/v1/ifs/public` (verified 2026-11-22) |
| `POA_LICENSEE_NAME`, `POA_LICENSEE_LICENSE`, `POA_LICENSEE_PHONE`, `POA_LICENSEE_EMAIL` | poa-intake | optional (fallback) | the licence holder printed in the documents. Primary source since 2026-11-23: `ops.config` rows `poa_licensee_name` / `_license` / `_phone` / `_email`, returned by `api.poa_config` and read at every `/start` (name 2-80 chars, licence `[A-Za-z0-9-]{3,20}`, phone, e-mail); the secrets are used only when the rows are empty; neither = the native engine answers `unavailable` at `/start` |
| `POA_START_MIN_MS` | poa-intake | optional | floor of the `/start` duration in ms (0..20000, default 6000); tune after the full run |
| `POA_START_BUCKET_MS` | poa-intake | optional | an overrunning `/start` is rounded up to a multiple of this (500..20000, default 3000) |
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
2. (optional since 2026-11-23) Edge secret `EDGE_CRON_SECRET` = the Vault value. The functions now ask the database
   (`api.cron_secret_ok`) when the header does not match the function secret, so a missing or stale copy no longer blocks the
   ticks (the stale copy of 2026-11-21 made every tick answer 401 until this change).
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

CI (`.github/workflows/ci.yml`, job `functions`) runs the whole Deno suite in the same image, with the repo root
mounted (so `_shared/queueWorker.ts` resolves `../../../src/platform/...`):

```bash
entries="$(cd supabase/functions && ls -1 */index.ts | LC_ALL=C sort | tr '\n' ' ')"
docker run --rm -v "$PWD:/w" -w /w/supabase/functions denoland/deno:alpine-2.1.4 \
  sh -c "deno check --node-modules-dir=none $entries && deno test --no-prompt --node-modules-dir=none"
```

`--node-modules-dir=none` matters: the repo root has a `package.json`, so without the flag Deno expects a
`node_modules` folder for `npm:` imports (`staff-invite`) and fails on a fresh checkout
("Did you forget to run `deno install`?"). Locally it passes only because `npm ci` was run.

Per-folder runs:

```bash
# Deno (no local install needed; image used in CI-like runs)
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno test --no-prompt _shared/test.ts lead-intake/ notify-worker/ chat-bot/ fetch-cma-data/ health/
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno test --no-prompt _shared/surense/ surense-webhook/ surense-worker/ surense-sync/
docker run --rm -v "$PWD:/w" -w /w/supabase/functions denoland/deno:alpine-2.1.4   deno test --no-prompt --node-modules-dir=none _shared/poa/ poa-intake/ client-docs/ forms-intake/
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno test --no-prompt _shared/sms/ _shared/client/ sms-health/ client-area/
docker run --rm -v "$PWD/supabase/functions:/w" -w /w denoland/deno:alpine-2.1.4 \
  deno check lead-intake/index.ts notify-worker/index.ts chat-bot/index.ts fetch-cma-data/index.ts health/index.ts \
    surense-webhook/index.ts surense-worker/index.ts surense-sync/index.ts poa-intake/index.ts client-docs/index.ts forms-intake/index.ts \
    sms-health/index.ts client-area/index.ts
# vitest keeps covering the shared modules from the web side
npx vitest run src/test/edge-shared.test.ts src/test/surense-shared.test.ts
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
