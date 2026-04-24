import React, { useMemo, useState } from 'react';
import { PORTAL_USERS } from '../../../../types/users';
import type { ModuleProps } from '../../../../types/portal';
import { BoardSidebar } from './BoardSidebar';
import { BoardToolbar } from './BoardToolbar';
import { BoardView } from './views/BoardView';
import { ListView } from './views/ListView';
import { DashboardView } from './views/DashboardView';
import { TaskModal } from './TaskModal';
import type { TaskModalMode } from './TaskModal';
import { BOARD_TASKS } from './data';
import { UNITS, STATUS_LABELS, collectTags } from './types';
import type {
  BoardFilter,
  BoardTask,
  FilterScope,
  TaskStatus,
  UnitId,
  ViewMode,
} from './types';
import { usePersistentState } from '../../../../lib/persistence';
import { useNotifications } from '../../../../lib/notifications';

const TASKS_STORAGE_KEY = 'helios:board:tasks';

const DEFAULT_FILTER: BoardFilter = {
  scope: 'all',
  unitId: 'all',
  memberId: null,
  personIds: [],
  tags: [],
};

const applyFilters = (tasks: BoardTask[], filter: BoardFilter, currentUserId: string): BoardTask[] => {
  return tasks.filter((t) => {
    if (filter.scope === 'assigned-to-me' && !t.assigneeIds.includes(currentUserId)) return false;
    if (filter.scope === 'created-by-me' && t.creatorId !== currentUserId) return false;
    if (filter.unitId !== 'all' && t.unitId !== filter.unitId) return false;
    if (filter.memberId && !t.assigneeIds.includes(filter.memberId)) return false;
    if (filter.personIds.length > 0 && !filter.personIds.some((id) => t.assigneeIds.includes(id)))
      return false;
    if (filter.tags.length > 0 && !filter.tags.some((tag) => t.tags.includes(tag))) return false;
    return true;
  });
};

const countActiveFilters = (filter: BoardFilter) => {
  let n = 0;
  if (filter.scope !== 'all') n++;
  if (filter.unitId !== 'all') n++;
  if (filter.memberId) n++;
  if (filter.personIds.length > 0) n++;
  if (filter.tags.length > 0) n++;
  return n;
};

const uniqueTargets = (ids: string[], actorId: string) =>
  Array.from(new Set(ids)).filter((id) => id !== actorId);

export const Board: React.FC<ModuleProps> = ({ user }) => {
  const [tasks, setTasks] = usePersistentState<BoardTask[]>(TASKS_STORAGE_KEY, BOARD_TASKS);
  const [view, setView] = useState<ViewMode>('board');
  const [filter, setFilter] = useState<BoardFilter>(DEFAULT_FILTER);
  const [modal, setModal] = useState<{ mode: TaskModalMode; taskId?: string } | null>(null);

  const { dispatch } = useNotifications();

  const filteredTasks = useMemo(
    () => applyFilters(tasks, filter, user.id),
    [tasks, filter, user.id]
  );

  const counts = useMemo(() => {
    const byUnit: Record<UnitId, number> = {
      arge: 0,
      'is-gelistirme': 0,
      uretim: 0,
      satis: 0,
      idari: 0,
    };
    UNITS.forEach((u) => {
      byUnit[u.id] = tasks.filter((t) => t.unitId === u.id).length;
    });

    const byMember: Record<string, number> = {};
    PORTAL_USERS.forEach((u) => {
      byMember[u.id] = tasks.filter((t) => t.assigneeIds.includes(u.id)).length;
    });

    return {
      total: tasks.length,
      assignedToMe: tasks.filter((t) => t.assigneeIds.includes(user.id)).length,
      createdByMe: tasks.filter((t) => t.creatorId === user.id).length,
      byUnit,
      byMember,
      teamSize: 6,
    };
  }, [tasks, user.id]);

  const availableTags = useMemo(() => collectTags(tasks), [tasks]);
  const activeFilterCount = countActiveFilters(filter);
  const activeTask = modal?.taskId ? tasks.find((t) => t.id === modal.taskId) : undefined;

  const handleSaveTask = (saved: BoardTask) => {
    const previous = tasks.find((t) => t.id === saved.id);

    // Yan etkileri (dispatch) updater'ın dışında çalıştır — StrictMode'da çift tetiklenmesin
    if (!previous) {
      const targets = uniqueTargets(saved.assigneeIds, user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-created',
          source: 'board',
          entityId: saved.id,
          entityTitle: saved.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `size yeni bir iş atadı: "${saved.title}"`,
        });
      }
    } else {
      const addedAssignees = saved.assigneeIds.filter(
        (id) => !previous.assigneeIds.includes(id)
      );
      if (addedAssignees.length > 0) {
        const targets = uniqueTargets(addedAssignees, user.id);
        if (targets.length > 0) {
          dispatch({
            type: 'task-assigned',
            source: 'board',
            entityId: saved.id,
            entityTitle: saved.title,
            actorId: user.id,
            targetUserIds: targets,
            message: `size bir iş atadı: "${saved.title}"`,
          });
        }
      }

      const stakeholders = [...saved.assigneeIds, previous.creatorId];

      if (previous.status !== saved.status) {
        const targets = uniqueTargets(stakeholders, user.id);
        if (targets.length > 0) {
          dispatch({
            type: 'task-status-changed',
            source: 'board',
            entityId: saved.id,
            entityTitle: saved.title,
            actorId: user.id,
            targetUserIds: targets,
            message: `"${saved.title}" durumunu "${STATUS_LABELS[saved.status]}" olarak değiştirdi`,
          });
        }
      } else {
        const contentChanged =
          previous.title !== saved.title ||
          previous.description !== saved.description ||
          previous.priority !== saved.priority ||
          previous.dueDate !== saved.dueDate ||
          previous.unitId !== saved.unitId ||
          previous.tags.join('|') !== saved.tags.join('|');

        if (contentChanged) {
          const targets = uniqueTargets(stakeholders, user.id);
          if (targets.length > 0) {
            dispatch({
              type: 'task-updated',
              source: 'board',
              entityId: saved.id,
              entityTitle: saved.title,
              actorId: user.id,
              targetUserIds: targets,
              message: `"${saved.title}" detaylarını güncelledi`,
            });
          }
        }
      }
    }

    // State güncellemesi saf kalsın
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setModal(null);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const targets = uniqueTargets([...task.assigneeIds, task.creatorId], user.id);
      if (targets.length > 0) {
        dispatch({
          type: 'task-deleted',
          source: 'board',
          entityId: id,
          entityTitle: task.title,
          actorId: user.id,
          targetUserIds: targets,
          message: `"${task.title}" işini sildi`,
        });
      }
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    const before = tasks.find((t) => t.id === id);
    if (!before || before.status === status) return;

    const targets = uniqueTargets([...before.assigneeIds, before.creatorId], user.id);
    if (targets.length > 0) {
      dispatch({
        type: 'task-status-changed',
        source: 'board',
        entityId: id,
        entityTitle: before.title,
        actorId: user.id,
        targetUserIds: targets,
        message: `"${before.title}" durumunu "${STATUS_LABELS[status]}" olarak değiştirdi`,
      });
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const togglePerson = (id: string) =>
    setFilter((prev) => ({
      ...prev,
      personIds: prev.personIds.includes(id)
        ? prev.personIds.filter((x) => x !== id)
        : [...prev.personIds, id],
    }));

  const toggleTag = (tag: string) =>
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((x) => x !== tag) : [...prev.tags, tag],
    }));

  return (
    <div className="max-w-360 mx-auto px-8 pb-6">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium mb-4">
        <span className="hover:text-text cursor-pointer">Uygulamalar</span>
        <span>/</span>
        <span className="text-text font-bold">Board</span>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl shadow-sm overflow-hidden flex min-h-[calc(100vh-240px)]">
        <BoardSidebar
          view={view}
          filter={filter}
          counts={counts}
          onViewChange={setView}
          onScopeChange={(s: FilterScope) => setFilter((prev) => ({ ...prev, scope: s }))}
          onUnitChange={(u) => setFilter((prev) => ({ ...prev, unitId: u }))}
          onMemberChange={(id) => setFilter((prev) => ({ ...prev, memberId: id }))}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <BoardToolbar
            filter={filter}
            activeFilterCount={activeFilterCount}
            availableTags={availableTags}
            onTogglePerson={togglePerson}
            onToggleTag={toggleTag}
            onClearPersons={() => setFilter((prev) => ({ ...prev, personIds: [] }))}
            onClearTags={() => setFilter((prev) => ({ ...prev, tags: [] }))}
            onClearFilters={() => setFilter(DEFAULT_FILTER)}
            onNewTask={() => setModal({ mode: 'create' })}
          />

          {view === 'board' && (
            <BoardView
              tasks={filteredTasks}
              onTaskClick={(id) => setModal({ mode: 'detail', taskId: id })}
              onStatusChange={handleStatusChange}
            />
          )}
          {view === 'list' && (
            <ListView
              tasks={filteredTasks}
              onTaskClick={(id) => setModal({ mode: 'detail', taskId: id })}
            />
          )}
          {view === 'dashboard' && <DashboardView tasks={filteredTasks} />}
        </div>
      </div>

      {modal && (
        <TaskModal
          mode={modal.mode}
          task={activeTask}
          currentUserId={user.id}
          onClose={() => setModal(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
};

export default Board;
