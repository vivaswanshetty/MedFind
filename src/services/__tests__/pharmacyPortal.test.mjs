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
});
