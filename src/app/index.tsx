import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography, statusLabels } from '../theme/tokens';
import { calculateFreshness } from '../utils/freshness';
import {
  demoMedicines,
  demoPharmacies,
  demoStockSnapshots,
  demoProviderListings,
  DEMO_DATA_DISCLAIMER,
} from '../data/demoData';
import { Medicine, StockState } from '../types/models';

export default function HomeScreen() {
  const { mode, theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('All');
  const [showEmergencyDetails, setShowEmergencyDetails] = useState(false);

  // Available dosage form filters
  const dosageForms = ['All', 'Tablet', 'Capsule', 'Inhaler', 'Powder'];

  // Filter medicines based on query and dosage form
  const filteredMedicines = useMemo(() => {
    return demoMedicines.filter((med) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        med.generic_name.toLowerCase().includes(query) ||
        med.brand_name.toLowerCase().includes(query) ||
        med.searchable_aliases.some((alias) => alias.toLowerCase().includes(query));

      const matchesDosage =
        selectedDosageForm === 'All' ||
        med.dosage_form?.toLowerCase() === selectedDosageForm.toLowerCase();

      return matchesQuery && matchesDosage;
    });
  }, [searchQuery, selectedDosageForm]);

  // Aggregate stock snapshot results for filtered medicines
  const searchResults = useMemo(() => {
    const results: Array<{
      medicine: Medicine;
      pharmacyName: string;
      pharmacyAddress: string;
      pharmacyPhone: string;
      state: StockState;
      updatedAt: string;
      freshness: ReturnType<typeof calculateFreshness>;
    }> = [];

    filteredMedicines.forEach((med) => {
      // Find snapshots for this medicine
      const snapshots = demoStockSnapshots.filter((s) => s.medicine_id === med.id);

      snapshots.forEach((snap) => {
        const pharmacy = demoPharmacies.find((p) => p.id === snap.pharmacy_id);
        if (pharmacy) {
          const freshness = calculateFreshness(snap.updated_at);
          results.push({
            medicine: med,
            pharmacyName: pharmacy.name,
            pharmacyAddress: pharmacy.address,
            pharmacyPhone: pharmacy.phone,
            state: snap.state,
            updatedAt: snap.updated_at,
            freshness,
          });
        }
      });
    });

    return results;
  }, [filteredMedicines]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.canvas }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 1. ACADEMIC & DEMO BOUNDARY DISCLAIMER */}
      <View
        style={[
          styles.disclaimerBanner,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.disclaimerTag, { color: theme.textMuted }]}>
          [BMSCE CSE SEMESTER 5 MINI PROJECT — DEMO BASELINE]
        </Text>
        <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
          {DEMO_DATA_DISCLAIMER}
        </Text>
      </View>

      {/* 2. HEADER & THEME TOGGLE */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>
            MedFind
          </Text>
          <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
            Participating Pharmacy & Care Discovery
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          accessible={true}
          accessibilityLabel={`Toggle theme mode. Current mode is ${mode}`}
          style={[
            styles.themeButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.themeButtonText, { color: theme.textPrimary }]}>
            {mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. CALM EMERGENCY HELP ENTRY POINT */}
      <View
        style={[
          styles.emergencyCard,
          {
            backgroundColor: theme.emergencyBackground,
            borderColor: theme.emergencyBorder,
          },
        ]}
      >
        <View style={styles.emergencyHeaderRow}>
          <Text style={[styles.emergencyBadge, { color: theme.emergencyText }]}>
            [Emergency Help & Directory]
          </Text>
          <TouchableOpacity
            onPress={() => setShowEmergencyDetails((prev) => !prev)}
            style={styles.emergencyToggleButton}
            accessibilityLabel="Toggle emergency contact directory information"
          >
            <Text style={[styles.emergencyToggleText, { color: theme.emergencyText }]}>
              {showEmergencyDetails ? 'Hide Directory ▲' : 'View Contacts ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.emergencyDescription, { color: theme.textSecondary }]}>
          Directory contact information only. MedFind makes zero claims of live ambulance
          dispatch, response times, or hospital bed availability.
        </Text>

        {showEmergencyDetails && (
          <View style={styles.emergencyDetailsList}>
            {demoProviderListings.map((prov) => (
              <View
                key={prov.id}
                style={[
                  styles.directoryItem,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.directoryTypeBadge, { color: theme.primaryAccent }]}>
                  {prov.type.toUpperCase()} DIRECTORY RECORD
                </Text>
                <Text style={[styles.directoryName, { color: theme.textPrimary }]}>
                  {prov.name}
                </Text>
                <Text style={[styles.directoryAddress, { color: theme.textMuted }]}>
                  {prov.address}
                </Text>
                <Text style={[styles.directoryPhone, { color: theme.textSecondary }]}>
                  Contact: {prov.phone}
                </Text>
                <Text style={[styles.directorySource, { color: theme.textMuted }]}>
                  Source: {prov.source} • Reviewed: {prov.reviewed_at.split('T')[0]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. CLINICAL SAFETY GUARDRAIL NOTICE */}
      <View
        style={[
          styles.safetyNotice,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.safetyNoticeText, { color: theme.textSecondary }]}>
          ℹ️ <Text style={{ fontWeight: '700' }}>Clinical Safety Notice:</Text> MedFind does
          not provide medical diagnoses, dosage calculations, or automatic medicine substitutions.
          Always confirm prescriptions directly with a licensed pharmacist or physician.
        </Text>
      </View>

      {/* 5. SEARCH & DOSAGE FORM FILTERS */}
      <View style={styles.searchSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Medicine Lookup (Participating Pharmacies Only)
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
          placeholder="Search by brand, generic name, or alias..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          accessible={true}
          accessibilityLabel="Search medicine input field"
        />

        {/* Dosage Form Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {dosageForms.map((form) => {
            const isSelected = selectedDosageForm === form;
            return (
              <TouchableOpacity
                key={form}
                onPress={() => setSelectedDosageForm(form)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primaryAccent : theme.surface,
                    borderColor: isSelected ? theme.primaryAccent : theme.border,
                  },
                ]}
                accessible={true}
                accessibilityLabel={`Filter by dosage form: ${form}`}
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
                  {form}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. SEARCH RESULTS & PARTICIPATING PHARMACY STOCK CARDS */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeaderRow}>
          <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
            Showing {searchResults.length} snapshot result(s)
          </Text>
          <Text style={[styles.resultsBoundaryTag, { color: theme.textMuted }]}>
            Coverage: Participating Stores Only
          </Text>
        </View>

        {searchResults.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
              No Participating Stock Records Found
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              No participating store has published availability for &quot;{searchQuery}&quot; under the
              selected filter. Please verify spelling or contact local pharmacies directly.
            </Text>
          </View>
        ) : (
          searchResults.map((item, index) => {
            const stockDescriptor = statusLabels.stock[item.state] || statusLabels.stock.unknown;

            return (
              <View
                key={`${item.medicine.id}-${item.pharmacyName}-${index}`}
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      item.freshness.state === 'aging'
                        ? theme.warningAccent
                        : theme.border,
                  },
                ]}
              >
                {/* Medicine Descriptor */}
                <View style={styles.cardHeader}>
                  <View style={styles.medTitleGroup}>
                    <Text style={[styles.medBrandName, { color: theme.textPrimary }]}>
                      {item.medicine.brand_name}
                    </Text>
                    <Text style={[styles.medGenericName, { color: theme.textSecondary }]}>
                      {item.medicine.generic_name} • {item.medicine.strength} ({item.medicine.dosage_form})
                    </Text>
                  </View>

                  {/* Stock State Badge (Non-color reliant) */}
                  <View
                    style={[
                      styles.stockStateBadge,
                      {
                        backgroundColor:
                          item.state === 'available'
                            ? theme.badgeBackground
                            : theme.surfaceElevated,
                        borderColor:
                          item.state === 'available'
                            ? theme.primaryAccent
                            : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockStateBadgeText,
                        {
                          color:
                            item.state === 'available'
                              ? theme.primaryAccent
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {stockDescriptor.symbol} {stockDescriptor.text}
                    </Text>
                  </View>
                </View>

                {/* Freshness Status Banner */}
                <View
                  style={[
                    styles.freshnessContainer,
                    {
                      backgroundColor:
                        item.freshness.state === 'aging'
                          ? '#FFF7ED'
                          : item.freshness.state === 'stale'
                          ? '#F9FAFB'
                          : theme.surfaceElevated,
                      borderColor:
                        item.freshness.state === 'aging'
                          ? theme.warningAccent
                          : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.freshnessBadgeText,
                      {
                        color:
                          item.freshness.state === 'aging'
                            ? theme.warningAccent
                            : theme.textPrimary,
                      },
                    ]}
                  >
                    🕒 {item.freshness.badgeLabel}
                  </Text>
                  <Text style={[styles.freshnessGuidance, { color: theme.textSecondary }]}>
                    {item.freshness.guidanceText}
                  </Text>
                  <Text style={[styles.timestampExact, { color: theme.textMuted }]}>
                    Snapshot recorded: {item.updatedAt ? item.updatedAt.replace('T', ' ').slice(0, 19) + ' UTC' : 'None'}
                  </Text>
                </View>

                {/* Pharmacy Information */}
                <View style={styles.pharmacyDetails}>
                  <Text style={[styles.pharmacyName, { color: theme.textPrimary }]}>
                    📍 {item.pharmacyName}
                  </Text>
                  <Text style={[styles.pharmacyAddress, { color: theme.textMuted }]}>
                    {item.pharmacyAddress}
                  </Text>
                  <Text style={[styles.pharmacyPhoneText, { color: theme.textSecondary }]}>
                    Contact: {item.pharmacyPhone}
                  </Text>
                </View>

                {/* Call-First Recommendation when data is aging or stale */}
                {item.freshness.requiresCallFirst && (
                  <View
                    style={[
                      styles.callFirstNotice,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.warningAccent,
                      },
                    ]}
                  >
                    <Text style={[styles.callFirstText, { color: theme.textPrimary }]}>
                      ⚠️ Stock is not live. Call pharmacy to verify before traveling.
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
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
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  disclaimerText: {
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
  appTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  appSubtitle: {
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
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  emergencyCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emergencyBadge: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  emergencyToggleButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  emergencyToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  emergencyDescription: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  emergencyDetailsList: {
    marginTop: layout.spacing.sm,
    gap: layout.spacing.sm,
  },
  directoryItem: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
  },
  directoryTypeBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  directoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  directoryAddress: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  directoryPhone: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  directorySource: {
    fontSize: typography.fontSize.xs - 1,
    marginTop: 2,
  },
  safetyNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
    marginBottom: layout.spacing.md,
  },
  safetyNoticeText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  searchSection: {
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: layout.spacing.sm,
  },
  searchInput: {
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
    minHeight: 36,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
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
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  resultsBoundaryTag: {
    fontSize: typography.fontSize.xs,
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.lg,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medTitleGroup: {
    flex: 1,
    paddingRight: layout.spacing.sm,
  },
  medBrandName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  medGenericName: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  stockStateBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
  },
  stockStateBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  freshnessContainer: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.sm,
  },
  freshnessBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  freshnessGuidance: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  timestampExact: {
    fontSize: typography.fontSize.xs - 1,
    marginTop: 2,
  },
  pharmacyDetails: {
    paddingTop: 2,
  },
  pharmacyName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  pharmacyAddress: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  pharmacyPhoneText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  callFirstNotice: {
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    padding: layout.spacing.xs,
    alignItems: 'center',
  },
  callFirstText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
});
