import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import { useLocation } from '../../context/LocationContext';
import {
  PREDEFINED_AREAS,
  KnownArea,
  searchPlacesWorldwide,
  PlaceSearchResult,
  getRegionForCoordinates,
} from '../../services/locationService';
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
  onAreaSelected?: () => void;
}

export function AreaPickerModal({ visible, onClose, onAreaSelected }: AreaPickerModalProps) {
  const { scheme, palette } = useTheme();
  const {
    userLocation,
    areaName,
    locationSource,
    isLocating,
    requestGpsLocation,
    selectManualArea,
    clearLocation,
  } = useLocation();

  const [filterText, setFilterText] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const userRegion = getRegionForCoordinates(userLocation);
  const isInBengaluru = userRegion?.id === 'bengaluru';

  // Debounced place search worldwide using expo-location
  useEffect(() => {
    const trimmed = filterText.trim();
    if (trimmed.length < 2) {
      setPlaceResults([]);
      setIsSearchingPlaces(false);
      setSearchError(null);
      return;
    }

    let isCancelled = false;
    setIsSearchingPlaces(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesWorldwide(trimmed, 5);
        if (!isCancelled) {
          setPlaceResults(results);
          if (results.length === 0) {
            setSearchError(`No places found for "${trimmed}". You can select it directly below.`);
          }
        }
      } catch {
        if (!isCancelled) {
          setPlaceResults([]);
          setSearchError(`Place search unavailable. You can select "${trimmed}" directly below.`);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingPlaces(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [filterText]);

  const handleUseGps = async () => {
    const res = await requestGpsLocation();
    if (res.granted) {
      onAreaSelected?.();
      onClose();
    }
  };

  const handleSelectArea = async (area: KnownArea) => {
    await selectManualArea({ ...area, isoCountryCode: 'IN' });
    onAreaSelected?.();
    onClose();
  };

  const handleSelectPlaceResult = async (place: PlaceSearchResult) => {
    await selectManualArea({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      isoCountryCode: place.isoCountryCode,
    });
    setFilterText('');
    onAreaSelected?.();
    onClose();
  };

  const handleCustomAreaSubmit = async () => {
    const trimmed = filterText.trim();
    if (!trimmed) return;
    await selectManualArea({ name: trimmed });
    setFilterText('');
    onAreaSelected?.();
    onClose();
  };

  const handleResetLocation = async () => {
    await clearLocation();
    onClose();
  };

  const matchingPredefined = PREDEFINED_AREAS.filter(
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
      <Pressable
        style={styles.modalBackdrop}
        onPress={onClose}
      >
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
            <View style={styles.titleRow}>
              <View style={[styles.titleIconBadge, { backgroundColor: palette.okTint }]}>
                <MapPinIcon size={18} color={palette.okInk} />
              </View>
              <Text style={[styles.modalTitle, { color: palette.ink }]}>
                Choose Location
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: palette.surface2, minHeight: MIN_TARGET, minWidth: MIN_TARGET }]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close location chooser"
            >
              <CloseIcon size={16} color={palette.ink2} />
            </Pressable>
          </View>

          {/* Quick Action: Device GPS */}
          <Pressable
            onPress={handleUseGps}
            disabled={isLocating}
            style={[
              styles.gpsButton,
              {
                backgroundColor: locationSource === 'gps'
                  ? palette.okTint
                  : palette.surface2,
                borderColor: locationSource === 'gps'
                  ? palette.okLine
                  : palette.line,
              },
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Use current device GPS location"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={palette.okInk} />
            ) : (
              <View style={[styles.gpsIconCircle, { backgroundColor: locationSource === 'gps' ? palette.okInk : palette.line }]}>
                <CrosshairTargetIcon size={16} color={locationSource === 'gps' ? palette.btnInk : palette.ink} />
              </View>
            )}
            <View style={styles.gpsTextCol}>
              <Text style={[styles.gpsButtonTitle, { color: palette.ink }]}>
                Use Current Device Location
              </Text>
              <Text style={[styles.gpsButtonSubtitle, { color: palette.ink2 }]}>
                Calculates real distances without saving coordinates
              </Text>
            </View>
            {locationSource === 'gps' && (
              <View style={[styles.checkCircle, { backgroundColor: palette.okInk }]}>
                <CheckmarkIcon size={12} color={palette.surface} />
              </View>
            )}
          </Pressable>

          {/* Search Input for Worldwide Places */}
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
              placeholder="Search city, neighborhood or place..."
              placeholderTextColor={palette.ink2}
              value={filterText}
              onChangeText={setFilterText}
              onSubmitEditing={handleCustomAreaSubmit}
              returnKeyType="done"
            />
            {isSearchingPlaces && (
              <ActivityIndicator size="small" color={palette.accent} />
            )}
          </View>

          {/* Privacy Notice: OSM Approximate Lookup */}
          <Text style={[styles.osmPrivacyNotice, { color: palette.ink2 }]}>
            Nearby places are looked up with your approximate location using OpenStreetMap servers.
          </Text>

          {/* Predefined or Geocoded Results List */}
          <ScrollView style={styles.areasList} showsVerticalScrollIndicator={false}>
            {filterText.trim().length >= 2 ? (
              <>
                <Text style={[styles.sectionSubtitle, { color: palette.ink2 }]}>
                  Matching Places
                </Text>

                {placeResults.map((item, idx) => {
                  const isSelected = areaName.toLowerCase() === item.name.toLowerCase();
                  return (
                    <Pressable
                      key={`${item.name}-${idx}`}
                      onPress={() => handleSelectPlaceResult(item)}
                      style={[
                        styles.areaRow,
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
                    >
                      <View style={styles.areaRowLeft}>
                        <View style={styles.areaTitleRow}>
                          <MapPinIcon size={14} color="#FF4757" />
                          <Text
                            style={[
                              styles.areaNameText,
                              {
                                color: palette.ink,
                                fontFamily: isSelected ? fonts.sansBold : fonts.sansMedium,
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: palette.okInk }]}>
                          <CheckmarkIcon size={12} color={palette.surface} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}

                {searchError && (
                  <Text style={[styles.searchErrorText, { color: palette.ink2 }]}>
                    {searchError}
                  </Text>
                )}

                <Pressable
                  onPress={handleCustomAreaSubmit}
                  style={[
                    styles.customSubmitBtn,
                    {
                      backgroundColor: palette.surface2,
                      borderColor: palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.customSubmitText, { color: palette.ink }]}>
                    Select "{filterText.trim()}"
                  </Text>
                </Pressable>
              </>
            ) : isInBengaluru ? (
              <>
                <Text style={[styles.sectionSubtitle, { color: palette.ink2 }]}>
                  Bengaluru Quick Suggestions
                </Text>

                {matchingPredefined.map((item) => {
                  const isSelected = areaName.toLowerCase().includes(item.locality.toLowerCase());
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectArea(item)}
                      style={[
                        styles.areaRow,
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
                    >
                      <View style={styles.areaRowLeft}>
                        <View style={styles.areaTitleRow}>
                          <MapPinIcon size={14} color="#FF4757" />
                          <Text
                            style={[
                              styles.areaNameText,
                              {
                                color: palette.ink,
                                fontFamily: isSelected ? fonts.sansBold : fonts.sansMedium,
                              },
                            ]}
                          >
                            {item.name}
                          </Text>
                        </View>
                        <Text style={[styles.areaPincodeText, { color: palette.ink2 }]}>
                          Pincode: {item.pincode}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: palette.okInk }]}>
                          <CheckmarkIcon size={12} color={palette.surface} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyPromptBox}>
                <MapPinIcon size={24} color={palette.ink2} />
                <Text style={[styles.emptyPromptTitle, { color: palette.ink }]}>
                  Worldwide Place Search
                </Text>
                <Text style={[styles.emptyPromptSub, { color: palette.ink2 }]}>
                  Type any city, town, or neighborhood above to set your location area.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Reset / Clear Location */}
          <Pressable
            onPress={handleResetLocation}
            style={styles.resetButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear location filter"
          >
            <Text style={[styles.resetButtonText, { color: palette.ink2 }]}>
              Clear location
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '84%',
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radii.chip,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
    minHeight: MIN_TARGET,
  },
  gpsIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTextCol: {
    flex: 1,
    gap: 2,
  },
  gpsButtonTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  gpsButtonSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 46,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  sectionSubtitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  areasList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    minHeight: MIN_TARGET,
  },
  areaRowLeft: {
    gap: 3,
  },
  areaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  areaNameText: {
    fontSize: 14,
  },
  areaPincodeText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  customSubmitBtn: {
    padding: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
    minHeight: MIN_TARGET,
    justifyContent: 'center',
  },
  customSubmitText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: MIN_TARGET,
  },
  resetButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  searchErrorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    paddingVertical: 8,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  emptyPromptBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyPromptTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  emptyPromptSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  osmPrivacyNotice: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 6,
    paddingHorizontal: 4,
  },
});
