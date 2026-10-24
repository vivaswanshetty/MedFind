import React, { useState, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../constants/theme';
import { AtmosphereBackground } from '../components/AtmosphereBackground';
import { AnimatedScreenTransition } from '../components/AnimatedScreenTransition';
import { onboardingAssets } from '../../assets/onboarding';
import {
  useMedicineBox,
  MedicineBoxItem,
  MAX_MEDICINE_BOX_ITEMS,
} from '../store/medicineBox';
import {
  getExpiryChipInfo,
  formatRefillDate,
  parseExpiryDate,
} from '../lib/medicineBoxStatus';
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
} from '../components/icons/AppIcons';

export default function MedicineBoxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scheme, palette, theme } = useTheme();
  const { items, isLoading, addItem, updateItem, removeItem } = useMedicineBox();

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MedicineBoxItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [refillOn, setRefillOn] = useState<string | null>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Date Pickers visibility
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [showRefillPicker, setShowRefillPicker] = useState(false);

  const isFull = items.length >= MAX_MEDICINE_BOX_ITEMS;

  const openAddModal = () => {
    if (isFull) {
      Alert.alert(
        'Medicine Box Full',
        `Your medicine box is full (${MAX_MEDICINE_BOX_ITEMS} items). Please remove an existing item before adding a new one.`
      );
      return;
    }
    setEditingItem(null);
    setName('');
    setNote('');
    setExpiryDate(null);
    setRefillOn(null);
    setRemindersEnabled(false);
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (item: MedicineBoxItem) => {
    setEditingItem(item);
    setName(item.name);
    setNote(item.note || '');
    setExpiryDate(item.expiryDate || null);
    setRefillOn(item.refillOn || null);
    setRemindersEnabled(Boolean(item.remindersEnabled));
    setFormError(null);
    setModalVisible(true);
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

    if (editingItem) {
      const res = await updateItem(editingItem.id, {
        name: trimmedName,
        note: note.trim() || undefined,
        expiryDate: expiryDate || undefined,
        refillOn: refillOn || undefined,
        remindersEnabled,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to update medicine.');
        return;
      }

      if (res.warning) {
        Alert.alert('Notice', res.warning);
      }
    } else {
      const res = await addItem({
        name: trimmedName,
        note: note.trim() || undefined,
        expiryDate: expiryDate || undefined,
        refillOn: refillOn || undefined,
        remindersEnabled,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to add medicine.');
        return;
      }

      if (res.warning) {
        Alert.alert('Notice', res.warning);
      }
    }

    setModalVisible(false);
  };

  const handleDeleteWithConfirm = (item: MedicineBoxItem) => {
    Alert.alert(
      'Remove Medicine',
      `Are you sure you want to remove "${item.name}" from your medicine box? Scheduled reminders for this item will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeItem(item.id);
          },
        },
      ]
    );
  };

  const formatDatePickerValue = (dateStr?: string | null): Date => {
    if (!dateStr) return new Date();
    const parsed = parseExpiryDate(dateStr);
    return parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
  };

  const handleExpiryPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowExpiryPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const lastDay = new Date(year, month, 0).getDate();
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(lastDay).padStart(2, '0');
      setExpiryDate(`${year}-${monthStr}-${dayStr}`);
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
              My Medicine Box
            </Text>
            <Text style={[styles.headerCount, { color: palette.ink2 }]}>
              {items.length}/{MAX_MEDICINE_BOX_ITEMS} medicines
            </Text>
          </View>

          <Pressable
            onPress={openAddModal}
            disabled={isFull}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add a medicine"
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
              Add
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
              Your medicine box is full ({MAX_MEDICINE_BOX_ITEMS} items)
            </Text>
          </View>
        )}

        {/* Main Content Area */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <Image
                source={onboardingAssets.small.cardMedicineBox}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={[styles.emptyTitle, { color: palette.ink }]}>
                Your medicine box is empty
              </Text>
              <Text style={[styles.emptySubtitle, { color: palette.ink2 }]}>
                Keep track of expiry dates and get refill reminders on this phone.
              </Text>
              <Pressable
                onPress={openAddModal}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add a medicine"
                style={[styles.emptyAddBtn, { backgroundColor: theme.primaryAccent }]}
              >
                <PlusIcon size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add a medicine</Text>
              </Pressable>
            </View>
          ) : (
            /* List of Items */
            <View style={styles.itemsList}>
              {items.map((item) => {
                const expiryInfo = getExpiryChipInfo(item);
                const refillFormatted = formatRefillDate(item.refillOn);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openEditModal(item)}
                    onLongPress={() => handleDeleteWithConfirm(item)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, ${item.note || ''}. Tap to edit, long press to delete.`}
                    style={({ pressed }) => [
                      styles.itemCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.line,
                        shadowColor: palette.shadow,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.itemTitleBox}>
                        <Text style={[styles.itemName, { color: palette.ink }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.note ? (
                          <Text style={[styles.itemNote, { color: palette.ink2 }]} numberOfLines={2}>
                            {item.note}
                          </Text>
                        ) : null}
                      </View>

                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteWithConfirm(item);
                        }}
                        hitSlop={8}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.name}`}
                        style={styles.itemDeleteBtn}
                      >
                        <TrashIcon size={16} color={scheme === 'light' ? '#DC2626' : '#F87171'} />
                      </Pressable>
                    </View>

                    {/* Chips Row */}
                    <View style={styles.chipsRow}>
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
                            <MinusCircleIcon
                              size={12}
                              color={scheme === 'light' ? '#DC2626' : '#FCA5A5'}
                            />
                          )}
                          {expiryInfo.tone === 'warn' && (
                            <ClockIcon
                              size={12}
                              color={scheme === 'light' ? '#D97706' : '#FCD34D'}
                            />
                          )}
                          {expiryInfo.tone === 'ok' && (
                            <CheckCircleIcon
                              size={12}
                              color={scheme === 'light' ? '#16A34A' : '#86EFAC'}
                            />
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

                      {/* Refill Chip */}
                      {refillFormatted && (
                        <View
                          style={[
                            styles.chip,
                            { backgroundColor: scheme === 'light' ? '#E0F2FE' : '#0C4A6E' },
                          ]}
                        >
                          <ClockIcon
                            size={12}
                            color={scheme === 'light' ? '#0284C7' : '#7DD3FC'}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              { color: scheme === 'light' ? '#0284C7' : '#7DD3FC' },
                            ]}
                          >
                            Refill on {refillFormatted}
                          </Text>
                        </View>
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
                            Reminders active
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Expired Advisory Line */}
                    {expiryInfo?.status === 'expired' && (
                      <View
                        style={[
                          styles.expiredNoticeRow,
                          {
                            backgroundColor: scheme === 'light' ? '#FEF2F2' : '#450A0A',
                            borderColor: scheme === 'light' ? '#FECACA' : '#7F1D1D',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.expiredNoticeText,
                            { color: scheme === 'light' ? '#B91C1C' : '#FCA5A5' },
                          ]}
                        >
                          Past its expiry date. Ask a pharmacist how to dispose of it safely.
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Privacy Note at Bottom */}
          <View style={styles.privacyFooter}>
            <ShieldCheckIcon size={14} color={palette.ink2} />
            <Text style={[styles.privacyText, { color: palette.ink2 }]}>
              Saved only on this phone. Never shared.
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
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
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
                {editingItem ? 'Edit Medicine' : 'Add Medicine'}
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

              {/* Medicine Name */}
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Medicine name <Text style={{ color: '#DC2626' }}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. Paracetamol 500mg"
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

              {/* Optional Note */}
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. In bathroom cabinet / after breakfast"
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

              {/* Expiry Date */}
              <Text style={[styles.fieldLabel, { color: palette.ink }]}>
                Expiry date (optional)
              </Text>
              <View style={styles.datePickerRow}>
                <Pressable
                  onPress={() => setShowExpiryPicker(true)}
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
                    {expiryDate ? `Expires: ${expiryDate}` : 'Select expiry date'}
                  </Text>
                </Pressable>
                {expiryDate && (
                  <Pressable
                    onPress={() => setExpiryDate(null)}
                    style={styles.clearDateBtn}
                  >
                    <Text style={[styles.clearDateText, { color: palette.ink2 }]}>
                      Clear
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* DateTimePicker for Expiry */}
              {showExpiryPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={formatDatePickerValue(expiryDate)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleExpiryPickerChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={() => setShowExpiryPicker(false)}
                      style={[styles.pickerDoneBtn, { backgroundColor: theme.primaryAccent }]}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Refill Date */}
              <Text style={[styles.fieldLabel, { color: palette.ink, marginTop: 12 }]}>
                Refill on date (optional)
              </Text>
              <View style={styles.datePickerRow}>
                <Pressable
                  onPress={() => setShowRefillPicker(true)}
                  style={[
                    styles.dateSelectBtn,
                    { backgroundColor: palette.bg, borderColor: palette.line },
                  ]}
                >
                  <ClockIcon size={16} color={palette.ink2} />
                  <Text
                    style={[
                      styles.dateSelectText,
                      { color: refillOn ? palette.ink : palette.ink2 },
                    ]}
                  >
                    {refillOn ? `Refill: ${refillOn}` : 'Select refill date'}
                  </Text>
                </Pressable>
                {refillOn && (
                  <Pressable
                    onPress={() => setRefillOn(null)}
                    style={styles.clearDateBtn}
                  >
                    <Text style={[styles.clearDateText, { color: palette.ink2 }]}>
                      Clear
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* DateTimePicker for Refill */}
              {showRefillPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={formatDatePickerValue(refillOn)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleRefillPickerChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      onPress={() => setShowRefillPicker(false)}
                      style={[styles.pickerDoneBtn, { backgroundColor: theme.primaryAccent }]}
                    >
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Remind me Toggle */}
              <View
                style={[
                  styles.remindRow,
                  { backgroundColor: palette.bg, borderColor: palette.line },
                ]}
              >
                <View style={styles.remindRowLeft}>
                  <Text style={[styles.remindTitle, { color: palette.ink }]}>
                    Remind me
                  </Text>
                  <Text style={[styles.remindSubtitle, { color: palette.ink2 }]}>
                    Get notified before expiry and on refill day
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
                    You'll get a reminder 30 days before expiry and on your refill date.
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
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: theme.primaryAccent }]}
                >
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Save Changes' : 'Add to Box'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
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
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
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
    fontSize: 15,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTitleBox: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    lineHeight: 22,
  },
  itemNote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
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
    maxHeight: '90%',
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
    marginBottom: 14,
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
});
