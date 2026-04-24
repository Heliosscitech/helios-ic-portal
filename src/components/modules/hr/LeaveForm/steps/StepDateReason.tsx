import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { REASONS } from '../types';
import type { BelgeDurumu, LeaveReasonId } from '../types';

interface StepDateReasonProps {
  rangeStart: number;
  rangeEnd: number;
  reason: LeaveReasonId;
  reasonDetail: string;
  belge: BelgeDurumu;
  onToggleRange: (day: number) => void;
  onClearRange: () => void;
  onReasonChange: (r: LeaveReasonId) => void;
  onReasonDetailChange: (v: string) => void;
  onBelgeChange: (v: BelgeDurumu) => void;
}

const WEEK_DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

const SELECT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export const StepDateReason: React.FC<StepDateReasonProps> = ({
  rangeStart,
  rangeEnd,
  reason,
  reasonDetail,
  belge,
  onToggleRange,
  onClearRange,
  onReasonChange,
  onReasonDetailChange,
  onBelgeChange,
}) => {
  const isInRange = (day: number): boolean => {
    if (!rangeStart || !rangeEnd) return day === rangeStart;
    return day >= rangeStart && day <= rangeEnd;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <div className="space-y-1">
          <h2 className="text-[11px] font-black text-text-3 uppercase tracking-widest">
            02 — DEVAMSIZLIK TARİHLERİ
          </h2>
          <p className="text-[13px] text-text-3">
            İlk tıklama başlangıç, ikinci tıklama bitiş. Tek gün için aynı güne iki kez tıklayın.
          </p>
        </div>

        <div className="max-w-100 mx-auto text-center">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 hover:bg-surface-2 rounded border border-border/20">
              <ChevronLeft size={16} />
            </button>
            <span className="text-[15px] font-bold text-text">Nisan 2026</span>
            <button className="p-1 hover:bg-surface-2 rounded border border-border/20">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="text-[11px] font-bold text-text-3">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            <div className="h-10"></div>
            <div className="h-10"></div>
            {CALENDAR_DAYS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => onToggleRange(d)}
                className={cn(
                  'h-10 text-[13px] font-bold rounded-lg transition-all',
                  isInRange(d) ? 'bg-[#BA7517] text-white' : 'text-text-3 hover:bg-surface-2',
                  d === 22 && !isInRange(d) && 'text-[#378ADD]'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {rangeStart > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[13px] font-bold text-text-2 border-b-2 border-[#BA7517] pb-0.5">
                {rangeStart} Nisan 2026 {rangeEnd ? `— ${rangeEnd} Nisan 2026` : ''}
              </span>
              <button
                type="button"
                onClick={onClearRange}
                className="text-[12px] font-bold text-red-500 hover:scale-105 transition-all flex items-center gap-1"
              >
                <X size={14} /> Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <h2 className="text-[11px] font-black text-text-3 uppercase tracking-widest">
          02 — NEDEN <span className="text-red-500">*</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REASONS.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => onReasonChange(r.id)}
              className={cn(
                'flex items-center gap-4 p-5 border rounded-2xl transition-all group',
                reason === r.id
                  ? 'bg-[#1a1a19] border-[#1a1a19] text-white shadow-xl'
                  : 'bg-surface border-border/40 hover:border-border'
              )}
            >
              <div
                className={cn(
                  'shrink-0',
                  reason === r.id ? 'text-white' : 'text-text-3 group-hover:text-text'
                )}
              >
                <r.icon size={20} />
              </div>
              <span className="text-[14px] font-bold">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-bold text-text-2">Hastalık / belirti detayı</label>
          <textarea
            value={reasonDetail}
            onChange={(e) => onReasonDetailChange(e.target.value)}
            placeholder="Lütfen kısaca açıklayınız..."
            className="w-full min-h-30 p-4 text-[14px] border border-border rounded-xl outline-none focus:border-text transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-[13px] font-bold text-text-2 whitespace-nowrap">Belge durumu</label>
          <select
            value={belge}
            onChange={(e) => onBelgeChange(e.target.value as BelgeDurumu)}
            className="p-3 pr-10 border border-border rounded-xl text-[13px] outline-none appearance-none bg-white font-bold text-text-3"
            style={{
              backgroundImage: SELECT_BG,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.8rem center',
              backgroundSize: '0.8rem',
            }}
          >
            <option value="Sonradan getireceğim">Sonradan getireceğim</option>
            <option value="Ekledim">Ekledim</option>
            <option value="Gerekli değil">Gerekli değil</option>
          </select>
        </div>
      </div>
    </div>
  );
};
