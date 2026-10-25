/**
 * Canonical registry of all local storage (AsyncStorage) keys used by MedFind.
 *
 * Privacy Rule:
 * All user-identifying or session data must be cleared on user request.
 * Only visual theme and language preferences may be retained across data resets.
 */

// Data keys cleared on "Clear everything"
export const PROFILE_STORAGE_KEY = '@medfind_user_profile_v1';
export const MEDICINE_BOX_STORAGE_KEY = '@medfind_medicine_box_v1';
export const FAVORITES_STORAGE_KEY = '@medfind_favorites_v1';
export const RECENT_SEARCHES_STORAGE_KEY = '@medfind_recent_searches_v1';
export const LOCATION_SOURCE_STORAGE_KEY = '@medfind_location_source_v1';
export const SELECTED_AREA_NAME_STORAGE_KEY = '@medfind_user_area_name_v1';
export const ONBOARDING_COMPLETED_STORAGE_KEY = '@medfind_onboarding_completed_v1';
export const LEGACY_ONBOARDING_COMPLETED_KEY = '@medfind_onboarding_completed';
export const STORE_AUTH_STORAGE_KEY = '@medfind_store_partner_auth_v1';
export const LEGACY_STORE_AUTH_STORAGE_KEY = '@medfind_store_auth_v1';
export const EMERGENCY_COUNTRY_STORAGE_KEY = '@medfind_emergency_selected_country_v1';

// Preferences keys kept on "Clear everything"
export const THEME_STORAGE_KEY = 'medfind.theme';
export const LEGACY_THEME_STORAGE_KEY = '@medfind_theme_preference';
export const LANGUAGE_STORAGE_KEY = 'medfind.language_v1';
export const LEGACY_LANGUAGE_STORAGE_KEY = '@medfind_app_language';

export const CLEARED_STORAGE_KEYS = [
  PROFILE_STORAGE_KEY,
  MEDICINE_BOX_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  RECENT_SEARCHES_STORAGE_KEY,
  LOCATION_SOURCE_STORAGE_KEY,
  SELECTED_AREA_NAME_STORAGE_KEY,
  ONBOARDING_COMPLETED_STORAGE_KEY,
  LEGACY_ONBOARDING_COMPLETED_KEY,
  STORE_AUTH_STORAGE_KEY,
  LEGACY_STORE_AUTH_STORAGE_KEY,
  EMERGENCY_COUNTRY_STORAGE_KEY,
];

export const KEPT_STORAGE_KEYS = [
  THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
];
