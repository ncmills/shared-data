# shared-data

Geographic primitives shared across nick's projects. Single source of truth for state names, regions, slugify, and US airports.

## What's in here

| File | Exports |
|---|---|
| `src/states.ts` | `STATE_NAMES`, `STATE_CODES`, `stateName()`, `stateCode()`, `stateSlug()`, `stateFromSlug()` |
| `src/regions.ts` | `UsRegion` type, `REGIONS`, `REGION_SLUGS`, `STATE_TO_REGION`, `regionForState()`, `regionSlug()` |
| `src/slugify.ts` | `slugify()` |
| `src/airports.ts` | `Airport` type, `AIRPORTS` (50+ US hubs), `airportByCode()`, `airportsByState()` |

## How a project consumes it

**At build time**, fetch the latest `src/` files via the jsDelivr CDN. Or — simpler — copy the file you need from this repo into your project. Either is fine for low-velocity primitives like these.

```ts
// src/lib/shared-data.ts (in any consumer project)
// Mirror the API by copying the relevant files from this repo, OR import via:
//   https://cdn.jsdelivr.net/gh/ncmills/shared-data@main/src/states.ts
//
// Recommended: a `prebuild` script that downloads the file once per build.
```

```ts
// in your pages
import { stateName, regionForState, slugify } from "@/lib/shared-data";

const name = stateName("AZ");           // "Arizona"
const region = regionForState("AZ");    // "Southwest"
const slug = slugify("Coeur d'Alene");  // "coeur-dalene"
```

## Why a separate repo (vs npm package)?

- No publish step (commit + push = released)
- jsDelivr CDN gets immediate cache invalidation per commit SHA
- Consumers can pin to `@main` for latest, or `@<sha>` for stable
- No node_modules / version conflicts / peer-dep hell
- Same pattern as `shared-image-cache`

## Adding to a project

1. Copy or fetch `src/states.ts`, `src/regions.ts`, etc. into your project
2. Delete the local copies of state names / regions / slugify / airports
3. Update imports

Done.

## Row ids and aliases (CORPUS-M3a)

Every party-venue row (nightlife / dining / activity / lodging / transport) and every golf
course has a stable id, assigned by `src/row-ids.ts`:

- **party venue:** `${destId}--${category}--${slug(name)}` (category is the singular override
  key: `nightlife | dining | activity | lodging | transport`)
- **golf course:** `${slug(city)}-${slug(state)}--golf--${slug(name)}` — the course's own
  city/state, not its golf-destination id (13 of 234 golf destinations are not city-state
  slugs, and 38 courses have no destination at all)

`slug()` is `idSlug()` in that file: Unicode NFKD with combining marks dropped, curly quotes
`’ ‘` normalized to `'`, then the repo's own `slugify()` (lowercase, drop `'`, `&` → `"and"`,
every other non-`[a-z0-9]` run → `-`, trim leading/trailing `-`). An empty slug is a hard error.

**Collisions.** Two rows whose computed id matches (same destination + category + slug) are
disambiguated by source order: the first keeps the bare id, the next gets `-2`, then `-3`, etc.
(`scripts/verify-universe.ts` reports the count as `*.disambiguated`). Re-ordering two colliding
rows swaps their ids — pin one with an authored `id` if that matters.

**Renames and aliases.** A row may author its own `id`, which replaces the computed one (one way
to rename a venue without moving its identity). The other way is `aliases: ["<old id>"]` on the
renamed row — every resolver (overrides, the MOH/BMHQ locals, and golf references) accepts an
alias wherever it accepts an id. A reference that resolves to nothing **throws at module load**,
so a rename without an alias fails CI here instead of silently dropping a row's override or its
per-brand copy.

**Reference rows.** M3a collapsed the MOH/BMHQ "locals" copies and the embedded golf
`courses[]` copies into references that resolve through this same id+alias index, rather than
separate duplicated rows — so a canonical row has exactly one identity, consumed by reference
everywhere.

See the full header comment in `src/row-ids.ts` for the exact normalisation rules and the legacy
`${destId}|${category}|${name}` override-key migration (`legacyKeyToId()`).

## Migration status

| Project | states | regions | slugify | airports |
|---|---|---|---|---|
| TDF | pending | pending | pending | pending |
| BESTMAN HQ | pending | pending | pending | pending |
| MOH | pending | pending | pending | pending |

Migration is project-by-project to avoid breaking changes. Each project keeps its local copy until manually swapped.
