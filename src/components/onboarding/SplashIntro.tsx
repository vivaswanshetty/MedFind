import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { SplashArt } from './SplashArt';

interface SplashIntroProps {
  onDone: () => void;
}

const WORDMARK = ['M', 'e', 'd', 'F', 'i', 'n', 'd'];

interface AnimatedLetterProps {
  letter: string;
  index: number;
  color: string;
  fontFamily: string;
}

function AnimatedLetter({ letter, index, color, fontFamily }: AnimatedLetterProps) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      500 + index * 70,
      withSpring(1, { damping: 14, stiffness: 120 })
    );
  }, [index, p]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * 28 },
      { scale: 0.9 + 0.1 * p.value },
    ],
  }));

  return (
    <Animated.Text
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.letter,
        {
          color,
          fontFamily,
        },
        animatedStyle,
      ]}
    >
      {letter}
    </Animated.Text>
  );
}

export function SplashIntro({ onDone }: SplashIntroProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Haptic trigger at start
  useEffect(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore on unsupported devices or web
    }
  }, []);

  // Reduced motion: static display and call onDone after 1000ms
  useEffect(() => {
    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        onDone();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldReduceMotion, onDone]);

  // Overlay fade out at 2600ms over 350ms, followed by onDone at 2950ms
  const overlayOpacity = useSharedValue(1);
  useEffect(() => {
    if (!shouldReduceMotion) {
      overlayOpacity.value = withDelay(
        2600,
        withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) })
      );
      const timer = setTimeout(() => {
        onDone();
      }, 2950);
      return () => clearTimeout(timer);
    }
  }, [shouldReduceMotion, onDone, overlayOpacity]);

  // Ring pulse outward animation: scale 0.6 -> 1.6, opacity 0.5 -> 0, 1400ms, starts at 200ms
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0.5);
  useEffect(() => {
    if (!shouldReduceMotion) {
      ringScale.value = withDelay(
        200,
        withTiming(1.6, { duration: 1400, easing: Easing.out(Easing.cubic) })
      );
      ringOpacity.value = withDelay(
        200,
        withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [shouldReduceMotion, ringScale, ringOpacity]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  // App icon entrance spring at 280ms
  const appIconProgress = useSharedValue(shouldReduceMotion ? 1 : 0);
  useEffect(() => {
    if (!shouldReduceMotion) {
      appIconProgress.value = withDelay(
        280,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, appIconProgress]);

  const appIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: appIconProgress.value,
    transform: [
      { scale: 0.7 + 0.3 * appIconProgress.value },
      { translateY: (1 - appIconProgress.value) * 16 },
    ],
  }));

  // Soft pill-shaped highlight scaling in at 400ms
  const pillScale = useSharedValue(shouldReduceMotion ? 1 : 0.5);
  const pillOpacity = useSharedValue(shouldReduceMotion ? 1 : 0);
  useEffect(() => {
    if (!shouldReduceMotion) {
      pillScale.value = withDelay(
        400,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
      pillOpacity.value = withDelay(
        400,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
      );
    }
  }, [shouldReduceMotion, pillScale, pillOpacity]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value * 0.12,
  }));

  // Tagline fade in at 1300ms (textSecondary, size 15, translateY 10 to 0)
  const taglineProgress = useSharedValue(0);
  useEffect(() => {
    if (!shouldReduceMotion) {
      taglineProgress.value = withDelay(
        1300,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      );
    }
  }, [shouldReduceMotion, taglineProgress]);

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineProgress.value,
    transform: [{ translateY: (1 - taglineProgress.value) * 10 }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (shouldReduceMotion) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.container,
          { backgroundColor: theme.canvas },
        ]}
        accessible={true}
        accessibilityLabel="MedFind"
      >
        <SplashArt />
        <View style={styles.centerContainer}>
          <View style={styles.appIconContainer}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.appIcon}
              resizeMode="cover"
            />
          </View>
          <View style={styles.wordmarkContainer}>
            <View
              style={[
                styles.pillHighlight,
                { backgroundColor: theme.primaryAccent, opacity: 0.12 },
              ]}
            />
            <View style={styles.wordmarkRow}>
              {WORDMARK.map((char, index) => (
                <Text
                  key={index}
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.letter,
                    {
                      color: theme.textPrimary,
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {char}
                </Text>
              ))}
            </View>
          </View>
          <Text
            style={[
              styles.tagline,
              {
                color: theme.textSecondary,
                fontFamily: typography.fontFamilyRegular,
              },
            ]}
          >
            Medicine, found.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: theme.canvas },
        overlayAnimatedStyle,
      ]}
      accessible={true}
      accessibilityLabel="MedFind"
    >
      {/* Background illustration art behind ring and wordmark */}
      <SplashArt />

      {/* 220px Pulse Ring behind the wordmark */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          { borderColor: theme.primaryAccent },
          ringAnimatedStyle,
        ]}
      />

      {/* Centered App Icon, Wordmark and Tagline */}
      <View style={styles.centerContainer}>
        {/* App Icon */}
        <Animated.View style={[styles.appIconContainer, appIconAnimatedStyle]}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.appIcon}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Wordmark with soft pill highlight */}
        <View style={styles.wordmarkContainer}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pillHighlight,
              { backgroundColor: theme.primaryAccent },
              pillAnimatedStyle,
            ]}
          />
          <View style={styles.wordmarkRow}>
            {WORDMARK.map((char, index) => (
              <AnimatedLetter
                key={index}
                letter={char}
                index={index}
                color={theme.textPrimary}
                fontFamily={typography.fontFamilyBold}
              />
            ))}
          </View>
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              color: theme.textSecondary,
              fontFamily: typography.fontFamilyRegular,
            },
            taglineAnimatedStyle,
          ]}
        >
          Medicine, found.
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  appIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  wordmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pillHighlight: {
    position: 'absolute',
    width: 250,
    height: 64,
    borderRadius: 32,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 52,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  tagline: {
    fontSize: 15,
    marginTop: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

