import { describe, it } from 'node:test';
import assert from 'node:assert';
import { pharmacyPortalService } from '../pharmacyPortalService.ts';

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
});
