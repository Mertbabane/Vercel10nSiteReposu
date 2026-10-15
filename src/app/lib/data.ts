import { createElement, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { api } from './api';

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Snippet = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'username'> | null;
};

export type SiteSettings = {
  id: number;
  background_video_url: string | null;
  site_title: string;
  site_description: string | null;
  show_stats: boolean;
  video_blur: number;
  video_rotation: number;
  video_flip_h: boolean;
  video_flip_v: boolean;
  video_fit: boolean;
  accent_color: string;
  bg_color: string;
  shader_color: string;
  shader_opacity: number;
  shader_style: 'none' | 'gradient' | 'radial' | 'solid';
  created_at: string;
  updated_at: string;
};

export type Language = { value: string; label: string; icon: string; icon_url?: string | null; sort_order?: number };

const DEFAULTS: Language[] = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'text', label: 'Düz Metin', icon: '📄' },
];

// Live language list (loaded from the database, editable by admins).
export let LANGUAGES: Language[] = DEFAULTS;
let version = 0;
let loaded = false;
const listeners = new Set<() => void>();

export async function reloadLanguages() {
  try {
    const data = await api<Language[]>('/languages');
    if (data?.length) {
      LANGUAGES = data.map((l) => ({ value: l.value, label: l.label, icon: l.icon || '', icon_url: l.icon_url ?? null, sort_order: l.sort_order ?? 0 }));
      version++;
      listeners.forEach((f) => f());
    }
  } catch {
    /* varsayılan dil listesi kullanılır */
  }
}

export function useLanguages(): Language[] {
  useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  useEffect(() => {
    if (!loaded) { loaded = true; reloadLanguages(); }
  }, []);
  return LANGUAGES;
}

export function getLanguageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label || value;
}

export function getLanguageIcon(value: string): ReactNode {
  const l = LANGUAGES.find((x) => x.value === value);
  if (l?.icon_url) {
    return createElement('img', { src: l.icon_url, alt: l.label, className: 'inline-block w-4 h-4 object-contain align-[-2px]' });
  }
  return l?.icon || '📄';
}

/** Dosya yükler ve herkese açık bağlantısını döner (sadece admin). */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (folder === 'icons') {
    // Küçük görseller doğrudan veritabanında saklanır (data URL).
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error('Dosya okunamadı.'));
      r.readAsDataURL(file);
    });
  }
  // Vercel Blob kütüphanesi sunucunun gerçek hata mesajını gizler ("Failed to retrieve the client token").
  // Bu yüzden önce Blob'un bağlı olup olmadığını sorup anlaşılır bir mesaj veriyoruz.
  const status = await fetch('/api/admin/blob-status', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  if (status && status.enabled === false) {
    throw new Error(
      'Vercel Blob bağlı değil. Vercel > projen > Storage > Blob oluştur ve projeye bağla (BLOB_READ_WRITE_TOKEN otomatik eklenir), sonra yeniden deploy et. O zamana kadar video bağlantısı (URL) alanını kullanabilirsin.',
    );
  }
  const { upload } = await import('@vercel/blob/client');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  try {
    const blob = await upload(`${folder}/${Date.now()}.${ext}`, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/blob-upload',
      contentType: file.type || (folder === 'videos' ? 'video/mp4' : undefined),
    });
    return blob.url;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (/client token/i.test(msg)) {
      throw new Error(
        'Yükleme izni alınamadı. Çıkış yapıp admin hesabınla tekrar giriş yap; sorun sürerse Vercel > Logs içinde /api/admin/blob-upload kaydına bak.',
      );
    }
    throw err;
  }
}
