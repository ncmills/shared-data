/**
 * lexicons.ts — the name/highlight pattern lists that site hard-exclude rules
 * match on (CORPUS-M4). They become `lexicon.*` facets in vocab/v1.json, so a
 * profile rule can only cite a pattern that is in the vocabulary.
 *
 * Every pattern is copied VERBATIM from the site's own code at the cited sha
 * (regex source; all are case-insensitive, flag `i`). They are a snapshot, not
 * a live link: if the site changes its list, re-copy it here, bump the vocab
 * version, and regenerate. The M4 fidelity check
 * (~/work/shared-data/2026-09-24-corpus-m4-tools) ran each site's own code over
 * the corpus and got the same rows as these copies.
 */
export interface Lexicon {
  source: string;
  flags: "i";
  terms: readonly string[];
}

export const LEXICONS: Record<string, Lexicon> = {
  /** Friendsmoon drops a party row whose NAME names the wedding party (both paths). */
  "lexicon.wrong-occasion": {
    source: "friendsmoon/src/lib/catalog.ts:67-68@3812b3a (WRONG_OCCASION)",
    flags: "i",
    terms: [
      String.raw`\b(bachelorette|bachelor part(y|ies)|bach part(y|ies)|hen (party|do|night)|stag (party|do|night)|groomsmen|bridesmaids?|bridal (party|shower)|bride|groom)\b`,
    ],
  },
  /** Proposalmoon's party-register row ban (tested on name + highlight, quoted spans removed). */
  "lexicon.em-row-register": {
    source: "engagedmoon/src/lib/brand.ts:289-299@c2518db (CATALOG_ROW_BANNED)",
    flags: "i",
    terms: [
      String.raw`\bcasino\b`,
      String.raw`\bkaraoke\b`,
      String.raw`\bopen\s*bar\b`,
      String.raw`\bnightclub\b`,
      String.raw`\bgroups?\b(?!\s+(area|campground|site|shelter|use\s+area))`,
      String.raw`\bcrawl\b`,
      String.raw`\bparty\s*(bus|boat|barge)\b`,
      String.raw`\bkeg\b`,
      String.raw`\bshots?\b(?!\s+(of\s+espresso|glass))`,
    ],
  },
  /**
   * Proposalmoon's sibling-brand / party / corporate / golf vocabulary + fabricated social proof.
   * ONE term of the 28 is deliberately omitted: `\bfriendsmoon\b`. Standing rule: the string
   * "friendsmoon" is never added to an exclusion list (it names a commercial product, and exclusion
   * lists are keyed on strings). It matched 0 corpus rows at M4; the profile records the omission,
   * and the M4 fidelity check against Proposalmoon's own code goes red if a row ever says it.
   */
  "lexicon.em-banned-patterns": {
    source: "engagedmoon/src/lib/brand.ts:173-212,237-245@c2518db (BANNED_PATTERNS + BANNED_SOCIAL_PROOF)",
    flags: "i",
    terms: [
      String.raw`\bbest\s*man\s*hq\b`,
      String.raw`\bmaid\s*of\s*honor\s*hq\b`,
      String.raw`\bhandicap\s*hq\b`,
      String.raw`\boffsite\s*outpost\b`,
      String.raw`\btour\s*de\s*fore\b`,
      String.raw`\bbachelor(ette)?\b`,
      String.raw`\bstag\s*(do|party|night)\b`,
      String.raw`\bhen\s*(do|party|night)\b`,
      String.raw`\bpedal\s*tavern\b`,
      String.raw`\bhonky[-\s]?tonk\b`,
      String.raw`\bstrip\s*club\b`,
      String.raw`\bbottle\s*service\b`,
      String.raw`\bpub\s*crawl\b`,
      String.raw`\blast\s*(night\s*of\s*freedom|rodeo|ride)\b`,
      String.raw`\bteam\s*building\b`,
      String.raw`\boffsite\b`,
      String.raw`\bcorporate\s*(retreat|outing)\b`,
      String.raw`\battendees?\b`,
      String.raw`\bbreakout\s*session\b`,
      String.raw`\btee\s*time\b`,
      String.raw`\bgreen\s*fees?\b`,
      String.raw`\bhandicap\s*index\b`,
      String.raw`\bfoursome\b`,
      String.raw`\b(join|trusted\s*by|loved\s*by)\s*[\d,]+\+?\s*(couples|users|people)\b`,
      String.raw`\b[\d,]+\+?\s*(proposals|engagements)\s*planned\b`,
      String.raw`\bas\s*seen\s*(in|on)\b`,
      String.raw`\b\d(\.\d)?\s*(stars?|\/\s*5)\b`,
    ],
  },
};
