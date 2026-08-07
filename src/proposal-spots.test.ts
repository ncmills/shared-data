import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateProposalSpot,
  describePermit,
  assertCanonicalTypesAreRoutable,
  PROPOSAL_TYPE_TO_CANONICAL,
  type ProposalSpot,
} from "./proposal-spots";
import { MOH_ACTIVITY_TYPES, BESTMAN_ACTIVITY_TYPES } from "./destinations-overlay";

/** A real row, drawn from the 2026-08-06 pilot rather than invented. */
const green: ProposalSpot = {
  id: "new-york-ny-central-park-conservatory-garden",
  destinationId: "new-york-ny",
  name: "Conservatory Garden, Central Park",
  type: "garden",
  highlight: "Central Park's only formal garden, and the one spot the Conservancy permits ceremonies in.",
  tier: "green",
  permit: {
    required: true,
    appliesToProposal: true,
    fact: {
      verbatim:
        "Marriage proposals are welcome but are subject to the same policies as weddings and require a wedding permit.",
      sourceUrl: "https://www.centralparknyc.org/wedding-faqs",
    },
    authority: "Central Park Conservancy",
    authorityContact: "https://www.centralparknyc.org/wedding-faqs",
  },
  crowdWindow: null,
  privacy: null,
  backup: null,
  sourceUrl: "https://www.centralparknyc.org/activities/guides/weddings",
  citations: ["https://www.centralparknyc.org/wedding-faqs"],
};

const amber: ProposalSpot = {
  ...green,
  id: "joshua-tree-ca-cap-rock",
  destinationId: "joshua-tree-ca",
  name: "Cap Rock",
  type: "scenic-overlook",
  tier: "amber",
  permit: {
    required: true,
    appliesToProposal: false,
    fact: {
      verbatim: "A special use permit is required for all ceremonies taking place in any area of the park.",
      sourceUrl: "https://www.nps.gov/jotr/planyourvisit/weddings-and-ceremonies.htm",
    },
    authority: "Joshua Tree National Park",
    authorityContact: "https://www.nps.gov/jotr/planyourvisit/weddings-and-ceremonies.htm",
  },
};

const red: ProposalSpot = {
  ...green,
  id: "cabo-mx-playa-del-amor",
  destinationId: "cabo-mx",
  name: "Playa del Amor",
  type: "beach",
  tier: "red",
  permit: {
    required: "unknown",
    appliesToProposal: false,
    fact: null,
    authority: "ZOFEMAT Los Cabos",
    authorityContact: "https://www.loscabos.gob.mx/",
  },
};

test("accepts the three real pilot rows", () => {
  for (const row of [green, amber, red]) {
    const r = validateProposalSpot(row);
    assert.equal(r.ok, true, `${row.id}: ${r.ok ? "" : r.reasons.join("; ")}`);
  }
});

test("green without a quote is rejected — a green row must carry its receipt", () => {
  const r = validateProposalSpot({ ...green, permit: { ...green.permit, fact: null } });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reasons.some((x) => x.includes("green: requires permit.fact")));
});

test("green whose source never mentioned proposals is rejected as mislabelled", () => {
  // This is the Joshua Tree failure: real source, wrong subject, tiered green.
  const r = validateProposalSpot({
    ...green,
    permit: { ...green.permit, appliesToProposal: false },
  });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reasons.some((x) => x.includes("appliesToProposal=true")));
});

test("red carrying a permit quote is rejected — no laundering an unsourced row", () => {
  const r = validateProposalSpot({ ...red, permit: { ...red.permit, fact: green.permit.fact } });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reasons.some((x) => x.includes("launder")));
});

test("red without a reachable authority is rejected — 'check locally' must be actionable", () => {
  const r = validateProposalSpot({ ...red, permit: { ...red.permit, authorityContact: "" } });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reasons.some((x) => x.includes("authorityContact")));
});

test("placeholder values are not data", () => {
  const r = validateProposalSpot({ ...green, highlight: "TBD" });
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.reasons.some((x) => x.includes("placeholder")));
});

test("an amber row can never render like a green one", () => {
  const g = describePermit(green);
  const a = describePermit(amber);
  const r = describePermit(red);

  // The green row asserts. The amber row explicitly disclaims. The red row admits.
  assert.ok(g.startsWith("Permit required."));
  assert.ok(a.includes("do not mention proposals"));
  assert.ok(a.includes("Confirm with"));
  assert.ok(r.includes("could not verify"));

  // The decisive property: no amber/red prose ever asserts a permit outcome.
  for (const prose of [a, r]) {
    assert.ok(!prose.startsWith("Permit required."));
    assert.ok(!prose.startsWith("No permit required."));
  }
});

test("a no-permit-required green row says so plainly", () => {
  const gog: ProposalSpot = {
    ...green,
    id: "colorado-springs-co-garden-of-the-gods",
    destinationId: "colorado-springs-co",
    tier: "green",
    permit: {
      required: false,
      appliesToProposal: true,
      fact: {
        verbatim:
          "Professional photo or video projects where the final product is for a customer's personal use do not require a permit, including weddings and engagement photos.",
        sourceUrl: "https://gardenofgods.com/commercial-use/photography/",
      },
      authority: "Garden of the Gods Visitor & Nature Center",
      authorityContact: "(719) 385-5940",
    },
  };
  assert.equal(validateProposalSpot(gog).ok, true);
  assert.ok(describePermit(gog).startsWith("No permit required."));
});

test("every canonical type is already routable by BOTH sibling planners", () => {
  // The lag bug, made structural. `second-line-parade` was correctly tagged for
  // Best Man HQ and still rendered nowhere for months because this second gate
  // was never updated. If a future proposal type maps to a canonical type the
  // overlays don't know, this fails HERE rather than silently dropping rows.
  const problems = assertCanonicalTypesAreRoutable(MOH_ACTIVITY_TYPES, BESTMAN_ACTIVITY_TYPES);
  assert.deepEqual(problems, [], problems.join("\n"));
});

test("the type map has no unreachable entries", () => {
  for (const [research, canonical] of Object.entries(PROPOSAL_TYPE_TO_CANONICAL)) {
    assert.ok(canonical.length > 0, `${research} maps to nothing`);
  }
});
