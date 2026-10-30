import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../store/profile';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pharmacyPortalService,
  StorePartnerAuth,
  FacilityType,
  HOSPITAL_MANDATORY_DOCS,
  CLINIC_MANDATORY_DOCS,
  PHARMACY_MANDATORY_DOCS,
} from '../../services/pharmacyPortalService';
import {
  STORE_PHOTO_STORAGE_KEY,
  STORE_LOCATION_STORAGE_KEY,
} from '../../constants/storageKeys';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import {
  BackArrowIcon,
  PharmacyStoreIcon,
  HospitalIcon,
  ClinicIcon,
  StaffBadgeIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon,
  RefreshIcon,
  InfoIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  TrashIcon,
  DocumentFileIcon,
} from '../../components/icons/AppIcons';
import {
  LiveLocationPinpointMap,
  PinpointResult,
} from '../../components/location/LiveLocationPinpointMap';

export default function PharmacyStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, scheme, setScheme } = useTheme();
  const { language, setLanguage, t, tPharmacy, formatNumber } = useLanguage();
  const { profile, updateProfile } = useProfile();

  // Guard flag: when signing out or changing role, prevent route guard from fighting the navigation
  const isNavigatingAway = useRef(false);

  const [partnerAuth, setPartnerAuth] = useState<StorePartnerAuth | null>(null);
  const [storePhotoUri, setStorePhotoUri] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showPinpointMap, setShowPinpointMap] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const facilityType: FacilityType =
    partnerAuth?.facilityType ||
    (profile.role === 'hospital'
      ? 'hospital'
      : profile.role === 'clinic'
      ? 'clinic'
      : 'pharmacy');

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  useEffect(() => {
    pharmacyPortalService.getStorePartnerAuth().then(setPartnerAuth);

    // Hydrate persisted store photo
    AsyncStorage.getItem(STORE_PHOTO_STORAGE_KEY).then((savedPhoto) => {
      if (savedPhoto) setStorePhotoUri(savedPhoto);
    });

    // Hydrate persisted live store location
    AsyncStorage.getItem(STORE_LOCATION_STORAGE_KEY).then((savedLoc) => {
      if (savedLoc) {
        try {
          setLiveLocation(JSON.parse(savedLoc));
        } catch {}
      }
    });
  }, []);

  // Cross-platform sign-out confirmation
  const confirmSignOut = (): Promise<boolean> => {
    const portalName =
      facilityType === 'hospital'
        ? 'hospital portal'
        : facilityType === 'clinic'
        ? 'clinic portal'
        : 'pharmacy portal';
    if (Platform.OS === 'web') {
      return Promise.resolve(
        (window as any).confirm(
          `Sign out of ${portalName}?\n\nYou will need to enter your authorized credentials again to make stock updates.`
        )
      );
    }
    return new Promise((resolve) => {
      Alert.alert(
        `Sign out of ${portalName}?`,
        'You will need to enter your authorized credentials and attestation again to make stock updates.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
  };

  // Cross-platform change-role confirmation
  const confirmChangeRole = (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(
        (window as any).confirm(
          `${t('change_role', 'Change role?')}\n\n${t('change_role_confirm_msg', 'This takes you back to the start.')}`
        )
      );
    }
    return new Promise((resolve) => {
      Alert.alert(
        t('change_role', 'Change role?'),
        t('change_role_confirm_msg', 'This takes you back to the start.'),
        [
          { text: t('cancel', 'Cancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('change_role', 'Change role'), style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
  };

  const handleSignOut = async () => {
    isNavigatingAway.current = true;
    setStorePhotoUri(null);
    setLiveLocation(null);
    await pharmacyPortalService.clearStorePartnerAuth();
    await updateProfile({ role: null });
    router.replace('/');
  };

  const handleChangeRole = async () => {
    isNavigatingAway.current = true;
    setStorePhotoUri(null);
    setLiveLocation(null);
    await pharmacyPortalService.clearStorePartnerAuth();
    await updateProfile({ role: null });
    router.replace('/');
  };

  // Photo picker (web uses file input, converts to persistent Data URL)
  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (uploadEvent) => {
            const dataUrl = uploadEvent.target?.result as string;
            if (dataUrl) {
              setStorePhotoUri(dataUrl);
              try {
                await AsyncStorage.setItem(STORE_PHOTO_STORAGE_KEY, dataUrl);
              } catch {}
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Photo Upload', 'Photo upload requires a native build. Use the web version for now.');
    }
  };

  const handleRemovePhoto = async () => {
    setStorePhotoUri(null);
    try {
      await AsyncStorage.removeItem(STORE_PHOTO_STORAGE_KEY);
    } catch {}
  };

  // Live location fetch
  const handleShareLocation = async () => {
    setFetchingLocation(true);
    setLocationError(null);
    setLocationSuccess(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location access in your device settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      // Reverse-geocode to get a human-readable address
      let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo?.[0]) {
          const g = geo[0];
          address = [g.name, g.street, g.district, g.city].filter(Boolean).join(', ');
        }
      } catch {}

      const locData = { lat: latitude, lng: longitude, address };
      setLiveLocation(locData);
      try {
        await AsyncStorage.setItem(STORE_LOCATION_STORAGE_KEY, JSON.stringify(locData));
      } catch {}
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 3000);
      // Open pinpoint map so staff can fine-tune to dispensary counter or gate
      setShowPinpointMap(true);
    } catch (err) {
      setLocationError('Could not fetch location. Please try again.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleOpenPinpoint = () => {
    setLocationError(null);
    setShowPinpointMap(true);
  };

  const handlePinpointConfirm = async (result: PinpointResult) => {
    const locData = { lat: result.latitude, lng: result.longitude, address: result.address };
    setLiveLocation(locData);
    setShowPinpointMap(false);
    try {
      await AsyncStorage.setItem(STORE_LOCATION_STORAGE_KEY, JSON.stringify(locData));
    } catch {}
    setLocationSuccess(true);
    setTimeout(() => setLocationSuccess(false), 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* HEADER BAR */}
      <View style={[styles.headerBar, { paddingTop, borderBottomColor: palette.line }]}>
        <Pressable
          testID="pharmacy-store-back-btn"
          onPress={() => router.back()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to inventory"
          style={({ pressed }) => [
            styles.headerBackButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.8 : 1.0,
            },
          ]}
        >
          <BackArrowIcon size={18} color={palette.ink} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: palette.ink, fontFamily: fonts.sansBold }]}>
            {facilityType === 'hospital'
              ? t('hospital_settings_title', 'Hospital Settings & Compliance')
              : facilityType === 'clinic'
              ? t('clinic_settings_title', 'Clinic Settings & Compliance')
              : t('pharmacy_settings_title', 'Pharmacy Settings & Compliance')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: palette.ink2, fontFamily: fonts.sans }]}>
            {facilityType === 'hospital'
              ? 'Inpatient Wards & Dispensary Desk'
              : facilityType === 'clinic'
              ? 'OPD Consultation & Dispensary Desk'
              : t('dispensary_staff_station', 'Dispensary & Staff Station')}
          </Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* COMPLIANCE TIER BANNER */}
        <View
          style={[
            styles.demoBadgeCard,
            {
              backgroundColor: palette.surface2,
              borderColor: palette.line,
            },
          ]}
        >
          <ShieldCheckIcon size={22} color={palette.accent} />
          <View style={styles.demoBadgeTextCol}>
            <Text
              style={[
                styles.demoBadgeTitle,
                { color: palette.ink, fontFamily: fonts.sansBold },
              ]}
            >
              {facilityType === 'hospital'
                ? 'KPME Act • Hospital High Compliance Tier'
                : facilityType === 'clinic'
                ? 'KPME Act • Clinic Medium Compliance Tier'
                : 'Drugs & Cosmetics Act • Retail Pharmacy Tier'}
            </Text>
            <Text
              style={[
                styles.demoBadgeSub,
                { color: palette.ink2, fontFamily: fonts.sans },
              ]}
            >
              {facilityType === 'hospital'
                ? 'Verified inpatient beds, operating theatres, ICU facilities and KSPCB waste management.'
                : facilityType === 'clinic'
                ? 'Verified outpatient OPD consultations, practitioner credentials and clinical clearances.'
                : 'Verified retail Form 20/21 licenses, registered pharmacist and cold chain monitoring.'}
            </Text>
          </View>
        </View>

        {/* DETAILS SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          {facilityType === 'hospital'
            ? 'CURRENT HOSPITAL & INFRASTRUCTURE'
            : facilityType === 'clinic'
            ? 'CURRENT CLINIC & PRACTITIONER DETAILS'
            : t('current_store_credentials', 'CURRENT STORE & CREDENTIALS')}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {/* 1. Establishment Name */}
          <View style={styles.rowItem}>
            {facilityType === 'hospital' ? (
              <HospitalIcon size={20} color={palette.accent} />
            ) : facilityType === 'clinic' ? (
              <ClinicIcon size={20} color={palette.accent} />
            ) : (
              <PharmacyStoreIcon size={20} color={palette.accent} />
            )}
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {facilityType === 'hospital'
                  ? 'Hospital Name'
                  : facilityType === 'clinic'
                  ? 'Clinic Name'
                  : t('select_operating_pharmacy', 'Pharmacy Name')}
              </Text>
              <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {tPharmacy(
                  partnerAuth?.pharmacyName ||
                    (facilityType === 'hospital'
                      ? 'Victoria Hospital (BMCRI)'
                      : facilityType === 'clinic'
                      ? 'Basavanagudi BBMP Primary Health Centre'
                      : 'Victoria Hospital Community Pharmacy')
                )}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          {/* 2. Specific Tier Breakdown */}
          {facilityType === 'hospital' && (
            <>
              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Hospital Category
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.hospitalData?.hospitalCategory || 'Level 3 Super-Specialty Hospital'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Bed Capacity & Infrastructure
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {formatNumber(partnerAuth?.hospitalData?.bedCapacity || '750')} Beds •{' '}
                    {formatNumber(partnerAuth?.hospitalData?.operationTheatres || '12')} OTs •{' '}
                    {formatNumber(partnerAuth?.hospitalData?.icuBeds || '48')} ICUs •{' '}
                    {formatNumber(partnerAuth?.hospitalData?.emergencyBeds || '24')} Emergency Beds
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Bio-Medical Waste User ID (KSPCB)
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.hospitalData?.bioMedicalWasteId || partnerAuth?.licenseNumber || 'KSPCB/BMW/BLR/2026/8941'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <StaffBadgeIcon size={20} color={palette.accent} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Grievance Officer & Administration
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.hospitalData?.nodalOfficerName || partnerAuth?.pharmacistName || 'Dr. S. Nagaraj, MD'}{' '}
                    ({partnerAuth?.hospitalData?.nodalOfficerContact || '080-26701199'})
                  </Text>
                </View>
              </View>
            </>
          )}

          {facilityType === 'clinic' && (
            <>
              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Clinic Type & Medicine System
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.clinicData?.clinicType || 'Multi-Specialty Polyclinic'} •{' '}
                    {partnerAuth?.clinicData?.systemOfMedicine || 'Allopathy (Modern Medicine)'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <StaffBadgeIcon size={20} color={palette.accent} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Primary In-Charge Doctor
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.clinicData?.primaryDoctorName || partnerAuth?.pharmacistName || 'Dr. Shweta Rao'} (
                    {partnerAuth?.clinicData?.primaryDoctorDegree || 'MBBS, MD'})
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <ShieldCheckIcon size={20} color={palette.accent} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    State Medical Council Reg. No.
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.clinicData?.primaryDoctorCouncilReg || partnerAuth?.licenseNumber || 'KMC/DOC/KA/2024/77412'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    On-Site Diagnostic Support
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.clinicData?.diagnosticSupport !== false
                      ? '✓ Verified Internal On-Site Diagnostic Lab & X-Ray'
                      : '✗ External Diagnostic Labs Only'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {facilityType === 'pharmacy' && (
            <>
              <View style={styles.rowItem}>
                <StaffBadgeIcon size={20} color={palette.accent} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    {t('registered_pharmacist_label', 'Registered Pharmacist')}
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.pharmacistName || 'Dr. Anand Rao, B.Pharm'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <ShieldCheckIcon size={20} color={palette.accent} />
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Drug Licenses (Forms 20 & 21)
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    Form 20: {partnerAuth?.pharmacyData?.form20License || partnerAuth?.licenseNumber || 'KA-BLR-20-449102'} • Form 21: {partnerAuth?.pharmacyData?.form21License || 'KA-BLR-21-449103'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    Cold Chain Infrastructure
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.pharmacyData?.coldChainMonitoring || 'Automated 24/7 Digital Data Logger (2-8°C)'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: palette.line }]} />

              <View style={styles.rowItem}>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowLabel, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    {t('dispensing_station_label', 'Dispensing Station')}
                  </Text>
                  <Text style={[styles.rowValue, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {partnerAuth?.counterId || 'Dispensary Counter 1'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* VERIFIED COMPLIANCE DOCUMENTS SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          MANDATORY REGULATORY DOCUMENTS
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {(facilityType === 'hospital'
            ? HOSPITAL_MANDATORY_DOCS
            : facilityType === 'clinic'
            ? CLINIC_MANDATORY_DOCS
            : PHARMACY_MANDATORY_DOCS
          ).map((docReq, idx, arr) => {
            const uploadedDoc =
              facilityType === 'hospital'
                ? partnerAuth?.hospitalData?.documents?.[docReq.key]
                : facilityType === 'clinic'
                ? partnerAuth?.clinicData?.documents?.[docReq.key]
                : partnerAuth?.pharmacyData?.documents?.[docReq.key];

            return (
              <React.Fragment key={docReq.key}>
                <View style={styles.docRowItem}>
                  <DocumentFileIcon size={20} color={palette.accent} />
                  <View style={styles.docRowTextCol}>
                    <Text style={[styles.docRowTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                      {docReq.title}
                    </Text>
                    <Text style={[styles.docRowAuthority, { color: palette.ink2, fontFamily: fonts.sans }]}>
                      Authority: {docReq.authority}
                    </Text>
                    <View style={styles.docVerifiedBadgeRow}>
                      <View style={[styles.docVerifiedPill, { backgroundColor: palette.okTint }]}>
                        <CheckCircleIcon size={12} color={palette.okInk} />
                        <Text style={[styles.docVerifiedPillText, { color: palette.okInk, fontFamily: fonts.sansBold }]}>
                          Verified & Attached
                        </Text>
                      </View>
                      <Text style={[styles.docFileNameText, { color: palette.ink2, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {uploadedDoc?.fileName || `${docReq.key.toUpperCase()}_Govt_Verified.pdf`}
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < arr.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: palette.line }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* APPEARANCE SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          {t('appearance_and_lang', 'APPEARANCE & LANGUAGE')}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {/* THEME SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={styles.prefLabelCol}>
              <Text style={[styles.prefTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {t('theme_label', 'Theme')}
              </Text>
              <Text style={[styles.prefSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {scheme === 'dark' ? t('dark_mode', 'Dark Mode') : t('light_mode', 'Light Mode')}
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <Pressable
                onPress={() => setScheme('light')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to light theme"
                style={[
                  styles.segmentBtn,
                  scheme === 'light' && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                ]}
              >
                <SunIcon size={16} color={scheme === 'light' ? palette.accent : palette.ink2} />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: scheme === 'light' ? palette.ink : palette.ink2,
                      fontFamily: scheme === 'light' ? fonts.sansBold : fonts.sans,
                    },
                  ]}
                >
                  Light
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setScheme('dark')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch to dark theme"
                style={[
                  styles.segmentBtn,
                  scheme === 'dark' && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                ]}
              >
                <MoonIcon size={16} color={scheme === 'dark' ? palette.accent : palette.ink2} />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: scheme === 'dark' ? palette.ink : palette.ink2,
                      fontFamily: scheme === 'dark' ? fonts.sansBold : fonts.sans,
                    },
                  ]}
                >
                  Dark
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          {/* LANGUAGE SWITCHER */}
          <View style={styles.preferenceRow}>
            <View style={styles.prefLabelCol}>
              <Text style={[styles.prefTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                Language
              </Text>
              <Text style={[styles.prefSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {language === 'kn' ? 'ಕನ್ನಡ' : language === 'hi' ? 'हिंदी' : 'English'}
              </Text>
            </View>
            <View style={[styles.segmentedControl, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              {(['en', 'kn', 'hi'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch language to ${lang}`}
                  style={[
                    styles.segmentBtn,
                    language === lang && [styles.segmentBtnActive, { backgroundColor: palette.surface }],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: language === lang ? palette.ink : palette.ink2,
                        fontFamily: language === lang ? fonts.sansBold : fonts.sans,
                      },
                    ]}
                  >
                    {lang === 'en' ? 'EN' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिं'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* FACILITY PHOTOS SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          {facilityType === 'hospital'
            ? 'HOSPITAL PHOTOS'
            : facilityType === 'clinic'
            ? 'CLINIC PHOTOS'
            : t('store_photos_heading', 'STORE PHOTOS')}
        </Text>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {storePhotoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image
                source={{ uri: storePhotoUri }}
                style={styles.photoPreview}
                resizeMode="cover"
                accessibilityLabel={
                  facilityType === 'hospital'
                    ? 'Hospital photo'
                    : facilityType === 'clinic'
                    ? 'Clinic photo'
                    : 'Store photo'
                }
              />
              <View style={styles.photoActionRow}>
                <Pressable
                  onPress={handlePickPhoto}
                  style={({ pressed }) => [
                    styles.photoReplaceBtn,
                    { backgroundColor: palette.accent, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <CameraIcon size={16} color="#FFF" />
                  <Text style={[styles.photoBtnText, { color: '#FFF', fontFamily: fonts.sansBold }]}>
                    {t('replace_photo', 'Replace Photo')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleRemovePhoto}
                  style={({ pressed }) => [
                    styles.photoRemoveBtn,
                    { backgroundColor: palette.surface2, borderColor: palette.line, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <TrashIcon size={16} color={palette.badInk} />
                  <Text style={[styles.photoRemoveBtnText, { color: palette.badInk, fontFamily: fonts.sansBold }]}>
                    {t('remove_photo', 'Remove')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handlePickPhoto}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                facilityType === 'hospital'
                  ? 'Add hospital photo'
                  : facilityType === 'clinic'
                  ? 'Add clinic photo'
                  : 'Add store photo'
              }
              style={({ pressed }) => [
                styles.photoUploadBtn,
                {
                  borderColor: palette.accent,
                  backgroundColor: pressed ? palette.surface2 : 'transparent',
                },
              ]}
            >
              <CameraIcon size={28} color={palette.accent} />
              <Text style={[styles.photoUploadTitle, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                {facilityType === 'hospital'
                  ? 'Add Hospital Photo'
                  : facilityType === 'clinic'
                  ? 'Add Clinic Photo'
                  : t('add_store_photo', 'Add Store Photo')}
              </Text>
              <Text style={[styles.photoUploadSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {Platform.OS === 'web' ? t('photo_upload_web_hint', 'Click to choose from your files') : t('photo_upload_native_hint', 'Tap to open camera or gallery')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* LIVE LOCATION SECTION */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          {facilityType === 'hospital'
            ? 'HOSPITAL LOCATION'
            : facilityType === 'clinic'
            ? 'CLINIC LOCATION'
            : t('store_location_heading', 'STORE LOCATION')}
        </Text>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {liveLocation ? (
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <MapPinIcon size={20} color={palette.accent} />
                <View style={styles.locationTextCol}>
                  <Text style={[styles.locationAddress, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                    {liveLocation.address}
                  </Text>
                  <Text style={[styles.locationCoords, { color: palette.ink2, fontFamily: fonts.sans }]}>
                    {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}
                  </Text>
                </View>
              </View>
              {locationSuccess && (
                <View style={[styles.successBanner, { backgroundColor: palette.okTint, borderColor: palette.okLine }]}>
                  <CheckCircleIcon size={16} color={palette.okInk} />
                  <Text style={[styles.successText, { color: palette.okInk, fontFamily: fonts.sansSemi }]}>
                    {t('location_shared_success', 'Location shared!')}
                  </Text>
                </View>
              )}
              <View style={styles.locationBtnRow}>
                <Pressable
                  onPress={handleOpenPinpoint}
                  style={({ pressed }) => [
                    styles.locationPinpointBtn,
                    { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Pinpoint on map"
                >
                  <MapPinIcon size={16} color={palette.btnInk} />
                  <Text style={[styles.locationPinpointBtnText, { color: palette.btnInk, fontFamily: fonts.sansBold }]}>
                    {t('pinpoint_on_map', 'Pinpoint on Map')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleShareLocation}
                  disabled={fetchingLocation}
                  style={({ pressed }) => [
                    styles.locationUpdateBtn,
                    { backgroundColor: palette.surface2, borderColor: palette.line, opacity: pressed || fetchingLocation ? 0.7 : 1 },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh GPS"
                >
                  {fetchingLocation ? (
                    <ActivityIndicator size="small" color={palette.accent} />
                  ) : (
                    <Text style={[styles.locationUpdateBtnText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                      {t('update_live_location', 'Refresh GPS')}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              <Pressable
                onPress={handleShareLocation}
                disabled={fetchingLocation}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  facilityType === 'hospital'
                    ? 'Share live hospital location'
                    : facilityType === 'clinic'
                    ? 'Share live clinic location'
                    : 'Share live store location'
                }
                style={({ pressed }) => [
                  styles.locationShareBtn,
                  {
                    borderColor: palette.accent,
                    backgroundColor: pressed ? palette.surface2 : 'transparent',
                    opacity: fetchingLocation ? 0.6 : 1,
                  },
                ]}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <MapPinIcon size={28} color={palette.accent} />
                )}
                <Text style={[styles.locationShareTitle, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                  {fetchingLocation ? t('getting_location', 'Getting Location…') : t('share_live_location', 'Share Live Location')}
                </Text>
                <Text style={[styles.locationShareSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                  {facilityType === 'hospital'
                    ? 'Helps patients navigate to your emergency, OPD, or inpatient dispensary'
                    : facilityType === 'clinic'
                    ? 'Helps patients navigate to your consultation rooms and dispensary'
                    : t('location_share_sub', 'Helps customers navigate to your exact counter')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleOpenPinpoint}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Pinpoint on live map"
                style={({ pressed }) => [
                  styles.pinpointSecondaryBtn,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <MapPinIcon size={16} color={palette.accent} />
                <Text style={[styles.pinpointSecondaryBtnText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                  {t('pinpoint_on_live_map', 'Pinpoint on Live Map')}
                </Text>
              </Pressable>
            </View>
          )}
          {locationError && (
            <Text style={[styles.locationError, { color: palette.badInk, fontFamily: fonts.sans }]}>
              {locationError}
            </Text>
          )}
        </View>

        {/* ACCOUNT / ROLE ACTIONS */}
        <Text style={[styles.sectionHeading, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
          {t('session_and_role', 'SESSION & ROLE')}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {/* SIGN OUT */}
          <Pressable
            testID="pharmacy-sign-out-btn"
            onPress={handleSignOut}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Sign out of ${facilityType === 'hospital' ? 'hospital' : facilityType === 'clinic' ? 'clinic' : 'pharmacy'} portal`}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.75 : 1.0 },
            ]}
          >
            <View style={styles.actionRowTextCol}>
              <Text style={[styles.actionRowTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {facilityType === 'hospital'
                  ? 'Sign out of Hospital Portal'
                  : facilityType === 'clinic'
                  ? 'Sign out of Clinic Portal'
                  : t('sign_out_of_pharmacy', 'Sign out of pharmacy')}
              </Text>
              <Text style={[styles.actionRowSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {t('clears_credentials_sub', 'Clears verified credentials on this device')}
              </Text>
            </View>
            <Text style={[styles.actionButtonText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
              {t('sign_out', 'Sign out')}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: palette.line }]} />

          {/* CHANGE ROLE */}
          <Pressable
            testID="pharmacy-change-role-btn"
            onPress={handleChangeRole}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Change role to customer"
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.75 : 1.0 },
            ]}
          >
            <View style={styles.actionRowTextCol}>
              <Text style={[styles.actionRowTitle, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                {t('change_role', 'Change role')}
              </Text>
              <Text style={[styles.actionRowSub, { color: palette.ink2, fontFamily: fonts.sans }]}>
                {t('change_role_sub', 'Return to start to choose Customer or Staff')}
              </Text>
            </View>
            <RefreshIcon size={18} color={palette.accent} />
          </Pressable>
        </View>
      </ScrollView>

      <LiveLocationPinpointMap
        visible={showPinpointMap}
        initialCoords={
          liveLocation
            ? { latitude: liveLocation.lat, longitude: liveLocation.lng }
            : null
        }
        initialAddress={liveLocation?.address}
        title={
          facilityType === 'hospital'
            ? t('pinpoint_hospital_location', 'Pinpoint Hospital Entrance')
            : facilityType === 'clinic'
            ? t('pinpoint_clinic_location', 'Pinpoint Clinic Location')
            : t('pinpoint_pharmacy_location', 'Pinpoint Pharmacy Counter')
        }
        subtitle={t('pinpoint_map_subtitle', 'Drag marker or tap anywhere on OpenStreetMap to pin your exact entrance or dispensary.')}
        onClose={() => setShowPinpointMap(false)}
        onConfirm={handlePinpointConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  demoBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  demoBadgeTextCol: {
    flex: 1,
    gap: 2,
  },
  demoBadgeTitle: {
    fontSize: 14,
  },
  demoBadgeSub: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
  },
  rowValue: {
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: MIN_TARGET,
  },
  prefLabelCol: {
    flex: 1,
    gap: 2,
  },
  prefTitle: {
    fontSize: 15,
  },
  prefSub: {
    fontSize: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
    minHeight: 36,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 52,
  },
  actionRowTextCol: {
    flex: 1,
    gap: 2,
  },
  actionRowTitle: {
    fontSize: 15,
  },
  actionRowSub: {
    fontSize: 12,
  },
  actionButtonText: {
    fontSize: 14,
  },
  // Photo upload styles
  photoPreviewContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  photoActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  photoReplaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  photoRemoveBtnText: {
    fontSize: 13,
  },
  photoBtnText: {
    fontSize: 14,
  },
  photoUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    margin: 16,
    gap: 8,
    minHeight: MIN_TARGET,
  },
  photoUploadTitle: {
    fontSize: 15,
    marginTop: 4,
  },
  photoUploadSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Location styles
  locationCard: {
    padding: 16,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationTextCol: {
    flex: 1,
    gap: 2,
  },
  locationAddress: {
    fontSize: 14,
  },
  locationCoords: {
    fontSize: 12,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  successText: {
    fontSize: 13,
  },
  locationBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  locationPinpointBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: MIN_TARGET,
  },
  locationPinpointBtnText: {
    fontSize: 14,
  },
  pinpointSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: MIN_TARGET,
  },
  pinpointSecondaryBtnText: {
    fontSize: 13,
  },
  locationUpdateBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: MIN_TARGET,
  },
  locationUpdateBtnText: {
    fontSize: 14,
  },
  locationShareBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    margin: 16,
    gap: 8,
    minHeight: MIN_TARGET,
  },
  locationShareTitle: {
    fontSize: 15,
    marginTop: 4,
  },
  locationShareSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  locationError: {
    fontSize: 13,
    padding: 16,
    paddingTop: 0,
  },
  docRowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  docRowTextCol: {
    flex: 1,
    gap: 3,
  },
  docRowTitle: {
    fontSize: 13.5,
  },
  docRowAuthority: {
    fontSize: 11,
  },
  docVerifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  docVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  docVerifiedPillText: {
    fontSize: 10,
  },
  docFileNameText: {
    fontSize: 11,
    flexShrink: 1,
  },
});
