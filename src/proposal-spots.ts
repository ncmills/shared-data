/**
 * proposal-spots.ts — the Engagedmoon dataset, and its honesty firewall.
 *
 * A proposal spot carries three facts a couple actually decides on: whether a
 * PERMIT is required, when the place is CROWDED, and whether they will be
 * ALONE. Those three are exactly the fields that cannot be guessed, and the
 * Phase 4 gate in `~/work/friendsmoon-engagedmoon/` exists because if they can
 * only ever resolve to "check locally" then the product is a checklist and does
 * not need a wizard.
 *
 * THE 2026-08-06 STEP-0 FINDING, which this schema is shaped by.
 *
 * A six-city pilot (then a 50-city pass) established that sourceability tracks
 * JURISDICTION, not city size or fame:
 *
 *   - Municipal parks, state parks and NPS units with a permit desk publish
 *     quotable, proposal-relevant rules. Central Park says, in as many words,
 *     "Marriage proposals are welcome but are subject to the same policies as
 *     weddings and require a wedding permit." Emerald Bay publishes the privacy
 *     fact outright: "Use of the site is by permit only, but not exclusive."
 *   - Dispersed federal land (national forest) routes every real question to a
 *     ranger district phone number.
 *   - International beaches produce ONLY wedding-vendor blogs, and those blogs
 *     CONTRADICT EACH OTHER — Cabo returned both "$300 ZOFEMAT" and "$100 beach
 *     permit" from different vendors, neither traceable to a Mexican government
 *     source.
 *
 * So the dataset is NOT "sourced vs unsourced". It is three tiers, and the
 * whole point of this module is that the three CANNOT RENDER IDENTICALLY:
 *
 *   green — a primary source explicitly addresses proposals/engagements.
 *           Quote it.
 *   amber — a primary source covers weddings/ceremonies but never mentions
 *           proposals. Applying it to a proposal is OUR INFERENCE and must be
 *           labelled as one. Joshua Tree is the type specimen: $120, 15 days
 *           to 12 months, eleven named sites, group caps 5-100 — all real, all
 *           about weddings, none of it about proposals.
 *   red   — no primary source. The honest output is the NAMED AUTHORITY and its
 *           REAL phone/URL, so "check locally" is actionable instead of a shrug.
 *
 * WHY THIS IS NOT JUST A STRING FIELD. A `permitStatus: string` would let
 * Joshua Tree's inference render byte-identical to Central Park's quoted fact.
 * That is the exact failure class the repo keeps re-learning: `verify-url`
 * asked whether a URL was ALIVE rather than whether it was the RIGHT PLACE, and
 * 91 golf venues shipped with plausible-looking wrong URLs until a user tapped
 * dinner in Santa Fe and got a construction company. A confident wrong permit
 * answer is worse than that one — it is legal-adjacent, and it lands on the day
 * someone proposes.
 *
 * See also `feedback_no_fabricated_social_proof` and
 * `feedback_research_before_drafting`: no clock time, fee, permit status, crowd
 * level or lead time may be asserted without a quotable primary source.
 */

/** The three tiers. Ordered least-to-most trustworthy on purpose. */
export const SOURCE_TIERS = ["red", "amber", "green"] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

/**
 * A fact we are willing to show a user, and the receipt for it.
 *
 * `verbatim` is a QUOTE, not a paraphrase. A paraphrase is where fabrication
 * enters — it is the step at which "weddings require a permit" quietly becomes
 * "your proposal requires a permit."
 */
export interface SourcedFact {
  verbatim: string;
  sourceUrl: string;
}

export interface ProposalPermit {
  /** "unknown" is a real, expected answer and must stay distinguishable from false. */
  required: boolean | "unknown";
  /**
   * Did the source actually talk about PROPOSALS, or only about weddings?
   * This single boolean is the difference between a fact and an inference, and
   * it is why `permit` is an object rather than a string.
   */
  appliesToProposal: boolean;
  /** null on a red row — a red row has no receipt, and must not manufacture one. */
  fact: SourcedFact | null;
  /** Who actually administers this land. Required on EVERY row, all tiers. */
  authority: string;
  /** Real phone or URL. Required on red rows: it is what makes "check locally" usable. */
  authorityContact: string | null;
}

/**
 * Research vocabulary -> canonical activity type already known to the overlays.
 *
 * Deliberately a MAP rather than a new type union. Every value on the right is
 * already present in BOTH `MOH_ACTIVITY_TYPES` and `BESTMAN_ACTIVITY_TYPES`,
 * so proposal spots cross to the sibling planners the moment they are ingested,
 * with no allowlist edit and therefore no repeat of the lag bug that kept
 * `second-line-parade` (and later `luxe-picnic` / `photoshoot`) invisible on
 * Best Man HQ for months despite being correctly tagged.
 *
 * Adding a key here is cheap. Adding a VALUE that is not already in both
 * allowlists is the bug — `assertCanonicalTypesAreRoutable()` below fails
 * loudly if anyone does.
 */
export const PROPOSAL_TYPE_TO_CANONICAL: Record<string, string> = {
  "scenic-overlook": "scenic-overlook",
  overlook: "scenic-overlook",
  viewpoint: "scenic-overlook",
  trail: "hiking",
  hike: "hiking",
  beach: "beach",
  waterfront: "beach-hangout",
  rooftop: "rooftop-bar",
  garden: "walking-tour",
  park: "walking-tour",
  "historic-site": "tour",
};

export interface ProposalSpot {
  id: string;
  /** EXPLICIT anchor into the canonical universe. Never inferred from a city
   *  name — same rule the golf `destinationId` anchor follows, for the same
   *  reason: matching town names across an international geography is the
   *  silent mis-association this repo has repeatedly been bitten by. */
  destinationId: string;
  name: string;
  /** A key of PROPOSAL_TYPE_TO_CANONICAL. */
  type: string;
  highlight: string;
  tier: SourceTier;
  permit: ProposalPermit;
  crowdWindow: SourcedFact | null;
  privacy: SourcedFact | null;
  /** A named nearby fallback for when the spot is mobbed. null is honest. */
  backup: string | null;
  /**
   * Red-only. Sources that CONTRADICT each other, kept rather than discarded.
   *
   * Savannah is why this exists: savannahga.gov/3607/Weddings says a wedding
   * with "fewer than fifty people" needs no permit, while the city's own
   * Reserve City Parks & Squares page says fewer than twenty. Both are live,
   * both are the City of Savannah. That disagreement is real information — it
   * tells a couple the city's own guidance is unreliable and they must call —
   * and throwing it away would leave the row looking merely unresearched.
   *
   * These never render as authority. `describePermit` only ever says that
   * sources disagree, never which one is right.
   */
  disputed?: SourcedFact[];
  sourceUrl: string;
  citations: string[];

  // ───────────────────── practical fields (2026-08-07) ─────────────────────
  // Everything above answers "can we say this?". Everything below answers
  // "can they actually do it?" — the questions a couple hits after they have
  // believed us.

  /** Minimum advance notice in days, only where the authority publishes one. */
  leadTimeDays?: number;
  /** Published fee, verbatim from the authority. Never estimated. */
  fee?: string;
  /**
   * Practical constraints a couple must satisfy — insurance, group caps, no
   * tripods, "bring your own car". PROSE, shown to the user.
   *
   * READ `capstoneEligible` BEFORE FILTERING ON THIS. The 2026-08-06 plan said
   * to exclude any spot with a non-null `blocker` from capstone selection. That
   * rule was written from McWay Falls, where the park says elopements and
   * filming "will not be permitted" — and applied literally it removed 80 of
   * 124 researched spots, because the field had also collected "no selfie
   * sticks", "do not bring arches or trellises" and "no overnight parking".
   * Hand-read on 2026-08-07: 3 of the 80 actually disqualify a spot. A field
   * that mixes "you may not propose here" with "leave the tripod at home"
   * cannot be filtered on, so the disqualification is now its own explicit,
   * reviewable boolean and this one is prose again.
   */
  blocker?: string;
  /** How to reach the spot, where that is not obvious. */
  accessNote?: string;
  /** A spot that does not exist for part of the year. */
  seasonalClosure?: string;

  /**
   * May this spot carry the proposal itself?
   *
   * `false` ONLY when the authority forbids the moment or the place is shut:
   * McWay Falls (elopements and filming not permitted), Portland Head Light
   * (ceremonies and photographs not permitted on the parcel), Breakneck Ridge
   * (closed for a two-year project). Absent means eligible — the common case.
   *
   * An ineligible spot is not deleted. It still appears in SEO pages and can
   * still be someone's `backup`; it just cannot be the capstone.
   */
  capstoneEligible?: boolean;
  /** Required whenever `capstoneEligible` is false. Quotes the authority. */
  ineligibleReason?: string;
}

const isHttpUrl = (s: unknown): s is string =>
  typeof s === "string" && /^https?:\/\/\S+$/i.test(s.trim());

const isNonBlank = (s: unknown): s is string =>
  typeof s === "string" && s.trim().length > 0;

/**
 * Placeholder sniffing. Research agents under pressure to fill a field emit
 * these; they read as data and are not.
 */
const PLACEHOLDER = /^(n\/?a|tbd|todo|unknown|none|null|-|\?+|check locally|varies)$/i;

/**
 * The words that make a source proposal-relevant.
 *
 * ADDED 2026-08-06 after the first research batch came back with New Orleans
 * City Park tiered green, `required: true`, and a summary claiming the permit
 * form "explicitly lists engagement as a purpose of photos." The cited page
 * says the opposite — "Personal-use film and photo shoots do not need a permit"
 * — and contains neither "engagement" nor "proposal" anywhere. The quote was
 * real; the CLAIM ABOUT THE QUOTE was not.
 *
 * That is the failure this whole file was built to stop, arriving through the
 * one door left open: `appliesToProposal` was a self-reported boolean, so a
 * researcher could simply assert it. Now the quote has to corroborate it. A
 * green row whose own verbatim never mentions a proposal or an engagement is
 * rejected, and `downgradeIfUncorroborated` turns it into the amber row it
 * always was.
 */
export const PROPOSAL_WORDS = /propos|engagement|betroth|"pop the question"/i;

/**
 * The second corroboration path: a rule that covers proposals BY CONSTRUCTION.
 *
 * Found 2026-08-06 in batch 5. Post-EXPLORE-Act, the NPS and Forest Service
 * both publish a rule that says still photography is "treated the same" and
 * that "It does not matter whether it is commercial, non-commercial, for
 * content creation, by a student, or conducted by media." A rule that applies
 * to ALL photography regardless of purpose necessarily applies to a proposal —
 * and it is arguably STRONGER evidence than a passing mention of the word,
 * because it forecloses the question rather than answering one instance of it.
 *
 * This is still corroborated by the QUOTE, not by a researcher's say-so, which
 * is the property that matters. It is deliberately narrow: it matches
 * universal-applicability language only, not any generic permit sentence.
 */
export const UNIVERSAL_RULE_WORDS =
  /treated the same|regardless of (whether|purpose|commercial|intent)|does not matter whether|whether .{0,40}commercial or non-?commercial|for any (photo|film) ?shoot, professional or otherwise/i;

/**
 * Does the quote itself support a proposal-specific reading?
 *
 * Either it names proposals/engagements, or it states a rule so broad that a
 * proposal cannot fall outside it. Anything else is an inference and belongs
 * in amber.
 */
export function factMentionsProposal(fact: SourcedFact | null): boolean {
  if (!fact) return false;
  return PROPOSAL_WORDS.test(fact.verbatim) || UNIVERSAL_RULE_WORDS.test(fact.verbatim);
}

/**
 * Mechanically demote a green row whose quote does not corroborate it.
 *
 * Deliberately NOT a hand-edit of the offending row: the same mistake will
 * recur across eight research batches and fifty cities, and a fix that only
 * catches the instance I happened to spot-check is not a fix. Returns the row
 * unchanged when it is already consistent.
 */
export function downgradeIfUncorroborated<T extends ProposalSpot>(
  spot: T,
): { spot: T; downgraded: boolean } {
  if (spot.tier !== "green") return { spot, downgraded: false };
  if (factMentionsProposal(spot.permit.fact)) return { spot, downgraded: false };
  return {
    spot: {
      ...spot,
      tier: "amber" as SourceTier,
      permit: { ...spot.permit, appliesToProposal: false },
    },
    downgraded: true,
  };
}

export type SpotValidation =
  | { ok: true; spot: ProposalSpot }
  | { ok: false; reasons: string[] };

/**
 * The gate. Rejects anything that could present an inference as a fact.
 *
 * The tier-specific rules are the whole firewall:
 *   green MUST carry a quote AND `appliesToProposal: true`. A green row without
 *         a receipt is the failure mode this file exists to prevent.
 *   amber MUST carry a quote AND `appliesToProposal: false`. Amber is precisely
 *         "real source, wrong subject" — if the source did address proposals it
 *         was never amber.
 *   red   MUST NOT carry a permit quote (that would launder an unsourced row
 *         into a sourced-looking one) and MUST name an authority + contact,
 *         because an unactionable "check locally" is not worth shipping.
 */
export function validateProposalSpot(input: unknown): SpotValidation {
  const reasons: string[] = [];
  const s = input as Partial<ProposalSpot>;

  if (!input || typeof input !== "object") return { ok: false, reasons: ["not an object"] };

  for (const f of ["id", "destinationId", "name", "highlight"] as const) {
    if (!isNonBlank(s[f])) reasons.push(`${f}: missing or blank`);
    else if (PLACEHOLDER.test(String(s[f]).trim())) reasons.push(`${f}: placeholder value`);
  }

  if (!isNonBlank(s.type) || !(s.type! in PROPOSAL_TYPE_TO_CANONICAL)) {
    reasons.push(`type: "${String(s.type)}" is not a known proposal-spot type`);
  }

  if (!s.tier || !(SOURCE_TIERS as readonly string[]).includes(s.tier)) {
    reasons.push(`tier: must be one of ${SOURCE_TIERS.join("/")}`);
  }

  if (!isHttpUrl(s.sourceUrl)) reasons.push("sourceUrl: must be an http(s) URL");
  if (!Array.isArray(s.citations) || s.citations.length === 0) {
    reasons.push("citations: at least one required");
  }

  const p = s.permit;
  if (!p || typeof p !== "object") {
    reasons.push("permit: missing");
    return { ok: false, reasons };
  }
  if (!isNonBlank(p.authority)) reasons.push("permit.authority: required on every tier");
  if (typeof p.appliesToProposal !== "boolean") {
    reasons.push("permit.appliesToProposal: must be an explicit boolean");
  }

  const hasFact = !!p.fact && isNonBlank(p.fact.verbatim) && isHttpUrl(p.fact.sourceUrl);

  if (s.tier === "green") {
    if (!hasFact) reasons.push("green: requires permit.fact with a verbatim quote + source URL");
    if (p.appliesToProposal !== true) {
      reasons.push("green: requires appliesToProposal=true (else it is amber, not green)");
    }
    // The quote must corroborate the claim. See PROPOSAL_WORDS above: without
    // this, appliesToProposal is just a researcher's assertion about a source
    // rather than something the source actually says.
    if (hasFact && !factMentionsProposal(p.fact!)) {
      reasons.push(
        "green: the verbatim quote never mentions a proposal or engagement — " +
          "this is amber (real source, wedding-only), not green",
      );
    }
  }
  if (s.tier === "amber") {
    if (!hasFact) reasons.push("amber: requires permit.fact (a real source about the wrong subject)");
    if (p.appliesToProposal !== false) {
      reasons.push("amber: requires appliesToProposal=false (else it is green, not amber)");
    }
  }
  if (s.tier === "red") {
    if (hasFact) reasons.push("red: must NOT carry a permit quote — that launders an unsourced row");
    if (!isNonBlank(p.authorityContact)) {
      reasons.push("red: requires permit.authorityContact so 'check locally' is actionable");
    }
  }

  // An exclusion without a stated reason is indistinguishable from a typo, and
  // this flag removes a spot from the only thing the product exists to do.
  if (s.capstoneEligible === false && !isNonBlank(s.ineligibleReason)) {
    reasons.push(
      "capstoneEligible=false requires ineligibleReason quoting the authority",
    );
  }

  for (const [k, v] of [
    ["crowdWindow", s.crowdWindow],
    ["privacy", s.privacy],
  ] as const) {
    if (v == null) continue;
    if (!isNonBlank(v.verbatim)) reasons.push(`${k}.verbatim: blank — use null instead`);
    if (!isHttpUrl(v.sourceUrl)) reasons.push(`${k}.sourceUrl: must be an http(s) URL`);
  }

  return reasons.length ? { ok: false, reasons } : { ok: true, spot: s as ProposalSpot };
}

/**
 * The single render chokepoint for permit prose.
 *
 * Every surface — plan page, Q&A, OG text — goes through this. The tier
 * determines the SHAPE of the sentence, so an amber row is structurally
 * incapable of reading like a green one, no matter what the caller does.
 *
 * Deliberately deterministic string assembly rather than LLM prose: a model
 * asked to "summarise the permit situation" will smooth an inference into an
 * assertion every time (`feedback_money_prose_deterministic_not_regex` is the
 * same lesson on reconciled figures).
 */
export function describePermit(spot: ProposalSpot): string {
  const { permit: p } = spot;
  if (spot.tier === "green" && p.fact) {
    const lead = p.required === false ? "No permit required." : "Permit required.";
    return `${lead} ${p.authority} states: "${p.fact.verbatim}"`;
  }
  if (spot.tier === "amber" && p.fact) {
    return (
      `${p.authority} publishes permit rules for weddings and ceremonies, but they do not ` +
      `mention proposals — so we can't tell you this applies to yours. They state: ` +
      `"${p.fact.verbatim}" Confirm with ${p.authority}` +
      (p.authorityContact ? ` (${p.authorityContact}).` : ".")
    );
  }
  const disputed = spot.disputed ?? [];
  if (disputed.length >= 2) {
    return (
      `Official sources disagree about the rules here, so we won't guess. ` +
      `${p.authority} publishes conflicting guidance` +
      (p.authorityContact ? ` — confirm directly (${p.authorityContact}).` : ".")
    );
  }
  return (
    `We could not verify permit rules for a proposal here from an official source. ` +
    `Confirm with ${p.authority}` +
    (p.authorityContact ? ` (${p.authorityContact}).` : ".")
  );
}

/**
 * Guard: every canonical type this dataset maps to must already be routable by
 * the sibling planners. Called by the test; keep it here so the rule lives next
 * to the map it constrains.
 */
export function assertCanonicalTypesAreRoutable(
  mohTypes: Set<string>,
  bestmanTypes: Set<string>,
): string[] {
  const problems: string[] = [];
  for (const canonical of new Set(Object.values(PROPOSAL_TYPE_TO_CANONICAL))) {
    if (!mohTypes.has(canonical)) problems.push(`MOH_ACTIVITY_TYPES is missing "${canonical}"`);
    if (!bestmanTypes.has(canonical)) {
      problems.push(`BESTMAN_ACTIVITY_TYPES is missing "${canonical}"`);
    }
  }
  return problems;
}
