/**
 * audit-url-subject.ts — is a sourced row's url actually THAT VENUE?
 *
 * `src/verify-url.ts` proves a url is ALIVE (2xx/3xx final status). Nothing in
 * this repo proves it is the RIGHT PLACE. That gap is not theoretical: 91 golf
 * rows carried the venue's own name slugged into a domain, every one returned
 * HTTP 200, every gate passed, and on Handicap HQ tapping dinner in Santa Fe
 * opened a construction company (`bae317a`).
 *
 * The stakes are asymmetric, which is why this exists. An UNSOURCED row is safe:
 * the party wizards drop the model-guessed url and fall back to a partner
 * listing (Resy/OpenTable/Viator) plus a Maps pin — always valid, never empty
 * (`LinkActions.tsx`, B3). Sourcing a row sets `urlCurated` and SUPPRESSES that
 * fallback. So a wrongly-sourced row is strictly worse than no source at all.
 *
 * ─── WHAT THIS DELIBERATELY DOES NOT DO ───────────────────────────────────────
 *
 * It never returns "WRONG". It returns UNCONFIRMED, and that distinction is
 * load-bearing. Measured 2026-08-06 across all 399 sourced rows: 358 SUBJECT-OK,
 * 15 UNCONFIRMED — and on inspection nearly every UNCONFIRMED was this checker
 * failing, not the url. `elencanto.com` really is Belmond El Encanto;
 * `envoyrooftop.com` really is where Lookout Rooftop is; `10barrel.com` and
 * `curatetapasbar.com` render their names in JavaScript this fetch never runs.
 *
 * A checker that called those "wrong" and quarantined them would have broken 15
 * working links to fix zero broken ones. UNCONFIRMED means "a human should look",
 * never "act on this automatically".
 *
 * An earlier heuristic — bare host + mechanical name-slug, the exact signature
 * that caught the 91 golf rows — flagged 192 of 399 party rows. It is useless
 * here: `torchystacos.com`, `chaipani.com` and `highlandbrewing.com` all match it
 * and are all correct. Real venues own their name as a domain. Only fetching the
 * page distinguishes "correct because they own it" from "guessed and it resolved".
 *
 * Run:  npx tsx scripts/audit-url-subject.ts [--json] [--limit N]
 */
import { sharedDestinations } from "../src/index";

const CATEGORIES = ["activities", "dining", "nightlife", "lodging", "transport"] as const;

const UA = "Mozilla/5.0 (SharedData UrlSubjectAudit; +https://github.com/ncmills/shared-data)";
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 10;

/** Name fragments that identify no venue on their own. */
const STOPWORDS = new Set([
  "the", "and", "of", "at", "in", "on", "a", "an", "for", "with",
  "bar", "cafe", "restaurant", "hotel", "resort", "spa", "club", "house", "room",
  "tour", "tours", "day", "night", "backup", "company", "co", "grill", "inn", "beach",
]);

export type SubjectVerdict = "SUBJECT-OK" | "UNCONFIRMED" | "DEAD" | "BLOCKED";

export interface SubjectResult {
  name: string;
  city: string;
  category: string;
  url: string;
  verdict: SubjectVerdict;
  why: string;
}

const normalize = (s: string): string =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const squash = (s: string): string => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * Distinctive tokens of a venue name.
 *
 * Catalog names are sometimes compound editorial strings ("Reptile Gardens + spa
 * day backup", "Horseback Riding at Rockin' TJ Ranch"). Everything after a `+` or
 * `(` describes the OUTING, not the venue, so matching on it guarantees a miss.
 */
export function nameTokens(name: string): string[] {
  const primary = (name || "").split(/[+(]/)[0];
  return normalize(primary)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Strip markup so a name match means the text is READ by a visitor, not a class attribute. */
export function visibleText(html: string): string {
  return normalize(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

/**
 * Judge a fetched page against the row it is supposed to describe. Pure — no
 * network — so the decision logic is testable without pinning live sites.
 */
export function judge(
  row: { name: string; city: string; state?: string },
  html: string,
): { verdict: SubjectVerdict; why: string } {
  const text = visibleText(html);
  const flat = squash(text);
  const tokens = nameTokens(row.name);

  // Signal 1 — the venue's distinctive name tokens appear in visible text.
  const hits = tokens.filter((t) => text.includes(t) || flat.includes(squash(t)));
  const nameOk = tokens.length > 0 && hits.length / tokens.length >= 0.6;

  // Signal 2 — the page says where it is. A real venue site almost always names
  // its own city or state; an unrelated business two states away does not. This
  // is what separates "the-shed.com is an artist's blog" from a genuine match.
  const city = normalize(row.city).split(",")[0].trim();
  const state = (row.state || "").trim().toLowerCase();
  const localityOk =
    (city.length >= 4 && text.includes(city)) ||
    (state.length >= 2 && new RegExp(`\\b${state}\\b`).test(text));

  if (nameOk && localityOk)
    return { verdict: "SUBJECT-OK", why: `name ${hits.length}/${tokens.length} + locality` };
  if (nameOk)
    return { verdict: "SUBJECT-OK", why: `name ${hits.length}/${tokens.length} (locality absent)` };
  if (localityOk)
    return { verdict: "UNCONFIRMED", why: `locality matches, name not found (${tokens.join(",")})` };
  return { verdict: "UNCONFIRMED", why: `neither name (${tokens.join(",")}) nor locality on page` };
}

/** Every party row that currently carries a followable source. */
export function sourcedRows(): { name: string; city: string; state: string; category: string; url: string }[] {
  const out: { name: string; city: string; state: string; category: string; url: string }[] = [];
  for (const dest of sharedDestinations as any[]) {
    for (const category of CATEGORIES) {
      for (const venue of dest[category] ?? []) {
        const url = String(venue.url ?? venue.sourceUrl ?? "").trim();
        if (!url) continue;
        out.push({
          name: String(venue.name ?? ""),
          city: String(dest.city ?? dest.id ?? ""),
          state: String(dest.state ?? ""),
          category,
          url,
        });
      }
    }
  }
  return out;
}

async function checkOne(row: ReturnType<typeof sourcedRows>[number]): Promise<SubjectResult> {
  const base = { name: row.name, city: row.city, category: row.category, url: row.url };
  let res: Response;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    res = await fetch(row.url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: { "User-Agent": UA },
    });
    clearTimeout(timer);
  } catch (e: any) {
    return { ...base, verdict: "DEAD", why: `fetch failed: ${String(e?.message ?? e).slice(0, 80)}` };
  }

  // Mirrors verify-url.ts's doctrine: a refusal tells us about the server's bot
  // policy, not about the url. It is never counted as a failure of the data.
  if (res.status === 401 || res.status === 403 || res.status === 429)
    return { ...base, verdict: "BLOCKED", why: `HTTP ${res.status} — server refused us` };
  if (!res.ok) return { ...base, verdict: "DEAD", why: `HTTP ${res.status}` };

  let html: string;
  try {
    html = (await res.text()).slice(0, 400_000);
  } catch {
    return { ...base, verdict: "UNCONFIRMED", why: "response body unreadable" };
  }
  return { ...base, ...judge(row, html) };
}

export async function auditSubjects(limit?: number): Promise<SubjectResult[]> {
  const rows = sourcedRows().slice(0, limit ?? undefined);
  const results: SubjectResult[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, rows.length) }, async () => {
      while (cursor < rows.length) results.push(await checkOne(rows[cursor++]));
    }),
  );
  return results;
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const limArg = argv.find((a) => a.startsWith("--limit"));
  const limit = limArg ? Number(limArg.split("=")[1] ?? argv[argv.indexOf(limArg) + 1]) : undefined;

  const results = await auditSubjects(Number.isFinite(limit as number) ? limit : undefined);
  const count = (v: SubjectVerdict) => results.filter((r) => r.verdict === v).length;

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          checked: results.length,
          subjectOk: count("SUBJECT-OK"),
          unconfirmed: count("UNCONFIRMED"),
          dead: count("DEAD"),
          blocked: count("BLOCKED"),
          // Only the actionable ones travel — DEAD is a broken link a user can
          // hit today; UNCONFIRMED is a flag for human eyes, never an auto-action.
          deadRows: results.filter((r) => r.verdict === "DEAD"),
          unconfirmedRows: results.filter((r) => r.verdict === "UNCONFIRMED"),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`\nSourced rows checked: ${results.length}\n`);
  console.log(`  SUBJECT-OK   ${count("SUBJECT-OK")}`);
  console.log(`  UNCONFIRMED  ${count("UNCONFIRMED")}  — needs human eyes, NOT auto-quarantine`);
  console.log(`  DEAD         ${count("DEAD")}  — a live broken link`);
  console.log(`  BLOCKED      ${count("BLOCKED")}  — server refused us; says nothing about the url\n`);

  for (const r of results.filter((x) => x.verdict === "DEAD"))
    console.log(`  DEAD         ${r.name} (${r.city}) → ${r.url}  ${r.why}`);
  for (const r of results.filter((x) => x.verdict === "UNCONFIRMED"))
    console.log(`  UNCONFIRMED  ${r.name} (${r.city}) → ${r.url}  ${r.why}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
