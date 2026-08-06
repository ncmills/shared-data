#!/bin/bash
# weekly-url-backfill.sh — the unattended ENRICH lane, driven by launchd
# (com.ncmills.url-backfill). Opens ONE review-ready PR per run. Never merges,
# never deploys, never touches a consumer.
#
# WHY THIS EXISTS. The harness landed 2026-07-31 and sourced two batches by
# hand (21 rows, then 321). Then it stopped, because `--auto` did not exist and
# every batch needed a human at a terminal to push it: 342 of 6,225 rows
# sourced, 5,836 to go, no third batch coming.
#
# ISOLATION. Runs in a DEDICATED worktree, never in ~/shared-data. propose-pr
# creates a branch and commits, and Nick's checkout regularly holds in-flight
# work (it did the day this was written). A scheduled job must never switch
# branches under an open editor.
set -euo pipefail

REPO="$HOME/shared-data"
TREE="$HOME/work/shared-data-backfill"
LOG="$HOME/work/logs/url-backfill.log"
LOCK="$HOME/work/logs/.url-backfill.lock"

# Tuning. Drain rate = ROW_CAP rows/week. At 120 that is ~49 weeks for the
# 5,836 rows outstanding; halve the time by adding a second StartCalendarInterval
# to the plist rather than by raising the cap (a bigger PR is a worse review).
# Overridable so the job itself can be smoke-tested exactly as launchd runs it:
#   DRY_RUN=1 TOP_K=1 ROW_CAP=3 bash scripts/weekly-url-backfill.sh
# DRY_RUN still performs real research — it just never ingests or opens a PR.
TOP_K="${TOP_K:-15}"
ROW_CAP="${ROW_CAP:-120}"
DRY_RUN="${DRY_RUN:-}"

mkdir -p "$(dirname "$LOG")" "$HOME/work"
say() { echo "$(date +%FT%T) $*" >> "$LOG"; }

# One run at a time. A backfill run can take ~45 min (top-k research calls at up
# to 180s each); overlapping runs would race the same worktree.
#
# mkdir, NOT flock: macOS has no flock(1). `if ! flock ...` would fail on a
# missing binary and SKIP every single run — a job that looks scheduled and
# silently never does anything. mkdir is atomic on POSIX and always present.
if ! mkdir "$LOCK" 2>/dev/null; then
  # AGE IS THE WRONG QUESTION. The old breaker declared any lock over 180 min
  # stale — but the 2026-08-04 run legitimately held it for 24h25m (the host
  # slept mid-run and the researcher's timer runs on the uptime clock). So the
  # breaker would have called a LIVE run stale and let a second run
  # `git reset --hard` + `clean -fd` the worktree underneath it. The 2026-08-02
  # log already shows three overlapping "run start" lines against two "run OK".
  #
  # Ask whether the owner is still ALIVE instead. That is correct no matter how
  # long a run legitimately takes.
  owner="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$owner" ] && kill -0 "$owner" 2>/dev/null; then
    say "SKIP: a run is already in progress (pid $owner)"
    exit 0
  fi
  say "breaking a lock whose owner (pid ${owner:-unknown}) is gone"
  rm -rf "$LOCK" 2>/dev/null || true
  mkdir "$LOCK" 2>/dev/null || { say "SKIP: could not take the lock"; exit 0; }
fi
echo "$$" > "$LOCK/pid"
# rm -rf, not rmdir: the lock directory now holds the pid file.
trap 'rm -rf "$LOCK" 2>/dev/null || true' EXIT
# `set -e` aborts on any failed git/npm step BEFORE the run block is reached, and
# those steps are quiet — so without this the log would show "run start" and then
# simply nothing, with no indication a failure had occurred. A scheduled job that
# can fail invisibly is worse than one that does not run.
trap 'say "ABORTED at line $LINENO (exit $?) — setup step failed before the run"' ERR

say "=== run start (top-k=$TOP_K row-cap=$ROW_CAP) ==="

# Refresh the worktree to a clean origin/main. Created on first run.
git -C "$REPO" fetch --quiet origin
if [ ! -d "$TREE/.git" ] && [ ! -f "$TREE/.git" ]; then
  say "creating worktree at $TREE"
  git -C "$REPO" worktree add --detach "$TREE" origin/main >> "$LOG" 2>&1
fi
git -C "$TREE" fetch --quiet origin
git -C "$TREE" reset --hard --quiet origin/main
# PRESERVE the attempt record. `docs/backfill-attempts.json` is untracked, so a
# bare `clean -fd` deletes it — and that file IS the queue's memory of which
# venues have already failed to source. Wiping it every run restores the exact
# silting the memory was added to prevent (yield fell 22 -> 3 per batch), while
# looking like it was working. Verified: `clean -nd docs/` reported "Would
# remove docs/backfill-attempts.json".
git -C "$TREE" clean -fdq -e node_modules -e docs/backfill-attempts.json

cd "$TREE"
npm install --silent >> "$LOG" 2>&1

LABEL="url-backfill-$(date +%Y%m%d)"

# --auto ⇒ live-URL gate ON + a real PR. Failure is non-fatal to the script so
# the lock releases and the log records it; `set -e` would otherwise exit silently.
DRY_FLAG=()
if [ -n "$DRY_RUN" ]; then
  # An if-block, NOT `[ -n "$X" ] && ...`: under `set -e` a failing test at the
  # head of an && list takes the whole list non-zero and kills the script — so
  # the REAL (non-dry) path would abort on the very line meant to skip it.
  DRY_FLAG=(--dry-run)
  say "DRY RUN: research only, no ingest, no PR"
fi

# `${arr[@]+"${arr[@]}"}` — macOS ships bash 3.2, where expanding an EMPTY array
# as "${arr[@]}" under `set -u` is an "unbound variable" error. The dry path had
# one element and worked; the real path died before printing a single line, exit
# 1, with the run block never reached.
# caffeinate: hold off idle/system sleep for the run's duration. The 2026-08-04
# run lost 9 of its 15 tasks to a mid-run sleep. This is the ops half only — it
# does NOT make the job sleep-proof (a closed lid on battery sleeps regardless),
# which is why run-backfill also detects suspension and declines to record
# attempts for venues it never really researched.
if /usr/bin/caffeinate -i -s -m npx tsx scripts/run-backfill.ts \
      --auto \
      ${DRY_FLAG[@]+"${DRY_FLAG[@]}"} \
      --label="$LABEL" \
      --top-k="$TOP_K" \
      --row-cap="$ROW_CAP" >> "$LOG" 2>&1; then
  say "=== run OK ($LABEL) ==="
else
  say "=== run FAILED exit=$? ($LABEL) — see the run output above ==="
fi
