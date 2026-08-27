/**
 * crawler-user-agents — the User-Agent patterns that mean "this request is not a person".
 *
 * WHY THIS IS DATA AND NOT A LIST INSIDE A ROUTE. On 2026-08-26/27 a crawler walked
 * handicaphq.com's pSEO surface and wrote 3,793 rows into `wp_acquisition_log` — 3,758 of them
 * on `handicap` across 1,585 distinct landing pages, one session each. Handicap's 30-day
 * acquisition figure was 5.9x overstated; every other brand was exactly 1.0x. Four separate
 * signals routes write that table (MOH, plan-my-party, handicap-hq, offsite-outpost), so a
 * hardcoded list would be four lists that drift, and the drift would be invisible: a brand whose
 * copy lacked a pattern would simply report more "acquisition" than its siblings and look like
 * it was winning.
 *
 * ─── TWO GROUPS, AND THEY ARE NOT THE SAME CLAIM ────────────────────────────────────────────
 *
 * DECLARED are agents that announce themselves and are usually WELCOME. Googlebot indexing the
 * pSEO surface is the growth engine working, not an attack. Classifying one is a statement about
 * COUNTING, never about blocking — nothing in this repo or its consumers may use these patterns
 * to deny a request.
 *
 * AUTOMATION are headless browsers and HTTP clients. They are not necessarily hostile either
 * (our own e2e harness is one), but they are never a person browsing.
 *
 * The reason string carries which group matched, because "Googlebot came" and "something
 * headless came" want different responses from a human reading the report.
 *
 * ─── THE BAR FOR ADDING A PATTERN ───────────────────────────────────────────────────────────
 *
 * A pattern must appear in a REAL User-Agent that a documented crawler publishes, or be a
 * substring no ordinary browser UA contains. Every entry is lowercase and matched against a
 * lowercased UA, so a pattern with a capital letter can never match and would be a silent
 * false negative — `crawler-user-agents.test.ts` asserts that, because a list whose entries
 * cannot match is indistinguishable from a list that finds nothing.
 *
 * NOT a defence. `robots.txt`, firewall rules and rate limits are out of scope by design: the
 * crawler measured on 08-26 EXECUTES JAVASCRIPT (it wrote via /api/signals, a client-side
 * fetch), so it is a rendering crawler that may well be a search engine, and blocking it would
 * be the worst available outcome for a site whose growth engine is pSEO.
 */

/** Agents that announce themselves. Usually welcome; never counted as acquisition. */
export const DECLARED_CRAWLERS: readonly string[] = [
  "googlebot",
  "google-inspectiontool",
  "storebot-google",
  "bingbot",
  "applebot",
  "duckduckbot",
  "yandexbot",
  "baiduspider",
  "slurp",              // Yahoo
  "gptbot",             // OpenAI
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",          // Anthropic
  "claude-web",
  "anthropic-ai",
  "perplexitybot",
  "google-extended",
  "ccbot",              // Common Crawl
  "bytespider",
  "amazonbot",
  "facebookexternalhit",
  "meta-externalagent",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "petalbot",
  "screaming frog seo spider",
] as const;

/** Headless browsers and HTTP clients. Never a person browsing. */
export const AUTOMATION_AGENTS: readonly string[] = [
  "headlesschrome",
  "playwright",
  "puppeteer",
  "phantomjs",
  "selenium",
  "webdriver",
  "python-requests",
  "python-urllib",
  "aiohttp",
  "httpx",
  "curl/",
  "wget/",
  "go-http-client",
  "java/",
  "okhttp",
  "axios/",
  "node-fetch",
  "got (https://github.com/sindresorhus/got)",
  "postmanruntime",
  "insomnia",
  "lighthouse",
  "chrome-lighthouse",
  "vercel-screenshot",
  "vercel favicon",
] as const;

export type BotReason = `declared:${string}` | `automation:${string}`;

export interface BotVerdict {
  /** true when the UA matched a known pattern. NEVER a judgement about intent. */
  is_bot: boolean;
  /** `declared:googlebot` / `automation:headlesschrome`, or null when nothing matched. */
  bot_reason: BotReason | null;
}

/**
 * Classify a User-Agent. Pure, allocation-light, and safe on absent input.
 *
 * An empty or missing UA returns NOT a bot on purpose. Plenty of privacy tooling strips it, and
 * "we could not tell" must not be recorded as "it was a robot" — that is the same substitution
 * of not-measured for measured this whole package exists to remove. An unnamed agent is left to
 * the read-time day-shape rule, which reports itself.
 */
export function classifyUserAgent(ua: string | null | undefined): BotVerdict {
  if (!ua) return { is_bot: false, bot_reason: null };
  const s = ua.toLowerCase();
  for (const p of DECLARED_CRAWLERS) {
    if (s.includes(p)) return { is_bot: true, bot_reason: `declared:${p}` };
  }
  for (const p of AUTOMATION_AGENTS) {
    if (s.includes(p)) return { is_bot: true, bot_reason: `automation:${p}` };
  }
  return { is_bot: false, bot_reason: null };
}
