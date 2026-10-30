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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
  GlobeIcon,
  InfoIcon,
  CrosshairTargetIcon,
} from '../../components/icons/AppIcons';
import {
  resolveEmergencyCountry,
  CountryEmergencyData,
  subscribeToEmergencyCountryChange,
  notifyEmergencyCountryChange,
  getFlagEmoji,
} from '../../data/emergencyNumbers';
import { CountryPickerModal } from '../../components/emergency/CountryPickerModal';
import { EMERGENCY_COUNTRY_STORAGE_KEY } from '../../constants/storageKeys';

export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();
  const { t, formatNumber } = useLanguage();
  const { userLocation, isoCountryCode: gpsIsoCountryCode, requestGpsLocation, isLocating } = useLocation();

  const [manualCountryCode, setManualCountryCode] = useState<string | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const hasRequestedLocationRef = useRef(false);

  // Automatically check live location once when Emergency Help is opened
  useEffect(() => {
    if (!hasRequestedLocationRef.current) {
      hasRequestedLocationRef.current = true;
      requestGpsLocation();
    }
  }, [requestGpsLocation]);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // 1. Subscribe to instant in-memory country updates across tabs and directory
  useEffect(() => {
    const unsubscribe = subscribeToEmergencyCountryChange((code) => {
      setManualCountryCode(code ? code.trim().toUpperCase() : null);
    });
    return unsubscribe;
  }, []);

  // 2. Re-sync from AsyncStorage whenever this tab screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let isCancelled = false;
      async function loadSavedCountry() {
        try {
          const saved = await AsyncStorage.getItem(EMERGENCY_COUNTRY_STORAGE_KEY);
          if (!isCancelled) {
            setManualCountryCode(saved ? saved.trim().toUpperCase() : null);
          }
        } catch {
          // Fallback gracefully
        }
      }
      loadSavedCountry();
      return () => {
        isCancelled = true;
      };
    }, [])
  );

  // Determine active country in order:
  // 1. Manual user override (if explicitly chosen by user)
  // 2. Last known GPS reverse-geocode isoCountryCode
  // 3. Live physical coordinates (if in India / Bengaluru)
  // 4. Device region from expo-localization
  // 5. Fallback: unknown
  const resolved = useMemo(() => {
    return resolveEmergencyCountry({
      manualCountryCode,
      gpsCountryCode: gpsIsoCountryCode,
      coordinates: userLocation,
    });
  }, [manualCountryCode, gpsIsoCountryCode, userLocation]);

  const activeCountry: CountryEmergencyData | null = resolved.country;
  const activeCountryCode = resolved.countryCode;
  const activeCountryName = resolved.countryName;

  // Only confirmed or partially-confirmed countries show verified buttons
  const isVerifiedCountry = Boolean(
    activeCountry && activeCountry.numbers.verificationStatus !== 'unconfirmed'
  );

  const isServiceConfirmed = (service: 'general' | 'police' | 'ambulance' | 'fire'): boolean => {
    if (!activeCountry) return false;
    const { verificationStatus, confirmedNumbers } = activeCountry.numbers;
    if (verificationStatus === 'confirmed') return true;
    if (verificationStatus === 'partial' && confirmedNumbers) {
      return confirmedNumbers.includes(service);
    }
    return false;
  };

  // Check if user is located inside Bengaluru region
  const isBengaluruRegion = useMemo(() => {
    if (!userLocation) return false;
    const region = getRegionForCoordinates(userLocation);
    return region?.id === 'bengaluru';
  }, [userLocation]);

  // Show Bengaluru casualty & Karnataka 108 only when country is India and user is in Bengaluru region
  const showBengaluruSpecificContacts = activeCountryCode === 'IN' && isBengaluruRegion;

  // === 3D EMERGENCY BUTTON ANIMATIONS ===
  // Ripple ring 1 (innermost, fastest)
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0.5)).current;
  // Ripple ring 2 (middle, offset delay)
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0.4)).current;
  // Ripple ring 3 (outer, slowest)
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const pulseOpacity3 = useRef(new Animated.Value(0.3)).current;
  // Floating bob (idle vertical oscillation)
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Button press scale
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 3 concentric ripple rings with staggered starts
    const ring1 = Animated.loop(
      Animated.parallel([
        Animated.timing(pulseAnim1, { toValue: 1.25, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseOpacity1, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(pulseAnim2, { toValue: 1.4, duration: 1600, useNativeDriver: true }),
          Animated.timing(pulseOpacity2, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    const ring3 = Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(pulseAnim3, { toValue: 1.55, duration: 1800, useNativeDriver: true }),
          Animated.timing(pulseOpacity3, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ]),
      ])
    );
    // Floating bob animation (subtle ±3px vertical oscillation)
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 3, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    ring1.start();
    ring2.start();
    ring3.start();
    float.start();
    return () => { ring1.stop(); ring2.stop(); ring3.stop(); float.stop(); };
  }, [pulseAnim1, pulseOpacity1, pulseAnim2, pulseOpacity2, pulseAnim3, pulseOpacity3, floatAnim]);

  const handleEmergencyPressIn = () => {
    Animated.spring(pressScale, { toValue: 0.92, useNativeDriver: true, friction: 8, tension: 100 }).start();
  };
  const handleEmergencyPressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
  };

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
    const normalized = code.trim().toUpperCase();
    setManualCountryCode(normalized);
    notifyEmergencyCountryChange(normalized);
    try {
      await AsyncStorage.setItem(EMERGENCY_COUNTRY_STORAGE_KEY, normalized);
    } catch {
      // Ignore storage errors
    }
  };

  const handleResetToAutoDetect = async () => {
    setManualCountryCode(null);
    notifyEmergencyCountryChange(null);
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

          {/* DEMO NOTICE CARD */}
          <View
            style={[
              styles.emergencyDemoNoticeCard,
              {
                backgroundColor: palette.amberTint,
                borderColor: palette.amberLine,
              },
            ]}
          >
            <InfoIcon size={18} color={palette.amberInk} />
            <Text
              style={[
                styles.emergencyDemoNoticeText,
                { color: palette.amberInk, fontFamily: fonts.sansMedium },
              ]}
            >
              {t(
                'emergency_demo_disclaimer',
                'Demo app: emergency numbers may be incomplete or out of date. In a real emergency, call your local emergency number.'
              )}
            </Text>
          </View>

          {/* ACTIVE COUNTRY BANNER WITH LIVE LOCATION INDICATOR & CHANGE LINK */}
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
              <View style={styles.countryStatusRow}>
                {isLocating ? (
                  <View style={[styles.locatingPill, { backgroundColor: palette.surface2 }]}>
                    <ActivityIndicator size="small" color={palette.accent} style={{ transform: [{ scale: 0.75 }] }} />
                    <Text style={[styles.locatingText, { color: palette.accent, fontFamily: fonts.sansMedium }]}>
                      Detecting live location...
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.locatingPill, { backgroundColor: palette.surface2 }]}>
                    <View
                      style={[
                        styles.liveDot,
                        {
                          backgroundColor:
                            resolved.source === 'gps'
                              ? '#10B981'
                              : resolved.source === 'manual'
                              ? palette.accent
                              : palette.ink2,
                        },
                      ]}
                    />
                    <Text style={[styles.locatingText, { color: palette.ink2, fontFamily: fonts.sansMedium }]}>
                      {resolved.source === 'gps'
                        ? 'Live GPS Location'
                        : resolved.source === 'manual'
                        ? 'Selected Location'
                        : 'Device Location'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.countryBarLabel, { color: palette.ink2, marginTop: 2 }]}>
                {isVerifiedCountry
                  ? `${t('emergency_numbers_for', 'Emergency numbers for')} `
                  : `${t('call_local_emergency', 'Emergency location')}: `}
                <Text style={[styles.countryBarName, { color: palette.ink }]}>
                  {activeCountry && activeCountryCode ? `${getFlagEmoji(activeCountryCode)} ${activeCountryName}` : (activeCountryName || 'Unverified Region')}
                </Text>
              </Text>
            </View>

            <View style={styles.countryBarRightActions}>
              <Pressable
                onPress={() => requestGpsLocation()}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Re-detect live GPS location"
                style={({ pressed }) => [
                  styles.refreshGpsBtn,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <CrosshairTargetIcon size={14} color={palette.accent} />
              </Pressable>

              <Pressable
                onPress={() => setShowCountryPicker(true)}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Change country, current is ${activeCountryName}`}
                style={styles.changeCountryBtn}
              >
                <Text style={[styles.changeCountryBtnText, { color: palette.btn }]}>
                  {t('change_country', 'Change')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* WORLDWIDE DIRECTORY ENTRY LINK */}
          <Pressable
            onPress={() => router.push('/emergency-directory')}
            style={[
              styles.directoryLinkCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Browse Worldwide Emergency Directory with all 87 countries and codes"
          >
            <View style={styles.directoryLinkLeft}>
              <View
                style={[
                  styles.directoryIconBox,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(37, 99, 235, 0.08)'
                        : 'rgba(56, 189, 248, 0.12)',
                  },
                ]}
              >
                <GlobeIcon size={16} color={palette.btn} />
              </View>
              <View style={styles.directoryTextGroup}>
                <Text style={[styles.directoryLinkTitle, { color: palette.ink }]}>
                  {t('worldwide_directory', 'Worldwide Emergency Directory')}
                </Text>
                <Text style={[styles.directoryLinkSubtitle, { color: palette.ink2 }]}>
                  {t('worldwide_directory_sub', 'All 87 country codes, police, ambulance & fire numbers')}
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={16} color={palette.ink2} />
          </Pressable>

          {/* CASE 1: VERIFIED COUNTRY NUMBERS */}
          {isVerifiedCountry && activeCountry ? (
            <>
              {/* PRIMARY UNIVERSAL HERO BUTTON (IF GENERAL NUMBER EXISTS AND IS CONFIRMED) */}
              {activeCountry.numbers.general && isServiceConfirmed('general') && (
                <View style={styles.heroEmergencyWrapper}>
                  {/* 3D Ripple Ring 1 (innermost) */}
                  <Animated.View
                    style={[
                      styles.emergencyPulseRing,
                      {
                        borderColor: palette.red,
                        transform: [{ scale: pulseAnim1 }],
                        opacity: pulseOpacity1,
                      },
                    ]}
                  />
                  {/* 3D Ripple Ring 2 (middle) */}
                  <Animated.View
                    style={[
                      styles.emergencyPulseRing,
                      styles.emergencyPulseRing2,
                      {
                        borderColor: palette.red,
                        transform: [{ scale: pulseAnim2 }],
                        opacity: pulseOpacity2,
                      },
                    ]}
                  />
                  {/* 3D Ripple Ring 3 (outer) */}
                  <Animated.View
                    style={[
                      styles.emergencyPulseRing,
                      styles.emergencyPulseRing3,
                      {
                        borderColor: palette.red,
                        transform: [{ scale: pulseAnim3 }],
                        opacity: pulseOpacity3,
                      },
                    ]}
                  />

                  {/* 3D Emergency Button with floating bob + press scale */}
                  <Animated.View
                    style={{
                      transform: [
                        { translateY: floatAnim },
                        { scale: pressScale },
                        { perspective: 800 },
                      ],
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        handleDial(
                          activeCountry.numbers.general!,
                          `${activeCountryName} Emergency ${activeCountry.numbers.general}`
                        )
                      }
                      onPressIn={handleEmergencyPressIn}
                      onPressOut={handleEmergencyPressOut}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Call emergency service, Dial ${activeCountry.numbers.general}`}
                      style={[styles.heroEmergencyButton3D]}
                    >
                      {/* Shadow layer 1 (deepest) */}
                      <View style={[styles.emergencyShadowLayer1, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]} />
                      {/* Shadow layer 2 (mid) */}
                      <View style={[styles.emergencyShadowLayer2, { backgroundColor: 'rgba(220, 38, 38, 0.25)' }]} />
                      {/* Main 3D button body */}
                      <View style={[styles.emergencyButtonBody, { backgroundColor: palette.red }]}>
                        {/* Glossy highlight (top-left shine) */}
                        <View style={styles.emergencyGlossyHighlight} />
                        {/* Bottom dark edge for 3D depth */}
                        <View style={styles.emergencyBottomEdge} />

                        <View style={styles.heroEmergencyIconBox}>
                          <PhoneIcon size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.heroEmergencyTextGroup}>
                          <Text style={styles.heroEmergencyTitle}>
                            {t('call_112', 'Call emergency service')}
                          </Text>
                          <Text style={styles.heroEmergencySubtitle}>
                            {t('dial_prefix', 'Dial')} {formatNumber(activeCountry.numbers.general)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
              )}

              <Text style={[styles.heroEmergencyCaption, { color: palette.ink2 }]}>
                {activeCountry.numbers.general
                  ? t('emergency_direct_call_note', 'Tapping opens your dialer with {number} ready. MedFind does not dispatch help or estimate arrival.').replace('{number}', activeCountry.numbers.general)
                  : t('emergency_direct_tap_note', 'Tap any service below to open your dialer. MedFind does not dispatch help.')}
              </Text>

              {/* SPECIFIC SERVICES (POLICE / AMBULANCE / FIRE) */}
              <View style={styles.contactsSection}>
                <Text style={[styles.contactsSectionHeader, { color: palette.ink2 }]}>
                  {t('direct_services', 'DIRECT SERVICES')}
                </Text>

                {/* Police */}
                {activeCountry.numbers.police && isServiceConfirmed('police') && (
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
                        {t('police', 'Police')}
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        {t('dial_prefix', 'Dial')} {activeCountry.numbers.police} • {t('police_sub', 'Emergency Law Enforcement')}
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
                {activeCountry.numbers.ambulance && isServiceConfirmed('ambulance') && (
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
                        {t('ambulance_medical', 'Ambulance / Medical Emergency')}
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        {t('dial_prefix', 'Dial')} {activeCountry.numbers.ambulance} • {t('ambulance_sub', 'Urgent Medical Care')}
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
                {activeCountry.numbers.fire && isServiceConfirmed('fire') && (
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
                        {t('fire_rescue', 'Fire & Rescue Service')}
                      </Text>
                      <Text style={[styles.contactMeta, { color: palette.ink2 }]}>
                        {t('dial_prefix', 'Dial')} {activeCountry.numbers.fire} • {t('fire_sub', 'Fire & Disaster Rescue')}
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

                {/* Regional or Operational Note */}
                {activeCountry.numbers.note && (
                  <View
                    style={[
                      styles.contactCard,
                      {
                        backgroundColor: palette.surface2,
                        borderColor: palette.line,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                      },
                    ]}
                  >
                    <Text style={[styles.contactMeta, { color: palette.ink, fontSize: 13, lineHeight: 18 }]}>
                      ℹ️ {activeCountry.numbers.note}
                    </Text>
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
                  accessibilityLabel={t('see_all_care_nearby', 'See all care nearby')}
                  style={[
                    styles.seeAllCareButton,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.seeAllCareText, { color: palette.ink }]}>
                    {t('see_all_care_nearby', 'See all care nearby')}
                  </Text>
                  <ChevronRightIcon size={18} color={palette.ink2} />
                </Pressable>
              </View>

              {/* Source Verification Note */}
              <View style={styles.sourceBox}>
                <Text style={[styles.sourceNoteText, { color: palette.ink2 }]}>
                  {activeCountry.numbers.verificationStatus === 'confirmed'
                    ? 'All numbers confirmed in official cited records'
                    : 'Partially confirmed in official cited records'}{' '}
                  ({activeCountry.numbers.verifiedAt}):
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
                        {formatNumber('112')}
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        {t('intl_std_112', 'European & International Standard')}
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
                        {t('dial_num', 'Dial {num}').replace('{num}', formatNumber('112'))}
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
                        {formatNumber('911')}
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        {t('north_american_std', 'North American Standard')}
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
                        {t('dial_num', 'Dial {num}').replace('{num}', formatNumber('911'))}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Option 3: 108 (Emergency Medical / Ambulance) */}
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
                        {formatNumber('108')}
                      </Text>
                      <Text style={[styles.commonNumberLabel, { color: palette.ink2 }]}>
                        {t('ambulance_medical_std', 'Emergency Medical & Ambulance (India)')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDial('108', 'Emergency Ambulance 108')}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Dial 108"
                      style={[styles.commonCallBtn, { backgroundColor: palette.ink }]}
                    >
                      <PhoneIcon size={16} color={palette.surface} />
                      <Text style={[styles.commonCallBtnText, { color: palette.surface }]}>
                        {t('dial_num', 'Dial {num}').replace('{num}', formatNumber('108'))}
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
  emergencyDemoNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.tab,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  emergencyDemoNoticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
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
  countryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  locatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  locatingText: {
    fontSize: 11,
    lineHeight: 14,
  },
  countryBarLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  countryBarName: {
    fontFamily: fonts.sansBold,
    fontWeight: '700',
  },
  countryBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshGpsBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  directoryLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.tab,
    borderWidth: 1,
    gap: 12,
  },
  directoryLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  directoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directoryTextGroup: {
    flex: 1,
  },
  directoryLinkTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '600',
  },
  directoryLinkSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 1,
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
  emergencyPulseRing2: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: radii.cardLg + 10,
    borderWidth: 2,
  },
  emergencyPulseRing3: {
    position: 'absolute',
    top: -18,
    left: -18,
    right: -18,
    bottom: -18,
    borderRadius: radii.cardLg + 18,
    borderWidth: 1.5,
  },
  heroEmergencyButton3D: {
    borderRadius: radii.cardLg,
    position: 'relative',
  },
  emergencyShadowLayer1: {
    position: 'absolute',
    top: 8,
    left: 4,
    right: 4,
    bottom: -8,
    borderRadius: radii.cardLg,
  },
  emergencyShadowLayer2: {
    position: 'absolute',
    top: 4,
    left: 2,
    right: 2,
    bottom: -4,
    borderRadius: radii.cardLg,
  },
  emergencyButtonBody: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
    paddingHorizontal: 20,
    borderRadius: radii.cardLg,
    gap: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  emergencyGlossyHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: radii.cardLg,
    borderTopRightRadius: radii.cardLg,
  },
  emergencyBottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: radii.cardLg,
    borderBottomRightRadius: radii.cardLg,
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
