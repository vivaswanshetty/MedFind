/**
 * Medicine Search Service for MedFind
 * 
 * Queries the Supabase database view `current_stock_records` for:
 * - Matching medicines (generic name, brand name, aliases)
 * - Participating pharmacies
 * - Latest stock snapshots
 * 
 * Fallback & Safety Rules (PRD & Phase 2 Requirements):
 * 1. If Supabase is unconfigured, unreachable, or has no published stock records,
 *    it returns the fictional demo dataset with `dataSource: 'demo'`.
 * 2. Never blends demo and database records in the same result list.
 * 3. Does not provide dosage advice, treatment, or automatic medicine substitution.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { StockState } from '../types/models';
import { calculateFreshness, FreshnessCalculation } from '../utils/freshness';
import {
  demoMedicines,
  demoPharmacies,
  demoStockSnapshots,
} from '../data/demoData';

export type DataSource = 'database' | 'demo';

export interface MedicineSearchResultItem {
  id: string;
  medicineId: string;
  genericName: string;
  brandName: string;
  strength?: string;
  dosageForm?: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  state: StockState;
  updatedAt: string;
  isDemo: boolean;
  freshness: FreshnessCalculation;
}

export interface MedicineSearchResponse {
  dataSource: DataSource;
  results: MedicineSearchResultItem[];
  totalPublishedInDb: number;
  errorMessage?: string;
}

/**
 * Searches medicine availability across participating pharmacies.
 */
export async function searchMedicineStock(
  query: string,
  dosageForm: string = 'All'
): Promise<MedicineSearchResponse> {
  const normalizedQuery = query.trim().toLowerCase();
  const filterDosage = dosageForm !== 'All' ? dosageForm.toLowerCase() : null;

  // Case 1: Supabase client is not configured -> return pure demo data
  if (!isSupabaseConfigured || !supabase) {
    return {
      dataSource: 'demo',
      results: getFilteredDemoResults(normalizedQuery, filterDosage),
      totalPublishedInDb: 0,
    };
  }

  try {
    // Check if the database has ANY published stock snapshots
    const { count: totalDbRecords, error: countError } = await supabase
      .from('current_stock_records')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Supabase query error on count check:', countError.message);
      // Fallback cleanly to demo data with notice
      return {
        dataSource: 'demo',
        results: getFilteredDemoResults(normalizedQuery, filterDosage),
        totalPublishedInDb: 0,
        errorMessage: `Database unavailable: ${countError.message}. Showing simulated demo baseline.`,
      };
    }

    // Case 2: Database has 0 published stock records -> fallback to demo data
    if (!totalDbRecords || totalDbRecords === 0) {
      return {
        dataSource: 'demo',
        results: getFilteredDemoResults(normalizedQuery, filterDosage),
        totalPublishedInDb: 0,
      };
    }

    // Case 3: Database has published records -> Query matching records
    let dbQuery = supabase
      .from('current_stock_records')
      .select('*')
      .order('updated_at', { ascending: false });

    // Apply dosage form filter if specified
    if (filterDosage) {
      dbQuery = dbQuery.ilike('dosage_form', filterDosage);
    }

    // Apply text search across generic_name and brand_name
    if (normalizedQuery) {
      const term = `%${normalizedQuery}%`;
      dbQuery = dbQuery.or(`generic_name.ilike.${term},brand_name.ilike.${term}`);
    }

    const { data: dbData, error: queryError } = await dbQuery;

    if (queryError) {
      console.warn('Supabase search query failed:', queryError.message);
      return {
        dataSource: 'demo',
        results: getFilteredDemoResults(normalizedQuery, filterDosage),
        totalPublishedInDb: totalDbRecords,
        errorMessage: `Search query failed: ${queryError.message}. Showing simulated demo baseline.`,
      };
    }

    // Map database records into uniform view model
    const results: MedicineSearchResultItem[] = (dbData || []).map((row) => ({
      id: `${row.medicine_id}-${row.pharmacy_id}`,
      medicineId: row.medicine_id,
      genericName: row.generic_name,
      brandName: row.brand_name,
      strength: row.strength,
      dosageForm: row.dosage_form,
      pharmacyId: row.pharmacy_id,
      pharmacyName: row.pharmacy_name,
      pharmacyAddress: row.pharmacy_address,
      pharmacyPhone: row.pharmacy_phone,
      state: row.state as StockState,
      updatedAt: row.updated_at,
      isDemo: Boolean(row.is_demo),
      freshness: calculateFreshness(row.updated_at, new Date(), Boolean(row.is_demo)),
    }));

    return {
      dataSource: 'database',
      results,
      totalPublishedInDb: totalDbRecords,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Unexpected error in searchMedicineStock:', errorMsg);
    return {
      dataSource: 'demo',
      results: getFilteredDemoResults(normalizedQuery, filterDosage),
      totalPublishedInDb: 0,
      errorMessage: `Connection error: ${errorMsg}. Showing simulated demo baseline.`,
    };
  }
}

/**
 * Filters the fictional demo dataset when database data is unavailable.
 */
function getFilteredDemoResults(
  normalizedQuery: string,
  filterDosage: string | null
): MedicineSearchResultItem[] {
  const filteredMeds = demoMedicines.filter((med) => {
    const matchesQuery =
      normalizedQuery === '' ||
      med.generic_name.toLowerCase().includes(normalizedQuery) ||
      med.brand_name.toLowerCase().includes(normalizedQuery) ||
      med.searchable_aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery));

    const matchesDosage =
      !filterDosage || med.dosage_form?.toLowerCase() === filterDosage;

    return matchesQuery && matchesDosage;
  });

  const results: MedicineSearchResultItem[] = [];

  filteredMeds.forEach((med) => {
    const snapshots = demoStockSnapshots.filter((s) => s.medicine_id === med.id);

    snapshots.forEach((snap) => {
      const pharmacy = demoPharmacies.find((p) => p.id === snap.pharmacy_id);
      if (pharmacy) {
        results.push({
          id: `demo-${med.id}-${pharmacy.id}`,
          medicineId: med.id,
          genericName: med.generic_name,
          brandName: med.brand_name,
          strength: med.strength,
          dosageForm: med.dosage_form,
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          pharmacyAddress: pharmacy.address,
          pharmacyPhone: pharmacy.phone,
          state: snap.state,
          updatedAt: snap.updated_at,
          isDemo: true,
          freshness: calculateFreshness(snap.updated_at, new Date(), true),
        });
      }
    });
  });

  return results;
}
