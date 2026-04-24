import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from './persistence';
import type { Notification } from '../types/notifications';

const STORAGE_KEY = 'helios:notifications';
const MAX_ENTRIES = 100;

export type DispatchInput = Omit<Notification, 'id' | 'timestamp' | 'readBy'>;

export interface NotificationsStore {
  currentUserId: string;
  all: Notification[];
  forMe: Notification[];
  unreadCount: number;
  dispatch: (input: DispatchInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsStore | null>(null);

export const NotificationsProvider: React.FC<{
  currentUserId: string;
  children: React.ReactNode;
}> = ({ currentUserId, children }) => {
  const [all, setAll] = usePersistentState<Notification[]>(STORAGE_KEY, []);

  const dispatch = useCallback(
    (input: DispatchInput) => {
      if (input.targetUserIds.length === 0) return;
      // id/timestamp updater'ın dışında üretilir — StrictMode'da çift tetiklense bile aynı kayıt çıkar
      const entry: Notification = {
        ...input,
        id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        readBy: [input.actorId],
      };
      setAll((prev) => {
        const merged = [entry, ...prev];
        return merged.length > MAX_ENTRIES ? merged.slice(0, MAX_ENTRIES) : merged;
      });
    },
    [setAll]
  );

  const markRead = useCallback(
    (id: string) => {
      setAll((prev) =>
        prev.map((n) =>
          n.id === id && !n.readBy.includes(currentUserId)
            ? { ...n, readBy: [...n.readBy, currentUserId] }
            : n
        )
      );
    },
    [setAll, currentUserId]
  );

  const markAllRead = useCallback(() => {
    setAll((prev) =>
      prev.map((n) =>
        n.targetUserIds.includes(currentUserId) && !n.readBy.includes(currentUserId)
          ? { ...n, readBy: [...n.readBy, currentUserId] }
          : n
      )
    );
  }, [setAll, currentUserId]);

  const clearAll = useCallback(() => setAll([]), [setAll]);

  const forMe = useMemo(
    () =>
      all.filter(
        (n) => n.targetUserIds.includes(currentUserId) && n.actorId !== currentUserId
      ),
    [all, currentUserId]
  );

  const unreadCount = useMemo(
    () => forMe.filter((n) => !n.readBy.includes(currentUserId)).length,
    [forMe, currentUserId]
  );

  const value: NotificationsStore = {
    currentUserId,
    all,
    forMe,
    unreadCount,
    dispatch,
    markRead,
    markAllRead,
    clearAll,
  };

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsStore => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return ctx;
};
