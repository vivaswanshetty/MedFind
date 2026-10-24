import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMedicineBoxItem,
  sanitizeMedicineBoxItems,
  addItemToList,
  updateItemInList,
  removeItemFromList,
  MAX_MEDICINE_BOX_ITEMS,
  MEDICINE_BOX_STORAGE_KEY,
} from '../medicineBox.tsx';

test('MedicineBox Store - Storage key and cap constants', () => {
  assert.equal(MEDICINE_BOX_STORAGE_KEY, '@medfind_medicine_box_v1');
  assert.equal(MAX_MEDICINE_BOX_ITEMS, 30);
});

test('MedicineBox Store - validateMedicineBoxItem handles valid and corrupt entries', () => {
  // 1. Valid full entry
  const valid = validateMedicineBoxItem({
    id: 'mb_123',
    name: 'Paracetamol 500mg',
    note: 'Take after meals',
    expiryDate: '2026-12',
    exactExpiryDate: '2026-12-15',
    refillOn: '2026-11-01',
    remindersEnabled: true,
    expiryNotificationId: 'notif_1',
    refillNotificationId: 'notif_2',
    createdAt: '2026-10-24T12:00:00.000Z',
  });
  assert.ok(valid);
  assert.equal(valid.id, 'mb_123');
  assert.equal(valid.name, 'Paracetamol 500mg');
  assert.equal(valid.note, 'Take after meals');
  assert.equal(valid.expiryDate, '2026-12');
  assert.equal(valid.exactExpiryDate, '2026-12-15');
  assert.equal(valid.refillOn, '2026-11-01');
  assert.equal(valid.remindersEnabled, true);
  assert.equal(valid.expiryNotificationId, 'notif_1');
  assert.equal(valid.refillNotificationId, 'notif_2');

  // 2. Corrupt / missing id
  assert.equal(validateMedicineBoxItem({ name: 'Aspirin' }), null);
  assert.equal(validateMedicineBoxItem({ id: '', name: 'Aspirin' }), null);

  // 3. Corrupt / missing name
  assert.equal(validateMedicineBoxItem({ id: 'mb_1' }), null);
  assert.equal(validateMedicineBoxItem({ id: 'mb_1', name: '   ' }), null);

  // 4. Non-object inputs
  assert.equal(validateMedicineBoxItem(null), null);
  assert.equal(validateMedicineBoxItem(undefined), null);
  assert.equal(validateMedicineBoxItem('string'), null);
  assert.equal(validateMedicineBoxItem(123), null);

  // 5. Invalid createdAt generates valid fallback ISO timestamp
  const itemWithBadDate = validateMedicineBoxItem({
    id: 'mb_2',
    name: 'Cetirizine',
    createdAt: 'invalid-date',
  });
  assert.ok(itemWithBadDate);
  assert.ok(!isNaN(new Date(itemWithBadDate.createdAt).getTime()));
});

test('MedicineBox Store - sanitizeMedicineBoxItems discards corrupt records and caps at 30', () => {
  const corruptBatch = [
    { id: 'mb_1', name: 'Medicine 1' },
    null,
    { id: '', name: 'Medicine 2' },
    'random string',
    { id: 'mb_3', name: '' },
    { id: 'mb_4', name: 'Medicine 4' },
  ];

  const sanitized = sanitizeMedicineBoxItems(corruptBatch);
  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0].id, 'mb_1');
  assert.equal(sanitized[1].id, 'mb_4');

  // Non-array returns empty list
  assert.deepEqual(sanitizeMedicineBoxItems(null), []);
  assert.deepEqual(sanitizeMedicineBoxItems({}), []);

  // Respects 30-item cap even if stored array had more
  const oversized = Array.from({ length: 45 }, (_, i) => ({
    id: `mb_${i}`,
    name: `Medicine ${i}`,
  }));
  const capped = sanitizeMedicineBoxItems(oversized);
  assert.equal(capped.length, 30);
});

test('MedicineBox Store - addItemToList enforces 30-item cap', () => {
  let list = [];
  for (let i = 0; i < 30; i++) {
    const res = addItemToList(list, {
      id: `mb_${i}`,
      name: `Med ${i}`,
      createdAt: new Date().toISOString(),
    });
    assert.equal(res.error, undefined);
    list = res.items;
  }

  assert.equal(list.length, 30);

  // Attempting 31st item fails with exact message
  const overflow = addItemToList(list, {
    id: 'mb_31',
    name: 'Med 31',
    createdAt: new Date().toISOString(),
  });

  assert.equal(overflow.items.length, 30);
  assert.equal(overflow.error, 'Your medicine box is full (30 items)');
});

test('MedicineBox Store - updateItemInList and removeItemFromList', () => {
  const initial = [
    { id: '1', name: 'Med 1', createdAt: '2026-01-01' },
    { id: '2', name: 'Med 2', createdAt: '2026-01-02' },
  ];

  // Update
  const updated = updateItemInList(initial, '1', { name: 'Med 1 Updated', note: 'New note' });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].name, 'Med 1 Updated');
  assert.equal(updated[0].note, 'New note');
  assert.equal(updated[0].createdAt, '2026-01-01'); // Preserves createdAt
  assert.equal(updated[1].name, 'Med 2');

  // Remove
  const removed = removeItemFromList(updated, '1');
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, '2');
});
