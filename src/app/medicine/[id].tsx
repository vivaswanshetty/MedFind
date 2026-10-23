import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
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
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
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
  ShieldCheckIcon,
  MedicalCrossIcon,
  PillCapsuleIcon,
  CheckCircleIcon,
  TriangleAlertIcon,
  CircleHelpIcon,
  InfoIcon,
} from '../../components/icons/AppIcons';

export default function MedicineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme, palette } = useTheme();

  const [item, setItem] = useState<MedicineSearchResultItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

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

    if (!item.pharmacyPhone) {
      Alert.alert(
        'Phone Contact Unavailable',
        'A telephone contact has not been confirmed directly by a participating provider for this listing.',
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

    if (!item.isReported || !item.pharmacyAddress) {
      Alert.alert(
        'Location Unavailable',
        'No participating retail pharmacy location is currently reporting stock for this medicine.',
        [{ text: 'Understood' }]
      );
      return;
    }

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
      <View style={[styles.centerContainer, { backgroundColor: palette.bg }]}>
        <AtmosphereBackground />
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={[styles.loadingText, { color: palette.ink2 }]}>
          Loading verified medicine record...
        </Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: palette.bg }]}>
        <AtmosphereBackground />
        <Text style={[styles.errorTitle, { color: palette.ink }]}>
          Record Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: palette.ink2 }]}>
          This medicine record may have expired or is unavailable.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backActionButton, { backgroundColor: palette.btn }]}
        >
          <Text style={[styles.backActionButtonText, { color: palette.btnInk }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const isReported = item.isReported === true;

  // Format availability badge
  let availabilityLabel = 'Availability unrecorded';
  let availabilityBg = palette.naTint;
  let availabilityColor = palette.naInk;
  let availabilityIcon = <CircleHelpIcon size={16} color={palette.naInk} />;

  if (isReported) {
    if (item.state === 'available') {
      availabilityLabel = 'Reported: In Stock';
      availabilityBg = palette.okTint;
      availabilityColor = palette.okInk;
      availabilityIcon = <CheckCircleIcon size={16} color={palette.okInk} />;
    } else if (item.state === 'low_stock') {
      availabilityLabel = 'Reported: Low Stock';
      availabilityBg = palette.amberTint;
      availabilityColor = palette.amberInk;
      availabilityIcon = <ClockIcon size={16} color={palette.amberInk} />;
    } else if (item.state === 'unavailable') {
      availabilityLabel = 'Reported: Out of Stock';
      availabilityBg = palette.badTint;
      availabilityColor = palette.badInk;
      availabilityIcon = <TriangleAlertIcon size={16} color={palette.badInk} />;
    }
  }

  const updateTimeText = isReported && item.freshness?.rawTimestamp
    ? `Verified by pharmacy ${item.freshness.relativeTimeText || 'recently'}`
    : 'No live verification received today';

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      {/* TOP HEADER BAR */}
      <View style={[styles.headerBar, { paddingTop, backgroundColor: 'transparent' }]}>
        <Pressable
          onPress={() => router.back()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <BackArrowIcon size={18} color={palette.ink} />
        </Pressable>

        <Text style={[styles.headerTitleText, { color: palette.ink }]} numberOfLines={1}>
          Medicine Details
        </Text>

        <Pressable
          onPress={handleToggleFavorite}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from saved' : 'Save medicine locally'}
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <BookmarkIcon size={18} filled={isFavorite} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO MEDICINE CARD */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={styles.heroTitleColumn}>
            <Text style={[styles.heroBrandTitle, { color: palette.ink }]}>
              {item.brandName}
            </Text>
            <Text style={[styles.heroGenericSubtitle, { color: palette.ink2 }]}>
              {item.genericName}
            </Text>
          </View>

          {/* Form / Strength Pills */}
          <View style={styles.heroBadgesRow}>
            {(item.strength || item.dosageForm) && (
              <View
                style={[
                  styles.metaPill,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                  },
                ]}
              >
                <PillCapsuleIcon size={14} />
                <Text style={[styles.metaPillText, { color: palette.ink }]}>
                  {item.strength}
                  {item.strength && item.dosageForm ? ' • ' : ''}
                  {item.dosageForm}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <Text style={[styles.metaPillText, { color: palette.ink2 }]}>
                {item.sourceType === 'provider_confirmed'
                  ? 'Provider Confirmed'
                  : item.sourceName || 'NLEM India'}
              </Text>
            </View>
          </View>

          {/* Availability State Banner */}
          <View
            style={[
              styles.availabilityBox,
              {
                backgroundColor: availabilityBg,
                borderColor: palette.line,
              },
            ]}
          >
            {availabilityIcon}
            <Text
              style={[styles.availabilityText, { color: availabilityColor }]}
              numberOfLines={1}
            >
              {availabilityLabel}
            </Text>
          </View>

          {/* Timestamp Notice */}
          <View style={styles.updateRow}>
            <ClockIcon size={14} color={palette.ink2} />
            <Text style={[styles.updateText, { color: palette.ink2 }]}>
              {updateTimeText}
            </Text>
          </View>
        </View>

        {/* 2. PARTICIPATING STORE DETAILS CARD */}
        <View
          style={[
            styles.storeCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <PharmacyStoreIcon size={18} color={palette.accent} />
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>
              {isReported ? 'Participating Pharmacy' : 'Catalog Source & Status'}
            </Text>
          </View>

          <Text style={[styles.pharmacyName, { color: palette.ink }]}>
            {item.pharmacyName}
          </Text>

          {/* Address */}
          <View style={styles.infoRow}>
            <MapPinIcon size={15} color={palette.ink2} />
            <Text style={[styles.infoText, { color: palette.ink2 }]}>
              {item.pharmacyAddress}
            </Text>
          </View>

          {/* Hours */}
          {item.openingHours && (
            <View style={styles.infoRow}>
              <ClockIcon size={14} color={palette.ink2} />
              <Text style={[styles.infoText, { color: palette.ink2 }]}>
                Hours: {item.openingHours}
              </Text>
            </View>
          )}

          {/* Source Attribution */}
          {item.sourceName && (
            <View
              style={[
                styles.sourceAttributionBox,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <ShieldCheckIcon size={14} color={palette.okInk} />
              <Text style={[styles.sourceAttributionText, { color: palette.ink2 }]}>
                Verified listing • {item.sourceName} • {item.verifiedDate || 'Oct 2026'}
              </Text>
            </View>
          )}

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {isReported && item.pharmacyPhone ? (
              <Pressable
                onPress={handleCallPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call pharmacy at ${item.pharmacyPhone}`}
                style={({ pressed }) => [
                  styles.callButton,
                  {
                    backgroundColor: palette.btn,
                    borderColor: palette.btnBorder,
                    opacity: pressed ? 0.88 : 1.0,
                  },
                ]}
              >
                <PhoneIcon size={16} color={palette.btnInk} />
                <Text
                  style={[styles.callButtonText, { color: palette.btnInk }]}
                  numberOfLines={1}
                >
                  Call pharmacy
                </Text>
              </Pressable>
            ) : null}

            {isReported && item.pharmacyAddress ? (
              <Pressable
                onPress={handleOpenMaps}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open pharmacy address in Maps"
                style={({ pressed }) => [
                  styles.directionsButton,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    opacity: pressed ? 0.85 : 1.0,
                  },
                ]}
              >
                <DirectionsIcon size={15} color={palette.ink} />
                <Text
                  style={[styles.directionsButtonText, { color: palette.ink }]}
                  numberOfLines={1}
                >
                  Directions
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* 3. CLINICAL POLICY BOUNDARY NOTICE */}
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: palette.surface2,
              borderColor: palette.line,
            },
          ]}
        >
          <View style={styles.noticeHeaderRow}>
            <InfoIcon size={16} color={palette.ink2} />
            <Text style={[styles.noticeTitle, { color: palette.ink }]}>
              Clinical Policy Notice
            </Text>
          </View>
          <Text style={[styles.noticeBody, { color: palette.ink2 }]}>
            MedFind reports exact description matches directly confirmed by participating desks. MedFind gives no medical advice, does not substitute medications, and never accepts compensation to rank pharmacies.
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    marginTop: 8,
  },
  errorTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
  },
  backActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.pill,
    marginTop: 8,
  },
  backActionButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
  },

  // HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // SCROLL CONTENT
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },

  // HERO CARD
  heroCard: {
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  heroTitleColumn: {
    gap: 3,
  },
  heroBrandTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroGenericSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  metaPillText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginTop: 2,
  },
  availabilityText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updateText: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },

  // STORE CARD
  storeCard: {
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pharmacyName: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    flex: 1,
  },
  sourceAttributionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  sourceAttributionText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  callButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  directionsButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directionsButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },

  // NOTICE CARD
  noticeCard: {
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 8,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  noticeBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18.5,
  },
});
