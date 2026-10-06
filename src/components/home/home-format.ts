/**
 * Small text helpers for homepage content that ships numbers inside
 * translated sentences (e.g. "2 Rings Phone Answer Time").
 */

/** Removes `value` from the start of `text` so the value can be shown as a large figure. */
export function stripLeadingValue(text: string, value: string): string {
  return text.startsWith(value) ? text.slice(value.length).trim() : text;
}

/** Parses a percentage string such as "90%" into a number, falling back to 0. */
export function parsePercent(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Splits the trailing `count` words off a heading so the payoff phrase can
 * take the accent colour, returning `[lead, accent]`.
 *
 * Done by word count rather than a second translation key because the copy is
 * authored as one sentence per language; where word order differs the emphasis
 * lands on a different phrase, which is cosmetic. A heading shorter than
 * `count` words keeps all of itself in the accent.
 */
export function splitTrailingWords(text: string, count: number): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length <= count) return ["", text];
  return [`${words.slice(0, -count).join(" ")} `, words.slice(-count).join(" ")];
}
