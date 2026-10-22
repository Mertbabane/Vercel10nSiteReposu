import { Code2, Heart } from 'lucide-react';
import { navigate } from '@/app/lib/router';
import { useSettings } from '@/app/context/SettingsContext';
import { VideoControls } from '@/app/components/BackgroundVideo';

export function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="relative z-10 border-t border-white/5 glass mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-6 h-6 text-white" />
              <span className="text-lg font-bold">{settings.site_title}</span>
            </div>
            <p className="text-sm text-white/40">
              {settings.site_description || 'Kod paylas, kopyala, calistir. Temiz kod, sifir hata.'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/60">Kesfet</h4>
            <div className="space-y-2">
              <button onClick={() => navigate('/')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Ana Sayfa</button>
              <button onClick={() => navigate('/snippets')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Tum Kodlar</button>
              <button onClick={() => navigate('/snippets/new')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Kod Paylas</button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-white/60">Hesap</h4>
            <div className="space-y-2">
              <button onClick={() => navigate('/login')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Giris Yap</button>
              <button onClick={() => navigate('/signup')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Kayit Ol</button>
              <button onClick={() => navigate('/admin')} className="block text-sm text-white/40 hover:text-white transition-colors btn-press">Admin</button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <span>Gelistiriciler icin</span>
            <Heart className="w-4 h-4 text-white/40" />
            <span>sevgiyle yapildi</span>
          </div>
          <VideoControls />
        </div>
      </div>
    </footer>
  );
}
