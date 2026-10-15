import type { SiteSettings } from './data';

export type Appearance = Pick<
  SiteSettings,
  'accent_color' | 'bg_color' | 'shader_color' | 'shader_opacity' | 'shader_style'
>;

export const DEFAULT_APPEARANCE: Appearance = {
  accent_color: '#ffffff',
  bg_color: '#000000',
  shader_color: '#000000',
  shader_opacity: 50,
  shader_style: 'gradient',
};

export const ACCENT_PRESETS = [
  '#ffffff', '#f472b6', '#c084fc', '#60a5fa', '#22d3ee', '#4ade80', '#facc15', '#fb923c', '#f87171',
];
export const BG_PRESETS = ['#000000', '#0a0a0a', '#0f0a1a', '#0a1020', '#0a1a14', '#1a0a12', '#1a1a1a'];
export const SHADER_PRESETS = ['#000000', '#1e1b4b', '#4c1d95', '#831843', '#7f1d1d', '#064e3b', '#0c4a6e', '#3c3c3c'];

export function hexToRgb(hex: string): [number, number, number] {
  const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#ffffff';
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Shader'ın CSS arka planını üretir (video üstündeki katman). */
export function shaderBackground(a: Appearance): string {
  const [r, g, b] = hexToRgb(a.shader_color);
  const k = Math.max(0, Math.min(100, a.shader_opacity)) / 100;
  const c = (alpha: number) => `rgba(${r},${g},${b},${(alpha * k).toFixed(3)})`;
  switch (a.shader_style) {
    case 'none':
      return 'transparent';
    case 'solid':
      return c(1);
    case 'radial':
      return `radial-gradient(ellipse at center, ${c(0)} 0%, ${c(1.4)} 100%)`;
    default:
      return `linear-gradient(to bottom, ${c(0.8)} 0%, ${c(0.4)} 50%, ${c(1.2)} 100%)`;
  }
}

/** Renkleri sitenin tamamına CSS değişkeni olarak uygular. */
export function applyTheme(a: Appearance) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const accent = hexToRgb(a.accent_color);
  const shader = hexToRgb(a.shader_color);
  const glow = luminance(shader) < 30 ? [60, 60, 60] : shader;
  root.style.setProperty('--accent', accent.join(' '));
  root.style.setProperty('--accent-contrast', luminance(accent) > 140 ? '0 0 0' : '255 255 255');
  root.style.setProperty('--site-bg', a.bg_color);
  root.style.setProperty('--glow-rgb', glow.join(' '));
}
