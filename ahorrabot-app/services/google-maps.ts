// services/google-maps.ts
import * as Location from 'expo-location';
import { STORES, Store } from './supermarket-data';

export interface GeolocatedStore extends Store {
  latitude: number;
  longitude: number;
  address: string;
}

// Default location: Obelisco, Buenos Aires
const DEFAULT_LAT = -34.603722;
const DEFAULT_LNG = -58.381592;

export const getUserLocation = async (): Promise<{ latitude: number; longitude: number; address: string }> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        address: 'Obelisco, CABA (Permiso denegado)'
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    
    // Attempt reverse geocoding to get a readable address
    let address = 'Mi Ubicación';
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        address = `${place.street || 'Calle'} ${place.streetNumber || ''}, ${place.city || place.subregion || 'Buenos Aires'}`;
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      address: 'Obelisco, Buenos Aires (Fallback)'
    };
  }
};

// Returns stores with coordinates relative to the user's coordinates
export const getNearbyStores = (userLat: number, userLng: number): GeolocatedStore[] => {
  const addressList: Record<string, string> = {
    coto: 'Av. Cabildo 500, Belgrano',
    carrefour: 'Av. Monroe 1800, Belgrano',
    dia: 'Juramento 2400, Belgrano',
    jumbo: 'Av. Int. Bullrich 345, Palermo'
  };

  return STORES.map(store => {
    return {
      ...store,
      latitude: userLat + store.latOffset,
      longitude: userLng + store.lngOffset,
      address: addressList[store.id] || 'Dirección Cercana'
    };
  });
};
