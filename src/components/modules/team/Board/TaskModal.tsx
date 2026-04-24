import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Tag as TagIcon, Plus, MessageSquare, Clock, User as UserIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { formatTR } from '../../../../lib/dates';
import { PORTAL_USERS } from '../../../../types/users';
import {
  UNITS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from './types';
import type { BoardTask, Priority, TaskStatus, UnitId } from './types';

export type TaskModalMode = 'create' | 'detail';

interface TaskModalProps {
  mode: TaskModalMode;
  task?: BoardTask;
  currentUserId: string;
  onClose: () => void;
  onSave: (task: BoardTask) => void;
  onDelete?: (id: string) => void;
}

type FormState = Omit<BoardTask, 'id' | 'creatorId' | 'comments'> & {
  comments: number;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  unitId: 'arge',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assigneeIds: [],
  tags: [],
  comments: 0,
};

export const TaskModal: React.FC<TaskModalProps> = ({
  mode,
  task,
  currentUserId,
  onClose,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<FormState>(() =>
    mode === 'detail' && task
      ? {
          title: task.title,
          description: task.description ?? '',
          unitId: task.unitId,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assigneeIds: [...task.assigneeIds],
          tags: [...task.tags],
          comments: task.comments,
        }
      : EMPTY_FORM
  );
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleAssignee = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(id)
        ? prev.assigneeIds.filter((x) => x !== id)
        : [...prev.assigneeIds, id],
    }));
  };

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    if (form.tags.includes(v)) {
      setTagDraft('');
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, v] }));
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Başlık zorunlu.');
      return;
    }
    if (form.assigneeIds.length === 0) {
      setError('En az bir kişi atanmalı.');
      return;
    }

    const saved: BoardTask = {
      id: task?.id ?? `T-${Date.now().toString(36).toUpperCase()}`,
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      unitId: form.unitId,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      assigneeIds: form.assigneeIds,
      creatorId: task?.creatorId ?? currentUserId,
      tags: form.tags,
      comments: task?.comments ?? 0,
    };
    onSave(saved);
  };

  const creator = useMemo(() => {
    if (!task) return null;
    return PORTAL_USERS.find((u) => u.id === task.creatorId);
  }, [task]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-[640px] mt-10 mb-10 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {task && (
                  <span className="text-[11px] font-mono font-bold text-text-3 bg-surface-2 px-2 py-0.5 rounded">
                    {task.id}
                  </span>
                )}
                <h3 className="text-[15px] font-bold text-text">
                  {mode === 'create' ? 'Yeni İş Oluştur' : 'İş Detayı'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Örn: Pilot deneme tasarımı"
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Açıklama
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Detaylar..."
                  className="w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                    Birim
                  </label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value as UnitId })}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] font-medium outline-none focus:border-text transition-colors"
                  >
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                    Durum
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] font-medium outline-none focus:border-text transition-colors"
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                    Öncelik
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] font-medium outline-none focus:border-text transition-colors"
                  >
                    {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                    Son Tarih
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] font-mono outline-none focus:border-text transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Atananlar <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PORTAL_USERS.slice(0, 6).map((u) => {
                    const active = form.assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className={cn(
                          'flex items-center gap-2 pl-1 pr-3 py-1 border rounded-full transition-colors',
                          active
                            ? 'bg-[#1a1a19] text-white border-[#1a1a19]'
                            : 'bg-surface border-border text-text-2 hover:border-border-strong'
                        )}
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold',
                            u.color
                          )}
                        >
                          {u.initials}
                        </span>
                        <span className="text-[12px] font-bold">{u.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Etiketler
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-surface-2 text-text-2 uppercase tracking-wide"
                    >
                      <TagIcon size={10} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-text transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Yeni etiket (Enter ile ekle)"
                    className="flex-1 p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-[12px] font-bold text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    <Plus size={14} /> Ekle
                  </button>
                </div>
              </div>

              {mode === 'detail' && task && creator && (
                <div className="pt-3 border-t border-border/30 flex items-center gap-6 text-[11px] text-text-3">
                  <div className="flex items-center gap-1.5">
                    <UserIcon size={12} /> Atayan: <span className="font-bold text-text-2">{creator.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> {formatTR(task.dueDate)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={12} /> {task.comments} yorum
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex items-center justify-between">
              {mode === 'detail' && task && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(task.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-red-text hover:bg-red-bg rounded-lg transition-colors"
                >
                  <Trash2 size={14} /> Sil
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg text-[13px] font-bold text-text-2 hover:bg-surface-2 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a19] text-white rounded-lg text-[13px] font-bold shadow-sm hover:bg-black transition-colors"
                >
                  {mode === 'create' ? 'Oluştur' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
