import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { toast } from '../../../../lib/toast';
import type {
  Distributor,
  DistributorContact,
  DistributorRegion,
  DistributorStatus,
  FollowUpStep,
  StepMap,
} from './types';

const ALL_STEPS: FollowUpStep[] = [
  'ilk-mail', 'fu-1', 'fu-2', 'meet', 'toplanti', 'numune', 'teklif', 'sozlesme',
];

const emptyStepMap = (): StepMap => ({
  'ilk-mail': false, 'fu-1': false, 'fu-2': false,
  meet: false, toplanti: false, numune: false, teklif: false, sozlesme: false,
});

type DbDistributor = {
  id: string;
  region: DistributorRegion;
  country: string;
  name: string;
  website: string | null;
  expertise: string | null;
  c1_name: string | null; c1_title: string | null; c1_email: string | null; c1_phone: string | null;
  c2_name: string | null; c2_title: string | null; c2_email: string | null; c2_phone: string | null;
  contacts: Partial<DistributorContact>[] | null;
  status: DistributorStatus;
  owner_id: string | null;
  next_step: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  distributor_steps: { step: FollowUpStep; done: boolean }[];
};

const SELECT =
  'id, region, country, name, website, expertise, c1_name, c1_title, c1_email, c1_phone, c2_name, c2_title, c2_email, c2_phone, contacts, status, owner_id, next_step, notes, created_at, updated_at, distributor_steps(step, done)';

const contact = (n: string | null, t: string | null, e: string | null, p: string | null): DistributorContact => ({
  name: n ?? '',
  title: t ?? '',
  email: e ?? '',
  phone: p ?? '',
});

const hasContent = (c: DistributorContact) =>
  Boolean(c.name || c.title || c.email || c.phone);

// contacts jsonb dolu ise onu kullan; değilse eski c1/c2 kolonlarından üret.
const readContacts = (row: DbDistributor): DistributorContact[] => {
  if (Array.isArray(row.contacts) && row.contacts.length > 0) {
    return row.contacts.map((c) =>
      contact(c.name ?? null, c.title ?? null, c.email ?? null, c.phone ?? null)
    );
  }
  const legacy = [
    contact(row.c1_name, row.c1_title, row.c1_email, row.c1_phone),
    contact(row.c2_name, row.c2_title, row.c2_email, row.c2_phone),
  ].filter(hasContent);
  return legacy.length > 0 ? legacy : [contact(null, null, null, null)];
};

const toDistributor = (row: DbDistributor): Distributor => {
  const steps = emptyStepMap();
  for (const s of row.distributor_steps ?? []) {
    if (s.done) steps[s.step] = true;
  }
  return {
    id: row.id,
    region: row.region,
    country: row.country,
    name: row.name,
    website: row.website ?? '',
    expertise: row.expertise ?? '',
    contacts: readContacts(row),
    steps,
    status: row.status,
    ownerId: row.owner_id ? dbToLegacyId(row.owner_id) ?? row.owner_id : null,
    nextStep: row.next_step ?? '',
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toDbRow = (d: Distributor) => {
  const ownerDbId = d.ownerId ? legacyToDbId(d.ownerId) ?? null : null;
  const filled = d.contacts.filter(hasContent);
  const [c1, c2] = filled;
  return {
    id: d.id,
    region: d.region,
    country: d.country,
    name: d.name,
    website: d.website || null,
    expertise: d.expertise || null,
    contacts: filled,
    // Geriye dönük uyumluluk: ilk iki kişi eski kolonlarda da tutulur.
    c1_name: c1?.name || null,
    c1_title: c1?.title || null,
    c1_email: c1?.email || null,
    c1_phone: c1?.phone || null,
    c2_name: c2?.name || null,
    c2_title: c2?.title || null,
    c2_email: c2?.email || null,
    c2_phone: c2?.phone || null,
    status: d.status,
    owner_id: ownerDbId,
    next_step: d.nextStep || null,
    notes: d.notes || null,
  };
};

const writeSteps = async (distributorId: string, steps: StepMap) => {
  // Delete existing, then insert all true ones. Simpler than diffing.
  await supabase.from('distributor_steps').delete().eq('distributor_id', distributorId);
  const rows = ALL_STEPS
    .filter((s) => steps[s])
    .map((s) => ({ distributor_id: distributorId, step: s, done: true }));
  if (rows.length > 0) {
    const { error } = await supabase.from('distributor_steps').insert(rows);
    if (error) console.error('distributor_steps insert failed', error);
  }
};

export function useDistributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('distributors')
      .select(SELECT)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('distributors fetch failed', error);
      toast.error('Distribütörler yüklenemedi:\n' + error.message);
      setLoading(false);
      return;
    }
    setDistributors(((data ?? []) as DbDistributor[]).map(toDistributor));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addDistributor = useCallback(async (input: Partial<Distributor>): Promise<Distributor | null> => {
    await ensureUsersLoaded();
    const now = new Date().toISOString();
    const next: Distributor = {
      id: newId(),
      region: input.region ?? 'avrupa',
      country: input.country ?? '',
      name: input.name ?? '',
      website: input.website ?? '',
      expertise: input.expertise ?? '',
      contacts: input.contacts ?? [],
      steps: input.steps ?? emptyStepMap(),
      status: input.status ?? 'arastirilacak',
      ownerId: input.ownerId ?? null,
      nextStep: input.nextStep ?? '',
      notes: input.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };

    setDistributors((prev) => [next, ...prev]);

    const { error } = await supabase.from('distributors').insert(toDbRow(next));
    if (error) {
      console.error('distributor insert failed', error);
      toast.error('Distribütör kaydedilemedi:\n' + error.message);
      fetchAll();
      return null;
    }
    await writeSteps(next.id, next.steps);
    return next;
  }, [fetchAll]);

  const updateDistributor = useCallback(async (id: string, patch: Partial<Distributor>) => {
    await ensureUsersLoaded();
    const target = distributors.find((d) => d.id === id);
    if (!target) return;

    const merged: Distributor = {
      ...target,
      ...patch,
      contacts: patch.contacts ?? target.contacts,
      steps: patch.steps ?? target.steps,
      updatedAt: new Date().toISOString(),
    };

    setDistributors((prev) => prev.map((d) => (d.id === id ? merged : d)));

    const { error, count } = await supabase
      .from('distributors')
      .update(toDbRow(merged), { count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('distributor update failed', error);
      toast.error('Güncellenemedi:\n' + error.message);
      fetchAll();
      return;
    }
    if (count === 0) {
      toast.error('Bu kaydı güncelleme yetkiniz yok.');
      fetchAll();
      return;
    }

    if (patch.steps !== undefined) {
      await writeSteps(id, merged.steps);
    }
  }, [distributors, fetchAll]);

  const deleteDistributor = useCallback(async (id: string) => {
    setDistributors((prev) => prev.filter((d) => d.id !== id));
    const { error, count } = await supabase
      .from('distributors')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('distributor delete failed', error);
      toast.error('Silinemedi:\n' + error.message);
      fetchAll();
    } else if (count === 0) {
      toast.error('Bu kaydı silme yetkiniz yok.');
      fetchAll();
    }
  }, [fetchAll]);

  return { distributors, loading, addDistributor, updateDistributor, deleteDistributor, refresh: fetchAll };
}
