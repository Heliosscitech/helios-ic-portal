import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from './utils';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

// Singleton — hook dışı modüllerden çağırmak için.
let confirmApi: ConfirmFn | null = null;
export const confirmAction = (options: ConfirmOptions): Promise<boolean> => {
  if (!confirmApi) return Promise.resolve(false);
  return confirmApi(options);
};

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => setPending({ options, resolve }));
  }, []);

  // Singleton'a register et — hook dışı çağrılar için.
  useEffect(() => {
    confirmApi = confirm;
    return () => { confirmApi = null; };
  }, [confirm]);

  const close = (result: boolean) => {
    if (pending) {
      pending.resolve(result);
      setPending(null);
    }
  };

  const isDanger = pending?.options.variant === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150"
          onClick={() => close(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-3">
                {isDanger && (
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-text leading-tight">{pending.options.title}</h2>
                  {pending.options.message && (
                    <p className="text-[13px] text-text-3 mt-1.5 leading-relaxed">{pending.options.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/40 flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 text-[13px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2 transition-colors"
              >
                {pending.options.cancelText ?? 'Vazgeç'}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={cn(
                  'px-4 py-2 text-[13px] font-bold rounded-lg transition-colors',
                  isDanger
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#1a1a19] text-white hover:bg-black'
                )}
              >
                {pending.options.confirmText ?? 'Tamam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
