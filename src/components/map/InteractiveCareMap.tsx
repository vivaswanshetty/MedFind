import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { fonts, radii } from '../../constants/theme';
import {
  CrosshairTargetIcon,
  DirectionsIcon,
  ExpandIcon,
  CompressIcon,
  FitBoundsIcon,
  MapPinIcon,
} from '../icons/AppIcons';
import {
  Coordinates,
  getRegionForCoordinates,
  calculateDistanceKm,
  PREDEFINED_AREAS,
} from '../../services/locationService';
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

export interface InteractiveCareMapProps {
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
  onPinpointLocation?: (coords: Coordinates, localityName?: string) => void;
  region?: string;
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
  onPinpointLocation,
  region = 'Bengaluru',
}: InteractiveCareMapProps) {
  const { scheme, palette } = useTheme();
  const { t } = useLanguage();
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);

  // Guards to prevent duplicate animation/pan loops and unreleased scroll locks
  const isMapOriginatedSelectionRef = useRef(false);
  const isInteractingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss interaction hint after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Pinpoint mode state
  const [isPinpointMode, setIsPinpointMode] = useState(false);
  const [pinpointCoords, setPinpointCoords] = useState<Coordinates | null>(null);
  const [pinpointAddress, setPinpointAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const userRegion = getRegionForCoordinates(userLocation);
  const inCoverage = userRegion !== null && userRegion.hasPharmacyData;
  const isOutsideCoverage = userLocation !== null && !inCoverage;
  const defaultLat = userLocation ? userLocation.latitude : 12.9416; // Basavanagudi centroid fallback
  const defaultLng = userLocation ? userLocation.longitude : 77.5738;

  // Refs to always have the latest markers and location available for async mapReady handshake
  const latestMarkersRef = useRef<MapMarkerItem[]>(markers);
  useEffect(() => {
    latestMarkersRef.current = markers;
  }, [markers]);

  const latestLocationRef = useRef<Coordinates | null>(userLocation);
  useEffect(() => {
    latestLocationRef.current = userLocation;
  }, [userLocation]);

  // Cross-platform message dispatcher to map (works 100% reliably in web iframes and WebViews)
  const sendMessage = useCallback((msg: any) => {
    if (Platform.OS === 'web') {
      try {
        const cw = iframeRef.current?.contentWindow;
        if (cw) {
          cw.postMessage(msg, '*');
        }
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

  // Reverse geocode pinpointed coordinates
  const resolveAddressForCoords = useCallback(async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    try {
      // 1. Check closest predefined known area in Bengaluru
      let closestAreaName = '';
      let minDistance = Infinity;
      for (const a of PREDEFINED_AREAS) {
        const d = calculateDistanceKm(lat, lng, a.latitude, a.longitude);
        if (d !== null && d < minDistance) {
          minDistance = d;
          closestAreaName = a.name;
        }
      }

      if (minDistance <= 1.0 && closestAreaName) {
        setPinpointAddress(closestAreaName);
        return;
      }

      // 2. OpenStreetMap Nominatim reverse geocode
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
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
        const text =
          parts.length > 0
            ? parts.join(', ')
            : data.display_name?.split(',').slice(0, 3).join(',') || closestAreaName || 'Selected Location';
        setPinpointAddress(text);
      } else {
        setPinpointAddress(closestAreaName || `Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch {
      setPinpointAddress(`Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  // Web message listener for iframe postMessage
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || !data.type) return;

        if (data.type === 'mapReady') {
          setIsMapReady(true);
          // Push initial data
          sendMessage({ type: 'updateMarkers', markers: latestMarkersRef.current });
          if (latestLocationRef.current) {
            sendMessage({
              type: 'updateUserLocation',
              lat: latestLocationRef.current.latitude,
              lng: latestLocationRef.current.longitude,
              inCoverage,
            });
          }
          setTimeout(() => {
            sendMessage({ type: 'fitAll' });
          }, 200);
        } else if (data.type === 'selectPin') {
          isMapOriginatedSelectionRef.current = true;
          setShowHint(false);
          onSelectPin(data.id);
        } else if (data.type === 'pinpointMoved') {
          setShowHint(false);
          const lat = parseFloat(data.lat);
          const lng = parseFloat(data.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setPinpointCoords({ latitude: lat, longitude: lng });
            setIsPinpointMode(true);
            resolveAddressForCoords(lat, lng);
          }
        } else if (data.type === 'touchStart') {
          setShowHint(false);
          if (isInteractingWatchdogRef.current) {
            clearTimeout(isInteractingWatchdogRef.current);
          }
          onInteractionChange?.(true);
          isInteractingWatchdogRef.current = setTimeout(() => {
            onInteractionChange?.(false);
          }, 1200);
        } else if (data.type === 'touchEnd') {
          if (isInteractingWatchdogRef.current) {
            clearTimeout(isInteractingWatchdogRef.current);
            isInteractingWatchdogRef.current = null;
          }
          onInteractionChange?.(false);
        }
      } catch {
        // Ignore non-map messages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [markers, userLocation, inCoverage, onSelectPin, onInteractionChange, resolveAddressForCoords, sendMessage]);

  // Sync selected pin from parent to map (skip if selection came from user clicking map itself)
  useEffect(() => {
    if (!selectedPin) return;
    if (isMapOriginatedSelectionRef.current) {
      isMapOriginatedSelectionRef.current = false;
      return;
    }
    const target = markers.find((m) => m.id === selectedPin);
    if (target) {
      sendMessage({
        type: 'focusMarker',
        id: target.id,
        lat: target.latitude,
        lng: target.longitude,
      });
    }
  }, [selectedPin, markers, sendMessage]);

  // Dynamically update user location beacon & accuracy ring when GPS arrives
  useEffect(() => {
    if (!userLocation) return;
    sendMessage({
      type: 'updateUserLocation',
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      inCoverage,
    });
  }, [userLocation, inCoverage, sendMessage]);

  // Dynamically update markers without re-rendering iframe
  useEffect(() => {
    sendMessage({
      type: 'updateMarkers',
      markers,
    });
  }, [markers, sendMessage]);

  // Invalidate map size when expanded / collapsed
  useEffect(() => {
    sendMessage({ type: 'invalidateSize' });
  }, [isExpanded, sendMessage]);

  const handleRecenter = () => {
    onRequestLocation?.();
    const targetLat = userLocation ? userLocation.latitude : defaultLat;
    const targetLng = userLocation ? userLocation.longitude : defaultLng;

    if (isPinpointMode) {
      setIsPinpointMode(false);
      setPinpointCoords(null);
      setPinpointAddress(null);
      sendMessage({ type: 'setPinpointMode', enabled: false });
    }

    sendMessage({
      type: 'recenter',
      lat: targetLat,
      lng: targetLng,
    });
  };

  const handleFitAll = () => {
    sendMessage({ type: 'fitAll' });
  };

  const handleZoomIn = () => {
    sendMessage({ type: 'zoomIn' });
  };

  const handleZoomOut = () => {
    sendMessage({ type: 'zoomOut' });
  };

  const handleTogglePinpoint = () => {
    const nextMode = !isPinpointMode;
    setIsPinpointMode(nextMode);

    const initialLat = userLocation ? userLocation.latitude : defaultLat;
    const initialLng = userLocation ? userLocation.longitude : defaultLng;

    if (nextMode) {
      setPinpointCoords({ latitude: initialLat, longitude: initialLng });
      resolveAddressForCoords(initialLat, initialLng);
      sendMessage({
        type: 'setPinpointMode',
        enabled: true,
        lat: initialLat,
        lng: initialLng,
      });
    } else {
      setPinpointCoords(null);
      setPinpointAddress(null);
      sendMessage({ type: 'setPinpointMode', enabled: false });
    }
  };

  const handleConfirmPinpoint = () => {
    if (pinpointCoords) {
      onPinpointLocation?.(pinpointCoords, pinpointAddress || undefined);
      setIsPinpointMode(false);
      sendMessage({ type: 'setPinpointMode', enabled: false });
      sendMessage({
        type: 'updateUserLocation',
        lat: pinpointCoords.latitude,
        lng: pinpointCoords.longitude,
        inCoverage: true,
      });
    }
  };

  const handleCancelPinpoint = () => {
    setIsPinpointMode(false);
    setPinpointCoords(null);
    setPinpointAddress(null);
    sendMessage({ type: 'setPinpointMode', enabled: false });
  };

  // Safe initial data embedding (prevents any string escaping syntax errors)
  const initialDataJson = JSON.stringify({
    defaultLat,
    defaultLng,
    scheme,
  });

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

            /* Draggable Pinpoint Marker */
            .pinpoint-wrapper {
              position: relative;
              width: 44px;
              height: 44px;
              cursor: grab;
            }
            .pinpoint-wrapper:active {
              cursor: grabbing;
            }
            .pinpoint-bubble {
              width: 38px;
              height: 38px;
              background: linear-gradient(135deg, #EF4444, #B91C1C);
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 14px rgba(0,0,0,0.45);
              border: 2.5px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .pinpoint-center {
              width: 12px;
              height: 12px;
              background: #FFFFFF;
              border-radius: 50%;
              transform: rotate(45deg);
            }
            .pinpoint-shadow {
              position: absolute;
              bottom: -4px;
              left: 7px;
              width: 24px;
              height: 8px;
              border-radius: 50%;
              background: rgba(0,0,0,0.28);
              filter: blur(2px);
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
          <script id="initial-map-data" type="application/json">${initialDataJson}</script>
          <script>
            (function() {
              var initData = JSON.parse(document.getElementById('initial-map-data').textContent);

              function postToApp(payload) {
                var dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(dataStr);
                } else if (window.parent && window.parent !== window) {
                  window.parent.postMessage(dataStr, '*');
                }
              }

              var map = L.map('map', {
                center: [initData.defaultLat, initData.defaultLng],
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

              // OpenStreetMap Primary Tile Layer (100% free, NO API KEY, NO WATERMARK)
              var primaryTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
              var tileLayer = L.tileLayer(primaryTiles, {
                maxZoom: 19,
                crossOrigin: true,
                attribution: '© OpenStreetMap contributors'
              }).addTo(map);

              // Fallback to ESRI World Street Map on tile error
              tileLayer.on('tileerror', function(err, tile) {
                var z = err.coords.z;
                var x = err.coords.x;
                var y = err.coords.y;
                tile.src = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/' + z + '/' + y + '/' + x;
              });

              // User Location Beacon Definition
              var userIcon = L.divIcon({
                className: '',
                html: '<div class="user-beacon"><div class="user-pulse"></div><div class="user-dot"></div></div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });

              var userAccuracyCircle = null;
              var userMarker = null;

              if (initData.userLocation) {
                userAccuracyCircle = L.circle([initData.userLocation.latitude, initData.userLocation.longitude], {
                  radius: 65,
                  color: initData.scheme === 'light' ? '#87A96B' : '#00E5FF',
                  fillColor: initData.scheme === 'light' ? '#87A96B' : '#00E5FF',
                  fillOpacity: 0.14,
                  weight: 1.5,
                  dashArray: '3, 4'
                }).addTo(map);

                userMarker = L.marker([initData.userLocation.latitude, initData.userLocation.longitude], {
                  icon: userIcon,
                  zIndexOffset: 250
                }).addTo(map);
              }

              // Pinpoint Mode Marker
              var isPinpointMode = false;
              var pinpointMarker = null;

              var pinpointIcon = L.divIcon({
                className: '',
                html: '<div class="pinpoint-wrapper"><div class="pinpoint-shadow"></div><div class="pinpoint-bubble"><div class="pinpoint-center"></div></div></div>',
                iconSize: [44, 44],
                iconAnchor: [19, 42]
              });

              // Marker Management
              var markerObjects = {};

              function renderMarkers(list) {
                Object.keys(markerObjects).forEach(function(id) {
                  map.removeLayer(markerObjects[id]);
                  delete markerObjects[id];
                });

                if (!Array.isArray(list)) return;

                list.forEach(function(m) {
                  if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') return;

                  var letter = m.type === 'hospital' ? 'H' : m.type === 'clinic' ? 'C' : m.type === 'ambulance' ? 'A' : 'P';
                  var pinClass = 'pin-' + m.type;

                  var icon = L.divIcon({
                    className: '',
                    html: '<div id="pin-' + m.id + '" class="med-pin ' + pinClass + '"><span>' + letter + '</span></div>',
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                  });

                  var marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(map);
                  markerObjects[m.id] = marker;

                  // Safe popup DOM creation (prevents quote syntax errors)
                  var popupDiv = document.createElement('div');
                  popupDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

                  var titleDiv = document.createElement('div');
                  titleDiv.style.fontWeight = '700';
                  titleDiv.style.fontSize = '13px';
                  titleDiv.style.letterSpacing = '-0.2px';
                  titleDiv.textContent = m.name || '';
                  popupDiv.appendChild(titleDiv);

                  if (m.subtitle) {
                    var subDiv = document.createElement('div');
                    subDiv.style.fontSize = '11px';
                    subDiv.style.opacity = '0.75';
                    subDiv.style.marginTop = '2px';
                    subDiv.textContent = m.subtitle;
                    popupDiv.appendChild(subDiv);
                  }

                  if (typeof m.distanceKm === 'number') {
                    var distDiv = document.createElement('div');
                    distDiv.style.fontSize = '10px';
                    distDiv.style.fontWeight = '700';
                    distDiv.style.color = '#10B981';
                    distDiv.style.marginTop = '3px';
                    distDiv.textContent = m.distanceKm.toFixed(1) + ' km away';
                    popupDiv.appendChild(distDiv);
                  }

                  marker.bindPopup(popupDiv, { closeButton: false, offset: [0, -12], autoPan: false });

                  marker.on('click', function() {
                    postToApp({ type: 'selectPin', id: m.id });
                    focusMarker(m.id, m.latitude, m.longitude);
                  });
                });
              }

              // Initial Render
              renderMarkers(initData.markers);

              function updateUserLocation(lat, lng, inCoverage) {
                if (typeof lat !== 'number' || typeof lng !== 'number') return;
                if (!userMarker) {
                  userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 250 }).addTo(map);
                } else {
                  userMarker.setLatLng([lat, lng]);
                }
                if (!userAccuracyCircle) {
                  userAccuracyCircle = L.circle([lat, lng], {
                    radius: 65,
                    color: initData.scheme === 'light' ? '#87A96B' : '#00E5FF',
                    fillColor: initData.scheme === 'light' ? '#87A96B' : '#00E5FF',
                    fillOpacity: 0.14,
                    weight: 1.5,
                    dashArray: '3, 4'
                  }).addTo(map);
                } else {
                  userAccuracyCircle.setLatLng([lat, lng]);
                }
              }

              function focusMarker(id, lat, lng) {
                document.querySelectorAll('.med-pin').forEach(function(el) {
                  el.classList.remove('active');
                });
                var el = document.getElementById('pin-' + id);
                if (el) el.classList.add('active');

                // Smoothly pan without violent zoom leaps or autopan jitter
                if (typeof lat === 'number' && typeof lng === 'number') {
                  if (map.getZoom() < 14) {
                    map.setView([lat, lng], 15, { animate: true });
                  } else {
                    map.panTo([lat, lng], { animate: true, duration: 0.35 });
                  }
                }

                if (markerObjects[id]) {
                  markerObjects[id].openPopup();
                }
              }

              function recenterMap(lat, lng) {
                document.querySelectorAll('.med-pin').forEach(function(el) {
                  el.classList.remove('active');
                });
                map.closePopup();
                if (typeof lat === 'number' && typeof lng === 'number') {
                  updateUserLocation(lat, lng, true);
                  map.flyTo([lat, lng], 15.5, { animate: true, duration: 0.6 });
                }
              }

              function fitAllMarkers() {
                var allLayers = Object.values(markerObjects);
                if (userMarker) allLayers.push(userMarker);
                if (pinpointMarker) allLayers.push(pinpointMarker);
                if (allLayers.length > 0) {
                  var group = new L.featureGroup(allLayers);
                  map.fitBounds(group.getBounds().pad(0.18), { animate: true, duration: 0.7 });
                }
              }

              function setPinpointMode(enabled, lat, lng) {
                isPinpointMode = Boolean(enabled);
                if (isPinpointMode) {
                  var targetLat = typeof lat === 'number' ? lat : map.getCenter().lat;
                  var targetLng = typeof lng === 'number' ? lng : map.getCenter().lng;

                  if (!pinpointMarker) {
                    pinpointMarker = L.marker([targetLat, targetLng], {
                      icon: pinpointIcon,
                      draggable: true,
                      zIndexOffset: 1000
                    }).addTo(map);

                    pinpointMarker.on('dragend', function() {
                      var pos = pinpointMarker.getLatLng();
                      postToApp({ type: 'pinpointMoved', lat: pos.lat, lng: pos.lng });
                    });
                  } else {
                    pinpointMarker.setLatLng([targetLat, targetLng]);
                  }
                  map.flyTo([targetLat, targetLng], 16, { animate: true, duration: 0.5 });
                } else {
                  if (pinpointMarker) {
                    map.removeLayer(pinpointMarker);
                    pinpointMarker = null;
                  }
                }
              }

              // Click map to drop or move pinpoint at any time
              map.on('click', function(e) {
                setPinpointMode(true, e.latlng.lat, e.latlng.lng);
                postToApp({ type: 'pinpointMoved', lat: e.latlng.lat, lng: e.latlng.lng });
              });

              // Gesture start/stop listeners - only notify app on direct user drag
              map.on('dragstart', function() {
                postToApp({ type: 'touchStart' });
              });
              map.on('dragend', function() {
                postToApp({ type: 'touchEnd' });
              });

              // Public handler for parent messages
              function handleAppMessage(data) {
                if (!data || !data.type) return;
                switch (data.type) {
                  case 'updateMarkers':
                    renderMarkers(data.markers);
                    break;
                  case 'updateUserLocation':
                    updateUserLocation(data.lat, data.lng, data.inCoverage);
                    break;
                  case 'focusMarker':
                    focusMarker(data.id, data.lat, data.lng);
                    break;
                  case 'recenter':
                    recenterMap(data.lat, data.lng);
                    break;
                  case 'fitAll':
                    fitAllMarkers();
                    break;
                  case 'zoomIn':
                    map.zoomIn();
                    break;
                  case 'zoomOut':
                    map.zoomOut();
                    break;
                  case 'setPinpointMode':
                    setPinpointMode(data.enabled, data.lat, data.lng);
                    break;
                  case 'invalidateSize':
                    setTimeout(function() { map.invalidateSize({ animate: true }); }, 150);
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

              // Notify parent that Leaflet is loaded and ready
              postToApp({ type: 'mapReady' });
            })();
          </script>
        </body>
      </html>
    `;
  }, [scheme]);

  return (
    <View
      style={[
        styles.mapCard,
        {
          height: isExpanded ? 410 : 275,
          backgroundColor: palette.surface,
          borderColor: palette.line,
          shadowColor: palette.shadow,
        },
      ]}
    >
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: radii.cardLg,
            backgroundColor: scheme === 'light' ? '#F7F2E8' : '#0a0a0f',
          }}
          title="Care Map"
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
              if (data?.type === 'mapReady') {
                setIsMapReady(true);
                sendMessage({ type: 'updateMarkers', markers });
                if (userLocation) {
                  sendMessage({
                    type: 'updateUserLocation',
                    lat: userLocation.latitude,
                    lng: userLocation.longitude,
                    inCoverage,
                  });
                }
              } else if (data?.type === 'selectPin') {
                isMapOriginatedSelectionRef.current = true;
                setShowHint(false);
                onSelectPin(data.id);
              } else if (data?.type === 'pinpointMoved') {
                setShowHint(false);
                const lat = parseFloat(data.lat);
                const lng = parseFloat(data.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setPinpointCoords({ latitude: lat, longitude: lng });
                  setIsPinpointMode(true);
                  resolveAddressForCoords(lat, lng);
                }
              } else if (data?.type === 'touchStart') {
                setShowHint(false);
                if (isInteractingWatchdogRef.current) {
                  clearTimeout(isInteractingWatchdogRef.current);
                }
                onInteractionChange?.(true);
                isInteractingWatchdogRef.current = setTimeout(() => {
                  onInteractionChange?.(false);
                }, 1200);
              } else if (data?.type === 'touchEnd') {
                if (isInteractingWatchdogRef.current) {
                  clearTimeout(isInteractingWatchdogRef.current);
                  isInteractingWatchdogRef.current = null;
                }
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
        />
      )}

      {/* Overlaid Top Header Bar */}
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
                  locationSource === 'none' ? palette.ink2 : palette.accent,
              },
            ]}
          />
          <Text style={[styles.userLocationText, { color: palette.ink }]} numberOfLines={1}>
            {locationSource === 'none' ? 'Set your area' : areaName.split(',')[0]}
          </Text>
        </Pressable>

        {/* Top Right Action Buttons: Expand/Contract + Google Maps */}
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

      {/* Attribution Badge */}
      <View
        style={[
          styles.osmAttributionBadge,
          {
            backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(20,20,25,0.88)',
            borderColor: palette.line,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.osmAttributionText, { color: palette.ink2 }]}>
          © OpenStreetMap contributors
        </Text>
      </View>

      {/* Gesture Hint Pill */}
      {showHint && !isPinpointMode && (
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

      {/* Pinpoint Mode Banner (When user is pinpointing) */}
      {isPinpointMode && (
        <View
          style={[
            styles.pinpointBanner,
            {
              backgroundColor: palette.surface,
              borderColor: palette.accent,
            },
          ]}
        >
          <View style={styles.pinpointBannerLeft}>
            <View style={[styles.pinpointBannerIconBox, { backgroundColor: palette.surface2 }]}>
              <MapPinIcon size={16} color={palette.accent} />
            </View>
            <View style={styles.pinpointBannerTextCol}>
              <Text style={[styles.pinpointBannerTitle, { color: palette.ink }]} numberOfLines={1}>
                {isResolvingAddress
                  ? 'Finding address...'
                  : pinpointAddress || 'Tap map or drag pin'}
              </Text>
              <Text style={[styles.pinpointBannerSub, { color: palette.ink2 }]}>
                {pinpointCoords
                  ? `${pinpointCoords.latitude.toFixed(4)}, ${pinpointCoords.longitude.toFixed(4)}`
                  : 'Tap anywhere to drop pin'}
              </Text>
            </View>
          </View>

          <View style={styles.pinpointBannerActions}>
            <Pressable
              onPress={handleConfirmPinpoint}
              disabled={!pinpointCoords}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Confirm pinpointed location"
              style={({ pressed }) => [
                styles.pinpointConfirmBtn,
                {
                  backgroundColor: palette.accent,
                  opacity: pressed || !pinpointCoords ? 0.75 : 1.0,
                },
              ]}
            >
              <Text style={[styles.pinpointConfirmBtnText, { color: palette.surface }]}>
                Set Location
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCancelPinpoint}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cancel pinpoint mode"
              style={({ pressed }) => [
                styles.pinpointCancelBtn,
                {
                  backgroundColor: palette.surface2,
                  borderColor: palette.line,
                  opacity: pressed ? 0.75 : 1.0,
                },
              ]}
            >
              <Text style={[styles.pinpointCancelBtnText, { color: palette.ink2 }]}>
                ✕
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Floating Bottom Right Controls (Pinpoint, Recenter, Fit All, Zoom In/Out) */}
      <View style={styles.floatingControlsGroup}>
        {/* Button: Pinpoint My Location */}
        <Pressable
          onPress={handleTogglePinpoint}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isPinpointMode ? 'Exit pinpoint mode' : 'Pinpoint my location on map'}
          style={({ pressed }) => [
            styles.floatingControlBtn,
            {
              backgroundColor: isPinpointMode ? palette.accent : palette.surface,
              borderColor: isPinpointMode ? palette.accent : palette.line,
              opacity: pressed ? 0.85 : 1.0,
            },
          ]}
        >
          <MapPinIcon size={16} color={isPinpointMode ? palette.surface : palette.accent} />
        </Pressable>

        {/* Button: Recenter to User's GPS Pin */}
        <Pressable
          onPress={handleRecenter}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Recenter map to my GPS location"
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

        {/* Button: Fit All Markers in View */}
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
  osmAttributionBadge: {
    position: 'absolute',
    top: 54,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    zIndex: 8,
  },
  osmAttributionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 12,
  },
  pinpointBanner: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  pinpointBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  pinpointBannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinpointBannerTextCol: {
    flex: 1,
  },
  pinpointBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
  },
  pinpointBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    marginTop: 1,
  },
  pinpointBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinpointConfirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  pinpointConfirmBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  pinpointCancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinpointCancelBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
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
