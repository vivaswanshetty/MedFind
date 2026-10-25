import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useProfile } from '../../store/profile';
import {
  pharmacyPortalService,
  StorePartnerAuth,
} from '../../services/pharmacyPortalService';
import { Pharmacy } from '../../types/models';
import { StoreOnboardingModal } from '../../components/portal/StoreOnboardingModal';

export default function PharmacyLayout() {
  const router = useRouter();
  const { palette } = useTheme();
  const { profile, updateProfile } = useProfile();

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [partnerAuth, setPartnerAuth] = useState<StorePartnerAuth | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  const checkAuth = useCallback(async () => {
    try {
      const [auth, storeList] = await Promise.all([
        pharmacyPortalService.getStorePartnerAuth(),
        pharmacyPortalService.getPharmacies(),
      ]);
      setPartnerAuth(auth);
      setPharmacies(storeList);
    } catch {
      // Keep null auth
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Re-check auth when screen gains focus
  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [checkAuth])
  );

  const handleVerificationComplete = async (auth: StorePartnerAuth) => {
    await pharmacyPortalService.saveStorePartnerAuth(auth);
    setPartnerAuth(auth);
  };

  const handleBackToRolePicker = async () => {
    await updateProfile({ role: null });
    router.replace('/');
  };

  if (isAuthLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="small" color={palette.accent} />
      </View>
    );
  }

  // If unauthorized: show verification step with visible Back / Change role button
  // Stock and store screens are completely unreachable
  if (!partnerAuth?.isAuthorized) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: palette.bg }]}>
        <StoreOnboardingModal
          pharmacies={pharmacies}
          onComplete={handleVerificationComplete}
          onCancel={handleBackToRolePicker}
          cancelLabel="Back / Change role"
        />
      </View>
    );
  }

  // When authorized: render pharmacy stack (inventory & store)
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 260,
        contentStyle: {
          backgroundColor: palette.bg,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="store" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
  },
});
