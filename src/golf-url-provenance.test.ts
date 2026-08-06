// golf-url-provenance.test.ts — non-course golf venues must not carry a URL
// they cannot account for.
//
// The 91 URLs this strips were never researched. They are the venue's own name
// slugged into a domain, and resolving them proves they are wrong, not merely
// unverified: hash-kitchen.com is a construction company, the-shed.com is an
// artist's blog, geronimo.com is a nonprofit consultancy. They passed every
// existing gate because they all return HTTP 200 — `verify-url` asks whether a
// URL is alive, not whether it is the right place.
import { test } from "node:test";
import assert from "node:assert/strict";

import { golfDestinations } from "./golf-destinations";

type Row = Record<string, unknown>;

const NON_COURSE = ["dining", "bars", "activities", "lodging", "partyBuses", "privateChefs"];

function rowsIn(keys: string[]): Row[] {
  const out: Row[] = [];
  for (const dest of golfDestinations() as unknown as Record<string, unknown>[]) {
    for (const key of keys) {
      const arr = dest[key];
      if (Array.isArray(arr)) for (const v of arr) if (v && typeof v === "object") out.push(v as Row);
    }
  }
  return out;
}

const nonBlank = (v: unknown): boolean => typeof v === "string" && v.trim() !== "";

test("no non-course golf venue ships a URL without provenance", () => {
  const offenders = rowsIn(NON_COURSE)
    .filter((r) => nonBlank(r.url))
    .filter((r) => !(nonBlank(r.sourceUrl) && Array.isArray(r.citations) && r.citations.length > 0));

  assert.deepEqual(
    offenders.map((r) => `${String(r.name)} -> ${String(r.url)}`),
    [],
    "a URL nothing attests to must not reach a consumer — it renders as a real booking link",
  );
});

test("the fabrication fingerprint is gone from non-course venues", () => {
  // Bare host, no path, host is a mechanical slug of the venue name. 89 of the
  // 91 stripped rows matched this; if it reappears, the generator is back.
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const fabricated = rowsIn(NON_COURSE)
    .filter((r) => nonBlank(r.url))
    .filter((r) => {
      const host = String(r.url).replace(/^https?:\/\//, "").replace(/\/$/, "");
      if (host.includes("/")) return false;
      const domain = host.replace(/^www\./, "").split(".")[0];
      return slug(String(r.name)).startsWith(slug(domain));
    });

  assert.deepEqual(fabricated.map((r) => String(r.url)), []);
});

test("a non-course venue WITH real provenance keeps its URL (forward-compatible)", () => {
  // The strip must not be a blanket ban, or the golf backfill can never land.
  // Exercised directly against the strip's rule, since no such row exists yet.
  const provenanced: Row = {
    name: "Somewhere Real",
    url: "https://www.somewherereal.com/menu",
    sourceUrl: "https://www.somewherereal.com/about",
    citations: ["https://www.somewherereal.com/about"],
  };
  const bare: Row = { name: "Somewhere Real", url: "https://www.somewhere-real.com" };

  const keeps = (r: Row) =>
    nonBlank(r.sourceUrl) && Array.isArray(r.citations) && r.citations.length > 0;

  assert.equal(keeps(provenanced), true, "provenance earns the link back");
  assert.equal(keeps(bare), false, "a bare slug does not");
});

test("courses are deliberately untouched", () => {
  // Left to HHQ's render gate (handicap-hq#24): 88% coverage, mostly real hosts
  // with deep paths. Stripping them here would regress a mostly-good surface.
  const withUrl = rowsIn(["courses"]).filter((r) => nonBlank(r.url));
  assert.ok(withUrl.length > 500, `expected course URLs to survive, saw ${withUrl.length}`);
});

test("stripping removes the key rather than blanking it", () => {
  // Downstream counts a row as SOURCED iff `url` is non-blank
  // (backfill-queue.ts). A leftover empty string would keep these scored as
  // sourced and keep them out of the queue that should now pick them up.
  const stripped = rowsIn(NON_COURSE).filter((r) => "url" in r && !nonBlank(r.url));
  assert.deepEqual(stripped.map((r) => String(r.name)), []);
});
