import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography, ColorPalette } from '../../theme/tokens';
import { onboardingAssets } from '../../../assets/onboarding';
import { WhoOption } from './WhoPicker';

export type AgeGroup = 'under5' | '5to12' | '13to17' | '18to59' | '60plus';
export type Who = WhoOption;

export interface AgePickerProps {
  who: Who;
  onSelect: (age: AgeGroup) => void;
}

interface AgeChipItem {
  id: AgeGroup;
  label: string;
  subtitle: string;
}

const ALL_AGE_CHIPS: AgeChipItem[] = [
  { id: 'under5', label: 'Under 5', subtitle: 'Infant / Toddler' },
  { id: '5to12', label: '5 to 12', subtitle: 'Child' },
  { id: '13to17', label: '13 to 17', subtitle: 'Teen' },
  { id: '18to59', label: '18 to 59', subtitle: 'Adult' },
  { id: '60plus', label: '60 and above', subtitle: 'Senior' },
];

function getHeadline(who: Who): string {
  switch (who) {
    case 'me':
      return 'How old are you?';
    case 'child':
      return 'How old is your child?';
    case 'parent':
      return 'How old is your parent?';
    case 'other':
    default:
      return 'How old are they?';
  }
}

interface AgeChipProps {
  item: AgeChipItem;
  index: number;
  isSelected: boolean;
  onPress: (id: AgeGroup) => void;
  shouldReduceMotion: boolean | null;
  theme: ColorPalette;
}

function AgeChip({
  item,
  index,
  isSelected,
  onPress,
  shouldReduceMotion,
  theme,
}: AgeChipProps) {
  // Staggered spring-in chips: translateY 30 to 0 and fade, 80ms stagger
  const entrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const chipScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.02 : 1.0) : 1.0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      entrance.value = withDelay(
        140 + index * 80,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, index, entrance]);

  useEffect(() => {
    if (shouldReduceMotion) {
      chipScale.value = isSelected ? 1.02 : 1.0;
      return;
    }

    if (isSelected) {
      chipScale.value = withSequence(
        withTiming(0.97, { duration: 70 }),
        withSpring(1.02, { damping: 12, stiffness: 160 })
      );
    } else {
      chipScale.value = withSpring(1.0, { damping: 14, stiffness: 150 });
    }
  }, [isSelected, shouldReduceMotion, chipScale]);

  const chipAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: 1,
        transform: [{ scale: isSelected ? 1.02 : 1.0 }],
      };
    }
    const p = entrance.value;
    return {
      opacity: p,
      transform: [
        { translateY: (1 - p) * 30 },
        { scale: chipScale.value },
      ],
    };
  });

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
    onPress(item.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}, ${item.subtitle}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={styles.chipPressable}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? theme.badgeBackground : theme.surface,
            borderColor: isSelected ? theme.primaryAccent : theme.border,
            borderWidth: isSelected ? 2.5 : 1.5,
            shadowColor: theme.glass.shadowColor,
            shadowOpacity: isSelected ? 0.14 : 0.04,
          },
          chipAnimatedStyle,
        ]}
      >
        <View style={styles.chipTextContainer}>
          <Text
            style={[
              styles.chipLabel,
              {
                color: isSelected && theme.primaryAccentText ? theme.primaryAccentText : theme.textPrimary,
                fontFamily: isSelected ? typography.fontFamilyBold : typography.fontFamilyMedium,
              },
            ]}
          >
            {item.label}
          </Text>
          <Text
            style={[
              styles.chipSubtitle,
              {
                color: theme.textSecondary,
                fontFamily: typography.fontFamilyRegular,
              },
            ]}
          >
            {item.subtitle}
          </Text>
        </View>

        {/* Radio Indicator */}
        <View
          style={[
            styles.radioCircle,
            {
              borderColor: isSelected ? theme.primaryAccent : theme.border,
              backgroundColor: isSelected ? theme.primaryAccent : 'transparent',
            },
          ]}
        >
          {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.textInverse }]} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function AgePicker({ who, onSelect }: AgePickerProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);

  // Filter chips based on who:
  // - 'child': Under 5, 5 to 12, 13 to 17
  // - 'parent': 18 to 59, 60 and above
  // - 'me' / 'other': all five
  const chips = useMemo(() => {
    if (who === 'child') {
      return ALL_AGE_CHIPS.filter(
        (c) => c.id === 'under5' || c.id === '5to12' || c.id === '13to17'
      );
    }
    if (who === 'parent') {
      return ALL_AGE_CHIPS.filter(
        (c) => c.id === '18to59' || c.id === '60plus'
      );
    }
    return ALL_AGE_CHIPS;
  }, [who]);

  // Mascot ("Pill Pal" thinking pose) entrance and gentle head tilt
  const mascotEntrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const mascotRotate = useSharedValue(0);
  const mascotPop = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) {
      mascotEntrance.value = 1;
      return;
    }

    mascotEntrance.value = withSpring(1, { damping: 14, stiffness: 120 });
    mascotRotate.value = withDelay(
      300,
      withSequence(
        withTiming(-5, { duration: 180, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 220, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) })
      )
    );
  }, [shouldReduceMotion, mascotEntrance, mascotRotate]);

  // Subtle mascot nod on selection
  useEffect(() => {
    if (shouldReduceMotion || !selectedAge) return;

    mascotPop.value = withSequence(
      withTiming(1.12, { duration: 100, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 10, stiffness: 160 })
    );
  }, [selectedAge, shouldReduceMotion, mascotPop]);

  const mascotAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ scale: 1 }, { rotate: '0deg' }] };
    }
    return {
      opacity: mascotEntrance.value,
      transform: [
        { scale: mascotEntrance.value * mascotPop.value },
        { rotate: `${mascotRotate.value}deg` },
      ],
    };
  });

  // Continue button entrance: fade and rise once an age is selected
  const continueProgress = useSharedValue(shouldReduceMotion ? (selectedAge ? 1 : 0) : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      continueProgress.value = selectedAge ? 1 : 0;
      return;
    }

    if (selectedAge) {
      continueProgress.value = withSpring(1, { damping: 14, stiffness: 120 });
    } else {
      continueProgress.value = withTiming(0, { duration: 180 });
    }
  }, [selectedAge, shouldReduceMotion, continueProgress]);

  const continueAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: selectedAge ? 1 : 0.4,
        transform: [{ translateY: 0 }],
      };
    }
    return {
      opacity: continueProgress.value,
      transform: [{ translateY: (1 - continueProgress.value) * 20 }],
    };
  });

  const handleChipPress = (id: AgeGroup) => {
    setSelectedAge(id);
  };

  const handleContinue = () => {
    if (!selectedAge) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
    onSelect(selectedAge);
  };

  const headline = getHeadline(who);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Mascot (Pill Pal Thinking) */}
          <Animated.View style={[styles.mascotContainer, mascotAnimatedStyle]}>
            <Image
              source={onboardingAssets.mascotThink}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Headline and Subline */}
          <View style={styles.headerContainer}>
            <Text
              style={[
                styles.headline,
                {
                  color: theme.textPrimary,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
            >
              {headline}
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
              Tap one. You can change it later.
            </Text>
          </View>

          {/* Chips Stack */}
          <View style={styles.chipsContainer}>
            {chips.map((item, index) => (
              <AgeChip
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedAge === item.id}
                onPress={handleChipPress}
                shouldReduceMotion={shouldReduceMotion}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Bottom Continue Button */}
        <Animated.View
          style={[
            styles.bottomBar,
            continueAnimatedStyle,
          ]}
          pointerEvents={selectedAge ? 'auto' : 'none'}
        >
          <Pressable
            onPress={handleContinue}
            disabled={!selectedAge}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Continue"
            style={[
              styles.continueButton,
              {
                backgroundColor: theme.primaryAccent,
                shadowColor: theme.primaryAccent,
              },
            ]}
          >
            <Text
              style={[
                styles.continueButtonText,
                {
                  color: theme.textInverse,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </Animated.View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headline: {
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
  chipsContainer: {
    width: '100%',
    maxWidth: 380,
    gap: 10,
  },
  chipPressable: {
    width: '100%',
  },
  chip: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  chipTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipLabel: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  chipSubtitle: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    width: '100%',
  },
  continueButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
