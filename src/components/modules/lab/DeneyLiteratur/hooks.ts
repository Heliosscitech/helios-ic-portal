import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toast } from '../../../../lib/toast';
import { dbToLegacyId, legacyToDbId } from '../../../../lib/users';
import type { DLComment, DLGroup, DLItem, DLStatus, DLSubtask } from './types';
import { AUTO_DELETE_DAYS } from './types';

// ── DB row types ───────────────────────────────────────────────────────────────

type GroupRow = {
  id: string; title: string; position: number; created_at: string;
};

type ItemRow = {
  id: string; group_id: string; title: string; notes: string | null;
  status: string; position: number; due_date: string | null; tags: string[];
  created_at: string; completed_at: string | null;
  deleted: boolean; deleted_at: string | null;
  deney_literatur_item_assignees: { user_id: string }[];
};

type CommentRow = {
  id: string; item_id: string; author_id: string; body: string; created_at: string;
};

const ITEM_SELECT =
  'id, group_id, title, notes, status, position, due_date, tags, created_at, completed_at, deleted, deleted_at, deney_literatur_item_assignees(user_id)';

const toGroup = (r: GroupRow): DLGroup => ({
  id: r.id, title: r.title, position: r.position, createdAt: r.created_at,
});

const toItem = (r: ItemRow): DLItem => ({
  id:          r.id,
  groupId:     r.group_id,
  title:       r.title,
  notes:       r.notes ?? undefined,
  status:      r.status as DLStatus,
  position:    r.position,
  dueDate:     r.due_date,
  tags:        r.tags ?? [],
  assigneeIds: (r.deney_literatur_item_assignees ?? [])
    .map((a) => dbToLegacyId(a.user_id))
    .filter((v): v is string => Boolean(v)),
  createdAt:   r.created_at,
  completedAt: r.completed_at,
  deleted:     r.deleted,
  deletedAt:   r.deleted_at,
});

const toComment = (r: CommentRow): DLComment => ({
  id:        r.id,
  itemId:    r.item_id,
  authorId:  dbToLegacyId(r.author_id) ?? r.author_id,
  body:      r.body,
  createdAt: r.created_at,
});

// ── Assignee sync ──────────────────────────────────────────────────────────────

const syncAssignees = async (itemId: string, legacyIds: string[]) => {
  await supabase.from('deney_literatur_item_assignees').delete().eq('item_id', itemId);
  const dbIds = legacyIds.map((id) => legacyToDbId(id)).filter((v): v is string => Boolean(v));
  if (dbIds.length > 0) {
    await supabase.from('deney_literatur_item_assignees')
      .insert(dbIds.map((uid) => ({ item_id: itemId, user_id: uid })));
  }
};

// ── Main data hook ─────────────────────────────────────────────────────────────

export function useDLData() {
  const [groups,  setGroups]  = useState<DLGroup[]>([]);
  const [items,   setItems]   = useState<DLItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [grRes, itRes] = await Promise.all([
      supabase.from('deney_literatur_groups').select('id, title, position, created_at').order('position'),
      supabase.from('deney_literatur_items').select(ITEM_SELECT).eq('deleted', false).order('position'),
    ]);
    if (grRes.error) toast.error('Gruplar yüklenemedi: ' + grRes.error.message);
    else setGroups(((grRes.data ?? []) as GroupRow[]).map(toGroup));
    if (itRes.error) toast.error('Ögeler yüklenemedi: ' + itRes.error.message);
    else setItems(((itRes.data ?? []) as ItemRow[]).map(toItem));
    setLoading(false);
  }, []);

  const runAutoDeleteSweep = useCallback(async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - AUTO_DELETE_DAYS);
    const { error } = await supabase
      .from('deney_literatur_items')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('status', 'completed').lt('completed_at', cutoff.toISOString()).eq('deleted', false);
    if (error) console.warn('Auto-delete sweep failed:', error.message);
  }, []);

  useEffect(() => {
    (async () => { await runAutoDeleteSweep(); await fetchAll(); })();
  }, [runAutoDeleteSweep, fetchAll]);

  // ── Groups ─────────────────────────────────────────────────────────────────

  const addGroup = useCallback(async (title: string) => {
    const position = groups.length > 0 ? Math.max(...groups.map((g) => g.position)) + 1 : 0;
    const tempId = `temp-${Date.now()}`;
    setGroups((p) => [...p, { id: tempId, title, position, createdAt: new Date().toISOString() }]);
    const { data, error } = await supabase.from('deney_literatur_groups')
      .insert({ title, position }).select('id, title, position, created_at').single();
    if (error) { toast.error('Grup eklenemedi: ' + error.message); setGroups((p) => p.filter((g) => g.id !== tempId)); return; }
    setGroups((p) => p.map((g) => (g.id === tempId ? toGroup(data as GroupRow) : g)));
  }, [groups]);

  const renameGroup = useCallback(async (id: string, title: string) => {
    setGroups((p) => p.map((g) => (g.id === id ? { ...g, title } : g)));
    const { error } = await supabase.from('deney_literatur_groups').update({ title }).eq('id', id);
    if (error) { toast.error('Grup adı güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteGroup = useCallback(async (id: string) => {
    setGroups((p) => p.filter((g) => g.id !== id));
    setItems((p) => p.filter((i) => i.groupId !== id));
    const { error } = await supabase.from('deney_literatur_groups').delete().eq('id', id);
    if (error) { toast.error('Grup silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  // ── Items ──────────────────────────────────────────────────────────────────

  const addItem = useCallback(async (
    groupId: string, title: string, status: DLStatus,
    notes?: string, assigneeIds: string[] = [], dueDate?: string | null, tags: string[] = []
  ): Promise<DLItem | null> => {
    const colItems = items.filter((i) => i.groupId === groupId && i.status === status);
    const position = colItems.length > 0 ? Math.max(...colItems.map((i) => i.position)) + 1 : 0;
    const tempId = `temp-${Date.now()}`;
    setItems((p) => [...p, {
      id: tempId, groupId, title, notes, status, position, assigneeIds,
      dueDate: dueDate ?? null, tags,
      createdAt: new Date().toISOString(), completedAt: null, deleted: false, deletedAt: null,
    }]);
    const { data, error } = await supabase.from('deney_literatur_items')
      .insert({ group_id: groupId, title, notes: notes ?? null, status, position, due_date: dueDate ?? null, tags })
      .select(ITEM_SELECT).single();
    if (error) { toast.error('Öge eklenemedi: ' + error.message); setItems((p) => p.filter((i) => i.id !== tempId)); return null; }
    const created = toItem(data as ItemRow);
    if (assigneeIds.length > 0) { await syncAssignees(created.id, assigneeIds); created.assigneeIds = assigneeIds; }
    setItems((p) => p.map((i) => (i.id === tempId ? created : i)));
    return created;
  }, [items]);

  const updateItem = useCallback(async (
    id: string,
    patch: Partial<Pick<DLItem, 'title' | 'notes' | 'status' | 'position' | 'completedAt' | 'dueDate' | 'tags'>>,
    newAssigneeIds?: string[]
  ) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title       !== undefined) dbPatch.title        = patch.title;
    if (patch.notes       !== undefined) dbPatch.notes        = patch.notes ?? null;
    if (patch.status      !== undefined) dbPatch.status       = patch.status;
    if (patch.position    !== undefined) dbPatch.position     = patch.position;
    if (patch.completedAt !== undefined) dbPatch.completed_at = patch.completedAt;
    if (patch.dueDate     !== undefined) dbPatch.due_date     = patch.dueDate;
    if (patch.tags        !== undefined) dbPatch.tags         = patch.tags;

    setItems((p) => p.map((i) =>
      i.id === id ? { ...i, ...patch, ...(newAssigneeIds !== undefined ? { assigneeIds: newAssigneeIds } : {}) } : i
    ));
    const { error } = await supabase.from('deney_literatur_items').update(dbPatch).eq('id', id);
    if (error) { toast.error('Güncelleme başarısız: ' + error.message); fetchAll(); return; }
    if (newAssigneeIds !== undefined) await syncAssignees(id, newAssigneeIds);
  }, [fetchAll]);

  const moveItem = useCallback(async (id: string, newStatus: DLStatus) => {
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
    await updateItem(id, { status: newStatus, completedAt });
  }, [updateItem]);

  const deleteItem = useCallback(async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from('deney_literatur_items').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  return { groups, items, loading, addGroup, renameGroup, deleteGroup, addItem, updateItem, moveItem, deleteItem };
}

// ── Comments hook ──────────────────────────────────────────────────────────────

export function useDLComments(itemId: string | null) {
  const [comments, setComments] = useState<DLComment[]>([]);
  const [loading,  setLoading]  = useState(false);
  const lastItemId = useRef<string | null>(null);

  useEffect(() => {
    if (!itemId || itemId === lastItemId.current) return;
    lastItemId.current = itemId;
    setLoading(true);
    setComments([]);
    supabase
      .from('deney_literatur_item_comments')
      .select('id, item_id, author_id, body, created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Comments fetch failed:', error.message);
        else setComments(((data ?? []) as CommentRow[]).map(toComment));
        setLoading(false);
      });
  }, [itemId]);

  const addComment = useCallback(async (body: string, authorLegacyId: string): Promise<void> => {
    if (!itemId || !body.trim()) return;
    const authorDbId = legacyToDbId(authorLegacyId);
    if (!authorDbId) { toast.error('Kullanıcı bulunamadı.'); return; }

    const tempId = `temp-${Date.now()}`;
    const optimistic: DLComment = {
      id: tempId, itemId, authorId: authorLegacyId, body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((p) => [...p, optimistic]);

    const { data, error } = await supabase
      .from('deney_literatur_item_comments')
      .insert({ item_id: itemId, author_id: authorDbId, body: body.trim() })
      .select('id, item_id, author_id, body, created_at')
      .single();

    if (error) {
      toast.error('Yorum gönderilemedi: ' + error.message);
      setComments((p) => p.filter((c) => c.id !== tempId));
      return;
    }
    setComments((p) => p.map((c) => (c.id === tempId ? toComment(data as CommentRow) : c)));
  }, [itemId]);

  return { comments, loading, addComment };
}

// ── Subtasks hook ──────────────────────────────────────────────────────────────

type SubtaskRow = {
  id: string; item_id: string; title: string; completed: boolean; position: number; created_at: string;
};

const toSubtask = (r: SubtaskRow): DLSubtask => ({
  id: r.id, itemId: r.item_id, title: r.title, completed: r.completed,
  position: r.position, createdAt: r.created_at,
});

export function useDLSubtasks(itemId: string | null) {
  const [subtasks, setSubtasks] = useState<DLSubtask[]>([]);

  useEffect(() => {
    if (!itemId) { setSubtasks([]); return; }
    supabase
      .from('deney_literatur_item_subtasks')
      .select('id, item_id, title, completed, position, created_at')
      .eq('item_id', itemId)
      .order('position')
      .then(({ data }) => setSubtasks(((data ?? []) as SubtaskRow[]).map(toSubtask)));
  }, [itemId]);

  const addSubtask = useCallback(async (title: string) => {
    if (!itemId || !title.trim()) return;
    const position = subtasks.length > 0 ? Math.max(...subtasks.map((s) => s.position)) + 1 : 0;
    const tempId = `temp-${Date.now()}`;
    const optimistic: DLSubtask = {
      id: tempId, itemId, title: title.trim(), completed: false, position,
      createdAt: new Date().toISOString(),
    };
    setSubtasks((p) => [...p, optimistic]);
    const { data, error } = await supabase
      .from('deney_literatur_item_subtasks')
      .insert({ item_id: itemId, title: title.trim(), position })
      .select('id, item_id, title, completed, position, created_at')
      .single();
    if (error) { toast.error('Alt görev eklenemedi'); setSubtasks((p) => p.filter((s) => s.id !== tempId)); return; }
    setSubtasks((p) => p.map((s) => (s.id === tempId ? toSubtask(data as SubtaskRow) : s)));
  }, [itemId, subtasks]);

  const toggleSubtask = useCallback(async (id: string, completed: boolean) => {
    setSubtasks((p) => p.map((s) => (s.id === id ? { ...s, completed } : s)));
    const { error } = await supabase.from('deney_literatur_item_subtasks').update({ completed }).eq('id', id);
    if (error) setSubtasks((p) => p.map((s) => (s.id === id ? { ...s, completed: !completed } : s)));
  }, []);

  const deleteSubtask = useCallback(async (id: string) => {
    setSubtasks((p) => p.filter((s) => s.id !== id));
    await supabase.from('deney_literatur_item_subtasks').delete().eq('id', id);
  }, []);

  return { subtasks, addSubtask, toggleSubtask, deleteSubtask };
}

// ── Linked items hook ──────────────────────────────────────────────────────────

export function useDLLinkedItems(itemId: string | null) {
  const [linkedIds, setLinkedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!itemId) { setLinkedIds([]); return; }
    Promise.all([
      supabase.from('deney_literatur_item_links').select('linked_item_id').eq('item_id', itemId),
      supabase.from('deney_literatur_item_links').select('item_id').eq('linked_item_id', itemId),
    ]).then(([a, b]) => {
      const ids = [
        ...((a.data ?? []) as { linked_item_id: string }[]).map((r) => r.linked_item_id),
        ...((b.data ?? []) as { item_id: string }[]).map((r) => r.item_id),
      ];
      setLinkedIds([...new Set(ids)]);
    });
  }, [itemId]);

  const addLink = useCallback(async (targetId: string) => {
    if (!itemId || targetId === itemId || linkedIds.includes(targetId)) return;
    setLinkedIds((p) => [...p, targetId]);
    const { error } = await supabase.from('deney_literatur_item_links')
      .insert({ item_id: itemId, linked_item_id: targetId });
    if (error) { toast.error('Bağlantı eklenemedi'); setLinkedIds((p) => p.filter((id) => id !== targetId)); }
  }, [itemId, linkedIds]);

  const removeLink = useCallback(async (targetId: string) => {
    if (!itemId) return;
    setLinkedIds((p) => p.filter((id) => id !== targetId));
    await Promise.all([
      supabase.from('deney_literatur_item_links').delete().eq('item_id', itemId).eq('linked_item_id', targetId),
      supabase.from('deney_literatur_item_links').delete().eq('item_id', targetId).eq('linked_item_id', itemId),
    ]);
  }, [itemId]);

  return { linkedIds, addLink, removeLink };
}
