import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { layout, typography } from '../../theme/tokens';
import {
  getMedicineResultById,
  MedicineSearchResultItem,
} from '../../services/medicineSearch';
import { storageService } from '../../services/storageService';
import {
  BackArrowIcon,
  BookmarkIcon,
  ClockIcon,
  PharmacyStoreIcon,
  MapPinIcon,
  PhoneIcon,
  DirectionsIcon,
  WarningIcon,
  ShieldCheckIcon,
  MedicalCrossIcon,
  PillCapsuleIcon,
} from '../../components/icons/AppIcons';

export default function MedicineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode, theme } = useTheme();

  const [item, setItem] = useState<MedicineSearchResultItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Status bar & notch-safe header padding
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 0;
  const headerTopPadding = Math.max(insets.top, statusBarHeight) + 12;

  useEffect(() => {
    let isCancelled = false;

    async function loadDetails() {
      if (!id) return;
      setIsLoading(true);

      const found = await getMedicineResultById(id);
      const fav = await storageService.isFavorite(id);

      if (!isCancelled) {
        setItem(found);
        setIsFavorite(fav);
        setIsLoading(false);
      }
    }

    loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!id) return;
    const nextState = await storageService.toggleFavorite(id);
    setIsFavorite(nextState);
  };

  const handleCallPress = async () => {
    if (!item) return;

    if (item.isDemo || /demo|no call|inactive/i.test(item.pharmacyPhone)) {
      Alert.alert(
        'Simulated Demo Record',
        'This record is for academic demonstration. Dialing is disabled for simulated demo numbers.',
        [{ text: 'Understood' }]
      );
      return;
    }

    const cleanNumber = item.pharmacyPhone.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Phone Dialing Unavailable', `Cannot place calls to ${item.pharmacyPhone} from this device.`);
      }
    } catch {
      Alert.alert('Error', 'Unable to initiate phone call.');
    }
  };

  const handleOpenMaps = async () => {
    if (!item) return;

    const query = encodeURIComponent(`${item.pharmacyName}, ${item.pharmacyAddress}`);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://maps.google.com/?q=${query}`,
    });

    try {
      const supported = await Linking.canOpenURL(mapUrl);
      if (supported) {
        await Linking.openURL(mapUrl);
      } else {
        await Linking.openURL(`https://maps.google.com/?q=${query}`);
      }
    } catch {
      Alert.alert('Map Error', 'Unable to open external map application.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.canvas }]}>
        <ActivityIndicator size="large" color={theme.primaryAccent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading medicine verification record...
        </Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.canvas }]}>
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
          Record Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.textSecondary }]}>
          This medicine record may have expired or is unavailable.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.primaryAccent }]}
        >
          <Text style={[styles.backButtonText, { color: theme.textInverse }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDemo = item.isDemo;

  // Format availability
  let availabilityLabel = isDemo ? '● Sample: Available' : '● Reported: Available';
  let availabilityBg = theme.badgeBackground;
  let availabilityColor = theme.primaryAccentText;

  if (item.state === 'low_stock') {
    availabilityLabel = isDemo ? '▲ Sample: Low Stock' : '▲ Reported: Low Stock';
    availabilityBg = mode === 'light' ? 'rgba(255, 248, 238, 0.95)' : 'rgba(38, 23, 8, 0.85)';
    availabilityColor = mode === 'light' ? theme.warningAccentText : theme.warningAccent;
  } else if (item.state === 'unavailable') {
    availabilityLabel = isDemo ? '— Sample: Unavailable' : '— Reported: Unavailable';
    availabilityBg = theme.glass.backgroundSubtle;
    availabilityColor = theme.textSecondary;
  } else if (item.state === 'unknown') {
    availabilityLabel = isDemo ? '○ Sample: Unknown' : '○ Reported: Unknown';
    availabilityBg = theme.glass.backgroundSubtle;
    availabilityColor = theme.textSecondary;
  }

  const updateTimeText = isDemo
    ? `Sample update: ${item.freshness.relativeTimeText}`
    : `Updated ${item.freshness.relativeTimeText}`;

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.canvas }]}>
      {/* 1. APPLE IOS LIQUID GLASS HEADER WITH BACK & BOOKMARK */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: headerTopPadding,
            backgroundColor: theme.glass.background,
            borderBottomColor: theme.glass.borderSubtle,
            shadowColor: theme.glass.shadowColor,
            shadowOffset: theme.glass.shadowOffset,
            shadowOpacity: theme.glass.shadowOpacity,
            shadowRadius: theme.glass.shadowRadius,
            elevation: theme.glass.elevation,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.headerLiquidButton,
            {
              backgroundColor: theme.glass.backgroundPill,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to search results"
        >
          <BackArrowIcon size={18} color={theme.textPrimary} />
          <Text style={[styles.headerButtonText, { color: theme.textPrimary }]}>
            Back
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.headerTitleText, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          Medicine Details
        </Text>

        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={[
            styles.headerLiquidButton,
            {
              backgroundColor: theme.glass.backgroundPill,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from saved medicines' : 'Save medicine locally'}
        >
          <BookmarkIcon size={18} filled={isFavorite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. HERO MEDICINE CARD (APPLE LIQUID GLASS) */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.glass.background,
              borderColor: theme.glass.border,
              borderTopColor: theme.glass.borderHighlight,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTitleColumn}>
              <Text style={[styles.heroBrandTitle, { color: theme.textPrimary }]}>
                {item.brandName}
              </Text>
              <Text style={[styles.heroGenericSubtitle, { color: theme.textSecondary }]}>
                {item.genericName}
              </Text>
            </View>

            <View style={styles.heroBadgesRow}>
              {(item.strength || item.dosageForm) && (
                <View
                  style={[
                    styles.capsulePill,
                    {
                      backgroundColor: theme.glass.backgroundPill,
                      borderColor: theme.glass.border,
                    },
                  ]}
                >
                  <PillCapsuleIcon size={14} />
                  <Text style={[styles.capsulePillText, { color: theme.textSecondary }]}>
                    {item.strength}
                    {item.strength && item.dosageForm ? ' • ' : ''}
                    {item.dosageForm}
                  </Text>
                </View>
              )}

              {isDemo && (
                <View
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: theme.glass.backgroundPill,
                      borderColor: theme.glass.border,
                    },
                  ]}
                >
                  <Text style={[styles.demoPillText, { color: theme.textMuted }]}>
                    Demo Record
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Availability State Banner */}
          <View
            style={[
              styles.availabilityBox,
              {
                backgroundColor: availabilityBg,
                borderColor:
                  item.state === 'available'
                    ? theme.primaryAccent
                    : item.state === 'low_stock'
                    ? theme.warningAccent
                    : theme.glass.border,
              },
            ]}
          >
            <ShieldCheckIcon
              size={18}
              color={
                item.state === 'available'
                  ? theme.primaryAccent
                  : item.state === 'low_stock'
                  ? theme.warningAccent
                  : theme.textSecondary
              }
            />
            <Text style={[styles.availabilityText, { color: availabilityColor }]}>
              {availabilityLabel}
            </Text>
          </View>

          {/* Freshness Timestamp */}
          <View style={styles.updateRow}>
            <ClockIcon size={14} color={theme.textMuted} />
            <Text style={[styles.updateText, { color: theme.textMuted }]}>
              {updateTimeText} ({item.freshness.badgeLabel})
            </Text>
          </View>

          {/* Aging Warning Notice if applicable */}
          {item.freshness.requiresCallFirst && !isDemo && (
            <View
              style={[
                styles.agingWarningBox,
                {
                  backgroundColor: mode === 'light' ? 'rgba(255, 248, 238, 0.95)' : 'rgba(35, 22, 8, 0.9)',
                  borderColor: theme.warningAccent,
                },
              ]}
            >
              <WarningIcon size={16} />
              <Text
                style={[
                  styles.agingWarningText,
                  { color: mode === 'light' ? theme.warningAccentText : theme.warningAccent },
                ]}
              >
                Snapshot is not live. Always call store to confirm stock before traveling.
              </Text>
            </View>
          )}
        </View>

        {/* 3. PARTICIPATING PHARMACY DETAILS (LIQUID GLASS CARD) */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.glass.background,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <PharmacyStoreIcon size={18} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Participating Store Details
            </Text>
          </View>

          <Text style={[styles.pharmacyName, { color: theme.textPrimary }]}>
            {item.pharmacyName}
          </Text>

          {/* Address */}
          <View style={styles.infoRow}>
            <MapPinIcon size={16} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {item.pharmacyAddress}
            </Text>
          </View>

          {/* Opening Hours */}
          {item.openingHours && (
            <View style={styles.infoRow}>
              <ClockIcon size={15} color={theme.textMuted} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Hours: {item.openingHours}
              </Text>
            </View>
          )}

          {/* Contact String */}
          <View style={styles.infoRow}>
            <PhoneIcon size={15} color={isDemo ? theme.textMuted : theme.primaryAccent} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {isDemo ? 'Sample contact (no calls)' : item.pharmacyPhone}
            </Text>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleCallPress}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.primaryAccent,
                  borderColor: theme.glass.borderHighlight,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Call store at ${item.pharmacyPhone}`}
            >
              <PhoneIcon size={16} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                Call Pharmacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenMaps}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.glass.backgroundPill,
                  borderColor: theme.glass.border,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open pharmacy address in maps"
            >
              <DirectionsIcon size={16} />
              <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>
                Open in Maps
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. CLINICAL SAFETY & PRESCRIPTION NOTICE */}
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.glass.backgroundSubtle,
              borderColor: theme.glass.borderSubtle,
            },
          ]}
        >
          <View style={styles.noticeHeaderRow}>
            <MedicalCrossIcon size={16} />
            <Text style={[styles.noticeTitle, { color: theme.textPrimary }]}>
              Prescription & Clinical Verification
            </Text>
          </View>
          <Text style={[styles.noticeBody, { color: theme.textSecondary }]}>
            • MedFind is a stock discovery directory and does not dispense or reserve medication.{'\n'}
            • Always carry a valid prescription from a registered medical practitioner.{'\n'}
            • Never adjust dosages or substitute medicines without consulting your physician or pharmacist.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
  },
  errorTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.pill,
    marginTop: 8,
  },
  backButtonText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // HEADER
  headerBar: {
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLiquidButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '500',
  },
  headerTitleText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },

  // SCROLL CONTAINER
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
    gap: layout.spacing.md,
  },

  // HERO CARD
  heroCard: {
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md + 4,
    gap: layout.spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  heroTitleColumn: {
    flex: 1,
    minWidth: 160,
  },
  heroBrandTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroGenericSubtitle: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
    flexWrap: 'wrap',
  },
  capsulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  capsulePillText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  demoPill: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  demoPillText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  availabilityText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  agingWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm,
  },
  agingWarningText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    flex: 1,
  },

  // SECTION CARD
  sectionCard: {
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md + 2,
    gap: layout.spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pharmacyName: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // NOTICE CARD
  noticeCard: {
    borderRadius: layout.borderRadius.md + 2,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: 6,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  noticeBody: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 18,
  },
});
