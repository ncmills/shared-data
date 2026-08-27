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

## The snapshot-vs-live check, and what it took to run it in CI

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

**Resolved 2026-08-27.** Nick approved the credential; `SUPABASE_ACCESS_TOKEN` is set on this
repo and `audit.yml` now installs the CLI, links, and runs `npm run schema:check`.

Two things were measured rather than assumed, because each would otherwise have shipped as a
green step that checked nothing:

- **`supabase db query` has no `--project-ref` flag.** Against 2.84.2 the only target flags are
  `--local`, `--linked` and `--db-url`, and `snapshot-schema.sh` uses `--linked`. A runner must
  therefore be *linked* before the check can read anything; without a link step `schema:check`
  exits 2 with `COULD-NOT-RUN … 0 comparisons executed`.
- **`SUPABASE_ACCESS_TOKEN` is enough — no DB password.** `db query --linked` goes through the
  Management API at 2.84.2. Proven three ways: on a Mac in a clean workdir with
  `SUPABASE_DB_PASSWORD` unset *and* set to a deliberately wrong value (same rows both times);
  the login keychain holds only the access token, no DB password; and on a GitHub runner, where
  three of this workflow's four runs passed with only the token.

- **One run failed with `Connect to your database by setting the env var: SUPABASE_DB_PASSWORD`,
  and that message is a red herring.** The run that failed and a run that SUCCEEDED were the
  **same commit, three seconds apart** (`edb6c15`, `pull_request` → failure, `push` → success).
  It was transient; the CLI named a cause that was not the cause, and a plausible-sounding error
  string is not a diagnosis. **Do not add a DB-password secret on the strength of it.**

  Two runs of one commit disagreeing is the signature of a flake — and it was visible in the run
  list before anyone opened a log. Reading only the failing run is how a transient becomes an
  architecture decision.

The step carries no `continue-on-error`: exit 2 (could not measure) and exit 1 (snapshot stale)
must both reach the merge boundary as red, or the check becomes one that can only pass.

**What is covered meanwhile:** `scripts/schema-signal-columns.test.ts` runs in the suite and in
`audit.yml`, and checks the committed snapshot against the columns the signals route writes —
the direction that caused the 2026-08-27 outage. **What is not:** drift between that committed
snapshot and the live database.
