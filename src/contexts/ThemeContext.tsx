'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ColorTheme = 'ocean' | 'emerald' | 'purple' | 'sunset' | 'rose' | 'slate';

export const colorThemes: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'ocean', name: 'Ocean Blue', color: '#0ea5e9' },
  { id: 'emerald', name: 'Emerald Green', color: '#10b981' },
  { id: 'purple', name: 'Royal Purple', color: '#a855f7' },
  { id: 'sunset', name: 'Sunset Orange', color: '#f97316' },
  { id: 'rose', name: 'Rose Pink', color: '#ec4899' },
  { id: 'slate', name: 'Slate Gray', color: '#64748b' },
];

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('ocean');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme;

    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    }

    if (savedColorTheme) {
      setColorThemeState(savedColorTheme);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.setAttribute('data-theme', colorTheme);
      localStorage.setItem('colorTheme', colorTheme);
    }
  }, [colorTheme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, toggleTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
