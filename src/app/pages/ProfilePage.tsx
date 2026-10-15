import { useEffect, useState } from 'react';
import { Code2, ArrowLeft, Calendar } from 'lucide-react';
import { useLanguages, type Snippet, type Profile, getLanguageLabel, getLanguageIcon } from '@/app/lib/data';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';

export function ProfilePage({ username }: { username: string }) {
  const LANGS = useLanguages();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Profile | null>(`/profiles/${encodeURIComponent(username)}`)
      .then(async (data) => {
        setProfile(data);
        if (data) {
          const list = await api<Snippet[]>(`/snippets?user_id=${data.user_id}`);
          setSnippets(list || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="relative z-10 pt-24 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 rounded-2xl glass-light shimmer" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative z-10 pt-24 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Kullanici bulunamadi</h1>
          <button onClick={() => navigate('/snippets')} className="px-6 py-3 rounded-xl glass hover:bg-white/10 transition-all btn-press">
            Kodlara Don
          </button>
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

        {/* Profile Header */}
        <div className="glass-gray rounded-2xl p-6 sm:p-8 mb-8 animate-fade-in-up will-fade">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-3xl sm:text-4xl font-extrabold animate-pulse-glow">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 text-glow-sm break-words">@{profile.username}</h1>
              {profile.bio && <p className="text-white/50 text-sm sm:text-base mb-2">{profile.bio}</p>}
              <div className="flex items-center gap-1 text-sm text-white/30">
                <Calendar className="w-4 h-4" />
                Katilma: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>

        {/* User's Snippets */}
        <h2 className="text-2xl font-bold mb-6 animate-fade-in-up will-fade" style={{ animationDelay: '0.1s', opacity: 0 }}>
          Kodlari ({snippets.length})
        </h2>

        {snippets.length === 0 ? (
          <div className="text-center py-16 glass-gray rounded-2xl animate-fade-in">
            <Code2 className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-lg">Henuz kod paylasilmadi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {snippets.map((snippet, i) => (
              <button
                key={snippet.id}
                onClick={() => navigate(`/snippets/${snippet.id}`)}
                className="group glass-gray rounded-2xl p-6 text-left hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up will-fade btn-press"
                style={{ animationDelay: `${0.15 + i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{getLanguageIcon(snippet.language)}</span>
                  <span className="text-xs text-white/40">{getLanguageLabel(snippet.language)}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-glow-sm transition-all truncate">{snippet.title}</h3>
                <pre className="text-xs font-mono text-white/50 bg-black/40 rounded-lg p-3 overflow-hidden line-clamp-2 whitespace-pre-wrap break-all">
                  {snippet.code.slice(0, 150)}
                </pre>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
