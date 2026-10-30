import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import {
  Coordinates,
  cleanLocalityName,
  searchPlacesWorldwide,
  PlaceSearchResult,
} from '../../services/locationService';
import { isCoordinatesInIndia } from '../../data/emergencyNumbers';
import {
  MapPinIcon,
  CrosshairTargetIcon,
  CloseIcon,
  CheckmarkIcon,
  SearchIcon,
} from '../icons/AppIcons';

export interface PinpointResult {
  latitude: number;
  longitude: number;
  address: string;
  isoCountryCode?: string;
}

interface LiveLocationPinpointMapProps {
  visible: boolean;
  initialCoords: Coordinates | null;
  initialAddress?: string;
  onConfirm: (result: PinpointResult) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function LiveLocationPinpointMap({
  visible,
  initialCoords,
  initialAddress,
  onConfirm,
  onClose,
  title,
  subtitle,
}: LiveLocationPinpointMapProps) {
  const { scheme, palette } = useTheme();
  const { t } = useLanguage();

  // Fallback to Bengaluru Basavanagudi centroid if initial coords are absent
  const baseLat = initialCoords?.latitude ?? 12.9416;
  const baseLng = initialCoords?.longitude ?? 77.5738;

  const [currentLat, setCurrentLat] = useState<number>(baseLat);
  const [currentLng, setCurrentLng] = useState<number>(baseLng);
  const [resolvedAddress, setResolvedAddress] = useState<string>(
    initialAddress || 'Bengaluru, Karnataka'
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesWorldwide(trimmed, 5);
        if (!isCancelled) {
          setSearchResults(results);
        }
      } catch {
        if (!isCancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    setCurrentLat(place.latitude);
    setCurrentLng(place.longitude);
    setResolvedAddress(place.name);
    setSearchQuery('');
    setSearchResults([]);
    sendMessage({
      type: 'setPinLocation',
      lat: place.latitude,
      lng: place.longitude,
      shouldFly: true,
    });
  };

  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<WebView>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (visible && initialCoords) {
      setCurrentLat(initialCoords.latitude);
      setCurrentLng(initialCoords.longitude);
      if (initialAddress) {
        setResolvedAddress(initialAddress);
      } else {
        reverseGeocodeCoords(initialCoords.latitude, initialCoords.longitude);
      }
      // Notify map of coordinates
      sendMessage({
        type: 'setPinLocation',
        lat: initialCoords.latitude,
        lng: initialCoords.longitude,
        shouldFly: true,
      });
    }
  }, [visible, initialCoords, initialAddress]);

  // Reverse geocode via OpenStreetMap Nominatim with fallback
  const reverseGeocodeCoords = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedFind-App/1.0 (https://github.com/vivaswanshetty/MedFind; medical-app)',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || '';
        const city = addr.city || addr.town || addr.county || 'Bengaluru';
        const parts = [road, neighborhood, city].filter(Boolean);
        const text = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',') || 'Current location';
        setResolvedAddress(text);
      }
    } catch {
      // Fallback: keep previous or simple coord text
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Cross-platform message dispatcher to map
  const sendMessage = useCallback((msg: any) => {
    if (Platform.OS === 'web') {
      try {
        iframeRef.current?.contentWindow?.postMessage(msg, '*');
      } catch {
        // Best effort
      }
    } else {
      const jsonStr = JSON.stringify(msg);
      webViewRef.current?.postMessage(jsonStr);
      webViewRef.current?.injectJavaScript(`
        if (window.handleAppMessage) {
          window.handleAppMessage(${jsonStr});
        }
        true;
      `);
    }
  }, []);

  // Web message listener for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'pinpointChanged') {
          const lat = parseFloat(data.lat);
          const lng = parseFloat(data.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setCurrentLat(lat);
            setCurrentLng(lng);
            reverseGeocodeCoords(lat, lng);
          }
        } else if (data?.type === 'mapReady') {
          if (initialCoords) {
            sendMessage({
              type: 'setPinLocation',
              lat: initialCoords.latitude,
              lng: initialCoords.longitude,
              shouldFly: false,
            });
          }
        }
      } catch {
        // Ignore non-map messages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [visible, reverseGeocodeCoords, initialCoords, sendMessage]);

  // Recenter pin to hardware GPS position
  const handleRecenterToGps = () => {
    const lat = initialCoords?.latitude ?? baseLat;
    const lng = initialCoords?.longitude ?? baseLng;
    setCurrentLat(lat);
    setCurrentLng(lng);
    sendMessage({
      type: 'setPinLocation',
      lat,
      lng,
      shouldFly: true,
    });
    reverseGeocodeCoords(lat, lng);
  };

  const handleZoomIn = () => {
    sendMessage({ type: 'zoomIn' });
  };

  const handleZoomOut = () => {
    sendMessage({ type: 'zoomOut' });
  };

  const handleConfirm = () => {
    const isIndia = isCoordinatesInIndia({ latitude: currentLat, longitude: currentLng });
    onConfirm({
      latitude: currentLat,
      longitude: currentLng,
      address: resolvedAddress,
      isoCountryCode: isIndia ? 'IN' : undefined,
    });
    onClose();
  };

  // Memoize HTML content based solely on scheme so iframe NEVER reloads on drag/tap
  const htmlContent = useMemo(() => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body, #map { width: 100%; height: 100%; background: ${scheme === 'light' ? '#F7F2E8' : '#0a0a0f'}; overflow: hidden; touch-action: pan-x pan-y pinch-zoom; }

          ${scheme === 'dark' ? `
            .leaflet-tile-pane {
              filter: brightness(0.7) invert(1) contrast(2.6) hue-rotate(200deg) saturate(0.35) brightness(0.8);
            }
          ` : ''}

          /* Pinpoint Draggable Marker */
          .pinpoint-marker {
            position: relative;
            width: 44px;
            height: 44px;
            cursor: grab;
          }
          .pinpoint-marker:active {
            cursor: grabbing;
          }
          .pinpoint-pin {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #EF4444, #B91C1C);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            border: 2.5px solid #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pinpoint-dot {
            width: 12px;
            height: 12px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          }
          .pinpoint-pulse {
            position: absolute;
            bottom: -6px;
            left: 5px;
            width: 30px;
            height: 12px;
            border-radius: 50%;
            background: rgba(0,0,0,0.25);
            filter: blur(2px);
          }

          /* Hardware GPS Beacon Circle */
          .gps-beacon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.35);
            border: 2px solid #10B981;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .gps-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10B981;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function postToApp(payload) {
            var dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(dataStr);
            } else if (window.parent && window.parent !== window) {
              window.parent.postMessage(dataStr, '*');
            }
          }

          var startLat = ${baseLat};
          var startLng = ${baseLng};

          var map = L.map('map', {
            center: [startLat, startLng],
            zoom: 16.5,
            zoomControl: false,
            attributionControl: false,
          });

          // OpenStreetMap Primary Tile Layer (100% free, NO API KEY, NO WATERMARK)
          var primaryTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
          var tileLayer = L.tileLayer(primaryTiles, {
            maxZoom: 19,
            crossOrigin: true,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Automatic Fallback on tile error to ESRI World Street Map (high reliability, no key, no watermark)
          tileLayer.on('tileerror', function(error, tile) {
            var z = error.coords.z;
            var x = error.coords.x;
            var y = error.coords.y;
            tile.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/' + z + '/' + y + '/' + x;
          });

          // Original GPS accuracy ring & beacon
          var gpsIcon = L.divIcon({
            className: '',
            html: '<div class="gps-beacon"><div class="gps-dot"></div></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          var gpsMarker = L.marker([startLat, startLng], { icon: gpsIcon, interactive: false }).addTo(map);

          // Main draggable pinpoint marker
          var pinIcon = L.divIcon({
            className: '',
            html: '<div class="pinpoint-marker"><div class="pinpoint-pulse"></div><div class="pinpoint-pin"><div class="pinpoint-dot"></div></div></div>',
            iconSize: [44, 44],
            iconAnchor: [20, 42]
          });

          var pinMarker = L.marker([startLat, startLng], {
            icon: pinIcon,
            draggable: true,
            zIndexOffset: 1000
          }).addTo(map);

          function notifyPosition(lat, lng) {
            postToApp({ type: 'pinpointChanged', lat: lat, lng: lng });
          }

          // Drag event: notify app when drag completes
          pinMarker.on('dragend', function(e) {
            var pos = pinMarker.getLatLng();
            notifyPosition(pos.lat, pos.lng);
          });

          // Map tap/click event: instantly jump pin to tapped coordinate
          map.on('click', function(e) {
            pinMarker.setLatLng(e.latlng);
            notifyPosition(e.latlng.lat, e.latlng.lng);
          });

          function setPinLocation(lat, lng, shouldFly) {
            if (typeof lat !== 'number' || typeof lng !== 'number') return;
            pinMarker.setLatLng([lat, lng]);
            if (shouldFly) {
              map.flyTo([lat, lng], 17, { animate: true, duration: 0.5 });
            }
          }
          window.setPinLocation = setPinLocation;

          function handleAppMessage(data) {
            if (!data || !data.type) return;
            switch(data.type) {
              case 'setPinLocation':
                setPinLocation(data.lat, data.lng, data.shouldFly);
                break;
              case 'zoomIn':
                map.zoomIn();
                break;
              case 'zoomOut':
                map.zoomOut();
                break;
            }
          }
          window.handleAppMessage = handleAppMessage;

          window.addEventListener('message', function(event) {
            var data = event.data;
            if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) { return; }
            }
            handleAppMessage(data);
          });

          // Notify parent that map is ready
          postToApp({ type: 'mapReady' });
        </script>
      </body>
    </html>
    `;
  }, [scheme, baseLat, baseLng]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          {/* TOP BAR */}
          <View style={[styles.modalHeader, { borderBottomColor: palette.line }]}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: palette.surface2 }]}>
                <MapPinIcon size={18} color={palette.accent} />
              </View>
              <View style={styles.headerTitleCol}>
                <Text style={[styles.modalTitle, { color: palette.ink, fontFamily: fonts.sansBold }]}>
                  {title || t('pinpoint_location_title', 'Pinpoint Live Location')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.ink2, fontFamily: fonts.sans }]}>
                  {subtitle || t('pinpoint_location_sub', 'Tap map or drag pin to adjust your exact spot')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close map"
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: palette.surface2, opacity: pressed ? 0.8 : 1.0 },
              ]}
            >
              <CloseIcon size={18} color={palette.ink} />
            </Pressable>
          </View>

          {/* SEARCH BAR OVERLAY */}
          <View style={[styles.searchBoxWrapper, { backgroundColor: palette.surface, borderBottomColor: palette.line }]}>
            <View style={[styles.searchBarBox, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
              <SearchIcon size={15} color={palette.accent} />
              <TextInput
                style={[styles.searchInputField, { color: palette.ink, fontFamily: fonts.sans }]}
                placeholder="Search college, area, or landmark (e.g. BMS College)..."
                placeholderTextColor={palette.ink2}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={palette.accent} style={{ marginLeft: 6 }} />
              )}
              {searchQuery.length > 0 && !isSearching && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  hitSlop={8}
                >
                  <Text style={{ color: palette.ink2, fontSize: 13, fontWeight: '700' }}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <View style={[styles.suggestionsDropdown, { backgroundColor: palette.surface, borderColor: palette.line }]}>
                {searchResults.map((place, idx) => (
                  <Pressable
                    key={`${place.name}-${idx}`}
                    onPress={() => handleSelectSearchResult(place)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      {
                        borderBottomColor: palette.line,
                        backgroundColor: pressed ? palette.surface2 : 'transparent',
                      },
                    ]}
                  >
                    <MapPinIcon size={14} color="#EF4444" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.suggestionTitleText, { color: palette.ink, fontFamily: fonts.sansBold }]} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={[styles.suggestionSubText, { color: palette.ink2, fontFamily: fonts.sans }]} numberOfLines={1}>
                        {place.locality}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* MAP CANVAS */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: scheme === 'light' ? '#F7F2E8' : '#0a0a0f',
                }}
                title="Pinpoint OpenStreetMap"
              />
            ) : (
              <WebView
                ref={webViewRef as any}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webView}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={(event: any) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data?.type === 'pinpointChanged') {
                      const lat = parseFloat(data.lat);
                      const lng = parseFloat(data.lng);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setCurrentLat(lat);
                        setCurrentLng(lng);
                        reverseGeocodeCoords(lat, lng);
                      }
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }}
              />
            )}

            {/* FLOATING MAP CONTROLS */}
            <View style={styles.floatingControls} pointerEvents="box-none">
              <Pressable
                onPress={handleRecenterToGps}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Re-center to GPS"
                style={({ pressed }) => [
                  styles.controlButton,
                  { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1.0 },
                ]}
              >
                <CrosshairTargetIcon size={18} color={palette.accent} />
              </Pressable>

              <Pressable
                onPress={handleZoomIn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Zoom in"
                style={({ pressed }) => [
                  styles.controlButton,
                  { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1.0 },
                ]}
              >
                <Text style={[styles.zoomText, { color: palette.ink, fontFamily: fonts.sansBold }]}>+</Text>
              </Pressable>

              <Pressable
                onPress={handleZoomOut}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Zoom out"
                style={({ pressed }) => [
                  styles.controlButton,
                  { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1.0 },
                ]}
              >
                <Text style={[styles.zoomText, { color: palette.ink, fontFamily: fonts.sansBold }]}>−</Text>
              </Pressable>
            </View>

            {/* OPENSTREETMAP ATTRIBUTION BADGE */}
            <View style={[styles.attributionBadge, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={[styles.attributionText, { color: palette.ink2, fontFamily: fonts.sans }]}>
                © OpenStreetMap
              </Text>
            </View>
          </View>

          {/* BOTTOM ADDRESS & ACTION FOOTER */}
          <View style={[styles.modalFooter, { borderTopColor: palette.line }]}>
            <View style={styles.addressInfoRow}>
              <View style={[styles.pinIconPill, { backgroundColor: palette.surface2 }]}>
                <MapPinIcon size={16} color={palette.accent} />
              </View>
              <View style={styles.addressTextGroup}>
                <View style={styles.coordsBadgeRow}>
                  <Text style={[styles.coordsText, { color: palette.accent, fontFamily: fonts.sansMedium }]}>
                    {currentLat.toFixed(5)}° N, {currentLng.toFixed(5)}° E
                  </Text>
                  {isReverseGeocoding && (
                    <ActivityIndicator size="small" color={palette.accent} style={{ marginLeft: 6 }} />
                  )}
                </View>
                <Text style={[styles.resolvedAddressText, { color: palette.ink, fontFamily: fonts.sansSemi }]} numberOfLines={1}>
                  {resolvedAddress}
                </Text>
              </View>
            </View>

            <View style={styles.footerButtonsRow}>
              <Pressable
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => [
                  styles.cancelButton,
                  { backgroundColor: palette.surface2, borderColor: palette.line, opacity: pressed ? 0.8 : 1.0 },
                ]}
              >
                <Text style={[styles.cancelButtonText, { color: palette.ink, fontFamily: fonts.sansSemi }]}>
                  {t('cancel', 'Cancel')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Confirm and set this location"
                style={({ pressed }) => [
                  styles.confirmButton,
                  { backgroundColor: palette.accent, opacity: pressed ? 0.88 : 1.0 },
                ]}
              >
                <CheckmarkIcon size={16} color="#FFFFFF" />
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF', fontFamily: fonts.sansBold }]}>
                  {t('confirm_location', 'Confirm Location')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    height: 540,
    borderRadius: radii.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.chip,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: radii.chip,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomText: {
    fontSize: 18,
    lineHeight: 22,
  },
  attributionBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    opacity: 0.85,
  },
  attributionText: {
    fontSize: 10,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
  },
  addressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pinIconPill: {
    width: 32,
    height: 32,
    borderRadius: radii.chip,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addressTextGroup: {
    flex: 1,
  },
  coordsBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  resolvedAddressText: {
    fontSize: 14,
    marginTop: 2,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: MIN_TARGET,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
  },
  confirmButton: {
    flex: 2,
    height: MIN_TARGET,
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
  },
  searchBoxWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    zIndex: 20,
    position: 'relative',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: radii.chip,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 48,
    left: 14,
    right: 14,
    borderRadius: radii.card,
    borderWidth: 1,
    maxHeight: 180,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionTitleText: {
    fontSize: 13,
  },
  suggestionSubText: {
    fontSize: 11,
    marginTop: 1,
  },
});
