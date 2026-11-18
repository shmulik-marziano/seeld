-- 04: site data smoke. On a clean replay (empty content tables) the data checks are skipped; once the public
-- reference data is loaded (scripts/load/load-site-data.mjs) they prove the data is coherent and reaches anon via api.
-- Wording note: the replay harness fails on the word "error" anywhere in the output, keep descriptions free of it.
begin;
select no_plan();

-- expected counts, computed as postgres before switching to anon
select set_config('smoke.blog', (select count(*)::text from content.blog_posts where status = 'published' and published_at <= now()), true);
select set_config('smoke.tracks', (select count(*)::text from content.investment_tracks where is_active), true);
select set_config('smoke.funds', (select count(*)::text from content.cma_funds), true);
select set_config('smoke.latest', (select count(*)::text from content.cma_funds_latest), true);
select set_config('smoke.board', (select count(*)::text from content.cma_board), true);
select set_config('smoke.map', (select count(*)::text from content.cma_company_map), true);
select set_config('smoke.synclog', (select count(*)::text from content.cma_sync_log), true);

-- 1. derived fund objects are consistent with the base table
select case when current_setting('smoke.funds')::bigint = 0
  then skip('content.cma_funds is empty (clean replay, no data loaded)', 5)
  else collect_tap(
    is((select count(*) from content.cma_funds_latest),
       (select count(distinct (fund_id, source)) from content.cma_funds),
       'cma_funds_latest has one row per (fund_id, source)'),
    is((select count(*) from content.cma_board),
       (select count(distinct (fund_id, source)) from content.cma_funds
         where report_period = (select max(report_period) from content.cma_funds)),
       'cma_board has one row per (fund_id, source) of the latest report period'),
    is((select count(*) from content.cma_company_map),
       (select count(distinct (company, board_product)) from content.cma_board),
       'cma_company_map has one row per (company, board_product)'),
    is((select count(*) from content.cma_board where months_12m = 12 and ret_12m is null), 0::bigint,
       'every board row with 12 monthly yields has a 12-month return'),
    is((select count(*) from content.cma_funds f where not exists
          (select 1 from content.cma_funds_latest l where l.fund_id = f.fund_id and l.source = f.source)), 0::bigint,
       'every fund has a latest row'))
  end;

-- 2. blog and tracks invariants
select case when current_setting('smoke.blog')::bigint = 0
  then skip('content.blog_posts is empty (clean replay, no data loaded)', 2)
  else collect_tap(
    is((select count(*) from content.blog_posts where length(content) = 0 or length(title) = 0), 0::bigint,
       'published posts have a title and a body'),
    is((select count(*) from content.blog_posts p where exists
          (select 1 from content.blog_posts o where o.slug = p.slug and o.id <> p.id)), 0::bigint,
       'slugs are unique'))
  end;

select ok((select last_value from content.investment_tracks_id_seq) >= coalesce((select max(id) from content.investment_tracks), 0),
          'investment_tracks identity sequence is at or above max(id)');

-- 3. freshness check runs on real data without violating the sync-log CHECK (the Tokyo defect)
select lives_ok($$select content.cma_check_freshness()$$, 'cma_check_freshness() runs and may write stale rows');

-- 4. anon reaches exactly the public rows through the api views
set local role anon;
select is((select count(*) from api.blog_posts), current_setting('smoke.blog')::bigint, 'anon sees all published posts via api.blog_posts');
select is((select count(*) from api.investment_tracks), current_setting('smoke.tracks')::bigint, 'anon sees all active tracks via api.investment_tracks');
select is((select count(*) from api.cma_funds_latest), current_setting('smoke.latest')::bigint, 'anon sees cma_funds_latest via api');
select is((select count(*) from api.cma_board), current_setting('smoke.board')::bigint, 'anon sees cma_board via api');
select is((select count(*) from api.cma_company_map), current_setting('smoke.map')::bigint, 'anon sees cma_company_map via api');
select is((select count(*) from api.cma_sync_log), current_setting('smoke.synclog')::bigint, 'anon sees cma_sync_log via api');
select throws_ok($$select count(*) from content.cma_funds$$, '42501', null, 'anon cannot read the 39k-row base table content.cma_funds');
reset role;

select * from finish();
rollback;
