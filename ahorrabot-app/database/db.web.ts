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

export interface DbProduct {
  id: string;
  name: string;
  category: string;
}

export interface DbPrice {
  productId: string;
  storeId: string;
  price: number;
}

let webUsers: any[] = [];
let webFavorites: any[] = [];
let webProducts: DbProduct[] = [];
let webPrices: DbPrice[] = [];
let webOrders: any[] = [];

// Initialize Database on Web
export const initDatabase = async (): Promise<boolean> => {
  console.log('🖥️ Running on Web. Initializing simulated LocalStorage Database...');
  try {
    const storedUsers = await AsyncStorage.getItem('web_users');
    const storedFavorites = await AsyncStorage.getItem('web_favorites');
    const storedProducts = await AsyncStorage.getItem('web_products');
    const storedPrices = await AsyncStorage.getItem('web_prices');
    const storedOrders = await AsyncStorage.getItem('web_orders');
    
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

    if (storedProducts) {
      webProducts = JSON.parse(storedProducts);
    } else {
      webProducts = [];
    }

    if (storedPrices) {
      webPrices = JSON.parse(storedPrices);
    } else {
      webPrices = [];
    }

    if (storedOrders) {
      webOrders = JSON.parse(storedOrders);
    } else {
      webOrders = [];
      await AsyncStorage.setItem('web_orders', JSON.stringify(webOrders));
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

// --- WEB SIMULATED PRODUCTS AND PRICES METHODS ---

export const getProductsFromDb = async (): Promise<DbProduct[]> => {
  return webProducts;
};

export const getPricesFromDb = async (): Promise<DbPrice[]> => {
  return webPrices;
};

export const saveProductToDb = async (id: string, name: string, category: string): Promise<boolean> => {
  const index = webProducts.findIndex(p => p.id === id);
  if (index > -1) {
    webProducts[index] = { id, name, category };
  } else {
    webProducts.push({ id, name, category });
  }
  await AsyncStorage.setItem('web_products', JSON.stringify(webProducts));
  return true;
};

export const savePriceToDb = async (productId: string, storeId: string, price: number): Promise<boolean> => {
  const index = webPrices.findIndex(p => p.productId === productId && p.storeId === storeId);
  const newPriceRecord = { productId, storeId, price };
  if (index > -1) {
    webPrices[index] = newPriceRecord;
  } else {
    webPrices.push(newPriceRecord);
  }
  await AsyncStorage.setItem('web_prices', JSON.stringify(webPrices));
  return true;
};

// --- WEB SIMULATED ORDERS METHODS ---

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  items: string; // JSON string of OrderItem[]
  storeName: string;
  totalPrice: number;
  savings: number;
  timestamp: string;
}

export const saveOrder = async (
  userId: number,
  items: string,
  storeName: string,
  totalPrice: number,
  savings: number
): Promise<Order> => {
  const timestamp = new Date().toISOString();
  const newOrder: Order = {
    id: Date.now(),
    userId,
    items,
    storeName,
    totalPrice,
    savings,
    timestamp
  };
  
  webOrders.push(newOrder);
  await AsyncStorage.setItem('web_orders', JSON.stringify(webOrders));
  return newOrder;
};

export const getOrders = async (userId: number): Promise<Order[]> => {
  return webOrders.filter(o => o.userId === userId).sort((a, b) => b.id - a.id);
};

export const deleteOrder = async (id: number): Promise<boolean> => {
  webOrders = webOrders.filter(o => o.id !== id);
  await AsyncStorage.setItem('web_orders', JSON.stringify(webOrders));
  return true;
};
