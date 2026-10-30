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
import { useLanguage } from '../../context/LanguageContext';
import { fonts, MIN_TARGET } from '../../constants/theme';
import { typography } from '../../theme/tokens';
import { onboardingAssets } from '../../../assets/onboarding';

export type UserRoleChoice = 'customer' | 'pharmacist' | 'clinic' | 'hospital';

interface RolePickerProps {
  onSelect: (role: UserRoleChoice) => void;
}

interface RoleCardItem {
  id: UserRoleChoice;
  title: string;
  subtitle: string;
  emoji: string;
  testID: string;
}

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
  const cardScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.03 : 1.0) : 1.0);
  const iconBounce = useSharedValue(0);
  const pressTilt = useSharedValue(0);

  // Staggered spring entrance (100ms delay between cards, going left-to-right, top-to-bottom)
  useEffect(() => {
    if (!shouldReduceMotion) {
      entrance.value = withDelay(
        120 + index * 100,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, index, entrance]);

  // Selected state: highlighted border + scale animation
  useEffect(() => {
    if (shouldReduceMotion) {
      cardScale.value = isSelected ? 1.03 : 1.0;
      return;
    }

    if (isSelected) {
      cardScale.value = withSequence(
        withTiming(0.97, { duration: 70 }),
        withSpring(1.03, { damping: 12, stiffness: 160 })
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

  // 3D perspective tilt on press: rotateX: 2deg, rotateY: -2deg, spring back on release
  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return {
        opacity: 1,
        transform: [{ scale: isSelected ? 1.03 : 1.0 }],
      };
    }
    const p = entrance.value;
    const tilt = pressTilt.value;
    return {
      opacity: p,
      transform: [
        { perspective: 800 },
        { translateY: (1 - p) * 32 },
        { scale: cardScale.value },
        { rotateX: `${tilt * 2}deg` },
        { rotateY: `${tilt * -2}deg` },
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

  const handlePressIn = () => {
    if (!shouldReduceMotion) {
      pressTilt.value = withTiming(1, { duration: 80 });
    }
  };

  const handlePressOut = () => {
    if (!shouldReduceMotion) {
      pressTilt.value = withSpring(0, { damping: 14, stiffness: 160 });
    }
  };

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
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
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
            backgroundColor: isSelected ? (palette.okTint || palette.surface2) : palette.surface,
            borderColor: isSelected ? (palette.accent || palette.selBorder) : palette.line,
            borderWidth: isSelected ? 2.5 : 1.5,
            shadowColor: palette.shadow,
          },
          cardAnimatedStyle,
        ]}
      >
        <Animated.View style={[styles.cardEmojiBox, iconAnimatedStyle]}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
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
            numberOfLines={1}
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
            numberOfLines={3}
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
  const { t, language, setLanguage } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState<UserRoleChoice | null>(null);

  const cycleLanguage = () => {
    const next = language === 'en' ? 'kn' : language === 'kn' ? 'hi' : 'en';
    setLanguage(next);
  };

  const roleCards: RoleCardItem[] = [
    {
      id: 'customer',
      title: t('role_buyer', 'Buyer / Patient'),
      subtitle: t('role_buyer_sub', 'Find medicines, compare prices & track health'),
      emoji: '🛒',
      testID: 'role-customer-card',
    },
    {
      id: 'pharmacist',
      title: t('role_pharma', 'Pharmacy'),
      subtitle: t('role_pharma_sub', 'Manage pharmacy stock & dispensary'),
      emoji: '💊',
      testID: 'role-pharmacist-card',
    },
    {
      id: 'clinic',
      title: t('role_clinic', 'Clinic'),
      subtitle: t('role_clinic_sub', 'Manage clinic dispensary & patient supplies'),
      emoji: '🩺',
      testID: 'role-clinic-card',
    },
    {
      id: 'hospital',
      title: t('role_hospital', 'Hospital'),
      subtitle: t('role_hospital_sub', 'Manage hospital pharmacy, wards & scanning'),
      emoji: '🏥',
      testID: 'role-hospital-card',
    },
  ];

  // Mascot entrance spring
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
        withTiming(5, { duration: 120, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) })
      )
    );
  }, [shouldReduceMotion, mascotEntrance, mascotRotate]);

  // Mascot celebratory pop on role selection
  useEffect(() => {
    if (shouldReduceMotion || !selectedRole) return;
    mascotPop.value = withSequence(
      withTiming(1.12, { duration: 90, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 10, stiffness: 160 })
    );
  }, [selectedRole, shouldReduceMotion, mascotPop]);

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
          {/* Top Row with Language Switcher */}
          <View style={styles.topActionRow}>
            <Pressable
              onPress={cycleLanguage}
              style={[styles.langSwitchPill, { backgroundColor: palette.surface, borderColor: palette.line }]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Current language: ${language.toUpperCase()}. Tap to toggle.`}
            >
              <Text style={[styles.langSwitchPillText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                {language === 'en' ? 'EN' : language === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
              </Text>
            </Pressable>
          </View>

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
              {t('how_will_you_use', 'How will you use MedFind?')}
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
              {t('select_role_sub', 'Select your role to personalize your medical directory & tools.')}
            </Text>
          </View>

          {/* 2x2 Animated Grid */}
          <View style={styles.cardsContainer}>
            {roleCards.map((item, index) => (
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
              accessibilityLabel={t('role_continue', 'Continue')}
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
                    color: palette.btnInk || '#FFFFFF',
                    fontFamily: fonts.sansBold,
                  },
                ]}
              >
                {t('role_continue', 'Continue')}
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  langSwitchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langSwitchPillText: {
    fontSize: 13,
  },
  mascotContainer: {
    alignItems: 'center',
    marginTop: 12,
    height: 80,
    justifyContent: 'center',
  },
  mascotImage: {
    width: 76,
    height: 76,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subline: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginVertical: 10,
    width: '100%',
  },
  cardPressable: {
    width: '48%',
    minHeight: MIN_TARGET,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 20,
    minHeight: 164,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardEmojiBox: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 40,
    lineHeight: 46,
    textAlign: 'center',
    includeFontPadding: false,
  },
  cardTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
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
