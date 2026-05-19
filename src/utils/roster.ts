// Parse roster text pasted from a 接龙 message into player names.
// Accepts lines like:
//   "1. a"
//   "1) Tom"
//   "1、张三"
//   " - Mary"
//   "Mary"   (just a name)
// Returns the cleaned, deduped list in order.

// Only lines that begin with a digit count as roster entries.
// This skips headers like "#接龙" or "周四 Thursday 21/5...".
const NUMBERED_LINE = /^\s*\d+\s*[.、)）.]?\s+(.+)$/;

export function parseRoster(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const match = rawLine.match(NUMBERED_LINE);
    if (!match) continue;
    const name = match[1].trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  return names;
}
