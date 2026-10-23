import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { layout, typography } from '../../theme/tokens';
import { useLocation } from '../../context/LocationContext';
import { PREDEFINED_AREAS, KnownArea } from '../../services/locationService';
import {
  MapPinIcon,
  CrosshairTargetIcon,
  CloseIcon,
  SearchIcon,
  CheckmarkIcon,
} from '../icons/AppIcons';

interface AreaPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AreaPickerModal({ visible, onClose }: AreaPickerModalProps) {
  const { mode, theme } = useTheme();
  const {
    areaName,
    locationSource,
    isLocating,
    requestGpsLocation,
    selectManualArea,
    clearLocation,
  } = useLocation();

  const [filterText, setFilterText] = useState('');

  const handleUseGps = async () => {
    const res = await requestGpsLocation();
    if (res.granted) {
      onClose();
    }
  };

  const handleSelectArea = async (area: KnownArea) => {
    await selectManualArea(area);
    onClose();
  };

  const handleCustomAreaSubmit = async () => {
    const trimmed = filterText.trim();
    if (!trimmed) return;
    await selectManualArea({ name: `${trimmed}, Bengaluru` });
    setFilterText('');
    onClose();
  };

  const handleResetLocation = async () => {
    await clearLocation();
    onClose();
  };

  const matchingAreas = PREDEFINED_AREAS.filter(
    (a) =>
      filterText.trim() === '' ||
      a.name.toLowerCase().includes(filterText.toLowerCase()) ||
      a.pincode.includes(filterText.trim())
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.modalCard,
            {
              backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(18, 16, 26, 0.98)',
              borderColor: theme.glass.borderHighlight,
              shadowColor: theme.glass.shadowColor,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <MapPinIcon size={20} />
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Choose Location
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close location chooser"
            >
              <CloseIcon size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Action: Device GPS */}
          <TouchableOpacity
            onPress={handleUseGps}
            disabled={isLocating}
            style={[
              styles.gpsButton,
              {
                backgroundColor: locationSource === 'gps'
                  ? (mode === 'light' ? theme.badgeBackground : 'rgba(0, 229, 255, 0.15)')
                  : theme.glass.backgroundPill,
                borderColor: locationSource === 'gps'
                  ? theme.primaryAccent
                  : theme.glass.border,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Use current device GPS location"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={theme.primaryAccent} />
            ) : (
              <CrosshairTargetIcon size={18} color={theme.primaryAccentText} />
            )}
            <View style={styles.gpsTextCol}>
              <Text style={[styles.gpsButtonTitle, { color: theme.textPrimary }]}>
                Use Current Device Location
              </Text>
              <Text style={[styles.gpsButtonSubtitle, { color: theme.textSecondary }]}>
                Calculates real distances without saving coordinates
              </Text>
            </View>
            {locationSource === 'gps' && (
              <CheckmarkIcon size={14} color={theme.primaryAccentText} />
            )}
          </TouchableOpacity>

          {/* Search Input for Neighborhoods */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.glass.backgroundSubtle,
                borderColor: theme.glass.border,
              },
            ]}
          >
            <SearchIcon size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search or enter area name..."
              placeholderTextColor={theme.textMuted}
              value={filterText}
              onChangeText={setFilterText}
              onSubmitEditing={handleCustomAreaSubmit}
              returnKeyType="done"
            />
          </View>

          {/* Predefined Areas List */}
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Bengaluru Neighborhoods
          </Text>

          <ScrollView style={styles.areasList} showsVerticalScrollIndicator={false}>
            {matchingAreas.map((item) => {
              const isSelected = areaName.toLowerCase().includes(item.locality.toLowerCase());
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectArea(item)}
                  style={[
                    styles.areaRow,
                    {
                      borderBottomColor: theme.glass.borderSubtle,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.areaRowLeft}>
                    <Text style={[styles.areaNameText, { color: theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.areaPincodeText, { color: theme.textMuted }]}>
                      Pincode: {item.pincode}
                    </Text>
                  </View>
                  {isSelected && (
                    <CheckmarkIcon size={16} color={theme.primaryAccentText} />
                  )}
                </TouchableOpacity>
              );
            })}

            {filterText.trim().length > 0 && matchingAreas.length === 0 && (
              <TouchableOpacity
                onPress={handleCustomAreaSubmit}
                style={[
                  styles.customSubmitBtn,
                  {
                    backgroundColor: theme.glass.backgroundPill,
                    borderColor: theme.glass.border,
                  },
                ]}
              >
                <Text style={[styles.customSubmitText, { color: theme.primaryAccentText }]}>
                  Select "{filterText.trim()}"
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Reset / All Bengaluru */}
          <TouchableOpacity
            onPress={handleResetLocation}
            style={styles.resetButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear location and search all Bengaluru"
          >
            <Text style={[styles.resetButtonText, { color: theme.textMuted }]}>
              Clear location & search all areas
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '82%',
    borderRadius: layout.borderRadius.lg + 4,
    borderWidth: 1,
    padding: layout.spacing.md + 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: layout.spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
    marginBottom: layout.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: typography.fontFamilyBold,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.md + 2,
    borderWidth: 1,
    marginBottom: layout.spacing.md,
    gap: 10,
  },
  gpsTextCol: {
    flex: 1,
    gap: 2,
  },
  gpsButtonTitle: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  gpsButtonSubtitle: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '400',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.sm + 4,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    minHeight: 42,
    marginBottom: layout.spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
  },
  sectionSubtitle: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  areasList: {
    maxHeight: 220,
    marginBottom: layout.spacing.sm,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: layout.spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  areaRowLeft: {
    gap: 2,
  },
  areaNameText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.sm,
  },
  areaPincodeText: {
    fontFamily: typography.fontFamilyRegular,
    fontSize: typography.fontSize.xs - 1,
  },
  customSubmitBtn: {
    padding: layout.spacing.sm + 2,
    borderRadius: layout.borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  customSubmitText: {
    fontFamily: typography.fontFamilySemibold,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xs + 2,
  },
  resetButtonText: {
    fontFamily: typography.fontFamilyMedium,
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
});
