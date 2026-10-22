/**
 * Freshness-State Logic for MedFind
 * 
 * Rules specified in Tech Stack.docx Section 4 & PRD.docx Section 6:
 * - Recent:  Update at or under 30 minutes (<= 30 min)
 * - Aging:   Update over 30 minutes through 2 hours (> 30 min and <= 120 min)
 * - Stale:   Update over 2 hours (> 120 min)
 * - Unknown: No valid snapshot or unparseable timestamp.
 * 
 * Clinical & Truthfulness Invariant:
 * Missing data strictly maps to 'unknown', NEVER to 'available' or 'recent'.
 * Timestamps must remain visible in all UI results.
 */

export type FreshnessState = 'recent' | 'aging' | 'stale' | 'unknown';

export interface FreshnessCalculation {
  state: FreshnessState;
  stateLabel: string;
  badgeLabel: string;
  guidanceText: string;
  relativeTimeText: string;
  rawTimestamp: string | null;
  ageMinutes: number | null;
  requiresCallFirst: boolean;
}

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const TWO_HOURS_MS = 120 * 60 * 1000;

export const freshnessLabels = {
  recent: {
    label: 'Verified Recently',
    guidance: 'Recently confirmed by store',
  },
  aging: {
    label: 'Update Aging',
    guidance: 'Call store to confirm before visiting',
  },
  stale: {
    label: 'Update Stale',
    guidance: 'Likely out of date; call store before travel',
  },
  unknown: {
    label: 'Timestamp Unverified',
    guidance: 'No valid timestamp available',
  },
};

/**
 * Calculates the freshness state given an ISO timestamp string and optional current reference time.
 * Pure function with zero external side effects.
 */
export function calculateFreshness(
  timestampIso: string | null | undefined,
  referenceNow: Date = new Date()
): FreshnessCalculation {
  if (!timestampIso || typeof timestampIso !== 'string' || timestampIso.trim() === '') {
    return createUnknownResult(null, 'No timestamp provided');
  }

  const parsedDate = new Date(timestampIso);
  const parsedTime = parsedDate.getTime();

  if (Number.isNaN(parsedTime)) {
    return createUnknownResult(timestampIso, 'Invalid timestamp format');
  }

  const nowTime = referenceNow.getTime();
  const diffMs = nowTime - parsedTime;

  // Clock drift tolerance: if the timestamp is slightly in the future (within 2 min), clamp to 0
  const safeDiffMs = diffMs < 0 && Math.abs(diffMs) <= 2 * 60 * 1000 ? 0 : diffMs;

  if (safeDiffMs < 0) {
    // Timestamp is significantly in the future, which is anomalous
    return createUnknownResult(timestampIso, 'Timestamp is in the future');
  }

  const ageMinutes = Math.floor(safeDiffMs / (60 * 1000));
  const relativeTimeText = formatRelativeTime(ageMinutes);

  if (safeDiffMs <= THIRTY_MINUTES_MS) {
    return {
      state: 'recent',
      stateLabel: freshnessLabels.recent.label,
      badgeLabel: `Recent (${relativeTimeText})`,
      guidanceText: freshnessLabels.recent.guidance,
      relativeTimeText,
      rawTimestamp: timestampIso,
      ageMinutes,
      requiresCallFirst: false,
    };
  }

  if (safeDiffMs <= TWO_HOURS_MS) {
    return {
      state: 'aging',
      stateLabel: freshnessLabels.aging.label,
      badgeLabel: `Aging (${relativeTimeText}) — Call first`,
      guidanceText: freshnessLabels.aging.guidance,
      relativeTimeText,
      rawTimestamp: timestampIso,
      ageMinutes,
      requiresCallFirst: true,
    };
  }

  return {
    state: 'stale',
    stateLabel: freshnessLabels.stale.label,
    badgeLabel: `Stale (${relativeTimeText}) — Call first`,
    guidanceText: freshnessLabels.stale.guidance,
    relativeTimeText,
    rawTimestamp: timestampIso,
    ageMinutes,
    requiresCallFirst: true,
  };
}

function formatRelativeTime(minutes: number): string {
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes === 1) {
    return '1 min ago';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  return `${hours}h ${remainingMinutes}m ago`;
}

function createUnknownResult(rawTimestamp: string | null, reason: string): FreshnessCalculation {
  return {
    state: 'unknown',
    stateLabel: 'Unknown',
    badgeLabel: 'Unknown — Call first',
    guidanceText: `Status unverified (${reason}). Call store to check stock.`,
    relativeTimeText: 'Unknown update time',
    rawTimestamp,
    ageMinutes: null,
    requiresCallFirst: true,
  };
}
