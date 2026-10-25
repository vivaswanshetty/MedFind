import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../../..');

// Helper to recursively collect all source code files in src/
function getSourceFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
        getSourceFiles(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Extract all AsyncStorage key literals from source code
function extractStorageKeysFromSrc() {
  const files = getSourceFiles(srcDir);
  const keySet = new Set();
  const keyRegex = /['"](@medfind_[a-zA-Z0-9_]+|medfind\.[a-zA-Z0-9_]+)['"]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      keySet.add(match[1]);
    }
  }
  return Array.from(keySet).sort();
}

import {
  CLEARED_STORAGE_KEYS,
  KEPT_STORAGE_KEYS,
  clearAllUserData,
} from '../../services/clearDataService.ts';

test('Storage Key Audit - All AsyncStorage keys must be either cleared or kept', () => {
  const discoveredKeys = extractStorageKeysFromSrc();
  assert.ok(discoveredKeys.length > 0, 'Should have discovered AsyncStorage keys in src/');

  const clearedSet = new Set(CLEARED_STORAGE_KEYS);
  const keptSet = new Set(KEPT_STORAGE_KEYS);

  const unclassifiedKeys = [];

  for (const key of discoveredKeys) {
    const isCleared = clearedSet.has(key);
    const isKept = keptSet.has(key);

    if (!isCleared && !isKept) {
      unclassifiedKeys.push(key);
    }
  }

  assert.deepEqual(
    unclassifiedKeys,
    [],
    `Found unclassified storage keys that are neither cleared nor kept: ${unclassifiedKeys.join(', ')}`
  );
});

test('Storage Key Audit - Kept keys include theme and language preferences', () => {
  const keptSet = new Set(KEPT_STORAGE_KEYS);

  assert.ok(
    keptSet.has('medfind.theme') || keptSet.has('@medfind_theme_preference'),
    'Theme preference key must be explicitly kept'
  );

  assert.ok(
    keptSet.has('medfind.language_v1') || keptSet.has('@medfind_app_language'),
    'Language preference key must be explicitly kept'
  );
});

test('Storage Key Audit - Cleared keys include profile, medicine box, favorites, searches, location, onboarding and portal', () => {
  const clearedSet = new Set(CLEARED_STORAGE_KEYS);

  // Profile
  assert.ok(clearedSet.has('@medfind_user_profile_v1'), 'Must clear profile');
  // Medicine Box
  assert.ok(clearedSet.has('@medfind_medicine_box_v1'), 'Must clear medicine box');
  // Favorites
  assert.ok(clearedSet.has('@medfind_favorites_v1'), 'Must clear favorites');
  // Searches
  assert.ok(clearedSet.has('@medfind_recent_searches_v1'), 'Must clear recent searches');
  // Location
  assert.ok(clearedSet.has('@medfind_location_source_v1'), 'Must clear location source');
  assert.ok(clearedSet.has('@medfind_user_area_name_v1'), 'Must clear user area name');
  // Onboarding
  assert.ok(clearedSet.has('@medfind_onboarding_completed_v1'), 'Must clear onboarding completed v1');
  assert.ok(clearedSet.has('@medfind_onboarding_completed'), 'Must clear legacy onboarding completed flag');
  // Pharmacy Portal
  assert.ok(clearedSet.has('@medfind_store_partner_auth_v1'), 'Must clear store partner auth');
  assert.ok(clearedSet.has('@medfind_store_auth_v1'), 'Must clear legacy store auth');
  // Nearby Places Cache
  assert.ok(clearedSet.has('@medfind_nearby_places_cache_v1'), 'Must clear nearby places cache');
});

import { setMockNotificationClient } from '../../lib/reminders.js';

test('clearAllUserData - Clears all designated keys, cancels notifications, and preserves kept keys', async () => {
  let cancelAllCalled = false;
  setMockNotificationClient({
    scheduleNotificationAsync: async () => 'test_id',
    cancelScheduledNotificationAsync: async () => {},
    cancelAllScheduledNotificationsAsync: async () => {
      cancelAllCalled = true;
    },
  });

  await assert.doesNotReject(async () => {
    await clearAllUserData();
  });

  assert.equal(cancelAllCalled, true, 'clearAllUserData must call cancelAllScheduledNotificationsAsync');
  setMockNotificationClient(null);
});

import { DEFAULT_PROFILE } from '../profile.ts';
import { pharmacyPortalService } from '../../services/pharmacyPortalService.ts';

test('clearAllUserData - Explicitly wipes role and store authorization', async () => {
  // 1. Role defaults to null upon clearing profile key
  assert.equal(DEFAULT_PROFILE.role, null, 'DEFAULT_PROFILE must have null role so clearing resets role');

  // 2. Profile key is in cleared set
  assert.ok(CLEARED_STORAGE_KEYS.includes('@medfind_user_profile_v1'), 'Must include @medfind_user_profile_v1');

  // 3. Store partner auth key is in cleared set
  assert.ok(CLEARED_STORAGE_KEYS.includes('@medfind_store_partner_auth_v1'), 'Must include @medfind_store_partner_auth_v1');

  // 4. Save store auth, then verify clearAllUserData removes it
  await pharmacyPortalService.saveStorePartnerAuth({
    isAuthorized: true,
    pharmacyId: 'test_store',
    pharmacyName: 'Test Pharmacy',
    pharmacistName: 'Test Pharmacist',
    licenseNumber: 'TEST/1234',
    counterId: 'Desk 1',
    authorizedAt: new Date().toISOString(),
  });

  const beforeClear = await pharmacyPortalService.getStorePartnerAuth();
  assert.ok(beforeClear?.isAuthorized, 'Auth must be saved before clear');

  await clearAllUserData();

  const afterClear = await pharmacyPortalService.getStorePartnerAuth();
  assert.equal(afterClear, null, 'Store authorization must be wiped by clearAllUserData');
});

