import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import { StatusChip } from '../../components/StatusChip';
import { useLocation } from '../../context/LocationContext';
import { AreaPickerModal } from '../../components/location/AreaPickerModal';
import {
  searchMedicineStock,
  MedicineSearchResultItem,
} from '../../services/medicineSearch';
import { sortListingsByDistance, formatDistanceOrNull, getRegionForCoordinates } from '../../services/locationService';
import { storageService } from '../../services/storageService';
import {
  getNearbyPharmacies,
  NearbyPlace,
  OSM_ATTRIBUTION,
} from '../../services/nearbyPlacesService';
import {
  BackArrowIcon,
  SearchIcon,
  ClearIcon,
  CloseIcon,
  TrashIcon,
  ShieldCheckIcon,
  InfoIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  DirectionsIcon,
} from '../../components/icons/AppIcons';

interface MedicineRecordGroup {
  medicineId: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  isExtendedRelease?: boolean;
  pharmacyCount: number;
  items: MedicineSearchResultItem[];
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { scheme, palette } = useTheme();
  const { userLocation, areaName, locationSource } = useLocation();
  const { t } = useLanguage();

  const userRegion = getRegionForCoordinates(userLocation);
  const isOutsideCoverage = userLocation !== null && userRegion === null;

  const [showAreaPickerModal, setShowAreaPickerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedStrength, setSelectedStrength] = useState<string>('');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MedicineSearchResultItem[]>([]);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [osmPharmacies, setOsmPharmacies] = useState<NearbyPlace[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);
  const [osmRetryCount, setOsmRetryCount] = useState(0);

  // Load recent searches from local device storage
  useEffect(() => {
    async function loadRecents() {
      const stored = await storageService.getRecentSearches();
      setRecentSearches(stored);
    }
    loadRecents();
  }, []);

  const handleClearAllRecents = async () => {
    await storageService.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = await storageService.removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearSearchInput = () => {
    setSearchQuery('');
    setSelectedStrength('');
    setSelectedDosageForm('');
  };

  const strengthOptions = ['250 mg', '500 mg', '650 mg', '1000 mg'];
  const dosageOptions = ['Tablet', 'Syrup', 'Inhaler', 'Cream', 'Drops'];
  const popularMedicines = [
    'Metformin 500 mg',
    'Paracetamol 500 mg',
    'Salbutamol inhaler',
    'Amoxicillin 500 mg',
    'Cetirizine 10 mg',
    'ORS sachet',
  ];

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // Sync params.q if passed from Home
  useEffect(() => {
    if (params.q) {
      setSearchQuery(params.q);
    }
  }, [params.q]);

  // Load search results only when query exists
  useEffect(() => {
    let isCancelled = false;
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSelectedRecordId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await searchMedicineStock(query, selectedDosageForm || 'All');
        if (!isCancelled) {
          setSearchResults(response.results);
          setIsSampleData(response.isSampleData ?? true);
          if (response.results.length > 0) {
            setSelectedRecordId((prev) => {
              const stillExists = response.results.some((r) => r.medicineId === prev);
              return stillExists ? prev : response.results[0].medicineId;
            });
          } else {
            setSelectedRecordId(null);
          }
          if (query.length >= 2) {
            const updated = await storageService.saveRecentSearch(query);
            if (!isCancelled && updated.length > 0) {
              setRecentSearches(updated);
            }
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedDosageForm]);

  // Dynamically group search results into matching records
  const dynamicGroups: MedicineRecordGroup[] = [];
  const seenMeds = new Set<string>();

  searchResults.forEach((item) => {
    if (!seenMeds.has(item.medicineId)) {
      seenMeds.add(item.medicineId);
      dynamicGroups.push({
        medicineId: item.medicineId,
        brandName: item.brandName || item.genericName,
        genericName: item.genericName,
        strength: item.strength || '',
        dosageForm: item.dosageForm || 'Tablet',
        pharmacyCount: 4,
        items: [item],
      });
    }
  });

  const hasQuery = searchQuery.trim().length > 0;

  // Filter groups by strength if selected
  let groups = dynamicGroups;
  if (selectedStrength) {
    groups = groups.filter((g) =>
      g.strength.toLowerCase().includes(selectedStrength.toLowerCase())
    );
  }

  // Active selected record
  const activeRecord = hasQuery
    ? groups.find((g) => g.medicineId === selectedRecordId) || groups[0] || null
    : null;

  const activeRecordResult = searchResults.find((r) => r.medicineId === activeRecord?.medicineId);
  const currentIsSample = activeRecordResult ? activeRecordResult.isSampleData : isSampleData;

  // Fetch real nearby pharmacies from OpenStreetMap when outside coverage and a medicine is selected
  useEffect(() => {
    if (!isOutsideCoverage || !userLocation || !activeRecord) {
      setOsmPharmacies([]);
      setOsmError(null);
      return;
    }

    let isCancelled = false;
    setOsmLoading(true);
    setOsmError(null);

    getNearbyPharmacies(userLocation)
      .then((pharmacies) => {
        if (!isCancelled) {
          setOsmPharmacies(pharmacies);
          setOsmLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setOsmError(err?.message || 'Unable to load nearby pharmacies from OpenStreetMap.');
          setOsmLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOutsideCoverage, userLocation?.latitude, userLocation?.longitude, activeRecord?.medicineId, osmRetryCount]);

  // Participating stores with verified coordinates around Basavanagudi
  const baseStores: Array<{
    id: string;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    latitude: number;
    longitude: number;
    distanceKm?: number;
    verifiedDate: string;
    toneStatus: 'available' | 'low_stock' | 'stale' | 'na';
    freshnessTone: 'ok' | 'warn' | 'stale' | 'na';
    freshnessLabel: string;
    statusLabel: string;
    verifyTimeText: string;
    callButtonLabel: string;
  }> = [
    {
      id: `${activeRecord?.medicineId || 'med'}-pharm-002`,
      pharmacyName: 'Lalbagh Road Pharmacy',
      pharmacyAddress: 'Lalbagh Main Road, Bengaluru',
      pharmacyPhone: '080-26702200',
      latitude: 12.9510,
      longitude: 77.5850,
      verifiedDate: '14 Oct',
      toneStatus: 'available',
      freshnessTone: 'ok',
      freshnessLabel: 'Recent',
      statusLabel: 'Available',
      verifyTimeText: 'Verified by pharmacy 12 min ago • 10:42 AM',
      callButtonLabel: 'Call pharmacy',
    },
    {
      id: `${activeRecord?.medicineId || 'med'}-pharm-003`,
      pharmacyName: 'Gandhi Bazaar Medicals',
      pharmacyAddress: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
      pharmacyPhone: '080-26613300',
      latitude: 12.9430,
      longitude: 77.5710,
      verifiedDate: '14 Oct',
      toneStatus: 'low_stock',
      freshnessTone: 'warn',
      freshnessLabel: 'Aging',
      statusLabel: 'Low stock',
      verifyTimeText: 'Verified by pharmacy 1 h 14 min ago • 9:40 AM',
      callButtonLabel: 'Call pharmacy',
    },
    {
      id: `${activeRecord?.medicineId || 'med'}-pharm-004`,
      pharmacyName: 'Bull Temple Care Pharmacy',
      pharmacyAddress: 'Bull Temple Road, Basavanagudi, Bengaluru',
      pharmacyPhone: '080-26624400',
      latitude: 12.9400,
      longitude: 77.5680,
      verifiedDate: '14 Oct',
      toneStatus: 'stale',
      freshnessTone: 'stale',
      freshnessLabel: 'Stale',
      statusLabel: 'Available',
      verifyTimeText: 'Update is 3 h old, call first • 7:54 AM',
      callButtonLabel: 'Call pharmacy',
    },
    {
      id: `${activeRecord?.medicineId || 'med'}-pharm-005`,
      pharmacyName: 'Basavanagudi Health Store',
      pharmacyAddress: 'Subbarama Chetty Road, Basavanagudi, Bengaluru',
      pharmacyPhone: '080-26601100',
      latitude: 12.9380,
      longitude: 77.5760,
      verifiedDate: '14 Oct',
      toneStatus: 'na',
      freshnessTone: 'na',
      freshnessLabel: 'No current record',
      statusLabel: 'Unknown',
      verifyTimeText: 'No valid stock update on file. Confirm with the pharmacy.',
      callButtonLabel: 'Call pharmacy',
    },
  ];

  // Verified pharmacy results for selected record (sorted by real distance within coverage; empty outside coverage)
  const pharmacyItems = isOutsideCoverage
    ? []
    : userLocation
    ? sortListingsByDistance(baseStores, userLocation)
    : baseStores;

  const handleDialer = async (phone: string, pharmacyName: string) => {
    if (!phone) {
      Alert.alert('Phone Unavailable', `Direct phone contact for ${pharmacyName} is not on public record.`);
      return;
    }
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Dialer Unavailable', `Cannot place calls to ${phone} from this device.`);
      }
    } catch {
      Alert.alert('Error', 'Unable to open phone dialer.');
    }
  };

  const handleDirections = async (
    name: string,
    address?: string | null,
    lat?: number,
    lng?: number
  ) => {
    const query = encodeURIComponent([name, address].filter(Boolean).join(', '));
    const url = Platform.select({
      ios: lat && lng
        ? `maps:0,0?daddr=${lat},${lng}`
        : `maps:0,0?daddr=${query}`,
      android: lat && lng
        ? `google.navigation:q=${lat},${lng}`
        : `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    });
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`);
      }
    } catch {
      Alert.alert('Directions Unavailable', 'Unable to open directions in map app.');
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TOP HEADER */}
        <View style={styles.topHeaderRow}>
          <View style={styles.topHeaderLeft}>
            <Pressable
              onPress={() => router.back()}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
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

            <Text style={[styles.screenTitle, { color: palette.ink }]}>
              {t('search_medicine_title', 'Search medicine')}
            </Text>
          </View>

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
              {locationSource === 'none' || isOutsideCoverage
                ? t('set_your_area', 'Set your area')
                : (areaName.split(',')[0] || 'Bengaluru')}
            </Text>
          </Pressable>
        </View>

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
            <View style={styles.bannerActionsRow}>
              <Pressable
                onPress={() => setShowAreaPickerModal(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Choose another area"
                style={[styles.bannerChooseBtn, { backgroundColor: palette.btn }]}
              >
                <Text style={[styles.bannerChooseBtnText, { color: palette.btnInk }]}>
                  {t('choose_another_area', 'Choose another area')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/emergency')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Emergency contacts"
                style={[
                  styles.bannerEmergencyBtn,
                  { backgroundColor: palette.surface, borderColor: palette.line },
                ]}
              >
                <PhoneIcon size={12} color={palette.red} />
                <Text style={[styles.bannerEmergencyBtnText, { color: palette.ink }]}>
                  {t('emergency_link', 'Emergency contacts')} →
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SEARCH INPUT BOX */}
        <View style={styles.searchBoxContainer}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: palette.surface,
                borderColor: palette.selBorder,
              },
            ]}
          >
            <SearchIcon size={20} color={palette.ink} />
            <TextInput
              style={[styles.textInput, { color: palette.ink }]}
              placeholder={t('search_placeholder', 'Search medicines (e.g. Dolo, Cough, Calpol)...')}
              placeholderTextColor={palette.ink2}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={handleClearSearchInput}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <ClearIcon size={18} color={palette.ink2} />
              </Pressable>
            )}
          </View>
          <Text style={[styles.inputSubtext, { color: palette.ink2 }]}>
            {t('search_subtext', 'Find medicines by brand or formula name.')}
          </Text>
        </View>

        {/* 1) RECENT & POPULAR MEDICINES (WHEN NO QUERY ENTERED) */}
        {!hasQuery && (
          <View style={styles.suggestionsContainer}>
            {/* A) RECENT SEARCHES (SAVED ON LOCAL DEVICE) */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeaderRow}>
                  <View style={styles.recentTitleGroup}>
                    <ClockIcon size={15} color={palette.ink2} />
                    <Text style={[styles.recentHeaderText, { color: palette.ink2 }]}>
                      {t('recent_searches_device', 'Recent, saved on this device only')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleClearAllRecents}
                    hitSlop={8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all recent searches"
                    style={({ pressed }) => [
                      styles.clearAllButton,
                      { opacity: pressed ? 0.6 : 1.0 },
                    ]}
                  >
                    <TrashIcon size={13} color={palette.ink2} />
                    <Text style={[styles.clearAllText, { color: palette.ink2 }]}>
                      {t('clear_all', 'Clear all')}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.chipsRow}>
                  {recentSearches.map((term) => (
                    <View
                      key={term}
                      style={[
                        styles.recentChipWrapper,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => {
                          setSearchQuery(term);
                          setSelectedStrength('');
                          setSelectedDosageForm('');
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Recent search: ${term}`}
                        style={({ pressed }) => [
                          styles.recentChipMain,
                          { opacity: pressed ? 0.8 : 1.0 },
                        ]}
                      >
                        <Text style={[styles.recentChipText, { color: palette.ink }]}>
                          {term}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleRemoveRecent(term)}
                        hitSlop={8}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${term} from recent searches`}
                        style={({ pressed }) => [
                          styles.recentChipRemove,
                          { opacity: pressed ? 0.5 : 1.0 },
                        ]}
                      >
                        <CloseIcon size={11} color={palette.ink2} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* B) COMMON MEDICINES */}
            <View style={styles.suggestionsHeaderRow}>
              <Text style={[styles.suggestionsHeaderText, { color: palette.ink2 }]}>
                {t('popular_medicines', 'Common medicines')}
              </Text>
            </View>
            <View style={styles.chipsRow}>
              {popularMedicines.map((medName) => (
                <Pressable
                  key={medName}
                  onPress={() => {
                    setSearchQuery(medName);
                    setSelectedStrength('');
                    setSelectedDosageForm('');
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${medName}`}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                      opacity: pressed ? 0.85 : 1.0,
                    },
                  ]}
                >
                  <Text style={[styles.suggestionChipText, { color: palette.ink }]}>
                    {medName}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Explanatory Guide Card */}
            <View
              style={[
                styles.guideCard,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <ShieldCheckIcon size={20} color={palette.okInk} />
              <View style={styles.guideCardTextGroup}>
                <Text style={[styles.guideCardTitle, { color: palette.ink }]}>
                  {currentIsSample ? t('sample_data_badge', 'Sample data') : t('verified_network', 'Verified Network')}
                </Text>
                <Text style={[styles.guideCardBody, { color: palette.ink2 }]}>
                  {currentIsSample ? t('sample_data_notice', 'Sample data for demonstration. Call the pharmacy to confirm stock.') : t('verified_network_desc', 'Stock reported directly by participating pharmacies.')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 2) STRENGTH FILTER CHIPS (WHEN QUERY ENTERED) */}
        {hasQuery && (
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: palette.ink2 }]}>
              {t('filter_dose', 'DOSE / STRENGTH')}
            </Text>
            <View style={styles.chipsRow}>
              {strengthOptions.map((st) => {
                const isSelected = selectedStrength === st;
                return (
                  <Pressable
                    key={st}
                    onPress={() => setSelectedStrength(isSelected ? '' : st)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Strength filter ${st}`}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? palette.btn : palette.surface,
                        borderColor: isSelected ? palette.selBorder : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? palette.btnInk : palette.ink },
                      ]}
                    >
                      {isSelected ? `✓ ${st}` : st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 3) DOSAGE FORM FILTER CHIPS (WHEN QUERY ENTERED) */}
        {hasQuery && (
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: palette.ink2 }]}>
              {t('filter_type', 'MEDICINE TYPE')}
            </Text>
            <View style={styles.chipsRow}>
              {dosageOptions.map((df) => {
                const isSelected = selectedDosageForm === df;
                return (
                  <Pressable
                    key={df}
                    onPress={() => setSelectedDosageForm(isSelected ? '' : df)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Dosage form filter ${df}`}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? palette.btn : palette.surface,
                        borderColor: isSelected ? palette.selBorder : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? palette.btnInk : palette.ink },
                      ]}
                    >
                      {isSelected ? `✓ ${df}` : df}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 4) LOADING INDICATOR */}
        {hasQuery && isLoading && (
          <ActivityIndicator
            size="small"
            color={palette.ink}
            style={{ marginVertical: 24 }}
          />
        )}

        {/* 5) EMPTY STATE (WHEN QUERY HAS NO MATCH) */}
        {hasQuery && !isLoading && groups.length === 0 && (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <SearchIcon size={28} color={palette.ink2} />
            <Text style={[styles.emptyTitle, { color: palette.ink }]}>
              {t('no_matching_records', 'No matching records')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: palette.ink2 }]}>
              {t('no_records_hint', "We couldn't find a record matching your search. Try checking the spelling or searching by generic formula.")}
            </Text>
            <Pressable
              onPress={() => setSearchQuery('')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('clear_search', 'Clear search')}
              style={[
                styles.emptyResetBtn,
                { backgroundColor: palette.surface2, borderColor: palette.line },
              ]}
            >
              <Text style={[styles.emptyResetText, { color: palette.ink }]}>
                {t('clear_search', 'Clear search')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* 6) MATCHING RECORDS (EXACT DESCRIPTION SELECTOR) */}
        {hasQuery && !isLoading && groups.length > 0 && (
          <View style={styles.recordsSection}>
            <View style={styles.recordsHeaderRow}>
              <Text style={[styles.recordsSectionTitle, { color: palette.ink }]}>
                {t('matching_records', 'Matching records')}
              </Text>
              <Text style={[styles.recordsCountText, { color: palette.ink2 }]}>
                {groups.length} {t('exact_descriptions', 'exact descriptions')}
              </Text>
            </View>

            {groups.map((record) => {
              const isSelected = selectedRecordId === record.medicineId;

              return (
                <Pressable
                  key={record.medicineId}
                  onPress={() => setSelectedRecordId(record.medicineId)}
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${record.brandName}, ${record.strength} ${record.dosageForm}`}
                  style={[
                    styles.recordCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: isSelected ? palette.selBorder : palette.line,
                      borderWidth: isSelected ? 1.8 : 1,
                    },
                  ]}
                >
                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? palette.btn : palette.line,
                        backgroundColor: isSelected ? palette.btn : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Text style={[styles.radioCheckmark, { color: palette.btnInk }]}>
                        ✓
                      </Text>
                    )}
                  </View>

                  {/* Record Details */}
                  <View style={styles.recordContent}>
                    <Text style={[styles.recordName, { color: palette.ink }]}>
                      {record.brandName}
                    </Text>
                    <Text style={[styles.recordMeta, { color: palette.ink2 }]}>
                      {record.strength} • {record.dosageForm}
                    </Text>

                    {record.isExtendedRelease ? (
                      <View
                        style={[
                          styles.diffFormBadge,
                          {
                            backgroundColor: palette.surface2,
                            borderColor: palette.line,
                          },
                        ]}
                      >
                        <Text style={[styles.diffFormText, { color: palette.ink2 }]}>
                          {t('diff_form_notice', 'Different formulation, not treated as equivalent')}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.recordHoldText, { color: palette.ink2 }]}>
                        {isOutsideCoverage
                          ? osmPharmacies.length > 0
                            ? `${osmPharmacies.length} nearby pharmacies on OpenStreetMap`
                            : 'Tap to find nearby pharmacies on OpenStreetMap'
                          : `${pharmacyItems.length} participating pharmacies hold a record`}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}



        {/* 8) PHARMACY RESULTS EXPANSION */}
        {hasQuery && !isLoading && activeRecord && (
          <View style={styles.resultsExpansionSection}>
            {/* Active Medicine Subhead */}
            <View style={styles.activeMedicineHeaderRow}>
              <View style={styles.activeMedicineTitleGroup}>
                <Text style={[styles.activeMedicinePrefix, { color: palette.ink2 }]}>
                  RESULTS FOR
                </Text>
                <Text style={[styles.activeMedicineTitle, { color: palette.ink }]}>
                  {activeRecord.brandName} {activeRecord.strength ? `• ${activeRecord.strength}` : ''} • {activeRecord.dosageForm}
                </Text>
              </View>
            </View>

            {isOutsideCoverage ? (
              osmLoading ? (
                <View
                  style={[
                    styles.outOfRegionResultCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={palette.accent} />
                  <Text style={[styles.outOfRegionResultSub, { color: palette.ink2, marginTop: 8 }]}>
                    Looking up nearby pharmacies on OpenStreetMap...
                  </Text>
                </View>
              ) : osmError ? (
                <View
                  style={[
                    styles.outOfRegionResultCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <InfoIcon size={24} color={palette.red} />
                  <Text style={[styles.outOfRegionResultTitle, { color: palette.ink }]}>
                    Unable to load nearby pharmacies
                  </Text>
                  <Text style={[styles.outOfRegionResultSub, { color: palette.ink2 }]}>
                    {osmError}
                  </Text>
                  <Pressable
                    onPress={() => setOsmRetryCount((c) => c + 1)}
                    style={[styles.outOfRegionChooseBtn, { backgroundColor: palette.btn, marginTop: 10 }]}
                  >
                    <Text style={[styles.outOfRegionChooseBtnText, { color: palette.btnInk }]}>
                      Retry
                    </Text>
                  </Pressable>
                </View>
              ) : osmPharmacies.length === 0 ? (
                <View
                  style={[
                    styles.outOfRegionResultCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <MapPinIcon size={24} color={palette.ink2} />
                  <Text style={[styles.outOfRegionResultTitle, { color: palette.ink }]}>
                    No nearby pharmacies found
                  </Text>
                  <Text style={[styles.outOfRegionResultSub, { color: palette.ink2 }]}>
                    No pharmacies were found within 10 km on OpenStreetMap for this location.
                  </Text>
                  <View style={styles.outOfRegionActionRow}>
                    <Pressable
                      onPress={() => setShowAreaPickerModal(true)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Choose another area"
                      style={[styles.outOfRegionChooseBtn, { backgroundColor: palette.btn }]}
                    >
                      <Text style={[styles.outOfRegionChooseBtnText, { color: palette.btnInk }]}>
                        {t('choose_another_area', 'Choose another area')}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/(tabs)/emergency')}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Emergency contacts"
                      style={[
                        styles.outOfRegionEmergencyBtn,
                        { backgroundColor: palette.surface2, borderColor: palette.line },
                      ]}
                    >
                      <PhoneIcon size={14} color={palette.red} />
                      <Text style={[styles.outOfRegionEmergencyText, { color: palette.ink }]}>
                        {t('emergency_link', 'Emergency contacts')} →
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  {/* Results Title Banner */}
                  <View
                    style={[
                      styles.noticeBanner,
                      {
                        backgroundColor: palette.surface2,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <MapPinIcon size={16} color={palette.okInk} />
                    <View style={styles.noticeBannerTextGroup}>
                      <Text style={[styles.noticeBannerTitle, { color: palette.ink }]}>
                        Real nearby pharmacies from OpenStreetMap
                      </Text>
                      <Text style={[styles.noticeBannerSubtitle, { color: palette.ink2 }]}>
                        Stock unknown. Call to check.
                      </Text>
                    </View>
                  </View>

                  {/* OSM Pharmacies Cards List */}
                  <View style={styles.pharmacyListContainer}>
                    {osmPharmacies.map((pharm) => {
                      const distanceStr = formatDistanceOrNull(pharm.distanceKm);

                      return (
                        <View
                          key={pharm.id}
                          style={[
                            styles.pharmacyCard,
                            {
                              backgroundColor: palette.surface,
                              borderColor: palette.line,
                            },
                          ]}
                        >
                          <View style={styles.pharmacyHeaderRow}>
                            <View style={styles.pharmacyTitleCol}>
                              <Text style={[styles.pharmacyName, { color: palette.ink }]}>
                                {pharm.name}
                              </Text>
                              {pharm.address ? (
                                <Text style={[styles.pharmacyAddress, { color: palette.ink2 }]}>
                                  {pharm.address}
                                </Text>
                              ) : null}
                            </View>
                            {distanceStr ? (
                              <View
                                style={[
                                  styles.distanceBadge,
                                  {
                                    backgroundColor: palette.surface2,
                                    borderColor: palette.line,
                                  },
                                ]}
                              >
                                <Text style={[styles.distanceText, { color: palette.ink }]}>
                                  {distanceStr}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Raw Opening Hours */}
                          {pharm.openingHours ? (
                            <View style={styles.osmHoursRow}>
                              <ClockIcon size={13} color={palette.ink2} />
                              <Text style={[styles.osmHoursText, { color: palette.ink2 }]}>
                                {pharm.openingHours} • from OpenStreetMap, may be out of date
                              </Text>
                            </View>
                          ) : null}

                          {/* Stock Status Notice (strictly "Stock unknown. Call to check.") */}
                          <View
                            style={[
                              styles.osmStockNoticeBox,
                              {
                                backgroundColor: palette.surface2,
                                borderColor: palette.line,
                              },
                            ]}
                          >
                            <InfoIcon size={14} color={palette.ink2} />
                            <Text style={[styles.osmStockNoticeText, { color: palette.ink }]}>
                              Stock unknown. Call to check.
                            </Text>
                          </View>

                          {/* Action Buttons: Call & Directions */}
                          <View style={styles.osmActionButtonsRow}>
                            {pharm.phone ? (
                              <Pressable
                                onPress={() => handleDialer(pharm.phone!, pharm.name)}
                                style={[styles.osmCallBtn, { backgroundColor: palette.btn }]}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`Call ${pharm.name}`}
                              >
                                <PhoneIcon size={14} color={palette.btnInk} />
                                <Text style={[styles.osmCallBtnText, { color: palette.btnInk }]}>
                                  Call pharmacy
                                </Text>
                              </Pressable>
                            ) : (
                              <View
                                style={[
                                  styles.osmCallBtnDisabled,
                                  { backgroundColor: palette.surface2, borderColor: palette.line },
                                ]}
                              >
                                <Text style={[styles.osmCallBtnDisabledText, { color: palette.ink2 }]}>
                                  No phone on record
                                </Text>
                              </View>
                            )}

                            <Pressable
                              onPress={() =>
                                handleDirections(
                                  pharm.name,
                                  pharm.address,
                                  pharm.coordinates.latitude,
                                  pharm.coordinates.longitude
                                )
                              }
                              style={[
                                styles.osmDirectionsBtn,
                                { backgroundColor: palette.surface2, borderColor: palette.line },
                              ]}
                              accessible={true}
                              accessibilityRole="button"
                              accessibilityLabel={`Get directions to ${pharm.name}`}
                            >
                              <DirectionsIcon size={14} color={palette.ink} />
                              <Text style={[styles.osmDirectionsBtnText, { color: palette.ink }]}>
                                Directions
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}

                    {/* Attribution */}
                    <View style={styles.osmAttributionContainer}>
                      <Text style={[styles.osmAttributionFooter, { color: palette.ink2 }]}>
                        {OSM_ATTRIBUTION}
                      </Text>
                    </View>
                  </View>
                </>
              )
            ) : (
              <>
                {/* Results Title Banner */}
                <View
              style={[
                styles.noticeBanner,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <ShieldCheckIcon size={16} color={palette.okInk} />
              <View style={styles.noticeBannerTextGroup}>
                <Text style={[styles.noticeBannerTitle, { color: palette.ink }]}>
                  {currentIsSample ? t('sample_data_badge', 'Sample data') : t('verified_network', 'Verified Network')}
                </Text>
                <Text style={[styles.noticeBannerBody, { color: palette.ink2 }]}>
                  {currentIsSample ? t('sample_data_notice', 'Sample data for demonstration. Call the pharmacy to confirm stock.') : t('verified_network_desc', 'Stock reported directly by participating pharmacies.')}
                </Text>
              </View>
            </View>

            {/* Results Subhead */}
            <View style={styles.resultsMetaRow}>
              <Text style={[styles.resultsCountHeading, { color: palette.ink }]}>
                {pharmacyItems.length} {pharmacyItems.length === 1 ? 'store found' : 'stores found'}
              </Text>
              {userLocation && !isOutsideCoverage ? (
                <Text style={[styles.resultsSortSubtext, { color: palette.ink2 }]}>
                  Sorted by nearest first
                </Text>
              ) : null}
            </View>

            {/* Pharmacy Cards List */}
            {pharmacyItems.map((item, idx) => {
              const distanceString = formatDistanceOrNull(item.distanceKm);
              const toneStatus = item.toneStatus;
              const statusLabel = item.statusLabel;
              const freshnessTone = item.freshnessTone;
              const freshnessLabel = item.freshnessLabel;
              const callButtonLabel = item.callButtonLabel;
              const verifyTimeText = item.verifyTimeText;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.pharmacyCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  {/* Top: Pharmacy Name & Distance */}
                  <View style={styles.pharmacyHeaderRow}>
                    <Text style={[styles.pharmacyName, { color: palette.ink }]}>
                      {item.pharmacyName}
                    </Text>
                    {distanceString ? (
                      <Text style={[styles.pharmacyDistance, { color: palette.ink }]}>
                        {distanceString}
                      </Text>
                    ) : null}
                  </View>

                  {/* Verification Tag */}
                  <View style={styles.pharmacyVerificationRow}>
                    <MapPinIcon size={12} color={palette.ink2} />
                    <Text style={[styles.pharmacyVerificationText, { color: palette.ink2 }]}>
                      Participating • verified 14 Oct
                    </Text>
                  </View>

                  {/* Status Chips Row */}
                  <View style={styles.statusChipsRow}>
                    <StatusChip tone={toneStatus} label={statusLabel} />
                    <StatusChip tone={freshnessTone} label={freshnessLabel} />
                  </View>

                  {/* Verification Timestamp */}
                  <Text style={[styles.verifyTimestampText, { color: palette.ink2 }]}>
                    {verifyTimeText}
                  </Text>

                  {/* Action Buttons Row */}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      onPress={() => handleDialer(item.pharmacyPhone, item.pharmacyName)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${callButtonLabel} for ${item.pharmacyName}`}
                      style={[
                        styles.callPharmacyBtn,
                        {
                          backgroundColor: palette.btn,
                          borderColor: palette.btnBorder,
                        },
                      ]}
                    >
                      <PhoneIcon size={16} color={palette.btnInk} />
                      <Text
                        style={[styles.callPharmacyBtnText, { color: palette.btnInk }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {callButtonLabel}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/medicine/[id]',
                          params: { id: item.id },
                        })
                      }
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${item.pharmacyName}`}
                      style={[
                        styles.detailsBtn,
                        {
                          backgroundColor: palette.surface2,
                          borderColor: palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.detailsBtnText, { color: palette.ink }]}
                        numberOfLines={1}
                      >
                        Details
                      </Text>
                      <ChevronRightIcon size={14} color={palette.ink} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* End of list statement */}
            <Text style={[styles.endOfListText, { color: palette.ink2 }]}>
              End of participating pharmacies for this medicine. Missing data is shown as Unknown, never as Available.
            </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
      </AnimatedScreenTransition>

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

  // TOP HEADER
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TARGET,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: radii.pill,
    borderWidth: 1.2,
    maxWidth: 160,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  locationPinBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  coverageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 2,
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

  // SEARCH BOX
  searchBoxContainer: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1.8,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
  },
  inputSubtext: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },

  // FILTER CHIPS
  filterSection: {
    gap: 8,
  },
  filterSectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },

  // MATCHING RECORDS
  recordsSection: {
    gap: 10,
  },
  recordsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  recordsSectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    fontWeight: '700',
  },
  recordsCountText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  recordCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: radii.card,
    gap: 12,
    alignItems: 'flex-start',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCheckmark: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  recordContent: {
    flex: 1,
    gap: 2,
  },
  recordName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
  },
  recordMeta: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  recordHoldText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: 4,
  },
  diffFormBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginTop: 6,
  },
  diffFormText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },

  // DISCLAIMER
  disclaimerBox: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },

  // RESULTS EXPANSION
  resultsExpansionSection: {
    gap: 14,
    marginTop: 8,
  },
  activeMedicineHeaderRow: {
    paddingVertical: 4,
  },
  activeMedicineTitleGroup: {
    gap: 3,
  },
  activeMedicinePrefix: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeMedicineTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  noticeBannerTextGroup: {
    flex: 1,
    gap: 2,
  },
  noticeBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeBannerBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  resultsMetaRow: {
    gap: 2,
  },
  resultsCountHeading: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  resultsSortSubtext: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },

  // PHARMACY CARD
  pharmacyCard: {
    padding: 16,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    gap: 10,
  },
  pharmacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  pharmacyName: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  pharmacyDistance: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  pharmacyVerificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pharmacyVerificationText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  verifyTimestampText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  callPharmacyBtn: {
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
  callPharmacyBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 46,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  detailsBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  endOfListText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 4,
  },

  // EMPTY & SUGGESTIONS SECTIONS
  suggestionsContainer: {
    gap: 14,
    marginTop: 4,
  },
  recentSection: {
    gap: 8,
    marginBottom: 6,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  recentHeaderText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.chip,
  },
  clearAllText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
  },
  recentChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TARGET,
    borderRadius: radii.chip,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
  },
  recentChipMain: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  recentChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  recentChipRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  suggestionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionsHeaderText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionChip: {
    minHeight: MIN_TARGET,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    marginTop: 8,
  },
  guideCardTextGroup: {
    flex: 1,
    gap: 4,
  },
  guideCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  guideCardBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
    marginVertical: 12,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyResetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyResetText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  bannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  bannerChooseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerChooseBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  bannerEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
  },
  bannerEmergencyBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  outOfRegionResultCard: {
    padding: 20,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  outOfRegionResultTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    textAlign: 'center',
  },
  outOfRegionResultSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  outOfRegionActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  outOfRegionChooseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfRegionChooseBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  outOfRegionEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  outOfRegionEmergencyText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  osmHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  osmHoursText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  osmStockNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginTop: 8,
  },
  osmStockNoticeText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  osmActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  osmCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  osmCallBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  osmCallBtnDisabled: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  osmCallBtnDisabledText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  osmDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  osmDirectionsBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  osmAttributionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  osmAttributionFooter: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  noticeBannerSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  pharmacyListContainer: {
    gap: 12,
  },
  pharmacyTitleCol: {
    flex: 1,
    gap: 2,
  },
  pharmacyAddress: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  distanceText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
});
