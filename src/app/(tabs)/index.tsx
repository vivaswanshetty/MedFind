import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { StatusChip } from '../../components/StatusChip';
import { useLocation } from '../../context/LocationContext';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';
import { AreaPickerModal } from '../../components/location/AreaPickerModal';
import { storageService } from '../../services/storageService';
import {
  PlusIcon,
  MapPinIcon,
  SearchIcon,
  ClockIcon,
  HospitalIcon,
  PhoneIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  StaffBadgeIcon,
} from '../../components/icons/AppIcons';

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

  const [recentTerms, setRecentTerms] = useState<string[]>([
    'Metformin 500 mg',
    'Salbutamol inhaler',
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
                styles.logoTile,
                {
                  backgroundColor: palette.logoBg,
                  shadowColor: palette.shadow,
                },
              ]}
              accessible={true}
              accessibilityLabel="MedFind Logo"
            >
              <PlusIcon size={22} color={palette.logoInk} />
            </View>
            <Text style={[styles.brandText, { color: palette.ink }]}>MedFind</Text>
          </View>

          {/* Right: Location Pill & Dev Theme Toggle */}
          <View style={styles.headerRightActions}>
            {__DEV__ && (
              <Pressable
                onPress={toggleTheme}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Toggle Theme"
                style={[
                  styles.themeToggleBtn,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                {scheme === 'light' ? (
                  <MoonIcon size={16} color={palette.ink2} />
                ) : (
                  <SunIcon size={16} color={palette.ink2} />
                )}
              </Pressable>
            )}

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
              <MapPinIcon size={16} color={palette.ink} />
              <Text
                style={[styles.locationPillText, { color: palette.ink }]}
                numberOfLines={1}
              >
                {areaName.split(',')[0]}
              </Text>
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
                {' '}you travel.
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
            <HospitalIcon size={24} color={palette.okInk} />
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

        {/* G) FRESHNESS LEGEND CARD */}
        <View
          style={[
            styles.legendCard,
            {
              backgroundColor: palette.surface2,
              borderColor: palette.line,
            },
          ]}
        >
          <Text style={[styles.legendTitle, { color: palette.ink }]}>
            Every result shows when it was last confirmed
          </Text>

          {/* 2x2 Grid of Status Chips */}
          <View style={styles.legendGrid}>
            <View style={styles.legendGridRow}>
              <View style={styles.legendGridCell}>
                <StatusChip tone="ok" label="Recent" hint="30 min or less" />
              </View>
              <View style={styles.legendGridCell}>
                <StatusChip tone="warn" label="Aging" hint="up to 2 h" />
              </View>
            </View>

            <View style={styles.legendGridRow}>
              <View style={styles.legendGridCell}>
                <StatusChip tone="stale" label="Stale" hint="over 2 h" />
              </View>
              <View style={styles.legendGridCell}>
                <StatusChip tone="na" label="Unknown" hint="no data" />
              </View>
            </View>
          </View>

          <Text style={[styles.legendFooterText, { color: palette.ink2 }]}>
            Seeded pilot data. Not live inventory.
          </Text>
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
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandText: {
    fontFamily: fonts.serif,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.23,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    minHeight: MIN_TARGET,
    minWidth: MIN_TARGET,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MIN_TARGET,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  locationPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 130,
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

  // G) FRESHNESS LEGEND
  legendCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
  },
  legendTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  legendGrid: {
    gap: 8,
  },
  legendGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legendGridCell: {
    flex: 1,
  },
  legendFooterText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '400',
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
});
