import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../store/profile';
import { useTheme } from '../theme/ThemeContext';
import { resolveRouteAccess } from './_layout';

/**
 * Legacy /portal route redirector.
 * Deep links (medfind://portal) and legacy navigation to /portal redirect:
 * - pharmacist -> /(pharmacy)
 * - customer -> /(tabs)
 * - null -> / (RolePicker)
 */
export default function PortalRedirect() {
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const { palette } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      const destination = resolveRouteAccess(profile.role, '/portal') || '/';
      router.replace(destination as any);
    }
  }, [profile.role, isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ActivityIndicator size="small" color={palette.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
