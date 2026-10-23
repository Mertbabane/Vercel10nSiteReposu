import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Trash2, LogIn } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { navigate } from '@/app/lib/router';
import { api } from '@/app/lib/api';

type ChatMessage = { id: string; content: string; created_at: string; user_id: string; username: string | null };

export function ChatPage() {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);
  const [typers, setTypers] = useState<string[]>([]);
  const lastTypingPing = useRef(0);

  const merge = (incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))].slice(-200);
      lastRef.current = next[next.length - 1]?.created_at ?? lastRef.current;
      return next;
    });
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const q = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : '';
        const rows = await api<ChatMessage[]>(`/chat/messages${q}`);
        if (alive) merge(rows);
      } catch (e) {
        if (alive && !lastRef.current) setError(e instanceof Error ? e.message : 'Mesajlar yüklenemedi.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    const loadTyping = async () => {
      try {
        const names = await api<string[]>('/chat/typing');
        if (alive) setTypers(names);
      } catch {
        /* yok say */
      }
    };
    load();
    loadTyping();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 3000);
    const t2 = setInterval(() => {
      if (document.visibilityState === 'visible') loadTyping();
    }, 1500);
    return () => {
      alive = false;
      clearInterval(t);
      clearInterval(t2);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, typers.length]);

  // Yazarken en fazla 2 saniyede bir sunucuya "yazıyor" bildirimi gönder.
  const onType = (value: string) => {
    setText(value);
    if (!user || !value.trim()) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 2000) return;
    lastTypingPing.current = now;
    api('/chat/typing', { method: 'POST', body: JSON.stringify({ typing: true }) }).catch(() => {});
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    try {
      const row = await api<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify({ content }) });
      merge([row]);
      setText('');
      lastTypingPing.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/chat/messages/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] rounded-2xl glass border border-white/10 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <MessageCircle className="w-5 h-5" />
          <h1 className="text-lg font-bold">Sohbet</h1>
          <span className="text-xs text-white/40 ml-auto">Herkese açık oda</span>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading && <p className="text-center text-white/40 text-sm">Yükleniyor...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-center text-white/40 text-sm mt-10">Henüz mesaj yok. İlk mesajı sen yaz!</p>
          )}
          {messages.map((m) => {
            const mine = user?.id === m.user_id;
            return (
              <div key={m.id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? 'bg-white text-black' : 'glass-light border border-white/10'}`}>
                  <div className={`flex items-center gap-2 text-xs mb-0.5 ${mine ? 'text-black/50' : 'text-white/50'}`}>
                    <button
                      className="font-semibold hover:underline"
                      onClick={() => m.username && navigate(`/profile/${m.username}`)}
                    >
                      {m.username || 'Anonim'}
                    </button>
                    <span>{new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {(mine || isAdmin) && (
                      <button onClick={() => remove(m.id)} aria-label="Mesajı sil" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            );
          })}
          {typers.length > 0 && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-light border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs text-white/50">
                  {typers.length === 1 ? `${typers[0]} yazıyor` : typers.length === 2 ? `${typers[0]} ve ${typers[1]} yazıyor` : `${typers.length} kişi yazıyor`}
                </span>
                <span className="typing-dots" aria-hidden="true">
                  <span /><span /><span />
                </span>
              </div>
            </div>
          )}
        </div>

        {error && <div className="px-5 py-2 text-sm text-red-400 border-t border-white/10">{error}</div>}

        {user ? (
          <form onSubmit={send} className="flex gap-2 p-3 border-t border-white/10">
            <input
              value={text}
              onChange={(e) => onType(e.target.value)}
              maxLength={1000}
              placeholder="Mesajını yaz..."
              className="flex-1 px-4 py-3 rounded-xl glass-light text-white placeholder-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="Gönder"
              className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center btn-press disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="p-4 border-t border-white/10 text-center">
            <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold btn-press">
              <LogIn className="w-4 h-4" /> Sohbete katılmak için giriş yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
