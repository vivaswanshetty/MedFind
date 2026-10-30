/**
 * Core Data Models for MedFind
 * Derived directly from PRD.docx Section 7 and Tech Stack.docx Section 4.
 */

export type StockState = 'available' | 'low_stock' | 'unavailable' | 'unknown';

export type FreshnessState = 'recent' | 'aging' | 'stale' | 'unknown';

export type DataSourceType = 'database' | 'demo';

export type ProviderType = 'hospital' | 'clinic' | 'ambulance';

export type UserRole = 'public' | 'pharmacy_staff' | 'admin';

export interface Medicine {
  id: string;
  generic_name: string;
  brand_name: string;
  strength?: string;
  dosage_form?: string; // e.g., 'Tablet', 'Syrup', 'Capsule', 'Inhaler', 'Drops', 'Cream', 'Injection'
  searchable_aliases: string[];
  created_at: string;
  expiry_date?: string; // e.g. "11/2027" or "Nov 2027"
  batch_no?: string; // e.g. "MF-2025/B902"
  image_3d_type?: 'tablet' | 'capsule' | 'syrup' | 'inhaler' | 'drops' | 'cream' | 'injection';
  primary_color?: string;
  secondary_color?: string;
  mrp?: string;
  manufacturer?: string;
  schedule?: string; // e.g. "OTC" or "Rx - Schedule H"
  indications?: string[];
}

export type DirectorySourceType = 'public_directory' | 'provider_confirmed';

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  participation_status: 'participating' | 'pending_review' | 'inactive';
  verified_at: string | null;
  opening_hours?: string;
  source_type?: DirectorySourceType;
  source_url?: string;
  verified_date?: string;
  is_demo?: boolean;
}

export interface StockSnapshot {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  state: StockState;
  updated_at: string; // ISO 8601 string
  updated_by: string; // user id or system updater
  note?: string;
  is_demo?: boolean;
}

export interface ProviderListing {
  id: string;
  type: ProviderType;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  services: string[];
  source: string;
  source_url?: string;
  source_type?: DirectorySourceType;
  verified_date?: string;
  reviewed_at: string;
  is_demo?: boolean;
  distanceKm?: number;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  pharmacy_id?: string | null; // Set if role is pharmacy_staff
  consent_flags: Record<string, boolean>;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  occurred_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * UI View Model combining a pharmacy with its latest stock snapshot and evaluated freshness
 */
export interface PharmacyStockResult {
  pharmacy: Pharmacy;
  medicine: Medicine;
  snapshot: StockSnapshot;
  freshness: FreshnessState;
  freshnessLabel: string;
  formattedUpdateTime: string;
  distanceKm?: number;
}
