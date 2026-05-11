export const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export const TR_MONTHS_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const formatRelative = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec} sn önce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  return `${Math.floor(hr / 24)} gün önce`;
};

const parseISO = (iso: string): Date | null => {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatTR = (iso: string): string => {
  const d = parseISO(iso);
  if (!d) return '—';
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatTRCompact = (iso: string): string => {
  const d = parseISO(iso);
  if (!d) return '—';
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
};

export const daysUntil = (iso: string, now: Date = new Date()): number | null => {
  const d = parseISO(iso);
  if (!d) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((d.getTime() - today.getTime()) / msPerDay);
};

export const todayISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const formatTRLong = (iso: string): string => {
  const d = parseISO(iso);
  if (!d) return '—';
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

export const isToday = (iso: string, now: Date = new Date()): boolean => {
  return iso === (() => {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();
};

export const isPast = (iso: string, now: Date = new Date()): boolean => {
  const d = daysUntil(iso, now);
  return d !== null && d < 0;
};
