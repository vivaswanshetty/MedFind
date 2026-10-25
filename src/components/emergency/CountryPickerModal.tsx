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
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { CloseIcon, SearchIcon, CheckmarkIcon } from '../icons/AppIcons';
import { getAllCountries, searchCountries, CountryEmergencyData } from '../../data/emergencyNumbers';

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
  const filteredCountries = useMemo(() => searchCountries(searchQuery), [searchQuery]);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
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
              <View>
                <Text style={[styles.modalTitle, { color: palette.ink }]}>
                  Select Country
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.ink2 }]}>
                  {searchQuery.trim()
                    ? `${filteredCountries.length} matching ${filteredCountries.length === 1 ? 'country' : 'countries'}`
                    : `${allCountries.length} countries available`}
                </Text>
              </View>
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
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  accessible={true}
                  accessibilityLabel="Search country input"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={8}
                    style={styles.clearSearchBtn}
                    accessibilityLabel="Clear search input"
                  >
                    <CloseIcon size={14} color={palette.ink2} />
                  </Pressable>
                )}
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
                  <Text style={[styles.emptyTitle, { color: palette.ink }]}>
                    No matching countries found
                  </Text>
                  <Text style={[styles.emptyText, { color: palette.ink2 }]}>
                    Try searching by country name (e.g. India, United States) or 2-letter code (IN, US).
                  </Text>
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={[
                      styles.clearFilterBtn,
                      { backgroundColor: palette.surface2, borderColor: palette.line },
                    ]}
                  >
                    <Text style={[styles.clearFilterBtnText, { color: palette.ink }]}>
                      View all countries
                    </Text>
                  </Pressable>
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    height: '80%',
    maxHeight: 640,
    minHeight: 400,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 19,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
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
  clearSearchBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
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
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: MIN_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    fontWeight: '600',
  },
});
