// context/theme-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  colors: {
    background: '#FAFBFD', // soft clean white
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: '#DC2626', // Consumerism Red (600)
    primaryLight: '#FEE2E2', // soft light red (100)
    border: '#E2E8F0',
    accent: '#F59E0B', // Promotional Yellow/Amber (500)
    danger: '#EF4444',
    bubbleUser: '#DC2626', // User chats in red
    bubbleBot: '#F1F5F9', // Bot chats in soft white/gray
    textUser: '#FFFFFF',
    textBot: '#1E293B',
  }
};

export const darkTheme = {
  colors: {
    background: '#120202', // Very dark maroon/black
    card: '#270808', // Dark deep red card
    text: '#F8FAFC',
    textSecondary: '#FDA4AF', // soft rose-300
    primary: '#EF4444', // Red-500
    primaryLight: '#7F1D1D', // dark maroon (900)
    border: '#450A0A',
    accent: '#FBBF24', // Yellow-400
    danger: '#F87171',
    bubbleUser: '#EF4444',
    bubbleBot: '#270808',
    textUser: '#FFFFFF',
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
