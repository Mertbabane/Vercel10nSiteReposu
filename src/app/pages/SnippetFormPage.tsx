import { cleanCode } from '@/app/lib/code';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !snippetId) return;
    api<{ title: string; description: string | null; language: string; code: string } | null>(`/snippets/${snippetId}`)
      .then((data) => {
        if (data) {
          setTitle(data.title);
          setDescription(data.description || '');
          setLanguage(data.language);
          setCode(data.code);
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
          body: JSON.stringify({ title, description, language, code }),
        });
        navigate(`/snippets/${data.id}`);
      } else if (mode === 'edit' && snippetId) {
        await api(`/snippets/${snippetId}`, {
          method: 'PUT',
          body: JSON.stringify({ title, description, language, code }),
        });
        navigate(`/snippets/${snippetId}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
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
