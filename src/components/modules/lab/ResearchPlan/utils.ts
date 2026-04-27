import type { AnalysisState, Experiment } from './types';

export const generateId = (): string =>
  `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const getMonday = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

export const getWeekKey = (d: Date): string => {
  const m = getMonday(d);
  return `${m.getFullYear()}-${m.getMonth()}-${m.getDate()}`;
};

const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export const formatWeekRange = (monday: Date): string => {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()}-${sunday.getDate()} ${TR_MONTHS_SHORT[monday.getMonth()]} ${monday.getFullYear()}`;
  }
  return `${monday.getDate()} ${TR_MONTHS_SHORT[monday.getMonth()]} - ${sunday.getDate()} ${TR_MONTHS_SHORT[sunday.getMonth()]} ${monday.getFullYear()}`;
};

export const formatRelativeWeek = (monday: Date, today: Date = new Date()): string => {
  const refMonday = getMonday(today);
  const diffDays = Math.round((monday.getTime() - refMonday.getTime()) / 86400000);
  const w = Math.round(diffDays / 7);
  if (w === 0) return 'Bu hafta';
  if (w === -1) return 'Geçen hafta';
  if (w === 1) return 'Önümüzdeki hafta';
  return w < 0 ? `${-w} hafta önce` : `${w} hafta sonra`;
};

export const formatDayRange = (startISO: string, endISO: string): string => {
  if (!startISO) return '—';
  const s = new Date(startISO);
  const e = endISO ? new Date(endISO) : s;
  const monday = getMonday(s);
  const dayS = Math.round((s.getTime() - monday.getTime()) / 86400000) + 1;
  const dayE = Math.round((e.getTime() - monday.getTime()) / 86400000) + 1;
  return dayS === dayE ? `Gün ${dayS}` : `Gün ${dayS}-${dayE}`;
};

export interface WeekGroup {
  monday: Date;
  weekKey: string;
  experiments: Experiment[];
}

export const groupByWeek = (experiments: Experiment[]): WeekGroup[] => {
  const map = new Map<string, WeekGroup>();
  for (const e of experiments) {
    if (!e.startDate) continue;
    const start = new Date(e.startDate);
    const monday = getMonday(start);
    const key = getWeekKey(start);
    let group = map.get(key);
    if (!group) {
      group = { monday, weekKey: key, experiments: [] };
      map.set(key, group);
    }
    group.experiments.push(e);
  }
  // Sort each group's experiments by start date asc
  for (const g of map.values()) {
    g.experiments.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  return Array.from(map.values()).sort((a, b) => b.monday.getTime() - a.monday.getTime());
};

export const cycleAnalysis = (current: AnalysisState): AnalysisState =>
  current === '' ? 'planned' : current === 'planned' ? 'done' : '';

export const todayISO = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};
