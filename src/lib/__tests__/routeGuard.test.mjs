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

  // Emergency routes MUST be universally accessible (never blocked or redirected to /)
  assert.equal(resolveRouteAccess(null, '/(tabs)/emergency'), null);
  assert.equal(resolveRouteAccess(null, '/emergency'), null);
  assert.equal(resolveRouteAccess(null, '/emergency-directory'), null);

  // Non-emergency customer/portal routes redirect to / for onboarding
  assert.equal(resolveRouteAccess(null, '/(tabs)'), '/');
  assert.equal(resolveRouteAccess(null, '/(pharmacy)'), '/');
  assert.equal(resolveRouteAccess(null, '/(pharmacy)/store'), '/');
  assert.equal(resolveRouteAccess(null, '/medicine/calpol-500'), '/');
  assert.equal(resolveRouteAccess(null, '/profile'), '/');
});

test('Route Guard - Normalizes hashes and query parameters', () => {
  assert.equal(resolveRouteAccess('customer', '/(pharmacy)?store=1#inventory'), '/(tabs)');
  assert.equal(resolveRouteAccess('pharmacist', '/(tabs)?tab=search#top'), '/(pharmacy)');
});

test('Emergency Access Integrity - Direct emergency routing from anywhere', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const rootIndexSrc = fs.readFileSync(path.resolve('src/app/index.tsx'), 'utf8');
  const emergencyRouteSrc = fs.readFileSync(path.resolve('src/app/emergency.tsx'), 'utf8');
  const locationContextSrc = fs.readFileSync(path.resolve('src/context/LocationContext.tsx'), 'utf8');
  const emergencyScreenSrc = fs.readFileSync(path.resolve('src/app/(tabs)/emergency.tsx'), 'utf8');

  // 1. Root index redirects emergency-skipped user to emergency tab, not general home
  assert.ok(
    rootIndexSrc.includes("profile.onboardingSkippedAt && !profile.onboardingComplete"),
    'RootIndex must check for onboarding skipped for emergency'
  );
  assert.ok(
    rootIndexSrc.includes('href="/(tabs)/emergency"'),
    'RootIndex must redirect to emergency tab when skipped for emergency'
  );

  // 2. Root emergency redirector exists
  assert.ok(
    emergencyRouteSrc.includes('href="/(tabs)/emergency"'),
    'Root emergency.tsx must redirect to /(tabs)/emergency'
  );

  // 3. LocationContext memoizes requestGpsLocation with useCallback
  assert.ok(
    locationContextSrc.includes('const requestGpsLocation = useCallback('),
    'requestGpsLocation must be wrapped in useCallback to avoid re-rendering loops'
  );

  // 4. EmergencyScreen uses ref guard so location check does not flicker in an infinite loop
  assert.ok(
    emergencyScreenSrc.includes('hasRequestedLocationRef'),
    'EmergencyScreen must use hasRequestedLocationRef to prevent continuous location toggling'
  );
});
