import { useEffect, useState } from 'react';
import { Code2, Copy, Eye, ArrowRight, Share2 } from 'lucide-react';
import { useLanguages, type Snippet, getLanguageLabel, getLanguageIcon } from '@/app/lib/data';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';
import { useSettings } from '@/app/context/SettingsContext';

export function HomePage() {
  const LANGS = useLanguages();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const showStats = settings.show_stats !== false;
  const parts = settings.site_title.trim().split(/[\s-]+/).filter(Boolean);
  const line1 = (parts[0] || '').toUpperCase();
  const line2 = parts.slice(1).join(' ').toUpperCase();

  useEffect(() => {
    api<Snippet[]>('/snippets?limit=6')
      .then((data) => setSnippets(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative z-10 pt-16">
      {/* Hero Section */}
      <section className="pt-24 pb-12 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 gray-shader-radial pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/60">Kod paylas. Kopyala. Calistir. Sifir hata.</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 animate-fade-in-up will-fade">
            <span className="block text-glow">{line1}</span>
            {line2 && <span className="block title-gradient">{line2}</span>}
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 animate-fade-in-up will-fade" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Kodlarini dunyayla paylas. Tek tikla kopyala, IDE'ne yapistir ve calistir.
            Temiz, hatasiz, hazir kod.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up will-fade" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <button
              onClick={() => navigate('/snippets')}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-semibold text-lg hover:scale-105 transition-all duration-300 btn-press animate-pulse-glow"
            >
              Kodlara Goz At
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 px-8 py-4 rounded-xl glass text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300 btn-press"
            >
              <Share2 className="w-5 h-5" />
              Paylasmaya Basla
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
        <div className="inline-grid grid-cols-3 gap-6 sm:gap-10 mt-12 px-6 py-4 rounded-2xl glass-light animate-fade-in-up will-fade relative" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <Stat icon={<Code2 className="w-6 h-6" />} value="18+" label="Dil" />
          <Stat icon={<Copy className="w-6 h-6" />} value="1-Tik" label="Kopyala" />
          <Stat icon={<Eye className="w-6 h-6" />} value="0" label="Hata" />
        </div>
        )}
      </section>

      {/* Recent Snippets */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold">Son Kodlar</h2>
            <button
              onClick={() => navigate('/snippets')}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium btn-press"
            >
              Tumunu Gor
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl glass-light shimmer" />
              ))}
            </div>
          ) : snippets.length === 0 ? (
            <div className="text-center py-20 glass-gray rounded-2xl">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-white/20" />
              <p className="text-white/40 text-lg">Henuz kod paylasilmadi. Ilk sen ol!</p>
              <button
                onClick={() => navigate('/signup')}
                className="mt-6 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-all btn-press"
              >
                Basla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {snippets.map((snippet, i) => (
                <SnippetCard key={snippet.id} snippet={snippet} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-white/30">{icon}</div>
      <div className="text-xl sm:text-2xl font-bold text-glow-sm">{value}</div>
      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function SnippetCard({ snippet, delay }: { snippet: Snippet; delay: number }) {
  const firstLine = snippet.code.split('\n').find((l) => l.trim()) || '';
  const preview = firstLine.trim().slice(0, 40);
  return (
    <button
      onClick={() => navigate(`/snippets/${snippet.id}`)}
      className="group glass-gray rounded-xl p-4 text-left hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up will-fade btn-press min-w-0 w-full"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-xs min-w-0">
          <span>{getLanguageIcon(snippet.language)}</span>
          <span className="text-white/60 truncate">{getLanguageLabel(snippet.language)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/30 shrink-0">
          <Eye className="w-3 h-3" />
          {snippet.views}
        </div>
      </div>
      <h3 className="text-sm font-bold mb-2 truncate">{snippet.title}</h3>
      <div className="flex items-center gap-2 text-xs font-mono bg-black/40 rounded-md px-2.5 py-1.5 min-w-0">
        <span className="text-white/50 truncate flex-1">{preview}{(snippet.code.length > preview.length) ? '....' : ''}</span>
        <span className="text-white/70 shrink-0 group-hover:translate-x-1 transition-transform">-&gt;</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] text-white/30 gap-2">
        <span className="truncate">@{snippet.profiles?.username || 'bilinmiyor'}</span>
        <span className="shrink-0">{new Date(snippet.created_at).toLocaleDateString('tr-TR')}</span>
      </div>
    </button>
  );
}
