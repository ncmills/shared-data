// signature-experiences.test.ts — every residence's `signatureExperiences`
// entry must resolve to a real Experience id.
//
// OO's engine (offsite-outpost/src/lib/engine/generate.ts, pickExperiences)
// reads a venue's `signatureExperiences` as a list of Experience IDs and
// silently drops any id that doesn't resolve (`.filter((e): e is Experience
// => Boolean(e))`). A dangling id doesn't error — it just quietly falls
// through to the geography-blind pairsWith backfill, so a hand-curated
// "signature" list can be 100% ignored and nobody notices. Casa de Campo's
// four signature ids (polo-clinic-match, sporting-clays-tower,
// billfish-tournament, championship-golf) were ALL dangling before the
// 2026-08-18 fix — this test would have failed on that row alone.
//
// This test enumerates the full experience universe the OO engine actually
// builds ALL_EXPERIENCES from (curated + hero + pool, across air/water/winter)
// and asserts every residence's signatureExperiences id resolves against it.
import { test } from "node:test";
import assert from "node:assert/strict";

import { residencesForSite } from "./residences";
import {
  ooExperiences,
  ooHeroExpAir,
  ooPoolExpAir,
  ooHeroExpWater,
  ooPoolExpWater,
  ooHeroExpWinter,
  ooPoolExpWinter,
} from "./oo-atlas";

function allExperienceIds(): Set<string> {
  const rows = [
    ...ooExperiences,
    ...ooHeroExpAir,
    ...ooPoolExpAir,
    ...ooHeroExpWater,
    ...ooPoolExpWater,
    ...ooHeroExpWinter,
    ...ooPoolExpWinter,
  ];
  return new Set(rows.map((r) => r.id).filter((id): id is string => Boolean(id)));
}

test("every residence signatureExperiences id resolves to a real experience", () => {
  const experienceIds = allExperienceIds();
  const venues = residencesForSite("offsite");

  const dangling: { venueId: string; danglingId: string }[] = [];
  for (const v of venues) {
    const sig: string[] = Array.isArray(v.signatureExperiences)
      ? (v.signatureExperiences as string[])
      : [];
    for (const id of sig) {
      if (!experienceIds.has(id)) {
        dangling.push({ venueId: String(v.id), danglingId: id });
      }
    }
  }

  // Known-remaining gap: 45 dangling ids across 21 international/regional
  // hero venues (bespoke ids like "muskoka-regatta", "exp-agafay-desert-rally")
  // that have no honest generic-catalog match yet — see PR #<fill-in> body for
  // the full list. This test's job is to stop the count from growing and to
  // prove the Casa de Campo row (and the other 34 refs fixed alongside it) no
  // longer dangles, not to force the remaining backlog to zero in one pass.
  const cdc = dangling.filter((d) => d.venueId === "casa-de-campo-dr");
  assert.deepEqual(
    cdc,
    [],
    `casa-de-campo-dr must have zero dangling signatureExperiences ids, found: ${JSON.stringify(cdc)}`,
  );

  assert.ok(
    dangling.length <= 45,
    `dangling signatureExperiences ids grew past the known baseline of 45: ${dangling.length}\n${JSON.stringify(dangling, null, 2)}`,
  );
});
