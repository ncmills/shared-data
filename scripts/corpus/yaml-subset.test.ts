// yaml-subset.test.ts — the profile reader must read the subset exactly and
// THROW on anything outside it (a silently mis-read rule is worse than none).
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYamlSubset } from "./yaml-subset.ts";

test("reads nested maps, block + flow sequences, quoted and plain scalars", () => {
  const v = parseYamlSubset(`
# header comment
site: moh
ref: 1bcdb7a   # trailing comment
n: 30
ok: true
none: null
voice: {summary: "warm: stylish", cite: "a/b.md:9-10@1bcdb7a", banned: [crew, 'it''s', "x#y"]}
hard_excludes:
  - id: moh-golf
    match: {facet: activity.category, in: [golf]}
    cite: "maid-of-honor-hq/scripts/check-no-golf.ts:3@1bcdb7a"
  - {id: moh-intl, match: {facet: place.scope, in: [non-us]}}
absent:
  - adult-venue rule
  - "quoted: item"
nested:
  deeper:
    k: v
`);
  assert.deepEqual(v, {
    site: "moh",
    ref: "1bcdb7a",
    n: 30,
    ok: true,
    none: null,
    voice: { summary: "warm: stylish", cite: "a/b.md:9-10@1bcdb7a", banned: ["crew", "it's", "x#y"] },
    hard_excludes: [
      { id: "moh-golf", match: { facet: "activity.category", in: ["golf"] }, cite: "maid-of-honor-hq/scripts/check-no-golf.ts:3@1bcdb7a" },
      { id: "moh-intl", match: { facet: "place.scope", in: ["non-us"] } },
    ],
    absent: ["adult-venue rule", "quoted: item"],
    nested: { deeper: { k: "v" } },
  });
});

test("a sequence item that is a mapping keeps its continuation keys", () => {
  const v = parseYamlSubset("xs:\n  - a: 1\n    b: [2, 3]\n  - a: 4\n") as any;
  assert.deepEqual(v.xs, [{ a: 1, b: [2, 3] }, { a: 4 }]);
});

for (const [name, src] of [
  ["duplicate key", "a: 1\na: 2\n"],
  ["duplicate flow key", "a: {b: 1, b: 2}\n"],
  ["anchor", "a: &x 1\n"],
  ["block scalar", "a: |\n  text\n"],
  ["unquoted colon-space in a value", "a: b: c\n"],
  ["unterminated quote", 'a: "abc\n'],
  ["multi-line flow", "a: [1,\n  2]\n"],
  ["bad indentation", "a:\n  b: 1\n   c: 2\n"],
  ["tab indentation", "a:\n\tb: 1\n"],
  ["key with no value", "a:\nb: 1\n"],
  ["document marker", "---\na: 1\n"],
] as const) {
  test(`throws on ${name}`, () => {
    assert.throws(() => parseYamlSubset(src), /yaml-subset/);
  });
}
