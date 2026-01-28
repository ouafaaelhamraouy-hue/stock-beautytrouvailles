'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { getTheme } from '@/lib/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  locale?: 'fr' | 'en';
}

const THEME_STORAGE_KEY = 'theme-mode';

export function ThemeProvider({ children, locale = 'en' }: ThemeProviderProps) {
  // Check for system preference (with noSSR to avoid hydration mismatch)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  
  // Initialize with a safe default, then update on mount
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Get saved preference or use system preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      setModeState(saved);
    } else {
      // Use system preference if no saved preference
      setModeState(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]); // Run on mount and when system preference changes

  // Listen for system preference changes (only if no manual preference is set)
  useEffect(() => {
    if (!mounted) return;
    
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (!saved) {
      setModeState(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  // Memoize theme to avoid unnecessary recalculations
  const theme = useMemo(() => getTheme(locale, mode), [locale, mode]);

  // Prevent flash of wrong theme by using a default until mounted
  if (!mounted) {
    return (
      <MuiThemeProvider theme={getTheme(locale, 'light')}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
