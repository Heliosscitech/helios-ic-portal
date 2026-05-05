import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelative } from '../../lib/dates';
import { formatMoney } from '../../lib/currency';
import { BreadcrumbHome } from '../BreadcrumbHome';

// =====================================================================
// Shared building blocks for the read-only "external mirror" modules
// (LabStock, Sales, Accounting, Runway). These four sibling modules
// fetch from `external_*` tables and share the same dashboard skeleton:
// header with synced indicator, KPI stat cards, table cells, modal
// detail fields. Keeping the shared shell here avoids the same ~80
// lines of layout code in every module.
// =====================================================================

export const LastSyncedHeader: React.FC<{
  syncedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}> = ({ syncedAt, refreshing, onRefresh }) => {
  if (!syncedAt) return null;
  return (
    <div className="flex items-center gap-3 text-[11px] text-text-3 bg-white border border-border/40 rounded-xl px-3 py-2">
      <span>Son senkron: <span className="font-bold text-text-2">{formatRelative(syncedAt)}</span></span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-2 text-text-2 disabled:opacity-60"
        title="helios-portal'dan canlı çek + yenile"
      >
        <RefreshCw size={12} className={cn(refreshing && 'animate-spin')} />
      </button>
    </div>
  );
};

export const PageHeader: React.FC<{
  title: string;
  subtitle: string;
  syncedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}> = ({ title, subtitle, syncedAt, refreshing, onRefresh }) => (
  <div className="space-y-3">
    <div className="text-[12px] text-text-3 font-medium">
      <BreadcrumbHome />
    </div>
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-[40px] font-black tracking-tight text-text leading-none">{title}</h1>
        <p className="text-[13px] text-text-3 font-medium mt-2">{subtitle}</p>
      </div>
      <LastSyncedHeader syncedAt={syncedAt} refreshing={refreshing} onRefresh={onRefresh} />
    </div>
  </div>
);

export const StatCard: React.FC<{
  label: string;
  /** Renders large value content. Pass a string for default 28px treatment, or arbitrary children for custom layouts. */
  children: React.ReactNode;
  hint?: string;
  hintColor?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}> = ({ label, children, hint, hintColor, icon, iconBg, iconColor }) => (
  <div className="bg-white border border-border/40 rounded-2xl p-5 flex items-start justify-between gap-3 min-h-30">
    <div className="flex flex-col gap-2 min-w-0 flex-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">{label}</span>
      <div>{children}</div>
      {hint && <span className={cn('text-[11px] mt-1', hintColor ?? 'text-text-3')}>{hint}</span>}
    </div>
    {icon && (
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg, iconColor)}>
        {icon}
      </div>
    )}
  </div>
);

export const Th: React.FC<{ children?: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th className={cn(
    'px-4 py-3 text-[10px] font-bold uppercase tracking-widest',
    align === 'right' ? 'text-right' : 'text-left'
  )}>
    {children}
  </th>
);

export const Td: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  title?: string;
}> = ({ children, align = 'left', className, title }) => (
  <td
    className={cn('px-4 py-3', align === 'right' && 'text-right', className)}
    title={title}
  >
    {children}
  </td>
);

export const DetailField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">{label}</span>
    <span className="text-[13px] text-text font-medium wrap-break-word">{value}</span>
  </div>
);

export const LoadingBlock: React.FC = () => (
  <div className="bg-white border border-border/40 rounded-2xl p-12 text-center text-[13px] text-text-3">Yükleniyor…</div>
);

export const ErrorBlock: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-[13px] text-red-700">
    Yüklenemedi: {message}
  </div>
);

// Çoklu para birimi gösterimi: tek birim varsa büyük (24px), birden fazlaysa
// dikey stack (18px). zeroColor / negativeColor verilirse o değer aralığındaki
// satırlar o renkte gösterilir (örn. Net Bakiye: pozitif yeşil, negatif kırmızı).
export const CurrencyLines: React.FC<{
  values: Array<[string, number]>;
  valueColor: string;
  zeroColor?: string;
  negativeColor?: string;
}> = ({ values, valueColor, zeroColor, negativeColor }) => {
  const pickColor = (amt: number): string => {
    if (amt < 0 && negativeColor) return negativeColor;
    if (amt === 0 && zeroColor) return zeroColor;
    return valueColor;
  };
  if (values.length === 0) {
    return <span className={cn('text-[24px] font-black leading-none tabular-nums', zeroColor ?? valueColor)}>—</span>;
  }
  if (values.length === 1) {
    const [cur, amt] = values[0];
    return (
      <span className={cn('text-[24px] font-black leading-none tabular-nums', pickColor(amt))}>
        {formatMoney(amt, cur)}
      </span>
    );
  }
  return (
    <div className="space-y-1.5">
      {values.map(([cur, amt]) => (
        <div key={cur} className={cn('text-[18px] font-black leading-none tabular-nums', pickColor(amt))}>
          {formatMoney(amt, cur)}
        </div>
      ))}
    </div>
  );
};
