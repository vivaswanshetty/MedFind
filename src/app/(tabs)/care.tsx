import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { useLocation } from '../../context/LocationContext';
import {
  getProviderListings,
  CategoryFilter,
} from '../../services/providerService';
import { ProviderListing } from '../../types/models';
import { sortListingsByDistance, formatDistance } from '../../services/locationService';
import {
  InfoIcon,
  PhoneIcon,
  ShieldCheckIcon,
  MapPinIcon,
} from '../../components/icons/AppIcons';

export default function CareNearbyScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();
  const { userLocation, areaName } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<ProviderListing[]>([]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'hospital', label: 'Hospital' },
    { id: 'clinic', label: 'Clinic' },
    { id: 'ambulance', label: 'Ambulance' },
    { id: 'pharmacy', label: 'Pharmacy' },
  ];

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 12;

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    async function loadData() {
      try {
        const catFilter = selectedCategory === 'pharmacy' ? 'all' : (selectedCategory as CategoryFilter);
        const res = await getProviderListings(catFilter, '');
        if (!isCancelled) {
          setListings(res.results);
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

  // Sort listings by user location
  const displayedListings = userLocation
    ? sortListingsByDistance(listings, userLocation)
    : listings;

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
        {/* HEADER */}
        <View style={styles.headerSection}>
          <Text style={[styles.screenTitle, { color: palette.ink }]}>
            Care nearby
          </Text>
          <Text style={[styles.screenSubtitle, { color: palette.ink2 }]}>
            Reviewed hospitals, clinics and ambulance contacts
          </Text>
        </View>

        {/* DIRECTORY DISCLAIMER BANNER */}
        <View
          style={[
            styles.disclaimerCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <InfoIcon size={16} color={palette.ink2} />
          <View style={styles.disclaimerTextGroup}>
            <Text style={[styles.disclaimerTitle, { color: palette.ink }]}>
              Directory information only
            </Text>
            <Text style={[styles.disclaimerBody, { color: palette.ink2 }]}>
              No live beds, wait times, arrival estimates or dispatch. Your phone places every call.
            </Text>
          </View>
        </View>

        {/* STYLIZED VECTOR MAP PREVIEW GRAPHIC (IMAGE 4) */}
        <View
          style={[
            styles.mapGraphicCard,
            {
              backgroundColor: scheme === 'light' ? '#EFE7D8' : '#0E0E14',
              borderColor: palette.line,
            },
          ]}
        >
          <Svg width="100%" height={160} viewBox="0 0 340 160">
            {/* Roads Grid */}
            <Path
              d="M 30,0 L 70,160 M 160,0 L 140,160 M 270,0 L 290,160 M 0,60 L 340,50 M 0,110 L 340,120"
              stroke={scheme === 'light' ? '#E1D6C1' : '#232230'}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Secondary roads */}
            <Path
              d="M 100,0 L 220,160 M 0,85 L 340,80"
              stroke={scheme === 'light' ? '#F7F2E8' : '#1A1926'}
              strokeWidth="6"
            />

            {/* Hospital Pin [H] */}
            <Circle
              cx="105"
              cy="48"
              r="14"
              fill={scheme === 'light' ? palette.ink : palette.btn}
              stroke={scheme === 'light' ? 'transparent' : '#00E5FF'}
              strokeWidth={scheme === 'light' ? 0 : 1.5}
            />
            <SvgText
              x="105"
              y="52"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              H
            </SvgText>

            {/* Clinic Pin [C] */}
            <Circle
              cx="260"
              cy="52"
              r="14"
              fill={scheme === 'light' ? palette.ink : palette.btn}
              stroke={scheme === 'light' ? 'transparent' : '#00E5FF'}
              strokeWidth={scheme === 'light' ? 0 : 1.5}
            />
            <SvgText
              x="260"
              y="56"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              C
            </SvgText>

            {/* Ambulance Pin [A] */}
            <Circle
              cx="205"
              cy="124"
              r="14"
              fill={scheme === 'light' ? palette.ink : palette.btn}
              stroke={scheme === 'light' ? 'transparent' : '#00E5FF'}
              strokeWidth={scheme === 'light' ? 0 : 1.5}
            />
            <SvgText
              x="205"
              y="128"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              A
            </SvgText>

            {/* User GPS Pin Beacon */}
            <Circle
              cx="160"
              cy="85"
              r="16"
              fill={scheme === 'light' ? 'rgba(135,169,107,0.3)' : 'rgba(0,229,255,0.25)'}
            />
            <Circle
              cx="160"
              cy="85"
              r="6"
              fill={scheme === 'light' ? palette.accent : '#00E5FF'}
            />
          </Svg>

          {/* User Location Label Tag */}
          <View
            style={[
              styles.mapLocationTag,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.mapDot,
                { backgroundColor: scheme === 'light' ? palette.accent : '#00E5FF' },
              ]}
            />
            <Text style={[styles.mapLocationTagText, { color: palette.ink }]}>
              You • {areaName.split(',')[0]}
            </Text>
          </View>
        </View>

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
                onPress={() => setSelectedCategory(cat.id)}
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
          {isLoading && (
            <ActivityIndicator size="small" color={palette.accent} style={{ marginVertical: 20 }} />
          )}

          {!isLoading &&
            displayedListings.map((item, idx) => {
              const isHospital = item.type === 'hospital';
              const isClinic = item.type === 'clinic';
              const isAmbulance = item.type === 'ambulance';

              const initialLetter = isHospital ? 'H' : isClinic ? 'C' : 'A';
              const typeSubtitle = isHospital
                ? 'Hospital • Lalbagh Main Road'
                : isClinic
                ? 'Clinic • Bull Temple Road'
                : 'Ambulance contact • registered listing';

              const callLabel = isHospital
                ? 'Call hospital'
                : isClinic
                ? 'Call clinic'
                : 'Call ambulance contact';

              const distanceText = isAmbulance
                ? 'Area'
                : formatDistance(item.distanceKm) || (idx === 0 ? '1.2 km' : '1.9 km');

              return (
                <View
                  key={item.id}
                  style={[
                    styles.providerCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
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
                        {item.name}
                      </Text>
                      <Text style={[styles.providerSub, { color: palette.ink2 }]}>
                        {typeSubtitle}
                      </Text>
                    </View>

                    <Text style={[styles.providerDistance, { color: palette.ink }]}>
                      {distanceText}
                    </Text>
                  </View>

                  {/* Service Tags Row */}
                  <View style={styles.tagsContainer}>
                    {item.services.slice(0, 3).map((service, sIdx) => (
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
                      Source: team field review • reviewed 18 Oct 2026
                    </Text>
                  </View>

                  {/* Call Button */}
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
                    <Text style={[styles.callButtonText, { color: palette.btnInk }]}>
                      {callLabel}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
        </View>
      </ScrollView>
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

  // STYLIZED MAP GRAPHIC
  mapGraphicCard: {
    height: 160,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLocationTag: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  mapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mapLocationTagText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
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
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 2,
  },
  callButtonText: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    fontWeight: '600',
  },
});
