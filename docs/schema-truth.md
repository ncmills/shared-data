# What is actually in the database

`migrations/*.sql` is a **history of intentions**, not a description of the database. Every
file in it carries a header telling the reader to apply it by hand in the Supabase SQL
editor, so nothing ever guaranteed that running them produced the live schema — and they
have in fact diverged.

`db/live-schema.sql` is the description. It is generated from `pg_catalog` on the live
project and committed, so the repo can finally answer *"what is actually there?"*

```bash
npm run schema:snapshot          # rewrite db/live-schema.sql from live
npm run schema:check             # fail if the committed snapshot no longer matches live
```

`supabase db dump` was not used: it requires Docker. `snapshot-schema.sh` reads `pg_catalog`
through `supabase db query`, so it runs anywhere the CLI is authenticated. It exits **2 with
a named reason** if it cannot reach the database — a snapshot that silently produced an empty
file would be strictly worse than none, and that is exactly what `supabase db dump` did when
Docker was absent: it printed an error and left a 0-byte file that reads like a success.

## The divergence that proved the point

| | brands permitted on `wp_plan_inputs` |
|---|---|
| `migrations/2026-04-16-signal-tables.sql` | `moh`, `bestman`, `tdf` |
| **live** | `moh`, `bestman`, `tdf`, `offsite`, `handicap` |

`offsite` and `handicap` were added directly in the SQL editor on 2026-06-26. Both have been
writing rows ever since — 101 and 10 respectively — against a committed constraint that
forbids them. Nobody was wrong; nothing was watching.

## Two live defects this snapshot surfaced

**1. The rate limiter is split across two tables.** The 2026-04-22 `wp_` rename moved the
signal tables. Nine unprefixed originals still exist, and eight are empty husks. The ninth is
not:

| table | rows | oldest | newest |
|---|---|---|---|
| `signal_rate_limit` | 2,438 | 2026-05-17 | **2026-08-24** |
| `wp_signal_rate_limit` | 3,449 | 2026-04-16 | **2026-08-25** |

Both are being written *today*. A limiter whose counters are split across two tables enforces
a materially looser limit than the one it claims, and which table a given request lands in
depends on which code path served it. This is unresolved — it needs the writer of each path
identified before either table is touched.

**2. `destination` values are not canonical.** With `destination_slug` now materialised, the
top destination is visibly stored three ways:

```
nashville        26 plans
nashville-tn     12 plans
nashville, tn    10 plans      -> one city, 48 plans, ranked as three
```

`destination_key` collapses the separator-only cases (140 distinct values -> 131). Seven
cities remain split by a bare-vs-state-suffix difference. That last collapse deliberately is
**not** done with a regex — `portland-or` and `portland-me` are different places — and needs a
foreign key to the destination catalog. Which is the argument for the catalog living in this
database rather than in a TypeScript file in another repo.

## Not fixed here, on purpose

The eight empty unprefixed tables are safe to drop and were left alone: dropping is
destructive, they cost nothing, and the split rate limiter above means at least one code path
is still addressing unprefixed names. Identify the writers first, then drop as one deliberate
change.

## Open: the snapshot-vs-live check does not run in CI

`scripts/snapshot-schema.sh --check` (`npm run schema:check`) is the only thing that can catch
the database being altered by hand without a re-snapshot — the direction where the repo's
description of the schema silently stops being true. It does not run in CI, and this is what it
would take to change that.

Measured 2026-08-27, exit codes captured directly (piping the script into `tail` reports
`tail`'s exit code, which briefly made a correct script look broken):

| environment | exit | output |
|---|---|---|
| supabase CLI present and linked (a dev laptop) | `0` | `schema snapshot matches live.` |
| no `supabase` on `PATH` (a GitHub runner) | `2` | `COULD-NOT-RUN: supabase CLI not installed. 0 comparisons executed — this is NOT a pass.` |

`ubuntu-latest` ships no supabase CLI and this repo has no committed link, so adding the step to
`audit.yml` as-is turns Audit permanently red. Wrapping it in `continue-on-error` is worse: it
becomes a check that can only pass, which is the defect class the schema work exists to close.

Doing it properly needs a `SUPABASE_ACCESS_TOKEN` repository secret plus a CLI install step.
That mints a credential, so it is Nick's decision, not an implementation detail.

**What is covered meanwhile:** `scripts/schema-signal-columns.test.ts` runs in the suite and in
`audit.yml`, and checks the committed snapshot against the columns the signals route writes —
the direction that caused the 2026-08-27 outage. **What is not:** drift between that committed
snapshot and the live database.
