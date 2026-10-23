import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const DEFAULT_DARK_COLOR = '#000000';
const STORAGE_KEY = 'thefinder-theme';

function normalizeColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value.toLowerCase() : DEFAULT_DARK_COLOR;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(`${STORAGE_KEY}-mode`) || 'light');
  const [darkColor, setDarkColorState] = useState(() => {
    const saved = normalizeColor(localStorage.getItem(`${STORAGE_KEY}-color`));
    return saved === '#1c282e' ? DEFAULT_DARK_COLOR : saved;
  });

  const setTheme = useCallback((value) => {
    const safeValue = value === 'dark' ? 'dark' : 'light';
    setThemeState(safeValue);
    localStorage.setItem(`${STORAGE_KEY}-mode`, safeValue);
  }, []);
  const setDarkColor = useCallback((value) => {
    const safeValue = normalizeColor(value);
    setDarkColorState(safeValue);
    localStorage.setItem(`${STORAGE_KEY}-color`, safeValue);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--dark-background', darkColor);
    document.documentElement.style.colorScheme = theme;
  }, [theme, darkColor]);

  const value = useMemo(() => ({ theme, setTheme, darkColor, setDarkColor }), [theme, setTheme, darkColor, setDarkColor]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}

export { DEFAULT_DARK_COLOR };
