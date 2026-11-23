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
