import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import { EVENT_CATEGORIES } from './types';
import type { CalendarEvent, EventCategory } from './types';

const monthRange = (year: number, month: number): { start: string; end: string } => {
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
};

type DbEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  author_id: string;
  color_key: string;
  calendar_event_attendees: { user_id: string }[];
};

const SELECT =
  'id, title, event_date, event_time, author_id, color_key, calendar_event_attendees(user_id)';

const colorClassFromKey = (key: string): string => {
  const cat: EventCategory = EVENT_CATEGORIES.find((c) => c.id === key) ?? EVENT_CATEGORIES[0];
  return `${cat.bg} ${cat.text}`;
};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toEvent = (row: DbEvent): CalendarEvent => ({
  id: row.id,
  title: row.title,
  day: parseInt(row.event_date.split('-')[2], 10),
  time: (row.event_time ?? '12:00:00').slice(0, 5),
  authorId: dbToLegacyId(row.author_id) ?? row.author_id,
  color: colorClassFromKey(row.color_key),
  attendeeIds: (row.calendar_event_attendees ?? [])
    .map((a) => dbToLegacyId(a.user_id))
    .filter((v): v is string => Boolean(v)),
});

export type EventInput = {
  title: string;
  date: string;       // 'YYYY-MM-DD'
  time: string;       // 'HH:MM'
  categoryId: string;
  authorLegacyId: string;
  attendeeLegacyIds: string[];
};

export function useTakvimEvents(year: number, month: number) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    await ensureUsersLoaded();
    const { start, end } = monthRange(year, month);
    const { data, error } = await supabase
      .from('calendar_events')
      .select(SELECT)
      .gte('event_date', start)
      .lte('event_date', end)
      .order('event_date');
    if (error) {
      console.error('calendar_events fetch failed', error);
      window.alert('Etkinlikler yüklenemedi:\n' + error.message);
      setLoading(false);
      return;
    }
    setEvents(((data ?? []) as DbEvent[]).map(toEvent));
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = useCallback(async (input: EventInput): Promise<CalendarEvent | null> => {
    await ensureUsersLoaded();
    const authorDbId = legacyToDbId(input.authorLegacyId);
    if (!authorDbId) {
      window.alert('Etkinlik kaydedilemedi: yazar kullanıcı bulunamadı.');
      return null;
    }

    const id = newId();
    const day = parseInt(input.date.split('-')[2], 10);
    const time = input.time === '--:--' || !input.time ? '12:00' : input.time;
    const optimistic: CalendarEvent = {
      id,
      title: input.title,
      day,
      time,
      authorId: input.authorLegacyId,
      color: colorClassFromKey(input.categoryId),
      attendeeIds: input.attendeeLegacyIds,
    };
    setEvents((prev) => [...prev, optimistic]);

    const { error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        id,
        title: input.title,
        event_date: input.date,
        event_time: time,
        author_id: authorDbId,
        color_key: input.categoryId,
      });

    if (insertError) {
      console.error('calendar_events insert failed', insertError);
      window.alert('Etkinlik kaydedilemedi:\n' + insertError.message);
      fetchEvents();
      return null;
    }

    if (input.attendeeLegacyIds.length > 0) {
      const rows = input.attendeeLegacyIds
        .map((legacy) => legacyToDbId(legacy))
        .filter((v): v is string => Boolean(v))
        .map((uid) => ({ event_id: id, user_id: uid }));
      if (rows.length > 0) {
        const { error: attErr } = await supabase
          .from('calendar_event_attendees')
          .insert(rows);
        if (attErr) console.error('attendees insert failed', attErr);
      }
    }

    return optimistic;
  }, [fetchEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    const { error, count } = await supabase
      .from('calendar_events')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) {
      console.error('deleteEvent failed', error);
      window.alert('Silinemedi:\n' + error.message);
      fetchEvents();
    } else if (count === 0) {
      window.alert('Bu etkinliği silme yetkiniz yok.');
      fetchEvents();
    }
  }, [fetchEvents]);

  return { events, loading, addEvent, deleteEvent, refresh: fetchEvents };
}
