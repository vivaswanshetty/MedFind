import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Coordinates,
  KnownArea,
  PREDEFINED_AREAS,
  requestDeviceLocation,
  checkLocationPermission,
  LocationRequestResult,
} from '../services/locationService';

const ONBOARDING_COMPLETED_KEY = '@medfind_onboarding_completed_v1';
const SELECTED_AREA_NAME_KEY = '@medfind_user_area_name_v1';
const LOCATION_SOURCE_KEY = '@medfind_location_source_v1';

export type LocationSource = 'gps' | 'manual_area' | 'none';

export interface LocationContextValue {
  userLocation: Coordinates | null;
  areaName: string;
  locationSource: LocationSource;
  isLocating: boolean;
  hasLocationPermission: boolean;
  hasCompletedOnboarding: boolean;
  isLoadingInitialState: boolean;
  showAreaPickerModal: boolean;
  setShowAreaPickerModal: (show: boolean) => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (show: boolean) => void;
  requestGpsLocation: () => Promise<LocationRequestResult>;
  selectManualArea: (area: KnownArea | { name: string; latitude?: number; longitude?: number }) => Promise<void>;
  clearLocation: () => void;
  completeOnboarding: () => Promise<void>;
  replayOnboarding: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  // Session-only in-memory coordinates. NEVER stored to disk or uploaded.
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [areaName, setAreaName] = useState<string>('All Bengaluru');
  const [locationSource, setLocationSource] = useState<LocationSource>('none');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true); // default true until checked
  const [isLoadingInitialState, setIsLoadingInitialState] = useState<boolean>(true);
  const [showAreaPickerModal, setShowAreaPickerModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    async function initializeLocationState() {
      try {
        // 1. Check if user has completed onboarding before
        const onboardingVal = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        const isDone = onboardingVal === 'true';

        // 2. Check previous location source and saved area
        const savedSource = (await AsyncStorage.getItem(LOCATION_SOURCE_KEY)) as LocationSource | null;
        const savedAreaName = await AsyncStorage.getItem(SELECTED_AREA_NAME_KEY);

        // 3. Check existing foreground permission status (non-prompting)
        const hasPermission = await checkLocationPermission();

        if (!isCancelled) {
          setHasCompletedOnboarding(isDone);
          setHasLocationPermission(hasPermission);

          if (!isDone) {
            setShowOnboardingModal(true);
          }

          if (savedSource === 'manual_area' && savedAreaName) {
            // User intentionally selected a manual area previously
            setAreaName(savedAreaName);
            const match = PREDEFINED_AREAS.find((a) => a.name.toLowerCase() === savedAreaName.toLowerCase());
            if (match) {
              setUserLocation({ latitude: match.latitude, longitude: match.longitude });
              setLocationSource('manual_area');
            } else {
              setLocationSource('manual_area');
            }
          } else if (hasPermission) {
            // Permission already granted: automatically retrieve actual accurate device GPS!
            requestDeviceLocation().then((result) => {
              if (!isCancelled && result.granted && result.coords) {
                setUserLocation(result.coords);
                setLocationSource('gps');
                setHasLocationPermission(true);
                if (result.areaName) {
                  setAreaName(result.areaName);
                }
              }
            });
          } else if (savedAreaName) {
            setAreaName(savedAreaName);
            const match = PREDEFINED_AREAS.find((a) => a.name.toLowerCase() === savedAreaName.toLowerCase());
            if (match) {
              setUserLocation({ latitude: match.latitude, longitude: match.longitude });
              setLocationSource('manual_area');
            }
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!isCancelled) {
          setIsLoadingInitialState(false);
        }
      }
    }

    initializeLocationState();

    return () => {
      isCancelled = true;
    };
  }, []);

  /**
   * Request device foreground GPS location.
   * Device coordinates are held in-memory ONLY for current session.
   */
  const requestGpsLocation = async (): Promise<LocationRequestResult> => {
    setIsLocating(true);
    try {
      const result = await requestDeviceLocation();
      if (result.granted && result.coords) {
        setUserLocation(result.coords);
        setLocationSource('gps');
        setHasLocationPermission(true);
        await AsyncStorage.setItem(LOCATION_SOURCE_KEY, 'gps');
        if (result.areaName) {
          setAreaName(result.areaName);
          // Save only the readable locality text, never the raw lat/long
          await AsyncStorage.setItem(SELECTED_AREA_NAME_KEY, result.areaName);
        }
      } else {
        setHasLocationPermission(false);
      }
      return result;
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Set a manual neighborhood area (e.g. Basavanagudi, Jayanagar)
   */
  const selectManualArea = async (area: KnownArea | { name: string; latitude?: number; longitude?: number }) => {
    setAreaName(area.name);
    setLocationSource('manual_area');
    if (area.latitude !== undefined && area.longitude !== undefined) {
      setUserLocation({ latitude: area.latitude, longitude: area.longitude });
    } else {
      setUserLocation(null);
    }
    await AsyncStorage.setItem(LOCATION_SOURCE_KEY, 'manual_area');
    // Save human-readable area name to storage (no precise coords saved)
    await AsyncStorage.setItem(SELECTED_AREA_NAME_KEY, area.name);
  };

  /**
   * Clear active location filter
   */
  const clearLocation = async () => {
    setUserLocation(null);
    setAreaName('All Bengaluru');
    setLocationSource('none');
    await AsyncStorage.removeItem(LOCATION_SOURCE_KEY);
    await AsyncStorage.removeItem(SELECTED_AREA_NAME_KEY);
  };

  /**
   * Mark onboarding as completed
   */
  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    setShowOnboardingModal(false);
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  };

  /**
   * Replay onboarding guide
   */
  const replayOnboarding = () => {
    setShowOnboardingModal(true);
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        areaName,
        locationSource,
        isLocating,
        hasLocationPermission,
        hasCompletedOnboarding,
        isLoadingInitialState,
        showAreaPickerModal,
        setShowAreaPickerModal,
        showOnboardingModal,
        setShowOnboardingModal,
        requestGpsLocation,
        selectManualArea,
        clearLocation,
        completeOnboarding,
        replayOnboarding,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
