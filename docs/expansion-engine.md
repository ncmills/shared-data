# The cite-cache expansion engine (Phase 4)

The recurring loop that grows the shared destination universe by filling the
most starved data cells with **real, verifiable** venues — never fabricated
rows, always behind the same integrity gates a human commit passes.

## The loop

```
docs/gap-queue.json          scripts/research-gap.ts        scripts/ingest-researched.ts    scripts/propose-pr.ts
(Task 13)                     (Task 14)                      (Task 15)                       (Task 16)
   │                              │                              │                               │
   ▼                              ▼                              ▼                               ▼
aggregate-leverage    ──top-K──▶ buildResearchPrompt  ──▶  validate (honesty  ──rowCap──▶  ingest gate:               propose LOCAL PR:
ranked starved cells             + researcher(prompt)       firewall) survivors            verify-universe +           branch expand/<label>
                                                            only                           check-brand-rules +         + commit + PR artifact
                                                                                           audit; rollback on fail     docs/pending-prs/*.md
```

`scripts/run-expansion.ts` (`runExpansion(...)`) is the orchestrator that
chains all four steps for the top-K highest-leverage gaps.

### The seam this closes

`ingest-researched.ts`'s `IngestResult` only returns a **combined** `accepted`
count — it can't tell golf rows from residence rows, nor surface their
citations. `runExpansion` threads the validated `ResearchedRow[]` through
itself and derives the **per-dataset breakdown** (rows added per dataset + the
citation URLs backing them) from the rows' own `dataset` / `citations` fields.
The opaque `accepted` integer is used only as a cross-check.

## Row cap — NO silent truncation (guarantee)

Every run takes a hard `rowCap`. Rows are filled in gap-queue priority order up
to the cap. If the researched batch would exceed the cap:

- rows past the cap are **not** ingested, and
- every GapTask that lost one or more rows is recorded in
  `RunResult.droppedByCap` with an explicit reason (mid-task cap vs.
  fully-dropped) **and** `log()`'d.

The caller can always see exactly what was left on the table and why. There is
no code path that quietly discards a researched row.

## Run it manually

Dry run (research + validate + report only — never ingests, never branches):

```bash
npx tsx scripts/run-expansion.ts --top-k=1 --dry-run --candidates=path/to/rows.json
```

Real local run (ingests through the gates, opens a LOCAL branch + PR artifact,
**never pushes**):

```bash
npx tsx scripts/run-expansion.ts --top-k=1 --row-cap=10 \
  --label=golf-intl-budget-0705 --candidates=path/to/rows.json
```

`--candidates=<file>` is a JSON array of candidate rows (each shaped as a
`ResearchedRow`: dataset, canonical fields, `sourceUrl`, `citations[]`). The CLI
uses a **fixed researcher** that returns those candidates, so already-web-
verified rows flow through the real pipeline. This is how the supervised first
run was done.

### No live researcher in the CLI (by design)

The CLI does **not** wire a live web-research agent. Without `--candidates`, it
exits without ingesting. Real web research is driven from an interactive session
that calls `runExpansion({ researcher })` with a researcher backed by
WebSearch/WebFetch (following the `parallel-research-fanout` discipline), or by
supplying a `--candidates` file of rows a session has already verified. This
keeps the monthly daemon **disarmed-safe**: if armed as-is it runs the safe
no-ingest path.

## Arm the monthly agent (only when Nick decides)

The launchd plist ships as a **file in the repo**, `NOT loaded`:

```bash
# ARM
cp deploy/com.secondnick.cite-cache-expansion.plist \
   ~/Library/LaunchAgents/com.secondnick.cite-cache-expansion.plist
launchctl load ~/Library/LaunchAgents/com.secondnick.cite-cache-expansion.plist

# DISARM
launchctl unload ~/Library/LaunchAgents/com.secondnick.cite-cache-expansion.plist
rm ~/Library/LaunchAgents/com.secondnick.cite-cache-expansion.plist
```

Cadence: **monthly, Day 6 ~09:30** — the day after the Day-5 SEO fleet agent
(`com.secondnick.seo-parity`) so fresh coverage feeds SEO. Output is logged to
`docs/pending-prs/expansion-run.log`.

## Go-live constraints (Nick-directed)

- **Local only.** `runExpansion` always calls `proposePr({ push:false })` — it
  never pushes and never calls `gh`. It produces a local `expand/<label>`
  branch + commit + a PR-body artifact under `docs/pending-prs/` for review.
- **Disarmed.** The plist is a file; nothing is `launchctl load`ed until Nick
  arms it.
- **Real data only.** The honesty-firewall validator (`src/research-schema.ts`)
  rejects any row without a resolvable primary `sourceUrl` and ≥1 citation.

## Test

```bash
npx tsx --test scripts/run-expansion.test.ts
```

Covers: per-dataset breakdown (the seam), rowCap enforcement with reported
drops, dryRun zero-side-effects (injected ingest/propose spies), the
push:false LOCAL-only gate, and the empty-batch / rolled-back-gate → no-PR
paths. No network, no git, no real-file writes.
