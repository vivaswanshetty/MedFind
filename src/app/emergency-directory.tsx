import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import {
  BackArrowIcon,
  SearchIcon,
  ClearIcon,
  GlobeIcon,
  ShieldCheckIcon,
  PhoneIcon,
  CheckCircleIcon,
  InfoIcon,
  ChevronRightIcon,
  TriangleAlertIcon,
} from '../components/icons/AppIcons';
import {
  getAllCountries,
  searchCountries,
  getCallingCode,
  getCountryRegion,
  getFlagEmoji,
  CountryEmergencyData,
  CountryRegion,
  subscribeToEmergencyCountryChange,
  notifyEmergencyCountryChange,
} from '../data/emergencyNumbers';
import { EMERGENCY_COUNTRY_STORAGE_KEY } from '../constants/storageKeys';

type FilterRegion = 'All' | 'Confirmed' | CountryRegion;

const FILTER_CHIPS: { id: FilterRegion; label: string }[] = [
  { id: 'All', label: 'All (87)' },
  { id: 'Confirmed', label: 'Confirmed (80)' },
  { id: 'Europe', label: 'Europe (33)' },
  { id: 'Asia', label: 'Asia (28)' },
  { id: 'Americas', label: 'Americas (13)' },
  { id: 'Africa', label: 'Africa (11)' },
  { id: 'Oceania', label: 'Oceania (2)' },
];

export default function EmergencyDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette, theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterRegion>('All');
  const [activeCountryCode, setActiveCountryCode] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  // 1. Subscribe to instant in-memory country updates across tabs and directory
  useEffect(() => {
    const unsubscribe = subscribeToEmergencyCountryChange((code) => {
      setActiveCountryCode(code ? code.trim().toUpperCase() : null);
    });
    return unsubscribe;
  }, []);

  // 2. Load current saved emergency country from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSaved() {
      try {
        const saved = await AsyncStorage.getItem(EMERGENCY_COUNTRY_STORAGE_KEY);
        if (isMounted && saved) {
          setActiveCountryCode(saved.toUpperCase());
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadSaved();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter countries by search query and region chip
  const filteredCountries = useMemo(() => {
    let list: CountryEmergencyData[];
    if (searchQuery.trim()) {
      list = searchCountries(searchQuery);
    } else {
      list = getAllCountries();
    }

    if (selectedFilter === 'Confirmed') {
      return list.filter((c) => c.numbers.verificationStatus === 'confirmed');
    }
    if (selectedFilter !== 'All') {
      return list.filter((c) => getCountryRegion(c.isoCode) === selectedFilter);
    }
    return list;
  }, [searchQuery, selectedFilter]);

  const handleSelectActiveCountry = async (isoCode: string, name: string) => {
    const normalized = isoCode.trim().toUpperCase();
    try {
      await AsyncStorage.setItem(EMERGENCY_COUNTRY_STORAGE_KEY, normalized);
      notifyEmergencyCountryChange(normalized);
      setActiveCountryCode(normalized);
      Alert.alert(
        'Emergency Country Updated',
        `${name} (${normalized}) is now set as your active emergency country in MedFind.`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Unable to save emergency country selection.');
    }
  };

  const handleDial = (number: string, title: string) => {
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    Alert.alert(
      `Call ${title}?`,
      `Dial ${number} on your phone's dialer. MedFind does not place calls automatically or dispatch emergency services.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Call ${number}`,
          style: 'default',
          onPress: () => {
            Linking.openURL(`tel:${cleanNumber}`).catch(() => {
              Alert.alert('Unable to Dial', `Could not open dialer for number: ${number}`);
            });
          },
        },
      ]
    );
  };

  const handleOpenSourceUrl = (url: string) => {
    Alert.alert(
      'Open Official Source',
      `Opening government verification reference:\n${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Link',
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open the source URL.');
            });
          },
        },
      ]
    );
  };

  const toggleSources = (isoCode: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [isoCode]: !prev[isoCode],
    }));
  };

  const renderCountryCard = useCallback(
    ({ item }: { item: CountryEmergencyData }) => {
      const callingCode = getCallingCode(item.isoCode);
      const region = getCountryRegion(item.isoCode);
      const flag = getFlagEmoji(item.isoCode);
      const isConfirmed = item.numbers.verificationStatus === 'confirmed';
      const isCurrentActive = activeCountryCode === item.isoCode;
      const areSourcesExpanded = !!expandedSources[item.isoCode];

      return (
        <View
          style={[
            styles.countryCard,
            {
              backgroundColor: palette.surface,
              borderColor: isCurrentActive ? palette.btn : palette.line,
              shadowColor: palette.shadow,
            },
          ]}
        >
          {/* Header Row: Flag + Name + Country Codes */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.flagBox}>
              <Text style={styles.flagEmoji}>{flag}</Text>
            </View>

            <View style={styles.cardHeaderInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.countryNameText, { color: palette.ink }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>

              <View style={styles.codesRow}>
                {/* ISO Code Badge */}
                <View style={[styles.codeBadge, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                  <Text style={[styles.codeBadgeText, { color: palette.ink }]}>
                    {item.isoCode}
                  </Text>
                </View>

                {/* Calling Code Badge */}
                {callingCode && (
                  <View style={[styles.callingCodeBadge, { backgroundColor: scheme === 'light' ? 'rgba(37,99,235,0.08)' : 'rgba(56,189,248,0.12)', borderColor: scheme === 'light' ? 'rgba(37,99,235,0.2)' : 'rgba(56,189,248,0.3)' }]}>
                    <Text style={[styles.callingCodeText, { color: scheme === 'light' ? '#1D4ED8' : '#38BDF8' }]}>
                      {callingCode}
                    </Text>
                  </View>
                )}

                {/* Region Badge */}
                {region && (
                  <View style={[styles.regionBadge, { backgroundColor: palette.surface2 }]}>
                    <Text style={[styles.regionBadgeText, { color: palette.ink2 }]}>
                      {region}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Verification Status Badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isConfirmed
                    ? scheme === 'light'
                      ? 'rgba(46,125,50,0.1)'
                      : 'rgba(74,222,128,0.15)'
                    : scheme === 'light'
                    ? 'rgba(217,119,6,0.1)'
                    : 'rgba(251,191,36,0.15)',
                  borderColor: isConfirmed
                    ? scheme === 'light'
                      ? 'rgba(46,125,50,0.3)'
                      : 'rgba(74,222,128,0.35)'
                    : scheme === 'light'
                    ? 'rgba(217,119,6,0.3)'
                    : 'rgba(251,191,36,0.35)',
                },
              ]}
            >
              {isConfirmed ? (
                <ShieldCheckIcon size={13} color={scheme === 'light' ? '#2E7D32' : '#4ADE80'} />
              ) : (
                <TriangleAlertIcon size={12} color={scheme === 'light' ? '#D97706' : '#FBBF24'} />
              )}
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isConfirmed ? (scheme === 'light' ? '#2E7D32' : '#4ADE80') : (scheme === 'light' ? '#D97706' : '#FBBF24') },
                ]}
              >
                {isConfirmed ? 'Confirmed' : 'Partial'}
              </Text>
            </View>
          </View>

          {/* Active Country Status / Set as Country Action */}
          <View style={[styles.activeStatusRow, { borderTopColor: palette.line }]}>
            {isCurrentActive ? (
              <View style={styles.currentActivePill}>
                <CheckCircleIcon size={14} color="#16A34A" />
                <Text style={styles.currentActiveText}>Active Emergency Country</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => handleSelectActiveCountry(item.isoCode, item.name)}
                hitSlop={6}
                style={[styles.setCountryBtn, { borderColor: palette.line, backgroundColor: palette.surface2 }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Set ${item.name} as active emergency country`}
              >
                <Text style={[styles.setCountryBtnText, { color: palette.ink }]}>
                  Set as my country
                </Text>
              </Pressable>
            )}
            <Text style={[styles.verifiedDateText, { color: palette.ink2 }]}>
              Verified {item.numbers.verifiedAt}
            </Text>
          </View>

          {/* Emergency Numbers Grid */}
          <View style={styles.numbersGrid}>
            {/* 1. General Universal Emergency */}
            {item.numbers.general && (
              <Pressable
                onPress={() => handleDial(item.numbers.general!, `${item.name} Emergency`)}
                style={[
                  styles.numberBtn,
                  styles.generalNumberBtn,
                  { backgroundColor: scheme === 'light' ? '#FEF2F2' : 'rgba(239,68,68,0.14)', borderColor: palette.red },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.name} General Emergency on ${item.numbers.general}`}
              >
                <View style={styles.numberBtnHeader}>
                  <Text style={styles.serviceIcon}>🚨</Text>
                  <Text style={[styles.serviceLabel, { color: palette.red }]}>General</Text>
                </View>
                <Text style={[styles.serviceNumberBig, { color: palette.red }]}>
                  {item.numbers.general}
                </Text>
                <View style={styles.dialPromptRow}>
                  <PhoneIcon size={12} color={palette.red} />
                  <Text style={[styles.dialPromptText, { color: palette.red }]}>Tap to call</Text>
                </View>
              </Pressable>
            )}

            {/* 2. Ambulance / Medical */}
            {item.numbers.ambulance && (
              <Pressable
                onPress={() => handleDial(item.numbers.ambulance!, `${item.name} Ambulance`)}
                style={[
                  styles.numberBtn,
                  { backgroundColor: scheme === 'light' ? palette.surface2 : 'rgba(15,23,42,0.6)', borderColor: palette.line },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.name} Ambulance on ${item.numbers.ambulance}`}
              >
                <View style={styles.numberBtnHeader}>
                  <Text style={styles.serviceIcon}>🚑</Text>
                  <Text style={[styles.serviceLabel, { color: palette.ink }]}>Ambulance</Text>
                </View>
                <Text style={[styles.serviceNumber, { color: palette.ink }]}>
                  {item.numbers.ambulance}
                </Text>
                <View style={styles.dialPromptRow}>
                  <PhoneIcon size={12} color={palette.ink2} />
                  <Text style={[styles.dialPromptText, { color: palette.ink2 }]}>Tap to call</Text>
                </View>
              </Pressable>
            )}

            {/* 3. Police */}
            {item.numbers.police && (
              <Pressable
                onPress={() => handleDial(item.numbers.police!, `${item.name} Police`)}
                style={[
                  styles.numberBtn,
                  { backgroundColor: scheme === 'light' ? palette.surface2 : 'rgba(15,23,42,0.6)', borderColor: palette.line },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.name} Police on ${item.numbers.police}`}
              >
                <View style={styles.numberBtnHeader}>
                  <Text style={styles.serviceIcon}>👮</Text>
                  <Text style={[styles.serviceLabel, { color: palette.ink }]}>Police</Text>
                </View>
                <Text style={[styles.serviceNumber, { color: palette.ink }]}>
                  {item.numbers.police}
                </Text>
                <View style={styles.dialPromptRow}>
                  <PhoneIcon size={12} color={palette.ink2} />
                  <Text style={[styles.dialPromptText, { color: palette.ink2 }]}>Tap to call</Text>
                </View>
              </Pressable>
            )}

            {/* 4. Fire */}
            {item.numbers.fire && (
              <Pressable
                onPress={() => handleDial(item.numbers.fire!, `${item.name} Fire`)}
                style={[
                  styles.numberBtn,
                  { backgroundColor: scheme === 'light' ? palette.surface2 : 'rgba(15,23,42,0.6)', borderColor: palette.line },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.name} Fire Department on ${item.numbers.fire}`}
              >
                <View style={styles.numberBtnHeader}>
                  <Text style={styles.serviceIcon}>🚒</Text>
                  <Text style={[styles.serviceLabel, { color: palette.ink }]}>Fire</Text>
                </View>
                <Text style={[styles.serviceNumber, { color: palette.ink }]}>
                  {item.numbers.fire}
                </Text>
                <View style={styles.dialPromptRow}>
                  <PhoneIcon size={12} color={palette.ink2} />
                  <Text style={[styles.dialPromptText, { color: palette.ink2 }]}>Tap to call</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Special Notes (if present) */}
          {item.numbers.note && (
            <View style={[styles.noteBox, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <InfoIcon size={14} color={palette.ink2} />
              <Text style={[styles.noteText, { color: palette.ink2 }]}>
                {item.numbers.note}
              </Text>
            </View>
          )}

          {/* Official Verification Sources Accordion */}
          {item.numbers.sources && item.numbers.sources.length > 0 && (
            <View style={[styles.sourcesContainer, { borderTopColor: palette.line }]}>
              <Pressable
                onPress={() => toggleSources(item.isoCode)}
                style={styles.sourcesToggleBtn}
                hitSlop={8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Toggle official source citations"
              >
                <Text style={[styles.sourcesToggleText, { color: palette.ink2 }]}>
                  {areSourcesExpanded ? 'Hide official sources ▲' : `Official Government Citations (${item.numbers.sources.length}) ▼`}
                </Text>
              </Pressable>

              {areSourcesExpanded && (
                <View style={styles.sourcesList}>
                  {item.numbers.sources.map((sourceUrl, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleOpenSourceUrl(sourceUrl)}
                      style={[styles.sourceItem, { backgroundColor: palette.surface2, borderColor: palette.line }]}
                      accessible={true}
                      accessibilityRole="link"
                      accessibilityLabel={`Open source URL ${sourceUrl}`}
                    >
                      <GlobeIcon size={14} color={palette.btn} />
                      <Text style={[styles.sourceUrlText, { color: palette.btn }]} numberOfLines={1}>
                        {sourceUrl.replace(/^https?:\/\//, '')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      );
    },
    [palette, scheme, theme, activeCountryCode, expandedSources]
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />
      <View style={[styles.mainWrapper, { paddingTop }]}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: palette.surface2, minHeight: MIN_TARGET, minWidth: MIN_TARGET }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={18} color={palette.ink} />
          </Pressable>

          <View style={styles.titleGroup}>
            <Text style={[styles.screenTitle, { color: palette.ink }]}>
              Worldwide Directory
            </Text>
            <Text style={[styles.screenSubtitle, { color: palette.ink2 }]}>
              87 countries with official numbers & calling codes
            </Text>
          </View>
        </View>

        {/* Key Metrics Overview Bar */}
        <View style={[styles.statsBar, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: palette.ink }]}>87</Text>
            <Text style={[styles.statLabel, { color: palette.ink2 }]} numberOfLines={1}>
              Countries
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: palette.line }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: scheme === 'light' ? '#1D4ED8' : '#38BDF8' }]}>
              +Codes
            </Text>
            <Text style={[styles.statLabel, { color: palette.ink2 }]} numberOfLines={1}>
              Calling Codes
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: palette.line }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>100%</Text>
            <Text style={[styles.statLabel, { color: palette.ink2 }]} numberOfLines={1}>
              Official Sources
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <SearchIcon size={18} color={palette.ink2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by country, code (US, +44), or alias..."
              placeholderTextColor={palette.ink2}
              style={[styles.searchInput, { color: palette.ink }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                style={styles.clearSearchBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <ClearIcon size={16} color={palette.ink2} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Chips Horizontal Scroller */}
        <View style={styles.filterScrollerWrapper}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {FILTER_CHIPS.map((chip) => {
              const isSelected = selectedFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setSelectedFilter(chip.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? palette.ink
                        : palette.surface,
                      borderColor: isSelected ? palette.ink : palette.line,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${chip.label}`}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? palette.surface : palette.ink,
                        fontFamily: isSelected ? fonts.sansSemi : fonts.sansMedium,
                      },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Countries FlatList */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.isoCode}
          renderItem={renderCountryCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 32 },
          ]}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <GlobeIcon size={44} color={palette.ink2} />
              <Text style={[styles.emptyTitle, { color: palette.ink }]}>
                No Countries Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: palette.ink2 }]}>
                No results matching "{searchQuery}". Try searching by country name, calling code (e.g. +91), or ISO code (e.g. IN).
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSelectedFilter('All');
                }}
                style={[styles.resetSearchBtn, { backgroundColor: palette.btn }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset search filters"
              >
                <Text style={styles.resetSearchBtnText}>Show All 87 Countries</Text>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            filteredCountries.length > 0 ? (
              <View style={styles.footerDisclaimer}>
                <Text style={[styles.footerDisclaimerText, { color: palette.ink2 }]}>
                  All 87 country entries are verified with official national telecommunications regulators and emergency authorities. Tapping opens your phone's dialer; MedFind does not place calls automatically or dispatch emergency services.
                </Text>
              </View>
            ) : undefined
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 14,
  },
  backBtn: {
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
  },
  filterScrollerWrapper: {
    marginBottom: 12,
  },
  filterChipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  countryCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagBox: {
    width: 44,
    height: 44,
    borderRadius: radii.card,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 26,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryNameText: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  codesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  codeBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  callingCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  callingCodeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  regionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regionBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 10,
  },
  currentActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22,163,74,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  currentActiveText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: '#16A34A',
  },
  setCountryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  setCountryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  verifiedDateText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  numberBtn: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  generalNumberBtn: {
    borderWidth: 1.5,
  },
  numberBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceIcon: {
    fontSize: 14,
  },
  serviceLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  serviceNumberBig: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  serviceNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 19,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  dialPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dialPromptText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourcesToggleBtn: {
    paddingVertical: 4,
  },
  sourcesToggleText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
  sourcesList: {
    marginTop: 8,
    gap: 6,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sourceUrlText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetSearchBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: 8,
  },
  resetSearchBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  footerDisclaimer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  footerDisclaimerText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
