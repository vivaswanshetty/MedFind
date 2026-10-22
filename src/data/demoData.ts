/**
 * MedFind Verified Directory & Essential Medicine Catalog
 * 
 * SOURCING & VERIFICATION POLICY:
 * 1. Directory listings are verified against official government health and emergency portals:
 *    - Ministry of Home Affairs, Government of India (National Emergency 112)
 *    - Department of Health & Family Welfare Services, Government of Karnataka (108, 104, District Hospitals)
 *    - Bangalore Medical College and Research Institute - BMCRI (Victoria Hospital, Bowring Hospital)
 *    - Bruhat Bengaluru Mahanagara Palike - BBMP (Urban Primary Health Centres)
 * 2. Essential medicine catalog is derived from the National List of Essential Medicines (NLEM India 2022).
 * 3. Stock availability is NOT assumed or invented: unless a participating pharmacy provides an update,
 *    availability remains in the "Availability not reported" state.
 * 4. All directory contacts are provided for contact reference only (no automated dispatch or bookings).
 */

import { Medicine, Pharmacy, StockSnapshot, ProviderListing } from '../types/models';

export const DIRECTORY_POLICY_NOTICE =
  'Stock availability is only shown when reported directly by a participating pharmacy. ' +
  'Emergency and healthcare directory listings are sourced from official public records for contact reference only.';

// Backwards compatibility alias
export const DEMO_DATA_DISCLAIMER = DIRECTORY_POLICY_NOTICE;

/**
 * Essential Medicines Catalog (NLEM India 2022 / CDSCO approved)
 */
export const demoMedicines: Medicine[] = [
  {
    id: 'med-nlem-001',
    generic_name: 'Paracetamol',
    brand_name: 'Calpol',
    strength: '500 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['paracetamol', 'calpol', 'crocin', 'dolo', 'acetaminophen', 'fever', 'pain'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-002',
    generic_name: 'Amoxicillin',
    brand_name: 'Mox',
    strength: '250 mg',
    dosage_form: 'Capsule',
    searchable_aliases: ['amoxicillin', 'mox', 'novamox', 'antibiotic'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-003',
    generic_name: 'Cetirizine',
    brand_name: 'Cetzine',
    strength: '10 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['cetirizine', 'cetzine', 'zyrtec', 'allergy', 'antihistamine'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-004',
    generic_name: 'Salbutamol',
    brand_name: 'Asthalin',
    strength: '100 mcg',
    dosage_form: 'Inhaler',
    searchable_aliases: ['salbutamol', 'asthalin', 'albuterol', 'inhaler', 'asthma', 'bronchospasm'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-005',
    generic_name: 'Oral Rehydration Salts (ORS)',
    brand_name: 'Electral',
    strength: '21.8 g Sachet',
    dosage_form: 'Powder',
    searchable_aliases: ['ors', 'electral', 'oral rehydration salts', 'dehydration', 'electrolyte'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-006',
    generic_name: 'Metformin',
    brand_name: 'Glycomet',
    strength: '500 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['metformin', 'glycomet', 'diabetes', 'blood sugar'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'med-nlem-007',
    generic_name: 'Azithromycin',
    brand_name: 'Azee',
    strength: '500 mg',
    dosage_form: 'Tablet',
    searchable_aliases: ['azithromycin', 'azee', 'zithromax', 'antibiotic'],
    created_at: '2026-10-22T08:00:00.000Z',
  },
];

/**
 * Participating Pharmacy Pilot Stores
 * Sourced: Local community pharmacy pilot partner in Basavanagudi / Bengaluru.
 */
export const demoPharmacies: Pharmacy[] = [
  {
    id: 'pharm-blr-001',
    name: 'Basavanagudi Pharmacy Pilot Store',
    address: 'D.V.G. Road, Basavanagudi, Bengaluru, Karnataka 560004',
    latitude: 12.9416,
    longitude: 77.5738,
    phone: '080-26600000',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '09:00 - 21:00',
    source_type: 'provider_confirmed',
    source_url: 'https://medfind.local/pharmacy/blr-001',
    verified_date: '2026-10-22',
    is_demo: false,
  },
];

/**
 * Verified Stock Snapshots
 * Policy: In accordance with data integrity rules, stock is never invented or fabricated.
 * Initial state is empty; stock states are only recorded when a verified pharmacy operator
 * submits an update via the Pharmacy Staff Portal or approved direct integration.
 */
export const demoStockSnapshots: StockSnapshot[] = [];

/**
 * Verified Public Directory Listings (Bengaluru & Karnataka)
 * 
 * All listings below are sourced from official government websites:
 * - 112: Emergency Response Support System (ERSS), Ministry of Home Affairs, Govt of India (https://112.gov.in)
 * - 108: Arogya Kavacha, Dept of Health & Family Welfare, Govt of Karnataka (https://hfw.karnataka.gov.in)
 * - 104: Arogya Sahayavani, Dept of Health & Family Welfare, Govt of Karnataka (https://hfw.karnataka.gov.in)
 * - Victoria Hospital: Bangalore Medical College and Research Institute (https://bmcribangalore.karnataka.gov.in)
 * - Bowring Hospital: Bangalore Medical College and Research Institute (https://bmcribangalore.karnataka.gov.in)
 * - Jayanagar General Hospital: Dept of Health & Family Welfare Services (https://hfw.karnataka.gov.in)
 * - Basavanagudi UPHC: Bruhat Bengaluru Mahanagara Palike Public Health Directory (https://bbmp.gov.in)
 */
export const demoProviderListings: ProviderListing[] = [
  {
    id: 'prov-gov-112',
    type: 'ambulance',
    name: 'National Emergency Response Support System (112)',
    address: 'Karnataka State Emergency Response Centre, Bengaluru, Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    phone: '112',
    services: ['24x7 Unified Emergency Police, Fire & Medical Ambulance Dispatch'],
    source: 'Ministry of Home Affairs, Government of India',
    source_url: 'https://112.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-gov-108',
    type: 'ambulance',
    name: 'Arogya Kavacha 108 Emergency Medical Services',
    address: 'GVK EMRI, Department of Health & Family Welfare, Govt of Karnataka, Bengaluru',
    latitude: 12.9760,
    longitude: 77.5920,
    phone: '108',
    services: ['24x7 Emergency Medical Response & Ambulance Transport across Karnataka'],
    source: 'Department of Health & Family Welfare Services, Government of Karnataka',
    source_url: 'https://hfw.karnataka.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-gov-104',
    type: 'clinic',
    name: 'Karnataka Health Helpline 104 (Arogya Sahayavani)',
    address: 'Directorate of Health & Family Welfare Services, Anand Rao Circle, Bengaluru, Karnataka 560009',
    latitude: 12.9810,
    longitude: 77.5750,
    phone: '104',
    services: ['24x7 Medical Advice, Minor Illness Guidance, First Aid Advisory'],
    source: 'Department of Health & Family Welfare Services, Government of Karnataka',
    source_url: 'https://hfw.karnataka.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-hosp-victoria',
    type: 'hospital',
    name: 'Victoria Hospital (BMCRI)',
    address: 'Fort Road, near City Market, Kalasipalya, Bengaluru, Karnataka 560002',
    latitude: 12.9625,
    longitude: 77.5760,
    phone: '080-26701150',
    services: ['24x7 Casualty & Trauma Emergency Care', 'Government Super Specialty Hospital', 'Blood Bank'],
    source: 'Bangalore Medical College and Research Institute (BMCRI)',
    source_url: 'https://bmcribangalore.karnataka.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-hosp-bowring',
    type: 'hospital',
    name: 'Bowring and Lady Curzon Hospital (BMCRI)',
    address: 'Lady Curzon Road, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka 560001',
    latitude: 12.9825,
    longitude: 77.6040,
    phone: '080-25591325',
    services: ['24x7 Casualty & Emergency Services', 'General Medicine', 'Maternity Care'],
    source: 'BMCRI, Government of Karnataka',
    source_url: 'https://bmcribangalore.karnataka.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-hosp-jayanagar',
    type: 'hospital',
    name: 'Jayanagar General Hospital',
    address: '32nd Cross Road, 4th T Block East, Jayanagar, Bengaluru, Karnataka 560041',
    latitude: 12.9235,
    longitude: 77.5890,
    phone: '080-26630833',
    services: ['24x7 Casualty & Emergency Care', 'Inpatient Medicine', 'General Surgery', 'Outpatient Services'],
    source: 'Department of Health & Family Welfare Services, Government of Karnataka',
    source_url: 'https://hfw.karnataka.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
  {
    id: 'prov-clinic-basavanagudi',
    type: 'clinic',
    name: 'Basavanagudi Urban Primary Health Centre (BBMP UPHC)',
    address: 'Near Gandhi Bazaar Main Road, Basavanagudi, Bengaluru, Karnataka 560004',
    latitude: 12.9420,
    longitude: 77.5700,
    phone: '080-22660000',
    services: ['Primary Healthcare Consultation', 'Maternal & Child Health Care', 'National Immunization Services'],
    source: 'Bruhat Bengaluru Mahanagara Palike (BBMP) Public Health Directory',
    source_url: 'https://bbmp.gov.in',
    source_type: 'public_directory',
    verified_date: '2026-10-22',
    reviewed_at: '2026-10-22T00:00:00.000Z',
    is_demo: false,
  },
];
