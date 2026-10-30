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
} from '../lib/reminders.ts';
import {
  MEDICINE_BOX_STORAGE_KEY,
  MAX_MEDICINE_BOX_ITEMS,
  RestockInterval,
  MedicineSpace,
  MedicineBoxItem,
  NewMedicineBoxItemInput,
  validateMedicineBoxItem,
  sanitizeMedicineBoxItems,
  addItemToList,
  updateItemInList,
  removeItemFromList,
  calculateNextRestockDate,
  formatRestockIntervalLabel,
  getItemSpace,
  getTodayDateString,
  isItemTakenToday,
  toggleItemTakenToday,
} from './medicineBoxModel.ts';

export {
  MEDICINE_BOX_STORAGE_KEY,
  MAX_MEDICINE_BOX_ITEMS,
  RestockInterval,
  MedicineSpace,
  MedicineBoxItem,
  NewMedicineBoxItemInput,
  validateMedicineBoxItem,
  sanitizeMedicineBoxItems,
  addItemToList,
  updateItemInList,
  removeItemFromList,
  calculateNextRestockDate,
  formatRestockIntervalLabel,
  getItemSpace,
  getTodayDateString,
  isItemTakenToday,
  toggleItemTakenToday,
};

export interface MedicineBoxContextType {
  items: MedicineBoxItem[];
  isLoading: boolean;
  addItem: (input: NewMedicineBoxItemInput) => Promise<{ success: boolean; error?: string; warning?: string; item?: MedicineBoxItem }>;
  updateItem: (id: string, updates: Partial<NewMedicineBoxItemInput>) => Promise<{ success: boolean; error?: string; warning?: string }>;
  removeItem: (id: string) => Promise<void>;
  markRestocked: (id: string) => Promise<{ success: boolean; nextRefillOn?: string; error?: string }>;
  toggleTakenToday: (id: string, dateStr?: string) => Promise<{ success: boolean; isTaken: boolean }>;
  isItemInBox: (medicineName: string) => boolean;
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

  const isItemInBox = useCallback(
    (medicineName: string): boolean => {
      if (!medicineName) return false;
      const lower = medicineName.trim().toLowerCase();
      return items.some((i) => {
        const itemLower = i.name.toLowerCase();
        return itemLower === lower || itemLower.includes(lower) || lower.includes(itemLower);
      });
    },
    [items]
  );

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

      let targetRefillOn = input.refillOn?.trim() || undefined;
      // If user specified regular medicine with an interval but didn't pick an explicit date, auto-calculate
      if (input.isRegular && input.restockInterval && input.restockInterval !== 'custom' && !targetRefillOn) {
        targetRefillOn = calculateNextRestockDate(input.restockInterval);
      }

      const remindersEnabled =
        input.remindersEnabled !== undefined
          ? Boolean(input.remindersEnabled)
          : Boolean(input.isRegular || targetRefillOn || input.expiryDate);

      let expiryNotificationId: string | undefined;
      let refillNotificationId: string | undefined;
      let warning: string | undefined;

      if (remindersEnabled && (input.expiryDate || input.exactExpiryDate || targetRefillOn)) {
        const scheduleResult = await scheduleItemReminders({
          name: trimmedName,
          expiryDate: input.expiryDate,
          exactExpiryDate: input.exactExpiryDate,
          refillOn: targetRefillOn,
          remindersEnabled: true,
          isRegular: input.isRegular,
          restockInterval: input.restockInterval,
        });

        expiryNotificationId = scheduleResult.expiryNotificationId;
        refillNotificationId = scheduleResult.refillNotificationId;
        warning = scheduleResult.warning;
      }

      const space: MedicineSpace =
        input.space === 'daily' || input.space === 'essential'
          ? input.space
          : input.isRegular
          ? 'daily'
          : 'essential';

      const newItem: MedicineBoxItem = {
        id,
        name: trimmedName,
        space,
        note: input.note?.trim() || undefined,
        expiryDate: input.expiryDate?.trim() || undefined,
        exactExpiryDate: input.exactExpiryDate?.trim() || undefined,
        refillOn: targetRefillOn,
        remindersEnabled,
        isRegular: Boolean(input.isRegular || space === 'daily'),
        restockInterval: input.restockInterval,
        lastRestockedAt: input.lastRestockedAt || undefined,
        dailyTime: input.dailyTime?.trim() || undefined,
        dailyTakenDates: input.dailyTakenDates || undefined,
        essentialCategory: input.essentialCategory?.trim() || undefined,
        stockLevel: input.stockLevel || undefined,
        dosageForm: input.dosageForm?.trim() || undefined,
        strength: input.strength?.trim() || undefined,
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
      const mergedExactExpiry = updates.exactExpiryDate !== undefined ? (updates.exactExpiryDate.trim() || undefined) : existing.exactExpiryDate;

      let mergedRefill = updates.refillOn !== undefined ? (updates.refillOn.trim() || undefined) : existing.refillOn;
      const mergedIsRegular = updates.isRegular !== undefined ? Boolean(updates.isRegular) : Boolean(existing.isRegular);
      const mergedRestockInterval = updates.restockInterval !== undefined ? updates.restockInterval : existing.restockInterval;

      if (mergedIsRegular && mergedRestockInterval && mergedRestockInterval !== 'custom' && !mergedRefill) {
        mergedRefill = calculateNextRestockDate(mergedRestockInterval);
      }

      const mergedReminders = updates.remindersEnabled !== undefined ? Boolean(updates.remindersEnabled) : existing.remindersEnabled;
      const mergedDosageForm = updates.dosageForm !== undefined ? updates.dosageForm : existing.dosageForm;
      const mergedStrength = updates.strength !== undefined ? updates.strength : existing.strength;
      const mergedLastRestocked = updates.lastRestockedAt !== undefined ? updates.lastRestockedAt : existing.lastRestockedAt;

      let expiryNotificationId: string | undefined;
      let refillNotificationId: string | undefined;
      let warning: string | undefined;

      if (mergedReminders && (mergedExpiry || mergedExactExpiry || mergedRefill)) {
        const scheduleResult = await scheduleItemReminders({
          name: mergedName,
          expiryDate: mergedExpiry,
          exactExpiryDate: mergedExactExpiry,
          refillOn: mergedRefill,
          remindersEnabled: true,
          isRegular: mergedIsRegular,
          restockInterval: mergedRestockInterval,
        });

        expiryNotificationId = scheduleResult.expiryNotificationId;
        refillNotificationId = scheduleResult.refillNotificationId;
        warning = scheduleResult.warning;
      }

      const mergedSpace =
        updates.space !== undefined
          ? updates.space
          : updates.isRegular !== undefined
          ? updates.isRegular
            ? 'daily'
            : 'essential'
          : existing.space || (existing.isRegular ? 'daily' : 'essential');

      const updatedItem: MedicineBoxItem = {
        ...existing,
        name: mergedName,
        space: mergedSpace,
        note: mergedNote,
        expiryDate: mergedExpiry,
        exactExpiryDate: mergedExactExpiry,
        refillOn: mergedRefill,
        remindersEnabled: mergedReminders,
        isRegular: Boolean(mergedIsRegular || mergedSpace === 'daily'),
        restockInterval: mergedRestockInterval,
        lastRestockedAt: mergedLastRestocked,
        dailyTime:
          updates.dailyTime !== undefined
            ? (updates.dailyTime.trim() || undefined)
            : existing.dailyTime,
        dailyTakenDates:
          updates.dailyTakenDates !== undefined
            ? updates.dailyTakenDates
            : existing.dailyTakenDates,
        essentialCategory:
          updates.essentialCategory !== undefined
            ? (updates.essentialCategory.trim() || undefined)
            : existing.essentialCategory,
        stockLevel:
          updates.stockLevel !== undefined ? updates.stockLevel : existing.stockLevel,
        dosageForm: mergedDosageForm,
        strength: mergedStrength,
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

  const markRestocked = useCallback(
    async (id: string): Promise<{ success: boolean; nextRefillOn?: string; error?: string }> => {
      const existing = items.find((i) => i.id === id);
      if (!existing) {
        return { success: false, error: 'Item not found in medicine box.' };
      }

      // Calculate next restock date
      const interval =
        existing.restockInterval === 'weekly' ||
        existing.restockInterval === 'monthly' ||
        existing.restockInterval === '2months'
          ? existing.restockInterval
          : 'monthly';

      const nextDate = calculateNextRestockDate(interval);

      // Cancel old reminder
      await cancelItemReminders(existing);

      let refillNotificationId: string | undefined;
      if (existing.remindersEnabled) {
        const scheduleResult = await scheduleItemReminders({
          name: existing.name,
          expiryDate: existing.expiryDate,
          exactExpiryDate: existing.exactExpiryDate,
          refillOn: nextDate,
          remindersEnabled: true,
          isRegular: true,
          restockInterval: interval,
        });
        refillNotificationId = scheduleResult.refillNotificationId;
      }

      const updatedItem: MedicineBoxItem = {
        ...existing,
        refillOn: nextDate,
        lastRestockedAt: new Date().toISOString(),
        refillNotificationId,
      };

      const nextItems = updateItemInList(items, id, updatedItem);
      setItems(nextItems);
      await persistItems(nextItems);

      return { success: true, nextRefillOn: nextDate };
    },
    [items, persistItems]
  );

  const toggleTakenToday = useCallback(
    async (id: string, dateStr?: string): Promise<{ success: boolean; isTaken: boolean }> => {
      const existing = items.find((i) => i.id === id);
      if (!existing) return { success: false, isTaken: false };
      const updatedItem = toggleItemTakenToday(existing, dateStr);
      const isTaken = isItemTakenToday(updatedItem, dateStr);
      const nextItems = updateItemInList(items, id, updatedItem);
      setItems(nextItems);
      await persistItems(nextItems);
      return { success: true, isTaken };
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
        markRestocked,
        toggleTakenToday,
        isItemInBox,
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
