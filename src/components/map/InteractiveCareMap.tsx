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
import { fonts, radii, MIN_TARGET } from '../../constants/theme';
import {
  CrosshairTargetIcon,
  DirectionsIcon,
} from '../icons/AppIcons';
import { Coordinates } from '../../services/locationService';

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
  markers: MapMarkerItem[];
  selectedPin: string | null;
  onSelectPin: (id: string) => void;
  onOpenExternalMap: () => void;
}

export function InteractiveCareMap({
  userLocation,
  areaName,
  markers,
  selectedPin,
  onSelectPin,
  onOpenExternalMap,
}: InteractiveCareMapProps) {
  const { scheme, palette } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultLat = userLocation?.latitude ?? 12.9416; // Basavanagudi
  const defaultLng = userLocation?.longitude ?? 77.5738;

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

  const handleRecenter = () => {
    if (!webViewRef.current) return;
    const script = `
      if (window.recenterMap) {
        window.recenterMap(${defaultLat}, ${defaultLng});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('if(window.map){window.map.zoomIn();}true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('if(window.map){window.map.zoomOut();}true;');
  };

  // CartoDB tiles: Voyager for warm editorial light, Dark Matter for cinematic dark
  const tileUrl =
    scheme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

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
          html, body, #map { width: 100%; height: 100%; background: ${scheme === 'light' ? '#F7F2E8' : '#050505'}; overflow: hidden; }
          
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.32);
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
            background: ${scheme === 'light' ? 'rgba(135,169,107,0.45)' : 'rgba(0,229,255,0.35)'};
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
          
          /* Popup Callout Styling */
          .leaflet-popup-content-wrapper {
            background: ${scheme === 'light' ? '#FFFCF5' : '#121216'};
            color: ${scheme === 'light' ? '#5A3E2B' : '#F4F2FA'};
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.22);
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
            zoom: 14,
            zoomControl: false,
            attributionControl: false
          });
          window.map = map;

          L.tileLayer('${tileUrl}', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          // User Location Marker
          const userIcon = L.divIcon({
            className: '',
            html: '<div class="user-beacon"><div class="user-pulse"></div><div class="user-dot"></div></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          L.marker([${defaultLat}, ${defaultLng}], { icon: userIcon, zIndexOffset: 200 }).addTo(map);

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

          window.focusMarker = function(id, lat, lng) {
            document.querySelectorAll('.med-pin').forEach(el => el.classList.remove('active'));
            const el = document.getElementById('pin-' + id);
            if (el) el.classList.add('active');
            if (markerObjects[id]) {
              markerObjects[id].openPopup();
            }
            map.flyTo([lat, lng], 15, { animate: true, duration: 0.7 });
          };

          window.recenterMap = function(lat, lng) {
            document.querySelectorAll('.med-pin').forEach(el => el.classList.remove('active'));
            map.closePopup();
            map.flyTo([lat, lng], 14, { animate: true, duration: 0.7 });
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View
      style={[
        styles.mapCard,
        {
          height: isExpanded ? 380 : 255,
          backgroundColor: palette.surface,
          borderColor: palette.line,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <WebView
        ref={webViewRef as any}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'selectPin') {
              onSelectPin(data.id);
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
      />

      {/* Floating Top Left: User Location Pill */}
      <View
        style={[
          styles.userLocationPill,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={[styles.locationDot, { backgroundColor: palette.accent }]} />
        <Text style={[styles.userLocationText, { color: palette.ink }]} numberOfLines={1}>
          You • {areaName.split(',')[0]}
        </Text>
      </View>

      {/* Floating Top Right: Action Controls (Expand/Collapse & Open in External Maps) */}
      <View style={styles.topRightControls}>
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Collapse map' : 'Expand map view'}
          style={({ pressed }) => [
            styles.iconBadgeBtn,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <Text style={[styles.expandText, { color: palette.ink }]}>
            {isExpanded ? '⤢' : '⤡'}
          </Text>
        </Pressable>

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
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <DirectionsIcon size={13} color={palette.ink} />
          <Text style={[styles.openMapsText, { color: palette.ink }]}>
            Maps ↗
          </Text>
        </Pressable>
      </View>

      {/* Floating Bottom Right: Inbuilt Map Controls (Recenter, Zoom In, Zoom Out) */}
      <View style={styles.floatingControlsGroup}>
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
  userLocationPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    maxWidth: 170,
    zIndex: 10,
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
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  iconBadgeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  openMapsText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    fontWeight: '700',
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
