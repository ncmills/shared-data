# Propagation runbook: how a shared-data change reaches production

## The one mechanism

Every consumer (`plan-my-party` / BM, `maid-of-honor-hq` / MOH, `offsite-outpost` / OO,
`handicap-hq` / HHQ) depends on shared-data purely through the npm git
dependency in its `package.json`:

```json
"shared-data": "github:ncmills/shared-data"
```

There is no build step or npm publish for shared-data — it ships as raw
TypeScript straight from the GitHub repo (`"main": "src/index.ts"`), so `npm
install` in a consumer literally clones `github:ncmills/shared-data` at
whatever ref the dep string names.

**This is the ONLY thing that makes a shared-data change reach production.**
Editing files on a shared-data branch, or even merging that branch locally,
changes nothing for any consumer until:

1. the change is on `origin/main` (merged AND pushed), and
2. every consumer's `package.json` is bumped to reference that commit and
   reinstalled/rebuilt.

Earlier task history in this repo included a HHQ-only jsDelivr fetch script
(`scripts/fetch-shared-data.mjs`) that pulled golf files directly from a
pinned SHA at prebuild time. That was a **second, redundant** propagation path
that only HHQ had — it's been removed (Task 5). HHQ now consumes shared-data
exactly like BM/MOH/OO: through the npm git dependency, nothing else.

## Release → bump → rebuild

1. **Merge to `main`.** Merge the shared-data feature branch into `main` and
   push. (Never skip the push — an unpushed local merge is invisible to every
   consumer's `npm install`, since it resolves against `origin`, not your
   filesystem.)

2. **Get the release SHA:**

   ```bash
   cd ~/shared-data
   npx tsx scripts/release.ts
   ```

   This just prints `git rev-parse HEAD` — a "release" is nothing more than a
   commit on `main`. Run it *after* step 1, on the up-to-date `main`.

3. **Pin every consumer to that SHA:**

   ```bash
   npx tsx scripts/bump-consumers.ts <sha>
   ```

   This rewrites each consumer's `package.json` —

   ```json
   "shared-data": "github:ncmills/shared-data#<sha>"
   ```

   — replacing any prior pin (never appending a second `#`), then runs `npm
   install --package-lock-only` in each repo so the lockfile records the exact
   resolved commit too. Default consumer list is BM/MOH/OO/HHQ
   (`DEFAULT_CONSUMER_REPOS` in `scripts/bump-consumers.ts`); pass an explicit
   repo list as extra args to target a subset.

4. **Commit each consumer's `package.json` + lockfile.** One commit per
   consumer repo (`git add package.json package-lock.json && git commit`),
   same convention as any other dependency bump.

5. **Rebuild/deploy each consumer.** Each site's normal deploy path (push to
   its own `main`, Vercel auto-build) picks up the pinned commit from there.
   Nothing shared-data-specific is required beyond the pin already being
   committed — no fetch scripts, no manual data copy.

## Deferred: this branch's pin

`spec/planner-cite-cache-expansion` is a feature branch, not `main` — it
hasn't gone through step 1 yet. **Pinning consumers to a SHA is a
release-time action**, done only after merge+push. This task (Task 5) does
NOT pin any consumer and does NOT push shared-data or any consumer branch;
it only builds and tests the release/bump tooling and removes HHQ's redundant
fetch path so propagation is unified on this one mechanism ahead of the real
release.
