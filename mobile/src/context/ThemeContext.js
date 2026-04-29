import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user_theme');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('user_theme', mode);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  // Determina o tema atual (real) baseado na escolha do usuário ou no sistema
  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  
  const theme = {
    dark: isDark,
    colors: isDark ? darkColors : lightColors,
    mode: themeMode,
    setMode: saveThemePreference,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Definição das paletas de cores (Premium Aesthetics)
const lightColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#6C757D',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  card: '#FFFFFF',
  error: '#DC3545',
  success: '#28A745',
  inputBackground: '#F8F9FA',
  headerBackground: '#FFFFFF',
};

const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#3794FF',
  secondary: '#ADB5BD',
  text: '#E9ECEF',
  textSecondary: '#9BA1A6',
  border: '#2C2C2C',
  card: '#252525',
  error: '#FF5252',
  success: '#4BB543',
  inputBackground: '#2C2C2C',
  headerBackground: '#1E1E1E',
};
