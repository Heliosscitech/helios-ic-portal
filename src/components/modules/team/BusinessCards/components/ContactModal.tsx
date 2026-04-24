import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import type { ContactInfo, ContactFormData } from '../types';

interface ContactModalProps {
  contact?: ContactInfo;
  onClose: () => void;
  onSave: (data: ContactFormData) => void;
  onDelete?: () => void;
}

const TYPE_OPTIONS: { value: ContactInfo['type']; label: string }[] = [
  { value: 'customer', label: 'Müşteri' },
  { value: 'investor', label: 'Yatırımcı' },
  { value: 'academic', label: 'Akademi' },
  { value: 'supplier', label: 'Tedarikçi' },
  { value: 'other', label: 'Diğer' },
];

const SELECT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export const ContactModal: React.FC<ContactModalProps> = ({ contact, onClose, onSave, onDelete }) => {
  const isEdit = !!contact;
  const [name, setName] = useState(contact?.name ?? '');
  const [title, setTitle] = useState(contact?.title ?? '');
  const [company, setCompany] = useState(contact?.company ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [type, setType] = useState<ContactInfo['type']>(contact?.type ?? 'customer');
  const [tags, setTags] = useState<string[]>(contact?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const tagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('İsim zorunlu.'); return; }
    if (!title.trim()) { setError('Ünvan zorunlu.'); return; }
    if (!company.trim()) { setError('Şirket zorunlu.'); return; }
    onSave({ name: name.trim(), title: title.trim(), company: company.trim(), email: email.trim(), phone: phone.trim(), type, tags });
  };

  const handleDelete = () => {
    if (window.confirm(`"${contact?.name}" kartını silmek istediğinize emin misiniz?`)) {
      onDelete?.();
    }
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
              <h3 className="text-[15px] font-bold text-text">
                {isEdit ? 'Kartı düzenle' : 'Yeni kart ekle'}
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
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-bold">
                  {error}
                </div>
              )}

              <Field label="İsim" required>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ad Soyad"
                  className={cn(
                    'w-full p-3 bg-white border rounded-lg text-[14px] outline-none transition-colors font-medium',
                    'border-[#0C447C]/30 focus:border-[#0C447C] ring-2 ring-[#0C447C]/10'
                  )}
                />
              </Field>

              <Field label="Ünvan / Rol" required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Yatırım Direktörü"
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                />
              </Field>

              <Field label="Şirket" required>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Örn: Global Ventures"
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="E-posta">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com"
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5xx ..."
                    className="w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors font-mono"
                  />
                </Field>
              </div>

              <Field label="Tür" required>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContactInfo['type'])}
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] font-medium outline-none focus:border-text transition-colors appearance-none"
                  style={{
                    backgroundImage: SELECT_BG,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Etiketler">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] bg-surface-2 text-text-2 px-2 py-0.5 rounded-md font-bold"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-text ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={tagRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Etiket yaz, Enter'a bas"
                    className="flex-1 p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 border border-border rounded-lg text-[12px] font-bold text-text-2 hover:bg-surface-2 transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </Field>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex items-center justify-between gap-2">
              {isEdit && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-bold hover:bg-red-border/20 transition-colors"
                >
                  Sil
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
                  className="px-5 py-2 bg-[#0C447C] text-white rounded-lg text-[13px] font-bold shadow-sm hover:bg-[#0a3a6e] transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);
