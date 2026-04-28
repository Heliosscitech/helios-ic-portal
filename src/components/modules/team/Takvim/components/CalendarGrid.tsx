import React from 'react';
import { cn } from '../../../../../lib/utils';
import { WEEK_DAYS } from '../types';
import type { CalendarEvent } from '../types';

interface CalendarGridProps {
  events: CalendarEvent[];
  year: number;
  month: number; // 1-12
  selectedDay: number;
  todayYear: number;
  todayMonth: number;
  todayDay: number;
  onDaySelect: (day: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  year,
  month,
  selectedDay,
  todayYear,
  todayMonth,
  todayDay,
  onDaySelect,
}) => {
  // First day of month, weekday 0=Mon..6=Sun (Turkish convention)
  const firstJsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun..6=Sat
  const firstMonIdx = firstJsDay === 0 ? 6 : firstJsDay - 1;

  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const paddingBefore = Array.from(
    { length: firstMonIdx },
    (_, i) => prevMonthDays - firstMonIdx + 1 + i
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalCells = Math.ceil((firstMonIdx + daysInMonth) / 7) * 7;
  const paddingAfterCount = totalCells - firstMonIdx - daysInMonth;
  const paddingAfter = Array.from({ length: paddingAfterCount }, (_, i) => i + 1);

  const eventsForDay = (day: number) => events.filter((e) => e.day === day);
  const isToday = (d: number) => year === todayYear && month === todayMonth && d === todayDay;

  return (
    <>
      <div className="grid grid-cols-7 border-t border-l border-border/30 bg-surface-2/50 rounded-t-xl overflow-hidden">
        {WEEK_DAYS.map((wd) => (
          <div
            key={wd}
            className="px-4 py-2.5 text-center text-[11px] font-semibold tracking-widest text-text-3 border-r border-b border-border/30"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-border/30 flex-1">
        {paddingBefore.map((d) => (
          <div
            key={`prev-${d}`}
            className="min-h-25 p-2 border-r border-b border-border/20 bg-surface-2/20 text-text-3 opacity-30 text-[12.5px] font-semibold"
          >
            {d}
          </div>
        ))}

        {days.map((d) => (
          <div
            key={d}
            onClick={() => onDaySelect(d)}
            className={cn(
              'min-h-30 p-2 border-r border-b border-border/30 text-[12.5px] font-semibold transition-all relative cursor-pointer hover:bg-surface-2/30 select-none',
              selectedDay === d
                ? 'bg-[#E6F1FB]/30 ring-1 ring-inset ring-[#378ADD]/20'
                : 'bg-white'
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center w-6 h-6 rounded-full mb-1',
                isToday(d)
                  ? 'bg-[#1a1a19] text-white'
                  : selectedDay === d
                    ? 'text-[#378ADD]'
                    : 'text-text-2'
              )}
            >
              {d}
            </span>
            <div className="space-y-1">
              {eventsForDay(d).map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    'mt-1 px-2 py-0.5 rounded text-[10.5px] font-semibold truncate flex items-center gap-1.5',
                    event.color
                  )}
                  title={event.title}
                >
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {paddingAfter.map((d) => (
          <div
            key={`next-${d}`}
            className="min-h-30 p-2 border-r border-b border-border/20 bg-surface-2/20 text-text-3 opacity-30 text-[12.5px] font-semibold"
          >
            {d}
          </div>
        ))}
      </div>
    </>
  );
};
