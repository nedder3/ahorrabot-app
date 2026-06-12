// components/map-view.tsx
import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// Dynamically import WebView for native platforms to avoid bundle errors on Web
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('react-native-webview failed to load on native:', e);
  }
}

interface MapViewProps {
  userLat: number;
  userLng: number;
  stores: Array<{
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  }>;
}

export const MapViewComponent: React.FC<MapViewProps> = ({ userLat, userLng, stores }) => {
  // Generate Leaflet HTML
  const generateMapHtml = () => {
    const storesJson = JSON.stringify(stores);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          html, body, #map { height: 100vh; width: 100vw; }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          }
          .leaflet-popup-content {
            font-size: 14px;
            margin: 12px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map centered on user
          var map = L.map('map', { zoomControl: false }).setView([${userLat}, ${userLng}], 14);
          
          // Add OpenStreetMap tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Add zoom control at bottom right
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          // Red icon for stores, Blue for user
          var userIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          var storeIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          // User Marker
          L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map)
            .bindPopup('<div style="font-weight: bold; color: #0D9488;">📍 Mi Ubicación</div>')
            .openPopup();

          // Supermarkets Markers
          var stores = ${storesJson};
          stores.forEach(function(store) {
            L.marker([store.latitude, store.longitude], { icon: storeIcon }).addTo(map)
              .bindPopup('<div style="font-weight: bold; font-size: 15px; color: #1E293B;">🛒 ' + store.name + '</div><div style="color: #64748B; margin-top: 4px;">' + store.address + '</div>');
          });
        </script>
      </body>
      </html>
    `;
  };

  const htmlContent = generateMapHtml();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={htmlContent}
          style={{ border: 'none', width: '100%', height: '100%', borderRadius: 16 }}
          title="Supermarket Map"
        />
      </View>
    );
  }

  if (WebView) {
    return (
      <View style={styles.container}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.mapNative}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fallbackContainer]}>
      <Text style={styles.fallbackText}>Mapa no disponible en esta plataforma</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  mapNative: {
    flex: 1,
    borderRadius: 16,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
  },
  fallbackText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
});
