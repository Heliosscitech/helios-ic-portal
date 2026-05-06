import React from 'react';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePortalUsers } from '../../../../lib/users';
import { UNITS } from './types';
import type { BoardFilter } from './types';
import { FilterPopover } from './FilterPopover';
import type { PopoverItem } from './FilterPopover';

interface BoardToolbarProps {
  filter: BoardFilter;
  activeFilterCount: number;
  availableTags: string[];
  onTogglePerson: (id: string) => void;
  onToggleTag: (tag: string) => void;
  onClearPersons: () => void;
  onClearTags: () => void;
  onClearFilters: () => void;
  onNewTask: () => void;
}

export const BoardToolbar: React.FC<BoardToolbarProps> = ({
  filter,
  activeFilterCount,
  availableTags,
  onTogglePerson,
  onToggleTag,
  onClearPersons,
  onClearTags,
  onClearFilters,
  onNewTask,
}) => {
  const { users } = usePortalUsers();
  const unitLabel =
    filter.unitId === 'all'
      ? 'Tüm birimler'
      : UNITS.find((u) => u.id === filter.unitId)?.label ?? 'Tüm birimler';

  const personItems: PopoverItem[] = users.slice(0, 6).map((u) => ({
    id: u.id,
    label: u.name,
    badge: (
      <span
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0',
          u.color
        )}
      >
        {u.initials}
      </span>
    ),
  }));

  const tagItems: PopoverItem[] = availableTags.map((t) => ({
    id: t,
    label: t,
    badge: <TagIcon size={12} className="text-text-3 shrink-0" />,
  }));

  return (
    <div className="px-8 pt-6 pb-5 border-b border-border/40">
      <p className="text-[12.5px] text-text-3 font-medium mb-1">Projeler · {unitLabel}</p>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-[20px] font-semibold text-text tracking-tight">Tüm İşler</h1>

          <div className="flex items-center gap-2 ml-4">
            <FilterPopover
              label="Kişi"
              items={personItems}
              selectedIds={filter.personIds}
              onToggle={onTogglePerson}
              onClear={onClearPersons}
              emptyText="Kişi bulunamadı"
            />
            <FilterPopover
              label="Etiket"
              items={tagItems}
              selectedIds={filter.tags}
              onToggle={onToggleTag}
              onClear={onClearTags}
              emptyText="Etiket yok"
            />
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors',
                  'bg-amber-bg text-amber-text border border-amber-border/30 hover:bg-amber-bg/80'
                )}
              >
                <X size={12} />
                Temizle ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.id}
                title={u.name}
                className={cn(
                  'w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10.5px] font-semibold',
                  u.color
                )}
              >
                {u.initials}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-surface-2 text-text-3 flex items-center justify-center text-[10.5px] font-semibold">
                +{users.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={onNewTask}
            className="flex items-center gap-2 px-4 py-2 bg-[#BA7517] text-white rounded-lg text-[13px] font-semibold shadow-md hover:bg-[#a46515] transition-colors"
          >
            <Plus size={14} /> Yeni iş
          </button>
        </div>
      </div>
    </div>
  );
};
