import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { PORTAL_USERS } from '../../../../../types/users';
import type { User } from '../../../../../types/portal';
import { DEPARTMENTS, REASONS } from '../types';
import type { LeaveFormState } from '../types';

interface StepSummaryProps {
  form: LeaveFormState;
  employee: User;
  onTelafiToggle: (day: number) => void;
  onTelafiNotuChange: (v: string) => void;
}

const WEEK_DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export const StepSummary: React.FC<StepSummaryProps> = ({
  form,
  employee,
  onTelafiToggle,
  onTelafiNotuChange,
}) => {
  const managerName = PORTAL_USERS.find((u) => u.id === form.managerId)?.name ?? '—';
  const reasonLabel = REASONS.find((r) => r.id === form.reason)?.label ?? '—';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest">
            03 — TELAFİ GÜNLERİ
          </h4>
          <p className="text-[13px] text-text-3">
            Farklı haftalarda birden fazla gün seçebilirsiniz — tıklayarak ekleyin, tekrar tıklayarak çıkarın.
          </p>
        </div>

        <div className="max-w-100 mx-auto text-center border border-border/10 p-6 rounded-2xl bg-surface/30">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 hover:bg-white rounded border border-border/20">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-semibold text-text">Nisan 2026</span>
            <button className="p-1 hover:bg-white rounded border border-border/20">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-text-3">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            <div className="h-10"></div>
            <div className="h-10"></div>
            {CALENDAR_DAYS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => onTelafiToggle(d)}
                className={cn(
                  'h-10 text-[13px] font-semibold rounded-lg transition-all',
                  form.telafiGunleri.includes(d)
                    ? 'bg-[#0F6E56] text-white'
                    : 'text-text-3 hover:bg-white'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {form.telafiGunleri.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[...form.telafiGunleri].sort((a, b) => a - b).map((d) => (
                <span
                  key={d}
                  className="px-3 py-1 bg-[#E1F5EE] border border-[#0F6E56]/20 text-[#0F6E56] text-[11px] font-semibold rounded-full"
                >
                  {d} Nisan
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-semibold text-text-2">Telafi notu (opsiyonel)</label>
          <textarea
            value={form.telafiNotu}
            onChange={(e) => onTelafiNotuChange(e.target.value)}
            placeholder="Örn: Sabah 08:00'de erken gelebilirim..."
            className="w-full min-h-25 p-4 text-[14px] border border-border/60 rounded-xl outline-none focus:border-text transition-all resize-none"
          />
        </div>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <h4 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest">
          ÖZET — KONTROL EDİN
        </h4>

        <div className="space-y-0.5 border-t border-border/20">
          {[
            { label: 'Çalışan', value: employee.name },
            { label: 'Departman', value: DEPARTMENTS.find((d) => d.id === form.departman)?.label ?? form.departman },
            { label: 'Yönetici', value: managerName },
            { label: 'E-posta', value: `${form.email}@heliosscitech.com` },
            {
              label: 'Devamsızlık',
              value: form.rangeStart
                ? `${form.rangeStart} Nisan 2026 ${form.rangeEnd ? `— ${form.rangeEnd} Nisan 2026` : ''}`
                : '—',
            },
            { label: 'Neden', value: reasonLabel },
            {
              label: 'Telafi günleri',
              value:
                form.telafiGunleri.length > 0
                  ? form.telafiGunleri.map((d) => `${d} Nisan`).join(', ')
                  : '—',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-4 border-b border-border/10 last:border-0 hover:bg-background px-2 transition-all"
            >
              <span className="text-[13px] text-text-3 font-medium">{item.label}</span>
              <span className="text-[13px] text-text font-semibold text-right truncate max-w-[60%]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
