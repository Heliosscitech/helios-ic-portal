import React, { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { useToast } from '../../../../lib/toast';
import type { Unit, BoardTask } from './types';

const COLOR_PALETTE = [
  { value: 'bg-purple-500', label: 'Mor' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-orange-500', label: 'Turuncu' },
  { value: 'bg-blue-500', label: 'Mavi' },
  { value: 'bg-gray-400', label: 'Gri' },
  { value: 'bg-pink-500', label: 'Pembe' },
  { value: 'bg-red-500', label: 'Kırmızı' },
  { value: 'bg-emerald-500', label: 'Yeşil' },
  { value: 'bg-amber-500', label: 'Sarı' },
  { value: 'bg-indigo-500', label: 'İndigo' },
];

interface UnitModalProps {
  units: Unit[];
  tasks: BoardTask[];
  onAdd: (label: string, dotColor: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export const UnitModal: React.FC<UnitModalProps> = ({ units, tasks, onAdd, onDelete, onClose }) => {
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].value);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await onAdd(label.trim(), color);
      setLabel('');
      setColor(COLOR_PALETTE[0].value);
      toast.success('Birim eklendi');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Eklenemedi: ' + msg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const count = tasks.filter((t) => t.unitId === id).length;
    if (count > 0) {
      toast.error(`Bu birimi kullanan ${count} iş var. Önce işleri başka birime taşı.`);
      return;
    }
    setDeletingId(id);
    try {
      await onDelete(id);
      toast.success('Birim silindi');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Silinemedi: ' + msg);
    }
    setDeletingId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h3 className="text-[15px] font-semibold text-text">Birimleri Yönet</h3>
            <button type="button" onClick={onClose} className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
              <X size={17} />
            </button>
          </div>

          {/* Mevcut birimler */}
          <div className="px-5 py-3 max-h-56 overflow-y-auto">
            {units.length === 0 && (
              <p className="text-[13px] text-text-3 text-center py-4">Henüz birim yok.</p>
            )}
            {units.map((u) => {
              const taskCount = tasks.filter((t) => t.unitId === u.id).length;
              return (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', u.dotColor)} />
                  <span className="flex-1 text-[13px] font-semibold text-text">{u.label}</span>
                  <span className="text-[11px] text-text-3 tabular-nums">{taskCount} iş</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id || taskCount > 0}
                    title={taskCount > 0 ? 'Önce işleri taşı' : 'Sil'}
                    className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Yeni birim ekle */}
          <form onSubmit={handleAdd} className="px-5 py-4 border-t border-border/40 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Yeni Birim</p>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Birim adı (ör. Pazarlama)"
              maxLength={40}
              className="w-full px-3 py-2 border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
            />
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'w-5 h-5 rounded-full transition-transform',
                    c.value,
                    color === c.value ? 'ring-2 ring-offset-1 ring-text scale-110' : 'hover:scale-110'
                  )}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!label.trim() || saving}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#1a1a19] text-white rounded-lg text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> {saving ? 'Ekleniyor…' : 'Birim Ekle'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
