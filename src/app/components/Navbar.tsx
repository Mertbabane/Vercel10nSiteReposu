import { useEffect, useRef, useState } from 'react';
import { Code2, Home, LogIn, LogOut, Plus, User, Menu, X, FileCode, UserPlus, Shield, MessageCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { useSettings } from '@/app/context/SettingsContext';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  const initial = profile?.username?.charAt(0).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => go('/')} className="flex items-center gap-2 group btn-press">
            <Code2 className="w-7 h-7 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-xl font-bold tracking-tight text-glow-sm">{settings.site_title}</span>
          </button>

          <div ref={wrapRef} className="relative flex items-center gap-2">
            {/* Profile */}
            <button
              onClick={() => { setProfileOpen(!profileOpen); setMenuOpen(false); }}
              aria-label="Profil menüsü"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 btn-press ${
                profileOpen ? 'border-white/40 bg-white/10 scale-105' : 'border-white/10 bg-gradient-to-br from-white/20 to-white/5 hover:border-white/30'
              }`}
            >
              {user && initial ? <span className="text-sm font-bold">{initial}</span> : <User className="w-5 h-5" />}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => { setMenuOpen(!menuOpen); setProfileOpen(false); }}
              aria-label="Menü"
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors btn-press"
            >
              <span className={`transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}>
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </span>
            </button>

            {/* Profile dropdown */}
            <Dropdown open={profileOpen}>
              {user ? (
                <>
{isAdmin && <Item i={0} open={profileOpen} icon={<Shield className="w-4 h-4" />} label="Admin Paneli" onClick={() => go('/admin')} />}
                  <Item i={2} open={profileOpen} icon={<LogOut className="w-4 h-4" />} label="Çıkış Yap" onClick={() => { setProfileOpen(false); signOut().then(() => navigate('/')); }} />
                </>
              ) : (
                <>
                  <Item i={0} open={profileOpen} icon={<LogIn className="w-4 h-4" />} label="Giriş Yap" onClick={() => go('/login')} />
                  <Item i={1} open={profileOpen} icon={<UserPlus className="w-4 h-4" />} label="Kayıt Ol" onClick={() => go('/signup')} highlight />
                </>
              )}
            </Dropdown>

            {/* Main menu dropdown */}
            <Dropdown open={menuOpen}>
              <Item i={0} open={menuOpen} icon={<Home className="w-4 h-4" />} label="Ana Sayfa" onClick={() => go('/')} />
              <Item i={1} open={menuOpen} icon={<Code2 className="w-4 h-4" />} label="Kodlar" onClick={() => go('/snippets')} />
              <Item i={2} open={menuOpen} icon={<MessageCircle className="w-4 h-4" />} label="Sohbet" onClick={() => go('/chat')} />
              {user && (
                <>
                  <Item i={3} open={menuOpen} icon={<Plus className="w-4 h-4" />} label="Yeni Kod" onClick={() => go('/snippets/new')} />
                  <Item i={4} open={menuOpen} icon={<FileCode className="w-4 h-4" />} label="Paylaşımlarım" onClick={() => go(`/profile/${profile?.username || ''}`)} />
                </>
              )}
              {isAdmin && <Item i={5} open={menuOpen} icon={<Shield className="w-4 h-4" />} label="Admin Paneli" onClick={() => go('/admin')} />}
            </Dropdown>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dropdown({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute right-0 top-14 w-60 rounded-2xl glass p-2 shadow-2xl origin-top-right transition-all duration-300 ease-out ${
        open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
}

function Item({ icon, label, onClick, i, open, highlight }: { icon: React.ReactNode; label: string; onClick: () => void; i: number; open: boolean; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ transitionDelay: open ? `${i * 40 + 60}ms` : '0ms' }}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 btn-press ${
        open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      } ${highlight ? 'bg-white text-black hover:bg-white/90 mt-1' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      {label}
    </button>
  );
}
