import React, { useState } from 'react';
import { Clock, MessageSquare, Plus, MoreVertical, GripVertical, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { confirmAction } from '../../../../../lib/confirm';
import { formatTRCompact, isToday, isPast } from '../../../../../lib/dates';
import { usePortalUsers } from '../../../../../lib/users';
import { UNITS } from '../types';
import type { BoardColumn, BoardTask, TaskStatus } from '../types';

interface BoardViewProps {
  tasks: BoardTask[];
  columns: BoardColumn[];
  onTaskClick: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (columnId: string) => void;
  onAddColumn: (title: string) => void;
  onRenameColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onReorderColumns: (fromId: string, toId: string) => void;
}

const TASK_DRAG_MIME = 'application/x-helios-task-id';
const COLUMN_DRAG_MIME = 'application/x-helios-column-id';

const getUnitLabel = (id: string) => UNITS.find((u) => u.id === id)?.label ?? '';
const getUnitDot = (id: string) => UNITS.find((u) => u.id === id)?.dotColor ?? 'bg-text-3';

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  columns,
  onTaskClick,
  onStatusChange,
  onDeleteTask,
  onAddTask,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumns,
}) => {
  const { users } = usePortalUsers();
  const getUserInitials = (id: string) => users.find((u) => u.id === id)?.initials ?? '??';
  const getUserColor = (id: string) => users.find((u) => u.id === id)?.color ?? 'bg-surface-2 text-text-3';

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingColId, setDraggingColId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState('');

  // ── Task drag ─────────────────────────────────────────────
  const handleTaskDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData(TASK_DRAG_MIME, id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(id);
  };

  const handleTaskDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverCol(null);
  };

  // ── Column drag ───────────────────────────────────────────
  const handleColDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData(COLUMN_DRAG_MIME, id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingColId(id);
  };

  const handleColDragEnd = () => setDraggingColId(null);

  // ── Drop target (column body) ─────────────────────────────
  const handleColumnDragOver = (e: React.DragEvent, col: string) => {
    if (draggingTaskId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverCol !== col) setDragOverCol(col);
    } else if (draggingColId && draggingColId !== col) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData(TASK_DRAG_MIME);
    const colId = e.dataTransfer.getData(COLUMN_DRAG_MIME);
    if (taskId) {
      onStatusChange(taskId, col);
    } else if (colId && colId !== col) {
      onReorderColumns(colId, col);
    }
    setDraggingTaskId(null);
    setDraggingColId(null);
    setDragOverCol(null);
  };

  const startRename = (col: BoardColumn) => {
    setRenamingId(col.id);
    setRenameDraft(col.title);
  };

  const commitRename = () => {
    if (renamingId) onRenameColumn(renamingId, renameDraft);
    setRenamingId(null);
  };

  const commitAdd = () => {
    if (addDraft.trim()) onAddColumn(addDraft);
    setAddDraft('');
    setAdding(false);
  };

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-5 h-full items-start min-w-max">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isOver = dragOverCol === col.id;
          const isRenaming = renamingId === col.id;
          const isDraggingThisCol = draggingColId === col.id;
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
                  : 'bg-surface-2/50 border-transparent hover:border-border/40',
                isDraggingThisCol && 'opacity-40',
                draggingColId && draggingColId !== col.id && 'jiggle-active'
              )}
            >
              <div
                className="p-4 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                draggable={!isRenaming}
                onDragStart={(e) => handleColDragStart(e, col.id)}
                onDragEnd={handleColDragEnd}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', col.dot)} />
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-[1px] text-text-2 bg-white border border-info-border/60 rounded px-1.5 py-0.5 outline-none"
                    />
                  ) : (
                    <h3
                      onDoubleClick={() => startRename(col)}
                      title="Çift tıkla: adı değiştir"
                      className="text-[11px] font-semibold uppercase tracking-[1px] text-text-2 truncate cursor-text"
                    >
                      {col.title}
                    </h3>
                  )}
                  <span className="text-[11px] bg-white px-2 py-0.5 rounded-full text-text-3 font-mono shrink-0">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 [.group-hover\\:opacity-100]:opacity-100">
                  <button
                    onClick={() => onDeleteColumn(col.id)}
                    title="Kolonu sil"
                    className="text-text-3 hover:text-red-text hover:bg-red-bg p-1 rounded-md transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button className="text-text-3 hover:text-text p-1 rounded-md hover:bg-white/50 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 px-2 pb-4 space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleTaskDragStart(e, task.id)}
                    onDragEnd={handleTaskDragEnd}
                    onClick={() => onTaskClick(task.id)}
                    className={cn(
                      'bg-white border border-border rounded-lg p-4 cursor-pointer shadow-sm group relative transition-all duration-150',
                      'hover:-translate-y-0.5 hover:shadow-md',
                      draggingTaskId === task.id
                        ? 'opacity-40 ring-2 ring-info-border scale-95'
                        : draggingTaskId !== null && 'jiggle-active'
                    )}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirmAction({
                            title: 'İşi sil?',
                            message: `"${task.title}" kalıcı olarak silinecek.`,
                            confirmText: 'Sil',
                            variant: 'danger',
                          });
                          if (ok) onDeleteTask(task.id);
                        }}
                        title="İşi sil"
                        className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      <span className="p-1 text-text-3">
                        <GripVertical size={14} />
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3 pr-4">
                      <span
                        className={cn(
                          'text-[10.5px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 bg-surface-2 text-text-2'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', getUnitDot(task.unitId))} />
                        {getUnitLabel(task.unitId)}
                      </span>
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-surface-2 text-text-2 uppercase tracking-wide"
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
                            (isToday(task.dueDate) || isPast(task.dueDate)) && 'text-red-text font-semibold'
                          )}
                        >
                          <Clock size={12} />
                          <span className="font-mono">
                            {isToday(task.dueDate) ? 'Bugün' : isPast(task.dueDate) ? 'Gecikti!' : formatTRCompact(task.dueDate)}
                          </span>
                        </div>
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>{task.comments}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex -space-x-2">
                        {task.assigneeIds.slice(0, 3).map((uid) => {
                          const u = users.find((u) => u.id === uid);
                          return u?.avatarUrl ? (
                            <img
                              key={uid}
                              src={u.avatarUrl}
                              alt={u.name}
                              title={u.name}
                              className="w-6 h-6 rounded-full border-2 border-white object-cover"
                            />
                          ) : (
                            <div
                              key={uid}
                              className={cn(
                                'w-6 h-6 rounded-full border-2 border-white text-[10.5px] font-semibold flex items-center justify-center',
                                getUserColor(uid)
                              )}
                              title={u?.name}
                            >
                              {getUserInitials(uid)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div
                    className={cn(
                      'py-10 text-center text-[12.5px] italic border-2 border-dashed rounded-lg transition-colors',
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
                <button
                  onClick={() => onAddTask(col.id)}
                  className="w-full flex items-center gap-2 justify-center py-2 text-[12.5px] text-text-3 hover:text-text hover:bg-white/50 rounded-lg transition-all"
                >
                  <Plus size={14} /> Görev Ekle
                </button>
              </div>
            </div>
          );
        })}

        {/* Add column */}
        <div className="w-70 shrink-0">
          {adding ? (
            <div className="bg-white border-2 border-info-border rounded-xl p-3 shadow-md flex items-center gap-2">
              <input
                autoFocus
                value={addDraft}
                onChange={(e) => setAddDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd();
                  if (e.key === 'Escape') {
                    setAddDraft('');
                    setAdding(false);
                  }
                }}
                placeholder="Yeni kolon adı..."
                className="flex-1 text-[13px] font-semibold bg-transparent outline-none"
              />
              <button
                onClick={commitAdd}
                className="p-1 text-teal-text hover:bg-teal-bg rounded transition-colors"
                title="Ekle"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => {
                  setAddDraft('');
                  setAdding(false);
                }}
                className="p-1 text-text-3 hover:bg-surface-2 rounded transition-colors"
                title="Vazgeç"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="group w-full flex flex-col items-center justify-center gap-2 py-10 text-[13px] font-semibold text-text-2 hover:text-info-text bg-surface-2/70 hover:bg-info-bg border-2 border-dashed border-border-strong hover:border-info-border rounded-xl transition-all"
            >
              <span className="w-9 h-9 rounded-full bg-white border-2 border-border-strong group-hover:border-info-border group-hover:bg-info-bg flex items-center justify-center transition-colors">
                <Plus size={18} />
              </span>
              Kolon Ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
