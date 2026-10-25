import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRouteAccess } from '../routeGuard.ts';

test('Route Guard - Legacy /portal and deep links', () => {
  // 1. Pharmacist trying to access /portal redirects to /(pharmacy)
  assert.equal(resolveRouteAccess('pharmacist', '/portal'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/portal/'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/portal?src=sms_alert'), '/(pharmacy)');

  // 2. Customer trying to access /portal redirects to /(tabs) (Home)
  assert.equal(resolveRouteAccess('customer', '/portal'), '/(tabs)');
  assert.equal(resolveRouteAccess('customer', '/portal/'), '/(tabs)');
  assert.equal(resolveRouteAccess('customer', '/portal?action=check'), '/(tabs)');

  // 3. Unselected role (null) accessing /portal redirects to / (RolePicker)
  assert.equal(resolveRouteAccess(null, '/portal'), '/');
  assert.equal(resolveRouteAccess(null, '/portal?deep=true'), '/');
});

test('Route Guard - Customer role route boundaries', () => {
  // A customer MUST NOT access any pharmacy portal routes
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)'), '/(tabs)');
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)/'), '/(tabs)');
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)/store'), '/(tabs)');
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)/stock/update'), '/(tabs)');

  // A customer MUST be allowed on all customer routes
  assert.equal(resolveRouteAccess('customer', '/'), null);
  assert.equal(resolveRouteAccess('customer', '/(tabs)'), null);
  assert.equal(resolveRouteAccess('customer', '/(tabs)/search'), null);
  assert.equal(resolveRouteAccess('customer', '/(tabs)/care'), null);
  assert.equal(resolveRouteAccess('customer', '/(tabs)/emergency'), null);
  assert.equal(resolveRouteAccess('customer', '/medicine/calpol-500'), null);
  assert.equal(resolveRouteAccess('customer', '/medicine-box'), null);
  assert.equal(resolveRouteAccess('customer', '/profile'), null);
  assert.equal(resolveRouteAccess('customer', '/emergency-directory'), null);
});

test('Route Guard - Pharmacist role route boundaries and authorization gates', () => {
  // A pharmacist MUST NOT access customer tabs or customer feature screens
  assert.equal(resolveRouteAccess('pharmacist', '/'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)/search'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)/care'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)/emergency'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/medicine/calpol-500'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/medicine-box'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/profile'), '/(pharmacy)');
  assert.equal(resolveRouteAccess('pharmacist', '/emergency-directory'), '/(pharmacy)');

  // When authorized: pharmacist can access all pharmacy screens
  assert.equal(resolveRouteAccess('pharmacist', '/(pharmacy)', true), null);
  assert.equal(resolveRouteAccess('pharmacist', '/(pharmacy)/store', true), null);

  // When unauthorized (isPharmacyAuthorized === false):
  // Pharmacist can view the entry point (verification), but NOT inner sub-screens
  assert.equal(resolveRouteAccess('pharmacist', '/(pharmacy)', false), null);
  assert.equal(resolveRouteAccess('pharmacist', '/(pharmacy)/store', false), '/(pharmacy)');
});

test('Route Guard - Null role (unselected) route boundaries', () => {
  // Root / is allowed to render splash and RolePicker
  assert.equal(resolveRouteAccess(null, '/'), null);

  // Any other route attempt redirects back to /
  assert.equal(resolveRouteAccess(null, '/(tabs)'), '/');
  assert.equal(resolveRouteAccess(null, '/(tabs)/emergency'), '/');
  assert.equal(resolveRouteAccess(null, '/(pharmacy)'), '/');
  assert.equal(resolveRouteAccess(null, '/(pharmacy)/store'), '/');
  assert.equal(resolveRouteAccess(null, '/medicine/calpol-500'), '/');
  assert.equal(resolveRouteAccess(null, '/profile'), '/');
});

test('Route Guard - Normalizes hashes and query parameters', () => {
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)?store=1#inventory'), '/(tabs)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)?tab=search#top'), '/(pharmacy)');
});
