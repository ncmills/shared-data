/**
 * The quarantine must remove exactly the confirmed-dead urls and nothing else.
 *
 * The falsification case matters most here. Seven urls the audit called dead were
 * working links, and quarantining any of them would have replaced a good direct
 * link with nothing — a regression dressed as a fix.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import { DEAD_VENUE_URLS, isDeadUrl, stripDeadVenueUrls } from "./dead-url-quarantine";
import { sharedDestinations } from "./index";

test("every quarantined url carries its evidence", () => {
  assert.ok(DEAD_VENUE_URLS.size > 0);
  for (const [url, why] of DEAD_VENUE_URLS) {
    assert.match(url, /^https?:\/\//);
    assert.ok(why.length > 20, `${url} needs a real reason, got "${why}"`);
  }
});

test("the confirmed-dead urls are recognised", () => {
  assert.equal(isDeadUrl("https://thenoblesouth.com"), true);
  assert.equal(isDeadUrl("https://ludlowandprime.com"), true);
  assert.equal(isDeadUrl("https://moondogsbar.com/"), true);
  assert.equal(isDeadUrl("https://automaticseafood.com"), true);
  assert.equal(isDeadUrl("https://www.hiltonvb.com"), true);
  assert.equal(isDeadUrl("https://thecapitolbend.com/"), true);
});

test("a live site with a flapping origin is NOT quarantined", () => {
  // sagamorespirit.com answered 5 of 10 GETs with the real homepage from its
  // origin while the other 5 returned Cloudflare 521. Dropping its url would
  // trade a link that works half the time for no link at all.
  assert.equal(isDeadUrl("https://sagamorespirit.com/"), false);
  assert.equal(isDeadUrl("https://sagamorespirit.com"), false);
});

test("a trailing slash does not let a dead url through", () => {
  assert.equal(isDeadUrl("https://thenoblesouth.com/"), true);
  assert.equal(isDeadUrl("https://moondogsbar.com"), true);
});

test("the urls the audit got WRONG are not quarantined", () => {
  // All four return HTTP 200 to curl. Node's fetch failed on them for reasons
  // that have nothing to do with whether a user can open the link:
  for (const working of [
    "https://midnightcowboymodeling.com/",              // incomplete TLS chain
    "https://aspenwhitehouse.com/",                     // incomplete TLS chain
    "https://www.cityexperiences.com/boston/city-cruises/boston-harbor/", // bot-blocked
    "https://www.thestudyatuniversitycity.com/",        // Akamai edge refuses Node
    "https://borgata.mgmresorts.com/",                  // slower than our 12s timeout
  ]) {
    assert.equal(isDeadUrl(working), false, `${working} is alive and must keep its url`);
  }
});

test("stripping removes only the url key, leaving the venue intact", () => {
  const dest = {
    id: "mobile-al",
    dining: [
      { name: "The Noble South", url: "https://thenoblesouth.com", priceTier: "$$" },
      { name: "Somewhere Fine", url: "https://somewherefine.test/", priceTier: "$$" },
    ],
  };
  const out = stripDeadVenueUrls(dest as any) as typeof dest;
  assert.equal("url" in out.dining[0], false, "dead url key must be REMOVED, not blanked");
  assert.equal(out.dining[0].name, "The Noble South");
  assert.equal(out.dining[0].priceTier, "$$");
  assert.equal(out.dining[1].url, "https://somewherefine.test/");
});

test("a destination with nothing to strip is returned unchanged by identity", () => {
  const dest = { id: "x", dining: [{ name: "Fine", url: "https://fine.test/" }] };
  assert.equal(stripDeadVenueUrls(dest as any), dest);
});

test("no quarantined url survives into the published universe", () => {
  const leaked: string[] = [];
  for (const dest of sharedDestinations as any[]) {
    for (const cat of ["activities", "dining", "nightlife", "lodging", "transport"]) {
      for (const v of dest[cat] ?? []) {
        if (isDeadUrl(v?.url)) leaked.push(`${dest.id}/${cat}/${v.name} → ${v.url}`);
      }
    }
  }
  assert.deepEqual(leaked, [], `dead urls reached consumers:\n${leaked.join("\n")}`);
});

test("the quarantined venues still render — only their link is gone", () => {
  const names = ["The Noble South", "Ludlow & Prime", "Moondogs Atlanta",
                 "Automatic Seafood & Oysters", "Sky Bar", "The Capitol"];
  const found = new Set<string>();
  for (const dest of sharedDestinations as any[]) {
    for (const cat of ["activities", "dining", "nightlife", "lodging", "transport"]) {
      for (const v of dest[cat] ?? []) if (names.includes(v?.name)) found.add(v.name);
    }
  }
  // Stripping a url must never remove the venue itself — the wizard still
  // recommends it, and falls back to the partner listing for booking.
  assert.ok(found.size >= 4, `expected the venues to survive, found ${[...found].join(", ")}`);
});
