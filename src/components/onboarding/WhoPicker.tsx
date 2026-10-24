import React, { useState, useEffect } from 'react';
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

export type WhoOption = 'me' | 'parent' | 'child' | 'other';
export type Who = WhoOption;

interface WhoPickerProps {
  onSelect: (who: WhoOption) => void;
}

interface WhoCardItem {
  id: WhoOption;
  label: string;
  image: any;
}

const WHO_CARDS: WhoCardItem[] = [
  { id: 'me', label: 'Me', image: onboardingAssets.whoMe },
  { id: 'parent', label: 'Parent', image: onboardingAssets.whoParent },
  { id: 'child', label: 'Child', image: onboardingAssets.whoChild },
  { id: 'other', label: 'Someone else', image: onboardingAssets.whoOther },
];

interface WhoCardProps {
  item: WhoCardItem;
  index: number;
  isSelected: boolean;
  onPress: (id: WhoOption) => void;
  cardWidth: number;
  cardHeight: number;
  imageSize: number;
  shouldReduceMotion: boolean | null;
  theme: ColorPalette;
}

function WhoCard({
  item,
  index,
  isSelected,
  onPress,
  cardWidth,
  cardHeight,
  imageSize,
  shouldReduceMotion,
  theme,
}: WhoCardProps) {
  // Staggered entrance: translateY 40 to 0 and fade, 80ms stagger
  const entrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const cardScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.04 : 1.0) : 1.0);
  const bounceY = useSharedValue(0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      entrance.value = withDelay(
        150 + index * 80,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, index, entrance]);

  // Handle selection state changes: scale 0.96 and back, then 1.04 if selected
  useEffect(() => {
    if (shouldReduceMotion) {
      cardScale.value = isSelected ? 1.04 : 1.0;
      return;
    }

    if (isSelected) {
      cardScale.value = withSequence(
        withTiming(0.96, { duration: 80 }),
        withSpring(1.04, { damping: 12, stiffness: 160 })
      );
      // Small bounce for selected card illustration
      bounceY.value = withSequence(
        withTiming(-10, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 8, stiffness: 140 })
      );
    } else {
      cardScale.value = withSpring(1.0, { damping: 14, stiffness: 150 });
      bounceY.value = 0;
    }
  }, [isSelected, shouldReduceMotion, cardScale, bounceY]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: 1,
        transform: [{ scale: isSelected ? 1.04 : 1.0 }],
      };
    }
    const p = entrance.value;
    return {
      opacity: p,
      transform: [
        { translateY: (1 - p) * 40 },
        { scale: cardScale.value },
      ],
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [{ translateY: bounceY.value }],
    };
  });

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore on unsupported devices
    }
    onPress(item.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={{ width: cardWidth }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            height: cardHeight,
            backgroundColor: theme.surface,
            borderColor: isSelected ? theme.primaryAccent : theme.border,
            borderWidth: isSelected ? 2.5 : 1.5,
            shadowColor: theme.glass.shadowColor,
            shadowOpacity: isSelected ? 0.16 : 0.05,
          },
          cardAnimatedStyle,
        ]}
      >
        <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
          <Image
            source={item.image}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
          />
        </Animated.View>
        <Text
          style={[
            styles.cardLabel,
            {
              color: isSelected && theme.primaryAccentText ? theme.primaryAccentText : theme.textPrimary,
              fontFamily: isSelected ? typography.fontFamilyBold : typography.fontFamilyMedium,
            },
          ]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function WhoPicker({ onSelect }: WhoPickerProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<WhoOption | null>(null);

  // Responsive grid calculations
  const horizontalPadding = 20;
  const gridGap = 14;
  const availableWidth = screenWidth - horizontalPadding * 2;
  const cardWidth = Math.floor((availableWidth - gridGap) / 2);
  const cardHeight = Math.floor(cardWidth * 1.06);
  const imageSize = Math.floor(cardHeight * 0.58);

  // Mascot entrance spring & wave-style wobble
  const mascotEntrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const mascotRotate = useSharedValue(0);
  const mascotPop = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) {
      mascotEntrance.value = 1;
      return;
    }

    mascotEntrance.value = withSpring(1, { damping: 14, stiffness: 120 });

    // Mascot does one small wave wobble (rotate -6 to 6 degrees, twice)
    mascotRotate.value = withDelay(
      320,
      withSequence(
        withTiming(6, { duration: 120, easing: Easing.inOut(Easing.sin) }),
        withTiming(-6, { duration: 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(6, { duration: 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(-6, { duration: 150, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) })
      )
    );
  }, [shouldReduceMotion, mascotEntrance, mascotRotate]);

  // When a card is selected, trigger a quick pop on the mascot
  useEffect(() => {
    if (shouldReduceMotion || !selected) return;

    mascotPop.value = withSequence(
      withTiming(1.15, { duration: 100, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 10, stiffness: 160 })
    );
  }, [selected, shouldReduceMotion, mascotPop]);

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

  // Bottom Continue button entrance: fade & rise when selected !== null
  const continueProgress = useSharedValue(shouldReduceMotion ? (selected ? 1 : 0) : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      continueProgress.value = selected ? 1 : 0;
      return;
    }

    if (selected) {
      continueProgress.value = withSpring(1, { damping: 14, stiffness: 120 });
    } else {
      continueProgress.value = withTiming(0, { duration: 180 });
    }
  }, [selected, shouldReduceMotion, continueProgress]);

  const continueAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: selected ? 1 : 0.4,
        transform: [{ translateY: 0 }],
      };
    }
    return {
      opacity: continueProgress.value,
      transform: [{ translateY: (1 - continueProgress.value) * 20 }],
    };
  });

  const handleCardPress = (id: WhoOption) => {
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
    onSelect(selected);
  };

  const mascotSource = selected ? onboardingAssets.mascotCelebrate : onboardingAssets.mascotWave;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Mascot */}
          <Animated.View style={[styles.mascotContainer, mascotAnimatedStyle]}>
            <Image
              source={mascotSource}
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
              Who are you finding medicine for?
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

          {/* 2x2 Grid of large cards */}
          <View style={[styles.grid, { gap: gridGap, paddingHorizontal: horizontalPadding }]}>
            {WHO_CARDS.map((item, index) => (
              <WhoCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selected === item.id}
                onPress={handleCardPress}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                imageSize={imageSize}
                shouldReduceMotion={shouldReduceMotion}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Bottom Continue button */}
        <Animated.View
          style={[
            styles.bottomBar,
            { paddingHorizontal: horizontalPadding },
            continueAnimatedStyle,
          ]}
          pointerEvents={selected ? 'auto' : 'none'}
        >
          <Pressable
            onPress={handleContinue}
            disabled={!selected}
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
    paddingHorizontal: 24,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  bottomBar: {
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
