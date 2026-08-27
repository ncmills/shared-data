#!/bin/bash
# Phase-E v1 (report-only): monthly universe gap scan → ~/work/notes.
# Wired via launchd (com.ncmills.universe-gap-scan). v2 will feed the gaps to a
# claude -p pull → tagging-rules → npm run verify → propose-PR loop.
#
# WHY THIS RUNS IN A THROWAWAY WORKTREE AND NOT IN ~/shared-data.
# Until 2026-08-27 line 7 of this script was:
#
#     cd "$HOME/shared-data"
#     git pull --quiet origin main 2>/dev/null || true
#
# — a scheduled job pulling into whatever branch a human left checked out, where
# what happens depends only on whether that human had committed anything yet.
# Measured 2026-08-27 on git 2.50.1 with `pull.rebase` unset:
#
#   parked branch strictly BEHIND main   FAST-FORWARDED to main's tip, exit 0.
#                                        The branch is rewritten and nothing
#                                        anywhere says so. THIS is the write.
#   parked branch with ANY local commit  "fatal: Need to specify how to
#                                        reconcile divergent branches", exit
#                                        128 — swallowed by `|| true`. The scan
#                                        then measures the STALE parked tree
#                                        and writes a report indistinguishable
#                                        from a good one. THIS is the lie.
#
# It had never been noticed because both `pull -q: Fast-forward` entries this
# job has ever left in the reflog landed while the checkout happened to be on
# `main`, where a fast-forward is the correct thing to do.
#
# The checkout is now used ONLY as an object store: fetch into it, materialise
# origin/main in a detached throwaway worktree, scan there, remove it. Nobody's
# branch moves, and the report always describes the shipping ref by name.
# (Same shape as second-nick's daemons/catalog_replay.py.)
set -euo pipefail

REPO="$HOME/shared-data"
LOG="$HOME/work/logs/universe-gap-scan.log"
OUT="$HOME/work/notes/$(date +%F)-universe-gap-scan.md"

mkdir -p "$HOME/work/notes" "$(dirname "$LOG")"
say() { echo "$(date +%FT%T) $*" >> "$LOG"; }

# NO `2>/dev/null || true`. A swallowed failure and a swallowed success are the
# same silence, and this job's whole output is a file whose absence nobody
# checks. A fetch that cannot reach the network stops the run, by name.
if ! err=$(git -C "$REPO" fetch --quiet origin main 2>&1); then
  say "FETCH FAILED — no scan run: ${err:-(no stderr)}"
  echo "gap scan: could not fetch origin/main: ${err:-(no stderr)}" >&2
  exit 1
fi

REF=$(git -C "$REPO" rev-parse --short origin/main)
# `mktemp -d -t PREFIX` is BSD-only. GNU coreutils reads -t's argument as a template and
# refuses it without XXXXXX ("too few X's in template"), which is how CI caught this: the
# job runs on macOS via launchd, but its tests run on ubuntu-latest. Explicit template,
# portable on both.
TREE=$(mktemp -d "${TMPDIR:-/tmp}/universe-gap-scan.XXXXXX")
cleanup() { git -C "$REPO" worktree remove --force "$TREE" >/dev/null 2>&1 || rm -rf "$TREE"; }
trap cleanup EXIT

git -C "$REPO" worktree add --detach --quiet "$TREE" origin/main

# shared-data's toolchain is tsx + tsc with no bundler, so a SYMLINKED
# node_modules resolves correctly here. Without it `npx tsx` reaches the
# registry, which is the difference between a 2-second scan and a hang.
if [ ! -d "$REPO/node_modules" ]; then
  say "NO node_modules in $REPO — nothing was scanned (not an empty gap list)"
  echo "gap scan: $REPO has no node_modules; nothing was measured" >&2
  exit 1
fi
ln -s "$REPO/node_modules" "$TREE/node_modules"

# Write to a TEMP file and move it into place only on success. `> "$OUT"`
# truncates before the scan runs, so a scan that died left a zero-byte report
# that reads exactly like "no gaps found".
TMP="$TREE/gap-scan.md"
if ! (cd "$TREE" && npx tsx scripts/scan-gaps.ts > "$TMP") 2>>"$LOG"; then
  say "SCAN FAILED at origin/main@$REF — $OUT NOT written (stderr above)"
  echo "gap scan: scan-gaps.ts failed at origin/main@$REF" >&2
  exit 1
fi
{ echo "<!-- source=origin/main@$REF -->"; cat "$TMP"; } > "$OUT"
say "wrote $OUT (source=origin/main@$REF)"
