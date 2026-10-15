import { useEffect, useState } from 'react';
import {
  Shield, Code2, Settings, Users, Trash2, Edit2, Save,
  Video, X, Eye, Search, Check, AlertCircle, Languages, Upload, Palette,
} from 'lucide-react';
import { type Snippet, type SiteSettings, getLanguageLabel, getLanguageIcon, useLanguages, uploadMedia } from '@/app/lib/data';
import { UsersTab, type AdminUser } from '@/app/pages/admin/UsersTab';
import { AppearanceTab } from '@/app/pages/admin/AppearanceTab';
import { api } from '@/app/lib/api';
import { useSettings } from '@/app/context/SettingsContext';
import { LanguagesTab } from '@/app/pages/admin/LanguagesTab';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { trError } from '@/app/lib/errors';

type Tab = 'snippets' | 'appearance' | 'settings' | 'users' | 'languages';

type AdminSnippet = Snippet & { profiles?: { username: string } | null };

export function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const { refresh: refreshSettings } = useSettings();
  useLanguages();
  const [tab, setTab] = useState<Tab>('snippets');
  const [snippets, setSnippets] = useState<AdminSnippet[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [editingSnippet, setEditingSnippet] = useState<AdminSnippet | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (!loading && user && !isAdmin) {
      navigate('/');
      return;
    }
  }, [user, isAdmin, loading]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin]);

  async function loadData() {
    setDataLoading(true);
    try {
      const [snips, usrs, stgs] = await Promise.all([
        api<AdminSnippet[]>('/admin/snippets'),
        api<AdminUser[]>('/admin/users'),
        api<SiteSettings | null>('/site-settings'),
      ]);
      setSnippets(snips || []);
      setUsers(usrs || []);
      setSettings(stgs || null);
    } catch (err) {
      console.error('Admin verileri yuklenemedi:', err);
    }
    setDataLoading(false);
  }

  async function handleDeleteSnippet(id: string) {
    if (!confirm('Bu kodu kalici olarak silmek istedigine emin misin?')) return;
    try {
      await api(`/snippets/${id}`, { method: 'DELETE' });
      setSnippets(snippets.filter((s) => s.id !== id));
    } catch (err) {
      alert(`Silinemedi: ${trError((err as Error).message)}`);
    }
  }

  async function handleUpdateSnippet(snippet: AdminSnippet, data: Partial<Snippet>) {
    try {
      const { profiles: _p, ...clean } = data as AdminSnippet;
      await api(`/snippets/${snippet.id}`, { method: 'PUT', body: JSON.stringify(clean) });
      setEditingSnippet(null);
      loadData();
    } catch (err) {
      alert(`Guncellenemedi: ${trError((err as Error).message)}`);
    }
  }

  async function handleSaveSettings(data: Partial<SiteSettings>) {
    try {
      await api('/admin/site-settings', { method: 'PUT', body: JSON.stringify(data) });
      setSettings(null);
      await refreshSettings();
      loadData();
      alert('Ayarlar kaydedildi!');
    } catch (err) {
      alert(`Kaydedilemedi: ${trError((err as Error).message)}`);
    }
  }

  if (loading || (!user && !loading)) {
    return (
      <div className="relative z-10 pt-24 px-4 min-h-screen flex items-center justify-center">
        <div className="animate-spin-slow">
          <Shield className="w-12 h-12 text-white/20" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative z-10 pt-24 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400/50" />
          <h1 className="text-2xl font-bold mb-2">Erisim Engellendi</h1>
          <p className="text-white/40 mb-6">Admin yetkiniz yok.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl glass hover:bg-white/10 transition-all btn-press">
            Ana Sayfaya Don
          </button>
        </div>
      </div>
    );
  }

  const filteredSnippets = snippets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.profiles?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in-up will-fade">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-glow-sm">Admin Panel</h1>
            <p className="text-white/40 text-sm">Kodlari, ayarlari ve kullanicilari yonet</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 glass-gray rounded-xl p-1 animate-fade-in-up will-fade" style={{ animationDelay: '0.05s', opacity: 0 }}>
          <TabButton active={tab === 'snippets'} onClick={() => setTab('snippets')} icon={<Code2 className="w-4 h-4" />} label={`Kodlar (${snippets.length})`} />
          <TabButton active={tab === 'appearance'} onClick={() => setTab('appearance')} icon={<Palette className="w-4 h-4" />} label="Görünüm" />
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<Settings className="w-4 h-4" />} label="Site Ayarlari" />
          <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={<Users className="w-4 h-4" />} label={`Kullanicilar (${users.length})`} />
          <TabButton active={tab === 'languages'} onClick={() => setTab('languages')} icon={<Languages className="w-4 h-4" />} label="Diller" />
        </div>

        {/* Content */}
        {dataLoading ? (
          <div className="h-64 rounded-2xl glass-light shimmer" />
        ) : (
          <>
            {tab === 'snippets' && (
              <div className="space-y-4 animate-fade-in">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Baslik veya yazara gore ara..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>

                {filteredSnippets.length === 0 ? (
                  <div className="text-center py-16 glass-gray rounded-2xl">
                    <Code2 className="w-10 h-10 mx-auto mb-3 text-white/20" />
                    <p className="text-white/40">Kod bulunamadi.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="glass-gray rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{getLanguageIcon(snippet.language)}</span>
                            <span className="text-xs text-white/40">{getLanguageLabel(snippet.language)}</span>
                            <span className="text-xs text-white/30">•</span>
                            <span className="text-xs text-white/40">@{snippet.profiles?.username || 'bilinmiyor'}</span>
                          </div>
                          <h3 className="font-semibold truncate">{snippet.title}</h3>
                          <p className="text-xs text-white/30 mt-1">
                            {new Date(snippet.created_at).toLocaleDateString('tr-TR')} • {snippet.views} goruntulenme
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => navigate(`/snippets/${snippet.id}`)}
                            className="p-2 rounded-lg glass-light hover:bg-white/10 transition-all btn-press"
                            title="Goruntule"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingSnippet(snippet)}
                            className="p-2 rounded-lg glass-light hover:bg-white/10 transition-all btn-press"
                            title="Duzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSnippet(snippet.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 btn-press"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {editingSnippet && (
                  <EditSnippetModal
                    snippet={editingSnippet}
                    onClose={() => setEditingSnippet(null)}
                    onSave={(data) => handleUpdateSnippet(editingSnippet, data)}
                  />
                )}
              </div>
            )}

            {tab === 'appearance' && settings && (
              <AppearanceTab settings={settings} onSave={handleSaveSettings} />
            )}

            {tab === 'settings' && settings && (
              <SettingsTab settings={settings} onSave={handleSaveSettings} />
            )}

            {tab === 'users' && <UsersTab users={users} currentUserId={user?.id} onChanged={loadData} />}
            {tab === 'languages' && <LanguagesTab />}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all btn-press ${
        active ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SettingsTab({ settings, onSave }: { settings: SiteSettings; onSave: (data: Partial<SiteSettings>) => void }) {
  const [videoUrl, setVideoUrl] = useState(settings.background_video_url || '');
  const [showStats, setShowStats] = useState(settings.show_stats ?? true);
  const [blur, setBlur] = useState(settings.video_blur ?? 0);
  const [rotation, setRotation] = useState(settings.video_rotation ?? 0);
  const [flipH, setFlipH] = useState(settings.video_flip_h ?? false);
  const [flipV, setFlipV] = useState(settings.video_flip_v ?? false);
  const [fit, setFit] = useState(settings.video_fit ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    setSaving(true);
    onSave({
      background_video_url: videoUrl || null,
      show_stats: showStats,
      video_blur: blur,
      video_rotation: rotation,
      video_flip_h: flipH,
      video_flip_v: flipV,
      video_fit: fit,
    });
    setSaving(false);
  };

  const handleClearVideo = () => {
    setVideoUrl('');
    onSave({ background_video_url: null });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Background Video */}
      <div className="glass-gray rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-bold">Ana Sayfa Arkaplan Videosu</h3>
        </div>
        <p className="text-sm text-white/40 mb-4">
          Ana sayfanin arka planinda oynacak video URL'sini gir. Direkt .mp4 linki kullan veya bilgisayarından dosya yükle (en fazla 50MB).
        </p>
        <div className="flex gap-3 mb-4">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://ornek.com/video.mp4"
            className="flex-1 px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
          />
          {videoUrl && (
            <button
              onClick={handleClearVideo}
              className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 btn-press"
              title="Videoyu kaldir"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <label className="flex items-center justify-center gap-2 mb-4 px-4 py-3 rounded-xl glass-light hover:bg-white/10 transition-all cursor-pointer text-sm btn-press">
          <Upload className="w-4 h-4" />
          {uploading ? 'Yükleniyor...' : 'Bilgisayardan video yükle'}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                const url = await uploadMedia(f, 'videos');
                setVideoUrl(url);
                onSave({ background_video_url: url });
              } catch (err) {
                alert(`Yüklenemedi: ${trError((err as Error).message)}`);
              }
              setUploading(false);
              e.target.value = '';
            }}
          />
        </label>
        {videoUrl && (
          <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 h-48 flex items-center justify-center">
            <video autoPlay loop muted playsInline key={videoUrl}
              className={`w-full h-full ${fit ? 'object-cover' : 'object-contain'}`}
              style={{ filter: blur ? `blur(${blur}px)` : undefined, transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})` }}>
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label className="flex justify-between text-sm font-medium text-white/60 mb-2">
              <span>Bulanıklık</span><span>{blur}px</span>
            </label>
            <input type="range" min={0} max={30} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-white" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/60 mb-2">Döndür</div>
            <div className="flex flex-wrap gap-2">
              {[0, 90, 180, 270].map((r) => (
                <button key={r} type="button" onClick={() => setRotation(r)}
                  className={`px-4 py-2 rounded-xl text-sm btn-press transition-all ${rotation === r ? 'bg-white text-black' : 'glass-light hover:bg-white/10'}`}>
                  {r === 0 ? 'Normal' : r === 180 ? 'Ters (180°)' : r === 90 ? 'Sağa (90°)' : 'Sola (270°)'}
                </button>
              ))}
              <button type="button" onClick={() => setFlipH(!flipH)}
                className={`px-4 py-2 rounded-xl text-sm btn-press transition-all ${flipH ? 'bg-white text-black' : 'glass-light hover:bg-white/10'}`}>Yatay Ayna</button>
              <button type="button" onClick={() => setFlipV(!flipV)}
                className={`px-4 py-2 rounded-xl text-sm btn-press transition-all ${flipV ? 'bg-white text-black' : 'glass-light hover:bg-white/10'}`}>Dikey Ayna</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white/80">Siteye uyumlu boyut</div>
              <div className="text-xs text-white/40">Açık: ekranı tamamen kaplar. Kapalı: video kırpılmadan orijinal oranında gösterilir.</div>
            </div>
            <button type="button" onClick={() => setFit(!fit)} aria-label="Siteye uyumlu boyutu aç/kapat"
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 shrink-0 ${fit ? 'bg-white' : 'bg-white/10'}`}>
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ${fit ? 'translate-x-6 bg-black' : 'bg-white/60'}`} />
            </button>
          </div>
          <p className="text-xs text-white/30">Değişiklikler için en alttaki "Kaydet" butonuna bas.</p>
        </div>
      </div>

      {/* Stats toggle */}
      <div className="glass-gray rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Ana Sayfa İstatistik Alanı</h3>
          <p className="text-sm text-white/40">"Dil / Kopyala / Hata" alanını ana sayfada göster veya gizle.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowStats(!showStats)}
          className={`relative w-14 h-8 rounded-full transition-colors duration-300 shrink-0 ${showStats ? 'bg-white' : 'bg-white/10'}`}
          aria-label="İstatistik alanını aç/kapat"
        >
          <span className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ${showStats ? 'translate-x-6 bg-black' : 'bg-white/60'}`} />
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-all disabled:opacity-50 btn-press"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Kaydediliyor...' : 'Ayarlari Kaydet'}
        </button>
      </div>
    </div>
  );
}

function EditSnippetModal({
  snippet,
  onClose,
  onSave,
}: {
  snippet: AdminSnippet;
  onClose: () => void;
  onSave: (data: Partial<Snippet>) => void;
}) {
  const [title, setTitle] = useState(snippet.title);
  const [description, setDescription] = useState(snippet.description || '');
  const [language, setLanguage] = useState(snippet.language);
  const [code, setCode] = useState(snippet.code);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="glass-gray rounded-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Kodu Duzenle</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-all btn-press">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Baslik</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Aciklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Dil</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none focus:border-white/20"
            >
              {useLanguages().map((l) => (
                <option key={l.value} value={l.value} className="bg-ink-900">{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Kod</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl glass-light text-white font-mono text-sm focus:outline-none focus:border-white/20 resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-3 rounded-xl glass-light hover:bg-white/10 transition-all font-medium btn-press">
            Iptal
          </button>
          <button
            onClick={() => onSave({ title, description, language, code })}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition-all btn-press"
          >
            <Check className="w-5 h-5" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
