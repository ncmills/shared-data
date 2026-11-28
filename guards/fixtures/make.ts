// guards/fixtures/make.ts — builds a fixture site repo reproducing TODAY's faults (red)
// or the fixed state (green). Used by the tests and by the RESULT.md positive controls.
//   node --import tsx guards/fixtures/make.ts <red|green> <dir>
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURE_NOW = "2026-11-27T12:00:00Z";
const SD = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const git = (...a: string[]) => execFileSync("git", ["-C", SD, ...a], { encoding: "utf8" }).trim();
const mainRef = () => { try { git("rev-parse", "--verify", "origin/main"); return "origin/main"; } catch { return "HEAD"; } };

export function makeFixture(kind: "red" | "green", dir: string) {
  const red = kind === "red";
  mkdirSync(join(dir, "public/img"), { recursive: true });
  mkdirSync(join(dir, "data"), { recursive: true });
  // duplicate-assets: hhq used ONE photo url for 9 venues; plus two byte-identical files.
  const venues = Array.from({ length: 9 }, (_, i) => ({
    id: `venue-${i + 1}`,
    image: red ? "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200" : `https://images.unsplash.com/photo-${1000 + i}?w=1200`,
  }));
  writeFileSync(join(dir, "data/venues.json"), JSON.stringify({ venues }, null, 2));
  writeFileSync(join(dir, "public/img/a.png"), Buffer.from("PNG-bytes-A"));
  writeFileSync(join(dir, "public/img/b.png"), Buffer.from(red ? "PNG-bytes-A" : "PNG-bytes-B"));
  // stale-datasets: idhaw had 47 rows researched 2026-03-24.
  const offices = Array.from({ length: 47 }, (_, i) => ({ id: `office-${i + 1}`, researched_on: red ? "2026-03-24" : "2026-11-20" }));
  writeFileSync(join(dir, "data/offices.ts"), `export const OFFICES = ${JSON.stringify(offices)};\n`);
  // shared-data-pin-age: red = a pin >30 days older than main; green = main itself.
  const pin = red ? git("rev-list", "-1", "--before=30 days ago", mainRef()) : git("rev-parse", mainRef());
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: `fixture-${kind}`, dependencies: { "shared-data": `github:ncmills/shared-data#${pin}` } }, null, 2));
  writeFileSync(join(dir, "guards.config.json"), JSON.stringify({
    site: `fixture-${kind}`,
    guards: {
      "duplicate-assets": { imageDirs: ["public/img"], urlSources: [{ file: "data/venues.json", export: "venues", urlFields: ["image"] }] },
      "stale-datasets": { datasets: [{ file: "data/offices.ts", export: "OFFICES", maxAgeDays: 120 }] },
      "shared-data-pin-age": { maxDays: 7 },
      "unsourced-facts": { datasets: [], exempt: [{ file: "data/venues.json", reason: "image urls only, no facts" }] },
      "promise-registry": { roots: ["data"] },
    },
  }, null, 2));
  return dir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [kind, dir] = process.argv.slice(2);
  if (kind !== "red" && kind !== "green" || !dir) { console.error("usage: make.ts <red|green> <dir>"); process.exit(2); }
  console.log(makeFixture(kind, resolve(dir)));
}
