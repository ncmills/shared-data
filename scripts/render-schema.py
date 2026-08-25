#!/usr/bin/env python3
"""Render a readable, diffable snapshot of the live public schema.

Called by scripts/snapshot-schema.sh, which supplies the pg_catalog JSON. Kept separate
so the SQL extraction and the formatting can be tested independently.

Usage: render-schema.py <json-dir> <out-file> <project-ref>
"""
import collections
import json
import sys


def load(path):
    with open(path) as fh:
        raw = fh.read()
        return json.loads(raw[raw.index("{"):])["rows"]


def main():
    json_dir, out_file, project_ref = sys.argv[1], sys.argv[2], sys.argv[3]
    cols = load(f"{json_dir}/cols.json")
    cons = load(f"{json_dir}/cons.json")
    idx = load(f"{json_dir}/idx.json")

    by_col = collections.defaultdict(list)
    for r in cols:
        by_col[r["tbl"]].append(r)
    by_con = collections.defaultdict(list)
    for r in cons:
        by_con[r["tbl"]].append(r)
    by_idx = collections.defaultdict(list)
    for r in idx:
        by_idx[r["tbl"]].append(r)

    out = [
        f"-- LIVE SCHEMA SNAPSHOT - public schema of Supabase project {project_ref}",
        "--",
        "-- GENERATED. Do not hand-edit. Regenerate with: npm run schema:snapshot",
        "--",
        "-- This file exists because the repo did not describe the database. migrations/*.sql",
        "-- were applied by hand in the Supabase SQL editor, so committed DDL and live DDL",
        "-- diverged with nothing able to notice. The canonical example: the committed",
        "-- signal-tables migration declares CHECK (brand IN ('moh','bestman','tdf')) while the",
        "-- live constraint has permitted 'offsite' and 'handicap' since 2026-06-26.",
        "--",
        "-- A snapshot is not a migration history. It answers 'what is actually there', which",
        "-- is the question the repo previously could not answer at all.",
        "",
    ]
    for tbl in sorted(by_col):
        out.append(f"CREATE TABLE public.{tbl} (")
        lines = []
        for c in by_col[tbl]:
            bits = [f"  {c['col']}", c["typ"]]
            if c["generated"]:
                bits.append("GENERATED ALWAYS AS (" + " ".join(c["dflt"].split()) + ") STORED")
            elif c["dflt"]:
                bits.append(f"DEFAULT {c['dflt']}")
            if c["notnull"]:
                bits.append("NOT NULL")
            lines.append(" ".join(bits))
        for k in by_con[tbl]:
            lines.append(f"  CONSTRAINT {k['conname']} {k['def']}")
        out.append(",\n".join(lines))
        out.append(");")
        for i in by_idx[tbl]:
            if i["indexname"].endswith("_pkey"):
                continue
            out.append(f"{i['indexdef']};")
        out.append("")

    with open(out_file, "w") as fh:
        fh.write("\n".join(out) + "\n")
    print(f"rendered {len(by_col)} tables -> {out_file}")


if __name__ == "__main__":
    main()
