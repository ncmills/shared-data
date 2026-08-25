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

q() { supabase db query --linked "$1" 2>/dev/null | sed -n '/{/,$p'; }

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
