import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigation } from '../../../../lib/navigation';
import { useNotifications } from '../../../../lib/notifications';
import type { ModuleProps } from '../../../../types/portal';
import { DL_COLUMNS } from './types';
import type { DLItem, DLStatus } from './types';
import { useDLData } from './hooks';
import { GroupRow } from './components/GroupRow';
import { AddItemModal } from './components/AddItemModal';
import type { DLItemPayload, DLModalMode } from './components/AddItemModal';
import { ItemDetailModal } from './components/ItemDetailModal';

type AddEditModal = {
  mode:           DLModalMode;
  item?:          DLItem;
  groupId:        string;
  initialStatus?: DLStatus;
};

type DetailModal = {
  mode:    'detail';
  item:    DLItem;
  groupId: string;
};

type ModalState = AddEditModal | DetailModal | null;

const uniqueTargets = (ids: string[], actorId: string) =>
  Array.from(new Set(ids)).filter((id) => id !== actorId);

const statusLabel = (id: DLStatus) => DL_COLUMNS.find((c) => c.id === id)?.label ?? id;

export const DeneyLiteratur: React.FC<ModuleProps> = ({ user }) => {
  const { goHome } = useNavigation();
  const { dispatch } = useNotifications();
  const { groups, items, loading, addGroup, renameGroup, deleteGroup, addItem, updateItem, moveItem, deleteItem } = useDLData();

  const [modal,       setModal]       = useState<ModalState>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupDraft,  setGroupDraft]  = useState('');

  const commitAddGroup = async () => {
    if (!groupDraft.trim()) { setAddingGroup(false); return; }
    await addGroup(groupDraft.trim());
    setGroupDraft('');
    setAddingGroup(false);
  };

  // ── Save (add / edit) ──────────────────────────────────────────────────────
  const handleSave = async (payload: DLItemPayload) => {
    if (modal?.mode === 'add') {
      const created = await addItem(payload.groupId, payload.title, payload.status, payload.notes, payload.assigneeIds);
      if (created) {
        const targets = uniqueTargets(payload.assigneeIds, user.id);
        if (targets.length > 0) {
          dispatch({
            type: 'task-assigned',
            source: 'deney-literatur',
            entityId: created.id,
            entityTitle: created.title,
            actorId: user.id,
            targetUserIds: targets,
            message: `size bir öge atadı: "${created.title}"`,
          });
        }
      }
    } else if (modal?.mode === 'edit' && modal.item) {
      const prevAssigneeIds = modal.item.assigneeIds;
      await updateItem(
        modal.item.id,
        { title: payload.title, status: payload.status, notes: payload.notes },
        payload.assigneeIds
      );
      // Notify only newly added assignees
      const newlyAdded = payload.assigneeIds.filter((id) => !prevAssigneeIds.includes(id));
      const targets = uniqueTargets(newlyAdded, user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-assigned',
          source: 'deney-literatur',
          entityId: modal.item.id,
          entityTitle: payload.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `size bir öge atadı: "${payload.title}"`,
        });
      }
    }
    setModal(null);
  };

  // ── Open item detail ──────────────────────────────────────────────────────
  const handleOpenItem = (item: DLItem) => {
    setModal({ mode: 'detail', item, groupId: item.groupId });
  };

  // ── Update from detail modal ──────────────────────────────────────────────
  const handleDetailUpdate = async (
    id: string,
    patch: Partial<Pick<DLItem, 'title' | 'notes' | 'status' | 'dueDate' | 'tags'>>,
    newAssigneeIds?: string[]
  ) => {
    const prevItem = items.find((i) => i.id === id);
    await updateItem(id, patch, newAssigneeIds);

    // Status-change notification
    if (patch.status && prevItem && patch.status !== prevItem.status) {
      const assigneeIds = newAssigneeIds ?? prevItem.assigneeIds;
      const targets = uniqueTargets(assigneeIds, user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-status-changed',
          source: 'deney-literatur',
          entityId: id,
          entityTitle: patch.title ?? prevItem.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `"${patch.title ?? prevItem.title}" durumunu "${statusLabel(patch.status as DLStatus)}" olarak değiştirdi`,
        });
      }
    }

    // New-assignee notification
    if (newAssigneeIds && prevItem) {
      const newlyAdded = newAssigneeIds.filter((id) => !prevItem.assigneeIds.includes(id));
      const targets = uniqueTargets(newlyAdded, user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-assigned',
          source: 'deney-literatur',
          entityId: id,
          entityTitle: patch.title ?? prevItem.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `size bir öge atadı: "${patch.title ?? prevItem.title}"`,
        });
      }
    }

    // Keep the detail modal in sync with the updated item
    setModal((prev) => {
      if (!prev || prev.mode !== 'detail' || prev.item.id !== id) return prev;
      return {
        ...prev,
        item: {
          ...prev.item,
          ...patch,
          ...(newAssigneeIds !== undefined ? { assigneeIds: newAssigneeIds } : {}),
        },
      };
    });
  };

  // ── Move (drag-drop status change) ────────────────────────────────────────
  const handleMoveItem = async (id: string, newStatus: DLStatus) => {
    const item = items.find((i) => i.id === id);
    await moveItem(id, newStatus);
    if (item && item.assigneeIds.length > 0) {
      const targets = uniqueTargets(item.assigneeIds, user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-status-changed',
          source: 'deney-literatur',
          entityId: id,
          entityTitle: item.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `"${item.title}" durumunu "${statusLabel(newStatus)}" olarak değiştirdi`,
        });
      }
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-300 mx-auto px-8 pb-6 space-y-3">
        <div className="h-10 bg-surface-2 rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-300 mx-auto px-8 pb-8">
      {/* Breadcrumb */}
      <div className="bg-white px-5 py-2.5 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium mb-4">
        <button onClick={goHome} className="hover:text-text transition-colors">
          Ana Sayfa
        </button>
        <span>/</span>
        <span className="text-text font-semibold">Deney &amp; Literatür</span>
      </div>

      {/* Group list */}
      <div className="space-y-3">
        {groups.length === 0 && !addingGroup && (
          <div className="bg-white border border-border/40 rounded-xl py-16 text-center">
            <p className="text-[13px] text-text-3 mb-3">Henüz grup yok. İlk grubu ekleyin.</p>
            <button
              onClick={() => setAddingGroup(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-[#1a1a19] text-white rounded-lg hover:bg-black transition-colors"
            >
              <Plus size={14} /> Grup Ekle
            </button>
          </div>
        )}

        {groups.map((group) => (
          <GroupRow
            key={group.id}
            group={group}
            items={items.filter((i) => i.groupId === group.id)}
            onRenameGroup={renameGroup}
            onDeleteGroup={deleteGroup}
            onMoveItem={handleMoveItem}
            onDeleteItem={deleteItem}
            onOpenItem={handleOpenItem}
            onAddItem={(groupId, status) => setModal({ mode: 'add', groupId, initialStatus: status })}
          />
        ))}

        {/* Add group */}
        {addingGroup ? (
          <div className="border-2 border-info-border bg-white rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-sm">
            <input
              autoFocus
              value={groupDraft}
              onChange={(e) => setGroupDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAddGroup();
                if (e.key === 'Escape') { setGroupDraft(''); setAddingGroup(false); }
              }}
              placeholder="Grup adı (örn: Deneyler, Karakterizasyon)..."
              className="flex-1 text-[13px] font-semibold bg-transparent outline-none placeholder:text-text-3 placeholder:font-normal"
            />
            <button onClick={commitAddGroup} className="p-1.5 text-teal-text hover:bg-teal-bg rounded-md transition-colors" title="Ekle">
              <Check size={15} />
            </button>
            <button onClick={() => { setGroupDraft(''); setAddingGroup(false); }} className="p-1.5 text-text-3 hover:bg-surface-2 rounded-md transition-colors" title="Vazgeç">
              <X size={15} />
            </button>
          </div>
        ) : (
          groups.length > 0 && (
            <button
              onClick={() => setAddingGroup(true)}
              className="w-full flex items-center gap-2 justify-center py-3.5 text-[13px] font-semibold text-text-2 hover:text-info-text bg-white hover:bg-info-bg border-2 border-dashed border-border-strong hover:border-info-border rounded-xl transition-all"
            >
              <Plus size={16} /> Yeni Grup Ekle
            </button>
          )
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && modal.mode !== 'detail' && (
          <AddItemModal
            mode={modal.mode}
            item={modal.item}
            groupId={modal.groupId}
            initialStatus={modal.initialStatus}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
        {modal && modal.mode === 'detail' && (
          <ItemDetailModal
            item={modal.item}
            groupTitle={groups.find((g) => g.id === modal.item.groupId)?.title ?? ''}
            currentUser={user}
            allItems={items}
            allGroups={groups}
            onClose={() => setModal(null)}
            onUpdate={handleDetailUpdate}
            onDelete={async (id) => { await deleteItem(id); setModal(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
