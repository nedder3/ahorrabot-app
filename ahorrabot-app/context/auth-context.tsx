// context/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../database/db';
import { User } from '../database/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  cards: string[];
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleCard: (card: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cards, setCards] = useState<string[]>(['Cuenta DNI', 'Comunidad Coto']); // default cards

  // Initialize DB and load session
  useEffect(() => {
    const initialize = async () => {
      try {
        await db.initDatabase();
        
        // Load user session
        const savedUser = await AsyncStorage.getItem('auth_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Load saved promo cards
        const savedCards = await AsyncStorage.getItem('auth_cards');
        if (savedCards) {
          setCards(JSON.parse(savedCards));
        }
      } catch (e) {
        console.error('Error during auth initialization:', e);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const loggedUser = await db.loginUser(username, password);
      if (loggedUser) {
        setUser(loggedUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(loggedUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const newUser = await db.registerUser(username, email, password);
      if (newUser) {
        setUser(newUser);
        await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
        return true;
      }
      return false;
    } catch (e) {
      // Re-throw to show error message (e.g. user already exists)
      throw e;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('auth_user');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const toggleCard = async (cardName: string) => {
    let updatedCards = [];
    if (cards.includes(cardName)) {
      updatedCards = cards.filter(c => c !== cardName);
    } else {
      updatedCards = [...cards, cardName];
    }
    setCards(updatedCards);
    await AsyncStorage.setItem('auth_cards', JSON.stringify(updatedCards));
  };

  return (
    <AuthContext.Provider value={{ user, loading, cards, login, register, logout, toggleCard }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
