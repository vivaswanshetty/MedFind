import type { UserRole } from '../store/profile';

function isProviderRole(role: UserRole): boolean {
  return role === 'pharmacist' || role === 'clinic' || role === 'hospital';
}

/**
 * Pure route access resolution function.
 * Given a role, pathname, and pharmacy authorization state, determines if redirection is required.
 *
 * Rules:
 * - Legacy /portal or medfind://portal:
 *   - Provider (pharmacist/clinic/hospital) -> /(pharmacy)
 *   - Customer -> /(tabs)
 *   - Null -> / (RolePicker)
 * - Role null:
 *   - Can only view / (Splash & RolePicker)
 *   - All other routes redirect to /
 * - Role customer:
 *   - Cannot view /(pharmacy) or any sub-route. Redirects to /(tabs).
 *   - Allowed on customer routes (tabs, medicine/[id], medicine-box, profile, emergency-directory).
 * - Provider roles (pharmacist/clinic/hospital):
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

  // 0. Universal Emergency Access: emergency screens must ALWAYS be accessible to customers and unassigned users
  // (Emergency? Skip and emergency tab must NEVER redirect to onboarding or block access)
  if (
    !isProviderRole(role) &&
    (cleanPath === '/emergency' ||
      cleanPath === '/(tabs)/emergency' ||
      cleanPath === '/emergency-directory')
  ) {
    return null;
  }

  // 1. Legacy /portal route (and deep links like medfind://portal)
  if (cleanPath === '/portal' || cleanPath.startsWith('/portal/')) {
    if (isProviderRole(role)) return '/(pharmacy)';
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

  // 4. Provider roles (pharmacist, clinic, hospital)
  if (isProviderRole(role)) {
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

