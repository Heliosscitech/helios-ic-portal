import type { CalendarEvent } from './types';

export const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 'EV-1', title: 'Haftalık sync', day: 22, time: '10:00', authorId: 'u1', color: 'bg-[#E6F1FB] text-[#0C447C]', attendeeIds: [] },
  { id: 'EV-2', title: 'CALF-20 pilot deneme', day: 24, time: '14:00', authorId: 'u3', color: 'bg-[#E1F5EE] text-[#0F6E56]', attendeeIds: [] },
  { id: 'EV-3', title: 'TÜBİTAK 1501 son gün', day: 27, time: '17:00', authorId: 'u1', color: 'bg-[#FCEBEB] text-[#791F1F]', attendeeIds: [] },
  { id: 'EV-4', title: 'Aluminum firması görüşmesi', day: 29, time: '11:00', authorId: 'u1', color: 'bg-[#FAEEDA] text-[#633806]', attendeeIds: [] },
];
