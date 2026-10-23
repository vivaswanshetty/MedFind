import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { layout, typography } from '../../theme/tokens';
import { useLocation } from '../../context/LocationContext';
import { PREDEFINED_AREAS, KnownArea } from '../../services/locationService';
import {
  RadarPulseGraphic,
  CheckmarkCircleGraphic,
  CrosshairTargetIcon,
  MapPinIcon,
  CloseIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SearchIcon,
  MedicalCrossIcon,
  ClockIcon,
} from '../icons/AppIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingFlowProps {
  onDismiss?: () => void;
}

export function OnboardingFlow({ onDismiss }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const { mode, theme } = useTheme();
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
      // Permission denied or unavailable -> proceed smoothly to manual area choice
      setErrorMessage(result.error || 'Location permission was denied. Choose an area below.');
      setStep(2); // Manual area step
    }
  };

  const handleSkipLocation = () => {
    setStep(2); // Choose area manually
  };

  const handleSelectAreaAndFinish = async () => {
    if (customAreaText.trim().length > 0) {
      await selectManualArea({ name: `${customAreaText.trim()}, Bengaluru` });
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
          backgroundColor: mode === 'light' ? 'rgba(248, 246, 240, 0.98)' : 'rgba(6, 5, 10, 0.98)',
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
                      ? mode === 'light'
                        ? theme.primaryAccent
                        : '#00E5FF'
                      : theme.glass.borderSubtle,
                  width: step === dotIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>

        {step < 3 && (
          <TouchableOpacity
            onPress={handleSkipAll}
            style={[
              styles.skipButton,
              {
                backgroundColor: theme.glass.backgroundPill,
                borderColor: theme.glass.borderSubtle,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding and go directly to medicine search"
          >
            <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
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
                    backgroundColor: theme.surface,
                    borderColor: theme.glass.borderHighlight,
                    shadowColor: theme.glass.shadowColor,
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

              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                Welcome to MedFind
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Verified Medicine Discovery & Public Healthcare Directory
              </Text>

              {/* 3 Value Proposition Cards */}
              <View style={styles.previewCardsColumn}>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.glass.background,
                      borderColor: theme.glass.border,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: theme.badgeBackground }]}>
                    <MedicalCrossIcon size={18} color={theme.primaryAccentText} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      Real Essential Medicines
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                      Sourced from National List of Essential Medicines (NLEM) with no synthetic stock claims.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.glass.background,
                      borderColor: theme.glass.border,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: theme.glass.backgroundPill }]}>
                    <MapPinIcon size={18} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      Nearby Ordering & Care
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                      Calculate distance to verified hospitals, pharmacies, and 24x7 emergency contacts.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.glass.background,
                      borderColor: theme.glass.border,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                >
                  <View style={[styles.cardIconBox, { backgroundColor: theme.glass.backgroundPill }]}>
                    <ShieldCheckIcon size={18} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                      Zero-Tracking Privacy
                    </Text>
                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                      Foreground-only calculations. Your precise coordinates are never persisted or uploaded.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action */}
              <TouchableOpacity
                onPress={handleNextFromWelcome}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primaryAccent,
                    borderColor: theme.glass.borderHighlight,
                    shadowColor: theme.glass.shadowColor,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Get started with MedFind"
              >
                <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
                  Get Started
                </Text>
                <ArrowRightIcon size={16} color={theme.textInverse} />
              </TouchableOpacity>
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

              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                Find Nearby Care & Stock
              </Text>

              {/* Mandatory Requirement Text */}
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Use your location to find participating pharmacies and care listings near you.
              </Text>

              {/* Privacy and Boundaries Highlight */}
              <View
                style={[
                  styles.privacyCommitmentBox,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
                  <Text style={[styles.privacyItemText, { color: theme.textSecondary }]}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Foreground only:</Text>{' '}
                    Active only while using the app. Never runs in the background.
                  </Text>
                </View>

                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
                  <Text style={[styles.privacyItemText, { color: theme.textSecondary }]}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>In-memory only:</Text>{' '}
                    Calculates distance for this session. Coordinates are never saved or uploaded.
                  </Text>
                </View>

                <View style={styles.privacyItemRow}>
                  <ShieldCheckIcon size={16} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
                  <Text style={[styles.privacyItemText, { color: theme.textSecondary }]}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>No fake stock:</Text>{' '}
                    Proximity never implies a pharmacy has stock. Stock is only shown when reported.
                  </Text>
                </View>
              </View>

              {/* Actions: Allow & Not Now */}
              <View style={styles.buttonActionGroup}>
                <TouchableOpacity
                  onPress={handleRequestLocation}
                  disabled={isLocating}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primaryAccent,
                      borderColor: theme.glass.borderHighlight,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Enable foreground location permission"
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CrosshairTargetIcon size={18} color="#FFFFFF" />
                      <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
                        Enable Location
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSkipLocation}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.glass.backgroundPill,
                      borderColor: theme.glass.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Skip location and select neighborhood manually"
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                    Not now
                  </Text>
                </TouchableOpacity>
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
                    backgroundColor: theme.glass.background,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <MapPinIcon size={32} />
              </View>

              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                Choose Your Area
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Select or enter your neighbourhood in Bengaluru to order nearby listings. You can still search all medicines freely.
              </Text>

              {errorMessage && (
                <View
                  style={[
                    styles.errorNotice,
                    {
                      backgroundColor: theme.glass.backgroundSubtle,
                      borderColor: theme.warningAccent,
                    },
                  ]}
                >
                  <Text style={[styles.errorNoticeText, { color: theme.textSecondary }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Custom Area Search Input */}
              <View
                style={[
                  styles.areaInputBox,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <SearchIcon size={18} color={theme.textMuted} />
                <TextInput
                  style={[styles.areaTextInput, { color: theme.textPrimary }]}
                  placeholder="Enter neighborhood or pincode..."
                  placeholderTextColor={theme.textMuted}
                  value={customAreaText}
                  onChangeText={(text) => {
                    setCustomAreaText(text);
                    if (text.length > 0) setSelectedArea(null);
                  }}
                  autoCapitalize="words"
                />
              </View>

              {/* Quick Select Chips */}
              <Text style={[styles.quickSelectLabel, { color: theme.textMuted }]}>
                Or pick a known locality:
              </Text>
              <View style={styles.areaChipsGrid}>
                {PREDEFINED_AREAS.map((area) => {
                  const isChosen = selectedArea?.id === area.id && customAreaText.trim().length === 0;
                  return (
                    <TouchableOpacity
                      key={area.id}
                      onPress={() => {
                        setSelectedArea(area);
                        setCustomAreaText('');
                      }}
                      style={[
                        styles.areaChip,
                        {
                          backgroundColor: isChosen
                            ? mode === 'light'
                              ? theme.primaryAccent
                              : '#00E5FF'
                            : theme.glass.backgroundPill,
                          borderColor: isChosen
                            ? theme.primaryAccent
                            : theme.glass.border,
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
                              ? theme.textInverse
                              : theme.textSecondary,
                            fontWeight: isChosen ? '600' : '500',
                          },
                        ]}
                      >
                        {area.locality}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Actions */}
              <View style={styles.buttonActionGroup}>
                <TouchableOpacity
                  onPress={handleSelectAreaAndFinish}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.primaryAccent,
                      borderColor: theme.glass.borderHighlight,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with selected area"
                >
                  <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
                    Continue with Area
                  </Text>
                  <ArrowRightIcon size={16} color={theme.textInverse} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSkipAll}
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.glass.backgroundPill,
                      borderColor: theme.glass.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Skip area choice and search all Bengaluru"
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                    Skip for now — Search All
                  </Text>
                </TouchableOpacity>
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

              <Text style={[styles.welcomeHeadline, { color: theme.textPrimary }]}>
                All Done!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Discovery is ready for{' '}
                <Text style={{ fontWeight: '700', color: theme.textPrimary }}>
                  {areaName}
                </Text>
                .{'\n'}Distances to participating pharmacies and care centers will be calculated smoothly.
              </Text>

              <View
                style={[
                  styles.readyCard,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <View style={styles.readyRow}>
                  <MapPinIcon size={16} />
                  <Text style={[styles.readyText, { color: theme.textSecondary }]}>
                    Active area:{' '}
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>
                      {areaName}
                    </Text>
                  </Text>
                </View>
                <View style={styles.readyRow}>
                  <ClockIcon size={16} color={theme.textMuted} />
                  <Text style={[styles.readyText, { color: theme.textSecondary }]}>
                    You can change your area anytime from the top bar.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleFinish}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primaryAccent,
                    borderColor: theme.glass.borderHighlight,
                    shadowColor: theme.glass.shadowColor,
                    marginTop: layout.spacing.lg,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Start discovering medicines"
              >
                <Text style={[styles.primaryButtonText, { color: theme.textInverse }]}>
                  Start Searching Medicines
                </Text>
                <ArrowRightIcon size={16} color={theme.textInverse} />
              </TouchableOpacity>
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
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.sm,
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
    paddingHorizontal: layout.spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  skipButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: layout.spacing.xl,
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
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  heroLogoImage: {
    width: 70,
    height: 70,
    borderRadius: 18,
  },
  welcomeHeadline: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xl + 2,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm + 1,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: layout.spacing.sm,
    marginBottom: layout.spacing.lg,
  },
  previewCardsColumn: {
    width: '100%',
    gap: layout.spacing.sm + 2,
    marginBottom: layout.spacing.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    gap: layout.spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTextCol: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm + 1,
    fontWeight: '600',
  },
  cardDesc: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 18,
  },
  radarGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.md,
  },
  privacyCommitmentBox: {
    width: '100%',
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
    marginBottom: layout.spacing.xl,
  },
  privacyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  privacyItemText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
  },
  areaIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.md,
  },
  errorNotice: {
    width: '100%',
    padding: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    marginBottom: layout.spacing.md,
  },
  errorNoticeText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  areaInputBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    minHeight: 48,
    marginBottom: layout.spacing.md,
    gap: 8,
  },
  areaTextInput: {
    flex: 1,
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm + 1,
    fontWeight: '400',
  },
  quickSelectLabel: {
    alignSelf: 'flex-start',
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    marginBottom: layout.spacing.xs + 2,
  },
  areaChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.xs + 4,
    width: '100%',
    marginBottom: layout.spacing.xl,
  },
  areaChip: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  areaChipText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs + 1,
  },
  successGraphicWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.lg,
  },
  readyCard: {
    width: '100%',
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
    marginTop: layout.spacing.sm,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readyText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '400',
  },
  buttonActionGroup: {
    width: '100%',
    gap: layout.spacing.sm + 2,
  },
  primaryButton: {
    width: '100%',
    minHeight: layout.minTouchTarget + 6,
    borderRadius: layout.borderRadius.pill,
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
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    width: '100%',
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
});
