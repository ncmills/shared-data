#!/usr/bin/env bash
# Regenerate db/live-schema.sql from the LIVE database.
#
# The repo used to be unable to answer "what is actually in the database". migrations/*.sql
# were applied by hand in the Supabase SQL editor, so committed DDL and live DDL diverged
# with nothing able to notice — the committed signal-tables migration still declares
# CHECK (brand IN ('moh','bestman','tdf')) while the live constraint has permitted
# 'offsite' and 'handicap' since 2026-06-26.
#
# `supabase db dump` requires Docker. This does not — it reads pg_catalog through
# `supabase db query`, so it runs anywhere the CLI is authenticated.
#
# "AUTHENTICATED" MEANS MORE THAN SUPABASE_ACCESS_TOKEN, measured 2026-08-27 on a GitHub
# runner. `db query --linked` needs a database password as well, and on a developer Mac it
# never asks for one because the CLI reads it from the LOGIN KEYCHAIN. A Linux runner has no
# keychain, so the same command with the same link and the same access token answers:
#
#   Connect to your database by setting the env var: SUPABASE_DB_PASSWORD
#
# This is why a scratch-directory test on a laptop does not prove a runner will work: the
# directory was fresh, the machine's credentials were not.
#
# Usage:  ./scripts/snapshot-schema.sh [--check]
#   (no args)  rewrite db/live-schema.sql
#   --check    fail if the committed snapshot differs from live (for CI)
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT_REF="${SUPABASE_PROJECT_REF:-bzmehrytiudgmgdrdlkg}"
OUT="db/live-schema.sql"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! command -v supabase >/dev/null 2>&1; then
  echo "COULD-NOT-RUN: supabase CLI not installed. 0 comparisons executed — this is NOT a pass." >&2
  exit 2
fi

# `q` MUST NOT be allowed to abort this script.
#
# It used to be `supabase db query --linked "$1" 2>/dev/null | sed -n '/{/,$p'`. Under the
# `set -euo pipefail` above, that pipeline exits non-zero whenever the CLI cannot reach the
# project — an unlinked repo, an expired login, no network — and `set -e` then killed the script
# AT THE FIRST CALL, before reaching the `[ ! -s ]` guard written for exactly that case.
#
# Measured 2026-08-27 from an unlinked checkout: exit 1, empty stdout, empty stderr, while this
# file's own docs promise "exits 2 with a named reason". A well-written error path, made
# unreachable by a shell setting. The `2>/dev/null` compounded it: the CLI's explanation was
# discarded too, so there was genuinely nothing to see.
#
# So: capture instead of piping, swallow the failure HERE, and let the guard below do the
# talking. `Q_ERR` carries the CLI's own last words into that message, because "it failed" is
# less useful than "it failed because you are not linked".
Q_ERR=""
q() {
  local out rc=0
  # stderr to a FILE, never merged into stdout. Merging them captures the reason on failure but
  # corrupts the success path: the CLI writes "Initialising login role" and an upgrade notice on
  # stderr, and `sed -n '/{/,$p'` then keeps that chatter after the JSON, so render-schema.py
  # dies on "Extra data". Caught by the positive control below, which is the argument for having
  # one — the error path was right and the fix for it broke the path that already worked.
  # `--agent=no -o json` PINS the output format. The CLI auto-detects whether it is being run
  # by an AI coding agent and changes shape accordingly: agent -> JSON wrapped in a
  # {"boundary":…,"rows":[…]} envelope, no agent -> a Unicode TABLE. So this script worked on a
  # laptop where an agent ran it and produced "COULD-NOT-RUN: cons query returned nothing" on a
  # GitHub runner, where nothing is detected -- same command, same credentials, different output
  # format. Measured 2026-08-27, both ways, against this project.
  #
  # It was worse than a clean failure. The `cols` query passed the [ ! -s ] non-empty check even
  # as a table, because column DEFAULTS contain `{` (jsonb `'"'"'{}'"'"'::jsonb`, array literals) and the
  # `sed` below keeps from the first brace -- so the guard only fired on `cons`, the one table
  # output with no brace in it. Had a constraint definition contained one, garbage would have
  # reached render-schema.py instead of an honest refusal.
  out="$(supabase db query --agent=no -o json --linked "$1" 2>"$TMP/q.err")" || rc=$?
  if [ "$rc" -ne 0 ]; then
    Q_ERR="$(grep -v '^[[:space:]]*$' "$TMP/q.err" 2>/dev/null | tail -2)"
    return 0                    # empty stdout -> the `[ ! -s ]` guard fires and REPORTS
  fi
  # Keep from the first `[` OR `{`: `-o json` returns a bare array, the agent envelope an
  # object. Anchored at line start so a brace inside a value cannot start the capture.
  printf '%s\n' "$out" | sed -n '/^[[{]/,$p'
}

q "select c.relname as tbl, a.attnum::int ord, a.attname as col,
     format_type(a.atttypid,a.atttypmod) as typ, a.attnotnull as notnull,
     pg_get_expr(d.adbin,d.adrelid) as dflt, a.attgenerated = 's' as generated
   from pg_class c join pg_namespace n on n.oid=c.relnamespace
   join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
   left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
   where n.nspname='public' and c.relkind='r' order by c.relname, a.attnum;" > "$TMP/cols.json"
q "select conrelid::regclass::text tbl, conname, pg_get_constraintdef(oid) def, contype::text
   from pg_constraint where connamespace='public'::regnamespace order by 1,4,2;" > "$TMP/cons.json"
q "select tablename tbl, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2;" > "$TMP/idx.json"

for f in cols cons idx; do
  if [ ! -s "$TMP/$f.json" ]; then
    echo "COULD-NOT-RUN: $f query returned nothing (auth or link problem). 0 comparisons executed — this is NOT a pass." >&2
    [ -n "$Q_ERR" ] && echo "  supabase said: $Q_ERR" >&2
    echo "  fix: run \`supabase link --project-ref $PROJECT_REF\` in this repo, or check \`supabase projects list\`." >&2
    exit 2
  fi
done

python3 scripts/render-schema.py "$TMP" "$TMP/live-schema.sql" "$PROJECT_REF"

if [ "${1:-}" = "--check" ]; then
  if diff -u "$OUT" "$TMP/live-schema.sql"; then
    echo "schema snapshot matches live."
  else
    echo "::error title=schema drift::db/live-schema.sql does not match the live database. Run ./scripts/snapshot-schema.sh and commit." >&2
    exit 1
  fi
else
  mkdir -p db && cp "$TMP/live-schema.sql" "$OUT"
  echo "wrote $OUT"
fi
