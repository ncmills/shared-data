#!/bin/bash
# drain-url-backfill.sh — the ONE-OFF supervised drain (2026-08-06).
#
# NOT a replacement for weekly-url-backfill.sh, and it must never be put on a
# schedule. Two things differ, and both are deliberate:
#
#   1. IT NEVER RESETS. weekly-url-backfill.sh does `git reset --hard
#      origin/main` at the top of EVERY run. That is right for a weekly job
#      whose PR gets merged in between, and catastrophic in a loop: run N+1
#      would reset away run N's rows, rebuild the queue from the same unsourced
#      universe, and re-research the venues run N had just sourced. This script
#      resets nothing — propose-pr does `git checkout -b <branch>` off the
#      CURRENT HEAD each iteration, so iteration N+1 branches off iteration N
#      and the batches accumulate. The final branch carries every batch.
#
#   2. IT RUNS AT CONCURRENCY 6, supervised. The scheduled job is pinned to 1
#      on purpose (unattended, 03:00, on a box running the rest of the fleet).
#      Do not copy this value back into the weekly job.
#
# It also opens NO PR per iteration (no --auto). Forty-eight PRs is not a review
# surface. One PR off the final branch is Phase 3.
#
# WHY: measured 2026-08-06, 5,802 of 6,225 party rows carry no followable
# source. At the weekly rate of 120 rows/run that is ~48 weeks.
#
# Run (smoke, ~4 min):   ITERATIONS=2 TOP_K=1 ROW_CAP=3 RESEARCH_CONCURRENCY=2 bash scripts/drain-url-backfill.sh
# Run (full, ~12-16h):   bash scripts/drain-url-backfill.sh
set -euo pipefail

TREE="$HOME/work/shared-data-drain"
LOG="$HOME/work/logs/url-backfill-drain.log"
# The SAME lock the weekly job takes. Different worktree, same `claude -p`
# budget and the same data — if Tuesday 03:00 fires mid-drain it must SKIP, not
# run alongside. Its breaker is liveness-based, so a drain holding this for 16h
# is respected rather than broken.
LOCK="$HOME/work/logs/.url-backfill.lock"

ITERATIONS="${ITERATIONS:-40}"
TOP_K="${TOP_K:-40}"
# 40 tasks x ~4.3 rows/task = ~172. NOT 400: the 2026-08-06 03:55-03:59
# crash-loop (295 run starts against 8 OKs) was at top-k=60 row-cap=400.
ROW_CAP="${ROW_CAP:-200}"
RESEARCH_CONCURRENCY="${RESEARCH_CONCURRENCY:-6}"

mkdir -p "$(dirname "$LOG")"
say() { echo "$(date +%FT%T) $*" | tee -a "$LOG"; }

# ── lock (same liveness contract as the weekly job) ─────────────────────────
if ! mkdir "$LOCK" 2>/dev/null; then
  owner="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$owner" ] && kill -0 "$owner" 2>/dev/null; then
    say "SKIP: a backfill run is already in progress (pid $owner)"
    exit 0
  fi
  say "breaking a lock whose owner (pid ${owner:-unknown}) is gone"
  rm -rf "$LOCK" 2>/dev/null || true
  mkdir "$LOCK" 2>/dev/null || { say "SKIP: could not take the lock"; exit 0; }
fi
echo "$$" > "$LOCK/pid"
trap 'rm -rf "$LOCK" 2>/dev/null || true' EXIT

# The worktree is created OUT OF BAND (once, by hand) off the branch carrying
# the concurrency + timeout fixes. This script does not create or reset it —
# that is the whole point.
if [ ! -e "$TREE/.git" ]; then
  say "FATAL: $TREE is not a worktree. Create it first:"
  say "  git -C ~/shared-data worktree add $TREE -b <branch> origin/expand/url-backfill-20260805"
  exit 1
fi
cd "$TREE"

# Fail loudly if the fixes are absent — without concurrency this loop is a
# 41-hour sequential crawl and would look like it was merely slow.
if ! grep -q "DEFAULT_RESEARCH_CONCURRENCY" scripts/run-expansion.ts; then
  say "FATAL: this tree has no DEFAULT_RESEARCH_CONCURRENCY — it predates 846d437."
  exit 1
fi

# ── usage-limit preflight ───────────────────────────────────────────────────
# THE FAILURE THIS EXISTS FOR (measured 2026-08-06 13:16): every research call
# came back `claude exited 1 — returning []` with EMPTY stderr. The cause was a
# Claude SESSION USAGE LIMIT, not a bug — `claude -p` returns exit 1 and an
# `{"is_error":true,...}` envelope with zero tokens when the limit is hit.
#
# claudeResearcher is fail-safe by design (non-zero exit ⇒ []), so a fully
# rate-limited run reports "0 researched, 0 ingested" and exits OK. That is
# indistinguishable from "researched everything, found nothing" — and a 40-
# iteration drain would burn all 40 iterations in ~2 minutes, report success,
# and source zero rows. Absence of a measurement is not a passing measurement
# (feedback_fleet_signal_integrity).
#
# So: probe BEFORE each iteration and WAIT rather than spend one.
LIMIT_WAIT_MIN="${LIMIT_WAIT_MIN:-10}"
LIMIT_MAX_WAITS="${LIMIT_MAX_WAITS:-72}"   # 72 x 10min = up to 12h of waiting

claude_ready() {
  local out
  out="$(echo "reply with the single word READY" | claude -p 2>&1)" || true
  case "$out" in
    *"session limit"*|*"usage limit"*|*"rate limit"*|*"is_error\":true"*) return 1 ;;
  esac
  [ -n "$out" ]
}

wait_for_claude() {
  local waits=0
  while ! claude_ready; do
    waits=$((waits + 1))
    if [ "$waits" -gt "$LIMIT_MAX_WAITS" ]; then
      say "FATAL: claude -p still unavailable after $((LIMIT_MAX_WAITS * LIMIT_WAIT_MIN)) min — stopping."
      say "    This is a USAGE LIMIT or an auth failure, NOT an empty queue."
      return 1
    fi
    say "WAITING: claude -p is usage-limited; sleeping ${LIMIT_WAIT_MIN}m (wait $waits/$LIMIT_MAX_WAITS)"
    sleep $((LIMIT_WAIT_MIN * 60))
  done
  return 0
}

queue_rows() {
  npx tsx -e "
    const {buildBackfillQueue}=require('./scripts/backfill-queue.ts');
    const q=buildBackfillQueue(undefined,{maxVenuesPerTask:8});
    console.log(q.tasks.reduce((a,t)=>a+t.venues.length,0));
  " 2>/dev/null || echo "NOT-MEASURED"
}

START_ROWS="$(queue_rows)"
say "=== drain start: $START_ROWS row(s) unsourced, up to $ITERATIONS iteration(s) ==="
say "    top-k=$TOP_K row-cap=$ROW_CAP concurrency=$RESEARCH_CONCURRENCY"

PREV_ROWS=""
ZERO_YIELD=0

for i in $(seq 1 "$ITERATIONS"); do
  # Never spend an iteration into a usage limit. See the preflight note above.
  if ! wait_for_claude; then
    say "=== stopped at iteration $i: the researcher is unavailable, queue NOT drained ==="
    say "    branch $(git branch --show-current) holds every batch up to this point."
    exit 1
  fi
  say "=== drain iteration $i/$ITERATIONS (branch $(git branch --show-current)) ==="
  # Unique label per iteration: propose-pr does `git checkout -b
  # expand/<dataset>-<label>` and a repeated label would collide with the
  # branch the previous iteration created.
  LABEL="drain-$(date +%Y%m%d)-i$i"

  # caffeinate -i -s: hold off idle/system sleep. This does NOT make the run
  # sleep-proof — a closed lid on battery sleeps regardless, and the 2026-08-04
  # run lost 9 of its 15 tasks exactly that way.
  if ! /usr/bin/caffeinate -i -s -m npx tsx scripts/run-backfill.ts \
        --label="$LABEL" \
        --top-k="$TOP_K" \
        --row-cap="$ROW_CAP" \
        --live-url-check \
        --research-concurrency="$RESEARCH_CONCURRENCY" >> "$LOG" 2>&1; then
    rc=$?
    say "=== iteration $i FAILED exit=$rc — stopping so the failure is not buried ==="
    say "    branch $(git branch --show-current) holds every batch up to this point."
    exit "$rc"
  fi

  REMAINING="$(queue_rows)"
  say "=== iteration $i done: $REMAINING of $START_ROWS row(s) still unsourced ==="

  # A drain that is not draining must SAY SO and stop. Without this, an
  # iteration that sources nothing looks identical to one that sourced rows,
  # and the loop happily reports "finished" after 40 no-ops. Three in a row is
  # a stall, not a hard patch of queue.
  if [ -n "$PREV_ROWS" ] && [ "$REMAINING" = "$PREV_ROWS" ]; then
    ZERO_YIELD=$((ZERO_YIELD + 1))
    say "WARN: iteration $i sourced NOTHING ($ZERO_YIELD in a row)"
    if [ "$ZERO_YIELD" -ge 3 ]; then
      say "=== STOPPING: 3 consecutive iterations sourced 0 rows. This is a stall, not a drain. ==="
      say "    Check $LOG for 'claude exited' / 'timed out' — the researcher is failing, not the queue."
      exit 1
    fi
  else
    ZERO_YIELD=0
  fi
  PREV_ROWS="$REMAINING"

  # An empty queue is success, not failure — stop rather than spin.
  if [ "$REMAINING" = "0" ]; then
    say "=== queue EMPTY after $i iteration(s) — drain complete ==="
    break
  fi
  # NOT-MEASURED is not zero. Absence of a measurement is not a passing
  # measurement (feedback_fleet_signal_integrity) — keep going and say so.
  if [ "$REMAINING" = "NOT-MEASURED" ]; then
    say "WARN: could not measure the remaining queue this iteration"
  fi
done

say "=== drain finished on branch $(git branch --show-current) ==="
say "    started $START_ROWS unsourced, now $(queue_rows)"
say "    Phase 3: verify + sample 10 URLs for SUBJECT, then open ONE PR."
