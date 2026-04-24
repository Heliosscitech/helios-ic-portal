import React, { useState } from 'react';
import { Clock, MessageSquare, Plus, MoreVertical, GripVertical } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatTRCompact, isToday } from '../../../../../lib/dates';
import { PORTAL_USERS } from '../../../../../types/users';
import { UNITS } from '../types';
import type { BoardTask, TaskStatus } from '../types';

interface BoardViewProps {
  tasks: BoardTask[];
  onTaskClick: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; dot: string }[] = [
  { id: 'todo', title: 'Yapılacak', dot: 'bg-gray-400' },
  { id: 'doing', title: 'Devam Ediyor', dot: 'bg-amber-500' },
  { id: 'done', title: 'Tamamlandı', dot: 'bg-teal-500' },
];

const DRAG_MIME = 'application/x-helios-task-id';

const getUserInitials = (id: string) => PORTAL_USERS.find((u) => u.id === id)?.initials ?? '??';
const getUserColor = (id: string) =>
  PORTAL_USERS.find((u) => u.id === id)?.color ?? 'bg-surface-2 text-text-3';
const getUnitLabel = (id: string) => UNITS.find((u) => u.id === id)?.label ?? '';
const getUnitDot = (id: string) => UNITS.find((u) => u.id === id)?.dotColor ?? 'bg-text-3';

export const BoardView: React.FC<BoardViewProps> = ({ tasks, onTaskClick, onStatusChange }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData(DRAG_MIME, id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, col: TaskStatus) => {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
    if (id) onStatusChange(id, col);
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-5 h-full items-start min-w-max">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleColumnDragOver(e, col.id)}
              onDragLeave={() => dragOverCol === col.id && setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'w-[320px] flex flex-col rounded-xl border transition-colors',
                isOver
                  ? 'bg-info-bg/40 border-info-border/50 ring-2 ring-info-border/30'
                  : 'bg-surface-2/50 border-transparent hover:border-border/40'
              )}
            >
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', col.dot)} />
                  <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-text-2">
                    {col.title}
                  </h3>
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full text-text-3 font-mono">
                    {colTasks.length}
                  </span>
                </div>
                <button className="text-text-3 hover:text-text p-1 rounded-md hover:bg-white/50 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="flex-1 px-2 pb-4 space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTaskClick(task.id)}
                    className={cn(
                      'bg-white border border-border rounded-lg p-4 cursor-pointer shadow-sm group relative transition-all duration-150',
                      'hover:-translate-y-0.5 hover:shadow-md',
                      draggingId === task.id && 'opacity-40 ring-2 ring-info-border'
                    )}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-3">
                      <GripVertical size={14} />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3 pr-4">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 bg-surface-2 text-text-2'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', getUnitDot(task.unitId))} />
                        {getUnitLabel(task.unitId)}
                      </span>
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-2 text-text-2 uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-[14px] font-semibold text-text leading-snug mb-3 group-hover:text-[#010D52] transition-colors">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/60">
                      <div className="flex items-center gap-3 text-[11px] text-text-3">
                        <div
                          className={cn(
                            'flex items-center gap-1',
                            isToday(task.dueDate) && 'text-red-border font-bold'
                          )}
                        >
                          <Clock size={12} />
                          <span className="font-mono">{isToday(task.dueDate) ? 'Bugün' : formatTRCompact(task.dueDate)}</span>
                        </div>
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>{task.comments}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex -space-x-2">
                        {task.assigneeIds.slice(0, 3).map((uid) => (
                          <div
                            key={uid}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 border-white text-[9px] font-bold flex items-center justify-center',
                              getUserColor(uid)
                            )}
                            title={PORTAL_USERS.find((u) => u.id === uid)?.name}
                          >
                            {getUserInitials(uid)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div
                    className={cn(
                      'py-10 text-center text-[12px] italic border-2 border-dashed rounded-lg transition-colors',
                      isOver
                        ? 'border-info-border/60 text-info-text bg-white/50'
                        : 'border-border/30 text-text-3'
                    )}
                  >
                    {isOver ? 'Buraya bırak' : 'Bu kolonda iş yok.'}
                  </div>
                )}
              </div>

              <div className="px-2 pb-3">
                <button className="w-full flex items-center gap-2 justify-center py-2 text-[12px] text-text-3 hover:text-text hover:bg-white/50 rounded-lg transition-all">
                  <Plus size={14} /> Görev Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
