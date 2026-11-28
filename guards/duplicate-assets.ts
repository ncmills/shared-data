// guards/duplicate-assets.ts — class: ANY duplicate asset.
//  (1) two image files under configured dirs with the same content hash;
//  (2) one image URL used more than `maxUses` times within one configured entity list.
// Today's fault (2026-11-27): handicap-hq used one photo URL for 9 venues.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { type Guard, type DataSource, fail, pass, loadRows, getPath, label, cap } from "./lib.ts";

export interface UrlSource extends DataSource { urlFields?: string[]; idField?: string; maxUses?: number }
export interface DuplicateAssetsConfig { imageDirs?: string[]; urlSources?: UrlSource[] }

const IMG_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;
const URL_RE = /https?:\/\/[^\s"'`()<>\\]+/g;
const looksLikeImage = (u: string) => IMG_EXT.test(u.split("?")[0]) || /images\.unsplash\.com|res\.cloudinary\.com|\/images?\//i.test(u);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (IMG_EXT.test(name)) out.push(p);
  }
}

export const duplicateAssets: Guard = async (cfg: DuplicateAssetsConfig, ctx) => {
  const reasons: string[] = [];
  let files = 0, urls = 0;
  for (const d of cfg.imageDirs ?? []) {
    const abs = resolve(ctx.repoRoot, d);
    const found: string[] = [];
    try { walk(abs, found); } catch { reasons.push(`image dir ${d} does not exist`); continue; }
    const byHash = new Map<string, string[]>();
    for (const f of found) {
      const h = createHash("sha256").update(readFileSync(f)).digest("hex");
      byHash.set(h, [...(byHash.get(h) ?? []), relative(ctx.repoRoot, f)]);
    }
    files += found.length;
    for (const [h, fs] of byHash) if (fs.length > 1) reasons.push(`same image bytes (${h.slice(0, 10)}) in ${fs.length} files: ${fs.join(", ")}`);
  }
  for (const src of cfg.urlSources ?? []) {
    const max = src.maxUses ?? 1;
    const uses = new Map<string, string[]>();
    const note = (u: string, who: string) => { urls++; uses.set(u, [...(uses.get(u) ?? []), who]); };
    if (src.export !== undefined || src.urlFields) {
      let rows: unknown[];
      try { rows = await loadRows(ctx.repoRoot, src); } catch (e) { reasons.push(`could not load ${label(src)}: ${(e as Error).message}`); continue; }
      rows.forEach((r, i) => {
        const who = String(getPath(r, src.idField ?? "id") ?? `#${i}`);
        for (const f of src.urlFields ?? ["image"]) {
          const v = getPath(r, f);
          for (const u of Array.isArray(v) ? v : [v]) if (typeof u === "string" && u.trim()) note(u.trim(), who);
        }
      });
    } else {
      // Raw-text mode: every image-looking URL in the file, whatever the shape.
      let text: string;
      try { text = readFileSync(resolve(ctx.repoRoot, src.file), "utf8"); } catch { reasons.push(`could not read ${src.file}`); continue; }
      text.split("\n").forEach((line, i) => { for (const u of line.match(URL_RE) ?? []) if (looksLikeImage(u)) note(u, `line ${i + 1}`); });
    }
    for (const [u, who] of uses) if (who.length > max) reasons.push(`${label(src)}: ${u} used ${who.length}x (max ${max}): ${cap(who, 5).join(", ")}`);
  }
  if (!(cfg.imageDirs?.length || cfg.urlSources?.length)) return fail(["config names no imageDirs and no urlSources: nothing would be checked"]);
  const checked = `${files} image files, ${urls} image-url uses`;
  return reasons.length ? fail(cap(reasons), checked) : pass(checked);
};
