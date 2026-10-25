import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { AtmosphereBackground } from '../../components/AtmosphereBackground';
import { Pharmacy, StockState } from '../../types/models';
import {
  pharmacyPortalService,
  InventoryItemRow,
  AuditRecordRow,
  StorePartnerAuth,
  formatRelativeTime,
} from '../../services/pharmacyPortalService';
import {
  PharmacyStoreIcon,
  StaffBadgeIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  TrashIcon,
  SearchIcon,
  CloseIcon,
  ZapIcon,
} from '../../components/icons/AppIcons';

type FilterTab = 'all' | 'available' | 'low_stock' | 'unavailable' | 'unreported';

export default function PharmacyInventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const [partnerAuth, setPartnerAuth] = useState<StorePartnerAuth | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItemRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMedicineId, setUpdatingMedicineId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stores, auth] = await Promise.all([
        pharmacyPortalService.getPharmacies(),
        pharmacyPortalService.getStorePartnerAuth(),
      ]);

      if (auth && auth.isAuthorized) {
        setPartnerAuth(auth);
        const currentStore = stores.find((s) => s.id === auth.pharmacyId) || stores[0];
        setSelectedPharmacy(currentStore);
        if (currentStore) {
          const items = await pharmacyPortalService.getInventory(currentStore.id);
          setInventory(items);
        }
      }
      setAuditLog(pharmacyPortalService.getAuditLog());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleUpdateStock = async (medicineId: string, medicineName: string, state: StockState) => {
    if (!selectedPharmacy) return;

    setUpdatingMedicineId(medicineId);
    try {
      const staffName = partnerAuth?.pharmacistName || 'Staff Pharmacist';
      await pharmacyPortalService.updateStock(
        selectedPharmacy.id,
        medicineId,
        medicineName,
        state,
        staffName
      );

      const updated = await pharmacyPortalService.getInventory(selectedPharmacy.id);
      setInventory(updated);
      setAuditLog([...pharmacyPortalService.getAuditLog()]);

      const stateLabel =
        state === 'available' ? 'IN STOCK' : state === 'low_stock' ? 'LOW STOCK' : 'OUT OF STOCK';
      setSuccessToast(`${medicineName} updated to ${stateLabel}`);
      setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
    } finally {
      setUpdatingMedicineId(null);
    }
  };

  const handleRemoveAuditRecord = (id: string, medName: string) => {
    const removed = pharmacyPortalService.removeAuditRecord(id);
    if (removed) {
      setAuditLog([...pharmacyPortalService.getAuditLog()]);
      setSuccessToast(`Removed update for ${medName}`);
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  const handleClearAuditTrail = () => {
    pharmacyPortalService.clearAuditTrail();
    setAuditLog([]);
    setSuccessToast('Audit trail cleared for this session');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Filtered Inventory calculations
  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch =
        query === '' ||
        item.medicine.brand_name.toLowerCase().includes(query) ||
        item.medicine.generic_name.toLowerCase().includes(query) ||
        item.medicine.strength?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'unreported') return item.currentSnapshot === null;
      if (activeFilter === 'available') return item.currentSnapshot?.state === 'available';
      if (activeFilter === 'low_stock') return item.currentSnapshot?.state === 'low_stock';
      if (activeFilter === 'unavailable') return item.currentSnapshot?.state === 'unavailable';

      return true;
    });
  }, [inventory, searchQuery, activeFilter]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const c = {
      all: inventory.length,
      available: 0,
      low_stock: 0,
      unavailable: 0,
      unreported: 0,
    };
    inventory.forEach((i) => {
      if (!i.currentSnapshot) {
        c.unreported++;
      } else if (i.currentSnapshot.state === 'available') {
        c.available++;
      } else if (i.currentSnapshot.state === 'low_stock') {
        c.low_stock++;
      } else if (i.currentSnapshot.state === 'unavailable') {
        c.unavailable++;
      }
    });
    return c;
  }, [inventory]);

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      {/* TOP HEADER */}
      <View style={[styles.headerBar, { paddingTop }]}>
        <View style={styles.headerLeftCol}>
          <View style={styles.titleBadgeRow}>
            <Text style={[styles.headerTitleText, { color: palette.ink, fontFamily: fonts.sansBold }]}>
              Staff Portal
            </Text>
            <View style={[styles.activePill, { backgroundColor: palette.okTint }]}>
              <Text style={[styles.activePillText, { color: palette.okInk, fontFamily: fonts.sansBold }]}>
                Verified
              </Text>
            </View>
          </View>
          <Text
            style={[styles.headerSubtitleText, { color: palette.ink2, fontFamily: fonts.sans }]}
            numberOfLines={1}
          >
            {partnerAuth?.pharmacyName || selectedPharmacy?.name || 'Community Pharmacy'}
          </Text>
        </View>

        <Pressable
          testID="pharmacy-open-store-settings-btn"
          onPress={() => router.push('/(pharmacy)/store')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open store settings and change role"
          style={({ pressed }) => [
            styles.storeSettingsBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.82 : 1.0,
            },
          ]}
        >
          <PharmacyStoreIcon size={18} color={palette.accent} />
          <Text style={[styles.storeSettingsText, { color: palette.ink, fontFamily: fonts.sansBold }]}>
            Store
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* SUCCESS TOAST */}
        {successToast && (
          <View
            style={[
              styles.toastBox,
              {
                backgroundColor: palette.okTint,
                borderColor: palette.okLine,
              },
            ]}
          >
            <CheckCircleIcon size={16} color={palette.okInk} />
            <Text style={[styles.toastText, { color: palette.okInk, fontFamily: fonts.sansMedium }]} numberOfLines={1}>
              {successToast}
            </Text>
          </View>
        )}

        {/* SEARCH BAR */}
        <View
          style={[
            styles.searchBarBox,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <SearchIcon size={18} color={palette.ink2} />
          <TextInput
            testID="pharmacy-search-input"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search medicine brand, generic name..."
            placeholderTextColor={palette.ink2}
            style={[styles.searchInput, { color: palette.ink, fontFamily: fonts.sans }]}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
              style={styles.clearSearchBtn}
            >
              <CloseIcon size={14} color={palette.ink2} />
            </Pressable>
          )}
        </View>

        {/* FILTER CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {(
            [
              { key: 'all', label: 'All Items', count: counts.all },
              { key: 'available', label: 'In Stock', count: counts.available },
              { key: 'low_stock', label: 'Low Stock', count: counts.low_stock },
              { key: 'unavailable', label: 'Out of Stock', count: counts.unavailable },
              { key: 'unreported', label: 'Unreported', count: counts.unreported },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${tab.label}, ${tab.count} items`}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? palette.accent : palette.surface,
                    borderColor: isActive ? palette.accent : palette.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    {
                      color: isActive ? '#FFFFFF' : palette.ink,
                      fontFamily: isActive ? fonts.sansBold : fonts.sansMedium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.filterChipBadge,
                    {
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : palette.surface2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipBadgeText,
                      {
                        color: isActive ? '#FFFFFF' : palette.ink2,
                        fontFamily: fonts.sansBold,
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* INVENTORY LIST */}
        <View style={styles.inventorySection}>
          <Text style={[styles.sectionTitle, { color: palette.ink2, fontFamily: fonts.sansSemi }]}>
            ON-SHELF DISPENSARY STOCK ({filteredInventory.length})
          </Text>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={palette.accent} />
            </View>
          ) : filteredInventory.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <Text style={[styles.emptyText, { color: palette.ink2, fontFamily: fonts.sans }]}>
                No medicines match your search.
              </Text>
            </View>
          ) : (
            filteredInventory.map((item) => {
              const med = item.medicine;
              const snap = item.currentSnapshot;
              const isUpdating = updatingMedicineId === med.id;

              return (
                <View
                  key={med.id}
                  style={[
                    styles.medicineCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  {/* TOP ROW: NAME & CURRENT STATUS */}
                  <View style={styles.medCardHeader}>
                    <View style={styles.medInfoCol}>
                      <Text
                        style={[styles.medBrandName, { color: palette.ink, fontFamily: fonts.sansBold }]}
                      >
                        {med.brand_name}
                      </Text>
                      <Text
                        style={[
                          styles.medGenericName,
                          { color: palette.ink2, fontFamily: fonts.sans },
                        ]}
                      >
                        {med.generic_name} {med.strength ? `• ${med.strength}` : ''}
                      </Text>
                    </View>

                    {/* STATUS PILL */}
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            snap?.state === 'available'
                              ? palette.okTint
                              : snap?.state === 'low_stock'
                              ? palette.amberTint
                              : snap?.state === 'unavailable'
                              ? palette.badTint
                              : palette.surface2,
                          borderColor:
                            snap?.state === 'available'
                              ? palette.okLine
                              : snap?.state === 'low_stock'
                              ? palette.amberLine
                              : snap?.state === 'unavailable'
                              ? palette.redLine
                              : palette.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color:
                              snap?.state === 'available'
                                ? palette.okInk
                                : snap?.state === 'low_stock'
                                ? palette.amberInk
                                : snap?.state === 'unavailable'
                                ? palette.badInk
                                : palette.ink2,
                            fontFamily: fonts.sansBold,
                          },
                        ]}
                      >
                        {snap?.state === 'available'
                          ? 'In Stock'
                          : snap?.state === 'low_stock'
                          ? 'Low Stock'
                          : snap?.state === 'unavailable'
                          ? 'Out of Stock'
                          : 'Unreported'}
                      </Text>
                    </View>
                  </View>

                  {/* LAST REPORTED TIMESTAMP */}
                  <View style={styles.timestampRow}>
                    <ClockIcon size={12} color={palette.ink2} />
                    <Text
                      style={[
                        styles.timestampText,
                        { color: palette.ink2, fontFamily: fonts.sans },
                      ]}
                    >
                      {snap ? `Updated ${formatRelativeTime(snap.updated_at)}` : 'No reports yet'}
                    </Text>
                  </View>

                  {/* 1-TAP UPDATE ACTIONS */}
                  <View style={styles.actionButtonsRow}>
                    <Pressable
                      testID={`stock-btn-available-${med.id}`}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'available')}
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${med.brand_name} as Available in stock`}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        {
                          backgroundColor:
                            snap?.state === 'available' ? palette.okTint : palette.surface2,
                          borderColor:
                            snap?.state === 'available' ? palette.okLine : palette.line,
                          opacity: pressed ? 0.78 : 1.0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          {
                            color: snap?.state === 'available' ? palette.okInk : palette.ink,
                            fontFamily: fonts.sansSemi,
                          },
                        ]}
                      >
                        Available
                      </Text>
                    </Pressable>

                    <Pressable
                      testID={`stock-btn-low-${med.id}`}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'low_stock')}
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${med.brand_name} as Low stock`}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        {
                          backgroundColor:
                            snap?.state === 'low_stock' ? palette.amberTint : palette.surface2,
                          borderColor:
                            snap?.state === 'low_stock' ? palette.amberLine : palette.line,
                          opacity: pressed ? 0.78 : 1.0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          {
                            color: snap?.state === 'low_stock' ? palette.amberInk : palette.ink,
                            fontFamily: fonts.sansSemi,
                          },
                        ]}
                      >
                        Low Stock
                      </Text>
                    </Pressable>

                    <Pressable
                      testID={`stock-btn-out-${med.id}`}
                      onPress={() => handleUpdateStock(med.id, med.brand_name, 'unavailable')}
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${med.brand_name} as Out of stock`}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        {
                          backgroundColor:
                            snap?.state === 'unavailable' ? palette.badTint : palette.surface2,
                          borderColor:
                            snap?.state === 'unavailable' ? palette.redLine : palette.line,
                          opacity: pressed ? 0.78 : 1.0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          {
                            color: snap?.state === 'unavailable' ? palette.badInk : palette.ink,
                            fontFamily: fonts.sansSemi,
                          },
                        ]}
                      >
                        Out of Stock
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* AUDIT TRAIL COLLAPSIBLE */}
        <View style={styles.auditSection}>
          <Pressable
            testID="toggle-audit-trail-btn"
            onPress={() => setShowAuditDrawer(!showAuditDrawer)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Toggle audit trail records"
            style={[
              styles.auditToggleHeader,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.auditToggleTitleRow}>
              <Text
                style={[
                  styles.auditToggleTitle,
                  { color: palette.ink, fontFamily: fonts.sansBold },
                ]}
              >
                Recent Updates & Audit Log ({auditLog.length})
              </Text>
              <Text
                style={[
                  styles.auditToggleAction,
                  { color: palette.accent, fontFamily: fonts.sansSemi },
                ]}
              >
                {showAuditDrawer ? 'Hide' : 'Show'}
              </Text>
            </View>
          </Pressable>

          {showAuditDrawer && (
            <View
              style={[
                styles.auditDrawerContent,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              {auditLog.length === 0 ? (
                <Text
                  style={[
                    styles.emptyAuditText,
                    { color: palette.ink2, fontFamily: fonts.sans },
                  ]}
                >
                  No staff updates recorded yet in this session.
                </Text>
              ) : (
                <>
                  <View style={styles.auditRecordsList}>
                    {auditLog.slice(0, 10).map((record) => (
                      <View
                        key={record.id}
                        style={[
                          styles.auditRecordItem,
                          { borderBottomColor: palette.line },
                        ]}
                      >
                        <View style={styles.auditRecordInfo}>
                          <Text
                            style={[
                              styles.auditRecordName,
                              { color: palette.ink, fontFamily: fonts.sansBold },
                            ]}
                          >
                            {record.medicineName}
                          </Text>
                          <Text
                            style={[
                              styles.auditRecordMeta,
                              { color: palette.ink2, fontFamily: fonts.sans },
                            ]}
                          >
                            Set to {record.newState.replace('_', ' ')} • {formatRelativeTime(record.timestamp)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => handleRemoveAuditRecord(record.id, record.medicineName)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove audit record for ${record.medicineName}`}
                          style={styles.auditRemoveBtn}
                        >
                          <TrashIcon size={16} color={palette.badInk} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={handleClearAuditTrail}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all audit records for this session"
                    style={[styles.clearAuditBtn, { borderColor: palette.redLine }]}
                  >
                    <Text
                      style={[
                        styles.clearAuditBtnText,
                        { color: palette.badInk, fontFamily: fonts.sansSemi },
                      ]}
                    >
                      Clear Audit Trail
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeftCol: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  headerSubtitleText: {
    fontSize: 13,
  },
  storeSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: MIN_TARGET,
  },
  storeSettingsText: {
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    flex: 1,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  clearSearchBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minHeight: 38,
  },
  filterChipLabel: {
    fontSize: 13,
  },
  filterChipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  filterChipBadgeText: {
    fontSize: 11,
  },
  inventorySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  medicineCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  medInfoCol: {
    flex: 1,
    gap: 2,
  },
  medBrandName: {
    fontSize: 17,
  },
  medGenericName: {
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 13,
  },
  auditSection: {
    marginTop: 8,
  },
  auditToggleHeader: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  auditToggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditToggleTitle: {
    fontSize: 14,
  },
  auditToggleAction: {
    fontSize: 13,
  },
  auditDrawerContent: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  emptyAuditText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  auditRecordsList: {
    gap: 8,
  },
  auditRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  auditRecordInfo: {
    flex: 1,
    gap: 2,
  },
  auditRecordName: {
    fontSize: 14,
  },
  auditRecordMeta: {
    fontSize: 12,
  },
  auditRemoveBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAuditBtn: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearAuditBtnText: {
    fontSize: 13,
  },
});
