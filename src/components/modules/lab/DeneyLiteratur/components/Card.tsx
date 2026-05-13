import React, { useRef, useState } from 'react';
import { Trash2, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { getCachedUsers } from '../../../../../lib/users';
import { DL_ITEM_DRAG_MIME, formatDate, formatDT } from '../types';
import type { DLItem } from '../types';

interface DLCardProps {
  item:          DLItem;
  isDragging:    boolean;
  otherDragging: boolean;
  onOpen:        (item: DLItem) => void;
  onDelete:      (id: string) => void;
  onDragStart:   (e: React.DragEvent, id: string) => void;
  onDragEnd:     () => void;
}

export const DLCard: React.FC<DLCardProps> = ({
  item,
  isDragging,
  otherDragging,
  onOpen,
  onDelete,
  onDragStart,
  onDragEnd,
}) => {
  const users = getCachedUsers();
  const didDrag = useRef(false);

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = item.dueDate && item.status !== 'completed' && item.dueDate < today;

  return (
    <div
      draggable
      onClick={() => { if (!didDrag.current) onOpen(item); }}
      onDragStart={(e) => {
        didDrag.current = true;
        e.dataTransfer.setData(DL_ITEM_DRAG_MIME, item.id);
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(e, item.id);
      }}
      onDragEnd={() => { onDragEnd(); setTimeout(() => { didDrag.current = false; }, 0); }}
      className={cn(
        'bg-white border border-border rounded-lg p-3.5 cursor-pointer shadow-sm group relative transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        isDragging
          ? 'opacity-40 ring-2 ring-info-border scale-95'
          : otherDragging && 'jiggle-active'
      )}
    >
      {/* Hover: delete button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          title="Sil"
          className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-[13.5px] font-semibold text-text leading-snug mb-1.5 pr-6">
        {item.title}
      </h4>

      {/* Notes preview */}
      {item.notes && (
        <p className="text-[11.5px] text-text-3 leading-snug line-clamp-2 mb-2">
          {item.notes}
        </p>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-surface-2 text-text-2 rounded-full">
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-surface-2 text-text-3 rounded-full">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: date + assignees */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1 text-[11px] text-text-3">
          {item.status === 'completed' && item.completedAt ? (
            <div className="flex items-center gap-1 text-teal-600">
              <CheckCircle2 size={11} />
              <span>{formatDT(item.completedAt)}</span>
            </div>
          ) : item.dueDate ? (
            <div className={cn('flex items-center gap-1', isOverdue ? 'text-red-500' : 'text-text-3')}>
              <Clock size={11} />
              <span>{formatDate(item.dueDate)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar size={11} />
              <span>{formatDT(item.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Assignee avatars */}
        {item.assigneeIds.length > 0 && (
          <div className="flex -space-x-1.5">
            {item.assigneeIds.slice(0, 3).map((uid) => {
              const u = users.find((u) => u.id === uid);
              return u?.avatarUrl ? (
                <img
                  key={uid}
                  src={u.avatarUrl}
                  alt={u.name}
                  title={u.name}
                  className="w-5 h-5 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div
                  key={uid}
                  title={u?.name ?? uid}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 border-white text-[9px] font-bold flex items-center justify-center shrink-0',
                    u?.color ?? 'bg-surface-2 text-text-3'
                  )}
                >
                  {u?.initials ?? '?'}
                </div>
              );
            })}
            {item.assigneeIds.length > 3 && (
              <div className="w-5 h-5 rounded-full border-2 border-white bg-surface-2 text-[9px] font-bold flex items-center justify-center text-text-3">
                +{item.assigneeIds.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
