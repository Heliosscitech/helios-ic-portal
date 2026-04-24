import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { ModuleProps } from '../../../../types/portal';
import { usePersistentState } from '../../../../lib/persistence';
import { useNotifications } from '../../../../lib/notifications';
import { EVENT_CATEGORIES } from './types';
import type { CalendarEvent } from './types';
import { INITIAL_EVENTS } from './data';
import { CalendarGrid } from './components/CalendarGrid';
import { DayEvents } from './components/DayEvents';
import { AddEventForm } from './components/AddEventForm';

const STORAGE_KEY = 'helios:takvim:events';

export const Takvim: React.FC<ModuleProps> = ({ user }) => {
  const [events, setEvents] = usePersistentState<CalendarEvent[]>(STORAGE_KEY, INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(22);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-04-22');
  const [newTime, setNewTime] = useState('--:--');
  const [newCategory, setNewCategory] = useState(EVENT_CATEGORIES[0].id);
  const [newAttendees, setNewAttendees] = useState<string[]>([]);

  const { dispatch } = useNotifications();

  const toggleAttendee = (id: string) =>
    setNewAttendees((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectedDayEvents = useMemo(
    () => events.filter((e) => e.day === selectedDay),
    [events, selectedDay]
  );

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const category = EVENT_CATEGORIES.find((c) => c.id === newCategory) ?? EVENT_CATEGORIES[0];
    const eventDay = parseInt(newDate.split('-')[2], 10);

    const newEvent: CalendarEvent = {
      id: `EV-${Date.now().toString(36).toUpperCase()}`,
      title: newTitle.trim(),
      day: eventDay,
      time: newTime === '--:--' || !newTime ? '12:00' : newTime,
      authorId: user.id,
      color: `${category.bg} ${category.text}`,
      attendeeIds: newAttendees,
    };

    if (newAttendees.length > 0) {
      dispatch({
        type: 'event-created',
        source: 'takvim',
        entityId: newEvent.id,
        entityTitle: newEvent.title,
        actorId: user.id,
        targetUserIds: newAttendees,
        message: `takvime sizi ekledi: "${newEvent.title}" (${newEvent.day} Nis ${newEvent.time})`,
      });
    }

    setEvents((prev) => [...prev, newEvent]);
    setIsAddingEvent(false);
    setNewTitle('');
    setNewTime('--:--');
    setNewAttendees([]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <span className="hover:text-text cursor-pointer">Uygulamalar</span>
        <span>/</span>
        <span className="text-text">Takvim</span>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl shadow-sm overflow-hidden p-8 flex flex-col min-h-150 relative">
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-surface-2 rounded-lg text-text-3">
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-[17px] font-semibold text-text tracking-tight">Nisan 2026</h2>
              <button className="p-1.5 hover:bg-surface-2 rounded-lg text-text-3">
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedDay(22);
                setNewDate('2026-04-22');
              }}
              className="px-4 py-1.5 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-all"
            >
              Bugün
            </button>
          </div>
          <button
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="flex items-center gap-2 bg-[#1a1a19] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold shadow-lg hover:bg-black transition-all"
          >
            <Plus size={18} /> Etkinlik ekle
          </button>
        </div>

        {isAddingEvent && (
          <AddEventForm
            title={newTitle}
            date={newDate}
            time={newTime}
            categoryId={newCategory}
            attendeeIds={newAttendees}
            currentUserId={user.id}
            onTitleChange={setNewTitle}
            onDateChange={setNewDate}
            onTimeChange={setNewTime}
            onCategoryChange={setNewCategory}
            onAttendeeToggle={toggleAttendee}
            onCancel={() => setIsAddingEvent(false)}
            onSubmit={handleAddEvent}
          />
        )}

        <CalendarGrid
          events={events}
          selectedDay={selectedDay}
          onDaySelect={(d) => {
            setSelectedDay(d);
            setNewDate(`2026-04-${String(d).padStart(2, '0')}`);
          }}
        />
      </div>

      <DayEvents day={selectedDay} events={selectedDayEvents} onDelete={handleDeleteEvent} />

      <div className="text-center pt-8 opacity-50">
        <p className="text-[11px] text-text-3 font-semibold uppercase tracking-widest">
          Prototip görünüm • Veriler tarayıcıda kalıcı tutulur • © Helios Bilim ve Teknoloji A.Ş.
        </p>
      </div>
    </div>
  );
};

export default Takvim;
