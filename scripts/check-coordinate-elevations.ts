/**
 * check-coordinate-elevations.ts — advisory DEM elevation sanity check for
 * proposal-spot coordinates.
 *
 * WHY THIS EXISTS: the state-bounding-box guard in proposal-spots-data.test.ts
 * can only catch "this pair is in the wrong state or hemisphere." It cannot
 * catch "this pair is the wrong REAL feature under an adjacent name" — a
 * coordinate that is well-formed, inside the right state, backed by a URL
 * that really does say what the note claims, and still wrong. That shape has
 * produced every bad pair found across both review batches so far (Lake
 * Butte Overlook, Jordanelle Hailstone, and — the case that motivated this
 * script — bend-or-watchman-overlook, whose cited NPS asset was a 2009
 * photo's geotag: the scene photographed, not the photographer's standpoint.
 * The pair sat on Crater Lake's own surface, ~3.4 km from the real overlook,
 * even though the row's own highlight said "roughly a thousand feet above
 * water." One elevation lookup would have caught it instantly.
 *
 * This script is that lookup, run deliberately, not automatically. It is
 * NOT a test and is NOT part of `npm test` — both review batches hit
 * transient flake in this repo's existing live-fetch tests, and 69+ more
 * network calls on every test run would make that worse. Run it by hand,
 * per batch: `npm run coord-elevations`.
 *
 * WHAT IT CANNOT DO: it has no idea what the correct elevation for any spot
 * is. It cannot confirm a coordinate is right — only surface ones that look
 * implausible for what the id/name says the spot is (e.g. a "summit" at sea
 * level). A flag here is a prompt to go read the source again, not a
 * verdict, and the absence of a flag is not proof the pair is correct —
 * "wrong real feature at a plausible elevation" (the Deception Pass Bridge
 * shape: right general position, fabricated provenance) is invisible to
 * this tool by construction. It is one more check, not a gate.
 */
import COORDINATES from "../data/proposal-spot-research/coordinates.json" with { type: "json" };
import { PROPOSAL_SPOTS_DATA } from "../src/proposal-spots-data";

const COORD_MAP: Record<string, [number, number]> = COORDINATES.coordinates as unknown as Record<
  string,
  [number, number]
>;

const NAME_BY_ID = new Map(PROPOSAL_SPOTS_DATA.map((s) => [s.id, s.name]));

const SUSPICIOUS_LOW_ELEVATION_M = 5;
const SUMMIT_SHAPE_PATTERN = /summit|overlook|ridge|point|peak|bluff|vista|butte|head\b/i;

const EPQS_URL = (lat: number, lng: number) =>
  `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Meters&wkid=4326`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Row = {
  id: string;
  lat: number;
  lng: number;
  elevationM: number | null;
  error: string | null;
  flagged: boolean;
};

async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(EPQS_URL(lat, lng), { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { value?: string };
    const value = body?.value != null ? Number(body.value) : NaN;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

async function main() {
  const ids = Object.keys(COORD_MAP).sort();
  const rows: Row[] = [];

  for (const id of ids) {
    const [lat, lng] = COORD_MAP[id];
    const elevationM = await fetchElevation(lat, lng);
    const nameOrId = NAME_BY_ID.get(id) ?? id;
    const looksLikeSummit = SUMMIT_SHAPE_PATTERN.test(id) || SUMMIT_SHAPE_PATTERN.test(nameOrId);
    const flagged =
      elevationM != null && looksLikeSummit && elevationM < SUSPICIOUS_LOW_ELEVATION_M;

    rows.push({
      id,
      lat,
      lng,
      elevationM,
      error: elevationM == null ? "fetch failed or no data" : null,
      flagged,
    });

    // Rate-limit politely — this is a courtesy call against a public federal
    // service, not a load test.
    await sleep(300);
  }

  const idWidth = Math.max(...rows.map((r) => r.id.length), "spot id".length);
  const coordWidth = Math.max(
    ...rows.map((r) => `${r.lat}, ${r.lng}`.length),
    "coordinate".length,
  );

  console.log(
    `${"spot id".padEnd(idWidth)}  ${"coordinate".padEnd(coordWidth)}  elevation (m)`,
  );
  console.log("-".repeat(idWidth + coordWidth + 20));

  for (const r of rows) {
    const coordStr = `${r.lat}, ${r.lng}`;
    const elevStr =
      r.elevationM != null ? r.elevationM.toFixed(1) : `ERROR (${r.error})`;
    const flag = r.flagged ? "  ⚠️  FLAGGED — summit/overlook/ridge/point id at <5 m" : "";
    console.log(`${r.id.padEnd(idWidth)}  ${coordStr.padEnd(coordWidth)}  ${elevStr}${flag}`);
  }

  const flagged = rows.filter((r) => r.flagged);
  const failed = rows.filter((r) => r.error);

  console.log("");
  console.log(`${rows.length} coordinates checked.`);
  console.log(`${flagged.length} flagged as suspicious (see ⚠️ above).`);
  if (failed.length > 0) {
    console.log(
      `${failed.length} lookups failed and were skipped (transient — rerun if this matters): ` +
        failed.map((r) => r.id).join(", "),
    );
  }
  console.log(
    "\nThis is advisory only. It cannot prove any coordinate correct, and a flag is not a\n" +
      "failure — investigate the flagged rows against their sources before doing anything else.",
  );
}

main();
