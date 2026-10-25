import test from 'node:test';
import assert from 'node:assert/strict';
import { determineMigratedRole, DEFAULT_PROFILE } from '../profile.ts';

test('Role Migration - All 4 combinations for existing installs', () => {
  // Combination 1: Onboarding complete = true, valid store authorization = true
  // Customer onboarding takes precedence; store authorization is preserved for Change role
  const combo1 = determineMigratedRole({
    onboardingComplete: true,
    onboardingSkippedAt: null,
    hasValidStoreAuth: true,
  });
  assert.equal(combo1, 'customer', 'Combo 1: completed onboarding must migrate to customer role');

  // Combination 2: Onboarding skipped = timestamp, valid store authorization = false
  // Customer skipped onboarding must also migrate to customer role
  const combo2 = determineMigratedRole({
    onboardingComplete: false,
    onboardingSkippedAt: '2026-10-25T12:00:00.000Z',
    hasValidStoreAuth: false,
  });
  assert.equal(combo2, 'customer', 'Combo 2: skipped onboarding must migrate to customer role');

  // Combination 3: No customer onboarding, valid store authorization = true
  // Valid store auth without customer onboarding migrates to pharmacist role
  const combo3 = determineMigratedRole({
    onboardingComplete: false,
    onboardingSkippedAt: null,
    hasValidStoreAuth: true,
  });
  assert.equal(combo3, 'pharmacist', 'Combo 3: store auth without customer onboarding must migrate to pharmacist');

  // Combination 4: No customer onboarding, no store authorization
  // Fresh install with no prior data migrates to null (shows RolePicker)
  const combo4 = determineMigratedRole({
    onboardingComplete: false,
    onboardingSkippedAt: null,
    hasValidStoreAuth: false,
  });
  assert.equal(combo4, null, 'Combo 4: no onboarding and no store auth must migrate to null');
});

test('Role Migration - Preserves explicit role if already set', () => {
  const existingCustomer = determineMigratedRole({
    role: 'customer',
    onboardingComplete: false,
    onboardingSkippedAt: null,
    hasValidStoreAuth: true,
  });
  assert.equal(existingCustomer, 'customer', 'Explicit customer role must be preserved');

  const existingPharmacist = determineMigratedRole({
    role: 'pharmacist',
    onboardingComplete: true,
    onboardingSkippedAt: null,
    hasValidStoreAuth: true,
  });
  assert.equal(existingPharmacist, 'pharmacist', 'Explicit pharmacist role must be preserved');
});

test('Role Migration - DEFAULT_PROFILE starts with null role', () => {
  assert.equal(DEFAULT_PROFILE.role, null, 'DEFAULT_PROFILE.role must be null');
});
