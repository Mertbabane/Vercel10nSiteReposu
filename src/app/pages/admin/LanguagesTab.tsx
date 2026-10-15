import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Upload, X } from 'lucide-react';
import { useLanguages, reloadLanguages, uploadMedia, type Language } from '@/app/lib/data';
import { api } from '@/app/lib/api';
import { trError } from '@/app/lib/errors';
import { Modal } from './UsersTab';

export function LanguagesTab() {
  const langs = useLanguages();
  const [editing, setEditing] = useState<Language | 'new' | null>(null);

  async function handleDelete(l: Language) {
    if (!confirm(`"${l.label}" dili silinsin mi? Bu dildeki kodlar silinmez.`)) return;
    try {
      await api(`/admin/languages/${encodeURIComponent(l.value)}`, { method: 'DELETE' });
      reloadLanguages();
    } catch (err) {
      alert(`Silinemedi: ${trError((err as Error).message)}`);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <button onClick={() => setEditing('new')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold btn-press">
          <Plus className="w-4 h-4" /> Yeni Dil
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {langs.map((l) => (
          <div key={l.value} className="glass-gray rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">
              {l.icon_url ? <img src={l.icon_url} alt="" className="w-6 h-6 object-contain" /> : l.icon || '📄'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{l.label}</div>
              <div className="text-xs text-white/30 truncate">{l.value}</div>
            </div>
            <button onClick={() => setEditing(l)} className="p-2 rounded-lg glass-light hover:bg-white/10 btn-press" title="Düzenle"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(l)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 btn-press" title="Sil"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      {editing && <LangForm lang={editing === 'new' ? null : editing} nextOrder={langs.length + 1} onClose={() => setEditing(null)} />}
    </div>
  );
}

function LangForm({ lang, nextOrder, onClose }: { lang: Language | null; nextOrder: number; onClose: () => void }) {
  const [label, setLabel] = useState(lang?.label || '');
  const [value, setValue] = useState(lang?.value || '');
  const [icon, setIcon] = useState(lang?.icon || '');
  const [iconUrl, setIconUrl] = useState<string | null>(lang?.icon_url || null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const key = (lang?.value || value || label).trim().toLowerCase().replace(/[^a-z0-9#+_-]/g, '');
    if (!label.trim() || !key) return alert('Dil adı ve kodu gerekli.');
    setBusy(true);
    try {
      if (lang) {
        await api(`/admin/languages/${encodeURIComponent(lang.value)}`, {
          method: 'PUT',
          body: JSON.stringify({ label: label.trim(), icon: icon || null, icon_url: iconUrl }),
        });
      } else {
        await api('/admin/languages', {
          method: 'POST',
          body: JSON.stringify({ label: label.trim(), icon: icon || null, icon_url: iconUrl, value: key, sort_order: nextOrder }),
        });
      }
    } catch (err) {
      setBusy(false);
      return alert(`Kaydedilemedi: ${trError((err as Error).message)}`);
    }
    setBusy(false);
    await reloadLanguages();
    onClose();
  }

  return (
    <Modal title={lang ? 'Dili Düzenle' : 'Yeni Dil'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Dil adı"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Örn: Python" className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none" /></Field>
        {!lang && (
          <Field label="Kısa kod (benzersiz)"><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Örn: python" className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none" /></Field>
        )}
        <Field label="Emoji"><input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🐍" className="w-full px-4 py-3 rounded-xl glass-light text-white focus:outline-none" /></Field>
        <Field label="Veya küçük görsel (emojinin yerine geçer)">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              {iconUrl ? <img src={iconUrl} alt="" className="w-7 h-7 object-contain" /> : <span className="text-lg">{icon || '📄'}</span>}
            </div>
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-light hover:bg-white/10 cursor-pointer text-sm btn-press">
              <Upload className="w-4 h-4" /> {busy ? 'Yükleniyor...' : 'Görsel seç'}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 1024 * 1024) return alert('Görsel en fazla 1MB olmalı.');
                setBusy(true);
                try { setIconUrl(await uploadMedia(f, 'icons')); } catch (err) { alert(`Yüklenemedi: ${trError((err as Error).message)}`); }
                setBusy(false);
              }} />
            </label>
            {iconUrl && <button onClick={() => setIconUrl(null)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 btn-press" title="Görseli kaldır"><X className="w-4 h-4" /></button>}
          </div>
        </Field>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl glass-light hover:bg-white/10 btn-press">İptal</button>
        <button disabled={busy} onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold disabled:opacity-50 btn-press">
          <Check className="w-4 h-4" /> Kaydet
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-2">{label}</label>
      {children}
    </div>
  );
}
