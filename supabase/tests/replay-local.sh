#!/usr/bin/env bash
# Replays supabase/migrations (every file at or above the foundation floor) on a fresh supabase/postgres container
# and runs the pgTAP suite (supabase/tests/*.test.sql). Exit 0 only when every migration applied, every test file
# printed a plan line, no test is 'not ok' and no SQL ERROR was printed.
#
# Usage:  bash supabase/tests/replay-local.sh
# Env:    IMAGE (pinned below), NAME (container name), KEEP=1 (keep the container),
#         MIGRATIONS_DIR (default supabase/migrations; point it at a temp copy to exercise the floor),
#         TESTS_DIR (default supabase/tests; a temp copy is used to prove the failure detection),
#         TEST_USER (default postgres: the role `supabase test db` uses for supabase/tests/*.test.sql),
#         REPLAY_ADMIN_USER (default supabase_admin: runs supabase/tests/replay_only/*.test.sql, which switch role).
# A test file fails on: '^not ok', a SQL ERROR line, a missing '1..N' plan line, or pgTAP's '# Looks like you planned/failed'.
set -euo pipefail
IMAGE="${IMAGE:-supabase/postgres:17.6.1.178}"
NAME="${NAME:-seeld-replay}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$ROOT/supabase/migrations}"
TESTS_DIR="${TESTS_DIR:-$ROOT/supabase/tests}"
TEST_USER="${TEST_USER:-postgres}"
REPLAY_ADMIN_USER="${REPLAY_ADMIN_USER:-supabase_admin}"
# Version floor: the first foundation migration. Anything older is legacy (Tokyo) history and is never replayed.
FLOOR=20261118162452

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
for i in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U postgres -d postgres >/dev/null 2>&1 && break; sleep 1
done
sleep 5
psqlx() { docker exec -i "$NAME" psql -v ON_ERROR_STOP=1 -q "$@"; }
psqlx -U supabase_admin -d postgres < "$ROOT/supabase/tests/local_bootstrap.sql"

applied=0; skipped=0
for f in $(ls "$MIGRATIONS_DIR"/*.sql | LC_ALL=C sort); do
  base="$(basename "$f")"
  v="${base%%_*}"
  if ! [[ "$v" =~ ^[0-9]{14}$ ]]; then echo "migration: $base has no 14-digit version" >&2; exit 2; fi
  if [ "$v" -lt "$FLOOR" ]; then echo "skip (below floor $FLOOR): $base"; skipped=$((skipped + 1)); continue; fi
  echo "migration: $base"
  psqlx -U postgres -d postgres < "$f" >/dev/null
  applied=$((applied + 1))
done
echo "migrations applied=$applied skipped=$skipped"
if [ -f "$ROOT/supabase/seed.sql" ]; then psqlx -U postgres -d postgres < "$ROOT/supabase/seed.sql" >/dev/null; fi

FAIL=0
run_test() {  # $1 = file, $2 = role
  local t="$1" user="$2" out
  echo "test: $(basename "$t") (as $user)"
  out=$(docker exec -i "$NAME" psql -U "$user" -d postgres -At < "$t" 2>&1) || true
  echo "$out"
  if echo "$out" | grep -q '^not ok'; then echo "FAIL: not ok in $(basename "$t")"; FAIL=1; fi
  if echo "$out" | grep -Eq '^(ERROR|psql:.*ERROR)'; then echo "FAIL: SQL ERROR in $(basename "$t")"; FAIL=1; fi
  if ! echo "$out" | grep -Eq '^1\.\.[0-9]+$'; then echo "FAIL: no plan line in $(basename "$t")"; FAIL=1; fi
  # pgTAP's finish() diagnostic for a plan mismatch or failures: a short run prints no 'not ok' and no ERROR, only this
  if echo "$out" | grep -Eq '^# Looks like (you planned|you failed)'; then echo "FAIL: plan mismatch or failures in $(basename "$t")"; FAIL=1; fi
}
for t in "$TESTS_DIR"/*.test.sql; do run_test "$t" "$TEST_USER"; done
# Replay-only tests that need a role switch the CLI's postgres session cannot make (10: the auth hook as supabase_auth_admin).
# Outside the *.test.sql glob that `supabase test db` / CI use; they skip themselves when the switch is impossible.
if [ -d "$TESTS_DIR/replay_only" ]; then
  for t in "$TESTS_DIR"/replay_only/*.test.sql; do [ -f "$t" ] && run_test "$t" "$REPLAY_ADMIN_USER"; done
fi
[ "${KEEP:-0}" = "1" ] || docker rm -f "$NAME" >/dev/null
echo "replay result: $([ $FAIL = 0 ] && echo PASS || echo FAIL)"
exit $FAIL
