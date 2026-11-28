import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.vercel', 'dist', 'build', 'out', 'coverage', '.turbo']);
// Every file under root (relative, posix separators), skipping build output and deps.
export function walk(root) {
  const out = [];
  const rec = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) rec(join(dir, e.name)); }
      else if (e.isFile()) out.push(relative(root, join(dir, e.name)).split(sep).join('/'));
    }
  };
  rec(root);
  return out.sort();
}
