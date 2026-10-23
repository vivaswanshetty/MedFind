import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  MinusCircleIcon,
  TriangleAlertIcon,
  PillCapsuleIcon,
} from '../components/icons/AppIcons';

export default function PharmacyPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette } = useTheme();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItemRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMedicineId, setUpdatingMedicineId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

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
        'Desk Pharmacist'
      );

      const updated = await pharmacyPortalService.getInventory(selectedPharmacy.id);
      setInventory(updated);
      setAuditLog([...pharmacyPortalService.getAuditLog()]);

      const stateLabel = state === 'available' ? 'IN STOCK' : state === 'low_stock' ? 'LOW STOCK' : 'OUT OF STOCK';
      setSuccessToast(`${medicineName} updated to ${stateLabel}`);
      setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
    } finally {
      setUpdatingMedicineId(null);
    }
  };

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
          <Text style={[styles.headerSubtitleText, { color: palette.ink2 }]}>
            1-Tap Stock Verification & Audit
          </Text>
        </View>

        <View
          style={[
            styles.staffBadgeContainer,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <StaffBadgeIcon size={18} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
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

        {/* 1. PHARMACY SELECTOR PILLS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
            SELECT OPERATING PHARMACY
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

        {/* 2. INVENTORY ITEMS & 1-TAP ACTION BUTTONS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
            INSTANT STOCK UPDATE (TAP TO CONFIRM)
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.ink2 }]}>
              Loading pharmacy records...
            </Text>
          </View>
        ) : (
          inventory.map((row) => {
            const isUpdating = updatingMedicineId === row.medicine.id;
            const currentState = row.currentSnapshot?.state || 'unavailable';

            let stateToneLabel = 'Out of Stock';
            let stateBadgeBg = palette.badTint;
            let stateBadgeInk = palette.badInk;

            if (currentState === 'available') {
              stateToneLabel = 'In Stock';
              stateBadgeBg = palette.okTint;
              stateBadgeInk = palette.okInk;
            } else if (currentState === 'low_stock') {
              stateToneLabel = 'Low Stock';
              stateBadgeBg = palette.amberTint;
              stateBadgeInk = palette.amberInk;
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
                      {row.medicine.strength} • {row.medicine.dosage_form}
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
                    Last reported: {row.currentSnapshot ? 'Today, recently' : 'No report yet'}
                  </Text>
                </View>

                {/* 1-Tap Fast Action Pills */}
                <View style={styles.tapActionsRow}>
                  {/* IN STOCK */}
                  <Pressable
                    onPress={() => handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'available')}
                    disabled={isUpdating}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${row.medicine.brand_name} to In Stock`}
                    style={({ pressed }) => [
                      styles.actionPillBtn,
                      {
                        backgroundColor: currentState === 'available' ? palette.okTint : palette.surface2,
                        borderColor: currentState === 'available' ? palette.okLine : palette.line,
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
                    onPress={() => handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'low_stock')}
                    disabled={isUpdating}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${row.medicine.brand_name} to Low Stock`}
                    style={({ pressed }) => [
                      styles.actionPillBtn,
                      {
                        backgroundColor: currentState === 'low_stock' ? palette.amberTint : palette.surface2,
                        borderColor: currentState === 'low_stock' ? palette.amberLine : palette.line,
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
                    onPress={() => handleUpdateStock(row.medicine.id, row.medicine.brand_name, 'unavailable')}
                    disabled={isUpdating}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Set ${row.medicine.brand_name} to Out of Stock`}
                    style={({ pressed }) => [
                      styles.actionPillBtn,
                      {
                        backgroundColor: currentState === 'unavailable' ? palette.badTint : palette.surface2,
                        borderColor: currentState === 'unavailable' ? palette.line : palette.line,
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

        {/* 3. VERIFIED AUDIT TRAIL */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: palette.ink2 }]}>
            IMMUTABLE AUDIT TRAIL (LAST 5 UPDATES)
          </Text>
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
          {auditLog.slice(0, 5).map((log) => (
            <View key={log.id} style={styles.auditRow}>
              <ShieldCheckIcon size={14} color={palette.okInk} />
              <View style={styles.auditTextCol}>
                <Text style={[styles.auditPrimaryText, { color: palette.ink }]}>
                  {log.medicineName} • {log.newState.toUpperCase()}
                </Text>
                <Text style={[styles.auditMetaText, { color: palette.ink2 }]}>
                  By {log.updater} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
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
    paddingBottom: 10,
    gap: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
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
  staffBadgeContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  sectionHeader: {
    marginTop: 4,
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.08,
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
    fontSize: 13,
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
    minHeight: 38,
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  auditTextCol: {
    flex: 1,
    gap: 2,
  },
  auditPrimaryText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    fontWeight: '700',
  },
  auditMetaText: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
});
