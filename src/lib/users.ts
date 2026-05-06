import { useCallback, useEffect, useState } from 'react';
import type { ModuleId, Responsibility, User, UserRole } from '../types/portal';
import { supabase } from './supabase';

type DbRow = {
  id: string;
  legacy_id: string | null;
  name: string;
  initials: string;
  role: string;
  color: string;
  user_role: UserRole;
  allowed_modules: ModuleId[] | null;
  responsibilities: Responsibility[] | null;
  email: string | null;
};

const SELECT_COLS =
  'id, legacy_id, name, initials, role, color, user_role, allowed_modules, responsibilities, email';

const toUser = (row: DbRow): User => ({
  id: row.legacy_id ?? row.id,
  dbId: row.id,
  email: row.email ?? undefined,
  name: row.name,
  initials: row.initials,
  role: row.role,
  color: row.color,
  userRole: row.user_role,
  allowedModules: row.allowed_modules ?? [],
  responsibilities: row.responsibilities ?? [],
});

let cache: User[] | null = null;
const listeners = new Set<(users: User[]) => void>();

export const getCachedUsers = (): User[] => cache ?? [];

export const legacyToDbId = (legacyId: string): string | undefined =>
  cache?.find((u) => u.id === legacyId)?.dbId;

export const dbToLegacyId = (dbId: string): string | undefined =>
  cache?.find((u) => u.dbId === dbId)?.id;

export const ensureUsersLoaded = async (): Promise<User[]> => {
  if (cache) return cache;
  const list = await fetchAll();
  broadcast(list);
  return list;
};

const broadcast = (next: User[]) => {
  cache = next;
  listeners.forEach((cb) => cb(next));
};

const fetchAll = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select(SELECT_COLS)
    .order('name');
  if (error) {
    console.error('users fetch failed', error);
    return cache ?? [];
  }
  return ((data ?? []) as DbRow[]).map(toUser);
};

export function usePortalUsers() {
  const [users, setUsers] = useState<User[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const cb = (next: User[]) => setUsers(next);
    listeners.add(cb);

    if (cache === null) {
      fetchAll().then((list) => {
        broadcast(list);
        setLoading(false);
      });
    } else {
      setUsers(cache);
      setLoading(false);
    }

    return () => {
      listeners.delete(cb);
    };
  }, []);

  const updateUser = useCallback(async (id: string, patch: Partial<User>) => {
    const target = (cache ?? []).find((u) => u.id === id);
    if (!target?.dbId) return;

    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.initials !== undefined) dbPatch.initials = patch.initials;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (patch.userRole !== undefined) dbPatch.user_role = patch.userRole;
    if (patch.allowedModules !== undefined) dbPatch.allowed_modules = patch.allowedModules;
    if (patch.responsibilities !== undefined) dbPatch.responsibilities = patch.responsibilities;

    const optimistic = (cache ?? []).map((u) => (u.id === id ? { ...u, ...patch } : u));
    broadcast(optimistic);

    const { error } = await supabase.from('users').update(dbPatch).eq('id', target.dbId);
    if (error) {
      console.error('users update failed', error);
      const fresh = await fetchAll();
      broadcast(fresh);
    }
  }, []);

  const addUser = useCallback(async (userData: {
    email: string;
    password: string;
    name: string;
    initials: string;
    role: string;
    color: string;
    userRole: UserRole;
    allowedModules: ModuleId[];
    responsibilities: Responsibility[];
  }) => {
    const { data, error } = await supabase.functions.invoke('create-portal-user', { body: userData });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const fresh = await fetchAll();
    broadcast(fresh);
    return data?.user ?? null;
  }, []);

  const deleteUser = useCallback(async (_id: string) => {
    throw new Error(
      'Kullanıcı silmek için Supabase Studio → Authentication → Users panelinden auth kullanıcısını silin (public.users satırı cascade ile silinir).'
    );
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchAll();
    broadcast(list);
  }, []);

  return { users, loading, updateUser, addUser, deleteUser, refresh };
}
