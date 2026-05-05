import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type { PressCategory, PressItem, PressTab } from './types';

type DbPress = {
  id: string;
  title: string;
  publish_date: string | null;
  category: PressCategory;
  linkedin: string | null;
  website: string | null;
  instagram: string | null;
  created_by: string | null;
};

const SELECT =
  'id, title, publish_date, category, linkedin, website, instagram, created_by';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toItem = (row: DbPress): PressItem => ({
  id: row.id,
  title: row.title,
  date: row.publish_date ?? '',
  category: row.category,
  linkedin: row.linkedin ?? '',
  website: row.website ?? '',
  instagram: row.instagram ?? '',
});

export function usePressItems() {
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('press_items')
      .select(SELECT)
      .order('publish_date', { ascending: false });
    if (error) {
      console.error('press_items fetch failed', error);
      toast.error('Basın kayıtları yüklenemedi:\n' + error.message);
      setLoading(false);
      return;
    }
    setItems(((data ?? []) as DbPress[]).map(toItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addItem = useCallback(
    async (title: string, date: string, category: PressCategory, creatorLegacyId: string): Promise<PressItem | null> => {
      await ensureUsersLoaded();
      const creatorDbId = legacyToDbId(creatorLegacyId) ?? null;
      const id = newId();
      const optimistic: PressItem = { id, title, date, category, linkedin: '', website: '', instagram: '' };
      setItems((prev) => [optimistic, ...prev]);

      const { error } = await supabase.from('press_items').insert({
        id,
        title,
        publish_date: date || null,
        category,
        linkedin: null,
        website: null,
        instagram: null,
        created_by: creatorDbId,
      });
      if (error) {
        console.error('press_items insert failed', error);
        toast.error('Kayıt eklenemedi:\n' + error.message);
        fetchAll();
        return null;
      }
      return optimistic;
    },
    [fetchAll]
  );

  const updateMeta = useCallback(
    async (id: string, patch: Pick<PressItem, 'title' | 'date' | 'category'>) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      const { error } = await supabase
        .from('press_items')
        .update({
          title: patch.title,
          publish_date: patch.date || null,
          category: patch.category,
        })
        .eq('id', id);
      if (error) {
        console.error('press_items update failed', error);
        toast.error('Güncellenemedi:\n' + error.message);
        fetchAll();
      }
    },
    [fetchAll]
  );

  const updateContent = useCallback(
    async (id: string, tab: PressTab, value: string) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [tab]: value } : item)));
      const { error } = await supabase
        .from('press_items')
        .update({ [tab]: value || null })
        .eq('id', id);
      if (error) {
        console.error('press_items content update failed', error);
        toast.error('İçerik kaydedilemedi:\n' + error.message);
        fetchAll();
      }
    },
    [fetchAll]
  );

  const deleteItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const { error, count } = await supabase
      .from('press_items')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('press_items delete failed', error);
      toast.error('Silinemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu kaydı silme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  return { items, loading, addItem, updateMeta, updateContent, deleteItem, refresh: fetchAll };
}
