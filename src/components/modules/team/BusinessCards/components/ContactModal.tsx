import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { todayISO } from '../../../../../lib/dates';
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
  const [type, setType] = useState<ContactInfo['type']>(contact?.type ?? 'customer');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [neredeTanistiniz, setNeredeTanistiniz] = useState(contact?.neredeTanistiniz ?? '');
  const [tarih, setTarih] = useState(contact?.tarih ?? todayISO());
  const [not, setNot] = useState(contact?.not ?? '');
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
    if (!name.trim()) {
      setError('İsim zorunlu.');
      return;
    }
    onSave({
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      type,
      tags: contact?.tags ?? [],
      neredeTanistiniz: neredeTanistiniz.trim() || undefined,
      tarih: tarih || undefined,
      not: not.trim() || undefined,
    });
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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-2xl mt-16 mb-8 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text">
                {isEdit ? 'Kartviziti düzenle' : 'Yeni kartvizit'}
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="İsim" required>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                  />
                </Field>
                <Field label="Ünvan">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                </Field>

                <Field label="Şirket">
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                </Field>
                <Field label="Kategori">
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

                <Field label="E-posta">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-mono"
                  />
                </Field>

                <Field label="Nerede tanıştınız">
                  <input
                    value={neredeTanistiniz}
                    onChange={(e) => setNeredeTanistiniz(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                </Field>
                <Field label="Tarih">
                  <input
                    type="date"
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-mono"
                  />
                </Field>

                <div className="col-span-2">
                  <Field label="Not">
                    <textarea
                      value={not}
                      onChange={(e) => setNot(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors resize-none"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex items-center justify-between gap-2">
              {isEdit && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold hover:bg-red-border/20 transition-colors"
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
                  className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0C447C] text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-[#0a3a6e] transition-colors"
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

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="text-[12.5px] font-semibold uppercase tracking-widest text-text-3">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);
