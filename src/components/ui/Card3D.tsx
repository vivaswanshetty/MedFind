import React, { ReactNode, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../constants/theme';
import { typography } from '../../theme/tokens';
import { use3DTilt } from '../../hooks/use3DTilt';

export interface Card3DProps {
  /** Content rendered inside the card */
  children: ReactNode;

  /**
   * Elevation depth layer (1 to 5).
   * Determines the diffusion, offset, and blur of the 3 underlying shadow layers.
   * @default 2
   */
  elevation?: 1 | 2 | 3 | 4 | 5;

  /**
   * Whether touch-following 3D perspective tilt is enabled.
   * @default false
   */
  enableTilt?: boolean;

  /**
   * Whether idle vertical floating oscillation is enabled (subtle ±2px bob).
   * @default false
   */
  enableFloat?: boolean;

  /**
   * Card border radius in points.
   * @default 20
   */
  borderRadius?: number;

  /** Additional style applied to the outer container */
  style?: StyleProp<ViewStyle>;

  /** Optional style applied to the inner card content wrapper */
  contentContainerStyle?: StyleProp<ViewStyle>;

  /** Optional callback fired when the card is pressed */
  onPress?: () => void;

  /** Accessibility label for screen readers */
  accessibilityLabel?: string;

  /** Test identifier */
  testID?: string;
}

interface ShadowLayerConfig {
  height: number;
  radius: number;
  opacity: number;
  elevation: number;
}

interface ShadowTier {
  layer1: ShadowLayerConfig;
  layer2: ShadowLayerConfig;
  layer3: ShadowLayerConfig;
}

/**
 * 3 distinct shadow layers at calibrated depths for realistic physical elevation.
 * - Layer 1: Contact shadow (tight, grounding)
 * - Layer 2: Mid-range casting shadow (directional)
 * - Layer 3: Ambient bloom shadow (deep, diffuse)
 */
const ELEVATION_SHADOWS: Record<1 | 2 | 3 | 4 | 5, ShadowTier> = {
  1: {
    layer1: { height: 1, radius: 2, opacity: 0.04, elevation: 1 },
    layer2: { height: 2, radius: 4, opacity: 0.04, elevation: 1 },
    layer3: { height: 6, radius: 10, opacity: 0.03, elevation: 2 },
  },
  2: {
    layer1: { height: 1, radius: 3, opacity: 0.06, elevation: 2 },
    layer2: { height: 4, radius: 8, opacity: 0.07, elevation: 2 },
    layer3: { height: 10, radius: 16, opacity: 0.05, elevation: 3 },
  },
  3: {
    layer1: { height: 2, radius: 4, opacity: 0.08, elevation: 3 },
    layer2: { height: 6, radius: 12, opacity: 0.09, elevation: 3 },
    layer3: { height: 16, radius: 24, opacity: 0.07, elevation: 4 },
  },
  4: {
    layer1: { height: 2, radius: 6, opacity: 0.10, elevation: 4 },
    layer2: { height: 8, radius: 16, opacity: 0.11, elevation: 4 },
    layer3: { height: 22, radius: 32, opacity: 0.09, elevation: 5 },
  },
  5: {
    layer1: { height: 3, radius: 8, opacity: 0.12, elevation: 5 },
    layer2: { height: 12, radius: 22, opacity: 0.14, elevation: 6 },
    layer3: { height: 30, radius: 40, opacity: 0.11, elevation: 8 },
  },
};

/**
 * Generic 3D Card wrapper component.
 *
 * Implements:
 * - 3-depth realistic physical shadows
 * - Optional touch-following 3D perspective tilt via `use3DTilt`
 * - Optional idle floating vertical bob (±2px)
 * - Subtle diagonal glossy specular highlight overlay (3-5% opacity)
 * - Full reduced-motion accessibility support
 */
export function Card3D({
  children,
  elevation = 2,
  enableTilt = false,
  enableFloat = false,
  borderRadius = 20,
  style,
  contentContainerStyle,
  onPress,
  accessibilityLabel,
  testID,
}: Card3DProps) {
  const { palette, scheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Floating bob idle animation (subtle ±2px)
  const floatY = useSharedValue(0);

  // Press feedback scale
  const pressScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  // Hook for 3D tilt tracking
  const tilt = use3DTilt({
    maxDegrees: 8,
    disabled: !enableTilt,
    onPress: handlePress,
  });

  useEffect(() => {
    if (shouldReduceMotion || !enableFloat) {
      floatY.value = 0;
      return;
    }

    floatY.value = withRepeat(
      withSequence(
        withTiming(-2, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(2, {
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      true
    );
  }, [enableFloat, shouldReduceMotion, floatY]);

  const floatAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion || !enableFloat) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [{ translateY: floatY.value }],
    };
  });

  const pressAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion || !onPress) {
      return { transform: [{ scale: 1 }] };
    }
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress && !shouldReduceMotion) {
      pressScale.value = withTiming(0.985, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress && !shouldReduceMotion) {
      pressScale.value = withTiming(1, { duration: 150 });
    }
  };

  const shadowTier = ELEVATION_SHADOWS[elevation] || ELEVATION_SHADOWS[2];
  const darkMultiplier = scheme === 'dark' ? 1.6 : 1;

  const cardContent = (
    <Animated.View
      style={[
        styles.cardBody,
        {
          borderRadius,
          backgroundColor: palette.surface,
          borderColor: palette.line,
        },
        enableTilt ? tilt.animatedStyle : undefined,
        pressAnimatedStyle,
        contentContainerStyle,
      ]}
    >
      {/* Primary Children Content */}
      {children}

      {/* Glossy specular highlight overlay: subtle diagonal 3-5% opacity white */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 0.03)',
          'rgba(255, 255, 255, 0.00)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.65, y: 0.65 }}
        style={[styles.glossyHighlight, { borderRadius }]}
        pointerEvents="none"
      />
    </Animated.View>
  );

  return (
    <Animated.View
      testID={testID}
      style={[styles.outerContainer, floatAnimatedStyle, style]}
      {...(enableTilt ? tilt.panHandlers : {})}
      onLayout={enableTilt ? tilt.onLayout : undefined}
    >
      {/* SHADOW LAYER 3: Deep ambient bloom (furthest spread) */}
      <View
        style={[
          styles.shadowLayer,
          {
            borderRadius,
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: shadowTier.layer3.height },
            shadowOpacity: shadowTier.layer3.opacity * darkMultiplier,
            shadowRadius: shadowTier.layer3.radius,
            elevation: shadowTier.layer3.elevation,
          },
        ]}
        pointerEvents="none"
      />

      {/* SHADOW LAYER 2: Mid-range directional drop shadow */}
      <View
        style={[
          styles.shadowLayer,
          {
            borderRadius,
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: shadowTier.layer2.height },
            shadowOpacity: shadowTier.layer2.opacity * darkMultiplier,
            shadowRadius: shadowTier.layer2.radius,
            elevation: shadowTier.layer2.elevation,
          },
        ]}
        pointerEvents="none"
      />

      {/* SHADOW LAYER 1: Ambient contact shadow (tightest grounding) */}
      <View
        style={[
          styles.shadowLayer,
          {
            borderRadius,
            backgroundColor: palette.surface,
            shadowColor: palette.shadow,
            shadowOffset: { width: 0, height: shadowTier.layer1.height },
            shadowOpacity: shadowTier.layer1.opacity * darkMultiplier,
            shadowRadius: shadowTier.layer1.radius,
            elevation: shadowTier.layer1.elevation,
          },
        ]}
        pointerEvents="none"
      />

      {/* CARD BODY WITH PRESSABLE OR STANDARD VIEW */}
      {onPress && !enableTilt ? (
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={styles.pressableContainer}
        >
          {cardContent}
        </Pressable>
      ) : (
        cardContent
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
  },
  shadowLayer: {
    ...StyleSheet.absoluteFill,
  },
  cardBody: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  pressableContainer: {
    width: '100%',
  },
  glossyHighlight: {
    ...StyleSheet.absoluteFill,
  },
});
