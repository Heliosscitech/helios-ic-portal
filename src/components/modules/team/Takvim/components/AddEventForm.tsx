import React from 'react';
import { Clock, Calendar as CalendarIcon, Users } from 'lucide-react';
import { EVENT_CATEGORIES } from '../types';
import { PORTAL_USERS } from '../../../../../types/users';
import { cn } from '../../../../../lib/utils';

interface AddEventFormProps {
  title: string;
  date: string;
  time: string;
  categoryId: string;
  attendeeIds: string[];
  currentUserId: string;
  onTitleChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onAttendeeToggle: (id: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddEventForm: React.FC<AddEventFormProps> = ({
  title,
  date,
  time,
  categoryId,
  attendeeIds,
  currentUserId,
  onTitleChange,
  onDateChange,
  onTimeChange,
  onCategoryChange,
  onAttendeeToggle,
  onCancel,
  onSubmit,
}) => {
  const otherUsers = PORTAL_USERS.filter((u) => u.id !== currentUserId);

  return (
    <div className="mx-4 mb-8 bg-[#f1efe8]/40 border border-border/30 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          autoFocus
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Etkinlik başlığı"
          className="w-full p-4 bg-white border border-border/40 rounded-xl text-[14px] outline-none focus:border-text transition-all font-medium"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
              <CalendarIcon size={16} />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full p-4 bg-white border border-border/40 rounded-xl text-[14px] outline-none focus:border-text transition-all font-semibold text-text-3"
            />
          </div>
          <div className="relative">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
              <Clock size={16} />
            </div>
            <input
              type="time"
              value={time === '--:--' ? '' : time}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full p-4 bg-white border border-border/40 rounded-xl text-[14px] outline-none focus:border-text transition-all font-semibold text-text-3"
            />
          </div>
        </div>

        {/* Attendee picker */}
        <div className="bg-white border border-border/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-text-3" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
              Katılımcılar
            </span>
            {attendeeIds.length === 0 && (
              <span className="text-[11px] text-text-3/60 ml-1">— seçilmezse bildirim gitmez</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {otherUsers.map((u) => {
              const checked = attendeeIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none',
                    checked ? 'bg-surface-2' : 'hover:bg-surface-2/60'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onAttendeeToggle(u.id)}
                    className="hidden"
                  />
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0', u.color)}>
                    {u.initials}
                  </div>
                  <span className="text-[13px] font-medium text-text-2 truncate">{u.name}</span>
                  {checked && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-[#1a1a19] flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="w-64">
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full p-3 bg-white border border-border/40 rounded-xl text-[13px] outline-none font-semibold text-text-2 appearance-none cursor-pointer"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1rem',
              }}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-white border border-border rounded-xl text-[13px] font-semibold text-text-2 hover:bg-white/80 transition-all shadow-sm"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1a1a19] text-white border border-[#1a1a19] rounded-xl text-[13px] font-semibold hover:bg-black transition-all shadow-lg"
            >
              Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
