import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { useLocation } from '../../context/LocationContext';
import { PREDEFINED_AREAS, KnownArea } from '../../services/locationService';
import {
  RadarPulseGraphic,
  CheckmarkCircleGraphic,
  CrosshairTargetIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SearchIcon,
  MedicalCrossIcon,
  ClockIcon,
} from '../icons/AppIcons';

interface OnboardingFlowProps {
  onDismiss?: () => void;
}

export function OnboardingFlow({ onDismiss }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();
  const {
    requestGpsLocation,
    selectManualArea,
    completeOnboarding,
    areaName,
    isLocating,
  } = useLocation();

  // Step state: 0 = Welcome, 1 = Permission, 2 = Area Picker, 3 = Success
  const [step, setStep] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<KnownArea | null>(PREDEFINED_AREAS[0]);
  const [customAreaText, setCustomAreaText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animation drivers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleSuccessAnim = useRef(new Animated.Value(0.3)).current;

  // Run transition animation whenever step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for Welcome icon & Radar step
    if (step === 0 || step === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Spring animation for Success checkmark
    if (step === 3) {
      scaleSuccessAnim.setValue(0.2);
      Animated.spring(scaleSuccessAnim, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  const handleNextFromWelcome = () => {
    setStep(1);
  };

  const handleRequestLocation = async () => {
    setErrorMessage(null);
    const result = await requestGpsLocation();
    if (result.granted) {
      setStep(3); // Success step
    } else {
      setErrorMessage(result.error || 'Location permission was denied. Choose an area below.');
      setStep(2); // Manual area step
    }
  };

  const handleSkipLocation = () => {
    setStep(2); // Choose area manually
  };

  const handleSelectAreaAndFinish = async () => {
    if (customAreaText.trim().length > 0) {
      await selectManualArea({ name: customAreaText.trim() });
    } else if (selectedArea) {
      await selectManualArea(selectedArea);
    }
    setStep(3);
  };

  const handleSkipAll = async () => {
    await completeOnboarding();
    if (onDismiss) onDismiss();
  };

  const handleFinish = async () => {
    await completeOnboarding();
    if (onDismiss) onDismiss();
  };

  return (
    <View
      style={[
        styles.overlayContainer,
        {
          backgroundColor: palette.bg,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      {/* Top Header Bar with Progress Dots and Skip */}
      <View style={styles.topBar}>
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    step === dotIndex
                      ? palette.accent
                      : palette.line,
                  width: step === dotIndex ? 22 : 6,
                },
              ]}
            />
          ))}
        </View>

        {step < 3 && (
          <Pressable
            onPress={handleSkipAll}
            style={[
              styles.skipButton,
              {
                backgroundColor: palette.surface2,
                borderColor: palette.line,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding and go directly to medicine search"
          >
            <Text style={[styles.skipButtonText, { color: palette.ink2 }]}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.animatedStepContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ================= STEP 0: ANIMATED WELCOME ================= */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Animated.View
                style={[
                  styles.heroLogoWrapper,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    shadowColor: palette.shadow,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Image
                  source={require('../../../assets/images/icon.png')}
                  style={styles.heroLogoImage}
                  resizeMode="cover"
                />
              </Animated.View>

              <Text style={[styles.welcomeHeadline, { color: palette.ink }]}>
                Welcome to MedFind
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: palette.ink2 }]}>
                Verified Medicine Discovery & Public Healthcare Directory
              </Text>

              {/* 3 Value Proposition Cards */}
              <View style={styles.previewCardsColumn}>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: palette.okTint }]}>
                    <MedicalCrossIcon size={18} color={palette.okInk} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: palette.ink }]}>
                      Real Essential Medicines
                    </Text>
                    <Text style={[styles.cardDesc, { color: palette.ink2 }]}>
                      Sourced from National List of Essential Medicines (NLEM) with no synthetic stock claims.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: palette.surface2 }]}>
                    <MapPinIcon size={18} color={palette.ink} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: palette.ink }]}>
                      Nearby Ordering & Care
                    </Text>
                    <Text style={[styles.cardDesc, { color: palette.ink2 }]}>
                      Calculate distance to verified hospitals, pharmacies, and 24x7 emergency contacts.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: palette.okTint }]}>
                    <ShieldCheckIcon size={18} color={palette.okInk} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: palette.ink }]}>
                      Zero-Tracking Privacy
                    </Text>
                    <Text style={[styles.cardDesc, { color: palette.ink2 }]}>
                      Foreground-only calculations. Your precise coordinates are never persisted or uploaded.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action */}
              <Pressable
                onPress={handleNextFromWelcome}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: palette.btn,
                    borderColor: palette.btnBorder,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Get started with MedFind"
              >
                <Text style={[styles.primaryButtonText, { color: palette.btnInk }]}>
                  Get Started
                </Text>
                <ArrowRightIcon size={16} color={palette.btnInk} />
              </Pressable>
            </View>
          )}

          {/* ================= STEP 1: LOCATION PERMISSION & EXPLANATION ================= */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Animated.View
                style={[
                  styles.radarGraphicWrapper,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <RadarPulseGraphic size={130} />
              </Animated.View>

              <Text style={[styles.welcomeHeadline, { color: palette.ink }]}>
                Find Nearby Care & Stock
              </Text>

              <Text style={[styles.welcomeSubtitle, { color: palette.ink2 }]}>
                Use your location to find participating pharmacies and care listings near you.
              </Text>

              {/* Privacy and Boundaries Highlight */}
              <View
                style={[
                  styles.privacyCommitmentBox,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={palette.okInk} />
                  <Text style={[styles.privacyItemText, { color: palette.ink2 }]}>
                    <Text style={{ fontFamily: fonts.sansBold, color: palette.ink }}>Foreground only:</Text>{' '}
                    Active only while using the app. Never runs in the background.
                  </Text>
                </View>

                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={palette.okInk} />
                  <Text style={[styles.privacyItemText, { color: palette.ink2 }]}>
                    <Text style={{ fontFamily: fonts.sansBold, color: palette.ink }}>In-memory only:</Text>{' '}
                    Calculates distance for this session. Coordinates are never saved or uploaded.
                  </Text>
                </View>

                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={palette.okInk} />
                  <Text style={[styles.privacyItemText, { color: palette.ink2 }]}>
                    <Text style={{ fontFamily: fonts.sansBold, color: palette.ink }}>No fake stock:</Text>{' '}
                    Proximity never implies a pharmacy has stock. Stock is only shown when reported.
                  </Text>
                </View>
              </View>

              {/* Actions: Allow & Not Now */}
              <View style={styles.buttonActionGroup}>
                <Pressable
                  onPress={handleRequestLocation}
                  disabled={isLocating}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: palette.btn,
                      borderColor: palette.btnBorder,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Enable foreground location permission"
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={palette.btnInk} />
                  ) : (
                    <>
                      <CrosshairTargetIcon size={18} color={palette.btnInk} />
                      <Text style={[styles.primaryButtonText, { color: palette.btnInk }]}>
                        Enable Location
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleSkipLocation}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: palette.surface2,
                      borderColor: palette.line,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Skip location and select neighborhood manually"
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.ink2 }]}>
                    Not now
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= STEP 2: MANUAL AREA SELECTION ================= */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <View
                style={[
                  styles.areaIconWrapper,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <MapPinIcon size={30} color={palette.okInk} />
              </View>

              <Text style={[styles.welcomeHeadline, { color: palette.ink }]}>
                Choose Your Area
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: palette.ink2 }]}>
                Select or enter your neighbourhood in Bengaluru to order nearby listings. You can still search all medicines freely.
              </Text>

              {errorMessage && (
                <View
                  style={[
                    styles.errorNotice,
                    {
                      backgroundColor: palette.amberTint,
                      borderColor: palette.amberLine,
                    },
                  ]}
                >
                  <Text style={[styles.errorNoticeText, { color: palette.amberInk }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Custom Area Search Input */}
              <View
                style={[
                  styles.areaInputBox,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <SearchIcon size={18} color={palette.ink2} />
                <TextInput
                  style={[styles.areaTextInput, { color: palette.ink }]}
                  placeholder="Enter neighborhood or pincode..."
                  placeholderTextColor={palette.ink2}
                  value={customAreaText}
                  onChangeText={(text) => {
                    setCustomAreaText(text);
                    if (text.length > 0) setSelectedArea(null);
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Quick Select Chips */}
              <Text style={[styles.quickSelectLabel, { color: palette.ink2 }]}>
                Or pick a known locality:
              </Text>
              <View style={styles.areaChipsGrid}>
                {PREDEFINED_AREAS.map((area) => {
                  const isChosen = selectedArea?.id === area.id && customAreaText.trim().length === 0;
                  return (
                    <Pressable
                      key={area.id}
                      onPress={() => {
                        setSelectedArea(area);
                        setCustomAreaText('');
                      }}
                      style={[
                        styles.areaChip,
                        {
                          backgroundColor: isChosen
                            ? palette.okTint
                            : palette.surface2,
                          borderColor: isChosen
                            ? palette.okLine
                            : palette.line,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isChosen }}
                    >
                      <Text
                        style={[
                          styles.areaChipText,
                          {
                            color: isChosen
                              ? palette.okInk
                              : palette.ink2,
                            fontFamily: isChosen ? fonts.sansBold : fonts.sansMedium,
                          },
                        ]}
                      >
                        {area.locality}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.buttonActionGroup}>
                <Pressable
                  onPress={handleSelectAreaAndFinish}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: palette.btn,
                      borderColor: palette.btnBorder,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with selected area"
                >
                  <Text style={[styles.primaryButtonText, { color: palette.btnInk }]}>
                    Continue with Area
                  </Text>
                  <ArrowRightIcon size={16} color={palette.btnInk} />
                </Pressable>

                <Pressable
                  onPress={handleSkipAll}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: palette.surface2,
                      borderColor: palette.line,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Skip area choice and search all"
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.ink2 }]}>
                    Skip for now — Search All
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ================= STEP 3: SUCCESS & CONFIRMATION ================= */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Animated.View
                style={[
                  styles.successGraphicWrapper,
                  {
                    transform: [{ scale: scaleSuccessAnim }],
                  },
                ]}
              >
                <CheckmarkCircleGraphic size={96} />
              </Animated.View>

              <Text style={[styles.welcomeHeadline, { color: palette.ink }]}>
                All Done!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: palette.ink2 }]}>
                Discovery is ready for{' '}
                <Text style={{ fontFamily: fonts.sansBold, color: palette.ink }}>
                  {areaName}
                </Text>
                .{'\n'}Distances to participating pharmacies and care centers will be calculated smoothly.
              </Text>

              <View
                style={[
                  styles.readyCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <View style={styles.readyRow}>
                  <MapPinIcon size={16} color={palette.okInk} />
                  <Text style={[styles.readyText, { color: palette.ink2 }]}>
                    Active area:{' '}
                    <Text style={{ fontFamily: fonts.sansBold, color: palette.ink }}>
                      {areaName}
                    </Text>
                  </Text>
                </View>
                <View style={styles.readyRow}>
                  <ClockIcon size={16} color={palette.ink2} />
                  <Text style={[styles.readyText, { color: palette.ink2 }]}>
                    You can change your area anytime from the top bar.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleFinish}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: palette.btn,
                    borderColor: palette.btnBorder,
                    marginTop: 20,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Start discovering medicines"
              >
                <Text style={[styles.primaryButtonText, { color: palette.btnInk }]}>
                  Start Searching Medicines
                </Text>
                <ArrowRightIcon size={16} color={palette.btnInk} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: 'center',
  },
  animatedStepContainer: {
    width: '100%',
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroLogoWrapper: {
    width: 80,
    height: 80,
    borderRadius: radii.card,
    borderWidth: 1.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  heroLogoImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  welcomeHeadline: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  previewCardsColumn: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  cardDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  radarGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  privacyCommitmentBox: {
    width: '100%',
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  privacyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  privacyItemText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  areaIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorNotice: {
    width: '100%',
    padding: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorNoticeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    textAlign: 'center',
  },
  areaInputBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 48,
    marginBottom: 16,
    gap: 10,
  },
  areaTextInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  quickSelectLabel: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  areaChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: MIN_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaChipText: {
    fontSize: 13,
  },
  successGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  readyCard: {
    width: '100%',
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  buttonActionGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    minHeight: MIN_TARGET + 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    width: '100%',
    minHeight: MIN_TARGET,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
});
