/**
 * Every data module must be reachable through the package's PUBLIC surface.
 *
 * 2026-08-27. `crawler-user-agents` shipped in #46 with nine passing tests, and every one of
 * them imported it by relative path — so none exercised what a consumer actually imports.
 * `package.json` `main` is `src/index.ts`, which did not re-export it, so
 * `import { classifyUserAgent } from "shared-data"` resolved to undefined in all four wizards.
 * A module can be shipped, tested, and completely unreachable at the same time; a relative
 * import in a test is not evidence that a consumer can reach it.
 */
import { strict as assert } from "node:assert";
import test from "node:test";

import * as pkg from "./index";

test("the crawler classifier is reachable from the package entry point", () => {
  assert.equal(typeof pkg.classifyUserAgent, "function",
    "classifyUserAgent is not exported from src/index.ts — consumers import from 'shared-data'");
  assert.ok(Array.isArray(pkg.DECLARED_CRAWLERS) && pkg.DECLARED_CRAWLERS.length > 10);
  assert.ok(Array.isArray(pkg.AUTOMATION_AGENTS) && pkg.AUTOMATION_AGENTS.length > 10);
});

test("and it behaves the same through the entry point as it does directly", () => {
  const v = pkg.classifyUserAgent(
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
  assert.equal(v.is_bot, true);
  assert.equal(v.bot_reason, "declared:googlebot");
  assert.equal(pkg.classifyUserAgent("Mozilla/5.0 (Macintosh) Chrome/128 Safari/537.36").is_bot, false);
});
