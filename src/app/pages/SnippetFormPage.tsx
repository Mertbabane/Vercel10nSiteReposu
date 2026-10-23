import { cleanCode } from '@/app/lib/code';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react';
import { useLanguages, type Language } from '@/app/lib/data';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';

export function SnippetFormPage({ snippetId, mode }: { snippetId?: string; mode: 'new' | 'edit' }) {
  const LANGS = useLanguages();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !snippetId) return;
    api<{ title: string; description: string | null; language: string; code: string; image_url?: string | null } | null>(`/snippets/${snippetId}`)
      .then((data) => {
        if (data) {
          setTitle(data.title);
          setDescription(data.description || '');
          setLanguage(data.language);
          setCode(data.code);
          setImageUrl(data.image_url || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode, snippetId]);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading]);

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim() || !code.trim()) {
      setError('Baslik ve kod zorunlu');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === 'new') {
        const data = await api<{ id: string }>('/snippets', {
          method: 'POST',
          body: JSON.stringify({ title, description, language, code, image_url: imageUrl }),
        });
        navigate(`/snippets/${data.id}`);
      } else if (mode === 'edit' && snippetId) {
        await api(`/snippets/${snippetId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, description, language, code, image_url: imageUrl }),
        });
        navigate(`/snippets/${snippetId}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Lütfen bir görsel dosyası seç.');
    setImgBusy(true);
    setError(null);
    try {
      setImageUrl(await compressImage(file));
    } catch {
      setError('Görsel okunamadı.');
    } finally {
      setImgBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 pt-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="h-96 rounded-2xl glass-light shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/snippets')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 animate-fade-in btn-press"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-glow-sm animate-fade-in-up will-fade">
          {mode === 'new' ? 'Kod Paylas' : 'Kodu Duzenle'}
        </h1>

        <div className="glass-gray rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in-up will-fade" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Baslik</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Orn: Python Web Scraper"
              className="w-full px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Aciklama (istege bagli)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu kod ne yapiyor?"
              className="w-full px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Dil</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20 transition-all cursor-pointer"
            >
              {LANGS.map((lang: Language) => (
                <option key={lang.value} value={lang.value} className="bg-ink-900">
                  {lang.icon} {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Kod</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onPaste={(e) => {
                const ta = e.currentTarget;
                const text = cleanCode(e.clipboardData.getData('text/plain'));
                e.preventDefault();
                const next = code.slice(0, ta.selectionStart) + text + code.slice(ta.selectionEnd);
                const pos = ta.selectionStart + text.length;
                setCode(next);
                requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Tab') return;
                e.preventDefault();
                const ta = e.currentTarget;
                const s = ta.selectionStart;
                setCode(code.slice(0, s) + '    ' + code.slice(ta.selectionEnd));
                requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              wrap="off"
              placeholder="Kodunu buraya yapistir..."
              rows={16}
              className="w-full px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all font-mono text-sm resize-y"
            />
            <p className="text-xs text-white/30 mt-2">
              Ipucu: Kodunu IDE'nden direkt yapistir. Format korunacak.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Görsel (istege bagli)</label>
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="Kod görseli" className="max-h-64 rounded-xl border border-white/10" />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  aria-label="Görseli kaldır"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center btn-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl glass-light border border-dashed border-white/15 cursor-pointer hover:bg-white/10 transition-all text-white/50">
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">{imgBusy ? 'Hazırlanıyor...' : 'Görsel seç'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
              </label>
            )}
            <p className="text-xs text-white/30 mt-2">
              Kodun neye ihtiyacı olduğunu gösteren bir ekran görüntüsü ekleyebilirsin (gerekli dosyalar, kurulum, sonuç vb.).
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => navigate('/snippets')}
              className="px-6 py-3 rounded-xl glass-light hover:bg-white/10 transition-all font-medium btn-press"
            >
              Iptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-all disabled:opacity-50 btn-press"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Kaydediliyor...' : mode === 'new' ? 'Yayinla' : 'Guncelle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Görseli tarayıcıda küçültüp sıkıştırır (en fazla 1600px, JPEG/PNG) ve data URL döner. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let q = 0.85;
        let out = canvas.toDataURL('image/jpeg', q);
        while (out.length > 2_500_000 && q > 0.4) {
          q -= 0.15;
          out = canvas.toDataURL('image/jpeg', q);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
