/**
 * verify-url.ts — Item 3 of the arm-time hardening: the URL-liveness gate.
 *
 * `validateResearchedRow` (research-schema.ts) proves a row is SHAPED like a
 * real venue (a real-looking http(s) sourceUrl, ≥1 citation, no placeholder
 * tells) but never actually fetches anything — a real-looking-but-dead or
 * wrong URL sails through it. For an UNATTENDED monthly run (no human eyeing
 * every row before the PR opens), that's not enough: a stale/typo'd/expired
 * URL must not reach a PR.
 *
 * `verifyUrlLive` does the real network check (HTTP GET/HEAD, follow
 * redirects, ~8s timeout, require a 2xx/3xx FINAL status). `validateResearchedRowLive`
 * layers it on top of the existing sync validator: sync check first (cheap,
 * no network), THEN — only if that passes — the live check on `sourceUrl`.
 *
 * The original SYNC `validateResearchedRow` in research-schema.ts is left
 * completely unchanged: existing tests and the interactive research session
 * path keep using it. This live variant is opt-in, wired into the unattended
 * engine path (`scripts/research-gap.ts`'s `liveUrlCheck` option, threaded
 * from `scripts/run-expansion.ts`).
 *
 * NEVER exercised against the real network in unit tests — every test
 * injects a fake `fetchImpl` (see `verify-url.test.ts`).
 */

import { validateResearchedRow, type ResearchedRow } from "./research-schema";

export interface UrlLiveResult {
  ok: boolean;
  status?: number;
  reason?: string;
}

/** The minimal shape of `fetch` this module needs — real `fetch` satisfies
 *  it; tests inject a lightweight fake. */
export type FetchLike = (
  url: string,
  init?: { method?: string; redirect?: "follow"; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number }>;

export interface VerifyUrlOptions {
  /** Injected fetch for tests. Defaults to the real global `fetch`. */
  fetchImpl?: FetchLike;
  /** Ceiling on the whole check (HEAD attempt + GET fallback), ms. Default 8000. */
  timeoutMs?: number;
  /** Test-only escape hatch: force "no fetch implementation available" even
   *  though a real global `fetch` exists in this Node version. Defaults to
   *  true (i.e. use the real global fetch when `fetchImpl` isn't given). */
  hasGlobalFetch?: boolean;
}

async function attempt(
  fetchImpl: FetchLike,
  url: string,
  method: "HEAD" | "GET",
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number } | null> {
  try {
    return await fetchImpl(url, { method, redirect: "follow", signal });
  } catch {
    return null;
  }
}

/**
 * Real HTTP liveness check for a venue's `sourceUrl`. Tries HEAD first
 * (cheaper); falls back to GET if HEAD throws (unsupported) or comes back
 * 4xx/5xx (some servers reject HEAD but serve GET fine). Follows redirects.
 * Requires a 2xx/3xx FINAL status to count as live. Aborts after `timeoutMs`
 * (default ~8s) and reports that as a failure with a reason, never throws.
 */
export async function verifyUrlLive(url: string, opts: VerifyUrlOptions = {}): Promise<UrlLiveResult> {
  const useGlobal = opts.hasGlobalFetch ?? true;
  const fetchImpl = opts.fetchImpl ?? (useGlobal ? (globalThis.fetch as unknown as FetchLike) : undefined);
  if (!fetchImpl) {
    return { ok: false, reason: "no fetch implementation available (verifyUrlLive misconfigured)" };
  }
  const timeoutMs = opts.timeoutMs ?? 8000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await attempt(fetchImpl, url, "HEAD", controller.signal);
    if (!res || res.status >= 400) {
      const getRes = await fetchImpl(url, { method: "GET", redirect: "follow", signal: controller.signal });
      res = getRes;
    }
    const status = res.status;
    if (status >= 200 && status < 400) return { ok: true, status };
    return { ok: false, status, reason: `non-2xx/3xx final status: ${status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const reason = controller.signal.aborted ? `timed out after ${timeoutMs}ms (${msg})` : `request failed: ${msg}`;
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

export type LiveValidationResult =
  | { ok: true; row: ResearchedRow }
  | { ok: false; reasons: string[] };

export interface ValidateResearchedRowLiveOptions {
  /** Injected live-URL verifier for tests / callers with their own fetch
   *  policy. Defaults to `verifyUrlLive` itself. */
  verifyUrl?: (url: string) => Promise<UrlLiveResult>;
}

/**
 * `validateResearchedRow` (the sync honesty firewall) PLUS a live check that
 * `sourceUrl` actually resolves (2xx/3xx). Cheapest check first: if the row
 * fails sync validation, the live verifier is never called (no wasted
 * network calls on rows that were going to be rejected anyway). Opt-in for
 * the unattended engine — the plain sync `validateResearchedRow` is
 * unchanged and remains what every existing test / interactive path uses.
 */
export async function validateResearchedRowLive(
  input: unknown,
  opts: ValidateResearchedRowLiveOptions = {},
): Promise<LiveValidationResult> {
  const sync = validateResearchedRow(input);
  if (!sync.ok) return { ok: false, reasons: sync.reasons };

  const verify = opts.verifyUrl ?? ((url: string) => verifyUrlLive(url));
  const live = await verify(sync.row.sourceUrl);
  if (!live.ok) {
    return {
      ok: false,
      reasons: [
        `sourceUrl is not live: ${sync.row.sourceUrl} (${live.reason ?? `status ${live.status ?? "unknown"}`})`,
      ],
    };
  }
  return { ok: true, row: sync.row };
}
