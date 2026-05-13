import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import { usePortalUsers } from '../../../../../lib/users';
import { DL_COLUMNS } from '../types';
import type { DLItem, DLStatus } from '../types';

export type DLModalMode = 'add' | 'edit';

export interface DLItemPayload {
  groupId:     string;
  title:       string;
  status:      DLStatus;
  notes?:      string;
  assigneeIds: string[];
}

interface AddItemModalProps {
  mode:           DLModalMode;
  item?:          DLItem;
  groupId:        string;
  initialStatus?: DLStatus;
  onClose:        () => void;
  onSave:         (payload: DLItemPayload) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  mode,
  item,
  groupId,
  initialStatus = 'backlog',
  onClose,
  onSave,
}) => {
  const { users } = usePortalUsers();

  const [title,       setTitle]       = useState(item?.title ?? '');
  const [status,      setStatus]      = useState<DLStatus>(item?.status ?? initialStatus);
  const [notes,       setNotes]       = useState(item?.notes ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(item?.assigneeIds ?? []);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setStatus(item.status);
      setNotes(item.notes ?? '');
      setAssigneeIds(item.assigneeIds);
    }
  }, [item]);

  const toggleAssignee = (uid: string) => {
    setAssigneeIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ groupId, title: title.trim(), status, notes: notes.trim() || undefined, assigneeIds });
  };

  return (
    <div
      className="fixed inset-0 z-10000 bg-black/30 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-[14px] font-bold text-text">
            {mode === 'add' ? 'Yeni Öge Ekle' : 'Ögeyi Düzenle'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-semibold text-text-2 mb-1.5">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Öge başlığı..."
              className="w-full px-3 py-2 text-[13px] border border-border rounded-lg outline-none focus:border-info-border focus:ring-2 focus:ring-info-border/20 transition-all"
            />
          </div>

          {/* Column / Status */}
          <div>
            <label className="block text-[12px] font-semibold text-text-2 mb-1.5">Sütun</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DLStatus)}
              className="w-full px-3 py-2 text-[13px] border border-border rounded-lg outline-none focus:border-info-border focus:ring-2 focus:ring-info-border/20 transition-all bg-white"
            >
              {DL_COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-[12px] font-semibold text-text-2 mb-2">
              Atananlar <span className="text-text-3 font-normal">(isteğe bağlı)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const selected = assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold border transition-all',
                      selected
                        ? 'bg-info-bg border-info-border text-info-text ring-1 ring-info-border/40'
                        : 'bg-surface-2 border-border text-text-3 hover:border-border-strong hover:text-text'
                    )}
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className={cn('w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0', u.color)}>
                        {u.initials}
                      </div>
                    )}
                    <span>{u.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-text-2 mb-1.5">
              Notlar <span className="text-text-3 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Açıklama veya notlar..."
              className="w-full px-3 py-2 text-[13px] border border-border rounded-lg outline-none focus:border-info-border focus:ring-2 focus:ring-info-border/20 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-[13px] font-semibold text-text-2 bg-surface-2 hover:bg-surface-2/80 rounded-lg border border-border transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2 text-[13px] font-semibold text-white bg-[#1a1a19] hover:bg-black rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mode === 'add' ? 'Ekle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
