/**
 * Fictional Demo Dataset for MedFind Academic Evaluation
 * 
 * STRICT COMPLIANCE BOUNDARIES:
 * - Every record is explicitly marked `is_demo: true`.
 * - All provider names, addresses, and contacts are 100% fictional.
 * - Phone numbers are non-routable synthetic test strings.
 * - Absolutely NO clickable call actions are enabled.
 * - Does NOT imply real-world participation, actual stock, or live hospital capacity.
 */

import { Medicine, Pharmacy, StockSnapshot, ProviderListing } from '../types/models';

export const DEMO_DATA_DISCLAIMER = 
  'SIMULATED DATA: All records below are fictional placeholders created exclusively for academic demonstration and BMSCE review. ' +
  'No real-world pharmacy participation, inventory levels, hospital capacities, or active contact numbers are represented.';

export const demoMedicines: Medicine[] = [
  {
    id: 'med-demo-001',
    generic_name: 'Paracetamol',
    brand_name: 'Demo-Calpol',
    strength: '500 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['paracetamol', 'calpol', 'crocin', 'acetaminophen', 'fever'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-demo-002',
    generic_name: 'Amoxicillin',
    brand_name: 'Demo-Mox',
    strength: '250 mg',
    dosage_form: 'Capsule',
    searchable_aliases: ['amoxicillin', 'mox', 'antibiotic'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-demo-003',
    generic_name: 'Cetirizine',
    brand_name: 'Demo-Cetzine',
    strength: '10 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['cetirizine', 'cetzine', 'allergy'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-demo-004',
    generic_name: 'Salbutamol',
    brand_name: 'Demo-Asthalin',
    strength: '100 mcg',
    dosage_form: 'Inhaler',
    searchable_aliases: ['salbutamol', 'asthalin', 'inhaler', 'asthma'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-demo-005',
    generic_name: 'ORS Electrolyte',
    brand_name: 'Demo-Electral',
    strength: '21.8 g Sachet',
    dosage_form: 'Powder',
    searchable_aliases: ['ors', 'electral', 'rehydration', 'electrolyte'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
];

export const demoPharmacies: Pharmacy[] = [
  {
    id: 'pharm-demo-001',
    name: 'Demo Pharmacy Alpha (Fictional)',
    address: '101 Simulation Boulevard, Demo Block A, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0001 (Simulated Demo — Inactive Number)',
    participation_status: 'participating',
    verified_at: '2026-10-22T08:30:00.000Z',
    opening_hours: '08:00 - 22:00 (Simulated)',
    is_demo: true,
  },
  {
    id: 'pharm-demo-002',
    name: 'Demo Chemists Beta (Fictional)',
    address: '202 Mock Avenue, Demo Block B, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0002 (Simulated Demo — Inactive Number)',
    participation_status: 'participating',
    verified_at: '2026-10-22T07:15:00.000Z',
    opening_hours: '24 Hours (Simulated)',
    is_demo: true,
  },
  {
    id: 'pharm-demo-003',
    name: 'Demo Healthcare Store Gamma (Fictional)',
    address: '303 Synthetic Road, Demo Block C, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0003 (Simulated Demo — Inactive Number)',
    participation_status: 'participating',
    verified_at: '2026-10-22T06:00:00.000Z',
    opening_hours: '09:00 - 21:00 (Simulated)',
    is_demo: true,
  },
];

// Helper to construct ISO strings relative to now for predictable testing of all 4 freshness states
const nowMs = Date.now();
const getOffsetIso = (offsetMinutes: number) => new Date(nowMs - offsetMinutes * 60 * 1000).toISOString();

export const demoStockSnapshots: StockSnapshot[] = [
  // Pharmacy Alpha: Recent update (12 minutes ago)
  {
    id: 'snap-demo-001',
    pharmacy_id: 'pharm-demo-001',
    medicine_id: 'med-demo-001', // Paracetamol
    state: 'available',
    updated_at: getOffsetIso(12), // <= 30 min -> RECENT
    updated_by: 'staff-demo-alpha',
    note: 'Simulated test fixture record (12m offset)',
    is_demo: true,
  },
  // Pharmacy Beta: Aging update (45 minutes ago)
  {
    id: 'snap-demo-002',
    pharmacy_id: 'pharm-demo-002',
    medicine_id: 'med-demo-001', // Paracetamol
    state: 'low_stock',
    updated_at: getOffsetIso(45), // 30m - 2h -> AGING
    updated_by: 'staff-demo-beta',
    note: 'Simulated test fixture record (45m offset)',
    is_demo: true,
  },
  // Pharmacy Gamma: Stale update (180 minutes / 3 hours ago)
  {
    id: 'snap-demo-003',
    pharmacy_id: 'pharm-demo-003',
    medicine_id: 'med-demo-001', // Paracetamol
    state: 'available',
    updated_at: getOffsetIso(180), // > 2h -> STALE
    updated_by: 'staff-demo-gamma',
    note: 'Simulated test fixture record (180m offset)',
    is_demo: true,
  },
  // Pharmacy Alpha: Salbutamol Inhaler (Recent update)
  {
    id: 'snap-demo-004',
    pharmacy_id: 'pharm-demo-001',
    medicine_id: 'med-demo-004',
    state: 'available',
    updated_at: getOffsetIso(20),
    updated_by: 'staff-demo-alpha',
    note: 'Simulated test fixture record (20m offset)',
    is_demo: true,
  },
  // Pharmacy Beta: Amoxicillin (Unavailable)
  {
    id: 'snap-demo-005',
    pharmacy_id: 'pharm-demo-002',
    medicine_id: 'med-demo-002',
    state: 'unavailable',
    updated_at: getOffsetIso(15),
    updated_by: 'staff-demo-beta',
    note: 'Simulated test fixture record (unavailable)',
    is_demo: true,
  },
  // Cetirizine at Pharmacy Gamma: Unknown timestamp edge case
  {
    id: 'snap-demo-006',
    pharmacy_id: 'pharm-demo-003',
    medicine_id: 'med-demo-003',
    state: 'unknown',
    updated_at: '', // Missing timestamp -> UNKNOWN
    updated_by: 'system-demo-unverified',
    note: 'Simulated test fixture record (unverified timestamp)',
    is_demo: true,
  },
];

export const demoProviderListings: ProviderListing[] = [
  {
    id: 'prov-demo-001',
    type: 'hospital',
    name: 'Demo Memorial Hospital Casualty Listing [Fictional]',
    address: '500 Simulation Park Way, Sector D, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0991 [Demo - No Call Action]',
    services: ['24/7 Casualty Desk (Directory Listing)', 'General Emergency Information'],
    source: 'BMSCE Faculty Review Seed Fixture',
    reviewed_at: '2026-10-20T10:00:00.000Z',
    is_demo: true,
  },
  {
    id: 'prov-demo-002',
    type: 'clinic',
    name: 'Demo Urban Health Center Listing [Fictional]',
    address: '502 Academic Lane, Sector E, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0992 [Demo - No Call Action]',
    services: ['Primary Care Consultation (Directory Listing)', 'Immunization'],
    source: 'BMSCE Faculty Review Seed Fixture',
    reviewed_at: '2026-10-21T09:30:00.000Z',
    is_demo: true,
  },
  {
    id: 'prov-demo-003',
    type: 'ambulance',
    name: 'Demo Emergency Ambulance Directory Contact [Fictional]',
    address: 'South Zone Simulation Depot, Bengaluru [Fictional Location]',
    latitude: 0.0000,
    longitude: 0.0000,
    phone: '080-0000-0993 [Demo - No Call Action]',
    services: ['Directory Contact Reference Only (Zero Dispatch/Booking)'],
    source: 'BMSCE Faculty Review Seed Fixture',
    reviewed_at: '2026-10-21T11:00:00.000Z',
    is_demo: true,
  },
];
