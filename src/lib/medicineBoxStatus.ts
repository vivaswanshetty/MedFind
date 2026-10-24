/**
 * Expiry Status Logic for Medicine Box Items
 * Pure, on-device logic with month-boundary and precision support.
 */

export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

export interface ExpiryInputItem {
  expiryDate?: string | null;
  exactExpiryDate?: string | null;
}

/**
 * Parses an exact expiry day string (YYYY-MM-DD) into an end-of-day Date (23:59:59.999).
 */
export function parseExactExpiryDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // End of that exact day
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Parses an expiry date string (YYYY-MM, YYYY-MM-DD, or "Month YYYY") into an end-of-month Date.
 * Medicine packs print month and year, which means the expiry is the final moment of that month.
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
    // Day 0 of next month is the last day of the given month at end of day
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  // Case 2: YYYY-MM-DD format (normalized to the last day of that month)
  const yearMonthDayMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yearMonthDayMatch) {
    const year = parseInt(yearMonthDayMatch[1], 10);
    const month = parseInt(yearMonthDayMatch[2], 10);
    const day = parseInt(yearMonthDayMatch[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    // Medicine packs specify month and year, which means the end of that month.
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  // Case 3: "Month YYYY" (e.g. "March 2027" or "Mar 2027")
  const monthNameMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthNameMatch) {
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mStr = monthNameMatch[1].toLowerCase();
    let mIdx = monthNames.indexOf(mStr);
    if (mIdx === -1) mIdx = shortMonthNames.indexOf(mStr);
    if (mIdx !== -1) {
      const year = parseInt(monthNameMatch[2], 10);
      return new Date(year, mIdx + 1, 0, 23, 59, 59, 999);
    }
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  // If a generic Date was parsed, also normalize to end of its month
  return new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Resolves the effective expiry Date for an item.
 * When exactExpiryDate is set, the exact day (end of day) wins.
 * Otherwise, month-precision expiryDate (end of month) is used.
 */
export function resolveItemExpiryDate(item?: ExpiryInputItem | null): Date | null {
  if (!item) return null;
  if (item.exactExpiryDate) {
    const exact = parseExactExpiryDate(item.exactExpiryDate);
    if (exact) return exact;
  }
  if (item.expiryDate) {
    return parseExpiryDate(item.expiryDate);
  }
  return null;
}

/**
 * Formats a month & year string (e.g. "2027-03" or "2027-03-31") as "Mar 2027".
 */
export function formatExpiryMonthYear(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parsed = parseExpiryDate(dateStr);
  if (!parsed) return null;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/**
 * Formats an exact expiry day string (e.g. "2027-03-15") as "15 Mar 2027".
 */
export function formatExactExpiryDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parsed = parseExactExpiryDate(dateStr);
  if (!parsed) return null;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parsed.getDate()} ${monthNames[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

/**
 * Evaluates the expiry status of an item relative to a reference time (defaults to Date.now()).
 * - 'expired': Date has passed
 * - 'soon': Date is within the next 30 days (0 <= diffDays <= 30)
 * - 'ok': Date is more than 30 days away
 * - 'none': No valid date configured
 */
export function getExpiryStatus(
  item?: ExpiryInputItem | null,
  now: Date = new Date()
): ExpiryStatus {
  const expiry = resolveItemExpiryDate(item);
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
 * - 'ok': green (ok), "Expires Month Year" or "Expires Day Month Year" (if exact day specified)
 * - 'none': null (no chip)
 */
export function getExpiryChipInfo(
  item?: ExpiryInputItem | null,
  now: Date = new Date()
): ExpiryChipInfo | null {
  const status = getExpiryStatus(item, now);
  if (status === 'none') return null;

  const expiry = resolveItemExpiryDate(item)!;
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

  if (item?.exactExpiryDate) {
    return {
      status,
      tone: 'ok',
      label: `Expires ${expiry.getDate()} ${monthStr} ${yearStr}`,
    };
  }

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


