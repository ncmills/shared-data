/**
 * research-budget.ts — the $1/day HARD CAP on paid research (CONTROL SHARED-GROWTH-GO 19:56 (2)).
 *
 * "1 dollar a day, hard cap, through the SN router with a per-call cost log; the cap is
 * enforced in code before each call, and a day that would exceed it stops, not borrows
 * from tomorrow."
 *
 *  - ONE constant: DAILY_CAP_USD.
 *  - A per-call ledger OUTSIDE the repo (default ~/work/logs/shared-data-spend.jsonl, env
 *    SHARED_DATA_SPEND_LEDGER overrides it for tests): {ts, day (UTC), job, model, est_usd, actual_usd}.
 *  - canSpend(estUsd, day): false when today's ACTUAL + estUsd > cap. Days never borrow:
 *    only rows whose `day` equals the asked day count, so an unspent yesterday is ignored
 *    and an overspent yesterday does not carry.
 *  - callRouter(jobType, prompt): the adapter to SN's router (ops/router_call.py `complete`).
 *    It shells out; it never reads a key or the Keychain (the router holds the keys).
 *    An unknown job type makes the router raise KeyError, which surfaces as a thrown Error.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const DAILY_CAP_USD = 1.0;
export const RESEARCH_JOB_TYPE = "shared_data_research";

export interface SpendRow {
  ts: string;
  day: string;
  job: string;
  model: string;
  est_usd: number;
  actual_usd: number;
}

export function ledgerPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.SHARED_DATA_SPEND_LEDGER || join(homedir(), "work", "logs", "shared-data-spend.jsonl");
}

export const utcDay = (d: Date): string => d.toISOString().slice(0, 10);

export function readSpend(path: string): SpendRow[] {
  if (!existsSync(path)) return [];
  const rows: SpendRow[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line) as SpendRow);
    } catch {
      // A torn line must not zero the day: skip it, the rest still count.
    }
  }
  return rows;
}

/** Actual dollars spent on `day` (UTC date). Other days are ignored: no borrow, no carry. */
export function spentOn(day: string, path: string): number {
  return readSpend(path)
    .filter((r) => r.day === day)
    .reduce((n, r) => n + (Number.isFinite(r.actual_usd) ? r.actual_usd : 0), 0);
}

/** true only if today's actual + the estimate stays within the cap. */
export function canSpend(estUsd: number, day: string, path: string = ledgerPath()): boolean {
  return spentOn(day, path) + estUsd <= DAILY_CAP_USD + 1e-9;
}

export function recordSpend(row: SpendRow, path: string = ledgerPath()): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(row) + "\n");
}

export interface RouterResult {
  text: string;
  costUsd: number;
  model: string;
}

/** Router call used by the real adapter; python is invoked with the prompt on stdin. */
const PY = `
import json, os, sys
sys.path.insert(0, os.path.expanduser("~/second-nick/ops"))
import router_call
req = json.load(sys.stdin)
text, cost, model = router_call.complete(req["job"], req["prompt"], max_tokens=req["max_tokens"], daemon="shared-data-growth")
print(json.dumps({"text": text, "cost_usd": cost, "model": model}))
`;

export function callRouter(jobType: string, prompt: string, maxTokens = 4096): RouterResult {
  let out: string;
  try {
    out = execFileSync("python3", ["-c", PY], {
      input: JSON.stringify({ job: jobType, prompt, max_tokens: maxTokens }),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    const stderr = String((e as { stderr?: unknown }).stderr ?? "");
    if (/KeyError/.test(stderr)) {
      throw new Error(`router has no job type '${jobType}': SN must add it to its policy (KeyError)`);
    }
    throw new Error(`router call failed: ${stderr.trim().split("\n").at(-1) ?? (e as Error).message}`);
  }
  const j = JSON.parse(out.trim().split("\n").at(-1)!) as { text: string; cost_usd: number; model: string };
  return { text: j.text, costUsd: j.cost_usd, model: j.model };
}
