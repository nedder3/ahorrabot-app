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
