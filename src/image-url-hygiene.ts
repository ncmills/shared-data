/**
 * image-url-hygiene — refuse to publish an `imageUrl` that is not an image.
 *
 * Why this exists (2026-08-05): an audit of the 183 `imageUrl` values embedded
 * in `golf-destinations.ts` found 8 that never pointed at a picture. Two of
 * them were third-party TRACKING BEACONS:
 *
 *   Tidewater Golf Club     https://bidagent.xad.com/conv/286550?ts=TIMESTAMP
 *   Lake of Isles Golf      https://www.facebook.com/tr?id=...&ev=PageView&noscript=1
 *
 * So every render of those pages showed a broken image AND fired a request to
 * xAd and to Meta — from a page that never asked for a tracker. The unreplaced
 * `TIMESTAMP` macro is the tell: these were scraped off a page's markup, where
 * the beacon sits next to the real images, and the scraper could not tell a
 * pixel from a photo. Five more point at `static.hugedomains.com` — the "this
 * domain is for sale" placeholder, meaning those courses' sites lapsed — and
 * one is a bare homepage URL.
 *
 * The check is IDENTITY, not liveness. Every one of these returns HTTP 200; a
 * fetch-and-check-status gate passes all 8. That is the same mistake that let
 * `--no-verify-url` bless fabricated links: a 200 proves something answered,
 * not that it is the thing you claimed.
 *
 * The rules are deliberately narrow — deny what is provably not a photo, never
 * guess. Extension-sniffing is NOT one of them: Scene7, Sanity and wsimg all
 * serve legitimate extensionless image URLs, and 13 of the 183 are exactly
 * that. Blocking those would trade two trackers for a dozen missing photos.
 *
 * This lives at the assembly layer, not in the data rows, because
 * `golf-destinations.ts` carries a DO-NOT-HAND-EDIT banner — its generator is
 * in the retired tour-de-fore repo. A row edit would be erased by the next
 * regeneration; a filter on the public surface survives it.
 */

/** Hosts that serve ad-tech / analytics beacons, never content images. */
const TRACKER_HOSTS = [
  "bidagent.xad.com",
  "doubleclick.net",
  "googleadservices.com",
  "google-analytics.com",
  "googletagmanager.com",
  "adservice.google.com",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "adnxs.com",
  "scorecardresearch.com",
];

/** Domain-parking placeholders — the site lapsed and is listed for sale. */
const PARKED_HOSTS = [
  "hugedomains.com",
  "sedoparking.com",
  "afternic.com",
  "dan.com",
  "bodis.com",
];

/**
 * Beacon paths on hosts that ALSO serve real content, so the host alone can't
 * decide. `facebook.com` hosts legitimate images; `facebook.com/tr` is the Meta
 * pixel. Matched on the path only, so a query string can't smuggle one past.
 */
const BEACON_PATHS = [/^\/tr\/?$/i, /^\/conv\//i, /^\/pixel\/?$/i, /^\/collect\/?$/i];

const hostMatches = (host: string, list: string[]): boolean =>
  list.some((h) => host === h || host.endsWith(`.${h}`));

/**
 * Is this URL safe to publish as an image?
 *
 * Rejects: unparseable URLs, non-http(s) schemes, known tracker hosts, parked
 * domains, beacon paths, and bare-root URLs (a homepage is not a photo).
 * Everything else passes — absence of proof that it is bad is not proof that
 * it is bad, and a missing photo is a worse default than an unusual CDN path.
 */
export function isPublishableImageUrl(raw: unknown): boolean {
  if (typeof raw !== "string" || raw.trim() === "") return false;

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") return false;

  const host = u.hostname.toLowerCase();
  if (hostMatches(host, TRACKER_HOSTS)) return false;
  if (hostMatches(host, PARKED_HOSTS)) return false;
  if (BEACON_PATHS.some((re) => re.test(u.pathname))) return false;

  // A bare origin ("https://www.lacomagolf.com/") is the course's homepage,
  // not an image on it.
  if (u.pathname === "" || u.pathname === "/") return false;

  return true;
}

/**
 * Recursively drop every `imageUrl` that fails the check, at any depth.
 *
 * Destinations nest their venues (`courses[]`, `dining[]`, `bars[]`,
 * `activities[]`, ...), and the bad values sit on the embedded venues rather
 * than on the destination itself — so a shallow pass would miss all 8.
 *
 * The key is DELETED rather than blanked so consumers fall through to their
 * own image pipeline (HHQ's Unsplash/Redis cache), which is what they already
 * do for the many rows that carry no `imageUrl` at all. An empty string would
 * instead render a broken <img>.
 */
export function stripUnpublishableImageUrls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUnpublishableImageUrls(v)) as unknown as T;
  }

  if (value === null || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === "imageUrl" && !isPublishableImageUrl(v)) continue;
    out[k] = stripUnpublishableImageUrls(v);
  }
  return out as unknown as T;
}
