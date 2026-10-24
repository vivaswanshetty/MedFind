import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, radii } from '../../constants/theme';
import {
  CrosshairTargetIcon,
  DirectionsIcon,
  ExpandIcon,
  CompressIcon,
  FitBoundsIcon,
} from '../icons/AppIcons';
import { Coordinates, isWithinCoverageArea } from '../../services/locationService';
import { LocationSource } from '../../context/LocationContext';

export interface MapMarkerItem {
  id: string;
  type: 'hospital' | 'clinic' | 'ambulance' | 'pharmacy';
  name: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  distanceKm?: number;
}

interface InteractiveCareMapProps {
  userLocation: Coordinates | null;
  areaName: string;
  locationSource?: LocationSource;
  markers: MapMarkerItem[];
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
  onOpenExternalMap: () => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  onRequestLocation?: () => void;
  onPressArea?: () => void;
}

export function InteractiveCareMap({
  userLocation,
  areaName,
  locationSource,
  markers,
  selectedPin,
  onSelectPin,
  onOpenExternalMap,
  onInteractionChange,
  onRequestLocation,
  onPressArea,
}: InteractiveCareMapProps) {
  const { scheme, palette } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const inCoverage = isWithinCoverageArea(userLocation);
  const isOutsideCoverage = userLocation !== null && !inCoverage;
  const defaultLat = inCoverage && userLocation ? userLocation.latitude : 12.9416; // Basavanagudi centroid fallback
  const defaultLng = inCoverage && userLocation ? userLocation.longitude : 77.5738;

  // Sync selected pin from parent to WebView map
  useEffect(() => {
    if (!selectedPin || !webViewRef.current) return;
    const target = markers.find((m) => m.id === selectedPin);
    if (target) {
      const script = `
        if (window.focusMarker) {
          window.focusMarker('${target.id}', ${target.latitude}, ${target.longitude});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [selectedPin, markers]);

  // Dynamically update user location beacon & accuracy ring when GPS arrives
  useEffect(() => {
    if (!webViewRef.current || !userLocation) return;
    const script = `
      if (window.updateUserLocation) {
        window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, [userLocation]);

  // Dynamically update markers without re-rendering WebView
  useEffect(() => {
    if (!webViewRef.current) return;
    const markersJson = JSON.stringify(markers);
    const script = `
      if (window.updateMarkers) {
        window.updateMarkers(${markersJson});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, [markers]);

  // Invalidate map size when expanded / collapsed
  useEffect(() => {
    if (!webViewRef.current) return;
    const script = `
      if (window.map) {
        setTimeout(function() {
          window.map.invalidateSize({ animate: true });
        }, 150);
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, [isExpanded]);

  const handleRecenter = () => {
    onRequestLocation?.();
    if (!webViewRef.current) return;
    const targetLat = userLocation?.latitude ?? defaultLat;
    const targetLng = userLocation?.longitude ?? defaultLng;
    const script = `
      if (window.recenterMap) {
        window.recenterMap(${targetLat}, ${targetLng});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  };

  const handleFitAll = () => {
    if (!webViewRef.current) return;
    webViewRef.current.injectJavaScript('if(window.fitAllMarkers){window.fitAllMarkers();}true;');
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('if(window.map){window.map.zoomIn();}true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('if(window.map){window.map.zoomOut();}true;');
  };

  // OpenStreetMap standard tile layer: 100% free, zero API key requirement, fully detailed with roads & places
  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const markerDataJson = JSON.stringify(markers);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          html, body, #map { width: 100%; height: 100%; background: ${scheme === 'light' ? '#F7F2E8' : '#0a0a0f'}; overflow: hidden; touch-action: pan-x pan-y pinch-zoom; }
          
          /* Dark mode CSS filter for OpenStreetMap tiles: turns high-detail street tiles into sleek night mode */
          ${scheme === 'dark' ? `
            .leaflet-tile-pane {
              filter: brightness(0.7) invert(1) contrast(2.6) hue-rotate(200deg) saturate(0.35) brightness(0.8);
            }
          ` : ''}

          /* Custom Marker Pins */
          .med-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 12px;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 800;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 2px solid #FFFFFF;
            transition: transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
          }
          .med-pin:active, .med-pin.active {
            transform: scale(1.24);
            border-color: ${scheme === 'light' ? '#2E4A1D' : '#00E5FF'};
            box-shadow: 0 0 16px ${scheme === 'light' ? 'rgba(46,74,29,0.55)' : 'rgba(0,229,255,0.75)'};
          }
          .pin-hospital { background: linear-gradient(135deg, #10B981, #047857); }
          .pin-clinic { background: linear-gradient(135deg, #3B82F6, #1D4ED8); }
          .pin-ambulance { background: linear-gradient(135deg, #F59E0B, #D97706); }
          .pin-pharmacy { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }

          /* User Location Pulsing Beacon */
          .user-beacon {
            position: relative;
            width: 32px;
            height: 32px;
          }
          .user-pulse {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: ${scheme === 'light' ? 'rgba(135,169,107,0.55)' : 'rgba(0,229,255,0.45)'};
            animation: pulse 2s infinite ease-out;
          }
          .user-dot {
            position: absolute;
            top: 8px;
            left: 8px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${scheme === 'light' ? '#5A3E2B' : '#00E5FF'};
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          }
          @keyframes pulse {
            0% { transform: scale(0.6); opacity: 1; }
            100% { transform: scale(1.9); opacity: 0; }
          }
          
          /* Leaflet Popup Tooltip */
          .leaflet-popup-content-wrapper {
            background: ${scheme === 'light' ? '#FFFCF5' : '#121216'};
            color: ${scheme === 'light' ? '#5A3E2B' : '#F4F2FA'};
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
            border: 1px solid ${scheme === 'light' ? '#E1D6C1' : '#2B2A36'};
            padding: 2px;
          }
          .leaflet-popup-content {
            margin: 8px 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.35;
          }
          .leaflet-popup-tip {
            background: ${scheme === 'light' ? '#FFFCF5' : '#121216'};
            border: 1px solid ${scheme === 'light' ? '#E1D6C1' : '#2B2A36'};
          }
          
          /* Hide Default Leaflet Controls */
          .leaflet-control-zoom, .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            center: [${defaultLat}, ${defaultLng}],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            tap: true,
            tapTolerance: 20,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
            bounceAtZoomLimits: false,
          });
          window.map = map;

          L.tileLayer('${tileUrl}', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // User Location Beacon Definition
          const userIcon = L.divIcon({
            className: '',
            html: '<div class="user-beacon"><div class="user-pulse"></div><div class="user-dot"></div></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          // User Accuracy Ring (65m precision circle) - only placed if coordinates exist
          let userAccuracyCircle = ${userLocation ? `L.circle([${userLocation.latitude}, ${userLocation.longitude}], {
            radius: 65,
            color: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
            fillColor: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
            fillOpacity: 0.14,
            weight: 1.5,
            dashArray: '3, 4'
          }).addTo(map)` : `null`};

          let userMarker = ${userLocation ? `L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon, zIndexOffset: 250 }).addTo(map)` : `null`};

          // Marker Management
          let markerObjects = {};

          function renderMarkers(list) {
            Object.keys(markerObjects).forEach(id => {
              map.removeLayer(markerObjects[id]);
              delete markerObjects[id];
            });

            list.forEach(m => {
              const letter = m.type === 'hospital' ? 'H' : m.type === 'clinic' ? 'C' : m.type === 'ambulance' ? 'A' : 'P';
              const pinClass = 'pin-' + m.type;

              const icon = L.divIcon({
                className: '',
                html: '<div id="pin-' + m.id + '" class="med-pin ' + pinClass + '"><span>' + letter + '</span></div>',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
              });

              const marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(map);
              markerObjects[m.id] = marker;

              const safeName = (m.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              const safeSub = (m.subtitle || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              marker.bindPopup(
                '<div style="font-weight:700;font-size:13px;letter-spacing:-0.2px;">' + safeName + '</div>' +
                (safeSub ? '<div style="font-size:11px;opacity:0.75;margin-top:2px;">' + safeSub + '</div>' : ''),
                { closeButton: false, offset: [0, -12] }
              );

              marker.on('click', () => {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectPin', id: m.id }));
                }
                window.focusMarker(m.id, m.latitude, m.longitude);
              });
            });
          }

          // Initial Render
          renderMarkers(${markerDataJson});

          window.updateMarkers = function(newList) {
            renderMarkers(newList);
          };

          window.updateUserLocation = function(lat, lng) {
            if (!userMarker) {
              userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 250 }).addTo(map);
            } else {
              userMarker.setLatLng([lat, lng]);
            }
            if (!userAccuracyCircle) {
              userAccuracyCircle = L.circle([lat, lng], {
                radius: 65,
                color: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
                fillColor: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: '3, 4'
              }).addTo(map);
            } else {
              userAccuracyCircle.setLatLng([lat, lng]);
            }
            map.flyTo([lat, lng], 15.5, { animate: true, duration: 0.8 });
          };

          window.focusMarker = function(id, lat, lng) {
            document.querySelectorAll('.med-pin').forEach(el => el.classList.remove('active'));
            const el = document.getElementById('pin-' + id);
            if (el) el.classList.add('active');
            if (markerObjects[id]) {
              markerObjects[id].openPopup();
            }
            map.flyTo([lat, lng], 16, { animate: true, duration: 0.7 });
          };

          window.recenterMap = function(lat, lng) {
            document.querySelectorAll('.med-pin').forEach(el => el.classList.remove('active'));
            map.closePopup();
            if (lat && lng) {
              if (!userMarker) {
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 250 }).addTo(map);
              } else {
                userMarker.setLatLng([lat, lng]);
              }
              if (!userAccuracyCircle) {
                userAccuracyCircle = L.circle([lat, lng], {
                  radius: 65,
                  color: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
                  fillColor: '${scheme === 'light' ? '#87A96B' : '#00E5FF'}',
                  fillOpacity: 0.14,
                  weight: 1.5,
                  dashArray: '3, 4'
                }).addTo(map);
              } else {
                userAccuracyCircle.setLatLng([lat, lng]);
              }
              map.flyTo([lat, lng], 15.5, { animate: true, duration: 0.7 });
            }
          };

          window.fitAllMarkers = function() {
            const allLayers = Object.values(markerObjects);
            if (userMarker) allLayers.push(userMarker);
            if (allLayers.length > 0) {
              const group = new L.featureGroup(allLayers);
              map.fitBounds(group.getBounds().pad(0.18), { animate: true, duration: 0.8 });
            }
          };

          // Inform React Native when map gesture starts or ends
          map.on('movestart dragstart zoomstart', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchStart' }));
            }
          });
          map.on('moveend dragend zoomend', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchEnd' }));
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View
      style={[
        styles.mapCard,
        {
          height: isExpanded ? 390 : 255,
          backgroundColor: palette.surface,
          borderColor: palette.line,
          shadowColor: palette.shadow,
        },
      ]}
      onTouchStart={() => {
        onInteractionChange?.(true);
        if (showHint) setShowHint(false);
      }}
      onTouchEnd={() => {
        onInteractionChange?.(false);
      }}
      onTouchCancel={() => {
        onInteractionChange?.(false);
      }}
    >
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
            if (data.type === 'selectPin') {
              onSelectPin(data.id);
            } else if (data.type === 'touchStart') {
              onInteractionChange?.(true);
            } else if (data.type === 'touchEnd') {
              onInteractionChange?.(false);
            }
          } catch {
            // Ignore parse errors
          }
        }}
        renderLoading={() => (
          <View style={[styles.loadingBox, { backgroundColor: palette.surface }]}>
            <ActivityIndicator size="small" color={palette.accent} />
          </View>
        )}
        onLoadEnd={() => {
          if (userLocation && webViewRef.current) {
            const script = `
              if (window.updateUserLocation) {
                window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
              }
              true;
            `;
            webViewRef.current.injectJavaScript(script);
          }
        }}
      />

      {/* Overlaid Top Header Bar with responsive layout */}
      <View style={styles.topHeaderBar} pointerEvents="box-none">
        {/* User Location Pill */}
        <Pressable
          onPress={onPressArea}
          disabled={!onPressArea}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            locationSource === 'none' || isOutsideCoverage
              ? 'No area set. Tap to set your area'
              : `Current location ${areaName}. Tap to change area.`
          }
          style={({ pressed }) => [
            styles.userLocationPill,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed && onPressArea ? 0.85 : 1.0,
            },
          ]}
        >
          <View
            style={[
              styles.locationDot,
              {
                backgroundColor:
                  locationSource === 'none' || isOutsideCoverage ? palette.ink2 : palette.accent,
              },
            ]}
          />
          <Text style={[styles.userLocationText, { color: palette.ink }]} numberOfLines={1}>
            {locationSource === 'none' || isOutsideCoverage ? 'Set your area' : areaName.split(',')[0]}
          </Text>
        </Pressable>

        {/* 2 Top Right Action Buttons: Expand/Contract + Google Maps */}
        <View style={styles.topRightControls}>
          {/* Button 1: Expand/Collapse Viewport Button */}
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Collapse map view' : 'Expand map view'}
            style={({ pressed }) => [
              styles.mapActionIconBtn,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            {isExpanded ? (
              <CompressIcon size={16} color={palette.ink} />
            ) : (
              <ExpandIcon size={16} color={palette.ink} />
            )}
          </Pressable>

          {/* Button 2: Google Maps Navigation Button */}
          <Pressable
            onPress={onOpenExternalMap}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open in Google Maps application"
            style={({ pressed }) => [
              styles.openMapsBtn,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                opacity: pressed ? 0.8 : 1.0,
              },
            ]}
          >
            <DirectionsIcon size={14} color={palette.ink} />
            <Text style={[styles.openMapsText, { color: palette.ink }]}>
              Google Maps
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Gesture Hint Overlay Badge (Auto-fades on interaction) */}
      {showHint && (
        <View
          style={[
            styles.gestureHintPill,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.gestureHintText, { color: palette.ink2 }]}>
            ✌️ Pinch to zoom • Drag to explore
          </Text>
        </View>
      )}

      {/* Floating Bottom Right Controls (Fit All, Recenter, Zoom In, Zoom Out) */}
      <View style={styles.floatingControlsGroup}>
        {/* Fit All Markers in View */}
        <Pressable
          onPress={handleFitAll}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Frame all nearby facilities on map"
          style={({ pressed }) => [
            styles.floatingControlBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <FitBoundsIcon size={16} color={palette.ink} />
        </Pressable>

        {/* Recenter to User's GPS Pin */}
        <Pressable
          onPress={handleRecenter}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Recenter map to my location"
          style={({ pressed }) => [
            styles.floatingControlBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <CrosshairTargetIcon size={16} color={palette.ink} />
        </Pressable>

        {/* Zoom In & Out Combined Dock */}
        <View
          style={[
            styles.zoomButtonGroup,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Pressable
            onPress={handleZoomIn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Zoom map in"
            style={({ pressed }) => [
              styles.zoomSubBtn,
              { opacity: pressed ? 0.7 : 1.0 },
            ]}
          >
            <Text style={[styles.zoomText, { color: palette.ink }]}>+</Text>
          </Pressable>
          <View style={[styles.zoomDivider, { backgroundColor: palette.line }]} />
          <Pressable
            onPress={handleZoomOut}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Zoom map out"
            style={({ pressed }) => [
              styles.zoomSubBtn,
              { opacity: pressed ? 0.7 : 1.0 },
            ]}
          >
            <Text style={[styles.zoomText, { color: palette.ink }]}>−</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  userLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 160,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userLocationText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapActionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  openMapsText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
  },
  gestureHintPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    opacity: 0.9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 9,
  },
  gestureHintText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
  floatingControlsGroup: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  floatingControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  zoomButtonGroup: {
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  zoomSubBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 18,
  },
  zoomDivider: {
    width: '100%',
    height: 1,
  },
});
