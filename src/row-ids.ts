/**
 * row-ids.ts — stable row identity under the city level (CORPUS-M3a, 2026-09-24).
 *
 * Before this, a nested destination row (nightlife / dining / activity /
 * lodging / transport) and a golf course had no id. Overrides were keyed by
 * the raw string `${destId}|${category}|${name}`, which silently stops
 * matching on a rename, and the MOH / Best Man locals and the golf-destination
 * `courses[]` were separate COPIES of canonical rows with no link back.
 *
 * ── THE ID ──────────────────────────────────────────────────────────────────
 *   party venue:  `${destId}--${category}--${slug(name)}`
 *                  category is the SINGULAR override category:
 *                  nightlife | dining | activity | lodging | transport
 *   golf course:  `${slug(city)}-${slug(state)}--golf--${slug(name)}`
 *                  (the course's OWN city/state, not a golf-destination id:
 *                  13 of 234 golf destinations are not city-state slugs and
 *                  38 courses have no destination at all)
 *
 * ── NORMALISATION (`slug`) — change NONE of this without a migration ────────
 *   1. Unicode NFKD, then drop combining marks      "Cúrate" → "Curate"
 *   2. curly quotes ’ ‘ → straight '
 *   3. then the repo's `slugify` (src/slugify.ts):
 *        lowercase · drop ' · & → "and" · every run of non [a-z0-9] → "-"
 *        · trim leading/trailing "-"
 *      "Bill's Tavern & Brewhouse" → "bills-tavern-and-brewhouse"
 *   An empty slug (a name with no letters or digits) is a hard error.
 *
 * ── COLLISIONS ──────────────────────────────────────────────────────────────
 * Two rows whose ids come out equal (same destination + category + slug) are
 * disambiguated deterministically by SOURCE ORDER: the first keeps the bare
 * id, the next gets `-2`, then `-3`, … Measured at introduction: 9 canonical
 * party-venue collisions and 1 golf collision (`scripts/verify-universe.ts`
 * prints the count as `*.disambiguated`). Re-ordering two colliding rows swaps their ids — pin
 * one with an authored `id` if that ever matters.
 *
 * ── RENAMES AND ALIASES ─────────────────────────────────────────────────────
 * A row may AUTHOR its own `id` (the type has always allowed it); an authored
 * id replaces the computed one, so pinning the old id is one way to rename a
 * venue without moving its identity. An authored id that clashes with another
 * row's id is reported as a duplicate, never resolved by renumbering. The other is `aliases: ["<old id>"]` on
 * the renamed row: every resolver here (overrides, the locals and golf
 * references) accepts an alias wherever it accepts an id. A reference that
 * resolves to nothing THROWS at module load — so a rename without an alias
 * fails CI in this repo instead of shipping a row that silently lost its
 * override or its brand copy.
 */
import { slugify } from "./slugify";

/** Singular category names, as used by the override keys. */
export type RowCategory = "nightlife" | "dining" | "activity" | "lodging" | "transport";

/** Plural array key on a destination → singular id category. */
export const ROW_CATEGORY_OF_ARRAY = {
  nightlife: "nightlife",
  dining: "dining",
  activities: "activity",
  lodging: "lodging",
  transport: "transport",
} as const satisfies Record<string, RowCategory>;

export type RowArrayKey = keyof typeof ROW_CATEGORY_OF_ARRAY;
export const ROW_ARRAY_KEYS = Object.keys(ROW_CATEGORY_OF_ARRAY) as RowArrayKey[];

/** The normalisation above. Exported so tests and scripts cannot drift from it. */
export function idSlug(value: string): string {
  const s = slugify(
    value
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[‘’]/g, "'"),
  );
  if (!s) throw new Error(`row-ids: "${value}" normalises to an empty slug`);
  return s;
}

export function partyRowIdBase(destId: string, category: RowCategory, name: string): string {
  return `${destId}--${category}--${idSlug(name)}`;
}

export function golfCourseIdBase(c: { name: string; city: string; state: string }): string {
  return `${idSlug(c.city)}-${idSlug(c.state)}--golf--${idSlug(c.name)}`;
}

/**
 * Ids for one ordered list of rows. An authored `id` is kept as-is; every other
 * row gets its base id, disambiguated `-2`, `-3`, … in source order against the
 * ids already in `taken` (which this mutates) and the computed ids before it.
 *
 * Computed ids deliberately do NOT step around authored ones. An authored id
 * that equals another row's computed id is a mistake (it would silently move
 * that other row's identity to `-2`), so it is left to surface as a DUPLICATE,
 * which scripts/verify-universe.ts fails on.
 */
export function assignIds<T extends { id?: string }>(
  rows: readonly T[],
  base: (row: T) => string,
  taken: Set<string> = new Set(),
): string[] {
  return rows.map((r) => {
    if (r.id) return r.id;
    const b = base(r);
    let id = b;
    for (let n = 2; taken.has(id); n++) id = `${b}-${n}`;
    taken.add(id);
    return id;
  });
}

/**
 * The legacy override key `${destId}|${category}|${name}` as an id. Exact-name
 * matching is gone: "The Bull & Beggar" and "The Bull and Beggar" now name the
 * same row, as they should. A key that is already an id (contains no "|") is
 * returned unchanged.
 */
export function legacyKeyToId(key: string): string {
  if (!key.includes("|")) return key;
  const [destId, category, ...rest] = key.split("|");
  const name = rest.join("|");
  if (!destId || !category || !name) throw new Error(`row-ids: malformed legacy key "${key}"`);
  return partyRowIdBase(destId, category as RowCategory, name);
}

/** id and alias → row. Throws on an id or alias claimed twice. */
export function indexById<T extends { id?: string; aliases?: string[] }>(
  rows: Iterable<T>,
  label: string,
): Map<string, T> {
  const byId = new Map<string, T>();
  const claim = (key: string, row: T, what: string) => {
    if (byId.has(key)) throw new Error(`row-ids: ${label}: ${what} "${key}" is claimed twice`);
    byId.set(key, row);
  };
  const all = [...rows];
  for (const r of all) {
    if (!r.id) throw new Error(`row-ids: ${label}: a row has no id`);
    claim(r.id, r, "id");
  }
  for (const r of all) for (const a of r.aliases ?? []) claim(a, r, "alias");
  return byId;
}
