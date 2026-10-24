import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { onboardingAssets } from '../../../assets/onboarding';

export interface AllDoneProps {
  name: string | null;
  onDone: () => void;
}

interface ConfettiItemConfig {
  key: string;
  source: any;
  size: number;
  leftPercent: number;
  topPercent: number;
  driftY: number;
  duration: number;
  baseRotate: number;
  delay: number;
}

function ConfettiItem({
  config,
  shouldReduceMotion,
}: {
  config: ConfettiItemConfig;
  shouldReduceMotion: boolean | null;
}) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(config.baseRotate);

  useEffect(() => {
    if (shouldReduceMotion) return;

    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: config.duration,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.baseRotate + 14, {
            duration: config.duration * 0.9,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(config.baseRotate - 14, {
            duration: config.duration * 0.9,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );
  }, [shouldReduceMotion, config, translateY, rotate]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        transform: [{ rotate: `${config.baseRotate}deg` }],
      };
    }
    return {
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confettiItem,
        {
          left: `${config.leftPercent}%`,
          top: `${config.topPercent}%`,
          width: config.size,
          height: config.size,
        },
        animatedStyle,
      ]}
    >
      <Image
        source={config.source}
        style={{ width: config.size, height: config.size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export function AllDone({ name, onDone }: AllDoneProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();

  // Screen fade out controller
  const screenOpacity = useSharedValue(1);

  // Mascot spring pop-in
  const mascotScale = useSharedValue(shouldReduceMotion ? 1 : 0.5);
  const mascotOpacity = useSharedValue(shouldReduceMotion ? 1 : 0);

  // Badge scale spring and rotate
  const badgeScale = useSharedValue(shouldReduceMotion ? 1 : 0);
  const badgeRotate = useSharedValue(shouldReduceMotion ? 0 : -45);

  const mascotSize = Math.min(200, Math.floor(screenWidth * 0.52));

  // Confetti items using small assets with fallback to originals
  const small = onboardingAssets.small;
  const confettiList: ConfettiItemConfig[] = [
    {
      key: 'capsule',
      source: small?.capsule ?? onboardingAssets.capsule,
      size: 42,
      leftPercent: 12,
      topPercent: 16,
      driftY: -35,
      duration: 3600,
      baseRotate: -15,
      delay: 0,
    },
    {
      key: 'tablet',
      source: small?.tablet ?? onboardingAssets.tablet,
      size: 34,
      leftPercent: 82,
      topPercent: 20,
      driftY: -40,
      duration: 4100,
      baseRotate: 18,
      delay: 350,
    },
    {
      key: 'pin',
      source: small?.pin ?? onboardingAssets.pin,
      size: 40,
      leftPercent: 18,
      topPercent: 72,
      driftY: -45,
      duration: 3800,
      baseRotate: 12,
      delay: 700,
    },
    {
      key: 'cross',
      source: small?.cross ?? onboardingAssets.cross,
      size: 32,
      leftPercent: 80,
      topPercent: 68,
      driftY: -32,
      duration: 3400,
      baseRotate: -20,
      delay: 200,
    },
    {
      key: 'blister',
      source: small?.blister ?? onboardingAssets.blister,
      size: 44,
      leftPercent: 8,
      topPercent: 44,
      driftY: -38,
      duration: 4200,
      baseRotate: 8,
      delay: 500,
    },
    {
      key: 'syrup',
      source: small?.syrup ?? onboardingAssets.syrup,
      size: 36,
      leftPercent: 86,
      topPercent: 42,
      driftY: -36,
      duration: 3900,
      baseRotate: -10,
      delay: 850,
    },
  ];

  useEffect(() => {
    // 1. Success haptic on mount
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Gracefully ignore
    }

    // 2. Entrance animations
    if (!shouldReduceMotion) {
      mascotScale.value = withSpring(1, { damping: 11, stiffness: 130 });
      mascotOpacity.value = withTiming(1, { duration: 250 });

      badgeScale.value = withDelay(
        180,
        withSpring(1, { damping: 12, stiffness: 150 })
      );
      badgeRotate.value = withDelay(
        180,
        withSpring(0, { damping: 12, stiffness: 150 })
      );
    }

    // 3. Completion timers: 900ms if reduced motion, 1800ms otherwise
    const waitDuration = shouldReduceMotion ? 900 : 1800;
    const fadeDuration = shouldReduceMotion ? 150 : 350;

    const fadeTimer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: fadeDuration });
    }, waitDuration);

    const doneTimer = setTimeout(() => {
      onDone();
    }, waitDuration + fadeDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [shouldReduceMotion, mascotScale, mascotOpacity, badgeScale, badgeRotate, screenOpacity, onDone]);

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ scale: mascotScale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  const formattedHeadline = name && name.trim() ? `All set, ${name.trim()}!` : 'All set!';

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: theme.canvas },
        screenAnimatedStyle,
      ]}
    >
      {/* Background Drifting Confetti (6 splash objects) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {confettiList.map((item) => (
          <ConfettiItem
            key={item.key}
            config={item}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Mascot Stage with Check Badge */}
          <View style={[styles.mascotStage, { width: mascotSize, height: mascotSize }]}>
            <Animated.View style={mascotAnimatedStyle}>
              <Image
                source={onboardingAssets.mascotCelebrate}
                style={{ width: mascotSize, height: mascotSize }}
                resizeMode="contain"
                accessibilityLabel="Pill Pal celebrating"
              />
            </Animated.View>

            {/* Circular Check Badge */}
            <Animated.View
              style={[
                styles.checkBadge,
                {
                  backgroundColor: theme.primaryAccent,
                  borderColor: theme.canvas,
                },
                badgeAnimatedStyle,
              ]}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 13l4.5 4.5L19 7"
                  stroke={theme.textInverse || '#FFFFFF'}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Text Section */}
          <View style={styles.textSection}>
            <Text
              style={[
                styles.headline,
                {
                  color: theme.textPrimary,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
            >
              {formattedHeadline}
            </Text>

            <Text
              style={[
                styles.subline,
                {
                  color: theme.textSecondary,
                  fontFamily: typography.fontFamilyRegular,
                },
              ]}
            >
              Let's find your medicine.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confettiItem: {
    position: 'absolute',
    opacity: 0.22,
  },
  mascotStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subline: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
