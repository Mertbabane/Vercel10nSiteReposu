import { useEffect, useState } from 'react';
import { Palette, Save, RotateCcw, Type, Layers, Image as ImageIcon } from 'lucide-react';
import type { SiteSettings } from '@/app/lib/data';
import { ColorPicker } from '@/app/components/ColorPicker';
import {
  ACCENT_PRESETS, BG_PRESETS, SHADER_PRESETS, DEFAULT_APPEARANCE,
  applyTheme, shaderBackground,
} from '@/app/lib/theme';

const STYLES: { value: SiteSettings['shader_style']; label: string; hint: string }[] = [
  { value: 'gradient', label: 'Gradyan', hint: 'Yukarıdan aşağıya yumuşak geçiş' },
  { value: 'radial', label: 'Merkez', hint: 'Kenarlar koyu, orta açık' },
  { value: 'solid', label: 'Düz', hint: 'Tüm ekranı eşit kaplar' },
  { value: 'none', label: 'Kapalı', hint: 'Shader yok' },
];

export function AppearanceTab({ settings, onSave }: { settings: SiteSettings; onSave: (data: Partial<SiteSettings>) => void }) {
  const [title, setTitle] = useState(settings.site_title || '');
  const [desc, setDesc] = useState(settings.site_description || '');
  const [accent, setAccent] = useState(settings.accent_color || DEFAULT_APPEARANCE.accent_color);
  const [bg, setBg] = useState(settings.bg_color || DEFAULT_APPEARANCE.bg_color);
  const [shaderColor, setShaderColor] = useState(settings.shader_color || DEFAULT_APPEARANCE.shader_color);
  const [shaderOpacity, setShaderOpacity] = useState(settings.shader_opacity ?? DEFAULT_APPEARANCE.shader_opacity);
  const [shaderStyle, setShaderStyle] = useState<SiteSettings['shader_style']>(settings.shader_style || 'gradient');

  const [imgPos, setImgPos] = useState<NonNullable<SiteSettings['snippet_image_position']>>(settings.snippet_image_position || 'below');

  const draft = { accent_color: accent, bg_color: bg, shader_color: shaderColor, shader_opacity: shaderOpacity, shader_style: shaderStyle };

  // Renkleri kaydetmeden önce sitede canlı göster; sekmeden çıkınca kayıtlı hale dön.
  useEffect(() => {
    const ok = (h: string) => /^#[0-9a-fA-F]{6}$/.test(h);
    if (ok(accent) && ok(bg) && ok(shaderColor)) applyTheme(draft);
  }, [accent, bg, shaderColor, shaderOpacity, shaderStyle]);
  useEffect(() => () => applyTheme(settings), [settings]);

  const reset = () => {
    setAccent(DEFAULT_APPEARANCE.accent_color);
    setBg(DEFAULT_APPEARANCE.bg_color);
    setShaderColor(DEFAULT_APPEARANCE.shader_color);
    setShaderOpacity(DEFAULT_APPEARANCE.shader_opacity);
    setShaderStyle(DEFAULT_APPEARANCE.shader_style);
  };

  const handleSave = () => {
    const hex = /^#[0-9a-fA-F]{6}$/;
    if (!title.trim()) return alert('Site adı boş olamaz.');
    if (!hex.test(accent) || !hex.test(bg) || !hex.test(shaderColor)) {
      return alert('Renk kodları #rrggbb biçiminde olmalı (örn. #ff66cc).');
    }
    onSave({
      site_title: title.trim(),
      site_description: desc,
      accent_color: accent,
      bg_color: bg,
      shader_color: shaderColor,
      shader_opacity: shaderOpacity,
      shader_style: shaderStyle,
      snippet_image_position: imgPos,
    });
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20 transition-all';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Canlı önizleme */}
      <div className="glass-gray rounded-2xl p-4">
        <div className="text-xs text-white/40 mb-2">Canlı önizleme (video üstündeki shader burada örnek bir görselle gösterilir)</div>
        <div className="relative h-44 rounded-xl overflow-hidden border border-white/10" style={{ backgroundColor: bg }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#f472b6 0%,#60a5fa 50%,#4ade80 100%)' }} />
          <div className="absolute inset-0" style={{ background: shaderBackground(draft) }} />
          <div className="relative h-full flex flex-col items-center justify-center gap-3">
            <div className="text-3xl font-extrabold tracking-tight text-glow title-gradient">{title || 'Site Adı'}</div>
            <button type="button" className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-sm">Örnek Buton</button>
          </div>
        </div>
      </div>

      {/* Site adı */}
      <div className="glass-gray rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-bold">Site Adı</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Site adı (üst menü, ana sayfa başlığı, sekme adı)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <p className="text-xs text-white/30 mt-2">İpucu: "10n-Girls" gibi tireli ya da boşluklu adlar ana sayfada iki satıra bölünür.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Kısa açıklama (alt bilgi ve arama motoru)</label>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Renkler */}
      <div className="glass-gray rounded-2xl p-6 space-y-8">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-bold">Renkler</h3>
        </div>
        <ColorPicker
          label="Vurgu rengi"
          hint="Butonlar, açık/kapalı düğmeleri, başlık parlaması ve aktif sekmeler."
          value={accent}
          onChange={setAccent}
          presets={ACCENT_PRESETS}
        />
        <div className="border-t border-white/5 pt-8">
          <ColorPicker
            label="Arka plan rengi"
            hint="Video yokken veya kapalıyken görünen taban renk."
            value={bg}
            onChange={setBg}
            presets={BG_PRESETS}
          />
        </div>
      </div>

      {/* Shader */}
      <div className="glass-gray rounded-2xl p-6 space-y-8">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-bold">Shader (video üstü renk katmanı)</h3>
        </div>
        <div>
          <div className="text-sm font-medium text-white/80 mb-2">Stil</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setShaderStyle(s.value)}
                title={s.hint}
                className={`px-3 py-2.5 rounded-xl text-sm btn-press transition-all ${shaderStyle === s.value ? 'bg-white text-black' : 'glass-light hover:bg-white/10'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex justify-between text-sm font-medium text-white/80 mb-2">
            <span>Yoğunluk</span><span>%{shaderOpacity}</span>
          </label>
          <input type="range" min={0} max={100} value={shaderOpacity} onChange={(e) => setShaderOpacity(Number(e.target.value))} className="w-full accent-white" />
        </div>
        <ColorPicker
          label="Shader rengi"
          hint="Videonun üstüne binen renk. Siyah klasik koyu görünüm verir."
          value={shaderColor}
          onChange={setShaderColor}
          presets={SHADER_PRESETS}
        />
      </div>

      {/* Kod görseli konumu */}
      <div className="glass-gray rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-bold">Kod görseli konumu</h3>
        </div>
        <p className="text-sm text-white/40">Kod paylaşırken eklenen görsel, kod sayfasında nerede görünsün?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['above', 'Kodun üstünde'],
            ['below', 'Kodun altında'],
            ['left', 'Kodun solunda'],
            ['right', 'Kodun sağında'],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setImgPos(v)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all btn-press ${imgPos === v ? 'bg-white text-black' : 'glass-light hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30">Telefonda sol/sağ seçenekleri otomatik olarak alt alta dizilir.</p>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button onClick={reset} type="button" className="flex items-center gap-2 px-5 py-3 rounded-xl glass-light hover:bg-white/10 transition-all btn-press">
          <RotateCcw className="w-4 h-4" /> Varsayılana dön
        </button>
        <button onClick={handleSave} type="button" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-all btn-press">
          <Save className="w-5 h-5" /> Görünümü Kaydet
        </button>
      </div>
    </div>
  );
}
