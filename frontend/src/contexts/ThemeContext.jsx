import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('themeMode') || 'dark';
    } catch {
    }
  });

  const [activeTheme, setActiveTheme] = useState('dark');

  useEffect(() => {
    const applyTheme = () => {
      let resolved = themeMode;
      if (themeMode === 'system') {
        resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      setActiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
      try {
        localStorage.setItem('themeMode', themeMode);
        localStorage.setItem('theme', resolved);
      } catch {}
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener?.('change', listener);
      return () => mediaQuery.removeEventListener?.('change', listener);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        themeMode,
        setTheme,
        toggleTheme,
        isDark: activeTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);