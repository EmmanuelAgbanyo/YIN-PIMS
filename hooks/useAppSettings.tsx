
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
    try {
      const storedTheme = localStorage.getItem('pims-theme') as Theme | null;
      const storedLogo = localStorage.getItem('pims-yin-logo');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
      
      setSettings({
          theme: initialTheme,
          yinLogo: storedLogo
      });
    } catch (error) {
        console.error("Could not access localStorage. Settings will not be persisted.", error);
    }
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
        localStorage.setItem('pims-theme', settings.theme);
        
        if (settings.yinLogo) {
          localStorage.setItem('pims-yin-logo', settings.yinLogo);
        } else {
          localStorage.removeItem('pims-yin-logo');
        }
    } catch (error) {
        console.error("Could not access localStorage. Settings will not be persisted.", error);
    }
  }, [settings]);

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