import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatDateTR, getInitials, getProgress } from '../utils';
import type { OnboardingPerson } from '../types';

interface PersonHeaderProps {
  person: OnboardingPerson;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const PersonHeader: React.FC<PersonHeaderProps> = ({ person, canEdit, onEdit, onDelete }) => {
  const { done, total, percent } = getProgress(person);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0 bg-[#F7ECE4] text-[#8A4A1A]">
          {getInitials(person.name)}
        </span>
        <div className="flex-1 min-w-0 pt-1">
          <h2 className="text-[20px] font-semibold text-text leading-tight">{person.name}</h2>
          <p className="text-[13px] text-text-3 mt-1">
            {person.role} · Başlangıç: {formatDateTR(person.startDate)}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="px-4 py-1.5 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
            >
              Düzenle
            </button>
            <button
              onClick={onDelete}
              title="Kişiyi sil"
              className="p-2 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={cn('h-full bg-[#BA7517] transition-all duration-500 ease-out')}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[12.5px] font-semibold text-text-2 tabular-nums shrink-0">
          {done}/{total} · %{percent}
        </span>
      </div>
    </div>
  );
};
