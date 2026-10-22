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
import { layout, typography } from '../theme/tokens';
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

  // Safety & pilot information modal
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

  const isDemoMode = dataSource === 'demo';

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.canvas }]}>
      {/* 1. COMPACT APP HEADER */}
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
              Prescription & Care Directory
            </Text>
          </View>
        </View>

        <View style={styles.headerActionsGroup}>
          {/* Info Modal Trigger */}
          <TouchableOpacity
            onPress={() => setShowSafetyModal(true)}
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View safety and pilot boundaries"
          >
            <Text style={[styles.headerButtonLabel, { color: theme.textSecondary }]}>
              ℹ️ Info
            </Text>
          </TouchableOpacity>

          {/* Theme Switcher */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.headerIconButton,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Toggle theme mode. Current theme is ${mode}`}
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
        {/* 2. ONE CLEAR DEMO / DATA NOTICE NEAR THE TOP */}
        <View
          style={[
            styles.modeNoticeBanner,
            {
              backgroundColor: isDemoMode
                ? mode === 'light'
                  ? '#F6F3EE'
                  : '#161420'
                : theme.badgeBackground,
              borderColor: isDemoMode ? theme.border : theme.primaryAccent,
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
                ? 'ℹ️ Demo data — sample records, not real pharmacy stock.'
                : `● Supabase records — reported availability (${totalPublishedInDb} items in database).`}
            </Text>

            <TouchableOpacity
              onPress={() => setShowSafetyModal(true)}
              style={styles.modeNoticeLink}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View detailed safety and pilot notice"
            >
              <Text
                style={[
                  styles.modeNoticeLinkText,
                  { color: isDemoMode ? theme.textMuted : theme.primaryAccentText },
                ]}
              >
                Pilot info ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Offline / Connection Diagnostic strip (expandable) */}
          {searchError && (
            <View style={styles.diagnosticRow}>
              <Text
                style={[
                  styles.diagnosticNotice,
                  { color: mode === 'light' ? theme.warningAccentText : theme.warningAccent },
                ]}
              >
                ⚠️ Cloud offline: using local sample baseline.
              </Text>
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

          {/* Search Box */}
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.searchPrefixIcon, { color: theme.textMuted }]}>
              🔍
            </Text>
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
                <Text style={[styles.clearButtonIcon, { color: theme.textMuted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Compact Dosage-Form Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            style={styles.filterScrollView}
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
                      styles.filterChipLabel,
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

        {/* 4. CALM & COMPACT EMERGENCY HELP ENTRY */}
        <View
          style={[
            styles.emergencyStrip,
            {
              backgroundColor: theme.emergencyBackground,
              borderColor: theme.emergencyBorder,
            },
          ]}
          accessible={true}
          accessibilityLabel="Emergency Help and Directory entry point"
        >
          <View style={styles.emergencyLeft}>
            <Text style={[styles.emergencyTagText, { color: theme.emergencyText }]}>
              🚨 Emergency & Nearby Care
            </Text>
            <Text style={[styles.emergencyDescriptionText, { color: theme.textSecondary }]}>
              Hospitals, clinics & ambulance contacts (directory only)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/care')}
            style={[
              styles.emergencyDirectoryButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.emergencyBorder,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open Care and Emergency Directory screen"
          >
            <Text style={[styles.emergencyDirectoryButtonText, { color: theme.emergencyText }]}>
              Open Directory →
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. RESULTS LIST */}
        <View style={styles.resultsArea}>
          <View style={styles.resultsHeaderRow}>
            <Text style={[styles.resultsCountText, { color: theme.textPrimary }]}>
              {isLoading
                ? 'Searching records...'
                : `${searchResults.length} result(s) found`}
            </Text>
            <Text style={[styles.resultsBoundaryText, { color: theme.textMuted }]}>
              Participating stores only
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

          {/* Empty State */}
          {!isLoading && searchResults.length === 0 && (
            <View
              style={[
                styles.emptyStateBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              accessible={true}
              accessibilityRole="text"
            >
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No stock records found
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                {searchQuery.trim()
                  ? `No participating pharmacy has published stock for "${searchQuery}" under the "${selectedDosageForm}" filter.`
                  : 'No published stock records currently match this filter.'}
              </Text>
            </View>
          )}

          {/* Quick-Scan Medicine Result Cards */}
          {!isLoading &&
            searchResults.map((item) => {
              const isDemo = item.isDemo || isDemoMode;

              // Format neutral availability labels
              let availabilityLabel = 'Reported: Available';
              let availabilityBg = theme.badgeBackground;
              let availabilityColor = theme.primaryAccentText;

              if (item.state === 'available') {
                availabilityLabel = isDemo
                  ? 'Sample availability: Available'
                  : 'Reported: Available';
                availabilityBg = theme.badgeBackground;
                availabilityColor = theme.primaryAccentText;
              } else if (item.state === 'low_stock') {
                availabilityLabel = isDemo
                  ? 'Sample availability: Low Stock'
                  : 'Reported: Low Stock';
                availabilityBg = mode === 'light' ? '#FFF8EE' : '#261708';
                availabilityColor = mode === 'light' ? theme.warningAccentText : theme.warningAccent;
              } else if (item.state === 'unavailable') {
                availabilityLabel = isDemo
                  ? 'Sample availability: Unavailable'
                  : 'Reported: Unavailable';
                availabilityBg = theme.surfaceElevated;
                availabilityColor = theme.textSecondary;
              } else {
                availabilityLabel = isDemo
                  ? 'Sample availability: Unknown'
                  : 'Reported: Unknown';
                availabilityBg = theme.surfaceElevated;
                availabilityColor = theme.textSecondary;
              }

              // Format neutral update time
              const updateTimeLabel = isDemo
                ? `Sample update: ${item.freshness.relativeTimeText}`
                : `Updated ${item.freshness.relativeTimeText}`;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.medicineCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        item.freshness.state === 'aging' && !isDemo
                          ? theme.warningAccent
                          : theme.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="summary"
                  accessibilityLabel={`${item.brandName}, ${item.genericName}. ${availabilityLabel}. ${updateTimeLabel}`}
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
                      {/* Strength / Form Badge */}
                      {(item.strength || item.dosageForm) && (
                        <View
                          style={[
                            styles.dosagePill,
                            {
                              backgroundColor: theme.surfaceElevated,
                              borderColor: theme.border,
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
                              backgroundColor: theme.surfaceElevated,
                              borderColor: theme.border,
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
                              : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.availabilityBadgeText, { color: availabilityColor }]}>
                        {availabilityLabel}
                      </Text>
                    </View>

                    <Text style={[styles.updateTimeText, { color: theme.textMuted }]}>
                      🕒 {updateTimeLabel}
                    </Text>
                  </View>

                  {/* Pharmacy Name & Contact Info */}
                  <View
                    style={[
                      styles.pharmacyInfoBox,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.pharmacyNameText, { color: theme.textPrimary }]}>
                      🏪 {item.pharmacyName}
                    </Text>
                    <Text style={[styles.pharmacyLocationText, { color: theme.textSecondary }]}>
                      📍 {item.pharmacyAddress}
                    </Text>
                    <Text style={[styles.pharmacyContactText, { color: theme.textMuted }]}>
                      {isDemo ? '📞 Sample contact (no calls)' : `📞 ${item.pharmacyPhone}`}
                    </Text>
                  </View>

                  {/* Call-First warning if real store data is aging */}
                  {item.freshness.requiresCallFirst && !isDemo && (
                    <View
                      style={[
                        styles.callFirstBox,
                        {
                          backgroundColor: mode === 'light' ? '#FFF8EE' : '#231608',
                          borderColor: theme.warningAccent,
                        },
                      ]}
                    >
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
                        ⚠️ Stock snapshot is not live. Call pharmacy to verify before traveling.
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* 6. CONCISE SAFETY & PILOT INFORMATION MODAL */}
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
                backgroundColor: theme.surface,
                borderColor: theme.border,
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
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close safety modal"
              >
                <Text style={[styles.modalCloseIcon, { color: theme.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Demo Data Notice */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                  🎓 Academic Demo Baseline
                </Text>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  {DEMO_DATA_DISCLAIMER}
                </Text>
              </View>

              {/* Clinical Guardrails */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                  ⚕️ Clinical Safety Guardrails
                </Text>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  • MedFind does not provide medical advice, clinical diagnoses, or automatic drug substitutions.{'\n'}
                  • Always consult a licensed pharmacist or physician to verify prescriptions.{'\n'}
                  • Stock status reflects snapshot availability, never continuous real-time inventory.
                </Text>
              </View>

              {/* Privacy */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                  🔒 Privacy & Health Data
                </Text>
                <Text style={[styles.modalSectionText, { color: theme.textSecondary }]}>
                  • MedFind does not collect, track, or upload patient health data or prescriptions.{'\n'}
                  • Location permissions are not required; listings are organized as an indexed directory.
                </Text>
              </View>
            </ScrollView>

            {/* Dismiss Button */}
            <TouchableOpacity
              onPress={() => setShowSafetyModal(false)}
              style={[
                styles.modalDismissBtn,
                { backgroundColor: theme.primaryAccent },
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

  // HEADER
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

  // 2. DEMO / DATA NOTICE BANNER
  modeNoticeBanner: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    marginBottom: layout.spacing.md,
  },
  modeNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeNoticeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  modeNoticeLink: {
    minHeight: 32,
    justifyContent: 'center',
    paddingLeft: layout.spacing.sm,
  },
  modeNoticeLinkText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDD',
  },
  diagnosticNotice: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
    flex: 1,
  },
  diagnosticToggle: {
    minHeight: 26,
    justifyContent: 'center',
    paddingLeft: layout.spacing.sm,
  },
  diagnosticToggleText: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '700',
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
    fontSize: typography.fontSize.md + 1,
    fontWeight: '700',
    marginBottom: layout.spacing.xs + 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: layout.spacing.md,
    marginBottom: layout.spacing.sm,
  },
  searchPrefixIcon: {
    fontSize: 15,
    marginRight: layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    minHeight: 44,
  },
  clearButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonIcon: {
    fontSize: 14,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipLabel: {
    fontSize: typography.fontSize.sm,
  },

  // 4. CALM & COMPACT EMERGENCY HELP
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm + 2,
    marginBottom: layout.spacing.md,
  },
  emergencyLeft: {
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  emergencyTagText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
    marginBottom: 2,
  },
  emergencyDescriptionText: {
    fontSize: typography.fontSize.xs - 1,
    lineHeight: 14,
  },
  emergencyDirectoryButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.sm + 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyDirectoryButtonText: {
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '700',
  },

  // 5. RESULTS LIST
  resultsArea: {
    gap: layout.spacing.sm,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  resultsCountText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  resultsBoundaryText: {
    fontSize: typography.fontSize.xs,
  },
  loadingBox: {
    padding: layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingNoticeText: {
    fontSize: typography.fontSize.xs,
    marginTop: layout.spacing.sm,
  },
  emptyStateBox: {
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.spacing.sm,
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: layout.spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },

  // MEDICINE CARD (QUICK-SCAN)
  medicineCard: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.md,
    gap: layout.spacing.xs + 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleGroup: {
    flex: 1,
    marginRight: layout.spacing.sm,
  },
  brandTitle: {
    fontSize: typography.fontSize.base + 1,
    fontWeight: '800',
  },
  genericSubtitle: {
    fontSize: typography.fontSize.xs + 1,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  dosagePill: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  dosagePillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  demoTagPill: {
    paddingHorizontal: layout.spacing.xs + 3,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  demoTagPillText: {
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '700',
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
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  availabilityBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  updateTimeText: {
    fontSize: typography.fontSize.xs,
  },

  // PHARMACY INFO BOX
  pharmacyInfoBox: {
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    padding: layout.spacing.sm,
    gap: 2,
  },
  pharmacyNameText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  pharmacyLocationText: {
    fontSize: typography.fontSize.xs,
  },
  pharmacyContactText: {
    fontSize: typography.fontSize.xs,
  },

  // CALL FIRST ALERT
  callFirstBox: {
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    padding: layout.spacing.sm,
  },
  callFirstText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },

  // 6. MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  modalSheet: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.lg,
  },
  modalHeader: {
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
  modalCloseBtn: {
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
  modalScroll: {
    marginBottom: layout.spacing.md,
  },
  modalSection: {
    marginBottom: layout.spacing.md,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSectionText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  modalDismissBtn: {
    minHeight: layout.minTouchTarget,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.spacing.md,
  },
  modalDismissBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
});
