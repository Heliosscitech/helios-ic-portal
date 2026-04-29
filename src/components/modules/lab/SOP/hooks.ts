import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import type { SOPCategory, SOPFormData, SOPProcedure } from './types';

type DbRow = {
  id: string;
  title: string;
  category: SOPCategory;
  version: string;
  last_updated: string;
  owner_id: string;
  drive_url: string | null;
  summary: string | null;
  tags: string[] | null;
  created_at: string;
};

const SELECT =
  'id, title, category, version, last_updated, owner_id, drive_url, summary, tags, created_at';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toItem = (row: DbRow): SOPProcedure => ({
  id: row.id,
  title: row.title,
  category: row.category,
  version: row.version,
  lastUpdated: row.last_updated,
  ownerId: dbToLegacyId(row.owner_id) ?? row.owner_id,
  driveUrl: row.drive_url ?? undefined,
  summary: row.summary ?? undefined,
  tags: row.tags ?? [],
  createdAt: row.created_at,
});

let cache: SOPProcedure[] | null = null;
const listeners = new Set<(arr: SOPProcedure[]) => void>();
const broadcast = (next: SOPProcedure[]) => {
  cache = next;
  listeners.forEach((cb) => cb(next));
};

const fetchAll = async (): Promise<SOPProcedure[]> => {
  await ensureUsersLoaded();
  const { data, error } = await supabase
    .from('sop_procedures')
    .select(SELECT)
    .order('last_updated', { ascending: false });
  if (error) {
    console.error('sop_procedures fetch failed', error);
    return cache ?? [];
  }
  return ((data ?? []) as DbRow[]).map(toItem);
};

export function useSOPs() {
  const [items, setItems] = useState<SOPProcedure[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const cb = (next: SOPProcedure[]) => setItems(next);
    listeners.add(cb);
    if (cache === null) {
      fetchAll().then((list) => {
        broadcast(list);
        setLoading(false);
      });
    } else {
      setItems(cache);
      setLoading(false);
    }
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchAll();
    broadcast(list);
  }, []);

  const addItem = useCallback(async (data: SOPFormData): Promise<SOPProcedure | null> => {
    await ensureUsersLoaded();
    const ownerDbId = legacyToDbId(data.ownerId);
    if (!ownerDbId) {
      window.alert('Sahibi olarak seçilen kullanıcı bulunamadı.');
      return null;
    }

    const id = newId();
    const optimistic: SOPProcedure = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    broadcast([optimistic, ...(cache ?? [])]);

    const { error } = await supabase.from('sop_procedures').insert({
      id,
      title: data.title,
      category: data.category,
      version: data.version || 'v1.0',
      last_updated: data.lastUpdated || null,
      owner_id: ownerDbId,
      drive_url: data.driveUrl || null,
      summary: data.summary || null,
      tags: data.tags ?? [],
    });

    if (error) {
      console.error('sop_procedures insert failed', error);
      window.alert('Prosedür kaydedilemedi:\n' + error.message);
      await refresh();
      return null;
    }
    return optimistic;
  }, [refresh]);

  const updateItem = useCallback(async (id: string, data: SOPFormData) => {
    await ensureUsersLoaded();
    const ownerDbId = legacyToDbId(data.ownerId);
    if (!ownerDbId) {
      window.alert('Sahibi olarak seçilen kullanıcı bulunamadı.');
      return;
    }

    broadcast(
      (cache ?? []).map((p) => (p.id === id ? { ...p, ...data } : p))
    );

    const { error, count } = await supabase
      .from('sop_procedures')
      .update(
        {
          title: data.title,
          category: data.category,
          version: data.version || 'v1.0',
          last_updated: data.lastUpdated || null,
          owner_id: ownerDbId,
          drive_url: data.driveUrl || null,
          summary: data.summary || null,
          tags: data.tags ?? [],
        },
        { count: 'exact' }
      )
      .eq('id', id);

    if (error) {
      console.error('sop_procedures update failed', error);
      window.alert('Güncellenemedi:\n' + error.message);
      await refresh();
    } else if (count === 0) {
      window.alert('Bu kaydı güncelleme yetkiniz yok.');
      await refresh();
    }
  }, [refresh]);

  const deleteItem = useCallback(async (id: string) => {
    broadcast((cache ?? []).filter((p) => p.id !== id));
    const { error, count } = await supabase
      .from('sop_procedures')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('sop_procedures delete failed', error);
      window.alert('Silinemedi:\n' + error.message);
      await refresh();
    } else if (count === 0) {
      window.alert('Bu kaydı silme yetkiniz yok.');
      await refresh();
    }
  }, [refresh]);

  return { items, loading, addItem, updateItem, deleteItem, refresh };
}
