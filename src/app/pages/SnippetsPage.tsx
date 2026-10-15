import { useEffect, useState } from 'react';
import { Code2, Search, Eye } from 'lucide-react';
import { useLanguages, type Snippet, type Language, getLanguageLabel, getLanguageIcon } from '@/app/lib/data';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';

export function SnippetsPage() {
  const LANGS = useLanguages();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedLang !== 'all') params.set('language', selectedLang);
    if (search.trim()) params.set('q', search.trim());
    api<Snippet[]>(`/snippets?${params.toString()}`)
      .then((data) => setSnippets(data || []))
      .catch(() => setSnippets([]))
      .finally(() => setLoading(false));
  }, [search, selectedLang]);

  return (
    <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 animate-fade-in-up will-fade">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-glow-sm">Tum Kodlar</h1>
          <p className="text-white/40 text-lg">Topluluktan kodlar. Kopyala, yapistir, calistir.</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up will-fade" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setLoading(true); }}
              placeholder="Kod ara..."
              className="w-full pl-11 pr-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
          <select
            value={selectedLang}
            onChange={(e) => { setSelectedLang(e.target.value); setLoading(true); }}
            className="px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20 transition-all cursor-pointer"
          >
            <option value="all" className="bg-ink-900">Tum Diller</option>
            {LANGS.map((lang: Language) => (
              <option key={lang.value} value={lang.value} className="bg-ink-900">
                {lang.icon} {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-2xl glass-light shimmer" />
            ))}
          </div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-20 glass-gray rounded-2xl">
            <Code2 className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">Kod bulunamadi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {snippets.map((snippet, i) => (
              <SnippetCard key={snippet.id} snippet={snippet} delay={i * 0.03} />
            ))}
          </div>
        )}
      </div>
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
