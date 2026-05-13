import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { DL_ITEM_DRAG_MIME } from '../types';
import type { DLColumn, DLItem, DLStatus } from '../types';
import { DLCard } from './Card';

interface DLColumnProps {
  column:        DLColumn;
  items:         DLItem[];
  draggingId:    string | null;
  dragOverColId: DLStatus | null;
  onEdit:        (item: DLItem) => void;
  onDelete:      (id: string) => void;
  onDragStart:   (e: React.DragEvent, id: string) => void;
  onDragEnd:     () => void;
  onDragOver:    (e: React.DragEvent, colId: DLStatus) => void;
  onDragLeave:   (colId: DLStatus) => void;
  onDrop:        (e: React.DragEvent, colId: DLStatus) => void;
  onAddItem:     (status: DLStatus) => void;
}

export const DLColumn: React.FC<DLColumnProps> = ({
  column,
  items,
  draggingId,
  dragOverColId,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddItem,
}) => {
  const isOver = dragOverColId === column.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DL_ITEM_DRAG_MIME)) return;
    onDragOver(e, column.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    onDrop(e, column.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => onDragLeave(column.id)}
      onDrop={handleDrop}
      className={cn(
        'w-[300px] flex flex-col rounded-xl border transition-colors',
        isOver
          ? 'bg-info-bg/40 border-info-border/50 ring-2 ring-info-border/30'
          : 'bg-surface-2/50 border-transparent hover:border-border/40'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full shrink-0', column.dot)} />
          <h3 className="text-[11px] font-semibold uppercase tracking-[1px] text-text-2 flex-1 truncate">
            {column.label}
          </h3>
          <span className="text-[11px] bg-white px-2 py-0.5 rounded-full text-text-3 font-mono shrink-0">
            {items.length}
          </span>
        </div>
        {column.id === 'completed' && (
          <p className="text-[10.5px] text-text-3 italic mt-1.5 leading-snug">
            15 günden eski ögeler otomatik silinir.
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-2 space-y-2.5 min-h-[80px]">
        {items.map((item) => (
          <DLCard
            key={item.id}
            item={item}
            isDragging={draggingId === item.id}
            otherDragging={draggingId !== null && draggingId !== item.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {items.length === 0 && (
          <div
            className={cn(
              'py-8 text-center text-[12px] italic border-2 border-dashed rounded-lg transition-colors',
              isOver
                ? 'border-info-border/60 text-info-text bg-white/50'
                : 'border-border/30 text-text-3'
            )}
          >
            {isOver ? 'Buraya bırak' : 'Bu kolonda öge yok.'}
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-3">
        <button
          onClick={() => onAddItem(column.id)}
          className="w-full flex items-center gap-1.5 justify-center py-2 text-[12px] text-text-3 hover:text-text hover:bg-white/50 rounded-lg transition-all"
        >
          <Plus size={13} /> Ekle
        </button>
      </div>
    </div>
  );
};
