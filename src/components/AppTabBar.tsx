import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import {
  HomeTabIcon,
  SearchTabIcon,
  HospitalTabIcon,
  SirenTabIcon,
} from './icons/AppIcons';

import { router } from 'expo-router';

export interface AppTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: any }>;
  };
  descriptors: Record<string, { options: any }>;
  navigation?: {
    emit?: (event: any) => any;
    navigate?: (name: string, params?: any) => void;
  };
  emitter?: {
    emit?: (event: any) => any;
  };
  navigateToTab?: (routeKey: string) => void;
}

export function AppTabBar({ state, descriptors, navigation, emitter, navigateToTab }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const paddingBottom = Math.max(insets.bottom, 18);

  return (
    <View
      style={[
        styles.barContainer,
        {
          paddingBottom,
          backgroundColor: palette.navBg,
          borderTopColor: palette.line,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key] || { options: {} };

        const onPress = () => {
          const emitFn = navigation?.emit || emitter?.emit;
          const event = emitFn ? emitFn({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          }) : null;

          if (!isFocused && (!event || !event.defaultPrevented)) {
            if (navigateToTab) {
              navigateToTab(route.key);
            } else if (navigation?.navigate) {
              navigation.navigate(route.name);
            } else {
              router.push(route.name === 'index' ? '/(tabs)' : (`/(tabs)/${route.name}` as any));
            }
          }
        };

        const onLongPress = () => {
          const emitFn = navigation?.emit || emitter?.emit;
          emitFn?.({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Determine Tab Type
        const isEmergencyTab = route.name === 'emergency';

        if (isEmergencyTab) {
          const emergencyButton = (
            <Pressable
              onPress={onPress}
              onLongPress={onLongPress}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel="Emergency help, Call 112"
              style={({ pressed }) => [
                styles.emergencyTabInner,
                {
                  backgroundColor: palette.red,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <SirenTabIcon size={20} color="#FFFFFF" />
              <Text
                style={[styles.emergencyLabel, { color: '#FFFFFF' }]}
                numberOfLines={1}
              >
                Emergency help
              </Text>
            </Pressable>
          );

          if (isFocused) {
            return (
              <View
                key={route.key}
                style={[
                  styles.emergencyActiveRing,
                  {
                    borderColor: palette.red,
                    backgroundColor: palette.surface,
                  },
                ]}
              >
                {emergencyButton}
              </View>
            );
          }

          return (
            <View key={route.key} style={styles.emergencyWrapper}>
              {emergencyButton}
            </View>
          );
        }

        // Standard 3 tabs: Home, Search, Care nearby
        let label = 'Home';
        let icon = <HomeTabIcon size={20} color={isFocused ? palette.navOnInk : palette.ink2} />;

        if (route.name === 'search') {
          label = 'Search';
          icon = <SearchTabIcon size={20} color={isFocused ? palette.navOnInk : palette.ink2} />;
        } else if (route.name === 'care') {
          label = 'Care nearby';
          icon = <HospitalTabIcon size={20} color={isFocused ? palette.navOnInk : palette.ink2} />;
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${label} tab`}
            style={({ pressed }) => [
              styles.normalTab,
              {
                backgroundColor: isFocused ? palette.navOn : 'transparent',
                opacity: pressed ? 0.85 : 1.0,
              },
            ]}
          >
            {icon}
            <Text
              style={[
                styles.normalLabel,
                {
                  color: isFocused ? palette.navOnInk : palette.ink2,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    zIndex: 100,
  },
  normalTab: {
    flex: 1,
    minHeight: 52,
    minWidth: MIN_TARGET,
    borderRadius: radii.tab,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  normalLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },
  emergencyWrapper: {
    width: 108,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyActiveRing: {
    width: 114,
    minHeight: 58,
    borderRadius: 19,
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyTabInner: {
    width: '100%',
    minHeight: 52,
    borderRadius: radii.tab,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  emergencyLabel: {
    fontFamily: fonts.sansXBold,
    fontSize: 12,
    fontWeight: '800',
  },
});
