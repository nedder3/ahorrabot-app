// context/theme-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  colors: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#0D9488', // Teal 600
    primaryLight: '#CCFBF1',
    border: '#E2E8F0',
    accent: '#F59E0B',
    danger: '#EF4444',
    bubbleUser: '#0D9488',
    bubbleBot: '#F1F5F9',
    textUser: '#FFFFFF',
    textBot: '#0F172A',
  }
};

export const darkTheme = {
  colors: {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    primary: '#14B8A6', // Teal 500
    primaryLight: '#134E4A',
    border: '#334155',
    accent: '#FBBF24',
    danger: '#F87171',
    bubbleUser: '#14B8A6',
    bubbleBot: '#1E293B',
    textUser: '#0F172A',
    textBot: '#F8FAFC',
  }
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Load theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (e) {
        console.error('Error loading theme preference:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextMode = !isDark;
      setIsDark(nextMode);
      await AsyncStorage.setItem('theme_preference', nextMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
