import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Notification, NotificationSource, NotificationType } from '../types/notifications';
import type { User } from '../types/portal';
import { supabase } from './supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from './users';
import { toast } from './toast';

const FETCH_LIMIT = 100;

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

type DbNotification = {
  id: string;
  type: NotificationType;
  source: NotificationSource;
  entity_id: string | null;
  entity_title: string | null;
  actor_id: string | null;
  message: string;
  created_at: string;
  notification_targets: { user_id: string; read_at: string | null }[];
};

const SELECT_WITH_TARGETS =
  'id, type, source, entity_id, entity_title, actor_id, message, created_at, notification_targets(user_id, read_at)';

const toNotification = (row: DbNotification): Notification => {
  const targets = row.notification_targets ?? [];
  const targetUserIds = targets
    .map((t) => dbToLegacyId(t.user_id))
    .filter((v): v is string => Boolean(v));
  const readBy = targets
    .filter((t) => t.read_at !== null)
    .map((t) => dbToLegacyId(t.user_id))
    .filter((v): v is string => Boolean(v));
  const actorLegacy = row.actor_id ? dbToLegacyId(row.actor_id) : undefined;

  return {
    id: row.id,
    type: row.type,
    source: row.source,
    entityId: row.entity_id ?? '',
    entityTitle: row.entity_title ?? '',
    actorId: actorLegacy ?? row.actor_id ?? '',
    targetUserIds,
    message: row.message,
    timestamp: new Date(row.created_at).getTime(),
    readBy,
  };
};

const NotificationsContext = createContext<NotificationsStore | null>(null);

export const NotificationsProvider: React.FC<{
  currentUser: User;
  children: React.ReactNode;
}> = ({ currentUser, children }) => {
  const [all, setAll] = useState<Notification[]>([]);
  const currentUserDbId = currentUser.dbId;
  const currentUserLegacy = currentUser.id;

  // dispatch closures keep latest currentUser via ref
  const meRef = useRef(currentUser);
  meRef.current = currentUser;

  const fetchAll = useCallback(async () => {
    await ensureUsersLoaded();
    const { data, error } = await supabase
      .from('notifications')
      .select(SELECT_WITH_TARGETS)
      .order('created_at', { ascending: false })
      .limit(FETCH_LIMIT);
    if (error) {
      console.error('notifications fetch failed', error);
      return;
    }
    setAll(((data ?? []) as DbNotification[]).map(toNotification));
  }, []);

  useEffect(() => {
    if (!currentUserDbId) return;
    fetchAll();

    const channel = supabase
      .channel('notifications-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_targets' }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserDbId, fetchAll]);

  const dispatch = useCallback(
    async (input: DispatchInput) => {
      if (input.targetUserIds.length === 0) {
        console.warn('[notif] dispatch skipped: empty targetUserIds');
        return;
      }
      const me = meRef.current;
      const actorDbId = me.dbId ?? legacyToDbId(input.actorId);
      const targetDbIds = input.targetUserIds
        .map((legacy) => {
          const dbId = legacyToDbId(legacy);
          if (!dbId) console.warn('[notif] no dbId for legacy', legacy);
          return dbId;
        })
        .filter((v): v is string => Boolean(v));
      if (targetDbIds.length === 0) {
        console.warn('[notif] dispatch skipped: no resolvable targets', input.targetUserIds);
        return;
      }

      console.log('[notif] dispatching', { type: input.type, source: input.source, targets: targetDbIds });

      const { data: inserted, error: insertError } = await supabase
        .from('notifications')
        .insert({
          type: input.type,
          source: input.source,
          entity_id: input.entityId || null,
          entity_title: input.entityTitle || null,
          actor_id: actorDbId ?? null,
          message: input.message,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        console.error('[notif] insert failed', insertError);
        toast.error('Bildirim kaydedilemedi:\n' + JSON.stringify(insertError));
        return;
      }

      const targetRows = targetDbIds.map((uid) => ({
        notification_id: inserted.id,
        user_id: uid,
        read_at: actorDbId === uid ? new Date().toISOString() : null,
      }));

      const { error: targetsError } = await supabase
        .from('notification_targets')
        .insert(targetRows);

      if (targetsError) {
        console.error('[notif] targets insert failed', targetsError);
        toast.error('Bildirim hedefleri kaydedilemedi:\n' + JSON.stringify(targetsError));
      } else {
        console.log('[notif] dispatched OK', inserted.id);
      }
    },
    []
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!currentUserDbId) return;
      // optimistic
      setAll((prev) =>
        prev.map((n) =>
          n.id === id && !n.readBy.includes(currentUserLegacy)
            ? { ...n, readBy: [...n.readBy, currentUserLegacy] }
            : n
        )
      );
      const { error } = await supabase
        .from('notification_targets')
        .update({ read_at: new Date().toISOString() })
        .eq('notification_id', id)
        .eq('user_id', currentUserDbId);
      if (error) console.error('markRead failed', error);
    },
    [currentUserDbId, currentUserLegacy]
  );

  const markAllRead = useCallback(async () => {
    if (!currentUserDbId) return;
    setAll((prev) =>
      prev.map((n) =>
        n.targetUserIds.includes(currentUserLegacy) && !n.readBy.includes(currentUserLegacy)
          ? { ...n, readBy: [...n.readBy, currentUserLegacy] }
          : n
      )
    );
    const { error } = await supabase
      .from('notification_targets')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', currentUserDbId)
      .is('read_at', null);
    if (error) console.error('markAllRead failed', error);
  }, [currentUserDbId, currentUserLegacy]);

  const clearAll = useCallback(async () => {
    if (!currentUserDbId) return;
    setAll((prev) => prev.filter((n) => !n.targetUserIds.includes(currentUserLegacy)));
    const { error } = await supabase
      .from('notification_targets')
      .delete()
      .eq('user_id', currentUserDbId);
    if (error) console.error('clearAll failed', error);
  }, [currentUserDbId, currentUserLegacy]);

  const forMe = useMemo(
    () =>
      all.filter(
        (n) => n.targetUserIds.includes(currentUserLegacy) && n.actorId !== currentUserLegacy
      ),
    [all, currentUserLegacy]
  );

  const unreadCount = useMemo(
    () => forMe.filter((n) => !n.readBy.includes(currentUserLegacy)).length,
    [forMe, currentUserLegacy]
  );

  const value: NotificationsStore = {
    currentUserId: currentUserLegacy,
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
