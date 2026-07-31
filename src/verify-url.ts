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
  /**
   * The server REFUSED US, rather than telling us anything about the URL
   * (401/403/429). A blocked result is NOT verified — `ok` stays false, and we
   * never pretend a claim is sourced on this basis. It is a distinct THIRD
   * state so a caller can count it separately from a dead link, retry it, or
   * put it in front of a human, instead of filing a live site under "dead" and
   * re-rejecting it on every future run.
   */
  blocked?: boolean;
}

/** The minimal shape of `fetch` this module needs — real `fetch` satisfies
 *  it; tests inject a lightweight fake. */
export type FetchLike = (
  url: string,
  init?: {
    method?: string;
    redirect?: "follow";
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
) => Promise<{ ok: boolean; status: number }>;

/**
 * Statuses that mean "the server refused this request", not "this URL is bad".
 * 401/403 = blocked, 429 = rate-limited.
 */
const BLOCKING_STATUSES = new Set([401, 403, 429]);

/**
 * Node's `fetch` sends NO User-Agent, and CDN-fronted sites reject that
 * outright — which is what the two 403/429 rejections in the first real
 * backfill actually were, on hotels whose sites are perfectly alive.
 *
 * This identifies us as an ordinary client so the server returns the same
 * public page it returns to anyone. It is not used to reach anything
 * non-public: the only thing done with the response is reading its status code.
 */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface VerifyUrlOptions {
  /** Injected fetch for tests. Defaults to the real global `fetch`. */
  fetchImpl?: FetchLike;
  /** Ceiling on the whole check (HEAD attempt + GET fallback), ms. Default 8000. */
  timeoutMs?: number;
  /** Test-only escape hatch: force "no fetch implementation available" even
   *  though a real global `fetch` exists in this Node version. Defaults to
   *  true (i.e. use the real global fetch when `fetchImpl` isn't given). */
  hasGlobalFetch?: boolean;
  /** Pause before the single 429 retry, ms. Default 1500. Tests pass 0. */
  retryDelayMs?: number;
}

/** Returns the response, or the error that prevented one. The error is kept —
 *  not swallowed — so a network failure still reports what actually happened
 *  rather than a generic "no response". */
async function attempt(
  fetchImpl: FetchLike,
  url: string,
  method: "HEAD" | "GET",
  signal: AbortSignal,
): Promise<{ res: { ok: boolean; status: number } | null; error: unknown }> {
  try {
    const res = await fetchImpl(url, {
      method,
      redirect: "follow",
      signal,
      headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    });
    return { res, error: null };
  } catch (e) {
    return { res: null, error: e };
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
    const head = await attempt(fetchImpl, url, "HEAD", controller.signal);
    let res = head.res;
    let lastError = head.error;
    if (!res || res.status >= 400) {
      const get = await attempt(fetchImpl, url, "GET", controller.signal);
      if (get.res) res = get.res;
      if (get.error) lastError = get.error;
    }

    // 429 explicitly means "try later", so try later — once. Anything still
    // rate-limited after that is reported as blocked, not invented into a pass.
    if (res && res.status === 429) {
      await sleep(opts.retryDelayMs ?? 1500);
      const retry = await attempt(fetchImpl, url, "GET", controller.signal);
      if (retry.res) res = retry.res;
    }

    if (!res) {
      const msg = lastError instanceof Error ? lastError.message : String(lastError ?? "no response");
      const reason = controller.signal.aborted
        ? `timed out after ${timeoutMs}ms (${msg})`
        : `request failed: ${msg}`;
      return { ok: false, reason };
    }

    const status = res.status;
    if (status >= 200 && status < 400) return { ok: true, status };

    if (BLOCKING_STATUSES.has(status)) {
      // NOT a pass. The URL is unverified — we simply cannot say whether it is
      // good, because the server never told us.
      return {
        ok: false,
        status,
        blocked: true,
        reason:
          `blocked by the server (${status}) — the request was refused, which is not evidence ` +
          `about the URL. Unverifiable, not dead.`,
      };
    }
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
    // A blocked source is reported in its own words. Filing it under the same
    // "not live" reason as a 404 is what made two live hotels look dead.
    const prefix = live.blocked ? "sourceUrl could not be verified" : "sourceUrl is not live";
    return {
      ok: false,
      reasons: [`${prefix}: ${sync.row.sourceUrl} (${live.reason ?? `status ${live.status ?? "unknown"}`})`],
    };
  }
  return { ok: true, row: sync.row };
}
