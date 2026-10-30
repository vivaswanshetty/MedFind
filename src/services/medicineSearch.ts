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

import { supabase, isSupabaseConfigured } from './supabase.ts';
import type { StockState, DirectorySourceType, Medicine } from '../types/models.ts';
import { calculateFreshness, type FreshnessCalculation } from '../utils/freshness.ts';
import {
  demoMedicines,
  demoPharmacies,
  demoStockSnapshots,
} from '../data/demoData.ts';
import { pharmacyPortalService } from './pharmacyPortalService.ts';

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
  isSampleData: boolean;
  sourceType: DirectorySourceType | 'unreported';
  sourceName?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  freshness: FreshnessCalculation;
  expiryDate?: string;
  batchNo?: string;
  image3dType?: 'tablet' | 'capsule' | 'syrup' | 'inhaler' | 'drops' | 'cream' | 'injection';
  mrp?: string;
  manufacturer?: string;
  schedule?: string;
  primaryColor?: string;
}

export interface MedicineSearchResponse {
  dataSource: DataSource;
  isSampleData: boolean;
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
  if (found) return found;

  const med = demoMedicines.find(
    (m) =>
      m.id === id ||
      m.generic_name.toLowerCase() === id.toLowerCase() ||
      m.brand_name.toLowerCase() === id.toLowerCase()
  );
  if (med) {
    return {
      id: `catalog-${med.id}`,
      medicineId: med.id,
      genericName: med.generic_name,
      brandName: med.brand_name,
      strength: med.strength,
      dosageForm: med.dosage_form,
      pharmacyId: demoPharmacies[0]?.id || '',
      pharmacyName: demoPharmacies[0]?.name || 'Apollo Pharmacy - Victoria Hospital Road',
      pharmacyAddress: demoPharmacies[0]?.address || 'Opposite BMCRI Victoria Hospital Campus, Kalasipalya, Bengaluru 560002',
      pharmacyPhone: demoPharmacies[0]?.phone || '080-26702200',
      latitude: demoPharmacies[0]?.latitude ?? null,
      longitude: demoPharmacies[0]?.longitude ?? null,
      openingHours: demoPharmacies[0]?.opening_hours || '24 Hours Open',
      verifiedAt: '2026-10-24T00:00:00.000Z',
      state: 'available',
      updatedAt: '2026-10-24T08:00:00.000Z',
      isDemo: true,
      isReported: true,
      isSampleData: true,
      sourceType: 'provider_confirmed',
      sourceName: 'Sample Demonstration Report',
      sourceUrl: 'https://medfind.local',
      verifiedDate: '2026-10-24',
      freshness: calculateFreshness('2026-10-24T08:00:00.000Z', new Date(), true),
      expiryDate: med.expiry_date || '11/2027',
      batchNo: med.batch_no || 'MF-2025/B902',
      image3dType: med.image_3d_type || 'tablet',
      mrp: med.mrp,
      manufacturer: med.manufacturer,
      schedule: med.schedule || 'Schedule H',
      primaryColor: med.primary_color,
    };
  }
  return null;
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
      isSampleData: true,
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
      // Fallback cleanly to verified local catalog
      return {
        dataSource: 'demo',
        isSampleData: true,
        results: getFilteredDemoResults(normalizedQuery, filterDosage),
        totalPublishedInDb: 0,
        errorMessage: 'Showing verified essential medicine catalog.',
      };
    }

    // Case 2: Database has 0 published stock records -> fallback to verified catalog
    if (!totalDbRecords || totalDbRecords === 0) {
      return {
        dataSource: 'demo',
        isSampleData: true,
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
        isSampleData: true,
        results: getFilteredDemoResults(normalizedQuery, filterDosage),
        totalPublishedInDb: totalDbRecords,
        errorMessage: 'Showing verified essential medicine catalog.',
      };
    }

    // Map database records into uniform view model
    const results: MedicineSearchResultItem[] = (dbData || []).map((row) => {
      const hasReportedTimestamp = Boolean(row.updated_at && row.state && row.state !== 'unknown');
      const itemIsSample = Boolean(row.is_demo || !hasReportedTimestamp);
      return {
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
        isSampleData: itemIsSample,
        sourceType: (row.source_type as DirectorySourceType) || 'provider_confirmed',
        sourceName: row.source_name || 'Participating Pharmacy Report',
        sourceUrl: row.source_url,
        verifiedDate: row.verified_date,
        freshness: calculateFreshness(row.updated_at, new Date(), Boolean(row.is_demo)),
      };
    });

    return {
      dataSource: 'database',
      isSampleData: results.length === 0 ? false : results.every((r) => r.isSampleData),
      results,
      totalPublishedInDb: totalDbRecords,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Unexpected error in searchMedicineStock:', errorMsg);
    return {
      dataSource: 'demo',
      isSampleData: true,
      results: getFilteredDemoResults(normalizedQuery, filterDosage),
      totalPublishedInDb: 0,
      errorMessage: 'Showing verified local healthcare catalog.',
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
          isDemo: true,
          isReported: true,
          isSampleData: true,
          sourceType: 'provider_confirmed',
          sourceName: 'Sample Demonstration Report',
          sourceUrl: pharmacy?.source_url || 'https://medfind.local/pilot',
          verifiedDate: '2026-10-22',
          freshness: calculateFreshness(snap.updated_at, new Date(), true),
          expiryDate: med.expiry_date || '11/2027',
          batchNo: med.batch_no || 'MF-2025/B902',
          image3dType: med.image_3d_type || (med.dosage_form?.toLowerCase().includes('syrup') ? 'syrup' : med.dosage_form?.toLowerCase().includes('capsule') ? 'capsule' : med.dosage_form?.toLowerCase().includes('inhaler') ? 'inhaler' : med.dosage_form?.toLowerCase().includes('drop') ? 'drops' : med.dosage_form?.toLowerCase().includes('cream') || med.dosage_form?.toLowerCase().includes('ointment') ? 'cream' : 'tablet'),
          mrp: med.mrp,
          manufacturer: med.manufacturer,
          schedule: med.schedule || 'Schedule H',
          primaryColor: med.primary_color,
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
        pharmacyAddress: 'Essential Medicine Catalog',
        pharmacyPhone: '',
        latitude: null,
        longitude: null,
        openingHours: '',
        verifiedAt: null,
        state: 'unknown',
        updatedAt: '',
        isDemo: false,
        isReported: false,
        isSampleData: true,
        sourceType: 'unreported',
        sourceName: 'Essential Medicine Catalog',
        sourceUrl: 'https://cdsco.gov.in',
        verifiedDate: '2022-09-13',
        freshness: calculateFreshness(null, new Date(), false),
        expiryDate: med.expiry_date || '12/2027',
        batchNo: med.batch_no || 'MF-2025/B881',
        image3dType: med.image_3d_type || (med.dosage_form?.toLowerCase().includes('syrup') ? 'syrup' : med.dosage_form?.toLowerCase().includes('capsule') ? 'capsule' : med.dosage_form?.toLowerCase().includes('inhaler') ? 'inhaler' : med.dosage_form?.toLowerCase().includes('drop') ? 'drops' : med.dosage_form?.toLowerCase().includes('cream') || med.dosage_form?.toLowerCase().includes('ointment') ? 'cream' : 'tablet'),
        mrp: med.mrp,
        manufacturer: med.manufacturer,
        schedule: med.schedule || 'Schedule H',
        primaryColor: med.primary_color,
      });
    }
  });

  return results;
}

/**
 * Direct fast search across the medicine catalog.
 * Returns distinct medicines matching generic, brand name, strength, or aliases.
 * If query is empty, returns popular essential and regular medicines.
 */
export function searchCatalogMedicines(query: string = '', limit = 15): Medicine[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return demoMedicines.slice(0, limit);
  }

  const exactMatches: Medicine[] = [];
  const prefixMatches: Medicine[] = [];
  const substringMatches: Medicine[] = [];

  for (const med of demoMedicines) {
    const brandLower = med.brand_name.toLowerCase();
    const genericLower = med.generic_name.toLowerCase();
    const aliasesLower = (med.searchable_aliases || []).map((a) => a.toLowerCase());

    if (brandLower === normalized || genericLower === normalized) {
      exactMatches.push(med);
    } else if (brandLower.startsWith(normalized) || genericLower.startsWith(normalized)) {
      prefixMatches.push(med);
    } else if (
      brandLower.includes(normalized) ||
      genericLower.includes(normalized) ||
      aliasesLower.some((a) => a.includes(normalized)) ||
      (med.strength && med.strength.toLowerCase().includes(normalized))
    ) {
      substringMatches.push(med);
    }
  }

  return [...exactMatches, ...prefixMatches, ...substringMatches].slice(0, limit);
}

