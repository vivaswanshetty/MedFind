/**
 * Expiry Status Logic for Medicine Box Items
 * Pure, on-device logic with month-boundary and precision support.
 */

export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

/**
 * Parses an ISO date string (YYYY-MM or YYYY-MM-DD) into a valid end-of-day Date.
 * If only YYYY-MM is provided, it resolves to the final moment of that calendar month.
 */
export function parseExpiryDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Case 1: YYYY-MM format
  const yearMonthMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1], 10);
    const month = parseInt(yearMonthMatch[2], 10);
    if (month < 1 || month > 12) return null;
    // Day 0 of next month is the last day of the given month
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  // Case 2: YYYY-MM-DD format
  const yearMonthDayMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yearMonthDayMatch) {
    const year = parseInt(yearMonthDayMatch[1], 10);
    const month = parseInt(yearMonthDayMatch[2], 10);
    const day = parseInt(yearMonthDayMatch[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const parsed = new Date(year, month - 1, day, 23, 59, 59, 999);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Evaluates the expiry status of an item relative to a reference time (defaults to Date.now()).
 * - 'expired': Date has passed
 * - 'soon': Date is within the next 30 days (0 <= diffDays <= 30)
 * - 'ok': Date is more than 30 days away
 * - 'none': No valid date configured
 */
export function getExpiryStatus(
  item?: { expiryDate?: string | null } | null,
  now: Date = new Date()
): ExpiryStatus {
  if (!item?.expiryDate) {
    return 'none';
  }

  const expiry = parseExpiryDate(item.expiryDate);
  if (!expiry) {
    return 'none';
  }

  const nowMs = now.getTime();
  const expiryMs = expiry.getTime();

  if (expiryMs < nowMs) {
    return 'expired';
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (expiryMs - nowMs <= thirtyDaysMs) {
    return 'soon';
  }

  return 'ok';
}

export interface ExpiryChipInfo {
  status: ExpiryStatus;
  tone: 'bad' | 'warn' | 'ok' | 'na';
  label: string;
}

/**
 * Returns formatted status chip info for an item:
 * - 'expired': destructive red (bad), "Expired"
 * - 'soon': amber warning (warn), "Expires in N days" / "Expires today"
 * - 'ok': green (ok), "Expires Month Year"
 * - 'none': null (no chip)
 */
export function getExpiryChipInfo(
  item?: { expiryDate?: string | null } | null,
  now: Date = new Date()
): ExpiryChipInfo | null {
  const status = getExpiryStatus(item, now);
  if (status === 'none') return null;

  const expiry = parseExpiryDate(item?.expiryDate)!;
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (status === 'expired') {
    return {
      status,
      tone: 'bad',
      label: 'Expired',
    };
  }

  if (status === 'soon') {
    const label = diffDays <= 1 ? 'Expires today' : `Expires in ${diffDays} days`;
    return {
      status,
      tone: 'warn',
      label,
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[expiry.getMonth()];
  const yearStr = expiry.getFullYear();
  return {
    status,
    tone: 'ok',
    label: `Expires ${monthStr} ${yearStr}`,
  };
}

/**
 * Formats a refillOn date string into a user-friendly label (e.g. "15 Nov 2026").
 */
export function formatRefillDate(refillOn?: string | null): string | null {
  if (!refillOn) return null;
  const match = refillOn.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[month - 1]} ${year}`;
}

