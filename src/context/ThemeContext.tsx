import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../theme';

const THEME_KEY = 'anmat.theme';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: typeof lightColors;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setMode(stored);
      } else {
        setMode('system');
      }
      setLoaded(true);
    });
  }, [systemScheme]);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    await SecureStore.setItemAsync(THEME_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const resolved = mode === 'system' ? systemScheme : mode;
    const next: ThemeMode = resolved === 'dark' ? 'light' : 'dark';
    setMode(next);
    await SecureStore.setItemAsync(THEME_KEY, next);
  }, [mode, systemScheme]);

  const resolvedMode = mode === 'system' ? systemScheme : mode;
  const colors = resolvedMode === 'dark' ? darkColors : lightColors;
  const isDark = resolvedMode === 'dark';

  const value = useMemo(
    () => ({ mode, colors, isDark, toggleTheme, setThemeMode }),
    [mode, colors, isDark, toggleTheme, setThemeMode],
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
