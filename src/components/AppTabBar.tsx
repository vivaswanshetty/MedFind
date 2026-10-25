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
import { useLanguage } from '../context/LanguageContext';
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

interface TabButtonProps {
  routeKey: string;
  index?: number;
  isFocused: boolean;
  label: string;
  icon: React.ReactNode;
  isEmergencyTab: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (e: any) => void;
  scheme: 'light' | 'dark';
  palette: any;
}

/**
 * DynamicIslandTabButton provides the bounce/spring animation for individual inner buttons
 * without moving or shaking the overall navigation bar.
 */
function DynamicIslandTabButton({
  routeKey,
  isFocused,
  label,
  icon,
  isEmergencyTab,
  onPress,
  onLongPress,
  onLayout,
  scheme,
  palette,
}: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Spring bounce effect for inner button when this tab becomes selected
  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.0,
          friction: 4.5,
          tension: 110,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.86,
      duration: 70,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      friction: 4.5,
      tension: 110,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      key={routeKey}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      onLayout={onLayout}
      accessible={true}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${label} tab`}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.innerButtonContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Tab Icon */}
        <View style={styles.iconWrapper}>
          {icon}
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
      </Animated.View>
    </Pressable>
  );
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
  const { t } = useLanguage();

  // Tab layout measurements for dynamic island morphing slider
  const [tabLayouts, setTabLayouts] = useState<{ [key: number]: LayoutRectangle }>({});

  // Dynamic Island sliding indicator animations (strictly for the inner indicator pill)
  const indicatorAnimX = useRef(new Animated.Value(0)).current;
  const indicatorAnimW = useRef(new Animated.Value(0)).current;
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
    // Steady outer Dynamic Island bar: no bounce effect on the whole bar
    <View
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

      {/* Tabs Row with Inner Button Bounce Effect */}
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
        let label = t('tab_home', 'Home');
        let icon = (
          <HomeTabIcon
            size={22}
            color={isFocused ? palette.navOnInk : palette.ink2}
          />
        );

        if (route.name === 'search') {
          label = t('tab_search', 'Search');
          icon = (
            <SearchTabIcon
              size={22}
              color={isFocused ? palette.navOnInk : palette.ink2}
            />
          );
        } else if (route.name === 'care') {
          label = t('tab_care', 'Care');
          icon = (
            <HospitalTabIcon
              size={22}
              color={isFocused ? palette.navOnInk : palette.ink2}
            />
          );
        } else if (isEmergencyTab) {
          label = t('tab_emergency', 'Emergency');
          icon = (
            <Animated.View
              style={
                isFocused
                  ? { transform: [{ scale: emergencyPulseAnim }] }
                  : undefined
              }
            >
              <SirenTabIcon
                size={22}
                color={isFocused ? '#FFFFFF' : palette.red}
              />
            </Animated.View>
          );
        }

        return (
          <DynamicIslandTabButton
            key={route.key}
            routeKey={route.key}
            index={index}
            isFocused={isFocused}
            label={label}
            icon={icon}
            isEmergencyTab={isEmergencyTab}
            onPress={onPress}
            onLongPress={onLongPress}
            onLayout={(e) => handleTabLayout(index, e.nativeEvent.layout)}
            scheme={scheme}
            palette={palette}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  islandContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 66,
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
    top: 5,
    bottom: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    zIndex: 1,
  },
  tabItem: {
    flex: 1,
    height: 56,
    minWidth: MIN_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  innerButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
});
