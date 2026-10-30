import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/tokens';
import { useLanguage, AppLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import { StatusChip } from '../../components/StatusChip';
import { useLocation } from '../../context/LocationContext';
import { AreaPickerModal } from '../../components/location/AreaPickerModal';
import { storageService } from '../../services/storageService';
import { MedicineIcon3D } from '../../components/medicine/MedicineIcon3D';
import { demoMedicines } from '../../data/demoData';

const FEATURED_MED_IDS = [
  'med-nlem-001', // Dolo 650
  'med-nlem-009', // Benadryl Cough Formula
  'med-nlem-003', // Meftal-Spas
  'med-nlem-015', // Budecort 200
  'med-nlem-013', // Otrivin Paediatric
  'med-nlem-025', // Betnovate-C Cream
  'med-nlem-019', // Pan-D Capsule
  'med-nlem-091', // Ascoril LS Syrup
  'med-nlem-034', // Refresh Tears Drops
  'med-nlem-031', // Ecosprin 75
  'med-nlem-006', // Combiflam
  'med-nlem-022', // Allegra 120
];
import { useProfile } from '../../store/profile';
import { useMedicineBox } from '../../store/medicineBox';
import { getRestockStatus } from '../../lib/medicineBoxStatus';
import { pharmacyPortalService } from '../../services/pharmacyPortalService';
import { onboardingAssets } from '../../../assets/onboarding';
import { getRecommendations, getHomeGreeting } from '../../lib/recommendations';
import { RecommendationCard } from '../../components/home/RecommendationCard';
import { cleanLocalityName, isInvalidLocality, getRegionForCoordinates } from '../../services/locationService';
import { sendDevTestReminder } from '../../lib/reminders';
import {
  PlusIcon,
  MapPinIcon,
  SearchIcon,
  ClockIcon,
  HospitalIcon,
  SquarePlusIcon,
  PhoneIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  StaffBadgeIcon,
  SettingsIcon,
  CloseIcon,
  ShieldCheckIcon,
  InfoIcon,
  CheckCircleIcon,
  TriangleAlertIcon,
  CircleHelpIcon,
  RefreshIcon,
  GlobeIcon,
  PillCapsuleIcon,
  TrashIcon,
  UserIcon,
} from '../../components/icons/AppIcons';

function formatHeaderArea(raw: string): string {
  if (!raw) return 'Bengaluru';
  const parts = raw.split(',').map((p) => cleanLocalityName(p)).filter(Boolean);
  const valid = parts.find((p) => !isInvalidLocality(p));
  return valid || 'Bengaluru';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette, theme, toggleTheme } = useTheme();
  const { profile, updateProfile, resetProfile } = useProfile();
  const { items: medicineBoxItems, clearAll: clearMedicineBox } = useMedicineBox();
  const {
    userLocation,
    areaName,
    locationSource,
    showAreaPickerModal,
    setShowAreaPickerModal,
  } = useLocation();

  const userRegion = getRegionForCoordinates(userLocation);
  const isOutsideCoverage = userLocation !== null && userRegion === null;

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showLocationInfoModal, setShowLocationInfoModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { language, setLanguage, t, tMedicine, formatNumber } = useLanguage();

  // Recommendations and greeting derived from local profile
  const recommendations = useMemo(() => getRecommendations(profile), [profile]);
  const greetingInfo = useMemo(() => getHomeGreeting(profile), [profile]);

  // Medicine box stats & next upcoming restock alert
  const regularCount = useMemo(
    () => (medicineBoxItems || []).filter((i) => i.space === 'daily' || (!i.space && i.isRegular)).length,
    [medicineBoxItems]
  );
  const essentialCount = useMemo(
    () => (medicineBoxItems || []).filter((i) => i.space === 'essential' || (!i.space && !i.isRegular)).length,
    [medicineBoxItems]
  );

  const nextRestock = useMemo(() => {
    if (!medicineBoxItems || medicineBoxItems.length === 0) return null;
    const withDates = medicineBoxItems
      .filter((i) => i.refillOn)
      .map((i) => ({
        name: i.name,
        isRegular: !!i.isRegular,
        interval: i.restockInterval,
        status: getRestockStatus(i.refillOn),
      }))
      .filter((entry) => entry.status !== null)
      .sort((a, b) => a.status!.daysRemaining - b.status!.daysRemaining);
    return withDates[0] || null;
  }, [medicineBoxItems]);

  // Mark first home visit as seen after initial display
  useEffect(() => {
    if (profile?.onboardingComplete && !profile?.hasSeenFirstHomeVisit) {
      updateProfile({ hasSeenFirstHomeVisit: true });
    }
  }, [profile?.onboardingComplete, profile?.hasSeenFirstHomeVisit, updateProfile]);

  const handleSendTestReminder = async () => {
    const res = await sendDevTestReminder();
    alert(res.message);
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  const heroScale = scrollY.interpolate({
    inputRange: [-120, 0, 160],
    outputRange: [1.06, 1, 0.94],
    extrapolate: 'clamp',
  });
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [1, 0.88],
    extrapolate: 'clamp',
  });

  const featuredMeds = useMemo(() => {
    return FEATURED_MED_IDS.map((id) => demoMedicines.find((m) => m.id === id)).filter(Boolean);
  }, []);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  return (
    <View style={[styles.rootContainer, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <Animated.ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop,
              paddingBottom: 130,
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
        {/* A) HEADER ROW */}
        <View style={styles.headerRow}>
          {/* Logo & Brand Name */}
          <View style={styles.brandGroup}>
            <View
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                  shadowColor: palette.shadow,
                },
              ]}
              accessible={true}
              accessibilityLabel="MedFind Logo"
            >
              <Image
                source={require('../../../assets/images/icon.png')}
                style={styles.appLogoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.brandText, { color: palette.ink }]} numberOfLines={1}>
              MedFind
            </Text>
          </View>

          {/* Right: Location Pill & Settings Button */}
          <View style={styles.headerRightActions}>
            <Pressable
              onPress={() => setShowAreaPickerModal(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                locationSource === 'none' || isOutsideCoverage
                  ? 'No area set. Tap to set your area'
                  : `Current location ${areaName}. Tap to change area.`
              }
              style={({ pressed }) => [
                styles.locationPill,
                {
                  backgroundColor: palette.surface,
                  borderColor:
                    scheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(90, 62, 43, 0.14)',
                  shadowColor: palette.shadow,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <View
                style={[
                  styles.locationPinBadge,
                  {
                    backgroundColor:
                      scheme === 'dark'
                        ? 'rgba(255, 71, 87, 0.2)'
                        : 'rgba(255, 71, 87, 0.12)',
                  },
                ]}
              >
                <MapPinIcon size={14} color="#FF4757" />
              </View>
              <Text
                style={[styles.locationPillText, { color: palette.ink }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {locationSource === 'none' || isOutsideCoverage ? t('set_your_area', 'Set your area') : formatHeaderArea(areaName)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowSettingsModal(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open settings and options"
              style={({ pressed }) => [
                styles.settingsBtn,
                {
                  backgroundColor: palette.surface,
                  borderColor:
                    scheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'rgba(90, 62, 43, 0.14)',
                  shadowColor: palette.shadow,
                  opacity: pressed ? 0.85 : 1.0,
                },
              ]}
            >
              <SettingsIcon size={19} color={palette.ink} />
            </Pressable>
          </View>
        </View>

        {/* SUBTLE DEMO NOTICE */}
        <View style={styles.homeDemoBadgeRow}>
          <View
            style={[
              styles.homeDemoBadge,
              {
                backgroundColor: palette.surface2,
                borderColor: palette.line,
              },
            ]}
          >
            <Text
              style={[
                styles.homeDemoBadgeText,
                { color: palette.ink2, fontFamily: fonts.sansMedium },
              ]}
            >
              {t('demo_sample_data_label', 'Demo app: sample data')}
            </Text>
          </View>
        </View>

        {/* BUDDY GREETING BANNER - Tappable to open Profile */}
        <Pressable
          onPress={() => router.push('/profile')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Profile and device settings. Tap to view or edit profile"
          style={[
            styles.greetingCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={styles.greetingLeftRow}>
            {!greetingInfo.isGuest && (
              <Image
                source={onboardingAssets.mascotWave}
                style={styles.greetingMascot}
                resizeMode="contain"
                accessibilityLabel={`${greetingInfo.caption || 'Mascot'} waving`}
              />
            )}
            <View style={styles.greetingTextGroup}>
              {Boolean(greetingInfo.caption) && (
                <Text
                  style={[
                    styles.greetingCaption,
                    { color: palette.accent || theme.primaryAccentText },
                  ]}
                >
                  {greetingInfo.caption}
                </Text>
              )}
              <Text
                style={[
                  styles.greetingHeadline,
                  { color: palette.ink, fontFamily: typography.fontFamilyBold },
                ]}
              >
                {greetingInfo.headline === 'Welcome'
                  ? t('welcome', 'Welcome')
                  : greetingInfo.headline.startsWith('Hi ')
                  ? `${t('hi_prefix', 'Hi')} ${greetingInfo.headline.slice(3)}`
                  : greetingInfo.headline}
              </Text>
            </View>
          </View>
          {!greetingInfo.isGuest && greetingInfo.isFirstVisit && greetingInfo.subline ? (
            <Text
              style={[
                styles.greetingSubline,
                { color: palette.ink2, fontFamily: typography.fontFamilyRegular },
              ]}
            >
              {t(greetingInfo.subline, greetingInfo.subline)}
            </Text>
          ) : null}
        </Pressable>

        {/* UNSUPPORTED REGION NEUTRAL BANNER */}
        {isOutsideCoverage && (
          <View
            style={[
              styles.coverageBanner,
              {
                backgroundColor: palette.surface2,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.coverageTextGroup}>
              <View style={styles.coverageTitleRow}>
                <MapPinIcon size={16} color={palette.ink2} />
                <Text style={[styles.coverageBannerTitle, { color: palette.ink }]}>
                  {t('unsupported_region_title', 'No pharmacy data for this area yet')}
                </Text>
              </View>
              <Text style={[styles.coverageBannerSub, { color: palette.ink2 }]}>
                {t(
                  'unsupported_region_notice',
                  "MedFind doesn't have pharmacy data for this area yet."
                )}
              </Text>
            </View>
          </View>
        )}

        {/* B) HERO with Dimensional Scroll Parallax */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: heroOpacity,
              transform: [{ scale: heroScale }, { translateY: heroTranslateY }],
            },
          ]}
        >
          <View style={styles.headlineContainer}>
            <Text style={[styles.headlineLine1, { color: palette.ink }]}>
              {t('hero_headline_1', 'Find your medicine')}
            </Text>
            <View style={styles.headlineLine2Row}>
              <View style={styles.highlightWrapper}>
                <View
                  style={[
                    styles.highlightUnderline,
                    { backgroundColor: palette.highlight },
                  ]}
                />
                <Text style={[styles.headlineHighlightText, { color: palette.ink }]}>
                  {t('hero_highlight', 'before')}
                </Text>
              </View>
              <Text style={[styles.headlineLine2Rest, { color: palette.ink }]}>
                {' '}{t('hero_headline_2', 'you visit.')}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroParagraph, { color: palette.ink2 }]}>
            {t('hero_subtext', 'See which nearby pharmacy last confirmed it, and exactly how long ago.')}
          </Text>
        </Animated.View>

        {/* C) SEARCH LINK */}
        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('search_medicine_name', 'Search medicine name')}
          style={({ pressed }) => [
            styles.searchLinkCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
              shadowOpacity: scheme === 'light' ? 0.14 : 0.45,
              opacity: pressed ? 0.9 : 1.0,
            },
          ]}
        >
          <SearchIcon size={22} color={palette.ink} />
          <Text style={[styles.searchPlaceholder, { color: palette.ink2 }]}>
            {t('search_medicine_name', 'Search medicine name')}
          </Text>
        </Pressable>

        {/* ESSENTIAL MEDICINES 3D CATALOG SHELF */}
        <View style={styles.featuredSection}>
          <View style={styles.featuredHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featuredTitle, { color: palette.ink, fontFamily: typography.fontFamilyBold }]}>
                {t('featured_meds_title', '3D Medicine Showcase')}
              </Text>
              <Text style={[styles.featuredSub, { color: palette.ink2 }]}>
                {t('featured_meds_sub', 'HD 3D interactive renders, authentic expiry & verified stock')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/search')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View entire medicine database"
              style={[styles.viewAllPill, { backgroundColor: palette.surface2, borderColor: palette.line }]}
            >
              <Text style={[styles.viewAllText, { color: palette.accent }]}>
                {t('view_all', 'View all')} →
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
          >
            {featuredMeds.map((med) => {
              if (!med) return null;
              return (
                <Pressable
                  key={med.id}
                  onPress={() => router.push(`/medicine/${med.id}` as any)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${med.brand_name}, ${med.dosage_form || ''}, Expiry ${med.expiry_date || 'Valid'}. Tap for details.`}
                  style={({ pressed }) => [
                    styles.featuredCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                      shadowColor: med.primary_color || palette.accent,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                >
                  {/* Glowing 3D Pedestal */}
                  <View
                    style={[
                      styles.featuredPedestal,
                      {
                        backgroundColor:
                          scheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor:
                          scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <MedicineIcon3D
                      type={med.image_3d_type || 'tablet'}
                      color={med.primary_color}
                      size={54}
                      glow={true}
                      float={true}
                    />
                  </View>

                  {/* Expiry Badge */}
                  {med.expiry_date && (
                    <View
                      style={[
                        styles.featuredExpiryBadge,
                        { backgroundColor: palette.okTint, borderColor: palette.okLine },
                      ]}
                    >
                      <Text style={[styles.featuredExpiryText, { color: palette.okInk }]}>
                        ✓ Exp: {formatNumber(med.expiry_date)}
                      </Text>
                    </View>
                  )}

                  {/* Title & Brand */}
                  <Text style={[styles.featuredMedName, { color: palette.ink }]} numberOfLines={1}>
                    {tMedicine(med.brand_name)}
                  </Text>
                  <Text style={[styles.featuredGeneric, { color: palette.ink2 }]}>
                    {med.dosage_form || 'Form'} • {med.strength || ''}
                  </Text>

                  {/* MRP & Batch */}
                  <View style={styles.featuredMetaRow}>
                    {med.mrp ? (
                      <Text style={[styles.featuredMrp, { color: palette.ink }]}>
                        {formatNumber(med.mrp)}
                      </Text>
                    ) : null}
                    <View style={[styles.featuredBatchPill, { backgroundColor: palette.surface2 }]}>
                      <Text style={[styles.featuredBatchText, { color: palette.ink2 }]}>
                        {med.batch_no || 'BATCH OK'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* MY MEDICINE BOX PREVIEW & RESTOCK TRACKER */}
        <View style={styles.medicineBoxSection}>
          <View style={styles.medicineBoxHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.medicineBoxTitle, { color: palette.ink, fontFamily: typography.fontFamilyBold }]}>
                  {t('my_medicine_box', 'My Medicine Box')}
                </Text>
                {medicineBoxItems.length > 0 && (
                  <View style={[styles.boxCountBadge, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                    <Text style={[styles.boxCountBadgeText, { color: palette.accent }]}>
                      {medicineBoxItems.length}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.medicineBoxSub, { color: palette.ink2 }]}>
                {t('medicine_box_home_sub', 'Track regular supplies, refill reminders & expiry dates')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/medicine-box')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open Medicine Box"
              style={[styles.viewAllPill, { backgroundColor: palette.surface2, borderColor: palette.line }]}
            >
              <Text style={[styles.viewAllText, { color: palette.accent }]}>
                {t('open_box', 'Open')} →
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/medicine-box')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open Medicine Box card"
            style={({ pressed }) => [
              styles.medicineBoxCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
                opacity: pressed ? 0.95 : 1,
              },
            ]}
          >
            <View style={styles.medicineBoxCardInner}>
              <View
                style={[
                  styles.medicineBoxIconWrap,
                  {
                    backgroundColor:
                      scheme === 'light'
                        ? 'rgba(135, 169, 107, 0.18)'
                        : 'rgba(135, 169, 107, 0.28)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(135, 169, 107, 0.35)'
                        : 'rgba(135, 169, 107, 0.45)',
                  },
                ]}
              >
                <PillCapsuleIcon
                  size={26}
                  color={scheme === 'light' ? '#4A7036' : '#87A96B'}
                />
              </View>

              <View style={styles.medicineBoxCardBody}>
                {medicineBoxItems.length === 0 ? (
                  <>
                    <Text style={[styles.medicineBoxCardTitle, { color: palette.ink }]}>
                      Your Medicine Box is empty
                    </Text>
                    <Text style={[styles.medicineBoxCardDesc, { color: palette.ink2 }]}>
                      Add your daily or regular meds (weekly, monthly, or 2 months) to get automatic restock reminders.
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.boxTagRow}>
                      <View style={[styles.regularCountBadge, { backgroundColor: scheme === 'light' ? '#EEF2FF' : '#312E81' }]}>
                        <Text style={[styles.regularCountBadgeText, { color: scheme === 'light' ? '#4338CA' : '#C7D2FE' }]}>
                          💊 {regularCount} Daily {regularCount === 1 ? 'Med' : 'Meds'}
                        </Text>
                      </View>
                      <View style={[styles.regularCountBadge, { backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F' }]}>
                        <Text style={[styles.regularCountBadgeText, { color: scheme === 'light' ? '#92400E' : '#FDE68A' }]}>
                          🧰 {essentialCount} Essential
                        </Text>
                      </View>
                      {nextRestock && (
                        <View
                          style={[
                            styles.restockDueTag,
                            {
                              backgroundColor: nextRestock.status!.isOverdue
                                ? palette.amberTint
                                : palette.okTint,
                              borderColor: nextRestock.status!.isOverdue
                                ? palette.amberLine
                                : palette.okLine,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.restockDueTagText,
                              {
                                color: nextRestock.status!.isOverdue
                                  ? palette.amberInk
                                  : palette.okInk,
                              },
                            ]}
                          >
                            🔔 {nextRestock.status!.label}: {nextRestock.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.medicineBoxSummaryLine, { color: palette.ink2 }]}>
                      {medicineBoxItems.length} {medicineBoxItems.length === 1 ? 'medicine' : 'medicines'} tracked on this device
                    </Text>
                  </>
                )}
              </View>

              <ChevronRightIcon size={18} color={palette.ink2} />
            </View>

            <View style={[styles.medicineBoxActionRow, { borderTopColor: palette.line }]}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({ pathname: '/medicine-box', params: { action: 'add', space: 'daily' } } as any);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add daily health medicine"
                style={[styles.boxActionBtn, { backgroundColor: palette.surface2, borderColor: palette.line }]}
              >
                <PlusIcon size={14} color={palette.accent} />
                <Text style={[styles.boxActionBtnText, { color: palette.accent }]}>
                  + Add Daily
                </Text>
              </Pressable>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({ pathname: '/medicine-box', params: { action: 'add', space: 'essential' } } as any);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add essential medicine"
                style={[styles.boxActionBtn, { backgroundColor: palette.surface2, borderColor: palette.line }]}
              >
                <PlusIcon size={14} color={scheme === 'light' ? '#B45309' : '#FDE68A'} />
                <Text style={[styles.boxActionBtnText, { color: scheme === 'light' ? '#B45309' : '#FDE68A' }]}>
                  + Add Essential
                </Text>
              </Pressable>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/(tabs)/search');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Search catalog medicines"
                style={[styles.boxActionBtn, { backgroundColor: palette.surface2, borderColor: palette.line }]}
              >
                <SearchIcon size={14} color={palette.ink} />
                <Text style={[styles.boxActionBtnText, { color: palette.ink }]}>
                  Search
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>

        {/* D) "FOR YOU" SECTION */}
        {recommendations.length > 0 && (
          <View style={styles.forYouSection}>
            <View style={styles.forYouHeader}>
              <Text
                style={[
                  styles.forYouTitle,
                  { color: palette.ink, fontFamily: typography.fontFamilyBold },
                ]}
              >
                {t('for_you', 'For you')}
              </Text>
              <Text style={[styles.forYouSubtitle, { color: palette.ink2 }]}>
                {t('for_you_subtitle', 'Tailored based on your onboarding preferences')}
              </Text>
            </View>
            {recommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                item={rec}
                index={index}
                theme={theme}
                onPress={(route) => {
                  if (route === 'restart-onboarding') {
                    updateProfile({
                      onboardingSkippedAt: null,
                      dismissedSetupCard: false,
                    });
                    return;
                  }
                  router.push(route as any);
                }}
                onDismiss={(id) => {
                  if (id === 'rec-finish-setup') {
                    updateProfile({ dismissedSetupCard: true });
                  }
                }}
              />
            ))}
          </View>
        )}


        {/* E) CARE NEARBY CARD */}
        <Pressable
          onPress={() => router.push('/(tabs)/care')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Care nearby: Hospitals, clinics and ambulance contacts"
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
              shadowOpacity: scheme === 'light' ? 0.12 : 0.4,
              opacity: pressed ? 0.9 : 1.0,
            },
          ]}
        >
          <View
            style={[
              styles.actionTileBox,
              { backgroundColor: palette.okTint },
            ]}
          >
            <SquarePlusIcon size={24} color={palette.okInk} />
          </View>

          <View style={styles.actionCardMiddle}>
            <Text style={[styles.actionCardTitle, { color: palette.ink }]}>
              {t('care_nearby_title', 'Care nearby')}
            </Text>
            <Text style={[styles.actionCardSubtitle, { color: palette.ink2 }]}>
              {t('care_nearby_subtitle', 'Hospitals, clinics and ambulance contacts')}
            </Text>
          </View>

          <ChevronRightIcon size={20} color={palette.ink2} />
        </Pressable>

        {/* F) EMERGENCY HELP CARD */}
        <Pressable
          onPress={() => router.push('/(tabs)/emergency')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${t('emergency_help_title', 'Emergency help')}: ${t('emergency_help_subtitle', 'Call 112 or view emergency contacts')}`}
          style={({ pressed }) => [
            styles.emergencyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.redLine,
              opacity: pressed ? 0.9 : 1.0,
            },
          ]}
        >
          <View
            style={[
              styles.emergencyCircleBox,
              { backgroundColor: palette.red },
            ]}
          >
            <PhoneIcon size={22} color="#FFFFFF" />
          </View>

          <View style={styles.actionCardMiddle}>
            <Text style={[styles.actionCardTitle, { color: palette.ink }]}>
              {t('emergency_help_title', 'Emergency help')}
            </Text>
            <Text style={[styles.actionCardSubtitle, { color: palette.ink2 }]}>
              {t('emergency_help_subtitle', 'Call 112 or view emergency contacts')}
            </Text>
          </View>

          <ChevronRightIcon size={20} color={palette.ink2} />
        </Pressable>

        {/* G) VERIFIED FRESHNESS SYSTEM (SERIOUS MAKEOVER) */}
        <View
          style={[
            styles.freshnessLegendContainer,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          {/* Header with verified badge and titles */}
          <View style={styles.legendHeader}>
            <View style={styles.legendBadgeRow}>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: palette.okTint,
                    borderColor: palette.okLine,
                  },
                ]}
              >
                <ShieldCheckIcon size={13} color={palette.okInk} />
                <Text style={[styles.verifiedBadgeText, { color: palette.okInk }]}>
                  {t('stock_status_guide', 'STOCK STATUS GUIDE')}
                </Text>
              </View>
            </View>

            <Text style={[styles.legendMainTitle, { color: palette.ink }]}>
              {t('how_to_check_stock', 'How to check medicine availability')}
            </Text>
            <Text style={[styles.legendSubTitle, { color: palette.ink2 }]}>
              {t('check_stock_sub', 'Check when the pharmacy last confirmed their stock so you can visit directly or call first.')}
            </Text>
          </View>

          {/* Visual Certainty Progress Spectrum */}
          <View style={styles.spectrumContainer}>
            <View style={styles.spectrumTrack}>
              <View style={[styles.spectrumSegment, { backgroundColor: palette.accent, flex: 1.2 }]} />
              <View style={[styles.spectrumSegment, { backgroundColor: palette.amber, flex: 1.0 }]} />
              <View style={[styles.spectrumSegment, { backgroundColor: palette.stale, flex: 0.9 }]} />
              <View style={[styles.spectrumSegment, { backgroundColor: palette.naInk, flex: 0.8 }]} />
            </View>
            <View style={styles.spectrumLabelsRow}>
              <Text style={[styles.spectrumLabelStart, { color: palette.okInk }]}>
                {t('just_updated_ready', 'Just updated • Ready to visit')}
              </Text>
              <Text style={[styles.spectrumLabelEnd, { color: palette.ink2 }]}>
                {t('call_store_first', 'Call store first')}
              </Text>
            </View>
          </View>

          {/* 4 Rich Tier Cards */}
          <View style={styles.tiersList}>
            {/* Tier 1: Recent */}
            <View
              style={[
                styles.tierCard,
                {
                  backgroundColor: palette.okTint,
                  borderColor: palette.okLine,
                },
              ]}
            >
              <View style={styles.tierTopRow}>
                <View style={styles.tierBadgeGroup}>
                  <CheckCircleIcon size={16} color={palette.okInk} />
                  <Text style={[styles.tierTitle, { color: palette.okInk }]}>
                    {t('tier_recent_title', 'Updated Just Now')}
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.okInk} />
                  <Text style={[styles.tierTimeText, { color: palette.okInk }]}>
                    {t('tier_recent_time', 'Within 30 mins')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.okInk }]}>
                {t('tier_recent_desc', 'Directly confirmed by the pharmacy staff. You can visit the store with full confidence.')}
              </Text>
            </View>

            {/* Tier 2: Aging */}
            <View
              style={[
                styles.tierCard,
                {
                  backgroundColor: palette.amberTint,
                  borderColor: palette.amberLine,
                },
              ]}
            >
              <View style={styles.tierTopRow}>
                <View style={styles.tierBadgeGroup}>
                  <ClockIcon size={16} color={palette.amberInk} />
                  <Text style={[styles.tierTitle, { color: palette.amberInk }]}>
                    {t('tier_aging_title', 'Updated Earlier Today')}
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.amberInk} />
                  <Text style={[styles.tierTimeText, { color: palette.amberInk }]}>
                    {t('tier_aging_time', '30 min – 2 hrs')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.amberInk }]}>
                {t('tier_aging_desc', 'Confirmed earlier today. Stock is likely available, but fast-moving items can run out.')}
              </Text>
            </View>

            {/* Tier 3: Stale */}
            <View
              style={[
                styles.tierCard,
                {
                  backgroundColor: palette.staleTint,
                  borderColor: palette.staleLine,
                },
              ]}
            >
              <View style={styles.tierTopRow}>
                <View style={styles.tierBadgeGroup}>
                  <TriangleAlertIcon size={16} color={palette.staleInk} />
                  <Text style={[styles.tierTitle, { color: palette.staleInk }]}>
                    {t('tier_stale_title', 'Updated Earlier')}
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.staleInk} />
                  <Text style={[styles.tierTimeText, { color: palette.staleInk }]}>
                    {t('tier_stale_time', 'Over 2 hrs ago')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.staleInk }]}>
                {t('tier_stale_desc', 'Update was a few hours ago. We recommend tapping Call to check before heading out.')}
              </Text>
            </View>

            {/* Tier 4: Unknown */}
            <View
              style={[
                styles.tierCard,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <View style={styles.tierTopRow}>
                <View style={styles.tierBadgeGroup}>
                  <CircleHelpIcon size={16} color={palette.naInk} />
                  <Text style={[styles.tierTitle, { color: palette.ink }]}>
                    {t('tier_unreported_title', 'Call Store Directly')}
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <Text style={[styles.tierTimeText, { color: palette.ink2 }]}>
                    {t('tier_unreported_time', 'No report today')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.ink2 }]}>
                {t('tier_unreported_desc', 'Pharmacy is open, but has not sent a stock update today. Tap Call to check with the pharmacist.')}
              </Text>
            </View>
          </View>

          {/* Trust Footnote */}
          <View style={styles.legendTrustFooter}>
            <StaffBadgeIcon size={16} color={palette.ink2} />
            <Text style={[styles.legendTrustText, { color: palette.ink2 }]}>
              {t('genuine_updates_notice', 'Genuine pharmacy updates only. MedFind never guesses or invents stock availability.')}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
      </AnimatedScreenTransition>

      {/* Area Picker Modal */}
      <AreaPickerModal
        visible={showAreaPickerModal}
        onClose={() => setShowAreaPickerModal(false)}
      />

      {/* Settings & Preferences Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSettingsModal(false)}
            accessibilityLabel="Close settings modal"
          />
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsModalTitleRow}>
                <SettingsIcon size={20} color={palette.ink} />
                <Text style={[styles.settingsModalTitle, { color: palette.ink }]}>
                  {t('settings', 'Settings')}
                </Text>
                <View
                  style={[
                    styles.demoSampleBadge,
                    { backgroundColor: palette.surface2, borderColor: palette.line },
                  ]}
                >
                  <Text
                    style={[
                      styles.demoSampleBadgeText,
                      { color: palette.ink2, fontFamily: fonts.sansMedium },
                    ]}
                  >
                    {t('demo_sample_data_label', 'Demo app: sample data')}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                style={[styles.closeModalBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{ flexShrink: 1, width: '100%' }}
              contentContainerStyle={styles.settingsScrollContent}
            >
              {/* Top Profile Card: Most comfortable, accessible 1-tap entry */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  router.push('/profile');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Profile and Health Preferences: ${profile.displayName || (greetingInfo.isGuest ? 'Guest User' : 'Friend')}. Tap to view or edit.`}
                style={({ pressed }) => [
                  styles.settingsProfileBanner,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    opacity: pressed ? 0.9 : 1.0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.settingsProfileAvatarBox,
                    {
                      backgroundColor: theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {!greetingInfo.isGuest ? (
                    <Image
                      source={onboardingAssets.mascotWave}
                      style={styles.settingsProfileMascot}
                      resizeMode="contain"
                    />
                  ) : (
                    <UserIcon size={20} color={palette.ink} />
                  )}
                </View>

                <View style={styles.settingsProfileTextGroup}>
                  <View style={styles.settingsProfileNameRow}>
                    <Text style={[styles.settingsProfileName, { color: palette.ink }]} numberOfLines={1}>
                      {profile.displayName || (greetingInfo.isGuest ? 'Guest User' : 'Friend')}
                    </Text>
                    {profile.buddy && (
                      <View
                        style={[
                          styles.settingsBuddyBadge,
                          {
                            backgroundColor: theme.badgeBackground,
                            borderColor: theme.badgeBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.settingsBuddyBadgeText,
                            { color: palette.accent || theme.primaryAccentText },
                          ]}
                        >
                          {profile.buddy.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.settingsProfileSubtitle, { color: palette.ink2 }]} numberOfLines={1}>
                    {profile.buddy
                      ? `${profile.buddy.archetype} • ${t('tap_to_view_profile', 'Tap to view profile')}`
                      : t('personal_health_prefs', 'Personal health preferences & answers')}
                  </Text>
                </View>

                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Section 1: Healthcare & Tools (Most Used) */}
              <Text
                style={[
                  styles.settingsSectionHeader,
                  { color: palette.ink2, marginTop: 10 },
                ]}
              >
                {t('healthcare_tools', 'Healthcare & Tools')}
              </Text>

              {/* Item: My Medicine Box */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  router.push('/medicine-box');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="My Medicine Box. Track saved medicines, expiry and refill dates"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(135, 169, 107, 0.16)'
                          : 'rgba(135, 169, 107, 0.25)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(135, 169, 107, 0.35)'
                          : 'rgba(135, 169, 107, 0.45)',
                    },
                  ]}
                >
                  <PillCapsuleIcon
                    size={18}
                    color={scheme === 'light' ? '#4A7036' : '#87A96B'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('my_medicine_box', 'My Medicine Box')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('medicine_box_desc', 'Track saved medicines, expiry & refill dates')}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Item: Emergency Directory */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  router.push('/emergency-directory');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Worldwide Emergency Directory. 87 countries with official numbers and calling codes"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(37, 99, 235, 0.12)'
                          : 'rgba(56, 189, 248, 0.18)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(37, 99, 235, 0.25)'
                          : 'rgba(56, 189, 248, 0.35)',
                    },
                  ]}
                >
                  <GlobeIcon
                    size={18}
                    color={scheme === 'light' ? '#1D4ED8' : '#38BDF8'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('emergency_directory_title', 'Emergency Directory')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('emergency_directory_subtitle', '87 countries • Calling codes & verified helplines')}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Section 2: Preferences (Comfort Controls) */}
              <Text
                style={[
                  styles.settingsSectionHeader,
                  { color: palette.ink2 },
                ]}
              >
                {t('preferences', 'Preferences')}
              </Text>

              {/* Item: Theme Switcher */}
              <Pressable
                onPress={() => {
                  toggleTheme();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Toggle appearance mode. Current theme is ${scheme}`}
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light' ? '#FEF3C7' : 'rgba(168, 85, 247, 0.2)',
                      borderColor:
                        scheme === 'light' ? '#FDE68A' : 'rgba(168, 85, 247, 0.4)',
                    },
                  ]}
                >
                  {scheme === 'light' ? (
                    <MoonIcon size={18} color="#D97706" />
                  ) : (
                    <SunIcon size={18} color="#FCD34D" />
                  )}
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('appearance', 'Appearance')}: {scheme === 'light' ? t('light_theme', 'Light theme') : t('dark_theme', 'Dark theme')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {scheme === 'light' ? t('switch_to_dark', 'Tap to switch to dark theme') : t('switch_to_light', 'Tap to switch to light theme')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.themeToggleBadge,
                    { backgroundColor: palette.surface2, borderColor: palette.line },
                  ]}
                >
                  <Text style={[styles.themeToggleBadgeText, { color: palette.ink }]}>
                    {t('switch_theme', 'Switch')}
                  </Text>
                </View>
              </Pressable>

              {/* Item: App Language */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowLanguageModal(true);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Select app language. Currently ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}`}
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light' ? 'rgba(59, 130, 246, 0.16)' : 'rgba(96, 165, 250, 0.2)',
                      borderColor:
                        scheme === 'light' ? 'rgba(59, 130, 246, 0.35)' : 'rgba(96, 165, 250, 0.4)',
                    },
                  ]}
                >
                  <GlobeIcon
                    size={18}
                    color={scheme === 'light' ? '#2563EB' : '#60A5FA'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('language', 'App Language')}: {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    English • ಕನ್ನಡ • हिंदी
                  </Text>
                </View>
                <View
                  style={[
                    styles.themeToggleBadge,
                    { backgroundColor: palette.surface2, borderColor: palette.line },
                  ]}
                >
                  <Text style={[styles.themeToggleBadgeText, { color: palette.ink }]}>
                    {t('change_language', 'Change')}
                  </Text>
                </View>
              </Pressable>

              {/* Section 3: Services & Information */}
              <Text
                style={[
                  styles.settingsSectionHeader,
                  { color: palette.ink2 },
                ]}
              >
                {t('services_info', 'Services & Information')}
              </Text>

              {/* Item: How Location Works */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowLocationInfoModal(true);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="How Location Works"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(14, 165, 233, 0.16)'
                          : 'rgba(56, 189, 248, 0.2)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(14, 165, 233, 0.35)'
                          : 'rgba(56, 189, 248, 0.4)',
                    },
                  ]}
                >
                  <MapPinIcon
                    size={18}
                    color={scheme === 'light' ? '#0284C7' : '#38BDF8'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('how_location_works', 'How Location Works')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('how_location_subtitle', 'GPS usage, distance calculation & privacy')}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Item: Sourcing Policy */}
              <Pressable
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowPolicyModal(true);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Verified Sourcing Policy"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(34, 197, 94, 0.16)'
                          : 'rgba(74, 222, 128, 0.2)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(34, 197, 94, 0.35)'
                          : 'rgba(74, 222, 128, 0.4)',
                    },
                  ]}
                >
                  <ShieldCheckIcon
                    size={18}
                    color={scheme === 'light' ? '#16A34A' : '#4ADE80'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('quality_policy', 'Quality & Safety Policy')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('quality_policy_subtitle', 'Official records & verified stores')}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Item: Change role */}
              <Pressable
                testID="settings-change-role-btn"
                onPress={() => {
                  setShowSettingsModal(false);
                  Alert.alert(
                    t('change_role', 'Change role?'),
                    t('change_role_confirm_msg', 'This takes you back to the start.'),
                    [
                      { text: t('cancel', 'Cancel'), style: 'cancel' },
                      {
                        text: t('change_role', 'Change role'),
                        style: 'destructive',
                        onPress: async () => {
                          await updateProfile({ role: null });
                          router.replace('/');
                        },
                      },
                    ]
                  );
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Change role"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(13, 148, 136, 0.14)'
                          : 'rgba(45, 212, 191, 0.18)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(13, 148, 136, 0.3)'
                          : 'rgba(45, 212, 191, 0.35)',
                    },
                  ]}
                >
                  <RefreshIcon
                    size={18}
                    color={scheme === 'light' ? '#0D9488' : '#2DD4BF'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                    {t('change_role', 'Change role')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('change_role_sub', 'Switch between customer and pharmacy staff')}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={palette.ink2} />
              </Pressable>

              {/* Section 4: Data Management (Bottom for safety) */}
              <Text
                style={[
                  styles.settingsSectionHeader,
                  { color: palette.ink2 },
                ]}
              >
                {t('data_management', 'Data Management')}
              </Text>

              {/* User-accessible: Reset my answers */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    t('reset_answers_confirm_title', 'Reset answers?'),
                    t('reset_answers_confirm_msg', 'This will reset your onboarding answers so you can retake the questions and update your buddy and recommendations.'),
                    [
                      { text: t('cancel', 'Cancel'), style: 'cancel' },
                      {
                        text: t('reset', 'Reset'),
                        style: 'destructive',
                        onPress: async () => {
                          setShowSettingsModal(false);
                          await resetProfile();
                        },
                      },
                    ]
                  );
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset my answers. Retake questions to update your buddy and recommendations"
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(248, 113, 113, 0.2)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(248, 113, 113, 0.4)',
                    },
                  ]}
                >
                  <RefreshIcon
                    size={18}
                    color={scheme === 'light' ? '#DC2626' : '#F87171'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text
                    style={[
                      styles.settingsItemTitle,
                      { color: scheme === 'light' ? '#DC2626' : '#F87171' },
                    ]}
                  >
                    {t('reset_answers', 'Reset my answers')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('reset_answers_sub', 'Retake questions to update your buddy and recommendations')}
                  </Text>
                </View>
              </Pressable>

              {/* User-accessible: Sign Out / Switch Role */}
              <Pressable
                onPress={async () => {
                  setShowSettingsModal(false);
                  try {
                    await pharmacyPortalService.clearStorePartnerAuth();
                  } catch {}
                  await updateProfile({ role: null });
                  router.replace('/');
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sign out or switch role. Return to start screen to choose Buyer, Pharmacy, Clinic, or Hospital."
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(13, 148, 136, 0.14)'
                          : 'rgba(45, 212, 191, 0.18)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(13, 148, 136, 0.3)'
                          : 'rgba(45, 212, 191, 0.35)',
                    },
                  ]}
                >
                  <RefreshIcon
                    size={18}
                    color={scheme === 'light' ? '#0D9488' : '#2DD4BF'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text
                    style={[
                      styles.settingsItemTitle,
                      { color: scheme === 'light' ? '#0D9488' : '#2DD4BF' },
                    ]}
                  >
                    {t('change_role_or_signout', 'Sign Out / Switch Role')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('change_role_or_signout_sub', 'Return to start screen to choose Buyer, Pharmacy, Clinic, or Hospital')}
                  </Text>
                </View>
              </Pressable>

              {/* User-accessible: Delete all medicine box data */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    t('delete_box_confirm_title', 'Delete all medicine box data?'),
                    t('delete_box_confirm_msg', 'This will remove all saved medicines and cancel any scheduled reminders. This action cannot be undone.'),
                    [
                      { text: t('cancel', 'Cancel'), style: 'cancel' },
                      {
                        text: t('delete_all', 'Delete all'),
                        style: 'destructive',
                        onPress: async () => {
                          await clearMedicineBox();
                          setShowSettingsModal(false);
                        },
                      },
                    ]
                  );
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete all medicine box data. Remove all saved medicines and cancel scheduled reminders."
                style={[
                  styles.settingsRowItem,
                  { borderBottomColor: palette.line },
                ]}
              >
                <View
                  style={[
                    styles.settingsIconBox,
                    {
                      backgroundColor:
                        scheme === 'light'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(248, 113, 113, 0.2)',
                      borderColor:
                        scheme === 'light'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(248, 113, 113, 0.4)',
                    },
                  ]}
                >
                  <TrashIcon
                    size={16}
                    color={scheme === 'light' ? '#DC2626' : '#F87171'}
                  />
                </View>
                <View style={styles.settingsItemInfo}>
                  <Text
                    style={[
                      styles.settingsItemTitle,
                      { color: scheme === 'light' ? '#DC2626' : '#F87171' },
                    ]}
                  >
                    {t('delete_medicine_box', 'Delete all medicine box data')}
                  </Text>
                  <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                    {t('delete_medicine_box_sub', 'Remove all saved medicines and cancel scheduled reminders')}
                  </Text>
                </View>
              </Pressable>

              {/* Dev Only: Proof of Local Notifications */}
              {__DEV__ && (
                <>
                  <Text
                    style={[
                      styles.settingsSectionHeader,
                      { color: palette.ink2 },
                    ]}
                  >
                    Developer Tools
                  </Text>
                  <Pressable
                    onPress={handleSendTestReminder}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Send test reminder in 10 seconds (Dev proof)"
                    style={[
                      styles.settingsRowItem,
                      { borderBottomColor: palette.line },
                    ]}
                  >
                    <View
                      style={[
                        styles.settingsIconBox,
                        {
                          backgroundColor:
                            scheme === 'light'
                              ? 'rgba(135, 169, 107, 0.15)'
                              : 'rgba(135, 169, 107, 0.25)',
                          borderColor:
                            scheme === 'light'
                              ? 'rgba(135, 169, 107, 0.4)'
                              : 'rgba(135, 169, 107, 0.5)',
                        },
                      ]}
                    >
                      <ClockIcon
                        size={17}
                        color={scheme === 'light' ? '#2B4A1D' : '#87A96B'}
                      />
                    </View>
                    <View style={styles.settingsItemInfo}>
                      <Text
                        style={[
                          styles.settingsItemTitle,
                          { color: scheme === 'light' ? '#2B4A1D' : '#87A96B' },
                        ]}
                      >
                        Send test reminder in 10 seconds
                      </Text>
                      <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                        Requests permission and schedules a local notification
                      </Text>
                    </View>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
        >
          <Pressable
            style={[
              styles.settingsCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsModalTitleRow}>
                <GlobeIcon size={20} color={palette.ink} />
                <Text style={[styles.settingsModalTitle, { color: palette.ink }]}>
                  {t('language', 'App Language')}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowLanguageModal(false)}
                hitSlop={8}
                style={[styles.closeModalBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={async () => {
                    await setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${lang.nativeName} (${lang.name})`}
                  style={[
                    styles.settingsRowItem,
                    {
                      borderBottomColor: palette.line,
                      backgroundColor: isSelected ? palette.surface2 : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.settingsItemInfo}>
                    <Text
                      style={[
                        styles.settingsItemTitle,
                        { color: palette.ink, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                      {lang.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ color: palette.okInk, fontWeight: '700', fontSize: 18 }}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sourcing & Clinical Policy Modal */}
      <Modal
        visible={showPolicyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPolicyModal(false)}
        >
          <Pressable
            style={[
              styles.policyCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsModalTitleRow}>
                <ShieldCheckIcon size={20} color={palette.okInk} />
                <Text style={[styles.settingsModalTitle, { color: palette.ink }]}>
                  Verified Sourcing Policy
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPolicyModal(false)}
                hitSlop={8}
                style={[styles.closeModalBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            <ScrollView style={styles.policyScrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                1. No Invented Stock
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                MedFind never assumes or fabricates pharmacy stock levels. Availability is only marked as "Available" or "Low stock" when directly reported by a participating pharmacy operator. Unreported medicines remain honestly labeled as "Unknown / Unreported".
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                2. Official Government Directory
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                Emergency and healthcare directory entries are verified against official government sources: National ERSS 112, Karnataka Arogya Kavacha 108, BMCRI hospitals (Victoria & Bowring), and BBMP Public Health Centres.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                3. Approved Essential Medicines
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                The medicine list follows the official essential medicines guide. MedFind helps you locate nearby stock and connect directly with licensed pharmacists.
              </Text>
            </ScrollView>

            <Pressable
              onPress={() => setShowPolicyModal(false)}
              style={[
                styles.policyDismissBtn,
                { backgroundColor: palette.btn, borderColor: palette.btnBorder },
              ]}
            >
              <Text style={[styles.policyDismissBtnText, { color: palette.btnInk }]}>
                Understood
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Location & Privacy Info Modal */}
      <Modal
        visible={showLocationInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLocationInfoModal(false)}
            accessibilityLabel="Close location info modal"
          />
          <View
            style={[
              styles.policyCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsModalTitleRow}>
                <MapPinIcon size={20} color={scheme === 'light' ? '#0284C7' : '#38BDF8'} />
                <Text style={[styles.settingsModalTitle, { color: palette.ink }]}>
                  How Location Works
                </Text>
              </View>
              <Pressable
                onPress={() => setShowLocationInfoModal(false)}
                hitSlop={8}
                style={[styles.closeModalBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            <ScrollView style={styles.policyScrollArea} showsVerticalScrollIndicator={false}>
              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                1. Used Only While in the App
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                MedFind only checks your location while you actively use the app to find nearby pharmacies and emergency facilities. It never runs in the background.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                2. Stays on Your Phone
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                Your GPS coordinates stay on your device. They are never sent to external servers or shared with anyone.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                3. Straight-line Distance
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                All distances to nearby stores and hospitals are calculated directly on your phone using straight-line distance to verified store locations.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                4. Select Area Manually
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                If location is turned off, you can tap the area button in the top header to choose any neighborhood manually.
              </Text>
            </ScrollView>

            <Pressable
              onPress={() => setShowLocationInfoModal(false)}
              style={[
                styles.policyDismissBtn,
                { backgroundColor: palette.btn, borderColor: palette.btnBorder },
              ]}
            >
              <Text style={[styles.policyDismissBtnText, { color: palette.btnInk }]}>
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  // A) HEADER
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TARGET,
    gap: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitleColumn: {
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.23,
    lineHeight: 24,
  },
  brandSubtext: {
    fontFamily: fonts.sansMedium,
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: radii.pill,
    borderWidth: 1.2,
    maxWidth: 175,
    flexShrink: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationPinBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeDemoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  homeDemoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  homeDemoBadgeText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  demoSampleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginLeft: 8,
  },
  demoSampleBadgeText: {
    fontSize: 11,
  },
  locationPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },

  coverageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 4,
  },
  coverageTextGroup: {
    flex: 1,
    gap: 4,
  },
  coverageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverageBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  coverageBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  coveragePickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coveragePickerBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },

  // B) HERO
  heroSection: {
    gap: 10,
    marginTop: 4,
  },
  headlineContainer: {
    gap: 0,
  },
  headlineLine1: {
    fontFamily: fonts.serif,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.66,
  },
  headlineLine2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  highlightWrapper: {
    position: 'relative',
    justifyContent: 'flex-end',
  },
  highlightUnderline: {
    position: 'absolute',
    left: -2,
    right: -2,
    bottom: 2,
    height: '36%',
    borderRadius: 3,
  },
  headlineHighlightText: {
    fontFamily: fonts.serif,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.66,
  },
  headlineLine2Rest: {
    fontFamily: fonts.serif,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.66,
  },
  heroParagraph: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '400',
  },

  // C) SEARCH LINK
  searchLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: 18,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  searchPlaceholder: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
  },

  // D) RECENT

  // E) CARE NEARBY CARD
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 3,
  },
  actionTileBox: {
    width: 44,
    height: 44,
    borderRadius: radii.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardMiddle: {
    flex: 1,
    gap: 2,
  },
  actionCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
  },
  actionCardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '400',
  },

  // F) EMERGENCY HELP CARD
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1.5,
    gap: 14,
  },
  emergencyCircleBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // G) FRESHNESS LEGEND (EXECUTIVE MAKEOVER)
  freshnessLegendContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  legendHeader: {
    gap: 6,
  },
  legendBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  verifiedBadgeText: {
    fontFamily: fonts.sansXBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendMainTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  legendSubTitle: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  spectrumContainer: {
    gap: 6,
    paddingVertical: 2,
  },
  spectrumTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  spectrumSegment: {
    height: '100%',
    borderRadius: 2,
  },
  spectrumLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spectrumLabelStart: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  spectrumLabelEnd: {
    fontFamily: fonts.sansMedium,
    fontSize: 11.5,
    fontWeight: '500',
  },
  tiersList: {
    gap: 10,
  },
  tierCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tierBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  tierTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  tierTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
    flexShrink: 0,
  },
  tierTimeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
  },
  tierGuidance: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 17.5,
  },
  legendTrustFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  legendTrustText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  settingsScrollContent: {
    paddingBottom: 6,
  },
  settingsProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 6,
  },
  settingsProfileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  settingsProfileMascot: {
    width: 38,
    height: 38,
  },
  settingsProfileTextGroup: {
    flex: 1,
    gap: 2,
  },
  settingsProfileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsProfileName: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  settingsBuddyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  settingsBuddyBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    fontWeight: '700',
  },
  settingsProfileSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  settingsSectionHeader: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 4,
  },
  settingsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  settingsModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsModalTitle: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '700',
  },
  closeModalBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemInfo: {
    flex: 1,
  },
  settingsItemTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsItemSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  themeToggleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeToggleBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '600',
  },
  policyCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  policyScrollArea: {
    marginVertical: 4,
  },
  policySectionHeading: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  policyBodyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  policyDismissBtn: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  policyDismissBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  greetingCard: {
    borderRadius: radii.cardLg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: 10,
  },
  greetingLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  greetingMascot: {
    width: 60,
    height: 60,
  },
  greetingTextGroup: {
    flex: 1,
  },
  greetingCaption: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  greetingHeadline: {
    fontSize: 22,
    lineHeight: 28,
  },
  greetingSubline: {
    fontSize: 14,
    lineHeight: 20,
  },
  forYouSection: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  forYouHeader: {
    marginBottom: 4,
  },
  forYouTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  forYouSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  featuredSection: {
    marginTop: 18,
    marginBottom: 8,
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  featuredSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  viewAllPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  viewAllText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  featuredScrollContent: {
    gap: 12,
    paddingRight: 16,
    paddingBottom: 6,
  },
  featuredCard: {
    width: 164,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  featuredPedestal: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featuredExpiryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  featuredExpiryText: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  featuredMedName: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  featuredGeneric: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  featuredMrp: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  featuredBatchPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredBatchText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
  },
  medicineBoxSection: {
    marginTop: 18,
    marginBottom: 10,
  },
  medicineBoxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicineBoxTitle: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  boxCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  boxCountBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  medicineBoxSub: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  medicineBoxCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  medicineBoxCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  medicineBoxIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicineBoxCardBody: {
    flex: 1,
  },
  medicineBoxCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14.5,
    marginBottom: 3,
  },
  medicineBoxCardDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  boxTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  regularCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    alignSelf: 'flex-start',
  },
  regularCountBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  restockDueTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  restockDueTagText: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
  },
  medicineBoxSummaryLine: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },
  medicineBoxActionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  boxActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  boxActionBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
});
