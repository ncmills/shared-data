// guards/lib.ts — shared types + helpers for the fleet guard layer (GUARDS-FLEET-WIDE).
// A guard returns PASS, FAIL (with reasons) or COULD-NOT-RUN (with a named reason).
// There is no "skipped": a guard that did not check anything must say so.
import { readFileSync } from "node:fs";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";

export type Status = "PASS" | "FAIL" | "COULD-NOT-RUN";
export interface GuardResult { status: Status; reasons: string[]; checked?: string }
export interface SiteConfig {
  site?: string;
  /** false = this repo does not consume shared-data (pin-age reports n/a). */
  sharedData?: boolean;
  guards?: Record<string, unknown>;
  /** guardId -> { ruling, reason }. Only a CONTROL ruling id turns a missing guard off. */
  optOut?: Record<string, { ruling?: string; reason?: string }>;
}
export interface GuardCtx { repoRoot: string; config: SiteConfig; now: Date; sharedDataDir: string }
export type Guard = (cfg: any, ctx: GuardCtx) => Promise<GuardResult>;

export const pass = (checked: string): GuardResult => ({ status: "PASS", reasons: [], checked });
export const fail = (reasons: string[], checked?: string): GuardResult => ({ status: "FAIL", reasons, checked });
export const cnr = (reason: string): GuardResult => ({ status: "COULD-NOT-RUN", reasons: [reason] });

/** Dotted-path lookup; "" or undefined returns the object itself. */
export function getPath(o: unknown, path?: string): unknown {
  if (!path) return o;
  return path.split(".").reduce<unknown>((a, k) => (a == null ? a : (a as Record<string, unknown>)[k]), o);
}

/** A configured data source: a JSON file (optional dotted `export` path into it)
 *  or a TS/JS module (named `export`, default export when omitted). */
export interface DataSource { file: string; export?: string }

export async function loadRows(repoRoot: string, src: DataSource): Promise<unknown[]> {
  const abs = resolve(repoRoot, src.file);
  let value: unknown;
  if (extname(abs) === ".json") {
    value = getPath(JSON.parse(readFileSync(abs, "utf8")), src.export);
  } else {
    const mod = (await import(pathToFileURL(abs).href)) as Record<string, unknown>;
    value = src.export ? mod[src.export] : mod.default;
  }
  if (value && !Array.isArray(value) && typeof value === "object") value = Object.values(value);
  if (!Array.isArray(value)) throw new Error(`${src.file}${src.export ? "#" + src.export : ""} is not an array or record`);
  return value;
}

export const label = (src: DataSource) => `${src.file}${src.export ? "#" + src.export : ""}`;
export const cap = (xs: string[], n = 8) => (xs.length > n ? [...xs.slice(0, n), `... and ${xs.length - n} more`] : xs);
