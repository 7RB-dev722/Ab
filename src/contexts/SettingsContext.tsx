import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { settingsService } from '../lib/supabase';

interface Settings {
  [key: string]: string;
}

const defaultSettings = {
  discord_url: 'https://discord.gg/sY5EcUVjeA',
  whatsapp_url: 'https://api.whatsapp.com/send?phone=9647832941204',
  telegram_url: 'https://t.me/+UbDn_RQ7pBw4MjRi',
  telegram_purchase_url: '',
  site_name: 'Cheatloop',
  site_logo_url: '/cheatloop copy.png',
  site_favicon_url: '/cheatloop copy.png', // Added default favicon
  hero_title: 'Dominate the Game',
  hero_subtitle: 'Professional gaming tools for PUBG Mobile & Call of Duty Mobile. Safe, reliable, and designed for competitive players.',
  feature_1_title: '100% Safe',
  feature_1_desc: 'Protected from bans',
  feature_2_title: 'Precision Tools',
  feature_2_desc: 'Advanced aimbot & ESP',
  feature_3_title: 'Instant Access',
  feature_3_desc: 'Download immediately',
  footer_copyright: '© 2025 Cheatloop. All rights reserved. Use responsibly and at your own risk.',
  show_whatsapp_button: 'true',
  show_telegram_button: 'true',
  product_card_note: 'After purchase, contact us to get your key and product',
  show_all_whatsapp_buttons: 'true',
  show_product_card_note: 'true',
  show_i_have_paid_button: 'true',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => void;
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedSettings = await settingsService.getSettings();
      // Merge fetched settings with defaults to ensure all keys are present
      setSettings(prev => ({ ...defaultSettings, ...fetchedSettings }));
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
      setError("Could not load site settings. Using default values.");
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
