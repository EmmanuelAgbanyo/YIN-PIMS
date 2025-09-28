
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface AppSettings {
  theme: Theme;
  yinLogo: string | null;
}

interface AppSettingsContextType {
  settings: AppSettings;
  toggleTheme: () => void;
  setYinLogo: (logo: string | null) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    yinLogo: null,
  });

  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    
    setSettings(s => ({
        ...s,
        theme: initialTheme,
    }));
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const toggleTheme = useCallback(() => {
    setSettings(s => ({...s, theme: s.theme === 'light' ? 'dark' : 'light'}));
  }, []);
  
  const setYinLogo = useCallback((logo: string | null) => {
    setSettings(s => ({...s, yinLogo: logo}));
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, toggleTheme, setYinLogo }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
