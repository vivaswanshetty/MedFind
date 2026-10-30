import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useProfile, isProviderRole } from '../store/profile';
import { useTheme } from '../theme/ThemeContext';

export default function RootIndex() {
  const { profile, isLoading } = useProfile();
  const { palette } = useTheme();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  // If customer skipped onboarding for an emergency, route straight to emergency help
  if (profile.role === 'customer' && profile.onboardingSkippedAt && !profile.onboardingComplete) {
    return <Redirect href="/(tabs)/emergency" />;
  }

  // If customer has completed onboarding, go straight to home tabs
  if (profile.role === 'customer' && profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  // If verified provider role, go to pharmacy portal
  if (isProviderRole(profile.role)) {
    return <Redirect href="/(pharmacy)" />;
  }

  // When role is null or onboarding is active, render neutral canvas
  // The RolePicker or Onboarding steps in _layout.tsx are presented above this.
  return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
}
