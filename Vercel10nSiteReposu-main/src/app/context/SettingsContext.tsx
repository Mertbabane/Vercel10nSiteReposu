import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from '@/app/lib/api';
import type { SiteSettings } from '@/app/lib/data';
import { applyTheme, DEFAULT_APPEARANCE } from '@/app/lib/theme';

const FALLBACK: SiteSettings = {
  id: 1,
  background_video_url: null,
  site_title: '10n-Girls',
  site_description: 'Kod paylaş, kopyala, çalıştır',
  show_stats: true,
  video_blur: 0,
  video_rotation: 0,
  video_flip_h: false,
  video_flip_v: false,
  video_fit: true,
  ...DEFAULT_APPEARANCE,
  created_at: '',
  updated_at: '',
};

type Ctx = { settings: SiteSettings; loaded: boolean; refresh: () => Promise<void> };
const SettingsContext = createContext<Ctx>({ settings: FALLBACK, loaded: false, refresh: async () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api<SiteSettings | null>('/site-settings');
      if (data) setSettings({ ...FALLBACK, ...data });
    } catch {
      /* varsayılan ayarlar kullanılır */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    applyTheme(settings);
    document.title = settings.site_title || '10n-Girls';
    const meta = document.querySelector('meta[name="description"]');
    if (meta && settings.site_description) meta.setAttribute('content', settings.site_description);
  }, [settings]);

  return <SettingsContext.Provider value={{ settings, loaded, refresh }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
