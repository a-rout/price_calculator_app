import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  colors: {
    background: string;
    surface: string;
    surfaceVariant: string;
    primary: string;
    primaryVariant: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    success: string;
    warning: string;
    error: string;
    shadow: string;
    overlay: string;
    onPrimary: string;
    onSurface: string;
    outline: string;
    // New gradient-ready colors
    gradientStart: string;
    gradientMiddle: string;
    gradientEnd: string;
    cardGlass: string;
    cardGlassBorder: string;
    favorite: string;
  };
  gradients: {
    primary: readonly [string, string, ...string[]];
    secondary: readonly [string, string, ...string[]];
    accent: readonly [string, string, ...string[]];
    background: readonly [string, string, ...string[]];
    card: readonly [string, string, ...string[]];
  };
  isDark: boolean;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    fontFamily: {
      regular: string;
      medium: string;
      semiBold: string;
      bold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
  };
  animation: {
    fast: number;
    normal: number;
    slow: number;
  };
}

const lightTheme: Theme = {
  colors: {
    background: '#F8FAFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    primary: '#6366F1',
    primaryVariant: '#4F46E5',
    secondary: '#10B981',
    accent: '#8B5CF6',
    text: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    onPrimary: '#FFFFFF',
    onSurface: '#1E293B',
    outline: '#CBD5E1',
    // New colors
    gradientStart: '#6366F1',
    gradientMiddle: '#8B5CF6',
    gradientEnd: '#A855F7',
    cardGlass: 'rgba(255, 255, 255, 0.85)',
    cardGlassBorder: 'rgba(255, 255, 255, 0.5)',
    favorite: '#F59E0B',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
    secondary: ['#10B981', '#14B8A6', '#06B6D4'] as const,
    accent: ['#8B5CF6', '#A855F7', '#D946EF'] as const,
    background: ['#FDFBF7', '#F3F4F6', '#E5E7EB'] as const, // Warmer, cleaner neutral
    card: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] as const, // More opaque for glass effect
  },
  isDark: false,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

const darkTheme: Theme = {
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    primary: '#818CF8',
    primaryVariant: '#6366F1',
    secondary: '#34D399',
    accent: '#A78BFA',
    text: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    border: '#475569',
    borderLight: '#334155',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    onPrimary: '#1E1B4B',
    onSurface: '#F8FAFC',
    outline: '#64748B',
    // New colors
    gradientStart: '#818CF8',
    gradientMiddle: '#A78BFA',
    gradientEnd: '#C084FC',
    cardGlass: 'rgba(30, 41, 59, 0.85)',
    cardGlassBorder: 'rgba(255, 255, 255, 0.1)',
    favorite: '#FBBF24',
  },
  gradients: {
    primary: ['#6366F1', '#8B5CF6', '#A855F7'] as const,
    secondary: ['#10B981', '#14B8A6', '#06B6D4'] as const,
    accent: ['#8B5CF6', '#A78BFA', '#C084FC'] as const,
    background: ['#0F172A', '#1E1B4B', '#312E81'] as const,
    card: ['rgba(30, 41, 59, 0.9)', 'rgba(30, 41, 59, 0.7)'] as const,
  },
  isDark: true,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@price_calculator_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDark(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
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