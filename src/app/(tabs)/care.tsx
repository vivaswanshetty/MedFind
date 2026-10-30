import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../../components/AnimatedScreenTransition';
import { useLocation } from '../../context/LocationContext';
import {
  getProviderListings,
  CategoryFilter,
} from '../../services/providerService';
import { ProviderListing } from '../../types/models';
import {
  sortListingsByDistance,
  formatDistanceOrNull,
  getRegionForCoordinates,
  searchPlacesWorldwide,
  PlaceSearchResult,
} from '../../services/locationService';
import { demoPharmacies } from '../../data/demoData';
import {
  ClockIcon,
  InfoIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MapPinIcon,
  DirectionsIcon,
  SearchIcon,
  CrosshairTargetIcon,
} from '../../components/icons/AppIcons';
import { InteractiveCareMap, MapMarkerItem } from '../../components/map/InteractiveCareMap';
import { AreaPickerModal } from '../../components/location/AreaPickerModal';
import {
  getNearbyPlaces,
  NearbyPlace,
  OSM_ATTRIBUTION,
} from '../../services/nearbyPlacesService';

export default function CareNearbyScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();
  const router = useRouter();
  const { userLocation, areaName, locationSource, requestGpsLocation, selectManualArea } = useLocation();
  const { t, formatNumber, tClinic } = useLanguage();

  const userRegion = getRegionForCoordinates(userLocation);
  const isOutsideCoverage = userLocation !== null && userRegion === null;

  const [showAreaPickerModal, setShowAreaPickerModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const mapInteractionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMapInteractionChange = React.useCallback((isInteracting: boolean) => {
    if (mapInteractionTimerRef.current) {
      clearTimeout(mapInteractionTimerRef.current);
      mapInteractionTimerRef.current = null;
    }
    if (Platform.OS === 'web') {
      // On web, scrolling uses the browser wheel/trackpad; never lock page scroll
      setIsMapInteracting(false);
      return;
    }
    setIsMapInteracting(isInteracting);
    if (isInteracting) {
      // Watchdog timeout to prevent touch state from permanently locking scroll
      mapInteractionTimerRef.current = setTimeout(() => {
        setIsMapInteracting(false);
      }, 1000);
    }
  }, []);

  const [osmPlaces, setOsmPlaces] = useState<NearbyPlace[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);
  const [osmRetryCount, setOsmRetryCount] = useState(0);

  // Quick Area / College Search Bar state
  const [locationSearchText, setLocationSearchText] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  useEffect(() => {
    const trimmed = locationSearchText.trim();
    if (trimmed.length < 2) {
      setLocationSearchResults([]);
      setIsSearchingLocation(false);
      return;
    }

    let isCancelled = false;
    setIsSearchingLocation(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesWorldwide(trimmed, 6);
        if (!isCancelled) {
          setLocationSearchResults(results);
        }
      } catch {
        if (!isCancelled) {
          setLocationSearchResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingLocation(false);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [locationSearchText]);

  const handleSelectSearchedLocation = async (place: PlaceSearchResult) => {
    await selectManualArea({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      isoCountryCode: place.isoCountryCode,
    });
    setLocationSearchText('');
    setLocationSearchResults([]);
  };

  const categories = [
    { id: 'all', label: t('all', 'All') },
    { id: 'hospital', label: `🏥 ${t('hospitals', 'Hospitals')}` },
    { id: 'clinic', label: `🩺 ${t('clinics', 'Clinics')}` },
    { id: 'ambulance', label: `🚑 ${t('ambulances', 'Ambulance')}` },
    { id: 'pharmacy', label: `💊 ${t('pharmacies', 'Pharmacies')}` },
  ];

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 12;

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    async function loadData() {
      try {
        if (selectedCategory === 'pharmacy') {
          const pharmacyListings: ProviderListing[] = demoPharmacies.map((p) => ({
            id: p.id,
            type: 'clinic',
            name: p.name,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            phone: p.phone,
            services: [p.opening_hours || 'Open Daily', 'Verified Medicine Dispensing'],
            source: p.source_type === 'provider_confirmed' ? 'Provider Confirmed' : 'Verified Directory',
            reviewed_at: p.verified_at || '2026-10-22T00:00:00.000Z',
            is_demo: false,
          }));
          if (!isCancelled) {
            setListings(pharmacyListings);
          }
        } else {
          const catFilter = selectedCategory as CategoryFilter;
          const res = await getProviderListings(catFilter, '');
          if (!isCancelled) {
            if (selectedCategory === 'all') {
              // Combine care facilities with verified community pharmacies
              const pharmacyListings: ProviderListing[] = demoPharmacies.map((p) => ({
                id: p.id,
                type: 'clinic',
                name: p.name,
                address: p.address,
                latitude: p.latitude,
                longitude: p.longitude,
                phone: p.phone,
                services: [p.opening_hours || 'Open Daily', 'Verified Medicine Dispensing'],
                source: 'Verified Pharmacy Directory',
                reviewed_at: p.verified_at || '2026-10-22T00:00:00.000Z',
                is_demo: false,
              }));
              setListings([...res.results, ...pharmacyListings]);
            } else {
              setListings(res.results);
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
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedCategory]);

  // Fetch real nearby healthcare facilities from OpenStreetMap when outside Bengaluru coverage
  useEffect(() => {
    if (!isOutsideCoverage || !userLocation) {
      setOsmPlaces([]);
      setOsmError(null);
      return;
    }

    let isCancelled = false;
    setOsmLoading(true);
    setOsmError(null);

    getNearbyPlaces(userLocation)
      .then((places) => {
        if (!isCancelled) {
          setOsmPlaces(places);
          setOsmLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setOsmError(err?.message || 'Unable to load nearby places from OpenStreetMap.');
          setOsmLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOutsideCoverage, userLocation?.latitude, userLocation?.longitude, osmRetryCount]);

  // Filter OSM places by selected category
  const filteredOsmPlaces = selectedCategory === 'all'
    ? osmPlaces
    : selectedCategory === 'hospital'
    ? osmPlaces.filter((p) => p.type === 'hospital')
    : selectedCategory === 'clinic'
    ? osmPlaces.filter((p) => p.type === 'clinic')
    : selectedCategory === 'pharmacy'
    ? osmPlaces.filter((p) => p.type === 'pharmacy')
    : [];

  const osmMapMarkers: MapMarkerItem[] = filteredOsmPlaces.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    latitude: item.coordinates.latitude,
    longitude: item.coordinates.longitude,
    subtitle: item.address || undefined,
    distanceKm: item.distanceKm ?? undefined,
  }));

  // Determine if we have real OSM places to show outside coverage
  const hasOsmResults = isOutsideCoverage && filteredOsmPlaces.length > 0;

  // Active listings to display:
  // If we have OSM places, we render filteredOsmPlaces in the OSM section.
  // Otherwise (inside coverage OR outside coverage when OSM hasn't returned places),
  // we display the verified healthcare directory sorted by distance!
  const displayedListings = hasOsmResults
    ? []
    : userLocation
    ? sortListingsByDistance(listings, userLocation)
    : listings;

  // Build dynamic map markers:
  // If we have OSM places, use osmMapMarkers.
  // Otherwise, use all verified listings (clinics, hospitals, ambulances, pharmacies).
  const verifiedMapMarkers: MapMarkerItem[] = (
    userLocation ? sortListingsByDistance(listings, userLocation) : listings
  )
    .filter((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')
    .map((item) => {
      const isPharm = item.id.startsWith('pharm-') || (item as any).type === 'pharmacy';
      const markerType: 'hospital' | 'clinic' | 'ambulance' | 'pharmacy' = isPharm
        ? 'pharmacy'
        : item.type === 'hospital'
        ? 'hospital'
        : item.type === 'clinic'
        ? 'clinic'
        : 'ambulance';

      return {
        id: item.id,
        type: markerType,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        subtitle: item.address,
        distanceKm: item.distanceKm,
      };
    });

  const mapMarkers: MapMarkerItem[] = hasOsmResults ? osmMapMarkers : verifiedMapMarkers;

  const selectedListing = !hasOsmResults
    ? displayedListings.find((l) => l.id === selectedPin)
    : null;
  const selectedOsmPlace = hasOsmResults
    ? filteredOsmPlaces.find((p) => p.id === selectedPin)
    : null;

  const handleCallPress = async (phone: string, providerName: string) => {
    if (!phone) {
      Alert.alert('Phone Unavailable', `Direct phone contact for ${providerName} is not on record.`);
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

  const handleOpenMapApp = async () => {
    const lat = userLocation?.latitude ?? 12.9416;
    const lng = userLocation?.longitude ?? 77.5738;
    const label = encodeURIComponent(`Hospitals and Clinics near ${areaName.split(',')[0]}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=hospitals+clinics`,
      default: `https://www.google.com/maps/search/hospitals+clinics/@${lat},${lng},14z`,
    });
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://www.google.com/maps/search/hospitals+clinics/@${lat},${lng},14z`);
      }
    } catch {
      Alert.alert('Maps Unavailable', 'Unable to launch map application.');
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

  const handlePinpointLocation = async (coords: { latitude: number; longitude: number }, localityName?: string) => {
    const name = localityName || areaName.split(',')[0] || 'Pinpointed Location';
    await selectManualArea({
      name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      isoCountryCode: 'IN',
    });
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <ScrollView
        style={styles.scrollArea}
        scrollEnabled={Platform.OS === 'web' ? true : !isMapInteracting}
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
        <View style={styles.headerSection}>
          <Text style={[styles.screenTitle, { color: palette.ink }]}>
            {t('care_title', 'Care nearby')}
          </Text>
          <Text style={[styles.screenSubtitle, { color: palette.ink2 }]}>
            {t('care_subtitle', 'Verified hospitals, clinics, ambulance contacts & pharmacies')}
          </Text>
        </View>

        {/* VERIFIED HEALTHCARE DIRECTORY ASSURANCE */}
        {hasOsmResults ? (
          <View
            style={[
              styles.disclaimerCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <ShieldCheckIcon size={18} color={palette.accent} />
            <View style={styles.disclaimerTextGroup}>
              <Text style={[styles.disclaimerTitle, { color: palette.ink }]}>
                {t('osm_care_title', 'Nearby healthcare from OpenStreetMap')}
              </Text>
              <Text style={[styles.disclaimerBody, { color: palette.ink2 }]}>
                {t('osm_care_body', 'Real hospitals, clinics, and pharmacies. Call ahead to confirm hours, emergency availability, or stock.')}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.disclaimerCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <ShieldCheckIcon size={18} color={palette.okInk} />
            <View style={styles.disclaimerTextGroup}>
              <Text style={[styles.disclaimerTitle, { color: palette.ink }]}>
                {isOutsideCoverage
                  ? 'Showing verified healthcare directory'
                  : t('sample_care_network', 'Sample healthcare directory for demonstration')}
              </Text>
              <Text style={[styles.disclaimerBody, { color: palette.ink2 }]}>
                {isOutsideCoverage
                  ? 'Direct phone numbers for hospitals, clinics, ambulance services & pharmacies.'
                  : t('direct_phone_numbers', 'Direct phone numbers for hospitals, clinics, ambulance services & pharmacies.')}
              </Text>
            </View>
          </View>
        )}

        {/* DIRECT AREA / COLLEGE / LANDMARK SEARCH BAR */}
        <View style={styles.locationSearchSection}>
          <View
            style={[
              styles.locationSearchBar,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <SearchIcon size={16} color={palette.accent} />
            <TextInput
              style={[
                styles.locationSearchInput,
                {
                  color: palette.ink,
                  fontFamily: fonts.sans,
                },
              ]}
              placeholder="Search college, area, or landmark (e.g. BMS College)..."
              placeholderTextColor={palette.ink2}
              value={locationSearchText}
              onChangeText={setLocationSearchText}
              returnKeyType="search"
            />
            {isSearchingLocation && (
              <ActivityIndicator size="small" color={palette.accent} style={{ marginLeft: 6 }} />
            )}
            {locationSearchText.length > 0 && !isSearchingLocation && (
              <Pressable
                onPress={() => {
                  setLocationSearchText('');
                  setLocationSearchResults([]);
                }}
                hitSlop={8}
                style={styles.clearSearchBtn}
              >
                <Text style={{ color: palette.ink2, fontSize: 13, fontWeight: '700' }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Autocomplete Suggestions Dropdown */}
          {locationSearchResults.length > 0 && (
            <View
              style={[
                styles.locationSuggestionsCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                  shadowColor: palette.shadow,
                },
              ]}
            >
              {locationSearchResults.map((place, idx) => (
                <Pressable
                  key={`${place.name}-${idx}`}
                  onPress={() => handleSelectSearchedLocation(place)}
                  style={({ pressed }) => [
                    styles.locationSuggestionRow,
                    {
                      borderBottomColor: palette.line,
                      backgroundColor: pressed ? palette.surface2 : 'transparent',
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${place.name}`}
                >
                  <MapPinIcon size={16} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.suggestionTitle, { color: palette.ink, fontFamily: fonts.sansBold }]} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={[styles.suggestionSub, { color: palette.ink2, fontFamily: fonts.sans }]} numberOfLines={1}>
                      {place.locality}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Active Manual Area Banner with quick reset to GPS */}
          {locationSource === 'manual_area' && areaName !== 'No area set' && (
            <View
              style={[
                styles.activeLocationBanner,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <View style={styles.activeLocationLeft}>
                <MapPinIcon size={14} color={palette.accent} />
                <Text
                  style={[styles.activeLocationText, { color: palette.ink, fontFamily: fonts.sansSemi }]}
                  numberOfLines={1}
                >
                  Showing resources near: <Text style={{ fontFamily: fonts.sansBold }}>{areaName.split(',')[0]}</Text>
                </Text>
              </View>

              <Pressable
                onPress={requestGpsLocation}
                style={({ pressed }) => [
                  styles.resetGpsBtn,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    opacity: pressed ? 0.75 : 1.0,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Switch back to current device GPS location"
              >
                <Text style={[styles.resetGpsBtnText, { color: palette.accent, fontFamily: fonts.sansBold }]}>
                  Use Live GPS
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* INBUILT DYNAMIC & INTERACTIVE MAP (SWIGGY/ZOMATO STYLE) */}
        <InteractiveCareMap
          userLocation={userLocation}
          areaName={areaName}
          locationSource={locationSource}
          markers={mapMarkers}
          selectedPin={selectedPin}
          onSelectPin={(id) => {
            setSelectedPin(id);
          }}
          onOpenExternalMap={handleOpenMapApp}
          onInteractionChange={handleMapInteractionChange}
          onRequestLocation={requestGpsLocation}
          onPressArea={() => setShowAreaPickerModal(true)}
          onPinpointLocation={handlePinpointLocation}
          region={userRegion?.name || 'Bengaluru'}
        />

        {/* INTERACTIVE PIN SELECTION CALLOUT */}
        {selectedListing && (
          <View
            style={[
              styles.pinCalloutCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.selBorder,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.pinCalloutInfo}>
              <View style={styles.pinTitleRow}>
                <Text style={[styles.pinCalloutTitle, { color: palette.ink }]}>
                  {selectedListing.id.startsWith('pharm-')
                    ? '💊 '
                    : selectedListing.type === 'hospital'
                    ? '🏥 '
                    : selectedListing.type === 'clinic'
                    ? '🩺 '
                    : '🚑 '}
                  {selectedListing.name}
                </Text>
                <Pressable
                  onPress={() => setSelectedPin(null)}
                  hitSlop={8}
                  style={styles.closeCalloutBtn}
                >
                  <Text style={[styles.closeCalloutText, { color: palette.ink2 }]}>✕</Text>
                </Pressable>
              </View>
              <Text style={[styles.pinCalloutMeta, { color: palette.ink2 }]}>
                {formatDistanceOrNull(selectedListing.distanceKm) ? `${formatDistanceOrNull(selectedListing.distanceKm)} • ` : ''}
                {selectedListing.address}
              </Text>
            </View>
            <View style={styles.pinCalloutButtons}>
              <Pressable
                onPress={() => handleCallPress(selectedListing.phone, selectedListing.name)}
                style={[styles.pinCalloutCallBtn, { backgroundColor: palette.btn }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call ${selectedListing.name}`}
              >
                <PhoneIcon size={14} color={palette.btnInk} />
                <Text style={[styles.pinCalloutCallText, { color: palette.btnInk }]}>Call</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  handleDirections(
                    selectedListing.name,
                    selectedListing.address,
                    selectedListing.latitude,
                    selectedListing.longitude
                  )
                }
                style={[styles.pinCalloutDirBtn, { backgroundColor: palette.surface2, borderColor: palette.line }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${selectedListing.name}`}
              >
                <DirectionsIcon size={14} color={palette.ink} />
                <Text style={[styles.pinCalloutDirText, { color: palette.ink }]}>Directions</Text>
              </Pressable>
            </View>
          </View>
        )}

        {selectedOsmPlace && (
          <View
            style={[
              styles.pinCalloutCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.selBorder,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.pinCalloutInfo}>
              <View style={styles.pinTitleRow}>
                <Text style={[styles.pinCalloutTitle, { color: palette.ink }]}>
                  {selectedOsmPlace.type === 'pharmacy'
                    ? '💊 '
                    : selectedOsmPlace.type === 'hospital'
                    ? '🏥 '
                    : '🩺 '}
                  {selectedOsmPlace.name}
                </Text>
                <Pressable
                  onPress={() => setSelectedPin(null)}
                  hitSlop={8}
                  style={styles.closeCalloutBtn}
                >
                  <Text style={[styles.closeCalloutText, { color: palette.ink2 }]}>✕</Text>
                </Pressable>
              </View>
              <Text style={[styles.pinCalloutMeta, { color: palette.ink2 }]}>
                {formatDistanceOrNull(selectedOsmPlace.distanceKm) ? `${formatDistanceOrNull(selectedOsmPlace.distanceKm)} • ` : ''}
                {selectedOsmPlace.address || 'Address not listed'}
              </Text>
              {selectedOsmPlace.hasEmergencyDepartment && (
                <View style={[styles.emergencyBadge, { backgroundColor: palette.badTint, borderColor: palette.redLine }]}>
                  <Text style={[styles.emergencyBadgeText, { color: palette.badInk }]}>
                    🚨 Emergency Department
                  </Text>
                </View>
              )}
              <View style={[styles.osmStockBox, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                <Text style={[styles.osmStockText, { color: palette.ink2 }]}>
                  Stock unknown. Call to check.
                </Text>
              </View>
            </View>
            <View style={styles.pinCalloutButtons}>
              {selectedOsmPlace.phone ? (
                <Pressable
                  onPress={() => handleCallPress(selectedOsmPlace.phone!, selectedOsmPlace.name)}
                  style={[styles.pinCalloutCallBtn, { backgroundColor: palette.btn }]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${selectedOsmPlace.name}`}
                >
                  <PhoneIcon size={14} color={palette.btnInk} />
                  <Text style={[styles.pinCalloutCallText, { color: palette.btnInk }]}>Call</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() =>
                  handleDirections(
                    selectedOsmPlace.name,
                    selectedOsmPlace.address,
                    selectedOsmPlace.coordinates.latitude,
                    selectedOsmPlace.coordinates.longitude
                  )
                }
                style={[
                  styles.pinCalloutDirBtn,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                    flex: selectedOsmPlace.phone ? undefined : 1,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${selectedOsmPlace.name}`}
              >
                <DirectionsIcon size={14} color={palette.ink} />
                <Text style={[styles.pinCalloutDirText, { color: palette.ink }]}>Directions</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* CATEGORY FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsRow}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setSelectedPin(null);
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter care directory by ${cat.label}`}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? palette.btn : palette.surface,
                    borderColor: isSelected ? palette.selBorder : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isSelected ? palette.btnInk : palette.ink },
                  ]}
                >
                  {isSelected ? `✓ ${cat.label}` : cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* PROVIDER LISTINGS */}
        <View style={styles.listingsSection}>
          {hasOsmResults ? (
            <>
              {filteredOsmPlaces.map((item) => {
                  const isSelected = selectedPin === item.id;
                  const isPharm = item.type === 'pharmacy';
                  const isHospital = item.type === 'hospital';
                  const initialLetter = isPharm ? 'P' : isHospital ? 'H' : 'C';
                  const typeSubtitle = isPharm
                    ? 'Pharmacy • OpenStreetMap'
                    : isHospital
                    ? 'Hospital • OpenStreetMap'
                    : 'Clinic • OpenStreetMap';

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.providerCard,
                        {
                          backgroundColor: palette.surface,
                          borderColor: isSelected ? palette.selBorder : palette.line,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => setSelectedPin(item.id)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${item.name} on map`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1.0 }]}
                      >
                        {/* Top Row: Initial Badge, Name & Distance */}
                        <View style={styles.providerHeaderRow}>
                          <View
                            style={[
                              styles.initialBadge,
                              {
                                backgroundColor: scheme === 'light' ? palette.ink : palette.btn,
                              },
                            ]}
                          >
                            <Text style={[styles.initialBadgeText, { color: '#FFFFFF' }]}>
                              {initialLetter}
                            </Text>
                          </View>

                          <View style={styles.providerNameGroup}>
                            <Text style={[styles.providerName, { color: palette.ink }]}>
                              {tClinic(item.name)}
                            </Text>
                            <Text style={[styles.providerSub, { color: palette.ink2 }]}>
                              {typeSubtitle}
                            </Text>
                          </View>

                          {formatDistanceOrNull(item.distanceKm) ? (
                            <Text style={[styles.providerDistance, { color: palette.ink }]}>
                              {formatNumber(formatDistanceOrNull(item.distanceKm)!)}
                            </Text>
                          ) : null}
                        </View>

                        {/* Emergency Department Badge (hospitals only when emergency=yes) */}
                        {item.hasEmergencyDepartment && (
                          <View style={[styles.emergencyBadge, { backgroundColor: palette.badTint, borderColor: palette.redLine }]}>
                            <Text style={[styles.emergencyBadgeText, { color: palette.badInk }]}>
                              🚨 Emergency Department
                            </Text>
                          </View>
                        )}

                        {/* Address */}
                        {item.address ? (
                          <Text style={[styles.providerAddress, { color: palette.ink2 }]}>
                            {item.address}
                          </Text>
                        ) : null}

                        {/* Opening hours raw text */}
                        {item.openingHours ? (
                          <View style={styles.osmHoursRow}>
                            <ClockIcon size={13} color={palette.ink2} />
                            <Text style={[styles.osmHoursText, { color: palette.ink2 }]}>
                              {item.openingHours} (from OpenStreetMap, may be out of date)
                            </Text>
                          </View>
                        ) : null}

                        {/* Stock status - requirement 4: always show Stock unknown. Call to check. */}
                        <View style={[styles.osmStockBox, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                          <Text style={[styles.osmStockText, { color: palette.ink2 }]}>
                            Stock unknown. Call to check.
                          </Text>
                        </View>
                      </Pressable>

                      {/* Action buttons: Call & Directions */}
                      <View style={styles.cardActionsRow}>
                        {item.phone ? (
                          <Pressable
                            onPress={() => handleCallPress(item.phone!, item.name)}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Call ${item.name}`}
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
                              ellipsizeMode="tail"
                            >
                              Call
                            </Text>
                          </Pressable>
                        ) : null}

                        <Pressable
                          onPress={() =>
                            handleDirections(
                              item.name,
                              item.address,
                              item.coordinates.latitude,
                              item.coordinates.longitude
                            )
                          }
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Get directions to ${item.name}`}
                          style={({ pressed }) => [
                            styles.directionsBtn,
                            {
                              backgroundColor: palette.surface2,
                              borderColor: palette.line,
                              opacity: pressed ? 0.85 : 1.0,
                              flex: item.phone ? undefined : 1,
                            },
                          ]}
                        >
                          <DirectionsIcon size={16} color={palette.ink} />
                          <Text
                            style={[styles.directionsBtnText, { color: palette.ink }]}
                            numberOfLines={1}
                          >
                            Directions
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}

              {/* Requirement 7: Attribution */}
              <View style={styles.osmAttributionContainer}>
                <Text style={[styles.osmAttributionFooter, { color: palette.ink2 }]}>
                  {OSM_ATTRIBUTION}
                </Text>
              </View>
            </>
          ) : (
            <>
              {isOutsideCoverage && osmLoading && (
                <View style={{ paddingVertical: 10, alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color={palette.accent} />
                  <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.ink2 }}>
                    Checking OpenStreetMap for nearby facilities...
                  </Text>
                </View>
              )}

              {isLoading && (
                <ActivityIndicator size="small" color={palette.accent} style={{ marginVertical: 20 }} />
              )}

              {!isLoading &&
                displayedListings.map((item, idx) => {
                  const isSelected = selectedPin === item.id;
                  const isPharm = item.id.startsWith('pharm-');
                  const isHospital = item.type === 'hospital';
                  const isClinic = item.type === 'clinic' && !isPharm;
                  const isAmbulance = item.type === 'ambulance';
                  const isNearest = idx === 0 && Boolean(item.distanceKm && item.distanceKm < 40);
                  const hasScanning = item.services.some((s) => /scan|mri|ct|ultrasound|x-ray|radiology|pet-ct/i.test(s));

                  const initialLetter = isPharm ? 'P' : isHospital ? 'H' : isClinic ? 'C' : 'A';
                  const typeSubtitle = isPharm
                    ? 'Sample Pharmacy • Demo Data'
                    : isHospital
                    ? 'Sample Hospital • Demo Data'
                    : isClinic
                    ? 'Sample Clinic • Demo Data'
                    : 'Sample Ambulance Contact • Demo Data';

                  const callLabel = isPharm
                    ? 'Call pharmacy'
                    : isHospital
                    ? 'Call hospital'
                    : isClinic
                    ? 'Call clinic'
                    : 'Call ambulance';

                  const distanceText = isAmbulance
                    ? 'Area'
                    : formatDistanceOrNull(item.distanceKm);

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.providerCard,
                        {
                          backgroundColor: palette.surface,
                          borderColor: isSelected
                            ? palette.selBorder
                            : isNearest
                            ? palette.accent
                            : palette.line,
                          borderWidth: isSelected || isNearest ? 1.6 : 1,
                        },
                      ]}
                    >
                      {/* Nearest Proximity Top Ribbon */}
                      {isNearest && distanceText && (
                        <View style={[styles.nearestLiveBadge, { backgroundColor: palette.okTint, borderColor: palette.okLine }]}>
                          <Text style={[styles.nearestLiveText, { color: palette.okInk }]}>
                            📍 Nearest to live location • {formatNumber(distanceText)}
                          </Text>
                        </View>
                      )}

                      <Pressable
                        onPress={() => setSelectedPin(item.id)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${item.name} on map`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1.0 }]}
                      >
                        {/* Top Row: Initial Badge, Facility Name & Distance */}
                        <View style={styles.providerHeaderRow}>
                          <View
                            style={[
                              styles.initialBadge,
                              {
                                backgroundColor:
                                  scheme === 'light' ? palette.ink : palette.btn,
                              },
                            ]}
                          >
                            <Text style={[styles.initialBadgeText, { color: '#FFFFFF' }]}>
                              {initialLetter}
                            </Text>
                          </View>

                          <View style={styles.providerNameGroup}>
                            <Text style={[styles.providerName, { color: palette.ink }]}>
                              {tClinic(item.name)}
                            </Text>
                            <Text style={[styles.providerSub, { color: palette.ink2 }]}>
                              {typeSubtitle}
                            </Text>
                          </View>

                          {distanceText ? (
                            <View style={[styles.distancePillBadge, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                              <Text style={[styles.providerDistance, { color: palette.ink }]}>
                                📍 {formatNumber(distanceText)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Special Scanning / Diagnostics Tag if available */}
                        {hasScanning && (
                          <View style={styles.scanningHighlightRow}>
                            <View style={[styles.scanningTag, { backgroundColor: scheme === 'dark' ? 'rgba(0, 229, 255, 0.12)' : 'rgba(59, 10, 107, 0.08)', borderColor: scheme === 'dark' ? 'rgba(0, 229, 255, 0.35)' : 'rgba(59, 10, 107, 0.22)' }]}>
                              <Text style={[styles.scanningTagText, { color: scheme === 'dark' ? '#00E5FF' : '#5A3E2B' }]}>
                                🔬 Advanced CT / MRI & Diagnostic Scans
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Service Tags Row */}
                        <View style={styles.tagsContainer}>
                          {item.services.slice(0, 4).map((service, sIdx) => (
                            <View
                              key={`${service}-${sIdx}`}
                              style={[
                                styles.servicePill,
                                {
                                  backgroundColor: palette.surface2,
                                  borderColor: palette.line,
                                },
                              ]}
                            >
                              <Text style={[styles.servicePillText, { color: palette.ink2 }]}>
                                {service}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Source Attribution */}
                        <View style={styles.sourceAttributionRow}>
                          <ShieldCheckIcon size={13} color={palette.ink2} />
                          <Text style={[styles.sourceAttributionText, { color: palette.ink2 }]}>
                            Sample data • Bengaluru network demo
                          </Text>
                        </View>
                      </Pressable>

                      {/* Action Buttons: Call & Directions */}
                      <View style={styles.cardActionsRow}>
                        <Pressable
                          onPress={() => handleCallPress(item.phone, item.name)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`${callLabel} for ${item.name}`}
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
                            ellipsizeMode="tail"
                          >
                            {callLabel}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            handleDirections(
                              item.name,
                              item.address,
                              item.latitude,
                              item.longitude
                            )
                          }
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Get directions to ${item.name}`}
                          style={({ pressed }) => [
                            styles.directionsBtn,
                            {
                              backgroundColor: palette.surface2,
                              borderColor: palette.line,
                              opacity: pressed ? 0.85 : 1.0,
                            },
                          ]}
                        >
                          <DirectionsIcon size={16} color={palette.ink} />
                          <Text
                            style={[styles.directionsBtnText, { color: palette.ink }]}
                            numberOfLines={1}
                          >
                            {t('directions', 'Directions')}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
            </>
          )}
        </View>
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

  // HEADER
  headerSection: {
    gap: 4,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },

  // DISCLAIMER
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  disclaimerTextGroup: {
    flex: 1,
    gap: 2,
  },
  disclaimerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },

  // PIN CALLOUT CARD
  pinCalloutCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pinCalloutInfo: {
    gap: 3,
  },
  pinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinCalloutTitle: {
    fontFamily: fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  closeCalloutBtn: {
    padding: 4,
  },
  closeCalloutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinCalloutMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  pinCalloutButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pinCalloutCallBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pinCalloutCallText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },
  pinCalloutDirBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pinCalloutDirText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },

  // CATEGORY CHIPS
  categoryChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },

  // PROVIDER CARD
  listingsSection: {
    gap: 14,
  },
  providerCard: {
    padding: 16,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    gap: 12,
  },
  providerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  initialBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
  },
  providerNameGroup: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
  },
  providerSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  providerDistance: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  servicePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  servicePillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
  },
  sourceAttributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceAttributionText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  callButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  directionsBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directionsBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    fontWeight: '600',
  },
  outOfRegionCard: {
    padding: 24,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
  },
  outOfRegionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '700',
  },
  outOfRegionNotice: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  outOfRegionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chooseAreaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseAreaBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  emergencyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  emergencyLinkText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  providerAddress: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  emergencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emergencyBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },
  osmHoursRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  osmHoursText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  osmStockBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  osmStockText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  osmAttributionContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  osmAttributionFooter: {
    fontFamily: fonts.sans,
    fontSize: 12,
    textAlign: 'center',
  },
  nearestLiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  nearestLiveText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  distancePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  scanningHighlightRow: {
    marginTop: 6,
    marginBottom: 4,
  },
  scanningTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  scanningTagText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  locationSearchSection: {
    marginBottom: 10,
    position: 'relative',
    zIndex: 40,
  },
  locationSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
  },
  locationSuggestionsCard: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderRadius: radii.card,
    borderWidth: 1,
    maxHeight: 220,
    zIndex: 100,
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  locationSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  activeLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginTop: 8,
  },
  activeLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activeLocationText: {
    fontSize: 12,
    flex: 1,
  },
  resetGpsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  resetGpsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

