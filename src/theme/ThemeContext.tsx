import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, Palette, SchemeName } from '../constants/theme';
import { ColorPalette, lightPalette, darkPalette, ThemeMode } from './tokens';

export const THEME_STORAGE_KEY = 'medfind.theme';

interface ThemeContextType {
  scheme: SchemeName;
  palette: Palette;
  setScheme: (scheme: SchemeName) => void;
  // Backward compatibility with previous theme hooks
  mode: ThemeMode;
  theme: ColorPalette;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  scheme: 'light',
  palette: palettes.light,
  setScheme: () => {},
  mode: 'light',
  theme: lightPalette,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [scheme, setSchemeState] = useState<SchemeName>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setSchemeState(saved);
        } else if (systemColorScheme) {
          setSchemeState(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch {
        // Fallback to system scheme
        if (systemColorScheme) {
          setSchemeState(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      }
    }
    loadSavedTheme();
  }, [systemColorScheme]);

  const setScheme = async (newScheme: SchemeName) => {
    setSchemeState(newScheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newScheme);
    } catch {
      // Best-effort persistence
    }
  };

  const toggleTheme = () => {
    const next = scheme === 'light' ? 'dark' : 'light';
    setScheme(next);
  };

  const palette = palettes[scheme];
  const legacyTheme = scheme === 'light' ? lightPalette : darkPalette;

  return (
    <ThemeContext.Provider
      value={{
        scheme,
        palette,
        setScheme,
        mode: scheme,
        theme: legacyTheme,
        toggleTheme,
        setMode: (m) => setScheme(m),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
