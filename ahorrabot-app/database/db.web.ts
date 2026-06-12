// database/db.web.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface FavoriteDeal {
  id: number;
  userId: number;
  productName: string;
  store: string;
  originalPrice: number;
  discount: string;
  finalPrice: number;
  timestamp: string;
}

let webUsers: any[] = [];
let webFavorites: any[] = [];

// Initialize Database on Web
export const initDatabase = async (): Promise<boolean> => {
  console.log('🖥️ Running on Web. Initializing simulated LocalStorage Database...');
  try {
    const storedUsers = await AsyncStorage.getItem('web_users');
    const storedFavorites = await AsyncStorage.getItem('web_favorites');
    
    if (storedUsers) {
      webUsers = JSON.parse(storedUsers);
    } else {
      // Seed default user
      webUsers = [{ id: 1, username: 'ahorrador', email: 'ahorro@test.com', password: '123' }];
      await AsyncStorage.setItem('web_users', JSON.stringify(webUsers));
    }

    if (storedFavorites) {
      webFavorites = JSON.parse(storedFavorites);
    } else {
      webFavorites = [];
      await AsyncStorage.setItem('web_favorites', JSON.stringify(webFavorites));
    }
    return true;
  } catch (e) {
    console.error('Error loading simulated DB on web:', e);
    return false;
  }
};

// Register User on Web
export const registerUser = async (username: string, email: string, password: string): Promise<User | null> => {
  const normalizedUser = username.trim().toLowerCase();
  const exists = webUsers.find(u => u.username.toLowerCase() === normalizedUser);
  if (exists) {
    throw new Error('El usuario ya existe');
  }
  
  const newUser = {
    id: Date.now(),
    username: username.trim(),
    email: email.trim(),
    password: password
  };
  
  webUsers.push(newUser);
  await AsyncStorage.setItem('web_users', JSON.stringify(webUsers));
  return { id: newUser.id, username: newUser.username, email: newUser.email };
};

// Login User on Web
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  const normalizedUser = username.trim().toLowerCase();
  const user = webUsers.find(
    u => u.username.toLowerCase() === normalizedUser && u.password === password
  );
  if (!user) return null;
  return { id: user.id, username: user.username, email: user.email };
};

// Save Favorite Deal on Web
export const saveFavoriteDeal = async (
  userId: number,
  productName: string,
  store: string,
  originalPrice: number,
  discount: string,
  finalPrice: number
): Promise<FavoriteDeal> => {
  const timestamp = new Date().toISOString();
  const newFavorite: FavoriteDeal = {
    id: Date.now(),
    userId,
    productName,
    store,
    originalPrice,
    discount,
    finalPrice,
    timestamp
  };
  
  webFavorites.push(newFavorite);
  await AsyncStorage.setItem('web_favorites', JSON.stringify(webFavorites));
  return newFavorite;
};

// Get Favorite Deals on Web
export const getFavoriteDeals = async (userId: number): Promise<FavoriteDeal[]> => {
  return webFavorites.filter(fav => fav.userId === userId);
};

// Delete Favorite Deal on Web
export const deleteFavoriteDeal = async (id: number): Promise<boolean> => {
  webFavorites = webFavorites.filter(fav => fav.id !== id);
  await AsyncStorage.setItem('web_favorites', JSON.stringify(webFavorites));
  return true;
};
