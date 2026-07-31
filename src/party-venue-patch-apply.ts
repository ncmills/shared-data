/**
 * party-venue-patch-apply.ts — merge field-level patches onto existing party
 * venues at assembly time.
 *
 * Runs in `index.ts` AFTER `attachPartyVenues` and BEFORE `.map(bakeDestination)`:
 *
 *   attach (add venues) → patch (enrich venues) → bake (derive tags)
 *
 * Both halves of that order are load-bearing. Patching after attach means a
 * venue researched this month can be enriched next month without hand-editing
 * anything. Patching before the bake means a patched `pricePerPerson` or `type`
 * feeds the tag derivation — run it after and a repriced row would keep a
 * `priceTier` computed from the stale price, and the overlays would filter on a
 * number nobody can see.
 */
import type { CanonicalDestination } from "./destinations-types";
import type { PartyVenueCategory } from "./research-schema";
import { PARTY_VENUE_PATCHES, type PartyVenuePatch } from "./party-venue-patches";

const norm = (s: string): string => s.trim().toLowerCase();

const patchKey = (destinationId: string, category: string, name: string): string =>
  `${norm(destinationId)}|${norm(category)}|${norm(name)}`;

/** The five arrays a patch can target, and the category naming each. */
const CATEGORIES: readonly PartyVenueCategory[] = ["activity", "dining", "nightlife", "lodging", "transport"];

function rowsFor(dest: CanonicalDestination, category: PartyVenueCategory): { name: string }[] {
  switch (category) {
    case "activity":
      return dest.activities;
    case "dining":
      return dest.dining;
    case "nightlife":
      return dest.nightlife;
    case "lodging":
      return dest.lodging;
    case "transport":
      return dest.transport;
  }
}

/**
 * Apply every patch, or throw.
 *
 * A patch that matches nothing is FATAL, not a no-op. A silently-skipped patch
 * is a backfill that reports success and changes nothing — the same
 * passes-every-gate-reaches-no-user failure the append path's orphan check
 * exists to stop, and harder to notice because the row still renders, just with
 * the old value.
 *
 * Two patches against one row is also fatal: last-write-wins would make the
 * universe depend on array order.
 */
export function applyPartyVenuePatches(
  destinations: CanonicalDestination[],
  patches: PartyVenuePatch[] = PARTY_VENUE_PATCHES,
): CanonicalDestination[] {
  if (patches.length === 0) return destinations;

  const unsourced = patches.filter(
    (p) => !p.sourceUrl?.trim() || !Array.isArray(p.citations) || p.citations.length === 0,
  );
  if (unsourced.length > 0) {
    const detail = unsourced.map((p) => `"${p.name}" (${p.destinationId}/${p.category})`).join("; ");
    throw new Error(
      `party-venue-patch-apply: ${unsourced.length} patch(es) carry no provenance: ${detail}. ` +
        `A patch can overwrite a value a user reads, so it must carry sourceUrl + a non-empty citations array.`,
    );
  }

  const byKey = new Map<string, PartyVenuePatch>();
  for (const p of patches) {
    const key = patchKey(p.destinationId, p.category, p.name);
    if (byKey.has(key)) {
      throw new Error(
        `party-venue-patch-apply: two patches target the same row — "${p.name}" ` +
          `(${p.destinationId}/${p.category}). Merge them; order-dependent results are not acceptable.`,
      );
    }
    byKey.set(key, p);
  }

  const applied = new Set<string>();

  const out = destinations.map((dest) => {
    let touched = false;
    const next: CanonicalDestination = { ...dest };

    for (const category of CATEGORIES) {
      const rows = rowsFor(dest, category);
      if (rows.length === 0) continue;

      let categoryTouched = false;
      const merged = rows.map((row) => {
        const key = patchKey(dest.id, category, row.name);
        const patch = byKey.get(key);
        if (!patch) return row;
        applied.add(key);
        categoryTouched = true;
        return mergePatch(row, patch);
      });

      if (categoryTouched) {
        touched = true;
        assignCategory(next, category, merged);
      }
    }

    return touched ? next : dest;
  });

  const missed = [...byKey.entries()].filter(([key]) => !applied.has(key)).map(([, p]) => p);
  if (missed.length > 0) {
    const detail = missed.map((p) => `"${p.name}" → ${p.destinationId}/${p.category}`).join("; ");
    throw new Error(
      `party-venue-patch-apply: ${missed.length} patch(es) matched no existing row: ${detail}. ` +
        `The target is matched on destination + category + name and is never searched for elsewhere — ` +
        `fix the key or remove the patch.`,
    );
  }

  return out;
}

/** Strip the key fields, then shallow-merge the payload over the row. */
function mergePatch<T extends { name: string }>(row: T, patch: PartyVenuePatch): T {
  const { destinationId: _d, category: _c, name: _n, ...payload } = patch;
  return { ...row, ...payload };
}

function assignCategory(
  dest: CanonicalDestination,
  category: PartyVenueCategory,
  rows: { name: string }[],
): void {
  switch (category) {
    case "activity":
      dest.activities = rows as CanonicalDestination["activities"];
      return;
    case "dining":
      dest.dining = rows as CanonicalDestination["dining"];
      return;
    case "nightlife":
      dest.nightlife = rows as CanonicalDestination["nightlife"];
      return;
    case "lodging":
      dest.lodging = rows as CanonicalDestination["lodging"];
      return;
    case "transport":
      dest.transport = rows as CanonicalDestination["transport"];
      return;
  }
}
