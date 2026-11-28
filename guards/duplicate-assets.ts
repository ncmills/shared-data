// guards/duplicate-assets.ts — class: ANY duplicate asset.
//  (1) two image files under configured dirs with the same content hash;
//  (2) one image URL used more than `maxUses` times within one configured entity list.
// Today's fault (2026-11-27): handicap-hq used one photo URL for 9 venues.
// F2: URLs are keyed on host+path with the query dropped, and Unsplash on the photo id, so
// the same photo with a different ixid/w/q is ONE asset; one hash map spans every dir and
// one use map spans every list. F3: a dir with 0 files or a source with 0 uses FAILs.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Guard, type DataSource, fail, pass, loadRows, getPath, label, cap } from "./lib.ts";

export interface UrlSource extends DataSource { urlFields?: string[]; idField?: string; maxUses?: number }
export interface DuplicateAssetsConfig { imageDirs?: string[]; urlSources?: UrlSource[] }

const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const URL_RE = /https?:\/\/[^\s"'`()<>\\]+/g;
const REL_RE = /["'`](\/[^\s"'`()<>\\]*\.(?:jpe?g|png|webp|avif))["'`]/gi;
const looksLikeImage = (u: string) => IMG_EXT.test(u.split("?")[0]) || /images\.unsplash\.com|res\.cloudinary\.com|\/images?\//i.test(u);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (IMG_EXT.test(name)) out.push(p);
  }
}

/** Asset identity: Unsplash photo id, else lowercased host + path (query and hash dropped). */
export function assetKey(u: string): string {
  const m = u.match(/unsplash\.com\/(?:photos\/[^/?#]*?-?)?(photo-\d+-[0-9a-f]+|photo-\d+)/i);
  if (m) return `unsplash:${m[1].toLowerCase()}`;
  try { const x = new URL(u); return `${x.host.toLowerCase()}${x.pathname}`; } catch { return u.split(/[?#]/)[0]; }
}

export const duplicateAssets: Guard = async (cfg: DuplicateAssetsConfig, ctx) => {
  if (!(cfg.imageDirs?.length || cfg.urlSources?.length)) return fail(["config names no imageDirs and no urlSources: nothing would be checked"]);
  const reasons: string[] = [];
  let files = 0, urls = 0;
  const byHash = new Map<string, string[]>(); // ONE map across all dirs
  for (const d of cfg.imageDirs ?? []) {
    const found: string[] = [];
    try { walk(resolve(ctx.repoRoot, d), found); } catch { reasons.push(`image dir ${d} does not exist`); continue; }
    if (!found.length) { reasons.push(`image dir ${d} has 0 files: nothing would be checked`); continue; }
    for (const f of found) {
      const h = createHash("sha256").update(readFileSync(f)).digest("hex");
      byHash.set(h, [...(byHash.get(h) ?? []), relative(ctx.repoRoot, f)]);
    }
    files += found.length;
  }
  for (const [h, fs] of byHash) if (fs.length > 1) reasons.push(`same image bytes (${h.slice(0, 10)}) in ${fs.length} files: ${fs.join(", ")}`);
  const uses = new Map<string, { url: string; who: string[]; max: number }>(); // ONE map across all lists
  for (const src of cfg.urlSources ?? []) {
    const max = src.maxUses ?? 1;
    let n = 0;
    const fieldUses = new Map<string, number>();
    const note = (u: string, who: string) => {
      n++; urls++;
      const k = assetKey(u);
      const e = uses.get(k) ?? { url: u, who: [], max };
      e.who.push(`${label(src)}:${who}`); e.max = Math.min(e.max, max); uses.set(k, e);
    };
    if (src.export !== undefined || src.urlFields) {
      let rows: unknown[];
      try { rows = await loadRows(ctx.repoRoot, src); } catch (e) { reasons.push(`could not load ${label(src)}: ${(e as Error).message}`); continue; }
      rows.forEach((r, i) => {
        const who = String(getPath(r, src.idField ?? "id") ?? `#${i}`);
        for (const f of src.urlFields ?? ["image"]) {
          const v = getPath(r, f);
          for (const u of Array.isArray(v) ? v : [v]) if (typeof u === "string" && u.trim()) { fieldUses.set(f, (fieldUses.get(f) ?? 0) + 1); note(u.trim(), who); }
        }
      });
      for (const f of src.urlFields ?? ["image"]) if (!fieldUses.get(f) && n > 0) reasons.push(`${label(src)}: urlField "${f}" has 0 uses (matches nothing): nothing would be checked for it`);
    } else {
      let text: string;
      try { text = readFileSync(resolve(ctx.repoRoot, src.file), "utf8"); } catch { reasons.push(`could not read ${src.file}`); continue; }
      text.split("\n").forEach((line, i) => {
        for (const u of line.match(URL_RE) ?? []) if (looksLikeImage(u)) note(u, `line ${i + 1}`);
        for (const m of line.matchAll(REL_RE)) note(m[1], `line ${i + 1}`);
      });
    }
    if (n === 0) reasons.push(`${label(src)}: 0 uses (urlFields ${JSON.stringify(src.urlFields ?? ["image"])} match nothing): nothing would be checked`);
  }
  for (const [k, e] of uses) if (e.who.length > e.max) reasons.push(`${e.url} used ${e.who.length}x (asset ${k}, max ${e.max}): ${cap(e.who, 5).join(", ")}`);
  const checked = `${files} image files, ${urls} image-url uses`;
  return reasons.length ? fail(cap(reasons), checked) : pass(checked);
};
