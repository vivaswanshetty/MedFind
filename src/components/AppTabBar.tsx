import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutRectangle,
} from 'react-native';
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

export function AppTabBar({
  state,
  descriptors,
  navigation,
  emitter,
  navigateToTab,
}: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();

  // Tab layout measurements for dynamic island morphing slider
  const [tabLayouts, setTabLayouts] = useState<{ [key: number]: LayoutRectangle }>({});

  // Dynamic Island sliding indicator animations
  const indicatorAnimX = useRef(new Animated.Value(0)).current;
  const indicatorAnimW = useRef(new Animated.Value(0)).current;
  const islandScaleAnim = useRef(new Animated.Value(1)).current;
  const emergencyPulseAnim = useRef(new Animated.Value(1)).current;

  // Emergency siren pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(emergencyPulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(emergencyPulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // Update sliding island indicator whenever active index or tab layout changes
  useEffect(() => {
    const activeLayout = tabLayouts[state.index];
    if (!activeLayout) return;

    Animated.parallel([
      Animated.spring(indicatorAnimX, {
        toValue: activeLayout.x,
        friction: 7.5,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorAnimW, {
        toValue: activeLayout.width,
        friction: 7.5,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(islandScaleAnim, {
          toValue: 0.96,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(islandScaleAnim, {
          toValue: 1.0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, tabLayouts]);

  const handleTabLayout = (index: number, layout: LayoutRectangle) => {
    setTabLayouts((prev) => ({
      ...prev,
      [index]: layout,
    }));
  };

  const isEmergencyActive = state.routes[state.index]?.name === 'emergency';
  const bottomPosition = Math.max(insets.bottom, 12) + 6;

  return (
    <Animated.View
      style={[
        styles.islandContainer,
        {
          bottom: bottomPosition,
          backgroundColor:
            scheme === 'dark'
              ? 'rgba(18, 18, 24, 0.92)'
              : 'rgba(255, 252, 245, 0.94)',
          borderColor:
            scheme === 'dark'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(90, 62, 43, 0.12)',
          shadowColor: palette.shadow,
          transform: [{ scale: islandScaleAnim }],
        },
      ]}
      accessibilityRole="tablist"
    >
      {/* Sliding Morphing Island Background Indicator */}
      {tabLayouts[state.index] && (
        <Animated.View
          style={[
            styles.islandIndicatorPill,
            {
              left: indicatorAnimX,
              width: indicatorAnimW,
              backgroundColor: isEmergencyActive
                ? palette.red
                : scheme === 'dark'
                ? 'rgba(0, 229, 255, 0.15)'
                : 'rgba(135, 169, 107, 0.22)',
              borderColor: isEmergencyActive
                ? 'rgba(255, 255, 255, 0.35)'
                : scheme === 'dark'
                ? 'rgba(0, 229, 255, 0.35)'
                : 'rgba(135, 169, 107, 0.35)',
            },
          ]}
        />
      )}

      {/* Tabs Row */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const isEmergencyTab = route.name === 'emergency';

        const onPress = () => {
          const emitFn = navigation?.emit || emitter?.emit;
          const event = emitFn
            ? emitFn({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
            : null;

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

        // Tab Content Configuration
        let label = 'Home';
        let icon = (
          <HomeTabIcon
            size={19}
            color={isFocused ? palette.navOnInk : palette.ink2}
          />
        );

        if (route.name === 'search') {
          label = 'Search';
          icon = (
            <SearchTabIcon
              size={19}
              color={isFocused ? palette.navOnInk : palette.ink2}
            />
          );
        } else if (route.name === 'care') {
          label = 'Care';
          icon = (
            <HospitalTabIcon
              size={19}
              color={isFocused ? palette.navOnInk : palette.ink2}
            />
          );
        } else if (isEmergencyTab) {
          label = 'Emergency';
          icon = (
            <Animated.View
              style={
                isFocused
                  ? { transform: [{ scale: emergencyPulseAnim }] }
                  : undefined
              }
            >
              <SirenTabIcon
                size={19}
                color={isFocused ? '#FFFFFF' : palette.red}
              />
            </Animated.View>
          );
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            onLayout={(e) => handleTabLayout(index, e.nativeEvent.layout)}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${label} tab`}
            style={({ pressed }) => [
              styles.tabItem,
              {
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            {/* Tab Icon */}
            <View style={styles.iconWrapper}>
              {icon}
              {/* Dynamic Island Glowing Dot when Active */}
              {isFocused && !isEmergencyTab && (
                <View
                  style={[
                    styles.activeIslandDot,
                    {
                      backgroundColor:
                        scheme === 'dark' ? '#00E5FF' : palette.okInk,
                    },
                  ]}
                />
              )}
            </View>

            {/* Tab Label */}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isEmergencyTab
                    ? isFocused
                      ? '#FFFFFF'
                      : palette.red
                    : isFocused
                    ? palette.navOnInk
                    : palette.ink2,
                  fontFamily: isFocused ? fonts.sansBold : fonts.sansMedium,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  islandContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1.2,
    zIndex: 999,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 16,
  },
  islandIndicatorPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    zIndex: 1,
  },
  tabItem: {
    flex: 1,
    height: 52,
    minWidth: MIN_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    zIndex: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    position: 'relative',
  },
  activeIslandDot: {
    position: 'absolute',
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
