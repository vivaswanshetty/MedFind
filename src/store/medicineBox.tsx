/**
 * Data stays on the device only. Do not send it anywhere.
 *
 * My Medicine Box - local on-device medicine inventory and reminder tracking.
 * Strictly local storage via AsyncStorage for privacy and zero cloud attribution.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  scheduleItemReminders,
  cancelItemReminders,
  cancelAllItemReminders,
} from '../lib/reminders';

export const MEDICINE_BOX_STORAGE_KEY = '@medfind_medicine_box_v1';
export const MAX_MEDICINE_BOX_ITEMS = 30;

export interface MedicineBoxItem {
  id: string;
  name: string;
  note?: string;
  expiryDate?: string; // YYYY-MM or YYYY-MM-DD
  refillOn?: string; // YYYY-MM-DD
  remindersEnabled?: boolean;
  expiryNotificationId?: string;
  refillNotificationId?: string;
  createdAt: string;
}

export type NewMedicineBoxItemInput = Omit<MedicineBoxItem, 'id' | 'createdAt' | 'expiryNotificationId' | 'refillNotificationId'>;

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
  const expiryDate = typeof raw.expiryDate === 'string' && raw.expiryDate.trim() ? raw.expiryDate.trim() : undefined;
  const refillOn = typeof raw.refillOn === 'string' && raw.refillOn.trim() ? raw.refillOn.trim() : undefined;
  const remindersEnabled = Boolean(raw.remindersEnabled);

  const expiryNotificationId = typeof raw.expiryNotificationId === 'string' ? raw.expiryNotificationId : undefined;
  const refillNotificationId = typeof raw.refillNotificationId === 'string' ? raw.refillNotificationId : undefined;

  let createdAt = typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : '';
  if (!createdAt || isNaN(new Date(createdAt).getTime())) {
    createdAt = new Date().toISOString();
  }

  return {
    id,
    name,
    ...(note ? { note } : {}),
    ...(expiryDate ? { expiryDate } : {}),
    ...(refillOn ? { refillOn } : {}),
    remindersEnabled,
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

export interface MedicineBoxContextType {
  items: MedicineBoxItem[];
  isLoading: boolean;
  addItem: (input: NewMedicineBoxItemInput) => Promise<{ success: boolean; error?: string; warning?: string; item?: MedicineBoxItem }>;
  updateItem: (id: string, updates: Partial<NewMedicineBoxItemInput>) => Promise<{ success: boolean; error?: string; warning?: string }>;
  removeItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const MedicineBoxContext = createContext<MedicineBoxContextType | undefined>(undefined);

export function MedicineBoxProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MedicineBoxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from AsyncStorage on initial load
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(MEDICINE_BOX_STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          const sanitized = sanitizeMedicineBoxItems(parsed);
          setItems(sanitized);
        }
      } catch (err) {
        console.warn('Failed to hydrate medicine box from storage:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistItems = useCallback(async (newItems: MedicineBoxItem[]) => {
    try {
      await AsyncStorage.setItem(MEDICINE_BOX_STORAGE_KEY, JSON.stringify(newItems));
    } catch (err) {
      console.warn('Failed to save medicine box to storage:', err);
    }
  }, []);

  const addItem = useCallback(
    async (
      input: NewMedicineBoxItemInput
    ): Promise<{ success: boolean; error?: string; warning?: string; item?: MedicineBoxItem }> => {
      if (items.length >= MAX_MEDICINE_BOX_ITEMS) {
        return {
          success: false,
          error: `Your medicine box is full (${MAX_MEDICINE_BOX_ITEMS} items)`,
        };
      }

      const trimmedName = input.name?.trim();
      if (!trimmedName) {
        return { success: false, error: 'Medicine name is required.' };
      }

      const id = `mb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const createdAt = new Date().toISOString();

      let expiryNotificationId: string | undefined;
      let refillNotificationId: string | undefined;
      let warning: string | undefined;

      if (input.remindersEnabled && (input.expiryDate || input.refillOn)) {
        const scheduleResult = await scheduleItemReminders({
          name: trimmedName,
          expiryDate: input.expiryDate,
          refillOn: input.refillOn,
          remindersEnabled: true,
        });

        expiryNotificationId = scheduleResult.expiryNotificationId;
        refillNotificationId = scheduleResult.refillNotificationId;
        warning = scheduleResult.warning;
      }

      const newItem: MedicineBoxItem = {
        id,
        name: trimmedName,
        note: input.note?.trim() || undefined,
        expiryDate: input.expiryDate?.trim() || undefined,
        refillOn: input.refillOn?.trim() || undefined,
        remindersEnabled: Boolean(input.remindersEnabled),
        expiryNotificationId,
        refillNotificationId,
        createdAt,
      };

      const nextItems = [newItem, ...items];
      setItems(nextItems);
      await persistItems(nextItems);

      return { success: true, item: newItem, warning };
    },
    [items, persistItems]
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<NewMedicineBoxItemInput>
    ): Promise<{ success: boolean; error?: string; warning?: string }> => {
      const existing = items.find((i) => i.id === id);
      if (!existing) {
        return { success: false, error: 'Item not found in medicine box.' };
      }

      if (updates.name !== undefined && !updates.name.trim()) {
        return { success: false, error: 'Medicine name cannot be empty.' };
      }

      // Rule 5: Editing cancels existing notifications first
      await cancelItemReminders(existing);

      const mergedName = updates.name !== undefined ? updates.name.trim() : existing.name;
      const mergedNote = updates.note !== undefined ? (updates.note.trim() || undefined) : existing.note;
      const mergedExpiry = updates.expiryDate !== undefined ? (updates.expiryDate.trim() || undefined) : existing.expiryDate;
      const mergedRefill = updates.refillOn !== undefined ? (updates.refillOn.trim() || undefined) : existing.refillOn;
      const mergedReminders = updates.remindersEnabled !== undefined ? Boolean(updates.remindersEnabled) : existing.remindersEnabled;

      let expiryNotificationId: string | undefined;
      let refillNotificationId: string | undefined;
      let warning: string | undefined;

      if (mergedReminders && (mergedExpiry || mergedRefill)) {
        const scheduleResult = await scheduleItemReminders({
          name: mergedName,
          expiryDate: mergedExpiry,
          refillOn: mergedRefill,
          remindersEnabled: true,
        });

        expiryNotificationId = scheduleResult.expiryNotificationId;
        refillNotificationId = scheduleResult.refillNotificationId;
        warning = scheduleResult.warning;
      }

      const updatedItem: MedicineBoxItem = {
        ...existing,
        name: mergedName,
        note: mergedNote,
        expiryDate: mergedExpiry,
        refillOn: mergedRefill,
        remindersEnabled: mergedReminders,
        expiryNotificationId,
        refillNotificationId,
      };

      const nextItems = updateItemInList(items, id, updatedItem);
      setItems(nextItems);
      await persistItems(nextItems);

      return { success: true, warning };
    },
    [items, persistItems]
  );

  const removeItem = useCallback(
    async (id: string): Promise<void> => {
      const existing = items.find((i) => i.id === id);
      if (existing) {
        // Rule 5: Deleting cancels scheduled notifications
        await cancelItemReminders(existing);
      }

      const nextItems = removeItemFromList(items, id);
      setItems(nextItems);
      await persistItems(nextItems);
    },
    [items, persistItems]
  );

  const clearAll = useCallback(async (): Promise<void> => {
    // Cancel all scheduled notifications across medicine box
    await cancelAllItemReminders();

    setItems([]);
    try {
      await AsyncStorage.removeItem(MEDICINE_BOX_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear medicine box storage:', err);
    }
  }, []);

  return (
    <MedicineBoxContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        clearAll,
      }}
    >
      {children}
    </MedicineBoxContext.Provider>
  );
}

export function useMedicineBox(): MedicineBoxContextType {
  const context = useContext(MedicineBoxContext);
  if (!context) {
    throw new Error('useMedicineBox must be used within a MedicineBoxProvider');
  }
  return context;
}
