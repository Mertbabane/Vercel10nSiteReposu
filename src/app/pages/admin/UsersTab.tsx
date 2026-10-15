import { useState } from 'react';
import { Users, Eye, Edit2, Trash2, X, Check, Mail } from 'lucide-react';
import { type Profile } from '@/app/lib/data';
import { api } from '@/app/lib/api';
import { navigate } from '@/app/lib/router';
import { trError } from '@/app/lib/errors';

export type AdminUser = Profile & { email: string; last_login_at: string | null; snippet_count: number };

export function UsersTab({ users, currentUserId, onChanged }: { users: AdminUser[]; currentUserId?: string | undefined; onChanged: () => void }) {
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [viewing, setViewing] = useState<AdminUser | null>(null);

  async function handleDelete(u: AdminUser) {
    if (!confirm(`@${u.username} kullanıcısı ve tüm kodları kalıcı olarak silinsin mi?`)) return;
    try {
      await api(`/admin/users/${u.user_id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      alert(`Silinemedi: ${trError((err as Error).message)}`);
    }
  }

  async function handleSave(u: AdminUser, username: string, bio: string) {
    const clean = username.trim();
    if (!clean) return alert('Kullanıcı adı boş olamaz.');
    try {
      await api(`/admin/users/${u.user_id}`, { method: 'PUT', body: JSON.stringify({ username: clean, bio }) });
      setEditing(null);
      onChanged();
    } catch (err) {
      alert(`Güncellenemedi: ${trError((err as Error).message)}`);
    }
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 glass-gray rounded-2xl">
        <Users className="w-10 h-10 mx-auto mb-3 text-white/20" />
        <p className="text-white/40">Kullanıcı bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {users.map((u) => (
        <div key={u.id} className="glass-gray rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center font-bold shrink-0">
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">@{u.username}</h3>
              <p className="text-xs text-white/40 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0" /> {u.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <IconBtn title="Bilgiler" onClick={() => setViewing(u)}><Eye className="w-4 h-4" /></IconBtn>
            <IconBtn title="Düzenle" onClick={() => setEditing(u)}><Edit2 className="w-4 h-4" /></IconBtn>
            {u.user_id !== currentUserId && (
              <button onClick={() => handleDelete(u)} title="Sil" className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 btn-press">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {viewing && (
        <Modal title="Kullanıcı Bilgileri" onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <Row k="Kullanıcı adı" v={`@${viewing.username}`} />
            <Row k="E-posta" v={viewing.email || '-'} />
            <Row k="Biyografi" v={viewing.bio || '-'} />
            <Row k="Paylaşılan kod" v={String(viewing.snippet_count || 0)} />
            <Row k="Katılma" v={new Date(viewing.created_at).toLocaleString('tr-TR')} />
            <Row k="Son giriş" v={viewing.last_login_at ? new Date(viewing.last_login_at).toLocaleString('tr-TR') : '-'} />
          </dl>
          <button onClick={() => navigate(`/profile/${viewing.username}`)} className="mt-6 w-full px-4 py-3 rounded-xl glass-light hover:bg-white/10 transition-all btn-press">
            Profili Aç
          </button>
        </Modal>
      )}

      {editing && <EditUser user={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}

function EditUser({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (u: AdminUser, username: string, bio: string) => void }) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  return (
    <Modal title="Kullanıcıyı Düzenle" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Kullanıcı adı</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Biyografi</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none resize-y" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl glass-light hover:bg-white/10 btn-press">İptal</button>
        <button onClick={() => onSave(user, username, bio)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold btn-press">
          <Check className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-white/40">{k}</dt>
      <dd className="text-right break-all">{v}</dd>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="p-2 rounded-lg glass-light hover:bg-white/10 transition-all btn-press">
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-fade-in" onClick={onClose}>
      <div className="glass-gray rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 btn-press"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
