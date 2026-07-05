# Phase 0 — Is this worth it? (planner cite-cache expansion)

Written **before** the implementation plan, per the writing-plans augmentation.

## The question the full plan answers
"Can every planner wizard cite a rich, correct, verifiable set of venues/courses/residences for any reasonable input, and does that keep improving on its own?"

## Cheapest version that surfaces the same core value
**Just the free multiplier (Pillar 1.2 + 2.1 + 2.3):** add the `handicap` tag, wire HHQ to the existing 994-course shared set, and run the cross-tag backfill over the current universe. No auditor, no recurring engine, no new research.

- **Cost:** ~half a day. Touches `tags.ts`, `tagging-rules.ts`, `destinations-bake.ts`, HHQ's data adapter; one backfill run.
- **What it delivers:** surfaces ~994 already-built courses to HHQ; cross-tags corporate-eligible party rows to OO-Outing that aren't tagged yet. This is the single biggest jump in aggregate reach, at near-zero research cost.

## Full-plan cost vs cheap-version cost
- **Cheap:** ~0.5 day, data-layer only.
- **Full:** multi-day — adds OO reconciliation (Pillar 1.3), the coverage auditor (Pillar 3), and the recurring expansion engine with agent research (Pillar 4). Ongoing monthly agent cost thereafter.

## What the cheap version MISSES (and why it's not enough here)
The cheap version delivers ~1 of Nick's 3 explicit asks. It skips:
1. **The audit feature** — no starved-input / orphan guarantee. Nick asked for this by name.
2. **The recurring engine** — no self-maintaining growth; back here next quarter. Nick chose "build the engine" explicitly.
3. **Actual new-data growth** — thin regions (international/midwest golf, palace/castle residences, equestrian/motorsport activities) stay thin. Coverage + SEO-surface goals unmet.
4. **OO reconciliation** — OO stays partly forked; expansions leak past it.

## Verdict
**Full plan is justified** — two of its three pillars (audit, recurring engine) are named requirements, not gold-plating, and Nick set budget aside deliberately. BUT the cheap version is not thrown away: it IS the first shippable increment. The plan is sequenced so the wire+tag free-multiplier lands early (early value, low risk) before any research spend, and the auditor lands before expansion so growth is measured, not blind. No pillar is speculative; each maps to a stated ask.

**Not killed. Proceed to the implementation plan, cheap-multiplier-first sequencing.**
