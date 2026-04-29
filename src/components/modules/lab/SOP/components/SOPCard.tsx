import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import type { User } from '../../../../../types/portal';
import type { SOPProcedure } from '../types';
import { getCategoryMeta } from '../types';

interface SOPCardProps {
  item: SOPProcedure;
  owner?: User;
  onClick: () => void;
}

const formatDateShort = (iso: string): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

export const SOPCard: React.FC<SOPCardProps> = ({ item, owner, onClick }) => {
  const cat = getCategoryMeta(item.category);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.driveUrl) {
      window.open(item.driveUrl, '_blank', 'noopener,noreferrer');
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border-[0.5px] border-border rounded-2xl p-5 cursor-pointer transition-all hover:border-text/20 hover:shadow-sm flex flex-col gap-3 min-h-50"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded',
            cat.badge,
            cat.badgeText
          )}
        >
          {cat.label}
        </span>
        <span className="font-mono text-[11px] text-text-3 shrink-0">{item.version}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-semibold text-text leading-snug mb-1.5">{item.title}</h4>
        {item.summary && (
          <p className="text-[12.5px] text-text-3 leading-relaxed line-clamp-2">{item.summary}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
              owner?.color ?? 'bg-surface-2 text-text-3'
            )}
          >
            {owner?.initials ?? '??'}
          </span>
          <span className="text-[12px] text-text-2 font-medium truncate">
            {owner?.name.split(' ')[0] ?? '—'}
          </span>
          <span className="text-[11px] text-text-3">·</span>
          <span className="text-[11px] text-text-3 shrink-0">{formatDateShort(item.lastUpdated)}</span>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          disabled={!item.driveUrl}
          title={item.driveUrl ? 'Drive linkini aç' : 'Drive linki yok'}
          className={cn(
            'flex items-center gap-1 text-[12px] font-semibold transition-colors shrink-0',
            item.driveUrl
              ? 'text-info-text hover:underline'
              : 'text-text-3/40 cursor-not-allowed'
          )}
        >
          Aç <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};
