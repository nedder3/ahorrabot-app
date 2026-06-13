// database/db.ts
import * as SQLite from 'expo-sqlite';
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

let nativeDb: SQLite.SQLiteDatabase | null = null;

// Initialize Database on Native
export const initDatabase = async (): Promise<boolean> => {
  console.log('📱 Running on Native. Initializing SQLite Database...');
  try {
    nativeDb = SQLite.openDatabaseSync('ahorrabot.db');
    
    // Create tables
    nativeDb.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT,
        password TEXT
      );
    `);

    nativeDb.execSync(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        productName TEXT,
        store TEXT,
        originalPrice REAL,
        discount TEXT,
        finalPrice REAL,
        timestamp TEXT
      );
    `);

    nativeDb.execSync(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        items TEXT,
        storeName TEXT,
        totalPrice REAL,
        savings REAL,
        timestamp TEXT
      );
    `);

    // Migration to add 'savings' column if the table was created previously without it
    try {
      nativeDb.execSync('ALTER TABLE orders ADD COLUMN savings REAL;');
      console.log('SQLite: Successfully ran migration to add savings column.');
    } catch (e) {
      // Column already exists or table does not exist, safe to ignore
    }

    // New tables for products and prices
    nativeDb.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT
      );
    `);

    nativeDb.execSync(`
      CREATE TABLE IF NOT EXISTS prices (
        productId TEXT,
        storeId TEXT,
        price REAL,
        PRIMARY KEY(productId, storeId)
      );
    `);

    // Seed an admin user if table is empty
    const userCount = nativeDb.getFirstSync('SELECT COUNT(*) as count FROM users') as { count: number } | null;
    if (userCount && userCount.count === 0) {
      nativeDb.runSync(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        'ahorrador',
        'ahorro@test.com',
        '123'
      );
      console.log('SQLite: Seeded default user');
    }

    return true;
  } catch (e) {
    console.error('Error initializing SQLite DB:', e);
    return false;
  }
};

// Register User on Native
export const registerUser = async (username: string, email: string, password: string): Promise<User | null> => {
  if (!nativeDb) throw new Error('Base de datos no inicializada');
  const normalizedUser = username.trim().toLowerCase();
  
  try {
    // Check if user exists
    const exists = nativeDb.getFirstSync('SELECT * FROM users WHERE username = ? COLLATE NOCASE', normalizedUser);
    if (exists) {
      throw new Error('El usuario ya existe');
    }

    const result = nativeDb.runSync(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      username.trim(),
      email.trim(),
      password
    );

    return {
      id: result.lastInsertRowId,
      username: username.trim(),
      email: email.trim()
    };
  } catch (error: any) {
    throw new Error(error.message || 'Error al registrar el usuario');
  }
};

// Login User on Native
export const loginUser = async (username: string, password: string): Promise<User | null> => {
  if (!nativeDb) return null;
  const normalizedUser = username.trim().toLowerCase();

  try {
    const user = nativeDb.getFirstSync(
      'SELECT * FROM users WHERE username = ? COLLATE NOCASE AND password = ?',
      username.trim(),
      password
    ) as User | null;
    return user;
  } catch (error) {
    console.error('Error in SQLite login:', error);
    return null;
  }
};

// Save Favorite Deal on Native
export const saveFavoriteDeal = async (
  userId: number,
  productName: string,
  store: string,
  originalPrice: number,
  discount: string,
  finalPrice: number
): Promise<FavoriteDeal> => {
  if (!nativeDb) throw new Error('Base de datos no inicializada');
  const timestamp = new Date().toISOString();

  const result = nativeDb.runSync(
    `INSERT INTO favorites (userId, productName, store, originalPrice, discount, finalPrice, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    userId,
    productName,
    store,
    originalPrice,
    discount,
    finalPrice,
    timestamp
  );

  return {
    id: result.lastInsertRowId,
    userId,
    productName,
    store,
    originalPrice,
    discount,
    finalPrice,
    timestamp
  };
};

// Get Favorite Deals on Native
export const getFavoriteDeals = async (userId: number): Promise<FavoriteDeal[]> => {
  if (!nativeDb) return [];
  try {
    const rows = nativeDb.getAllSync('SELECT * FROM favorites WHERE userId = ? ORDER BY id DESC', userId);
    return rows as FavoriteDeal[];
  } catch (error) {
    console.error('Error reading SQLite favorites:', error);
    return [];
  }
};

// Delete Favorite Deal on Native
export const deleteFavoriteDeal = async (id: number): Promise<boolean> => {
  if (!nativeDb) return false;
  try {
    nativeDb.runSync('DELETE FROM favorites WHERE id = ?', id);
    return true;
  } catch (error) {
    console.error('Error deleting SQLite favorite:', error);
    return false;
  }
};

// --- DATABASE FUNCTIONS FOR PRODUCTS AND PRICES ---

export const getProductsFromDb = async (): Promise<DbProduct[]> => {
  if (!nativeDb) return [];
  try {
    const rows = nativeDb.getAllSync('SELECT * FROM products');
    return rows as DbProduct[];
  } catch (e) {
    console.error('Error reading products from SQLite:', e);
    return [];
  }
};

export const getPricesFromDb = async (): Promise<DbPrice[]> => {
  if (!nativeDb) return [];
  try {
    const rows = nativeDb.getAllSync('SELECT * FROM prices');
    return rows as DbPrice[];
  } catch (e) {
    console.error('Error reading prices from SQLite:', e);
    return [];
  }
};

export const saveProductToDb = async (id: string, name: string, category: string): Promise<boolean> => {
  if (!nativeDb) return false;
  try {
    nativeDb.runSync(
      'INSERT OR REPLACE INTO products (id, name, category) VALUES (?, ?, ?)',
      id,
      name,
      category
    );
    return true;
  } catch (e) {
    console.error(`Error saving product ${id} to SQLite:`, e);
    return false;
  }
};

export const savePriceToDb = async (productId: string, storeId: string, price: number): Promise<boolean> => {
  if (!nativeDb) return false;
  try {
    nativeDb.runSync(
      'INSERT OR REPLACE INTO prices (productId, storeId, price) VALUES (?, ?, ?)',
      productId,
      storeId,
      price
    );
    return true;
  } catch (e) {
    console.error(`Error saving price for ${productId} at ${storeId} to SQLite:`, e);
    return false;
  }
};

// --- DATABASE FUNCTIONS FOR ORDERS ---

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
  if (!nativeDb) throw new Error('Base de datos no inicializada');
  const timestamp = new Date().toISOString();

  const result = nativeDb.runSync(
    `INSERT INTO orders (userId, items, storeName, totalPrice, savings, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    userId,
    items,
    storeName,
    totalPrice,
    savings,
    timestamp
  );

  return {
    id: result.lastInsertRowId,
    userId,
    items,
    storeName,
    totalPrice,
    savings,
    timestamp
  };
};

export const getOrders = async (userId: number): Promise<Order[]> => {
  if (!nativeDb) return [];
  try {
    const rows = nativeDb.getAllSync('SELECT * FROM orders WHERE userId = ? ORDER BY id DESC', userId);
    return rows as Order[];
  } catch (error) {
    console.error('Error reading SQLite orders:', error);
    return [];
  }
};

export const deleteOrder = async (id: number): Promise<boolean> => {
  if (!nativeDb) return false;
  try {
    nativeDb.runSync('DELETE FROM orders WHERE id = ?', id);
    return true;
  } catch (error) {
    console.error('Error deleting SQLite order:', error);
    return false;
  }
};
