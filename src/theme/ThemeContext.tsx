// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './colors';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (mode: ThemeType) => void;
  colors: typeof colors.light | typeof colors.dark;   // ← Fixed type
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme() || 'light';
  const [userPreference, setUserPreference] = useState<ThemeType>('system');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(systemScheme);

  // Load saved preference from AsyncStorage
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('appTheme');
        if (saved) {
          setUserPreference(saved as ThemeType);
        }
      } catch (e) {
        console.log('Failed to load theme');
      }
    };
    loadSavedTheme();
  }, []);

  // Update current theme when system or user preference changes
  useEffect(() => {
    const newTheme = userPreference === 'system' ? systemScheme : userPreference;
    setCurrentTheme(newTheme);
  }, [userPreference, systemScheme]);

  const changeTheme = async (newMode: ThemeType) => {
    setUserPreference(newMode);
    try {
      await AsyncStorage.setItem('appTheme', newMode);
    } catch (e) {
      console.log('Failed to save theme');
    }
  };

  const currentColors = colors[currentTheme];

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        isDark: currentTheme === 'dark',
        setTheme: changeTheme,
        colors: currentColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
};