/**
 * Pure data types, validations, and list operations for Medicine Box.
 * Free of React/JSX dependencies to allow direct execution in Node.js unit tests.
 */

export const MEDICINE_BOX_STORAGE_KEY = '@medfind_medicine_box_v1';
export const MAX_MEDICINE_BOX_ITEMS = 30;

export type RestockInterval = 'weekly' | 'monthly' | '2months' | 'custom';
export type MedicineSpace = 'daily' | 'essential';

export interface MedicineBoxItem {
  id: string;
  name: string;
  note?: string;
  space?: MedicineSpace; // 'daily' for daily routine health meds; 'essential' for home cabinet/first aid
  // Daily Meds specific fields
  isRegular?: boolean; // True for daily maintenance meds
  restockInterval?: RestockInterval; // 'weekly' | 'monthly' | '2months' | 'custom'
  lastRestockedAt?: string; // ISO date string of last restock
  dailyTime?: string; // e.g. "morning" | "afternoon" | "night" or "08:00"
  dailyTakenDates?: string[]; // Array of YYYY-MM-DD dates marked as taken
  // Essential Cabinet Meds specific fields
  essentialCategory?: string; // e.g. "Fever & Pain", "First Aid", "Digestion", "Cold & Allergy"
  stockLevel?: 'full' | 'few' | 'empty';
  // Common / Shared fields
  expiryDate?: string; // YYYY-MM or YYYY-MM-DD
  exactExpiryDate?: string; // YYYY-MM-DD
  refillOn?: string; // YYYY-MM-DD
  remindersEnabled?: boolean;
  dosageForm?: string;
  strength?: string;
  expiryNotificationId?: string;
  refillNotificationId?: string;
  createdAt: string;
}

export type NewMedicineBoxItemInput = Omit<
  MedicineBoxItem,
  'id' | 'createdAt' | 'expiryNotificationId' | 'refillNotificationId'
>;

/**
 * Resolves whether an item belongs to 'daily' health meds or 'essential' cabinet supplies.
 * Backwards compatible: any existing item with isRegular: true maps to 'daily', otherwise 'essential'.
 */
export function getItemSpace(item?: Partial<MedicineBoxItem> | null): MedicineSpace {
  if (!item) return 'essential';
  if (item.space === 'daily' || item.space === 'essential') {
    return item.space;
  }
  return item.isRegular ? 'daily' : 'essential';
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString(fromDate: Date = new Date()): string {
  const year = fromDate.getFullYear();
  const month = String(fromDate.getMonth() + 1).padStart(2, '0');
  const day = String(fromDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a daily medicine was marked taken today.
 */
export function isItemTakenToday(
  item: MedicineBoxItem,
  todayStr: string = getTodayDateString()
): boolean {
  return Array.isArray(item.dailyTakenDates) && item.dailyTakenDates.includes(todayStr);
}

/**
 * Toggles the taken status for today.
 */
export function toggleItemTakenToday(
  item: MedicineBoxItem,
  todayStr: string = getTodayDateString()
): MedicineBoxItem {
  const current = Array.isArray(item.dailyTakenDates) ? [...item.dailyTakenDates] : [];
  const idx = current.indexOf(todayStr);
  const updated = idx >= 0 ? current.filter((d) => d !== todayStr) : [...current, todayStr];
  return {
    ...item,
    dailyTakenDates: updated,
  };
}

/**
 * Calculates the next restock date string (YYYY-MM-DD) for a given interval.
 * - 'weekly': 7 days from reference date
 * - 'monthly': 30 days from reference date
 * - '2months': 60 days from reference date
 * - 'custom': 30 days fallback from reference date
 */
export function calculateNextRestockDate(
  interval: RestockInterval = 'monthly',
  fromDate: Date = new Date()
): string {
  const d = new Date(fromDate);
  if (interval === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (interval === 'monthly' || interval === 'custom') {
    d.setDate(d.getDate() + 30);
  } else if (interval === '2months') {
    d.setDate(d.getDate() + 60);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a user-friendly label for a restock interval.
 */
export function formatRestockIntervalLabel(interval?: RestockInterval): string {
  switch (interval) {
    case 'weekly':
      return 'Weekly restock';
    case 'monthly':
      return 'Monthly restock';
    case '2months':
      return '2-month restock';
    case 'custom':
      return 'Custom restock';
    default:
      return 'Restock';
  }
}

/**
 * Validates a raw object from storage, ensuring it conforms to MedicineBoxItem.
 * Returns null for corrupt or invalid records so they can be safely discarded.
 */
export function validateMedicineBoxItem(raw: any): MedicineBoxItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';

  if (!id || !name) return null;

  const note = typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : undefined;
  const expiryDate =
    typeof raw.expiryDate === 'string' && raw.expiryDate.trim()
      ? raw.expiryDate.trim()
      : undefined;
  const exactExpiryDate =
    typeof raw.exactExpiryDate === 'string' && raw.exactExpiryDate.trim()
      ? raw.exactExpiryDate.trim()
      : undefined;
  const refillOn =
    typeof raw.refillOn === 'string' && raw.refillOn.trim()
      ? raw.refillOn.trim()
      : undefined;
  const remindersEnabled = Boolean(raw.remindersEnabled);
  const isRegular = Boolean(raw.isRegular);
  const restockInterval =
    raw.restockInterval === 'weekly' ||
    raw.restockInterval === 'monthly' ||
    raw.restockInterval === '2months' ||
    raw.restockInterval === 'custom'
      ? raw.restockInterval
      : undefined;
  const lastRestockedAt =
    typeof raw.lastRestockedAt === 'string' && raw.lastRestockedAt.trim()
      ? raw.lastRestockedAt.trim()
      : undefined;
  const dosageForm =
    typeof raw.dosageForm === 'string' && raw.dosageForm.trim()
      ? raw.dosageForm.trim()
      : undefined;
  const strength =
    typeof raw.strength === 'string' && raw.strength.trim()
      ? raw.strength.trim()
      : undefined;

  const space: MedicineSpace =
    raw.space === 'daily' || raw.space === 'essential'
      ? raw.space
      : raw.isRegular
      ? 'daily'
      : 'essential';

  const dailyTime =
    typeof raw.dailyTime === 'string' && raw.dailyTime.trim()
      ? raw.dailyTime.trim()
      : undefined;

  const dailyTakenDates = Array.isArray(raw.dailyTakenDates)
    ? raw.dailyTakenDates.filter((d: any) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : undefined;

  const essentialCategory =
    typeof raw.essentialCategory === 'string' && raw.essentialCategory.trim()
      ? raw.essentialCategory.trim()
      : undefined;

  const stockLevel =
    raw.stockLevel === 'full' || raw.stockLevel === 'few' || raw.stockLevel === 'empty'
      ? raw.stockLevel
      : undefined;

  const expiryNotificationId =
    typeof raw.expiryNotificationId === 'string' ? raw.expiryNotificationId : undefined;
  const refillNotificationId =
    typeof raw.refillNotificationId === 'string' ? raw.refillNotificationId : undefined;

  let createdAt =
    typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : '';
  if (!createdAt || isNaN(new Date(createdAt).getTime())) {
    createdAt = new Date().toISOString();
  }

  return {
    id,
    name,
    space,
    ...(note ? { note } : {}),
    ...(expiryDate ? { expiryDate } : {}),
    ...(exactExpiryDate ? { exactExpiryDate } : {}),
    ...(refillOn ? { refillOn } : {}),
    remindersEnabled,
    ...(isRegular ? { isRegular: true } : space === 'daily' ? { isRegular: true } : {}),
    ...(restockInterval ? { restockInterval } : {}),
    ...(lastRestockedAt ? { lastRestockedAt } : {}),
    ...(dailyTime ? { dailyTime } : {}),
    ...(dailyTakenDates && dailyTakenDates.length > 0 ? { dailyTakenDates } : {}),
    ...(essentialCategory ? { essentialCategory } : {}),
    ...(stockLevel ? { stockLevel } : {}),
    ...(dosageForm ? { dosageForm } : {}),
    ...(strength ? { strength } : {}),
    ...(expiryNotificationId ? { expiryNotificationId } : {}),
    ...(refillNotificationId ? { refillNotificationId } : {}),
    createdAt,
  };
}

/**
 * Parses and sanitizes a stored JSON array, discarding any corrupted records
 * and ensuring the 30-item cap is respected.
 */
export function sanitizeMedicineBoxItems(raw: any): MedicineBoxItem[] {
  if (!Array.isArray(raw)) return [];
  const validItems: MedicineBoxItem[] = [];
  for (const entry of raw) {
    const validated = validateMedicineBoxItem(entry);
    if (validated) {
      validItems.push(validated);
      if (validItems.length >= MAX_MEDICINE_BOX_ITEMS) {
        break;
      }
    }
  }
  return validItems;
}

export function addItemToList(
  items: MedicineBoxItem[],
  newItem: MedicineBoxItem
): { items: MedicineBoxItem[]; error?: string } {
  if (items.length >= MAX_MEDICINE_BOX_ITEMS) {
    return {
      items,
      error: `Your medicine box is full (${MAX_MEDICINE_BOX_ITEMS} items)`,
    };
  }
  return { items: [newItem, ...items] };
}

export function updateItemInList(
  items: MedicineBoxItem[],
  id: string,
  updates: Partial<MedicineBoxItem>
): MedicineBoxItem[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      ...updates,
      id: item.id,
      createdAt: item.createdAt,
    };
  });
}

export function removeItemFromList(items: MedicineBoxItem[], id: string): MedicineBoxItem[] {
  return items.filter((item) => item.id !== id);
}
