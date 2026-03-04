import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Mode = 'light' | 'dark';

// Color themes - these define the accent/primary colors
export type ColorTheme = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' | 'cyan';

export const colorThemes: Record<ColorTheme, { name: string; primary: string; gradient: string }> = {
  violet: {
    name: 'Yellow',
    primary: '#facc15', // yellow-400
    gradient: 'from-yellow-400 to-yellow-500',
  },
  blue: {
    name: 'Blue',
    primary: '#2563eb', // blue-600
    gradient: 'from-blue-600 to-blue-700',
  },
  emerald: {
    name: 'Green',
    primary: '#16a34a', // green-600
    gradient: 'from-green-600 to-green-700',
  },
  rose: {
    name: 'Pink',
    primary: '#ec4899', // pink-500
    gradient: 'from-pink-500 to-pink-600',
  },
  amber: {
    name: 'Orange',
    primary: '#ea580c', // orange-600
    gradient: 'from-orange-600 to-orange-700',
  },
  cyan: {
    name: 'Cyan',
    primary: '#0891b2', // cyan-600
    gradient: 'from-cyan-600 to-cyan-700',
  },
};

interface ThemeContextType {
  mode: Mode;
  colorTheme: ColorTheme;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  // Legacy support
  theme: Mode;
  toggleTheme: () => void;
  setTheme: (theme: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useLocalStorage<Mode>('theme', 'light');
  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>('color-theme', 'violet');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
  }, [mode]);

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all color theme classes
    Object.keys(colorThemes).forEach((theme) => {
      root.classList.remove(`theme-${theme}`);
    });
    // Add current color theme class
    root.classList.add(`theme-${colorTheme}`);

    // Set CSS custom properties for the theme
    const themeConfig = colorThemes[colorTheme];
    root.style.setProperty('--theme-primary', themeConfig.primary);
  }, [colorTheme]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colorTheme,
        toggleMode,
        setMode,
        setColorTheme,
        // Legacy support
        theme: mode,
        toggleTheme: toggleMode,
        setTheme: setMode,
      }}
    >
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
