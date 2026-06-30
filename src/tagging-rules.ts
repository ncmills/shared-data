/**
 * tagging-rules.ts — the SINGLE source of truth for "which wizards may surface
 * this universe item, and with what audiences/products."
 *
 * Used by:
 *   1. the Phase-B cross-tag backfill (apply over the whole universe once), and
 *   2. the Phase-E monthly growth agents (apply to every newly-pulled item),
 * so the tagging logic lives in ONE place and never drifts between them.
 *
 * Given an item's ENTITY KIND + its salient properties (activity type / kind,
 * price, audience, setting, region), `deriveRouting()` returns the wizard /
 * audience / product tags it SHOULD carry. Phase-A baked tags that reproduce
 * pre-migration behavior exactly; these rules layer the INTENTIONAL EXPANSION
 * (cross-tag) on top — they only ever ADD reachability, never remove it, so the
 * superset gate holds.
 *
 * ⚠️ TAG ≠ SURFACED. Tagging an item for a wizard makes it *eligible*; it only
 * actually appears if that wizard's ENGINE reads that entity kind. Golf courses
 * tagged `bestman` do nothing until plan-my-party's engine reads courses. So the
 * cross-tags below are split into:
 *   - `core`   — reachability the engines ALREADY honor (safe, no engine change)
 *   - `expand` — reachability that needs an engine change to take effect; these
 *                are the "aggressive auto-tag, then prune" candidates Nick reviews
 *                before any wizard engine is wired to consume them.
 */

import type { WizardTag, AudienceTag, ProductTag } from "./tags";
import { activityAudiences, nightlifeAudiences, CATEGORY_OF } from "./tags";

export type EntityKind =
  | "party-venue" // activity/dining/nightlife/lodging/transport on a destination
  | "golf-course"
  | "residence"
  | "experience"
  | "outing-template"
  | "golf-destination"; // a TDF destination (golf schema)

export interface RoutingInput {
  kind: EntityKind;
  /** party-venue sub-kind, for audience taxonomy */
  venueType?: "activity" | "dining" | "nightlife" | "lodging" | "transport";
  /** fine activity type or experience kind (golf, wine-tour, spa, …) */
  activityType?: string;
  /** nightlife vibe (chill/balanced/unhinged) */
  vibe?: string;
  /** residence / venue setting (ranch, urban, lake, …) */
  setting?: string;
  /** legacy party brands, when present */
  brands?: ("moh" | "bestman" | "both")[];
  /** explicit audiences carried by the item (used to gate party cross-tags:
   *  an item flagged corporate/clients-only is corporate-coded and never
   *  crosses to a party brand). */
  audiences?: AudienceTag[];
}

export interface Routing {
  /** reachability the engines already honor */
  core: { wizards: WizardTag[]; audiences: AudienceTag[]; products: ProductTag[] };
  /** reachability that needs an engine change to take effect (review before wiring) */
  expand: { wizards: WizardTag[]; reason: string }[];
}

const uniq = <T>(xs: T[]): T[] => Array.from(new Set(xs));
const ALL_AUD: AudienceTag[] = ["corporate", "clients", "bachelor", "bachelorette"];

function partyWizardsFromBrands(brands: ("moh" | "bestman" | "both")[] = []): WizardTag[] {
  const w: WizardTag[] = [];
  if (brands.includes("bestman") || brands.includes("both")) w.push("bestman");
  if (brands.includes("moh") || brands.includes("both")) w.push("moh");
  return w;
}

/**
 * BRAND PROTECTION — the single chokepoint for "may this activity/experience
 * cross to a PARTY wizard, and which one?" (bachelor → Best Man HQ,
 * bachelorette → Maid of Honor HQ). Hard rules baked into the data, not left to
 * the consuming engine:
 *   - GOLF is a bachelor + corporate thing. It may cross to Best Man HQ; it
 *     NEVER crosses to Maid of Honor HQ (golf is not a bachelorette activity).
 *   - Bachelorette-only staples (boudoir, pole-class, drag-brunch, …) cross to
 *     MOH only — never to Best Man HQ.
 *   - Everything else follows the per-type audience taxonomy in tags.ts.
 * An item with NO party audiences (corporate/clients-only) returns [] — it is
 * corporate-coded and crosses to no party brand.
 */
function partyFitWizards(activityType?: string): WizardTag[] {
  const aud = activityAudiences(activityType ?? "");
  const isGolf = (CATEGORY_OF[activityType ?? ""] ?? []).includes("golf");
  const out: WizardTag[] = [];
  if (aud.includes("bachelor")) out.push("bestman");
  // golf → never bachelorette/MOH, regardless of its broad audience default
  if (aud.includes("bachelorette") && !isGolf) out.push("moh");
  return out;
}

/** True when the item's explicit audiences include a party audience. Items
 *  flagged corporate/clients-only are corporate-coded → no party cross-tag. */
function hasPartyAudience(audiences?: AudienceTag[]): boolean {
  if (!audiences || audiences.length === 0) return true; // unknown → defer to type taxonomy
  return audiences.some((a) => a === "bachelor" || a === "bachelorette");
}

// Settings that read as a corporate DAY-event venue (so an urban/lake/coastal
// residence is also outing-eligible, not just multi-day retreat).
const OUTING_SETTINGS = new Set(["urban", "lake", "coastal", "vineyard", "island"]);

/**
 * The rule. Pure, deterministic, editable. Returns BOTH the safe core routing
 * and the expansion candidates (which an engine must opt into).
 */
export function deriveRouting(input: RoutingInput): Routing {
  const { kind, venueType, activityType, vibe, setting, brands } = input;

  switch (kind) {
    case "party-venue": {
      // audiences from the existing taxonomy (unchanged from Phase A)
      const aud =
        venueType === "nightlife"
          ? (nightlifeAudiences(vibe ?? "") as AudienceTag[])
          : venueType === "activity"
            ? (activityAudiences(activityType ?? "") as AudienceTag[])
            : ALL_AUD;
      const corporate = aud.includes("corporate");
      const core: Routing["core"] = {
        wizards: uniq([
          ...partyWizardsFromBrands(brands),
          ...(corporate ? (["offsite-outing"] as WizardTag[]) : []),
        ]),
        audiences: aud,
        products: uniq([
          ...(brands?.some((b) => b === "bestman" || b === "both") ? (["bach-party"] as ProductTag[]) : []),
          ...(brands?.some((b) => b === "moh" || b === "both") ? (["bachelorette"] as ProductTag[]) : []),
          ...(corporate ? (["outing"] as ProductTag[]) : []),
        ]),
      };
      return { core, expand: [] };
    }

    case "golf-course": {
      // Golf is a bachelor + corporate thing. Engines that read courses today:
      // tdf, offsite-retreat, offsite-outing. Audiences deliberately EXCLUDE
      // bachelorette — golf never belongs to Maid of Honor HQ. The one party
      // expansion is Best Man HQ only (see partyFitWizards: golf → [bestman]).
      return {
        core: {
          wizards: ["tdf", "offsite-retreat", "offsite-outing"],
          audiences: ["corporate", "clients", "bachelor"],
          products: ["golf-trip", "retreat", "outing"],
        },
        expand: [
          { wizards: partyFitWizards("golf"), reason: "golf is a common bachelor day activity → Best Man HQ only (NEVER MOH); needs the BM engine to read courses" },
        ],
      };
    }

    case "residence": {
      const outing = setting ? OUTING_SETTINGS.has(setting) : false;
      return {
        core: {
          wizards: uniq(["offsite-retreat", ...(outing ? (["offsite-outing"] as WizardTag[]) : [])]),
          audiences: ["corporate", "clients", "internal"],
          products: uniq(["retreat", ...(outing ? (["outing"] as ProductTag[]) : [])]),
        },
        expand: [],
      };
    }

    case "experience": {
      // Experiences already feed both offsite wizards (Phase A). Expansion:
      // a party-appropriate, non-corporate-coded experience could feed
      // bestman/moh if those engines read experiences (they don't today).
      // Brand-fit is enforced HERE so corporate-coded / golf experiences can
      // never leak into a party brand (golf → bestman only, never MOH).
      const fit = hasPartyAudience(input.audiences) ? partyFitWizards(activityType) : [];
      return {
        core: {
          wizards: ["offsite-retreat", "offsite-outing"],
          audiences: ["corporate", "clients", "internal"],
          products: ["retreat", "outing"],
        },
        expand: fit.length
          ? [{ wizards: fit, reason: "party-appropriate experience → party brand(s) by audience fit (corporate-coded & golf-to-MOH excluded); needs the party engine to read experiences" }]
          : [],
      };
    }

    case "outing-template":
      return {
        core: { wizards: ["offsite-outing"], audiences: ["corporate", "clients", "internal"], products: ["outing"] },
        expand: [],
      };

    case "golf-destination":
      return {
        core: { wizards: ["tdf"], audiences: ALL_AUD, products: ["golf-trip"] },
        expand: [
          { wizards: ["offsite-retreat", "offsite-outing"], reason: "a golf destination's town has corporate-usable courses/dining — needs OO engine to read TDF destinations" },
        ],
      };
  }
}

/** Convenience: just the safe-core wizard set for an item (what the backfill bakes). */
export function coreWizards(input: RoutingInput): WizardTag[] {
  return deriveRouting(input).core.wizards;
}

/** All expansion candidates across the universe, for the prune-review report. */
export function expansionCandidates(input: RoutingInput) {
  return deriveRouting(input).expand;
}
