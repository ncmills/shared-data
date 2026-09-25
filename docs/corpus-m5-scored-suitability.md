# CORPUS-M5 — scored suitability: notes and full-run plan

Code: `scripts/corpus/score.ts` (rubric load, caps and rules, prompt, ingest, plan), `scripts/corpus/verify-suitability.ts` (the checks). Rubrics: `rubrics/moh.yaml` (v1.3), `rubrics/bestman.yaml` (v1.1), `rubrics/controls.json`, `rubrics/sentinels.json`. Scores: `scores/<site>.json`, merged into `suitability/<site>.json` by `scripts/corpus/suitability.ts`.

## Reading a MOH fit (R1 close-out (b), DRV ruling, 2026-09-25)

- **The fit tops out near the high anchors, 0.85–0.90, by construction.** The anchors show the model a "high" row at venue 0.9, and the combine (`fit = K × (0.5 + 0.5 × P)`) rounds to 0.05. A 0.9 is the top of the scale, not "merely good". Do not build a ≥ 0.95 "top pick" tier on it.
- **The only thresholds anything reads are `low 0.3` and `good 0.6`.** The resolution that matters is at the 0.6 line.
- **M7 must not rank on fit differences under 0.1.** In the FIX3 pilot, run-to-run spread reached 0.2 on single rows (0.038 on average).
- **M7 treats 0.55–0.65 as uncertain, not good** (R1 F2 option i). Rubric-silent kinds such as cigar bars move together by ±0.1 around this line from run to run.
- This is recorded here and not in `rubrics/moh.yaml`, because any rubric edit changes its blob sha. Every score would then go stale and need a new pilot. Add the ceiling line to the rubric's bands the next time it is edited for another reason.

## Full-run plan (per site)

`planRun(site, scopeIds(site))` builds the plan. Scoring is the orchestrator's job (a fresh, small Opus driver), with one Sonnet subagent per batch.

1. **Batches.** The site's model-decided scope rows, minus the anchors, shuffled with a fixed seed (5) into batches of at most 50. MOH: 1,240 rows in 25 batches. BMHQ: 995 rows in 20 batches.
2. **Prompt.** `renderScoringPrompt(site, batch)`. For MOH it is 6 anchors (with reference scores), then the batch, then the drift sentinels from `rubrics/sentinels.json` (no reference scores, and never labelled; a sentinel the batch already asks is not repeated). BMHQ has no anchors and no sentinels, so its prompt is byte-identical to FIX1.
3. **Ingest.** Call `ingestAnswer(site, batch, answer, meta, root, { writeAnchors: plan.writeAnchors[i] })`. It throws on a malformed answer, a missing row, anchor or sentinel, or **drift**:
   - an anchor more than 0.05 from its reference fit (R1 F4);
   - a sentinel more than 0.15 from its pilot fit (R1 F1).

   **On a throw, re-ask that batch.** A reason that fails `checkScore` is also re-asked.
4. **Anchors inside scope** (MOH: the Kansas City sports bar and the Beau Rivage poker room). Batch 1 writes them from its own in-call answer, as ordinary `tagger: "llm"` rows with batch 1's `runId` and the flag `anchor`. No later batch writes them, and `checkScore` requires the flag on exactly the anchor rows.
5. **Double-score (MOH, before merge).** Re-render and re-score batch `plan.doubleScore`, the batch with the most rubric-silent-kind rows (`SILENT_KINDS.moh`; batch index 19 has 23/50). Ingest the second answer without `writeAnchors` and report `meanAbsDeltaFit(first, second)` next to the pilot's 0.038. The second scoring is never merged.
6. **Merge.** `renderScores(site, rows)` → `scores/<site>.json`, then `npm run verify`. Verify fails on a stale rubric version, a duplicate score, a bad flag, a fit that does not recompute, or an invalid anchor or sentinel.

## Drift sentinels (MOH)

| row | band | pilot fit (FIX3 runs) |
|---|---|---|
| fort-worth-tx--dining--wicked-butcher | high | 0.8 (0.8 / 0.8 / 0.8) |
| crested-butte-co--activity--lift-served-mountain-biking | mid | 0.35 (0.35 / 0.35 / 0.35) |
| galveston-tx--activity--private-poker-night | low | 0.1 (0.1 / 0.1 / 0.15) |

Each was chosen for a spread of 0–0.05 across the 3 FIX3 runs, one per band. None is a control or an anchor, and none reproduced an anchor's per-criterion vector in any FIX3 run, since a row that echoes an anchor cannot show drift. Wicked Butcher and Galveston poker are also in MOH scope: the batch that asks one of them scores it as an ordinary row, and checks it against its pilot fit as well.

## Full-run cost (R1 F5 restatement; Sonnet tokens, mostly cache reads)

| item | rows | batches | per batch | tokens |
|---|---|---|---|---|
| MOH, anchors + sentinels | 1,242 (1,240 in batches + 2 anchors written by batch 1) | 25 | ~0.36M | ~9.0M |
| MOH double-score | 50 | 1 | ~0.36M | ~0.36M |
| BMHQ, no anchors | 995 | 20 | ~0.345M | ~6.9M |
| re-asks for failed reasons (1.4% of rows ≈ 32 rows) | — | ~1 | ~0.36M | ~0.36M |
| sentinel overhead (3 rows × 25 batches) | — | — | < 1% of a batch | < 0.1M |
| **Sonnet total** | | **~47** | | **~16.7M** |

On top of that, each drift re-ask costs ~0.36M. The FIX3 pilot answers would have tripped none (0 of 3 replayed). The Opus orchestrator adds 5.5M–46M depending on driver context (FIX1 estimate), so run it from a fresh, small driver. Per-batch cost is over 90% harness overhead. 100-row batches would roughly halve the Sonnet cost, but stability at that size is unmeasured.
