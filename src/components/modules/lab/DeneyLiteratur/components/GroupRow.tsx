import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Pencil, Check, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import { confirmAction } from '../../../../../lib/confirm';
import { DL_COLUMNS, DL_ITEM_DRAG_MIME } from '../types';
import type { DLColumn, DLGroup, DLItem, DLStatus } from '../types';
import { DLCard } from './Card';

// ── Mini column (içinde sürükleme hedefi) ─────────────────────────────────────

interface MiniColumnProps {
  column:        DLColumn;
  items:         DLItem[];
  draggingId:    string | null;
  dragOverColId: DLStatus | null;
  onDragOver:    (e: React.DragEvent, colId: DLStatus) => void;
  onDragLeave:   (colId: DLStatus) => void;
  onDrop:        (e: React.DragEvent, colId: DLStatus) => void;
  onOpen:        (item: DLItem) => void;
  onDelete:      (id: string) => void;
  onDragStart:   (e: React.DragEvent, id: string) => void;
  onDragEnd:     () => void;
  onAddItem:     (status: DLStatus) => void;
}

const MiniColumn: React.FC<MiniColumnProps> = ({
  column, items, draggingId, dragOverColId,
  onDragOver, onDragLeave, onDrop,
  onOpen, onDelete, onDragStart, onDragEnd, onAddItem,
}) => {
  const isOver = dragOverColId === column.id;

  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DL_ITEM_DRAG_MIME)) return;
        onDragOver(e, column.id);
      }}
      onDragLeave={() => onDragLeave(column.id)}
      onDrop={(e) => onDrop(e, column.id)}
      className={cn(
        'w-[280px] flex flex-col rounded-xl border transition-colors',
        isOver
          ? 'bg-info-bg/40 border-info-border/50 ring-2 ring-info-border/30'
          : 'bg-surface-2/50 border-transparent hover:border-border/40'
      )}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full shrink-0', column.dot)} />
        <h4 className="text-[10.5px] font-semibold uppercase tracking-[1px] text-text-2 flex-1 truncate">
          {column.label}
        </h4>
        <span className="text-[10.5px] bg-white px-1.5 py-0.5 rounded-full text-text-3 font-mono shrink-0">
          {items.length}
        </span>
        {column.id === 'completed' && (
          <span className="text-[9.5px] text-teal-600 font-medium">✓</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-1 space-y-2 min-h-[60px]">
        {items.map((item) => (
          <DLCard
            key={item.id}
            item={item}
            isDragging={draggingId === item.id}
            otherDragging={draggingId !== null && draggingId !== item.id}
            onOpen={onOpen}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {items.length === 0 && (
          <div
            className={cn(
              'py-6 text-center text-[11.5px] italic border-2 border-dashed rounded-lg transition-colors',
              isOver
                ? 'border-info-border/60 text-info-text bg-white/50'
                : 'border-border/30 text-text-3'
            )}
          >
            {isOver ? 'Buraya bırak' : 'Boş'}
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-2.5">
        <button
          onClick={() => onAddItem(column.id)}
          className="w-full flex items-center gap-1 justify-center py-1.5 text-[11.5px] text-text-3 hover:text-text hover:bg-white/60 rounded-lg transition-all"
        >
          <Plus size={12} /> Oluştur
        </button>
      </div>
    </div>
  );
};

// ── Group row ──────────────────────────────────────────────────────────────────

interface GroupRowProps {
  group:         DLGroup;
  items:         DLItem[];
  onRenameGroup: (id: string, title: string) => void;
  onDeleteGroup: (id: string) => void;
  onMoveItem:    (id: string, newStatus: DLStatus) => void;
  onDeleteItem:  (id: string) => void;
  onOpenItem:    (item: DLItem) => void;
  onAddItem:     (groupId: string, status: DLStatus) => void;
}

export const GroupRow: React.FC<GroupRowProps> = ({
  group,
  items,
  onRenameGroup,
  onDeleteGroup,
  onMoveItem,
  onDeleteItem,
  onOpenItem,
  onAddItem,
}) => {
  const [collapsed,    setCollapsed]   = useState(false);
  const [renaming,     setRenaming]    = useState(false);
  const [renameDraft,  setRenameDraft] = useState(group.title);
  const [draggingId,   setDraggingId]  = useState<string | null>(null);
  const [dragOverCol,  setDragOverCol] = useState<DLStatus | null>(null);

  const commitRename = () => {
    if (renameDraft.trim() && renameDraft.trim() !== group.title) {
      onRenameGroup(group.id, renameDraft.trim());
    } else {
      setRenameDraft(group.title);
    }
    setRenaming(false);
  };

  const handleDeleteGroup = async () => {
    const ok = await confirmAction({
      title: 'Grubu sil?',
      message: `"${group.title}" grubu ve içindeki tüm ögeler kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) onDeleteGroup(group.id);
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const ok = await confirmAction({
      title: 'Ögeyi sil?',
      message: `"${item?.title ?? 'Bu öge'}" kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) onDeleteItem(id);
  };

  // Drag handlers (local to this group)
  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: DLStatus) => {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDragLeave = (colId: DLStatus) => {
    if (dragOverCol === colId) setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: DLStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DL_ITEM_DRAG_MIME);
    if (id) onMoveItem(id, colId);
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden bg-white">
      {/* ── Group header ── */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none group/header hover:bg-surface-2/40 transition-colors"
        onClick={() => !renaming && setCollapsed((v) => !v)}
      >
        {/* Chevron */}
        <span className="text-text-3 shrink-0 transition-transform">
          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </span>

        {/* Title / rename input */}
        {renaming ? (
          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setRenameDraft(group.title); setRenaming(false); }
              }}
              className="flex-1 min-w-0 text-[13px] font-semibold bg-white border border-info-border/60 rounded px-2 py-0.5 outline-none"
            />
            <button onClick={commitRename} className="p-1 text-teal-text hover:bg-teal-bg rounded">
              <Check size={13} />
            </button>
            <button onClick={() => { setRenameDraft(group.title); setRenaming(false); }} className="p-1 text-text-3 hover:bg-surface-2 rounded">
              <X size={13} />
            </button>
          </div>
        ) : (
          <span className="text-[13px] font-semibold text-text flex-1 truncate">
            {group.title}
          </span>
        )}

        {/* Item count badge */}
        {!renaming && (
          <span className="text-[11px] text-text-3 font-mono shrink-0 bg-surface-2 px-2 py-0.5 rounded-full">
            {items.length} öge
          </span>
        )}

        {/* Actions (hover) */}
        {!renaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setRenameDraft(group.title); setRenaming(true); }}
              title="Grubu yeniden adlandır"
              className="p-1.5 text-text-3 hover:text-info-text hover:bg-info-bg rounded-md transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDeleteGroup}
              title="Grubu sil"
              className="p-1.5 text-text-3 hover:text-red-text hover:bg-red-bg rounded-md transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Mini-board ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 bg-[#f9fafb] overflow-x-auto p-4">
              <div className="flex gap-3 items-start min-w-max">
                {DL_COLUMNS.map((col) => (
                  <MiniColumn
                    key={col.id}
                    column={col}
                    items={items.filter((i) => i.status === col.id)}
                    draggingId={draggingId}
                    dragOverColId={dragOverCol}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onOpen={onOpenItem}
                    onDelete={handleDeleteItem}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onAddItem={(status) => onAddItem(group.id, status)}
                  />
                ))}
              </div>
              {/* Completed auto-delete note */}
              <p className="text-[10.5px] text-text-3 italic mt-3">
                Tamamlandı sütunundaki ögeler 15 gün sonra otomatik silinir.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
