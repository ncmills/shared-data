// score-fix5.test.ts — CORPUS-M5-FIX5 (DRV ruling 2), written red-first against c14b897.
//   BMHQ's banned "king(s)" gets one narrow exception: "King Street" / "King St" / "King St." is a
//   place name, not the brand's "king of the weekend" voice. Every other use of king/kings is still
//   banned, and no other banned word changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "./score.ts";

const KING = "\\bkings?\\b";

test("ruling 2: 'King Street' and 'King St' are place names — not a banned-word hit", () => {
  for (const reason of [
    "A rum bar with daiquiris and rum flights on King Street fits the honest-bar scene.",
    "A cocktail bar on King St. with a long bourbon list.",
    "A cocktail bar on King St with a long bourbon list.",
    "Upstairs at 12 king street, a whiskey room.",
  ]) assert.deepEqual(S.bannedInReason("bestman", reason).filter((s) => s.startsWith(KING)), [], reason);
});

test("ruling 2: every other king/kings is still banned", () => {
  for (const reason of [
    "Feel like the king of the weekend at this steakhouse.",
    "A bar fit for kings.",
    "A King Streets-style crawl through the district.",
    "Kings of the lake: a pontoon with a grill.",
    "King Street kings will love it.",
  ]) assert.ok(S.bannedInReason("bestman", reason).some((s) => s.startsWith(KING)), reason);
});

test("ruling 2: no other banned word changed, and MOH's list is untouched", () => {
  const src = (site: string) => S.REASON_BANNED[site].map((r) => r.source + "/" + r.flags);
  assert.deepEqual(src("bestman"), [
    "\\bworld-class\\b/i", "\\bpremium\\b/i", "\\btrusted\\b/i", "\\bcutting-edge\\b/i",
    "\\bkings?\\b(?!\\s+st(?:reet|\\.)?\\b)/i", "\\bgoats?\\b/i", "\\blegends?\\b/i", "🔥/u", "👑/u", "\\bgold[- ]chains?\\b/i",
    "\\bher\\b/i", "\\bshe\\b/i", "\\bthe bride\\b/i",
  ]);
  assert.deepEqual(src("moh"), [
    "\\bcrews?\\b/i", "\\bsquads?\\b/i", "\\bsend-it\\b/i", "\\bbabes?\\b/i", "\\bbride tribe\\b/i",
    "\\bworld-class\\b/i", "\\bpremium\\b/i", "\\btrusted\\b/i", "\\bcutting-edge\\b/i",
  ]);
});
