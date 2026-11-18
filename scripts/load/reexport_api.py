"""Re-export the anon-readable api views of seeld-site with the exact recipe of C:/tmp/infra/migrate-site/export_public.py
(PostgREST, publishable key, paging 1000, json.dump ensure_ascii=False, sha256 of the file) so the hashes can be
compared with data/MANIFEST_public.json.

Env: SITE_URL (https://<ref>.supabase.co), SITE_ANON (publishable/anon key only, never a secret key).
Needs PostgREST to expose schema `api` (Accept-Profile: api). cma_funds is skipped: the base table is not public.
Writes <OUT>/<table>.json, <OUT>/MANIFEST_new.json and prints literal + projected (old column set/order) comparison.
Run with:  python -I scripts/load/reexport_api.py
"""
import json, os, hashlib, urllib.request, sys
URL = os.environ["SITE_URL"].rstrip("/") + "/rest/v1/"
KEY = os.environ["SITE_ANON"]
OLD = os.environ.get("OLD_DATA", "C:/tmp/infra/migrate-site/data")
OUT = os.environ.get("NEW_DATA", "C:/tmp/infra/migrate-site/data_new")
os.makedirs(OUT, exist_ok=True)
tables = {  # table -> order column (stable paging), identical to export_public.py
    "blog_posts": "id", "investment_tracks": "id", "cma_company_map": "company,board_product",
    "cma_board": "fund_id,source", "cma_funds_latest": "id", "cma_sync_log": "id",
}
old_man = json.load(open(f"{OLD}/MANIFEST_public.json"))
man, report = {}, []
for t, order in tables.items():
    rows, off, step = [], 0, 1000
    while True:
        req = urllib.request.Request(f"{URL}{t}?select=*&order={order}&limit={step}&offset={off}",
                                     headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Accept-Profile": "api"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                chunk = json.load(r)
        except urllib.error.HTTPError as e:
            print(t, "HTTP", e.code, e.read()[:300].decode("utf-8", "replace"))
            sys.exit(2)
        if not isinstance(chunk, list):
            print(t, "unexpected response", str(chunk)[:300]); sys.exit(2)
        rows += chunk
        if len(chunk) < step:
            break
        off += step
    with open(f"{OUT}/{t}.json", "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False)
    sha = hashlib.sha256(open(f"{OUT}/{t}.json", "rb").read()).hexdigest()
    man[t] = {"rows": len(rows), "sha256": sha}
    # projected: same rows restricted to the old column set and order (schema additions such as blog_posts.created_by)
    old_rows = json.load(open(f"{OLD}/{t}.json", encoding="utf-8"))
    old_keys = list(old_rows[0].keys()) if old_rows else []
    proj = [{k: r.get(k) for k in old_keys} for r in rows]
    proj_sha = hashlib.sha256(json.dumps(proj, ensure_ascii=False).encode("utf-8")).hexdigest()
    old_sha = hashlib.sha256(json.dumps(old_rows, ensure_ascii=False).encode("utf-8")).hexdigest()  # equals manifest sha
    new_only = [k for k in (rows[0].keys() if rows else []) if k not in old_keys]
    report.append((t, old_man[t]["rows"], len(rows), old_man[t]["sha256"] == sha, old_sha == proj_sha, new_only))
json.dump(man, open(f"{OUT}/MANIFEST_new.json", "w"), indent=1)
print(f"{'table':18} {'old':>6} {'new':>6}  literal  projected  new-only columns")
for t, o, n, lit, proj, extra in report:
    print(f"{t:18} {o:6} {n:6}  {str(lit):7}  {str(proj):9}  {','.join(extra)}")
