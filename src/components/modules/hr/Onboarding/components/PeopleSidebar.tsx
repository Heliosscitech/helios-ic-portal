import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { getInitials, getProgress } from '../utils';
import type { OnboardingPerson } from '../types';

interface PeopleSidebarProps {
  people: OnboardingPerson[];
  selectedId: string | null;
  canAddPerson: boolean;
  onSelect: (id: string) => void;
  onAddPerson: () => void;
}

export const PeopleSidebar: React.FC<PeopleSidebarProps> = ({
  people,
  selectedId,
  canAddPerson,
  onSelect,
  onAddPerson,
}) => {
  return (
    <aside className="w-60 shrink-0 bg-white border border-border/40 rounded-2xl p-4 h-fit">
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-3 px-2 mb-3">
        Ekip Üyeleri
      </h4>

      <div className="space-y-1">
        {people.map((p) => {
          const { percent } = getProgress(p);
          const isActive = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors',
                isActive ? 'bg-amber-bg' : 'hover:bg-surface-2/60'
              )}
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-[#F7ECE4] text-[#8A4A1A]">
                {getInitials(p.name)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-text truncate leading-tight">{p.name}</p>
                <p className="text-[11px] text-text-3 truncate leading-tight mt-0.5">{p.role}</p>
              </div>
              <span className="text-[11px] text-text-3 font-medium tabular-nums shrink-0">
                %{percent}
              </span>
            </button>
          );
        })}
      </div>

      {canAddPerson && (
        <button
          onClick={onAddPerson}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-text-3 hover:text-text hover:bg-surface-2/60 rounded-lg transition-colors"
        >
          <Plus size={14} /> Yeni kişi
        </button>
      )}
    </aside>
  );
};
