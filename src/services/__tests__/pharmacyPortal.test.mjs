import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pharmacyPortalService, formatRelativeTime } from '../pharmacyPortalService.ts';

describe('Pharmacy Portal Service Tests (PRD FR 06 & FR 07)', () => {
  it('Retrieves participating pharmacies list', async () => {
    const stores = await pharmacyPortalService.getPharmacies();
    assert.ok(Array.isArray(stores), 'Stores should be an array');
    assert.ok(stores.length > 0, 'Should return at least one participating store');
    assert.strictEqual(stores[0].participation_status, 'participating');
  });

  it('Retrieves store inventory with current stock snapshots', async () => {
    const stores = await pharmacyPortalService.getPharmacies();
    const store = stores[0];
    const inventory = await pharmacyPortalService.getInventory(store.id);

    assert.ok(Array.isArray(inventory), 'Inventory should be an array');
    assert.ok(inventory.length > 0, 'Inventory should contain medicines');
    assert.ok(inventory[0].medicine.brand_name, 'Medicine should have a brand name');
  });

  it('Performs rapid 1-tap stock update and generates append-only audit event', async () => {
    const stores = await pharmacyPortalService.getPharmacies();
    const store = stores[0];
    const inventory = await pharmacyPortalService.getInventory(store.id);
    const item = inventory[0];

    const result = await pharmacyPortalService.updateStock(
      store.id,
      item.medicine.id,
      item.medicine.brand_name,
      'low_stock',
      'Staff Tester'
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.updatedAt, 'Should include updated timestamp');

    // Verify audit log has recorded the event
    const auditLog = pharmacyPortalService.getAuditLog();
    assert.ok(auditLog.length > 0, 'Audit log should contain entries');
    const latest = auditLog[0];
    assert.strictEqual(latest.medicineName, item.medicine.brand_name);
    assert.strictEqual(latest.newState, 'low_stock');
    assert.strictEqual(latest.updater, 'Staff Tester');
  });

  it('Supports removing an individual entry from the audit trail', async () => {
    // Add a specific test record to ensure one is present
    await pharmacyPortalService.updateStock(
      'pharm-blr-001',
      'med-test-remove',
      'Test Medicine For Removal',
      'available',
      'Removal Tester'
    );

    const logBefore = pharmacyPortalService.getAuditLog();
    const target = logBefore[0];
    assert.strictEqual(target.medicineName, 'Test Medicine For Removal');

    // Remove the target record
    const removed = pharmacyPortalService.removeAuditRecord(target.id);
    assert.strictEqual(removed, true, 'Should return true when record is removed');

    const logAfter = pharmacyPortalService.getAuditLog();
    const found = logAfter.find((r) => r.id === target.id);
    assert.strictEqual(found, undefined, 'Target record should no longer exist in audit log');

    // Attempting to remove non-existent id returns false
    const removedNonExistent = pharmacyPortalService.removeAuditRecord('non-existent-id-xyz');
    assert.strictEqual(removedNonExistent, false, 'Should return false for non-existent id');
  });

  it('Supports clearing all records from the audit trail', async () => {
    // Ensure log is not empty
    await pharmacyPortalService.updateStock(
      'pharm-blr-001',
      'med-test-clear',
      'Clear Test Medicine',
      'unavailable',
      'Clear Tester'
    );

    assert.ok(pharmacyPortalService.getAuditLog().length > 0);

    pharmacyPortalService.clearAuditTrail();
    assert.strictEqual(pharmacyPortalService.getAuditLog().length, 0, 'Audit log should be empty after clear');
  });

  it('Formats relative timestamps cleanly', () => {
    assert.strictEqual(formatRelativeTime(null), 'No report yet');
    assert.strictEqual(formatRelativeTime(undefined), 'No report yet');
    assert.strictEqual(formatRelativeTime('invalid-date'), 'No report yet');

    const nowIso = new Date().toISOString();
    assert.strictEqual(formatRelativeTime(nowIso), 'Just now');

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeTime(tenMinsAgo), '10m ago');

    const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    assert.strictEqual(formatRelativeTime(twoHoursAgo), '2h ago');
  });

  it('Persists and clears store partner onboarding authorization', async () => {
    const authData = {
      isAuthorized: true,
      pharmacyId: 'pharm-blr-001',
      pharmacyName: 'Victoria Hospital Community Pharmacy',
      pharmacistName: 'Dr. Anand Kumar, R.Ph',
      licenseNumber: 'KA-BLR-2024-DR-0492',
      counterId: 'Dispensary Counter 1',
      verifiedAt: new Date().toISOString(),
    };

    await pharmacyPortalService.saveStorePartnerAuth(authData);
    const retrieved = await pharmacyPortalService.getStorePartnerAuth();
    assert.ok(retrieved !== null, 'Auth should be retrieved');
    assert.strictEqual(retrieved?.pharmacyId, 'pharm-blr-001');
    assert.strictEqual(retrieved?.pharmacistName, 'Dr. Anand Kumar, R.Ph');

    await pharmacyPortalService.clearStorePartnerAuth();
    const afterClear = await pharmacyPortalService.getStorePartnerAuth();
    assert.strictEqual(afterClear, null, 'Auth should be null after clearing');
  });

  it('Retrieves category-filtered facilities for hospitals, clinics, and pharmacies', async () => {
    const hospitals = await pharmacyPortalService.getFacilitiesByType('hospital');
    assert.ok(Array.isArray(hospitals), 'Hospitals should be an array');
    assert.ok(hospitals.length > 0, 'Should return hospital facilities');
    assert.ok(hospitals.some((h) => h.name.includes('Victoria Hospital')), 'Should include Victoria Hospital');

    const clinics = await pharmacyPortalService.getFacilitiesByType('clinic');
    assert.ok(Array.isArray(clinics), 'Clinics should be an array');
    assert.ok(clinics.length > 0, 'Should return clinic facilities');
    assert.ok(clinics.some((c) => c.name.includes('BBMP') || c.name.includes('Clinic')), 'Should include clinic facilities');

    const pharmacies = await pharmacyPortalService.getFacilitiesByType('pharmacy');
    assert.ok(Array.isArray(pharmacies), 'Pharmacies should be an array');
    assert.ok(pharmacies.length > 0, 'Should return pharmacy facilities');
  });

  it('Persists and retrieves category-specific compliance data and document uploads', async () => {
    const hospitalAuth = {
      isAuthorized: true,
      facilityType: 'hospital',
      pharmacyId: 'hosp-blr-001',
      pharmacyName: 'Victoria Hospital (BMCRI Medical College)',
      pharmacistName: 'Dr. Ramesh Babu, MS',
      licenseNumber: 'KSPCB/BMW/BLR/2026/8941',
      counterId: 'Emergency & Ward Deck',
      verifiedAt: new Date().toISOString(),
      hospitalData: {
        hospitalCategory: 'Level 3 Super-Specialty Hospital',
        bedCapacity: 750,
        operationTheatres: 12,
        icuBeds: 48,
        emergencyBeds: 24,
        bioMedicalWasteId: 'KSPCB/BMW/BLR/2026/8941',
        nodalOfficerName: 'Dr. S. Nagaraj, MD',
        nodalOfficerContact: '080-26701199',
        medicalSuperintendent: 'Dr. Ramesh Babu, MS',
        documents: {
          kpme_license: {
            id: 'doc-h1',
            docKey: 'kpme_license',
            title: 'KPME Registration Certificate',
            fileName: 'KPME_License_KA_BLR_2026.pdf',
            fileSize: '1.4 MB',
            uploadedAt: new Date().toISOString(),
          },
        },
      },
    };

    await pharmacyPortalService.saveStorePartnerAuth(hospitalAuth);
    const retrieved = await pharmacyPortalService.getStorePartnerAuth();
    assert.strictEqual(retrieved?.facilityType, 'hospital');
    assert.strictEqual(retrieved?.hospitalData?.hospitalCategory, 'Level 3 Super-Specialty Hospital');
    assert.strictEqual(retrieved?.hospitalData?.bedCapacity, 750);
    assert.strictEqual(retrieved?.hospitalData?.operationTheatres, 12);
    assert.strictEqual(retrieved?.hospitalData?.documents?.kpme_license?.fileName, 'KPME_License_KA_BLR_2026.pdf');

    await pharmacyPortalService.clearStorePartnerAuth();
  });

  it('Wipes all stock snapshots and audit log on clearStorePartnerAuth (Sign Out / Change Role)', async () => {
    // 1. User signs into pharmacy and makes updates across available, low_stock, and unavailable
    await pharmacyPortalService.updateStock(
      'pharm-blr-001',
      'med-nlem-001',
      'Paracetamol',
      'unavailable',
      'Pharmacist Desk'
    );
    await pharmacyPortalService.updateStock(
      'pharm-blr-001',
      'med-nlem-002',
      'Amoxicillin',
      'low_stock',
      'Pharmacist Desk'
    );
    await pharmacyPortalService.updateStock(
      'pharm-blr-001',
      'med-nlem-003',
      'Cetirizine',
      'available',
      'Pharmacist Desk'
    );

    // Verify snapshots exist in session
    assert.strictEqual(pharmacyPortalService.getLocalSnapshots().length, 3);
    const invBefore = await pharmacyPortalService.getInventory('pharm-blr-001');
    const med1Before = invBefore.find((i) => i.medicine.id === 'med-nlem-001');
    assert.strictEqual(med1Before?.currentSnapshot?.state, 'unavailable');

    // 2. User signs out or switches role (invokes clearStorePartnerAuth)
    await pharmacyPortalService.clearStorePartnerAuth();

    // 3. Verify all in-memory stock snapshots and credentials are wiped completely clean
    assert.strictEqual(
      pharmacyPortalService.getLocalSnapshots().length,
      0,
      'localSnapshots must be completely empty after sign out'
    );
    const authAfter = await pharmacyPortalService.getStorePartnerAuth();
    assert.strictEqual(authAfter, null, 'Partner auth must be null after sign out');

    // 4. Now, user logs in as Hospital ('hosp-blr-001')
    const hospitalInv = await pharmacyPortalService.getInventory('hosp-blr-001');
    assert.ok(hospitalInv.length > 0);
    // None of the previous pharmacy's updates must bleed into the hospital!
    const hospMed1 = hospitalInv.find((i) => i.medicine.id === 'med-nlem-001');
    assert.strictEqual(
      hospMed1?.currentSnapshot,
      null,
      'Hospital must start fresh from scratch with no retained selections from pharmacy'
    );

    // 5. If user logs back into clinic ('clinic-blr-001'), it also starts from scratch
    const clinicInv = await pharmacyPortalService.getInventory('clinic-blr-001');
    const clinicMed1 = clinicInv.find((i) => i.medicine.id === 'med-nlem-001');
    assert.strictEqual(
      clinicMed1?.currentSnapshot,
      null,
      'Clinic must start fresh from scratch'
    );
  });

  it('Retrieves facility by ID across hospitals, clinics, and pharmacies', async () => {
    const hosp = await pharmacyPortalService.getFacilityById('hosp-blr-001');
    assert.ok(hosp);
    assert.strictEqual(hosp?.name, 'Victoria Hospital (BMCRI Medical College)');

    const clinic = await pharmacyPortalService.getFacilityById('clinic-blr-001');
    assert.ok(clinic);
    assert.strictEqual(clinic?.name, 'Basavanagudi BBMP Urban Primary Health Centre (UPHC)');

    const pharm = await pharmacyPortalService.getFacilityById('pharm-blr-001');
    assert.ok(pharm);
    assert.strictEqual(pharm?.name, 'Apollo Pharmacy - Victoria Hospital Road');
  });

  it('Resets stock changes with clearLocalSnapshots without clearing auth', async () => {
    await pharmacyPortalService.updateStock(
      'pharm-blr-002',
      'med-nlem-001',
      'Paracetamol',
      'unavailable',
      'Reset Tester'
    );
    assert.ok(pharmacyPortalService.getLocalSnapshots().length > 0);

    pharmacyPortalService.clearLocalSnapshots();
    assert.strictEqual(pharmacyPortalService.getLocalSnapshots().length, 0);
  });
});
