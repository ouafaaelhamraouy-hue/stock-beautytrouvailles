'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { getTheme } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedThemeMode = 'light' | 'dark';

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
  initialMode?: ThemeMode;
  initialResolvedMode?: ResolvedThemeMode;
}

const THEME_STORAGE_KEY = 'theme-mode';

export function ThemeProvider({ children, locale = 'en', initialMode, initialResolvedMode }: ThemeProviderProps) {
  // Check for system preference (with noSSR to avoid hydration mismatch)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? 'system');
  const [resolvedMode, setResolvedMode] = useState<ResolvedThemeMode>(() => {
    if (initialMode === 'light' || initialMode === 'dark') return initialMode;
    if (initialResolvedMode === 'light' || initialResolvedMode === 'dark') return initialResolvedMode;
    return 'light';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial mode from storage if no server-provided mode
  useEffect(() => {
    if (initialMode) return;
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      setModeState(saved);
    }
  }, [initialMode]);

  useEffect(() => {
    if (!mounted) return;
    const nextResolved: ResolvedThemeMode =
      mode === 'system' ? (prefersDarkMode ? 'dark' : 'light') : mode;
    setResolvedMode(nextResolved);
    document.cookie = `theme-resolved=${nextResolved}; path=/; max-age=31536000; SameSite=Lax`;
  }, [mode, prefersDarkMode, mounted]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
      document.cookie = `${THEME_STORAGE_KEY}=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
      if (newMode === 'light' || newMode === 'dark') {
        document.cookie = `theme-resolved=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  };

  const toggleMode = () => {
    const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(nextMode);
  };

  // Memoize theme to avoid unnecessary recalculations
  const theme = useMemo(() => getTheme(locale, resolvedMode), [locale, resolvedMode]);
  const fallbackTheme = useMemo(() => getTheme(locale, resolvedMode), [locale, resolvedMode]);

  // Sync theme to document and browser UI
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.dataset.theme = resolvedMode;
    root.style.colorScheme = resolvedMode;

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedMode === 'dark' ? '#0F172A' : '#F9FAFB');
    }

    root.classList.add('theme-transition');
    const timeoutId = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [resolvedMode, mounted]);

  // Prevent flash of wrong theme by using a default until mounted
  if (!mounted && !initialMode) {
    return (
      <MuiThemeProvider theme={fallbackTheme}>
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
