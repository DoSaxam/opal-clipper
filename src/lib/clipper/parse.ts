// Bulk timestamp parser
// Accepts formats like:
//   0:15-0:45   |  1:00:05 - 1:00:20  |  90-105 (seconds)  |  12:30 to 13:00
//   multiple per line separated by commas/semicolons, or one per line

export interface ParsedRange {
  index: number;
  start: number;
  end: number;
  raw: string;
  error?: string; // validation error
}

const CLOCK = /^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)$/;
const SECONDS = /^(\d{1,6}(?:\.\d{1,3})?)$/;

function parseTime(tok: string): number | null {
  const t = tok.trim();
  if (!t) return null;
  const c = t.match(CLOCK);
  if (c) {
    const h = c[1] ? parseInt(c[1], 10) : 0;
    const m = parseInt(c[2], 10);
    const s = parseFloat(c[3]);
    return h * 3600 + m * 60 + s;
  }
  const s = t.match(SECONDS);
  if (s) return parseFloat(s[1]);
  return null;
}

export function parseTimestamps(input: string, videoDuration = 0): ParsedRange[] {
  const out: ParsedRange[] = [];
  if (!input.trim()) return out;

  // split on newlines / commas / semicolons, but NOT inside times (times never contain , or ;)
  const chunks = input
    .split(/[\n,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  let idx = 0;
  for (const chunk of chunks) {
    // separators: - – — "to" ">"
    const m = chunk.match(/^(.+?)\s*(?:-|–|—|->|=>|to|To|TO)\s*(.+)$/);
    if (!m) {
      out.push({ index: idx++, start: 0, end: 0, raw: chunk, error: "Use a range like 1:30 - 2:00" });
      continue;
    }
    const start = parseTime(m[1]);
    const end = parseTime(m[2]);
    if (start == null || end == null) {
      out.push({
        index: idx++,
        start: start ?? 0,
        end: end ?? 0,
        raw: chunk,
        error: start == null ? `Can't read start "${m[1].trim()}"` : `Can't read end "${m[2].trim()}"`,
      });
      continue;
    }
    if (end - start < 1) {
      out.push({ index: idx++, start, end, raw: chunk, error: "Clip must be at least 1s" });
      continue;
    }
    if (videoDuration > 0 && end > videoDuration + 0.75) {
      out.push({
        index: idx++,
        start,
        end,
        raw: chunk,
        error: `Past video end (${Math.floor(videoDuration)}s)`,
      });
      continue;
    }
    out.push({ index: idx++, start, end, raw: chunk });
  }
  return out;
}
