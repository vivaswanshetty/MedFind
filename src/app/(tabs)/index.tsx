import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import { StatusChip } from '../../components/StatusChip';
import { useLocation } from '../../context/LocationContext';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';
import { AreaPickerModal } from '../../components/location/AreaPickerModal';
import { storageService } from '../../services/storageService';
import { cleanLocalityName } from '../../services/locationService';
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
} from '../../components/icons/AppIcons';

function formatHeaderArea(raw: string): string {
  if (!raw) return 'Bengaluru';
  const clean = cleanLocalityName(raw.split(',')[0]);
  return clean || 'Bengaluru';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette, toggleTheme } = useTheme();
  const {
    areaName,
    showOnboardingModal,
    setShowOnboardingModal,
    showAreaPickerModal,
    setShowAreaPickerModal,
  } = useLocation();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showLocationInfoModal, setShowLocationInfoModal] = useState(false);

  const [recentTerms, setRecentTerms] = useState<string[]>([
    'Metformin 500 mg',
    'Salbutamol inhaler',
    'Paracetamol 500 mg',
    'Cetirizine 10 mg',
  ]);

  useEffect(() => {
    async function loadRecents() {
      const stored = await storageService.getRecentSearches();
      if (stored && stored.length > 0) {
        setRecentTerms(stored.slice(0, 4));
      }
    }
    loadRecents();
  }, []);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

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
              accessibilityLabel={`Current location ${areaName}. Tap to change area.`}
              style={[
                styles.locationPill,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <MapPinIcon size={14} color={palette.ink} />
              <Text
                style={[styles.locationPillText, { color: palette.ink }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatHeaderArea(areaName)}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowSettingsModal(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open settings and options"
              style={[
                styles.settingsBtn,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <SettingsIcon size={20} color={palette.ink} />
            </Pressable>
          </View>
        </View>

        {/* B) HERO */}
        <View style={styles.heroSection}>
          <View style={styles.headlineContainer}>
            <Text style={[styles.headlineLine1, { color: palette.ink }]}>
              Find your medicine
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
                  before
                </Text>
              </View>
              <Text style={[styles.headlineLine2Rest, { color: palette.ink }]}>
                {' '}you visit.
              </Text>
            </View>
          </View>

          <Text style={[styles.heroParagraph, { color: palette.ink2 }]}>
            See which nearby pharmacy last confirmed it, and exactly how long ago.
          </Text>
        </View>

        {/* C) SEARCH LINK */}
        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Search medicine name"
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
            Search medicine name
          </Text>
        </Pressable>

        {/* D) RECENT SEARCHES */}
        <View style={styles.recentSection}>
          <View style={styles.recentLabelRow}>
            <ClockIcon size={15} color={palette.ink2} />
            <Text style={[styles.recentLabelText, { color: palette.ink2 }]}>
              Recent, saved on this device only
            </Text>
          </View>

          <View style={styles.recentChipsRow}>
            {recentTerms.map((term, idx) => (
              <Pressable
                key={`${term}-${idx}`}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/search',
                    params: { q: term },
                  });
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Recent search: ${term}`}
                style={({ pressed }) => [
                  styles.recentChip,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <Text style={[styles.recentChipText, { color: palette.ink }]}>
                  {term}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

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
              Care nearby
            </Text>
            <Text style={[styles.actionCardSubtitle, { color: palette.ink2 }]}>
              Hospitals, clinics and ambulance contacts
            </Text>
          </View>

          <ChevronRightIcon size={20} color={palette.ink2} />
        </Pressable>

        {/* F) EMERGENCY HELP CARD */}
        <Pressable
          onPress={() => router.push('/(tabs)/emergency')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Emergency help: Call 112 or view emergency contacts"
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
              Emergency help
            </Text>
            <Text style={[styles.actionCardSubtitle, { color: palette.ink2 }]}>
              Call 112 or view emergency contacts
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
                  VERIFIED FRESHNESS SYSTEM
                </Text>
              </View>
            </View>

            <Text style={[styles.legendMainTitle, { color: palette.ink }]}>
              How stock freshness is rated
            </Text>
            <Text style={[styles.legendSubTitle, { color: palette.ink2 }]}>
              Every pharmacy result carries a verification timestamp so you know whether to visit immediately or call ahead.
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
                Highest certainty • Visit directly
              </Text>
              <Text style={[styles.spectrumLabelEnd, { color: palette.ink2 }]}>
                Call first
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
                    Recent & Confirmed
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.okInk} />
                  <Text style={[styles.tierTimeText, { color: palette.okInk }]}>
                    Within 30 min
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.okInk }]}>
                Directly confirmed by the pharmacy counter. Safe to travel immediately with highest confidence.
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
                    Aging
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.amberInk} />
                  <Text style={[styles.tierTimeText, { color: palette.amberInk }]}>
                    30 min – 2 hours
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.amberInk }]}>
                Reported earlier today. Stock is likely available, though fast-moving items or limited batches may deplete.
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
                    Stale report
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <ClockIcon size={12} color={palette.staleInk} />
                  <Text style={[styles.tierTimeText, { color: palette.staleInk }]}>
                    Over 2 hours ago
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.staleInk }]}>
                Report is several hours old. Inventory may have changed; tap Call to confirm before traveling.
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
                    Unknown / No Record
                  </Text>
                </View>
                <View style={[styles.tierTimeChip, { backgroundColor: palette.surface }]}>
                  <Text style={[styles.tierTimeText, { color: palette.ink2 }]}>
                    No report today
                  </Text>
                </View>
              </View>
              <Text style={[styles.tierGuidance, { color: palette.ink2 }]}>
                Pharmacy is verified and open, but hasn't submitted a stock update today. Always call to confirm.
              </Text>
            </View>
          </View>

          {/* Trust Footnote */}
          <View style={styles.legendTrustFooter}>
            <StaffBadgeIcon size={16} color={palette.ink2} />
            <Text style={[styles.legendTrustText, { color: palette.ink2 }]}>
              Direct pharmacy confirmations only. MedFind never estimates, guesses, or artificially refreshes inventory timestamps.
            </Text>
          </View>
        </View>

        {/* PHARMACY STAFF PORTAL QUICK LINK */}
        <Pressable
          onPress={() => router.push('/portal')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Pharmacy Staff Portal: 1-tap stock update"
          style={({ pressed }) => [
            styles.staffPortalLink,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <StaffBadgeIcon size={16} color={palette.ink2} />
          <Text style={[styles.staffPortalLinkText, { color: palette.ink2 }]}>
            Pharmacy Operator? Update stock in Staff Portal →
          </Text>
        </Pressable>
      </ScrollView>
      </AnimatedScreenTransition>

      {/* Onboarding Flow Modal */}
      <Modal
        visible={showOnboardingModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowOnboardingModal(false)}
      >
        <OnboardingFlow onDismiss={() => setShowOnboardingModal(false)} />
      </Modal>

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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettingsModal(false)}
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
            {/* Modal Header */}
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsModalTitleRow}>
                <SettingsIcon size={20} color={palette.ink} />
                <Text style={[styles.settingsModalTitle, { color: palette.ink }]}>
                  Settings & Options
                </Text>
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

            {/* Item 1: Theme Switcher */}
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
                  Appearance: {scheme === 'light' ? 'Light theme' : 'Dark theme'}
                </Text>
                <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                  Tap to switch to {scheme === 'light' ? 'dark' : 'light'} theme
                </Text>
              </View>
              <View
                style={[
                  styles.themeToggleBadge,
                  { backgroundColor: palette.surface2, borderColor: palette.line },
                ]}
              >
                <Text style={[styles.themeToggleBadgeText, { color: palette.ink }]}>
                  Switch
                </Text>
              </View>
            </Pressable>

            {/* Item 2: How Location Works */}
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
                  How Location Works
                </Text>
                <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                  GPS usage, distance calculation & privacy
                </Text>
              </View>
              <ChevronRightIcon size={18} color={palette.ink2} />
            </Pressable>

            {/* Item 3: Pharmacy Staff Portal */}
            <Pressable
              onPress={() => {
                setShowSettingsModal(false);
                router.push('/portal');
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Pharmacy Staff Portal"
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
                        ? 'rgba(168, 85, 247, 0.16)'
                        : 'rgba(192, 132, 252, 0.2)',
                    borderColor:
                      scheme === 'light'
                        ? 'rgba(168, 85, 247, 0.35)'
                        : 'rgba(192, 132, 252, 0.4)',
                  },
                ]}
              >
                <StaffBadgeIcon
                  size={18}
                  color={scheme === 'light' ? '#9333EA' : '#C084FC'}
                />
              </View>
              <View style={styles.settingsItemInfo}>
                <Text style={[styles.settingsItemTitle, { color: palette.ink }]}>
                  Pharmacy Staff Portal
                </Text>
                <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                  Submit live stock updates
                </Text>
              </View>
              <ChevronRightIcon size={18} color={palette.ink2} />
            </Pressable>

            {/* Item 4: Sourcing Policy */}
            <Pressable
              onPress={() => {
                setShowSettingsModal(false);
                setShowPolicyModal(true);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Verified Sourcing Policy"
              style={styles.settingsRowItem}
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
                  Verified Data Policy
                </Text>
                <Text style={[styles.settingsItemSubtitle, { color: palette.ink2 }]}>
                  Government records & NLEM catalog
                </Text>
              </View>
              <ChevronRightIcon size={18} color={palette.ink2} />
            </Pressable>
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
                3. NLEM India Essential Medicines
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                The medicine catalog is based on the National List of Essential Medicines (NLEM India 2022). MedFind provides contact reference only and gives no dosage advice or automatic drug substitution.
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLocationInfoModal(false)}
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
                1. Foreground GPS Only
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                MedFind only requests foreground location while you actively use the app to discover nearby pharmacies and emergency facilities. We never track your background location or drain battery continuously.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                2. Device-Local Privacy
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                Your GPS coordinates stay on your phone. They are never sent to external servers, shared with third parties, or saved in any remote database.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                3. On-Device Distance Math
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                All distances to pharmacies, clinics, and hospitals are computed directly on this device using straight-line geodesic formulas to verified government and provider coordinates.
              </Text>

              <Text style={[styles.policySectionHeading, { color: palette.ink }]}>
                4. Manual Neighborhood Fallback
              </Text>
              <Text style={[styles.policyBodyText, { color: palette.ink2 }]}>
                If location permission is denied or turned off, you can tap the area pill in the top header to choose any neighborhood manually. Medicine search and emergency care are never blocked.
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
          </Pressable>
        </Pressable>
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
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 145,
    flexShrink: 1,
  },
  locationPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
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
  recentSection: {
    gap: 8,
  },
  recentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentLabelText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  recentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    minHeight: MIN_TARGET,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    fontWeight: '600',
  },

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
  },
  tierBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14.5,
    fontWeight: '700',
  },
  tierTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
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

  staffPortalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  staffPortalLinkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
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
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
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
});
