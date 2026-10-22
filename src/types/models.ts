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
  dosage_form?: string; // e.g., 'Tablet', 'Syrup', 'Capsule', 'Inhaler'
  searchable_aliases: string[];
  created_at: string;
}

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
  reviewed_at: string;
  is_demo?: boolean;
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
