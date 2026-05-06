import React, { useState } from 'react';
import { Pencil, Plus, X, Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatTRCompact } from '../../lib/dates';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { usePortalUsers } from '../../lib/users';
import type { User } from '../../types/portal';
import { useNotes } from './hooks';
import { NOTE_CATEGORIES } from './types';
import type { Note, NoteCategory } from './types';

// ── Login content helpers ──────────────────────────────────────────────────

type LoginFields = { kullanici: string; sifre: string; url: string };

const parseLogin = (content: string): LoginFields => {
  try {
    const p = JSON.parse(content);
    return { kullanici: p.kullanici ?? '', sifre: p.sifre ?? '', url: p.url ?? '' };
  } catch {
    return { kullanici: '', sifre: '', url: '' };
  }
};

const buildLogin = (f: LoginFields): string =>
  JSON.stringify({ kullanici: f.kullanici, sifre: f.sifre, url: f.url });

// ── Copy button ────────────────────────────────────────────────────────────

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-[11px] font-semibold text-info-text hover:underline flex items-center gap-0.5 shrink-0"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'kopyalandı' : 'kopyala'}
    </button>
  );
};

// ── Note cards ─────────────────────────────────────────────────────────────

interface CardProps {
  note: Note;
  authorName?: string;
  authorInitials?: string;
  authorColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const LoginNoteCard: React.FC<CardProps> = ({ note, authorName, authorInitials, authorColor, onEdit, onDelete }) => {
  const [showPass, setShowPass] = useState(false);
  const f = parseLogin(note.content);

  return (
    <div className="bg-white border border-border/40 rounded-xl p-5 group hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-text">{note.title}</h3>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-500 rounded">GİZLİ</span>
          </div>

          {f.kullanici && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12.5px] text-text-3 font-medium w-16 shrink-0">Kullanıcı</span>
              <span className="text-[12.5px] text-text-2 font-medium">{f.kullanici}</span>
              <CopyBtn text={f.kullanici} />
            </div>
          )}

          {f.sifre && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12.5px] text-text-3 font-medium w-16 shrink-0">Şifre</span>
              <span
                className="text-[12.5px] text-text-2 font-medium cursor-pointer select-none tracking-widest"
                onClick={() => setShowPass(!showPass)}
                title="Göstermek için tıkla"
              >
                {showPass ? f.sifre : '●'.repeat(Math.min(f.sifre.length, 10))}
              </span>
              <CopyBtn text={f.sifre} />
            </div>
          )}

          {f.url && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12.5px] text-text-3 font-medium w-16 shrink-0">URL</span>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12.5px] text-info-text hover:underline truncate max-w-xs"
              >
                {f.url}
              </a>
              <CopyBtn text={f.url} />
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-text-3 font-medium pt-1">
            {authorInitials && (
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', authorColor)}>
                {authorInitials}
              </span>
            )}
            <span>{authorName ?? 'Bilinmiyor'}</span>
            <span>· {formatTRCompact(note.createdAt.slice(0, 10))}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-amber-text">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="text-[12px] font-medium text-text-3 hover:text-red-500 transition-colors px-1">
            sil
          </button>
        </div>
      </div>
    </div>
  );
};

const RegularNoteCard: React.FC<CardProps> = ({ note, authorName, authorInitials, authorColor, onEdit, onDelete }) => (
  <div className="bg-white border border-border/40 rounded-xl p-5 group hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="text-[14px] font-bold text-text mb-2">{note.title}</h3>
        {note.content && (
          <p className="text-[13px] text-text-2 leading-relaxed whitespace-pre-line mb-3">{note.content}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-text-3 font-medium">
          {authorInitials && (
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', authorColor)}>
              {authorInitials}
            </span>
          )}
          <span>{authorName ?? 'Bilinmiyor'}</span>
          <span>· {formatTRCompact(note.createdAt.slice(0, 10))}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-amber-text">
          <Pencil size={12} />
        </button>
        <button onClick={onDelete} className="text-[12px] font-medium text-text-3 hover:text-red-500 transition-colors px-1">
          sil
        </button>
      </div>
    </div>
  </div>
);

// ── Edit state ─────────────────────────────────────────────────────────────

type EditState = {
  id: string | 'new';
  category: NoteCategory;
  title: string;
  content: string;       // for genel / kargo
  login: LoginFields;    // for giris-bilgileri
};

// ── Main panel ─────────────────────────────────────────────────────────────

export const NotlarPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { items, loading, add, update, remove } = useNotes(currentUser.id);
  const { users } = usePortalUsers();
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<NoteCategory>('genel');
  const [editing, setEditing] = useState<EditState | null>(null);

  const getAuthor = (id?: string) => users.find((u) => u.id === id || u.dbId === id);

  const filtered = items.filter((n) => n.category === activeTab);

  const startNew = () =>
    setEditing({ id: 'new', category: activeTab, title: '', content: '', login: { kullanici: '', sifre: '', url: '' } });

  const startEdit = (n: Note) =>
    setEditing({
      id: n.id,
      category: n.category,
      title: n.title,
      content: n.content,
      login: n.category === 'giris-bilgileri' ? parseLogin(n.content) : { kullanici: '', sifre: '', url: '' },
    });

  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing || !editing.title.trim()) return;
    const isNew = editing.id === 'new';
    const finalContent =
      editing.category === 'giris-bilgileri' ? buildLogin(editing.login) : editing.content;

    const ok = isNew
      ? await add(editing.category, editing.title.trim(), finalContent)
      : await update(editing.id, { title: editing.title.trim(), content: finalContent });

    if (ok) { toast.success(isNew ? 'Not eklendi' : 'Not güncellendi'); cancel(); }
    else toast.error('Kaydedilemedi');
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({ title: 'Notu sil?', message: `"${title}" notu kalıcı olarak silinecek.`, confirmText: 'Sil', variant: 'danger' });
    if (!ok) return;
    const success = await remove(id);
    if (success) toast.success('Not silindi'); else toast.error('Silinemedi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[13px] text-text-3 font-medium">Notlar, giriş bilgileri ve kargo adresleri</p>
        <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black">
          <Plus size={14} /> Not ekle
        </button>
      </div>

      <div className="flex items-center gap-2">
        {NOTE_CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)}
            className={cn('px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all',
              activeTab === cat.id ? 'bg-[#1a1a19] text-white' : 'bg-surface-2 text-text-3 hover:text-text'
            )}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[12px] text-text-3 italic py-6 text-center">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <p className="text-[12px] text-text-3 italic py-6 text-center">Bu kategoride henüz not yok.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const author = getAuthor(n.createdById);
            const cardProps: CardProps = {
              note: n,
              authorName: author?.name,
              authorInitials: author?.initials,
              authorColor: author?.color,
              onEdit: () => startEdit(n),
              onDelete: () => handleDelete(n.id, n.title),
            };
            return n.category === 'giris-bilgileri'
              ? <LoginNoteCard key={n.id} {...cardProps} />
              : <RegularNoteCard key={n.id} {...cardProps} />;
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={cancel}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-text">
                {editing.id === 'new' ? 'Yeni not' : 'Not düzenle'}
              </h2>
              <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-3"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">Başlık *</label>
                <input
                  type="text" value={editing.title} autoFocus
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder={editing.category === 'giris-bilgileri' ? 'ör. Confluence' : editing.category === 'kargo-adresleri' ? 'ör. Selçuk Üni. — İLTEK' : 'ör. Wi-Fi bilgileri'}
                  className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-text transition-colors"
                />
              </div>

              {editing.category === 'giris-bilgileri' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">Kullanıcı adı / E-posta</label>
                    <input
                      type="text" value={editing.login.kullanici}
                      onChange={(e) => setEditing({ ...editing, login: { ...editing.login, kullanici: e.target.value } })}
                      placeholder="info@heliosscitech.com"
                      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-text transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">Şifre</label>
                    <input
                      type="text" value={editing.login.sifre}
                      onChange={(e) => setEditing({ ...editing, login: { ...editing.login, sifre: e.target.value } })}
                      placeholder="Şifre"
                      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-text transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">URL (opsiyonel)</label>
                    <input
                      type="text" value={editing.login.url}
                      onChange={(e) => setEditing({ ...editing, login: { ...editing.login, url: e.target.value } })}
                      placeholder="https://"
                      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-text transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">İçerik</label>
                  <textarea
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={editing.category === 'kargo-adresleri' ? 5 : 7}
                    placeholder={editing.category === 'kargo-adresleri' ? 'Adres...\n\nTel: 0xxx xxx xx xx' : ''}
                    className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-text transition-colors resize-y"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-2">
              <button onClick={cancel} className="px-4 py-2 text-[13px] font-semibold border border-border/40 rounded-lg bg-white hover:bg-surface-2">Vazgeç</button>
              <button onClick={save} disabled={!editing.title.trim()}
                className="px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
