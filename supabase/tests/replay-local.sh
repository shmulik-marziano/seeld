#!/usr/bin/env bash
# Replays supabase/migrations/20261118* (foundation) on a fresh supabase/postgres container and runs the pgTAP suite.
# Usage: bash supabase/tests/replay-local.sh   (needs Docker; image tag pinned below)
# NOTE: the legacy Tokyo migrations (<= 20260917*) are intentionally skipped: they belong to the old project history.
set -euo pipefail
IMAGE="${IMAGE:-supabase/postgres:17.6.1.178}"
NAME="${NAME:-seeld-replay}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
for i in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U postgres -d postgres >/dev/null 2>&1 && break; sleep 1
done
sleep 5
psqlx() { docker exec -i "$NAME" psql -v ON_ERROR_STOP=1 -q "$@"; }
psqlx -U supabase_admin -d postgres < "$ROOT/supabase/tests/local_bootstrap.sql"
for f in "$ROOT"/supabase/migrations/2026111[89]*.sql; do
  echo "migration: $(basename "$f")"
  psqlx -U postgres -d postgres < "$f" >/dev/null
done
[ -f "$ROOT/supabase/seed.sql" ] && psqlx -U postgres -d postgres < "$ROOT/supabase/seed.sql" >/dev/null
FAIL=0
for t in "$ROOT"/supabase/tests/*.test.sql; do
  echo "test: $(basename "$t")"
  out=$(docker exec -i "$NAME" psql -U postgres -d postgres -At < "$t" 2>&1) || true
  echo "$out"
  echo "$out" | grep -q '^not ok' && FAIL=1
  echo "$out" | grep -qi 'error' && FAIL=1
done
[ "${KEEP:-0}" = "1" ] || docker rm -f "$NAME" >/dev/null
exit $FAIL
