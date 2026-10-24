import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { onboardingAssets } from '../../../assets/onboarding';

export interface NamePickerProps {
  buddyName: string;
  onDone: (name: string | null) => void;
}

export function NamePicker({ buddyName, onDone }: NamePickerProps) {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0;

  const handleContinue = () => {
    if (!isValid) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
    Keyboard.dismiss();
    onDone(trimmedName);
  };

  const handleSkip = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
    Keyboard.dismiss();
    onDone(null);
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Top / Middle section */}
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
                  What should {buddyName} call you?
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
                  Your preferred name or nickname for helpful reminders
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={theme.textMuted}
                    maxLength={24}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    selectionColor={theme.primaryAccent}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                        borderColor: isFocused ? theme.borderFocus : theme.border,
                        borderWidth: isFocused ? 2 : 1,
                        fontFamily: typography.fontFamilyMedium,
                      },
                    ]}
                    accessibilityLabel="Your name"
                    accessibilityHint="Enter what your buddy should call you"
                  />
                </View>
              </View>

              {/* Bottom Actions section */}
              <View style={styles.bottomSection}>
                <Pressable
                  onPress={handleContinue}
                  disabled={!isValid}
                  style={({ pressed }) => [
                    styles.continueButton,
                    {
                      backgroundColor: theme.primaryAccent,
                      opacity: !isValid ? 0.45 : pressed ? 0.9 : 1,
                      transform: [{ scale: pressed && isValid ? 0.98 : 1 }],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                  accessibilityState={{ disabled: !isValid }}
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
                  style={styles.skipButton}
                  accessibilityRole="button"
                  accessibilityLabel="Skip name entry"
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
                    Skip
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  mascotWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 110,
    height: 110,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
    maxWidth: 320,
  },
  subline: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 28,
    maxWidth: 290,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
  },
  textInput: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    textAlign: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
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
    marginBottom: 8,
  },
  continueButtonText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  skipButton: {
    minHeight: 44,
    minWidth: 80,
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
