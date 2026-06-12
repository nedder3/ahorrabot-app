// services/google-maps.ts
import * as Location from 'expo-location';
import { STORES, Store } from './supermarket-data';

export interface GeolocatedStore extends Store {
  latitude: number;
  longitude: number;
  address: string;
}

// Default location: Bahía Blanca, Buenos Aires, Argentina
const DEFAULT_LAT = -38.7183;
const DEFAULT_LNG = -62.2724;

export const getUserLocation = async (): Promise<{ latitude: number; longitude: number; address: string }> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        address: 'Bahía Blanca, Buenos Aires (Permiso denegado)'
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    
    let address = 'Bahía Blanca, Buenos Aires';
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        address = `${place.street || 'Calle'} ${place.streetNumber || ''}, ${place.city || 'Bahía Blanca'}`;
      }
    } catch (err) {
      console.warn('Reverse geocoding failed, using Bahía Blanca default:', err);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address
    };
  } catch (error) {
    console.error('Error getting location, fallback to Bahía Blanca:', error);
    return {
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      address: 'Bahía Blanca, Buenos Aires (Fallback)'
    };
  }
};

// Returns stores with coordinates relative to the user's coordinates in Bahía Blanca
export const getNearbyStores = (userLat: number, userLng: number): GeolocatedStore[] => {
  const addressList: Record<string, string> = {
    coope: 'Av. Colón 80, Bahía Blanca',
    carrefour: 'Av. Colón 200, Bahía Blanca',
    dia: 'Chiclana 350, Bahía Blanca',
    vea: 'Chiclana 180, Bahía Blanca'
  };

  return STORES.map(store => {
    return {
      ...store,
      latitude: userLat + store.latOffset,
      longitude: userLng + store.lngOffset,
      address: addressList[store.id] || 'Sucursal Bahía Blanca'
    };
  });
};
