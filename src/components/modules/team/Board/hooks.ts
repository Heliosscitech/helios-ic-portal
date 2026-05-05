import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type { BoardColumn, BoardTask, Priority, UnitId } from './types';

type DbTask = {
  id: string;
  title: string;
  description: string | null;
  unit_id: UnitId;
  status: string;
  priority: Priority;
  due_date: string | null;
  creator_id: string;
  tags: string[] | null;
  comments_count: number;
  board_task_assignees: { user_id: string }[];
};

const TASK_SELECT =
  'id, title, description, unit_id, status, priority, due_date, creator_id, tags, comments_count, board_task_assignees(user_id)';

const toBoardTask = (row: DbTask): BoardTask => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  unitId: row.unit_id,
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date ?? '',
  assigneeIds: (row.board_task_assignees ?? [])
    .map((a) => dbToLegacyId(a.user_id))
    .filter((v): v is string => Boolean(v)),
  creatorId: dbToLegacyId(row.creator_id) ?? row.creator_id,
  tags: row.tags ?? [],
  comments: row.comments_count ?? 0,
});

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function useBoardTasks() {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('board_tasks')
      .select(TASK_SELECT)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('board_tasks fetch failed', error);
      setLoading(false);
      return;
    }
    setTasks(((data ?? []) as DbTask[]).map(toBoardTask));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const saveTask = useCallback(async (task: BoardTask): Promise<BoardTask | null> => {
    await ensureUsersLoaded();
    const creatorDbId = legacyToDbId(task.creatorId);
    if (!creatorDbId) {
      const msg = `Görev kaydedilemedi: oluşturan kullanıcı (${task.creatorId}) Supabase'de bulunamadı.`;
      console.error(msg);
      toast.error(msg);
      return null;
    }

    const isNew = !tasks.some((t) => t.id === task.id);
    // TaskModal yeni görev için 'T-XXXX' id üretiyor; DB uuid bekliyor.
    const taskId = isNew ? newId() : task.id;

    const dbRow = {
      id: taskId,
      title: task.title,
      description: task.description ?? null,
      unit_id: task.unitId,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate || null,
      creator_id: creatorDbId,
      tags: task.tags,
      comments_count: task.comments,
    };

    // optimistic
    const saved: BoardTask = { ...task, id: taskId };
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });

    const { error: upsertError } = await supabase
      .from('board_tasks')
      .upsert(dbRow);

    if (upsertError) {
      console.error('board_tasks upsert failed', upsertError);
      toast.error('Görev kaydedilemedi:\n' + upsertError.message);
      fetchTasks();
      return null;
    }

    // assignees: delete old, insert new
    await supabase.from('board_task_assignees').delete().eq('task_id', taskId);
    const assigneeRows = task.assigneeIds
      .map((legacy) => legacyToDbId(legacy))
      .filter((v): v is string => Boolean(v))
      .map((uid) => ({ task_id: taskId, user_id: uid }));
    if (assigneeRows.length > 0) {
      const { error: assignError } = await supabase
        .from('board_task_assignees')
        .insert(assigneeRows);
      if (assignError) {
        console.error('assignees insert failed', assignError);
      }
    }

    return saved;
  }, [tasks, fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error, count } = await supabase
      .from('board_tasks')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('deleteTask failed', error);
      toast.error('Silinemedi: ' + error.message);
      fetchTasks();
    } else if (count === 0) {
      toast.error('Bu görevi silme yetkiniz yok (RLS bloklamış olabilir).');
      fetchTasks();
    }
  }, [fetchTasks]);

  const changeStatus = useCallback(async (id: string, status: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const { error, count } = await supabase
      .from('board_tasks')
      .update({ status }, { count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('changeStatus failed', error);
      toast.error('Durum güncellenemedi: ' + error.message);
      fetchTasks();
    } else if (count === 0) {
      toast.error('Bu görevin durumunu değiştirme yetkiniz yok.');
      fetchTasks();
    }
  }, [fetchTasks]);

  return { tasks, loading, saveTask, deleteTask, changeStatus, refresh: fetchTasks };
}

// ── Columns ────────────────────────────────────────────────────────────

type DbColumn = {
  id: string;
  title: string;
  dot: string;
  position: number;
};

export function useBoardColumns() {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColumns = useCallback(async () => {
    const { data, error } = await supabase
      .from('board_columns')
      .select('id, title, dot, position')
      .order('position');
    if (error) {
      console.error('board_columns fetch failed', error);
      setLoading(false);
      return;
    }
    setColumns(
      ((data ?? []) as DbColumn[]).map((r) => ({ id: r.id, title: r.title, dot: r.dot }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const addColumn = useCallback(async (title: string) => {
    const id = `col-${Date.now().toString(36)}`;
    const finalTitle = title.trim() || 'Yeni Kolon';
    const { data: lastPos } = await supabase
      .from('board_columns')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = (lastPos?.position ?? -1) + 1;
    const newCol: BoardColumn = { id, title: finalTitle, dot: 'bg-info-border' };
    setColumns((prev) => [...prev, newCol]);
    const { error } = await supabase
      .from('board_columns')
      .insert({ id, title: finalTitle, dot: 'bg-info-border', position: nextPos });
    if (error) {
      console.error('addColumn failed', error);
      toast.error('Kolon kaydedilemedi:\n' + error.message + '\n\n0004_board_columns.sql migration\'ı çalışmamış olabilir.');
      fetchColumns();
    }
  }, [fetchColumns]);

  const renameColumn = useCallback(async (id: string, title: string) => {
    const t = title.trim();
    if (!t) return;
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, title: t } : c)));
    const { error } = await supabase.from('board_columns').update({ title: t }).eq('id', id);
    if (error) {
      console.error('renameColumn failed', error);
      fetchColumns();
    }
  }, [fetchColumns]);

  const deleteColumn = useCallback(async (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from('board_columns').delete().eq('id', id);
    if (error) {
      console.error('deleteColumn failed', error);
      fetchColumns();
    }
  }, [fetchColumns]);

  const reorderColumns = useCallback(async (fromId: string, toId: string) => {
    if (fromId === toId) return;
    let nextOrder: BoardColumn[] = [];
    setColumns((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === fromId);
      const toIdx = prev.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      nextOrder = next;
      return next;
    });
    if (nextOrder.length === 0) return;
    const updates = nextOrder.map((c, idx) =>
      supabase.from('board_columns').update({ position: idx }).eq('id', c.id)
    );
    const results = await Promise.all(updates);
    const failure = results.find((r) => r.error);
    if (failure?.error) {
      console.error('reorderColumns failed', failure.error);
      fetchColumns();
    }
  }, [fetchColumns]);

  return { columns, loading, addColumn, renameColumn, deleteColumn, reorderColumns, refresh: fetchColumns };
}
