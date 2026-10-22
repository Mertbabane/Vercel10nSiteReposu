import { Component, type ReactNode } from 'react';
import { AuthProvider } from '@/app/context/AuthContext';
import { SettingsProvider } from '@/app/context/SettingsContext';
import { BackgroundVideo } from '@/app/components/BackgroundVideo';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { navigate, usePathname } from '@/app/lib/router';
import { HomePage } from '@/app/pages/HomePage';
import { SnippetsPage } from '@/app/pages/SnippetsPage';
import { SnippetDetailPage } from '@/app/pages/SnippetDetailPage';
import { SnippetFormPage } from '@/app/pages/SnippetFormPage';
import { ProfilePage } from '@/app/pages/ProfilePage';
import { AuthPage } from '@/app/pages/AuthPage';
import { AdminPage } from '@/app/pages/AdminPage';

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-glow">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sayfa bulunamadı</h2>
        <p className="mt-2 text-sm text-white/50">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 rounded-xl bg-white text-black font-semibold btn-press"
        >
          Ana sayfaya dön
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error(error);
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Sayfa yüklenemedi</h1>
          <p className="mt-2 text-sm text-white/50">Bir şeyler ters gitti. Sayfayı yenilemeyi deneyin veya ana sayfaya dönün.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold btn-press">
              Tekrar dene
            </button>
            <a href="/" className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 btn-press">Ana sayfa</a>
          </div>
        </div>
      </div>
    );
  }
}

function Routes() {
  const path = usePathname().replace(/\/+$/, '') || '/';
  let m: RegExpMatchArray | null;

  if (path === '/') return <HomePage />;
  if (path === '/snippets') return <SnippetsPage />;
  if (path === '/snippets/new') return <SnippetFormPage mode="new" />;
  if ((m = path.match(/^\/snippets\/edit\/([^/]+)$/))) {
    return <SnippetFormPage key={m[1]} mode="edit" snippetId={decodeURIComponent(m[1]!)} />;
  }
  if ((m = path.match(/^\/snippets\/([^/]+)$/))) {
    return <SnippetDetailPage key={m[1]} id={decodeURIComponent(m[1]!)} />;
  }
  if ((m = path.match(/^\/profile\/([^/]+)$/))) {
    return <ProfilePage key={m[1]} username={decodeURIComponent(m[1]!)} />;
  }
  if (path === '/login') return <AuthPage mode="login" />;
  if (path === '/signup') return <AuthPage mode="signup" />;
  if (path === '/admin') return <AdminPage />;
  return <NotFound />;
}

function Shell() {
  const path = usePathname();
  const showChrome = path !== '/login' && path !== '/signup';
  return (
    <div className="min-h-screen text-foreground relative">
      <BackgroundVideo />
      {showChrome && <Navbar />}
      <main className="relative z-10">
        <ErrorBoundary key={path}>
          <Routes />
        </ErrorBoundary>
      </main>
      {showChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SettingsProvider>
  );
}
