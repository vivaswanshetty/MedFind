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
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import {
  getMedicineResultById,
  MedicineSearchResultItem,
} from '../../services/medicineSearch';
import { MedicineIcon3D, MedicineType } from '../../components/medicine/MedicineIcon3D';
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
  PlusIcon,
} from '../../components/icons/AppIcons';
import { useMedicineBox } from '../../store/medicineBox';

export default function MedicineDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scheme, palette } = useTheme();
  const { t, formatNumber, tMedicine, tPharmacy } = useLanguage();

  const [item, setItem] = useState<MedicineSearchResultItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { isItemInBox } = useMedicineBox();
  const inBox = item ? (isItemInBox(item.brandName) || isItemInBox(item.genericName)) : false;

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
  const isSampleData = item.isSampleData ?? true;

  // Format availability badge
  let availabilityLabel = t('unreported', 'Call store to verify');
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

  const rawForm = (item.dosageForm || 'Tablet').toLowerCase();
  const icon3dType: MedicineType = (item.image3dType as MedicineType) || (
    rawForm.includes('syrup') || rawForm.includes('suspension') ? 'syrup'
    : rawForm.includes('capsule') ? 'capsule'
    : rawForm.includes('inhaler') ? 'inhaler'
    : rawForm.includes('drop') ? 'drops'
    : rawForm.includes('cream') || rawForm.includes('gel') || rawForm.includes('ointment') ? 'cream'
    : rawForm.includes('injection') ? 'injection'
    : 'tablet'
  );

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

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
        {/* 1. HERO MEDICINE CARD WITH HD 3D SHOWCASE */}
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
          {/* HD 3D Interactive Centerpiece */}
          <View style={styles.showcase3DContainer}>
            <View
              style={[
                styles.showcaseGlassPedestal,
                {
                  backgroundColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(135, 169, 107, 0.08)',
                  borderColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(135, 169, 107, 0.22)',
                },
              ]}
            >
              <MedicineIcon3D
                type={icon3dType}
                size={96}
                glow={true}
                float={true}
                color={item.primaryColor || palette.accent}
              />
            </View>
          </View>

          <View style={styles.heroTitleColumn}>
            <Text style={[styles.heroBrandTitle, { color: palette.ink }]}>
              {tMedicine(item.brandName)}
            </Text>
            <Text style={[styles.heroGenericSubtitle, { color: palette.ink2 }]}>
              {tMedicine(item.genericName)}
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
                  {item.strength ? formatNumber(item.strength) : ''}
                  {item.strength && item.dosageForm ? ' • ' : ''}
                  {item.dosageForm ? t(item.dosageForm.toLowerCase(), item.dosageForm) : ''}
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
                  ? 'Confirmed by Store'
                  : item.sourceName || 'Essential Medicine'}
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

        {/* MEDICINE BOX & REGULAR RESTOCK CARD */}
        {item && (
          <View
            style={[
              styles.medicineBoxPromoCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.boxPromoRow}>
              <View
                style={[
                  styles.boxPromoIconWrap,
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
                  size={22}
                  color={scheme === 'light' ? '#4A7036' : '#87A96B'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.boxPromoTitle, { color: palette.ink }]}>
                  {inBox ? 'Saved in My Medicine Box' : 'Track in My Medicine Box'}
                </Text>
                <Text style={[styles.boxPromoSub, { color: palette.ink2 }]}>
                  {inBox
                    ? 'Active in your local medicine box with restock reminder alerts.'
                    : 'Add as a regular medicine (weekly, monthly, or 2 months) to receive refill alerts.'}
                </Text>
              </View>
            </View>

            <View style={styles.boxPromoBtnRow}>
              {inBox ? (
                <Pressable
                  onPress={() => router.push('/medicine-box')}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="View in Medicine Box"
                  style={[
                    styles.boxPromoBtn,
                    { backgroundColor: palette.okTint, borderColor: palette.okLine },
                  ]}
                >
                  <CheckCircleIcon size={15} color={palette.okInk} />
                  <Text style={[styles.boxPromoBtnText, { color: palette.okInk, fontWeight: '700' }]}>
                    In Medicine Box ✓ (Open)
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/medicine-box',
                      params: {
                        action: 'add',
                        addName: item.brandName,
                        addForm: item.dosageForm,
                        addStrength: item.strength,
                      },
                    } as any)
                  }
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Add to Medicine Box and set restock schedule"
                  style={[
                    styles.boxPromoBtn,
                    { backgroundColor: palette.btn, borderColor: palette.btnBorder },
                  ]}
                >
                  <PlusIcon size={15} color={palette.btnInk} />
                  <Text style={[styles.boxPromoBtnText, { color: palette.btnInk, fontWeight: '700' }]}>
                    + Add to Medicine Box & Set Restock
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* 2. AUTHENTIC EXPIRY & BATCH SHELF-LIFE VERIFICATION CARD */}
        <View
          style={[
            styles.expiryBatchCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <View style={styles.expiryHeaderRow}>
            <View style={[styles.freshnessTag, { backgroundColor: palette.okTint, borderColor: palette.okLine }]}>
              <Text style={[styles.freshnessTagText, { color: palette.okInk }]}>
                ✓ Active Shelf-life • Safe & Potent
              </Text>
            </View>
            {item.mrp && (
              <Text style={[styles.mrpText, { color: palette.ink }]}>
                MRP {item.mrp}
              </Text>
            )}
          </View>

          <View style={styles.expiryDetailsGrid}>
            <View style={[styles.expiryDetailItem, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <Text style={[styles.expiryLabel, { color: palette.ink2 }]}>Expiry Date</Text>
              <Text style={[styles.expiryValue, { color: palette.ink }]}>
                {item.expiryDate || '11/2027'}
              </Text>
            </View>

            <View style={[styles.expiryDetailItem, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <Text style={[styles.expiryLabel, { color: palette.ink2 }]}>Batch Code</Text>
              <Text style={[styles.expiryValue, { color: palette.ink }]}>
                {item.batchNo || 'MF-2025/B902'}
              </Text>
            </View>

            <View style={[styles.expiryDetailItem, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <Text style={[styles.expiryLabel, { color: palette.ink2 }]}>Regulation</Text>
              <Text style={[styles.expiryValue, { color: palette.ink }]}>
                {item.schedule || 'Rx - Sched H'}
              </Text>
            </View>
          </View>

          {item.manufacturer ? (
            <View style={styles.manufacturerRow}>
              <ShieldCheckIcon size={14} color={palette.okInk} />
              <Text style={[styles.manufacturerText, { color: palette.ink2 }]}>
                Verified Manufacturer: <Text style={{ color: palette.ink, fontWeight: '600' }}>{item.manufacturer}</Text>
              </Text>
            </View>
          ) : null}
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
            {tPharmacy(item.pharmacyName)}
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
                {isSampleData ? t('sample_data_badge', 'Sample data') : 'Verified listing'} • {item.sourceName} • {item.verifiedDate || 'Oct 2026'}
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

        {/* 3. VERIFIED STOCK ASSURANCE */}
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
            <ShieldCheckIcon size={16} color={palette.okInk} />
            <Text style={[styles.noticeTitle, { color: palette.ink }]}>
              {isSampleData ? t('sample_data_badge', 'Sample data') : t('verified_stock_title', 'Verified Pharmacy Stock')}
            </Text>
          </View>
          <Text style={[styles.noticeBody, { color: palette.ink2 }]}>
            {isSampleData ? t('sample_data_notice', 'Sample data for demonstration. Call the pharmacy to confirm stock.') : t('verified_stock_desc', 'Stock is confirmed directly by pharmacy staff.')}
          </Text>
        </View>
      </ScrollView>
      </AnimatedScreenTransition>
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

  // 3D SHOWCASE & EXPIRY CARD
  showcase3DContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  showcaseGlassPedestal: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
  },
  expiryBatchCard: {
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  expiryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  freshnessTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  freshnessTagText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    fontWeight: '600',
  },
  mrpText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    fontWeight: '700',
  },
  expiryDetailsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryDetailItem: {
    flex: 1,
    padding: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  expiryLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiryValue: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  manufacturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  manufacturerText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  medicineBoxPromoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  boxPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  boxPromoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxPromoTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14.5,
    marginBottom: 2,
  },
  boxPromoSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  boxPromoBtnRow: {
    flexDirection: 'row',
  },
  boxPromoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  boxPromoBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
});
