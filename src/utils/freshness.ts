/**
 * Freshness-State Logic for MedFind
 * 
 * Rules specified in Tech Stack.docx Section 4 & PRD.docx Section 6:
 * - Recent:  Update at or under 30 minutes (<= 30 min)
 * - Aging:   Update over 30 minutes through 2 hours (> 30 min and <= 120 min)
 * - Stale:   Update over 2 hours (> 120 min)
 * - Unknown: No valid snapshot or unparseable timestamp.
 * 
 * Safety & Accuracy Invariants:
 * - Never claims stock is "live", "guaranteed", or "in stock".
 * - Never uses phrases like "Recently confirmed by store" that imply real inventory.
 * - Missing data strictly maps to 'unknown', NEVER to 'available' or 'recent'.
 * - Explicitly marks demo records as simulated recency markers.
 * - Timestamps remain visible in all UI results.
 */

export type FreshnessState = 'recent' | 'aging' | 'stale' | 'unknown';

export interface FreshnessCalculation {
  state: FreshnessState;
  stateLabel: string;
  badgeLabel: string;
  guidanceText: string;
  accessibilityLabel: string;
  relativeTimeText: string;
  rawTimestamp: string | null;
  ageMinutes: number | null;
  requiresCallFirst: boolean;
  isSimulated: boolean;
}

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const TWO_HOURS_MS = 120 * 60 * 1000;

/**
 * Calculates the freshness state given an ISO timestamp string, reference time, and optional demo flag.
 * Pure function with zero external side effects.
 */
export function calculateFreshness(
  timestampIso: string | null | undefined,
  referenceNow: Date = new Date(),
  isDemo: boolean = false
): FreshnessCalculation {
  if (!timestampIso || typeof timestampIso !== 'string' || timestampIso.trim() === '') {
    return createUnknownResult(null, 'No timestamp provided', isDemo);
  }

  const parsedDate = new Date(timestampIso);
  const parsedTime = parsedDate.getTime();

  if (Number.isNaN(parsedTime)) {
    return createUnknownResult(timestampIso, 'Invalid timestamp format', isDemo);
  }

  const nowTime = referenceNow.getTime();
  const diffMs = nowTime - parsedTime;

  // Clock drift tolerance: if the timestamp is slightly in the future (within 2 min), clamp to 0
  const safeDiffMs = diffMs < 0 && Math.abs(diffMs) <= 2 * 60 * 1000 ? 0 : diffMs;

  if (safeDiffMs < 0) {
    return createUnknownResult(timestampIso, 'Timestamp is in the future', isDemo);
  }

  const ageMinutes = Math.floor(safeDiffMs / (60 * 1000));
  const relativeTimeText = formatRelativeTime(ageMinutes);

  if (safeDiffMs <= THIRTY_MINUTES_MS) {
    return {
      state: 'recent',
      stateLabel: isDemo ? 'Simulated Recent' : 'Recent Update',
      badgeLabel: isDemo ? `Simulated: Recent (≤ 30m window)` : `Recent (${relativeTimeText})`,
      guidanceText: isDemo
        ? 'Simulated recency marker for testing — not real inventory.'
        : 'Updated within 30 min — call pharmacy before travel to confirm.',
      accessibilityLabel: isDemo
        ? 'Simulated recent update marker for testing only'
        : `Stock updated ${relativeTimeText}. Call pharmacy before traveling.`,
      relativeTimeText,
      rawTimestamp: timestampIso,
      ageMinutes,
      requiresCallFirst: false,
      isSimulated: isDemo,
    };
  }

  if (safeDiffMs <= TWO_HOURS_MS) {
    return {
      state: 'aging',
      stateLabel: isDemo ? 'Simulated Aging' : 'Aging Update',
      badgeLabel: isDemo ? `Simulated: Aging (30m - 2h)` : `Aging (${relativeTimeText}) — Call first`,
      guidanceText: isDemo
        ? 'Simulated aging marker for testing — not real inventory.'
        : 'Update is over 30 min old — stock may have changed. Call first.',
      accessibilityLabel: isDemo
        ? 'Simulated aging update marker for testing only'
        : `Stock update is ${relativeTimeText}. Aging status, call pharmacy first.`,
      relativeTimeText,
      rawTimestamp: timestampIso,
      ageMinutes,
      requiresCallFirst: true,
      isSimulated: isDemo,
    };
  }

  return {
    state: 'stale',
    stateLabel: isDemo ? 'Simulated Stale' : 'Stale Update',
    badgeLabel: isDemo ? `Simulated: Stale (> 2h)` : `Stale (${relativeTimeText}) — Call first`,
    guidanceText: isDemo
      ? 'Simulated stale marker for testing — not real inventory.'
      : 'Update is over 2 hours old. Must call store to confirm.',
    accessibilityLabel: isDemo
      ? 'Simulated stale update marker for testing only'
      : `Stock update is ${relativeTimeText}. Stale status, must call store before travel.`,
    relativeTimeText,
    rawTimestamp: timestampIso,
    ageMinutes,
    requiresCallFirst: true,
    isSimulated: isDemo,
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

function createUnknownResult(
  rawTimestamp: string | null,
  reason: string,
  isDemo: boolean
): FreshnessCalculation {
  return {
    state: 'unknown',
    stateLabel: isDemo ? 'Simulated Unknown' : 'Unknown',
    badgeLabel: isDemo ? 'Simulated: Unknown Timestamp' : 'Unknown — Call first',
    guidanceText: isDemo
      ? `Simulated unknown marker (${reason}) — not real inventory.`
      : `Status unverified (${reason}). Call store to check stock.`,
    accessibilityLabel: isDemo
      ? 'Simulated unknown timestamp marker'
      : `Stock status unverified. Call store to check stock.`,
    relativeTimeText: 'Unknown update time',
    rawTimestamp,
    ageMinutes: null,
    requiresCallFirst: true,
    isSimulated: isDemo,
  };
}
