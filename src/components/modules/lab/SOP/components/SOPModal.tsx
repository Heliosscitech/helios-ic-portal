import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { usePortalUsers } from '../../../../../lib/users';
import type { SOPCategory, SOPFormData, SOPProcedure } from '../types';
import { SOP_CATEGORIES } from '../types';

interface SOPModalProps {
  item?: SOPProcedure;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: SOPFormData) => void;
  onDelete?: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const parseTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

export const SOPModal: React.FC<SOPModalProps> = ({
  item,
  currentUserId,
  onClose,
  onSave,
  onDelete,
}) => {
  const { users } = usePortalUsers();
  const isEdit = Boolean(item);

  const [title, setTitle] = useState(item?.title ?? '');
  const [category, setCategory] = useState<SOPCategory>(item?.category ?? 'sentez');
  const [version, setVersion] = useState(item?.version ?? 'v1.0');
  const [lastUpdated, setLastUpdated] = useState(item?.lastUpdated ?? todayISO());
  const [ownerId, setOwnerId] = useState(item?.ownerId ?? currentUserId);
  const [driveUrl, setDriveUrl] = useState(item?.driveUrl ?? '');
  const [summary, setSummary] = useState(item?.summary ?? '');
  const [tagsInput, setTagsInput] = useState((item?.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Başlık zorunlu.');
      return;
    }
    onSave({
      title: title.trim(),
      category,
      version: version.trim() || 'v1.0',
      lastUpdated: lastUpdated || todayISO(),
      ownerId,
      driveUrl: driveUrl.trim() || undefined,
      summary: summary.trim() || undefined,
      tags: parseTags(tagsInput),
    });
  };

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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-16 mb-8 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text">
                {isEdit ? 'Prosedürü düzenle' : 'Yeni prosedür'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">
                  {error}
                </div>
              )}

              <Field label="Başlık *">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Kategori">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SOPCategory)}
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                  >
                    {SOP_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Versiyon">
                  <input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors font-mono"
                  />
                </Field>
                <Field label="Son güncelleme">
                  <input
                    type="date"
                    value={lastUpdated}
                    onChange={(e) => setLastUpdated(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                  />
                </Field>
              </div>

              <Field label="Sahibi">
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Drive / Dosya URL">
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                />
              </Field>

              <Field label="Özet">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors resize-none"
                />
              </Field>

              <Field label="Etiketler (virgülle ayır)">
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="CALF-20, sentez, SOP"
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                />
              </Field>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex items-center justify-between">
              <div>
                {isEdit && onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-red-text hover:bg-red-bg rounded-lg transition-colors"
                  >
                    <Trash2 size={13} /> Sil
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white rounded-lg text-[13px] font-semibold bg-teal-600 shadow-sm hover:bg-teal-700 transition-colors"
                >
                  {isEdit ? 'Kaydet' : 'Ekle'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">
      {label}
    </label>
    {children}
  </div>
);
