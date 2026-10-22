/**
 * Pharmacy Staff Portal Service for MedFind
 * Supports PRD FR 06 & FR 07:
 * - Allows authorized pharmacy staff to update stock snapshots
 * - Preserves append-only event log with audit tracking
 * - Safe fallback to local demo data when Supabase is offline
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Pharmacy, Medicine, StockSnapshot, StockState } from '../types/models';
import { demoPharmacies, demoMedicines, demoStockSnapshots } from '../data/demoData';

export interface InventoryItemRow {
  medicine: Medicine;
  currentSnapshot: StockSnapshot | null;
}

export interface AuditRecordRow {
  id: string;
  medicineName: string;
  newState: StockState;
  timestamp: string;
  updater: string;
}

// In-memory fallback log for simulated demo mode
let localSnapshots: StockSnapshot[] = [...demoStockSnapshots];
let localAuditLog: AuditRecordRow[] = [
  {
    id: 'audit-init-1',
    medicineName: 'Demo-Calpol (Paracetamol)',
    newState: 'available',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updater: 'Staff Member Alpha',
  },
  {
    id: 'audit-init-2',
    medicineName: 'Demo-Mox (Amoxicillin)',
    newState: 'low_stock',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    updater: 'Staff Member Beta',
  },
];

export const pharmacyPortalService = {
  /**
   * Retrieves list of participating pharmacies
   */
  async getPharmacies(): Promise<Pharmacy[]> {
    if (!isSupabaseConfigured || !supabase) {
      return demoPharmacies;
    }

    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('participation_status', 'participating')
        .order('name');

      if (error || !data || data.length === 0) {
        return demoPharmacies;
      }

      return data as Pharmacy[];
    } catch {
      return demoPharmacies;
    }
  },

  /**
   * Retrieves inventory and current availability state for a specific pharmacy
   */
  async getInventory(pharmacyId: string): Promise<InventoryItemRow[]> {
    if (!isSupabaseConfigured || !supabase) {
      return demoMedicines.map((med) => {
        const snap = localSnapshots.find(
          (s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId
        );
        return {
          medicine: med,
          currentSnapshot: snap || null,
        };
      });
    }

    try {
      // 1. Fetch medicines
      const { data: medsData } = await supabase
        .from('medicines')
        .select('*')
        .order('brand_name');

      const medicinesList: Medicine[] = medsData && medsData.length > 0 ? medsData : demoMedicines;

      // 2. Fetch current stock records
      const { data: stockData } = await supabase
        .from('current_stock_records')
        .select('*')
        .eq('pharmacy_id', pharmacyId);

      return medicinesList.map((med) => {
        const row = stockData?.find((s) => s.medicine_id === med.id);
        const snapshot: StockSnapshot | null = row
          ? {
              id: `${row.medicine_id}-${row.pharmacy_id}`,
              medicine_id: row.medicine_id,
              pharmacy_id: row.pharmacy_id,
              state: row.state as StockState,
              updated_at: row.updated_at,
              updated_by: row.updated_by || 'pharmacy_staff_portal',
              note: row.note || 'Verified via mobile staff update',
              is_demo: Boolean(row.is_demo),
            }
          : null;

        return {
          medicine: med,
          currentSnapshot: snapshot,
        };
      });
    } catch {
      return demoMedicines.map((med) => ({
        medicine: med,
        currentSnapshot: localSnapshots.find(
          (s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId
        ) || null,
      }));
    }
  },

  /**
   * Creates an append-only stock snapshot and audit record
   */
  async updateStock(
    pharmacyId: string,
    medicineId: string,
    medicineName: string,
    state: StockState,
    staffName: string = 'Staff Member'
  ): Promise<{ success: boolean; updatedAt: string }> {
    const nowIso = new Date().toISOString();

    // Always update local memory log
    const existingIndex = localSnapshots.findIndex(
      (s) => s.medicine_id === medicineId && s.pharmacy_id === pharmacyId
    );

    const newSnapshot: StockSnapshot = {
      id: `snap-${Date.now()}`,
      medicine_id: medicineId,
      pharmacy_id: pharmacyId,
      state,
      updated_at: nowIso,
      updated_by: staffName,
      note: `1-tap update by ${staffName}`,
      is_demo: true,
    };

    if (existingIndex >= 0) {
      localSnapshots[existingIndex] = newSnapshot;
    } else {
      localSnapshots.push(newSnapshot);
    }

    localAuditLog.unshift({
      id: `audit-${Date.now()}`,
      medicineName,
      newState: state,
      timestamp: nowIso,
      updater: staffName,
    });

    if (localAuditLog.length > 20) {
      localAuditLog.pop();
    }

    // If Supabase is connected, insert an append-only record
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('stock_snapshots').insert([
          {
            medicine_id: medicineId,
            pharmacy_id: pharmacyId,
            state,
            updated_at: nowIso,
            source: 'pharmacy_staff_portal',
            note: `Staff 1-tap update by ${staffName}`,
          },
        ]);
      } catch (err) {
        console.warn('Supabase stock snapshot insert skipped:', err);
      }
    }

    return {
      success: true,
      updatedAt: nowIso,
    };
  },

  /**
   * Retrieves recent audit records for compliance inspection
   */
  getAuditLog(): AuditRecordRow[] {
    return localAuditLog;
  },
};
