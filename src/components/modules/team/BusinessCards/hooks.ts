import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type { ContactFormData, ContactInfo } from './types';

type DbCard = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  contact_type: ContactInfo['type'];
  meeting_place: string | null;
  meeting_date: string | null;
  notes: string | null;
  created_by: string | null;
};

const SELECT =
  'id, name, title, company, email, phone, tags, contact_type, meeting_place, meeting_date, notes, created_by';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toContact = (row: DbCard): ContactInfo => ({
  id: row.id,
  name: row.name,
  title: row.title ?? '',
  company: row.company ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  tags: row.tags ?? [],
  type: row.contact_type,
  neredeTanistiniz: row.meeting_place ?? undefined,
  tarih: row.meeting_date ?? undefined,
  not: row.notes ?? undefined,
});

const toBaseRow = (data: ContactFormData) => ({
  name: data.name,
  title: data.title || null,
  company: data.company || null,
  email: data.email || null,
  phone: data.phone || null,
  tags: data.tags ?? [],
  contact_type: data.type,
  meeting_place: data.neredeTanistiniz || null,
  meeting_date: data.tarih || null,
  notes: data.not || null,
});

export function useBusinessCards() {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('business_cards')
      .select(SELECT)
      .order('name');
    if (error) {
      console.error('business_cards fetch failed', error);
      toast.error('Kartvizitler yüklenemedi:\n' + error.message);
      setLoading(false);
      return;
    }
    setContacts(((data ?? []) as DbCard[]).map(toContact));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addContact = useCallback(async (data: ContactFormData, creatorLegacyId: string): Promise<ContactInfo | null> => {
    await ensureUsersLoaded();
    const creatorDbId = legacyToDbId(creatorLegacyId) ?? null;
    const id = newId();
    const optimistic: ContactInfo = { id, ...data };
    setContacts((prev) => [...prev, optimistic]);

    const { error } = await supabase
      .from('business_cards')
      .insert({ id, ...toBaseRow(data), created_by: creatorDbId });
    if (error) {
      console.error('business_cards insert failed', error);
      toast.error('Kartvizit kaydedilemedi:\n' + error.message);
      fetchAll();
      return null;
    }
    return optimistic;
  }, [fetchAll]);

  const updateContact = useCallback(async (id: string, data: ContactFormData) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    const { error, count } = await supabase
      .from('business_cards')
      .update(toBaseRow(data), { count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('business_cards update failed', error);
      toast.error('Güncellenemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu kartı güncelleme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  const deleteContact = useCallback(async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    const { error, count } = await supabase
      .from('business_cards')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('business_cards delete failed', error);
      toast.error('Silinemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu kartı silme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  return { contacts, loading, addContact, updateContact, deleteContact, refresh: fetchAll };
}
