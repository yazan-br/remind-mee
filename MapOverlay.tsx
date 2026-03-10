import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { reverseGeocode } from './src/services/geocoding';

interface MapOverlayProps {
  initialRegion: { lat: number; lng: number };
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

function buildMapHtml(userLat: number, userLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${userLat}, ${userLng}], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap, &copy; CARTO'
    }).addTo(map);
    L.circle([${userLat}, ${userLng}], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.4,
      radius: 80,
      weight: 3
    }).addTo(map);
    var marker = L.marker([${userLat}, ${userLng}]).addTo(map);
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        }));
      }
    });
  </script>
</body>
</html>`;
}

export function MapOverlay({ initialRegion, onSelect, onCancel }: MapOverlayProps) {
  const [selectedRegion, setSelectedRegion] = useState<{ lat: number; lng: number } | null>(null);
  const region = selectedRegion ?? initialRegion;

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const { lat, lng } = JSON.parse(event.nativeEvent.data);
        setSelectedRegion({ lat, lng });
      } catch {
      }
    },
    []
  );

  const handleDone = useCallback(async () => {
    const addr = await reverseGeocode(region.lat, region.lng);
    onSelect(addr ?? `${region.lat.toFixed(4)}, ${region.lng.toFixed(4)}`, region);
  }, [region, onSelect]);

  const html = buildMapHtml(initialRegion.lat, initialRegion.lng);

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} testID="map-cancel">
          <Text style={styles.headerText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Tap to select location</Text>
        <Pressable onPress={handleDone} testID="map-done">
          <Text style={[styles.headerText, styles.doneText]}>Done</Text>
        </Pressable>
      </View>
      <WebView
        style={styles.map}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        originWhitelist={['*']}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#0f0f0f',
  },
  title: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerText: {
    fontSize: 16,
    color: '#888',
  },
  doneText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  map: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0f0f0f',
  },
});
