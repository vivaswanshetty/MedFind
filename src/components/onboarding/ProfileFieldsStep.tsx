import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
import { fonts } from '../../constants/theme';
import { onboardingAssets } from '../../../assets/onboarding';
import { COMMON_ALLERGIES, searchAllergies } from '../../data/allergies';
import { SearchIcon, CloseIcon } from '../icons/AppIcons';

export interface ProfileFieldsStepProps {
  onDone: (fields: { bloodGroup: string | null; allergies: string[]; gender: string | null }) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ALLERGY_SUGGESTIONS = COMMON_ALLERGIES;

interface GenderOption {
  id: string;
  label: string;
  icon: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  { id: 'male', label: 'Male', icon: '♂' },
  { id: 'female', label: 'Female', icon: '♀' },
  { id: 'other', label: 'Other', icon: '⚧' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', icon: '—' },
];

interface AnimatedSectionProps {
  delay: number;
  shouldReduceMotion: boolean | null;
  children: React.ReactNode;
  style?: any;
}

function AnimatedSection({ delay, shouldReduceMotion, children, style }: AnimatedSectionProps) {
  const progress = useSharedValue(shouldReduceMotion ? 1 : 0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      progress.value = withDelay(
        delay,
        withSpring(1, { damping: 14, stiffness: 120 })
      );
    }
  }, [shouldReduceMotion, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
    return {
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * 24 }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

interface BloodGroupPillProps {
  bloodGroup: string;
  isSelected: boolean;
  onPress: () => void;
  shouldReduceMotion: boolean | null;
  theme: ColorPalette;
}

function BloodGroupPill({
  bloodGroup,
  isSelected,
  onPress,
  shouldReduceMotion,
  theme,
}: BloodGroupPillProps) {
  const pillScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.05 : 1) : 1);

  useEffect(() => {
    if (shouldReduceMotion) {
      pillScale.value = isSelected ? 1.05 : 1;
      return;
    }
    if (isSelected) {
      pillScale.value = withSequence(
        withTiming(0.92, { duration: 70 }),
        withSpring(1.06, { damping: 12, stiffness: 180 })
      );
    } else {
      pillScale.value = withSpring(1.0, { damping: 14, stiffness: 150 });
    }
  }, [isSelected, shouldReduceMotion, pillScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Blood group ${bloodGroup}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={styles.pillPressable}
    >
      <Animated.View
        style={[
          styles.bloodPill,
          {
            backgroundColor: isSelected ? theme.primaryAccent : theme.surface,
            borderColor: isSelected ? theme.primaryAccent : theme.border,
            borderWidth: isSelected ? 2 : 1.5,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.bloodPillText,
            {
              color: isSelected ? (theme.textInverse || '#FFFFFF') : theme.textPrimary,
              fontFamily: isSelected ? typography.fontFamilyBold : typography.fontFamilyMedium,
            },
          ]}
        >
          {bloodGroup}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface SelectedAllergyChipProps {
  label: string;
  onRemove: () => void;
  shouldReduceMotion: boolean | null;
  theme: ColorPalette;
}

function SelectedAllergyChip({
  label,
  onRemove,
  shouldReduceMotion,
  theme,
}: SelectedAllergyChipProps) {
  const chipScale = useSharedValue(shouldReduceMotion ? 1 : 0.6);
  const chipOpacity = useSharedValue(shouldReduceMotion ? 1 : 0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      chipScale.value = withSpring(1, { damping: 12, stiffness: 160 });
      chipOpacity.value = withTiming(1, { duration: 160 });
    }
  }, [shouldReduceMotion, chipScale, chipOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    return {
      opacity: chipOpacity.value,
      transform: [{ scale: chipScale.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onRemove}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Remove allergy ${label}`}
        style={[
          styles.selectedTagChip,
          {
            backgroundColor: theme.badgeBackground,
            borderColor: theme.primaryAccent,
          },
        ]}
      >
        <Text
          style={[
            styles.selectedTagText,
            {
              color: theme.primaryAccentText || theme.primaryAccent,
              fontFamily: typography.fontFamilyMedium,
            },
          ]}
        >
          {label}
        </Text>
        <View style={styles.closeIconWrapper}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke={theme.primaryAccentText || theme.primaryAccent}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface GenderCardProps {
  item: GenderOption;
  isSelected: boolean;
  onPress: () => void;
  cardWidth: number;
  shouldReduceMotion: boolean | null;
  theme: ColorPalette;
}

function GenderCard({
  item,
  isSelected,
  onPress,
  cardWidth,
  shouldReduceMotion,
  theme,
}: GenderCardProps) {
  const cardScale = useSharedValue(shouldReduceMotion ? (isSelected ? 1.04 : 1.0) : 1.0);
  const iconBounce = useSharedValue(0);

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
      iconBounce.value = withSequence(
        withTiming(-6, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 8, stiffness: 140 })
      );
    } else {
      cardScale.value = withSpring(1.0, { damping: 14, stiffness: 150 });
      iconBounce.value = 0;
    }
  }, [isSelected, shouldReduceMotion, cardScale, iconBounce]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconBounce.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      style={{ width: cardWidth }}
    >
      <Animated.View
        style={[
          styles.genderCard,
          {
            backgroundColor: isSelected ? theme.badgeBackground : theme.surface,
            borderColor: isSelected ? theme.primaryAccent : theme.border,
            borderWidth: isSelected ? 2.5 : 1.5,
            shadowColor: theme.glass.shadowColor,
            shadowOpacity: isSelected ? 0.14 : 0.04,
          },
          cardAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.genderIconContainer,
            {
              backgroundColor: isSelected ? theme.primaryAccent : theme.surfaceSubtle,
            },
            iconAnimatedStyle,
          ]}
        >
          <Text
            style={[
              styles.genderIconText,
              {
                color: isSelected ? (theme.textInverse || '#FFFFFF') : theme.textPrimary,
              },
            ]}
          >
            {item.icon}
          </Text>
        </Animated.View>
        <Text
          style={[
            styles.genderLabel,
            {
              color: isSelected && theme.primaryAccentText ? theme.primaryAccentText : theme.textPrimary,
              fontFamily: isSelected ? typography.fontFamilyBold : typography.fontFamilyMedium,
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ProfileFieldsStep({ onDone }: ProfileFieldsStepProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { width: screenWidth } = useWindowDimensions();

  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [isAllergySearchOpen, setIsAllergySearchOpen] = useState(false);
  const [allergySearchQuery, setAllergySearchQuery] = useState('');

  const allergySearchResults = useMemo(() => {
    return searchAllergies(allergySearchQuery, 14);
  }, [allergySearchQuery]);

  const handleAddCustomAllergy = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
    setAllergies((prev) => {
      const cleanPrev = prev.filter((item) => item !== 'None');
      const alreadyHas = cleanPrev.some((item) => item.toLowerCase() === trimmed.toLowerCase());
      if (alreadyHas) return cleanPrev;
      return [...cleanPrev, trimmed];
    });
    setAllergySearchQuery('');
  };

  // Grid sizing for 2x2 gender selector
  const horizontalPadding = 24;
  const gridGap = 12;
  const genderCardWidth = Math.floor((screenWidth - horizontalPadding * 2 - gridGap) / 2);

  // Mascot spring entrance
  const mascotScale = useSharedValue(shouldReduceMotion ? 1 : 0.6);
  const mascotOpacity = useSharedValue(shouldReduceMotion ? 1 : 0);

  useEffect(() => {
    if (!shouldReduceMotion) {
      mascotScale.value = withSpring(1, { damping: 12, stiffness: 140 });
      mascotOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [shouldReduceMotion, mascotScale, mascotOpacity]);

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ scale: mascotScale.value }],
  }));

  const handleSelectBloodGroup = (bg: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
    setSelectedBloodGroup((prev) => (prev === bg ? null : bg));
  };

  const handleToggleAllergy = (suggestion: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }

    if (suggestion === 'None') {
      if (allergies.includes('None')) {
        setAllergies([]);
      } else {
        setAllergies(['None']);
      }
      return;
    }

    if (allergies.includes(suggestion)) {
      setAllergies((prev) => prev.filter((item) => item !== suggestion));
    } else {
      setAllergies((prev) => [...prev.filter((item) => item !== 'None'), suggestion]);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
    setAllergies((prev) => prev.filter((item) => item !== allergy));
  };

  const handleSelectGender = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore
    }
    setSelectedGender((prev) => (prev === id ? null : id));
  };

  const handleContinue = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
    onDone({
      bloodGroup: selectedBloodGroup,
      allergies,
      gender: selectedGender,
    });
  };

  const handleSkip = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
    onDone({
      bloodGroup: null,
      allergies: [],
      gender: null,
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Top Hero Section */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.mascotWrapper, mascotAnimatedStyle]}>
              <Image
                source={onboardingAssets.mascotWave}
                style={styles.mascotImage}
                resizeMode="contain"
                accessibilityLabel="Pill Pal waving"
              />
            </Animated.View>

            <Text
              style={[
                styles.headline,
                {
                  color: theme.textPrimary,
                  fontFamily: typography.fontFamilyBold,
                },
              ]}
            >
              A few more details
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
              These help personalize your experience. All optional!
            </Text>
          </View>

          {/* 1. Blood Group Section */}
          <AnimatedSection delay={180} shouldReduceMotion={shouldReduceMotion} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.textPrimary,
                    fontFamily: typography.fontFamilyBold,
                  },
                ]}
              >
                Blood Group
              </Text>
              {selectedBloodGroup && (
                <Text
                  style={[
                    styles.sectionBadge,
                    {
                      color: theme.primaryAccentText || theme.primaryAccent,
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  {selectedBloodGroup}
                </Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bloodGroupScroll}
            >
              {BLOOD_GROUPS.map((bg) => (
                <BloodGroupPill
                  key={bg}
                  bloodGroup={bg}
                  isSelected={selectedBloodGroup === bg}
                  onPress={() => handleSelectBloodGroup(bg)}
                  shouldReduceMotion={shouldReduceMotion}
                  theme={theme}
                />
              ))}
            </ScrollView>
          </AnimatedSection>

          {/* 2. Allergies Section */}
          <AnimatedSection delay={260} shouldReduceMotion={shouldReduceMotion} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: theme.textPrimary,
                      fontFamily: typography.fontFamilyBold,
                    },
                  ]}
                >
                  Allergies
                </Text>
                {allergies.length > 0 && (
                  <Text
                    style={[
                      styles.sectionBadge,
                      {
                        color: theme.primaryAccentText || theme.primaryAccent,
                        fontFamily: typography.fontFamilyMedium,
                      },
                    ]}
                  >
                    {allergies.length} selected
                  </Text>
                )}
              </View>

              {/* Small search symbol in header */}
              <Pressable
                onPress={() => setIsAllergySearchOpen((prev) => !prev)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Search or add allergy"
                style={({ pressed }) => [
                  styles.headerSearchBtn,
                  {
                    backgroundColor: isAllergySearchOpen ? theme.badgeBackground : theme.surface,
                    borderColor: isAllergySearchOpen ? theme.primaryAccent : theme.border,
                    opacity: pressed ? 0.75 : 1.0,
                  },
                ]}
              >
                <SearchIcon
                  size={15}
                  color={isAllergySearchOpen ? (theme.primaryAccentText || theme.primaryAccent) : theme.textPrimary}
                />
              </Pressable>
            </View>

            {/* Selected Tags Display */}
            {allergies.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                {allergies.map((allergy) => (
                  <SelectedAllergyChip
                    key={allergy}
                    label={allergy}
                    onRemove={() => handleRemoveAllergy(allergy)}
                    shouldReduceMotion={shouldReduceMotion}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            {/* Suggestions Chips */}
            <View style={styles.suggestionsContainer}>
              {ALLERGY_SUGGESTIONS.map((suggestion) => {
                const isSelected = allergies.includes(suggestion);
                return (
                  <Pressable
                    key={suggestion}
                    onPress={() => handleToggleAllergy(suggestion)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${suggestion}${isSelected ? ', selected' : ''}`}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      {
                        backgroundColor: isSelected ? theme.badgeBackground : theme.surface,
                        borderColor: isSelected ? theme.primaryAccent : theme.border,
                        borderWidth: isSelected ? 1.5 : 1,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestionChipText,
                        {
                          color: isSelected
                            ? (theme.primaryAccentText || theme.primaryAccent)
                            : theme.textPrimary,
                          fontFamily: isSelected
                            ? typography.fontFamilyBold
                            : typography.fontFamilyRegular,
                        },
                      ]}
                    >
                      {isSelected ? `✓ ${suggestion}` : `+ ${suggestion}`}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Search Symbol Button Chip */}
              <Pressable
                onPress={() => setIsAllergySearchOpen((prev) => !prev)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Search other allergy names"
                style={({ pressed }) => [
                  styles.suggestionChip,
                  styles.searchTriggerChip,
                  {
                    backgroundColor: isAllergySearchOpen ? theme.badgeBackground : theme.surface,
                    borderColor: isAllergySearchOpen ? theme.primaryAccent : theme.border,
                    opacity: pressed ? 0.75 : 1.0,
                  },
                ]}
              >
                <SearchIcon
                  size={13}
                  color={isAllergySearchOpen ? (theme.primaryAccentText || theme.primaryAccent) : theme.textPrimary}
                />
                <Text
                  style={[
                    styles.suggestionChipText,
                    {
                      color: isAllergySearchOpen
                        ? (theme.primaryAccentText || theme.primaryAccent)
                        : theme.textPrimary,
                      fontFamily: typography.fontFamilyMedium,
                      marginLeft: 4,
                    },
                  ]}
                >
                  Search more...
                </Text>
              </Pressable>
            </View>

            {/* Expandable Search Panel */}
            {isAllergySearchOpen && (
              <View
                style={[
                  styles.allergySearchPanel,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.allergySearchInputRow,
                    {
                      backgroundColor: theme.canvas,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <SearchIcon size={16} color={theme.textSecondary} />
                  <TextInput
                    style={[
                      styles.allergySearchInput,
                      {
                        color: theme.textPrimary,
                        fontFamily: typography.fontFamilyRegular,
                      },
                    ]}
                    placeholder="Search or type allergy (e.g. Amoxicillin, Ibuprofen...)"
                    placeholderTextColor={theme.textSecondary}
                    value={allergySearchQuery}
                    onChangeText={setAllergySearchQuery}
                    autoFocus={true}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (allergySearchQuery.trim()) {
                        handleAddCustomAllergy(allergySearchQuery);
                      }
                    }}
                  />
                  {allergySearchQuery.length > 0 && (
                    <Pressable
                      onPress={() => setAllergySearchQuery('')}
                      hitSlop={8}
                      style={styles.searchClearBtn}
                      accessibilityLabel="Clear allergy search"
                    >
                      <CloseIcon size={14} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>

                {/* Instant Search Results / Suggestions */}
                <View style={styles.searchResultsRow}>
                  {allergySearchQuery.trim().length > 0 &&
                    !allergies.some(
                      (a) => a.toLowerCase() === allergySearchQuery.trim().toLowerCase()
                    ) && (
                      <Pressable
                        onPress={() => handleAddCustomAllergy(allergySearchQuery)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${allergySearchQuery.trim()} to allergies`}
                        style={({ pressed }) => [
                          styles.addCustomPill,
                          {
                            backgroundColor: theme.badgeBackground,
                            borderColor: theme.primaryAccent,
                            opacity: pressed ? 0.75 : 1.0,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.addCustomPillText,
                            {
                              color: theme.primaryAccentText || theme.primaryAccent,
                              fontFamily: typography.fontFamilyBold,
                            },
                          ]}
                        >
                          + Add &ldquo;{allergySearchQuery.trim()}&rdquo;
                        </Text>
                      </Pressable>
                    )}

                  {allergySearchResults.map((item) => {
                    const isSelected = allergies.includes(item);
                    return (
                      <Pressable
                        key={item}
                        onPress={() => handleToggleAllergy(item)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`${item}${isSelected ? ', selected' : ''}`}
                        style={({ pressed }) => [
                          styles.searchResultChip,
                          {
                            backgroundColor: isSelected ? theme.badgeBackground : theme.canvas,
                            borderColor: isSelected ? theme.primaryAccent : theme.border,
                            borderWidth: isSelected ? 1.5 : 1,
                            opacity: pressed ? 0.75 : 1.0,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.searchResultChipText,
                            {
                              color: isSelected
                                ? (theme.primaryAccentText || theme.primaryAccent)
                                : theme.textPrimary,
                              fontFamily: isSelected
                                ? typography.fontFamilyBold
                                : typography.fontFamilyRegular,
                            },
                          ]}
                        >
                          {isSelected ? `✓ ${item}` : `+ ${item}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </AnimatedSection>

          {/* 3. Gender Section */}
          <AnimatedSection delay={340} shouldReduceMotion={shouldReduceMotion} style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.textPrimary,
                    fontFamily: typography.fontFamilyBold,
                  },
                ]}
              >
                Gender
              </Text>
            </View>

            <View style={[styles.genderGrid, { gap: gridGap }]}>
              {GENDER_OPTIONS.map((item) => (
                <GenderCard
                  key={item.id}
                  item={item}
                  isSelected={selectedGender === item.id}
                  onPress={() => handleSelectGender(item.id)}
                  cardWidth={genderCardWidth}
                  shouldReduceMotion={shouldReduceMotion}
                  theme={theme}
                />
              ))}
            </View>
          </AnimatedSection>

          {/* 4. Bottom Actions Section */}
          <AnimatedSection delay={420} shouldReduceMotion={shouldReduceMotion} style={styles.bottomSection}>
            <Pressable
              onPress={handleContinue}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={({ pressed }) => [
                styles.continueButton,
                {
                  backgroundColor: theme.primaryAccent,
                  opacity: pressed ? 0.9 : 1.0,
                  transform: [{ scale: pressed ? 0.98 : 1.0 }],
                },
              ]}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  {
                    color: theme.textInverse || '#FFFFFF',
                    fontFamily: typography.fontFamilyBold,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              hitSlop={12}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
              style={styles.skipButton}
            >
              <Text
                style={[
                  styles.skipButtonText,
                  {
                    color: theme.textSecondary,
                    fontFamily: typography.fontFamilyMedium,
                  },
                ]}
              >
                Skip for now
              </Text>
            </Pressable>
          </AnimatedSection>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 24,
  },
  mascotWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 320,
  },
  subline: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
    maxWidth: 300,
  },
  sectionContainer: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  searchTriggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  allergySearchPanel: {
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  allergySearchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  allergySearchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    paddingVertical: 2,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchResultsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  addCustomPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  addCustomPillText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  searchResultChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  searchResultChipText: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  bloodGroupScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  pillPressable: {
    minHeight: 44,
  },
  bloodPill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bloodPillText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  closeIconWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionChipText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  genderCard: {
    height: 94,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  genderIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  genderIconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  genderLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    gap: 8,
  },
  continueButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  skipButton: {
    minHeight: 44,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

export default ProfileFieldsStep;
