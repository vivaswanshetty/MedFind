import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography } from '../theme/tokens';
import {
  getProviderListings,
  CategoryFilter,
} from '../services/providerService';
import { ProviderListing, DataSourceType } from '../types/models';
import { DEMO_DATA_DISCLAIMER } from '../data/demoData';
import {
  MoonIcon,
  SunIcon,
  InfoIcon,
  WarningIcon,
  SearchIcon,
  MapPinIcon,
  PhoneIcon,
  EmergencySirenIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  HospitalIcon,
  ClinicIcon,
  AmbulanceIcon,
  EmptyClipboardIcon,
  BackArrowIcon,
} from '../components/icons/AppIcons';

export default function CareDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, theme, toggleTheme } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceType>('demo');

  // Status bar & notch-safe header padding
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 0;
  const headerTopPadding = Math.max(insets.top, statusBarHeight) + 12;

  const categories: Array<{ id: CategoryFilter; label: string }> = [
    { id: 'all', label: 'All Services' },
    { id: 'hospital', label: 'Hospitals' },
    { id: 'clinic', label: 'Clinics' },
    { id: 'ambulance', label: 'Ambulance Contacts' },
  ];

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    const timer = setTimeout(async () => {
      try {
        const response = await getProviderListings(selectedCategory, searchQuery);
        if (!isCancelled) {
          setListings(response.results);
          setDataSource(response.dataSource);
          if (response.errorMessage) {
            setErrorMessage(response.errorMessage);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(`Error fetching directory: ${msg}`);
          setDataSource('demo');
        }
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
  }, [selectedCategory, searchQuery]);

  const handleCallPress = async (phone: string, isDemo?: boolean) => {
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    Alert.alert(
      'Directory Contact',
      `Open device dialer for ${phone}? MedFind provides contact information only and does not place calls or dispatch services automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Dialer',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(telUrl);
              if (supported) {
                await Linking.openURL(telUrl);
              } else {
                Alert.alert('Dialer Unavailable', `Cannot place calls to ${phone} from this device.`);
              }
            } catch {
              Alert.alert('Error', 'Unable to open phone dialer.');
            }
          },
        },
      ]
    );
  };

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backIconButton,
              {
                backgroundColor: theme.glass.backgroundPill,
                borderColor: theme.glass.border,
                shadowColor: theme.glass.shadowColor,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back to Home screen"
          >
            <BackArrowIcon size={18} color={theme.textPrimary} />
          </TouchableOpacity>

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
            <Text
              style={[styles.screenTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              Care Directory
            </Text>
            <Text
              style={[styles.screenSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Reviewed Hospitals, Clinics & Ambulance
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Toggle theme mode. Current mode is ${mode}`}
          style={[
            styles.headerLiquidButton,
            {
              backgroundColor: theme.glass.backgroundPill,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          {mode === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          <Text
            style={[styles.themeButtonText, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {mode === 'light' ? 'Dark' : 'Light'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. CONCISE DIRECTORY NOTICE */}
        <View
          style={[
            styles.emergencyCard,
            {
              backgroundColor: theme.emergencyBackground,
              borderColor: theme.emergencyBorder,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityLabel="Emergency and healthcare directory notice"
        >
          <View style={styles.emergencyTitleRow}>
            <EmergencySirenIcon size={18} />
            <Text style={[styles.emergencyBadge, { color: theme.emergencyText }]}>
              Emergency & Healthcare Directory
            </Text>
          </View>
          <Text style={[styles.emergencyDescription, { color: theme.textSecondary }]}>
            Official contact information for public healthcare facilities and emergency numbers in Bengaluru. Sourced from official government records. For immediate life-threatening emergencies, dial 112 or 108 directly.
          </Text>
        </View>

        {/* 5. SEARCH FIELD & CATEGORY FILTERS */}
        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Search Provider Directory
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
              style={[
                styles.searchInput,
                {
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Filter by facility name, address, or service..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              accessible={true}
              accessibilityLabel="Search provider directory input"
            />
          </View>

          {/* Category Filter Chips - Liquid Glass Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
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
                  accessibilityLabel={`Filter category: ${cat.label}`}
                >
                  <Text
                    style={[
                      styles.filterChipText,
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
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 6. DATA SOURCE STATUS BANNER (LIQUID GLASS) */}
        <View
          style={[
            styles.dataSourceBanner,
            {
              backgroundColor:
                dataSource === 'database'
                  ? theme.badgeBackground
                  : theme.glass.backgroundSubtle,
              borderColor:
                dataSource === 'database' ? theme.primaryAccent : theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
          accessible={true}
          accessibilityLabel={
            dataSource === 'database'
              ? 'Connected to Supabase directory records'
              : 'Displaying simulated demo fixtures'
          }
        >
          <View style={styles.dataSourceTagRow}>
            <ShieldCheckIcon
              size={15}
              color={
                dataSource === 'database'
                  ? mode === 'light'
                    ? '#10B981'
                    : '#00E5FF'
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.dataSourceTag,
                {
                  color:
                    dataSource === 'database' ? theme.primaryAccent : theme.textSecondary,
                },
              ]}
            >
              {dataSource === 'database'
                ? 'SUPABASE DIRECTORY RECORDS'
                : 'DEMO DATA MODE (SIMULATED DIRECTORY)'}
            </Text>
          </View>
          <Text style={[styles.dataSourceNotice, { color: theme.textSecondary }]}>
            {dataSource === 'database'
              ? 'Displaying provider directory records stored in Supabase.'
              : 'Supabase provider directory records are unconfigured or empty. Displaying simulated baseline.'}
          </Text>
        </View>

        {/* Error notice if applicable */}
        {errorMessage && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: mode === 'light' ? 'rgba(255, 247, 237, 0.9)' : 'rgba(38, 23, 8, 0.85)',
                borderColor: theme.warningAccent,
              },
            ]}
            accessible={true}
            accessibilityRole="alert"
          >
            <WarningIcon size={16} />
            <Text style={[styles.errorText, { color: theme.textPrimary }]}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* 7. DIRECTORY LISTINGS */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeaderRow}>
            <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
              {isLoading ? 'Loading directory...' : `Showing ${listings.length} listing(s)`}
            </Text>
            <Text style={[styles.resultsBoundaryTag, { color: theme.textMuted }]}>
              Directory Reference Only
            </Text>
          </View>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primaryAccent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading healthcare directory records...
              </Text>
            </View>
          )}

          {!isLoading && listings.length === 0 && (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: theme.glass.background,
                  borderColor: theme.glass.border,
                  shadowColor: theme.glass.shadowColor,
                },
              ]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="No directory listings found"
            >
              <EmptyClipboardIcon
                size={44}
                color={mode === 'light' ? '#87A96B' : '#00E5FF'}
              />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
                No Directory Listings Found
              </Text>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No provider listings match your category or search query.
              </Text>
            </View>
          )}

          {!isLoading &&
            listings.map((item) => {
              const isDemo = item.is_demo || dataSource === 'demo';

              const typeLabel =
                item.type === 'hospital'
                  ? 'HOSPITAL'
                  : item.type === 'clinic'
                  ? 'CLINIC'
                  : 'AMBULANCE';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.directoryCard,
                    {
                      backgroundColor: theme.glass.background,
                      borderColor: theme.glass.border,
                      borderTopColor: theme.glass.borderHighlight,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="summary"
                  accessibilityLabel={`${item.name}, ${typeLabel}. Address: ${item.address}. Source: ${item.source}`}
                >
                  {/* Header: Category Badge & Source Type */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.categoryBadgePill,
                        {
                          backgroundColor: theme.glass.backgroundPill,
                          borderColor: theme.glass.border,
                        },
                      ]}
                    >
                      {item.type === 'hospital' ? (
                        <HospitalIcon size={15} />
                      ) : item.type === 'clinic' ? (
                        <ClinicIcon size={15} />
                      ) : (
                        <AmbulanceIcon size={15} />
                      )}
                      <Text style={[styles.categoryBadgeText, { color: theme.primaryAccent }]}>
                        {typeLabel}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.demoPill,
                        {
                          backgroundColor: theme.glass.backgroundSubtle,
                          borderColor: theme.glass.borderSubtle,
                        },
                      ]}
                    >
                      <ShieldCheckIcon size={13} color={theme.textMuted} />
                      <Text style={[styles.demoTag, { color: theme.textMuted }]}>
                        {item.source_type === 'provider_confirmed'
                          ? 'Provider Confirmed'
                          : 'Public Directory'}
                      </Text>
                    </View>
                  </View>

                  {/* Facility Name */}
                  <Text style={[styles.facilityName, { color: theme.textPrimary }]}>
                    {item.name}
                  </Text>

                  {/* Physical Address */}
                  <View style={styles.addressRow}>
                    <MapPinIcon size={14} />
                    <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                      {item.address}
                    </Text>
                  </View>

                  {/* Services Tags (Descriptive, not capacity claims) */}
                  {item.services && item.services.length > 0 && (
                    <View style={styles.servicesContainer}>
                      <Text style={[styles.servicesTitle, { color: theme.textMuted }]}>
                        Service scope (directory information):
                      </Text>
                      <View style={styles.servicesTagsRow}>
                        {item.services.map((service, sIdx) => (
                          <View
                            key={sIdx}
                            style={[
                              styles.serviceChip,
                              {
                                backgroundColor: theme.glass.backgroundSubtle,
                                borderColor: theme.glass.borderSubtle,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.serviceChipText, { color: theme.textSecondary }]}
                            >
                              • {service}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Source & Reviewed Date Provenance (Liquid Glass Inset) */}
                  <View
                    style={[
                      styles.provenanceContainer,
                      {
                        backgroundColor: theme.glass.backgroundSubtle,
                        borderColor: theme.glass.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.provenanceText, { color: theme.textMuted, flexShrink: 1 }]}
                      numberOfLines={2}
                    >
                      Source: {item.source} {item.source_url ? `(${item.source_url})` : ''}
                    </Text>
                    <Text
                      style={[styles.provenanceText, { color: theme.textMuted, flexShrink: 0 }]}
                      numberOfLines={1}
                    >
                      Checked: {item.verified_date || (item.reviewed_at ? item.reviewed_at.split('T')[0] : 'Oct 2026')}
                    </Text>
                  </View>

                  {/* Phone Contact & Action */}
                  <View style={styles.phoneSection}>
                    <Text style={[styles.phoneLabel, { color: theme.textSecondary }]}>
                      Phone: {item.phone}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleCallPress(item.phone, false)}
                      style={[
                        styles.callButton,
                        {
                          backgroundColor: theme.glass.backgroundPill,
                          borderColor: theme.glass.border,
                          shadowColor: theme.glass.shadowColor,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Open dialer for ${item.phone}`}
                    >
                      <PhoneIcon size={14} color={mode === 'light' ? theme.primaryAccentText : theme.primaryAccent} />
                      <Text
                        style={[
                          styles.callButtonText,
                          { color: mode === 'light' ? theme.primaryAccentText : theme.primaryAccent },
                        ]}
                      >
                        Open Dialer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>
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
    marginRight: layout.spacing.sm,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.xs + 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 11,
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
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  titleColumn: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 1,
  },
  headerLiquidButton: {
    minHeight: layout.minTouchTarget,
    minWidth: 78,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  themeButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },

  // SCROLL CONTAINER
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
  },

  // 2. ACADEMIC & DEMO BOUNDARY NOTICE
  disclaimerBanner: {
    padding: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disclaimerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  disclaimerTag: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
    flex: 1,
  },
  disclaimerText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  },

  // 3. EMERGENCY CARD
  emergencyCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md + 4,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  emergencyBadge: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  emergencyDescription: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  },

  // 4. CLINICAL SAFETY NOTICE
  safetyNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  safetyNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyNoticeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
    flex: 1,
  },

  // 5. SEARCH FIELD & FILTER CHIPS
  searchSection: {
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: layout.spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: layout.borderRadius.md + 4,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    marginBottom: layout.spacing.sm,
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
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    flex: 1,
    minHeight: 44,
  },
  filterScroll: {
    marginBottom: layout.spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  filterChip: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
  },

  // 6. DATA SOURCE STATUS BANNER
  dataSourceBanner: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dataSourceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  dataSourceTag: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  dataSourceNotice: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
    flex: 1,
  },

  // 7. DIRECTORY LISTINGS
  resultsSection: {
    gap: layout.spacing.md,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  resultsCount: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  resultsBoundaryTag: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  loadingContainer: {
    padding: layout.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  loadingText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  emptyStateText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },

  // DIRECTORY CARD (APPLE LIQUID GLASS)
  directoryCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.lg,
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  categoryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexShrink: 1,
  },
  categoryBadgeText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  demoPill: {
    paddingHorizontal: layout.spacing.xs + 4,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexShrink: 0,
  },
  demoTag: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  facilityName: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  addressText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 18,
    flex: 1,
  },
  servicesContainer: {
    gap: 4,
  },
  servicesTitle: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '500',
  },
  servicesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  serviceChip: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.pill,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 3,
  },
  serviceChipText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
  },
  provenanceContainer: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  provenanceText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
    lineHeight: 16,
  },
  phoneSection: {
    marginTop: 2,
    gap: layout.spacing.xs,
  },
  phoneLabel: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  demoPhoneNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.pill,
    paddingHorizontal: layout.spacing.sm + 2,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  demoPhoneNoticeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
  },
  callButton: {
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: layout.spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  callButtonText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
