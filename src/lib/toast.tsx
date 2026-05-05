import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from './utils';

type Variant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: Variant;
}

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// Hook dışı dosyalardan (hooks.ts, util'ler) çağırmak için singleton.
// Provider mount olunca register oluyor; öncesi çağrılar sessizce kayıp gider.
let toastApi: ToastApi | null = null;
export const toast = {
  success: (msg: string) => toastApi?.success(msg),
  error:   (msg: string) => toastApi?.error(msg),
  info:    (msg: string) => toastApi?.info(msg),
};

const TOAST_DURATION = 3000;

const VARIANT_STYLES: Record<Variant, { iconBg: string; iconColor: string; icon: React.ReactNode }> = {
  success: { iconBg: 'bg-teal-bg',  iconColor: 'text-teal-text',  icon: <CheckCircle2 size={16} /> },
  error:   { iconBg: 'bg-red-50',   iconColor: 'text-red-500',    icon: <AlertCircle size={16} /> },
  info:    { iconBg: 'bg-info-bg',  iconColor: 'text-info-text',  icon: <Info size={16} /> },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: Variant) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: (msg) => push(msg, 'success'),
    error:   (msg) => push(msg, 'error'),
    info:    (msg) => push(msg, 'info'),
  }), [push]);

  // Singleton'a register et — hook dışı modüllerin (hooks.ts, util) erişimi için.
  useEffect(() => {
    toastApi = api;
    return () => { toastApi = null; };
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const s = VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-2 py-2.5 rounded-xl shadow-md text-[13px] font-semibold border border-border/40 bg-white min-w-65 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', s.iconBg, s.iconColor)}>
                {s.icon}
              </span>
              <span className="flex-1 text-text-2">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="p-1 rounded text-text-3 hover:text-text hover:bg-surface-2">
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
