// verify-url.test.ts — Item 3 of the arm-time hardening: the URL-liveness gate.
//
// `verifyUrlLive` does a real HTTP GET/HEAD in production, but NEVER in unit
// tests — every test here injects a fake `fetchImpl` so the suite is fully
// offline and deterministic. `validateResearchedRowLive` layers a live check
// on top of the existing SYNC `validateResearchedRow` (src/research-schema.ts,
// left unchanged) — it must reject dead/wrong URLs AND must not even attempt
// a network call when the row fails sync validation first (cheapest check
// first, no wasted fetches on a row that was going to be rejected anyway).
import { test } from "node:test";
import assert from "node:assert/strict";

import { verifyUrlLive, validateResearchedRowLive } from "./verify-url";
import type { ResearchedRow } from "./research-schema";

const GOOD_GOLF: ResearchedRow = {
  dataset: "golf",
  name: "Cabot Cape Breton (Cabot Cliffs)",
  city: "Inverness",
  state: "NS",
  region: "International",
  tier: "budget",
  greenFeeRange: [100, 175],
  style: "links",
  walkable: true,
  driveMinutes: 30,
  highlight: "Coore & Crenshaw clifftop links over the Gulf of St. Lawrence.",
  sourceUrl: "https://www.cabotcapebreton.com/golf/cabot-cliffs/",
  citations: ["https://www.cabotcapebreton.com/golf/cabot-cliffs/"],
};

/** A minimal fetch-shaped stub — only the bits verifyUrlLive reads. */
function fakeFetch(behavior: (url: string, method: string) => { status: number } | "throw") {
  return async (url: string, init?: { method?: string; signal?: AbortSignal }) => {
    const method = init?.method ?? "GET";
    const outcome = behavior(url, method);
    if (outcome === "throw") throw new Error(`simulated network failure for ${method} ${url}`);
    return { ok: outcome.status >= 200 && outcome.status < 300, status: outcome.status };
  };
}

// ─── verifyUrlLive ──────────────────────────────────────────────────────────

test("verifyUrlLive: ok:true on a 200 response", async () => {
  const res = await verifyUrlLive("https://real-venue.example/", {
    fetchImpl: fakeFetch(() => ({ status: 200 })),
  });
  assert.equal(res.ok, true);
  assert.equal(res.status, 200);
});

test("verifyUrlLive: ok:true on a 3xx (redirect-chain-followed) final status", async () => {
  const res = await verifyUrlLive("https://real-venue.example/", {
    fetchImpl: fakeFetch(() => ({ status: 304 })),
  });
  assert.equal(res.ok, true);
  assert.equal(res.status, 304);
});

test("verifyUrlLive: ok:false on a 404", async () => {
  const res = await verifyUrlLive("https://dead-venue.example/", {
    fetchImpl: fakeFetch(() => ({ status: 404 })),
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 404);
  assert.ok(res.reason && /404/.test(res.reason));
});

test("verifyUrlLive: ok:false on a 500", async () => {
  const res = await verifyUrlLive("https://broken-venue.example/", {
    fetchImpl: fakeFetch(() => ({ status: 500 })),
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 500);
});

test("verifyUrlLive: falls back to GET when HEAD throws, and still reports the GET result", async () => {
  const seen: string[] = [];
  const fetchImpl = async (url: string, init?: { method?: string }) => {
    const method = init?.method ?? "GET";
    seen.push(method);
    if (method === "HEAD") throw new Error("HEAD not supported by this fixture");
    return { ok: true, status: 200 };
  };
  const res = await verifyUrlLive("https://head-blocked.example/", { fetchImpl });
  assert.equal(res.ok, true);
  assert.deepEqual(seen, ["HEAD", "GET"]);
});

test("verifyUrlLive: falls back to GET when HEAD returns a 4xx/5xx (method-not-allowed-ish)", async () => {
  const seen: string[] = [];
  const fetchImpl = async (url: string, init?: { method?: string }) => {
    const method = init?.method ?? "GET";
    seen.push(method);
    if (method === "HEAD") return { ok: false, status: 405 };
    return { ok: true, status: 200 };
  };
  const res = await verifyUrlLive("https://head-405.example/", { fetchImpl });
  assert.equal(res.ok, true);
  assert.equal(res.status, 200);
  assert.deepEqual(seen, ["HEAD", "GET"]);
});

test("verifyUrlLive: ok:false with a reason when both HEAD and GET throw (network failure)", async () => {
  const res = await verifyUrlLive("https://unreachable.example/", {
    fetchImpl: fakeFetch(() => "throw"),
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, undefined);
  assert.ok(res.reason && /simulated network failure/.test(res.reason));
});

test("verifyUrlLive: ok:false with a reason when no fetch implementation is available", async () => {
  const res = await verifyUrlLive("https://no-fetch.example/", { fetchImpl: undefined as never, hasGlobalFetch: false });
  assert.equal(res.ok, false);
  assert.ok(res.reason && /fetch/i.test(res.reason));
});

test("verifyUrlLive: aborts and reports a timeout reason when the request never settles", async () => {
  // Mirrors real `fetch`'s contract: reject immediately if the signal is
  // ALREADY aborted (the HEAD attempt consumes the one-shot 'abort' event;
  // the GET fallback's own call must still see the abort via the synchronous
  // `signal.aborted` check, not a second 'abort' event that will never fire).
  const fetchImpl = (_url: string, init?: { signal?: AbortSignal }) =>
    new Promise<{ ok: boolean; status: number }>((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new Error("aborted"));
        return;
      }
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    });
  const res = await verifyUrlLive("https://slow.example/", { fetchImpl, timeoutMs: 20 });
  assert.equal(res.ok, false);
  assert.ok(res.reason, "expected a reason for the timeout/abort");
});

// ─── validateResearchedRowLive ──────────────────────────────────────────────

test("validateResearchedRowLive: ACCEPTS a row whose sourceUrl resolves live (2xx)", async () => {
  const res = await validateResearchedRowLive(GOOD_GOLF, {
    verifyUrl: async () => ({ ok: true, status: 200 }),
  });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.row.name, GOOD_GOLF.name);
});

test("validateResearchedRowLive: REJECTS a row whose sourceUrl is dead (non-2xx)", async () => {
  const res = await validateResearchedRowLive(GOOD_GOLF, {
    verifyUrl: async () => ({ ok: false, status: 404, reason: "non-2xx/3xx final status: 404" }),
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.reasons.some((r) => /sourceUrl/i.test(r) && /404|live/i.test(r)));
});

test("validateResearchedRowLive: REJECTS at the sync gate WITHOUT ever calling the live verifier", async () => {
  let calls = 0;
  const { sourceUrl: _drop, ...rest } = GOOD_GOLF as unknown as Record<string, unknown>;
  const res = await validateResearchedRowLive(rest, {
    verifyUrl: async () => {
      calls++;
      return { ok: true, status: 200 };
    },
  });
  assert.equal(res.ok, false);
  assert.equal(calls, 0, "the live verifier must never be called for a row that fails sync validation");
  if (!res.ok) assert.ok(res.reasons.some((r) => /sourceUrl/i.test(r)));
});

test("validateResearchedRowLive: default verifier is verifyUrlLive itself when none is injected (still no network — inject fetchImpl via row's own path is out of scope here, so we only assert the sync-fail short-circuit works with zero opts)", async () => {
  const res = await validateResearchedRowLive({});
  assert.equal(res.ok, false);
});

// ─── blocked-vs-dead (2026-07-31) ───────────────────────────────────────────
//
// The first real backfill rejected two REAL hotels:
//   403 https://www.larkbozeman.com/about-bozeman-hotel/
//   429 https://www.hyatt.com/thompson-hotels/en-US/chith-thompson-chicago
// Both sites are alive. 403 = the server refused US; 429 = try later. Treating
// either as "dead" is a false negative, and because the queue re-derives from
// the same rows every run, those venues would be re-rejected forever.
//
// Root cause: no User-Agent was sent at all. Node's fetch sends none, and
// CDN-fronted sites reject that outright.
//
// A blocked URL is still NOT verified — we must never pretend it is. It is a
// THIRD state: unverifiable. Rejected, but distinguishably and countably so.

test("sends a User-Agent — a UA-less request is what most 403s actually are", async () => {
  const seen: (Record<string, string> | undefined)[] = [];
  await verifyUrlLive("https://ua.example.org/", {
    fetchImpl: async (_u, init) => {
      seen.push((init as { headers?: Record<string, string> } | undefined)?.headers);
      return { ok: true, status: 200 };
    },
  });

  assert.ok(seen[0], "no headers were sent at all");
  const ua = Object.entries(seen[0]!).find(([k]) => k.toLowerCase() === "user-agent")?.[1];
  assert.ok(ua && ua.length > 0, "must identify itself");
});

test("a persistent 403 is BLOCKED, not dead", async () => {
  const res = await verifyUrlLive("https://blocked.example.org/", {
    fetchImpl: async () => ({ ok: false, status: 403 }),
  });

  assert.equal(res.ok, false, "blocked is still not verified — never pretend otherwise");
  assert.equal(res.blocked, true);
  assert.match(res.reason ?? "", /block|refus|unverifiab/i);
  assert.doesNotMatch(
    res.reason ?? "",
    /non-2xx\/3xx final status/,
    "must not be filed under the same reason as a genuinely dead link",
  );
});

test("a 429 is retried before being called anything", async () => {
  let calls = 0;
  const res = await verifyUrlLive("https://ratelimited.example.org/", {
    retryDelayMs: 0,
    fetchImpl: async () => {
      calls++;
      return calls <= 2 ? { ok: false, status: 429 } : { ok: true, status: 200 };
    },
  });

  assert.equal(res.ok, true, "a rate limit that clears must resolve to live");
});

test("a persistent 429 is BLOCKED, not dead", async () => {
  const res = await verifyUrlLive("https://ratelimited.example.org/", {
    retryDelayMs: 0,
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });

  assert.equal(res.ok, false);
  assert.equal(res.blocked, true);
});

test("a 404 is DEAD, not blocked — the distinction must not blur", async () => {
  const res = await verifyUrlLive("https://gone.example.org/", {
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });

  assert.equal(res.ok, false);
  assert.notEqual(res.blocked, true, "a 404 is real evidence the URL is wrong");
});

test("a 500 is DEAD, not blocked", async () => {
  const res = await verifyUrlLive("https://broken.example.org/", {
    fetchImpl: async () => ({ ok: false, status: 500 }),
  });

  assert.equal(res.ok, false);
  assert.notEqual(res.blocked, true);
});

test("validateResearchedRowLive reports a blocked source distinguishably", async () => {
  const res = await validateResearchedRowLive(GOOD_GOLF, {
    verifyUrl: async () => ({ ok: false, status: 403, blocked: true, reason: "blocked by the server (403)" }),
  });

  assert.equal(res.ok, false);
  const why = (res as { reasons: string[] }).reasons.join(" ");
  assert.match(why, /block|unverifiab/i, "must not be filed under the same reason as a dead link");
});
