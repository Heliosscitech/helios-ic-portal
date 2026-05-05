import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatTRCompact } from '../../lib/dates';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { PORTAL_USERS } from '../../types/users';
import type { User } from '../../types/portal';
import { useNotes } from './hooks';
import { NOTE_CATEGORIES } from './types';
import type { NoteCategory } from './types';

const getAuthor = (id?: string) => PORTAL_USERS.find((u) => u.id === id);

export const NotlarPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { items, loading, add, update, remove } = useNotes(currentUser.id);
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<NoteCategory>('genel');
  const [editing, setEditing] = useState<{ id: string | 'new'; title: string; content: string } | null>(null);

  const filtered = items.filter((n) => n.category === activeTab);

  const startNew = () => setEditing({ id: 'new', title: '', content: '' });
  const startEdit = (id: string, title: string, content: string) => setEditing({ id, title, content });
  const cancel = () => setEditing(null);
  const save = async () => {
    if (!editing || !editing.title.trim()) return;
    const isNew = editing.id === 'new';
    const ok = isNew
      ? await add(activeTab, editing.title.trim(), editing.content)
      : await update(editing.id, { title: editing.title.trim(), content: editing.content });
    if (ok) {
      toast.success(isNew ? 'Not eklendi' : 'Not güncellendi');
      cancel();
    } else {
      toast.error('Kaydedilemedi');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Notu sil?',
      message: `"${title}" notu kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    const success = await remove(id);
    if (success) toast.success('Not silindi');
    else toast.error('Silinemedi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[13px] text-text-3 font-medium">Notlar, giriş bilgileri ve kargo adresleri</p>
        <button
          onClick={startNew}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black"
        >
          <Plus size={14} /> Not ekle
        </button>
      </div>

      <div className="flex items-center gap-2">
        {NOTE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={cn(
              'px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all',
              activeTab === cat.id
                ? 'bg-[#1a1a19] text-white'
                : 'bg-surface-2 text-text-3 hover:text-text'
            )}
          >
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
            return (
              <div key={n.id} className="bg-white border border-border/40 rounded-xl p-5 group hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-bold text-text mb-2">{n.title}</h3>
                    {n.content && (
                      <p className="text-[13px] text-text-2 leading-relaxed whitespace-pre-line mb-3">{n.content}</p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-text-3 font-medium">
                      {author && (
                        <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', author.color)}>
                          {author.initials}
                        </span>
                      )}
                      <span>{author?.name ?? 'Bilinmiyor'}</span>
                      <span>· {formatTRCompact(n.createdAt.slice(0, 10))}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(n.id, n.title, n.content)} className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-amber-text"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(n.id, n.title)} className="p-1.5 rounded hover:bg-red-50 text-text-3 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={cancel}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-[16px] font-black text-text flex items-center gap-2">
                <Pencil size={14} /> {editing.id === 'new' ? 'Yeni not' : 'Not düzenle'}
              </h2>
              <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-3"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">Başlık</label>
                <input
                  type="text" value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  autoFocus
                  className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-info-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">İçerik</label>
                <textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-info-border resize-y"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-2">
              <button onClick={cancel} className="px-4 py-2 text-[13px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2">Vazgeç</button>
              <button
                onClick={save}
                disabled={!editing.title.trim()}
                className="px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
