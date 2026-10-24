import React, { useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { onboardingAssets } from '../../../assets/onboarding';

interface DriftingCircleProps {
  size: number;
  opacity: number;
  color: string;
  driftXRange: number;
  driftYRange: number;
  durationX: number;
  durationY: number;
  containerStyle: any;
  shouldReduceMotion: boolean | null;
}

function DriftingCircle({
  size,
  opacity,
  color,
  driftXRange,
  driftYRange,
  durationX,
  durationY,
  containerStyle,
  shouldReduceMotion,
}: DriftingCircleProps) {
  const driftX = useSharedValue(shouldReduceMotion ? 0 : -driftXRange);
  const driftY = useSharedValue(shouldReduceMotion ? 0 : -driftYRange);

  useEffect(() => {
    if (shouldReduceMotion) {
      driftX.value = 0;
      driftY.value = 0;
      return;
    }

    driftX.value = withRepeat(
      withTiming(driftXRange, {
        duration: durationX,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    driftY.value = withRepeat(
      withTiming(driftYRange, {
        duration: durationY,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [shouldReduceMotion, driftXRange, driftYRange, durationX, durationY]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        transform: [{ translateX: 0 }, { translateY: 0 }],
      };
    }
    return {
      transform: [
        { translateX: driftX.value },
        { translateY: driftY.value },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
        containerStyle,
        animatedStyle,
      ]}
    />
  );
}

interface FloatingItemProps {
  source: any;
  size: number;
  targetOpacity: number;
  startX: number;
  startY: number;
  baseRotation: number;
  staggerDelay: number;
  bobDuration: number;
  bobDirection: 1 | -1;
  bobRotateAmount: number;
  containerStyle: any;
  shouldReduceMotion: boolean | null;
}

function FloatingItem({
  source,
  size,
  targetOpacity,
  startX,
  startY,
  baseRotation,
  staggerDelay,
  bobDuration,
  bobDirection,
  bobRotateAmount,
  containerStyle,
  shouldReduceMotion,
}: FloatingItemProps) {
  const progress = useSharedValue(shouldReduceMotion ? 1 : 0);
  const bobY = useSharedValue(0);
  const bobRotate = useSharedValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.value = 1;
      return;
    }

    // 1. Entrance spring starting with 60ms stagger
    progress.value = withDelay(
      staggerDelay,
      withSpring(1, { damping: 13, stiffness: 100 })
    );

    // 2. Continuous gentle bob and subtle rotation after landing
    bobY.value = withDelay(
      staggerDelay + 360,
      withRepeat(
        withTiming(bobDirection * 6, {
          duration: bobDuration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    bobRotate.value = withDelay(
      staggerDelay + 360,
      withRepeat(
        withTiming(bobDirection * bobRotateAmount, {
          duration: Math.round(bobDuration * 1.15),
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [shouldReduceMotion, staggerDelay, bobDuration, bobDirection, bobRotateAmount]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: targetOpacity,
        transform: [
          { scale: 1 },
          { rotate: `${baseRotation}deg` },
        ],
      };
    }

    const p = progress.value;
    const currentScale = 0.6 + 0.4 * p;
    const currentOpacity = p * targetOpacity;
    const currentOffX = (1 - p) * startX;
    const currentOffY = (1 - p) * startY;

    return {
      opacity: currentOpacity,
      transform: [
        { translateX: currentOffX },
        { translateY: currentOffY + bobY.value },
        { scale: currentScale },
        { rotate: `${baseRotation + bobRotate.value}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.absoluteItem,
        containerStyle,
        animatedStyle,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

export function SplashArt() {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Baseline screen height fallbacks
  const h = screenHeight || 800;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Background: 3 large circles with theme.primaryAccent at 0.10 to 0.18 opacity, drifting slowly */}
      <DriftingCircle
        size={280}
        opacity={0.14}
        color={theme.primaryAccent}
        driftXRange={18}
        driftYRange={15}
        durationX={4800}
        durationY={5400}
        containerStyle={{ top: -50, left: -40 }}
        shouldReduceMotion={shouldReduceMotion}
      />
      <DriftingCircle
        size={330}
        opacity={0.11}
        color={theme.primaryAccent}
        driftXRange={20}
        driftYRange={18}
        durationX={5800}
        durationY={5100}
        containerStyle={{ bottom: -70, right: -50 }}
        shouldReduceMotion={shouldReduceMotion}
      />
      <DriftingCircle
        size={230}
        opacity={0.16}
        color={theme.primaryAccent}
        driftXRange={16}
        driftYRange={20}
        durationX={4400}
        durationY={4900}
        containerStyle={{ top: h * 0.38, right: -65 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 6 Illustrated Objects around edges, keeping center clear for wordmark */}
      {/* Depth levels:
          - Far (80 - 120px, lower opacity, slower): tablet (96px, 0.70), cross (90px, 0.65)
          - Mid (120 - 140px): capsule (130px, 0.88), syrup (120px, 0.85)
          - Near (140 - 180px, higher opacity): pin (155px, 1.0), blister (150px, 1.0)
      */}

      {/* 1. Capsule (Top-Left, Mid depth) - Stagger 0ms */}
      <FloatingItem
        source={onboardingAssets.small.capsule}
        size={130}
        targetOpacity={0.88}
        startX={-120}
        startY={-80}
        baseRotation={-18}
        staggerDelay={0}
        bobDuration={2600}
        bobDirection={1}
        bobRotateAmount={3}
        containerStyle={{ top: Math.max(45, h * 0.08), left: 14 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 2. Pin (Top-Right, Near depth) - Stagger 60ms */}
      <FloatingItem
        source={onboardingAssets.small.pin}
        size={155}
        targetOpacity={1.0}
        startX={120}
        startY={-80}
        baseRotation={14}
        staggerDelay={60}
        bobDuration={2200}
        bobDirection={-1}
        bobRotateAmount={2.5}
        containerStyle={{ top: Math.max(50, h * 0.09), right: 16 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 3. Tablet (Mid-Left, Far depth) - Stagger 120ms */}
      <FloatingItem
        source={onboardingAssets.small.tablet}
        size={96}
        targetOpacity={0.70}
        startX={-120}
        startY={0}
        baseRotation={-8}
        staggerDelay={120}
        bobDuration={3100}
        bobDirection={1}
        bobRotateAmount={2}
        containerStyle={{ top: h * 0.40, left: 12 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 4. Syrup (Mid-Right, Mid depth) - Stagger 180ms */}
      <FloatingItem
        source={onboardingAssets.small.syrup}
        size={120}
        targetOpacity={0.85}
        startX={120}
        startY={0}
        baseRotation={10}
        staggerDelay={180}
        bobDuration={2700}
        bobDirection={-1}
        bobRotateAmount={3}
        containerStyle={{ top: h * 0.44, right: 14 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 5. Cross (Bottom-Left, Far depth) - Stagger 240ms */}
      <FloatingItem
        source={onboardingAssets.small.cross}
        size={90}
        targetOpacity={0.65}
        startX={-120}
        startY={80}
        baseRotation={-12}
        staggerDelay={240}
        bobDuration={3300}
        bobDirection={1}
        bobRotateAmount={2}
        containerStyle={{ bottom: Math.max(55, h * 0.10), left: 20 }}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* 6. Blister (Bottom-Right, Near depth) - Stagger 300ms */}
      <FloatingItem
        source={onboardingAssets.small.blister}
        size={150}
        targetOpacity={1.0}
        startX={120}
        startY={80}
        baseRotation={-14}
        staggerDelay={300}
        bobDuration={2100}
        bobDirection={-1}
        bobRotateAmount={3.5}
        containerStyle={{ bottom: Math.max(50, h * 0.09), right: 16 }}
        shouldReduceMotion={shouldReduceMotion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
  },
  absoluteItem: {
    position: 'absolute',
  },
});
