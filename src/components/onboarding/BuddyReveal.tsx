import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { getBuddy, BuddyProfile } from '../../lib/buddy';

export interface BuddyRevealProps {
  answers: boolean[];
  onDone: (buddy: BuddyProfile) => void;
}

interface TraitChipProps {
  trait: string;
  index: number;
  shouldReduceMotion: boolean | null;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

function TraitChip({
  trait,
  index,
  shouldReduceMotion,
  textColor,
  bgColor,
  borderColor,
}: TraitChipProps) {
  const scale = useSharedValue(shouldReduceMotion ? 1 : 0);
  const opacity = useSharedValue(shouldReduceMotion ? 1 : 0);
  const translateY = useSharedValue(shouldReduceMotion ? 0 : 16);

  useEffect(() => {
    if (shouldReduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    scale.value = withDelay(
      index * 70,
      withSpring(1, { damping: 14, stiffness: 140 })
    );
    opacity.value = withDelay(
      index * 70,
      withTiming(1, { duration: 200 })
    );
    translateY.value = withDelay(
      index * 70,
      withSpring(0, { damping: 14, stiffness: 140 })
    );
  }, [shouldReduceMotion, index, scale, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.traitChip,
        {
          backgroundColor: bgColor,
          borderColor,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.traitText,
          {
            color: textColor,
            fontFamily: typography.fontFamilyMedium,
          },
        ]}
      >
        {trait}
      </Text>
    </Animated.View>
  );
}

function DotLoader({
  dotColor,
  shouldReduceMotion,
}: {
  dotColor: string;
  shouldReduceMotion: boolean | null;
}) {
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) return;

    dot1Scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 280, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.7, { duration: 280, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    dot2Scale.value = withDelay(
      140,
      withRepeat(
        withSequence(
          withTiming(1.35, { duration: 280, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.7, { duration: 280, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    dot3Scale.value = withDelay(
      280,
      withRepeat(
        withSequence(
          withTiming(1.35, { duration: 280, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.7, { duration: 280, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, [shouldReduceMotion, dot1Scale, dot2Scale, dot3Scale]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: shouldReduceMotion ? 1 : withTiming(dot1Scale.value > 1 ? 1 : 0.4),
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: shouldReduceMotion ? 1 : withTiming(dot2Scale.value > 1 ? 1 : 0.4),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
    opacity: shouldReduceMotion ? 1 : withTiming(dot3Scale.value > 1 ? 1 : 0.4),
  }));

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dot1Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dot2Style]} />
      <Animated.View style={[styles.dot, { backgroundColor: dotColor }, dot3Style]} />
    </View>
  );
}

export function BuddyReveal({ answers, onDone }: BuddyRevealProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [phase, setPhase] = useState<'fetching' | 'revealed'>('fetching');
  const buddy = useMemo(() => getBuddy(answers), [answers]);

  // Wobble animation for mascot-think in fetching phase
  const wobbleRotation = useSharedValue(0);

  // Reveal phase spring & pop values
  const revealScale = useSharedValue(shouldReduceMotion ? 1 : 0.65);
  const revealOpacity = useSharedValue(shouldReduceMotion ? 1 : 0);
  const fetchingOpacity = useSharedValue(1);

  // Fetching duration: 600ms for reduced motion, 1400ms for standard
  const fetchDuration = shouldReduceMotion ? 600 : 1400;

  useEffect(() => {
    if (!shouldReduceMotion) {
      wobbleRotation.value = withRepeat(
        withSequence(
          withTiming(-7, { duration: 240, easing: Easing.inOut(Easing.sin) }),
          withTiming(7, { duration: 240, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    }
  }, [shouldReduceMotion, wobbleRotation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out fetching and pop in reveal
      if (!shouldReduceMotion) {
        fetchingOpacity.value = withTiming(0, { duration: 180 });
      }

      setPhase('revealed');

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Gracefully ignore
      }

      if (!shouldReduceMotion) {
        revealScale.value = withSpring(1, {
          damping: 11,
          stiffness: 130,
          mass: 0.9,
        });
        revealOpacity.value = withTiming(1, { duration: 260 });
      } else {
        revealScale.value = 1;
        revealOpacity.value = 1;
      }
    }, fetchDuration);

    return () => clearTimeout(timer);
  }, [fetchDuration, shouldReduceMotion, fetchingOpacity, revealScale, revealOpacity]);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobbleRotation.value}deg` }],
  }));

  const revealMascotStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ scale: revealScale.value }],
  }));

  const fetchingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fetchingOpacity.value,
  }));

  const mascotCelebrateSize = Math.min(220, Math.floor(screenWidth * 0.58), Math.floor(screenHeight * 0.28));
  const mascotThinkSize = Math.min(170, Math.floor(screenWidth * 0.46));

  const handleMeetPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
    onDone(buddy);
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        {phase === 'fetching' ? (
          /* FETCHING PHASE */
          <Animated.View style={[styles.fetchingContainer, fetchingAnimatedStyle]}>
            <Animated.View style={[styles.thinkMascotWrapper, wobbleStyle]}>
              <Image
                source={onboardingAssets.mascotThink}
                style={{ width: mascotThinkSize, height: mascotThinkSize }}
                resizeMode="contain"
                accessibilityLabel="Pill Pal thinking"
              />
            </Animated.View>

            <View style={styles.fetchingTextWrapper}>
              <Text
                style={[
                  styles.fetchingTitle,
                  {
                    color: theme.textPrimary,
                    fontFamily: typography.fontFamilyBold,
                  },
                ]}
              >
                Fetching your buddy...
              </Text>
              <Text
                style={[
                  styles.fetchingSubtitle,
                  {
                    color: theme.textSecondary,
                    fontFamily: typography.fontFamilyRegular,
                  },
                ]}
              >
                Matching your health and routine preferences
              </Text>

              <DotLoader
                dotColor={theme.primaryAccent}
                shouldReduceMotion={shouldReduceMotion}
              />
            </View>
          </Animated.View>
        ) : (
          /* REVEALED PHASE */
          <View style={styles.revealWrapper}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Header Headline */}
              <View style={styles.headerBlock}>
                <Text
                  style={[
                    styles.foundHeadline,
                    {
                      color: theme.textSecondary,
                      fontFamily: typography.fontFamilyMedium,
                    },
                  ]}
                >
                  Your buddy has been found
                </Text>
              </View>

              {/* Celebrating Mascot with Spring Pop */}
              <Animated.View style={[styles.celebrateMascotWrapper, revealMascotStyle]}>
                <Image
                  source={onboardingAssets.mascotCelebrate}
                  style={{ width: mascotCelebrateSize, height: mascotCelebrateSize }}
                  resizeMode="contain"
                  accessibilityLabel={`${buddy.name} celebrating`}
                />
              </Animated.View>

              {/* Name & Archetype Badge */}
              <View style={styles.profileSection}>
                <Text
                  style={[
                    styles.buddyName,
                    {
                      color: theme.textPrimary,
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {buddy.name}
                </Text>

                <View
                  style={[
                    styles.archetypeBadge,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.archetypeText,
                      {
                        color: theme.primaryAccentText || theme.primaryAccent,
                        fontFamily: typography.fontFamilyBold,
                      },
                    ]}
                  >
                    {buddy.archetype}
                  </Text>
                </View>

                {/* Friendly Blurb */}
                <Text
                  style={[
                    styles.buddyBlurb,
                    {
                      color: theme.textSecondary,
                      fontFamily: typography.fontFamilyRegular,
                    },
                  ]}
                >
                  {buddy.blurb}
                </Text>

                {/* Trait Chips Staggered In */}
                <View style={styles.traitsRow}>
                  {buddy.traits.map((trait, index) => (
                    <TraitChip
                      key={trait}
                      trait={trait}
                      index={index}
                      shouldReduceMotion={shouldReduceMotion}
                      textColor={theme.textPrimary}
                      bgColor={theme.surface}
                      borderColor={theme.border}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Meet Button */}
            <View style={[styles.bottomBar, { borderTopColor: theme.border }]}>
              <Pressable
                onPress={handleMeetPress}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primaryAccent,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Meet ${buddy.name}`}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: theme.textInverse || '#FFFFFF',
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  Meet {buddy.name}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  fetchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  thinkMascotWrapper: {
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchingTextWrapper: {
    alignItems: 'center',
  },
  fetchingTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  fetchingSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
    maxWidth: 280,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    height: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  revealWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerBlock: {
    marginBottom: 16,
    alignItems: 'center',
  },
  foundHeadline: {
    fontSize: 15,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  celebrateMascotWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  buddyName: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  archetypeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  archetypeText: {
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  buddyBlurb: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
    letterSpacing: 0.1,
    marginBottom: 20,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  traitChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  traitText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
});
