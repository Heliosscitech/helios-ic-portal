import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import type { User } from '../../types/portal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../lib/toast';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (newPassword !== confirmPassword) { setError('Şifreler eşleşmiyor.'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success('Şifre güncellendi');
      onClose();
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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md mt-20 mb-8 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-text">Profilim</h3>
            <button type="button" onClick={onClose} className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0 ${user.color}`}>
                {user.initials}
              </div>
              <div>
                <p className="text-[15px] font-bold text-text">{user.name}</p>
                <p className="text-[13px] text-text-3">{user.role}</p>
                {user.email && <p className="text-[12px] text-text-3 mt-0.5">{user.email}</p>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-text-3 border-t border-border/40 pt-5">
                Şifre Değiştir
              </p>

              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Yeni Şifre</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full p-3 pr-10 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Şifreyi Onayla</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Tekrar girin"
                    className="w-full p-3 pr-10 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword}
                  className="px-5 py-2 text-white rounded-lg text-[13px] font-semibold bg-[#1a1a19] hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Güncelleniyor…' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
