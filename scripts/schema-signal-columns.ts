/**
 * Every signal table must carry the columns the signals route writes.
 *
 * WHY THIS EXISTS
 * On 2026-08-27 `migrations/2026-08-27-signal-is-bot.sql` added is_bot/bot_reason to two
 * tables and described them as "BOTH tables the client signals route writes". The route
 * writes whichever of EIGHT tables `resolveSignalTableName()` returns. The consumer PRs
 * shipped sending both columns on every insert; PostgREST rejected the other six with
 * 400 PGRST204 and wrote nothing, and six of eight signal types dropped silently on three
 * live sites for about two hours.
 *
 * The coverage was stated as a claim about the route, in a comment, and nothing checked it.
 * A sentence cannot fail. This can.
 *
 * ENUMERATED BY SIGNATURE, NOT BY A LIST, and that is the whole point (standing rule 1). A
 * hardcoded list of eight table names would be a second list that has to agree with
 * shared-engine's resolver, and the failure mode of two lists that must agree is exactly
 * what happened here. Instead: any `public.wp_*` table carrying the signal triple
 * (session_id + brand + payload) IS a signal table, so the ninth one someone adds is covered
 * without anyone remembering to register it.
 *
 * THE wp_ PREFIX IS LOAD-BEARING, not cosmetic. The live database still holds unprefixed
 * twins of all eight -- public.acquisition_log, public.plan_selections and the rest -- left
 * from the 2026-04-22 namespace rename. They match the signal signature exactly and nothing
 * writes to them. They are not dead weight either: plan-my-party's rate limiter wrote to the
 * unprefixed `signal_rate_limit` while reading `wp_signal_rate_limit` until 2026-08-23, so
 * the count it incremented was never the count it checked. Scoping to wp_ keeps this check
 * on the tables the routes actually address; the twins are a separate problem and naming
 * them here is how it stays visible.
 */

/** Columns every /api/signals insert names. Mirrors the row built in each consumer's
 *  src/app/api/signals/route.ts. `created_at` and `id` are database-supplied. */
export const SIGNAL_ROW_COLUMNS = [
  "session_id",
  "brand",
  "payload",
  "is_bot",
  "bot_reason",
] as const;

/** The subset that IDENTIFIES a table as a signal table. Deliberately not the full set:
 *  if it were, a table missing is_bot would stop being a signal table and the check would
 *  pass by losing its subject -- a guard that cannot fail. */
export const SIGNAL_SIGNATURE = ["session_id", "brand", "payload"] as const;

export interface TableColumns {
  table: string;
  columns: Set<string>;
}

/** Parse `CREATE TABLE public.x (...)` blocks out of a live-schema.sql snapshot. */
export function parseSnapshot(sql: string): TableColumns[] {
  const out: TableColumns[] = [];
  const re = /CREATE TABLE public\.(\w+) \(\n([\s\S]*?)\n\);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    const columns = new Set<string>();
    for (const line of m[2].split("\n")) {
      // Column lines are two-space indented `name type ...`; CONSTRAINT lines are not columns.
      const c = /^ {2}(\w+) /.exec(line);
      if (c && c[1] !== "CONSTRAINT") columns.add(c[1]);
    }
    out.push({ table: m[1], columns });
  }
  return out;
}

export interface SchemaGap {
  table: string;
  missing: string[];
}

/**
 * Every wp_* table with the signal signature, and what it lacks. Empty array = every signal
 * table carries every column the route writes.
 */
export function findSignalSchemaGaps(sql: string): SchemaGap[] {
  const gaps: SchemaGap[] = [];
  for (const { table, columns } of parseSnapshot(sql)) {
    if (!table.startsWith("wp_")) continue;
    if (!SIGNAL_SIGNATURE.every((c) => columns.has(c))) continue;
    const missing = SIGNAL_ROW_COLUMNS.filter((c) => !columns.has(c));
    if (missing.length) gaps.push({ table, missing });
  }
  return gaps;
}

/** Tables this check actually examined. A count of zero means the snapshot could not be
 *  parsed, which must never be reported as a pass. */
export function signalTablesIn(sql: string): string[] {
  return parseSnapshot(sql)
    .filter((t) => t.table.startsWith("wp_") && SIGNAL_SIGNATURE.every((c) => t.columns.has(c)))
    .map((t) => t.table);
}
