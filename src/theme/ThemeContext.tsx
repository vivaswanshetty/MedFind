import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ColorPalette, lightPalette, darkPalette, ThemeMode } from './tokens';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ColorPalette;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  theme: lightPalette,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (systemColorScheme) {
      setMode(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = mode === 'light' ? lightPalette : darkPalette;

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
