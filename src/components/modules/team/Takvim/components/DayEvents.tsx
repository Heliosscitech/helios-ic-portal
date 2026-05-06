import React from 'react';
import { Trash2, User as UserIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { usePortalUsers } from '../../../../../lib/users';
import type { CalendarEvent } from '../types';

interface DayEventsProps {
  day: number;
  events: CalendarEvent[];
  onDelete: (id: string) => void;
}

export const DayEvents: React.FC<DayEventsProps> = ({ day, events, onDelete }) => {
  const { users } = usePortalUsers();
  const getUser = (id: string) => users.find((u) => u.id === id);
  return (
    <div className="bg-[#f1efe8]/50 border border-border/40 rounded-2xl p-6">
      <h3 className="text-[14px] font-semibold text-text-2 mb-4">{day} Nisan 2026</h3>
      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((event) => {
            const author = getUser(event.authorId);
            return (
              <div
                key={event.id}
                className="bg-white rounded-xl p-4 border border-border/40 flex items-center justify-between group animate-in slide-in-from-left duration-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      event.color.split(' ')[1]?.replace('text-', 'bg-') ?? 'bg-text-3'
                    )}
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-text mb-0.5">{event.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-text-3 font-medium">
                      <UserIcon size={12} /> {author?.name ?? 'Bilinmeyen'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
                    {event.time}
                  </span>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="p-1 px-2 text-[11px] font-semibold text-text-3 hover:text-red-border bg-surface-2 rounded opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} /> sil
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-[13px] text-text-3 italic bg-white/40 rounded-xl border border-dashed border-border">
            Bu gün için henüz bir etkinlik eklenmemiş.
          </div>
        )}
      </div>
    </div>
  );
};
