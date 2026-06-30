#!/bin/bash
# Phase-E v1 (report-only): monthly universe gap scan → ~/work/notes.
# Wired via launchd (com.ncmills.universe-gap-scan). v2 will feed the gaps to a
# claude -p pull → tagging-rules → npm run verify → propose-PR loop.
set -euo pipefail
cd "$HOME/shared-data"
git pull --quiet origin main 2>/dev/null || true
OUT="$HOME/work/notes/$(date +%F)-universe-gap-scan.md"
mkdir -p "$HOME/work/notes"
npx tsx scripts/scan-gaps.ts > "$OUT" 2>/dev/null
echo "$(date +%FT%T) wrote $OUT" >> "$HOME/work/logs/universe-gap-scan.log" 2>/dev/null || true
