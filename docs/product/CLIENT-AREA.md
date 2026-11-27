# Client area (`/my`): product and platform notes

Owner decision 2026-11-23: the personal area for clients is OURS (seeld.co.il), secured per client, sign-in by unique data
on file (ID number + mobile) with a one-time code to the mobile. Surense is the data source for now; the data lands in
our database first, and the pages read only from there. Everything is behind switches, off by default. This file collects
the platform notes section by section as the parts land; the product spec of the screens is a separate section to come.

## Data pipeline (migration `20261124090000_surense_portfolio_pull`; worker kinds `surense.portfolio_pull`, `surense.portfolio_sweep`)

What the client area shows is the customer's processed portfolio as Surense computes it (`POST /customers/{id}/portfolio`:
products with company, type, policy number, coverages, premiums, balances, plus totals and distributions). Verified live
on 2026-11-23: `mode` is a **coded enum** (1 = pre-advice / טרום_טיפול, needs `misparMislaka`; 2 = production /
פרודוקציה, needs `month`; the Hebrew names of the OpenAPI are read as null), and the same customer usually has both:
production is the agency's own book (incl. insurance policies with `type`/`sivugPolisa`), pre-advice is the full
clearing-house picture (every pension product, any agent). The pull reads `GET /customers/{id}/portfolio/history` first and
takes **both** snapshots when they exist (latest production month, latest pre-advice request number); `crm.surense_products`
keeps one row per product id either way. A customer with neither ends `skipped no_portfolio_data`. The pipeline keeps the
copies in our mirror:

- **Where it lands:** `crm.surense_portfolios` (one encrypted snapshot per pull, `mode = 'production'`, `product_count`,
  `fetched_at`) and `crm.surense_products` (one row per product, indexable columns = Surense ids, company id, product
  type, hidden flag, modified date; everything personal in `details_enc`). Written through the existing
  `api.surense_portfolio_store` (`_shared/surense/sync.ts` `portfolio()`). Retention: `ops.cleanup` keeps the latest 3
  snapshots per customer and mode only while `surense_retention_enabled` is on (no-delete rule otherwise).
- **Switch:** `surense_portfolio_enabled` (`ops.config`, default `false`; `staff.admin_config_set`). It gates the two
  cron enqueuers and the due list; `surense_enabled` still gates the queue and every Surense call. Off = nothing is queued.
- **Daily sweep (02:30 UTC, pg_cron `surense-portfolio-sweep`):** `ops.surense_portfolio_sweep_enqueue()` queues one
  `surense.portfolio_sweep` job (dedupe `portfolio_sweep`). The worker asks `api.surense_portfolio_due(30, 200)` for the
  customers whose latest production snapshot is missing or older than **30 days** (never-pulled first) and queues one
  `surense.portfolio_pull {customer_id}` per customer (dedupe `portfolio:<id>`, so a customer is never in the queue
  twice). A sweep cut by the worker's budget re-queues itself and continues.
- **Weekly customer pass (Monday 02:00 UTC, pg_cron `surense-customers-weekly`):** `ops.surense_customers_pull_enqueue()`
  queues `surense.pull_customers` (the existing cursor pass over every customer the key can see), so new Surense customers
  reach the mirror and the next sweep picks them up.
- **Event follow-ups (same day, not the next sweep):** after a `surense.event` job finishes `done` for
  `harb.uploaded` (Har HaBituach file loaded), `swiftness.e9100.completed` (clearing-house data arrived) or
  `customer.updated`, the worker queues `surense.portfolio_pull` for that customer. A paged documents pull that continues
  in a follow-up job does not add the portfolio follow-up (one `next` per job); the sweep covers it.
- **Failures:** a Surense permanent 4xx (no such customer, no access) ends the pull `skipped` with the code; 5xx/429/network
  retry with the queue's backoff (1m, 5m, 30m, 2h; dead + alert at attempt 5). Logs carry ids, counts and codes only.
- **Not here yet:** the client-facing read (RPC that shapes the latest snapshot for one signed-in client), the sign-in,
  the pages. See the next sections as they land.

Enable order (owner): migration applied + `surense-worker` deployed -> `surense_portfolio_enabled = true` ->
`select ops.surense_customers_pull_enqueue();` once (fills the mirror) -> `select ops.surense_portfolio_sweep_enqueue();`
once (first pull of everyone) -> check `select kind, status, count(*) from ops.surense_jobs group by 1, 2;` and
`select count(*) from crm.surense_portfolios where mode = 'production';` over the next minutes.

## Login

1. `POST /login/start` with the national id and the mobile. The database looks for an active `crm.customers` row with that
   national id (hmac) AND that mobile. Hit or miss, one `crm.client_login_challenges` row is written and the same answer
   comes back (`challenge_id`, `phone_tail` of the number typed, `expires_in_sec` 600); only on a hit the function sends a
   6-digit code to the mobile through Micropay (`type sms`, valid 10 minutes, 2 sends, 5 wrong tries, WebOTP line for
   `seeld.co.il`). The SMS goes out in the background after the answer (since 2026-11-28), so a hit and a miss answer alike
   in content and time even while the provider is slow or down; a failed send raises `sms_unavailable` through
   `api.sms_report`. The function pads both paths to the same duration. Limits (per hour): 5 starts per national id, 10 per
   client address, 3 per mobile; Turnstile when `client_area_turnstile_required` is on.
2. `POST /login/verify` with the challenge id and the code. The database counts the attempt (10 lock the challenge) and
   hands the mobile to the function for the provider check. `tries_left` is `5 - attempts` for a hit and a miss alike, and
   attempt 6 on answers `max_tries` without asking the provider (2026-11-27 review: a miss used to show `10 - n`); Micropay keeps the code (never our database). A valid code
   opens a 30-day `crm.client_sessions` row; the token (32 random bytes, base64url) goes back once and only its SHA-256 is
   stored. A challenge opens one session only; the encrypted mobile is cleared at verification.
3. Every other route carries `Authorization: Bearer <token>`; `POST /logout` revokes it; staff can revoke every session of
   a client (`staff.client_sessions_revoke`).

Why these two values: the national id is already an hmac column on `crm.customers` (the POA wizard and the import write
it) and the mobile is the only channel we can prove possession of. Nothing a stranger can learn from the site: a miss
answers exactly like a hit, no "unknown customer".

## Routes (JSON, snake_case; errors `{"error": {"code": "..."}}`)

| Route | Body / header | 200 |
|---|---|---|
| `POST /login/start` | `{national_id, phone, turnstile_token?}` | `{challenge_id, phone_tail, expires_in_sec}` |
| `POST /login/verify` | `{challenge_id, code}` | `{token, expires_at, client: {first_name, last_name}}`; 400 `wrong_code` (+`tries_left`), `max_tries`, `expired` |
| `GET /me` | Bearer | `{client: {first_name, last_name, agency_name}, data_as_of, summary: {products, categories: [{key, label, count}]}, session: {expires_at}}` |
| `GET /portfolio` | Bearer | `{as_of, categories: [{key, label, products: [{id, type_code, type_label, company_label, policy_number_masked, source, status, active, plan?, balance?, premium?, premium_frequency?, coverage?, start?, end?, track?, ytd_return_pct?, fee_balance_pct?, fee_deposit_pct?, last_deposit?, covers?, cover_lines?, protects?, protects_unclear?, pension_cover?}]}]}` |
| `GET /documents` | Bearer | `{documents: [{id, title, kind, created_at, size_bytes, downloadable}]}` |
| `GET /documents/:id` | Bearer | `{url, expires_in_sec}`: a signed Storage link (5 minutes) for one POA file of this client |
| `GET /harb` | Bearer | `{enabled, last_upload: {created_at, processed} \| null}` |
| `POST /harb` | Bearer, `{bytes_base64}` | `{document_id, duplicate, queued}`; 422 `harb_invalid` + `reason` (`not_xlsx`, `too_large`, `too_many_sheets`, `too_many_rows`, `bad_layout`, `empty`, `id_mismatch`, `bad_file`) |
| `GET /requests` | Bearer | `{enabled, requests: [{id, topic, message, contact, created_at, status: received\|done}]}` (off: `{enabled:false, requests:[]}`) |
| `POST /requests` | Bearer, `{topic: insurance\|savings\|details\|other, message?, contact: phone\|whatsapp\|email}` | 201 `{id, created_at}`; a `crm.leads` row (source `client_area`) |
| `POST /logout` | Bearer | 204 |

Codes: `inactive` (503, switch off), `unauthenticated` (401, bad or expired token), `wrong_code`, `max_tries`, `expired`,
`generic` (400), `rate_limited` (429, `retry-after`), `not_found` (404), `unavailable` (503). Category keys: `pension`,
`gemel`, `hishtalmut`, `insurance_life`, `insurance_health`, `insurance_general`, `savings`, `other` (from the Surense
product type 1..46; labels in `portfolio.ts`). `source`: `maslaka | harbit | production | manual | other`. Policy numbers
are masked to the last four digits; hidden products are left out; no national id and no Surense internal id beyond the
product id ever leaves the function.

Product fields added 2026-11-27 (shaped in `portfolio.ts`): `status` is the Surense status label (live answers send
`{code, shortDescription}`), `active` = status code 1 / 4 / 7 / 8; `ytd_return_pct`, `fee_balance_pct`,
`fee_deposit_pct` are percents of the reported fractions (`netReturnPercentStartYear`, `accumulationFee`, `depositFee`),
left out when implausible (|return| > 50%, balance fee > 5%, deposit fee > 10%); `last_deposit` = the latest
`lastDeposit.hafkadot[].month`; `covers` = names of the live covers (`coverTypeDescription`, not expired);
`protects` = the home-screen protection tiles a LIVE product proves (by product type and cover type; a mortgage life
policy never counts as life cover). `pension_cover` (pension funds 1/2/19 only) = `{disability_monthly?, disability_pct?,
partner_pct?, orphan_pct?}` from `disabilityAllowance` (shekels a month) and `pensionDisabilityCoverage` / `partnerCoverage` /
`orphanCoverage` (fractions of the insured salary, live 0.75 / 0.6 / 0.4; outside 0.05..1 left out); the insured salary never
comes out. An active fund lights `disability` / `life` from those figures; when they did not arrive it returns
`protects_unclear` instead and the home screen shows neither tile (owner 2026-11-27: never tell an active pension member they
have no disability cover). A managers' policy (type 8) is in the `pension` category (its balance is money, its deposits are
not a premium); its `cover_lines` leave out coverType 37 (the savings part) and `shumBituahLeMikreMavet` > 0 lights `life`.
The home screen is computed in the browser from this answer
(`src/lib/client-area/overview.ts`): sums of reported balances and premiums only.

## Requests (migration `20261127090000_client_area_dashboard`)

A request from the "פנייה לסוכן" sheet is an ordinary lead: `api.client_request_create` writes `crm.leads` (kind by topic:
insurance -> `insurance` desk, savings -> `pension` (finance desk), details / other -> `contact` (general); name, mobile
and e-mail from `crm.customers`; payload `{origin, customer_id, topic, contact}`; consent version `client-area-1`) and
queues `lead.created`, so notify-worker e-mails the desk (`NOTIFY_TO_INSURANCE` / `_FINANCE` / `_GENERAL`) and the
lead shows in the staff leads list. The client sees `received` while the lead is `new`, `done` for any other status
(spam is hidden). 6 requests per client per day. A text message to the desk is a follow-up (the Micropay sending API is
not documented in our files yet).

The same migration fills `crm.surense_products.product_type` / `.source` from the stored snapshots: Surense sends both
as objects (`{code, description}`), so the mirror had stored NULL for every product (fixed in `mirror.ts`).

## Database

- `crm.client_login_challenges`: `customer_id` (null on a miss), `agency_id`, `national_id_hmac`, `phone_hmac`, `phone_enc`
  (cleared at verification), `phone_tail`, `matched`, `status pending|verified|expired|failed`, `attempts`, `ip_hash`,
  `expires_at` (10 minutes). `crm.client_sessions`: `customer_id`, `agency_id`, `token_hash` (sha256, unique), `expires_at`
  (30 days), `last_seen_at` (moves at most once a minute), `revoked_at`, `ip_hash`, `user_agent`. RLS deny for every API
  role; audit triggers (`no_values`); no personal plain column.
- RPCs (service role only): `api.client_area_config`, `api.client_login_start(p_national_id, p_phone, p_ip, p_ua_hash)`,
  `api.client_login_challenge_use(p_challenge)`, `api.client_login_verify(p_challenge, p_token_hash, p_ip, p_user_agent)`,
  `api.client_session_get(p_token_hash)`, `api.client_portfolio_get(p_token_hash)` (decrypts the product details for this
  call; access-logged), `api.client_documents_list(p_token_hash)`, `api.client_document_get(p_token_hash, p_document)`
  (access-logged + audit row), `api.client_logout(p_token_hash)`. Staff: `staff.client_sessions_revoke(p_customer)`.
  Every RPC starts with `private.kill_switch('client_area_enabled')`.
- Joins: products and Surense documents through `crm.surense_customers.national_id_hmac = crm.customers.national_id_hmac`
  (not deleted in Surense); POA files through `crm.poa_sessions.national_id_hmac`. The data pipeline (PR B) fills the mirror.
- Retention: `ops.client_area_cleanup()` daily (pg_cron `client-area-cleanup`), active only with
  `client_area_retention_enabled`.
- Tests: `supabase/tests/16_client_area.test.sql` (pgTAP), `supabase/functions/client-area/test.ts`,
  `_shared/client/test.ts`, `_shared/sms/test.ts` (Deno).

## Har HaBituach, client path (migration `20261125120000_harb_client_upload`; worker kind `surense.harb_import`)

Har HaBituach (`harb.cma.gov.il`, the government insurance registry) has no API. A client can sign in there with the
government identification and download an .xlsx of all their policies ("יצוא לאקסל"). The personal area takes that file
from the client and, when the owner turns it on, pushes it into Surense's data import (the same parsing as "טעינת קבצים ->
קבצי הר הביטוח" in their UI), so the policies land in the processed portfolio the area shows.

1. **Card** (`GET /harb` -> `{enabled, last_upload: {created_at, processed} | null}`): the home screen shows it only while
   `client_area_harb_upload_enabled` is on. Three short lines on how to download the file, a link to the registry, one
   button (screen ס7 in `CLIENT-AREA-SPEC.md`).
2. **Upload** (`POST /harb {bytes_base64}`, at most 2 MB of file): the function checks the file itself
   (`_shared/harb/xlsx.ts`, no dependency: a minimal ZIP reader over the runtime's `DecompressionStream("deflate-raw")` with
   a per-entry output cap, declared-size and CRC check): ZIP magic, `[Content_Types].xml` (spreadsheetml) +
   `xl/workbook.xml`, at most 10 sheets, 5,000 rows, 100 entries, 4 MB per inflated part. Column A: up to 10 text cells before the first id row
   (the export has a title row and the header "תעודת זהות"), every other non-empty value a national id (5..9 digits,
   normalised to 9; the export writes it as a number), at least one, and exactly one distinct id. The format was checked
   against real exports locally (counts only; no real file is in the repo).
3. **Is it the client's?** `api.client_harb_add(token_hash, national_id, sha256, rows)` compares the id with the session's
   customer (`private.national_id_hmac` = `crm.customers.national_id_hmac`). A different id is not stored, not raised: it
   answers `{ok:false, error:'id_mismatch'}` and writes an audit row with the code only. 10 attempts per customer per day.
   The same file again (same sha256, stored) answers `duplicate`.
4. **Storage**: a `crm.documents` row (`kind harb_xlsx`, `source client`, `customer_id` = the client, no POA session),
   bytes in the private `client-docs` bucket at the path the database names
   (`harb/{agency}/{customer}/harb_xlsx-{document}.xlsx`), then `api.client_harb_stored` sets the path. Audit rows:
   `client_harb_add` (kind, rows), `client_harb_stored` (queued), `harb_import_set` (status, code).
5. **Push** (only with `surense_harb_import_enabled` on at store time; the job waits in the queue while `surense_enabled`
   is off): `ops.surense_jobs` `surense.harb_import {document_id}` (dedupe `harb:<document>`). The worker
   (`_shared/surense/harb.ts`) reads `api.harb_import_get` (PT423 unless BOTH harb switches are on -> `skipped
   harb_switch_off`), then, before any Surense call: the upload-host allowlist must not be empty
   (`DATA_IMPORT_UPLOAD_HOSTS`, empty in code) and `surense_harb_provider_match` must be set, else `skipped` with a code.
   Then `GET /data-import/providers` (exactly one enabled provider whose id equals the match or whose name contains it;
   a provider that needs `validityMonth`, a sub-provider or a manager without a known customer is `skipped` with a code),
   `POST /data-import/initiate` (one file `harb_<date>.xlsx`, `params.customerId` = the client's Surense id from our
   mirror when known), the PUT of a stored ZIP holding the file to `uploadUrl` (host-locked, no bearer; audited as
   `data_import.upload`), `POST /data-import/{id}/start`, and a follow-up job that polls `GET /data-import/{id}`
   (retry every 2 minutes, then the queue backoff; dead + alert at attempt 5). `PROCESSED` queues the portfolio pull of
   that customer. Every phase is written on the row (`import_status queued|initiated|uploaded|sent|processed|failed|skipped`,
   `import_id`, `import_code`), so a retry resumes (an `uploaded` row only starts again). 403 on initiate (another import of
   the same user is running) retries after 15 minutes. Our code never calls revert.
6. **Staff fallback** `staff.harb_fallback_list(p_days default 5)`: POA wizard sessions of the caller's agency with a
   `poa_harbit` consent signed less than `p_days` Israeli business days ago (Sunday..Thursday; holidays not counted) and no
   Har HaBituach file of that person stored since the signing, so the agent pulls it by hand before the window closes.
   Admin + fresh TOTP + access log; masked id and phone tail only. No staff screen yet.

Enable order (owner, after the migration is applied and `client-area` + `surense-worker` are deployed): owner uploads his
own export with only `client_area_harb_upload_enabled` on (stored, nothing queued) -> Surense confirms the provider and the
upload host -> a code PR adds the host to `DATA_IMPORT_UPLOAD_HOSTS` -> `surense_harb_provider_match` set ->
`surense_harb_import_enabled` on. Files stored while the push switch was off are not queued by themselves; to push them:
`select api.surense_job_enqueue('surense.harb_import', jsonb_build_object('document_id', id), 'harb:' || id) from crm.documents
where kind = 'harb_xlsx' and storage_path is not null and import_status is null;` (needs `surense_enabled`).

**Open with Surense (owner):** the exact name or id of the Har HaBituach provider in `GET /data-import/providers` (and its
`properties`: `managerRequired`, `validityMonthRequired`, sub-providers) and the host of the data-import `uploadUrl` (the
OpenAPI example shows `surense.data-import.files.s3.eu-west-1.amazonaws.com`; it is not added until confirmed). Not in
this part: an SMS / notice to the client after the import, a staff download of the uploaded file, a retention window for
the files (no-delete rule: nothing is deleted).

## Switches

| Key | Default | Meaning |
|---|---|---|
| `client_area_enabled` | false | master switch; every RPC refuses (PT423 -> 503 `inactive`) while off |
| `client_area_turnstile_required` | true | Turnstile on `/login/start` |
| `client_area_retention_enabled` | false | the cleanup deletes nothing while off |
| `client_area_harb_upload_enabled` | false | the Har HaBituach card and upload (`/harb`); also required by the Surense push |
| `surense_harb_import_enabled` | false | queue the Surense push of an uploaded file (needs the upload switch and `surense_enabled`) |
| `surense_harb_provider_match` | `''` | the data-import provider (id or part of its name); empty = the push ends `skipped` before any call |
| `client_area_requests_enabled` | false | the requests tab and sheet (`/requests`); off = the area shows the contact icons instead |

Browser (Vite, Vercel): `VITE_CLIENT_AREA=on` shows `/my`; `VITE_CLIENT_AREA_URL` is the function base
(`https://<project>.supabase.co/functions/v1/client-area`). Secrets: `SMS_API_TOKEN` (Micropay), optional `SMS_SENDER_ID`,
`TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS`.

