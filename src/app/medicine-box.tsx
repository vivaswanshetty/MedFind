import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Switch,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../components/AnimatedScreenTransition';
import { onboardingAssets } from '../../assets/onboarding';
import {
  useMedicineBox,
  MedicineBoxItem,
  MAX_MEDICINE_BOX_ITEMS,
  RestockInterval,
  MedicineSpace,
  calculateNextRestockDate,
  formatRestockIntervalLabel,
  getItemSpace,
  getTodayDateString,
  isItemTakenToday,
} from '../store/medicineBox';
import {
  getExpiryStatus,
  getExpiryChipInfo,
  formatRefillDate,
  parseExpiryDate,
  parseExactExpiryDate,
  formatExpiryMonthYear,
  formatExactExpiryDate,
  getRestockStatus,
} from '../lib/medicineBoxStatus';
import { searchCatalogMedicines } from '../services/medicineSearch';
import { Medicine } from '../types/models';

const MONTHS_LIST = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const POPULAR_DAILY_CHIPS: { name: string; form: string; strength: string; interval: RestockInterval; doseTime: string }[] = [
  { name: 'Metformin 500mg', form: 'Tablet', strength: '500 mg', interval: 'monthly', doseTime: 'morning' },
  { name: 'Telmisartan 40mg', form: 'Tablet', strength: '40 mg', interval: 'monthly', doseTime: 'morning' },
  { name: 'Thyronorm 50mcg', form: 'Tablet', strength: '50 mcg', interval: 'monthly', doseTime: 'morning' },
  { name: 'Atorvastatin 10mg', form: 'Tablet', strength: '10 mg', interval: 'monthly', doseTime: 'night' },
  { name: 'Amlodipine 5mg', form: 'Tablet', strength: '5 mg', interval: 'monthly', doseTime: 'morning' },
  { name: 'Shelcal 500', form: 'Tablet', strength: '500 mg', interval: 'monthly', doseTime: 'afternoon' },
  { name: 'Pantocid 40mg', form: 'Tablet', strength: '40 mg', interval: 'monthly', doseTime: 'morning' },
  { name: 'Montair-LC', form: 'Tablet', strength: '10 mg', interval: 'monthly', doseTime: 'night' },
];

const POPULAR_ESSENTIAL_CHIPS: { name: string; form: string; strength: string; category: string }[] = [
  { name: 'Dolo 650', form: 'Tablet', strength: '650 mg', category: 'Fever & Pain' },
  { name: 'Meftal-Spas', form: 'Tablet', strength: '250 mg / 10 mg', category: 'Pain & Cramps' },
  { name: 'Cetirizine 10mg', form: 'Tablet', strength: '10 mg', category: 'Cold & Allergy' },
  { name: 'Digene Gel', form: 'Syrup', strength: '200 ml', category: 'Digestion & Acidity' },
  { name: 'ORS Electral', form: 'Powder', strength: '21.8 g', category: 'Dehydration' },
  { name: 'Betadine Ointment', form: 'Cream', strength: '20 g', category: 'First Aid & Antiseptic' },
  { name: 'Otrivin Drops', form: 'Drops', strength: '10 ml', category: 'Cold & Nasal Relief' },
  { name: 'Burnol Cream', form: 'Cream', strength: '15 g', category: 'Burns & First Aid' },
];

const ESSENTIAL_CATEGORIES = [
  'Fever & Pain',
  'Cold & Allergy',
  'Digestion & Acidity',
  'First Aid & Wounds',
  'Asthma & Breathing',
  'General Household',
];

import {
  BackArrowIcon,
  PlusIcon,
  CloseIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  SearchIcon,
  RefreshIcon,
  PillCapsuleIcon,
  FirstAidBoxIcon,
} from '../components/icons/AppIcons';
import { MedicineIcon3D, MedicineType } from '../components/medicine/MedicineIcon3D';

function inferMedicineForm(name: string): { type: MedicineType; color?: string } {
  const lower = name.toLowerCase();
  if (lower.includes('syrup') || lower.includes('suspension') || lower.includes('liquid') || lower.includes('elixir')) {
    return { type: 'syrup', color: '#E11D48' };
  }
  if (lower.includes('drop')) {
    return { type: 'drops', color: '#0284C7' };
  }
  if (lower.includes('inhaler') || lower.includes('rotacap') || lower.includes('respules')) {
    return { type: 'inhaler', color: '#0D9488' };
  }
  if (lower.includes('cap') || lower.includes('capsule')) {
    return { type: 'capsule', color: '#7C3AED' };
  }
  if (lower.includes('cream') || lower.includes('gel') || lower.includes('ointment')) {
    return { type: 'cream', color: '#D97706' };
  }
  if (lower.includes('inj') || lower.includes('injection')) {
    return { type: 'injection', color: '#DC2626' };
  }
  return { type: 'tablet', color: '#2563EB' };
}

export default function MedicineBoxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    action?: string;
    addName?: string;
    addForm?: string;
    addStrength?: string;
    space?: string;
  }>();

  const { scheme, palette, theme } = useTheme();
  const { t, formatNumber, tMedicine } = useLanguage();
  const {
    items,
    isLoading,
    addItem,
    updateItem,
    removeItem,
    markRestocked,
    toggleTakenToday,
    isItemInBox,
  } = useMedicineBox();

  // Two dedicated spaces: 'daily' (Daily Health Meds) vs 'essential' (Essential Med Box)
  const [activeSpace, setActiveSpace] = useState<MedicineSpace>(
    params.space === 'essential' ? 'essential' : 'daily'
  );

  // Search & Filter state per space
  const [boxSearchQuery, setBoxSearchQuery] = useState('');
  const [dailyFilter, setDailyFilter] = useState<'all' | 'due' | 'refill'>('all');
  const [essentialFilter, setEssentialFilter] = useState<'all' | 'alert' | 'low'>('all');
  const [catalogSearchResults, setCatalogSearchResults] = useState<Medicine[]>([]);

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicineBoxItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MedicineBoxItem | null>(null);

  // Form Fields
  const [modalSpace, setModalSpace] = useState<MedicineSpace>('daily');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');
  const [dailyTime, setDailyTime] = useState<string>('morning');
  const [essentialCategory, setEssentialCategory] = useState<string>('Fever & Pain');
  const [stockLevel, setStockLevel] = useState<'full' | 'few' | 'empty'>('full');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [exactExpiryDate, setExactExpiryDate] = useState<string | null>(null);
  const [refillOn, setRefillOn] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isRegular, setIsRegular] = useState(true);
  const [restockInterval, setRestockInterval] = useState<RestockInterval>('monthly');
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Autocomplete suggestions in modal
  const [inputSuggestions, setInputSuggestions] = useState<Medicine[]>([]);
  const [showInputSuggestions, setShowInputSuggestions] = useState(false);

  // Month-Year and Date Pickers visibility
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showExactExpiryPicker, setShowExactExpiryPicker] = useState(false);
  const [showRefillPicker, setShowRefillPicker] = useState(false);

  const isFull = items.length >= MAX_MEDICINE_BOX_ITEMS;

  // Search catalog when boxSearchQuery changes
  useEffect(() => {
    const q = boxSearchQuery.trim();
    if (q.length > 0) {
      const results = searchCatalogMedicines(q, 8);
      setCatalogSearchResults(results);
    } else {
      setCatalogSearchResults([]);
    }
  }, [boxSearchQuery]);

  const openAddModal = (prefill?: {
    name?: string;
    dosageForm?: string;
    strength?: string;
    isRegular?: boolean;
    interval?: RestockInterval;
    space?: MedicineSpace;
    dailyTime?: string;
    category?: string;
  }) => {
    if (isFull) {
      Alert.alert(
        'Medicine Box Full',
        `Your medicine box is full (${MAX_MEDICINE_BOX_ITEMS} items). Please remove an existing item before adding a new one.`
      );
      return;
    }
    const targetSpace: MedicineSpace = prefill?.space || activeSpace;
    setEditingItem(null);
    setModalSpace(targetSpace);
    setName(prefill?.name || '');
    setNote('');
    setDosageForm(prefill?.dosageForm || '');
    setStrength(prefill?.strength || '');
    setExpiryDate(null);
    setExactExpiryDate(null);
    setSelectedYear(new Date().getFullYear());
    setShowMonthYearPicker(false);
    setShowExactExpiryPicker(false);

    if (targetSpace === 'daily') {
      setIsRegular(true);
      const interval = prefill?.interval || 'monthly';
      setRestockInterval(interval);
      setRefillOn(calculateNextRestockDate(interval));
      setDailyTime(prefill?.dailyTime || 'morning');
      setEssentialCategory('General Household');
      setStockLevel('full');
    } else {
      setIsRegular(false);
      setRestockInterval('monthly');
      setRefillOn(null);
      setDailyTime('morning');
      setEssentialCategory(prefill?.category || 'Fever & Pain');
      setStockLevel('full');
    }

    setRemindersEnabled(true);
    setFormError(null);
    setShowInputSuggestions(false);
    setModalVisible(true);
  };

  // Open add modal if query params specify
  useEffect(() => {
    if (params.action === 'add' || params.addName) {
      const sp: MedicineSpace = params.space === 'essential' ? 'essential' : 'daily';
      openAddModal({
        name: params.addName,
        dosageForm: params.addForm,
        strength: params.addStrength,
        space: sp,
        isRegular: sp === 'daily',
        interval: 'monthly',
      });
    }
  }, [params.action, params.addName, params.space]);

  const openEditModal = (item: MedicineBoxItem) => {
    const itemSpace = getItemSpace(item);
    setEditingItem(item);
    setModalSpace(itemSpace);
    setName(item.name);
    setNote(item.note || '');
    setDosageForm(item.dosageForm || '');
    setStrength(item.strength || '');
    setExpiryDate(item.expiryDate || null);
    setExactExpiryDate(item.exactExpiryDate || null);
    if (item.expiryDate) {
      const parsed = parseExpiryDate(item.expiryDate);
      if (parsed) setSelectedYear(parsed.getFullYear());
      else setSelectedYear(new Date().getFullYear());
    } else {
      setSelectedYear(new Date().getFullYear());
    }
    setShowMonthYearPicker(false);
    setShowExactExpiryPicker(false);
    setRefillOn(item.refillOn || null);
    setIsRegular(itemSpace === 'daily');
    setRestockInterval(item.restockInterval || 'monthly');
    setDailyTime(item.dailyTime || 'morning');
    setEssentialCategory(item.essentialCategory || 'Fever & Pain');
    setStockLevel(item.stockLevel || 'full');
    setRemindersEnabled(Boolean(item.remindersEnabled));
    setFormError(null);
    setShowInputSuggestions(false);
    setModalVisible(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (formError) setFormError(null);
    if (val.trim().length >= 2) {
      const suggestions = searchCatalogMedicines(val, 5);
      setInputSuggestions(suggestions);
      setShowInputSuggestions(suggestions.length > 0);
    } else {
      setShowInputSuggestions(false);
    }
  };

  const handleSelectCatalogSuggestion = (med: Medicine) => {
    setName(med.brand_name);
    setDosageForm(med.dosage_form || '');
    setStrength(med.strength || '');
    if (med.expiry_date) {
      const parts = med.expiry_date.split('/');
      if (parts.length === 2) {
        setExpiryDate(`${parts[1]}-${parts[0]}`);
      }
    }
    setShowInputSuggestions(false);
  };

  const handleSelectRestockInterval = (interval: RestockInterval) => {
    setRestockInterval(interval);
    setIsRegular(true);
    if (interval === 'custom') {
      setShowRefillPicker(true);
    } else {
      const nextDate = calculateNextRestockDate(interval);
      setRefillOn(nextDate);
    }
    setRemindersEnabled(true);
  };

  const handleToggleTaken = async (item: MedicineBoxItem) => {
    const res = await toggleTakenToday(item.id);
    if (res.success) {
      setSuccessToast(
        res.isTaken
          ? `Marked ${item.name} as taken today ✓`
          : `Unmarked ${item.name}`
      );
      setTimeout(() => setSuccessToast(null), 2200);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter a medicine name.');
      return;
    }

    if (!editingItem && isFull) {
      setFormError(`Your medicine box is full (${MAX_MEDICINE_BOX_ITEMS} items)`);
      return;
    }

    const isDaily = modalSpace === 'daily';
    let finalRefillOn = refillOn || undefined;
    if (isDaily && restockInterval !== 'custom' && !finalRefillOn) {
      finalRefillOn = calculateNextRestockDate(restockInterval);
    }

    if (editingItem) {
      const res = await updateItem(editingItem.id, {
        name: trimmedName,
        space: modalSpace,
        note: note.trim() || undefined,
        dosageForm: dosageForm.trim() || undefined,
        strength: strength.trim() || undefined,
        expiryDate: expiryDate || undefined,
        exactExpiryDate: exactExpiryDate || undefined,
        refillOn: isDaily ? finalRefillOn : undefined,
        remindersEnabled,
        isRegular: isDaily,
        restockInterval: isDaily ? restockInterval : undefined,
        dailyTime: isDaily ? dailyTime : undefined,
        essentialCategory: !isDaily ? essentialCategory : undefined,
        stockLevel: !isDaily ? stockLevel : undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to update medicine.');
        return;
      }

      setSuccessToast(`${trimmedName} updated`);
      setTimeout(() => setSuccessToast(null), 2500);
    } else {
      const res = await addItem({
        name: trimmedName,
        space: modalSpace,
        note: note.trim() || undefined,
        dosageForm: dosageForm.trim() || undefined,
        strength: strength.trim() || undefined,
        expiryDate: expiryDate || undefined,
        exactExpiryDate: exactExpiryDate || undefined,
        refillOn: isDaily ? finalRefillOn : undefined,
        remindersEnabled,
        isRegular: isDaily,
        restockInterval: isDaily ? restockInterval : undefined,
        lastRestockedAt: new Date().toISOString(),
        dailyTime: isDaily ? dailyTime : undefined,
        essentialCategory: !isDaily ? essentialCategory : undefined,
        stockLevel: !isDaily ? stockLevel : undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to add medicine.');
        return;
      }

      setSuccessToast(`Added ${trimmedName} to ${isDaily ? 'Daily Meds' : 'Essential Med Box'}`);
      setTimeout(() => setSuccessToast(null), 2500);
    }

    setModalVisible(false);
  };

  const handleMarkRestocked = async (item: MedicineBoxItem) => {
    const res = await markRestocked(item.id);
    if (res.success && res.nextRefillOn) {
      setSuccessToast(`Restocked! Next notification on ${formatRefillDate(res.nextRefillOn)}`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleDeleteWithConfirm = (item: MedicineBoxItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.name;
    const id = itemToDelete.id;
    setItemToDelete(null);
    if (editingItem?.id === id) {
      setModalVisible(false);
      setEditingItem(null);
    }
    await removeItem(id);
    setSuccessToast(`Removed ${deletedName} from your medicine box`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const formatDatePickerValue = (dateStr?: string | null): Date => {
    if (!dateStr) return new Date();
    const parsed = parseExpiryDate(dateStr);
    return parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
  };

  const formatExactDatePickerValue = (dateStr?: string | null): Date => {
    if (!dateStr) return new Date();
    const parsed = parseExactExpiryDate(dateStr);
    return parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
  };

  const handleExactExpiryPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExactExpiryPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setExactExpiryDate(`${year}-${month}-${day}`);
    }
  };

  const handleRefillPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowRefillPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setRefillOn(`${year}-${month}-${day}`);
    }
  };

  // Space collections and counts
  const todayStr = useMemo(() => getTodayDateString(), []);

  const dailyItems = useMemo(
    () => items.filter((i) => getItemSpace(i) === 'daily'),
    [items]
  );

  const essentialItems = useMemo(
    () => items.filter((i) => getItemSpace(i) === 'essential'),
    [items]
  );

  const takenTodayCount = useMemo(
    () => dailyItems.filter((i) => isItemTakenToday(i, todayStr)).length,
    [dailyItems, todayStr]
  );

  const dailyRefillDueCount = useMemo(
    () =>
      dailyItems.filter((i) => {
        const status = getRestockStatus(i.refillOn);
        return status && status.isDue;
      }).length,
    [dailyItems]
  );

  const essentialSoonCount = useMemo(
    () =>
      essentialItems.filter(
        (i) => getExpiryStatus(i) === 'soon' || getExpiryStatus(i) === 'expired'
      ).length,
    [essentialItems]
  );

  const essentialLowStockCount = useMemo(
    () => essentialItems.filter((i) => i.stockLevel === 'few' || i.stockLevel === 'empty').length,
    [essentialItems]
  );

  const displayedItems = useMemo(() => {
    let list = activeSpace === 'daily' ? dailyItems : essentialItems;

    if (boxSearchQuery.trim()) {
      const q = boxSearchQuery.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.note && i.note.toLowerCase().includes(q)) ||
          (i.dosageForm && i.dosageForm.toLowerCase().includes(q)) ||
          (i.strength && i.strength.toLowerCase().includes(q)) ||
          (i.essentialCategory && i.essentialCategory.toLowerCase().includes(q))
      );
    }

    if (activeSpace === 'daily') {
      if (dailyFilter === 'due') {
        return list.filter((i) => !isItemTakenToday(i, todayStr));
      }
      if (dailyFilter === 'refill') {
        return list.filter((i) => {
          const s = getRestockStatus(i.refillOn);
          return s && s.isDue;
        });
      }
    } else {
      if (essentialFilter === 'alert') {
        return list.filter(
          (i) => getExpiryStatus(i) === 'soon' || getExpiryStatus(i) === 'expired'
        );
      }
      if (essentialFilter === 'low') {
        return list.filter((i) => i.stockLevel === 'few' || i.stockLevel === 'empty');
      }
    }

    return list;
  }, [
    activeSpace,
    dailyItems,
    essentialItems,
    boxSearchQuery,
    dailyFilter,
    essentialFilter,
    todayStr,
  ]);

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const paddingTop = Math.max(insets.top, statusBarHeight) + 8;

  return (
    <View style={[styles.rootContainer, { backgroundColor: palette.bg }]}>
      <AtmosphereBackground />

      <AnimatedScreenTransition style={{ flex: 1 }}>
        {/* Navigation Header */}
        <View style={[styles.headerContainer, { paddingTop }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.headerIconBtn, { borderColor: palette.line, backgroundColor: palette.surface }]}
          >
            <BackArrowIcon size={18} color={palette.ink} />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitle, { color: palette.ink }]}>
              {t('my_medicine_box', 'My Medicine Box')}
            </Text>
            <Text style={[styles.headerCount, { color: palette.ink2 }]}>
              {t('medicines_count', '{current}/{max} medicines')
                .replace('{current}', formatNumber(items.length))
                .replace('{max}', formatNumber(MAX_MEDICINE_BOX_ITEMS))}
            </Text>
          </View>

          <Pressable
            onPress={() => openAddModal({ space: activeSpace })}
            disabled={isFull}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={activeSpace === 'daily' ? 'Add daily health medicine' : 'Add essential cabinet medicine'}
            style={[
              styles.headerAddBtn,
              {
                backgroundColor: isFull ? palette.line : theme.primaryAccent,
                opacity: isFull ? 0.6 : 1,
              },
            ]}
          >
            <PlusIcon size={16} color={isFull ? palette.ink2 : '#FFFFFF'} />
            <Text style={[styles.headerAddBtnText, { color: isFull ? palette.ink2 : '#FFFFFF' }]}>
              {activeSpace === 'daily' ? '+ Add Daily' : '+ Add Essential'}
            </Text>
          </Pressable>
        </View>

        {/* 30-item cap banner */}
        {isFull && (
          <View
            style={[
              styles.fullBanner,
              {
                backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F',
                borderColor: scheme === 'light' ? '#F59E0B' : '#B45309',
              },
            ]}
          >
            <TriangleAlertIcon size={16} color={scheme === 'light' ? '#B45309' : '#FCD34D'} />
            <Text
              style={[
                styles.fullBannerText,
                { color: scheme === 'light' ? '#92400E' : '#FEF3C7' },
              ]}
            >
              {t('box_full_banner', 'Your medicine box is full ({count} items)').replace(
                '{count}',
                String(MAX_MEDICINE_BOX_ITEMS)
              )}
            </Text>
          </View>
        )}

        {/* Success Toast */}
        {successToast && (
          <View style={[styles.toastContainer, { backgroundColor: palette.okTint, borderColor: palette.okLine }]}>
            <CheckCircleIcon size={16} color={palette.okInk} />
            <Text style={[styles.toastText, { color: palette.okInk, fontFamily: fonts.sansMedium }]}>
              {successToast}
            </Text>
          </View>
        )}

        {/* TWO DEDICATED SPACES SEGMENTED TABS */}
        <View style={styles.spaceSegmentWrapper}>
          <View style={[styles.spaceSegmentRow, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Pressable
              onPress={() => setActiveSpace('daily')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSpace === 'daily' }}
              accessibilityLabel={`Daily Health Meds, ${dailyItems.length} items`}
              style={[
                styles.spaceSegmentTab,
                activeSpace === 'daily' && [
                  styles.spaceSegmentTabActive,
                  { backgroundColor: theme.primaryAccent, borderColor: theme.primaryAccent },
                ],
              ]}
            >
              <PillCapsuleIcon size={16} color={activeSpace === 'daily' ? '#FFFFFF' : palette.ink} />
              <Text
                style={[
                  styles.spaceSegmentTabText,
                  { color: activeSpace === 'daily' ? '#FFFFFF' : palette.ink },
                ]}
              >
                Daily Health Meds ({dailyItems.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveSpace('essential')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSpace === 'essential' }}
              accessibilityLabel={`Essential Med Box, ${essentialItems.length} items`}
              style={[
                styles.spaceSegmentTab,
                activeSpace === 'essential' && [
                  styles.spaceSegmentTabActive,
                  { backgroundColor: theme.primaryAccent, borderColor: theme.primaryAccent },
                ],
              ]}
            >
              <FirstAidBoxIcon size={16} color={activeSpace === 'essential' ? '#FFFFFF' : palette.ink} />
              <Text
                style={[
                  styles.spaceSegmentTabText,
                  { color: activeSpace === 'essential' ? '#FFFFFF' : palette.ink },
                ]}
              >
                Essential Med Box ({essentialItems.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ACTIVE SPACE CONTEXT BANNER */}
        {activeSpace === 'daily' ? (
          <View
            style={[
              styles.spaceBanner,
              {
                backgroundColor: scheme === 'light' ? '#F0FDF4' : '#064E3B',
                borderColor: scheme === 'light' ? '#BBF7D0' : '#059669',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.spaceBannerTitle, { color: scheme === 'light' ? '#166534' : '#6EE7B7' }]}>
                💊 Daily Health & Routine Space
              </Text>
              <Text style={[styles.spaceBannerSub, { color: scheme === 'light' ? '#15803D' : '#A7F3D0' }]}>
                {dailyItems.length === 0
                  ? 'For ongoing maintenance prescriptions (BP, diabetes, thyroid, vitamins). Dose reminders & restock tracking.'
                  : `Today: ${takenTodayCount} of ${dailyItems.length} taken • ${dailyRefillDueCount > 0 ? `🔔 ${dailyRefillDueCount} restock due` : 'All restocks on track'}`}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.spaceBanner,
              {
                backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F',
                borderColor: scheme === 'light' ? '#FDE68A' : '#B45309',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.spaceBannerTitle, { color: scheme === 'light' ? '#92400E' : '#FDE68A' }]}>
                🧰 Essential Home Medicine Box
              </Text>
              <Text style={[styles.spaceBannerSub, { color: scheme === 'light' ? '#B45309' : '#FEF3C7' }]}>
                {essentialItems.length === 0
                  ? 'For first-aid & emergency home supplies (fever, pain, allergies, ointments). Tracks expiry & stock.'
                  : `${essentialItems.length} essential items • ${essentialSoonCount > 0 ? `⏳ ${essentialSoonCount} expiring soon` : 'All safe & potent'} • ${essentialLowStockCount > 0 ? `📦 ${essentialLowStockCount} low stock` : 'Packs full'}`}
              </Text>
            </View>
          </View>
        )}

        {/* SEARCH BAR FOR MEDICINES */}
        <View style={styles.searchBarWrapper}>
          <View style={[styles.searchBarBox, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <SearchIcon size={18} color={palette.ink2} />
            <TextInput
              value={boxSearchQuery}
              onChangeText={setBoxSearchQuery}
              placeholder={
                activeSpace === 'daily'
                  ? 'Search or add daily maintenance meds...'
                  : 'Search or add cabinet meds (Dolo, Meftal, First Aid)...'
              }
              placeholderTextColor={palette.ink2}
              style={[styles.searchInput, { color: palette.ink, fontFamily: fonts.sans }]}
            />
            {boxSearchQuery.length > 0 && (
              <Pressable
                onPress={() => setBoxSearchQuery('')}
                hitSlop={8}
                style={styles.clearSearchBtn}
              >
                <CloseIcon size={14} color={palette.ink2} />
              </Pressable>
            )}
          </View>
        </View>

        {/* SUB-FILTER CHIPS ROW (Scrollable, centered 32px fixed-height pills, no vertical stretching) */}
        {!boxSearchQuery.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabsScrollView}
            contentContainerStyle={styles.filterTabsRow}
          >
            {activeSpace === 'daily' ? (
              <>
                <Pressable
                  onPress={() => setDailyFilter('all')}
                  style={[
                    styles.filterTabPill,
                    {
                      backgroundColor: dailyFilter === 'all' ? theme.primaryAccent : palette.surface,
                      borderColor: dailyFilter === 'all' ? theme.primaryAccent : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: dailyFilter === 'all' ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    All ({formatNumber(dailyItems.length)})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setDailyFilter('due')}
                  style={[
                    styles.filterTabPill,
                    {
                      backgroundColor: dailyFilter === 'due' ? theme.primaryAccent : palette.surface,
                      borderColor: dailyFilter === 'due' ? theme.primaryAccent : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: dailyFilter === 'due' ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    ⏰ Due Today ({formatNumber(Math.max(0, dailyItems.length - takenTodayCount))})
                  </Text>
                </Pressable>

                {dailyRefillDueCount > 0 && (
                  <Pressable
                    onPress={() => setDailyFilter('refill')}
                    style={[
                      styles.filterTabPill,
                      {
                        backgroundColor: dailyFilter === 'refill' ? '#0284C7' : palette.surface,
                        borderColor: dailyFilter === 'refill' ? '#0284C7' : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { color: dailyFilter === 'refill' ? '#FFFFFF' : '#0284C7' },
                      ]}
                    >
                      🔔 Refill Due ({formatNumber(dailyRefillDueCount)})
                    </Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Pressable
                  onPress={() => setEssentialFilter('all')}
                  style={[
                    styles.filterTabPill,
                    {
                      backgroundColor: essentialFilter === 'all' ? theme.primaryAccent : palette.surface,
                      borderColor: essentialFilter === 'all' ? theme.primaryAccent : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: essentialFilter === 'all' ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    All ({formatNumber(essentialItems.length)})
                  </Text>
                </Pressable>

                {essentialSoonCount > 0 && (
                  <Pressable
                    onPress={() => setEssentialFilter('alert')}
                    style={[
                      styles.filterTabPill,
                      {
                        backgroundColor: essentialFilter === 'alert' ? '#D97706' : palette.surface,
                        borderColor: essentialFilter === 'alert' ? '#D97706' : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { color: essentialFilter === 'alert' ? '#FFFFFF' : '#D97706' },
                      ]}
                    >
                      ⏳ Expiry Alert ({formatNumber(essentialSoonCount)})
                    </Text>
                  </Pressable>
                )}

                {essentialLowStockCount > 0 && (
                  <Pressable
                    onPress={() => setEssentialFilter('low')}
                    style={[
                      styles.filterTabPill,
                      {
                        backgroundColor: essentialFilter === 'low' ? '#DC2626' : palette.surface,
                        borderColor: essentialFilter === 'low' ? '#DC2626' : palette.line,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { color: essentialFilter === 'low' ? '#FFFFFF' : '#DC2626' },
                      ]}
                    >
                      📦 Low Stock ({formatNumber(essentialLowStockCount)})
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* Main Content Area */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* SEARCH RESULTS FROM ESSENTIAL MEDICINES CATALOG */}
          {boxSearchQuery.trim().length > 0 && catalogSearchResults.length > 0 && (
            <View style={styles.catalogSection}>
              <View style={styles.catalogSectionHeader}>
                <Text style={[styles.catalogSectionTitle, { color: palette.ink }]}>
                  From Medicine Catalog (Tap to Add)
                </Text>
                <Text style={[styles.catalogSectionSub, { color: palette.ink2 }]}>
                  {catalogSearchResults.length} verified medicines found
                </Text>
              </View>

              <View style={styles.catalogGrid}>
                {catalogSearchResults.map((med) => {
                  const alreadyAdded = isItemInBox(med.brand_name) || isItemInBox(med.generic_name);
                  const formInfo = inferMedicineForm(med.brand_name);

                  return (
                    <View
                      key={med.id}
                      style={[
                        styles.catalogCard,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.line,
                        },
                      ]}
                    >
                      <View style={styles.catalogCardLeft}>
                        <MedicineIcon3D type={formInfo.type} color={formInfo.color} size={36} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.catalogMedName, { color: palette.ink }]} numberOfLines={1}>
                            {med.brand_name}
                          </Text>
                          <Text style={[styles.catalogGenericName, { color: palette.ink2 }]} numberOfLines={1}>
                            {med.generic_name} • {med.dosage_form || 'Form'} {med.strength || ''}
                          </Text>
                        </View>
                      </View>

                      {alreadyAdded ? (
                        <View style={[styles.inBoxBadge, { backgroundColor: palette.okTint, borderColor: palette.okLine }]}>
                          <CheckCircleIcon size={12} color={palette.okInk} />
                          <Text style={[styles.inBoxBadgeText, { color: palette.okInk }]}>In Box ✓</Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() =>
                            openAddModal({
                              name: med.brand_name,
                              dosageForm: med.dosage_form,
                              strength: med.strength,
                              space: activeSpace,
                              isRegular: activeSpace === 'daily',
                              interval: 'monthly',
                            })
                          }
                          style={[styles.catalogAddBtn, { backgroundColor: theme.primaryAccent }]}
                        >
                          <PlusIcon size={13} color="#FFFFFF" />
                          <Text style={styles.catalogAddBtnText}>
                            {activeSpace === 'daily' ? '+ Add Daily' : '+ Add Essential'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ACTIVE SPACE PROMO / ONBOARDING BANNER (when space has 0 items and search inactive) */}
          {!boxSearchQuery.trim() &&
            ((activeSpace === 'daily' && dailyItems.length === 0) ||
              (activeSpace === 'essential' && essentialItems.length === 0)) && (
              <Pressable
                onPress={() => openAddModal({ space: activeSpace })}
                style={[
                  styles.regularMedPromoCard,
                  {
                    backgroundColor:
                      activeSpace === 'daily'
                        ? scheme === 'light'
                          ? '#EFF6FF'
                          : '#1E293B'
                        : scheme === 'light'
                        ? '#FEF3C7'
                        : '#78350F',
                    borderColor:
                      activeSpace === 'daily'
                        ? scheme === 'light'
                          ? '#BFDBFE'
                          : '#334155'
                        : scheme === 'light'
                        ? '#FDE68A'
                        : '#B45309',
                  },
                ]}
              >
                <View style={styles.promoIconCol}>
                  {activeSpace === 'daily' ? (
                    <PillCapsuleIcon size={24} color={palette.accent} />
                  ) : (
                    <FirstAidBoxIcon size={24} color="#D97706" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promoTitle, { color: palette.ink }]}>
                    {activeSpace === 'daily'
                      ? 'Track your daily routine maintenance meds'
                      : 'Stock your essential home medicine cabinet'}
                  </Text>
                  <Text style={[styles.promoSub, { color: palette.ink2 }]}>
                    {activeSpace === 'daily'
                      ? 'Add BP, diabetes, thyroid, or daily vitamins. Set weekly, monthly, or 2-month restock schedules to get timely notifications.'
                      : 'Add fever, pain, cold, antiseptic, or burn supplies. Track shelf-life and stay stocked for emergencies.'}
                  </Text>
                </View>
                <View style={[styles.promoAddPill, { backgroundColor: theme.primaryAccent }]}>
                  <Text style={styles.promoAddPillText}>+ Add</Text>
                </View>
              </Pressable>
            )}

          {/* MEDICINE BOX ITEMS LIST */}
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitleText, { color: palette.ink2 }]}>
              {boxSearchQuery.trim()
                ? `Matches in ${activeSpace === 'daily' ? 'Daily Meds' : 'Essential Box'}`
                : activeSpace === 'daily'
                ? 'Your Daily Routine Meds'
                : 'Your Essential Cabinet Meds'}{' '}
              ({formatNumber(displayedItems.length)})
            </Text>
          </View>

          {displayedItems.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <Image
                source={onboardingAssets.small.cardMedicineBox}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={[styles.emptyTitle, { color: palette.ink }]}>
                {boxSearchQuery.trim()
                  ? 'No matching medicines found'
                  : activeSpace === 'daily'
                  ? 'No daily health meds added yet'
                  : 'Your essential medicine box is empty'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: palette.ink2 }]}>
                {boxSearchQuery.trim()
                  ? 'Use the catalog search above to find any medicine and add it with 1 tap.'
                  : activeSpace === 'daily'
                  ? 'Add your daily routine medications to track doses and get restock reminders on this phone.'
                  : 'Add first-aid & emergency medicines kept at home to monitor expiry dates and stock levels.'}
              </Text>
              <Pressable
                onPress={() => openAddModal({ space: activeSpace })}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={activeSpace === 'daily' ? 'Add daily medicine' : 'Add essential medicine'}
                style={[styles.emptyAddBtn, { backgroundColor: theme.primaryAccent }]}
              >
                <PlusIcon size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>
                  {activeSpace === 'daily' ? '+ Add Daily Med' : '+ Add Essential Med'}
                </Text>
              </Pressable>
            </View>
          ) : (
            /* List of Items */
            <View style={styles.itemsList}>
              {displayedItems.map((item) => {
                const isDaily = getItemSpace(item) === 'daily';
                const isTaken = isItemTakenToday(item, todayStr);
                const expiryInfo = getExpiryChipInfo(item);
                const refillFormatted = formatRefillDate(item.refillOn);
                const restockStatus = getRestockStatus(item.refillOn);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        shadowColor: palette.shadow,
                      },
                    ]}
                  >
                    <View style={styles.itemHeaderRow}>
                      <Pressable
                        onPress={() => openEditModal(item)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${item.name}`}
                        style={styles.itemMainTapArea}
                      >
                        <View style={styles.item3DPedestal}>
                          <MedicineIcon3D
                            type={inferMedicineForm(item.name).type}
                            color={inferMedicineForm(item.name).color}
                            size={44}
                            glow={true}
                            float={true}
                          />
                        </View>

                        <View style={styles.itemTitleBox}>
                          <View style={styles.itemTitleLine}>
                            <Text style={[styles.itemName, { color: palette.ink }]} numberOfLines={1}>
                              {tMedicine(item.name)}
                            </Text>
                            {isDaily ? (
                              <View style={[styles.regularBadge, { backgroundColor: scheme === 'light' ? '#EEF2FF' : '#312E81' }]}>
                                <Text style={[styles.regularBadgeText, { color: scheme === 'light' ? '#4338CA' : '#C7D2FE' }]}>
                                  🔄 {formatRestockIntervalLabel(item.restockInterval)}
                                </Text>
                              </View>
                            ) : (
                              <View style={[styles.categoryBadge, { backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F' }]}>
                                <Text style={[styles.categoryBadgeText, { color: scheme === 'light' ? '#92400E' : '#FDE68A' }]}>
                                  🧰 {item.essentialCategory || 'Cabinet'}
                                </Text>
                              </View>
                            )}
                          </View>

                          {item.dosageForm || item.strength ? (
                            <Text style={[styles.itemSubDetail, { color: palette.ink2 }]}>
                              {[item.dosageForm, item.strength].filter(Boolean).join(' • ')}
                            </Text>
                          ) : null}

                          {item.note ? (
                            <Text style={[styles.itemNote, { color: palette.ink2 }]} numberOfLines={2}>
                              {item.note}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          handleDeleteWithConfirm(item);
                        }}
                        hitSlop={12}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.name}`}
                        style={({ pressed }) => [
                          styles.itemDeleteBtn,
                          {
                            backgroundColor: pressed
                              ? scheme === 'light'
                                ? '#FEE2E2'
                                : '#7F1D1D'
                              : 'transparent',
                          },
                        ]}
                      >
                        <TrashIcon size={18} color={scheme === 'light' ? '#DC2626' : '#F87171'} />
                      </Pressable>
                    </View>

                    {/* Chips Row */}
                    <View style={styles.chipsRow}>
                      {isDaily ? (
                        <>
                          {/* Daily Dose Timing Chip */}
                          <View style={[styles.chip, { backgroundColor: scheme === 'light' ? '#F0FDF4' : '#052E16' }]}>
                            <ClockIcon size={12} color={scheme === 'light' ? '#166534' : '#86EFAC'} />
                            <Text style={[styles.chipText, { color: scheme === 'light' ? '#166534' : '#86EFAC', fontFamily: fonts.sansBold }]}>
                              {(item.dailyTime || 'morning').toUpperCase()} DOSE
                            </Text>
                          </View>

                          {/* Refill / Restock Chip */}
                          {refillFormatted && (
                            <View
                              style={[
                                styles.chip,
                                restockStatus?.isDue
                                  ? { backgroundColor: scheme === 'light' ? '#FEF2F2' : '#7F1D1D' }
                                  : { backgroundColor: scheme === 'light' ? '#E0F2FE' : '#0C4A6E' },
                              ]}
                            >
                              <ClockIcon
                                size={12}
                                color={restockStatus?.isDue ? '#DC2626' : scheme === 'light' ? '#0284C7' : '#7DD3FC'}
                              />
                              <Text
                                style={[
                                  styles.chipText,
                                  restockStatus?.isDue
                                    ? { color: '#DC2626' }
                                    : { color: scheme === 'light' ? '#0284C7' : '#7DD3FC' },
                                ]}
                              >
                                {restockStatus ? restockStatus.label : `Refill: ${refillFormatted}`}
                              </Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Essential Stock Level Chip */}
                          <View
                            style={[
                              styles.chip,
                              item.stockLevel === 'empty'
                                ? { backgroundColor: scheme === 'light' ? '#FEE2E2' : '#7F1D1D' }
                                : item.stockLevel === 'few'
                                ? { backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F' }
                                : { backgroundColor: scheme === 'light' ? '#DCFCE7' : '#14532D' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                item.stockLevel === 'empty'
                                  ? { color: scheme === 'light' ? '#DC2626' : '#FCA5A5' }
                                  : item.stockLevel === 'few'
                                  ? { color: scheme === 'light' ? '#D97706' : '#FCD34D' }
                                  : { color: scheme === 'light' ? '#16A34A' : '#86EFAC' },
                              ]}
                            >
                              {item.stockLevel === 'empty'
                                ? '🔴 Empty (Need Refill)'
                                : item.stockLevel === 'few'
                                ? '🟡 Few Left'
                                : '🟢 Full Pack'}
                            </Text>
                          </View>

                          {/* Expiry Chip */}
                          {expiryInfo && (
                            <View
                              style={[
                                styles.chip,
                                expiryInfo.tone === 'bad' && {
                                  backgroundColor: scheme === 'light' ? '#FEE2E2' : '#7F1D1D',
                                },
                                expiryInfo.tone === 'warn' && {
                                  backgroundColor: scheme === 'light' ? '#FEF3C7' : '#78350F',
                                },
                                expiryInfo.tone === 'ok' && {
                                  backgroundColor: scheme === 'light' ? '#DCFCE7' : '#14532D',
                                },
                              ]}
                            >
                              {expiryInfo.tone === 'bad' && (
                                <MinusCircleIcon size={12} color={scheme === 'light' ? '#DC2626' : '#FCA5A5'} />
                              )}
                              {expiryInfo.tone === 'warn' && (
                                <ClockIcon size={12} color={scheme === 'light' ? '#D97706' : '#FCD34D'} />
                              )}
                              {expiryInfo.tone === 'ok' && (
                                <CheckCircleIcon size={12} color={scheme === 'light' ? '#16A34A' : '#86EFAC'} />
                              )}
                              <Text
                                style={[
                                  styles.chipText,
                                  expiryInfo.tone === 'bad' && {
                                    color: scheme === 'light' ? '#DC2626' : '#FCA5A5',
                                  },
                                  expiryInfo.tone === 'warn' && {
                                    color: scheme === 'light' ? '#D97706' : '#FCD34D',
                                  },
                                  expiryInfo.tone === 'ok' && {
                                    color: scheme === 'light' ? '#16A34A' : '#86EFAC',
                                  },
                                ]}
                              >
                                {expiryInfo.label}
                              </Text>
                            </View>
                          )}
                        </>
                      )}

                      {/* Reminders on badge */}
                      {item.remindersEnabled && (
                        <View
                          style={[
                            styles.chip,
                            { backgroundColor: scheme === 'light' ? '#F3F4F6' : '#1F2937' },
                          ]}
                        >
                          <Text style={{ fontSize: 10 }}>🔔</Text>
                          <Text style={[styles.chipText, { color: palette.ink2 }]}>
                            Notifications on
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* DAILY MED QUICK ACTION ROW (Taken Today & Restocked) */}
                    {isDaily && (
                      <View style={[styles.restockActionRow, { borderTopColor: palette.line }]}>
                        <Pressable
                          onPress={() => handleToggleTaken(item)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={isTaken ? `Mark ${item.name} as not taken today` : `Mark ${item.name} as taken today`}
                          style={[
                            styles.takenTodayBtn,
                            isTaken
                              ? { backgroundColor: palette.okTint, borderColor: palette.okLine }
                              : { backgroundColor: palette.surface, borderColor: palette.line },
                          ]}
                        >
                          <CheckCircleIcon size={14} color={isTaken ? palette.okInk : palette.ink2} />
                          <Text
                            style={[
                              styles.takenTodayBtnText,
                              { color: isTaken ? palette.okInk : palette.ink, fontFamily: isTaken ? fonts.sansBold : fonts.sansMedium },
                            ]}
                          >
                            {isTaken ? 'Taken Today ✓' : 'Mark as Taken'}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleMarkRestocked(item)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Mark ${item.name} as restocked`}
                          style={[styles.markRestockedBtn, { borderColor: palette.okLine, backgroundColor: palette.okTint }]}
                        >
                          <RefreshIcon size={12} color={palette.okInk} />
                          <Text style={[styles.markRestockedBtnText, { color: palette.okInk }]}>
                            Refilled ✓
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {/* Expired Advisory Line */}
                    {!isDaily && expiryInfo?.status === 'expired' && (
                      <View
                        style={[
                          styles.expiredNoticeRow,
                          {
                            backgroundColor: theme.emergencyBackground,
                            borderColor: theme.emergencyBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.expiredNoticeText, { color: theme.urgentAccent }]}>
                          Past its expiry date. Ask a pharmacist how to dispose of it safely.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Privacy Note at Bottom */}
          <View style={styles.privacyFooter}>
            <ShieldCheckIcon size={14} color={palette.ink2} />
            <Text style={[styles.privacyText, { color: palette.ink2 }]}>
              {t('saved_only_phone_never_shared', 'Saved only on this phone. Never shared.')}
            </Text>
          </View>
        </ScrollView>
      </AnimatedScreenTransition>

      {/* Add / Edit Modal Sheet */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                paddingBottom: Math.max(insets.bottom, 20) + 12,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: palette.line }]} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.ink }]}>
                {editingItem ? t('edit_medicine', 'Edit Medicine') : t('add_medicine', 'Add Medicine')}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                style={[styles.modalCloseBtn, { borderColor: palette.line }]}
              >
                <CloseIcon size={16} color={palette.ink2} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              {formError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              {/* SPACE SELECTOR IN MODAL */}
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Choose Medicine Space <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <View style={[styles.modalSpaceSelector, { backgroundColor: palette.bg, borderColor: palette.line }]}>
                <Pressable
                  onPress={() => {
                    setModalSpace('daily');
                    setIsRegular(true);
                  }}
                  style={[
                    styles.modalSpaceBtn,
                    modalSpace === 'daily' && [
                      styles.modalSpaceBtnActive,
                      { backgroundColor: theme.primaryAccent },
                    ],
                  ]}
                >
                  <PillCapsuleIcon size={14} color={modalSpace === 'daily' ? '#FFFFFF' : palette.ink} />
                  <Text
                    style={[
                      styles.modalSpaceBtnText,
                      { color: modalSpace === 'daily' ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    💊 Daily Health Med
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setModalSpace('essential');
                    setIsRegular(false);
                  }}
                  style={[
                    styles.modalSpaceBtn,
                    modalSpace === 'essential' && [
                      styles.modalSpaceBtnActive,
                      { backgroundColor: theme.primaryAccent },
                    ],
                  ]}
                >
                  <FirstAidBoxIcon size={14} color={modalSpace === 'essential' ? '#FFFFFF' : palette.ink} />
                  <Text
                    style={[
                      styles.modalSpaceBtnText,
                      { color: modalSpace === 'essential' ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    🧰 Essential Box Med
                  </Text>
                </Pressable>
              </View>

              {/* Medicine Name with Autocomplete */}
              <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                Medicine name <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={handleNameChange}
                placeholder={
                  modalSpace === 'daily'
                    ? 'Type or search (e.g. Metformin, Telmisartan)...'
                    : 'Type or search (e.g. Dolo 650, Meftal-Spas)...'
                }
                placeholderTextColor={palette.ink2}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: palette.bg,
                    borderColor: palette.line,
                    color: palette.ink,
                  },
                ]}
              />

              {/* Autocomplete suggestions dropdown */}
              {showInputSuggestions && inputSuggestions.length > 0 && (
                <View style={[styles.suggestionsBox, { backgroundColor: palette.surface, borderColor: palette.line }]}>
                  {inputSuggestions.map((sug) => (
                    <Pressable
                      key={sug.id}
                      onPress={() => handleSelectCatalogSuggestion(sug)}
                      style={[styles.suggestionItem, { borderBottomColor: palette.line }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.suggestionBrand, { color: palette.ink }]}>{sug.brand_name}</Text>
                        <Text style={[styles.suggestionGeneric, { color: palette.ink2 }]}>
                          {sug.generic_name} • {sug.dosage_form || ''} {sug.strength || ''}
                        </Text>
                      </View>
                      <Text style={[styles.suggestionPickText, { color: palette.accent }]}>Pick</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Quick Popular Medicines Chips */}
              {!editingItem && !name.trim() && (
                <View style={styles.quickChipsSection}>
                  <Text style={[styles.quickChipsLabel, { color: palette.ink2 }]}>
                    {modalSpace === 'daily' ? 'Common daily health meds:' : 'Common home cabinet essentials:'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChipsRow}>
                    {(modalSpace === 'daily' ? POPULAR_DAILY_CHIPS : POPULAR_ESSENTIAL_CHIPS).map((chip) => (
                      <Pressable
                        key={chip.name}
                        onPress={() => {
                          setName(chip.name);
                          setDosageForm(chip.form);
                          setStrength(chip.strength);
                          if ('interval' in chip) {
                            handleSelectRestockInterval((chip as any).interval);
                          }
                          if ('category' in chip) {
                            setEssentialCategory((chip as any).category);
                          }
                        }}
                        style={[styles.quickChipBtn, { backgroundColor: palette.surface2, borderColor: palette.line }]}
                      >
                        <Text style={[styles.quickChipText, { color: palette.ink }]}>{chip.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* DAILY MEDS SPECIFIC FIELDS */}
              {modalSpace === 'daily' && (
                <>
                  {/* Daily Dose Timing */}
                  <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 10 }]}>
                    Daily Dose Timing
                  </Text>
                  <View style={styles.doseChipsRow}>
                    {[
                      { key: 'morning', label: '🌅 Morning' },
                      { key: 'afternoon', label: '☀️ Afternoon' },
                      { key: 'night', label: '🌙 Night' },
                      { key: 'anytime', label: '⏰ Anytime' },
                    ].map((tSlot) => {
                      const isSel = dailyTime === tSlot.key;
                      return (
                        <Pressable
                          key={tSlot.key}
                          onPress={() => setDailyTime(tSlot.key)}
                          style={[
                            styles.doseChip,
                            {
                              backgroundColor: isSel ? theme.primaryAccent : palette.surface2,
                              borderColor: isSel ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.doseChipText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {tSlot.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Restock Frequency Selector */}
                  <View
                    style={[
                      styles.regularSectionBox,
                      {
                        backgroundColor: scheme === 'light' ? '#F0FDF4' : '#064E3B',
                        borderColor: palette.okLine,
                      },
                    ]}
                  >
                    <View style={styles.regularHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.regularTitle, { color: palette.ink }]}>
                          Restock Schedule
                        </Text>
                        <Text style={[styles.regularSubtitle, { color: palette.ink2 }]}>
                          Choose restock cycle so you get timely refill reminders.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.frequencyPickerContainer}>
                      <View style={styles.frequencyButtonsGrid}>
                        {/* Weekly */}
                        <Pressable
                          onPress={() => handleSelectRestockInterval('weekly')}
                          style={[
                            styles.frequencyCard,
                            {
                              backgroundColor: restockInterval === 'weekly' ? theme.primaryAccent : palette.surface,
                              borderColor: restockInterval === 'weekly' ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyCardTitle,
                              { color: restockInterval === 'weekly' ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            📅 Weekly
                          </Text>
                          <Text
                            style={[
                              styles.frequencyCardSub,
                              { color: restockInterval === 'weekly' ? '#E0E7FF' : palette.ink2 },
                            ]}
                          >
                            Every 7 days
                          </Text>
                        </Pressable>

                        {/* Monthly */}
                        <Pressable
                          onPress={() => handleSelectRestockInterval('monthly')}
                          style={[
                            styles.frequencyCard,
                            {
                              backgroundColor: restockInterval === 'monthly' ? theme.primaryAccent : palette.surface,
                              borderColor: restockInterval === 'monthly' ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyCardTitle,
                              { color: restockInterval === 'monthly' ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            📅 Monthly
                          </Text>
                          <Text
                            style={[
                              styles.frequencyCardSub,
                              { color: restockInterval === 'monthly' ? '#E0E7FF' : palette.ink2 },
                            ]}
                          >
                            Every 30 days
                          </Text>
                        </Pressable>

                        {/* 2 Months */}
                        <Pressable
                          onPress={() => handleSelectRestockInterval('2months')}
                          style={[
                            styles.frequencyCard,
                            {
                              backgroundColor: restockInterval === '2months' ? theme.primaryAccent : palette.surface,
                              borderColor: restockInterval === '2months' ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyCardTitle,
                              { color: restockInterval === '2months' ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            📅 2 Months
                          </Text>
                          <Text
                            style={[
                              styles.frequencyCardSub,
                              { color: restockInterval === '2months' ? '#E0E7FF' : palette.ink2 },
                            ]}
                          >
                            Every 60 days
                          </Text>
                        </Pressable>
                      </View>

                      {/* Calculated Next Restock Date Banner */}
                      <View
                        style={[
                          styles.scheduleNoticeBox,
                          {
                            backgroundColor: scheme === 'light' ? '#ECFDF5' : '#064E3B',
                            borderColor: scheme === 'light' ? '#A7F3D0' : '#059669',
                          },
                        ]}
                      >
                        <CheckCircleIcon size={16} color="#059669" />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.scheduleNoticeTitle, { color: '#047857' }]}>
                            Next restock notification: {refillOn ? formatRefillDate(refillOn) : 'Soon'}
                          </Text>
                          <Text style={[styles.scheduleNoticeSub, { color: '#065F46' }]}>
                            MedFind will alert you at 9:00 AM on this day to restock your supply.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* ESSENTIAL MEDS SPECIFIC FIELDS */}
              {modalSpace === 'essential' && (
                <>
                  {/* Category Selector */}
                  <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 10 }]}>
                    Cabinet Category
                  </Text>
                  <View style={styles.categoryChipsGrid}>
                    {ESSENTIAL_CATEGORIES.map((cat) => {
                      const isSel = essentialCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setEssentialCategory(cat)}
                          style={[
                            styles.categoryChip,
                            {
                              backgroundColor: isSel ? theme.primaryAccent : palette.surface2,
                              borderColor: isSel ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Stock Level Selector */}
                  <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                    Current Stock Level
                  </Text>
                  <View style={styles.stockChipsRow}>
                    {[
                      { key: 'full', label: '🟢 Full pack' },
                      { key: 'few', label: '🟡 Few left' },
                      { key: 'empty', label: '🔴 Need refill' },
                    ].map((st) => {
                      const isSel = stockLevel === st.key;
                      return (
                        <Pressable
                          key={st.key}
                          onPress={() => setStockLevel(st.key as any)}
                          style={[
                            styles.stockChip,
                            {
                              backgroundColor: isSel ? theme.primaryAccent : palette.surface2,
                              borderColor: isSel ? theme.primaryAccent : palette.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockChipText,
                              { color: isSel ? '#FFFFFF' : palette.ink },
                            ]}
                          >
                            {st.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Expiry Month & Year */}
                  <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                    Expiry date (printed on packaging)
                  </Text>
                  <View style={styles.datePickerRow}>
                    <Pressable
                      onPress={() => setShowMonthYearPicker((prev) => !prev)}
                      style={[
                        styles.dateSelectBtn,
                        { backgroundColor: palette.bg, borderColor: palette.line },
                      ]}
                    >
                      <ClockIcon size={16} color={palette.ink2} />
                      <Text
                        style={[
                          styles.dateSelectText,
                          { color: expiryDate ? palette.ink : palette.ink2 },
                        ]}
                      >
                        {expiryDate ? formatExpiryMonthYear(expiryDate) : 'Select expiry month & year'}
                      </Text>
                    </Pressable>
                    {expiryDate && (
                      <Pressable onPress={() => setExpiryDate(null)} style={styles.clearDateBtn}>
                        <Text style={[styles.clearDateText, { color: palette.ink2 }]}>Clear</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Month & Year Picker Panel */}
                  {showMonthYearPicker && (
                    <View
                      style={[
                        styles.monthYearPickerBox,
                        { backgroundColor: palette.bg, borderColor: palette.line },
                      ]}
                    >
                      <View style={styles.monthYearYearRow}>
                        <Pressable
                          onPress={() => setSelectedYear((y) => Math.max(y - 1, currentYear - 3))}
                          hitSlop={8}
                          style={[styles.yearArrowBtn, { borderColor: palette.line }]}
                        >
                          <Text style={[styles.yearArrowText, { color: palette.ink }]}>‹</Text>
                        </Pressable>
                        <Text style={[styles.monthYearYearLabel, { color: palette.ink }]}>
                          {selectedYear}
                        </Text>
                        <Pressable
                          onPress={() => setSelectedYear((y) => Math.min(y + 1, currentYear + 15))}
                          hitSlop={8}
                          style={[styles.yearArrowBtn, { borderColor: palette.line }]}
                        >
                          <Text style={[styles.yearArrowText, { color: palette.ink }]}>›</Text>
                        </Pressable>
                      </View>

                      <View style={styles.monthsGrid}>
                        {MONTHS_LIST.map((m, idx) => {
                          const mStr = String(idx + 1).padStart(2, '0');
                          const fullVal = `${selectedYear}-${mStr}`;
                          const isSelected =
                            Boolean(expiryDate) &&
                            parseExpiryDate(expiryDate)?.getMonth() === idx &&
                            parseExpiryDate(expiryDate)?.getFullYear() === selectedYear;

                          return (
                            <Pressable
                              key={m}
                              onPress={() => {
                                setExpiryDate(fullVal);
                                setShowMonthYearPicker(false);
                              }}
                              style={[
                                styles.monthGridCell,
                                {
                                  backgroundColor: isSelected ? theme.primaryAccent : palette.surface,
                                  borderColor: isSelected ? theme.primaryAccent : palette.line,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.monthGridCellText,
                                  { color: isSelected ? '#FFFFFF' : palette.ink },
                                ]}
                              >
                                {m}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <Pressable
                        onPress={() => setShowMonthYearPicker(false)}
                        style={[styles.pickerDoneBtn, { backgroundColor: theme.primaryAccent, marginTop: 8 }]}
                      >
                        <Text style={styles.pickerDoneText}>Done</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Exact Expiry Day (optional) */}
                  <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                    Exact expiry day (if printed)
                  </Text>
                  <View style={styles.datePickerRow}>
                    <Pressable
                      onPress={() => setShowExactExpiryPicker(true)}
                      style={[
                        styles.dateSelectBtn,
                        { backgroundColor: palette.bg, borderColor: palette.line },
                      ]}
                    >
                      <ClockIcon size={16} color={palette.ink2} />
                      <Text
                        style={[
                          styles.dateSelectText,
                          { color: exactExpiryDate ? palette.ink : palette.ink2 },
                        ]}
                      >
                        {exactExpiryDate ? formatExactExpiryDate(exactExpiryDate) : 'Select exact day (optional)'}
                      </Text>
                    </Pressable>
                    {exactExpiryDate && (
                      <Pressable onPress={() => setExactExpiryDate(null)} style={styles.clearDateBtn}>
                        <Text style={[styles.clearDateText, { color: palette.ink2 }]}>Clear</Text>
                      </Pressable>
                    )}
                  </View>

                  {showExactExpiryPicker && (
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={formatExactDatePickerValue(exactExpiryDate)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleExactExpiryPickerChange}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable
                          onPress={() => setShowExactExpiryPicker(false)}
                          style={[styles.pickerDoneBtn, { backgroundColor: theme.primaryAccent }]}
                        >
                          <Text style={styles.pickerDoneText}>Done</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Optional Note */}
              <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Take after food with water"
                placeholderTextColor={palette.ink2}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: palette.bg,
                    borderColor: palette.line,
                    color: palette.ink,
                  },
                ]}
              />

              {/* Remind me Toggle */}
              <View
                style={[
                  styles.remindRow,
                  { backgroundColor: palette.bg, borderColor: palette.line },
                ]}
              >
                <View style={styles.remindRowLeft}>
                  <Text style={[styles.remindTitle, { color: palette.ink }]}>
                    {t('remind_me', 'Remind me')}
                  </Text>
                  <Text style={[styles.remindSubtitle, { color: palette.ink2 }]}>
                    {modalSpace === 'daily'
                      ? 'Get notifications when your restock cycle is due'
                      : 'Get notified 30 days before this medicine expires'}
                  </Text>
                </View>
                <Switch
                  value={remindersEnabled}
                  onValueChange={setRemindersEnabled}
                  trackColor={{ false: palette.line, true: theme.primaryAccent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {remindersEnabled && (
                <View
                  style={[
                    styles.remindInlineNote,
                    {
                      backgroundColor: scheme === 'light' ? '#F0FDF4' : '#052E16',
                      borderColor: scheme === 'light' ? '#86EFAC' : '#166534',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.remindInlineText,
                      { color: scheme === 'light' ? '#166534' : '#BBF7D0' },
                    ]}
                  >
                    {modalSpace === 'daily'
                      ? "You'll receive a local reminder at 9:00 AM on your restock day so you never run out."
                      : "You'll receive notifications 30 days before expiry so you can safely replace expired medicines."}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: palette.line }]}
                >
                  <Text style={[styles.cancelBtnText, { color: palette.ink }]}>
                    {t('cancel', 'Cancel')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: theme.primaryAccent }]}
                >
                  <Text style={styles.saveBtnText}>
                    {editingItem ? t('save_changes', 'Save Changes') : t('add_to_box', 'Add to Box')}
                  </Text>
                </Pressable>
              </View>

              {/* Delete button when editing */}
              {editingItem && (
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    setItemToDelete(editingItem);
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${editingItem.name} from box`}
                  style={[
                    styles.modalDeleteBtn,
                    {
                      borderColor: scheme === 'light' ? '#FECACA' : '#7F1D1D',
                      backgroundColor: scheme === 'light' ? '#FEF2F2' : '#450A0A',
                    },
                  ]}
                >
                  <TrashIcon size={16} color={scheme === 'light' ? '#DC2626' : '#F87171'} />
                  <Text style={[styles.modalDeleteBtnText, { color: scheme === 'light' ? '#DC2626' : '#F87171' }]}>
                    Remove {editingItem.name} from Box
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal (Works on Web, iOS, Android identically) */}
      <Modal
        visible={itemToDelete !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setItemToDelete(null)}
      >
        <Pressable style={styles.confirmBackdrop} onPress={() => setItemToDelete(null)}>
          <Pressable
            style={[
              styles.confirmCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.shadow,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.confirmIconWrap, { backgroundColor: scheme === 'light' ? '#FEE2E2' : '#7F1D1D' }]}>
              <TrashIcon size={26} color={scheme === 'light' ? '#DC2626' : '#FCA5A5'} />
            </View>

            <Text style={[styles.confirmTitle, { color: palette.ink }]}>
              Remove Medicine?
            </Text>

            <Text style={[styles.confirmSubtitle, { color: palette.ink2 }]}>
              Are you sure you want to remove "{itemToDelete?.name}" from your{' '}
              {itemToDelete && getItemSpace(itemToDelete) === 'daily'
                ? 'Daily Health Meds'
                : 'Essential Medicine Box'}
              ? Any scheduled reminder notifications for this item will be cancelled.
            </Text>

            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setItemToDelete(null)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel removal"
                style={[styles.confirmCancelBtn, { borderColor: palette.line, backgroundColor: palette.bg }]}
              >
                <Text style={[styles.confirmCancelBtnText, { color: palette.ink }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmDelete}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Confirm delete ${itemToDelete?.name}`}
                style={styles.confirmDeleteBtn}
              >
                <TrashIcon size={15} color="#FFFFFF" />
                <Text style={styles.confirmDeleteBtnText}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    lineHeight: 22,
  },
  headerCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    gap: 6,
    minHeight: 36,
  },
  headerAddBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    flex: 1,
  },
  fullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  fullBannerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    flex: 1,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  spaceSegmentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  spaceSegmentRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 6,
  },
  spaceSegmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  spaceSegmentTabActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  spaceSegmentTabText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },
  spaceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  spaceBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },
  spaceBannerSub: {
    fontFamily: fonts.sansMedium,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  filterTabsScrollView: {
    flexGrow: 0,
    height: 44,
    maxHeight: 44,
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  filterTabPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  filterTabText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12.5,
    lineHeight: 16,
    includeFontPadding: false,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  catalogSection: {
    marginBottom: 20,
    gap: 10,
  },
  catalogSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catalogSectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  catalogSectionSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  catalogGrid: {
    gap: 8,
  },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  catalogCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catalogMedName: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  catalogGenericName: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  catalogAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  catalogAddBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  inBoxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  inBoxBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  regularMedPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  promoIconCol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  promoTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  promoSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  promoAddPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  promoAddPillText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  sectionTitleRow: {
    marginBottom: 10,
  },
  sectionTitleText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 130,
    height: 130,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.pill,
    gap: 8,
    minHeight: MIN_TARGET,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemMainTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  item3DPedestal: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleBox: {
    flex: 1,
  },
  itemTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
  regularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regularBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  itemSubDetail: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  itemNote: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  itemDeleteBtn: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
  },
  restockActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  restockDueText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  takenTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  takenTodayBtnText: {
    fontSize: 12,
  },
  markRestockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  markRestockedBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11.5,
  },
  expiredNoticeRow: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  expiredNoticeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 8,
  },
  privacyText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '92%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScroll: {
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 15,
    minHeight: 44,
    marginBottom: 8,
  },
  suggestionsBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionBrand: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  suggestionGeneric: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  suggestionPickText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    paddingLeft: 8,
  },
  quickChipsSection: {
    marginBottom: 14,
  },
  quickChipsLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
  },
  quickChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginRight: 8,
  },
  quickChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  modalSpaceSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 6,
    marginBottom: 6,
  },
  modalSpaceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 9,
    gap: 6,
  },
  modalSpaceBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSpaceBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },
  doseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  doseChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  doseChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  stockChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  stockChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  regularSectionBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
    gap: 12,
  },
  regularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regularTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  regularSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  frequencyPickerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 12,
    gap: 10,
  },
  frequencyHeader: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
  frequencyButtonsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  frequencyCardSub: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 2,
  },
  scheduleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  scheduleNoticeTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
  },
  scheduleNoticeSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    minHeight: 44,
  },
  dateSelectText: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  clearDateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  clearDateText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  pickerContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  monthYearPickerBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    gap: 10,
  },
  monthYearYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yearArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearArrowText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  monthYearYearLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    fontWeight: '700',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthGridCell: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGridCellText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerDoneBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  remindRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  remindTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  remindSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  remindInlineNote: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  remindInlineText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: MIN_TARGET,
  },
  cancelBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: MIN_TARGET,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  modalDeleteBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: MIN_TARGET,
  },
  confirmCancelBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
  },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: radii.pill,
    gap: 6,
    paddingVertical: 12,
    minHeight: MIN_TARGET,
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
});
