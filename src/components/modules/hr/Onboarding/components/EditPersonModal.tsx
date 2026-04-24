import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { PORTAL_USERS } from '../../../../../types/users';
import type { OnboardingPerson } from '../types';

export type PersonModalMode = 'add' | 'edit';

export interface PersonFormData {
  name: string;
  role: string;
  startDate: string;
  ownerId: string | null;
}

interface EditPersonModalProps {
  mode: PersonModalMode;
  person?: OnboardingPerson;
  onClose: () => void;
  onSave: (data: PersonFormData) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const EditPersonModal: React.FC<EditPersonModalProps> = ({ mode, person, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [ownerId, setOwnerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && person) {
      setName(person.name);
      setRole(person.role);
      setStartDate(person.startDate);
      setOwnerId(person.ownerId ?? '');
    } else {
      setName('');
      setRole('');
      setStartDate(todayISO());
      setOwnerId('');
    }
    setError(null);
  }, [mode, person]);

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
    if (!role.trim()) {
      setError('Rol zorunlu.');
      return;
    }
    onSave({
      name: name.trim(),
      role: role.trim(),
      startDate,
      ownerId: ownerId || null,
    });
  };

  const SELECT_BG =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

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
                {mode === 'add' ? 'Yeni kişi' : 'Kişi düzenle'}
              </h3>
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
                  İsim <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ad Soyad"
                  className={cn(
                    'w-full p-3 bg-white border rounded-lg text-[14px] outline-none transition-colors font-medium',
                    'border-[#BA7517] focus:border-[#BA7517] ring-2 ring-[#BA7517]/15'
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Rol <span className="text-red-500">*</span>
                </label>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Örn: Developer Stajyeri"
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] font-mono outline-none focus:border-text transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold uppercase tracking-widest text-text-3">
                  Portal Kullanıcısı (opsiyonel)
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] font-medium outline-none focus:border-text transition-colors appearance-none"
                  style={{
                    backgroundImage: SELECT_BG,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1rem',
                  }}
                >
                  <option value="">— Bağlantı yok —</option>
                  {PORTAL_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-3 leading-relaxed">
                  Seçilen kullanıcı bu onboarding kaydını kendi Onboarding sayfasında görebilir ve task'larını kendisi işaretleyebilir.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-[13px] font-bold text-text-2 hover:bg-surface-2 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#BA7517] text-white rounded-lg text-[13px] font-bold shadow-sm hover:bg-[#a46515] transition-colors"
              >
                Kaydet
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
