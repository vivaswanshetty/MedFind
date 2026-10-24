import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
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
import { useLocation } from '../../context/LocationContext';
import { AreaPickerModal } from '../location/AreaPickerModal';
import { MapPinIcon, CrosshairTargetIcon } from '../icons/AppIcons';

export interface LocationStepProps {
  onDone: () => void;
}

export function LocationStep({ onDone }: LocationStepProps) {
  const { theme, palette } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { requestGpsLocation } = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Mascot spring entrance (same motion signature as NamePicker)
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

  const handleAllowLocation = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }

    setIsLoading(true);
    setStatusNotice(null);

    try {
      const result = await requestGpsLocation();
      setIsLoading(false);

      if (!result.granted || !result.coords) {
        // Permission denied, position failed, or network offline
        setStatusNotice('No problem, you can pick your area instead');
        setShowAreaPicker(true);
      } else if (result.isOutsideCoverage) {
        // Location is outside Bengaluru
        setStatusNotice('MedFind currently covers Bengaluru');
        setShowAreaPicker(true);
      } else {
        // Successfully located within Bengaluru
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Gracefully ignore
        }
        onDone();
      }
    } catch {
      setIsLoading(false);
      setStatusNotice('No problem, you can pick your area instead');
      setShowAreaPicker(true);
    }
  };

  const handleChooseArea = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
    setShowAreaPicker(true);
  };

  const handleNotNow = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
    onDone();
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.canvas }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Hero Section */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.mascotWrapper, mascotAnimatedStyle]}>
              <Image
                source={onboardingAssets.mascotWave}
                style={styles.mascotImage}
                resizeMode="contain"
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
              Find medicine near you
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
              We use your location only while the app is open, to show what's in stock close to you.
            </Text>

            {/* Dynamic notice if denied, failed, or outside Bengaluru */}
            {statusNotice && (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: palette.amberTint,
                    borderColor: palette.amberLine,
                  },
                ]}
              >
                <MapPinIcon size={16} color={palette.amberInk} />
                <Text
                  style={[
                    styles.noticeText,
                    {
                      color: palette.amberInk,
                      fontFamily: typography.fontFamilyMedium,
                    },
                  ]}
                >
                  {statusNotice}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Action Group */}
          <View style={styles.bottomSection}>
            {/* Primary: Allow location */}
            <Pressable
              onPress={handleAllowLocation}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Allow location to find medicines near you"
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: palette.btn,
                  borderColor: palette.btnBorder,
                  opacity: pressed ? 0.9 : isLoading ? 0.8 : 1.0,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={palette.btnInk} />
              ) : (
                <View style={styles.buttonInnerRow}>
                  <CrosshairTargetIcon size={18} color={palette.btnInk} />
                  <Text
                    style={[
                      styles.primaryButtonText,
                      {
                        color: palette.btnInk,
                        fontFamily: typography.fontFamilySemibold,
                      },
                    ]}
                  >
                    Allow location
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Secondary: Choose my area instead */}
            <Pressable
              onPress={handleChooseArea}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Choose my area instead"
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    color: palette.ink,
                    fontFamily: typography.fontFamilyMedium,
                  },
                ]}
              >
                Choose my area instead
              </Text>
            </Pressable>

            {/* Text Button: Not now */}
            <Pressable
              onPress={handleNotNow}
              hitSlop={12}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Not now, continue without location"
              style={styles.notNowButton}
            >
              <Text
                style={[
                  styles.notNowButtonText,
                  {
                    color: theme.textSecondary,
                    fontFamily: typography.fontFamilyMedium,
                  },
                ]}
              >
                Not now
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Area Picker Modal */}
      <AreaPickerModal
        visible={showAreaPicker}
        onClose={() => setShowAreaPicker(false)}
        onAreaSelected={() => {
          setShowAreaPicker(false);
          onDone();
        }}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 24,
  },
  mascotWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 120,
    height: 120,
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
    marginBottom: 20,
    maxWidth: 310,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    maxWidth: 340,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    gap: 10,
  },
  primaryButton: {
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
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    letterSpacing: 0.1,
  },
  notNowButton: {
    minHeight: 44,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notNowButtonText: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
});
