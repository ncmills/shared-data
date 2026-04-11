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

## Migration status

| Project | states | regions | slugify | airports |
|---|---|---|---|---|
| TDF | pending | pending | pending | pending |
| BESTMAN HQ | pending | pending | pending | pending |
| MOH | pending | pending | pending | pending |

Migration is project-by-project to avoid breaking changes. Each project keeps its local copy until manually swapped.
