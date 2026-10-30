import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { fonts } from '../../constants/theme';
import { onboardingAssets } from '../../../assets/onboarding';

export interface SwipeCardsEnhancedProps {
  ageGroup?: string;
  onDone: (answers: boolean[]) => void;
}

export interface QuestionCard {
  id: number;
  statement: string;
  subtext: string;
  image: any;
}

// Default question card set (adult / general)
export const DEFAULT_ADULT_CARDS: QuestionCard[] = [
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

// Child age group (under 5 and 5 to 12)
export const CHILD_CARDS: QuestionCard[] = [
  {
    id: 1,
    statement: "I keep children's medicines at home",
    subtext: 'Syrups, drops, and pediatric first aid',
    image: onboardingAssets.small.cardMedicineBox,
  },
  {
    id: 2,
    statement: "I've struggled to find pediatric medicines",
    subtext: 'Specific doses or brands out of stock',
    image: onboardingAssets.small.cardOutOfStock,
  },
  {
    id: 3,
    statement: 'I manage care for a child',
    subtext: 'Tracking doses, allergies, and visits',
    image: onboardingAssets.small.cardFamily,
  },
  {
    id: 4,
    statement: "I'd like child medicine dose reminders",
    subtext: 'Never miss a scheduled syrup or antibiotic',
    image: onboardingAssets.small.cardReminder,
  },
  {
    id: 5,
    statement: 'I compare pharmacy prices for child care',
    subtext: 'Looking for verified affordable essentials',
    image: onboardingAssets.small.cardCompare,
  },
];

// Teen age group (13 to 17)
export const TEEN_CARDS: QuestionCard[] = [
  {
    id: 1,
    statement: 'I keep basic first aid supplies handy',
    subtext: 'Bandages, pain relief, and essentials',
    image: onboardingAssets.small.cardMedicineBox,
  },
  {
    id: 2,
    statement: "I've had trouble finding items in stock",
    subtext: 'Pharmacies missing what I need',
    image: onboardingAssets.small.cardOutOfStock,
  },
  {
    id: 3,
    statement: 'I buy supplies for sports & school',
    subtext: 'Fitness, seasonal, or student care',
    image: onboardingAssets.small.cardFamily,
  },
  {
    id: 4,
    statement: "I'd like reminders for doses or vitamins",
    subtext: 'Stay consistent with daily routine',
    image: onboardingAssets.small.cardReminder,
  },
  {
    id: 5,
    statement: 'I check nearby prices before buying',
    subtext: 'Finding convenient student-friendly options',
    image: onboardingAssets.small.cardCompare,
  },
];

// Senior age group (60 and above)
export const SENIOR_CARDS: QuestionCard[] = [
  {
    id: 1,
    statement: 'I keep a home medicine organizer',
    subtext: 'Daily prescriptions and vital supplies',
    image: onboardingAssets.small.cardMedicineBox,
  },
  {
    id: 2,
    statement: "I've faced stockouts for regular prescriptions",
    subtext: 'Essential maintenance medicines unavailable',
    image: onboardingAssets.small.cardOutOfStock,
  },
  {
    id: 3,
    statement: 'Someone assists me or I care for family',
    subtext: 'Managing ongoing wellness together',
    image: onboardingAssets.small.cardFamily,
  },
  {
    id: 4,
    statement: "I'd like refill and schedule reminders",
    subtext: 'Timely reminders for recurring medicines',
    image: onboardingAssets.small.cardReminder,
  },
  {
    id: 5,
    statement: 'I compare pharmacy prices and discounts',
    subtext: 'Finding the best rates on ongoing care',
    image: onboardingAssets.small.cardCompare,
  },
];

/**
 * Returns question cards tailored to the user's selected age group.
 */
export function getCardsForAgeGroup(ageGroup?: string): QuestionCard[] {
  if (!ageGroup) return DEFAULT_ADULT_CARDS;
  const normalized = ageGroup.toLowerCase().trim();
  if (normalized === 'under5' || normalized === '5to12' || normalized === 'child') {
    return CHILD_CARDS;
  }
  if (normalized === '13to17' || normalized === 'teen') {
    return TEEN_CARDS;
  }
  if (normalized === '60plus' || normalized === 'senior') {
    return SENIOR_CARDS;
  }
  return DEFAULT_ADULT_CARDS;
}

// ==========================================
// Particle Burst Subcomponent
// ==========================================

export interface ParticleBurstProps {
  x: number;
  y: number;
  color: string;
  count?: number;
  onComplete?: () => void;
}

interface ParticleConfig {
  id: number;
  destX: number;
  destY: number;
}

function SingleParticle({
  color,
  destX,
  destY,
}: {
  color: string;
  destX: number;
  destY: number;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 9, stiffness: 120 });
    opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: progress.value * destX },
        { translateY: progress.value * destY },
        { scale: interpolate(progress.value, [0, 0.35, 1], [0.7, 1.3, 0.4], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particleDot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

/**
 * ParticleBurst renders `count` small circles at position (x, y) that spring outwards
 * in random angles and fade out over 600ms with automatic cleanup.
 */
export function ParticleBurst({
  x,
  y,
  color,
  count = 8,
  onComplete,
}: ParticleBurstProps) {
  const particles = useMemo<ParticleConfig[]>(() => {
    const list: ParticleConfig[] = [];
    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * 2 * Math.PI;
      const angle = baseAngle + (Math.random() - 0.5) * 0.5;
      const distance = 22 + Math.random() * 26;
      list.push({
        id: i,
        destX: Math.cos(angle) * distance,
        destY: Math.sin(angle) * distance,
      });
    }
    return list;
  }, [count]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.particleBurstHost,
        {
          left: x - 2,
          top: y - 2,
        },
      ]}
    >
      {particles.map((p) => (
        <SingleParticle
          key={p.id}
          color={color}
          destX={p.destX}
          destY={p.destY}
        />
      ))}
    </View>
  );
}

interface ActiveBurst {
  id: string;
  x: number;
  y: number;
  color: string;
  count: number;
}

// ==========================================
// Main Enhanced Component
// ==========================================

export function SwipeCardsEnhanced({ ageGroup, onDone }: SwipeCardsEnhancedProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const cards = useMemo(() => getCardsForAgeGroup(ageGroup), [ageGroup]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [yesCount, setYesCount] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [bursts, setBursts] = useState<ActiveBurst[]>([]);

  // Positions for destination particle bursts
  const [binPos, setBinPos] = useState({ x: 28, y: 28 });
  const [boxPos, setBoxPos] = useState({ x: 280, y: 28 });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Responsive dimensions
  const cardWidth = Math.min(screenWidth - 44, 340);
  const cardHeight = Math.min(cardWidth * 1.28, Math.floor(screenHeight * 0.48), 410);
  const imageSize = Math.floor(cardHeight * 0.42);

  // Card movement shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardScaleX = useSharedValue(1);
  const cardScaleY = useSharedValue(1);
  const cardRotation = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const hasCrossedThreshold = useSharedValue(false);
  const isDismissing = useSharedValue(false);

  // Destination animation values: Medicine Box (YES - Right)
  const idlePulse = useSharedValue(1);
  const boxBounceScale = useSharedValue(1);
  const boxGlow = useSharedValue(0);
  const yesBadgeScale = useSharedValue(1);

  // Destination animation values: Trash Bin (NO - Left)
  const lidAngle = useSharedValue(0);
  const lidTranslateY = useSharedValue(0);
  const binShakeX = useSharedValue(0);
  const noBadgeScale = useSharedValue(1);

  // Idle pulse for medicine box (scale 1.0 -> 1.04 -> 1.0 repeating)
  useEffect(() => {
    if (shouldReduceMotion) {
      idlePulse.value = 1;
      return;
    }
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [shouldReduceMotion, idlePulse]);

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

  // Trigger particle burst on JS thread
  const triggerBurst = (type: 'yes' | 'no') => {
    if (shouldReduceMotion) return;
    const isYes = type === 'yes';
    const targetPos = isYes ? boxPos : binPos;
    const burstColor = isYes
      ? theme.primaryAccentText || theme.primaryAccent
      : theme.urgentAccent;

    setBursts((prev) => [
      ...prev,
      {
        id: `burst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: targetPos.x,
        y: targetPos.y,
        color: burstColor,
        count: 8,
      },
    ]);
  };

  // Handle completion and advance to next card
  const onCardAnswered = (answer: boolean) => {
    if (!isMountedRef.current) return;
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);

    // Reset card shared values for the incoming card
    translateX.value = 0;
    translateY.value = 0;
    cardScale.value = 1;
    cardScaleX.value = 1;
    cardScaleY.value = 1;
    cardRotation.value = 0;
    cardOpacity.value = 1;
    hasCrossedThreshold.value = false;
    isDismissing.value = false;
    lidAngle.value = 0;
    lidTranslateY.value = 0;

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onDone(nextAnswers);
    }
  };

  // Arrival impact animation at destination
  const handleDestinationImpact = (isYes: boolean) => {
    setTimeout(() => {
      if (!isMountedRef.current) return;

      if (isYes) {
        // Medicine Box bounce + green glow flash
        boxBounceScale.value = withSequence(
          withTiming(1.26, { duration: 90 }),
          withSpring(1.0, { damping: 8, stiffness: 160 })
        );
        boxGlow.value = withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(0, { duration: 320 })
        );
        // Yes count pop
        yesBadgeScale.value = withSequence(
          withTiming(1.4, { duration: 110 }),
          withSpring(1.0, { damping: 9, stiffness: 180 })
        );
        setYesCount((prev) => prev + 1);
        triggerBurst('yes');
      } else {
        // Trash Bin lid snap shut + shake oscillation (±3px)
        lidAngle.value = withSequence(
          withTiming(6, { duration: 70 }),
          withSpring(0, { damping: 11, stiffness: 220 })
        );
        lidTranslateY.value = withTiming(0, { duration: 70 });
        binShakeX.value = withSequence(
          withTiming(-3, { duration: 35 }),
          withTiming(3, { duration: 35 }),
          withTiming(-2, { duration: 35 }),
          withTiming(2, { duration: 35 }),
          withTiming(0, { duration: 35 })
        );
        // No count pop
        noBadgeScale.value = withSequence(
          withTiming(1.4, { duration: 110 }),
          withSpring(1.0, { damping: 9, stiffness: 180 })
        );
        setNoCount((prev) => prev + 1);
        triggerBurst('no');
      }

      // Allow bounce & burst to register before promoting next card
      setTimeout(() => {
        onCardAnswered(isYes);
      }, 140);
    }, 240);
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

      // Dynamically lift trash bin lid as user drags left toward bin
      if (event.translationX < 0) {
        const progress = Math.min(Math.abs(event.translationX) / threshold, 1.2);
        lidAngle.value = -progress * 42;
        lidTranslateY.value = -progress * 5;
      } else {
        lidAngle.value = 0;
        lidTranslateY.value = 0;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (isDismissing.value) return;

      const threshold = screenWidth * 0.35;
      const isRight = event.translationX > threshold || event.velocityX > 750;
      const isLeft = event.translationX < -threshold || event.velocityX < -750;

      const flyTargetY = -(cardHeight * 0.52 + 34);

      if (isRight) {
        isDismissing.value = true;
        scheduleOnRN(triggerSelectionHaptic);

        // Card shrinks and flies toward Medicine Box (top-right)
        const targetX = cardWidth * 0.42;
        translateX.value = withTiming(targetX, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        translateY.value = withTiming(flyTargetY, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardScale.value = withTiming(0.3, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardOpacity.value = withDelay(190, withTiming(0, { duration: 80 }));

        scheduleOnRN(handleDestinationImpact, true);
      } else if (isLeft) {
        isDismissing.value = true;
        scheduleOnRN(triggerSelectionHaptic);

        // Trash bin lid opens wide to receive card
        lidAngle.value = withTiming(-55, { duration: 180 });
        lidTranslateY.value = withTiming(-7, { duration: 180 });

        // Card crumples (scaleX: 0.6, scaleY: 0.4, rotation: -15deg) and flies toward Trash Bin (top-left)
        const targetX = -cardWidth * 0.42;
        translateX.value = withTiming(targetX, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        translateY.value = withTiming(flyTargetY, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardScaleX.value = withTiming(0.6, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardScaleY.value = withTiming(0.4, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardRotation.value = withTiming(-15, {
          duration: 270,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        cardOpacity.value = withDelay(190, withTiming(0, { duration: 80 }));

        scheduleOnRN(handleDestinationImpact, false);
      } else {
        // User cancelled drag: snap back
        translateX.value = withSpring(0, { damping: 14, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 150 });
        lidAngle.value = withSpring(0, { damping: 14, stiffness: 150 });
        lidTranslateY.value = withSpring(0, { damping: 14, stiffness: 150 });
        hasCrossedThreshold.value = false;
      }
    });

  // Top card animated style: drag + rotation + destination flight transforms
  const topCardAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        transform: [{ scale: 1 }],
        opacity: isDismissing.value ? withTiming(0, { duration: 180 }) : 1,
      };
    }

    const dragRotateDeg = interpolate(
      translateX.value,
      [-screenWidth * 0.5, 0, screenWidth * 0.5],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );

    const activeRotation =
      isDismissing.value && cardRotation.value !== 0
        ? cardRotation.value
        : dragRotateDeg;

    return {
      opacity: cardOpacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${activeRotation}deg` },
        { scale: cardScale.value },
        { scaleX: cardScaleX.value },
        { scaleY: cardScaleY.value },
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

  // Medicine Box destination animated styles
  const boxContainerAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ scale: 1 }] };
    }
    return {
      transform: [{ scale: boxBounceScale.value * idlePulse.value }],
    };
  });

  const boxGlowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: boxGlow.value * 0.45,
    };
  });

  const yesBadgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: yesBadgeScale.value }],
    };
  });

  // Trash Bin destination animated styles
  const binContainerAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ translateX: 0 }] };
    }
    return {
      transform: [{ translateX: binShakeX.value }],
    };
  });

  const lidAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ rotateX: '0deg' }, { translateY: 0 }] };
    }
    return {
      transform: [
        { perspective: 300 },
        { translateY: lidTranslateY.value },
        { rotateX: `${lidAngle.value}deg` },
      ],
    };
  });

  const noBadgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: noBadgeScale.value }],
    };
  });

  // Accessibility / Tappable button handlers
  const handleButtonAnswer = (answer: boolean) => {
    if (isDismissing.value) return;
    isDismissing.value = true;
    triggerSelectionHaptic();

    if (shouldReduceMotion) {
      if (answer) {
        setYesCount((prev) => prev + 1);
      } else {
        setNoCount((prev) => prev + 1);
      }
      onCardAnswered(answer);
      return;
    }

    const flyTargetY = -(cardHeight * 0.52 + 34);

    if (answer) {
      // Fly to Medicine Box (YES)
      const targetX = cardWidth * 0.42;
      translateX.value = withTiming(targetX, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      translateY.value = withTiming(flyTargetY, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardScale.value = withTiming(0.3, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardOpacity.value = withDelay(190, withTiming(0, { duration: 80 }));
      handleDestinationImpact(true);
    } else {
      // Fly & crumple to Trash Bin (NO)
      lidAngle.value = withTiming(-55, { duration: 180 });
      lidTranslateY.value = withTiming(-7, { duration: 180 });

      const targetX = -cardWidth * 0.42;
      translateX.value = withTiming(targetX, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      translateY.value = withTiming(flyTargetY, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardScaleX.value = withTiming(0.6, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardScaleY.value = withTiming(0.4, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardRotation.value = withTiming(-15, {
        duration: 270,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      cardOpacity.value = withDelay(190, withTiming(0, { duration: 80 }));
      handleDestinationImpact(false);
    }
  };

  const currentCard = cards[currentIndex];
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header & Segmented Progress Bar */}
        <View style={styles.topSection}>
          <View style={styles.progressRow}>
            {cards.map((_, idx) => (
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

        {/* Animated Destinations Row (Trash Bin on Left, Medicine Box on Right) */}
        <View style={[styles.destinationsRow, { width: cardWidth }]}>
          {/* Active Particle Bursts */}
          {bursts.map((b) => (
            <ParticleBurst
              key={b.id}
              x={b.x}
              y={b.y}
              color={b.color}
              count={b.count}
              onComplete={() => {
                setBursts((prev) => prev.filter((item) => item.id !== b.id));
              }}
            />
          ))}

          {/* Left: Trash Bin destination */}
          <View
            style={styles.destinationCol}
            onLayout={(e) => {
              const layout = e.nativeEvent.layout;
              setBinPos({ x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 });
            }}
          >
            <View style={styles.destinationWrapper}>
              <Animated.View
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`No answers: ${noCount}`}
                style={[
                  styles.destinationBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.glass.shadowColor,
                  },
                  binContainerAnimatedStyle,
                ]}
              >
                {/* Trash Bin Icon made with Views */}
                <View style={styles.trashBinIconWrapper}>
                  {/* Lid line & handle with 3D lift transform */}
                  <Animated.View style={[styles.trashLidWrapper, lidAnimatedStyle]}>
                    <View
                      style={[
                        styles.trashLidHandle,
                        { backgroundColor: theme.urgentAccent },
                      ]}
                    />
                    <View
                      style={[
                        styles.trashLidLine,
                        { backgroundColor: theme.urgentAccent },
                      ]}
                    />
                  </Animated.View>
                  {/* Bin Body with fluted ribs */}
                  <View
                    style={[
                      styles.trashBody,
                      {
                        borderColor: theme.urgentAccent,
                        backgroundColor: 'rgba(178, 59, 42, 0.08)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.trashRib,
                        { backgroundColor: theme.urgentAccent },
                      ]}
                    />
                    <View
                      style={[
                        styles.trashRib,
                        { backgroundColor: theme.urgentAccent },
                      ]}
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Count Badge for NO answers */}
              <Animated.View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.urgentAccent,
                    borderColor: theme.surface,
                  },
                  noBadgeAnimatedStyle,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    {
                      color: '#FFFFFF',
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {noCount}
                </Text>
              </Animated.View>
            </View>
            <Text
              style={[
                styles.destinationCaption,
                { color: theme.urgentAccent, fontFamily: fonts.sansMedium },
              ]}
            >
              No
            </Text>
          </View>

          {/* Right: Medicine Box destination */}
          <View
            style={styles.destinationCol}
            onLayout={(e) => {
              const layout = e.nativeEvent.layout;
              setBoxPos({ x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 });
            }}
          >
            <View style={styles.destinationWrapper}>
              <Animated.View
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`Medicine Box yes answers: ${yesCount}`}
                style={[
                  styles.destinationBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.glass.shadowColor,
                  },
                  boxContainerAnimatedStyle,
                ]}
              >
                {/* Glow flash overlay */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    styles.boxGlowOverlay,
                    {
                      backgroundColor: theme.primaryAccent,
                    },
                    boxGlowAnimatedStyle,
                  ]}
                />

                {/* Medicine Box Icon made with Views */}
                <View style={styles.medicineBoxIconWrapper}>
                  {/* Top Handle */}
                  <View
                    style={[
                      styles.boxHandle,
                      { borderColor: theme.primaryAccentText || theme.primaryAccent },
                    ]}
                  />
                  {/* Box Body with Cross Symbol */}
                  <View
                    style={[
                      styles.boxBody,
                      {
                        borderColor: theme.primaryAccentText || theme.primaryAccent,
                        backgroundColor: theme.badgeBackground || theme.surfaceSubtle,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.crossHorizontal,
                        { backgroundColor: theme.primaryAccentText || theme.primaryAccent },
                      ]}
                    />
                    <View
                      style={[
                        styles.crossVertical,
                        { backgroundColor: theme.primaryAccentText || theme.primaryAccent },
                      ]}
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Count Badge for YES answers */}
              <Animated.View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.primaryAccent,
                    borderColor: theme.surface,
                  },
                  yesBadgeAnimatedStyle,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    {
                      color: theme.textInverse || '#FFFFFF',
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {yesCount}
                </Text>
              </Animated.View>
            </View>
            <Text
              style={[
                styles.destinationCaption,
                {
                  color: theme.primaryAccentText || theme.primaryAccent,
                  fontFamily: fonts.sansMedium,
                },
              ]}
            >
              Yes
            </Text>
          </View>
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

export default SwipeCardsEnhanced;

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
    marginBottom: 14,
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
    marginBottom: 4,
  },
  subline: {
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Destinations Row (Trash Bin top-left, Medicine Box top-right)
  destinationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    alignSelf: 'center',
    paddingHorizontal: 8,
    marginTop: 6,
    marginBottom: 2,
    zIndex: 20,
    overflow: 'visible',
  },
  destinationCol: {
    alignItems: 'center',
    gap: 3,
  },
  destinationWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  destinationBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  boxGlowOverlay: {
    borderRadius: 16,
  },
  destinationCaption: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    elevation: 4,
  },
  countBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },

  // Medicine Box View Icon
  medicineBoxIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxHandle: {
    width: 12,
    height: 4,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    marginBottom: 1,
  },
  boxBody: {
    width: 26,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossHorizontal: {
    position: 'absolute',
    width: 12,
    height: 3.5,
    borderRadius: 1.5,
  },
  crossVertical: {
    position: 'absolute',
    width: 3.5,
    height: 12,
    borderRadius: 1.5,
  },

  // Trash Bin View Icon
  trashBinIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashLidWrapper: {
    alignItems: 'center',
    marginBottom: 1.5,
  },
  trashLidHandle: {
    width: 7,
    height: 2.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  trashLidLine: {
    width: 24,
    height: 2.5,
    borderRadius: 1.25,
  },
  trashBody: {
    width: 20,
    height: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1.6,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 1,
  },
  trashRib: {
    width: 1.6,
    height: 10,
    borderRadius: 0.8,
    opacity: 0.75,
  },

  // Particle System Styles
  particleBurstHost: {
    position: 'absolute',
    width: 4,
    height: 4,
    overflow: 'visible',
    zIndex: 9999,
  },
  particleDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Card Area & Stack
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
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
    height: 180,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statement: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  cardSubtext: {
    fontSize: 13,
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

  // Bottom Buttons
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 56,
    paddingTop: 8,
    paddingBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 6,
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
