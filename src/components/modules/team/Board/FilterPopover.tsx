import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export interface PopoverItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
}

interface FilterPopoverProps {
  label: string;
  items: PopoverItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear?: () => void;
  emptyText?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  label,
  items,
  selectedIds,
  onToggle,
  onClear,
  emptyText = 'Seçenek yok',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const count = selectedIds.length;
  const hasSelection = count > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[13px] font-semibold transition-colors',
          hasSelection
            ? 'bg-info-bg text-info-text border-info-border/40'
            : 'border-border text-text-2 hover:bg-surface-2'
        )}
      >
        <ChevronDown size={14} className="opacity-60" />
        {label}
        {hasSelection && (
          <span className="bg-info-text/10 text-info-text text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-border rounded-xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ara..."
                className="w-full pl-8 pr-3 py-2 bg-surface-2/40 border border-transparent rounded-lg text-[13px] outline-none focus:bg-white focus:border-border"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-text-3 italic">
                {emptyText}
              </div>
            ) : (
              filtered.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors group',
                      selected ? 'bg-info-bg/40' : 'hover:bg-surface-2/60'
                    )}
                  >
                    <span
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        selected
                          ? 'bg-info-text border-info-text text-white'
                          : 'border-border group-hover:border-border-strong'
                      )}
                    >
                      {selected && <Check size={12} strokeWidth={3} />}
                    </span>
                    {item.badge}
                    <span className="flex-1 text-[13px] font-medium text-text-2 truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {hasSelection && onClear && (
            <div className="p-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setQuery('');
                }}
                className="w-full py-1.5 text-[12px] font-bold text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-colors"
              >
                Seçimi temizle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
