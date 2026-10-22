import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Keyboard,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography } from '../theme/tokens';
import {
  searchMedicineStock,
  MedicineSearchResultItem,
  DataSource,
} from '../services/medicineSearch';
import { storageService } from '../services/storageService';
import { DEMO_DATA_DISCLAIMER } from '../data/demoData';
import {
  InfoIcon,
  MoonIcon,
  SunIcon,
  SearchIcon,
  ClearIcon,
  EmergencySirenIcon,
  ArrowRightIcon,
  ClockIcon,
  PharmacyStoreIcon,
  MapPinIcon,
  PhoneIcon,
  WarningIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  MedicalCrossIcon,
  LockIcon,
  CloseIcon,
  EmptyClipboardIcon,
  StaffBadgeIcon,
  BookmarkIcon,
} from '../components/icons/AppIcons';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, theme, toggleTheme } = useTheme();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Async data state
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<MedicineSearchResultItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [totalPublishedInDb, setTotalPublishedInDb] = useState<number>(0);

  // Safety & pilot information modal
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Dosage form filter list
  const dosageForms = ['All', 'Tablet', 'Capsule', 'Inhaler', 'Powder'];

  // Status bar & notch-safe header padding
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 0;
  const headerTopPadding = Math.max(insets.top, statusBarHeight) + 12;

  // Load recent searches & favorite IDs on mount
  useEffect(() => {
    async function loadStorage() {
      const recents = await storageService.getRecentSearches();
      const favs = await storageService.getFavoriteIds();
      setRecentSearches(recents);
      setFavoriteIds(favs);
    }
    loadStorage();
  }, []);

  // Fetch search results whenever query or dosage form filter changes (debounced)
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await searchMedicineStock(searchQuery, selectedDosageForm);
        if (!isCancelled) {
          setSearchResults(response.results);
          setDataSource(response.dataSource);
          setTotalPublishedInDb(response.totalPublishedInDb);
          if (response.errorMessage) {
            setSearchError(response.errorMessage);
          }

          // Save search term to recent searches if length >= 2
          if (searchQuery.trim().length >= 2) {
            const updated = await storageService.saveRecentSearch(searchQuery.trim());
            setRecentSearches(updated);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setSearchError(msg);
          setDataSource('demo');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedDosageForm]);

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const isDemoMode = dataSource === 'demo';

  // Filter by favorites if toggle is active
  const displayedResults = showFavoritesOnly
    ? searchResults.filter((item) => favoriteIds.includes(item.id))
    : searchResults;

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.canvas }]}>
      {/* 1. APPLE IOS LIQUID GLASS ENHANCED HEADER */}
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
        <View style={styles.headerLeftGroup}>
          <View
            style={[
              styles.logoWrapper,
              {
                backgroundColor: theme.surface,
                borderColor: theme.glass.border,
                shadowColor: theme.glass.shadowColor,
              },
            ]}
          >
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
              accessible={true}
              accessibilityLabel="MedFind app logo"
            />
          </View>

          <View style={styles.titleColumn}>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]}>
              MedFind
            </Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>
              Prescription & Care Directory
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsGroup}>
          {/* Staff Stock Portal Trigger */}
          <TouchableOpacity
            onPress={() => router.push('/portal')}
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
            accessibilityLabel="Open Pharmacy Staff Portal"
          >
            <StaffBadgeIcon size={16} />
            <Text
              style={[styles.headerButtonLabel, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              Portal
            </Text>
          </TouchableOpacity>

          {/* Info Modal Trigger */}
          <TouchableOpacity
            onPress={() => setShowSafetyModal(true)}
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
            accessibilityLabel="View safety and pilot boundaries"
          >
            <InfoIcon size={16} />
            <Text
              style={[styles.headerButtonLabel, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              Info
            </Text>
          </TouchableOpacity>

          {/* Theme Switcher */}
          <TouchableOpacity
            onPress={toggleTheme}
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
            accessibilityLabel={`Toggle theme mode. Current theme is ${mode}`}
          >
            {mode === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            <Text
              style={[styles.headerButtonLabel, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {mode === 'light' ? 'Dark' : 'Light'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. DEMO / LIVE DATA NOTICE (APPLE LIQUID GLASS BANNER) */}
        <View
          style={[
            styles.modeNoticeBanner,
            {
              backgroundColor: isDemoMode
                ? mode === 'light'
                  ? 'rgba(255, 255, 255, 0.82)'
                  : 'rgba(22, 19, 34, 0.82)'
                : theme.badgeBackground,
              borderColor: isDemoMode ? theme.glass.border : theme.primaryAccent,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityLabel={
            isDemoMode
              ? 'Demo data notice: sample records, not real pharmacy stock'
              : 'Connected to Supabase database records'
          }
        >
          <View style={styles.modeNoticeContent}>
            <View style={styles.modeNoticeTextRow}>
              <View style={styles.noticeIconWrapper}>
                <ShieldCheckIcon
                  size={16}
                  color={isDemoMode ? (mode === 'light' ? '#87A96B' : '#00E5FF') : '#10B981'}
                />
              </View>
              <Text
                style={[
                  styles.modeNoticeText,
                  {
                    color: isDemoMode
                      ? theme.textSecondary
                      : theme.primaryAccentText,
                  },
                ]}
              >
                {isDemoMode
                  ? 'Demo data — sample records, not real pharmacy stock.'
                  : `Supabase records — reported availability (${totalPublishedInDb} items in database).`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowSafetyModal(true)}
              style={[
                styles.modeNoticeLink,
                {
                  backgroundColor: theme.glass.backgroundPill,
                  borderColor: theme.glass.borderSubtle,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View detailed safety and pilot notice"
            >
              <Text
                style={[
                  styles.modeNoticeLinkText,
                  { color: isDemoMode ? theme.textSecondary : theme.primaryAccentText },
                ]}
              >
                Pilot info
              </Text>
              <ArrowRightIcon
                size={12}
                color={isDemoMode ? theme.textSecondary : theme.primaryAccentText}
              />
            </TouchableOpacity>
          </View>

          {/* Offline / Connection Diagnostic strip (expandable) */}
          {searchError && (
            <View style={styles.diagnosticRow}>
              <View style={styles.diagnosticNoticeWrapper}>
                <WarningIcon size={14} />
                <Text
                  style={[
                    styles.diagnosticNotice,
                    { color: mode === 'light' ? theme.warningAccentText : theme.warningAccent },
                  ]}
                >
                  Cloud offline: using local sample baseline.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowErrorDetails((prev) => !prev)}
                style={styles.diagnosticToggle}
              >
                <Text style={[styles.diagnosticToggleText, { color: theme.textMuted }]}>
                  {showErrorDetails ? 'Hide' : 'Details'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showErrorDetails && searchError && (
            <Text style={[styles.diagnosticCode, { color: theme.textMuted }]}>
              {searchError}
            </Text>
          )}
        </View>

        {/* 3. MEDICINE SEARCH (MAIN FOCUS) */}
        <View style={styles.searchSection}>
          <Text style={[styles.searchSectionTitle, { color: theme.textPrimary }]}>
            Find a medicine
          </Text>

          {/* Search Box - Liquid Glass Field */}
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: theme.glass.backgroundSubtle,
                borderColor: theme.glass.border,
                shadowColor: theme.glass.shadowColor,
              },
            ]}
          >
            <View style={styles.searchPrefixIconWrapper}>
              <SearchIcon size={18} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
            </View>
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search by brand or generic name..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessible={true}
              accessibilityLabel="Search by medicine name"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <ClearIcon size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Searches Pills (PRD FR 09 Data Minimization) */}
          {recentSearches.length > 0 && searchQuery.length === 0 && (
            <View style={styles.recentSearchesBox}>
              <Text style={[styles.recentSearchesLabel, { color: theme.textMuted }]}>
                Recent:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRow}
              >
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => setSearchQuery(term)}
                    style={[
                      styles.recentChip,
                      {
                        backgroundColor: theme.glass.backgroundSubtle,
                        borderColor: theme.glass.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.recentChipText, { color: theme.textSecondary }]}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={async () => {
                    await storageService.clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  style={styles.clearRecentsBtn}
                >
                  <Text style={[styles.clearRecentsText, { color: theme.textMuted }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Compact Dosage-Form Filter Chips & Saved Bookmark Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            style={styles.filterScrollView}
          >
            {/* Local Saved / Favorites Filter Chip */}
            <TouchableOpacity
              onPress={() => setShowFavoritesOnly((prev) => !prev)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: showFavoritesOnly
                    ? mode === 'light'
                      ? theme.warningAccent
                      : theme.warningAccent
                    : theme.glass.backgroundPill,
                  borderColor: showFavoritesOnly
                    ? theme.warningAccent
                    : theme.glass.border,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: showFavoritesOnly }}
              accessibilityLabel="Show saved bookmarked medicines only"
            >
              <BookmarkIcon
                size={14}
                filled={showFavoritesOnly}
                color={showFavoritesOnly ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipLabel,
                  {
                    color: showFavoritesOnly ? '#FFFFFF' : theme.textSecondary,
                    fontFamily: showFavoritesOnly
                      ? typography.fontFamilySemibold
                      : typography.fontFamilyMedium,
                  },
                ]}
              >
                Saved ({favoriteIds.length})
              </Text>
            </TouchableOpacity>

            {dosageForms.map((form) => {
              const isSelected = selectedDosageForm === form && !showFavoritesOnly;
              return (
                <TouchableOpacity
                  key={form}
                  onPress={() => {
                    setSelectedDosageForm(form);
                    setShowFavoritesOnly(false);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? mode === 'light'
                          ? theme.primaryAccent
                          : theme.secondaryAccent
                        : theme.glass.backgroundPill,
                      borderColor: isSelected
                        ? mode === 'light'
                          ? theme.primaryAccent
                          : theme.primaryAccent
                        : theme.glass.border,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filter by dosage form: ${form}`}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      {
                        color: isSelected
                          ? mode === 'light'
                            ? theme.textInverse
                            : theme.primaryAccent
                          : theme.textSecondary,
                        fontFamily: isSelected
                          ? typography.fontFamilySemibold
                          : typography.fontFamilyMedium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {form}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. CALM & COMPACT EMERGENCY HELP (LIQUID GLASS STRIP) */}
        <View
          style={[
            styles.emergencyStrip,
            {
              backgroundColor: theme.emergencyBackground,
              borderColor: theme.emergencyBorder,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityLabel="Emergency Help and Directory entry point"
        >
          <View style={styles.emergencyLeft}>
            <View style={styles.emergencyTitleRow}>
              <EmergencySirenIcon size={19} />
              <Text style={[styles.emergencyTagText, { color: theme.emergencyText }]}>
                Emergency & Nearby Care
              </Text>
            </View>
            <Text style={[styles.emergencyDescriptionText, { color: theme.textSecondary }]}>
              Hospitals, clinics & ambulance contacts (directory only)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/care')}
            style={[
              styles.emergencyDirectoryButton,
              {
                backgroundColor: theme.glass.backgroundPill,
                borderColor: theme.emergencyBorder,
                shadowColor: theme.glass.shadowColor,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open Care and Emergency Directory screen"
          >
            <Text
              style={[styles.emergencyDirectoryButtonText, { color: theme.emergencyText }]}
              numberOfLines={1}
            >
              Open Directory
            </Text>
            <ArrowRightIcon size={13} color={theme.emergencyText} />
          </TouchableOpacity>
        </View>

        {/* 5. RESULTS LIST */}
        <View style={styles.resultsArea}>
          <View style={styles.resultsHeaderRow}>
            <Text style={[styles.resultsCountText, { color: theme.textPrimary }]}>
              {isLoading
                ? 'Searching records...'
                : `${displayedResults.length} result(s) found`}
            </Text>
            <Text style={[styles.resultsBoundaryText, { color: theme.textMuted }]}>
              Tap card to view details
            </Text>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="small"
                color={mode === 'light' ? theme.primaryAccentText : theme.primaryAccent}
              />
              <Text style={[styles.loadingNoticeText, { color: theme.textSecondary }]}>
                Checking pharmacy stock records...
              </Text>
            </View>
          )}

          {/* Empty State with Colorful SVG Document Icon */}
          {!isLoading && displayedResults.length === 0 && (
            <View
              style={[
                styles.emptyStateBox,
                {
                  backgroundColor: theme.glass.background,
                  borderColor: theme.glass.border,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="text"
            >
              <EmptyClipboardIcon
                size={48}
                color={mode === 'light' ? '#87A96B' : '#00E5FF'}
              />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                {showFavoritesOnly ? 'No saved medicines' : 'No stock records found'}
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                {showFavoritesOnly
                  ? 'Tap the bookmark icon on any medicine detail page to save it here for quick 1-tap re-checks.'
                  : searchQuery.trim()
                  ? `No participating pharmacy has published stock for "${searchQuery}" under the selected filters.`
                  : 'No published stock records currently match this filter.'}
              </Text>
            </View>
          )}

          {/* Quick-Scan Medicine Result Cards - Tap opens Detail Screen */}
          {!isLoading &&
            displayedResults.map((item) => {
              const isDemo = item.isDemo || isDemoMode;

              // Format neutral availability labels
              let availabilityLabel = 'Reported: Available';
              let availabilityBg = theme.badgeBackground;
              let availabilityColor = theme.primaryAccentText;

              if (item.state === 'available') {
                availabilityLabel = isDemo
                  ? '● Sample: Available'
                  : '● Reported: Available';
                availabilityBg = theme.badgeBackground;
                availabilityColor = theme.primaryAccentText;
              } else if (item.state === 'low_stock') {
                availabilityLabel = isDemo
                  ? '▲ Sample: Low Stock'
                  : '▲ Reported: Low Stock';
                availabilityBg = mode === 'light' ? 'rgba(255, 248, 238, 0.9)' : 'rgba(38, 23, 8, 0.85)';
                availabilityColor = mode === 'light' ? theme.warningAccentText : theme.warningAccent;
              } else if (item.state === 'unavailable') {
                availabilityLabel = isDemo
                  ? '— Sample: Unavailable'
                  : '— Reported: Unavailable';
                availabilityBg = theme.glass.backgroundSubtle;
                availabilityColor = theme.textSecondary;
              } else {
                availabilityLabel = isDemo
                  ? '○ Sample: Unknown'
                  : '○ Reported: Unknown';
                availabilityBg = theme.glass.backgroundSubtle;
                availabilityColor = theme.textSecondary;
              }

              // Format neutral update time
              const updateTimeLabel = isDemo
                ? `Sample update: ${item.freshness.relativeTimeText}`
                : `Updated ${item.freshness.relativeTimeText}`;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.82}
                  onPress={() => router.push({ pathname: '/medicine/[id]', params: { id: item.id } })}
                  style={[
                    styles.medicineCard,
                    {
                      backgroundColor: theme.glass.background,
                      borderColor:
                        item.freshness.state === 'aging' && !isDemo
                          ? theme.warningAccent
                          : theme.glass.border,
                      borderTopColor: theme.glass.borderHighlight,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.brandName}, ${item.genericName}. ${availabilityLabel}. ${updateTimeLabel}. Tap to view details.`}
                >
                  {/* Top: Medicine Name & Badges */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
                        {item.brandName}
                      </Text>
                      <Text style={[styles.genericSubtitle, { color: theme.textSecondary }]}>
                        {item.genericName}
                      </Text>
                    </View>

                    <View style={styles.cardBadgesGroup}>
                      {/* Strength / Form Badge - Liquid Glass Pill */}
                      {(item.strength || item.dosageForm) && (
                        <View
                          style={[
                            styles.dosagePill,
                            {
                              backgroundColor: theme.glass.backgroundPill,
                              borderColor: theme.glass.border,
                            },
                          ]}
                        >
                          <Text style={[styles.dosagePillText, { color: theme.textSecondary }]}>
                            {item.strength}
                            {item.strength && item.dosageForm ? ' • ' : ''}
                            {item.dosageForm}
                          </Text>
                        </View>
                      )}

                      {/* Small, consistent "Demo" label on demo cards */}
                      {isDemo && (
                        <View
                          style={[
                            styles.demoTagPill,
                            {
                              backgroundColor: theme.glass.backgroundPill,
                              borderColor: theme.glass.border,
                            },
                          ]}
                        >
                          <Text style={[styles.demoTagPillText, { color: theme.textMuted }]}>
                            Demo
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Availability & Update Time (Quick-Scan) */}
                  <View style={styles.cardMetaRow}>
                    <View
                      style={[
                        styles.availabilityBadge,
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
                      <Text style={[styles.availabilityBadgeText, { color: availabilityColor }]}>
                        {availabilityLabel}
                      </Text>
                    </View>

                    <View style={styles.updateTimeWrapper}>
                      <ClockIcon size={13} color={theme.textMuted} />
                      <Text style={[styles.updateTimeText, { color: theme.textMuted }]}>
                        {updateTimeLabel}
                      </Text>
                      <ArrowRightIcon size={12} color={theme.textMuted} />
                    </View>
                  </View>

                  {/* Pharmacy Name & Contact Info - Inset Liquid Glass Box */}
                  <View
                    style={[
                      styles.pharmacyInfoBox,
                      {
                        backgroundColor: theme.glass.backgroundSubtle,
                        borderColor: theme.glass.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.pharmacyRow}>
                      <PharmacyStoreIcon
                        size={16}
                        color={mode === 'light' ? '#87A96B' : '#00E5FF'}
                      />
                      <Text style={[styles.pharmacyNameText, { color: theme.textPrimary }]}>
                        {item.pharmacyName}
                      </Text>
                    </View>

                    <View style={styles.pharmacyRow}>
                      <MapPinIcon size={14} />
                      <Text style={[styles.pharmacyLocationText, { color: theme.textSecondary }]}>
                        {item.pharmacyAddress}
                      </Text>
                    </View>

                    <View style={styles.pharmacyRow}>
                      <PhoneIcon
                        size={14}
                        color={
                          isDemo
                            ? theme.textMuted
                            : mode === 'light'
                            ? '#87A96B'
                            : '#00E5FF'
                        }
                      />
                      <Text style={[styles.pharmacyContactText, { color: theme.textMuted }]}>
                        {isDemo ? 'Sample contact (no calls)' : item.pharmacyPhone}
                      </Text>
                    </View>
                  </View>

                  {/* Call-First warning if real store data is aging */}
                  {item.freshness.requiresCallFirst && !isDemo && (
                    <View
                      style={[
                        styles.callFirstBox,
                        {
                          backgroundColor: mode === 'light' ? 'rgba(255, 248, 238, 0.9)' : 'rgba(35, 22, 8, 0.85)',
                          borderColor: theme.warningAccent,
                        },
                      ]}
                    >
                      <WarningIcon size={15} />
                      <Text
                        style={[
                          styles.callFirstText,
                          {
                            color:
                              mode === 'light'
                                ? theme.warningAccentText
                                : theme.warningAccent,
                          },
                        ]}
                      >
                        Stock snapshot is not live. Call pharmacy to verify before traveling.
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
      </ScrollView>

      {/* 6. CONCISE SAFETY & PILOT INFORMATION MODAL - APPLE LIQUID GLASS SHEET */}
      <Modal
        visible={showSafetyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.glass.backgroundElevated,
                borderColor: theme.glass.borderHighlight,
                shadowColor: '#000000',
              },
            ]}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="MedFind Safety and Pilot Information Notice"
          >
            {/* Modal Top */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Safety & Pilot Information
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  BMSCE CSE Semester 5 Mini Project
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowSafetyModal(false)}
                style={[
                  styles.modalCloseBtn,
                  {
                    backgroundColor: theme.glass.backgroundPill,
                    borderColor: theme.glass.border,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close safety modal"
              >
                <CloseIcon size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Demo Data Notice */}
              <View
                style={[
                  styles.modalSectionCard,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.borderSubtle,
                  },
                ]}
              >
                <View style={styles.modalSectionTitleRow}>
                  <AcademicCapIcon size={18} />
                  <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                    Academic Demo Baseline
                  </Text>
                </View>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  {DEMO_DATA_DISCLAIMER}
                </Text>
              </View>

              {/* Clinical Guardrails */}
              <View
                style={[
                  styles.modalSectionCard,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.borderSubtle,
                  },
                ]}
              >
                <View style={styles.modalSectionTitleRow}>
                  <MedicalCrossIcon size={18} />
                  <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                    Clinical Safety Guardrails
                  </Text>
                </View>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  • MedFind does not provide medical advice, clinical diagnoses, or automatic drug substitutions.{'\n'}
                  • Always consult a licensed pharmacist or physician to verify prescriptions.{'\n'}
                  • Stock status reflects snapshot availability, never continuous real-time inventory.
                </Text>
              </View>

              {/* Privacy */}
              <View
                style={[
                  styles.modalSectionCard,
                  {
                    backgroundColor: theme.glass.backgroundSubtle,
                    borderColor: theme.glass.borderSubtle,
                  },
                ]}
              >
                <View style={styles.modalSectionTitleRow}>
                  <LockIcon size={18} />
                  <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                    Privacy & Health Data
                  </Text>
                </View>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  • MedFind does not collect, track, or upload patient health data or prescriptions.{'\n'}
                  • Location permissions are not required; listings are organized as an indexed directory.
                </Text>
              </View>
            </ScrollView>

            {/* Dismiss Button - Liquid Glass Pill */}
            <TouchableOpacity
              onPress={() => setShowSafetyModal(false)}
              style={[
                styles.modalDismissBtn,
                {
                  backgroundColor: theme.primaryAccent,
                  borderColor: theme.glass.borderHighlight,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal and return to search"
            >
              <Text style={[styles.modalDismissBtnText, { color: theme.textInverse }]}>
                Understood — Back to MedFind
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },

  // 1. APPLE IOS LIQUID GLASS HEADER
  headerBar: {
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: layout.spacing.xs,
  },
  logoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
    marginRight: layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },
  titleColumn: {
    flex: 1,
  },
  appTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  appTagline: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs + 2,
    flexShrink: 0,
  },
  headerLiquidButton: {
    minHeight: layout.minTouchTarget,
    minWidth: 54,
    paddingHorizontal: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerButtonLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },

  // SCROLL CONTAINER
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
  },

  // 2. DEMO / DATA NOTICE BANNER
  modeNoticeBanner: {
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modeNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  modeNoticeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 180,
    gap: 6,
  },
  noticeIconWrapper: {
    flexShrink: 0,
  },
  modeNoticeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    flex: 1,
    lineHeight: 18,
  },
  modeNoticeLink: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  modeNoticeLinkText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200, 200, 200, 0.3)',
  },
  diagnosticNoticeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 180,
  },
  diagnosticNotice: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
    flex: 1,
  },
  diagnosticToggle: {
    minHeight: 26,
    justifyContent: 'center',
    paddingLeft: layout.spacing.sm,
    flexShrink: 0,
  },
  diagnosticToggleText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '500',
  },
  diagnosticCode: {
    fontSize: typography.fontSize.xs - 2,
    fontFamily: 'monospace',
    marginTop: 4,
  },

  // 3. MEDICINE SEARCH (MAIN FOCUS)
  searchSection: {
    marginBottom: layout.spacing.md,
  },
  searchSectionTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.md + 1,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: layout.spacing.xs + 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    marginBottom: layout.spacing.xs + 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchPrefixIconWrapper: {
    marginRight: layout.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    minHeight: 44,
  },
  clearButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSearchesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: layout.spacing.xs + 4,
    paddingHorizontal: 2,
  },
  recentSearchesLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '500',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChip: {
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  recentChipText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
  },
  clearRecentsBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  clearRecentsText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    textDecorationLine: 'underline',
  },
  filterScrollView: {
    marginTop: 2,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: layout.spacing.xs + 2,
  },
  filterChip: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  filterChipLabel: {
    fontSize: typography.fontSize.sm,
  },

  // 4. CALM & COMPACT EMERGENCY HELP
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    padding: layout.spacing.sm + 4,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emergencyLeft: {
    flex: 1,
    minWidth: 160,
    marginRight: layout.spacing.sm,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  emergencyTagText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
  },
  emergencyDescriptionText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
    lineHeight: 15,
  },
  emergencyDirectoryButton: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emergencyDirectoryButtonText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
  },

  // 5. RESULTS LIST
  resultsArea: {
    gap: layout.spacing.sm + 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
    marginBottom: 2,
  },
  resultsCountText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  resultsBoundaryText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  loadingBox: {
    padding: layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingNoticeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    marginTop: layout.spacing.sm,
  },
  emptyStateBox: {
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.spacing.sm,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  emptyDescription: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },

  // MEDICINE CARD (APPLE LIQUID GLASS)
  medicineCard: {
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  cardTitleGroup: {
    flex: 1,
    minWidth: 140,
    marginRight: layout.spacing.sm,
  },
  brandTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base + 1,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  genericSubtitle: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  dosagePill: {
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  dosagePillText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  demoTagPill: {
    paddingHorizontal: layout.spacing.xs + 4,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  demoTagPillText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },

  // CARD META ROW
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  availabilityBadge: {
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  availabilityBadgeText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  updateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateTimeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },

  // PHARMACY INFO BOX (INSET LIQUID GLASS)
  pharmacyInfoBox: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm + 2,
    gap: 6,
  },
  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pharmacyNameText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  pharmacyLocationText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    flex: 1,
  },
  pharmacyContactText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    flex: 1,
  },

  // CALL FIRST ALERT
  callFirstBox: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callFirstText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    flex: 1,
  },

  // 6. MODAL STYLES (APPLE LIQUID GLASS SHEET)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  modalSheet: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: layout.spacing.lg,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.md + 1,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginBottom: layout.spacing.md,
  },
  modalSectionCard: {
    borderRadius: layout.borderRadius.md + 2,
    borderWidth: 1,
    padding: layout.spacing.sm + 4,
    marginBottom: layout.spacing.sm + 2,
  },
  modalSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalSectionTitle: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  modalSectionText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 18,
  },
  modalDismissBtn: {
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalDismissBtnText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
