# POA wizard: the ratified contract (browser <-> `poa-intake`)

Status: implemented behind switches that are all OFF. Nothing here is deployed or enabled by the build.
Spec: `POA-WIZARD-SPEC.md` (sections 1א, 3, 5). Reference flow: `ONBOARDING-POA-FLOW.md` (sections 1-3, 5א).
Browser side of the contract: `src/lib/poa/api.ts` (types `StartReq`, `StartRes`, `ConsentReq`, `ConsentRes`,
`StateRes`, `POA_RESPONSE_KEYS`, `ErrorKind`). Server side: `supabase/functions/poa-intake`, `supabase/functions/client-docs`,
`supabase/functions/_shared/poa/`.

## 1. Switches (`ops.config`, all default as listed; flipped with `staff.admin_config_set`)

| key | default | meaning |
|---|---|---|
| `poa_enabled` | `false` | master switch: every `poa-intake` route and every `api.poa_*` RPC (except the document link) |
| `poa_docs_enabled` | `false` | final-document download (`GET /doc/:kind`) and the webhook document link |
| `poa_engine` | `surense` | `surense` (primary) or `native` (not implemented by `poa-intake`: answers `unavailable`) |
| `poa_native_shadow` | `false` | parallel native render (not implemented here) |
| `poa_surense_url_id` | empty | kept per spec; unused by the official-API path (the personal link comes from `proxies/invite`) |
| `poa_module_maslaka` / `poa_module_harbit` / `poa_module_policies` | `true` | which of the three modules exist for a session |
| `poa_turnstile_required` | `true` | `POST /start` needs a valid `turnstile_token` |

Launch ("הזנקה") additionally needs `surense_enabled`, `surense_write_enabled` (proxies invite, customer create) and, for the
E9100 request, `surense_e9100_enabled`. The browser switch (`VITE_POA_FLOW`) stays off until the owner flips it.

Server environment (names only): `ALLOWED_ORIGINS`, `TURNSTILE_SECRET_KEY`, `SURENSE_CLIENT_ID`, `SURENSE_CLIENT_SECRET`,
`SURENSE_MANAGER_ID` (the Surense user that owns created customers; required, fail closed with `unavailable` when missing),
`SURENSE_DP_HOST` (default `dp.surense.com`, bare hostname only), `SURENSE_DP_BASE` (path prefix of the public-page API,
default `/api`, see section 6).

## 2. Routes (JSON, snake_case; base `/functions/v1/poa-intake`, `verify_jwt=false`)

All calls need an `Origin` in `ALLOWED_ORIGINS` (403 otherwise). The session token travels in the header `x-poa-session`
(32 to 128 chars of `[A-Za-z0-9_-]`); the browser keeps it in a variable only. Unknown body keys are rejected (400).

| route | request body keys | success body keys |
|---|---|---|
| `POST /start` | `first_name`, `last_name`, `national_id` (9 digits, check digit), `phone` (`05XXXXXXXX` or `+9725XXXXXXXX`), `email` (string or null), `street` (street + house number, 2-80 chars, required), `city` (2-80 chars, required), `zip` (7 digits, required), `terms_privacy_approved` (must be `true`), `marketing_approved` (bool), `turnstile_token` | `session_token`, `expires_at`, `modules`, `next` |
| `GET /zip?street=&city=` | query only, no session (the address question runs before `/start`); Origin-gated, 30 lookups per client address per 10 minutes | `{"zip": "1234567"}` or `{"zip": null}`. Server-side lookup against Israel Post's locate-zip backend (`_shared/poa/zip.ts`; `POA_ZIP_LOOKUP=off` disables, `ISRAEL_POST_KEY` overrides the public key). Best effort: null means the visitor types it. |
| `POST /maslaka` | `preview_sha256` | `kind`, `method` (`check`), `approved_at`, `valid_until`, `modules`, `next` |
| `POST /harbit` | `preview_sha256`, `birth_date`, `issue_date` (ISO `YYYY-MM-DD`, not in the future) | same as above |
| `POST /policies` | `preview_sha256`, `signature_png` (PNG data URL, up to 300 KB) | same as above, `method` is `signature` |
| `GET /state` | none | `status` (`open`/`completed`/`expired`/`locked`), `expires_at`, `modules`, `next` |
| `GET /preview/:kind` | none | the PDF (`application/pdf`); header `x-poa-preview-sha256` carries the SHA-256 hex of the bytes (also stored in the session) |
| `GET /doc/:kind` | none | the stored final PDF, once, within 30 minutes of completion; `content-disposition: attachment`, `cache-control: no-store`, `referrer-policy: no-referrer`, `x-content-type-options: nosniff` |

`modules` is `{maslaka, harbit, policies}` each `{enabled, required, performed}`; `next` is the first enabled module not yet
performed, or `done`. `/start` answers with the same body shape and a padded duration for every identity (at least `POA_START_MIN_MS`, default 6 s, and an overrun is rounded up to a multiple of `POA_START_BUCKET_MS`, default 3 s; the real chain is 6-7 upstream calls and the duplicate-customer path adds one): whether
the person is already a customer is never visible (the server only records a `crm.poa_matches` row; when the Surense customer
already existed, the session is marked and the E9100 launch is skipped until staff confirm the match).

Errors: HTTP 4xx/5xx with body `{"error": "<kind>"}` where kind is one of `inactive | unavailable | generic | expired | locked | completed`
(the browser's `ErrorKind`). The body is authoritative; the status is a hint:

| kind | typical status | when |
|---|---|---|
| `inactive` | 401 (no/unknown session), 503 (`poa_enabled` off) | link or session not valid / feature off |
| `unavailable` | 503 | Surense or database down, timeout, 3xx, host not allowed, switch for Surense off, missing configuration |
| `generic` | 400 / 500 | bad input, unknown key, wrong preview hash, unexpected failure |
| `expired` | 410 | session older than 60 minutes |
| `locked` | 403 / 429 | blocked or too many attempts (rate limits) |
| `completed` | 409 | the process was already completed |

CORS: `Access-Control-Allow-Headers` includes `x-poa-session`; `Access-Control-Expose-Headers` includes `x-poa-preview-sha256`
and `content-disposition`.

## 3. Engine "surense" (primary)

The wizard never talks to Surense; `poa-intake` does (`_shared/poa/engine/surense.ts`). Per spec 1א:

1. `POST /customers` (official API, wrapper `customers.create`): national id, names, cell, email, `managerId`.
   A duplicate (codes 40204/40205) is resolved by a customer search and reuse, never shown to the browser; the session is
   marked `existing` and does not auto-launch E9100.
2. `POST /customers/proxies/invite` (`proxies.invite`) with `customerId`, `licenseeId` (first active licensee, cached in
   memory), `swiftnessAccountId` (first active account, only when `maslaka` is enabled) and the `nispah*` flags of the
   enabled modules. Only `url` is used: the urlId is the last path segment of `/app/p/<urlId>`; the message is dropped.
3. The public page API (`dp.surense.com`, server to server only; base path `/api/v1/ifs/public`, verified in the owner's
   full run of 2026-11-22, overridable with `SURENSE_DP_BASE`): `proxies/load`, `proxies/start`, then per module
   `proxies/swiftness`, `proxies/hb`, `proxies/policies`; `GET proxies_preview?sw=true|hb=true|p=true&sid=<sid>` returns the
   (unsigned) PDF. Host allowlist is exactly `api.surense.com` plus the dp host; HTTPS only, redirects refused, 15 s timeout per
   call, no `Authorization` header to the dp host. Every call is audited through `api.surense_audit` (op, status, phase; no values).
   Locked wire formats (verified 2026-11-22): every answer is `{nextStep, sid}`; `swiftness` sends `{sid}` only; `hb` sends
   `birthDate` and `nationalIdCardIssuingDate` as ISO `YYYY-MM-DD`; `policies` sends `signature` as the full PNG data URL
   (`data:image/png;base64,...`). Verified 2026-11-22 in the page's own bundle (`/app/static/js/main.*.js`): `load` is sent
   with `sid: null` (the page's sessionStorage is empty on a first visit) and null names, the SERVER mints the `sid` and every
   later call carries it (our engine requires it: `dp_no_sid` otherwise). **The page session lives in cookies** (the page's
   axios client runs with `withCredentials: true` and echoes the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`; without them `start`
   answers 400 "אין session או session פג תוקף", the first real client's failure of 2026-11-22): the engine keeps an explicit
   cookie jar per wizard session (`DpJar`, merged from every Set-Cookie, sent as `Cookie` + `X-XSRF-TOKEN`, `Origin` =
   the page's origin), stores it inside the encrypted engine reference (`cookie`, at most 1200 chars) and refreshes it after
   every consent/preview call. A "no session" refusal of `start` gets exactly one fresh load + start. `cellNumber` is E.164 (`+972…`, the page masks the
   last digits with `substring(11)`); `email`, `employerName`, `notes` are `null` when empty. A refused dp call carries the
   tool's reason in the code (`dp_http_400_<error.code or displayMessage, values stripped>`; a 400 maps to the `generic` kind, one mapping in
   `_shared/poa/errors.ts`).
4. Final documents, primary path: the `policies` answer is `{nextStep: 7, swiftnessProxyUrl?, hbProxyUrl, policiesProxyUrl}`,
   pre-signed S3 links to the three final PDFs. `engine.consent("policies")` returns them (`{swiftness?, hb?, policies?}`) and
   `poa-intake`, right after recording the consent, stores each one (`_shared/poa/finaldocs.ts`): fetch (HTTPS and exactly the
   download host `surense-accounts-docs.s3.eu-west-1.amazonaws.com`, approved by the owner 2026-11-22, downloads only; no
   `Authorization` header and no cookies, redirects refused, 15 s timeout, max 2 MB, `application/pdf` or
   `application/octet-stream` and a `%PDF-` start) -> SHA-256 -> `api.poa_document_from_url(session, kind, sha256)` (creates or
   refreshes the `crm.documents` row, returns `{document_id, agency_id, stored}`; needs `poa_docs_enabled`) -> private
   `client-docs` bucket at `poa/{agency}/{session}/{kind}-{document}.pdf` -> `api.poa_document_stored`. A failure here never
   fails the consent response: it is logged by code and recorded with `api.poa_session_fail(session, 'docs_<reason>')` (accepted
   on an open or completed session), and the webhook path below fills in whatever is missing. A closed `poa_docs_enabled` (423)
   skips the step silently. When the webhook path later links a Surense document to a row that already holds a file stored
   here, `api.poa_document_link` keeps the stored path and hash and answers `stored: true`, and the worker skips its own download.
   Final documents, fallback path through the connector: the webhook events `dataproxy.aleph|hei|bet.approved` plan a document
   pull; afterwards `api.poa_document_link(p_customer, p_kind, p_document_id, p_sha256)` links the newest document to the
   session (`aleph`=`maslaka`, `hei`=`harbit`, `bet`=`policies`). The link never raises for a customer that has no session.
   Bytes are fetched, hashed and stored only for a customer that has a session and only from an allowed download host.
5. Launch: when every enabled module is performed (and the customer was not pre-existing), `poa-intake` enqueues
   `surense.e9100_submit` with `{customer_id, proxy_approval_date}` and dedupe `e9100:<customer id>`. The worker handler calls
   `e9100Submit` only when `surense_write_enabled` and `surense_e9100_enabled` are on (`api.surense_gate(true,'e9100-submit')`);
   otherwise it completes `skipped` with code `e9100_switch_off`. The completed E9100 then follows the existing
   `swiftness.e9100.completed` -> `e9100_download` path.

## 4. Staff download: `client-docs` (`verify_jwt=true`)

`GET /functions/v1/client-docs?document_id=<uuid>` with `Authorization: Bearer <staff JWT>`. The function calls
`staff.client_doc_get(p_document_id)` as the caller (staff aal2, fresh MFA, access log written inside the RPC), then reads the
object from the private bucket `client-docs` with the service key and streams it with the same four download headers as
`/doc/:kind`. No signed URL is ever produced.

## 5. Database contract used by the functions (`_shared/poa/rpc.ts`)

The signatures are those of migration `20261121150000_poa_flow.sql` (section "Data (DB)" below). How the functions call them:

- The function generates the token (32 random bytes, base64url) and sends only its SHA-256 as a bytea literal (`\x<hex>`) in
  `api.poa_session_start` (with the national id, phone as `+9725XXXXXXXX`, a hash of the user agent, the client address, the
  marketing flag), `api.poa_session_get` and `api.poa_doc_get`. Every other session RPC takes the session uuid that
  `poa_session_get` / `poa_session_start` returned. A request without a usable client address is refused before Turnstile is verified
  (its single-use token is not spent); a well-formed token the database does not know counts as a refusal of that address.
- `poa_session_start` answers `existing_customer`: kept server side; together with the engine's own duplicate detection it
  marks the engine reference `existing`, which blocks the automatic E9100 launch (staff confirm the match first). The daily-cap
  answer `{ok:false}` is shown as `locked`.
- `poa_engine_ref_set` stores `{customer_id, sid, url_id, existing}` (flat, snake_case, encrypted whole); `poa_session_get`
  returns it decrypted, only while the session is open. The identity is never returned (no route needs it).
- `poa_preview_set(session, kind, sha256)` after every preview; `poa_consent_record(session, kind, method, preview sha, signature
  data URL, ip, user agent, {birth_date, issue_date})` after the tool accepted the approval (method `check`, `signature` for
  `policies`); the last enabled module completes the session; `poa_session_complete` is called afterwards (idempotent). If the
  record fails after the tool accepted, a code `consent_record_<code>` is stored on the session; the retry (the tool answers 409
  `completed`) records the approval. A consent for a module already performed is a REPLAY: 200 with the recorded approval, also on
  a completed session; nothing reaches the tool and no launch is queued. The harbit dates use one rule in the function and in
  SQL: issue strictly after birth, "today" = the Israeli calendar day.
- Failures of the tool are recorded with `poa_session_fail(session, code)` (lower-case code, no values).
- `poa_doc_get(token hash, kind)` PEEKS: it returns `{storage_path, sha256}` for the single download (`PT404 document_not_ready` while the
  document is not stored yet, shown as `unavailable`) and claims nothing; poa-intake reads the object, verifies the hash and only then calls
  `poa_doc_claim(token hash, kind)` (the single use; `PT410 document_gone` afterwards). A storage miss therefore never burns the download.
  The 30-minute window runs from the session's COMPLETION only; the route needs `poa_docs_enabled` and does not read the session
  (`poa_enabled` off, or the daily cap, does not close downloads).
- `api.poa_config()` (service role only, no kill switch) answers `{poa_enabled, engine, turnstile_required, modules}`: `/start`
  refuses before it spends a Turnstile token and honours `poa_turnstile_required`. If a database lacks it (older schema) the
  function treats Turnstile as required and relies on the kill switches inside every `poa_*` RPC (`PT423`, 503 `inactive`).
- Connector side: `poa_document_link(customer, kind, surense document id, sha256|null)` is called twice (first without a hash,
  then with it once the bytes were fetched); `poa_document_stored(document, path, sha256)` records the stored object. The path
  is `poa/{agency}/{session}/{kind}-{document}.pdf`; a link answers `{linked, session_id, agency_id, document_id, complete}` and
  the connector builds the path from `agency_id` + `session_id` + `document_id`.
- `staff.client_doc_get(p_document_id uuid)` -> `{storage_path, sha256}` is what `client-docs` calls as the staff caller (staff aal2,
  fresh MFA step, document of the caller's agency, one `audit.access_log` row with ids only; `PT403` / `PT404`).

Job kind `surense.e9100_submit` (params `customer_id`, `proxy_approval_date`; dedupe `e9100:<customer id>`) goes through
`api.surense_job_enqueue`.

## 6. Locked only after the owner's full run (spec section 4, "מה עוד חייב אימות")

All of these live in one place each and are covered by contract tests on synthetic values only:

Locked by the owner's full run of 2026-11-22 (no longer open): the base path `/api/v1/ifs/public` and the route spelling, the
shape of `proxies_preview`, ISO dates for `proxies/hb`, the signature as a full PNG data URL, `{sid}` only for `swiftness`,
`{nextStep, sid}` answers, the pre-signed links of the `policies` answer and their download host.

Still open:

- the cell number format of `proxies/start` (`cellForTool` in `_shared/poa/formatters.ts`, `TODO(owner-full-run)`; E.164 assumed);
- the body of the 400 that `proxies/start` returned once for an existing customer (`kindFromToolStatus`, `_shared/poa/errors.ts`);
- response shape of `proxies/load` (only `sid` is read, defensively);
- which Surense document is the aleph/hei/bet one on the webhook fallback path (the newest is linked; document type ids are unknown);
- whether `proxies/invite` accepts `nispahBet` without a policies list;
- the customer search field used to resolve a duplicate (`idNumber`).

## Data (DB)

Migration `20261121150000_poa_flow.sql`, pgTAP `supabase/tests/12_poa_flow.test.sql`. Everything is behind off switches; applying needs no secret
(the RPCs need the Vault keys `pii_enc_key` and `national_id_hmac_key`). Nothing is deleted by this migration.

**Tables (schema `crm`; RLS on, deny policy, no grant to any API role, `audit.log_change('no_values')` trigger):**

| Table | Holds |
|---|---|
| `poa_sessions` | `token_hash` (sha256 of the 32-byte token, unique), `status` (`open|completed|expired|locked`), `modules` (per kind `{enabled, required, performed}`), `engine` (`surense|native`), `engine_ref_enc` (customer id, public page id, process id, encrypted), `engine_last_error` (code), `surense_customer_id` (indexed copy of the customer id), `national_id_hmac`, `phone_hmac`, `phone_tail`, `identity_enc` (names, id, phone, email, marketing flag, later birth and issue dates), `ua_hash`, `preview_sha` (per kind, last previewed sha256 hex), `agency_id`, `expires_at` (start + 60 min), `completed_at`, `docs_complete_at` |
| `poa_consents` | append-only (a trigger raises on update/delete unless `audit.allow_purge=on`): `kind` (`terms_privacy|marketing|poa_maslaka|poa_harbit|poa_policies|staff_identity_check|revocation`), `method`, `approved_at`, `preview_sha256`, `document_sha256`, `signature_enc`, `ip_enc`, `user_agent`, `note_enc`, `retain_until` |
| `documents` | one row per session and kind: `source`, `status` (`incomplete|pending_staff_verification|active|revoked`), `surense_document_id`, `storage_path` (`poa/{agency}/{session}/{kind}-{document}.pdf`), `sha256`, `valid_until`, `retain_until`, `customer_id` (empty until staff assign), `stored_at`, `downloaded_at` |
| `poa_matches` | session to an existing `crm.customers` row (national id hmac), `phone_differs`, `status`; `crm.customers` is never updated |

**RPCs (schema `api`, `service_role` only; every RPC starts with `private.kill_switch`, limits via `private.check_rate_limit`, audit rows hold ids and codes only):**

| RPC | Switch | Notes |
|---|---|---|
| `poa_session_start(p_token_hash bytea, p_identity jsonb, p_national_id text, p_phone text, p_ua_hash bytea, p_ip text, p_marketing boolean)` | `poa_enabled` | `p_identity` = `{first_name, last_name, email|null}`; id is 9 digits, phone `+9725XXXXXXXX`. Returns `{ok, session_id, expires_at, modules, next, existing_customer}`; `existing_customer` is for the function only and must not reach the browser. Limits: 20 per client address and 10 per identity per hour, 60 per hour overall (`PT429`). The 300-per-day cap switches `poa_enabled` off, raises the alert `poa_daily_cap` and RETURNS `{ok:false, error:"rate_limited"}` (a raise would roll the switch-off back). No enabled module: `PT423 feature_disabled:poa_modules`. |
| `poa_session_get(p_token_hash bytea)` | `poa_enabled` | `{session_id, status, expires_at, modules, next, engine, surense_customer_id, completed_at, preview_sha, engine_ref}`; `engine_ref` (decrypted) only while the session is open, else null; the identity is not returned. A session past its expiry is flipped to `expired`. 120 per minute per token. |
| `poa_engine_ref_set(p_session uuid, p_ref jsonb)` | `poa_enabled` | flat snake_case object; `customer_id` (uuid) also fills `surense_customer_id` |
| `poa_preview_set(p_session uuid, p_kind text, p_sha256 text)` | `poa_enabled` | the file shown last; consent is accepted only for this exact hash |
| `poa_consent_record(p_session uuid, p_kind text, p_method text, p_preview_sha256 text, p_signature text, p_ip text, p_user_agent text, p_extra jsonb)` | `poa_enabled` | method `check|signature|typed`; harbit needs `p_extra {birth_date, issue_date}` (ISO); `signature` needs a PNG data url. Idempotent per module. The last enabled module completes the session. Returns `{kind, method, approved_at, valid_until (null), modules, next, complete}` |
| `poa_session_fail(p_session uuid, p_code text)` | `poa_enabled` | code only; `locked` also closes the session; `launch_*` (completed sessions) and `docs_*` (open or completed) are recorded without changing the status |
| `poa_session_complete(p_session uuid)` | `poa_enabled` | idempotent; `{complete, status, completed_at, customer_id}` |
| `poa_document_link(p_customer uuid, p_kind text, p_document_id uuid, p_sha256 text)` | none | never raises a switch error and never for an unknown customer (`{linked:false}`); upserts `documents` as `pending_staff_verification`; `{linked, session_id, agency_id, document_id, complete}` (`complete` = every enabled module has a document, which stamps `docs_complete_at`) |
| `poa_document_from_url(p_session uuid, p_kind text, p_sha256 text)` | `poa_docs_enabled` | a final document that arrived as a pre-signed link: creates or refreshes the `crm.documents` row of a live session for a performed module (no Surense document id) and returns `{document_id, agency_id, stored, complete}`; a row that already holds a stored file is left untouched |
| `poa_document_stored(p_document uuid, p_path text, p_sha256 text)` | none | records the object path (must equal the pattern exactly) and the hash after the worker stored the bytes |
| `poa_config()` | none | read only: `{poa_enabled, engine, turnstile_required, modules{maslaka,harbit,policies}}` |
| `poa_doc_get(p_token_hash bytea, p_kind text)` | `poa_docs_enabled` | peek: `{storage_path, sha256}`; module must be enabled for the session; within 30 minutes of completion; refused once downloaded. Claims nothing. |
| `poa_doc_claim(p_token_hash bytea, p_kind text)` | `poa_docs_enabled` | the single use, same checks; `{ok:true}`, then `PT410 document_gone` |

Staff (`authenticated`, admin with fresh TOTP, access log): `staff.poa_session_list(p_limit, p_offset)` (names, id masked to the last four digits, phone
tail, modules, documents, match flag) and `staff.poa_session_verify(p_session, p_note)` (records `staff_identity_check`, activates pending documents).
`staff.client_doc_get(p_document_id)` (any staff, fresh MFA step; one access-log row; `{storage_path, sha256}` for the `client-docs` function).
`staff.admin_config_set` accepts the nine `poa_*` keys (`poa_engine`: `surense|native`; `poa_surense_url_id`: up to 32 of `[A-Za-z0-9_-]`; the rest `true|false`).

Error codes: `PT400 invalid_input:<field>`, `PT423 feature_disabled:<key>`, `PT429 rate_limited`, `PT401 session_inactive`, `PT403 session_locked`,
`PT409 session_completed`, `PT410 session_expired | download_expired | document_gone`, `PT404 document_not_ready | document_not_found`.

Job kind `surense.e9100_submit` is accepted by `ops.surense_jobs` and `api.surense_job_enqueue` (params `customer_id`, `proxy_approval_date`; dedupe `e9100:<id>`).
`ops.watchdog` has a `poa` step: a completed session older than one hour that lacks a document for an enabled module raises `poa_docs_missing` (count and first id, once per 24 h).

## Browser switches

Build-time, in the site build (Vite env). All off by default; nothing in the repo turns them on.

| Variable | Effect |
|---|---|
| `VITE_POA_FLOW` | `on` enables the wizard route. Any other value or unset: the route redirects to `/report/start`. |
| `VITE_POA_INTAKE_URL` | Base URL of `poa-intake` (trailing slash dropped). Default: `<VITE_SUPABASE_URL>/functions/v1/poa-intake`. |
| `VITE_POA_ADAPTER` | `mock` selects the in-memory adapter (development only). Anything else: the HTTP adapter. |
| `VITE_TURNSTILE_SITE_KEY` | When set, the first submitting screen (details review) renders the Turnstile widget and sends `turnstile_token` with `POST /start`. Unset: no widget, `turnstile_token` is `null`. |

`POA_ENABLED = VITE_POA_FLOW === "on" && (IS_V2 || VITE_POA_INTAKE_URL is set)`. The second operand is the fast path:
a legacy build can run the wizard against the Frankfurt functions by setting `VITE_POA_INTAKE_URL` explicitly (on a legacy
build `VITE_SUPABASE_URL` points at the old project, so it is never used as the default there). The CSP `connect-src` of
the site must allow the host of that URL.

HTTP adapter (`src/lib/poa/api.ts`, `createHttpPoaApi`): `credentials: "omit"`, session token only in a closure variable
(no browser storage), sent as `x-poa-session`; the preview hash is read from the `x-preview-sha256` response header (the
header `x-poa-preview-sha256` of section 2 is accepted too) and must be 64 hex characters. Error screens: `error.details.reason`
when it is one of `inactive|unavailable|generic|expired|locked|completed`, else by status (401/404 inactive, 410 expired,
403 and 429 locked, 409 completed, 423 and 5xx unavailable, others generic; a 403 that names a field, such as `origin` or
`turnstile`, is generic). A network failure or a 30 s timeout is `unavailable`.
