import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';
import { getRegionForCoordinates } from '../../config/regions';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import {
  BackArrowIcon,
  PhoneIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from '../../components/icons/AppIcons';
import {
  resolveEmergencyCountry,
  CountryEmergencyData,
} from '../../data/emergencyNumbers';
import { CountryPickerModal } from '../../components/emergency/CountryPickerModal';
import { EMERGENCY_COUNTRY_STORAGE_KEY } from '../../constants/storageKeys';

export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();
  const { t } = useLanguage();
  const { userLocation, isoCountryCode: gpsIsoCountryCode } = useLocation();

  const [manualCountryCode, setManualCountryCode] = useState<string | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // Load remembered manual country choice from AsyncStorage on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadSavedCountry() {
      try {
        const saved = await AsyncStorage.getItem(EMERGENCY_COUNTRY_STORAGE_KEY);
        if (!isCancelled && saved) {
          setManualCountryCode(saved);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadSavedCountry();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Determine active country in order:
  // 1. Manual user override (if explicitly chosen by user)
  // 2. Last known GPS reverse-geocode isoCountryCode
  // 3. Device region from expo-localization
  // 4. Fallback: unknown
  const resolved = useMemo(() => {
    return resolveEmergencyCountry({
      manualCountryCode,
      gpsCountryCode: gpsIsoCountryCode,
    });
  }, [manualCountryCode, gpsIsoCountryCode]);

  const activeCountry: CountryEmergencyData | null = resolved.country;
  const activeCountryCode = resolved.countryCode;
  const activeCountryName = resolved.countryName;

  // Check if user is located inside Bengaluru region
  const isBengaluruRegion = useMemo(() => {
    if (!userLocation) return false;
    const region = getRegionForCoordinates(userLocation);
    return region?.id === 'bengaluru';
  }, [userLocation]);

  // Show Bengaluru casualty & Karnataka 108 only when country is India and user is in Bengaluru region
  const showBengaluruSpecificContacts = activeCountryCode === 'IN' && isBengaluruRegion;

  // Pulsating emergency glow ring animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, pulseOpacity]);

  const handleDial = async (number: string, title: string) => {
    const cleanNumber = number.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Dialer Unavailable', `Cannot place calls to ${number} (${title}) from this device.`);
      }
    } catch {
      Alert.alert('Error', `Unable to open phone dialer for ${number}.`);
    }
  };

  const handleSelectCountry = async (code: string) => {
    setManualCountryCode(code);
    try {
      await AsyncStorage.setItem(EMERGENCY_COUNTRY_STORAGE_KEY, code);
    } catch {
      // Ignore storage errors
    }
  };

  const handleResetToAutoDetect = async () => {
    setManualCountryCode(null);
    try {
      await AsyncStorage.removeItem(EMERGENCY_COUNTRY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop,
              paddingBottom: 130,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back to Previous Screen"
              style={[
                styles.backButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <BackArrowIcon size={18} color={palette.ink} />
            </Pressable>
            <Text style={[styles.headerSubtitleTag, { color: palette.ink2 }]}>
              EMERGENCY HELP
            </Text>
          </View>

          {/* HERO TITLE */}
          <View style={styles.heroTitleGroup}>
            <Text style={[styles.heroHeadline, { color: palette.ink }]}>
              {t('emergency_title', 'If this is an emergency, call now.')}
            </Text>
            <Text style={[styles.heroSubtitle, { color: palette.ink2 }]}>
              {t('emergency_subtitle', "One tap opens your phone's dialer. You place the call yourself.")}
            </Text>
          </View>

          {/* ACTIVE COUNTRY BANNER WITH VISIBLE CHANGE LINK */}
          <View
            style={[
              styles.countryBar,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.countryBarLeft}>
              <Text style={[styles.countryBarLabel, { color: palette.ink2 }]}>
                {activeCountry
                  ? `${t('emergency_numbers_for', 'Emergency numbers for')} `
                  : `${t('call_local_emergency', 'Emergency location')}: `}
                <Text style={[styles.countryBarName, { color: palette.ink }]}>
                  {activeCountry ? activeCountryName : 'Unverified Region'}
                </Text>
              </Text>
            </View>
            <Pressable
              onPress={() => setShowCountryPicker(true)}
              hitSlop={8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Change country, current is ${activeCountryName}`}
              style={styles.changeCountryBtn}
            >
              <Text style={[styles.changeCountryBtnText, { color: palette.btn }]}>
                {t('change_country', 'Change country')}
              </Text>
            </Pressable>
          </View>

          {/* CASE 1: VERIFIED COUNTRY NUMBERS */}
          {activeCountry ? (
            <>
              {/* PRIMARY UNIVERSAL HERO BUTTON (IF GENERAL NUMBER EXISTS) */}
              {activeCountry.numbers.general && (
                <View style={styles.heroEmergencyWrapper}>
                  <Animated.View
                    style={[
                      styles.emergencyPulseRing,
                      {
                        borderColor: palette.red,
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                  <Pressable
                    onPress={() =>
                      handleDial(
                        activeCountry.numbers.general!,
                        `${activeCountryName} Emergency ${activeCountry.numbers.general}`
                      )
                    }
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Call emergency service, Dial ${activeCountry.numbers.general}`}
                    style={({ pressed }) => [
                      styles.heroEmergencyButton,
                      {
                        backgroundColor: palette.red,
                        opacity: pressed ? 0.9 : 1.0,
                      },
                    ]}
                  >
                    <View style={styles.heroEmergencyIconBox}>
                      <PhoneIcon size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.heroEmergencyTextGroup}>
                      <Text style={styles.heroEmergencyTitle}>
                        {t('call_112', 'Call emergency service')}
                      </Text>
                      <Text style={styles.heroEmergencySubtitle}>
                        Dial {activeCountry.numbers.general}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

              <Text style={[styles.heroEmergencyCaption, { color: palette.ink2 }]}>
                {activeCountry.numbers.general
                  ? `Tapping opens your dialer with ${activeCountry.numbers.general} ready. MedFind does not dispatch help or estimate arrival.`
                  : 'Tap any service below to open your dialer. MedFind does not dispatch help.'}
              </Text>

              {/* SPECIFIC SERVICES (POLICE / AMBULANCE / FIRE) */}
              <View style={styles.contactsSection}>
                <Text style={[styles.contactsSectionHeader, { color: palette.ink2 }]}>
                  DIRECT SERVICES
                </Text>

                {/* Police */}
                {activeCountry.numbers.police && (
                  <View
                    style={[
                      styles.contactCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactInitialBadge,
                        {
                          backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                        },
                      ]}
                    >
                      <Text style={styles.contactInitialBadgeText}>P</Text>
                    </View>

                    <View style={styles.contactDetails}>
                      <Text style={[styles.contactTitle, { color: palette.ink }]}>
                        Police
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        Dial {activeCountry.numbers.police} • Emergency Law Enforcement
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        handleDial(
                          activeCountry.numbers.police!,
                          `${activeCountryName} Police ${activeCountry.numbers.police}`
                        )
                      }
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Call police on ${activeCountry.numbers.police}`}
                      style={[
                        styles.callIconButton,
                        {
                          backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                        },
                      ]}
                    >
                      <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
                    </Pressable>
                  </View>
                )}

                {/* Ambulance */}
                {activeCountry.numbers.ambulance && (
                  <View
                    style={[
                      styles.contactCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactInitialBadge,
                        {
                          backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                        },
                      ]}
                    >
                      <Text style={styles.contactInitialBadgeText}>A</Text>
                    </View>

                    <View style={styles.contactDetails}>
                      <Text style={[styles.contactTitle, { color: palette.ink }]}>
                        Ambulance / Medical Emergency
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        Dial {activeCountry.numbers.ambulance} • Urgent Medical Care
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        handleDial(
                          activeCountry.numbers.ambulance!,
                          `${activeCountryName} Ambulance ${activeCountry.numbers.ambulance}`
                        )
                      }
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ambulance on ${activeCountry.numbers.ambulance}`}
                      style={[
                        styles.callIconButton,
                        {
                          backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                        },
                      ]}
                    >
                      <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
                    </Pressable>
                  </View>
                )}

                {/* Fire */}
                {activeCountry.numbers.fire && (
                  <View
                    style={[
                      styles.contactCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactInitialBadge,
                        {
                          backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                        },
                      ]}
                    >
                      <Text style={styles.contactInitialBadgeText}>F</Text>
                    </View>

                    <View style={styles.contactDetails}>
                      <Text style={[styles.contactTitle, { color: palette.ink }]}>
                        Fire & Rescue Service
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        Dial {activeCountry.numbers.fire} • Fire & Disaster Rescue
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        handleDial(
                          activeCountry.numbers.fire!,
                          `${activeCountryName} Fire Department ${activeCountry.numbers.fire}`
                        )
                      }
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Call fire service on ${activeCountry.numbers.fire}`}
                      style={[
                        styles.callIconButton,
                        {
                          backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                        },
                      ]}
                    >
                      <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
                    </Pressable>
                  </View>
                )}

                {/* INDIA + BENGALURU REGION SPECIFIC CONTACTS ONLY */}
                {showBengaluruSpecificContacts && (
                  <>
                    {/* Hospital Casualty Desk */}
                    <View
                      style={[
                        styles.contactCard,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.contactInitialBadge,
                          {
                            backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                          },
                        ]}
                      >
                        <Text style={styles.contactInitialBadgeText}>H</Text>
                      </View>

                      <View style={styles.contactDetails}>
                        <Text style={[styles.contactTitle, { color: palette.ink }]}>
                          Victoria Hospital Casualty (BMCRI)
                        </Text>
                        <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                          Fort, Bangalore Medical College • 24/7 Casualty
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleDial('080-26701150', 'Victoria Hospital Casualty')}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Call Victoria Hospital Casualty"
                        style={[
                          styles.callIconButton,
                          {
                            backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                          },
                        ]}
                      >
                        <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
                      </Pressable>
                    </View>

                    {/* Arogya Sahayavani 104 Helpline */}
                    <View
                      style={[
                        styles.contactCard,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.contactInitialBadge,
                          {
                            backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                          },
                        ]}
                      >
                        <Text style={styles.contactInitialBadgeText}>1</Text>
                      </View>

                      <View style={styles.contactDetails}>
                        <Text style={[styles.contactTitle, { color: palette.ink }]}>
                          Health Information Helpline
                        </Text>
                        <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                          Dial 104 • 24/7 Medical Advice & Grievances
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleDial('104', '104 Health Helpline')}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Call 104 health helpline"
                        style={[
                          styles.callIconButton,
                          {
                            backgroundColor: scheme === 'light' ? palette.surface2 : palette.btn,
                          },
                        ]}
                      >
                        <PhoneIcon size={18} color={scheme === 'light' ? palette.ink : '#FFFFFF'} />
                      </Pressable>
                    </View>
                  </>
                )}

                {/* Link to Care Nearby */}
                <Pressable
                  onPress={() => router.push('/(tabs)/care')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="See all care nearby"
                  style={[
                    styles.seeAllCareButton,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.seeAllCareText, { color: palette.ink }]}>
                    See all care nearby
                  </Text>
                  <ChevronRightIcon size={18} color={palette.ink2} />
                </Pressable>
              </View>

              {/* Source Verification Note */}
              <View style={styles.sourceBox}>
                <Text style={[styles.sourceNoteText, { color: palette.ink2 }]}>
                  Verified against official public records ({activeCountry.numbers.verifiedAt}):
                  {'\n'}
                  {activeCountry.numbers.sources.join('\n')}
                </Text>
              </View>
            </>
          ) : (
            /* CASE 2: UNKNOWN / UNVERIFIED COUNTRY (NO SINGLE NUMBER HIGHLIGHTED) */
            <View style={styles.fallbackContainer}>
              <View
                style={[
                  styles.unverifiedAlertCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <Text style={[styles.unverifiedTitle, { color: palette.ink }]}>
                  Call your local emergency number
                </Text>
                <Text style={[styles.unverifiedSubtitle, { color: palette.ink2 }]}>
                  We do not have verified dispatch numbers for {activeCountryName}. If you are unsure, these common numbers work across many regions:
                </Text>

                <View style={styles.commonNumbersGrid}>
                  {/* Option 1: 112 */}
                  <View
                    style={[
                      styles.commonNumberCard,
                      {
                        backgroundColor: palette.surface2,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View style={styles.commonNumberLeft}>
                      <Text style={[styles.commonNumberDigits, { color: palette.ink }]}>
                        112
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        European & International Standard
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDial('112', 'Universal 112')}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Dial 112"
                      style={[styles.commonCallBtn, { backgroundColor: palette.ink }]}
                    >
                      <PhoneIcon size={16} color={palette.surface} />
                      <Text style={[styles.commonCallBtnText, { color: palette.surface }]}>
                        Dial 112
                      </Text>
                    </Pressable>
                  </View>

                  {/* Option 2: 911 */}
                  <View
                    style={[
                      styles.commonNumberCard,
                      {
                        backgroundColor: palette.surface2,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View style={styles.commonNumberLeft}>
                      <Text style={[styles.commonNumberDigits, { color: palette.ink }]}>
                        911
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        North American Standard
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDial('911', 'Universal 911')}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Dial 911"
                      style={[styles.commonCallBtn, { backgroundColor: palette.ink }]}
                    >
                      <PhoneIcon size={16} color={palette.surface} />
                      <Text style={[styles.commonCallBtnText, { color: palette.surface }]}>
                        Dial 911
                      </Text>
                    </Pressable>
                  </View>

                  {/* Option 3: 999 */}
                  <View
                    style={[
                      styles.commonNumberCard,
                      {
                        backgroundColor: palette.surface2,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <View style={styles.commonNumberLeft}>
                      <Text style={[styles.commonNumberDigits, { color: palette.ink }]}>
                        999
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        UK & Commonwealth Standard
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDial('999', 'Universal 999')}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Dial 999"
                      style={[styles.commonCallBtn, { backgroundColor: palette.ink }]}
                    >
                      <PhoneIcon size={16} color={palette.surface} />
                      <Text style={[styles.commonCallBtnText, { color: palette.surface }]}>
                        Dial 999
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.unverifiedCaption, { color: palette.ink2 }]}>
                  Tapping opens your dialer. MedFind does not dispatch help or estimate arrival.
                </Text>
              </View>

              {/* Link to Care Nearby */}
              <Pressable
                onPress={() => router.push('/(tabs)/care')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="See all care nearby"
                style={[
                  styles.seeAllCareButton,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <Text style={[styles.seeAllCareText, { color: palette.ink }]}>
                  See all care nearby
                </Text>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>
            </View>
          )}

          {/* EMERGENCY PRIORITY ADVISORY */}
          <View
            style={[
              styles.boundaryBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <ShieldCheckIcon size={18} color={palette.okInk} />
            <View style={styles.boundaryTextGroup}>
              <Text style={[styles.boundaryTitle, { color: palette.ink }]}>
                {t('quick_guide', 'Quick Emergency Help')}
              </Text>
              <Text style={[styles.boundaryBody, { color: palette.ink2 }]}>
                {t(
                  'quick_guide_desc',
                  'In severe or life-threatening situations, call your local emergency service immediately for priority help.'
                )}
              </Text>
            </View>
          </View>
        </ScrollView>
      </AnimatedScreenTransition>

      {/* MANUAL COUNTRY PICKER MODAL */}
      <CountryPickerModal
        visible={showCountryPicker}
        selectedCountryCode={activeCountryCode}
        onSelectCountry={handleSelectCountry}
        onResetToAutoDetect={manualCountryCode ? handleResetToAutoDetect : undefined}
        onClose={() => setShowCountryPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TARGET,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitleTag: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // HERO TITLE
  heroTitleGroup: {
    gap: 6,
    marginTop: 4,
  },
  heroHeadline: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },

  // COUNTRY BAR
  countryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.tab,
    borderWidth: 1,
    gap: 8,
  },
  countryBarLeft: {
    flex: 1,
  },
  countryBarLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  countryBarName: {
    fontFamily: fonts.sansBold,
    fontWeight: '700',
  },
  changeCountryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: MIN_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeCountryBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // PRIMARY HERO BUTTON
  heroEmergencyWrapper: {
    position: 'relative',
    borderRadius: radii.cardLg,
  },
  emergencyPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: radii.cardLg + 4,
    borderWidth: 2.5,
  },
  heroEmergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    paddingHorizontal: 20,
    borderRadius: radii.cardLg,
    gap: 16,
    shadowColor: '#B3261E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroEmergencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmergencyTextGroup: {
    flex: 1,
  },
  heroEmergencyTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
  },
  heroEmergencySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    marginTop: 2,
  },
  heroEmergencyCaption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // DIRECT CONTACTS
  contactsSection: {
    gap: 12,
    marginTop: 4,
  },
  contactsSectionHeader: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    minHeight: MIN_TARGET,
  },
  contactInitialBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitialBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
  },
  contactDetails: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  contactMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  callIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllCareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 4,
    minHeight: MIN_TARGET,
  },
  seeAllCareText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },

  // SOURCE BOX
  sourceBox: {
    paddingHorizontal: 4,
  },
  sourceNoteText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },

  // FALLBACK CONTAINER (UNVERIFIED / UNKNOWN COUNTRY)
  fallbackContainer: {
    gap: 14,
  },
  unverifiedAlertCard: {
    padding: 18,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    gap: 12,
  },
  unverifiedTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  unverifiedSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  commonNumbersGrid: {
    gap: 10,
    marginTop: 4,
  },
  commonNumberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radii.tab,
    borderWidth: 1,
    gap: 12,
  },
  commonNumberLeft: {
    flex: 1,
  },
  commonNumberDigits: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
  },
  commonNumberLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  commonCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: MIN_TARGET,
  },
  commonCallBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  unverifiedCaption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },

  // BOUNDARY ADVISORY BOX
  boundaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
  },
  boundaryTextGroup: {
    flex: 1,
  },
  boundaryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  boundaryBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
});
