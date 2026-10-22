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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography, statusLabels } from '../theme/tokens';
import {
  searchMedicineStock,
  MedicineSearchResultItem,
  DataSource,
} from '../services/medicineSearch';
import { DEMO_DATA_DISCLAIMER } from '../data/demoData';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, theme, toggleTheme } = useTheme();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDosageForm, setSelectedDosageForm] = useState<string>('All');

  // Async data state
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<MedicineSearchResultItem[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [totalPublishedInDb, setTotalPublishedInDb] = useState<number>(0);

  // Safety & academic baseline disclosure modal
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Dosage form filter list
  const dosageForms = ['All', 'Tablet', 'Capsule', 'Inhaler', 'Powder'];

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

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.canvas }]}>
      {/* 1. COMPACT INTEGRATED APP HEADER */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeftGroup}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor:
                  mode === 'light' ? theme.badgeBackground : theme.surfaceElevated,
                borderColor: theme.primaryAccent,
              },
            ]}
          >
            <Text style={[styles.logoIcon, { color: theme.primaryAccent }]}>+</Text>
          </View>
          <View style={styles.titleColumn}>
            <Text style={[styles.appTitle, { color: theme.textPrimary }]}>
              MedFind
            </Text>
            <Text style={[styles.appTagline, { color: theme.textMuted }]}>
              Prescription Stock & Care Directory
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsGroup}>
          {/* Safety & Academic Notice Trigger */}
          <TouchableOpacity
            onPress={() => setShowSafetyModal(true)}
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View safety, academic baseline, and data boundaries"
          >
            <Text style={[styles.headerButtonLabel, { color: theme.textSecondary }]}>
              ℹ️ Info
            </Text>
          </TouchableOpacity>

          {/* Theme Mode Switcher */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Toggle color theme. Current theme is ${mode}`}
          >
            <Text style={[styles.headerButtonLabel, { color: theme.textSecondary }]}>
              {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. CONCISE PILOT & DATA STATUS BAR */}
        <View
          style={[
            styles.statusBarCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.statusIndicatorRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    dataSource === 'database'
                      ? theme.badgeBackground
                      : theme.surfaceElevated,
                  borderColor:
                    dataSource === 'database' ? theme.primaryAccent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color:
                      dataSource === 'database'
                        ? theme.primaryAccentText
                        : theme.textSecondary,
                  },
                ]}
              >
                {dataSource === 'database'
                  ? '● Supabase Cloud Records'
                  : '○ Simulated Demo Mode'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowSafetyModal(true)}
              style={styles.pilotDisclosureTrigger}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View BMSCE pilot details and clinical boundaries"
            >
              <Text style={[styles.pilotDisclosureText, { color: theme.textMuted }]}>
                BMSCE Pilot Notice ›
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.statusSubtitle, { color: theme.textSecondary }]}>
            {dataSource === 'database'
              ? `Displaying reported stock snapshots from Supabase (${totalPublishedInDb} records in database).`
              : 'Supabase contains no active records. Displaying simulated Basavanagudi demo baseline.'}
          </Text>

          {/* Non-intrusive Offline / Cloud Notification if applicable */}
          {searchError && (
            <View
              style={[
                styles.compactAlertStrip,
                {
                  backgroundColor: mode === 'light' ? '#FFF8EE' : '#231608',
                  borderColor: theme.warningAccent,
                },
              ]}
            >
              <View style={styles.alertHeaderRow}>
                <Text
                  style={[
                    styles.alertTitleText,
                    {
                      color:
                        mode === 'light'
                          ? theme.warningAccentText
                          : theme.warningAccent,
                    },
                  ]}
                >
                  ⚠️ Cloud unreachable. Using simulated demo baseline.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowErrorDetails((prev) => !prev)}
                  style={styles.errorDetailsToggle}
                >
                  <Text
                    style={[
                      styles.errorDetailsToggleText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {showErrorDetails ? 'Hide' : 'Details'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showErrorDetails && (
                <Text style={[styles.errorMonospaceText, { color: theme.textMuted }]}>
                  {searchError}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 3. PROMINENT MEDICINE SEARCH & DOSAGE FILTERS */}
        <View style={styles.searchSection}>
          <Text style={[styles.sectionOverline, { color: theme.textMuted }]}>
            MEDICINE LOOKUP (PARTICIPATING PHARMACIES ONLY)
          </Text>

          <View
            style={[
              styles.searchInputWrapper,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.searchIconSymbol, { color: theme.textMuted }]}>
              🔍
            </Text>
            <TextInput
              style={[styles.searchInputField, { color: theme.textPrimary }]}
              placeholder="Search by brand, generic name, or alias..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessible={true}
              accessibilityLabel="Search medicine input field"
              accessibilityHint="Type a brand or generic name to check reported pharmacy stock"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearSearchButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <Text style={[styles.clearSearchIcon, { color: theme.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dosage Form Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipContainer}
            style={styles.filterScrollView}
          >
            {dosageForms.map((form) => {
              const isSelected = selectedDosageForm === form;
              return (
                <TouchableOpacity
                  key={form}
                  onPress={() => setSelectedDosageForm(form)}
                  style={[
                    styles.dosageFilterChip,
                    {
                      backgroundColor: isSelected
                        ? mode === 'light'
                          ? theme.primaryAccent
                          : theme.secondaryAccent
                        : theme.surface,
                      borderColor: isSelected
                        ? mode === 'light'
                          ? theme.primaryAccent
                          : theme.primaryAccent
                        : theme.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filter by dosage form: ${form}`}
                >
                  <Text
                    style={[
                      styles.dosageFilterChipText,
                      {
                        color: isSelected
                          ? mode === 'light'
                            ? theme.textInverse
                            : theme.primaryAccent
                          : theme.textSecondary,
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

        {/* 4. CALM PERSISTENT EMERGENCY & CARE ENTRY */}
        <View
          style={[
            styles.emergencyCard,
            {
              backgroundColor: theme.emergencyBackground,
              borderColor: theme.emergencyBorder,
            },
          ]}
          accessible={true}
          accessibilityLabel="Emergency Help and Care Directory shortcut"
        >
          <View style={styles.emergencyHeaderRow}>
            <View style={styles.emergencyTitleGroup}>
              <Text style={[styles.emergencyTag, { color: theme.emergencyText }]}>
                [EMERGENCY & CARE DIRECTORY]
              </Text>
              <Text style={[styles.emergencyTitle, { color: theme.textPrimary }]}>
                Hospitals, Clinics & Ambulance Contacts
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/care')}
              style={[
                styles.emergencyActionButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.emergencyBorder,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Open Full Care and Emergency Directory"
            >
              <Text style={[styles.emergencyActionText, { color: theme.emergencyText }]}>
                Open Directory →
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.emergencyNoticeText, { color: theme.textSecondary }]}>
            Directory contact reference only. MedFind makes zero claims of live ambulance
            dispatch, response times, or hospital bed capacity.
          </Text>
        </View>

        {/* 5. MEDICINE RESULTS FEED */}
        <View style={styles.resultsFeed}>
          <View style={styles.resultsFeedHeader}>
            <Text style={[styles.resultsFeedTitle, { color: theme.textPrimary }]}>
              {isLoading
                ? 'Searching records...'
                : `Reported Stock Snapshots (${searchResults.length})`}
            </Text>
            <Text style={[styles.resultsFeedBoundary, { color: theme.textMuted }]}>
              Participating Stores Only
            </Text>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={mode === 'light' ? theme.primaryAccentText : theme.primaryAccent}
              />
              <Text style={[styles.loadingNotice, { color: theme.textSecondary }]}>
                Checking participating pharmacy inventory snapshots...
              </Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading && searchResults.length === 0 && (
            <View
              style={[
                styles.emptyStateContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              accessible={true}
              accessibilityRole="text"
            >
              <Text style={[styles.emptyStateIcon, { color: theme.textMuted }]}>
                📋
              </Text>
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
                No Participating Stock Records Found
              </Text>
              <Text style={[styles.emptyStateBody, { color: theme.textSecondary }]}>
                {searchQuery.trim()
                  ? `No participating pharmacy has published stock for "${searchQuery}" under the "${selectedDosageForm}" filter. Try adjusting your query.`
                  : 'No published stock records currently match the selected filter criteria.'}
              </Text>
            </View>
          )}

          {/* Result Cards */}
          {!isLoading &&
            searchResults.map((item) => {
              const isDemo = item.isDemo || dataSource === 'demo';
              const stockMap = isDemo
                ? statusLabels.stock.demo
                : statusLabels.stock.database;
              const stockDescriptor = stockMap[item.state] || stockMap.unknown;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.medicineCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        item.freshness.state === 'aging'
                          ? theme.warningAccent
                          : theme.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="summary"
                  accessibilityLabel={`${item.brandName}, ${item.genericName}, ${stockDescriptor.accessibilityLabel}. ${item.freshness.accessibilityLabel}`}
                >
                  {/* Card Top: Brand Name, Dosage & Availability Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.medicineTitleBlock}>
                      <Text style={[styles.brandNameText, { color: theme.textPrimary }]}>
                        {item.brandName}
                      </Text>
                      <Text style={[styles.genericNameText, { color: theme.textSecondary }]}>
                        {item.genericName}
                      </Text>
                    </View>

                    {/* Dosage & Strength Pill */}
                    {(item.strength || item.dosageForm) && (
                      <View
                        style={[
                          styles.dosageBadge,
                          {
                            backgroundColor: theme.surfaceElevated,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.dosageBadgeText, { color: theme.textSecondary }]}>
                          {item.strength}
                          {item.strength && item.dosageForm ? ' • ' : ''}
                          {item.dosageForm}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Availability & Freshness Row */}
                  <View style={styles.statusRow}>
                    {/* Availability Tag */}
                    <View
                      style={[
                        styles.availabilityPill,
                        {
                          backgroundColor:
                            item.state === 'available'
                              ? theme.badgeBackground
                              : item.state === 'low_stock'
                              ? mode === 'light'
                                ? '#FFF8EE'
                                : '#261708'
                              : theme.surfaceElevated,
                          borderColor:
                            item.state === 'available'
                              ? theme.primaryAccent
                              : item.state === 'low_stock'
                              ? theme.warningAccent
                              : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityPillText,
                          {
                            color:
                              item.state === 'available'
                                ? theme.primaryAccentText
                                : item.state === 'low_stock'
                                ? theme.warningAccentText
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        {stockDescriptor.symbol} {stockDescriptor.text}
                      </Text>
                    </View>

                    {/* Freshness Badge */}
                    <View
                      style={[
                        styles.freshnessChip,
                        {
                          backgroundColor:
                            item.freshness.state === 'aging'
                              ? mode === 'light'
                                ? '#FFF4E5'
                                : '#2A1806'
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
                          styles.freshnessChipText,
                          {
                            color:
                              item.freshness.state === 'aging'
                                ? theme.warningAccentText
                                : theme.textMuted,
                          },
                        ]}
                      >
                        🕒 {item.freshness.badgeLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Timestamp Disclosure */}
                  <Text style={[styles.timestampDetail, { color: theme.textMuted }]}>
                    {isDemo ? 'Simulated recorded time: ' : 'Recorded at: '}
                    {item.updatedAt
                      ? item.updatedAt.replace('T', ' ').slice(0, 19) + ' UTC'
                      : 'None'}
                  </Text>

                  {/* Pharmacy Store & Contact Info */}
                  <View
                    style={[
                      styles.pharmacyContainer,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.pharmacyTitle, { color: theme.textPrimary }]}>
                      🏪 {item.pharmacyName}
                    </Text>
                    <Text style={[styles.pharmacyAddress, { color: theme.textSecondary }]}>
                      📍 {item.pharmacyAddress}
                    </Text>
                    <Text style={[styles.pharmacyPhone, { color: theme.textMuted }]}>
                      Phone: {item.pharmacyPhone}
                    </Text>
                  </View>

                  {/* Simulated Record Disclaimer on demo fixtures */}
                  {isDemo && (
                    <View
                      style={[
                        styles.demoRecordTag,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.demoRecordTagText, { color: theme.textMuted }]}>
                        [Simulated Test Fixture • Fictional Record — Non-actionable]
                      </Text>
                    </View>
                  )}

                  {/* Call-First Guidance on Aging Real Data */}
                  {item.freshness.requiresCallFirst && !isDemo && (
                    <View
                      style={[
                        styles.callFirstAlert,
                        {
                          backgroundColor: mode === 'light' ? '#FFF8EE' : '#231608',
                          borderColor: theme.warningAccent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.callFirstAlertText,
                          {
                            color:
                              mode === 'light'
                                ? theme.warningAccentText
                                : theme.warningAccent,
                          },
                        ]}
                      >
                        ⚠️ Stock snapshot is not live. Call pharmacy to verify before traveling.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* 6. COMPACT ACCESSIBLE SAFETY & PILOT DISCLOSURE MODAL */}
      <Modal
        visible={showSafetyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="MedFind Pilot & Safety Boundaries Notice"
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  Safety & Pilot Boundaries
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  BMSCE CSE Semester 5 Mini Project
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowSafetyModal(false)}
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close safety modal"
              >
                <Text style={[styles.modalCloseIcon, { color: theme.textPrimary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody}>
              {/* Academic Baseline Section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionHeader, { color: theme.textPrimary }]}>
                  🎓 Academic Project Evaluation Baseline
                </Text>
                <Text style={[styles.modalSectionBody, { color: theme.textSecondary }]}>
                  {DEMO_DATA_DISCLAIMER}
                </Text>
              </View>

              {/* Clinical Boundaries */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionHeader, { color: theme.textPrimary }]}>
                  ⚕️ Clinical Safety Guardrails
                </Text>
                <Text style={[styles.modalSectionBody, { color: theme.textSecondary }]}>
                  • MedFind does not provide clinical diagnoses, dosage calculations, or drug substitutions.{'\n'}
                  • Always consult a licensed pharmacist or physician before consuming or replacing medications.{'\n'}
                  • Stock status indicates reported availability, never live continuous inventory.
                </Text>
              </View>

              {/* Data & Privacy Boundaries */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionHeader, { color: theme.textPrimary }]}>
                  🔒 Privacy & Device Permissions
                </Text>
                <Text style={[styles.modalSectionBody, { color: theme.textSecondary }]}>
                  • Zero patient health information (PHI) or prescription uploads are collected or stored.{'\n'}
                  • Location permissions are not required; facilities are presented strictly as an indexed directory.{'\n'}
                  • Demo records do not initiate device telephone calls.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Dismiss Button */}
            <TouchableOpacity
              onPress={() => setShowSafetyModal(false)}
              style={[
                styles.modalDismissButton,
                { backgroundColor: theme.primaryAccent },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal and return to search"
            >
              <Text style={[styles.modalDismissButtonText, { color: theme.textInverse }]}>
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

  // 1. HEADER
  headerBar: {
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.sm,
  },
  logoIcon: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  titleColumn: {
    flex: 1,
  },
  appTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  headerIconButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  // SCROLL CONTAINER
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
  },

  // 2. STATUS BAR CARD
  statusBarCard: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  pilotDisclosureTrigger: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: layout.spacing.xs,
  },
  pilotDisclosureText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  statusSubtitle: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
    marginTop: 2,
  },
  compactAlertStrip: {
    marginTop: layout.spacing.sm,
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    flex: 1,
  },
  errorDetailsToggle: {
    minHeight: 28,
    justifyContent: 'center',
    paddingLeft: layout.spacing.sm,
  },
  errorDetailsToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  errorMonospaceText: {
    fontSize: typography.fontSize.xs - 1,
    fontFamily: 'monospace',
    marginTop: 4,
  },

  // 3. SEARCH & FILTERS
  searchSection: {
    marginBottom: layout.spacing.md,
  },
  sectionOverline: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  searchIconSymbol: {
    fontSize: 16,
    marginRight: layout.spacing.sm,
  },
  searchInputField: {
    flex: 1,
    fontSize: typography.fontSize.base,
    minHeight: 44,
  },
  clearSearchButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterScrollView: {
    marginTop: 2,
  },
  filterChipContainer: {
    flexDirection: 'row',
    gap: layout.spacing.xs + 2,
  },
  dosageFilterChip: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dosageFilterChipText: {
    fontSize: typography.fontSize.sm,
  },

  // 4. EMERGENCY ENTRY CARD
  emergencyCard: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.lg,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emergencyTitleGroup: {
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  emergencyTag: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emergencyTitle: {
    fontSize: typography.fontSize.sm + 1,
    fontWeight: '700',
  },
  emergencyActionButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyActionText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
  },
  emergencyNoticeText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },

  // 5. RESULTS FEED
  resultsFeed: {
    gap: layout.spacing.sm + 2,
  },
  resultsFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultsFeedTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  resultsFeedBoundary: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingNotice: {
    fontSize: typography.fontSize.xs,
    marginTop: layout.spacing.sm,
  },
  emptyStateContainer: {
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.spacing.sm,
  },
  emptyStateIcon: {
    fontSize: 28,
    marginBottom: layout.spacing.sm,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateBody: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },

  // MEDICINE CARD
  medicineCard: {
    borderRadius: layout.borderRadius.md + 2,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicineTitleBlock: {
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  brandNameText: {
    fontSize: typography.fontSize.base + 1,
    fontWeight: '800',
  },
  genericNameText: {
    fontSize: typography.fontSize.xs + 1,
    fontStyle: 'italic',
    marginTop: 2,
  },
  dosageBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  dosageBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  // STATUS & FRESHNESS ROW
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.xs + 2,
    alignItems: 'center',
  },
  availabilityPill: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  availabilityPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  freshnessChip: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  freshnessChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  timestampDetail: {
    fontSize: typography.fontSize.xs - 1,
  },

  // PHARMACY DETAILS
  pharmacyContainer: {
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    padding: layout.spacing.sm + 2,
  },
  pharmacyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  pharmacyAddress: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  pharmacyPhone: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  demoRecordTag: {
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    padding: layout.spacing.xs + 2,
    alignItems: 'center',
  },
  demoRecordTagText: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  callFirstAlert: {
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    padding: layout.spacing.sm,
  },
  callFirstAlertText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  // 6. MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalScrollBody: {
    marginBottom: layout.spacing.md,
  },
  modalSection: {
    marginBottom: layout.spacing.md,
  },
  modalSectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSectionBody: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  modalDismissButton: {
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.spacing.md,
  },
  modalDismissButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
