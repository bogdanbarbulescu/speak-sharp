/** Default filler/disfluency words (lowercase). */
export const DEFAULT_FILLER_LIST = [
  'um',
  'uh',
  'like',
  'you know',
  'so',
  'well',
  'actually',
  'basically',
  'literally',
  'right',
  'i mean',
];

/**
 * Count filler word occurrences in transcript using word-boundary matching.
 * Multi-word phrases (e.g. "you know") are matched as substrings after normalization.
 */
export function getFillerCount(
  transcript: string,
  wordList: string[] = DEFAULT_FILLER_LIST
): number {
  const normalized = transcript.toLowerCase().trim();
  if (!normalized) return 0;

  let count = 0;
  for (const filler of wordList) {
    const lower = filler.toLowerCase();
    if (lower.includes(' ')) {
      // phrase: count non-overlapping occurrences
      let idx = 0;
      while (idx < normalized.length) {
        const found = normalized.indexOf(lower, idx);
        if (found === -1) break;
        count++;
        idx = found + lower.length;
      }
    } else {
      // single word: word-boundary regex
      const re = new RegExp(`\\b${escapeRegex(lower)}\\b`, 'gi');
      const matches = normalized.match(re);
      if (matches) count += matches.length;
    }
  }
  return count;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface FillerBreakdownItem {
  word: string;
  count: number;
}

/**
 * Per-filler counts for the transcript.
 */
export function getFillerBreakdown(
  transcript: string,
  wordList: string[] = DEFAULT_FILLER_LIST
): FillerBreakdownItem[] {
  const normalized = transcript.toLowerCase().trim();
  if (!normalized) return wordList.map((w) => ({ word: w, count: 0 }));

  return wordList.map((filler) => {
    const lower = filler.toLowerCase();
    let count = 0;
    if (lower.includes(' ')) {
      let idx = 0;
      while (idx < normalized.length) {
        const found = normalized.indexOf(lower, idx);
        if (found === -1) break;
        count++;
        idx = found + lower.length;
      }
    } else {
      const re = new RegExp(`\\b${escapeRegex(lower)}\\b`, 'gi');
      const matches = normalized.match(re);
      if (matches) count = matches.length;
    }
    return { word: filler, count };
  }).filter((item) => item.count > 0);
}

/**
 * Stub for future TensorFlow.js model: returns word-list count for now.
 * Replace with a small classifier (e.g. token-level filler vs content) when a model is available.
 */
export function getFillerCountFromModel(transcript: string): Promise<number> {
  return Promise.resolve(getFillerCount(transcript));
}
