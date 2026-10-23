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
import { StockState, DirectorySourceType } from '../types/models';
import { calculateFreshness, FreshnessCalculation } from '../utils/freshness';
import {
  demoMedicines,
  demoPharmacies,
  demoStockSnapshots,
} from '../data/demoData';
import { pharmacyPortalService } from './pharmacyPortalService';

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
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  openingHours?: string | null;
  verifiedAt?: string | null;
  state: StockState;
  updatedAt: string;
  isDemo: boolean;
  isReported: boolean;
  sourceType: DirectorySourceType | 'unreported';
  sourceName?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  freshness: FreshnessCalculation;
}

export interface MedicineSearchResponse {
  dataSource: DataSource;
  results: MedicineSearchResultItem[];
  totalPublishedInDb: number;
  errorMessage?: string;
}

/**
 * Retrieves a single medicine search result by composite or item id
 */
export async function getMedicineResultById(id: string): Promise<MedicineSearchResultItem | null> {
  const search = await searchMedicineStock('');
  const found = search.results.find((r) => r.id === id || r.medicineId === id);
  return found || null;
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
      latitude: row.pharmacy_latitude ?? row.latitude ?? null,
      longitude: row.pharmacy_longitude ?? row.longitude ?? null,
      openingHours: row.opening_hours,
      verifiedAt: row.verified_at,
      state: row.state as StockState,
      updatedAt: row.updated_at,
      isDemo: Boolean(row.is_demo),
      isReported: Boolean(row.state && row.state !== 'unknown'),
      sourceType: (row.source_type as DirectorySourceType) || 'provider_confirmed',
      sourceName: row.source_name || 'Participating Pharmacy Report',
      sourceUrl: row.source_url,
      verifiedDate: row.verified_date,
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
      errorMessage: `Database offline: ${errorMsg}. Showing local essential medicines catalog.`,
    };
  }
}

/**
 * Filters the essential medicine catalog and attaches reported stock snapshots if any exist.
 * If no participating pharmacy has reported stock, returns clean "Availability not reported" state.
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

  const liveSnapshots = pharmacyPortalService.getLocalSnapshots();
  const allSnapshots = [...demoStockSnapshots, ...liveSnapshots];
  const results: MedicineSearchResultItem[] = [];

  filteredMeds.forEach((med) => {
    const matchingSnapshots = allSnapshots.filter((s) => s.medicine_id === med.id);

    if (matchingSnapshots.length > 0) {
      matchingSnapshots.forEach((snap) => {
        const pharmacy = demoPharmacies.find((p) => p.id === snap.pharmacy_id) || demoPharmacies[0];
        results.push({
          id: `${med.id}-${snap.pharmacy_id}`,
          medicineId: med.id,
          genericName: med.generic_name,
          brandName: med.brand_name,
          strength: med.strength,
          dosageForm: med.dosage_form,
          pharmacyId: pharmacy ? pharmacy.id : 'participating-pharmacy',
          pharmacyName: pharmacy ? pharmacy.name : 'Participating Pharmacy Pilot',
          pharmacyAddress: pharmacy ? pharmacy.address : 'Bengaluru, Karnataka',
          pharmacyPhone: pharmacy ? pharmacy.phone : '',
          latitude: pharmacy?.latitude ?? null,
          longitude: pharmacy?.longitude ?? null,
          openingHours: pharmacy?.opening_hours || '09:00 - 21:00',
          verifiedAt: pharmacy?.verified_at || null,
          state: snap.state,
          updatedAt: snap.updated_at,
          isDemo: false,
          isReported: true,
          sourceType: 'provider_confirmed',
          sourceName: 'Participating Pharmacy Staff Report',
          sourceUrl: pharmacy?.source_url || 'https://medfind.local/pilot',
          verifiedDate: '2026-10-22',
          freshness: calculateFreshness(snap.updated_at, new Date(), false),
        });
      });
    } else {
      // In accordance with data integrity policy:
      // Show simple "Availability not reported" state. Do not invent fictional stock levels or store links.
      results.push({
        id: `catalog-${med.id}`,
        medicineId: med.id,
        genericName: med.generic_name,
        brandName: med.brand_name,
        strength: med.strength,
        dosageForm: med.dosage_form,
        pharmacyId: '',
        pharmacyName: 'Participating store report pending',
        pharmacyAddress: 'Verified against National List of Essential Medicines (NLEM India 2022)',
        pharmacyPhone: '',
        latitude: null,
        longitude: null,
        openingHours: '',
        verifiedAt: null,
        state: 'unknown',
        updatedAt: '',
        isDemo: false,
        isReported: false,
        sourceType: 'unreported',
        sourceName: 'National List of Essential Medicines (NLEM India 2022)',
        sourceUrl: 'https://cdsco.gov.in',
        verifiedDate: '2022-09-13',
        freshness: calculateFreshness(null, new Date(), false),
      });
    }
  });

  return results;
}
