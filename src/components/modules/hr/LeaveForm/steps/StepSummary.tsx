import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { TR_MONTHS_LONG, formatTRLong } from '../../../../../lib/dates';
import type { User } from '../../../../../types/portal';
import { usePortalUsers } from '../../../../../lib/users';
import { DEPARTMENTS, REASONS } from '../types';
import type { LeaveFormState } from '../types';

interface StepSummaryProps {
  form: LeaveFormState;
  employee: User;
  onTelafiToggle: (dateStr: string) => void;
  onTelafiNotuChange: (v: string) => void;
}

const WEEK_DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];

export const StepSummary: React.FC<StepSummaryProps> = ({
  form,
  employee,
  onTelafiToggle,
  onTelafiNotuChange,
}) => {
  const { users } = usePortalUsers();
  const managerName = users.find((u) => u.id === form.managerId)?.name ?? '—';
  const reasonLabel = REASONS.find((r) => r.id === form.reason)?.label ?? '—';

  const today = new Date();
  const initYear = form.rangeStart ? parseInt(form.rangeStart.slice(0, 4)) : today.getFullYear();
  const initMonth = form.rangeStart ? parseInt(form.rangeStart.slice(5, 7)) : today.getMonth() + 1;
  const [viewYear, setViewYear] = React.useState(initYear);
  const [viewMonth, setViewMonth] = React.useState(initMonth);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstOffset = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
  const monthLabel = `${TR_MONTHS_LONG[viewMonth - 1]} ${viewYear}`;

  const navigateMonth = (dir: number) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const toISO = (day: number) =>
    `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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
            <button type="button" onClick={() => navigateMonth(-1)} className="p-1 hover:bg-white rounded border border-border/20">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[14px] font-semibold text-text">{monthLabel}</span>
            <button type="button" onClick={() => navigateMonth(1)} className="p-1 hover:bg-white rounded border border-border/20">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-text-3">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstOffset }, (_, i) => (
              <div key={`e${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const iso = toISO(d);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => onTelafiToggle(iso)}
                  className={cn(
                    'h-10 text-[13px] font-semibold rounded-lg transition-all',
                    form.telafiGunleri.includes(iso) ? 'bg-[#0F6E56] text-white' : 'text-text-3 hover:bg-white'
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
          {form.telafiGunleri.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[...form.telafiGunleri].sort().map((iso) => (
                <span
                  key={iso}
                  className="px-3 py-1 bg-[#E1F5EE] border border-[#0F6E56]/20 text-[#0F6E56] text-[11px] font-semibold rounded-full"
                >
                  {formatTRLong(iso)}
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
                ? `${formatTRLong(form.rangeStart)}${form.rangeEnd ? ` — ${formatTRLong(form.rangeEnd)}` : ''}`
                : '—',
            },
            { label: 'Neden', value: reasonLabel },
            {
              label: 'Telafi günleri',
              value: form.telafiGunleri.length > 0
                ? form.telafiGunleri.sort().map((iso) => formatTRLong(iso)).join(', ')
                : '—',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-4 border-b border-border/10 last:border-0 hover:bg-background px-2 transition-all"
            >
              <span className="text-[13px] text-text-3 font-medium">{item.label}</span>
              <span className="text-[13px] text-text font-semibold text-right truncate max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
