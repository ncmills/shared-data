/**
 * ingest-proposal-spots.ts — turn raw research batches into dataset rows, or
 * refuse to.
 *
 * Reads one or more JSON files produced by the Step-0 research pass and emits a
 * single validated dataset. Nothing is written unless it survives two gates:
 *
 *   1. `validateProposalSpot` — the tier firewall (see src/proposal-spots.ts).
 *      Green needs a quote AND appliesToProposal; amber needs a quote and NOT
 *      appliesToProposal; red must carry no quote at all.
 *
 *   2. The DESTINATION ANCHOR. `destinationId` is resolved against the real
 *      universe and a miss is a hard failure, never a fuzzy match. This repo has
 *      been bitten repeatedly by silent mis-association from name-matching —
 *      there is a Nashville, TN and a Nashville, IN in this very dataset, and
 *      "Portland" is two destinations in two states. A research agent that
 *      guesses an anchor must fail loudly here rather than attach a Maine spot
 *      to Oregon.
 *
 * Usage:
 *   npx tsx scripts/ingest-proposal-spots.ts <batch.json> [more.json...] \
 *     [--out src/proposal-spots-data.json] [--write]
 *
 * Without --write it is a DRY RUN that reports what would land. That default is
 * deliberate: the point of this pass is the honest count, and a script that
 * writes by default invites "it said 47 rows" without anyone reading them.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { sharedDestinations } from "../src/index";
import {
  validateProposalSpot,
  PROPOSAL_TYPE_TO_CANONICAL,
  downgradeIfUncorroborated,
  type ProposalSpot,
  type SourceTier,
  type SourcedFact,
} from "../src/proposal-spots";

interface RawSpot extends Record<string, unknown> {
  name?: string;
  type?: string;
  tier?: string;
}
interface RawCity {
  destinationId?: string;
  city?: string;
  spots?: RawSpot[];
}

const args = process.argv.slice(2);
const write = args.includes("--write");
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : "src/proposal-spots-data.json";
const files = args.filter(
  (a, i) => !a.startsWith("--") && !(outIdx >= 0 && i === outIdx + 1),
);

if (files.length === 0) {
  console.error("usage: ingest-proposal-spots.ts <batch.json> [...] [--out path] [--write]");
  process.exit(2);
}

const KNOWN = new Map<string, { city: string; state: string }>();
for (const d of sharedDestinations as unknown as { id: string; city: string; state: string }[]) {
  KNOWN.set(d.id, { city: d.city, state: d.state });
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Research batches arrive HTML-escaped from web scraping. */
const unescapeHtml = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

const deepUnescape = (v: unknown): unknown => {
  if (typeof v === "string") return unescapeHtml(v);
  if (Array.isArray(v)) return v.map(deepUnescape);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepUnescape(x)]));
  }
  return v;
};

/** A {verbatim:null,sourceUrl:null} stub is an absent fact, not a present one. */
function fact(v: unknown): SourcedFact | null {
  if (!v || typeof v !== "object") return null;
  const f = v as { verbatim?: unknown; sourceUrl?: unknown };
  if (typeof f.verbatim !== "string" || f.verbatim.trim() === "") return null;
  if (typeof f.sourceUrl !== "string" || f.sourceUrl.trim() === "") return null;
  return { verbatim: f.verbatim.trim(), sourceUrl: f.sourceUrl.trim() };
}

/**
 * Reshape a research row into the dataset shape.
 *
 * The agents emit `permit: {verbatim, sourceUrl, ...}` flat and tier in caps.
 * Normalising here rather than demanding a perfect contract keeps a batch that
 * did real research from being thrown away over formatting — but note it only
 * ever MOVES fields. It never fills one in.
 */
function normalise(raw: RawSpot, anchor: string): Record<string, unknown> {
  const r = deepUnescape(raw) as Record<string, unknown>;
  const p = (r.permit ?? {}) as Record<string, unknown>;
  const tier = String(r.tier ?? "").toLowerCase();
  const permitFact = fact(p.fact) ?? fact(p);

  const out: Record<string, unknown> = {
    ...r,
    id: `${anchor}-${slug(String(r.name ?? ""))}`,
    destinationId: anchor,
    tier,
    permit: {
      required: p.required ?? "unknown",
      appliesToProposal: p.appliesToProposal === true,
      fact: permitFact,
      authority: p.authority ?? "",
      authorityContact: p.authorityContact ?? null,
    },
    crowdWindow: fact(r.crowdWindow),
    privacy: fact(r.privacy),
    backup: typeof r.backup === "string" && r.backup.trim() ? r.backup.trim() : null,
  };

  // A red row may not carry an authoritative-looking quote (the laundering
  // rule). Where one exists it is preserved as a DISPUTED source instead of
  // being deleted — Savannah's two contradictory city pages are real findings.
  if (tier === "red" && permitFact) {
    out.disputed = [permitFact, ...(Array.isArray(r.disputed) ? r.disputed : [])];
    (out.permit as Record<string, unknown>).fact = null;
  }
  return out;
}

const accepted: ProposalSpot[] = [];
const rejected: { where: string; reasons: string[] }[] = [];
const emptyCities: string[] = [];
// Greens the corroboration gate demoted to amber. Counted separately from
// `rejected` because nothing was thrown away — the row still lands, at the tier
// its own quote supports. Reported for the same reason rejections are: a silent
// demotion would make a mislabelled batch look like a clean one.
const downgrades: string[] = [];
const seenIds = new Set<string>();

for (const file of files) {
  let parsed: RawCity[];
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    rejected.push({ where: file, reasons: [`unparseable JSON: ${(e as Error).message}`] });
    continue;
  }
  if (!Array.isArray(parsed)) {
    rejected.push({ where: file, reasons: ["top level is not an array"] });
    continue;
  }

  for (const city of parsed) {
    const anchor = String(city.destinationId ?? "").trim();

    // Hard anchor resolution. No fuzzy fallback, on purpose.
    if (!KNOWN.has(anchor)) {
      rejected.push({
        where: `${file}:${city.city ?? anchor ?? "?"}`,
        reasons: [
          `destinationId "${anchor}" is not in the canonical universe — ` +
            `refusing to guess which of ${sharedDestinations.length} destinations was meant`,
        ],
      });
      continue;
    }

    const spots = Array.isArray(city.spots) ? city.spots : [];
    if (spots.length === 0) {
      emptyCities.push(anchor);
      continue;
    }

    for (const raw of spots) {
      const name = String(raw.name ?? "").trim();
      const id = `${anchor}-${slug(name)}`;
      const candidate = { ...raw, id, destinationId: anchor };

      // Demote an uncorroborated green BEFORE validating, so a mislabelled row
      // is kept as the amber row it always was rather than thrown away.
      const pre = validateProposalSpot(candidate);
      const toCheck = pre.ok ? downgradeIfUncorroborated(pre.spot) : null;
      if (toCheck?.downgraded) {
        downgrades.push(`${anchor}/${name}`);
      }
      const result = toCheck
        ? validateProposalSpot(toCheck.spot)
        : (() => {
            const c = candidate as Record<string, unknown>;
            if (String(c.tier) === "green") {
              const demoted = {
                ...c,
                tier: "amber",
                permit: { ...(c.permit as object), appliesToProposal: false },
              };
              const r = validateProposalSpot(demoted);
              if (r.ok) downgrades.push(`${anchor}/${name}`);
              return r;
            }
            return pre;
          })();

      if (!result.ok) {
        rejected.push({ where: `${anchor}/${name || "(unnamed)"}`, reasons: result.reasons });
        continue;
      }
      if (seenIds.has(id)) {
        rejected.push({ where: `${anchor}/${name}`, reasons: ["duplicate spot id"] });
        continue;
      }
      seenIds.add(id);
      accepted.push(result.spot);
    }
  }
}

const byTier = (t: SourceTier) => accepted.filter((s) => s.tier === t).length;
const citiesCovered = new Set(accepted.map((s) => s.destinationId));

console.log("proposal-spot ingest");
console.log("─".repeat(60));
console.log(`files            ${files.length}`);
console.log(`accepted spots   ${accepted.length}`);
console.log(`  green          ${byTier("green")}  (primary source addresses proposals)`);
console.log(`  amber          ${byTier("amber")}  (real source, wedding-only — our inference)`);
console.log(`  red            ${byTier("red")}  (unsourced — renders "confirm with <authority>")`);
console.log(`cities with data ${citiesCovered.size}`);
console.log(`cities empty     ${emptyCities.length}${emptyCities.length ? ` (${emptyCities.join(", ")})` : ""}`);
console.log(`rejected         ${rejected.length}`);
console.log(`downgraded       ${downgrades.length}  (green -> amber: the quote never corroborated it)`);

if (downgrades.length) {
  console.log("\ndowngraded green -> amber (kept, at the tier the source supports):");
  for (const d of downgrades.slice(0, 40)) console.log(`  ${d}`);
  if (downgrades.length > 40) console.log(`  ... and ${downgrades.length - 40} more`);
}

if (rejected.length) {
  console.log("\nrejections (these are the honest gaps, not noise):");
  for (const r of rejected.slice(0, 40)) {
    console.log(`  ${r.where}`);
    for (const reason of r.reasons) console.log(`      - ${reason}`);
  }
  if (rejected.length > 40) console.log(`  ... and ${rejected.length - 40} more`);
}

// Cross-planner reach: report which canonical types the accepted rows carry, so
// the sibling-planner effect is a measured number rather than an assumption.
const canonical = new Map<string, number>();
for (const s of accepted) {
  const c = PROPOSAL_TYPE_TO_CANONICAL[s.type];
  canonical.set(c, (canonical.get(c) ?? 0) + 1);
}
if (canonical.size) {
  console.log("\ncanonical types (all already routable by MOH + Best Man HQ):");
  for (const [t, n] of [...canonical].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${t}`);
  }
}

if (write) {
  writeFileSync(outPath, JSON.stringify(accepted, null, 2) + "\n");
  console.log(`\nwrote ${accepted.length} spots -> ${outPath}`);
} else {
  console.log("\nDRY RUN — nothing written. Pass --write to persist.");
}
