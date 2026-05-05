import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { ModuleProps } from '../../../../types/portal';
import { useNotifications } from '../../../../lib/notifications';
import { BreadcrumbHome } from '../../../BreadcrumbHome';
import { EVENT_CATEGORIES } from './types';
import { CalendarGrid } from './components/CalendarGrid';
import { DayEvents } from './components/DayEvents';
import { AddEventForm } from './components/AddEventForm';
import { useTakvimEvents } from './hooks';

const TR_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
const TR_MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const fmt = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const Takvim: React.FC<ModuleProps> = ({ user }) => {
  const today = useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [selectedDay, setSelectedDay] = useState(todayDay);

  const { events, addEvent, deleteEvent } = useTakvimEvents(viewYear, viewMonth);
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(fmt(todayYear, todayMonth, todayDay));
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

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(1);
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(1);
  };

  const goToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    setSelectedDay(todayDay);
    setNewDate(fmt(todayYear, todayMonth, todayDay));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const saved = await addEvent({
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      categoryId: newCategory,
      authorLegacyId: user.id,
      attendeeLegacyIds: newAttendees,
    });

    if (saved && newAttendees.length > 0) {
      const monthShort = TR_MONTH_SHORT[parseInt(newDate.split('-')[1], 10) - 1];
      dispatch({
        type: 'event-created',
        source: 'takvim',
        entityId: saved.id,
        entityTitle: saved.title,
        actorId: user.id,
        targetUserIds: newAttendees,
        message: `takvime sizi ekledi: "${saved.title}" (${saved.day} ${monthShort} ${saved.time})`,
      });
    }

    setIsAddingEvent(false);
    setNewTitle('');
    setNewTime('--:--');
    setNewAttendees([]);
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <BreadcrumbHome />
        <span>/</span>
        <span className="text-text">Takvim</span>
      </div>

      <div className="bg-white border border-border/40 rounded-2xl shadow-sm overflow-hidden p-8 flex flex-col min-h-150 relative">
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrevMonth}
                className="p-1.5 hover:bg-surface-2 rounded-lg text-text-3"
                title="Önceki ay"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-[17px] font-semibold text-text tracking-tight w-32 text-center">
                {TR_MONTH_NAMES[viewMonth - 1]} {viewYear}
              </h2>
              <button
                onClick={goNextMonth}
                className="p-1.5 hover:bg-surface-2 rounded-lg text-text-3"
                title="Sonraki ay"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={goToday}
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
          year={viewYear}
          month={viewMonth}
          selectedDay={selectedDay}
          todayYear={todayYear}
          todayMonth={todayMonth}
          todayDay={todayDay}
          onDaySelect={(d) => {
            setSelectedDay(d);
            setNewDate(fmt(viewYear, viewMonth, d));
          }}
        />
      </div>

      <DayEvents day={selectedDay} events={selectedDayEvents} onDelete={handleDeleteEvent} />

      <div className="text-center pt-8 opacity-50">
        <p className="text-[11px] text-text-3 font-semibold uppercase tracking-widest">
          © Helios Bilim ve Teknoloji A.Ş.
        </p>
      </div>
    </div>
  );
};

export default Takvim;
