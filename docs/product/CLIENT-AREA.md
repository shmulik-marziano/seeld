# Client area (`/my`): the contract

Owner decision 2026-11-23: a personal area on seeld.co.il for every client, secure per client, signed in by unique data
only (the national id and the mobile number we already hold) plus a one-time code to that mobile, fed by the Surense
mirror and the POA wizard. The owner is the first client. Everything is behind switches that are off by default.

Backend: edge function `client-area` (`supabase/functions/client-area`), migration `20261124100000_client_area.sql`,
shaping `supabase/functions/_shared/client/portfolio.ts`, SMS `supabase/functions/_shared/sms/micropay.ts`.
Browser: `src/...` (the UI PR; it talks only to the routes below).

## Login

1. `POST /login/start` with the national id and the mobile. The database looks for an active `crm.customers` row with that
   national id (hmac) AND that mobile. Hit or miss, one `crm.client_login_challenges` row is written and the same answer
   comes back (`challenge_id`, `phone_tail` of the number typed, `expires_in_sec` 600); only on a hit the function sends a
   6-digit code to the mobile through Micropay (`type sms`, valid 10 minutes, 2 sends, 5 wrong tries, WebOTP line for
   `seeld.co.il`). The function pads both paths to the same duration. Limits (per hour): 5 starts per national id, 10 per
   client address, 3 per mobile; Turnstile when `client_area_turnstile_required` is on.
2. `POST /login/verify` with the challenge id and the code. The database counts the attempt (10 lock the challenge) and
   hands the mobile to the function for the provider check; Micropay keeps the code (never our database). A valid code
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
| `GET /portfolio` | Bearer | `{as_of, categories: [{key, label, products: [{id, type_code, type_label, company_label, policy_number_masked, source, status, plan?, balance?, premium?, premium_frequency?, coverage?, start?, end?, track?}]}]}` |
| `GET /documents` | Bearer | `{documents: [{id, title, kind, created_at, size_bytes, downloadable}]}` |
| `GET /documents/:id` | Bearer | `{url, expires_in_sec}`: a signed Storage link (5 minutes) for one POA file of this client |
| `POST /logout` | Bearer | 204 |

Codes: `inactive` (503, switch off), `unauthenticated` (401, bad or expired token), `wrong_code`, `max_tries`, `expired`,
`generic` (400), `rate_limited` (429, `retry-after`), `not_found` (404), `unavailable` (503). Category keys: `pension`,
`gemel`, `hishtalmut`, `insurance_life`, `insurance_health`, `insurance_general`, `savings`, `other` (from the Surense
product type 1..46; labels in `portfolio.ts`). `source`: `maslaka | harbit | production | manual | other`. Policy numbers
are masked to the last four digits; hidden products are left out; no national id and no Surense internal id beyond the
product id ever leaves the function.

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

## Switches

| Key | Default | Meaning |
|---|---|---|
| `client_area_enabled` | false | master switch; every RPC refuses (PT423 -> 503 `inactive`) while off |
| `client_area_turnstile_required` | true | Turnstile on `/login/start` |
| `client_area_retention_enabled` | false | the cleanup deletes nothing while off |

Browser (Vite, Vercel): `VITE_CLIENT_AREA=on` shows `/my`; `VITE_CLIENT_AREA_URL` is the function base
(`https://<project>.supabase.co/functions/v1/client-area`). Secrets: `SMS_API_TOKEN` (Micropay), optional `SMS_SENDER_ID`,
`TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS`.

## Data pipeline

(Filled by PR B: the Surense portfolio pull that keeps `crm.surense_products` and `crm.surense_portfolios` current.)
