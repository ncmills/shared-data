/**
 * real-gate-lock.ts — a cross-PROCESS mutex for tests that mutate the real
 * sanctioned data files and run the real integrity gates.
 *
 * WHY THIS EXISTS (reproduced 2026-07-31, first attempt):
 *
 *   not ok - the 2B.2 backfill chain reaches a rendered page
 *     ingest rejected: gate "verify-universe" failed:
 *     universe: 212 party-dests · 1000 courses · ...
 *
 * 1000, not 999 — that is `ingest-researched.test.ts`'s golf fixture row, in
 * flight in the REAL golf file, observed by a DIFFERENT test file's gate run.
 * Node's test runner executes FILES in parallel, each in its own process, so
 * any two files that write a shared real file and then shell out to
 * `verify-universe` / `check-brand-rules` / `audit` will eventually see each
 * other's half-applied fixtures. The gates are not wrong when that happens —
 * the universe genuinely is inconsistent at that instant. The tests are.
 *
 * Every such test must therefore hold this lock across its
 * write → gate → observe → restore window. Tests that inject a stub gate
 * runner and a temp file need NOT take it — they touch nothing shared.
 *
 * Implementation notes:
 *  - `mkdirSync` is atomic on every platform we run on, so it is the primitive.
 *  - Waiting is a real sleep (Atomics.wait on a throwaway SharedArrayBuffer),
 *    not a busy spin, so a waiting process does not steal CPU from the gate
 *    subprocesses it is waiting on.
 *  - A lock older than STALE_MS is stolen, so one crashed test run cannot wedge
 *    the suite forever.
 */
import { mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LOCK_DIR = join(tmpdir(), "shared-data-real-gate.lock");
const STALE_MS = 180_000;
const POLL_MS = 50;
const TIMEOUT_MS = 300_000;

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Block until the lock is held by this process. */
export function acquireRealGateLock(): void {
  const deadline = Date.now() + TIMEOUT_MS;
  for (;;) {
    try {
      mkdirSync(LOCK_DIR);
      return;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;

      // Steal a lock left behind by a crashed run.
      try {
        const age = Date.now() - statSync(LOCK_DIR).mtimeMs;
        if (age > STALE_MS) {
          rmSync(LOCK_DIR, { recursive: true, force: true });
          continue;
        }
      } catch {
        // The holder released it between our mkdir and our stat — just retry.
      }

      if (Date.now() > deadline) {
        throw new Error(
          `real-gate-lock: timed out after ${TIMEOUT_MS}ms waiting for ${LOCK_DIR}. ` +
            `Another test process is holding it, or a stale lock needs removing.`,
        );
      }
      sleepSync(POLL_MS);
    }
  }
}

export function releaseRealGateLock(): void {
  rmSync(LOCK_DIR, { recursive: true, force: true });
}

/**
 * Run `fn` holding the lock. Works for sync and async bodies alike — the lock
 * is released in a `finally` either way.
 */
export async function withRealGateLock<T>(fn: () => T | Promise<T>): Promise<T> {
  acquireRealGateLock();
  try {
    return await fn();
  } finally {
    releaseRealGateLock();
  }
}
