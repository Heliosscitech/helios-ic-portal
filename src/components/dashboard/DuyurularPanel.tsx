import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatTRCompact } from '../../lib/dates';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { PORTAL_USERS } from '../../types/users';
import type { User } from '../../types/portal';
import { useAnnouncements } from './hooks';
import { PRIORITY_LABELS, PRIORITY_STYLES } from './types';
import type { Priority } from './types';

const getAuthor = (id?: string) => PORTAL_USERS.find((u) => u.id === id);

export const DuyurularPanel: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { items, loading, add, remove } = useAnnouncements(currentUser.id);
  const toast = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setPriority('normal');
  };

  const close = () => {
    reset();
    setCreating(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const ok = await add({ title: title.trim(), content: content.trim(), priority });
    setSubmitting(false);
    if (ok) {
      toast.success('Duyuru kaydedildi');
      close();
    } else {
      toast.error('Duyuru kaydedilemedi');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Duyuruyu sil?',
      message: `"${title}" duyurusu kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    const success = await remove(id);
    if (success) toast.success('Duyuru silindi');
    else toast.error('Silinemedi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-3 font-medium">Ekibin göreceği duyurular</p>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black transition-colors"
          >
            <Plus size={14} /> Duyuru ekle
          </button>
        )}
      </div>

      {/* Inline form — only when creating */}
      {creating && (
        <div className="bg-surface-2/50 border border-border/40 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlık"
            autoFocus
            className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="İçerik..."
            rows={3}
            className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border resize-y"
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
            >
              <option value="normal">Normal</option>
              <option value="onemli">Önemli</option>
              <option value="acil">Acil</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                disabled={submitting}
                className="px-4 py-2 text-[13px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                className="px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-[12px] text-text-3 italic py-6 text-center">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-[12px] text-text-3 italic py-6 text-center">Henüz duyuru yok.</p>
        ) : (
          items.map((a) => {
            const styles = PRIORITY_STYLES[a.priority];
            const author = getAuthor(a.createdById);
            return (
              <div
                key={a.id}
                className={cn(
                  'p-5 border rounded-xl bg-white hover:shadow-sm transition-shadow group relative border-l-4',
                  styles.bar,
                  'border-border/60'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn('text-[9px] font-black px-2 py-0.5 rounded tracking-widest', styles.badge)}>
                    {PRIORITY_LABELS[a.priority]}
                  </span>
                  <h4 className="text-[15px] font-bold text-text-2">{a.title}</h4>
                </div>
                {a.content && (
                  <p className="text-[14px] text-text-2 mb-3 leading-relaxed whitespace-pre-line">{a.content}</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-text-3 font-medium">
                  <div className="flex items-center gap-2">
                    {author && (
                      <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', author.color)}>
                        {author.initials}
                      </span>
                    )}
                    <span>{author?.name ?? 'Bilinmiyor'}</span>
                    <span>· {formatTRCompact(a.createdAt.slice(0, 10))}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id, a.title)}
                    className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-500 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} /> sil
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
