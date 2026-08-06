// image-url-hygiene.test.ts — an `imageUrl` must be an image, not a beacon.
//
// The defect this guards (2026-08-05): 8 of the 183 `imageUrl` values embedded
// in the golf catalog pointed at something that was never a photo, including
// two live tracking beacons (xAd conversion endpoint, Meta pixel) that fired
// on every render of the page carrying them.
//
// These tests pin the property that matters at the USER's surface: whatever
// `golfDestinations()` hands a consumer contains no beacon, no parked-domain
// placeholder, no bare homepage. The catalog assertion is the one that would
// have caught the original bug — the unit cases exist so a failure tells you
// WHICH rule broke instead of just "something in 183 rows".
import { test } from "node:test";
import assert from "node:assert/strict";

import { golfDestinations } from "./index";
import { isPublishableImageUrl, stripUnpublishableImageUrls } from "./image-url-hygiene";

// The exact values found in the catalog on 2026-08-05.
const REAL_OFFENDERS = [
  "https://bidagent.xad.com/conv/286550?ts=TIMESTAMP",
  "https://www.facebook.com/tr?id=26603812462549625&ev=PageView&noscript=1",
  "https://static.hugedomains.com/images/hdv3-img/og_hugedomains.png",
  "https://www.lacomagolf.com/",
];

test("the real offenders found in the catalog are all rejected", () => {
  for (const url of REAL_OFFENDERS) {
    assert.equal(isPublishableImageUrl(url), false, `should reject: ${url}`);
  }
});

test("legitimate extensionless CDN images are NOT rejected", () => {
  // 13 of the 183 are extensionless and real. An extension rule would have
  // taken these out — the reason the check is identity-based, not shape-based.
  const legit = [
    "https://s7d9.scene7.com/is/image/kohlerhospitality/WSPoster2?wid=1920",
    "https://cdn.sanity.io/images/abc/production/deadbeef-2000x1333",
    "https://img1.wsimg.com/isteam/ip/abc/photo.jpg",
    "https://static1.squarespace.com/static/abc/t/xyz/course.jpg",
    "https://cms11-prod.invitedclubs.com/contentassets/1be648ab5beb/hero",
  ];
  for (const url of legit) {
    assert.equal(isPublishableImageUrl(url), true, `should keep: ${url}`);
  }
});

test("a beacon path is matched on the path, not smuggled via query string", () => {
  assert.equal(isPublishableImageUrl("https://www.facebook.com/tr"), false);
  // A real image whose QUERY merely mentions tr must survive.
  assert.equal(
    isPublishableImageUrl("https://example.com/photos/course.jpg?ref=/tr"),
    true,
  );
});

test("malformed, empty and non-http values are rejected", () => {
  for (const v of ["", "   ", "not a url", "//protocol-relative.jpg", null, undefined, 42]) {
    assert.equal(isPublishableImageUrl(v), false, `should reject: ${String(v)}`);
  }
  assert.equal(isPublishableImageUrl("javascript:alert(1)"), false);
  assert.equal(isPublishableImageUrl("data:image/png;base64,AAAA"), false);
});

test("stripping deletes the key rather than blanking it", () => {
  // A blank string renders a broken <img>; a missing key lets the consumer
  // fall through to its own image pipeline.
  const out = stripUnpublishableImageUrls({
    name: "Somewhere",
    imageUrl: "https://bidagent.xad.com/conv/1?ts=TIMESTAMP",
  });
  assert.equal("imageUrl" in out, false);
  assert.equal(out.name, "Somewhere");
});

test("stripping reaches nested venues, not just the top level", () => {
  // The 8 offenders sat on embedded venues; a shallow pass would miss them all.
  const out = stripUnpublishableImageUrls({
    id: "myrtle-beach-sc",
    courses: [
      { name: "Tidewater", imageUrl: "https://bidagent.xad.com/conv/286550?ts=TIMESTAMP" },
      { name: "Real Course", imageUrl: "https://example.com/real.jpg" },
    ],
  });
  assert.equal("imageUrl" in out.courses[0], false);
  assert.equal(out.courses[1].imageUrl, "https://example.com/real.jpg");
});

test("no destination reaching a consumer carries an unpublishable imageUrl", () => {
  // The regression guard. This is the assertion that fails on the old code.
  const offenders: string[] = [];

  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${path}[${i}]`));
      return;
    }
    if (node === null || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === "imageUrl" && !isPublishableImageUrl(v)) {
        offenders.push(`${path}.${k} = ${String(v)}`);
      }
      walk(v, `${path}.${k}`);
    }
  };

  walk(golfDestinations(), "golfDestinations()");

  assert.deepEqual(
    offenders,
    [],
    `unpublishable imageUrl values reaching consumers:\n  ${offenders.join("\n  ")}`,
  );
});
