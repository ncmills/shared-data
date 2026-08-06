/**
 * dead-url-quarantine — drop `url` from party venues whose site is genuinely gone.
 *
 * WHY DROPPING IS THE FIX, not blanking or leaving it. The party wizards render
 * a venue's own site as the "Reserve" CTA only when `urlCurated` is set, and
 * setting it SUPPRESSES the partner-listing fallback (`LinkActions.tsx`, B3). So
 * a sourced-but-dead url is worse than no url at all: the user gets a broken
 * button where they would otherwise have had a working Resy/OpenTable/Booking
 * search plus a Maps pin. Removing the key restores that fallback.
 *
 * Removing the KEY rather than blanking it also matters downstream:
 * `backfill-queue.ts` counts a row as sourced iff `url` is non-blank, so a
 * blanked row would stay scored as sourced and stay out of the queue that should
 * now pick it up again.
 *
 * ─── THE BAR FOR ADDING TO THIS LIST ─────────────────────────────────────────
 *
 * Every entry below was confirmed by a SECOND, independent tool — curl and dig,
 * not the Node fetch that flagged it. That bar exists because the audit's first
 * pass reported ELEVEN dead links and only four survived hand-checking:
 *
 *   3  its own 12-second timeout (borgata.mgmresorts.com — slow, not broken)
 *   2  TLS chains Node rejects and every browser accepts
 *      (midnightcowboymodeling.com, aspenwhitehouse.com — both HTTP 200 via curl)
 *   1  bot-blocking that a real browser User-Agent fixes (cityexperiences.com)
 *   1  an Akamai edge refusing Node (thestudyatuniversitycity.com — 200 via curl)
 *
 * Acting on the unverified number would have stripped seven working links to fix
 * four broken ones. A machine verdict is a reason to LOOK, never a reason to act.
 *
 * This is a hand-maintained list on purpose. It is small, each entry carries its
 * evidence, and a generated one would re-introduce exactly the false positives
 * above. When the backfill re-sources one of these venues with real provenance,
 * delete its line — the queue will pick them up again now that `url` is gone.
 */

/** Confirmed dead 2026-08-06 by curl + dig. Keyed by the exact stored url. */
export const DEAD_VENUE_URLS: ReadonlyMap<string, string> = new Map([
  ["https://thenoblesouth.com",
   "domain does not resolve (dig: NXDOMAIN) — the restaurant closed"],
  ["https://ludlowandprime.com",
   "HTTP 404 — host is live (Cloudflare) but the page is gone"],
  ["https://moondogsbar.com/",
   "https resets; http redirects to wired.meraki.com — the domain is no longer the bar"],
  ["https://automaticseafood.com",
   "nothing listening on http or https (connect timeout); DNS resolves to a stale A record"],
  ["https://www.hiltonvb.com",
   "https connection refused — only the http vanity redirect survives, so the stored url errors in a browser"],
]);

/** Venue arrays a party destination can carry. */
const VENUE_ARRAYS = ["activities", "dining", "nightlife", "lodging", "transport"] as const;

/** Normalise for comparison only — never mutates what is stored. */
const key = (u: unknown): string =>
  typeof u === "string" ? u.trim().replace(/\/+$/, "") : "";

const DEAD_KEYS = new Set(Array.from(DEAD_VENUE_URLS.keys(), key));

/** True if this exact url is quarantined. Trailing-slash insensitive. */
export function isDeadUrl(url: unknown): boolean {
  const k = key(url);
  return k !== "" && DEAD_KEYS.has(k);
}

/**
 * Drop `url` from any venue whose url is quarantined.
 *
 * Returns the SAME object when nothing changed, so this is safe to run over the
 * whole universe on every import without churning identities.
 */
export function stripDeadVenueUrls<T extends object>(dest: T): T {
  let destChanged = false;
  const src = dest as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...src };

  for (const arrayKey of VENUE_ARRAYS) {
    const arr = src[arrayKey];
    if (!Array.isArray(arr)) continue;

    let arrChanged = false;
    const next = arr.map((venue) => {
      if (!venue || typeof venue !== "object") return venue;
      const row = venue as Record<string, unknown>;
      if (!isDeadUrl(row.url)) return venue;
      arrChanged = true;
      const { url: _dead, ...rest } = row;
      return rest;
    });

    if (arrChanged) {
      out[arrayKey] = next;
      destChanged = true;
    }
  }

  return destChanged ? (out as T) : dest;
}
