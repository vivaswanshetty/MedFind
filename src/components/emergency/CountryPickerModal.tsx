import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { CloseIcon, SearchIcon, CheckmarkIcon } from '../icons/AppIcons';
import { getAllCountries, CountryEmergencyData } from '../../data/emergencyNumbers';

export interface CountryPickerModalProps {
  visible: boolean;
  selectedCountryCode: string | null;
  onSelectCountry: (countryCode: string) => void;
  onResetToAutoDetect?: () => void;
  onClose: () => void;
}

export function CountryPickerModal({
  visible,
  selectedCountryCode,
  onSelectCountry,
  onResetToAutoDetect,
  onClose,
}: CountryPickerModalProps) {
  const { scheme, palette } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const allCountries = useMemo(() => getAllCountries(), []);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q)
    );
  }, [allCountries, searchQuery]);

  const handleSelect = (item: CountryEmergencyData) => {
    onSelectCountry(item.isoCode);
    setSearchQuery('');
    onClose();
  };

  const handleReset = () => {
    onResetToAutoDetect?.();
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.shadow,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: palette.line }]}>
            <Text style={[styles.modalTitle, { color: palette.ink }]}>
              Select Country
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[
                styles.closeBtn,
                { backgroundColor: palette.surface2, minHeight: MIN_TARGET, minWidth: MIN_TARGET },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close country selector"
            >
              <CloseIcon size={16} color={palette.ink2} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                },
              ]}
            >
              <SearchIcon size={16} color={palette.ink2} />
              <TextInput
                style={[styles.searchInput, { color: palette.ink }]}
                placeholder="Search country or code (e.g. India, US)..."
                placeholderTextColor={palette.ink2}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
                accessible={true}
                accessibilityLabel="Search country input"
              />
            </View>
          </View>

          {/* Reset option if user previously overrode */}
          {onResetToAutoDetect && (
            <View style={styles.resetContainer}>
              <Pressable
                onPress={handleReset}
                style={[
                  styles.resetBtn,
                  {
                    backgroundColor: palette.surface2,
                    borderColor: palette.line,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset to automatically detected country"
              >
                <Text style={[styles.resetBtnText, { color: palette.ink }]}>
                  Reset to detected country
                </Text>
              </Pressable>
            </View>
          )}

          {/* Country list */}
          <ScrollView
            style={styles.listArea}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {filteredCountries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: palette.ink2 }]}>
                  No matching countries found.
                </Text>
              </View>
            ) : (
              filteredCountries.map((item) => {
                const isSelected =
                  selectedCountryCode?.toUpperCase() === item.isoCode.toUpperCase();
                return (
                  <Pressable
                    key={item.isoCode}
                    onPress={() => handleSelect(item)}
                    style={[
                      styles.countryRow,
                      {
                        borderBottomColor: palette.line,
                        backgroundColor: isSelected
                          ? scheme === 'dark'
                            ? 'rgba(0,229,255,0.08)'
                            : 'rgba(135,169,107,0.12)'
                          : 'transparent',
                      },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${item.name}, code ${item.isoCode}`}
                  >
                    <View style={styles.countryInfo}>
                      <Text
                        style={[
                          styles.countryName,
                          {
                            color: palette.ink,
                            fontFamily: isSelected ? fonts.sansBold : fonts.sansMedium,
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.countryCodeTag, { color: palette.ink2 }]}>
                        {item.isoCode}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: palette.okInk }]}>
                        <CheckmarkIcon size={12} color={palette.surface} />
                      </View>
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: radii.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.tab,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    height: '100%',
  },
  resetContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TARGET,
  },
  resetBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TARGET,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  countryName: {
    fontSize: 15,
  },
  countryCodeTag: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
  },
});
