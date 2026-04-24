export interface CalendarEvent {
  id: string;
  title: string;
  day: number;
  time: string;
  authorId: string;
  color: string; // Tailwind class combo (bg + text)
  attendeeIds: string[];
}

export interface EventCategory {
  id: string;
  label: string;
  bg: string;
  text: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { id: 'mavi', label: 'Mavi (genel)', bg: 'bg-[#E6F1FB]', text: 'text-[#0C447C]' },
  { id: 'yesil', label: 'Yeşil (Ar-Ge)', bg: 'bg-[#E1F5EE]', text: 'text-[#0F6E56]' },
  { id: 'sari', label: 'Sarı (iş geliştirme)', bg: 'bg-[#FAEEDA]', text: 'text-[#633806]' },
  { id: 'mor', label: 'Mor (toplantı)', bg: 'bg-[#EEEDFE]', text: 'text-[#3C3489]' },
  { id: 'kirmizi', label: 'Kırmızı (deadline)', bg: 'bg-[#FCEBEB]', text: 'text-[#791F1F]' },
];

export const WEEK_DAYS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
export const MONTH_LABEL = 'Nisan 2026';
