import { useState, useEffect } from 'react';
import { Code2, LogIn, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { useSettings } from '@/app/context/SettingsContext';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp, user } = useAuth();
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      if (username.trim().length < 3) {
        setError('Kullanici adi en az 3 karakter olmali');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, username);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="relative z-10 pt-24 pb-20 px-4 min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 gray-shader-radial pointer-events-none" />
      <div className="w-full max-w-md relative">
        {/* Logo / Ana sayfaya donus */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-6 mx-auto group btn-press"
        >
          <Code2 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-2xl font-extrabold text-glow-sm">{settings.site_title}</span>
        </button>

        <div className="text-center mb-8 animate-fade-in-up will-fade">
          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Tekrar Hos Geldin' : 'Topluluga Katil'}
          </h1>
          <p className="text-white/40">
            {mode === 'login'
              ? 'Kod paylasmak ve yonetmek icin giris yap'
              : 'Kod paylasmaya baslamak icin hesap olustur'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-gray rounded-2xl p-6 sm:p-8 space-y-5 animate-fade-in-up will-fade" style={{ animationDelay: '0.1s', opacity: 0 }}>
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Kullanici Adi</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanici_adin"
                required
                className="w-full px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@gmail.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Sifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-semibold hover:scale-[1.02] transition-all disabled:opacity-50 btn-press"
          >
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            {loading ? 'Bekleyin...' : mode === 'login' ? 'Giris Yap' : 'Hesap Olustur'}
          </button>

          <div className="text-center text-sm text-white/40">
            {mode === 'login' ? (
              <>
                Hesabin yok mu?{' '}
                <button type="button" onClick={() => navigate('/signup')} className="text-white hover:underline font-medium">
                  Kayit ol
                </button>
              </>
            ) : (
              <>
                Zaten hesabin var mi?{' '}
                <button type="button" onClick={() => navigate('/login')} className="text-white hover:underline font-medium">
                  Giris yap
                </button>
              </>
            )}
          </div>
        </form>

        {/* Ana sayfaya don butonu */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mx-auto mt-6 text-white/40 hover:text-white transition-colors text-sm btn-press animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Don
        </button>
      </div>
    </div>
  );
}
