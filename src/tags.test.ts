// tags.test.ts — the wizard/audience vocabulary is the single source of truth.
//
// The universe's routing correctness leans on `Record<WizardTag, …>` maps.
// `npm run typecheck` (run in CI) makes a missing key a compile error, but
// scripts and tests execute through `tsx`, which strips types with no compiler
// in the loop — so the same exhaustiveness is asserted here at RUNTIME too.
//
// The rule these tests enforce: no file may hand-copy the list of wizard or
// audience names. A hardcoded literal is how `verify-universe.ts` ended up
// missing "handicap" — a vocabulary guard that had itself drifted out of sync
// with the vocabulary.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ALL_WIZARD_TAGS, ALL_AUDIENCE_TAGS, wizardsForActivity } from "./tags";
import { ENGINE_READS } from "./engine-reads";
import { WIZARD_INPUT_SPACE } from "./wizard-input-space";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

test("the wizard vocabulary has no duplicates and no empty entries", () => {
  assert.equal(new Set(ALL_WIZARD_TAGS).size, ALL_WIZARD_TAGS.length);
  for (const t of ALL_WIZARD_TAGS) assert.ok(t.trim().length > 0);
});

test("the audience vocabulary has no duplicates and no empty entries", () => {
  assert.equal(new Set(ALL_AUDIENCE_TAGS).size, ALL_AUDIENCE_TAGS.length);
  for (const t of ALL_AUDIENCE_TAGS) assert.ok(t.trim().length > 0);
});

test("every Record<WizardTag, …> map is keyed by the full vocabulary", () => {
  // The maps that decide what each wizard reads and what gets audited. A key
  // missing here reads back `undefined` at runtime instead of failing loudly.
  const maps: Record<string, Record<string, unknown>> = {
    ENGINE_READS,
    WIZARD_INPUT_SPACE,
  };
  for (const [name, map] of Object.entries(maps)) {
    for (const wizard of ALL_WIZARD_TAGS) {
      assert.ok(
        map[wizard] !== undefined,
        `${name} is missing the "${wizard}" key — add it rather than letting the lookup return undefined`,
      );
    }
    for (const key of Object.keys(map)) {
      assert.ok(
        (ALL_WIZARD_TAGS as readonly string[]).includes(key),
        `${name} has key "${key}" which is not a WizardTag — remove it or add it to ALL_WIZARD_TAGS`,
      );
    }
  }
});

// ── the anti-drift sweep ────────────────────────────────────────────────────

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

test("no file spells out the COMPLETE wizard vocabulary as a literal list", () => {
  // A guard is only as good as its vocabulary. `verify-universe.ts` held
  // `new Set(["bestman","moh","tdf","offsite-retreat","offsite-outing"])` —
  // silently missing "handicap", so a legitimately handicap-tagged item would
  // have been reported as a BAD wizard by the check meant to protect it.
  //
  // The rule enforced here: a line naming EVERY wizard is, by definition,
  // `ALL_WIZARD_TAGS` written out by hand — import it instead, and it can
  // never go stale. Deliberate SUBSETS (e.g. `HOUSING_WIZARDS`, a single
  // routing rule's `core.wizards`, test fixtures) are real design choices and
  // are left alone; `WizardTag[]` typing already catches typos in those.
  //
  // Honest limitation: this cannot catch a list that INTENDS to be complete
  // but is already missing a name — that's precisely the shape of the
  // verify-universe bug, and no textual heuristic distinguishes it from a
  // deliberate subset. Deriving the guards from the vocabulary (done) and the
  // `Record<WizardTag, …>` typecheck are what close that hole; this sweep
  // stops NEW copies from being introduced.
  const offenders: string[] = [];
  for (const file of [...sourceFiles(join(REPO_ROOT, "src")), ...sourceFiles(join(REPO_ROOT, "scripts"))]) {
    if (file.endsWith(join("src", "tags.ts")) || file.endsWith(join("src", "tags.test.ts"))) continue;
    const lines = readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      const hits = ALL_WIZARD_TAGS.filter((t) => line.includes(`"${t}"`) || line.includes(`'${t}'`));
      if (hits.length === ALL_WIZARD_TAGS.length) {
        offenders.push(`${file.slice(REPO_ROOT.length + 1)}:${i + 1}`);
      }
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `these lines spell out the complete wizard vocabulary; import ALL_WIZARD_TAGS instead:\n  ${offenders.join("\n  ")}`,
  );
});

// ---------------------------------------------------------------------------
// TAGGING CORRECTNESS — the bake must not contradict the brand guard.
//
// Two sources decide an activity's wizards, and until 2026-07-31 they
// disagreed. `deriveRouting` (tagging-rules.ts, the BACKFILL/growth path)
// applies `partyFitWizards`, which hard-blocks golf from Maid of Honor HQ.
// `bakeActivity` (destinations-bake.ts, the path that actually WRITES the tags
// every consumer reads) derived wizards from the row's `brands` alone and never
// consulted that guard. So four rows typed `golf` and branded `["both"]` were
// baked with `moh` in their wizards, in direct contradiction of a rule the repo
// asserts elsewhere and enforces in MOH's own prebuild (check-no-golf).
//
// Nothing leaked — MOH_ACTIVITY_TYPES omits `golf`, so the overlay dropped them
// downstream — but the cached tag was wrong, and a tag that survives only
// because something later filters it is a latent bug, not a safe one.
test("golf never reaches moh through the bake, even when the row is branded both", () => {
  assert.equal(
    wizardsForActivity("golf", ["both"]).includes("moh"),
    false,
    "golf is not a bachelorette activity — the bake must apply the same guard deriveRouting does",
  );
  assert.equal(
    wizardsForActivity("golf", ["both"]).includes("bestman"),
    true,
    "golf still reaches Best Man HQ",
  );
});

test("a non-golf activity branded both still reaches both party brands", () => {
  const w = wizardsForActivity("spa", ["both"]);
  assert.ok(w.includes("moh"), "the golf guard must not over-reach");
  assert.ok(w.includes("bestman"));
});

test("golf branded moh-only reaches NO party brand rather than silently keeping moh", () => {
  assert.deepEqual(
    wizardsForActivity("golf", ["moh"]).filter((x) => x === "moh" || x === "bestman"),
    [],
    "a golf row branded moh is a data error; the guard drops it rather than honouring it",
  );
});
