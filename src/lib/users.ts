import { useEffect } from 'react';
import type { User } from '../types/portal';
import { PORTAL_USERS } from '../types/users';
import { usePersistentState } from './persistence';

const USERS_KEY = 'helios:portal:users:v2';

const ensureResponsibilities = (u: User): User =>
  Array.isArray(u.responsibilities)
    ? u
    : { ...u, responsibilities: u.userRole === 'yonetici' ? ['purchasing'] : [] };

export function usePortalUsers() {
  const [users, setUsers] = usePersistentState<User[]>(USERS_KEY, PORTAL_USERS);

  useEffect(() => {
    if (users.some((u) => !Array.isArray(u.responsibilities))) {
      setUsers((prev) => prev.map(ensureResponsibilities));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUser = (id: string, patch: Partial<User>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const addUser = (user: User) => setUsers((prev) => [...prev, user]);

  const deleteUser = (id: string) => setUsers((prev) => prev.filter((u) => u.id !== id));

  return { users, updateUser, addUser, deleteUser };
}
