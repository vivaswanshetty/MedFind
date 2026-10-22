import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { layout, typography } from '../theme/tokens';
import { Pharmacy, StockState } from '../types/models';
import {
  pharmacyPortalService,
  InventoryItemRow,
  AuditRecordRow,
} from '../services/pharmacyPortalService';
import {
  BackArrowIcon,
  StaffBadgeIcon,
  PharmacyStoreIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningIcon,
  PillCapsuleIcon,
} from '../components/icons/AppIcons';

export default function PharmacyPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, theme } = useTheme();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItemRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMedicineId, setUpdatingMedicineId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Status bar & notch-safe header padding
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) : 0;
  const headerTopPadding = Math.max(insets.top, statusBarHeight) + 12;

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      const stores = await pharmacyPortalService.getPharmacies();
      if (!isCancelled) {
        setPharmacies(stores);
        if (stores.length > 0) {
          const defaultStore = stores[0];
          setSelectedPharmacy(defaultStore);
          const items = await pharmacyPortalService.getInventory(defaultStore.id);
          setInventory(items);
        }
        setAuditLog(pharmacyPortalService.getAuditLog());
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSelectPharmacy = async (store: Pharmacy) => {
    setSelectedPharmacy(store);
    setIsLoading(true);
    const items = await pharmacyPortalService.getInventory(store.id);
    setInventory(items);
    setIsLoading(false);
  };

  const handleUpdateStock = async (medicineId: string, medicineName: string, state: StockState) => {
    if (!selectedPharmacy) return;

    setUpdatingMedicineId(medicineId);
    try {
      await pharmacyPortalService.updateStock(
        selectedPharmacy.id,
        medicineId,
        medicineName,
        state,
        'Staff On-Duty'
      );

      // Refresh inventory
      const updated = await pharmacyPortalService.getInventory(selectedPharmacy.id);
      setInventory(updated);
      setAuditLog([...pharmacyPortalService.getAuditLog()]);

      // Show confirmation toast
      setSuccessToast(`${medicineName} updated to ${state.toUpperCase()}`);
      setTimeout(() => {
        setSuccessToast(null);
      }, 2500);
    } finally {
      setUpdatingMedicineId(null);
    }
  };

  return (
    <View style={[styles.screenRoot, { backgroundColor: theme.canvas }]}>
      {/* 1. APPLE IOS LIQUID GLASS HEADER */}
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
        <TouchableOpacity
          onPress={() => router.back()}
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
          accessibilityLabel="Back to Home screen"
        >
          <BackArrowIcon size={18} color={theme.textPrimary} />
          <Text style={[styles.headerButtonText, { color: theme.textPrimary }]}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text
            style={[styles.headerTitleText, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            Staff Stock Portal
          </Text>
          <Text style={[styles.headerSubtitleText, { color: theme.textSecondary }]}>
            PRD FR 06 Fast Update Flow
          </Text>
        </View>

        <View
          style={[
            styles.staffIndicator,
            {
              backgroundColor: theme.glass.backgroundPill,
              borderColor: theme.glass.border,
            },
          ]}
        >
          <StaffBadgeIcon size={18} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. SUCCESS CONFIRMATION TOAST */}
        {successToast && (
          <View
            style={[
              styles.toastBox,
              {
                backgroundColor: mode === 'light' ? 'rgba(238, 243, 234, 0.95)' : 'rgba(11, 34, 40, 0.9)',
                borderColor: theme.primaryAccent,
              },
            ]}
          >
            <CheckCircleIcon size={18} />
            <Text
              style={[
                styles.toastText,
                { color: mode === 'light' ? theme.primaryAccentText : theme.primaryAccent },
              ]}
            >
              {successToast}
            </Text>
          </View>
        )}

        {/* 3. STORE SELECTOR CARD (LIQUID GLASS) */}
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: theme.glass.background,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <PharmacyStoreIcon size={18} color={mode === 'light' ? '#87A96B' : '#00E5FF'} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Select Assigned Pharmacy
            </Text>
          </View>

          {/* Pharmacy Pill Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storePickerContainer}
          >
            {pharmacies.map((store) => {
              const isSelected = selectedPharmacy?.id === store.id;
              return (
                <TouchableOpacity
                  key={store.id}
                  onPress={() => handleSelectPharmacy(store)}
                  style={[
                    styles.storeChip,
                    {
                      backgroundColor: isSelected
                        ? mode === 'light'
                          ? theme.primaryAccent
                          : theme.secondaryAccent
                        : theme.glass.backgroundPill,
                      borderColor: isSelected
                        ? theme.primaryAccent
                        : theme.glass.border,
                      shadowColor: theme.glass.shadowColor,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.storeChipText,
                      {
                        color: isSelected
                          ? mode === 'light'
                            ? theme.textInverse
                            : theme.primaryAccent
                          : theme.textPrimary,
                        fontFamily: isSelected
                          ? typography.fontFamilySemibold
                          : typography.fontFamilyMedium,
                      },
                    ]}
                  >
                    {store.name.split(' (')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Store Details Inset */}
          {selectedPharmacy && (
            <View
              style={[
                styles.activeStoreInset,
                {
                  backgroundColor: theme.glass.backgroundSubtle,
                  borderColor: theme.glass.borderSubtle,
                },
              ]}
            >
              <View style={styles.activeStoreRow}>
                <ShieldCheckIcon size={16} color={theme.primaryAccent} />
                <Text style={[styles.activeStoreName, { color: theme.textPrimary }]}>
                  {selectedPharmacy.name}
                </Text>
              </View>
              <Text style={[styles.activeStoreAddress, { color: theme.textSecondary }]}>
                {selectedPharmacy.address}
              </Text>
              <Text style={[styles.activeStoreHours, { color: theme.textMuted }]}>
                Hours: {selectedPharmacy.opening_hours || 'Standard Business Hours'}
              </Text>
            </View>
          )}
        </View>

        {/* 4. INVENTORY RAPID 1-TAP UPDATE LIST */}
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: theme.glass.background,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <PillCapsuleIcon size={18} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Medicine Stock Visibility
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Tap a state below to record an append-only snapshot in under 1 minute.
          </Text>

          {isLoading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="small" color={theme.primaryAccent} />
              <Text style={[styles.loadingLabel, { color: theme.textSecondary }]}>
                Loading store inventory...
              </Text>
            </View>
          ) : (
            inventory.map((row) => {
              const med = row.medicine;
              const snap = row.currentSnapshot;
              const currentState = snap?.state || 'unknown';
              const isUpdating = updatingMedicineId === med.id;

              return (
                <View
                  key={med.id}
                  style={[
                    styles.medicineItemRow,
                    {
                      backgroundColor: theme.glass.backgroundSubtle,
                      borderColor: theme.glass.borderSubtle,
                    },
                  ]}
                >
                  {/* Medicine Name & Current State */}
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleGroup}>
                      <Text style={[styles.brandName, { color: theme.textPrimary }]}>
                        {med.brand_name}
                      </Text>
                      <Text style={[styles.genericName, { color: theme.textSecondary }]}>
                        {med.generic_name} ({med.strength} • {med.dosage_form})
                      </Text>
                    </View>

                    {/* Current State Pill */}
                    <View
                      style={[
                        styles.currentStateBadge,
                        {
                          backgroundColor:
                            currentState === 'available'
                              ? theme.badgeBackground
                              : currentState === 'low_stock'
                              ? mode === 'light'
                                ? 'rgba(255, 248, 238, 0.95)'
                                : 'rgba(38, 23, 8, 0.85)'
                              : theme.glass.backgroundPill,
                          borderColor:
                            currentState === 'available'
                              ? theme.primaryAccent
                              : currentState === 'low_stock'
                              ? theme.warningAccent
                              : theme.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentStateText,
                          {
                            color:
                              currentState === 'available'
                                ? theme.primaryAccentText
                                : currentState === 'low_stock'
                                ? mode === 'light'
                                  ? theme.warningAccentText
                                  : theme.warningAccent
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        {currentState.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  {/* 4 Rapid 1-Tap Update Buttons */}
                  <View style={styles.buttonsGrid}>
                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'available')}
                      style={[
                        styles.quickStateBtn,
                        currentState === 'available' && styles.quickStateBtnActive,
                        {
                          backgroundColor:
                            currentState === 'available'
                              ? theme.primaryAccent
                              : theme.glass.backgroundPill,
                          borderColor:
                            currentState === 'available'
                              ? theme.primaryAccent
                              : theme.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          {
                            color:
                              currentState === 'available'
                                ? theme.textInverse
                                : theme.textPrimary,
                          },
                        ]}
                      >
                        Available
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'low_stock')}
                      style={[
                        styles.quickStateBtn,
                        currentState === 'low_stock' && styles.quickStateBtnActive,
                        {
                          backgroundColor:
                            currentState === 'low_stock'
                              ? theme.warningAccent
                              : theme.glass.backgroundPill,
                          borderColor:
                            currentState === 'low_stock'
                              ? theme.warningAccent
                              : theme.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          {
                            color:
                              currentState === 'low_stock'
                                ? '#FFFFFF'
                                : theme.textPrimary,
                          },
                        ]}
                      >
                        Low Stock
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'unavailable')}
                      style={[
                        styles.quickStateBtn,
                        currentState === 'unavailable' && styles.quickStateBtnActive,
                        {
                          backgroundColor:
                            currentState === 'unavailable'
                              ? mode === 'light'
                                ? '#6B7280'
                                : '#374151'
                              : theme.glass.backgroundPill,
                          borderColor:
                            currentState === 'unavailable'
                              ? '#6B7280'
                              : theme.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          {
                            color:
                              currentState === 'unavailable'
                                ? '#FFFFFF'
                                : theme.textSecondary,
                          },
                        ]}
                      >
                        Unavailable
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={isUpdating}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'unknown')}
                      style={[
                        styles.quickStateBtn,
                        currentState === 'unknown' && styles.quickStateBtnActive,
                        {
                          backgroundColor:
                            currentState === 'unknown'
                              ? mode === 'light'
                                ? '#9CA3AF'
                                : '#4B5563'
                              : theme.glass.backgroundPill,
                          borderColor:
                            currentState === 'unknown'
                              ? '#9CA3AF'
                              : theme.glass.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          {
                            color:
                              currentState === 'unknown'
                                ? '#FFFFFF'
                                : theme.textMuted,
                          },
                        ]}
                      >
                        Unknown
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 5. AUDIT LOG SUMMARY (PRD FR 07 AUDITABILITY) */}
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: theme.glass.background,
              borderColor: theme.glass.border,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <ClockIcon size={16} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Recent Append-Only Audit Log
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            All snapshot changes preserve immutable timestamps and staff updater identities.
          </Text>

          {auditLog.map((log) => (
            <View
              key={log.id}
              style={[
                styles.auditRow,
                {
                  backgroundColor: theme.glass.backgroundSubtle,
                  borderColor: theme.glass.borderSubtle,
                },
              ]}
            >
              <View style={styles.auditLeft}>
                <Text style={[styles.auditMedText, { color: theme.textPrimary }]}>
                  {log.medicineName}
                </Text>
                <Text style={[styles.auditMetaText, { color: theme.textMuted }]}>
                  By {log.updater} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View
                style={[
                  styles.auditBadge,
                  {
                    backgroundColor:
                      log.newState === 'available'
                        ? theme.badgeBackground
                        : log.newState === 'low_stock'
                        ? mode === 'light'
                          ? 'rgba(255, 248, 238, 0.95)'
                          : 'rgba(38, 23, 8, 0.85)'
                        : theme.glass.backgroundPill,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.auditBadgeText,
                    {
                      color:
                        log.newState === 'available'
                          ? theme.primaryAccentText
                          : log.newState === 'low_stock'
                          ? mode === 'light'
                            ? theme.warningAccentText
                            : theme.warningAccent
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {log.newState.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 6. ETHICAL & CLINICAL SAFETY NOTICE */}
        <View
          style={[
            styles.safetyCard,
            {
              backgroundColor: theme.glass.backgroundSubtle,
              borderColor: theme.glass.borderSubtle,
            },
          ]}
        >
          <WarningIcon size={16} />
          <Text style={[styles.safetyText, { color: theme.textSecondary }]}>
            Clinical Integrity: Staff snapshots represent verified snapshot availability, not automatic reserves or continuous feeds. Missing inputs strictly resolve to Unknown.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLiquidButton: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '500',
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  headerSubtitleText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
    marginTop: 1,
  },
  staffIndicator: {
    width: 38,
    height: 38,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.md,
    paddingBottom: layout.spacing.xl * 2,
    gap: layout.spacing.md,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
  },
  toastText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
    flex: 1,
  },
  cardBox: {
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    padding: layout.spacing.md + 2,
    gap: layout.spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  },
  storePickerContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
    paddingVertical: 2,
  },
  storeChip: {
    minHeight: layout.minTouchTarget,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  storeChipText: {
    fontSize: typography.fontSize.xs + 1,
  },
  activeStoreInset: {
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    padding: layout.spacing.sm + 2,
    gap: 4,
    marginTop: 4,
  },
  activeStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStoreName: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  activeStoreAddress: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  activeStoreHours: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
  },
  loadingArea: {
    padding: layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingLabel: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
  },
  medicineItemRow: {
    borderRadius: layout.borderRadius.md + 2,
    borderWidth: 1,
    padding: layout.spacing.sm + 4,
    gap: 10,
    marginTop: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: layout.spacing.xs,
  },
  itemTitleGroup: {
    flex: 1,
  },
  brandName: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  genericName: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    marginTop: 1,
  },
  currentStateBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  currentStateText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  buttonsGrid: {
    flexDirection: 'row',
    gap: layout.spacing.xs + 2,
  },
  quickStateBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickStateBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickBtnText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '500',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  auditLeft: {
    flex: 1,
  },
  auditMedText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs + 1,
    fontWeight: '600',
  },
  auditMetaText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
    marginTop: 2,
  },
  auditBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
  },
  auditBadgeText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
  },
  safetyText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
    flex: 1,
  },
});
