import { UserRole } from '../store/profile';

/**
 * Pure route access resolution function.
 * Given a role, pathname, and pharmacy authorization state, determines if redirection is required.
 *
 * Rules:
 * - Legacy /portal or medfind://portal:
 *   - Pharmacist -> /(pharmacy)
 *   - Customer -> /(tabs)
 *   - Null -> / (RolePicker)
 * - Role null:
 *   - Can only view / (Splash & RolePicker)
 *   - All other routes redirect to /
 * - Role customer:
 *   - Cannot view /(pharmacy) or any sub-route. Redirects to /(tabs).
 *   - Allowed on customer routes (tabs, medicine/[id], medicine-box, profile, emergency-directory).
 * - Role pharmacist:
 *   - Cannot view customer tabs or customer screens. Redirects to /(pharmacy).
 *   - If isPharmacyAuthorized === false, sub-screens (e.g. /(pharmacy)/store) redirect to /(pharmacy).
 *   - Allowed on /(pharmacy) when authorized.
 */
export function resolveRouteAccess(
  role: UserRole,
  pathname: string,
  isPharmacyAuthorized?: boolean
): string | null {
  // Normalize pathname: strip query params, hashes, and trailing slashes
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // 1. Legacy /portal route (and deep links like medfind://portal)
  if (cleanPath === '/portal' || cleanPath.startsWith('/portal/')) {
    if (role === 'pharmacist') return '/(pharmacy)';
    if (role === 'customer') return '/(tabs)';
    return '/';
  }

  // 2. Unassigned role (null)
  if (role === null || role === undefined) {
    if (cleanPath !== '/') {
      return '/';
    }
    return null;
  }

  // 3. Customer role
  if (role === 'customer') {
    if (cleanPath === '/(pharmacy)' || cleanPath.startsWith('/(pharmacy)/')) {
      return '/(tabs)';
    }
    return null;
  }

  // 4. Pharmacist role
  if (role === 'pharmacist') {
    // Blocked from customer screens
    if (
      cleanPath === '/' ||
      cleanPath === '/(tabs)' ||
      cleanPath.startsWith('/(tabs)/') ||
      cleanPath === '/medicine-box' ||
      cleanPath === '/profile' ||
      cleanPath === '/emergency-directory' ||
      cleanPath.startsWith('/medicine/')
    ) {
      return '/(pharmacy)';
    }

    // Inside pharmacy app: if unauthorized, sub-screens are not reachable
    if (cleanPath === '/(pharmacy)' || cleanPath.startsWith('/(pharmacy)/')) {
      if (isPharmacyAuthorized === false && cleanPath !== '/(pharmacy)') {
        return '/(pharmacy)';
      }
      return null;
    }

    return null;
  }

  return null;
}
