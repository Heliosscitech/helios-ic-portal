import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, ChevronDown, ChevronRight,
  Trash2, ImagePlus, ClipboardCopy, X, Check,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ModuleProps } from '../../../../types/portal';
import type { PressCategory, PressItem, PressTab } from './types';
import { usePressItems } from './hooks';

const BRAND = '#8A2A4A';

const TAB_LABELS: Record<PressTab, string> = {
  linkedin: 'LinkedIn',
  website: 'Web sitesi',
  instagram: 'Instagram',
};

const TAB_PLACEHOLDERS: Record<PressTab, string> = {
  linkedin: 'LinkedIn paylaşımı — profesyonel, hikaye, hashtag...',
  website: 'Web sitesi haber metni — SEO dostu, paragraflar...',
  instagram: 'Instagram caption — kısa, etkileyici, emoji, hashtag...',
};

const CATEGORIES: PressCategory[] = ['Haber', 'Duyuru', 'Bülten'];

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

const todayISO = () => new Date().toISOString().split('T')[0];

export const Press: React.FC<ModuleProps> = ({ user }) => {
  const { items, addItem: addItemRow, updateMeta, updateContent: updateContentRow, deleteItem: deleteItemRow } = usePressItems();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PressTab>('linkedin');
  const [showNew, setShowNew] = useState(false);
  const [editItem, setEditItem] = useState<PressItem | null>(null);
  const [copied, setCopied] = useState(false);
  // draftKey tracks which "itemId:tab" the current draft belongs to.
  // When expandedId or activeTab changes, draftKey no longer matches → draft is ignored.
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const currentKey = expandedId ? `${expandedId}:${activeTab}` : null;
  const isDraftCurrent = draftKey === currentKey && isDirty;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setActiveTab('linkedin');
    setCopied(false);
  };

  const updateContent = (id: string, tab: PressTab, value: string) =>
    updateContentRow(id, tab, value);

  const handleDraftChange = (value: string) => {
    setDraftKey(currentKey);
    setDraft(value);
    setIsDirty(true);
    setSavedFeedback(false);
  };

  const handleSave = () => {
    if (!expandedId || !isDraftCurrent) return;
    updateContent(expandedId, activeTab, draft);
    setIsDirty(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const addItem = async (title: string, date: string, category: PressCategory) => {
    const created = await addItemRow(title, date, category, user.id);
    if (created) {
      setExpandedId(created.id);
      setActiveTab('linkedin');
    }
    setShowNew(false);
  };

  const saveEdit = async (patch: Pick<PressItem, 'title' | 'date' | 'category'>) => {
    if (!editItem) return;
    await updateMeta(editItem.id, patch);
    setEditItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
    await deleteItemRow(id);
    if (expandedId === id) setExpandedId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };


  return (
    <div className="max-w-4xl mx-auto p-8 md:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-[17px] font-semibold text-text tracking-tight mb-1">Basın / Haber arşivi</h2>
          <p className="text-[13px] text-text-3">Her haberin LinkedIn, Web sitesi, Instagram versiyonu</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: BRAND }}
        >
          <Plus size={15} /> Yeni haber
        </button>
      </div>

      {/* Accordion list */}
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-center py-16 text-text-3 text-[14px]">
            Henüz haber yok.{' '}
            <button onClick={() => setShowNew(true)} className="font-semibold underline" style={{ color: BRAND }}>
              İlk haberi ekle
            </button>
          </div>
        )}

        {items.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white border-[0.5px] border-border rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Collapsed header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#FFF1F4' }}
                >
                  <FileText size={16} style={{ color: BRAND }} />
                </div>

                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-[14px] font-semibold text-text truncate">{item.title}</p>
                  <p className="text-[11px] text-text-3 mt-0.5">
                    {formatDate(item.date)} · {item.category}
                  </p>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1.5 text-text-3 hover:bg-surface-2 rounded-lg transition-colors"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                    className="px-3 py-1.5 text-[12.5px] font-semibold text-text-2 hover:bg-surface-2 rounded-lg transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    className="p-1.5 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Expanded body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40 px-5 pt-4 pb-5">
                      {/* Görsel yükle */}
                      <ImageUploadButton />

                      {/* Platform tabs */}
                      <div className="flex gap-0 border-b border-border/40 mb-4">
                        {(Object.keys(TAB_LABELS) as PressTab[]).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              if (isDraftCurrent && expandedId) updateContent(expandedId, activeTab, draft);
                              setActiveTab(tab);
                              setCopied(false);
                            }}
                            className={cn(
                              'px-4 py-2 text-[13px] font-semibold border-b-2 transition-all -mb-px',
                              activeTab === tab
                                ? 'border-[#8A2A4A] text-[#8A2A4A]'
                                : 'border-transparent text-text-3 hover:text-text-2'
                            )}
                          >
                            {TAB_LABELS[tab]}
                          </button>
                        ))}
                      </div>

                      {/* Textarea */}
                      <textarea
                        value={isDraftCurrent ? draft : item[activeTab]}
                        onChange={(e) => handleDraftChange(e.target.value)}
                        placeholder={TAB_PLACEHOLDERS[activeTab]}
                        rows={8}
                        className="w-full text-[14px] text-text-2 bg-white border border-border/60 rounded-xl px-4 py-3 outline-none focus:border-[#8A2A4A]/40 transition-colors resize-y placeholder:text-text-3/60 leading-relaxed"
                      />

                      {/* Bottom bar */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(isDraftCurrent ? draft : item[activeTab])}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all',
                              copied
                                ? 'border-teal-border/40 bg-teal-bg text-teal-text'
                                : 'border-border text-text-2 hover:bg-surface-2'
                            )}
                          >
                            {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
                            {copied ? 'Kopyalandı' : 'Panoya kopyala'}
                          </button>

                          {isDraftCurrent && (
                            <button
                              onClick={handleSave}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-white transition-all"
                              style={{ backgroundColor: BRAND }}
                            >
                              Kaydet
                            </button>
                          )}

                          {savedFeedback && !isDraftCurrent && (
                            <span className="flex items-center gap-1 text-[12.5px] font-semibold text-teal-text">
                              <Check size={12} /> Kaydedildi
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-3 font-mono">
                          {(isDraftCurrent ? draft : item[activeTab]).length} karakter
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>


      {/* New modal */}
      {showNew && (
        <PressFormModal
          onClose={() => setShowNew(false)}
          onSave={(title, date, category) => addItem(title, date, category)}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <PressFormModal
          isEdit
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={(title, date, category) => saveEdit({ title, date, category })}
        />
      )}
    </div>
  );
};

// ── Image upload UI ───────────────────────────────────────────────────────────

const ImageUploadButton: React.FC = () => {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 mb-4">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-[12.5px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
      >
        <ImagePlus size={14} /> Görsel yükle
      </button>
      {fileName && (
        <span className="text-[11px] text-text-3 truncate max-w-xs">{fileName}</span>
      )}
    </div>
  );
};

// ── Press Form Modal (new + edit) ─────────────────────────────────────────────

interface PressFormModalProps {
  isEdit?: boolean;
  initial?: PressItem;
  onClose: () => void;
  onSave: (title: string, date: string, category: PressCategory) => void;
}

const PressFormModal: React.FC<PressFormModalProps> = ({
  isEdit = false,
  initial,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [category, setCategory] = useState<PressCategory>(initial?.category ?? 'Haber');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Başlık zorunlu.'); return; }
    onSave(title.trim(), date, category);
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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md mt-20 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text">
                {isEdit ? 'Haberi düzenle' : 'Yeni haber'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">
                  {error}
                </div>
              )}

              <FormField label="Başlık" required>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Haber başlığı..."
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none transition-colors font-medium"
                  style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                  onFocus={(e) => (e.target.style.borderColor = BRAND)}
                  onBlur={(e) => (e.target.style.borderColor = '')}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Tarih">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none transition-colors"
                    onFocus={(e) => (e.target.style.borderColor = BRAND)}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                  />
                </FormField>

                <FormField label="Kategori">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PressCategory)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] font-medium outline-none transition-colors"
                    onFocus={(e) => (e.target.style.borderColor = BRAND)}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white rounded-lg text-[13px] font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: BRAND }}
              >
                {isEdit ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label, required, children,
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default Press;
