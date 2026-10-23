import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Calendar, Edit, Trash2 } from 'lucide-react';
import { useLanguages, type Snippet, getLanguageLabel, getLanguageIcon } from '@/app/lib/data';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';
import { cleanCode } from '@/app/lib/code';
import { CopyButton } from '@/app/components/CopyButton';
import { useSettings } from '@/app/context/SettingsContext';

export function SnippetDetailPage({ id }: { id: string }) {
  const LANGS = useLanguages();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    api<Snippet | null>(`/snippets/${id}`)
      .then(setSnippet)
      .catch(() => {})
      .finally(() => setLoading(false));

    api(`/snippets/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  const handleDelete = async () => {
    if (!snippet || !user) return;
    if (!confirm('Bu kodu silmek istedigine emin misin?')) return;

    try {
      await api(`/snippets/${id}`, { method: 'DELETE' });
      navigate('/snippets');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="h-80 rounded-2xl glass-light shimmer" />
        </div>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="relative z-10 pt-24 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Kod bulunamadi</h1>
          <button onClick={() => navigate('/snippets')} className="px-6 py-3 rounded-xl glass hover:bg-white/10 transition-all btn-press">
            Kodlara Don
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === snippet.user_id;
  const canManage = isOwner || isAdmin;

  return (
    <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/snippets')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 animate-fade-in btn-press"
        >
          <ArrowLeft className="w-5 h-5" />
          Kodlara Don
        </button>

        {/* Header */}
        <div className="glass-gray rounded-2xl p-6 sm:p-8 mb-6 animate-fade-in-up will-fade">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 text-sm font-medium">
                  <span>{getLanguageIcon(snippet.language)}</span>
                  {getLanguageLabel(snippet.language)}
                </span>
                <span className="flex items-center gap-1 text-sm text-white/30">
                  <Eye className="w-4 h-4" />
                  {snippet.views} goruntulenme
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-glow-sm break-words">{snippet.title}</h1>
              {snippet.description && (
                <p className="text-white/50 text-lg leading-relaxed">{snippet.description}</p>
              )}
            </div>
            {canManage && (
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/snippets/edit/${snippet.id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg glass-light hover:bg-white/10 transition-all text-sm btn-press"
                >
                  <Edit className="w-4 h-4" />
                  Duzenle
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm border border-red-500/20 btn-press"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5 text-sm text-white/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => snippet.profiles?.username && navigate(`/profile/${snippet.profiles.username}`)}
                className="flex items-center gap-2 hover:text-white transition-colors btn-press"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-xs font-bold">
                  {snippet.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                @{snippet.profiles?.username || 'bilinmiyor'}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(snippet.created_at).toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>

        {(() => {
          const pos = settings.snippet_image_position || 'below';
          const side = pos === 'left' || pos === 'right';
          const imageBlock = snippet.image_url ? (
            <div
              className={`block glass-gray rounded-2xl p-3 animate-fade-in-up will-fade ${side ? 'lg:w-80 shrink-0 self-start' : ''}`}
              style={{ animationDelay: '0.15s', opacity: 0 }}
            >
              <img src={snippet.image_url} alt={`${snippet.title} görseli`} className="w-full rounded-xl" loading="lazy" />
            </div>
          ) : null;
          return (
            <div className={side ? `flex flex-col gap-6 ${pos === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'}` : 'flex flex-col gap-6'}>
              {(pos === 'above' || pos === 'left' || pos === 'right') && imageBlock}
        <div className="glass-gray rounded-2xl overflow-hidden animate-fade-in-up will-fade flex-1 min-w-0" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <span className="text-sm font-mono text-white/40 ml-2">{snippet.language}</span>
            </div>
            <CopyButton text={snippet.code} />
          </div>
          <div className="relative">
            <pre
              onCopy={(e) => {
                const sel = window.getSelection()?.toString();
                if (!sel) return;
                e.preventDefault();
                e.clipboardData.setData('text/plain', cleanCode(sel));
              }}
              className="p-4 sm:p-6 text-sm font-mono leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
              <code className="text-white/80 whitespace-pre" style={{ tabSize: 4 }}>{cleanCode(snippet.code)}</code>
            </pre>
          </div>
        </div>

              {pos === 'below' && imageBlock}
            </div>
          );
        })()}

        {/* Copy hint */}
        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <p className="text-white/30 text-sm">
            <span className="text-white/50 font-medium">Kopyala</span>'ya tikla, kodu kopyala ve IDE'ne yapistir
          </p>
        </div>
      </div>
    </div>
  );
}
