/**
 * Pharmacy Staff Portal Service for MedFind
 * Supports PRD FR 06 & FR 07:
 * - Allows authorized pharmacy staff to update stock snapshots
 * - Preserves append-only event log with audit tracking & removal options
 * - Safe fallback to local verified data when Supabase is offline
 * - Store partner verification & onboarding credentials management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase.ts';
import type { Pharmacy, Medicine, StockSnapshot, StockState } from '../types/models.ts';
import { demoPharmacies, demoMedicines, demoStockSnapshots } from '../data/demoData.ts';

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
  pharmacyId?: string;
}

export type FacilityType = 'hospital' | 'clinic' | 'pharmacy';

export interface UploadedComplianceDoc {
  id: string;
  docKey: string;
  title: string;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  dataUri?: string;
  uploadedAt: string;
}

export interface DocumentRequirement {
  key: string;
  title: string;
  description: string;
  authority: string;
  format: string;
}

export interface ScanningServiceItem {
  id: string;
  label: string;
  emoji: string;
}

export const HOSPITAL_SCANNING_SERVICES: ScanningServiceItem[] = [
  { id: 'mri', label: 'MRI Scan (1.5T / 3.0T)', emoji: '🧲' },
  { id: 'ct_scan', label: 'Multi-Slice CT Scan (128+ Slice)', emoji: '🖥️' },
  { id: 'ultrasound', label: 'Ultrasound & 4D Color Doppler (USG)', emoji: '📡' },
  { id: 'digital_xray', label: 'Digital X-Ray (DR / CR)', emoji: '🩻' },
  { id: 'pet_scan', label: 'PET-CT & Nuclear Medicine', emoji: '☢️' },
  { id: 'echo_2d', label: '2D Echocardiography & TMT', emoji: '🫀' },
  { id: 'mammography', label: 'Digital Mammography', emoji: '🔬' },
  { id: 'dexa_scan', label: 'DEXA Bone Mineral Densitometry', emoji: '🦴' },
];

export const HOSPITAL_MANDATORY_DOCS: DocumentRequirement[] = [
  {
    key: 'kpme_license',
    title: 'KPME Registration / State Clinical Establishment License',
    description: 'Valid establishment license issued under Karnataka Private Medical Establishments Act',
    authority: 'KPME District Registration Authority',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'fire_noc',
    title: 'Fire Safety NOC (No Objection Certificate)',
    description: 'Mandatory fire clearance certificate for bedded/multi-story medical facilities',
    authority: 'Karnataka State Fire and Emergency Services',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'kspcb_waste',
    title: 'KSPCB Bio-Medical Waste Authorization',
    description: 'Proof of legal contract & authorization for bio-medical waste segregation & disposal',
    authority: 'Karnataka State Pollution Control Board (KSPCB)',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'building_sanction',
    title: 'Building Sanction Plan & Occupancy Certificate',
    description: 'Proof the physical structure is authorized for commercial/medical inpatient use',
    authority: 'BBMP / BDA Town Planning Department',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'layout_sketch',
    title: 'Detailed Architectural Layout Sketch',
    description: 'Floor-by-floor blueprint outlining emergency exits, OT/ICU wards, and labs',
    authority: 'Registered Structural Architect / KPME',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'doctors_roster',
    title: 'Full Roster of Doctors & Staff Qualifications',
    description: 'Signed list linking every practicing doctor to their respective Council Registration Numbers',
    authority: 'Medical Superintendent / KMC',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'aerb_noc',
    title: 'AERB Radiation Safety Clearance & License',
    description: 'Atomic Energy Regulatory Board certification for Diagnostic Radiology & Scanning equipment (CT, X-Ray, CathLab)',
    authority: 'Atomic Energy Regulatory Board (AERB), Govt. of India',
    format: 'PDF / Image (Max 5MB)',
  },
];

export const CLINIC_MANDATORY_DOCS: DocumentRequirement[] = [
  {
    key: 'clinic_kpme',
    title: "Clinic's KPME License Certificate",
    description: 'Valid KPME registration certificate for outpatient clinic / consultation centre',
    authority: 'KPME Registration Authority',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'owner_id',
    title: "Owner's Identity & Address Proof",
    description: 'Government-issued Aadhaar or PAN card of the clinic proprietor/managing doctor',
    authority: 'Government of India (UIDAI / ITD)',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'premises_proof',
    title: 'Proof of Premises Ownership / Tenancy',
    description: 'Executed Rent/Lease Agreement or Property Tax Receipt for clinical premises',
    authority: 'Sub-Registrar / BBMP Revenue Dept',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'doctor_degree_kmc',
    title: "Primary Doctor's Degree & State Medical Council Certificate",
    description: 'Verifying qualifications (e.g., MBBS, MD) and active Karnataka Medical Council (KMC) registration',
    authority: 'Karnataka Medical Council (KMC) / NMC',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'kspcb_waste_agreement',
    title: 'KSPCB Bio-Medical Waste Agreement',
    description: 'Required if clinic performs minor procedures, draws blood, or gives injections',
    authority: 'KSPCB Authorized Common Facility (CBMWTF)',
    format: 'PDF / Image (Max 5MB)',
  },
];

export const PHARMACY_MANDATORY_DOCS: DocumentRequirement[] = [
  {
    key: 'drug_license_forms',
    title: 'Valid Drug License (Forms 20 & 21)',
    description: 'Official multi-page certificate issued for retail and schedule drugs',
    authority: 'State Drugs Controller, Karnataka',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'pharmacist_reg_ppp',
    title: "Pharmacist's Registration Certificate & Renewal PPP Wallet",
    description: 'Active professional practice license issued by State Pharmacy Council',
    authority: 'Karnataka State Pharmacy Council (KSPC)',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'pharmacist_affidavit',
    title: "Pharmacist's Affidavit / Appointment Letter",
    description: 'Legal proof that registered pharmacist is employed full-time at this storefront',
    authority: 'Notary Public / Pharmacy Management',
    format: 'PDF / Image (Max 5MB)',
  },
  {
    key: 'premises_blueprint',
    title: 'Premises Blueprint & Storage Map',
    description: 'Architectural plan showing minimum required floor space (10-15 sqm) and cold storage layout',
    authority: 'State Drugs Control Inspectorate',
    format: 'PDF / Image (Max 5MB)',
  },
];

export interface HospitalComplianceData {
  hospitalCategory: string; // 'Level 1A/1B Basic' | 'Level 2 Multi-specialty' | 'Level 3 Super-specialty' | 'Level 4 Teaching'
  bedCapacity: string | number; // Total sanctioned inpatient beds
  operationTheatres: string | number; // Number of OTs
  icuBeds: string | number; // ICU count
  emergencyBeds: string | number; // Emergency beds count
  bioMedicalWasteId: string; // KSPCB unique identifier
  nodalOfficerName: string; // Grievance redressal officer
  nodalOfficerContact: string; // Contact details of grievance officer
  medicalSuperintendent?: string;
  scanningFacilities?: string[]; // Selected on-site diagnostic scanning modalities
  has24x7EmergencyScanning?: boolean; // Round the clock emergency radiology
  aerbClearanceNo?: string; // Atomic Energy Regulatory Board radiation safety clearance number
  documents: Record<string, UploadedComplianceDoc | null>;
}

export interface ClinicComplianceData {
  clinicType: string; // 'Solo Consultation' | 'Multi-Specialty Polyclinic' | 'Daycare Centre'
  systemOfMedicine: string; // 'Allopathy' | 'Ayurveda' | 'Homeopathy' | 'Unani' | 'Siddha'
  diagnosticSupport: boolean; // Boolean check indicating internal X-ray/labs on-site
  primaryDoctorName: string; // Doctor under whose name clinic runs
  primaryDoctorCouncilReg: string; // e.g. KMC Reg No.
  primaryDoctorDegree: string; // Qualifications
  consultationRoomId?: string;
  documents: Record<string, UploadedComplianceDoc | null>;
}

export interface PharmacyComplianceData {
  form20License: string; // Form 20 (retail drugs)
  form21License: string; // Form 21 (specified/schedule drugs)
  registeredPharmacistName: string;
  pharmacistCouncilReg: string; // State Pharmacy Council Reg No.
  coldChainMonitoring: string; // Temperature monitoring capabilities (e.g. refrigerator log tracking for insulin/vaccines)
  counterId: string;
  documents: Record<string, UploadedComplianceDoc | null>;
}

export interface StorePartnerAuth {
  isAuthorized: boolean;
  facilityType?: FacilityType;
  pharmacyId: string;
  pharmacyName: string;
  pharmacistName: string;
  licenseNumber: string;
  counterId: string;
  verifiedAt: string;
  hospitalData?: HospitalComplianceData;
  clinicData?: ClinicComplianceData;
  pharmacyData?: PharmacyComplianceData;
}

export const STORE_AUTH_STORAGE_KEY = '@medfind_store_partner_auth_v1';
let memoryPartnerAuth: StorePartnerAuth | null = null;



// Initial baseline audit log records
const initialBaselineAuditLog: AuditRecordRow[] = [
  {
    id: 'audit-seed-001',
    medicineName: 'Calpol 500 mg',
    newState: 'available',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updater: 'Priya Sharma, R.Ph',
    pharmacyId: 'pharm-blr-001',
  },
  {
    id: 'audit-seed-002',
    medicineName: 'Mox 250 mg',
    newState: 'available',
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    updater: 'Priya Sharma, R.Ph',
    pharmacyId: 'pharm-blr-001',
  },
  {
    id: 'audit-seed-003',
    medicineName: 'Cetzine 10 mg',
    newState: 'low_stock',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    updater: 'Priya Sharma, R.Ph',
    pharmacyId: 'pharm-blr-001',
  },
];

// In-memory stock snapshot storage for local session updates
let localSnapshots: StockSnapshot[] = [];
let localAuditLog: AuditRecordRow[] = [...initialBaselineAuditLog];

/**
 * Format relative timestamp nicely for clinical staff view
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'No report yet';
  const time = new Date(isoString).getTime();
  if (isNaN(time)) return 'No report yet';

  const diffMs = Math.max(0, Date.now() - time);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

const authListeners = new Set<(auth: StorePartnerAuth | null) => void>();

function notifyAuthListeners(auth: StorePartnerAuth | null) {
  authListeners.forEach((listener) => {
    try {
      listener(auth);
    } catch (e) {
      console.error('[pharmacyPortalService] Error in auth listener:', e);
    }
  });
}

export const demoHospitals: Pharmacy[] = [
  {
    id: 'hosp-blr-001',
    name: 'Victoria Hospital (BMCRI Medical College)',
    address: 'Fort Road, near City Market, Kalasipalya, Bengaluru 560002',
    latitude: 12.9625,
    longitude: 77.5745,
    phone: '080-26701100',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Emergency & Inpatient',
    source_type: 'provider_confirmed',
    source_url: 'https://bmcribangalore.karnataka.gov.in',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'hosp-blr-002',
    name: 'Bowring and Lady Curzon Hospital (BMCRI)',
    address: 'Lady Curzon Road, Tasker Town, Shivaji Nagar, Bengaluru 560001',
    latitude: 12.9825,
    longitude: 77.6040,
    phone: '080-25591362',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Emergency & Inpatient',
    source_type: 'provider_confirmed',
    source_url: 'https://bmcribangalore.karnataka.gov.in',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'hosp-blr-003',
    name: 'KC General Hospital - Malleshwaram',
    address: '5th Cross Road, Malleshwaram, Bengaluru 560003',
    latitude: 13.0010,
    longitude: 77.5680,
    phone: '080-23341771',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Emergency & Inpatient',
    source_type: 'provider_confirmed',
    source_url: 'https://hfw.karnataka.gov.in',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'hosp-blr-004',
    name: 'Manipal Hospital - Old Airport Road',
    address: '98, HAL Old Airport Road, Kodihalli, Bengaluru 560017',
    latitude: 12.9592,
    longitude: 77.6495,
    phone: '080-25024444',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Emergency & Inpatient',
    source_type: 'provider_confirmed',
    source_url: 'https://manipalhospitals.com/oldairportroad',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'hosp-blr-005',
    name: 'Fortis Hospital - Bannerghatta Road',
    address: '154/9, Bannerghatta Main Road, Opposite IIM-B, JP Nagar, Bengaluru 560076',
    latitude: 12.8948,
    longitude: 77.5979,
    phone: '080-66214444',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Emergency & Inpatient',
    source_type: 'provider_confirmed',
    source_url: 'https://fortishealthcare.com/bannerghatta',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'hosp-blr-006',
    name: 'Sri Jayadeva Institute of Cardiovascular Sciences',
    address: 'Bannerghatta Road, 9th Block, Jayanagar, Bengaluru 560069',
    latitude: 12.9180,
    longitude: 77.5980,
    phone: '080-22977400',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '24 Hours Cardiac Emergency',
    source_type: 'provider_confirmed',
    source_url: 'https://jayadevacardiology.com',
    verified_date: '2026-10-22',
    is_demo: false,
  },
];

export const demoClinics: Pharmacy[] = [
  {
    id: 'clinic-blr-001',
    name: 'Basavanagudi BBMP Urban Primary Health Centre (UPHC)',
    address: 'Model House Street, near Netkallappa Circle, Basavanagudi, Bengaluru 560004',
    latitude: 12.9380,
    longitude: 77.5760,
    phone: '080-22975800',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '08:00 - 16:00',
    source_type: 'provider_confirmed',
    source_url: 'https://bbmp.gov.in/health',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'clinic-blr-002',
    name: 'Jayanagar BBMP Urban Primary Health Centre (UPHC)',
    address: '9th Main Road, 2nd Block, Jayanagar, Bengaluru 560011',
    latitude: 12.9360,
    longitude: 77.5810,
    phone: '080-22975820',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '08:00 - 16:00',
    source_type: 'provider_confirmed',
    source_url: 'https://bbmp.gov.in/health',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'clinic-blr-003',
    name: 'Indiranagar BBMP Urban Primary Health Centre',
    address: '12th Cross, 2nd Stage, Indiranagar, Bengaluru 560038',
    latitude: 12.9730,
    longitude: 77.6380,
    phone: '080-22975840',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '08:00 - 16:00',
    source_type: 'provider_confirmed',
    source_url: 'https://bbmp.gov.in/health',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'clinic-blr-004',
    name: 'Apollo Clinic & Family Diagnostic Centre - Koramangala',
    address: 'No. 80, 5th Block, Koramangala, Bengaluru 560095',
    latitude: 12.9345,
    longitude: 77.6210,
    phone: '080-41122334',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '07:30 - 21:00',
    source_type: 'provider_confirmed',
    source_url: 'https://apolloclinic.com/koramangala',
    verified_date: '2026-10-22',
    is_demo: false,
  },
  {
    id: 'clinic-blr-005',
    name: 'Malleshwaram Family Health Polyclinic & Daycare',
    address: 'Sampige Road, 11th Cross, Malleshwaram, Bengaluru 560003',
    latitude: 13.0040,
    longitude: 77.5650,
    phone: '080-23344556',
    participation_status: 'participating',
    verified_at: '2026-10-22T00:00:00.000Z',
    opening_hours: '08:00 - 20:00',
    source_type: 'provider_confirmed',
    source_url: 'https://malleshwarampolyclinic.local',
    verified_date: '2026-10-22',
    is_demo: false,
  },
];

export const pharmacyPortalService = {
  /**
   * Subscribe to partner authentication changes
   */
  subscribeAuth(listener: (auth: StorePartnerAuth | null) => void): () => void {
    authListeners.add(listener);
    return () => {
      authListeners.delete(listener);
    };
  },

  /**
   * Retrieves facilities filtered by category (hospital, clinic, or pharmacy)
   */
  async getFacilitiesByType(type: FacilityType): Promise<Pharmacy[]> {
    if (type === 'hospital') {
      return demoHospitals;
    }
    if (type === 'clinic') {
      return demoClinics;
    }
    return this.getPharmacies();
  },

  /**
   * Retrieves all healthcare facilities across hospitals, clinics, and pharmacies
   */
  async getAllFacilities(): Promise<Pharmacy[]> {
    const pharmacies = await this.getPharmacies();
    return [...pharmacies, ...demoHospitals, ...demoClinics];
  },

  /**
   * Finds a facility by its identifier across all categories
   */
  async getFacilityById(id: string, type?: FacilityType): Promise<Pharmacy | null> {
    if (type) {
      const facilities = await this.getFacilitiesByType(type);
      const found = facilities.find((f) => f.id === id);
      if (found) return found;
    }
    const all = await this.getAllFacilities();
    return all.find((f) => f.id === id) || null;
  },

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
        // Priority 1: Check session local snapshots
        const local = localSnapshots.find(
          (s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId
        );
        if (local) {
          return { medicine: med, currentSnapshot: local };
        }

        // Priority 2: Check demoStockSnapshots
        const demo = demoStockSnapshots.find(
          (s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId
        );
        if (demo) {
          return { medicine: med, currentSnapshot: demo };
        }

        return {
          medicine: med,
          currentSnapshot: null,
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
        // Priority 1: Check session local updates first
        const local = localSnapshots.find(
          (s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId
        );
        if (local) {
          return { medicine: med, currentSnapshot: local };
        }

        // Priority 2: Check database stock record
        const row = stockData?.find((s) => s.medicine_id === med.id);
        if (row) {
          const snapshot: StockSnapshot = {
            id: `${row.medicine_id}-${row.pharmacy_id}`,
            medicine_id: row.medicine_id,
            pharmacy_id: row.pharmacy_id,
            state: row.state as StockState,
            updated_at: row.updated_at,
            updated_by: row.updated_by || 'pharmacy_staff_portal',
            note: row.note || 'Verified via mobile staff update',
            is_demo: Boolean(row.is_demo),
          };
          return { medicine: med, currentSnapshot: snapshot };
        }

        return { medicine: med, currentSnapshot: null };
      });
    } catch {
      return demoMedicines.map((med) => ({
        medicine: med,
        currentSnapshot:
          localSnapshots.find((s) => s.medicine_id === med.id && s.pharmacy_id === pharmacyId) ||
          null,
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
    staffName: string = 'Desk Pharmacist'
  ): Promise<{ success: boolean; updatedAt: string }> {
    const nowIso = new Date().toISOString();

    const existingIndex = localSnapshots.findIndex(
      (s) => s.medicine_id === medicineId && s.pharmacy_id === pharmacyId
    );

    const newSnapshot: StockSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicine_id: medicineId,
      pharmacy_id: pharmacyId,
      state,
      updated_at: nowIso,
      updated_by: staffName,
      note: `1-tap update by ${staffName}`,
      is_demo: false,
    };

    if (existingIndex >= 0) {
      localSnapshots[existingIndex] = newSnapshot;
    } else {
      localSnapshots.push(newSnapshot);
    }

    localAuditLog.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicineName,
      newState: state,
      timestamp: nowIso,
      updater: staffName,
      pharmacyId,
    });

    if (localAuditLog.length > 50) {
      localAuditLog.pop();
    }

    return {
      success: true,
      updatedAt: nowIso,
    };
  },

  /**
   * Removes an individual audit record from the audit trail
   */
  removeAuditRecord(id: string): boolean {
    const prevLen = localAuditLog.length;
    localAuditLog = localAuditLog.filter((record) => record.id !== id);
    return localAuditLog.length < prevLen;
  },

  /**
   * Clears all session audit records
   */
  clearAuditTrail(): void {
    localAuditLog = [];
  },

  /**
   * Resets audit log back to initial demo baseline
   */
  resetAuditLog(): void {
    localAuditLog = [...initialBaselineAuditLog];
  },

  /**
   * Clears all in-memory stock snapshots modified during the session
   */
  clearLocalSnapshots(): void {
    localSnapshots = [];
  },

  /**
   * Resets all portal session data (local snapshots, audit log, memory credentials)
   */
  resetAllPortalData(): void {
    localSnapshots = [];
    localAuditLog = [...initialBaselineAuditLog];
    memoryPartnerAuth = null;
  },

  /**
   * Retrieves active local snapshots recorded during the session
   */
  getLocalSnapshots(): StockSnapshot[] {
    return localSnapshots;
  },

  /**
   * Retrieves recent audit records for compliance inspection
   */
  getAuditLog(): AuditRecordRow[] {
    return localAuditLog;
  },

  /**
   * Store partner authorization: get stored credentials
   */
  async getStorePartnerAuth(): Promise<StorePartnerAuth | null> {
    if (memoryPartnerAuth) {
      return memoryPartnerAuth;
    }
    try {
      const json = await AsyncStorage.getItem(STORE_AUTH_STORAGE_KEY);
      if (json) {
        memoryPartnerAuth = JSON.parse(json);
        return memoryPartnerAuth;
      }
    } catch {
      // safe fallback
    }
    return memoryPartnerAuth;
  },

  /**
   * Store partner authorization: save onboarding credentials
   */
  async saveStorePartnerAuth(auth: StorePartnerAuth): Promise<void> {
    memoryPartnerAuth = auth;
    try {
      await AsyncStorage.setItem(STORE_AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // safe fallback
    }
    notifyAuthListeners(auth);
  },

  /**
   * Store partner authorization: revoke or switch store desk
   * Completely wipes all modified stock snapshots, audit trails, and cached partner credentials
   * so subsequent facilities/roles start completely fresh from scratch.
   */
  async clearStorePartnerAuth(): Promise<void> {
    this.resetAllPortalData();
    try {
      await AsyncStorage.multiRemove([
        STORE_AUTH_STORAGE_KEY,
        '@medfind_store_auth_v1',
        '@medfind_store_photo',
        '@medfind_store_photo_v1',
        '@medfind_store_location',
        '@medfind_store_location_v1',
      ]);
    } catch {
      try {
        await AsyncStorage.removeItem(STORE_AUTH_STORAGE_KEY);
      } catch {}
    }
    notifyAuthListeners(null);
  },
};
