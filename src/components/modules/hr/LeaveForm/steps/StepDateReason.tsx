import React from 'react';
import { ChevronLeft, ChevronRight, X, Upload, FileText } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { TR_MONTHS_LONG, formatTRLong } from '../../../../../lib/dates';
import { REASONS } from '../types';
import type { BelgeDurumu, LeaveReasonId } from '../types';

interface StepDateReasonProps {
  rangeStart: string; // ISO "YYYY-MM-DD", empty = not selected
  rangeEnd: string;   // ISO "YYYY-MM-DD", empty = single day
  reason: LeaveReasonId;
  reasonDetail: string;
  belge: BelgeDurumu;
  belgeFileName?: string;
  belgeFileDataUrl?: string;
  onToggleRange: (dateStr: string) => void;
  onClearRange: () => void;
  onReasonChange: (r: LeaveReasonId) => void;
  onReasonDetailChange: (v: string) => void;
  onBelgeChange: (v: BelgeDurumu) => void;
  onBelgeFileChange: (name: string | undefined, dataUrl: string | undefined) => void;
}

const MAX_INLINE_FILE_BYTES = 1_000_000;
const WEEK_DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];

const SELECT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export const StepDateReason: React.FC<StepDateReasonProps> = ({
  rangeStart,
  rangeEnd,
  reason,
  reasonDetail,
  belge,
  belgeFileName,
  belgeFileDataUrl,
  onToggleRange,
  onClearRange,
  onReasonChange,
  onReasonDetailChange,
  onBelgeChange,
  onBelgeFileChange,
}) => {
  const [fileError, setFileError] = React.useState<string | null>(null);
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth() + 1); // 1-12

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstOffset = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7; // Mon = 0
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

  const isInRange = (day: number): boolean => {
    if (!rangeStart) return false;
    const iso = toISO(day);
    if (!rangeEnd) return iso === rangeStart;
    return iso >= rangeStart && iso <= rangeEnd;
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_INLINE_FILE_BYTES) {
      onBelgeFileChange(file.name, undefined);
      setFileError(`Dosya büyük (${(file.size / 1024 / 1024).toFixed(1)} MB) — sadece adı kaydedildi, önizleme olmayacak.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onBelgeFileChange(file.name, typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.onerror = () => {
      onBelgeFileChange(file.name, undefined);
      setFileError('Dosya okunamadı — sadece adı kaydedildi.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <div className="space-y-1">
          <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest">
            02 — DEVAMSIZLIK TARİHLERİ
          </h2>
          <p className="text-[13px] text-text-3">
            İlk tıklama başlangıç, ikinci tıklama bitiş. Tek gün için aynı güne iki kez tıklayın.
          </p>
        </div>

        <div className="max-w-100 mx-auto text-center">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-surface-2 rounded border border-border/20"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[15px] font-semibold text-text">{monthLabel}</span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-surface-2 rounded border border-border/20"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-text-3">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstOffset }, (_, i) => (
              <div key={`e${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => onToggleRange(toISO(d))}
                className={cn(
                  'h-10 text-[13px] font-semibold rounded-lg transition-all',
                  isInRange(d) ? 'bg-[#BA7517] text-white' : 'text-text-3 hover:bg-surface-2'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {rangeStart && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[13px] font-semibold text-text-2 border-b-2 border-[#BA7517] pb-0.5">
                {formatTRLong(rangeStart)}{rangeEnd ? ` — ${formatTRLong(rangeEnd)}` : ''}
              </span>
              <button
                type="button"
                onClick={onClearRange}
                className="text-[12.5px] font-semibold text-red-500 hover:scale-105 transition-all flex items-center gap-1"
              >
                <X size={14} /> Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-8">
        <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest">
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
              <div className={cn('shrink-0', reason === r.id ? 'text-white' : 'text-text-3 group-hover:text-text')}>
                <r.icon size={20} />
              </div>
              <span className="text-[14px] font-semibold">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-semibold text-text-2">Hastalık / belirti detayı</label>
          <textarea
            value={reasonDetail}
            onChange={(e) => onReasonDetailChange(e.target.value)}
            placeholder="Lütfen kısaca açıklayınız..."
            className="w-full min-h-30 p-4 text-[14px] border border-border rounded-xl outline-none focus:border-text transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-[13px] font-semibold text-text-2 whitespace-nowrap">Belge durumu</label>
          <select
            value={belge}
            onChange={(e) => {
              const v = e.target.value as BelgeDurumu;
              onBelgeChange(v);
              if (v !== 'Ekledim') {
                onBelgeFileChange(undefined, undefined);
                setFileError(null);
              }
            }}
            className="p-3 pr-10 border border-border rounded-xl text-[13px] outline-none appearance-none bg-white font-semibold text-text-3"
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

          {belge === 'Ekledim' && (
            <div className="flex-1 min-w-60">
              {belgeFileName ? (
                <div className="flex items-center gap-3 px-3 py-2 border border-teal-border/40 bg-teal-bg/30 rounded-xl">
                  <FileText size={16} className="text-teal-text shrink-0" />
                  <span className="flex-1 min-w-0 text-[13px] font-semibold text-text truncate">{belgeFileName}</span>
                  {belgeFileDataUrl && (
                    <a
                      href={belgeFileDataUrl}
                      download={belgeFileName}
                      className="text-[11px] font-semibold text-info-text hover:underline"
                    >
                      İndir
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => { onBelgeFileChange(undefined, undefined); setFileError(null); }}
                    className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors"
                    title="Kaldır"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-2/40 transition-colors">
                  <Upload size={15} className="text-text-3" />
                  <span className="text-[13px] font-semibold text-text-3">Belge yükle...</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {fileError && <p className="mt-1.5 text-[11px] text-amber-text">{fileError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
