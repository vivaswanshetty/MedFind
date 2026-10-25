/**
 * Data stays on the device only. Do not send it anywhere.
 *
 * User profile and onboarding responses are persisted strictly in local device storage
 * via AsyncStorage for privacy and zero cloud attribution.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WhoOption } from '../components/onboarding/WhoPicker';
import { AgeGroup } from '../components/onboarding/AgePicker';
import { BuddyProfile } from '../lib/buddy';

import { STORE_AUTH_STORAGE_KEY } from '../constants/storageKeys';

export const PROFILE_STORAGE_KEY = '@medfind_user_profile_v1';

export type UserRole = 'customer' | 'pharmacist' | null;

export interface ProfileAnswers {
  medicineBox: boolean;
  stockIssues: boolean;
  buysForFamily: boolean;
  wantsReminders: boolean;
  comparesPrices: boolean;
}

export interface Profile {
  role: UserRole;
  who: WhoOption | null;
  ageGroup: AgeGroup | null;
  answers: ProfileAnswers | null;
  buddy: BuddyProfile | null;
  buddyName?: string | null;
  buddyTrait?: string | null;
  displayName?: string | null;
  onboardingComplete: boolean;
  onboardingSkippedAt?: string | null;
  dismissedSetupCard?: boolean;
  hasSeenFirstHomeVisit?: boolean;
  createdAt: string;
}

export const DEFAULT_PROFILE: Profile = {
  role: null,
  who: null,
  ageGroup: null,
  answers: null,
  buddy: null,
  buddyName: null,
  buddyTrait: null,
  displayName: null,
  onboardingComplete: false,
  onboardingSkippedAt: null,
  dismissedSetupCard: false,
  hasSeenFirstHomeVisit: false,
  createdAt: '',
};

/**
 * Migration helper for existing installs:
 * - If onboardingComplete or onboardingSkippedAt is set -> 'customer' (even if valid store auth exists)
 * - Only if no customer onboarding and valid store auth exists -> 'pharmacist'
 * - Otherwise null
 */
export function determineMigratedRole(params: {
  role?: UserRole;
  onboardingComplete?: boolean;
  onboardingSkippedAt?: string | null;
  hasValidStoreAuth?: boolean;
}): UserRole {
  if (params.role !== undefined && params.role !== null) {
    return params.role;
  }
  if (params.onboardingComplete || Boolean(params.onboardingSkippedAt)) {
    return 'customer';
  }
  if (params.hasValidStoreAuth) {
    return 'pharmacist';
  }
  return null;
}

/**
 * Maps the 5 swipe card booleans to a typed ProfileAnswers object by card order:
 * 1. medicineBox
 * 2. stockIssues
 * 3. buysForFamily
 * 4. wantsReminders
 * 5. comparesPrices
 */
export function mapSwipeAnswers(answers: boolean[]): ProfileAnswers {
  return {
    medicineBox: Boolean(answers[0]),
    stockIssues: Boolean(answers[1]),
    buysForFamily: Boolean(answers[2]),
    wantsReminders: Boolean(answers[3]),
    comparesPrices: Boolean(answers[4]),
  };
}

export interface ProfileContextType {
  profile: Profile;
  isLoading: boolean;
  saveProfile: (profileData: Partial<Profile>) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from AsyncStorage on initial mount before rendering content
  useEffect(() => {
    let isMounted = true;

    async function hydrateProfile() {
      try {
        const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        const storeAuthRaw = await AsyncStorage.getItem(STORE_AUTH_STORAGE_KEY);
        let hasValidStoreAuth = false;
        if (storeAuthRaw) {
          try {
            const auth = JSON.parse(storeAuthRaw);
            hasValidStoreAuth = Boolean(auth?.isAuthorized);
          } catch {}
        }

        let initialProfile: Profile = DEFAULT_PROFILE;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            initialProfile = {
              ...DEFAULT_PROFILE,
              ...parsed,
            };
          } catch {}
        }

        if (initialProfile.role === undefined || initialProfile.role === null) {
          const migratedRole = determineMigratedRole({
            role: initialProfile.role,
            onboardingComplete: initialProfile.onboardingComplete,
            onboardingSkippedAt: initialProfile.onboardingSkippedAt,
            hasValidStoreAuth,
          });
          initialProfile.role = migratedRole;
          if (migratedRole !== null) {
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(initialProfile));
          }
        }

        if (isMounted) {
          setProfile(initialProfile);
        }
      } catch (err) {
        // Fallback to default uninitialized profile
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = async (profileData: Partial<Profile>): Promise<void> => {
    try {
      const merged: Profile = {
        ...DEFAULT_PROFILE,
        ...profile,
        ...profileData,
        createdAt: profileData.createdAt || profile.createdAt || new Date().toISOString(),
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
      setProfile(merged);
    } catch (err) {
      console.error('[ProfileStore] Failed to save profile:', err);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    try {
      const merged: Profile = {
        ...profile,
        ...updates,
      };
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
      setProfile(merged);
    } catch (err) {
      console.error('[ProfileStore] Failed to update profile:', err);
    }
  };

  const resetProfile = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfile(DEFAULT_PROFILE);
    } catch (err) {
      console.error('[ProfileStore] Failed to reset profile:', err);
    }
  };

  return React.createElement(
    ProfileContext.Provider,
    {
      value: {
        profile,
        isLoading,
        saveProfile,
        updateProfile,
        resetProfile,
      },
    },
    children
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
