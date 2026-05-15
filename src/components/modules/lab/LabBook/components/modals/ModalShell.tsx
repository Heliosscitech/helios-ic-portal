import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalShellProps {
  title:       string;
  breadcrumb?: string;
  onClose:     () => void;
  onSubmit:    (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel: string;
  children:    React.ReactNode;
  maxWidth?:   string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  title, breadcrumb, onClose, onSubmit, submitting, submitLabel, children, maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-10000 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.16 }}
        className={`bg-[#FAF8F1] rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden border border-[#cdc4ad]`}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#cdc4ad] bg-white/60">
          <div className="flex-1 min-w-0">
            {breadcrumb && (
              <div className="text-[10.5px] font-semibold tracking-[1.5px] uppercase text-[#6f6749] mb-1">
                {breadcrumb}
              </div>
            )}
            <h2 className="helios-eln-title text-[20px] font-bold leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6f6749] hover:bg-[#ece4cf] rounded-lg shrink-0">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {children}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#cdc4ad] bg-white/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-semibold text-[#5a5240] bg-white border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-white bg-[#1F3D2E] rounded-lg hover:bg-[#163022] disabled:opacity-60"
            >
              {submitting ? 'Kaydediliyor...' : submitLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── Form alanı bileşenleri ──────────────────────────────────────────────────

export const FormField: React.FC<{
  label:    string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-semibold uppercase tracking-[1px] text-[#6f6749] mb-1.5">
      {label} {required && <span className="text-[#791F1F]">*</span>}
    </label>
    {children}
  </div>
);

export const inputClass =
  'w-full px-3 py-2 text-[13px] bg-white border border-[#cdc4ad] rounded-lg outline-none focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15 placeholder:text-[#9b9275]';
