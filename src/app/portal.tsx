import React, { useState, useEffect, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../components/AnimatedScreenTransition';
import { Pharmacy, StockState } from '../types/models';
import {
  pharmacyPortalService,
  InventoryItemRow,
  AuditRecordRow,
  StorePartnerAuth,
  formatRelativeTime,
} from '../services/pharmacyPortalService';
import {
  BackArrowIcon,
  StaffBadgeIcon,
  PharmacyStoreIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  TrashIcon,
  SearchIcon,
  CloseIcon,
} from '../components/icons/AppIcons';
import { StoreOnboardingModal } from '../components/portal/StoreOnboardingModal';

type FilterTab = 'all' | 'available' | 'low_stock' | 'unavailable' | 'unreported';

export default function PharmacyPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [partnerAuth, setPartnerAuth] = useState<StorePartnerAuth | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [inventory, setInventory] = useState<InventoryItemRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMedicineId, setUpdatingMedicineId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      const [stores, savedAuth] = await Promise.all([
        pharmacyPortalService.getPharmacies(),
        pharmacyPortalService.getStorePartnerAuth(),
      ]);

      if (isCancelled) return;

      setPharmacies(stores);

      if (savedAuth && savedAuth.isAuthorized) {
        setPartnerAuth(savedAuth);
        const currentStore = stores.find((s) => s.id === savedAuth.pharmacyId) || stores[0];
        setSelectedPharmacy(currentStore);
        const items = await pharmacyPortalService.getInventory(currentStore.id);
        if (!isCancelled) {
          setInventory(items);
        }
      } else {
        // Not authorized yet -> prompt beautiful onboarding flow
        setShowOnboarding(true);
        if (stores.length > 0) {
          setSelectedPharmacy(stores[0]);
        }
      }

      setAuditLog(pharmacyPortalService.getAuditLog());
      setIsLoading(false);
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOnboardingComplete = async (auth: StorePartnerAuth) => {
    await pharmacyPortalService.saveStorePartnerAuth(auth);
    setPartnerAuth(auth);
    setShowOnboarding(false);

    const store = pharmacies.find((p) => p.id === auth.pharmacyId) || selectedPharmacy;
    if (store) {
      setSelectedPharmacy(store);
      setIsLoading(true);
      const items = await pharmacyPortalService.getInventory(store.id);
      setInventory(items);
      setIsLoading(false);
    }

    setAuditLog([...pharmacyPortalService.getAuditLog()]);
    setSuccessToast(`Welcome, ${auth.pharmacistName}. Desk verified!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSwitchStore = async () => {
    setShowOnboarding(true);
  };

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
      const staffName = partnerAuth?.pharmacistName || 'Desk Pharmacist';
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
      setSuccessToast(`Removed ${medName} from audit log`);
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
      // 1. Text Search Filter
      const matchesSearch =
        query === '' ||
        item.medicine.brand_name.toLowerCase().includes(query) ||
        item.medicine.generic_name.toLowerCase().includes(query) ||
        item.medicine.strength?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unreported') return item.currentSnapshot === null;
      if (activeFilter === 'available') return item.currentSnapshot?.state === 'available';
      if (activeFilter === 'low_stock') return item.currentSnapshot?.state === 'low_stock';
      if (activeFilter === 'unavailable') return item.currentSnapshot?.state === 'unavailable';

      return true;
    });
  }, [inventory, searchQuery, activeFilter]);

  // Counts for pills
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

  // If not authorized or switching stores, render the Onboarding Flow full screen
  if (showOnboarding || !partnerAuth || !partnerAuth.isAuthorized) {
    return (
      <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
        <AtmosphereBackground />
        <StoreOnboardingModal
          pharmacies={pharmacies}
          onComplete={handleOnboardingComplete}
          onCancel={
            partnerAuth && partnerAuth.isAuthorized
              ? () => setShowOnboarding(false)
              : () => router.back()
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.screenRoot, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      {/* TOP HEADER */}
      <View style={[styles.headerBar, { paddingTop, backgroundColor: 'transparent' }]}>
        <Pressable
          onPress={() => router.back()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to Home screen"
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <BackArrowIcon size={18} color={palette.ink} />
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitleText, { color: palette.ink }]} numberOfLines={1}>
            Pharmacy Staff Portal
          </Text>
          <Text style={[styles.headerSubtitleText, { color: palette.ink2 }]} numberOfLines={1}>
            {selectedPharmacy?.name || 'Verified Dispensary'} • {partnerAuth.pharmacistName}
          </Text>
        </View>

        <Pressable
          onPress={handleSwitchStore}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Switch store desk or re-verify"
          style={({ pressed }) => [
            styles.switchDeskButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <StaffBadgeIcon size={18} />
          <Text style={[styles.switchDeskText, { color: palette.accent }]}>Switch Desk</Text>
        </Pressable>
      </View>

      <AnimatedScreenTransition style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* SUCCESS CONFIRMATION TOAST */}
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
              <Text style={[styles.toastText, { color: palette.okInk }]} numberOfLines={1}>
                {successToast}
              </Text>
            </View>
          )}

          {/* VERIFIED OPERATING DESK CARD */}
          <View
            style={[
              styles.deskCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            <View style={styles.deskCardRow}>
              <View style={[styles.deskIconCircle, { backgroundColor: palette.okTint }]}>
                <ShieldCheckIcon size={20} color={palette.okInk} />
              </View>
              <View style={styles.deskTextCol}>
                <View style={styles.deskTitleRow}>
                  <Text style={[styles.deskStoreName, { color: palette.ink }]}>
                    {selectedPharmacy?.name}
                  </Text>
                  <View style={[styles.activePill, { backgroundColor: palette.okTint }]}>
                    <Text style={[styles.activePillText, { color: palette.okInk }]}>
                      Active Desk
                    </Text>
                  </View>
                </View>
                <Text style={[styles.deskMetaText, { color: palette.ink2 }]}>
                  {partnerAuth.pharmacistName} ({partnerAuth.licenseNumber}) • {partnerAuth.counterId}
                </Text>
              </View>
            </View>
          </View>

          {/* 1. PHARMACY SELECTOR PILLS */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
              PARTICIPATING PHARMACY BRANCHES
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeChipsRow}
          >
            {pharmacies.map((store) => {
              const isSelected = selectedPharmacy?.id === store.id;

              return (
                <Pressable
                  key={store.id}
                  onPress={() => handleSelectPharmacy(store)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Select store: ${store.name}`}
                  style={[
                    styles.storeChip,
                    {
                      backgroundColor: isSelected ? palette.btn : palette.surface,
                      borderColor: isSelected ? palette.selBorder : palette.line,
                    },
                  ]}
                >
                  <PharmacyStoreIcon
                    size={15}
                    color={isSelected ? palette.btnInk : palette.ink}
                  />
                  <Text
                    style={[
                      styles.storeChipText,
                      { color: isSelected ? palette.btnInk : palette.ink },
                    ]}
                    numberOfLines={1}
                  >
                    {store.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2. SEARCH & INVENTORY FILTERS */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
              DISPENSARY INVENTORY (1-TAP UPDATE)
            </Text>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchBarBox,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <SearchIcon size={16} color={palette.ink2} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Filter by medicine or generic name..."
              placeholderTextColor={palette.ink2}
              style={[styles.searchInput, { color: palette.ink }]}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear inventory search"
                style={styles.searchClearBtn}
              >
                <CloseIcon size={14} color={palette.ink2} />
              </Pressable>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            <Pressable
              onPress={() => setActiveFilter('all')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'all' }}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor: activeFilter === 'all' ? palette.accent : palette.surface,
                  borderColor: activeFilter === 'all' ? palette.accent : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === 'all' ? '#FFFFFF' : palette.ink },
                ]}
              >
                All ({counts.all})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('available')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'available' }}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor: activeFilter === 'available' ? palette.okTint : palette.surface,
                  borderColor: activeFilter === 'available' ? palette.okLine : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === 'available' ? palette.okInk : palette.ink },
                ]}
              >
                In Stock ({counts.available})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('low_stock')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'low_stock' }}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilter === 'low_stock' ? palette.amberTint : palette.surface,
                  borderColor: activeFilter === 'low_stock' ? palette.amberLine : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === 'low_stock' ? palette.amberInk : palette.ink },
                ]}
              >
                Low Stock ({counts.low_stock})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('unavailable')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'unavailable' }}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilter === 'unavailable' ? palette.badTint : palette.surface,
                  borderColor: activeFilter === 'unavailable' ? palette.redLine : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === 'unavailable' ? palette.badInk : palette.ink },
                ]}
              >
                Out of Stock ({counts.unavailable})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveFilter('unreported')}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === 'unreported' }}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilter === 'unreported' ? palette.surface2 : palette.surface,
                  borderColor: activeFilter === 'unreported' ? palette.ink2 : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === 'unreported' ? palette.ink : palette.ink2 },
                ]}
              >
                Pending ({counts.unreported})
              </Text>
            </Pressable>
          </ScrollView>

          {/* INVENTORY ITEMS LIST */}
          {isLoading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="small" color={palette.accent} />
              <Text style={[styles.loadingText, { color: palette.ink2 }]}>
                Loading pharmacy records...
              </Text>
            </View>
          ) : filteredInventory.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <Text style={[styles.emptyStateTitle, { color: palette.ink }]}>
                No medicines found
              </Text>
              <Text style={[styles.emptyStateDesc, { color: palette.ink2 }]}>
                {searchQuery
                  ? `No medicines match "${searchQuery}" in this filter.`
                  : 'No inventory items in this filter.'}
              </Text>
            </View>
          ) : (
            filteredInventory.map((row) => {
              const isUpdating = updatingMedicineId === row.medicine.id;
              const hasReport = row.currentSnapshot !== null;
              const currentState = row.currentSnapshot?.state;

              let stateToneLabel = 'Pending Report';
              let stateBadgeBg = palette.surface2;
              let stateBadgeInk = palette.ink2;

              if (hasReport) {
                if (currentState === 'available') {
                  stateToneLabel = 'In Stock';
                  stateBadgeBg = palette.okTint;
                  stateBadgeInk = palette.okInk;
                } else if (currentState === 'low_stock') {
                  stateToneLabel = 'Low Stock';
                  stateBadgeBg = palette.amberTint;
                  stateBadgeInk = palette.amberInk;
                } else if (currentState === 'unavailable') {
                  stateToneLabel = 'Out of Stock';
                  stateBadgeBg = palette.badTint;
                  stateBadgeInk = palette.badInk;
                }
              }

              return (
                <View
                  key={row.medicine.id}
                  style={[
                    styles.inventoryCard,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.line,
                      shadowColor: palette.shadow,
                    },
                  ]}
                >
                  {/* Medicine Title & Form */}
                  <View style={styles.medicineTitleRow}>
                    <View style={styles.medicineTitleGroup}>
                      <Text style={[styles.medicineBrandText, { color: palette.ink }]}>
                        {row.medicine.brand_name}
                      </Text>
                      <Text style={[styles.medicineGenericText, { color: palette.ink2 }]}>
                        {row.medicine.generic_name} • {row.medicine.strength} •{' '}
                        {row.medicine.dosage_form}
                      </Text>
                    </View>

                    {/* Current Status Pill */}
                    <View style={[styles.currentStatusBadge, { backgroundColor: stateBadgeBg }]}>
                      <Text style={[styles.currentStatusText, { color: stateBadgeInk }]}>
                        {stateToneLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Last Verified Time */}
                  <View style={styles.verifyMetaRow}>
                    <ClockIcon size={12} color={palette.ink2} />
                    <Text style={[styles.verifyMetaText, { color: palette.ink2 }]}>
                      Last reported:{' '}
                      {hasReport
                        ? `${formatRelativeTime(row.currentSnapshot?.updated_at)} (${row.currentSnapshot?.updated_by || 'Pharmacist'})`
                        : 'No report on file yet'}
                    </Text>
                  </View>

                  {/* 1-Tap Fast Action Pills */}
                  <View style={styles.tapActionsRow}>
                    {/* IN STOCK */}
                    <Pressable
                      onPress={() =>
                        handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'available')
                      }
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${row.medicine.brand_name} to In Stock`}
                      style={({ pressed }) => [
                        styles.actionPillBtn,
                        {
                          backgroundColor:
                            currentState === 'available' ? palette.okTint : palette.surface2,
                          borderColor:
                            currentState === 'available' ? palette.okLine : palette.line,
                          opacity: pressed || isUpdating ? 0.75 : 1.0,
                        },
                      ]}
                    >
                      <CheckCircleIcon size={14} color={palette.okInk} />
                      <Text style={[styles.actionPillText, { color: palette.okInk }]}>
                        In Stock
                      </Text>
                    </Pressable>

                    {/* LOW STOCK */}
                    <Pressable
                      onPress={() =>
                        handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'low_stock')
                      }
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${row.medicine.brand_name} to Low Stock`}
                      style={({ pressed }) => [
                        styles.actionPillBtn,
                        {
                          backgroundColor:
                            currentState === 'low_stock' ? palette.amberTint : palette.surface2,
                          borderColor:
                            currentState === 'low_stock' ? palette.amberLine : palette.line,
                          opacity: pressed || isUpdating ? 0.75 : 1.0,
                        },
                      ]}
                    >
                      <ClockIcon size={14} color={palette.amberInk} />
                      <Text style={[styles.actionPillText, { color: palette.amberInk }]}>
                        Low Stock
                      </Text>
                    </Pressable>

                    {/* OUT OF STOCK */}
                    <Pressable
                      onPress={() =>
                        handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'unavailable')
                      }
                      disabled={isUpdating}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${row.medicine.brand_name} to Out of Stock`}
                      style={({ pressed }) => [
                        styles.actionPillBtn,
                        {
                          backgroundColor:
                            currentState === 'unavailable' ? palette.badTint : palette.surface2,
                          borderColor:
                            currentState === 'unavailable' ? palette.redLine : palette.line,
                          opacity: pressed || isUpdating ? 0.75 : 1.0,
                        },
                      ]}
                    >
                      <MinusCircleIcon size={14} color={palette.badInk} />
                      <Text style={[styles.actionPillText, { color: palette.badInk }]}>
                        Out of Stock
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          {/* 3. VERIFIED AUDIT TRAIL WITH REMOVAL OPTIONS */}
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.auditHeaderGroup}>
              <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
                SESSION AUDIT TRAIL
              </Text>
              <View style={[styles.countBadge, { backgroundColor: palette.surface2 }]}>
                <Text style={[styles.countBadgeText, { color: palette.ink2 }]}>
                  {auditLog.length}
                </Text>
              </View>
            </View>

            {auditLog.length > 0 && (
              <Pressable
                onPress={handleClearAuditTrail}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear all audit log entries for this session"
                style={({ pressed }) => [
                  styles.clearTrailButton,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                    opacity: pressed ? 0.75 : 1.0,
                  },
                ]}
              >
                <TrashIcon size={13} color={palette.badInk} />
                <Text style={[styles.clearTrailText, { color: palette.badInk }]}>Clear All</Text>
              </Pressable>
            )}
          </View>

          <View
            style={[
              styles.auditContainer,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
          >
            {auditLog.length === 0 ? (
              <View style={styles.emptyAuditBox}>
                <ShieldCheckIcon size={22} color={palette.ink2} />
                <Text style={[styles.emptyAuditTitle, { color: palette.ink }]}>
                  No session audit records
                </Text>
                <Text style={[styles.emptyAuditDesc, { color: palette.ink2 }]}>
                  Stock updates submitted above will automatically appear here with operator stamps.
                </Text>
              </View>
            ) : (
              auditLog.map((log) => {
                const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const relativeTime = formatRelativeTime(log.timestamp);

                let badgeBg = palette.badTint;
                let badgeInk = palette.badInk;
                let label = 'OUT OF STOCK';

                if (log.newState === 'available') {
                  badgeBg = palette.okTint;
                  badgeInk = palette.okInk;
                  label = 'IN STOCK';
                } else if (log.newState === 'low_stock') {
                  badgeBg = palette.amberTint;
                  badgeInk = palette.amberInk;
                  label = 'LOW STOCK';
                }

                return (
                  <View key={log.id} style={styles.auditRow}>
                    <ShieldCheckIcon size={16} color={palette.okInk} />
                    <View style={styles.auditTextCol}>
                      <View style={styles.auditItemTitleRow}>
                        <Text style={[styles.auditPrimaryText, { color: palette.ink }]}>
                          {log.medicineName}
                        </Text>
                        <View style={[styles.auditStatePill, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.auditStatePillText, { color: badgeInk }]}>
                            {label}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.auditMetaText, { color: palette.ink2 }]}>
                        By {log.updater} • {relativeTime} ({formattedTime})
                      </Text>
                    </View>

                    {/* Delete entry from audit trail */}
                    <Pressable
                      onPress={() => handleRemoveAuditRecord(log.id, log.medicineName)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${log.medicineName} from audit log`}
                      style={({ pressed }) => [
                        styles.deleteAuditButton,
                        {
                          backgroundColor: palette.surface2,
                          borderColor: palette.line,
                          opacity: pressed ? 0.7 : 1.0,
                        },
                      ]}
                    >
                      <TrashIcon size={14} color={palette.badInk} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </AnimatedScreenTransition>
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
    paddingBottom: 10,
    gap: 12,
  },
  headerButton: {
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitleText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  switchDeskButton: {
    minHeight: MIN_TARGET,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  switchDeskText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },

  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  toastText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  deskCard: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    shadowOpacity: 0.05,
    elevation: 2,
  },
  deskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deskIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deskTextCol: {
    flex: 1,
    gap: 2,
  },
  deskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  deskStoreName: {
    fontFamily: fonts.serif,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  activePillText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
  },
  deskMetaText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },

  sectionHeader: {
    marginTop: 4,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  auditHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  countBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    fontWeight: '700',
  },
  clearTrailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  clearTrailText: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  sectionHeading: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  storeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  storeChipText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    fontWeight: '700',
  },

  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    paddingVertical: 8,
  },
  searchClearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  filterTabText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyStateCard: {
    padding: 24,
    borderRadius: radii.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    fontFamily: fonts.serif,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyStateDesc: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    textAlign: 'center',
  },

  loadingArea: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },

  inventoryCard: {
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  medicineTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  medicineTitleGroup: {
    flex: 1,
    gap: 2,
  },
  medicineBrandText: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '700',
  },
  medicineGenericText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  currentStatusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    fontWeight: '700',
  },
  verifyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifyMetaText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
  },

  tapActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: MIN_TARGET,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  actionPillText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },

  auditContainer: {
    padding: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  emptyAuditBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyAuditTitle: {
    fontFamily: fonts.serif,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyAuditDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },

  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  auditTextCol: {
    flex: 1,
    gap: 2,
  },
  auditItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditPrimaryText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  auditStatePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  auditStatePillText: {
    fontFamily: fonts.sansBold,
    fontSize: 9.5,
    fontWeight: '700',
  },
  auditMetaText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  deleteAuditButton: {
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
