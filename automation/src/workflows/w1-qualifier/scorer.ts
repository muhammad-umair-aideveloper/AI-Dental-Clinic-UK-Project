/**
 * workflows/w1-qualifier/scorer.ts
 * Lead scoring based on timeline field.
 */
import type { LeadScore } from '../../core/types.js';

const TIMELINE_SCORES: Record<string, LeadScore> = {
  'Immediately':      'HOT',
  'Within 3 months':  'WARM',
  'Just researching': 'COLD',
};

export function scoreFromTimeline(timeline: string | undefined): LeadScore {
  if (!timeline) return 'COLD';
  // Case-insensitive match
  const normalised = Object.keys(TIMELINE_SCORES).find(
    (k) => k.toLowerCase() === timeline.toLowerCase(),
  );
  return TIMELINE_SCORES[normalised ?? ''] ?? 'COLD';
}
