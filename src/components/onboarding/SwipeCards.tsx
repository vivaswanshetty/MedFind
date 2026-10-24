import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { onboardingAssets } from '../../../assets/onboarding';

export interface SwipeCardsProps {
  onDone: (answers: boolean[]) => void;
}

interface QuestionCard {
  id: number;
  statement: string;
  subtext: string;
  image: any;
}

const CARDS: QuestionCard[] = [
  {
    id: 1,
    statement: 'I keep a medicine box at home',
    subtext: 'Basic first aid and essentials',
    image: onboardingAssets.small.cardMedicineBox,
  },
  {
    id: 2,
    statement: "I've struggled to find a medicine in stock",
    subtext: 'Pharmacies out of stock nearby',
    image: onboardingAssets.small.cardOutOfStock,
  },
  {
    id: 3,
    statement: 'I buy medicines for my family',
    subtext: 'Caring for parents or children',
    image: onboardingAssets.small.cardFamily,
  },
  {
    id: 4,
    statement: "I'd like refill reminders",
    subtext: 'Never miss a scheduled dose',
    image: onboardingAssets.small.cardReminder,
  },
  {
    id: 5,
    statement: 'I compare prices before buying',
    subtext: 'Looking for the best pharmacy value',
    image: onboardingAssets.small.cardCompare,
  },
];

export function SwipeCards({ onDone }: SwipeCardsProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Card dimensions with responsive height constraint
  const cardWidth = Math.min(screenWidth - 44, 340);
  const cardHeight = Math.min(cardWidth * 1.28, Math.floor(screenHeight * 0.52), 430);
  const imageSize = Math.floor(cardHeight * 0.44);

  // Gesture shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const hasCrossedThreshold = useSharedValue(false);
  const isDismissing = useSharedValue(false);

  // Haptic helpers executed on JS thread via scheduleOnRN
  const triggerLightHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
  };

  const triggerSelectionHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
  };

  // Card dismissal on JS thread
  const onCardAnswered = (answer: boolean) => {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);

    // Reset card translation for the next card
    setTimeout(() => {
      translateX.value = 0;
      translateY.value = 0;
      hasCrossedThreshold.value = false;
      isDismissing.value = false;

      if (currentIndex + 1 < CARDS.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onDone(nextAnswers);
      }
    }, 220);
  };

  // Pan gesture for top card
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (isDismissing.value) return;

      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.18; // gentle vertical follow

      const threshold = screenWidth * 0.35;
      const isPast = Math.abs(event.translationX) > threshold;

      if (isPast && !hasCrossedThreshold.value) {
        hasCrossedThreshold.value = true;
        scheduleOnRN(triggerLightHaptic);
      } else if (!isPast && hasCrossedThreshold.value) {
        hasCrossedThreshold.value = false;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (isDismissing.value) return;

      const threshold = screenWidth * 0.35;
      const isRight = event.translationX > threshold || event.velocityX > 750;
      const isLeft = event.translationX < -threshold || event.velocityX < -750;

      if (isRight) {
        isDismissing.value = true;
        scheduleOnRN(triggerSelectionHaptic);
        translateX.value = withSpring(screenWidth + 160, {
          velocity: event.velocityX,
          damping: 14,
          stiffness: 100,
        });
        scheduleOnRN(onCardAnswered, true);
      } else if (isLeft) {
        isDismissing.value = true;
        scheduleOnRN(triggerSelectionHaptic);
        translateX.value = withSpring(-screenWidth - 160, {
          velocity: event.velocityX,
          damping: 14,
          stiffness: 100,
        });
        scheduleOnRN(onCardAnswered, false);
      } else {
        translateX.value = withSpring(0, { damping: 14, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 150 });
        hasCrossedThreshold.value = false;
      }
    });

  // Top card animated style: drag + rotation (-12 to 12 degrees)
  const topCardAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        transform: [{ scale: 1 }],
        opacity: isDismissing.value ? withTiming(0, { duration: 180 }) : 1,
      };
    }

    const rotateDeg = interpolate(
      translateX.value,
      [-screenWidth * 0.5, 0, screenWidth * 0.5],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotateDeg}deg` },
      ],
    };
  });

  // Next card underneath: scales up from 0.94 to 1.0 as top card is swiped
  const nextCardAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        transform: [{ scale: 1 }],
      };
    }

    const scale = interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.35],
      [0.94, 1.0],
      Extrapolation.CLAMP
    );

    const translateYOffset = interpolate(
      Math.abs(translateX.value),
      [0, screenWidth * 0.35],
      [12, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY: translateYOffset }],
    };
  });

  // Green "Yes" label & tint (fades in on right drag)
  const yesOverlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [15, screenWidth * 0.3],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Red "No" label & tint (fades in on left drag)
  const noOverlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-15, -screenWidth * 0.3],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Accessibility / Tappable button handlers
  const handleButtonAnswer = (answer: boolean) => {
    if (isDismissing.value) return;
    isDismissing.value = true;
    triggerSelectionHaptic();

    if (shouldReduceMotion) {
      onCardAnswered(answer);
      return;
    }

    const targetX = answer ? screenWidth + 160 : -screenWidth - 160;
    translateX.value = withSpring(targetX, { damping: 14, stiffness: 120 });
    onCardAnswered(answer);
  };

  const currentCard = CARDS[currentIndex];
  const nextCard = currentIndex + 1 < CARDS.length ? CARDS[currentIndex + 1] : null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header & Segmented Progress Bar */}
        <View style={styles.topSection}>
          <View style={styles.progressRow}>
            {CARDS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor:
                      idx < answers.length
                        ? theme.primaryAccent
                        : idx === answers.length
                        ? theme.borderFocus
                        : theme.border,
                  },
                ]}
              />
            ))}
          </View>

          <Text
            style={[
              styles.title,
              {
                color: theme.textPrimary,
                fontFamily: typography.fontFamilyBold,
              },
            ]}
          >
            Go ahead, swipe
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
            Right for yes, left for no
          </Text>
        </View>

        {/* Card Stack Area */}
        <View style={styles.cardArea}>
          {/* Card Underneath (Next Card) */}
          {nextCard && (
            <Animated.View
              style={[
                styles.card,
                styles.underCard,
                {
                  width: cardWidth,
                  height: cardHeight,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.glass.shadowColor,
                },
                nextCardAnimatedStyle,
              ]}
              pointerEvents="none"
            >
              <View style={[styles.illustrationStage, { backgroundColor: theme.surfaceSubtle }]}>
                <Image
                  source={nextCard.image}
                  style={{ width: imageSize, height: imageSize }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.statement,
                  {
                    color: theme.textPrimary,
                    fontFamily: typography.fontFamilyBold,
                  },
                ]}
              >
                {nextCard.statement}
              </Text>
              <Text
                style={[
                  styles.cardSubtext,
                  {
                    color: theme.textSecondary,
                    fontFamily: typography.fontFamilyRegular,
                  },
                ]}
              >
                {nextCard.subtext}
              </Text>
            </Animated.View>
          )}

          {/* Top Draggable Card */}
          {currentCard && (
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.glass.shadowColor,
                  },
                  topCardAnimatedStyle,
                ]}
              >
                {/* Green "YES" Stamp Overlay & Tint */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.stampOverlay,
                    { backgroundColor: 'rgba(135, 169, 107, 0.08)' },
                    yesOverlayAnimatedStyle,
                  ]}
                >
                  <View style={[styles.stampBadge, { borderColor: theme.primaryAccent }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4.5 4.5L19 7"
                        stroke={theme.primaryAccentText || theme.primaryAccent}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text
                      style={[
                        styles.stampText,
                        {
                          color: theme.primaryAccentText || theme.primaryAccent,
                          fontFamily: typography.fontFamilyBold,
                        },
                      ]}
                    >
                      YES
                    </Text>
                  </View>
                </Animated.View>

                {/* Red "NO" Stamp Overlay & Tint */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.stampOverlay,
                    { backgroundColor: 'rgba(178, 59, 42, 0.08)' },
                    noOverlayAnimatedStyle,
                  ]}
                >
                  <View style={[styles.stampBadge, { borderColor: theme.urgentAccent }]}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 6L6 18M6 6l12 12"
                        stroke={theme.urgentAccent}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text
                      style={[
                        styles.stampText,
                        {
                          color: theme.urgentAccent,
                          fontFamily: typography.fontFamilyBold,
                        },
                      ]}
                    >
                      NO
                    </Text>
                  </View>
                </Animated.View>

                {/* Card Content */}
                <View style={[styles.illustrationStage, { backgroundColor: theme.surfaceSubtle }]}>
                  <Image
                    source={currentCard.image}
                    style={{ width: imageSize, height: imageSize }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.statement,
                    {
                      color: theme.textPrimary,
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {currentCard.statement}
                </Text>
                <Text
                  style={[
                    styles.cardSubtext,
                    {
                      color: theme.textSecondary,
                      fontFamily: typography.fontFamilyRegular,
                    },
                  ]}
                >
                  {currentCard.subtext}
                </Text>
              </Animated.View>
            </GestureDetector>
          )}
        </View>

        {/* Bottom Accessibility Round Buttons (No / Yes) */}
        <View style={styles.bottomSection}>
          <View style={styles.actionItem}>
            <Pressable
              onPress={() => handleButtonAnswer(false)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="No"
              style={({ pressed }) => [
                styles.actionButton,
                {
                  borderColor: theme.urgentAccent,
                  backgroundColor: theme.surface,
                  shadowColor: theme.urgentAccent,
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={theme.urgentAccent}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            <Text
              style={[
                styles.actionLabel,
                { color: theme.urgentAccent, fontFamily: typography.fontFamilyBold },
              ]}
            >
              No
            </Text>
          </View>

          <View style={styles.actionItem}>
            <Pressable
              onPress={() => handleButtonAnswer(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Yes"
              style={({ pressed }) => [
                styles.actionButton,
                {
                  borderColor: theme.primaryAccent,
                  backgroundColor: theme.surface,
                  shadowColor: theme.primaryAccent,
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 13l4.5 4.5L19 7"
                  stroke={theme.primaryAccentText || theme.primaryAccent}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: theme.primaryAccentText || theme.primaryAccent,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
            >
              Yes
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99998,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    gap: 6,
    marginBottom: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subline: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  underCard: {
    position: 'absolute',
  },
  illustrationStage: {
    width: '100%',
    height: 195,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statement: {
    fontSize: 19,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 25,
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  cardSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.1,
  },
  stampOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  stampText: {
    fontSize: 20,
    letterSpacing: 1.5,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 56,
    paddingTop: 12,
    paddingBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
