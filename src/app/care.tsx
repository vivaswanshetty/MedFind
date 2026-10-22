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
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography } from '../theme/tokens';
import {
  getProviderListings,
  CategoryFilter,
} from '../services/providerService';
import { ProviderListing, DataSourceType } from '../types/models';
import { DEMO_DATA_DISCLAIMER } from '../data/demoData';

export default function CareDirectoryScreen() {
  const { mode, theme, toggleTheme } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [listings, setListings] = useState<ProviderListing[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceType>('demo');

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
    // Boundary check: Never trigger calls on demo/simulated records
    if (isDemo || /demo|no call|inactive/i.test(phone)) {
      Alert.alert(
        'Simulated Demo Record',
        'This is a fictional record created for academic evaluation. Dialing is disabled for simulated records.',
        [{ text: 'Understood' }]
      );
      return;
    }

    const cleanNumber = phone.replace(/[^\d+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(telUrl);
      if (supported) {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Phone Dialing Unavailable', `Cannot place calls to ${phone} from this device.`);
      }
    } catch {
      Alert.alert('Error', 'Unable to initiate phone call.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.canvas }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 1. ACADEMIC & DEMO BOUNDARY NOTICE */}
      <View
        style={[
          styles.disclaimerBanner,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel="Academic baseline notice for care directory"
      >
        <Text style={[styles.disclaimerTag, { color: theme.textMuted }]}>
          [BMSCE CSE SEMESTER 5 MINI PROJECT — DIRECTORY ONLY]
        </Text>
        <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
          {DEMO_DATA_DISCLAIMER}
        </Text>
      </View>

      {/* 2. SCREEN HEADER & THEME TOGGLE */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>
            Care & Emergency Directory
          </Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Reviewed Hospitals, Clinics & Ambulance Contacts
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Toggle theme mode. Current mode is ${mode}`}
          style={[
            styles.themeButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.themeButtonText, { color: theme.textPrimary }]}>
            {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. CALM EMERGENCY BOUNDARY CARD */}
      <View
        style={[
          styles.emergencyCard,
          {
            backgroundColor: theme.emergencyBackground,
            borderColor: theme.emergencyBorder,
          },
        ]}
        accessible={true}
        accessibilityLabel="Emergency truthfulness disclaimer: Directory listings only with zero dispatch claims"
      >
        <Text style={[styles.emergencyBadge, { color: theme.emergencyText }]}>
          [Directory Information Only — Zero Dispatch/Booking]
        </Text>
        <Text style={[styles.emergencyDescription, { color: theme.textSecondary }]}>
          MedFind does not provide real-time hospital bed capacity, emergency-room wait times,
          or ambulance dispatch. Contact casualty desks directly using listed telephone numbers.
        </Text>
      </View>

      {/* 4. CLINICAL SAFETY NOTICE */}
      <View
        style={[
          styles.safetyNotice,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Clinical notice: Directory contacts only, not medical advice"
      >
        <Text style={[styles.safetyNoticeText, { color: theme.textSecondary }]}>
          ℹ️ <Text style={{ fontWeight: '700' }}>Clinical Notice:</Text> This is a contact directory.
          MedFind does not provide clinical triage, diagnosis, or treatment recommendations.
        </Text>
      </View>

      {/* 5. SEARCH FIELD */}
      <View style={styles.searchSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Search Provider Directory
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
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

        {/* Category Filter Chips */}
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
                    backgroundColor: isSelected ? theme.primaryAccent : theme.surface,
                    borderColor: isSelected ? theme.primaryAccent : theme.border,
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
                      color: isSelected ? theme.textInverse : theme.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
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

      {/* 6. DATA SOURCE STATUS BANNER */}
      <View
        style={[
          styles.dataSourceBanner,
          {
            backgroundColor:
              dataSource === 'database' ? theme.badgeBackground : theme.surfaceElevated,
            borderColor:
              dataSource === 'database' ? theme.primaryAccent : theme.border,
          },
        ]}
        accessible={true}
        accessibilityLabel={
          dataSource === 'database'
            ? 'Connected to Supabase directory records'
            : 'Displaying simulated demo fixtures'
        }
      >
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
            ? '● SUPABASE DIRECTORY RECORDS'
            : '○ DEMO DATA MODE (SIMULATED DIRECTORY)'}
        </Text>
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
            { backgroundColor: '#FFF7ED', borderColor: theme.warningAccent },
          ]}
          accessible={true}
          accessibilityRole="alert"
        >
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            ⚠️ {errorMessage}
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
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="No directory listings found"
          >
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
                ? 'HOSPITAL DIRECTORY RECORD'
                : item.type === 'clinic'
                ? 'CLINIC DIRECTORY RECORD'
                : 'AMBULANCE DIRECTORY RECORD';

            return (
              <View
                key={item.id}
                style={[
                  styles.directoryCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                accessible={true}
                accessibilityRole="summary"
                accessibilityLabel={`${item.name}, ${typeLabel}. Address: ${item.address}. Source: ${item.source}`}
              >
                {/* Header: Category Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.categoryBadgeText, { color: theme.primaryAccent }]}>
                    [{typeLabel}]
                  </Text>
                  {isDemo && (
                    <Text style={[styles.demoTag, { color: theme.warningAccent }]}>
                      [SIMULATED]
                    </Text>
                  )}
                </View>

                {/* Facility Name */}
                <Text style={[styles.facilityName, { color: theme.textPrimary }]}>
                  {item.name}
                </Text>

                {/* Physical Address */}
                <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                  📍 {item.address}
                </Text>

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
                              backgroundColor: theme.surfaceElevated,
                              borderColor: theme.border,
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

                {/* Source & Reviewed Date Provenance */}
                <View
                  style={[
                    styles.provenanceContainer,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.provenanceText, { color: theme.textMuted }]}>
                    Source: {item.source}
                  </Text>
                  <Text style={[styles.provenanceText, { color: theme.textMuted }]}>
                    Reviewed: {item.reviewed_at ? item.reviewed_at.split('T')[0] : 'Unrecorded'}
                  </Text>
                </View>

                {/* Phone Contact & Action */}
                <View style={styles.phoneSection}>
                  <Text style={[styles.phoneLabel, { color: theme.textSecondary }]}>
                    Phone: {item.phone}
                  </Text>

                  {isDemo ? (
                    <View
                      style={[
                        styles.demoPhoneNotice,
                        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.demoPhoneNoticeText, { color: theme.textMuted }]}>
                        [Simulated Record — Dialing Disabled]
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleCallPress(item.phone, false)}
                      style={[
                        styles.callButton,
                        {
                          backgroundColor: theme.primaryAccent,
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Call directory desk at ${item.phone}`}
                    >
                      <Text
                        style={[
                          styles.callButtonText,
                          { color: theme.textInverse },
                        ]}
                      >
                        📞 Call Directory Desk
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
  },
  disclaimerBanner: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    marginBottom: layout.spacing.md,
  },
  disclaimerTag: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  disclaimerText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  headerTextGroup: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  screenSubtitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  themeButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  emergencyCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  emergencyBadge: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  safetyNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
    marginBottom: layout.spacing.md,
  },
  safetyNoticeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  searchSection: {
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: layout.spacing.sm,
  },
  searchInput: {
    fontFamily: typography.fontFamilyBold,
    minHeight: layout.minTouchTarget,
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: layout.spacing.sm,
  },
  filterScroll: {
    marginBottom: layout.spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  filterChip: {
    minHeight: 38,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
  },
  dataSourceBanner: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
    marginBottom: layout.spacing.md,
  },
  dataSourceTag: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  dataSourceNotice: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
    marginBottom: layout.spacing.md,
  },
  errorText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  resultsSection: {
    gap: layout.spacing.md,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  resultsBoundaryTag: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
  },
  loadingContainer: {
    padding: layout.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  loadingText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.lg,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  directoryCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  demoTag: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  facilityName: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  addressText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  servicesContainer: {
    gap: 4,
  },
  servicesTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  servicesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  serviceChip: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
  },
  serviceChipText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs - 1,
  },
  provenanceContainer: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  provenanceText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs - 1,
  },
  phoneSection: {
    marginTop: 2,
    gap: layout.spacing.xs,
  },
  phoneLabel: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  demoPhoneNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.xs,
    alignItems: 'center',
  },
  demoPhoneNoticeText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  callButton: {
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
  },
  callButtonText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
