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
import { fonts, MIN_TARGET } from '../../constants/theme';
import { onboardingAssets } from '../../../assets/onboarding';

export type UserRoleChoice = 'customer' | 'pharmacist';

interface RolePickerProps {
  onSelect: (role: UserRoleChoice) => void;
}

interface RoleCardItem {
  id: UserRoleChoice;
  title: string;
  subtitle: string;
  image: any;
  testID: string;
}

const ROLE_CARDS: RoleCardItem[] = [
  {
    id: 'customer',
    title: "I'm looking for medicine",
    subtitle: 'Search nearby stores, verify stock, find generic substitutes',
    image: onboardingAssets.cardMedicineBox,
    testID: 'role-customer-card',
  },
  {
    id: 'pharmacist',
    title: 'I work at a pharmacy',
    subtitle: 'Report live on-shelf stock, manage dispensary catalog & logs',
    image: onboardingAssets.mascotWave,
    testID: 'role-pharmacist-card',
  },
];

interface RoleCardProps {
  item: RoleCardItem;
  index: number;
  isSelected: boolean;
  onPress: (id: UserRoleChoice) => void;
  shouldReduceMotion: boolean | null;
  palette: any;
}

function RoleCard({
  item,
  index,
  isSelected,
  onPress,
  shouldReduceMotion,
  palette,
}: RoleCardProps) {
  const entrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const cardScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.02 : 1.0) : 1.0);
  const iconBounce = useSharedValue(0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      entrance.value = withDelay(
        140 + index * 100,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, index, entrance]);

  useEffect(() => {
    if (shouldReduceMotion) {
      cardScale.value = isSelected ? 1.02 : 1.0;
      return;
    }

    if (isSelected) {
      cardScale.value = withSequence(
        withTiming(0.97, { duration: 70 }),
        withSpring(1.02, { damping: 12, stiffness: 160 })
      );
      iconBounce.value = withSequence(
        withTiming(-8, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 8, stiffness: 140 })
      );
    } else {
      cardScale.value = withSpring(1.0, { damping: 14, stiffness: 150 });
      iconBounce.value = 0;
    }
  }, [isSelected, shouldReduceMotion, cardScale, iconBounce]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
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
        { translateY: (1 - p) * 32 },
        { scale: cardScale.value },
      ],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [{ translateY: iconBounce.value }],
    };
  });

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore on unsupported platforms
    }
    onPress(item.id);
  };

  return (
    <Pressable
      testID={item.testID}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.subtitle}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={styles.cardPressable}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? palette.tint : palette.surface,
            borderColor: isSelected ? palette.teal : palette.line,
            borderWidth: isSelected ? 2.5 : 1.5,
          },
          cardAnimatedStyle,
        ]}
      >
        <Animated.View style={[styles.cardIconBox, iconAnimatedStyle]}>
          <Image
            source={item.image}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Animated.View>
        <View style={styles.cardTextContainer}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: palette.ink,
                fontFamily: isSelected ? fonts.sansBold : fonts.sansSemi,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.cardSubtitle,
              {
                color: palette.ink2,
                fontFamily: fonts.sans,
              },
            ]}
          >
            {item.subtitle}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function RolePicker({ onSelect }: RolePickerProps) {
  const { palette } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState<UserRoleChoice | null>(null);

  // Mascot entrance spring
  const mascotEntrance = useSharedValue(shouldReduceMotion ? 1 : 0);
  const mascotRotate = useSharedValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      mascotEntrance.value = 1;
      return;
    }
    mascotEntrance.value = withSpring(1, { damping: 14, stiffness: 120 });
    mascotRotate.value = withDelay(
      300,
      withSequence(
        withTiming(5, { duration: 120, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) })
      )
    );
  }, [shouldReduceMotion, mascotEntrance, mascotRotate]);

  const mascotAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { transform: [{ scale: 1 }, { rotate: '0deg' }] };
    }
    return {
      opacity: mascotEntrance.value,
      transform: [
        { scale: mascotEntrance.value },
        { rotate: `${mascotRotate.value}deg` },
      ],
    };
  });

  // Continue button animation
  const continueProgress = useSharedValue(shouldReduceMotion ? (selectedRole ? 1 : 0) : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      continueProgress.value = selectedRole ? 1 : 0;
      return;
    }

    if (selectedRole) {
      continueProgress.value = withSpring(1, { damping: 14, stiffness: 120 });
    } else {
      continueProgress.value = withTiming(0, { duration: 160 });
    }
  }, [selectedRole, shouldReduceMotion, continueProgress]);

  const continueAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: selectedRole ? 1 : 0.4,
        transform: [{ translateY: 0 }],
      };
    }
    return {
      opacity: continueProgress.value,
      transform: [{ translateY: (1 - continueProgress.value) * 16 }],
    };
  });

  const handleContinue = () => {
    if (!selectedRole) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
    onSelect(selectedRole);
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: palette.bg }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Mascot */}
          <Animated.View style={[styles.mascotContainer, mascotAnimatedStyle]}>
            <Image
              source={selectedRole ? onboardingAssets.mascotCelebrate : onboardingAssets.mascotWave}
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
                  color: palette.ink,
                  fontFamily: fonts.sansBold,
                },
              ]}
            >
              How will you use MedFind?
            </Text>
            <Text
              style={[
                styles.subline,
                {
                  color: palette.ink2,
                  fontFamily: fonts.sans,
                },
              ]}
            >
              You can change this later.
            </Text>
          </View>

          {/* Two Large Cards */}
          <View style={styles.cardsContainer}>
            {ROLE_CARDS.map((item, index) => (
              <RoleCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedRole === item.id}
                onPress={setSelectedRole}
                shouldReduceMotion={shouldReduceMotion}
                palette={palette}
              />
            ))}
          </View>

          {/* Bottom Continue Button */}
          <Animated.View style={[styles.bottomContainer, continueAnimatedStyle]}>
            <Pressable
              testID="role-continue-button"
              onPress={handleContinue}
              disabled={!selectedRole}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue to next step"
              accessibilityState={{ disabled: !selectedRole }}
              style={({ pressed }) => [
                styles.continueButton,
                {
                  backgroundColor: palette.accent,
                  opacity: pressed ? 0.88 : selectedRole ? 1.0 : 0.45,
                },
              ]}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  {
                    color: '#FFFFFF',
                    fontFamily: fonts.sansBold,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 998,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 16,
    height: 88,
    justifyContent: 'center',
  },
  mascotImage: {
    width: 80,
    height: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  headline: {
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subline: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 6,
  },
  cardsContainer: {
    gap: 16,
    marginVertical: 8,
  },
  cardPressable: {
    minHeight: MIN_TARGET,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    minHeight: 104,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardIconBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardImage: {
    width: 60,
    height: 60,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 23,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomContainer: {
    paddingTop: 8,
  },
  continueButton: {
    minHeight: MIN_TARGET,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
});
