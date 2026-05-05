import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type { AnalysisState, Experiment, ExperimentStatus } from './types';

type DbExperiment = {
  id: string;
  code: string;
  mof: string;
  name: string;
  purpose: string | null;
  owner_id: string;
  device: string | null;
  start_date: string | null;
  end_date: string | null;
  synthesis_amount: string | null;
  workup_amount: string | null;
  eln_link: string | null;
  bet: AnalysisState;
  xrd: AnalysisState;
  sem: AnalysisState;
  status: ExperimentStatus;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT =
  'id, code, mof, name, purpose, owner_id, device, start_date, end_date, synthesis_amount, workup_amount, eln_link, bet, xrd, sem, status, archived, created_at, updated_at';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toExperiment = (row: DbExperiment): Experiment => ({
  id: row.id,
  code: row.code,
  mof: row.mof,
  name: row.name,
  purpose: row.purpose ?? '',
  ownerId: dbToLegacyId(row.owner_id) ?? row.owner_id,
  device: row.device ?? '',
  startDate: row.start_date ?? '',
  endDate: row.end_date ?? '',
  synthesisAmount: row.synthesis_amount ?? '',
  workupAmount: row.workup_amount ?? '',
  elnLink: row.eln_link ?? '',
  bet: row.bet,
  xrd: row.xrd,
  sem: row.sem,
  status: row.status,
  archived: row.archived,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDbRow = (e: Experiment, ownerDbId: string) => ({
  id: e.id,
  code: e.code,
  mof: e.mof,
  name: e.name,
  purpose: e.purpose || null,
  owner_id: ownerDbId,
  device: e.device || null,
  start_date: e.startDate || null,
  end_date: e.endDate || null,
  synthesis_amount: e.synthesisAmount || null,
  workup_amount: e.workupAmount || null,
  eln_link: e.elnLink || null,
  bet: e.bet,
  xrd: e.xrd,
  sem: e.sem,
  status: e.status,
  archived: e.archived,
});

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('experiments')
      .select(SELECT)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('experiments fetch failed', error);
      toast.error('Deneyler yüklenemedi:\n' + error.message);
      setLoading(false);
      return;
    }
    setExperiments(((data ?? []) as DbExperiment[]).map(toExperiment));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addExperiment = useCallback(async (input: Partial<Experiment>, currentUserLegacyId: string): Promise<Experiment | null> => {
    await ensureUsersLoaded();
    const ownerLegacy = input.ownerId ?? currentUserLegacyId;
    const ownerDbId = legacyToDbId(ownerLegacy);
    if (!ownerDbId) {
      toast.error('Deney kaydedilemedi: sahip kullanıcı bulunamadı.');
      return null;
    }

    const now = new Date().toISOString();
    const newExp: Experiment = {
      id: newId(),
      code: input.code ?? '',
      mof: input.mof ?? '',
      name: input.name ?? '',
      purpose: input.purpose ?? '',
      ownerId: ownerLegacy,
      device: input.device ?? '',
      startDate: input.startDate ?? '',
      endDate: input.endDate ?? '',
      synthesisAmount: input.synthesisAmount ?? '',
      workupAmount: input.workupAmount ?? '',
      elnLink: input.elnLink ?? '',
      bet: '',
      xrd: '',
      sem: '',
      status: 'bekliyor',
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    setExperiments((prev) => [newExp, ...prev]);

    const { error } = await supabase
      .from('experiments')
      .insert(toDbRow(newExp, ownerDbId));

    if (error) {
      console.error('experiment insert failed', error);
      toast.error('Deney kaydedilemedi:\n' + error.message);
      fetchAll();
      return null;
    }

    return newExp;
  }, [fetchAll]);

  const updateExperiment = useCallback(async (id: string, patch: Partial<Experiment>) => {
    await ensureUsersLoaded();
    const dbPatch: Record<string, unknown> = {};
    if (patch.code !== undefined) dbPatch.code = patch.code;
    if (patch.mof !== undefined) dbPatch.mof = patch.mof;
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.purpose !== undefined) dbPatch.purpose = patch.purpose || null;
    if (patch.ownerId !== undefined) {
      const dbId = legacyToDbId(patch.ownerId);
      if (!dbId) {
        toast.error('Yeni sahip kullanıcı bulunamadı.');
        return;
      }
      dbPatch.owner_id = dbId;
    }
    if (patch.device !== undefined) dbPatch.device = patch.device || null;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate || null;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate || null;
    if (patch.synthesisAmount !== undefined) dbPatch.synthesis_amount = patch.synthesisAmount || null;
    if (patch.workupAmount !== undefined) dbPatch.workup_amount = patch.workupAmount || null;
    if (patch.elnLink !== undefined) dbPatch.eln_link = patch.elnLink || null;
    if (patch.bet !== undefined) dbPatch.bet = patch.bet;
    if (patch.xrd !== undefined) dbPatch.xrd = patch.xrd;
    if (patch.sem !== undefined) dbPatch.sem = patch.sem;
    if (patch.status !== undefined) {
      dbPatch.status = patch.status;
      // status='tamamlandi' otomatik archive
      if (patch.archived === undefined) {
        dbPatch.archived = patch.status === 'tamamlandi';
      }
    }
    if (patch.archived !== undefined) dbPatch.archived = patch.archived;

    // optimistic
    setExperiments((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const merged: Experiment = { ...e, ...patch, updatedAt: new Date().toISOString() };
        if (patch.status !== undefined && patch.archived === undefined) {
          merged.archived = patch.status === 'tamamlandi';
        }
        return merged;
      })
    );

    const { error, count } = await supabase
      .from('experiments')
      .update(dbPatch, { count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('updateExperiment failed', error);
      toast.error('Deney güncellenemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu deneyi güncelleme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  const deleteExperiment = useCallback(async (id: string) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    const { error, count } = await supabase
      .from('experiments')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('deleteExperiment failed', error);
      toast.error('Silinemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu deneyi silme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  return { experiments, loading, addExperiment, updateExperiment, deleteExperiment, refresh: fetchAll };
}

// ── Lab devices ────────────────────────────────────────────────────────

export function useLabDevices() {
  const [devices, setDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    const { data, error } = await supabase
      .from('lab_devices')
      .select('name')
      .order('name');
    if (error) {
      console.error('lab_devices fetch failed', error);
      setLoading(false);
      return;
    }
    setDevices(((data ?? []) as { name: string }[]).map((r) => r.name));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const addDevice = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (devices.includes(trimmed)) return;
    setDevices((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b, 'tr')));
    const { error } = await supabase.from('lab_devices').insert({ name: trimmed });
    if (error && error.code !== '23505') {
      // 23505 = unique violation, başka biri eklemiş; OK
      console.error('addDevice failed', error);
      toast.error('Cihaz eklenemedi:\n' + error.message);
      fetchDevices();
    }
  }, [devices, fetchDevices]);

  return { devices, loading, addDevice, refresh: fetchDevices };
}
