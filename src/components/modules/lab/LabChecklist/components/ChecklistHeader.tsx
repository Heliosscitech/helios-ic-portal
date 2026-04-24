import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface ChecklistHeaderProps {
  activeTab: string;
  monday: Date;
  sunday: Date;
  sorumlu: string;
  navigateWeek: (dir: number) => void;
  resetDate: () => void;
  onAddEquipment: () => void;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
  activeTab,
  monday,
  sunday,
  sorumlu,
  navigateWeek,
  resetDate,
  onAddEquipment
}) => {
  const formatDate = (date: Date) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-semibold text-text uppercase tracking-tight">
          {activeTab === 'aylik' 
            ? monday.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
            : `${formatDate(monday)} — ${formatDate(sunday)}`}
        </span>
        <span className="text-[13px] text-text-3">•</span>
        <span className="text-[13px] text-text-3">Sorumlu: <span className="text-text font-semibold">{sorumlu}</span></span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button onClick={() => navigateWeek(-1)} className="p-1 hover:bg-surface-2 rounded border border-border/20 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={resetDate}
            className="px-4 py-1.5 border border-border rounded-lg text-[13px] font-semibold text-text hover:bg-surface-2 transition-all active:scale-95"
          >
            Bugüne dön
          </button>
          <button onClick={() => navigateWeek(1)} className="p-1 hover:bg-surface-2 rounded border border-border/20 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
        <button 
          onClick={onAddEquipment}
          className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-lg text-[13px] font-semibold text-text hover:bg-surface-2 transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} /> Ekipman
        </button>
      </div>
    </div>
  );
};
