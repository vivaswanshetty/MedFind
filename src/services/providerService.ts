/**
 * Provider Directory Service for MedFind
 * 
 * Queries Supabase `provider_listings` for reviewed hospitals, clinics, and ambulance contacts.
 * 
 * Safety & Directory Invariants:
 * 1. Zero claims of live hospital bed capacity, emergency room wait times, or ambulance dispatch.
 * 2. Does not request location permission or compute unverified distances.
 * 3. Never blends database and demo listings in one result list.
 * 4. Falls back cleanly to `demoProviderListings` if Supabase is unconfigured, unreachable, or empty.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { ProviderListing, ProviderType, DataSourceType } from '../types/models';
import { demoProviderListings } from '../data/demoData';

export interface ProviderDirectoryResponse {
  dataSource: DataSourceType;
  results: ProviderListing[];
  errorMessage?: string;
}

export type CategoryFilter = 'all' | ProviderType;

/**
 * Fetches provider directory listings with category and search query filters.
 */
export async function getProviderListings(
  category: CategoryFilter = 'all',
  searchQuery: string = ''
): Promise<ProviderDirectoryResponse> {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Case 1: Supabase client unconfigured -> pure demo fallback
  if (!isSupabaseConfigured || !supabase) {
    return {
      dataSource: 'demo',
      results: getFilteredDemoProviders(category, normalizedQuery),
    };
  }

  try {
    let query = supabase
      .from('provider_listings')
      .select('*')
      .order('name', { ascending: true });

    if (category !== 'all') {
      query = query.eq('type', category);
    }

    if (normalizedQuery) {
      const term = `%${normalizedQuery}%`;
      query = query.or(`name.ilike.${term},address.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase provider_listings query failed:', error.message);
      return {
        dataSource: 'demo',
        results: getFilteredDemoProviders(category, normalizedQuery),
        errorMessage: `Database query failed: ${error.message}. Showing simulated demo baseline.`,
      };
    }

    // Case 2: Database has 0 records matching the category or table is empty
    if (!data || data.length === 0) {
      // Check if table overall has records
      const { count } = await supabase
        .from('provider_listings')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        // Table itself has no records -> fallback to demo data
        return {
          dataSource: 'demo',
          results: getFilteredDemoProviders(category, normalizedQuery),
        };
      }

      // Table has records, but this specific query yielded 0 matches
      return {
        dataSource: 'database',
        results: [],
      };
    }

    // Case 3: Return pure database records
    return {
      dataSource: 'database',
      results: data as ProviderListing[],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Unexpected error in getProviderListings:', errorMsg);
    return {
      dataSource: 'demo',
      results: getFilteredDemoProviders(category, normalizedQuery),
      errorMessage: `Connection error: ${errorMsg}. Showing simulated demo baseline.`,
    };
  }
}

/**
 * Filter fictional demo listings in memory
 */
function getFilteredDemoProviders(
  category: CategoryFilter,
  normalizedQuery: string
): ProviderListing[] {
  return demoProviderListings.filter((prov) => {
    const matchesCategory = category === 'all' || prov.type === category;
    const matchesQuery =
      normalizedQuery === '' ||
      prov.name.toLowerCase().includes(normalizedQuery) ||
      prov.address.toLowerCase().includes(normalizedQuery) ||
      prov.services.some((s) => s.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesQuery;
  });
}
